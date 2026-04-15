
from django.conf import settings
from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name

class Book(models.Model):
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    inventory = models.IntegerField(default=0)
    description = models.TextField(blank=True, null=True)
    cover_image = models.TextField() # Base64 або URL
    pages = models.IntegerField(default=0)
    year = models.IntegerField(default=2024)
    publisher = models.CharField(max_length=100, default='ЛистоПад')
    cover = models.CharField(max_length=100, default='Тверда')
    format = models.CharField(max_length=100, default='145x215 мм')
    weight = models.CharField(max_length=100, default='550 г')
    rating = models.FloatField(default=0.0)
    categories = models.ManyToManyField(Category, blank=True)
    
    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-id']
        indexes = [
            models.Index(fields=['inventory']),
        ]

class Order(models.Model):
    class Status(models.TextChoices):
        ORDERED = 'ordered', 'Оформлено'
        SHIPPING = 'shipping', 'Відправлено'
        AT_BRANCH = 'at_branch', 'У відділенні'
        RECEIVED = 'received', 'Отримано'

    class PaymentMethod(models.TextChoices):
        CARD = 'card', 'Банківська карта'
        APPLE_PAY = 'apple_pay', 'Apple Pay'
        GOOGLE_PAY = 'google_pay', 'Google Pay'
        CASH_ON_DELIVERY = 'cash_on_delivery', 'При отриманні'

    class DeliveryMethod(models.TextChoices):
        NOVA_POSHTA = 'nova_poshta', 'Нова Пошта'
        STANDARD = 'standard', 'Самовивіз'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='orders',
        null=True,
        blank=True
    )
    customer_id = models.CharField(max_length=100)
    customer_name = models.CharField(max_length=255)
    book_title = models.CharField(max_length=255, blank=True, default='')
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    promo_code = models.CharField(max_length=50, blank=True, default='')
    date = models.DateTimeField(auto_now_add=True)
    ordered_at = models.DateTimeField(auto_now_add=True)
    shipped_at = models.DateTimeField(blank=True, null=True)
    at_branch_at = models.DateTimeField(blank=True, null=True)
    received_at = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.ORDERED)
    payment_method = models.CharField(
        max_length=50,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CARD
    )
    delivery_method = models.CharField(
        max_length=50,
        choices=DeliveryMethod.choices,
        default=DeliveryMethod.NOVA_POSHTA
    )
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        ordering = ['-date']
        indexes = [
            models.Index(fields=['customer_id']),
            models.Index(fields=['status']),
        ]


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    book = models.ForeignKey(Book, on_delete=models.PROTECT, related_name='order_items')
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    line_total = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        indexes = [
            models.Index(fields=['book']),
        ]


class WishlistItem(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wishlist_items')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='wishlist_entries')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'book'], name='unique_user_book_wishlist'),
        ]
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['book']),
        ]


class PromoCode(models.Model):
    class DiscountType(models.TextChoices):
        PERCENT = 'percent', 'Відсоток'
        FIXED = 'fixed', 'Фіксована сума'

    code = models.CharField(max_length=50, unique=True)
    discount_type = models.CharField(max_length=20, choices=DiscountType.choices, default=DiscountType.PERCENT)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    max_uses = models.PositiveIntegerField(default=0)
    used_count = models.PositiveIntegerField(default=0)

    class Meta:
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active']),
        ]
