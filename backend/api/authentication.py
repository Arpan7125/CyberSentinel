"""Authentication backend for developer API keys.

The `DeveloperApiKey` model, the endpoints that mint keys, and the UI that
displays them all existed already — but no authentication class ever looked at
`key_hash`, so a key handed to a developer authenticated nothing. This closes
that loop.

Keys are presented as `Authorization: Api-Key cs_live_…`, distinct from the
`Token …` scheme DRF's own TokenAuthentication uses, so the two never contend
for the same header value.
"""

from django.utils import timezone
from rest_framework import exceptions
from rest_framework.authentication import BaseAuthentication, get_authorization_header

from .crypto import hash_secret
from .models import DeveloperApiKey

KEYWORD = b'api-key'


class DeveloperApiKeyAuthentication(BaseAuthentication):
    """Authenticate a request carrying `Authorization: Api-Key <key>`."""

    def authenticate(self, request):
        auth = get_authorization_header(request).split()

        if not auth or auth[0].lower() != KEYWORD:
            return None  # not our scheme; let the next class try

        if len(auth) != 2:
            raise exceptions.AuthenticationFailed('Malformed Api-Key header.')

        try:
            raw_key = auth[1].decode()
        except UnicodeError:
            raise exceptions.AuthenticationFailed('Malformed Api-Key header.')

        # Look up by hash — the plaintext is never stored, so this is an exact
        # index hit rather than a scan-and-compare.
        key = (DeveloperApiKey.objects
               .select_related('user')
               .filter(key_hash=hash_secret(raw_key))
               .first())

        if key is None:
            raise exceptions.AuthenticationFailed('Invalid API key.')

        if not key.user.is_active:
            raise exceptions.AuthenticationFailed('User account is disabled.')

        if hasattr(key, 'last_used_at'):
            key.last_used_at = timezone.now()
            key.save(update_fields=['last_used_at'])

        return key.user, key

    def authenticate_header(self, request):
        return 'Api-Key'
