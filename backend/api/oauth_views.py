import datetime
import uuid
import requests
from django.conf import settings
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from .models import OAuthProvider, ConnectedAccount, IntegrationSyncLog

# Providers with a real OAuth implementation behind them. Everything else in the
# marketplace is honestly marked "not yet connectable" rather than faking a connection —
# see backend/.env.example for how to add GOOGLE_CLIENT_ID/SECRET.
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
GOOGLE_SCOPES = "openid email https://www.googleapis.com/auth/gmail.readonly"
REAL_OAUTH_PROVIDER_NAMES = {"Gmail", "Google Workspace"}


class OAuthProviderListView(APIView):
    """List available OAuth providers for the integration marketplace."""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        providers = OAuthProvider.objects.filter(is_active=True).values(
            'id', 'name', 'category', 'description'
        )
        data = list(providers)
        for p in data:
            p['real_oauth_available'] = p['name'] in REAL_OAUTH_PROVIDER_NAMES and bool(settings.GOOGLE_CLIENT_ID)
        return Response(data)

class OAuthStartView(APIView):
    """Generate a real Google authorization URL for a specific provider (Gmail import, sign-in)."""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        provider_id = request.data.get('provider_id')
        try:
            provider = OAuthProvider.objects.get(id=provider_id, is_active=True)
        except OAuthProvider.DoesNotExist:
            return Response({'error': 'Provider not found'}, status=status.HTTP_404_NOT_FOUND)

        if provider.name not in REAL_OAUTH_PROVIDER_NAMES or not settings.GOOGLE_CLIENT_ID:
            return Response({
                'error': f'{provider.name} isn\'t connected to a real OAuth flow yet. '
                         f'Only Gmail is supported in this build — check back soon.'
            }, status=status.HTTP_400_BAD_REQUEST)

        state = uuid.uuid4().hex
        params = {
            'client_id': settings.GOOGLE_CLIENT_ID,
            'redirect_uri': settings.GOOGLE_OAUTH_REDIRECT_URI,
            'response_type': 'code',
            'scope': GOOGLE_SCOPES,
            'access_type': 'offline',
            'prompt': 'consent',
            'state': f"{provider.id}:{state}",
        }
        auth_url = f"{GOOGLE_AUTH_URL}?{requests.compat.urlencode(params)}"

        return Response({
            'auth_url': auth_url,
            'provider_name': provider.name,
            'scopes': provider.default_scopes.split(',')
        })

class OAuthCallbackView(APIView):
    """Exchange the real Google authorization code for real tokens and store the connection."""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        provider_id = request.data.get('provider_id')
        code = request.data.get('code')

        try:
            provider = OAuthProvider.objects.get(id=provider_id)
        except OAuthProvider.DoesNotExist:
            return Response({'error': 'Invalid provider'}, status=status.HTTP_400_BAD_REQUEST)

        if provider.name not in REAL_OAUTH_PROVIDER_NAMES or not settings.GOOGLE_CLIENT_ID:
            return Response({'error': f'{provider.name} does not have a real OAuth integration configured.'}, status=status.HTTP_400_BAD_REQUEST)

        if not code:
            return Response({'error': 'Missing authorization code from Google.'}, status=status.HTTP_400_BAD_REQUEST)

        token_resp = requests.post(GOOGLE_TOKEN_URL, data={
            'code': code,
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'redirect_uri': settings.GOOGLE_OAUTH_REDIRECT_URI,
            'grant_type': 'authorization_code',
        }, timeout=10)

        if token_resp.status_code != 200:
            return Response({'error': 'Google rejected the authorization code.', 'details': token_resp.json()}, status=status.HTTP_400_BAD_REQUEST)

        token_data = token_resp.json()
        access_token = token_data.get('access_token', '')
        refresh_token = token_data.get('refresh_token', '')
        expires_in = token_data.get('expires_in', 3600)

        userinfo_resp = requests.get(GOOGLE_USERINFO_URL, headers={'Authorization': f'Bearer {access_token}'}, timeout=10)
        real_email = userinfo_resp.json().get('email', '') if userinfo_resp.status_code == 200 else ''

        account, created = ConnectedAccount.objects.update_or_create(
            user=request.user,
            provider=provider,
            defaults={
                'provider_account_id': userinfo_resp.json().get('sub', '') if userinfo_resp.status_code == 200 else '',
                'provider_account_email': real_email,
                'access_token': access_token,
                'refresh_token': refresh_token,
                'scopes_granted': provider.default_scopes,
                'token_expires_at': timezone.now() + datetime.timedelta(seconds=expires_in),
                'status': 'connected',
                'health_status': 'Healthy'
            }
        )

        # Mirror the real token so the existing Gmail import path (integrations_views.GmailImportView)
        # picks it up automatically instead of falling back to its simulated feed.
        if provider.name == 'Gmail':
            from .models import UserIntegration
            config, _ = UserIntegration.objects.get_or_create(user=request.user)
            config.gmail_access_token = access_token
            config.save()

        return Response({
            'message': f'Successfully connected to {provider.name}',
            'account_id': account.id,
            'email': account.provider_account_email
        })

