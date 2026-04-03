
from rest_framework import viewsets, status
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Book, Category, Order
from .serializers import BookSerializer, CategorySerializer, OrderSerializer, UserSerializer

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
