# api/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

# All view imports are now consolidated in one block
from .views import (
    GrievanceViewSet,
    HealthCheckAPI,
    MyTokenObtainPairView,
    UserRegistrationView,
    VerifyEmailAPI
)

router = DefaultRouter()
router.register(r'grievances', GrievanceViewSet, basename='grievance')

urlpatterns = [
    # URLs from the router for grievances
    path('', include(router.urls)),
    
    # URLs for user management and authentication
    path('register/', UserRegistrationView.as_view(), name='user_register'),
    path('verify-email/<str:uidb64>/<str:token>/', VerifyEmailAPI.as_view(), name='verify-email'),
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # URL for the health check
    path('health/', HealthCheckAPI.as_view(), name='health-check'),
]