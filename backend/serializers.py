
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Book, Category, Order

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    joinDate = serializers.DateTimeField(source='date_joined', format="%d.%m.%Y")
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'role', 'joinDate']

    def get_role(self, obj):
        return 'admin' if obj.is_superuser else 'user'

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class BookSerializer(serializers.ModelSerializer):
    coverImage = serializers.CharField(source='cover_image')
    categories = serializers.SlugRelatedField(
        many=True, 
        slug_field='name', 
        queryset=Category.objects.all()
    )
    
    class Meta:
        model = Book
        fields = [
            'id', 'title', 'author', 'price', 'inventory', 
            'description', 'coverImage', 'categories', 'pages', 
            'year', 'publisher', 'cover', 'format', 'weight', 'rating'
        ]

class OrderSerializer(serializers.ModelSerializer):
    customerId = serializers.CharField(source='customer_id')
    customerName = serializers.CharField(source='customer_name')
    bookTitle = serializers.CharField(source='book_title')

    class Meta:
        model = Order
        fields = ['id', 'customerId', 'customerName', 'bookTitle', 'amount', 'date', 'status']
