from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Book, BookReview, InventoryMovement, Order, PromoCode, PromoCodeRedemption, WishlistItem


class HealthEndpointTest(APITestCase):
    def test_health_endpoint(self):
        response = self.client.get('/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'ok')
        self.assertEqual(response.data['database'], 'ok')


class AuthFlowTest(APITestCase):
    def test_register_and_login(self):
        register_res = self.client.post('/api/auth/register/', {
            'name': 'Іван Тест',
            'email': 'ivan@example.com',
            'password': 'testpass123'
        }, format='json')
        self.assertEqual(register_res.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', register_res.data)
        self.assertIn('refresh', register_res.data)

        login_res = self.client.post('/api/auth/login/', {
            'username': 'ivan@example.com',
            'password': 'testpass123'
        }, format='json')
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertIn('access', login_res.data)

    def test_demo_accounts_endpoint_creates_accounts_for_all_roles(self):
        response = self.client.get('/api/auth/demo-accounts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        accounts = response.data.get('accounts', [])
        self.assertEqual(len(accounts), 2)
        roles = {item['role'] for item in accounts}
        self.assertEqual(roles, {'admin', 'user'})

        admin_user = User.objects.get(username='demo.admin@lystopad.local')
        regular_user = User.objects.get(username='demo.user@lystopad.local')
        self.assertTrue(admin_user.is_superuser)
        self.assertTrue(admin_user.is_staff)
        self.assertFalse(regular_user.is_superuser)
        self.assertTrue(admin_user.check_password('DemoAdmin123!'))
        self.assertTrue(regular_user.check_password('DemoUser123!'))


class CheckoutFlowTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='buyer@example.com',
            email='buyer@example.com',
            password='pass12345',
            first_name='Buyer',
            last_name='User',
        )
        self.book = Book.objects.create(
            title='Тестова книга',
            author='Автор Тест',
            price='250.00',
            inventory=5,
            cover_image='https://example.com/cover.jpg',
        )
        self.admin = User.objects.create_user(
            username='admin-checkout@example.com',
            email='admin-checkout@example.com',
            password='pass12345',
            is_superuser=True,
            is_staff=True,
        )

    def authenticate(self):
        login_res = self.client.post('/api/auth/login/', {
            'username': 'buyer@example.com',
            'password': 'pass12345'
        }, format='json')
        token = login_res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def authenticate_admin(self):
        login_res = self.client.post('/api/auth/login/', {
            'username': 'admin-checkout@example.com',
            'password': 'pass12345'
        }, format='json')
        token = login_res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_checkout_requires_idempotency_key(self):
        self.authenticate()
        response = self.client.post('/api/orders/checkout/', {
            'customerName': 'Buyer User',
            'paymentMethod': 'card',
            'deliveryMethod': 'nova_poshta',
            'items': [{'bookId': str(self.book.pk), 'quantity': 2}],
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_checkout_creates_order_and_decrements_inventory(self):
        self.authenticate()
        response = self.client.post(
            '/api/orders/checkout/',
            {
                'customerName': 'Buyer User',
                'paymentMethod': 'card',
                'deliveryMethod': 'nova_poshta',
                'items': [{'bookId': str(self.book.pk), 'quantity': 2}],
            },
            HTTP_IDEMPOTENCY_KEY='checkout-test-1',
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.book.refresh_from_db()
        self.assertEqual(self.book.inventory, 3)
        self.assertEqual(Order.objects.count(), 1)
        reserve_count = InventoryMovement.objects.filter(movement_type=InventoryMovement.MovementType.RESERVE).count()
        debit_count = InventoryMovement.objects.filter(movement_type=InventoryMovement.MovementType.DEBIT).count()
        self.assertEqual(reserve_count, 1)
        self.assertEqual(debit_count, 0)

    def test_checkout_idempotent(self):
        self.authenticate()
        payload = {
            'customerName': 'Buyer User',
            'paymentMethod': 'card',
            'deliveryMethod': 'nova_poshta',
            'items': [{'bookId': str(self.book.pk), 'quantity': 1}],
        }
        r1 = self.client.post('/api/orders/checkout/', payload, HTTP_IDEMPOTENCY_KEY='idem-same', format='json')
        r2 = self.client.post('/api/orders/checkout/', payload, HTTP_IDEMPOTENCY_KEY='idem-same', format='json')
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r1.data['orderId'], r2.data['orderId'])
        self.assertEqual(Order.objects.count(), 1)

    def test_checkout_accepts_promo_code(self):
        PromoCode.objects.create(code='SAVE10', discount_type='percent', value='10.00', is_active=True)
        self.authenticate()
        response = self.client.post(
            '/api/orders/checkout/',
            {
                'customerName': 'Buyer User',
                'paymentMethod': 'card',
                'deliveryMethod': 'nova_poshta',
                'promoCode': 'SAVE10',
                'items': [{'bookId': str(self.book.pk), 'quantity': 2}],
            },
            HTTP_IDEMPOTENCY_KEY='checkout-promo-1',
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['order']['promoCode'], 'SAVE10')
        self.assertEqual(PromoCodeRedemption.objects.count(), 1)

    def test_checkout_preview_returns_totals(self):
        PromoCode.objects.create(code='SAVE10', discount_type='percent', value='10.00', is_active=True)
        self.authenticate()
        response = self.client.post(
            '/api/orders/checkout-preview/',
            {
                'customerName': 'Buyer User',
                'paymentMethod': 'card',
                'deliveryMethod': 'nova_poshta',
                'promoCode': 'SAVE10',
                'items': [{'bookId': str(self.book.pk), 'quantity': 2}],
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['promoApplied'], 'SAVE10')
        self.assertEqual(Decimal(str(response.data['discountAmount'])), Decimal('50.00'))

    def test_checkout_merges_duplicate_book_items(self):
        self.authenticate()
        response = self.client.post(
            '/api/orders/checkout/',
            {
                'customerName': 'Buyer User',
                'paymentMethod': 'card',
                'deliveryMethod': 'nova_poshta',
                'items': [
                    {'bookId': str(self.book.pk), 'quantity': 2},
                    {'bookId': str(self.book.pk), 'quantity': 1},
                ],
            },
            HTTP_IDEMPOTENCY_KEY='checkout-dup-1',
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.book.refresh_from_db()
        self.assertEqual(self.book.inventory, 2)
        self.assertEqual(response.data['order']['items'][0]['quantity'], 3)

    def test_paid_status_creates_debit_movement(self):
        self.authenticate()
        response = self.client.post(
            '/api/orders/checkout/',
            {
                'customerName': 'Buyer User',
                'paymentMethod': 'card',
                'deliveryMethod': 'nova_poshta',
                'items': [{'bookId': str(self.book.pk), 'quantity': 1}],
            },
            HTTP_IDEMPOTENCY_KEY='checkout-paid-transition',
            format='json',
        )
        order_id = response.data['orderId']
        self.authenticate_admin()
        patch_res = self.client.patch(f'/api/orders/{order_id}/', {'status': 'paid'}, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertTrue(bool(patch_res.data.get('paidAt')))
        debit_count = InventoryMovement.objects.filter(
            order_id=order_id,
            movement_type=InventoryMovement.MovementType.DEBIT,
        ).count()
        self.assertEqual(debit_count, 1)

    def test_cancel_order_releases_reserved_inventory(self):
        self.authenticate()
        response = self.client.post(
            '/api/orders/checkout/',
            {
                'customerName': 'Buyer User',
                'paymentMethod': 'card',
                'deliveryMethod': 'nova_poshta',
                'items': [{'bookId': str(self.book.pk), 'quantity': 2}],
            },
            HTTP_IDEMPOTENCY_KEY='checkout-cancel-reserve',
            format='json',
        )
        order_id = response.data['orderId']
        self.book.refresh_from_db()
        self.assertEqual(self.book.inventory, 3)

        self.authenticate_admin()
        patch_res = self.client.patch(f'/api/orders/{order_id}/', {'status': 'cancelled'}, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.book.refresh_from_db()
        self.assertEqual(self.book.inventory, 5)
        release_count = InventoryMovement.objects.filter(
            order_id=order_id,
            movement_type=InventoryMovement.MovementType.RELEASE,
        ).count()
        self.assertEqual(release_count, 1)

    def test_checkout_rejects_promo_under_min_order_amount(self):
        PromoCode.objects.create(
            code='MIN500',
            discount_type='fixed',
            value='50.00',
            is_active=True,
            min_order_amount='500.00',
        )
        self.authenticate()
        response = self.client.post(
            '/api/orders/checkout/',
            {
                'customerName': 'Buyer User',
                'paymentMethod': 'card',
                'deliveryMethod': 'standard',
                'promoCode': 'MIN500',
                'items': [{'bookId': str(self.book.pk), 'quantity': 1}],
            },
            HTTP_IDEMPOTENCY_KEY='checkout-promo-min-amount',
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('minOrderAmount', response.data.get('fields', {}))

    def test_checkout_rejects_promo_per_user_limit(self):
        promo = PromoCode.objects.create(
            code='ONCEONLY',
            discount_type='fixed',
            value='20.00',
            is_active=True,
            per_user_limit=1,
        )
        self.authenticate()
        payload = {
            'customerName': 'Buyer User',
            'paymentMethod': 'card',
            'deliveryMethod': 'standard',
            'promoCode': 'ONCEONLY',
            'items': [{'bookId': str(self.book.pk), 'quantity': 1}],
        }
        first = self.client.post('/api/orders/checkout/', payload, HTTP_IDEMPOTENCY_KEY='checkout-once-1', format='json')
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PromoCodeRedemption.objects.filter(promo_code=promo).count(), 1)
        second = self.client.post('/api/orders/checkout/', payload, HTTP_IDEMPOTENCY_KEY='checkout-once-2', format='json')
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)


class WishlistAndFiltersTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='reader@example.com',
            email='reader@example.com',
            password='pass12345',
        )
        self.admin = User.objects.create_user(
            username='admin@example.com',
            email='admin@example.com',
            password='pass12345',
            is_staff=True,
        )
        self.book_a = Book.objects.create(
            title='Філософія тиші',
            author='Автор 1',
            price='300.00',
            inventory=4,
            cover_image='https://example.com/a.jpg',
        )
        self.book_b = Book.objects.create(
            title='Детектив міста',
            author='Автор 2',
            price='120.00',
            inventory=0,
            cover_image='https://example.com/b.jpg',
        )

    def login(self, email):
        response = self.client.post('/api/auth/login/', {'username': email, 'password': 'pass12345'}, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_wishlist_crud(self):
        self.login('reader@example.com')
        create_res = self.client.post('/api/wishlist/', {'bookId': str(self.book_a.pk)}, format='json')
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(WishlistItem.objects.count(), 1)

        list_res = self.client.get('/api/wishlist/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_res.data), 1)

        delete_res = self.client.delete(f'/api/wishlist/{self.book_a.pk}/')
        self.assertEqual(delete_res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(WishlistItem.objects.count(), 0)

    def test_books_filter_and_sort(self):
        response = self.client.get('/api/books/?q=детектив&in_stock=true&sort=price_asc')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

        response = self.client.get('/api/books/?q=Автор%201&sort=price_desc')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_books_filter_rejects_invalid_price_params(self):
        response = self.client.get('/api/books/?min_price=abc')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('min_price', response.data['fields'])

        response = self.client.get('/api/books/?min_price=500&max_price=10')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('price_range', response.data['fields'])

    def test_users_list_requires_admin(self):
        self.login('reader@example.com')
        res = self.client.get('/api/users/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_order_status_requires_admin(self):
        order = Order.objects.create(
            user=self.user,
            customer_id=str(self.user.id),
            customer_name='Reader',
            book_title='Філософія тиші',
            amount='100.00',
            total_amount='100.00',
            payment_method='card',
            delivery_method='nova_poshta',
            status=Order.Status.ORDERED,
        )
        self.login('reader@example.com')
        patch_res = self.client.patch(f'/api/orders/{order.id}/', {'status': 'paid'}, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_403_FORBIDDEN)

        self.login('admin@example.com')
        patch_res = self.client.patch(f'/api/orders/{order.id}/', {'status': 'paid'}, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)

    def test_admin_orders_filtering(self):
        Order.objects.create(
            user=self.user,
            customer_id=str(self.user.id),
            customer_name='Reader One',
            book_title='Філософія тиші',
            amount='100.00',
            total_amount='100.00',
            payment_method='card',
            delivery_method='nova_poshta',
            promo_code='SAVE10',
            status=Order.Status.ORDERED,
        )
        Order.objects.create(
            user=self.user,
            customer_id=str(self.user.id),
            customer_name='Reader Two',
            book_title='Детектив міста',
            amount='200.00',
            total_amount='200.00',
            payment_method='cash_on_delivery',
            delivery_method='standard',
            promo_code='',
            status=Order.Status.PAID,
        )
        self.login('admin@example.com')
        response = self.client.get('/api/orders/?status=paid&page_size=200')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data.get('results', [])), 1)
        response = self.client.get('/api/orders/?promo_code=SAVE10&page_size=200')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data.get('results', [])), 1)


class BookReviewsFlowTest(APITestCase):
    def setUp(self):
        self.book = Book.objects.create(
            title='Тестова книга для відгуків',
            author='Автор Тест',
            price='250.00',
            inventory=8,
            cover_image='https://example.com/review-book.jpg',
            rating=0,
        )
        self.user = User.objects.create_user(
            username='reviews-user@example.com',
            email='reviews-user@example.com',
            password='pass12345',
            first_name='Review',
            last_name='User',
        )
        self.admin = User.objects.create_user(
            username='reviews-admin@example.com',
            email='reviews-admin@example.com',
            password='pass12345',
            is_staff=True,
            is_superuser=True,
        )

    def login(self, username: str):
        response = self.client.post('/api/auth/login/', {'username': username, 'password': 'pass12345'}, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_only_authenticated_user_can_create_review(self):
        response = self.client.post(
            f'/api/books/{self.book.pk}/reviews/',
            {'rating': 5, 'comment': 'Чудова книга'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_review_requires_admin_moderation_and_public_sees_only_approved(self):
        self.login('reviews-user@example.com')
        create_response = self.client.post(
            f'/api/books/{self.book.pk}/reviews/',
            {'rating': 4, 'comment': 'Дуже якісне видання.'},
            format='json',
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        review = BookReview.objects.get(book=self.book, user=self.user)
        self.assertEqual(review.status, BookReview.Status.PENDING)

        self.client.credentials()
        public_reviews = self.client.get(f'/api/books/{self.book.pk}/reviews/')
        self.assertEqual(public_reviews.status_code, status.HTTP_200_OK)
        self.assertEqual(len(public_reviews.data), 0)

        self.login('reviews-admin@example.com')
        moderation = self.client.patch(
            f'/api/book-reviews/{review.pk}/',
            {'status': 'approved'},
            format='json',
        )
        self.assertEqual(moderation.status_code, status.HTTP_200_OK)
        review.refresh_from_db()
        self.assertEqual(review.status, BookReview.Status.APPROVED)

        self.book.refresh_from_db()
        self.assertEqual(self.book.review_count, 1)
        self.assertEqual(round(self.book.rating, 1), 4.0)

        self.client.credentials()
        public_reviews = self.client.get(f'/api/books/{self.book.pk}/reviews/')
        self.assertEqual(public_reviews.status_code, status.HTTP_200_OK)
        self.assertEqual(len(public_reviews.data), 1)
        self.assertEqual(public_reviews.data[0]['rating'], 4)

    def test_only_admin_can_moderate_reviews(self):
        self.login('reviews-user@example.com')
        self.client.post(
            f'/api/books/{self.book.pk}/reviews/',
            {'rating': 3, 'comment': 'Нормально.'},
            format='json',
        )
        review = BookReview.objects.get(book=self.book, user=self.user)
        user_patch = self.client.patch(
            f'/api/book-reviews/{review.pk}/',
            {'status': 'approved'},
            format='json',
        )
        self.assertEqual(user_patch.status_code, status.HTTP_403_FORBIDDEN)

        self.client.credentials()
        anonymous_patch = self.client.patch(
            f'/api/book-reviews/{review.pk}/',
            {'status': 'approved'},
            format='json',
        )
        self.assertEqual(anonymous_patch.status_code, status.HTTP_401_UNAUTHORIZED)
