
from decimal import Decimal, InvalidOperation

from django.contrib.auth.models import User
from django.db import connection
from django.db.models import Q, Sum
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .domain.catalog import ensure_categories_exist
from .domain.demo_accounts import ensure_demo_accounts
from .domain.orders import OrderDomainError, create_checkout_order, preview_checkout_totals, update_order_status
from .domain.reviews import recalculate_book_rating
from .domain.notifications import process_outbox_batch
from .models import Book, BookReview, Category, Order, PromoCode, WishlistItem
from .pagination import OrderPagination
from .permissions import IsAdminOnly, IsAdminOrReadOnly
from .serializers import (
    BookSerializer,
    BookReviewCreateSerializer,
    BookReviewModerationSerializer,
    BookReviewPublicSerializer,
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

    def get_permissions(self):
        if self.action == 'reviews':
            if self.request.method.upper() == 'POST':
                return [permissions.IsAuthenticated()]
            return [permissions.AllowAny()]
        return [IsAdminOrReadOnly()]

    def get_queryset(self):
        queryset = Book.objects.all()
        query = self.request.query_params.get('q', '').strip()
        category = self.request.query_params.get('category', '').strip()
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        min_year = self.request.query_params.get('min_year')
        max_year = self.request.query_params.get('max_year')
        min_rating = self.request.query_params.get('min_rating')
        publisher = self.request.query_params.get('publisher', '').strip()
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
        if min_year not in (None, ''):
            try:
                queryset = queryset.filter(year__gte=int(min_year))
            except (TypeError, ValueError):
                raise ValidationError({'min_year': 'Некоректне значення мінімального року видання.'})
        if max_year not in (None, ''):
            try:
                queryset = queryset.filter(year__lte=int(max_year))
            except (TypeError, ValueError):
                raise ValidationError({'max_year': 'Некоректне значення максимального року видання.'})
        if min_rating not in (None, ''):
            try:
                queryset = queryset.filter(rating__gte=float(min_rating))
            except (TypeError, ValueError):
                raise ValidationError({'min_rating': 'Некоректне значення мінімального рейтингу.'})
        if publisher:
            queryset = queryset.filter(publisher__icontains=publisher)

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

    @action(detail=True, methods=['get', 'post'], url_path='reviews')
    def reviews(self, request, pk=None):
        book = self.get_object()

        if request.method.upper() == 'GET':
            rows = (
                BookReview.objects.filter(book=book, status=BookReview.Status.APPROVED)
                .select_related('user')
                .order_by('-created_at')
            )
            return Response(BookReviewPublicSerializer(rows, many=True).data)

        create_serializer = BookReviewCreateSerializer(data=request.data)
        create_serializer.is_valid(raise_exception=True)
        payload = create_serializer.validated_data
        review, _ = BookReview.objects.update_or_create(
            book=book,
            user=request.user,
            defaults={
                'rating': payload['rating'],
                'comment': payload['comment'].strip(),
                'status': BookReview.Status.PENDING,
                'moderation_note': '',
                'moderated_by': None,
                'moderated_at': None,
            },
        )
        recalculate_book_rating(book)
        return Response(
            {
                'detail': 'Відгук надіслано на модерацію.',
                'review': BookReviewModerationSerializer(review).data,
            },
            status=status.HTTP_201_CREATED,
        )


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    pagination_class = OrderPagination

    def get_queryset(self):
        queryset = Order.objects.all()
        status_filter = self.request.query_params.get('status', '').strip()
        customer_id = self.request.query_params.get('customer_id', '').strip()
        promo_code = self.request.query_params.get('promo_code', '').strip()
        payment_method = self.request.query_params.get('payment_method', '').strip()
        delivery_method = self.request.query_params.get('delivery_method', '').strip()
        q = self.request.query_params.get('q', '').strip()

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        if promo_code:
            queryset = queryset.filter(promo_code__iexact=promo_code)
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
        if delivery_method:
            queryset = queryset.filter(delivery_method=delivery_method)
        if q:
            queryset = queryset.filter(
                Q(customer_name__icontains=q)
                | Q(book_title__icontains=q)
                | Q(customer_id__icontains=q)
            )
        return queryset

    def get_permissions(self):
        if self.action in ['checkout', 'checkout_preview', 'my_orders']:
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
            return Response(
                {'detail': exc.detail, 'code': exc.status_code, 'fields': exc.fields},
                status=exc.status_code,
            )

        process_outbox_batch(limit=25)
        return Response({'orderId': str(order.pk), 'order': OrderDetailSerializer(order).data}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='checkout-preview')
    def checkout_preview(self, request):
        serializer = CheckoutCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            totals = preview_checkout_totals(
                user=request.user,
                delivery_method=data['deliveryMethod'],
                promo_code=data.get('promoCode') or '',
                items_payload=data['items'],
            )
        except OrderDomainError as exc:
            return Response(
                {'detail': exc.detail, 'code': exc.status_code, 'fields': exc.fields},
                status=exc.status_code,
            )
        return Response(
            {
                'subtotalAmount': str(totals['subtotalAmount']),
                'shippingAmount': str(totals['shippingAmount']),
                'discountAmount': str(totals['discountAmount']),
                'totalAmount': str(totals['totalAmount']),
                'promoApplied': totals['promoApplied'],
            }
        )

    def partial_update(self, request, *args, **kwargs):
        order = self.get_object()
        status_value = request.data.get('status')
        try:
            update_order_status(order=order, new_status=status_value, actor=request.user)
        except OrderDomainError as exc:
            return Response(
                {'detail': exc.detail, 'code': exc.status_code, 'fields': exc.fields},
                status=exc.status_code,
            )
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


class AuthDemoAccountsView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def get(self, request):
        accounts = ensure_demo_accounts()
        return Response({'accounts': accounts})


class BookReviewModerationViewSet(viewsets.ModelViewSet):
    queryset = BookReview.objects.select_related('book', 'user', 'moderated_by').all()
    serializer_class = BookReviewModerationSerializer
    permission_classes = [IsAdminOnly]
    http_method_names = ['get', 'patch']

    def get_queryset(self):
        queryset = self.queryset
        status_filter = self.request.query_params.get('status', '').strip()
        book_id = self.request.query_params.get('book_id', '').strip()
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if book_id:
            queryset = queryset.filter(book__pk=book_id)
        return queryset.order_by('-created_at')

    def partial_update(self, request, *args, **kwargs):
        review = self.get_object()
        next_status = str(request.data.get('status', '')).strip()
        moderation_note = str(request.data.get('moderation_note', '')).strip()
        if next_status not in {BookReview.Status.PENDING, BookReview.Status.APPROVED, BookReview.Status.REJECTED}:
            return Response(
                {'detail': 'Некоректний статус модерації.', 'code': status.HTTP_400_BAD_REQUEST, 'fields': {'status': 'invalid'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        review.status = next_status
        review.moderation_note = moderation_note
        review.moderated_by = request.user
        review.moderated_at = timezone.now()
        review.save(update_fields=['status', 'moderation_note', 'moderated_by', 'moderated_at', 'updated_at'])
        recalculate_book_rating(review.book)
        return Response(BookReviewModerationSerializer(review).data)


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
