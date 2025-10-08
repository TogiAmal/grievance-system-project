from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes

from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import CustomUser, Grievance, GrievanceComment
from .permissions import IsAdminOrGrievanceCell, IsOwner
from .serializers import (
    UserRegistrationSerializer,
    GrievanceSerializer,
    GrievanceCommentSerializer,
    MyTokenObtainPairSerializer,
    GrievanceStatusSerializer,
    UserSerializer
)

# ----------------------------
# User Registration and Verification
# ----------------------------
class UserRegistrationView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        if settings.DEBUG:
            frontend_url = 'http://localhost:3000'
        else:
            frontend_url = 'https://grievance-frontend-3fmk.onrender.com'
        
        verification_link = f"{frontend_url}/verify-email/{uid}/{token}"

        subject = "Activate Your Grievance System Account"
        message = f"Hi {user.name},\n\nThank you for registering. Please click the link below to activate your account:\n{verification_link}"
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[user.college_email],
            fail_silently=False,
        )

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


# ----------------------------
# Grievance Management
# ----------------------------
class GrievanceViewSet(viewsets.ModelViewSet):
    serializer_class = GrievanceSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'grievance_cell']:
            return Grievance.objects.all().order_by('-created_at')
        return Grievance.objects.filter(submitted_by=user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(submitted_by=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminOrGrievanceCell])
    def stats(self, request):
        total = Grievance.objects.count()
        resolved = Grievance.objects.filter(status='RESOLVED').count()
        pending = total - resolved
        return Response({
            'total_grievances': total,
            'resolved_grievances': resolved,
            'pending_grievances': pending
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrGrievanceCell])
    def add_comment(self, request, pk=None):
        grievance = self.get_object()
        serializer = GrievanceCommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, grievance=grievance)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'], permission_classes=[IsAdminOrGrievanceCell])
    def update_status(self, request, pk=None):
        grievance = self.get_object()
        serializer = GrievanceStatusSerializer(grievance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[IsOwner])
    def request_chat(self, request, pk=None):
        grievance = self.get_object()
        grievance.chat_status = 'REQUESTED'
        grievance.save()
        return Response({'status': 'chat requested'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrGrievanceCell])
    def respond_to_chat(self, request, pk=None):
        grievance = self.get_object()
        response = request.data.get('response')
        if response in ['ACCEPTED', 'DECLINED']:
            grievance.chat_status = response
            grievance.save()
            return Response({'status': f'chat {response.lower()}'})
        return Response({'error': 'Invalid response'}, status=status.HTTP_400_BAD_REQUEST)


# ----------------------------
# Authentication
# ----------------------------
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


# ----------------------------
# Health Check
# ----------------------------
class HealthCheckAPI(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"status": "ok", "message": "Backend is running."})


# ----------------------------
# User Management (Admin + Normal)
# ----------------------------
class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Admins or grievance cell can view all users
        if user.role in ['admin', 'grievance_cell']:
            return CustomUser.objects.all().order_by('username')
        # Regular users can view only themselves
        return CustomUser.objects.filter(id=user.id)

    @action(detail=True, methods=['patch'], permission_classes=[IsAdminOrGrievanceCell])
    def change_role(self, request, pk=None):
        user = self.get_object()
        new_role = request.data.get('role')
        if new_role not in [role[0] for role in CustomUser.ROLE_CHOICES]:
            return Response({'error': 'Invalid role specified'}, status=status.HTTP_400_BAD_REQUEST)
        user.role = new_role
        user.save()
        serializer = self.get_serializer(user)
        return Response(serializer.data)


# ----------------------------
# Current User Profile
# ----------------------------
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


# ----------------------------
# Password Reset
# ----------------------------
class RequestPasswordResetAPI(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        try:
            user = CustomUser.objects.get(college_email=email)
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            if settings.DEBUG:
                frontend_url = 'http://localhost:3000'
            else:
                frontend_url = 'https://grievance-frontend-3fmk.onrender.com'
            reset_link = f"{frontend_url}/reset-password/{uid}/{token}/"
            send_mail(
                'Password Reset Request',
                f'Hi {user.name},\n\nPlease click the link to reset your password:\n{reset_link}',
                settings.EMAIL_HOST_USER,
                [user.college_email],
                fail_silently=False
            )
        except CustomUser.DoesNotExist:
            pass
        return Response({'message': 'If an account with that email exists, a password reset link has been sent.'}, status=status.HTTP_200_OK)


class PasswordResetConfirmAPI(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, uidb64, token):
        try:
            uid = force_bytes(urlsafe_base64_decode(uidb64))
            user = CustomUser.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
            user = None
        if user is not None and default_token_generator.check_token(user, token):
            password = request.data.get('password')
            if len(password) < 8:
                return Response({'error': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(password)
            user.save()
            return Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'The reset link is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)
