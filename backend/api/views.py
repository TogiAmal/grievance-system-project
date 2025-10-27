# backend/api/views.py

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
    # queryset = Grievance.objects.all() # We define queryset dynamically in get_queryset
    serializer_class = GrievanceSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    # Correctly indented method inside the class
    def get_queryset(self):
        user = self.request.user
        queryset = Grievance.objects.all()

        # 1. Filter by user role
        if user.role not in ['admin', 'grievance_cell']:
            queryset = queryset.filter(submitted_by=user)

        # 2. Get the optional URL filter
        status_filter = self.request.query_params.get('status_filter')

        # --- UPDATED FILTER LOGIC ---
        if status_filter == 'unresolved':
            # For "Pending" page: ONLY show SUBMITTED or PENDING
            # Adjust these statuses if your model uses different initial values
            queryset = queryset.filter(status__in=['SUBMITTED', 'PENDING'])
        elif status_filter == 'resolved':
            # For "Resolved" page: Only show resolved
            queryset = queryset.filter(status='RESOLVED')
        elif status_filter == 'in_progress':
            # For "In Progress" page: Only show in_progress
            queryset = queryset.filter(status='IN_PROGRESS')
        # --- END OF UPDATED LOGIC ---

        # 3. If no filter is provided (user status page), return appropriate list

        return queryset.order_by('-created_at')

    # Correctly indented method inside the class
    def perform_create(self, serializer):
        title = serializer.validated_data.get('title', '').lower()
        priority = 'LOW' # Default priority
        # Define keywords that trigger high priority
        high_priority_keywords = ['urgent', 'emergency', 'harassment', 'threat', 'safety', 'abuse', 'immediate']
        if any(keyword in title for keyword in high_priority_keywords):
            priority = 'HIGH'

        # Set default status based on your model's definition
        default_status = 'SUBMITTED' # Or 'PENDING' if that's your model default
        grievance = serializer.save(
            submitted_by=self.request.user,
            priority=priority,
            status=default_status # Explicitly set status if needed
        )

        # Send email notification
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
            # Log the error if email sending fails
            print(f"Error sending email for grievance #{grievance.id}: {e}")


    # Correctly indented method inside the class
    @action(detail=False, methods=['get'], permission_classes=[IsAdminOrGrievanceCell])
    def stats(self, request):
        total = Grievance.objects.count()
        resolved = Grievance.objects.filter(status='RESOLVED').count()
        # More detailed count
        if user.role not in ['admin', 'grievance_cell']:
            queryset = queryset.filter(submitted_by=user)
        pending_count = Grievance.objects.filter(status__in=['SUBMITTED', 'PENDING']).count()
        in_progress_count = Grievance.objects.filter(status='IN_PROGRESS').count()
        action_taken_count = Grievance.objects.filter(status='ACTION_TAKEN').count()

        return Response({
            'total_grievances': total,
            'resolved_grievances': resolved,
            'pending_grievances': pending_count, # Use specific count
            'in_progress_grievances': in_progress_count,
            'action_taken_grievances': action_taken_count,
            'unresolved_total': pending_count + in_progress_count + action_taken_count # Sum of non-resolved
        })

    # Correctly indented method inside the class
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrGrievanceCell])
    def add_comment(self, request, pk=None):
        grievance = self.get_object()
        serializer = GrievanceCommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, grievance=grievance)
            # Potentially send email notification about comment here if needed
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Correctly indented method inside the class
    @action(detail=True, methods=['patch'], permission_classes=[IsAdminOrGrievanceCell])
    def update_status(self, request, pk=None):
        print("Received data for status update:", request.data) # Keep for debugging if needed
        grievance = self.get_object()
        serializer = GrievanceStatusSerializer(grievance, data=request.data, partial=True)
        if serializer.is_valid():
            updated_grievance = serializer.save()
            # Send email notification about status update to the user
            subject = f"Update on Grievance #{updated_grievance.id}: Status Changed"
            message = (
                f"Hi {updated_grievance.submitted_by.name},\n\n"
                f"The status of your grievance titled '{updated_grievance.title}' (ID: #{updated_grievance.id}) "
                f"has been updated to: {updated_grievance.status}.\n\n"
                f"Please check the portal for any comments or further details.\n\n"
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
        else:
            print("Serializer errors:", serializer.errors) # Keep for debugging
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- Other ViewSets remain the same ---

class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all().order_by('username')

    def get_serializer_class(self):
        if self.action == 'create':
            return AdminUserCreateSerializer
        # Use UserProfileUpdateSerializer only for specific update actions if needed
        # Or handle profile image update in a separate endpoint/action
        return UserSerializer # Default serializer

    # Inside the UserViewSet class in backend/api/views.py

    def get_permissions(self):
        # Allow authenticated users for 'me' (GET) and 'update_me' (PATCH) actions
        if self.action in ['me', 'update_me']:
            self.permission_classes = [permissions.IsAuthenticated]

        # --- NEW LOGIC: Allow users to retrieve/update THEIR OWN profile via /users/{pk}/ ---
        elif self.action in ['retrieve', 'update', 'partial_update']:
            # Get the requested user's pk from the URL
            requested_pk = self.kwargs.get('pk')
            # Check if the authenticated user's pk matches the requested pk
            if requested_pk is not None and str(self.request.user.pk) == str(requested_pk):
                 # Allow if the user is accessing their own profile
                 self.permission_classes = [permissions.IsAuthenticated]
            else:
                 # Otherwise, only Admins/GC can access/modify OTHERS' profiles
                 self.permission_classes = [IsAdminOrGrievanceCell]
        # --------------------------------------------------------------------------

        # Admins/GC can list, create, destroy, change roles
        elif self.action in ['list', 'create', 'destroy', 'change_role']:
             self.permission_classes = [IsAdminOrGrievanceCell]

        # Fallback (restrictive default)
        else:
            self.permission_classes = [permissions.IsAdminUser] # Or IsAdminOrGrievanceCell

        return super().get_permissions()

    # Action to get the current user's profile
    @action(detail=False, methods=['get'], url_path='me', permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    # Inside UserViewSet class

    # Use url_path to define the specific URL segment
    @action(detail=False, methods=['get'], url_path='grievance-cell-members', permission_classes=[permissions.AllowAny])
    def grievance_cell_members(self, request):
        """
        Public endpoint to get users with the 'grievance_cell' role.
        """
        members = CustomUser.objects.filter(role='grievance_cell').order_by('name')
        serializer = UserSerializer(members, many=True, context={'request': request})
        return Response(serializer.data)

    # Allow users to update their own profile (e.g., image)
    @action(detail=False, methods=['patch'], url_path='me/update', permission_classes=[permissions.IsAuthenticated])
    def update_me(self, request):
        user = request.user
        # Use the specific serializer for profile updates
        serializer = UserProfileUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    # Action for admin to change any user's role
    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAdminUser])
    def change_role(self, request, pk=None):
        user = self.get_object()
        new_role = request.data.get('role')
        if not new_role:
             return Response({'error': 'Role not specified'}, status=status.HTTP_400_BAD_REQUEST)
        if new_role not in [role[0] for role in CustomUser.ROLE_CHOICES]:
            return Response({'error': 'Invalid role specified'}, status=status.HTTP_400_BAD_REQUEST)

        # Prevent admin from changing their own role this way or demoting other admins easily
        if user == request.user and new_role != 'admin':
             return Response({'error': 'Admins cannot change their own role via this endpoint.'}, status=status.HTTP_403_FORBIDDEN)
        # Add more checks if needed (e.g., only one superadmin)

        user.role = new_role
        user.save()
        return Response(self.get_serializer(user).data)

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'grievance_cell']:
            # Admin/GC can see all conversations
            return Conversation.objects.all().order_by('-created_at')
        else:
            # Students see only their own conversation (create if not exists)
            Conversation.objects.get_or_create(user=user)
            return Conversation.objects.filter(user=user)

    # You might want actions here for admins/GC to send messages

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
        # Ensures the user is updating their own password
        return self.request.user

    def update(self, request, *args, **kwargs):
        self.object = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            # Check old password
            if not self.object.check_password(serializer.validated_data.get("old_password")):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
            # Set new password
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
            # Use filter().first() to avoid exception if not found
            user = CustomUser.objects.filter(college_email=email).first()
            if user:
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                # Determine frontend URL based on environment (DEBUG or production)
                frontend_base_url = 'http://localhost:3000' if settings.DEBUG else 'https://grievance-frontend-3fmk.onrender.com' # Replace with your actual production frontend URL
                reset_link = f"{frontend_base_url}/reset-password/{uid}/{token}/"

                # Send email
                subject = 'Password Reset Request for Grievance Portal'
                message = (
                    f'Hi {user.name or user.username},\n\n'
                    f'You requested a password reset for your account.\n'
                    f'Please click the link below to set a new password:\n\n'
                    f'{reset_link}\n\n'
                    f'If you did not request this, please ignore this email.\n\n'
                    f'Regards,\nGrievance Portal Team'
                )
                try:
                    send_mail(
                        subject, message, settings.EMAIL_HOST_USER,
                        [user.college_email], fail_silently=False
                    )
                except Exception as e:
                    print(f"Error sending password reset email to {email}: {e}")
                    # You might want to return a generic error here in production
                    # return Response({'error': 'Failed to send reset email.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            # Catch potential errors during user lookup or token generation
            print(f"Error during password reset request for {email}: {e}")
            # In production, avoid revealing specific errors

        # Always return a generic success message to prevent email enumeration attacks
        return Response({'message': 'If an account with that email exists, a password reset link has been sent.'}, status=status.HTTP_200_OK)


class PasswordResetConfirmAPI(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = CustomUser.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist, UnicodeDecodeError):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            password = request.data.get('password')
            confirm_password = request.data.get('confirm_password')

            if not password or not confirm_password:
                 return Response({'error': 'Both password fields are required.'}, status=status.HTTP_400_BAD_REQUEST)
            if password != confirm_password:
                 return Response({'error': 'Passwords do not match.'}, status=status.HTTP_400_BAD_REQUEST)
            if len(password) < 8: # Add password validation if needed
                 return Response({'error': 'Password must be at least 8 characters long.'}, status=status.HTTP_400_BAD_REQUEST)

            # Reset the password
            user.set_password(password)
            user.save()
            return Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)
        else:
            # Invalid token or user
            return Response({'error': 'The reset link is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)