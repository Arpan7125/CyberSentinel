from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count
from .models import AuditLog, ScanLog, Subscriber
from .masking import mask_email
from .permissions import IsAdmin


class AdminStatsView(APIView):
    """Admin overview: user counts, scans, subscribers, threat distribution."""
    permission_classes = [IsAdmin]

    def get(self, request):
        total_users = User.objects.count()
        total_scans = ScanLog.objects.count()
        total_subscribers = Subscriber.objects.filter(is_active=True).count()
        total_threats = ScanLog.objects.exclude(risk_level='Low').count()
        
        # Top threat types
        type_dist = ScanLog.objects.values('scan_type').annotate(count=Count('id'))
        
        # Recent users
        recent_users = list(User.objects.order_by('-date_joined')[:10].values(
            'id', 'username', 'email', 'is_staff', 'is_active', 'date_joined'
        ))
        for u in recent_users:
            u['date_joined'] = u['date_joined'].strftime('%Y-%m-%d %H:%M')
            # Masked before it leaves the server — see masking.py.
            u['email'] = mask_email(u['email'])
        
        # Recent scan logs
        recent_scans = list(ScanLog.objects.all()[:20].values(
            'id', 'scan_type', 'input_content', 'risk_score', 'risk_level', 'created_at', 'user__username'
        ))
        for s in recent_scans:
            s['created_at'] = s['created_at'].strftime('%Y-%m-%d %H:%M')
        
        # Subscribers
        subscribers = list(Subscriber.objects.order_by('-created_at')[:50].values(
            'id', 'email', 'name', 'is_active', 'created_at'
        ))
        for sub in subscribers:
            sub['created_at'] = sub['created_at'].strftime('%Y-%m-%d %H:%M')
            sub['email'] = mask_email(sub['email'])
        
        return Response({
            'stats': {
                'total_users': total_users,
                'total_scans': total_scans,
                'total_threats': total_threats,
                'active_subscribers': total_subscribers,
            },
            'scan_type_distribution': {item['scan_type']: item['count'] for item in type_dist},
            'recent_users': recent_users,
            'recent_scans': recent_scans,
            'subscribers': subscribers,
        }, status=status.HTTP_200_OK)


