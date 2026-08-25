import datetime
import logging
import secrets

import requests
from django.conf import settings
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import OAuthProvider, ConnectedAccount, IntegrationSyncLog, OAuthState

logger = logging.getLogger('api')

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
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        providers = OAuthProvider.objects.filter(is_active=True).values(
            'id', 'name', 'category', 'description'
        )
        data = list(providers)
        for p in data:
            p['real_oauth_available'] = p['name'] in REAL_OAUTH_PROVIDER_NAMES and bool(settings.GOOGLE_CLIENT_ID)
        return Response(data)

class OAuthStartView(APIView):
    """Begin a Google authorization flow.

    Requires authentication: connecting a mailbox happens *to* an account, so
    there is always a user, and knowing who started the flow is what makes the
    `state` check meaningful on the way back.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        provider_id = request.data.get('provider_id')
        try:
            provider = OAuthProvider.objects.get(id=provider_id, is_active=True)
        except (OAuthProvider.DoesNotExist, ValueError, TypeError):
            return Response({'error': 'Provider not found.'}, status=status.HTTP_404_NOT_FOUND)

        if provider.name not in REAL_OAUTH_PROVIDER_NAMES or not settings.GOOGLE_CLIENT_ID:
            return Response({
                'error': f"{provider.name} isn't connected to a real OAuth flow yet. "
                         f"Only Gmail is supported in this build."
            }, status=status.HTTP_400_BAD_REQUEST)

        OAuthState.purge_expired()
        state = secrets.token_urlsafe(32)
        OAuthState.objects.create(state=state, user=request.user, provider=provider)

        params = {
            'client_id': settings.GOOGLE_CLIENT_ID,
            'redirect_uri': settings.GOOGLE_OAUTH_REDIRECT_URI,
            'response_type': 'code',
            'scope': GOOGLE_SCOPES,
            'access_type': 'offline',
            'prompt': 'consent',
            'state': state,
        }
        auth_url = f"{GOOGLE_AUTH_URL}?{requests.compat.urlencode(params)}"

        return Response({
            'auth_url': auth_url,
            'provider_name': provider.name,
            'scopes': provider.default_scopes.split(','),
        })


class OAuthCallbackView(APIView):
    """Exchange an authorization code for tokens and store the connection.

    Three things changed here:

    * The `state` is verified against the stored row and consumed. Without that
      check the endpoint would accept a code from anyone for anyone.
    * Authentication is required. It was previously disabled, which meant
      `request.user` was always anonymous and the block that actually saved the
      ConnectedAccount could never run — the flow burned a real code and stored
      nothing while reporting success.
    * The provider's access token is no longer echoed to the client. The server
      holds it; the browser has no use for it and every place it landed
      (localStorage, logs) was a place it could leak from.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = request.data.get('code')
        state = (request.data.get('state') or '').strip()

        if not code:
            return Response({'error': 'Missing authorization code.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if not state:
            return Response({'error': 'Missing state parameter.'},
                            status=status.HTTP_400_BAD_REQUEST)

        state_row = (OAuthState.objects
                     .select_related('provider')
                     .filter(state=state, user=request.user)
                     .first())

        if state_row is None or state_row.is_expired():
            if state_row:
                state_row.delete()
            return Response(
                {'error': 'This authorization link is no longer valid. Start the connection again.'},
                status=status.HTTP_400_BAD_REQUEST)

        provider = state_row.provider
        state_row.delete()  # single use, whatever happens next

        if provider.name not in REAL_OAUTH_PROVIDER_NAMES or not settings.GOOGLE_CLIENT_ID:
            return Response({'error': f'{provider.name} does not have a real OAuth integration configured.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            token_resp = requests.post(GOOGLE_TOKEN_URL, data={
                'code': code,
                'client_id': settings.GOOGLE_CLIENT_ID,
                'client_secret': settings.GOOGLE_CLIENT_SECRET,
                'redirect_uri': settings.GOOGLE_OAUTH_REDIRECT_URI,
                'grant_type': 'authorization_code',
            }, timeout=10)
        except requests.RequestException:
            logger.exception('Google token exchange failed')
            return Response({'error': "Couldn't reach Google to complete the connection. Try again."},
                            status=status.HTTP_502_BAD_GATEWAY)

        if token_resp.status_code != 200:
            # Google's error body can carry the client_secret back in some
            # failure modes, so it is logged, never returned.
            logger.warning('Google rejected authorization code: %s', token_resp.text[:500])
            return Response({'error': 'Google rejected the authorization code. Start the connection again.'},
                            status=status.HTTP_400_BAD_REQUEST)

        token_data = token_resp.json()
        access_token = token_data.get('access_token', '')
        refresh_token = token_data.get('refresh_token', '')
        expires_in = token_data.get('expires_in', 3600)

        real_email, account_sub = '', ''
        try:
            userinfo_resp = requests.get(GOOGLE_USERINFO_URL,
                                         headers={'Authorization': f'Bearer {access_token}'},
                                         timeout=10)
            if userinfo_resp.status_code == 200:
                info = userinfo_resp.json()
                real_email = info.get('email', '')
                account_sub = info.get('sub', '')
        except requests.RequestException:
            logger.exception('Google userinfo lookup failed')

        account, _ = ConnectedAccount.objects.update_or_create(
            user=request.user,
            provider=provider,
            defaults={
                'provider_account_id': account_sub,
                'provider_account_email': real_email,
                'access_token': access_token,
                'refresh_token': refresh_token,
                'scopes_granted': provider.default_scopes,
                'token_expires_at': timezone.now() + datetime.timedelta(seconds=expires_in),
                'status': 'connected',
                'health_status': 'Healthy',
            }
        )

        if provider.name == 'Gmail':
            from .models import UserIntegration
            config, _ = UserIntegration.objects.get_or_create(user=request.user)
            config.gmail_access_token = access_token
            config.save(update_fields=['gmail_access_token'])

        return Response({
            'message': f'Connected to {provider.name}.',
            'account_id': account.id,
            'email': real_email,
        })


class ConnectedAccountListView(APIView):
    """View user's active connected accounts."""
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
