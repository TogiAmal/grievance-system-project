from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    GrievanceViewSet,
    HealthCheckAPI,
    MyTokenObtainPairView,
    UserViewSet,
    ConversationViewSet,
    RequestPasswordResetAPI,
    PasswordResetConfirmAPI,
    ChangePasswordView
)

router = DefaultRouter()
router.register(r'grievances', GrievanceViewSet, basename='grievance')
router.register(r'users', UserViewSet, basename='user')
router.register(r'conversations', ConversationViewSet, basename='conversation')

urlpatterns = [
    path('', include(router.urls)),
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('password-reset/', RequestPasswordResetAPI.as_view(), name='password-reset-request'),
    path('password-reset-confirm/<str:uidb64>/<str:token>/', PasswordResetConfirmAPI.as_view(), name='password-reset-confirm'),
    path('health/', HealthCheckAPI.as_view(), name='health-check'),
]