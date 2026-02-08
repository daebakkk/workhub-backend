from django.urls import path
from . import views

urlpatterns = [
    path('logs/submit/', views.submit_log),
    path('logs/my/', views.my_logs),
    path('logs/pending/', views.pending_logs),
    path('logs/<int:log_id>/approve/', views.approve_log),
    path('logs/<int:log_id>/reject/', views.reject_log),
    path('auth/register/', views.register),
    path('auth/login/', views.login),
    path('auth/refresh/', views.refresh_token),
    path('projects/my/', views.my_projects),
    path('reports/summary/', views.reports_summary),
    path('reports/', views.list_reports),
    path('reports/create/', views.create_report),
    path('admin/projects/', views.admin_projects),
    path('admin/users/', views.admin_users),
    path('admin/projects/<int:project_id>/assign/', views.assign_project_staff),
    path('admin/projects/create/', views.create_project),
    path('projects/<int:project_id>/tasks/', views.project_tasks),
    path('tasks/<int:task_id>/', views.update_task),

]
