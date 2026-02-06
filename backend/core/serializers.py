from rest_framework import serializers
from .models import User, Project, WorkLog, Task
from django.contrib.auth import authenticate

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role')


class ProjectSerializer(serializers.ModelSerializer):
    staff = UserSerializer(many=True, read_only=True)
    total_tasks = serializers.IntegerField(read_only=True)
    completed_tasks = serializers.IntegerField(read_only=True)
    completion_percent = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = (
            'id',
            'name',
            'description',
            'staff',
            'total_tasks',
            'completed_tasks',
            'completion_percent',
        )

    def get_completion_percent(self, obj):
        total = getattr(obj, 'total_tasks', 0) or 0
        completed = getattr(obj, 'completed_tasks', 0) or 0
        if total == 0:
            return 0
        return round((completed / total) * 100)


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


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ('id', 'title', 'is_completed', 'created_at', 'project')
