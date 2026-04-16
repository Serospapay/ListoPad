
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    AnalyticsCRMView,
    AuthLoginView,
    AuthMeView,
    AuthRefreshView,
    AuthRegisterView,
    BookViewSet,
    CategoryViewSet,
    HealthView,
    NotificationOutboxDispatchView,
    OrderViewSet,
    PromoCodeViewSet,
    UserViewSet,
    WishlistViewSet,
)

router = DefaultRouter()
router.register(r'books', BookViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'users', UserViewSet)
router.register(r'wishlist', WishlistViewSet, basename='wishlist')
router.register(r'promo-codes', PromoCodeViewSet, basename='promo-codes')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/auth/login/', AuthLoginView.as_view(), name='auth-login'),
    path('api/auth/refresh/', AuthRefreshView.as_view(), name='auth-refresh'),
    path('api/auth/register/', AuthRegisterView.as_view(), name='auth-register'),
    path('api/auth/me/', AuthMeView.as_view(), name='auth-me'),
    path('api/analytics/crm/', AnalyticsCRMView.as_view(), name='analytics-crm'),
    path('api/notifications/dispatch/', NotificationOutboxDispatchView.as_view(), name='notifications-dispatch'),
    path('health/', HealthView.as_view(), name='health'),
]
