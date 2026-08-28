"""
Data-sharing consent.

A consent control that records an answer and then changes nothing is worse than
no control at all — it tells the user they decided something when they did not.
So the answer recorded by `DataConsentView` has one concrete, checkable effect:
a user who declined is not attached to the scan rows they generate.

The scanners themselves stay open. They accept anonymous requests, so refusing
to run them for a signed-in user who declined would be incoherent — they could
log out and get the same scan. What the user is actually agreeing to is their
account being the thing the results are filed under, and declining genuinely
prevents that.
"""

from .models import UserProfile


def has_granted_data_consent(user) -> bool:
    """
    True only when this user has explicitly agreed to the current wording.

    Anonymous users are False: there is no account to attach anything to.
    Missing profile is False as well — absence of a recorded yes is a no.
    """
    if not user or not user.is_authenticated:
        return False

    profile = UserProfile.objects.filter(user=user).only('data_consent').first()
    if profile is None:
        return False

    return profile.data_consent == 'granted'


def scan_log_user(request):
    """
    The user a scan should be filed under, or None to record it unattributed.

    Replaces the bare `request.user if authenticated else None` the scan views
    used, so declining consent actually detaches the scan from the account
    instead of merely being written down somewhere.
    """
    user = getattr(request, 'user', None)
    if not user or not user.is_authenticated:
        return None

    return user if has_granted_data_consent(user) else None
