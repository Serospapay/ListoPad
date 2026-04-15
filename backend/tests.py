from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Book, Order, PromoCode, WishlistItem


class HealthEndpointTest(APITestCase):
    def test_health_endpoint(self):
        response = self.client.get('/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'ok')


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

    def authenticate(self):
        login_res = self.client.post('/api/auth/login/', {
            'username': 'buyer@example.com',
            'password': 'pass12345'
        }, format='json')
        token = login_res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_checkout_creates_order_and_decrements_inventory(self):
        self.authenticate()
        response = self.client.post('/api/orders/checkout/', {
            'customerName': 'Buyer User',
            'paymentMethod': 'card',
            'deliveryMethod': 'nova_poshta',
            'items': [{'bookId': self.book.id, 'quantity': 2}]
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.book.refresh_from_db()
        self.assertEqual(self.book.inventory, 3)
        self.assertEqual(Order.objects.count(), 1)

    def test_checkout_accepts_promo_code(self):
        PromoCode.objects.create(code='SAVE10', discount_type='percent', value='10.00', is_active=True)
        self.authenticate()
        response = self.client.post('/api/orders/checkout/', {
            'customerName': 'Buyer User',
            'paymentMethod': 'card',
            'deliveryMethod': 'nova_poshta',
            'promoCode': 'SAVE10',
            'items': [{'bookId': self.book.id, 'quantity': 2}]
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['order']['promoCode'], 'SAVE10')


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
        create_res = self.client.post('/api/wishlist/', {'bookId': self.book_a.id}, format='json')
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(WishlistItem.objects.count(), 1)

        list_res = self.client.get('/api/wishlist/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_res.data), 1)

        delete_res = self.client.delete(f'/api/wishlist/{self.book_a.id}/')
        self.assertEqual(delete_res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(WishlistItem.objects.count(), 0)

    def test_books_filter_and_sort(self):
        response = self.client.get('/api/books/?q=детектив&in_stock=true&sort=price_asc')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

        response = self.client.get('/api/books/?q=Автор%201&sort=price_desc')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

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
        )
        self.login('reader@example.com')
        patch_res = self.client.patch(f'/api/orders/{order.id}/', {'status': 'shipping'}, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_403_FORBIDDEN)

        self.login('admin@example.com')
        patch_res = self.client.patch(f'/api/orders/{order.id}/', {'status': 'shipping'}, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
