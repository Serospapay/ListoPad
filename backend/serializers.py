
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Book, Category, Order, OrderItem

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
    paymentMethod = serializers.CharField(source='payment_method')
    deliveryMethod = serializers.CharField(source='delivery_method')
    trackingNumber = serializers.CharField(source='tracking_number', allow_blank=True, allow_null=True, required=False)
    totalAmount = serializers.DecimalField(source='total_amount', max_digits=10, decimal_places=2)
    status = serializers.ChoiceField(choices=Order.Status.choices)

    class Meta:
        model = Order
        fields = [
            'id', 'customerId', 'customerName', 'bookTitle', 'amount', 'totalAmount',
            'date', 'status', 'paymentMethod', 'deliveryMethod', 'trackingNumber'
        ]


class MeSerializer(serializers.ModelSerializer):
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


class RegisterSerializer(serializers.ModelSerializer):
    name = serializers.CharField(write_only=True, max_length=255)
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['email', 'name', 'password']

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Користувач з такою поштою вже існує.')
        return value

    def create(self, validated_data):
        name = validated_data.pop('name')
        first_name, _, last_name = name.partition(' ')
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=first_name,
            last_name=last_name
        )
        return user


class CheckoutItemSerializer(serializers.Serializer):
    bookId = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1)


class CheckoutCreateSerializer(serializers.Serializer):
    customerName = serializers.CharField(max_length=255, required=False, allow_blank=True)
    paymentMethod = serializers.ChoiceField(choices=Order.PaymentMethod.choices)
    deliveryMethod = serializers.ChoiceField(choices=Order.DeliveryMethod.choices)
    items = CheckoutItemSerializer(many=True, min_length=1)


class OrderItemSerializer(serializers.ModelSerializer):
    bookId = serializers.IntegerField(source='book.id', read_only=True)
    bookTitle = serializers.CharField(source='book.title', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'bookId', 'bookTitle', 'quantity', 'unit_price', 'line_total']


class OrderDetailSerializer(OrderSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta(OrderSerializer.Meta):
        fields = OrderSerializer.Meta.fields + ['items']
