"""Liveness and readiness endpoints for the platform's health checks.

`/api/health/` is deliberately cheap — it must not touch the database, so a
saturated connection pool cannot make the platform kill an otherwise healthy
instance. `/api/health/ready/` is the one that actually verifies dependencies.
"""

import logging

from django.conf import settings
from django.db import connection
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


class HealthView(APIView):
    """Liveness: is this process up and serving?"""
    permission_classes = [AllowAny]
    throttle_classes = []
    authentication_classes = []

    def get(self, request):
        return Response({'status': 'ok'}, status=status.HTTP_200_OK)


class ReadinessView(APIView):
    """Readiness: are the dependencies this instance needs actually reachable?"""
    permission_classes = [AllowAny]
    throttle_classes = []
    authentication_classes = []

    def get(self, request):
        checks = {}
        healthy = True

        try:
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
                cursor.fetchone()
            checks['database'] = 'ok'
        except Exception as exc:
            logger.exception('Readiness probe: database unreachable')
            checks['database'] = f'error: {exc.__class__.__name__}'
            healthy = False

        if settings.REDIS_URL:
            try:
                import redis

                client = redis.from_url(settings.REDIS_URL, socket_connect_timeout=2)
                client.ping()
                checks['redis'] = 'ok'
            except Exception as exc:
                # Redis powers live WebSocket push only; REST keeps working
                # without it, so this degrades rather than failing the probe.
                logger.warning('Readiness probe: Redis unreachable (%s)', exc.__class__.__name__)
                checks['redis'] = f'degraded: {exc.__class__.__name__}'
        else:
            checks['redis'] = 'not configured (in-memory channel layer)'

        # Reported, never failed on — these are optional capabilities.
        checks['virustotal'] = 'configured' if settings.VIRUSTOTAL_API_KEY else 'not configured'
        checks['google_oauth'] = 'configured' if settings.GOOGLE_CLIENT_ID else 'not configured'
        checks['email'] = (
            'smtp' if settings.EMAIL_BACKEND.endswith('smtp.EmailBackend') else 'console only'
        )

        return Response(
            {'status': 'ready' if healthy else 'unhealthy', 'checks': checks},
            status=status.HTTP_200_OK if healthy else status.HTTP_503_SERVICE_UNAVAILABLE,
        )
