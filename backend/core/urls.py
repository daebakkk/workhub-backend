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
    path('projects/my/', views.my_projects),
    path('reports/summary/', views.reports_summary),
    path('admin/projects/', views.admin_projects),
    path('admin/users/', views.admin_users),
    path('admin/projects/<int:project_id>/assign/', views.assign_project_staff),
    path('admin/projects/create/', views.create_project),

]
