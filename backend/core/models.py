from django.contrib.auth.models import AbstractUser
from django.db import models


class Team(models.Model):
    TEAM_CHOICES = (
        ('team_a', 'Team A'),
        ('team_b', 'Team B'),
        ('team_c', 'Team C'),
        ('team_d', 'Team D'),
    )
    name = models.CharField(max_length=10, choices=TEAM_CHOICES, unique=True)

    def __str__(self):
        return self.get_name_display()


class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('staff', 'Staff'),
    )
    SPECIALIZATION_CHOICES = (
        ('frontend', 'Frontend Developer'),
        ('backend', 'Backend Developer'),
        ('full_stack', 'Full Stack Developer'),
        ('mobile_ios', 'Mobile iOS Developer'),
        ('mobile_android', 'Mobile Android Developer'),
        ('mobile_cross', 'Cross-platform Mobile Developer'),
        ('web_accessibility', 'Web Accessibility'),
        ('ui_ux', 'UI/UX Designer'),
        ('product_design', 'Product Designer'),
        ('qa_manual', 'Manual QA'),
        ('qa_automation', 'QA Automation'),
        ('test_engineer', 'Test Engineer'),
        ('devops', 'DevOps Engineer'),
        ('sre', 'Site Reliability Engineer'),
        ('cloud_engineer', 'Cloud Engineer'),
        ('platform_engineer', 'Platform Engineer'),
        ('systems_engineer', 'Systems Engineer'),
        ('network_engineer', 'Network Engineer'),
        ('security_engineer', 'Security Engineer'),
        ('appsec', 'Application Security'),
        ('netsec', 'Network Security'),
        ('data_analyst', 'Data Analyst'),
        ('data_engineer', 'Data Engineer'),
        ('data_scientist', 'Data Scientist'),
        ('ml_engineer', 'ML Engineer'),
        ('ai_engineer', 'AI Engineer'),
        ('mlops', 'MLOps Engineer'),
        ('database_admin', 'Database Administrator'),
        ('api_engineer', 'API Engineer'),
        ('software_architect', 'Software Architect'),
        ('embedded', 'Embedded Systems'),
        ('iot', 'IoT Engineer'),
        ('robotics', 'Robotics Engineer'),
        ('game_dev', 'Game Developer'),
        ('ar_vr', 'AR/VR Developer'),
        ('blockchain', 'Blockchain Developer'),
        ('devrel', 'Developer Advocate'),
        ('tech_writer', 'Technical Writer'),
        ('support_engineer', 'Support Engineer'),
        ('build_release', 'Build/Release Engineer'),
        ('infra_ops', 'Infrastructure Operations'),
        ('sys_admin', 'System Administrator'),
        ('it_support', 'IT Support'),
        ('business_analyst', 'Business Analyst'),
        ('product_manager', 'Product Manager'),
        ('gis', 'GIS Specialist'),
    )

    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='staff'
    )
    specialization = models.CharField(
        max_length=20,
        choices=SPECIALIZATION_CHOICES,
        default='frontend'
    )
    email_notifications = models.BooleanField(default=True)
    dark_mode = models.BooleanField(default=False)
    weekly_goal_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    team = models.ForeignKey(
        'Team',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='members',
    )

    def __str__(self):
        return f"{self.username} ({self.role})"


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField(blank=True)
    notification_type = models.CharField(max_length=50, default='general')
    is_read = models.BooleanField(default=False)
    data = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_read']),
        ]

    def __str__(self):
        return f"{self.title} ({self.user.username})"
    
class Project(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()

    staff = models.ManyToManyField(
        User,
        related_name='projects',
        blank=True
    )

    def __str__(self):
        return self.name

class WorkLog(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    staff = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='logs'
    )

    project = models.ForeignKey(
        Project,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    task = models.ForeignKey(
        'Task',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='logs'
    )

    title = models.CharField(max_length=255)
    date = models.DateField()
    hours = models.DecimalField(max_digits=5, decimal_places=2)

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='pending'
    )

    rejection_reason = models.TextField(blank=True)
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_logs'
    )
    rejected_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rejected_logs'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['staff', '-created_at']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['approved_by', 'approved_at']),
            models.Index(fields=['rejected_by', 'rejected_at']),
            models.Index(fields=['date']),
        ]

    def __str__(self):
        return f"{self.title} - {self.staff.username}"


class Task(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks'
    )
    title = models.CharField(max_length=255)
    required_hours = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    progress = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['project', '-created_at']),
            models.Index(fields=['project', 'assigned_to']),
            models.Index(fields=['assigned_to', 'progress']),
        ]

    def get_progress_percent(self):
        """Calculate progress based on work logs vs task's required hours"""
        if self.required_hours == 0:
            return 0
        
        total_hours = sum(
            log.hours 
            for log in self.logs.filter(status='approved')
        )
        
        progress = min(100, int((float(total_hours) / float(self.required_hours)) * 100))
        return progress

    def __str__(self):
        return f"{self.title} ({self.progress}%)"


class Report(models.Model):
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reports'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    total_logs = models.IntegerField(default=0)
    total_hours = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status_counts = models.JSONField(default=list, blank=True)
    by_project = models.JSONField(default=list, blank=True)
    by_date = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"Report {self.id} - {self.created_at.date()}"



