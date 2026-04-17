
from rest_framework import serializers
from django.contrib.auth.models import User
from urllib.parse import quote
from .models import Book, BookReview, Category, Order, OrderItem, WishlistItem, PromoCode, OrderStatusHistory


DEFAULT_COVER_SVG = """
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1f2937"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
  </defs>
  <rect width="600" height="900" fill="url(#bg)"/>
  <rect x="48" y="48" width="504" height="804" fill="none" stroke="#374151" stroke-width="2"/>
  <text x="300" y="430" text-anchor="middle" fill="#e5e7eb" font-family="Arial, sans-serif" font-size="42" font-weight="700">
    NO COVER
  </text>
  <text x="300" y="485" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="24">
    Image unavailable
  </text>
</svg>
""".strip()
DEFAULT_COVER_IMAGE = f"data:image/svg+xml;charset=UTF-8,{quote(DEFAULT_COVER_SVG)}"

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
    coverImage = serializers.SerializerMethodField()
    reviewsCount = serializers.IntegerField(source='review_count', read_only=True)
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
            'year', 'publisher', 'cover', 'format', 'weight', 'rating', 'reviewsCount'
        ]

    def get_coverImage(self, obj):
        cover_url = (obj.cover_image or '').strip()
        if cover_url.startswith(('http://', 'https://', 'data:image/')):
            return cover_url
        return DEFAULT_COVER_IMAGE

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
    paidAt = serializers.DateTimeField(source='paid_at', required=False, allow_null=True)
    packedAt = serializers.DateTimeField(source='packed_at', required=False, allow_null=True)
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
            'discountAmount', 'promoCode', 'date', 'orderedAt', 'paidAt', 'packedAt', 'shippedAt', 'atBranchAt', 'receivedAt',
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
    statusHistory = serializers.SerializerMethodField()

    class Meta(OrderSerializer.Meta):
        fields = OrderSerializer.Meta.fields + ['items', 'statusHistory']

    def get_statusHistory(self, obj):
        rows = (
            OrderStatusHistory.objects.filter(order=obj)
            .select_related('changed_by')
            .order_by('-changed_at')
        )
        return [
            {
                'fromStatus': row.from_status,
                'toStatus': row.to_status,
                'changedAt': row.changed_at,
                'changedBy': row.changed_by.get_full_name() if row.changed_by else '',
            }
            for row in rows
        ]


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
        fields = [
            'code',
            'discount_type',
            'value',
            'is_active',
            'expires_at',
            'max_uses',
            'used_count',
            'min_order_amount',
            'per_user_limit',
        ]


class BookReviewPublicSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    userName = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source='created_at')

    class Meta:
        model = BookReview
        fields = ['id', 'rating', 'comment', 'userName', 'createdAt']

    def get_userName(self, obj):
        full_name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return full_name or obj.user.username


class BookReviewCreateSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(max_length=2000)


class BookReviewModerationSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    userName = serializers.SerializerMethodField()
    userEmail = serializers.EmailField(source='user.email', read_only=True)
    bookId = serializers.CharField(source='book.id', read_only=True)
    bookTitle = serializers.CharField(source='book.title', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    moderatedAt = serializers.DateTimeField(source='moderated_at', read_only=True)
    moderatedBy = serializers.SerializerMethodField()

    class Meta:
        model = BookReview
        fields = [
            'id',
            'bookId',
            'bookTitle',
            'userName',
            'userEmail',
            'rating',
            'comment',
            'status',
            'moderation_note',
            'createdAt',
            'updatedAt',
            'moderatedAt',
            'moderatedBy',
        ]

    def get_userName(self, obj):
        full_name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return full_name or obj.user.username

    def get_moderatedBy(self, obj):
        if not obj.moderated_by:
            return ''
        full_name = f"{obj.moderated_by.first_name} {obj.moderated_by.last_name}".strip()
        return full_name or obj.moderated_by.username
