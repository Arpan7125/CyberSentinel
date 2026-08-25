"""Symmetric encryption for credentials that must be stored recoverably.

Two different problems, two different tools — do not mix them up:

* A secret the server only ever needs to *compare* (a developer API key, an
  admin auth key) is hashed. See `hash_secret` below and `DeveloperApiKey`.
* A secret the server needs to *replay* to a third party (a Twilio auth token,
  an OAuth refresh token, a customer's OpenAI key) cannot be hashed, because we
  have to send the original value to Twilio or Google later. Those are
  encrypted at rest with Fernet (AES-128-CBC + HMAC-SHA256) so a database dump
  alone does not hand over every customer's mailbox.

Key material comes from FIELD_ENCRYPTION_KEY when set. Otherwise it is derived
from SECRET_KEY with HKDF, which is safe *because* settings.py now refuses to
boot without a stable, explicitly configured SECRET_KEY — the old behaviour of
inventing one per worker would have made every stored credential unreadable
after a restart.

Rotating SECRET_KEY without setting FIELD_ENCRYPTION_KEY will make existing
ciphertext undecryptable. Set FIELD_ENCRYPTION_KEY explicitly in production so
the two lifecycles are independent.
"""

import base64
import hashlib
import hmac
from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from django.conf import settings

#: Marks a value as ciphertext produced by this module. Lets `decrypt` pass
#: through plaintext left over from before encryption was introduced instead of
#: raising, so the data migration can run lazily if it needs to.
PREFIX = 'enc$v1$'


@lru_cache(maxsize=1)
def _fernet():
    configured = getattr(settings, 'FIELD_ENCRYPTION_KEY', '') or ''
    if configured:
        key = configured.encode() if isinstance(configured, str) else configured
        # Accept either a ready-made Fernet key or arbitrary key material.
        try:
            return Fernet(key)
        except (ValueError, TypeError):
            material = key
    else:
        material = settings.SECRET_KEY.encode()

    derived = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b'cybersentinel.field-encryption.v1',
        info=b'credential-at-rest',
    ).derive(material)
    return Fernet(base64.urlsafe_b64encode(derived))


def encrypt(value):
    """Encrypt a string. Empty values stay empty so `blank=True` still works."""
    if value in (None, ''):
        return ''
    if isinstance(value, str) and value.startswith(PREFIX):
        return value  # already encrypted; never double-wrap
    token = _fernet().encrypt(str(value).encode())
    return PREFIX + token.decode()


def decrypt(value):
    """Decrypt a string produced by `encrypt`.

    A value without the marker is returned unchanged — that is pre-encryption
    plaintext, and refusing to read it would take the app down rather than
    degrade. A value *with* the marker that will not decrypt is a real error
    (wrong key, corrupt row) and returns '' rather than leaking a partial.
    """
    if value in (None, ''):
        return ''
    if not str(value).startswith(PREFIX):
        return value
    try:
        return _fernet().decrypt(str(value)[len(PREFIX):].encode()).decode()
    except InvalidToken:
        return ''


def hash_secret(raw):
    """SHA-256 hex digest, for secrets that are only ever compared."""
    return hashlib.sha256(raw.encode()).hexdigest()


def secrets_equal(a, b):
    """Constant-time comparison, so a failed match leaks no timing signal."""
    return hmac.compare_digest(str(a or ''), str(b or ''))


def mask(value, keep=4):
    """Render a credential for display without disclosing it."""
    value = value or ''
    if not value:
        return ''
    if len(value) <= keep:
        return '•' * len(value)
    return '•' * (len(value) - keep) + value[-keep:]
