from decimal import Decimal
from typing import Dict, Iterable, Optional, Tuple

from django.db import IntegrityError, transaction
from django.db.models import F
from django.utils import timezone

from backend.domain.events import emit_domain_event
from backend.domain.notifications import enqueue_notification
from backend.models import Book, InventoryMovement, Order, OrderItem, OrderStatusHistory, PromoCode


class OrderDomainError(Exception):
    def __init__(self, detail: str, status_code: int = 400, fields: Optional[dict] = None):
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code
        self.fields = fields or {}


ALLOWED_STATUS_TRANSITIONS = {
    Order.Status.ORDERED: {Order.Status.PAID, Order.Status.CANCELLED},
    Order.Status.PAID: {Order.Status.PACKED, Order.Status.CANCELLED},
    Order.Status.PACKED: {Order.Status.SHIPPED, Order.Status.CANCELLED},
    Order.Status.SHIPPED: {Order.Status.DELIVERED},
    Order.Status.DELIVERED: {Order.Status.CLOSED},
    Order.Status.CLOSED: set(),
    Order.Status.CANCELLED: set(),
}

LEGACY_STATUS_ALIASES = {
    'shipping': Order.Status.SHIPPED,
    'at_branch': Order.Status.DELIVERED,
    'received': Order.Status.CLOSED,
}


def _normalize_items_payload(items_payload: Iterable[dict]) -> list[dict]:
    grouped: dict[str, int] = {}
    for item in items_payload:
        book_id = str(item['bookId']).strip()
        quantity = int(item['quantity'])
        if not book_id:
            raise OrderDomainError('Некоректний ідентифікатор книги.', status_code=400)
        if quantity <= 0:
            raise OrderDomainError('Кількість повинна бути більшою за нуль.', status_code=400)
        grouped[book_id] = grouped.get(book_id, 0) + quantity
    return [{'bookId': book_id, 'quantity': quantity} for book_id, quantity in grouped.items()]


def _resolve_books(items_payload: Iterable[dict]) -> Dict[str, Book]:
    book_ids = [str(item['bookId']) for item in items_payload]
    books = Book.objects.select_for_update().filter(pk__in=book_ids)
    books_map = {str(book.pk): book for book in books}
    missing = [book_id for book_id in book_ids if book_id not in books_map]
    if missing:
        raise OrderDomainError('Частину книг не знайдено.', status_code=400, fields={'missingBookIds': missing})
    return books_map


def _resolve_discount(promo_code: str, subtotal_amount: Decimal) -> Tuple[Optional[PromoCode], Decimal]:
    if not promo_code:
        return None, Decimal('0.00')
    promo = PromoCode.objects.select_for_update().filter(code=promo_code, is_active=True).first()
    if not promo:
        raise OrderDomainError('Промокод неактивний або не існує.', status_code=400)
    if promo.expires_at and promo.expires_at < timezone.now():
        raise OrderDomainError('Термін дії промокоду завершився.', status_code=400)
    if promo.max_uses > 0 and promo.used_count >= promo.max_uses:
        raise OrderDomainError('Ліміт використань промокоду вичерпано.', status_code=400)
    if promo.discount_type == PromoCode.DiscountType.PERCENT:
        discount_amount = (subtotal_amount * promo.value) / Decimal('100')
    else:
        discount_amount = min(promo.value, subtotal_amount)
    return promo, discount_amount


def create_checkout_order(*, user, customer_name: str, payment_method: str, delivery_method: str, promo_code: str, items_payload: list, idempotency_key: str) -> Order:
    normalized_key = (idempotency_key or '').strip()
    if not normalized_key:
        raise OrderDomainError('Відсутній Idempotency-Key для checkout.', status_code=400)

    existing = Order.objects.filter(idempotency_key=normalized_key).first()
    if existing:
        return existing

    normalized_items = _normalize_items_payload(items_payload)

    shipping_amount = Decimal('80.00') if delivery_method == Order.DeliveryMethod.NOVA_POSHTA else Decimal('0.00')
    try:
        return _create_checkout_order_locked(
            user=user,
            customer_name=customer_name,
            payment_method=payment_method,
            delivery_method=delivery_method,
            promo_code=promo_code,
            items_payload=normalized_items,
            normalized_key=normalized_key,
            shipping_amount=shipping_amount,
        )
    except IntegrityError:
        existing = Order.objects.filter(idempotency_key=normalized_key).first()
        if existing:
            return existing
        raise


