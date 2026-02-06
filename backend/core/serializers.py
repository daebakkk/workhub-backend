from rest_framework import serializers
from .models import User, Project, WorkLog
from django.contrib.auth import authenticate

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role')


class ProjectSerializer(serializers.ModelSerializer):
    staff = UserSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ('id', 'name', 'description', 'staff')


class WorkLogSerializer(serializers.ModelSerializer):
    staff = UserSerializer(read_only=True)
    project = ProjectSerializer(read_only=True)

    class Meta:
        model = WorkLog
        fields = (
            'id',
            'title',
            'date',
            'hours',
            'status',
            'rejection_reason',
            'created_at',
            'staff',
            'project',
        )

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name', 'role')

    def validate_email(self, value):
        allowed_domain = "@thefifthlab.com"
        if not value.endswith(allowed_domain):
            raise serializers.ValidationError(
                f"Email must end with {allowed_domain}"
            )
        return value
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'staff'),
        )
        return user
