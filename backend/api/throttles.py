"""Rate limits for the endpoints that cost real money or guard credentials.

Scanning calls out to VirusTotal and runs OCR, so it is capped far below the
project-wide allowance. Authentication endpoints are capped per-IP to blunt
credential stuffing. Rates themselves live in settings.REST_FRAMEWORK so they
can be tuned per environment without a code change.
"""

from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class ScanAnonThrottle(AnonRateThrottle):
    scope = 'scan_anon'


class ScanUserThrottle(UserRateThrottle):
    scope = 'scan_user'


class AuthThrottle(AnonRateThrottle):
    """Per-IP limit for login, registration, OTP, and password reset."""
    scope = 'auth'


#: Attach to any view that performs a scan.
SCAN_THROTTLES = [ScanAnonThrottle, ScanUserThrottle]
