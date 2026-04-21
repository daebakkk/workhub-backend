#!/usr/bin/env python
import os
import django
import sys

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'workhub_backend.settings')

django.setup()

from core.models import User
from django.contrib.auth.hashers import make_password

# Create an admin user if it doesn't exist
if not User.objects.filter(username='admin').exists():
    admin = User.objects.create(
        username='admin',
        email='admin@thefifthlab.com',
        password=make_password('admin123'),
        role='admin',
        first_name='Admin',
        last_name='User',
        specialization='software_architect'
    )
    print(f'Created admin user: {admin.username}')
else:
    print('Admin user already exists')

# Show all users
users = User.objects.all()
print(f'\nTotal users: {users.count()}')
for user in users:
    print(f'  {user.username}: {user.role}')