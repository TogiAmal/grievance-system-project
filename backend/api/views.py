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

# -------------------------------------------------------------------
# GRIEVANCE VIEWSET
# -------------------------------------------------------------------
class GrievanceViewSet(viewsets.ModelViewSet):
    serializer_class = GrievanceSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        user = self.request.user
        queryset = Grievance.objects.all()

        if user.role not in ['admin', 'grievance_cell']:
            queryset = queryset.filter(submitted_by=user)

        status_filter = self.request.query_params.get('status_filter')
        if status_filter == 'unresolved':
            queryset = queryset.filter(status__in=['SUBMITTED', 'PENDING'])
        elif status_filter == 'resolved':
            queryset = queryset.filter(status='RESOLVED')
        elif status_filter == 'in_progress':
            queryset = queryset.filter(status='IN_PROGRESS')

        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        title = serializer.validated_data.get('title', '').lower()
        priority = 'LOW'
        high_priority_keywords = ['urgent', 'emergency', 'harassment', 'threat', 'safety', 'abuse', 'immediate']
        if any(keyword in title for keyword in high_priority_keywords):
            priority = 'HIGH'

        default_status = 'SUBMITTED'
        grievance = serializer.save(
            submitted_by=self.request.user,
            priority=priority,
            status=default_status
        )

        subject = f"Grievance Submitted - Your Token ID is #{grievance.id}"
        message = (
            f"Hi {self.request.user.name},\n\n"
            f"Thank you for submitting your grievance titled '{grievance.title}'.\n"
            f"Your reference ID is #{grievance.id}.\n\n"
            f"Current Status: {grievance.status}\n"
            f"Priority: {grievance.priority}\n\n"
            f"We will review your submission and provide updates.\n\n"
            f"Regards,\nGrievance Portal Team"
        )
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[self.request.user.college_email],
                fail_silently=False
            )
        except Exception as e:
            print(f"Error sending email for grievance #{grievance.id}: {e}")

    @action(detail=False, methods=['get'], permission_classes=[IsAdminOrGrievanceCell])
    def stats(self, request):
        user = request.user  # ✅ FIX: define user
        queryset = Grievance.objects.all()

        if user.role not in ['admin', 'grievance_cell']:
            queryset = queryset.filter(submitted_by=user)

        total = queryset.count()
        resolved = queryset.filter(status='RESOLVED').count()
        pending_count = queryset.filter(status__in=['SUBMITTED', 'PENDING']).count()
        in_progress_count = queryset.filter(status='IN_PROGRESS').count()
        action_taken_count = queryset.filter(status='ACTION_TAKEN').count()

        return Response({
            'total_grievances': total,
            'resolved_grievances': resolved,
            'pending_grievances': pending_count,
            'in_progress_grievances': in_progress_count,
            'action_taken_grievances': action_taken_count,
            'unresolved_total': pending_count + in_progress_count + action_taken_count
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
            updated_grievance = serializer.save()

            subject = f"Update on Grievance #{updated_grievance.id}: Status Changed"
            message = (
                f"Hi {updated_grievance.submitted_by.name},\n\n"
                f"The status of your grievance titled '{updated_grievance.title}' (ID: #{updated_grievance.id}) "
                f"has been updated to: {updated_grievance.status}.\n\n"
                f"Please check the portal for further details.\n\n"
                f"Regards,\nGrievance Portal Team"
            )
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[updated_grievance.submitted_by.college_email],
                    fail_silently=False
                )
            except Exception as e:
                print(f"Error sending status update email for grievance #{updated_grievance.id}: {e}")

            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# -------------------------------------------------------------------
# USER VIEWSET
# -------------------------------------------------------------------
class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all().order_by('username')

    def get_serializer_class(self):
        if self.action == 'create':
            return AdminUserCreateSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action in ['me', 'update_me']:
            self.permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['retrieve', 'update', 'partial_update']:
            requested_pk = self.kwargs.get('pk')
            if requested_pk is not None and str(self.request.user.pk) == str(requested_pk):
                self.permission_classes = [permissions.IsAuthenticated]
            else:
                self.permission_classes = [IsAdminOrGrievanceCell]
        elif self.action in ['list', 'create', 'destroy', 'change_role']:
            self.permission_classes = [IsAdminOrGrievanceCell]
        elif self.action == 'grievance_cell_members':  # ✅ FIX: allow public access
            self.permission_classes = [permissions.AllowAny]
        else:
            self.permission_classes = [permissions.IsAdminUser]
        return super().get_permissions()

    @action(detail=False, methods=['get'], url_path='me', permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='grievance-cell-members', permission_classes=[permissions.AllowAny])
    def grievance_cell_members(self, request):
        members = CustomUser.objects.filter(role='grievance_cell').order_by('name')
        serializer = UserSerializer(members, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['patch'], url_path='me/update', permission_classes=[permissions.IsAuthenticated])
    def update_me(self, request):
        user = request.user
        serializer = UserProfileUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAdminUser])
    def change_role(self, request, pk=None):
        user = self.get_object()
        new_role = request.data.get('role')
        if not new_role:
            return Response({'error': 'Role not specified'}, status=status.HTTP_400_BAD_REQUEST)
        if new_role not in [role[0] for role in CustomUser.ROLE_CHOICES]:
            return Response({'error': 'Invalid role specified'}, status=status.HTTP_400_BAD_REQUEST)
        if user == request.user and new_role != 'admin':
            return Response({'error': 'Admins cannot change their own role.'}, status=status.HTTP_403_FORBIDDEN)
        user.role = new_role
        user.save()
        return Response(self.get_serializer(user).data)


