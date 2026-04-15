
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import F, Q
from django.utils import timezone
from rest_framework.response import Response
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import Book, Category, Order, OrderItem, PromoCode, WishlistItem
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


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class IsAdminOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = Book.objects.prefetch_related('categories').all()
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
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
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
            for name in category_names:
                Category.objects.get_or_create(name=name)
            
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        category_names = request.data.get('categories', [])
        if isinstance(category_names, list):
            for name in category_names:
                Category.objects.get_or_create(name=name)
        return super().update(request, *args, **kwargs)

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.select_related('user').prefetch_related('items__book')

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

        items_payload = data['items']
        book_ids = [item['bookId'] for item in items_payload]
        promo_code = (data.get('promoCode') or '').strip().upper()
        promo_obj = None
        discount_amount = Decimal('0.00')
        with transaction.atomic():
            books = Book.objects.select_for_update().filter(id__in=book_ids)
            books_map = {book.id: book for book in books}

            missing_books = [book_id for book_id in book_ids if book_id not in books_map]
            if missing_books:
                return Response(
                    {'detail': 'Частину книг не знайдено.', 'missingBookIds': missing_books},
                    status=status.HTTP_400_BAD_REQUEST
                )

            insufficient_items = []
            total_amount = Decimal('0.00')
            primary_title = ''

            for item in items_payload:
                book = books_map[item['bookId']]
                quantity = item['quantity']
                if quantity > book.inventory:
                    insufficient_items.append({
                        'bookId': book.id,
                        'title': book.title,
                        'requested': quantity,
                        'available': book.inventory
                    })
                line_total = Decimal(book.price) * quantity
                total_amount += line_total
                if not primary_title:
                    primary_title = book.title

            if promo_code:
                promo_obj = PromoCode.objects.select_for_update().filter(code=promo_code, is_active=True).first()
                if not promo_obj:
                    return Response({'detail': 'Промокод неактивний або не існує.'}, status=status.HTTP_400_BAD_REQUEST)
                if promo_obj.expires_at and promo_obj.expires_at < timezone.now():
                    return Response({'detail': 'Термін дії промокоду завершився.'}, status=status.HTTP_400_BAD_REQUEST)
                if promo_obj.max_uses > 0 and promo_obj.used_count >= promo_obj.max_uses:
                    return Response({'detail': 'Ліміт використань промокоду вичерпано.'}, status=status.HTTP_400_BAD_REQUEST)
                if promo_obj.discount_type == PromoCode.DiscountType.PERCENT:
                    discount_amount = (total_amount * promo_obj.value) / Decimal('100')
                else:
                    discount_amount = min(promo_obj.value, total_amount)
                total_amount = max(Decimal('0.00'), total_amount - discount_amount)

            if insufficient_items:
                return Response(
                    {'detail': 'Недостатньо книг на складі.', 'items': insufficient_items},
                    status=status.HTTP_409_CONFLICT
                )

            order = Order.objects.create(
                user=request.user,
                customer_id=str(request.user.id),
                customer_name=data.get('customerName') or request.user.get_full_name() or request.user.username,
                book_title=primary_title,
                amount=total_amount,
                total_amount=total_amount,
                discount_amount=discount_amount,
                promo_code=promo_code,
                payment_method=data['paymentMethod'],
                delivery_method=data['deliveryMethod'],
            )

            order_items = []
            for item in items_payload:
                book = books_map[item['bookId']]
                quantity = item['quantity']
                line_total = Decimal(book.price) * quantity
                order_items.append(
                    OrderItem(
                        order=order,
                        book=book,
                        quantity=quantity,
                        unit_price=book.price,
                        line_total=line_total
                    )
                )
                updated = Book.objects.filter(id=book.id, inventory__gte=quantity).update(inventory=F('inventory') - quantity)
                if updated == 0:
                    return Response(
                        {'detail': 'Склад змінився під час оформлення.'},
                        status=status.HTTP_409_CONFLICT
                    )
            OrderItem.objects.bulk_create(order_items)
            if promo_obj:
                promo_obj.used_count = F('used_count') + 1
                promo_obj.save(update_fields=['used_count'])

        if order.user and order.user.email:
            send_mail(
                subject='ЛистоПад: замовлення створено',
                message=f'Ваше замовлення #{order.id} успішно оформлено. Сума: {order.total_amount} грн.',
                from_email=None,
                recipient_list=[order.user.email],
                fail_silently=True,
            )

        return Response(
            {'orderId': order.id, 'order': OrderDetailSerializer(order).data},
            status=status.HTTP_201_CREATED
        )

    def partial_update(self, request, *args, **kwargs):
        order = self.get_object()
        status_value = request.data.get('status')
        if status_value not in dict(Order.Status.choices):
            return Response({'detail': 'Невалідний статус.'}, status=status.HTTP_400_BAD_REQUEST)
        order.status = status_value
        now = timezone.now()
        updated_fields = ['status']
        if status_value == Order.Status.SHIPPING:
            order.shipped_at = now
            updated_fields.append('shipped_at')
        elif status_value == Order.Status.AT_BRANCH:
            order.at_branch_at = now
            updated_fields.append('at_branch_at')
        elif status_value == Order.Status.RECEIVED:
            order.received_at = now
            updated_fields.append('received_at')
        order.save(update_fields=updated_fields)
        if order.user and order.user.email:
            send_mail(
                subject='ЛистоПад: оновлено статус замовлення',
                message=f'Статус вашого замовлення #{order.id}: {order.get_status_display()}',
                from_email=None,
                recipient_list=[order.user.email],
                fail_silently=True,
            )
        serializer = OrderDetailSerializer(order)
        return Response(serializer.data)


class WishlistViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        queryset = WishlistItem.objects.filter(user=request.user).select_related('book')
        serializer = WishlistItemSerializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request):
        serializer = WishlistCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        book_id = serializer.validated_data['bookId']
        book = Book.objects.filter(id=book_id).first()
        if not book:
            return Response({'detail': 'Книгу не знайдено.'}, status=status.HTTP_404_NOT_FOUND)
        item, _ = WishlistItem.objects.get_or_create(user=request.user, book=book)
        return Response(WishlistItemSerializer(item).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None):
        deleted, _ = WishlistItem.objects.filter(user=request.user, book_id=pk).delete()
        if deleted == 0:
            return Response({'detail': 'Елемент не знайдено.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PromoCodeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PromoCode.objects.filter(is_active=True)
    serializer_class = PromoCodeSerializer
    permission_classes = [permissions.IsAuthenticated]


class AuthLoginView(TokenObtainPairView):
    serializer_class = TokenObtainPairSerializer


class AuthRefreshView(TokenRefreshView):
    pass


class AuthRegisterView(APIView):
    permission_classes = [permissions.AllowAny]

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
