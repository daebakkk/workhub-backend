from rest_framework import serializers
from .models import User, Project, WorkLog, Task, Report, Notification
from django.contrib.auth import authenticate
from django.db.models import Sum

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'specialization',
            'email_notifications',
            'dark_mode',
            'weekly_goal_hours',
        )


class ProjectSerializer(serializers.ModelSerializer):
    staff = UserSerializer(many=True, read_only=True)
    total_tasks = serializers.SerializerMethodField()
    completed_tasks = serializers.SerializerMethodField()
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
        total = self.get_total_tasks(obj)
        completed = self.get_completed_tasks(obj)
        if total == 0:
            return 0
        return round((completed / total) * 100)

    def get_total_tasks(self, obj):
        annotated = getattr(obj, 'total_tasks', None)
        if annotated is not None:
            return annotated
        return obj.tasks.count()

    def get_completed_tasks(self, obj):
        annotated = getattr(obj, 'completed_tasks', None)
        if annotated is not None:
            return annotated
        return obj.tasks.filter(progress__gte=100).count()


class WorkLogSerializer(serializers.ModelSerializer):
    staff = UserSerializer(read_only=True)
    project = ProjectSerializer(read_only=True)
    approved_by = UserSerializer(read_only=True)
    rejected_by = UserSerializer(read_only=True)

    class Meta:
        model = WorkLog
        fields = (
            'id',
            'title',
            'date',
            'hours',
            'status',
            'rejection_reason',
            'approved_by',
            'rejected_by',
            'approved_at',
            'rejected_at',
            'created_at',
            'staff',
            'project',
        )

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = (
            'username',
            'email',
            'password',
            'first_name',
            'last_name',
            'role',
            'specialization',
            'weekly_goal_hours',
        )

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
            specialization=validated_data.get('specialization', 'frontend'),
            weekly_goal_hours=validated_data.get('weekly_goal_hours', 0),
        )
        return user


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = (
            'id',
            'title',
            'message',
            'notification_type',
            'is_read',
            'data',
            'created_at',
        )


class TaskSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)
    progress_percent = serializers.SerializerMethodField()
    current_hours = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = ('id', 'title', 'required_hours', 'progress', 'progress_percent', 'current_hours', 'created_at', 'project', 'assigned_to')
    
    def get_progress_percent(self, obj):
        return obj.get_progress_percent()
    
    def get_current_hours(self, obj):
        return obj.logs.filter(status='approved').aggregate(total=Sum('hours'))['total'] or 0


class ReportSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Report
        fields = (
            'id',
            'created_at',
            'created_by',
            'total_logs',
            'total_hours',
            'status_counts',
            'by_project',
            'by_date',
        )