# -------------------------------------------------------------------
# CONVERSATION VIEWSET
# -------------------------------------------------------------------
class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'grievance_cell']:
            return Conversation.objects.all().order_by('-created_at')
        else:
            Conversation.objects.get_or_create(user=user)
            return Conversation.objects.filter(user=user)


# -------------------------------------------------------------------
# AUTH & MISC VIEWSETS
# -------------------------------------------------------------------
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
            if not self.object.check_password(serializer.validated_data.get("old_password")):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
            self.object.set_password(serializer.validated_data.get("new_password"))
            self.object.save()
            return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RequestPasswordResetAPI(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = CustomUser.objects.filter(college_email=email).first()
            if user:
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                frontend_base_url = 'http://localhost:3000' if settings.DEBUG else 'https://grievance-frontend-3fmk.onrender.com'
                reset_link = f"{frontend_base_url}/reset-password/{uid}/{token}/"
                subject = 'Password Reset Request for Grievance Portal'
                message = (
                    f'Hi {user.name or user.username},\n\n'
                    f'You requested a password reset.\n'
                    f'Please click the link below to set a new password:\n\n'
                    f'{reset_link}\n\n'
                    f'If you did not request this, please ignore this email.\n\n'
                    f'Regards,\nGrievance Portal Team'
                )
                send_mail(subject, message, settings.EMAIL_HOST_USER, [user.college_email], fail_silently=False)
        except Exception as e:
            print(f"Error during password reset request for {email}: {e}")

        return Response({'message': 'If an account with that email exists, a password reset link has been sent.'}, status=status.HTTP_200_OK)


class PasswordResetConfirmAPI(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = CustomUser.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist, UnicodeDecodeError):
            user = None

        if user and default_token_generator.check_token(user, token):
            password = request.data.get('password')
            confirm_password = request.data.get('confirm_password')
            if not password or not confirm_password:
                return Response({'error': 'Both password fields are required.'}, status=status.HTTP_400_BAD_REQUEST)
            if password != confirm_password:
                return Response({'error': 'Passwords do not match.'}, status=status.HTTP_400_BAD_REQUEST)
            if len(password) < 8:
                return Response({'error': 'Password must be at least 8 characters long.'}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(password)
            user.save()
            return Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)

        return Response({'error': 'The reset link is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)
