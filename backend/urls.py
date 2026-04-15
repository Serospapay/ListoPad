
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.response import Response
from rest_framework.views import APIView

from .views import (
    AuthLoginView,
    AuthMeView,
    AuthRefreshView,
    AuthRegisterView,
    BookViewSet,
    CategoryViewSet,
    OrderViewSet,
    UserViewSet,
)

router = DefaultRouter()
router.register(r'books', BookViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'users', UserViewSet)


class HealthView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({'status': 'ok'})

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/auth/login/', AuthLoginView.as_view(), name='auth-login'),
    path('api/auth/refresh/', AuthRefreshView.as_view(), name='auth-refresh'),
    path('api/auth/register/', AuthRegisterView.as_view(), name='auth-register'),
    path('api/auth/me/', AuthMeView.as_view(), name='auth-me'),
    path('health/', HealthView.as_view(), name='health'),
]