class AdminRevealContactView(APIView):
    """Hand an administrator the real contact details for one person, on the record.

    Masking the admin console (see masking.py) only means something if the way
    around it is deliberate and attributable. This endpoint is that way around:
    it returns exactly one user's details, and it writes an AuditLog row naming
    the administrator who asked, before returning anything.

    The audit write is not best-effort. If it fails the reveal fails, because an
    unlogged lookup is precisely the thing this is meant to prevent.
    """

    permission_classes = [IsAdmin]

    def post(self, request):
        user_id = request.data.get('user_id')
        reason = (request.data.get('reason') or '').strip()

        if not user_id:
            return Response({'error': 'user_id is required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            target = User.objects.select_related('profile').get(pk=user_id)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({'error': 'No such user.'}, status=status.HTTP_404_NOT_FOUND)

        profile = getattr(target, 'profile', None)
        phone = getattr(profile, 'phone', '') if profile else ''

        AuditLog.objects.create(
            user=request.user,
            action='pii.reveal',
            details=(
                f"{request.user.username} revealed contact details for "
                f"{target.username} (id={target.pk})."
                + (f" Reason given: {reason}" if reason else " No reason given.")
            ),
        )

        return Response({
            'user_id': target.pk,
            'username': target.username,
            'email': target.email,
            'phone': phone,
            'logged': True,
        }, status=status.HTTP_200_OK)


class AdminUserActionView(APIView):
    """Admin: toggle user active/staff status or delete user."""
    permission_classes = [IsAdmin]

    def post(self, request):
        admin_user = request.user

        action = request.data.get('action')  # 'toggle_active', 'toggle_staff', 'delete'
        user_id = request.data.get('user_id')
        
        if not action or not user_id:
            return Response({'error': 'action and user_id are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Cannot modify superuser
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        if target_user.is_superuser:
            return Response({'error': 'Cannot modify superuser.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Every branch below records what happened before returning. These are
        # the three most consequential things an administrator can do to another
        # account — suspend it, hand it admin rights, or destroy it — and until
        # now none of them left a trace, so granting staff access was an
        # unattributable privilege escalation. The AuditLog model already
        # existed; nothing was writing to it.
        if action == 'toggle_active':
            target_user.is_active = not target_user.is_active
            target_user.save()
            state = 'activated' if target_user.is_active else 'deactivated'
            AuditLog.objects.create(
                user=admin_user,
                action='user.toggle_active',
                details=(f"{admin_user.username} {state} {target_user.username} "
                         f"(id={target_user.pk})."),
            )
            return Response({'message': f"User {state} successfully."})
        
        elif action == 'toggle_staff':
            target_user.is_staff = not target_user.is_staff
            target_user.save()
            state = 'granted' if target_user.is_staff else 'revoked'
            AuditLog.objects.create(
                user=admin_user,
                action='user.toggle_staff',
                details=(f"{admin_user.username} {state} admin access "
                         f"{'to' if target_user.is_staff else 'from'} "
                         f"{target_user.username} (id={target_user.pk})."),
            )
            return Response({'message': f"User {state} admin access."})
        
        elif action == 'delete':
            if target_user.id == admin_user.id:
                return Response({'error': 'Cannot delete yourself.'}, status=status.HTTP_400_BAD_REQUEST)
            # Recorded before the delete: the row's own id and username are gone
            # afterwards, and AuditLog.user is SET_NULL so the record survives
            # even if the administrator is later removed too.
            AuditLog.objects.create(
                user=admin_user,
                action='user.delete',
                details=(f"{admin_user.username} deleted account {target_user.username} "
                         f"(id={target_user.pk}, email={target_user.email})."),
            )
            target_user.delete()
            return Response({'message': 'User deleted successfully.'})
        
        return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)


class AdminIntegrationsView(APIView):
    """Admin: View ecosystem stats, manage providers, view user connections."""
    permission_classes = [IsAdmin]

    def get(self, request):
        from .models import OAuthProvider, ConnectedAccount, IntegrationSyncLog
        from django.db.models import Q

        providers = list(OAuthProvider.objects.all().values(
            'id', 'name', 'category', 'description', 'is_active', 'client_id', 'default_scopes', 'created_at'
        ))
        for p in providers:
            p['created_at'] = p['created_at'].strftime('%Y-%m-%d %H:%M')
            # Mask client_id for display
            cid = p.get('client_id', '')
            p['client_id_masked'] = f"{cid[:8]}...{cid[-4:]}" if len(cid) > 12 else ('Configured' if cid else 'Not Set')
            p['connected_users'] = ConnectedAccount.objects.filter(provider_id=p['id'], status='connected').count()

        total_connections = ConnectedAccount.objects.filter(status='connected').count()
        failed_connections = ConnectedAccount.objects.filter(status='failed').count()
        total_syncs = IntegrationSyncLog.objects.count()
        failed_syncs = IntegrationSyncLog.objects.filter(status='error').count()

        # All user connections
        connections = ConnectedAccount.objects.select_related('provider', 'user').all()[:100]
        conn_data = [{
            'id': c.id,
            'username': c.user.username,
            'email': c.user.email,
            'provider_name': c.provider.name,
            'category': c.provider.category,
            'status': c.status,
            'health_status': c.health_status,
            'provider_account_email': c.provider_account_email,
            'last_sync_at': c.last_sync_at.strftime('%Y-%m-%d %H:%M') if c.last_sync_at else None,
            'created_at': c.created_at.strftime('%Y-%m-%d %H:%M'),
        } for c in connections]

        return Response({
            'stats': {
                'total_providers': len(providers),
                'active_connections': total_connections,
                'failed_connections': failed_connections,
                'total_syncs': total_syncs,
                'failed_syncs': failed_syncs,
            },
            'providers': providers,
            'connections': conn_data,
        })

    def post(self, request):
        """Create or update an OAuthProvider."""
        from .models import OAuthProvider

        action = request.data.get('action')
        provider_id = request.data.get('provider_id')

        if action == 'toggle_provider':
            try:
                provider = OAuthProvider.objects.get(id=provider_id)
                provider.is_active = not provider.is_active
                provider.save()
                return Response({'message': f"Provider {'enabled' if provider.is_active else 'disabled'}."})
            except OAuthProvider.DoesNotExist:
                return Response({'error': 'Provider not found.'}, status=status.HTTP_404_NOT_FOUND)

        elif action == 'update_credentials':
            try:
                provider = OAuthProvider.objects.get(id=provider_id)
                if request.data.get('client_id'):
                    provider.client_id = request.data['client_id']
                if request.data.get('client_secret'):
                    provider.client_secret = request.data['client_secret']
                if request.data.get('redirect_uri'):
                    provider.redirect_uri = request.data['redirect_uri']
                provider.save()
                return Response({'message': 'Credentials updated.'})
            except OAuthProvider.DoesNotExist:
                return Response({'error': 'Provider not found.'}, status=status.HTTP_404_NOT_FOUND)

        elif action == 'create_provider':
            name = request.data.get('name')
            category = request.data.get('category')
            if not name or not category:
                return Response({'error': 'name and category required.'}, status=status.HTTP_400_BAD_REQUEST)
            provider = OAuthProvider.objects.create(
                name=name,
                category=category,
                description=request.data.get('description', ''),
                client_id=request.data.get('client_id', ''),
                client_secret=request.data.get('client_secret', ''),
                default_scopes=request.data.get('default_scopes', ''),
            )
            return Response({'message': f'Provider {provider.name} created.', 'id': provider.id})

        return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)
