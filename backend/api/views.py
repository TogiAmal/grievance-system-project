from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import CustomUser, Grievance, GrievanceComment, Conversation
from .permissions import IsAdminOrGrievanceCell, IsOwner
from .serializers import (
    GrievanceSerializer, GrievanceCommentSerializer, MyTokenObtainPairSerializer,
    GrievanceStatusSerializer, UserSerializer, AdminUserCreateSerializer,
    ChangePasswordSerializer, ConversationSerializer, UserProfileUpdateSerializer
)

class GrievanceViewSet(viewsets.ModelViewSet):
    queryset = Grievance.objects.all()
    serializer_class = GrievanceSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'grievance_cell']:
            return Grievance.objects.all().order_by('-created_at')
        return Grievance.objects.filter(submitted_by=user).order_by('-created_at')
    def perform_create(self, serializer):
        title = serializer.validated_data.get('title', '').lower()
        priority = 'LOW'
        high_priority_keywords = ['urgent', 'emergency', 'harassment', 'threat', 'safety']
        if any(keyword in title for keyword in high_priority_keywords):
            priority = 'HIGH'
        grievance = serializer.save(submitted_by=self.request.user, priority=priority)
        subject = f"Grievance Submitted - Your Token ID is #{grievance.id}"
        message = f"Hi {self.request.user.name},\n\nThank you for submitting your grievance..."
        send_mail(
            subject=subject, message=message, from_email=settings.EMAIL_HOST_USER,
            recipient_list=[self.request.user.college_email], fail_silently=False
        )
    @action(detail=False, methods=['get'], permission_classes=[IsAdminOrGrievanceCell])
    def stats(self, request):
        total = Grievance.objects.count()
        resolved = Grievance.objects.filter(status='RESOLVED').count()
        pending = total - resolved
        return Response({
            'total_grievances': total, 'resolved_grievances': resolved, 'pending_grievances': pending
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

class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all().order_by('username')
    def get_serializer_class(self):
        if self.action == 'create': return AdminUserCreateSerializer
        if self.action in ['update', 'partial_update']: return UserProfileUpdateSerializer
        return UserSerializer
    def get_permissions(self):
        if self.action in ['list', 'create', 'destroy', 'change_role']:
            self.permission_classes = [IsAdminOrGrievanceCell]
        else:
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()
    @action(detail=True, methods=['patch'])
    def change_role(self, request, pk=None):
        user = self.get_object()
        new_role = request.data.get('role')
        if new_role not in [role[0] for role in CustomUser.ROLE_CHOICES]:
            return Response({'error': 'Invalid role specified'}, status=status.HTTP_400_BAD_REQUEST)
        user.role = new_role
        user.save()
        return Response(self.get_serializer(user).data)

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'grievance_cell']:
            return Conversation.objects.all().order_by('-created_at')
        Conversation.objects.get_or_create(user=user)
        return Conversation.objects.filter(user=user)

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class HealthCheckAPI(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        return Response({"status": "ok", "message": "Backend is running."})

class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    model = CustomUser
    permission_classes = [permissions.IsAuthenticated]
    def get_object(self, queryset=None):
        return self.request.user
    def update(self, request, *args, **kwargs):
        self.object = self.get_object()
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            if not self.object.check_password(serializer.data.get("old_password")):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
            self.object.set_password(serializer.data.get("new_password"))
            self.object.save()
            return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- THIS WAS MISSING ---
class RequestPasswordResetAPI(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        email = request.data.get('email')
        try:
            user = CustomUser.objects.get(college_email=email)
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            frontend_url = 'http://localhost:3000' if settings.DEBUG else 'https://grievance-frontend-3fmk.onrender.com'
            reset_link = f"{frontend_url}/reset-password/{uid}/{token}/"
            send_mail(
                'Password Reset Request',
                f'Hi {user.name},\n\nPlease click the link to reset your password:\n{reset_link}',
                settings.EMAIL_HOST_USER, [user.college_email], fail_silently=False
            )
        except CustomUser.DoesNotExist: pass
        return Response({'message': 'If an account with that email exists, a password reset link has been sent.'}, status=status.HTTP_200_OK)

class PasswordResetConfirmAPI(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request, uidb64, token):
        try:
            uid = force_bytes(urlsafe_base64_decode(uidb64))
            user = CustomUser.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist): user = None
        if user is not None and default_token_generator.check_token(user, token):
            password = request.data.get('password')
            if len(password) < 8:
                 return Response({'error': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(password)
            user.save()
            return Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'The reset link is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)