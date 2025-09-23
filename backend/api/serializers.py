# api/serializers.py

from rest_framework import serializers
from .models import CustomUser, Grievance, GrievanceComment
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UserRegistrationSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(style={'input_type': 'password'}, write_only=True)

    class Meta:
        model = CustomUser
        fields = (
            'name', 
            'admission_number', 
            'phone_number', 
            'college_email',
            'password', 
            'password2'
        )
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords must match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        validated_data['username'] = validated_data['admission_number']
        validated_data['role'] = 'student'

        user = CustomUser.objects.create_user(**validated_data)
        user.is_active = False # Account is inactive until email is verified
        user.save()
        
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'name', 'role')

class GrievanceCommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = GrievanceComment
        fields = ('id', 'user', 'comment_text', 'timestamp')

class GrievanceSerializer(serializers.ModelSerializer):
    submitted_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    comments = GrievanceCommentSerializer(many=True, read_only=True)
    class Meta:
        model = Grievance
        fields = (
            'id', 'title', 'description', 'status', 'created_at',
            'updated_at', 'submitted_by', 'assigned_to', 'comments'
        )

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['username'] = user.username
        token['role'] = user.role
        token['name'] = user.name
        return token

    # The custom 'validate' method has been removed to disable the admin approval check.

class GrievanceStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grievance
        fields = ['status']