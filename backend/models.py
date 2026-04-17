
from django.conf import settings
from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator


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
    cover_image = models.TextField()
    pages = models.IntegerField(default=0)
    year = models.IntegerField(default=2024)
    publisher = models.CharField(max_length=100, default='ЛистоПад')
    cover = models.CharField(max_length=100, default='Тверда')
    format = models.CharField(max_length=100, default='145x215 мм')
    weight = models.CharField(max_length=100, default='550 г')
    rating = models.FloatField(default=0.0)
    review_count = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=3)
    categories = models.ManyToManyField(Category, blank=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-id']
        indexes = [
            models.Index(fields=['inventory']),
            models.Index(fields=['title']),
            models.Index(fields=['author']),
            models.Index(fields=['rating']),
        ]


class Order(models.Model):
    class Status(models.TextChoices):
        ORDERED = 'ordered', 'Створено'
        PAID = 'paid', 'Оплачено'
        PACKED = 'packed', 'Упаковано'
        SHIPPED = 'shipped', 'Відправлено'
        DELIVERED = 'delivered', 'Доставлено'
        CLOSED = 'closed', 'Закрито'
        CANCELLED = 'cancelled', 'Скасовано'

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
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # backward-compatible alias for total_amount
    subtotal_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    promo_code = models.CharField(max_length=50, blank=True, default='')
    idempotency_key = models.CharField(max_length=100, blank=True, null=True, unique=True)
    date = models.DateTimeField(auto_now_add=True)
    ordered_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(blank=True, null=True)
    packed_at = models.DateTimeField(blank=True, null=True)
    shipped_at = models.DateTimeField(blank=True, null=True)
    at_branch_at = models.DateTimeField(blank=True, null=True)
    received_at = models.DateTimeField(blank=True, null=True)
    delivered_at = models.DateTimeField(blank=True, null=True)
    closed_at = models.DateTimeField(blank=True, null=True)
    cancelled_at = models.DateTimeField(blank=True, null=True)
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
            models.Index(fields=['ordered_at']),
            models.Index(fields=['promo_code']),
        ]


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    book = models.ForeignKey(Book, on_delete=models.PROTECT, related_name='order_items', db_index=False)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    line_total = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        indexes = [
            models.Index(fields=['book']),
        ]


class WishlistItem(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='wishlist_items',
        db_index=False,
    )
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='wishlist_entries', db_index=False)
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
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    per_user_limit = models.PositiveIntegerField(default=1)

    class Meta:
        indexes = [
            models.Index(fields=['is_active']),
            models.Index(fields=['expires_at']),
        ]


class InventoryMovement(models.Model):
    class MovementType(models.TextChoices):
        RESERVE = 'reserve', 'Резерв'
        DEBIT = 'debit', 'Списання'
        RESTOCK = 'restock', 'Поповнення'
        RELEASE = 'release', 'Розрезерв'
        ADJUST = 'adjust', 'Коригування'

    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='inventory_movements')
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, related_name='inventory_movements', blank=True, null=True)
    movement_type = models.CharField(max_length=20, choices=MovementType.choices)
    quantity = models.IntegerField()
    note = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['book', 'created_at']),
            models.Index(fields=['movement_type', 'created_at']),
        ]


class OrderStatusHistory(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    from_status = models.CharField(max_length=50, blank=True, default='')
    to_status = models.CharField(max_length=50, choices=Order.Status.choices)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-changed_at']
        indexes = [
            models.Index(fields=['order', 'changed_at']),
        ]


class DomainEvent(models.Model):
    event_type = models.CharField(max_length=100)
    aggregate_type = models.CharField(max_length=100)
    aggregate_id = models.CharField(max_length=100)
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['event_type', 'created_at']),
            models.Index(fields=['aggregate_type', 'aggregate_id']),
        ]


class NotificationOutbox(models.Model):
    class NotificationType(models.TextChoices):
        ORDER_CREATED = 'order_created', 'Створення замовлення'
        ORDER_STATUS_CHANGED = 'order_status_changed', 'Оновлення статусу замовлення'

    class DeliveryStatus(models.TextChoices):
        PENDING = 'pending', 'В черзі'
        SENT = 'sent', 'Відправлено'
        FAILED = 'failed', 'Помилка'

    notification_type = models.CharField(max_length=40, choices=NotificationType.choices)
    recipient = models.EmailField()
    subject = models.CharField(max_length=255)
    body = models.TextField()
    status = models.CharField(max_length=20, choices=DeliveryStatus.choices, default=DeliveryStatus.PENDING)
    error_message = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['notification_type', 'created_at']),
        ]


class PromoCodeRedemption(models.Model):
    promo_code = models.ForeignKey(PromoCode, on_delete=models.CASCADE, related_name='redemptions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='promo_redemptions')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='promo_redemptions')
    used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['promo_code', 'user']),
        ]


class BookReview(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Очікує модерації'
        APPROVED = 'approved', 'Підтверджено'
        REJECTED = 'rejected', 'Відхилено'

    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='book_reviews')
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(max_length=2000)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    moderation_note = models.CharField(max_length=255, blank=True, default='')
    moderated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='moderated_book_reviews',
    )
    moderated_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(fields=['book', 'user'], name='unique_book_user_review'),
        ]
        indexes = [
            models.Index(fields=['book', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]
