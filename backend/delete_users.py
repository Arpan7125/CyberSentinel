import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cybersentinel_backend.settings')
django.setup()

from django.contrib.auth.models import User

# Filter for regular users (not staff, not superusers)
regular_users = User.objects.filter(is_staff=False, is_superuser=False)
count = regular_users.count()
print(f"Found {count} regular users to delete.")

for u in regular_users:
    print(f"Deleting user: {u.username} ({u.email})")
    u.delete()

print("Deletion complete.")
