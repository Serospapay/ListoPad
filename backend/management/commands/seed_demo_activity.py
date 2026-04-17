from __future__ import annotations

import random
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from backend.domain.demo_accounts import ensure_demo_accounts
from backend.domain.orders import OrderDomainError, create_checkout_order, update_order_status
from backend.domain.reviews import recalculate_book_rating
from backend.models import Book, BookReview, Order, PromoCode, WishlistItem


DEMO_PASSWORD = 'DemoUser123!'
DEMO_USER_ROWS = [
    ('olena.koval', 'Олена Коваль'),
    ('taras.melnyk', 'Тарас Мельник'),
    ('iryna.shevchuk', 'Ірина Шевчук'),
    ('andriy.hnatiuk', 'Андрій Гнатюк'),
    ('maria.bondar', 'Марія Бондар'),
    ('viktor.klymenko', 'Віктор Клименко'),
    ('natalia.stepaniuk', 'Наталія Степанюк'),
    ('bohdan.kravets', 'Богдан Кравець'),
]

REVIEW_PHRASES_POSITIVE = [
    'Чудове видання: якісний папір, зручний шрифт, читається на одному диханні.',
    'Сюжет тримає до останньої сторінки, переклад акуратний і природний.',
    'Дуже сподобалась подача матеріалу, книга залишила сильне враження.',
    'Оформлення ідеальне, обкладинка стильна, сторінки щільні.',
    'Брала на подарунок і потім купила собі таку ж.',
    'Одна з найкращих книг, які читала за останній рік.',
]

REVIEW_PHRASES_MIXED = [
    'Загалом цікаво, але перша третина трохи затягнута.',
    'Ідея сильна, місцями бракує динаміки, та фінал вдалий.',
    'Гарна книга, хоча очікував більш глибокої розвʼязки.',
    'Переклад хороший, але деякі діалоги звучать занадто рівно.',
]

REVIEW_PHRASES_REJECTED = [
    'Текст відгуку потребує редагування і конкретики.',
    'Надто короткий відгук без аргументації.',
    'Коментар не стосується змісту книги.',
]


def _ensure_user(email: str, full_name: str, *, is_staff: bool = False, is_superuser: bool = False, password: str = DEMO_PASSWORD) -> User:
    first_name, _, last_name = full_name.partition(' ')
    defaults = {
        'email': email,
        'first_name': first_name,
        'last_name': last_name,
        'is_staff': is_staff,
        'is_superuser': is_superuser,
        'is_active': True,
    }
    user, created = User.objects.get_or_create(username=email, defaults=defaults)
    changed = False
    if created:
        user.set_password(password)
        changed = True
    else:
        for key, value in defaults.items():
            if getattr(user, key) != value:
                setattr(user, key, value)
                changed = True
        if not user.check_password(password):
            user.set_password(password)
            changed = True
    if changed:
        user.save()
    return user


def _ensure_promo_codes() -> None:
    promo_rows = [
        ('SAVE10', PromoCode.DiscountType.PERCENT, Decimal('10.00'), Decimal('0.00'), 0, 0),
        ('BOOK50', PromoCode.DiscountType.FIXED, Decimal('50.00'), Decimal('300.00'), 0, 0),
        ('WEEKEND15', PromoCode.DiscountType.PERCENT, Decimal('15.00'), Decimal('500.00'), 0, 0),
    ]
    for code, discount_type, value, min_order, max_uses, per_user_limit in promo_rows:
        PromoCode.objects.update_or_create(
            code=code,
            defaults={
                'discount_type': discount_type,
                'value': value,
                'is_active': True,
                'min_order_amount': min_order,
                'max_uses': max_uses,
                'per_user_limit': per_user_limit,
            },
        )


def _seed_reviews(books: list[Book], review_users: list[User], admin_user: User, rng: random.Random) -> tuple[int, int, int]:
    approved_count = 0
    pending_count = 0
    rejected_count = 0

    for index, book in enumerate(books):
        sample_users = rng.sample(review_users, k=min(3, len(review_users)))
        for pos, user in enumerate(sample_users):
            selector = (index + pos) % 10
            if selector <= 5:
                status = BookReview.Status.APPROVED
                rating = rng.choice([4, 5, 5, 5, 4, 3])
                comment = rng.choice(REVIEW_PHRASES_POSITIVE if rating >= 4 else REVIEW_PHRASES_MIXED)
                moderation_note = 'Схвалено модератором.'
                moderated_by = admin_user
                approved_count += 1
            elif selector <= 7:
                status = BookReview.Status.PENDING
                rating = rng.choice([4, 5, 3])
                comment = rng.choice(REVIEW_PHRASES_MIXED)
                moderation_note = ''
                moderated_by = None
                pending_count += 1
            else:
                status = BookReview.Status.REJECTED
                rating = rng.choice([1, 2, 3])
                comment = rng.choice(REVIEW_PHRASES_REJECTED)
                moderation_note = 'Відхилено: потрібен конструктивний відгук.'
                moderated_by = admin_user
                rejected_count += 1

            BookReview.objects.update_or_create(
                book=book,
                user=user,
                defaults={
                    'rating': rating,
                    'comment': comment,
                    'status': status,
                    'moderation_note': moderation_note,
                    'moderated_by': moderated_by,
                },
            )

        recalculate_book_rating(book)

    return approved_count, pending_count, rejected_count


