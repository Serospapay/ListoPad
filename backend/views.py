
from decimal import Decimal, InvalidOperation

from django.contrib.auth.models import User
from django.db import connection
from django.db.models import Q, Sum
from rest_framework.exceptions import ValidationError
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .domain.catalog import ensure_categories_exist
from .domain.orders import OrderDomainError, create_checkout_order, update_order_status
from .domain.notifications import process_outbox_batch
from .models import Book, Category, Order, PromoCode, WishlistItem
from .pagination import OrderPagination
from .permissions import IsAdminOnly, IsAdminOrReadOnly
from .serializers import (
    BookSerializer,
    CategorySerializer,
    CheckoutCreateSerializer,
    MeSerializer,
    OrderDetailSerializer,
    OrderSerializer,
    PromoCodeSerializer,
    RegisterSerializer,
    UserSerializer,
    WishlistCreateSerializer,
    WishlistItemSerializer,
)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminOnly]


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = Book.objects.all()
        query = self.request.query_params.get('q', '').strip()
        category = self.request.query_params.get('category', '').strip()
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        in_stock = self.request.query_params.get('in_stock')
        sort = self.request.query_params.get('sort', '').strip()

        if query:
            queryset = queryset.filter(Q(title__icontains=query) | Q(author__icontains=query))
        if category and category != 'Всі':
            queryset = queryset.filter(categories__name=category)
        parsed_min: Decimal | None = None
        parsed_max: Decimal | None = None
        if min_price not in (None, ''):
            try:
                parsed_min = Decimal(str(min_price))
            except (InvalidOperation, ValueError):
                raise ValidationError({'min_price': 'Некоректне значення мінімальної ціни.'})
            queryset = queryset.filter(price__gte=parsed_min)
        if max_price not in (None, ''):
            try:
                parsed_max = Decimal(str(max_price))
            except (InvalidOperation, ValueError):
                raise ValidationError({'max_price': 'Некоректне значення максимальної ціни.'})
            queryset = queryset.filter(price__lte=parsed_max)
        if parsed_min is not None and parsed_max is not None and parsed_min > parsed_max:
            raise ValidationError({'price_range': 'Мінімальна ціна не може бути більшою за максимальну.'})
        if in_stock == 'true':
            queryset = queryset.filter(inventory__gt=0)

        if sort == 'price_asc':
            queryset = queryset.order_by('price')
        elif sort == 'price_desc':
            queryset = queryset.order_by('-price')
        elif sort == 'pages_asc':
            queryset = queryset.order_by('pages')
        elif sort == 'pages_desc':
            queryset = queryset.order_by('-pages')
        else:
            queryset = queryset.order_by('-id')
        return queryset.distinct()

    def create(self, request, *args, **kwargs):
        category_names = request.data.get('categories', [])
        if isinstance(category_names, list):
            ensure_categories_exist(category_names)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        category_names = request.data.get('categories', [])
        if isinstance(category_names, list):
            ensure_categories_exist(category_names)
        return super().update(request, *args, **kwargs)


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    pagination_class = OrderPagination

    def get_queryset(self):
        return Order.objects.all()

    def get_permissions(self):
        if self.action in ['checkout', 'my_orders']:
            return [permissions.IsAuthenticated()]
        if self.action in ['list', 'retrieve', 'update', 'partial_update', 'destroy', 'create']:
            return [IsAdminOnly()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve', 'my_orders', 'partial_update']:
            return OrderDetailSerializer
        return OrderSerializer

    @action(detail=False, methods=['get'], url_path='my')
    def my_orders(self, request):
        queryset = self.queryset.filter(user=request.user)
        serializer = OrderDetailSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='checkout')
    def checkout(self, request):
        serializer = CheckoutCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        idempotency_key = request.headers.get('Idempotency-Key') or data.get('idempotencyKey') or ''
        try:
            order = create_checkout_order(
                user=request.user,
                customer_name=data.get('customerName') or '',
                payment_method=data['paymentMethod'],
                delivery_method=data['deliveryMethod'],
                promo_code=data.get('promoCode') or '',
                items_payload=data['items'],
                idempotency_key=idempotency_key,
            )
        except OrderDomainError as exc:
            payload = {'detail': exc.detail}
            payload.update(exc.fields)
            return Response(payload, status=exc.status_code)

        process_outbox_batch(limit=25)
        return Response({'orderId': str(order.pk), 'order': OrderDetailSerializer(order).data}, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        order = self.get_object()
        status_value = request.data.get('status')
        try:
            update_order_status(order=order, new_status=status_value, actor=request.user)
        except OrderDomainError as exc:
            return Response({'detail': exc.detail}, status=exc.status_code)
        serializer = OrderDetailSerializer(order)
        return Response(serializer.data)


class WishlistViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        queryset = WishlistItem.objects.filter(user=request.user)
        serializer = WishlistItemSerializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request):
        serializer = WishlistCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        book_id = serializer.validated_data['bookId']
        book = Book.objects.filter(pk=book_id).first()
        if not book:
            return Response({'detail': 'Книгу не знайдено.'}, status=status.HTTP_404_NOT_FOUND)
        item, _ = WishlistItem.objects.get_or_create(user=request.user, book=book)
        return Response(WishlistItemSerializer(item).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None):
        deleted, _ = WishlistItem.objects.filter(user=request.user, book__pk=str(pk)).delete()
        if deleted == 0:
            return Response({'detail': 'Елемент не знайдено.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PromoCodeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PromoCode.objects.filter(is_active=True)
    serializer_class = PromoCodeSerializer
    permission_classes = [permissions.IsAuthenticated]


class AuthLoginView(TokenObtainPairView):
    serializer_class = TokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'


class AuthRefreshView(TokenRefreshView):
    pass


class AuthRegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token_serializer = TokenObtainPairSerializer(data={
            'username': user.username,
            'password': request.data.get('password')
        })
        token_serializer.is_valid(raise_exception=True)
        payload = token_serializer.validated_data
        payload['user'] = MeSerializer(user).data
        return Response(payload, status=status.HTTP_201_CREATED)


class AuthMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user).data)


class NotificationOutboxDispatchView(APIView):
    permission_classes = [IsAdminOnly]

    def post(self, request):
        processed = process_outbox_batch(limit=25)
        return Response({'processed': processed})


class HealthView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        try:
            connection.ensure_connection()
        except Exception:
            return Response({'status': 'degraded', 'database': 'unavailable'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({'status': 'ok', 'database': 'ok'})


class AnalyticsCRMView(APIView):
    permission_classes = [IsAdminOnly]

    def get(self, request):
        revenue = Order.objects.aggregate(total=Sum('total_amount'))['total'] or 0
        return Response({
            'ordersCount': Order.objects.count(),
            'totalRevenue': str(revenue),
            'usersCount': User.objects.filter(is_active=True).count(),
            'openOrders': Order.objects.exclude(
                status__in=[Order.Status.CLOSED, Order.Status.CANCELLED]
            ).count(),
        })