class ConnectedAccountListView(APIView):
    """View user's active connected accounts."""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        accounts = ConnectedAccount.objects.filter(user=request.user).select_related('provider')
        data = []
        for acc in accounts:
            data.append({
                'id': acc.id,
                'provider_id': acc.provider.id,
                'provider_name': acc.provider.name,
                'category': acc.provider.category,
                'email': acc.provider_account_email,
                'status': acc.status,
                'health_status': acc.health_status,
                'scopes': acc.scopes_granted,
                'last_sync_at': acc.last_sync_at,
                'expires_at': acc.token_expires_at,
            })
        return Response(data)

class IntegrationSyncView(APIView):
    """Trigger a sync for a specific connected account."""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        account_id = request.data.get('account_id')
        try:
            account = ConnectedAccount.objects.get(id=account_id, user=request.user)
        except ConnectedAccount.DoesNotExist:
            return Response({'error': 'Account not found'}, status=status.HTTP_404_NOT_FOUND)

        if account.status != 'connected':
            return Response({'error': 'Account is not connected'}, status=status.HTTP_400_BAD_REQUEST)

        if account.provider.name != 'Gmail':
            return Response({
                'error': f'Live sync for {account.provider.name} is not implemented yet — only Gmail is fully connected in this build.'
            }, status=status.HTTP_501_NOT_IMPLEMENTED)

        from .integrations_views import sync_gmail_real
        started = timezone.now()
        results = sync_gmail_real(request.user, account.access_token)

        if results is None:
            IntegrationSyncLog.objects.create(
                connected_account=account,
                status='error',
                items_synced=0,
                threats_detected=0,
                message='Gmail API call failed — the connection may have expired.',
                duration_ms=int((timezone.now() - started).total_seconds() * 1000),
            )
            return Response({'error': 'Sync failed — try reconnecting Gmail.'}, status=status.HTTP_502_BAD_GATEWAY)

        items_synced = len(results)
        threats_detected = sum(1 for r in results if r['risk_level'] not in ('Low',))
        duration_ms = int((timezone.now() - started).total_seconds() * 1000)

        IntegrationSyncLog.objects.create(
            connected_account=account,
            status='success',
            items_synced=items_synced,
            threats_detected=threats_detected,
            message='Sync completed successfully',
            duration_ms=duration_ms,
        )

        account.last_sync_at = timezone.now()
        account.save()

        return Response({
            'message': 'Sync completed',
            'items_synced': items_synced,
            'threats_detected': threats_detected,
            'last_sync_at': account.last_sync_at
        })

class IntegrationDisconnectView(APIView):
    """Disconnect and revoke an integration."""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        account_id = request.data.get('account_id')
        try:
            account = ConnectedAccount.objects.get(id=account_id, user=request.user)
            account.access_token = ''
            account.refresh_token = ''
            account.status = 'disconnected'
            account.health_status = 'Disconnected'
            account.save()
            return Response({'message': 'Account disconnected successfully'})
        except ConnectedAccount.DoesNotExist:
            return Response({'error': 'Account not found'}, status=status.HTTP_404_NOT_FOUND)

class IntegrationSyncLogsView(APIView):
    """Get sync logs for a specific account."""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, account_id):
        try:
            account = ConnectedAccount.objects.get(id=account_id, user=request.user)
            logs = IntegrationSyncLog.objects.filter(connected_account=account)[:10]
            data = [{
                'id': log.id,
                'status': log.status,
                'items_synced': log.items_synced,
                'threats_detected': log.threats_detected,
                'message': log.message,
                'duration_ms': log.duration_ms,
                'created_at': log.created_at
            } for log in logs]
            return Response(data)
        except ConnectedAccount.DoesNotExist:
            return Response({'error': 'Account not found'}, status=status.HTTP_404_NOT_FOUND)
