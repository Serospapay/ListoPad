
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Book, Category, Order, OrderItem, WishlistItem, PromoCode

class UserSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
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
    id = serializers.CharField(read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name']

class BookSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    coverImage = serializers.CharField(source='cover_image')
    categories = serializers.SlugRelatedField(
        many=True, 
        slug_field='name', 
        queryset=Category.objects.all()
    )
    
    class Meta:
        model = Book
        fields = [
            'id', 'title', 'author', 'price', 'inventory', 'low_stock_threshold',
            'description', 'coverImage', 'categories', 'pages',
            'year', 'publisher', 'cover', 'format', 'weight', 'rating'
        ]

class OrderSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    customerId = serializers.CharField(source='customer_id')
    customerName = serializers.CharField(source='customer_name')
    bookTitle = serializers.CharField(source='book_title')
    paymentMethod = serializers.CharField(source='payment_method')
    deliveryMethod = serializers.CharField(source='delivery_method')
    trackingNumber = serializers.CharField(source='tracking_number', allow_blank=True, allow_null=True, required=False)
    subtotalAmount = serializers.DecimalField(source='subtotal_amount', max_digits=10, decimal_places=2, required=False)
    shippingAmount = serializers.DecimalField(source='shipping_amount', max_digits=10, decimal_places=2, required=False)
    totalAmount = serializers.DecimalField(source='total_amount', max_digits=10, decimal_places=2)
    discountAmount = serializers.DecimalField(source='discount_amount', max_digits=10, decimal_places=2)
    promoCode = serializers.CharField(source='promo_code', allow_blank=True, required=False)
    orderedAt = serializers.DateTimeField(source='ordered_at', required=False)
    shippedAt = serializers.DateTimeField(source='shipped_at', required=False, allow_null=True)
    atBranchAt = serializers.DateTimeField(source='at_branch_at', required=False, allow_null=True)
    receivedAt = serializers.DateTimeField(source='received_at', required=False, allow_null=True)
    deliveredAt = serializers.DateTimeField(source='delivered_at', required=False, allow_null=True)
    closedAt = serializers.DateTimeField(source='closed_at', required=False, allow_null=True)
    cancelledAt = serializers.DateTimeField(source='cancelled_at', required=False, allow_null=True)
    status = serializers.ChoiceField(choices=Order.Status.choices)

    class Meta:
        model = Order
        fields = [
            'id', 'customerId', 'customerName', 'bookTitle', 'amount', 'subtotalAmount', 'shippingAmount', 'totalAmount',
            'discountAmount', 'promoCode', 'date', 'orderedAt', 'shippedAt', 'atBranchAt', 'receivedAt',
            'deliveredAt', 'closedAt', 'cancelledAt',
            'status', 'paymentMethod', 'deliveryMethod', 'trackingNumber'
        ]


class MeSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
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
    bookId = serializers.CharField()
    quantity = serializers.IntegerField(min_value=1)


class CheckoutCreateSerializer(serializers.Serializer):
    customerName = serializers.CharField(max_length=255, required=False, allow_blank=True)
    paymentMethod = serializers.ChoiceField(choices=Order.PaymentMethod.choices)
    deliveryMethod = serializers.ChoiceField(choices=Order.DeliveryMethod.choices)
    promoCode = serializers.CharField(max_length=50, required=False, allow_blank=True)
    idempotencyKey = serializers.CharField(max_length=100, required=False, allow_blank=True)
    items = CheckoutItemSerializer(many=True, min_length=1)


class OrderItemSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    bookId = serializers.CharField(source='book.id', read_only=True)
    bookTitle = serializers.CharField(source='book.title', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'bookId', 'bookTitle', 'quantity', 'unit_price', 'line_total']


class OrderDetailSerializer(OrderSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta(OrderSerializer.Meta):
        fields = OrderSerializer.Meta.fields + ['items']


class WishlistItemSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    bookId = serializers.CharField(source='book.id', read_only=True)

    class Meta:
        model = WishlistItem
        fields = ['id', 'bookId']


class WishlistCreateSerializer(serializers.Serializer):
    bookId = serializers.CharField()


class PromoCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromoCode
        fields = ['code', 'discount_type', 'value', 'is_active', 'expires_at', 'max_uses', 'used_count']
