from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    GrievanceViewSet,
    HealthCheckAPI,
    MyTokenObtainPairView,
    UserRegistrationView,
    VerifyEmailAPI,
    UserViewSet,
    RequestPasswordResetAPI,
    PasswordResetConfirmAPI,
    current_user,  # added this for /me endpoint
)

# Register viewsets with the DRF router
router = DefaultRouter()
router.register(r'grievances', GrievanceViewSet, basename='grievance')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),

    # User registration and email verification
    path('register/', UserRegistrationView.as_view(), name='user_register'),
    path('verify-email/<str:uidb64>/<str:token>/', VerifyEmailAPI.as_view(), name='verify-email'),

    # Authentication (JWT)
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Health check
    path('health/', HealthCheckAPI.as_view(), name='health-check'),

    # Password reset
    path('password-reset/', RequestPasswordResetAPI.as_view(), name='password-reset-request'),
    path('password-reset-confirm/<str:uidb64>/<str:token>/', PasswordResetConfirmAPI.as_view(), name='password-reset-confirm'),

    # Current logged-in user profile
    path('me/', current_user, name='current-user'),
]
