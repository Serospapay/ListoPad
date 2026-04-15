
from decimal import Decimal

from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import F
from rest_framework.response import Response
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import Book, Category, Order, OrderItem
from .serializers import (
    BookSerializer,
    CategorySerializer,
    CheckoutCreateSerializer,
    MeSerializer,
    OrderDetailSerializer,
    OrderSerializer,
    RegisterSerializer,
    UserSerializer,
)

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer

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

    def get_permissions(self):
        if self.action in ['checkout', 'my_orders', 'partial_update']:
            return [permissions.IsAuthenticated()]
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
        order.save(update_fields=['status'])
        serializer = OrderDetailSerializer(order)
        return Response(serializer.data)


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
