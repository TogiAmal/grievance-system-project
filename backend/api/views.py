# api/views.py

from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import CustomUser, Grievance, GrievanceComment
from .serializers import (
    UserRegistrationSerializer,
    GrievanceSerializer,
    GrievanceCommentSerializer,
    MyTokenObtainPairSerializer,
    GrievanceStatusSerializer
)

# --- IMPORTS FOR EMAIL VERIFICATION ---
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes

# --------------------------------------

# View for new user registration (UPDATED)
class UserRegistrationView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        """
        Override perform_create to set user as inactive and send verification email.
        """
        user = serializer.save() # This calls the serializer's create() method

        # --- SEND VERIFICATION EMAIL ---
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # This is your FRONTEND URL that will handle the verification logic
        verification_link = f"http://localhost:3000/verify-email/{uid}/{token}"

        subject = "Activate Your Grievance System Account"
        message = f"""
        Hi {user.name},

        Thank you for registering. Please click the link below to activate your account:
        {verification_link}

        If you did not request this, please ignore this email.
        """
        
        send_mail(
            subject=subject,
            message=message,
            from_email="noreply@grievancesystem.com", # A placeholder from-email
            recipient_list=[user.college_email],
            fail_silently=False,
        )

# --- NEW VIEW FOR EMAIL VERIFICATION ---
class VerifyEmailAPI(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = CustomUser.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            if user.is_active:
                return Response({"message": "Account already activated."}, status=status.HTTP_200_OK)
            user.is_active = True
            user.save()
            return Response({"message": "Email verified successfully. You can now log in."}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid activation link."}, status=status.HTTP_400_BAD_REQUEST)

# --- YOUR EXISTING VIEWS (UNCHANGED) ---

class GrievanceViewSet(viewsets.ModelViewSet):
    serializer_class = GrievanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'grievance_cell']:
            return Grievance.objects.all().order_by('-created_at')
        return Grievance.objects.filter(submitted_by=user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(submitted_by=self.request.user)

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer