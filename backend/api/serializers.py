# api/serializers.py
from rest_framework import serializers
from .models import CustomUser, Grievance, GrievanceComment, ChatMessage
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed

class UserRegistrationSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(style={'input_type': 'password'}, write_only=True)

    class Meta:
        model = CustomUser
        fields = (
            'name', 
            'admission_number', 
            'phone_number', 
            'college_email',
            'role',
            'password', 
            'password2'
        )
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords must match."})
        if len(attrs['password']) < 8:
            raise serializers.ValidationError({"password": "Password must be at least 8 characters long."})
        return attrs

    def validate_role(self, value):
        if value in ['admin', 'grievance_cell']:
            raise serializers.ValidationError("You cannot register with this role.")
        return value

    def create(self, validated_data):
        validated_data.pop('password2')
        validated_data['username'] = validated_data['admission_number']
        user = CustomUser.objects.create_user(**validated_data)
        user.is_active = False
        user.save()
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'name', 'role', 'profile_image')

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
        # CORRECTED: 'user' has been added to the fields list
        fields = ['id', 'user', 'message', 'timestamp']

class GrievanceSerializer(serializers.ModelSerializer):
    submitted_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    comments = GrievanceCommentSerializer(many=True, read_only=True)
    chat_messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = Grievance
        fields = (
            'id', 'title', 'description', 'status', 'chat_status', 
            'created_at', 'updated_at', 'submitted_by', 'assigned_to', 
            'comments', 'chat_messages', 'evidence_image'
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