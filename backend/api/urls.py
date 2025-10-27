from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GrievanceViewSet, UserViewSet, MyTokenObtainPairView, HealthCheckAPI, 
    ChangePasswordView, ConversationViewSet, RequestPasswordResetAPI, 
    PasswordResetConfirmAPI
)

router = DefaultRouter()
# Ensure base_name is specified if queryset is dynamic or not set on the viewset
router.register(r'grievances', GrievanceViewSet, basename='grievance') 
router.register(r'users', UserViewSet, basename='user')
router.register(r'conversations', ConversationViewSet, basename='conversation')

urlpatterns = [
    path('', include(router.urls)),

    # --- Make sure '/me/' is mapped correctly ---
    # It needs to map to the 'me' action within the UserViewSet
    # The DRF router usually handles detail routes like /users/{pk}/, but not custom non-pk detail routes well
    # We add it manually here. The 'as_view' maps HTTP methods (like GET) to viewset actions.
    path('users/me/', UserViewSet.as_view({'get': 'me'}), name='user-me'),

    # Health check
    path('health/', HealthCheckAPI.as_view(), name='health_check'),

    # Authentication
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    # Note: TokenRefreshView is usually imported directly in the main urls.py

    # Password Management
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('request-password-reset/', RequestPasswordResetAPI.as_view(), name='request_password_reset'),
    path('reset-password/<str:uidb64>/<str:token>/', PasswordResetConfirmAPI.as_view(), name='password_reset_confirm'),

    # --- Ensure stats URL is handled by the router ---
    # The router automatically creates URLs for @action decorated methods.
    # For a @action(detail=False) named 'stats' on GrievanceViewSet, 
    # the router should create '/api/grievances/stats/'. 
    # No extra line needed here if the router registration is correct.
]

# Optional: Print generated URLs by the router for debugging
# print(router.urls)