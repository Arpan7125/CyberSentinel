from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import post_save
from django.dispatch import receiver

from .dashboard_utils import compute_dashboard_stats
from .models import Notification, ScanLog
from .serializers import NotificationSerializer


def _push(group_name, data):
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return  # No channel layer configured — REST still works, live push is just skipped.
    try:
        async_to_sync(channel_layer.group_send)(group_name, {'type': 'push', 'data': data})
    except Exception:
        # Redis unreachable, etc. — a scan/notification must still save even if the live
        # push can't be delivered right now; sockets will simply reconnect and catch up.
        pass


@receiver(post_save, sender=Notification)
def notification_created(sender, instance, created, **kwargs):
    if not created:
        return
    _push(f"user_{instance.user_id}_notifications", NotificationSerializer(instance).data)


@receiver(post_save, sender=ScanLog)
def scan_logged(sender, instance, created, **kwargs):
    if not created:
        return

    if instance.user_id:
        _push(f"user_{instance.user_id}_dashboard", compute_dashboard_stats(instance.user))

    # Public live threat feed — sanitized (risk level/type only), never raw scan content or PII.
    _push('threat_feed', {
        'scan_type': instance.scan_type,
        'risk_level': instance.risk_level,
        'risk_score': instance.risk_score,
        'created_at': instance.created_at.isoformat(),
    })