def _create_checkout_order_locked(*, user, customer_name, payment_method, delivery_method, promo_code, items_payload, normalized_key, shipping_amount) -> Order:
    with transaction.atomic():
        books_map = _resolve_books(items_payload)

        subtotal_amount = Decimal('0.00')
        primary_title = ''
        order_items_payload = []
        insufficient_items = []
        for item in items_payload:
            book = books_map[str(item['bookId'])]
            quantity = item['quantity']
            if quantity > book.inventory:
                insufficient_items.append({
                    'bookId': str(book.pk),
                    'title': book.title,
                    'requested': quantity,
                    'available': book.inventory,
                })
            line_total = Decimal(book.price) * quantity
            subtotal_amount += line_total
            if not primary_title:
                primary_title = book.title
            order_items_payload.append((book, quantity, line_total))

        if insufficient_items:
            raise OrderDomainError('Недостатньо книг на складі.', status_code=409, fields={'items': insufficient_items})

        promo, discount_amount = _resolve_discount((promo_code or '').strip().upper(), subtotal_amount)
        total_amount = max(Decimal('0.00'), subtotal_amount + shipping_amount - discount_amount)

        order = Order.objects.create(
            user=user,
            customer_id=str(user.id),
            customer_name=customer_name or user.get_full_name() or user.username,
            book_title=primary_title,
            amount=total_amount,
            subtotal_amount=subtotal_amount,
            shipping_amount=shipping_amount,
            total_amount=total_amount,
            discount_amount=discount_amount,
            promo_code=(promo_code or '').strip().upper(),
            payment_method=payment_method,
            delivery_method=delivery_method,
            idempotency_key=normalized_key,
            status=Order.Status.ORDERED,
        )
        OrderStatusHistory.objects.create(order=order, from_status='', to_status=Order.Status.ORDERED, changed_by=user)

        order_items = []
        for book, quantity, line_total in order_items_payload:
            order_items.append(
                OrderItem(
                    order=order,
                    book=book,
                    quantity=quantity,
                    unit_price=book.price,
                    line_total=line_total,
                )
            )
            updated = Book.objects.filter(pk=book.pk, inventory__gte=quantity).update(inventory=F('inventory') - quantity)
            if updated == 0:
                raise OrderDomainError('Склад змінився під час оформлення.', status_code=409)
            InventoryMovement.objects.create(
                book=book,
                order=order,
                movement_type=InventoryMovement.MovementType.DEBIT,
                quantity=quantity,
                note='Checkout inventory debit',
            )
            book.refresh_from_db()
            if book.inventory <= getattr(book, 'low_stock_threshold', 3):
                emit_domain_event(
                    event_type='low_inventory',
                    aggregate_type='book',
                    aggregate_id=str(book.pk),
                    payload={'bookId': str(book.pk), 'inventory': book.inventory, 'threshold': getattr(book, 'low_stock_threshold', 3)},
                )
        OrderItem.objects.bulk_create(order_items)

        if promo:
            promo.used_count = F('used_count') + 1
            promo.save(update_fields=['used_count'])

        emit_domain_event(
            event_type='order_created',
            aggregate_type='order',
            aggregate_id=str(order.pk),
            payload={
                'orderId': str(order.pk),
                'customerId': str(order.customer_id),
                'totalAmount': str(order.total_amount),
                'itemsCount': len(order_items_payload),
            },
        )
        if order.user and order.user.email:
            enqueue_notification(
                notification_type='order_created',
                recipient=order.user.email,
                subject='ЛистоПад: замовлення створено',
                body=f'Ваше замовлення #{order.pk} успішно оформлено. Сума: {order.total_amount} грн.',
            )
    return order


def update_order_status(*, order: Order, new_status: str, actor=None) -> Order:
    raw_new = new_status
    if raw_new in LEGACY_STATUS_ALIASES:
        new_status = LEGACY_STATUS_ALIASES[raw_new]
    current_status = order.status
    if current_status in LEGACY_STATUS_ALIASES:
        current_status = LEGACY_STATUS_ALIASES[current_status]
    allowed = ALLOWED_STATUS_TRANSITIONS.get(current_status, set())
    if new_status not in dict(Order.Status.choices):
        raise OrderDomainError('Невалідний статус.', status_code=400)
    if new_status not in allowed:
        raise OrderDomainError(f'Перехід {order.status} -> {new_status} заборонений.', status_code=409)

    previous_status = order.status
    now = timezone.now()
    with transaction.atomic():
        if new_status == Order.Status.CANCELLED and current_status in (
            Order.Status.ORDERED,
            Order.Status.PAID,
            Order.Status.PACKED,
        ):
            for oi in order.items.all():
                Book.objects.filter(pk=oi.book_id).update(inventory=F('inventory') + oi.quantity)
                InventoryMovement.objects.create(
                    book=oi.book,
                    order=order,
                    movement_type=InventoryMovement.MovementType.RESTOCK,
                    quantity=oi.quantity,
                    note='Скасування замовлення — повернення на склад',
                )

        order.status = new_status
        updated_fields = ['status']
        if new_status == Order.Status.SHIPPED:
            order.shipped_at = now
            updated_fields.append('shipped_at')
        elif new_status == Order.Status.DELIVERED:
            order.delivered_at = now
            updated_fields.append('delivered_at')
        elif new_status == Order.Status.CLOSED:
            order.closed_at = now
            updated_fields.append('closed_at')
        elif new_status == Order.Status.CANCELLED:
            order.cancelled_at = now
            updated_fields.append('cancelled_at')
        order.save(update_fields=updated_fields)
        OrderStatusHistory.objects.create(
            order=order,
            from_status=previous_status,
            to_status=new_status,
            changed_by=actor,
        )

    emit_domain_event(
        event_type='order_status_changed',
        aggregate_type='order',
        aggregate_id=str(order.pk),
        payload={
            'orderId': str(order.pk),
            'fromStatus': previous_status,
            'toStatus': new_status,
        },
    )
    if order.user and order.user.email:
        enqueue_notification(
            notification_type='order_status_changed',
            recipient=order.user.email,
            subject='ЛистоПад: оновлено статус замовлення',
            body=f'Статус вашого замовлення #{order.pk}: {new_status}',
        )
    return order
