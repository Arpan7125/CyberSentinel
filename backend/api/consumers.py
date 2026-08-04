from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from rest_framework.authtoken.models import Token


@database_sync_to_async
def _user_from_token(token_key):
    if not token_key:
        return None
    try:
        return Token.objects.select_related('user').get(key=token_key).user
    except Token.DoesNotExist:
        return None


class _AuthenticatedUserConsumer(AsyncJsonWebsocketConsumer):
    """Base for per-user channels — requires a valid DRF auth token (?token=...) to connect.

    Real per-user identity, unlike the REST bypass this project used to have —
    each user only ever joins their own group, never someone else's.
    """

    group_prefix = None  # subclasses set e.g. 'notifications', 'dashboard'

    async def connect(self):
        query = parse_qs(self.scope.get('query_string', b'').decode())
        token_key = (query.get('token') or [None])[0]
        user = await _user_from_token(token_key)

        if user is None or not user.is_active:
            await self.close(code=4001)
            return

        self.user = user
        self.group_name = f"user_{user.id}_{self.group_prefix}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if getattr(self, 'group_name', None):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def push(self, event):
        await self.send_json(event['data'])


class NotificationConsumer(_AuthenticatedUserConsumer):
    group_prefix = 'notifications'


class DashboardConsumer(_AuthenticatedUserConsumer):
    group_prefix = 'dashboard'


class ThreatFeedConsumer(AsyncJsonWebsocketConsumer):
    """Public live feed of sanitized scan events (risk level/type only, no PII) for the threat map."""

    GROUP_NAME = 'threat_feed'

    async def connect(self):
        await self.channel_layer.group_add(self.GROUP_NAME, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.GROUP_NAME, self.channel_name)

    async def push(self, event):
        await self.send_json(event['data'])
