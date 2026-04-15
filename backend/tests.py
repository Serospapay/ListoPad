from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Book, Order


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
