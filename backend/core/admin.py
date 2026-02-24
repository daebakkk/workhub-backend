from django.contrib import admin
from .models import User, Project, WorkLog, Task

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role')
    list_filter = ('role',)
    search_fields = ('username', 'email')


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name',)
    filter_horizontal = ('staff',)


@admin.register(WorkLog)
class WorkLogAdmin(admin.ModelAdmin):
    list_display = ('title', 'staff', 'project', 'status', 'date', 'hours')
    list_filter = ('status', 'project')
    search_fields = ('title', 'staff__username')


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'is_completed', 'created_at')
    list_filter = ('is_completed', 'project')
    search_fields = ('title', 'project__name')

