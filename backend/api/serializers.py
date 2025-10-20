from rest_framework import serializers
from .models import CustomUser, Grievance, GrievanceComment, ChatMessage, Conversation
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class AdminUserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('name', 'admission_number', 'college_email', 'role', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        validated_data['username'] = validated_data['admission_number']
        user = CustomUser.objects.create_user(**validated_data)
        user.is_active = True
        user.save()
        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    def validate_new_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        return value

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'name', 'role', 'profile_image')

# --- THIS SERIALIZER WAS MISSING ---
class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('profile_image',)
# -----------------------------------

class GrievanceCommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = GrievanceComment
        fields = ('id', 'user', 'comment_text', 'timestamp')
        read_only_fields = ('user',)

class ChatMessageSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = ChatMessage
        fields = ['id', 'user', 'message', 'timestamp']

class ConversationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    messages = ChatMessageSerializer(many=True, read_only=True)
    class Meta:
        model = Conversation
        fields = ['id', 'user', 'created_at', 'messages']

class GrievanceSerializer(serializers.ModelSerializer):
    submitted_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    comments = GrievanceCommentSerializer(many=True, read_only=True)
    # chat_messages is removed, as it's now part of ConversationSerializer
    
    class Meta:
        model = Grievance
        # 'chat_status' and 'chat_messages' are removed to match your models.py
        fields = (
            'id', 'title', 'description', 'status', 'priority', 
            'created_at', 'updated_at', 'submitted_by', 'assigned_to', 
            'comments', 'evidence_image'
        )

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = user.role
        token['name'] = user.name
        return token

class GrievanceStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grievance
        fields = ['status']