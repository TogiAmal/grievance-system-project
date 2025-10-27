# backend/api/serializers.py

from rest_framework import serializers
from .models import CustomUser, Grievance, GrievanceComment, ChatMessage, Conversation
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class AdminUserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        # Include fields needed for creation by admin
        fields = ('name', 'admission_number', 'college_email', 'role', 'password', 'designation', 'phone_number')
        extra_kwargs = {
            'password': {'write_only': True},
            # Make designation/phone optional on creation if desired
            'designation': {'required': False, 'allow_blank': True, 'allow_null': True},
            'phone_number': {'required': False, 'allow_blank': True, 'allow_null': True},
            'name': {'required': False, 'allow_blank': True, 'allow_null': True}, # Optional name
         }

    def create(self, validated_data):
        # Set username from admission number
        validated_data['username'] = validated_data['admission_number']
        # Use create_user to handle password hashing
        user = CustomUser.objects.create_user(**validated_data)
        # Ensure user is active upon creation by admin
        user.is_active = True
        user.save()
        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)
    # Optional: Add confirmation field if needed on backend (usually frontend handles this)
    # confirm_new_password = serializers.CharField(required=True, write_only=True)

    def validate_new_password(self, value):
        # Add password validation rules if needed (e.g., complexity)
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        return value

    # Optional: Add validation for matching confirmation password
    # def validate(self, data):
    #     if data['new_password'] != data['confirm_new_password']:
    #         raise serializers.ValidationError({"confirm_new_password": "Passwords do not match."})
    #     return data

class UserSerializer(serializers.ModelSerializer):
    # Serializer primarily used for reading user data (GET requests)
    class Meta:
        model = CustomUser
        # Include all relevant fields needed for display
        fields = (
            'id',
            'username', # Typically admission number
            'name',
            'role',
            'college_email',
            'profile_image', # Will provide the URL path
            'phone_number',
            'designation',
            'is_active', # Useful for admin views
            'date_joined',
            'last_login'
        )
        # Fields that shouldn't typically be changed via this serializer directly
        read_only_fields = ('username', 'role', 'is_active', 'date_joined', 'last_login')

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    # Serializer used for updating specific user fields,
    # often by admins for other users, or by users for themselves (via /me/update/)
    class Meta:
        model = CustomUser
        # Fields that can be updated via PATCH requests
        fields = (
            'name',
            'phone_number',
            'designation',
            'profile_image' # Handles file upload via multipart/form-data
        )
        extra_kwargs = {
            # Make fields optional for PATCH requests
            'name': {'required': False, 'allow_blank': True, 'allow_null': True},
            'phone_number': {'required': False, 'allow_blank': True, 'allow_null': True},
            'designation': {'required': False, 'allow_blank': True, 'allow_null': True},
            'profile_image': {'required': False, 'allow_null': True} # Image upload is optional
        }

class GrievanceCommentSerializer(serializers.ModelSerializer):
    # Embed basic user info for the commenter
    user = UserSerializer(read_only=True)
    class Meta:
        model = GrievanceComment
        fields = ('id', 'user', 'comment_text', 'timestamp')
        # Only comment_text is typically writable when creating a comment
        read_only_fields = ('user', 'timestamp', 'id')

class ChatMessageSerializer(serializers.ModelSerializer):
    # Embed basic user info for the message sender
    user = UserSerializer(read_only=True)
    class Meta:
        model = ChatMessage
        fields = ('id', 'user', 'message', 'timestamp')
        read_only_fields = ('user', 'timestamp', 'id')

class ConversationSerializer(serializers.ModelSerializer):
    # Embed info of the user associated with the conversation (usually the student)
    user = UserSerializer(read_only=True)
    # Embed related messages, potentially limited or paginated in the view if needed
    messages = ChatMessageSerializer(many=True, read_only=True)
    class Meta:
        model = Conversation
        fields = ('id', 'user', 'created_at', 'messages')
        read_only_fields = ('user', 'created_at', 'messages', 'id')

class GrievanceSerializer(serializers.ModelSerializer):
    # Embed details of the submitting user and potentially assigned user
    submitted_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True, allow_null=True) # Allow null if not assigned
    # Embed comments related to the grievance
    comments = GrievanceCommentSerializer(many=True, read_only=True)

    class Meta:
        model = Grievance
        # Define fields to include in GET requests
        fields = (
            'id', 'title', 'description', 'status', 'priority',
            'created_at', 'updated_at', 'submitted_by', 'assigned_to',
            'comments', 'evidence_image' # Will provide URL path
        )
        # Fields that are set automatically or read-only in standard GET/POST
        read_only_fields = ('id', 'created_at', 'updated_at', 'submitted_by', 'assigned_to', 'comments')
        # Fields required when creating (POST) a grievance
        # Note: 'status' and 'priority' often have defaults or are set in perform_create
        # Note: 'evidence_image' is handled via multipart/form-data
        # extra_kwargs can define write-only fields if needed, e.g., for assigning users via ID on PUT/PATCH

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    # Add custom claims to the JWT access token payload
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['username'] = user.username
        token['role'] = user.role
        token['name'] = user.name or user.username # Use name or fallback
        # Add other non-sensitive info if needed by frontend, but keep payload small
        return token

class GrievanceStatusSerializer(serializers.ModelSerializer):
    # Specific serializer for updating only the status field via PATCH
    class Meta:
        model = Grievance
        fields = ('status',) # Only allow status updates via this serializer

    # Add validation if needed to ensure status transitions are valid
    # def validate_status(self, value):
    #    instance = self.instance # The grievance being updated
    #    # Add logic here, e.g., prevent moving from RESOLVED back to PENDING
    #    if instance and instance.status == 'RESOLVED' and value != 'RESOLVED':
    #        raise serializers.ValidationError("Cannot change status once resolved.")
    #    return value