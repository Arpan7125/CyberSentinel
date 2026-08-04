"""
ASGI config for cybersentinel_backend project.

Serves regular HTTP via Django's normal view stack and WebSocket connections
via Channels, so real-time features (live notifications, live dashboard
stats, live threat feed) share one process with the REST API.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cybersentinel_backend.settings')

# Must be created before importing anything that touches django.conf.settings /
# models (Channels routing imports consumers, which import models).
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402
from channels.auth import AuthMiddlewareStack  # noqa: E402
from api import routing  # noqa: E402

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AuthMiddlewareStack(
        URLRouter(routing.websocket_urlpatterns)
    ),
})
