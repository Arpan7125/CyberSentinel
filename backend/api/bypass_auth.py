from rest_framework.authentication import BaseAuthentication
from django.contrib.auth.models import User

class BypassAuthentication(BaseAuthentication):
    def authenticate(self, request):
        try:
            user = User.objects.first()
            if user:
                return (user, None)
        except Exception:
            pass
        return None
