import hashlib
import secrets

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import LoginHistory, DeviceSession, DeveloperApiKey
from .serializers import LoginHistorySerializer, DeviceSessionSerializer, DeveloperApiKeySerializer


class LoginHistoryView(APIView):
    """Real authentication history — see auth_views.record_login()."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        history = LoginHistory.objects.filter(user=request.user)[:50]
        return Response(LoginHistorySerializer(history, many=True).data)


class DeviceSessionListView(APIView):
    """Real device sessions — one row per (user, device_info) upserted on each real login."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = DeviceSession.objects.filter(user=request.user, is_revoked=False)
        current_ua = (request.META.get('HTTP_USER_AGENT') or '')[:255]
        data = DeviceSessionSerializer(sessions, many=True).data
        for row in data:
            row['is_current'] = row['device_name'] == current_ua
        return Response(data)


class DeviceSessionRevokeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        try:
            session = DeviceSession.objects.get(id=session_id, user=request.user)
        except DeviceSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
        session.is_revoked = True
        session.save()
        return Response({'message': 'Session revoked'})


class DeveloperApiKeyView(APIView):
    """List/create real developer API keys. Full key is returned once, only on creation —
    only its SHA-256 hash and a display prefix are ever stored."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        keys = DeveloperApiKey.objects.filter(user=request.user)
        return Response(DeveloperApiKeySerializer(keys, many=True).data)

    def post(self, request):
        name = request.data.get('name', '').strip()
        if not name:
            return Response({'error': 'Key name is required'}, status=status.HTTP_400_BAD_REQUEST)

        raw_key = f"cs_live_{secrets.token_hex(24)}"
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        prefix = raw_key[:12]

        key = DeveloperApiKey.objects.create(
            user=request.user, name=name, prefix=prefix, key_hash=key_hash
        )
        return Response({
            'key': DeveloperApiKeySerializer(key).data,
            'full_key': raw_key,  # shown once — the frontend must not persist this
        }, status=status.HTTP_201_CREATED)

    def delete(self, request, key_id):
        try:
            key = DeveloperApiKey.objects.get(id=key_id, user=request.user)
        except DeveloperApiKey.DoesNotExist:
            return Response({'error': 'Key not found'}, status=status.HTTP_404_NOT_FOUND)
        key.delete()
        return Response({'message': 'Key revoked'})
