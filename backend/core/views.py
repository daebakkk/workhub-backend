from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import RegisterSerializer, UserSerializer


from .models import Project, WorkLog
from .serializers import ProjectSerializer, WorkLogSerializer

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

    logs = WorkLog.objects.filter(status='pending')
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
        'user': UserSerializer(user).data
    })

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Project
from .serializers import ProjectSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_projects(request):
    projects = Project.objects.filter(staff=request.user).order_by('name')
    serializer = ProjectSerializer(projects, many=True)
    return Response(serializer.data)
