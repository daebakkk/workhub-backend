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
from django.db.models import Count, F, Q, Sum
from django.db.utils import OperationalError, ProgrammingError
from django.db import DatabaseError
from django.db.models.functions import TruncMonth, TruncWeek
from django.utils import timezone
from datetime import timedelta

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_log(request):
    try:
        data = request.data

        log = WorkLog.objects.create(
            staff=request.user,
            project_id=data.get('project'),
            task_id=data.get('task'),
            title=data.get('title'),
            date=data.get('date'),
            hours=data.get('hours'),
            status='approved' if request.user.role == 'admin' else 'pending',
        )
        if request.user.role == 'admin':
            log.approved_by = request.user
            log.approved_at = timezone.now()
            log.save()
            _sync_task_progress(log)

        # Weekly goal notification (once per week)
        goal = float(request.user.weekly_goal_hours or 0)
        if goal > 0 and request.user.email_notifications:
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
    except Exception as e:
        return Response({'detail': f'Error creating log: {str(e)}'}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_logs(request):
    try:
        logs = (
            WorkLog.objects.filter(staff=request.user)
            .select_related('staff', 'project', 'approved_by', 'rejected_by', 'task')
            .prefetch_related('project__staff')
            .order_by('-created_at')
        )
        serializer = WorkLogSerializer(logs, many=True)
        return Response(serializer.data)
    except (ProgrammingError, OperationalError, DatabaseError):
        return Response([])


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_log(request, log_id):
    log = get_object_or_404(WorkLog, id=log_id, staff=request.user)
    log.delete()
    return Response({'message': 'Log deleted'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_logs(request):
    if request.user.role != 'admin':
        return Response({'detail': 'Not allowed'}, status=403)

    try:
        logs = (
            WorkLog.objects.filter(status='pending')
            .exclude(staff=request.user)
            .select_related('staff', 'project', 'approved_by', 'rejected_by', 'task')
            .prefetch_related('project__staff')
        )
        serializer = WorkLogSerializer(logs, many=True)
        return Response(serializer.data)
    except (ProgrammingError, OperationalError, DatabaseError):
        return Response([])

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def _sync_task_progress(log):
    """After a log is approved, recompute and persist the task's progress.
    Uses max(hours-based %, manual progress) so manual overrides are preserved
    but hours always drive it forward automatically.
    """
    if not log.task_id:
        return
    try:
        task = log.task
        if task.required_hours and float(task.required_hours) > 0:
            from django.db.models import Sum as _Sum
            total = task.logs.filter(status='approved').aggregate(t=_Sum('hours'))['t'] or 0
            hours_pct = min(100, int((float(total) / float(task.required_hours)) * 100))
            new_progress = max(hours_pct, task.progress)
            if task.progress != new_progress:
                task.progress = new_progress
                task.save(update_fields=['progress'])
    except Exception:
        pass



    if request.user.role != 'admin':
        return Response({'detail': 'Not allowed'}, status=403)

    try:
        log = get_object_or_404(WorkLog, id=log_id)
        log.status = 'approved'
        log.rejection_reason = ''
        log.approved_by = request.user
        log.approved_at = timezone.now()
        log.rejected_by = None
        log.rejected_at = None
        log.save()
    except (ProgrammingError, OperationalError, DatabaseError):
        return Response(
            {'detail': 'Log schema is out of date on the server. Deploy with migrations first.'},
            status=503
        )
    _sync_task_progress(log)
    if log.staff.email_notifications:
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
def approve_all_logs(request):
    if request.user.role != 'admin':
        return Response({'detail': 'Not allowed'}, status=403)

    try:
        logs = WorkLog.objects.filter(status='pending').exclude(staff=request.user)
    except (ProgrammingError, OperationalError, DatabaseError):
        return Response(
            {'detail': 'Log schema is out of date on the server. Deploy with migrations first.'},
            status=503
        )
    updated = []
    for log in logs:
        try:
            log.status = 'approved'
            log.rejection_reason = ''
            log.approved_by = request.user
            log.approved_at = timezone.now()
            log.rejected_by = None
            log.rejected_at = None
            log.save()
        except (ProgrammingError, OperationalError, DatabaseError):
            return Response(
                {'detail': 'Log schema is out of date on the server. Deploy with migrations first.'},
                status=503
            )
        updated.append(log)
        _sync_task_progress(log)
        if log.staff.email_notifications:
            Notification.objects.create(
                user=log.staff,
                title='Log approved',
                message=f'"{log.title}" was approved.',
                notification_type='log_approved',
                data={'log_id': log.id},
            )
    return Response({'message': f'Approved {len(updated)} logs'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_log(request, log_id):
    if request.user.role != 'admin':
        return Response({'detail': 'Not allowed'}, status=403)

    try:
        log = get_object_or_404(WorkLog, id=log_id)
        log.status = 'rejected'
        log.rejection_reason = request.data.get('reason', '')
        log.rejected_by = request.user
        log.rejected_at = timezone.now()
        log.approved_by = None
        log.approved_at = None
        log.save()
    except (ProgrammingError, OperationalError, DatabaseError):
        return Response(
            {'detail': 'Log schema is out of date on the server. Deploy with migrations first.'},
            status=503
        )
    if log.staff.email_notifications:
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
    username = (request.data.get('username') or request.data.get('email') or '').strip()
    password = request.data.get('password')

    user = None
    if username and password:
        # Allow login with either username or email, case-insensitive.
        lookup = None
        if '@' in username:
            lookup = User.objects.filter(email__iexact=username).first()
        else:
            lookup = User.objects.filter(username__iexact=username).first()
        auth_username = lookup.username if lookup else username
        user = authenticate(username=auth_username, password=password)

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
    username = data.get('username')
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    email = data.get('email')
    email_notifications = data.get('email_notifications')
    dark_mode = data.get('dark_mode')
    specialization = data.get('specialization')
    weekly_goal_hours = data.get('weekly_goal_hours')

    if isinstance(username, str):
        clean_username = username.strip()
        if not clean_username:
            return Response({'detail': 'Username cannot be empty.'}, status=400)
        if User.objects.exclude(id=request.user.id).filter(username__iexact=clean_username).exists():
            return Response({'detail': 'Username already in use.'}, status=400)
        request.user.username = clean_username
    if isinstance(first_name, str):
        request.user.first_name = first_name.strip()
    if isinstance(last_name, str):
        request.user.last_name = last_name.strip()
    if isinstance(email, str):
        clean_email = email.strip()
        if clean_email and '@' not in clean_email:
            return Response({'detail': 'Please enter a valid email.'}, status=400)
        if clean_email and User.objects.exclude(id=request.user.id).filter(email__iexact=clean_email).exists():
            return Response({'detail': 'Email already in use.'}, status=400)
        request.user.email = clean_email
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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_projects(request):
    projects = (
        Project.objects.filter(staff=request.user)
        .prefetch_related('staff')
        .annotate(
            total_tasks=Count('tasks'),
        )
        .order_by('name')
    )
    serializer = ProjectSerializer(projects, many=True)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_project(request, project_id):
    project = get_object_or_404(Project, id=project_id)
    if request.user not in project.staff.all():
        return Response({'detail': 'Not allowed'}, status=403)
    project.delete()
    return Response({'message': 'Project deleted'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reports_summary(request):
    if request.user.role != 'admin':
        return Response({'detail': 'Not allowed'}, status=403)

    today = timezone.now().date()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)
    logs = WorkLog.objects.select_related('project', 'staff').filter(
        date__gte=week_start,
        date__lte=week_end,
    )
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

    today = timezone.now().date()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)
    logs = WorkLog.objects.select_related('project', 'staff').filter(
        date__gte=week_start,
        date__lte=week_end,
    )
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
    staff_users = User.objects.filter(role='staff', email_notifications=True)
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
    if not request.user.email_notifications:
        return Response([])
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
def admin_log_history(request):
    if request.user.role != 'admin':
        return Response({'detail': 'Not allowed'}, status=403)

    range_filter = request.query_params.get('range', 'this_week')
    today = timezone.now().date()
    if range_filter == 'all':
        try:
            logs = (
                WorkLog.objects.filter(Q(approved_by=request.user) | Q(rejected_by=request.user))
                .exclude(staff=request.user)
                .select_related('staff', 'project', 'approved_by', 'rejected_by', 'task')
                .prefetch_related('project__staff')
                .order_by('-approved_at', '-rejected_at')
            )
            serializer = WorkLogSerializer(logs, many=True)
            return Response(serializer.data)
        except (ProgrammingError, OperationalError, DatabaseError):
            return Response([])
    if range_filter == 'last_week':
        end = today - timedelta(days=today.weekday() + 1)
        start = end - timedelta(days=6)
    elif range_filter == 'last_30_days':
        start = today - timedelta(days=30)
        end = today
    elif range_filter == 'last_6_months':
        start = today - timedelta(days=180)  # More accurate 6 months
        end = today
    elif range_filter == 'last_year':
        start = today - timedelta(days=365)
        end = today
    else:
        start = today - timedelta(days=today.weekday())
        end = start + timedelta(days=6)

    try:
        logs = (
            WorkLog.objects.filter(
                Q(approved_by=request.user, approved_at__date__gte=start, approved_at__date__lte=end) |
                Q(rejected_by=request.user, rejected_at__date__gte=start, rejected_at__date__lte=end)
            )
            .exclude(staff=request.user)
            .select_related('staff', 'project', 'approved_by', 'rejected_by', 'task')
            .prefetch_related('project__staff')
            .order_by('-approved_at', '-rejected_at')
        )

        serializer = WorkLogSerializer(logs, many=True)
        return Response(serializer.data)
    except (ProgrammingError, OperationalError, DatabaseError):
        return Response([])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_reports(request):
    reports = Report.objects.order_by('-created_at')
    serializer = ReportSerializer(reports, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def staff_report_summary(request, staff_id):
    if request.user.role != 'admin' and request.user.id != staff_id:
        return Response({'detail': 'Not allowed'}, status=403)

    staff = get_object_or_404(User, id=staff_id)
    range_filter = request.query_params.get('range', 'this_week')
    today = timezone.now().date()
    start = None
    end = None

    if range_filter == 'last_week':
        end = today - timedelta(days=today.weekday() + 1)
        start = end - timedelta(days=6)
    elif range_filter == 'last_30_days':
        start = today - timedelta(days=30)
        end = today
    elif range_filter == 'last_6_months':
        start = today - timedelta(days=180)  # More accurate 6 months
        end = today
    elif range_filter == 'last_year':
        start = today - timedelta(days=365)
        end = today
    elif range_filter == 'all':
        start = None
        end = None
    else:
        start = today - timedelta(days=today.weekday())
        end = start + timedelta(days=6)

    logs = WorkLog.objects.filter(staff=staff).select_related('project').order_by('-date')
    if start and end:
        logs = logs.filter(date__gte=start, date__lte=end)

    total_logs = logs.count()
    total_hours = logs.aggregate(total=Sum('hours')).get('total') or 0
    status_counts = list(logs.values('status').annotate(count=Count('id')).order_by('status'))
    by_project = list(
        logs.values('project__name')
        .annotate(hours=Sum('hours'), count=Count('id'))
        .order_by('project__name')
    )
    if range_filter == 'last_30_days':
        period_unit = 'week'
        by_period = list(
            logs.annotate(period=TruncWeek('date'))
            .values('period')
            .annotate(hours=Sum('hours'))
            .order_by('-period')
        )
    elif range_filter in ('last_6_months', 'last_year', 'all'):
        period_unit = 'month'
        by_period = list(
            logs.annotate(period=TruncMonth('date'))
            .values('period')
            .annotate(hours=Sum('hours'))
            .order_by('-period')
        )
    else:
        period_unit = 'day'
        by_period = list(
            logs.values(period=F('date'))
            .annotate(hours=Sum('hours'))
            .order_by('-period')
        )

    return Response(
        {
            'staff': UserSerializer(staff).data,
            'range': range_filter,
            'start_date': start,
            'end_date': end,
            'total_logs': total_logs,
            'total_hours': total_hours,
            'status_counts': status_counts,
            'by_project': by_project,
            'period_unit': period_unit,
            'by_period': by_period,
        }
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_projects(request):
    if request.user.role != 'admin':
        return Response({'detail': 'Not allowed'}, status=403)

    projects = (
        Project.objects.all()
        .prefetch_related('staff')
        .annotate(
            total_tasks=Count('tasks'),
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    today = timezone.now().date()
    week_start = today - timedelta(days=today.weekday())
    month_start = today - timedelta(days=30)

    projects_qs = (
        Project.objects.filter(staff=request.user)
        .prefetch_related('staff')
        .annotate(
            total_tasks=Count('tasks'),
            completed_tasks=Count('tasks', filter=Q(tasks__progress__gte=100)),
        )
        .order_by('name')
    )

    # Only count projects that aren't 100% complete
    active_projects = sum(
        1 for p in projects_qs
        if p.total_tasks == 0 or (p.total_tasks > 0 and p.completed_tasks < p.total_tasks)
    )

    hours_this_week = (
        WorkLog.objects.filter(staff=request.user, date__gte=week_start, date__lte=today)
        .aggregate(total=Sum('hours'))
        .get('total')
        or 0
    )

    logs_30d = WorkLog.objects.filter(staff=request.user, date__gte=month_start, date__lte=today)
    logs_30d_stats = logs_30d.aggregate(
        total=Count('id'),
        approved=Count('id', filter=Q(status='approved')),
    )
    total_30d = logs_30d_stats.get('total') or 0
    approved_30d = logs_30d_stats.get('approved') or 0
    approval_rate = round((approved_30d / total_30d) * 100) if total_30d else 0

    pending_count = 0
    if request.user.role == 'admin':
        pending_count = WorkLog.objects.filter(status='pending').exclude(staff=request.user).count()

    recent_projects = ProjectSerializer(projects_qs[:3], many=True).data

    return Response(
        {
            'hours_this_week': float(hours_this_week),
            'active_projects': active_projects,
            'approval_rate': approval_rate,
            'pending_logs': pending_count,
            'weekly_goal_hours': float(request.user.weekly_goal_hours or 0),
            'recent_projects': recent_projects,
        }
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_project_staff(request, project_id):
    if request.user.role != 'admin':
        return Response({'detail': 'Not allowed'}, status=403)

    user_ids = request.data.get('user_ids', [])
    if not isinstance(user_ids, list):
        return Response({'detail': 'user_ids must be a list'}, status=400)

    project = get_object_or_404(Project, id=project_id)
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
            if staff.email_notifications:
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
            if staff.email_notifications:
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
        members = list(project.staff.all())
        member_map = {member.id: member for member in members}
        multiple_members = len(members) > 1
        for item in tasks:
            if isinstance(item, dict):
                title = str(item.get('title', '')).strip()
                assigned_id = item.get('assigned_to')
                required_hours = item.get('required_hours', 0)
            elif isinstance(item, str):
                title = item.strip()
                assigned_id = None
                required_hours = 0
            else:
                continue
            if not title or title in seen:
                continue
            seen.add(title)
            assignee = None
            if assigned_id is not None and assigned_id != '':
                try:
                    assigned_id = int(assigned_id)
                except (TypeError, ValueError):
                    assigned_id = None
            if multiple_members:
                if not assigned_id:
                    return Response(
                        {'detail': 'Each task must be assigned to a project member.'},
                        status=400,
                    )
                assignee = member_map.get(assigned_id)
                if assignee is None:
                    return Response(
                        {'detail': 'Each task must be assigned to a project member.'},
                        status=400,
                    )
            else:
                if assigned_id and assigned_id in member_map:
                    assignee = member_map[assigned_id]
                elif members:
                    assignee = members[0]
                else:
                    assignee = request.user
            task_items.append(Task(project=project, title=title, assigned_to=assignee, required_hours=required_hours))
        if task_items:
            try:
                Task.objects.bulk_create(task_items)
            except (ProgrammingError, OperationalError):
                # Project creation should still succeed even if task schema is behind.
                pass
    serializer = ProjectSerializer(project)
    return Response(serializer.data, status=201)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def project_tasks(request, project_id):
    project = get_object_or_404(Project, id=project_id)

    is_member = request.user in project.staff.all()
    is_admin = request.user.role == 'admin'

    # Non-members who aren't admin can't access at all
    if not is_admin and not is_member:
        return Response({'detail': 'Not allowed'}, status=403)

    if request.method == 'GET':
        try:
            tasks = Task.objects.filter(project=project).prefetch_related('logs').order_by('-created_at')
            serializer = TaskSerializer(tasks, many=True)
            return Response(serializer.data)
        except (ProgrammingError, OperationalError):
            # Graceful fallback when production DB schema is behind code.
            fallback = list(
                Task.objects.filter(project=project)
                .values('id', 'title', 'created_at', 'project_id', 'assigned_to_id')
                .order_by('-created_at')
            )
            for row in fallback:
                row['project'] = row.pop('project_id')
                row['assigned_to'] = row.pop('assigned_to_id')
                row['required_hours'] = 0
                row['progress'] = 0
                row['current_hours'] = 0
            return Response(fallback)

    # POST: only members can create tasks (admins must be assigned to the project)
    if not is_member:
        return Response({'detail': 'Not allowed'}, status=403)

    title = request.data.get('title', '').strip()
    assigned_to_id = request.data.get('assigned_to')
    required_hours = request.data.get('required_hours', 0)
    if not title:
        return Response({'detail': 'Task title is required'}, status=400)
    if not assigned_to_id:
        if project.staff.count() == 1:
            assignee = project.staff.first()
        else:
            return Response({'detail': 'Assignee is required'}, status=400)
    else:
        assignee = project.staff.filter(id=assigned_to_id).first()
    if not assignee:
        return Response({'detail': 'Assignee must be a project member'}, status=400)

    task = Task.objects.create(
        project=project,
        title=title,
        assigned_to=assignee,
        required_hours=required_hours
    )
    serializer = TaskSerializer(task)
    return Response(serializer.data, status=201)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_task(request, task_id):
    task = get_object_or_404(Task, id=task_id)
    if request.user not in task.project.staff.all():
        return Response({'detail': 'Not allowed'}, status=403)
    
    progress = request.data.get('progress')
    required_hours = request.data.get('required_hours')
    assigned_to_id = request.data.get('assigned_to')
    
    is_single_member_project = task.project.staff.count() <= 1
    
    if progress is not None:
        if (
            task.assigned_to
            and task.assigned_to_id != request.user.id
            and not is_single_member_project
        ):
            return Response({'detail': 'Only the assignee can update this task.'}, status=403)
        if isinstance(progress, int) and 0 <= progress <= 100:
            # Enforce floor: can't set below what hours have already earned
            if task.required_hours and float(task.required_hours) > 0:
                from django.db.models import Sum as _Sum
                total = task.logs.filter(status='approved').aggregate(t=_Sum('hours'))['t'] or 0
                hours_pct = min(100, int((float(total) / float(task.required_hours)) * 100))
                progress = max(progress, hours_pct)
            task.progress = progress
        else:
            return Response({'detail': 'Progress must be between 0 and 100'}, status=400)
    
    if required_hours is not None:
        try:
            task.required_hours = float(required_hours)
        except (TypeError, ValueError):
            return Response({'detail': 'Invalid required_hours value'}, status=400)
    
    if assigned_to_id is not None:
        assignee = task.project.staff.filter(id=assigned_to_id).first()
        if not assignee:
            return Response({'detail': 'Assignee must be a project member'}, status=400)
        task.assigned_to = assignee
    
    task.save()
    serializer = TaskSerializer(task)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def leaderboard(request):
    range_filter = request.query_params.get('range', 'this_week')
    today = timezone.now().date()

    if range_filter == 'last_week':
        end = today - timedelta(days=today.weekday() + 1)
        start = end - timedelta(days=6)
    elif range_filter == 'last_30_days':
        start = today - timedelta(days=30)
        end = today
    else:  # this_week default
        start = today - timedelta(days=today.weekday())
        end = today

    staff_users = User.objects.filter(role='staff')
    results = []

    for user in staff_users:
        logs = WorkLog.objects.filter(staff=user, date__gte=start, date__lte=end)
        total_hours = logs.aggregate(total=Sum('hours'))['total'] or 0
        approved_hours = logs.filter(status='approved').aggregate(total=Sum('hours'))['total'] or 0
        log_count = logs.count()
        results.append({
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'specialization': user.specialization,
            'weekly_goal_hours': float(user.weekly_goal_hours or 0),
            'total_hours': float(total_hours),
            'approved_hours': float(approved_hours),
            'log_count': log_count,
        })

    results.sort(key=lambda x: x['total_hours'], reverse=True)

    # Tag overworked / underworked based on goal
    for entry in results:
        goal = entry['weekly_goal_hours']
        hours = entry['total_hours']
        if goal > 0:
            ratio = hours / goal
            if ratio >= 1.25:
                entry['status'] = 'overworked'
            elif ratio < 0.5:
                entry['status'] = 'underworked'
            else:
                entry['status'] = 'on_track'
        else:
            entry['status'] = 'no_goal'

    return Response(results)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_task(request, task_id):
    task = get_object_or_404(Task, id=task_id)
    if request.user not in task.project.staff.all():
        return Response({'detail': 'Not allowed'}, status=403)
    is_single_member_project = task.project.staff.count() <= 1
    if (
        task.assigned_to
        and task.assigned_to_id != request.user.id
        and not is_single_member_project
    ):
        return Response({'detail': 'Only the assignee can delete this task.'}, status=403)
    task.delete()
    return Response({'message': 'Task deleted'})
