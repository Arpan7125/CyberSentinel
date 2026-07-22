import datetime
import uuid
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from .models import OAuthProvider, ConnectedAccount, IntegrationSyncLog

class OAuthProviderListView(APIView):
    """List available OAuth providers for the integration marketplace."""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        providers = OAuthProvider.objects.filter(is_active=True).values(
            'id', 'name', 'category', 'description'
        )
        return Response(providers)

class OAuthStartView(APIView):
    """Generate authorization URL for a specific provider."""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        provider_id = request.data.get('provider_id')
        try:
            provider = OAuthProvider.objects.get(id=provider_id, is_active=True)
        except OAuthProvider.DoesNotExist:
            return Response({'error': 'Provider not found'}, status=status.HTTP_404_NOT_FOUND)

        # In a real app, you would construct:
        # auth_url = f"{provider.auth_url}?client_id={provider.client_id}&redirect_uri={provider.redirect_uri}&scope={provider.default_scopes}&response_type=code"
        
        # We are using mocked OAuth flow for testing
        mock_auth_url = f"/app/integrations/oauth/callback?provider={provider.id}&mock_code={uuid.uuid4().hex}"
        
        return Response({
            'auth_url': mock_auth_url,
            'provider_name': provider.name,
            'scopes': provider.default_scopes.split(',')
        })

class OAuthCallbackView(APIView):
    """Handle OAuth redirect and create ConnectedAccount."""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        provider_id = request.data.get('provider_id')
        code = request.data.get('code')
        
        try:
            provider = OAuthProvider.objects.get(id=provider_id)
        except OAuthProvider.DoesNotExist:
            return Response({'error': 'Invalid provider'}, status=status.HTTP_400_BAD_REQUEST)

        # Mock exchanging code for token
        mock_access_token = f"mock_access_{uuid.uuid4().hex}"
        mock_refresh_token = f"mock_refresh_{uuid.uuid4().hex}"
        mock_account_email = f"{request.user.username.lower()}@{provider.name.lower().replace(' ', '')}.com"
        
        account, created = ConnectedAccount.objects.update_or_create(
            user=request.user,
            provider=provider,
            defaults={
                'provider_account_id': f"pid_{uuid.uuid4().hex[:8]}",
                'provider_account_email': mock_account_email,
                'access_token': mock_access_token,
                'refresh_token': mock_refresh_token,
                'scopes_granted': provider.default_scopes,
                'token_expires_at': timezone.now() + datetime.timedelta(hours=1),
                'status': 'connected',
                'health_status': 'Healthy'
            }
        )

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

        # Simulate sync delay using a simple sleep if needed, 
        # but since UI will mock the delay, we just execute instantly here.
        import random
        items_synced = random.randint(15, 120)
        threats_detected = random.randint(0, 3)

        IntegrationSyncLog.objects.create(
            connected_account=account,
            status='success',
            items_synced=items_synced,
            threats_detected=threats_detected,
            message='Sync completed successfully',
            duration_ms=random.randint(1200, 4500)
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
