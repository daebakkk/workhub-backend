from django.shortcuts import render, get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework.exceptions import ValidationError
from django.contrib.auth import authenticate
from .serializers import RegisterSerializer, UserSerializer, NotificationSerializer


from .models import Project, WorkLog, User, Report, Task, Notification
from .serializers import ProjectSerializer, WorkLogSerializer, ReportSerializer, TaskSerializer
from django.db.models import Count, Q, Sum
from django.utils import timezone
from datetime import timedelta

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_log(request):
    data = request.data

    log = WorkLog.objects.create(
        staff=request.user,
        project_id=data.get('project'),
        title=data.get('title'),
        date=data.get('date'),
        hours=data.get('hours'),
        status='approved' if request.user.role == 'admin' else 'pending',
    )

    # Weekly goal notification (once per week)
    goal = float(request.user.weekly_goal_hours or 0)
    if goal > 0:
        today = timezone.now().date()
        # Only notify on Saturday (weekday 5)
        if today.weekday() == 5:
            week_start = today - timedelta(days=today.weekday())
            week_end = week_start + timedelta(days=6)
            total_hours = (
                WorkLog.objects.filter(
                    staff=request.user,
                    date__gte=week_start,
                    date__lte=week_end,
                )
                .aggregate(total=Sum('hours'))['total']
                or 0
            )
            if float(total_hours) >= goal:
                week_key = week_start.isoformat()
                already_notified = Notification.objects.filter(
                    user=request.user,
                    notification_type='weekly_goal_reached',
                    data__contains={'week_start': week_key},
                ).exists()
                if not already_notified:
                    Notification.objects.create(
                        user=request.user,
                        title='Weekly goal reached',
                        message='You hit your weekly hours goal. Great work!',
                        notification_type='weekly_goal_reached',
                        data={'week_start': week_key, 'hours': float(total_hours)},
                    )

    serializer = WorkLogSerializer(log)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_logs(request):
    logs = WorkLog.objects.filter(staff=request.user).order_by('-created_at')
    serializer = WorkLogSerializer(logs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_logs(request):
    if request.user.role != 'admin':
        return Response({'detail': 'Not allowed'}, status=403)

    logs = WorkLog.objects.filter(status='pending').exclude(staff=request.user)
    serializer = WorkLogSerializer(logs, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_log(request, log_id):
    if request.user.role != 'admin':
        return Response({'detail': 'Not allowed'}, status=403)

    log = WorkLog.objects.get(id=log_id)
    log.status = 'approved'
    log.rejection_reason = ''
    log.save()
    Notification.objects.create(
        user=log.staff,
        title='Log approved',
        message=f'"{log.title}" was approved.',
        notification_type='log_approved',
        data={'log_id': log.id},
    )

    return Response({'message': 'Log approved'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_log(request, log_id):
    if request.user.role != 'admin':
        return Response({'detail': 'Not allowed'}, status=403)

    log = WorkLog.objects.get(id=log_id)
    log.status = 'rejected'
    log.rejection_reason = request.data.get('reason', '')
    log.save()
    Notification.objects.create(
        user=log.staff,
        title='Log rejected',
        message=f'"{log.title}" was rejected.',
        notification_type='log_rejected',
        data={'log_id': log.id},
    )

    return Response({'message': 'Log rejected'})

@api_view(['POST'])
def register(request):
    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()
        return Response(UserSerializer(user).data, status=201)

    return Response(serializer.errors, status=400)

@api_view(['POST'])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)

    if user is None:
        return Response({'detail': 'Invalid credentials'}, status=401)

    refresh = RefreshToken.for_user(user)

    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data
    })

@api_view(['POST'])
def refresh_token(request):
    serializer = TokenRefreshSerializer(data=request.data)
    try:
        serializer.is_valid(raise_exception=True)
    except ValidationError:
        return Response({'detail': 'Invalid refresh token'}, status=401)
    return Response(serializer.validated_data, status=200)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_settings(request):
    if request.method == 'GET':
        return Response(UserSerializer(request.user).data)

    data = request.data or {}
    email_notifications = data.get('email_notifications')
    dark_mode = data.get('dark_mode')
    specialization = data.get('specialization')
    weekly_goal_hours = data.get('weekly_goal_hours')

    if isinstance(email_notifications, bool):
        request.user.email_notifications = email_notifications
    if isinstance(dark_mode, bool):
        request.user.dark_mode = dark_mode
    if isinstance(specialization, str) and specialization:
        request.user.specialization = specialization
    if weekly_goal_hours is not None:
        try:
            request.user.weekly_goal_hours = float(weekly_goal_hours)
        except (TypeError, ValueError):
            pass

    request.user.save()
    return Response(UserSerializer(request.user).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    current_password = request.data.get('current_password', '')
    new_password = request.data.get('new_password', '')

    if not request.user.check_password(current_password):
        return Response({'detail': 'Current password is incorrect'}, status=400)
    if len(new_password) < 6:
        return Response({'detail': 'New password is too short'}, status=400)

    request.user.set_password(new_password)
    request.user.save()
    return Response({'message': 'Password updated'})

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Project
from .serializers import ProjectSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_projects(request):
    projects = (
        Project.objects.filter(staff=request.user)
        .annotate(
            total_tasks=Count('tasks', distinct=True),
            completed_tasks=Count('tasks', filter=Q(tasks__is_completed=True), distinct=True),
        )
        .order_by('name')
    )
    serializer = ProjectSerializer(projects, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reports_summary(request):
    if request.user.role != 'admin':
        return Response({'detail': 'Not allowed'}, status=403)

    logs = WorkLog.objects.select_related('project', 'staff').all()
    total_logs = logs.count()
    total_hours = logs.aggregate(total=Sum('hours'))['total'] or 0

    status_counts = logs.values('status').annotate(count=Count('id'))
    by_project = (
        logs.values('project__name')
        .annotate(hours=Sum('hours'), count=Count('id'))
        .order_by('-hours')
    )
    by_date = (
        logs.values('date')
        .annotate(hours=Sum('hours'), count=Count('id'))
        .order_by('-date')
    )

    return Response({
        'total_logs': total_logs,
        'total_hours': float(total_hours),
        'status_counts': list(status_counts),
        'by_project': list(by_project),
        'by_date': list(by_date),
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_report(request):
    if request.user.role != 'admin':
        return Response({'detail': 'Not allowed'}, status=403)

    logs = WorkLog.objects.select_related('project', 'staff').all()
    total_logs = logs.count()
    total_hours = logs.aggregate(total=Sum('hours'))['total'] or 0

    status_counts = list(logs.values('status').annotate(count=Count('id')))
    by_project = list(
        logs.values('project__name')
        .annotate(hours=Sum('hours'), count=Count('id'))
        .order_by('-hours')
    )
    for row in by_project:
        row['hours'] = float(row['hours'] or 0)

    by_date = list(
        logs.values('date')
        .annotate(hours=Sum('hours'), count=Count('id'))
        .order_by('-date')
    )
    for row in by_date:
        row['hours'] = float(row['hours'] or 0)
        row['date'] = row['date'].isoformat() if row['date'] else None

    report = Report.objects.create(
        created_by=request.user,
        total_logs=total_logs,
        total_hours=float(total_hours or 0),
        status_counts=status_counts,
        by_project=by_project,
        by_date=by_date,
    )
    serializer = ReportSerializer(report)
    staff_users = User.objects.filter(role='staff')
    for staff in staff_users:
        Notification.objects.create(
            user=staff,
            title='New report available',
            message='A new report has been generated.',
            notification_type='report_ready',
            data={'report_id': report.id},
        )
    return Response(serializer.data, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications_list(request):
    notifications = Notification.objects.filter(user=request.user).order_by('-created_at')[:20]
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def notifications_mark_all_read(request):
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({'message': 'Notifications cleared'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_reports(request):
    reports = Report.objects.order_by('-created_at')
    serializer = ReportSerializer(reports, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_projects(request):
    if request.user.role != 'admin':
        return Response({'detail': 'Not allowed'}, status=403)

    projects = (
        Project.objects.all()
        .annotate(
            total_tasks=Count('tasks', distinct=True),
            completed_tasks=Count('tasks', filter=Q(tasks__is_completed=True), distinct=True),
        )
        .order_by('name')
    )
    serializer = ProjectSerializer(projects, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_users(request):
    if request.user.role != 'admin':
        return Response({'detail': 'Not allowed'}, status=403)

    users = User.objects.filter(role='staff').order_by('first_name', 'last_name', 'username')
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def staff_users(request):
    users = User.objects.filter(role='staff').order_by('first_name', 'last_name', 'username')
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_project_staff(request, project_id):
    if request.user.role != 'admin':
        return Response({'detail': 'Not allowed'}, status=403)

    user_ids = request.data.get('user_ids', [])
    if not isinstance(user_ids, list):
        return Response({'detail': 'user_ids must be a list'}, status=400)

    project = Project.objects.get(id=project_id)
    project.staff.set(User.objects.filter(id__in=user_ids))
    project.save()

    return Response({'message': 'Project assignments updated'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_project(request):
    name = request.data.get('name', '').strip()
    description = request.data.get('description', '').strip()
    assign_self = request.data.get('assign_self', False)
    user_ids = request.data.get('user_ids', []) or []
    tasks = request.data.get('tasks', []) or []

    if not name:
        return Response({'detail': 'Project name is required'}, status=400)

    project = Project.objects.create(name=name, description=description)
    if request.user.role != 'admin' or assign_self is True:
        project.staff.add(request.user)
    if request.user.role == 'admin' and isinstance(user_ids, list) and user_ids:
        staff_users = User.objects.filter(id__in=user_ids, role='staff')
        project.staff.add(*staff_users)
        for staff in staff_users:
            Notification.objects.create(
                user=staff,
                title='Assigned to project',
                message=f'You were added to \"{project.name}\".',
                notification_type='project_assigned',
                data={'project_id': project.id},
            )
    if request.user.role != 'admin' and isinstance(user_ids, list) and user_ids:
        staff_users = User.objects.filter(id__in=user_ids, role='staff').exclude(id=request.user.id)
        project.staff.add(*staff_users)
        for staff in staff_users:
            Notification.objects.create(
                user=staff,
                title='Assigned to project',
                message=f'You were added to \"{project.name}\".',
                notification_type='project_assigned',
                data={'project_id': project.id},
            )
    if isinstance(tasks, list) and tasks:
        seen = set()
        task_items = []
        for item in tasks:
            if not isinstance(item, str):
                continue
            title = item.strip()
            if not title or title in seen:
                continue
            seen.add(title)
            task_items.append(Task(project=project, title=title))
        if task_items:
            Task.objects.bulk_create(task_items)
    serializer = ProjectSerializer(project)
    return Response(serializer.data, status=201)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def project_tasks(request, project_id):
    project = get_object_or_404(Project, id=project_id)

    if request.user.role != 'admin' and request.user not in project.staff.all():
        return Response({'detail': 'Not allowed'}, status=403)

    if request.method == 'GET':
        tasks = Task.objects.filter(project=project).order_by('-created_at')
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

    if request.user not in project.staff.all():
        return Response({'detail': 'Not allowed'}, status=403)

    title = request.data.get('title', '').strip()
    if not title:
        return Response({'detail': 'Task title is required'}, status=400)

    task = Task.objects.create(project=project, title=title)
    serializer = TaskSerializer(task)
    return Response(serializer.data, status=201)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_task(request, task_id):
    task = get_object_or_404(Task, id=task_id)
    if request.user not in task.project.staff.all():
        return Response({'detail': 'Not allowed'}, status=403)
    is_completed = request.data.get('is_completed')
    if isinstance(is_completed, bool):
        task.is_completed = is_completed
        task.save()
    serializer = TaskSerializer(task)
    return Response(serializer.data)
