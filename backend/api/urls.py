# api/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

# --- UPDATED IMPORTS ---
from .views import (
    GrievanceViewSet, 
    UserRegistrationView, 
    MyTokenObtainPairView,
    VerifyEmailAPI  # Import the new verification view
)

router = DefaultRouter()
router.register(r'grievances', GrievanceViewSet, basename='grievance')

urlpatterns = [
    # URLs from the router for grievances
    path('', include(router.urls)),
    
    # URL for user registration
    path('register/', UserRegistrationView.as_view(), name='user_register'),
    
    # --- ADDED THIS LINE ---
    # URL for the email verification link
    path('verify-email/<str:uidb64>/<str:token>/', VerifyEmailAPI.as_view(), name='verify-email'),

    # URLs for JWT token login and refresh (cleaned up)
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]