def _progress_status(order: Order, target_status: str, actor: User) -> Order:
    transition_map = {
        Order.Status.ORDERED: Order.Status.PAID,
        Order.Status.PAID: Order.Status.PACKED,
        Order.Status.PACKED: Order.Status.SHIPPED,
        Order.Status.SHIPPED: Order.Status.DELIVERED,
        Order.Status.DELIVERED: Order.Status.CLOSED,
    }
    while order.status != target_status:
        if target_status == Order.Status.CANCELLED and order.status in {Order.Status.ORDERED, Order.Status.PAID, Order.Status.PACKED}:
            order = update_order_status(order=order, new_status=Order.Status.CANCELLED, actor=actor)
            return order
        next_status = transition_map.get(order.status)
        if not next_status:
            return order
        order = update_order_status(order=order, new_status=next_status, actor=actor)
    return order


def _seed_orders(
    books: list[Book],
    buyers: list[User],
    admin_user: User,
    rng: random.Random,
    total_orders: int,
) -> int:
    status_pool = [
        Order.Status.ORDERED,
        Order.Status.PAID,
        Order.Status.PACKED,
        Order.Status.SHIPPED,
        Order.Status.DELIVERED,
        Order.Status.CLOSED,
        Order.Status.CANCELLED,
    ]
    payment_pool = [
        Order.PaymentMethod.CARD,
        Order.PaymentMethod.APPLE_PAY,
        Order.PaymentMethod.GOOGLE_PAY,
        Order.PaymentMethod.CASH_ON_DELIVERY,
    ]
    delivery_pool = [Order.DeliveryMethod.NOVA_POSHTA, Order.DeliveryMethod.STANDARD]

    created_or_found = 0
    for idx in range(total_orders):
        buyer = buyers[idx % len(buyers)]
        k = 1 if idx % 3 else 2
        selected_books = rng.sample(books, k=min(k, len(books)))
        items = [{'bookId': str(book.pk), 'quantity': rng.randint(1, 2)} for book in selected_books]
        payment_method = rng.choice(payment_pool)
        delivery_method = rng.choice(delivery_pool)
        promo_code = rng.choice(['', '', 'SAVE10', 'BOOK50', 'WEEKEND15'])
        idempotency_key = f'demo-activity-order-{idx:03d}'
        try:
            order = create_checkout_order(
                user=buyer,
                customer_name=buyer.get_full_name() or buyer.username,
                payment_method=payment_method,
                delivery_method=delivery_method,
                promo_code=promo_code,
                items_payload=items,
                idempotency_key=idempotency_key,
            )
        except OrderDomainError:
            order = create_checkout_order(
                user=buyer,
                customer_name=buyer.get_full_name() or buyer.username,
                payment_method=payment_method,
                delivery_method=delivery_method,
                promo_code='',
                items_payload=items,
                idempotency_key=idempotency_key,
            )
        target_status = status_pool[idx % len(status_pool)]
        order = _progress_status(order, target_status, admin_user)
        if order.status in {Order.Status.SHIPPED, Order.Status.DELIVERED, Order.Status.CLOSED} and not order.tracking_number:
            order.tracking_number = f'NP{100000 + idx}'
            order.save(update_fields=['tracking_number'])
        created_or_found += 1
    return created_or_found


def _seed_wishlist(books: list[Book], users: list[User], rng: random.Random) -> int:
    created = 0
    for idx, user in enumerate(users):
        for book in rng.sample(books, k=min(5, len(books))):
            _, was_created = WishlistItem.objects.get_or_create(user=user, book=book)
            if was_created:
                created += 1
        # Ensure deterministic favorites for first user in list.
        if idx == 0 and books:
            for book in books[: min(8, len(books))]:
                _, was_created = WishlistItem.objects.get_or_create(user=user, book=book)
                if was_created:
                    created += 1
    return created


class Command(BaseCommand):
    help = 'Наповнює проєкт живими демо-даними: відгуки, користувачі, замовлення, wishlist.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Очистити попередні демо-відгуки перед новим сидом.',
        )
        parser.add_argument(
            '--orders',
            type=int,
            default=42,
            help='Кількість демо-замовлень для генерації (за замовчуванням: 42).',
        )
        parser.add_argument(
            '--seed',
            type=int,
            default=20260417,
            help='Seed для відтворюваної генерації.',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        rng = random.Random(options['seed'])
        orders_target = max(10, int(options['orders']))

        books = list(Book.objects.all()[:60])
        if len(books) < 8:
            self.stdout.write(self.style.ERROR('Недостатньо книг у каталозі. Спершу виконайте seed_demo_books.'))
            return

        for book in books:
            if book.inventory < 20:
                book.inventory = 20
                book.save(update_fields=['inventory'])

        ensure_demo_accounts()
        admin_user = User.objects.get(username='demo.admin@lystopad.local')
        demo_user = User.objects.get(username='demo.user@lystopad.local')

        extra_users: list[User] = []
        for username, full_name in DEMO_USER_ROWS:
            email = f'{username}@demo.lystopad.local'
            extra_users.append(_ensure_user(email=email, full_name=full_name))

        review_users = [demo_user, *extra_users]
        all_buyers = [demo_user, *extra_users]

        _ensure_promo_codes()

        if options['reset']:
            BookReview.objects.filter(user__in=review_users).delete()

        approved, pending, rejected = _seed_reviews(books=books, review_users=review_users, admin_user=admin_user, rng=rng)
        seeded_orders = _seed_orders(
            books=books,
            buyers=all_buyers,
            admin_user=admin_user,
            rng=rng,
            total_orders=orders_target,
        )
        wishlist_created = _seed_wishlist(books=books, users=all_buyers, rng=rng)

        self.stdout.write(
            self.style.SUCCESS(
                'Готово: '
                f'користувачів для демо {len(all_buyers) + 1}, '
                f'замовлень {seeded_orders}, '
                f'відгуків (approved/pending/rejected): {approved}/{pending}/{rejected}, '
                f'wishlist записів додано {wishlist_created}.'
            )
        )
