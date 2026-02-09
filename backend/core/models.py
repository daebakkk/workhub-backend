from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('staff', 'Staff'),
    )
    SPECIALIZATION_CHOICES = (
        ('frontend', 'Frontend'),
        ('backend', 'Backend'),
        ('full_stack', 'Full Stack'),
        ('data_analyst', 'Data Analyst'),
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

    def __str__(self):
        return f"{self.username} ({self.role})"
    
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

    title = models.CharField(max_length=255)
    date = models.DateField()
    hours = models.DecimalField(max_digits=5, decimal_places=2)

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='pending'
    )

    rejection_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.staff.username}"


class Task(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    title = models.CharField(max_length=255)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({'done' if self.is_completed else 'open'})"


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



