from django.contrib import admin
from .models import User, Project, WorkLog

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

