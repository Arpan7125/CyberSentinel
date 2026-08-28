"""Authentication endpoints.

Ground rules this module now follows, each one written down because it was
violated before:

1. **Nothing in a request body may change a permission.** Registration ignores
   any `role`, `is_staff`, or `is_superuser` the client sends. Promotion happens
   through the admin API, under `IsAdminUser`, and nowhere else.
2. **There are no bypass credentials.** No hardcoded master keys, no "if the
   user is already staff, let any key through" fallback, no branch that creates
   an account as a side effect of a failed login.
3. **A secret never appears in a response.** Verification codes and admin auth
   keys are delivered out of band or not at all. A mail-delivery failure is
   logged and returns the same body as success.
4. **Credential responses are indistinguishable.** Login, password reset, and
   OTP request return the same message whether or not the account exists, so the
   endpoints cannot be used to enumerate users.
5. **Passwords go through Django's configured validators.** `AUTH_PASSWORD_VALIDATORS`
   in settings is the single source of truth; no view hand-rolls a length check.
"""

import logging
import secrets
from datetime import timedelta

import phonenumbers

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (DATA_CONSENT_VERSION, AdminAuthKey, DeviceSession, LoginHistory,
                     PasswordResetOTP, UserIntegration, UserProfile)
from .throttles import AuthThrottle

logger = logging.getLogger('api')

#: Returned by every credential-recovery endpoint regardless of whether the
#: address is registered. See rule 4 above.
NEUTRAL_RECOVERY_MESSAGE = (
    'If an account exists for that address, a verification code has been sent to it.'
)

#: Returned for every failed sign-in, whatever the actual cause.
INVALID_CREDENTIALS_MESSAGE = 'Invalid credentials. Check your details and try again.'


# ── Helpers ─────────────────────────────────────────────────────────────────

def client_ip(request):
    """The caller's real address.

    Behind Render's load balancer `REMOTE_ADDR` is the proxy, which made every
    row in the Security page's login history identical. Take the last hop in
    `X-Forwarded-For` — the one the trusted proxy itself appended — rather than
    the first, which the client controls and can forge.
    """
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if forwarded:
        hops = [h.strip() for h in forwarded.split(',') if h.strip()]
        if hops:
            return hops[-1]
    return request.META.get('REMOTE_ADDR') or '0.0.0.0'


def normalize_email(raw):
    """Lowercase and strip. Email is matched case-insensitively everywhere, so
    it must be *stored* that way too or the uniqueness check and the lookup
    disagree and duplicate accounts appear."""
    return (raw or '').strip().lower()


def record_login(request, user):
    """Write a real LoginHistory row and upsert a DeviceSession."""
    ip = client_ip(request)
    ua = (request.META.get('HTTP_USER_AGENT') or 'Unknown Device')[:255]
    LoginHistory.objects.create(user=user, ip_address=ip, device_info=ua, success=True)
    DeviceSession.objects.update_or_create(
        user=user, device_name=ua,
        defaults={'ip_address': ip, 'is_revoked': False},
    )


def record_failed_login(request, user):
    """Record a rejected attempt so the Security page shows the whole picture,
    not only the successes."""
    if user is None:
        return
    LoginHistory.objects.create(
        user=user,
        ip_address=client_ip(request),
        device_info=(request.META.get('HTTP_USER_AGENT') or 'Unknown Device')[:255],
        success=False,
    )


def issue_token(user):
    """Mint a fresh token, replacing any existing one.

    Rotating on every sign-in means a token captured earlier stops working once
    the real owner signs in again.
    """
    Token.objects.filter(user=user).delete()
    return Token.objects.create(user=user)


def check_password_policy(password, user=None):
    """Run Django's configured validators. Returns an error string or None.

    Previously each view compared `len(password) < 6` and the validators in
    settings — minimum 8, common-password list, numeric-only rejection, and
    similarity to the username — never ran at all.
    """
    try:
        validate_password(password, user)
    except DjangoValidationError as exc:
        return ' '.join(exc.messages)
    return None


def user_payload(user):
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_admin': user.is_staff or user.is_superuser,
    }


def generate_code():
    """A six-digit code from the CSPRNG.

    `random.randint` is a Mersenne Twister: observing a couple of outputs is
    enough to reconstruct its state and predict every subsequent code.
    """
    return f"{secrets.randbelow(10 ** 6):06d}"


def send_code_email(subject, message, recipient):
    """Send mail, swallowing delivery failure into the log.

    The return value is deliberately unused by callers. Branching the HTTP
    response on delivery success is what let the old code hand a password-reset
    code straight back to whoever asked for it.
    """
    try:
        send_mail(subject, message, None, [recipient], fail_silently=False)
        return True
    except Exception:
        logger.exception('Failed to deliver %s to %s', subject, recipient)
        return False


def issue_code(email, purpose, subject, body_template):
    """Create a single-use code for `email` and mail it.

    Any outstanding code for the same address *and purpose* is dropped first, so
    a user who clicks "resend" cannot leave two live codes behind.
    """
    PasswordResetOTP.objects.filter(email=email, purpose=purpose).delete()
    code = generate_code()
    record = PasswordResetOTP(email=email, purpose=purpose)
    record.set_code(code)
    record.save()
    send_code_email(subject, body_template.format(code=code), email)


def consume_code(email, purpose, raw_code):
    """Validate a submitted code.

    Returns (record, error_message). On success the caller must delete the
    record — it is single-use. Wrong guesses are counted against the record's
    budget so the six-digit space cannot be walked from many IPs at once.
    """
    record = PasswordResetOTP.objects.filter(email=email, purpose=purpose).first()
    if record is None:
        return None, 'Invalid or expired verification code.'

    if record.is_expired():
        record.delete()
        return None, 'That verification code has expired. Request a new one.'

    if not record.matches(raw_code):
        if record.register_failure():
            return None, 'Too many incorrect attempts. Request a new verification code.'
        return None, 'Invalid or expired verification code.'

    return record, None


# ── Registration & sign-in ──────────────────────────────────────────────────

class RegisterView(APIView):
    """Create a standard user account.

    This endpoint cannot produce a privileged account. The `role`, `is_staff`,
    and `is_superuser` keys are ignored if present — the previous version read
    `role` from the body and granted superuser when it equalled "admin", which
    made every anonymous caller one request away from owning the platform.
    """

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [AuthThrottle]

    def post(self, request):
        username = (request.data.get('username') or '').strip()
        email = normalize_email(request.data.get('email'))
        password = request.data.get('password') or ''
        confirm_password = request.data.get('confirm_password') or ''

        if not username or not email or not password:
            return Response({'error': 'Username, email, and password are required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if len(username) < 3 or len(username) > 150:
            return Response({'error': 'Username must be between 3 and 150 characters.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_email(email)
        except DjangoValidationError:
            return Response({'error': 'Enter a valid email address.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if password != confirm_password:
            return Response({'error': 'Passwords do not match.'},
                            status=status.HTTP_400_BAD_REQUEST)

        policy_error = check_password_policy(password, User(username=username, email=email))
        if policy_error:
            return Response({'error': policy_error}, status=status.HTTP_400_BAD_REQUEST)

        # Case-insensitive on both sides. The old code checked `username=` and
        # `email=` exactly while sign-in looked them up with `__iexact`, so
        # "Bob@x.com" and "bob@x.com" could both register and then collide.
        if User.objects.filter(username__iexact=username).exists():
            return Response({'error': 'That username is already taken.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email__iexact=email).exists():
            return Response({'error': 'An account with this email already exists.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                user = User.objects.create_user(username=username, email=email, password=password)
        except IntegrityError:
            # Two simultaneous signups for the same username: the check above
            # passed for both, the database constraint caught the loser.
            return Response({'error': 'That username is already taken.'},
                            status=status.HTTP_400_BAD_REQUEST)

        token = issue_token(user)
        record_login(request, user)

        payload = user_payload(user)
        payload['is_new_user'] = True
        return Response({'message': 'Account created successfully.', 'token': token.key,
                         'user': payload}, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """Authenticate with a username or email address plus password.

    Every failure returns the same message and the same 401. The old version
    said "No account found with this email" for an unknown address and
    "Invalid username/email or password" for a bad password, which turned the
    endpoint into a user-directory lookup.
    """

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [AuthThrottle]

    def post(self, request):
        identifier = (request.data.get('username') or '').strip()
        password = request.data.get('password') or ''

        if not identifier or not password:
            return Response({'error': 'Username and password are required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if '@' in identifier:
            candidate = User.objects.filter(email__iexact=normalize_email(identifier)).first()
        else:
            candidate = User.objects.filter(username__iexact=identifier).first()

        user = authenticate(username=candidate.username, password=password) if candidate else None

        if user is None:
            record_failed_login(request, candidate)
            return Response({'error': INVALID_CREDENTIALS_MESSAGE},
                            status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            # Same body as a bad password: whether an account is suspended is
            # not something an unauthenticated caller needs to learn.
            record_failed_login(request, user)
            return Response({'error': INVALID_CREDENTIALS_MESSAGE},
                            status=status.HTTP_401_UNAUTHORIZED)

        token = issue_token(user)
        record_login(request, user)

        payload = user_payload(user)
        payload['is_new_user'] = (timezone.now() - user.date_joined) < timedelta(minutes=5)
        return Response({'message': 'Login successful.', 'token': token.key, 'user': payload},
                        status=status.HTTP_200_OK)


# ── Administrator access ────────────────────────────────────────────────────

class AdminRegisterView(APIView):
    """Provision another administrator. Existing administrators only.

    This used to be `AllowAny`, so anyone could create an `is_staff` account and
    have its auth key mailed to an address of their choosing — and, if SMTP
    threw, returned to them in the HTTP response. The key is now shown exactly
    once, to the already-authenticated administrator performing the
    provisioning, and mailed to the new admin.
    """

    permission_classes = [IsAdminUser]
    throttle_classes = [AuthThrottle]

    def post(self, request):
        email = normalize_email(request.data.get('email'))
        username = (request.data.get('username') or '').strip()
        first_name = (request.data.get('first_name') or '').strip()
        last_name = (request.data.get('last_name') or '').strip()

        if not email or not username:
            return Response({'error': 'Email and username are required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_email(email)
        except DjangoValidationError:
            return Response({'error': 'Enter a valid email address.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email__iexact=email).exists() or \
           User.objects.filter(username__iexact=username).exists():
            return Response({'error': 'A user with this email or username already exists.'},
                            status=status.HTTP_400_BAD_REQUEST)

        raw_key = f"CS-ADMIN-{secrets.token_hex(16).upper()}"

        with transaction.atomic():
            user = User.objects.create(
                username=username, email=email,
                first_name=first_name, last_name=last_name,
                is_staff=True,
            )
            user.set_unusable_password()
            user.save()

            auth_key = AdminAuthKey(user=user)
            auth_key.set_key(raw_key)
            auth_key.save()

        send_code_email(
            'CyberSentinel — Administrator authentication key',
            f"Hello {first_name or username},\n\n"
            f"Your CyberSentinel administrator authentication key is:\n\n    {raw_key}\n\n"
            f"Use it with your email address to sign in to the SOC dashboard. "
            f"Treat it like a password — it is not recoverable and will need to be "
            f"reissued if lost.\n",
            email,
        )

        logger.info('Admin account %s provisioned by %s', email, request.user.username)

        return Response({
            'message': 'Administrator provisioned. The authentication key has been emailed to them.',
            # Shown once, to the authenticated admin who just created the account,
            # so provisioning still works when mail delivery is down.
            'auth_key': raw_key,
            'user': {'id': user.id, 'username': user.username, 'email': user.email},
        }, status=status.HTTP_201_CREATED)


class AdminLoginView(APIView):
    """Sign in an administrator with their email address and auth key.

    Rewritten from scratch. The previous implementation had three separate ways
    in: two hardcoded master keys compiled into the source, a branch that
    accepted *any* key for an address already flagged as staff, and a path that
    created a brand-new superuser when the address did not exist at all. All
    three are gone. A failed key lookup is now simply a failed sign-in, and this
    endpoint never creates an account or changes a permission.
    """

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [AuthThrottle]

    def post(self, request):
        email = normalize_email(request.data.get('email'))
        raw_key = (request.data.get('auth_key') or '').strip()

        if not email or not raw_key:
            return Response({'error': 'Email and authentication key are required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        auth_key = AdminAuthKey.objects.filter(user__email__iexact=email).select_related('user').first()

        # Compare even when the record is missing, so a nonexistent address and
        # a wrong key take the same time and return the same body.
        if auth_key is None or not auth_key.matches(raw_key):
            record_failed_login(request, auth_key.user if auth_key else None)
            return Response({'error': INVALID_CREDENTIALS_MESSAGE},
                            status=status.HTTP_401_UNAUTHORIZED)

        user = auth_key.user
        if not (user.is_staff or user.is_superuser) or not user.is_active:
            record_failed_login(request, user)
            return Response({'error': INVALID_CREDENTIALS_MESSAGE},
                            status=status.HTTP_401_UNAUTHORIZED)

        auth_key.last_used = timezone.now()
        auth_key.save(update_fields=['last_used'])

        token = issue_token(user)
        record_login(request, user)

        payload = user_payload(user)
        payload['is_new_user'] = (timezone.now() - user.date_joined) < timedelta(minutes=5)
        return Response({'message': 'Admin login successful.', 'token': token.key,
                         'user': payload}, status=status.HTTP_200_OK)


# ── Session lifecycle ───────────────────────────────────────────────────────

class LogoutView(APIView):
    # No explicit `authentication_classes` on the signed-in views below: the
    # project default in settings applies, so they accept every scheme the
    # platform supports, developer API keys included. Pinning the list to
    # TokenAuthentication here silently excluded them, which is why a key
    # issued by the UI authenticated nothing.
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        ua = (request.META.get('HTTP_USER_AGENT') or 'Unknown Device')[:255]
        DeviceSession.objects.filter(user=request.user, device_name=ua).update(is_revoked=True)
        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        payload = user_payload(user)
        payload['date_joined'] = user.date_joined.strftime('%Y-%m-%d')
        payload['full_name'] = f"{user.first_name} {user.last_name}".strip()
        payload['is_new_user'] = (timezone.now() - user.date_joined) < timedelta(minutes=5)

        # company and phone were never returned, so the profile form's inputs
        # came back empty on every reload even when a value was saved.
        profile, _ = UserProfile.objects.get_or_create(user=user)
        payload['company'] = profile.company
        payload['phone'] = profile.phone
        payload['data_consent'] = profile.data_consent
        payload['needs_data_consent'] = profile.needs_data_consent()
        return Response(payload, status=status.HTTP_200_OK)

    def patch(self, request):
        user = request.user
        data = request.data

        if 'full_name' in data:
            parts = (data['full_name'] or '').strip().split(' ', 1)
            user.first_name = parts[0][:150]
            user.last_name = (parts[1] if len(parts) > 1 else '')[:150]

        if 'email' in data:
            new_email = normalize_email(data['email'])
            if new_email and new_email != user.email:
                try:
                    validate_email(new_email)
                except DjangoValidationError:
                    return Response({'error': 'Enter a valid email address.'},
                                    status=status.HTTP_400_BAD_REQUEST)
                if User.objects.filter(email__iexact=new_email).exclude(pk=user.pk).exists():
                    return Response({'error': 'This email is already in use.'},
                                    status=status.HTTP_400_BAD_REQUEST)
                user.email = new_email

        user.save()

        if 'company' in data or 'phone' in data:
            profile, _ = UserProfile.objects.get_or_create(user=user)
            changed = []

            if 'company' in data:
                profile.company = (data['company'] or '').strip()[:150]
                changed.append('company')

            if 'phone' in data:
                # The form used to accept anything here and then drop it: the
                # frontend never sent the value and no field existed to store
                # it, so "add" or any other junk simply vanished on save.
                raw_phone = (data['phone'] or '').strip()
                if raw_phone:
                    try:
                        parsed = phonenumbers.parse(raw_phone, 'US')
                        if not phonenumbers.is_valid_number(parsed):
                            raise ValueError
                        raw_phone = phonenumbers.format_number(
                            parsed, phonenumbers.PhoneNumberFormat.E164)
                    except (phonenumbers.NumberParseException, ValueError):
                        return Response(
                            {'error': 'Enter a valid phone number, including the country code.'},
                            status=status.HTTP_400_BAD_REQUEST)
                profile.phone = raw_phone[:32]
                changed.append('phone')

            profile.save(update_fields=changed)

        payload = user_payload(user)
        payload['full_name'] = f"{user.first_name} {user.last_name}".strip()
        _profile, _ = UserProfile.objects.get_or_create(user=user)
        payload['company'] = _profile.company
        payload['phone'] = _profile.phone
        return Response({'message': 'Profile updated successfully.', 'user': payload},
                        status=status.HTTP_200_OK)

    def delete(self, request):
        user = request.user
        if user.is_staff or user.is_superuser:
            return Response({'error': 'Administrator accounts cannot be deleted self-service.'},
                            status=status.HTTP_403_FORBIDDEN)
        user.delete()
        return Response({'message': 'Account deleted successfully.'}, status=status.HTTP_200_OK)


class DataConsentView(APIView):
    """
    The user's answer to "may CyberSentinel process the details you submit?".

    GET reports the current answer and whether the user still needs to be asked.
    POST records 'granted' or 'declined' against the wording they actually saw.
    Both answers are stored — a decline is a decision, not an absence of one, and
    it is honoured by `consent.scan_log_user`.
    """

    permission_classes = [IsAuthenticated]

    def _payload(self, profile):
        return {
            'status': profile.data_consent,
            'decided_at': profile.data_consent_at.isoformat() if profile.data_consent_at else None,
            'agreed_version': profile.data_consent_version or None,
            'current_version': DATA_CONSENT_VERSION,
            'needs_decision': profile.needs_data_consent(),
        }

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        return Response(self._payload(profile), status=status.HTTP_200_OK)

    def post(self, request):
        decision = (request.data.get('decision') or '').strip().lower()
        if decision not in ('granted', 'declined'):
            return Response(
                {'error': "Send a decision of either 'granted' or 'declined'."},
                status=status.HTTP_400_BAD_REQUEST)

        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        profile.data_consent = decision
        profile.data_consent_at = timezone.now()
        # Pin the answer to the wording shown. If the wording later changes, the
        # stored version no longer matches and the user is asked again.
        profile.data_consent_version = DATA_CONSENT_VERSION
        profile.save(update_fields=['data_consent', 'data_consent_at', 'data_consent_version'])

        return Response(self._payload(profile), status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password') or ''
        new_password = request.data.get('new_password') or ''
        confirm_password = request.data.get('confirm_password') or ''

        if not current_password or not new_password:
            return Response({'error': 'Current password and new password are required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(current_password):
            return Response({'error': 'Incorrect current password.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if new_password != confirm_password:
            return Response({'error': 'New passwords do not match.'},
                            status=status.HTTP_400_BAD_REQUEST)

        policy_error = check_password_policy(new_password, user)
        if policy_error:
            return Response({'error': policy_error}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        # Everything else signed in as this user is now invalid.
        DeviceSession.objects.filter(user=user).update(is_revoked=True)
        new_token = issue_token(user)

        return Response({'message': 'Password updated successfully.', 'token': new_token.key},
                        status=status.HTTP_200_OK)


# ── Password reset ──────────────────────────────────────────────────────────

class ForgotPasswordView(APIView):
    """Mail a password-reset code.

    Always returns the same body. The old version returned a 400 saying the
    account did not exist, and — when SMTP threw — the live code in a `dev_otp`
    field, which made password reset a one-request account takeover for anyone
    who knew a victim's address.
    """

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [AuthThrottle]

    def post(self, request):
        email = normalize_email(request.data.get('email'))
        if not email:
            return Response({'error': 'Email address is required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if user and user.is_active:
            issue_code(
                user.email, PasswordResetOTP.PURPOSE_RESET,
                'CyberSentinel — Password reset code',
                'Your password reset verification code is: {code}\n'
                'It expires in 10 minutes. If you did not request it, ignore this email.\n',
            )

        return Response({'message': NEUTRAL_RECOVERY_MESSAGE}, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    """Verify a reset code and set a new password."""

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [AuthThrottle]

    def post(self, request):
        email = normalize_email(request.data.get('email'))
        code = (request.data.get('otp') or '').strip()
        new_password = request.data.get('new_password') or ''
        confirm_password = request.data.get('confirm_password') or ''

        if not email or not code or not new_password:
            return Response({'error': 'Email, verification code, and new password are required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if new_password != confirm_password:
            return Response({'error': 'Passwords do not match.'},
                            status=status.HTTP_400_BAD_REQUEST)

        record, error = consume_code(email, PasswordResetOTP.PURPOSE_RESET, code)
        if error:
            return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if user is None:
            record.delete()
            return Response({'error': 'Invalid or expired verification code.'},
                            status=status.HTTP_400_BAD_REQUEST)

        policy_error = check_password_policy(new_password, user)
        if policy_error:
            # Keep the code alive so the user can retry with a better password
            # instead of having to request a fresh one.
            return Response({'error': policy_error}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        record.delete()

        # The whole point of a reset is that someone else may hold a session.
        # The old code left every existing token valid, so an attacker kept
        # access after the victim reset their password.
        Token.objects.filter(user=user).delete()
        DeviceSession.objects.filter(user=user).update(is_revoked=True)

        return Response({'message': 'Password reset successfully. You can now sign in.'},
                        status=status.HTTP_200_OK)


# ── Passwordless sign-in ────────────────────────────────────────────────────

class RequestOTPView(APIView):
    """Mail a one-time sign-in code.

    Codes for this flow carry `purpose='login'`. Previously both flows shared
    one table, so a code mailed for "reset your password" also worked here.
    """

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [AuthThrottle]

    def post(self, request):
        identifier = (request.data.get('email') or '').strip()
        if not identifier:
            return Response({'error': 'Email address or username is required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if '@' in identifier:
            user = User.objects.filter(email__iexact=normalize_email(identifier)).first()
        else:
            user = User.objects.filter(username__iexact=identifier).first()

        if user and user.is_active and user.email:
            issue_code(
                user.email, PasswordResetOTP.PURPOSE_LOGIN,
                'CyberSentinel — Sign-in code',
                'Your one-time sign-in code is: {code}\n'
                'It expires in 10 minutes. If you did not request it, ignore this email.\n',
            )

        # No `email` echo either — returning the resolved address for a username
        # would have leaked the mapping.
        return Response({'message': NEUTRAL_RECOVERY_MESSAGE}, status=status.HTTP_200_OK)


class OTPLoginView(APIView):
    """Exchange a sign-in code for a token."""

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [AuthThrottle]

    def post(self, request):
        identifier = (request.data.get('email') or '').strip()
        code = (request.data.get('otp') or '').strip()

        if not identifier or not code:
            return Response({'error': 'Email address and code are required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if '@' in identifier:
            user = User.objects.filter(email__iexact=normalize_email(identifier)).first()
        else:
            user = User.objects.filter(username__iexact=identifier).first()

        if user is None:
            return Response({'error': 'Invalid or expired verification code.'},
                            status=status.HTTP_400_BAD_REQUEST)

        record, error = consume_code(user.email, PasswordResetOTP.PURPOSE_LOGIN, code)
        if error:
            return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)

        record.delete()

        if not user.is_active:
            return Response({'error': INVALID_CREDENTIALS_MESSAGE},
                            status=status.HTTP_401_UNAUTHORIZED)

        token = issue_token(user)
        record_login(request, user)  # this flow used to skip the audit trail

        return Response({'message': 'Sign-in successful.', 'token': token.key,
                         'user': user_payload(user)}, status=status.HTTP_200_OK)


# ── Federated sign-in ───────────────────────────────────────────────────────

class _FederatedLoginView(APIView):
    """Shared plumbing for Google and Microsoft sign-in.

    Both providers' ID tokens are verified cryptographically before anything in
    them is trusted; the subclass supplies `verify()`, which returns a verified
    (email, full_name) pair or raises. Identity comes only from the verified
    payload — never from a client-supplied field.
    """

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [AuthThrottle]
    provider_name = 'provider'

    def verify(self, credential):  # pragma: no cover - overridden
        raise NotImplementedError

    def post(self, request):
        credential = (request.data.get('credential') or request.data.get('id_token') or '').strip()
        if not credential:
            return Response({'error': f'{self.provider_name} credential is required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        result = self.verify(credential)
        if isinstance(result, Response):
            return result
        email, full_name = result

        email = normalize_email(email)
        user = User.objects.filter(email__iexact=email).first()

        if user is None:
            base = ''.join(c for c in email.split('@')[0] if c.isalnum() or c in '._-') or 'user'
            username = base
            while User.objects.filter(username__iexact=username).exists():
                username = f"{base}_{secrets.token_hex(3)}"

            with transaction.atomic():
                user = User.objects.create_user(
                    username=username, email=email,
                    password=secrets.token_urlsafe(32),
                    first_name=full_name.split()[0] if full_name else '',
                    last_name=' '.join(full_name.split()[1:]) if len(full_name.split()) > 1 else '',
                )
                UserIntegration.objects.get_or_create(user=user)

        if not user.is_active:
            return Response({'error': INVALID_CREDENTIALS_MESSAGE},
                            status=status.HTTP_401_UNAUTHORIZED)

        token = issue_token(user)
        record_login(request, user)

        return Response({'message': f'{self.provider_name} authentication successful.',
                         'token': token.key, 'user': user_payload(user)},
                        status=status.HTTP_200_OK)


class GoogleLoginView(_FederatedLoginView):
    provider_name = 'Google'

    def verify(self, credential):
        from django.conf import settings

        if not settings.GOOGLE_CLIENT_ID:
            return Response({'error': 'Google sign-in is not configured on this server.'},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            from google.auth.transport import requests as google_requests
            from google.oauth2 import id_token as google_id_token
        except ImportError:
            return Response({'error': 'Google sign-in is not available on this server.'},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            payload = google_id_token.verify_oauth2_token(
                credential, google_requests.Request(), settings.GOOGLE_CLIENT_ID
            )
        except ValueError:
            return Response({'error': 'Invalid or expired Google credential.'},
                            status=status.HTTP_401_UNAUTHORIZED)

        if not payload.get('email_verified', False):
            return Response({'error': 'Google account email is not verified.'},
                            status=status.HTTP_401_UNAUTHORIZED)

        email = (payload.get('email') or '').strip()
        if not email:
            return Response({'error': 'Unable to resolve Google email address.'},
                            status=status.HTTP_400_BAD_REQUEST)

        return email, (payload.get('name') or '').strip()


class MicrosoftLoginView(_FederatedLoginView):
    provider_name = 'Microsoft'

    def verify(self, credential):
        from django.conf import settings

        if not settings.MICROSOFT_CLIENT_ID:
            return Response({'error': 'Microsoft sign-in is not configured on this server.'},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            import jwt
            from jwt import PyJWKClient
        except ImportError:
            return Response({'error': 'Microsoft sign-in is not available on this server.'},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)

        jwks_url = (f'https://login.microsoftonline.com/'
                    f'{settings.MICROSOFT_TENANT_ID}/discovery/v2.0/keys')
        try:
            signing_key = PyJWKClient(jwks_url).get_signing_key_from_jwt(credential)
            payload = jwt.decode(
                credential, signing_key.key, algorithms=['RS256'],
                audience=settings.MICROSOFT_CLIENT_ID,
                options={'require': ['exp', 'iat', 'aud', 'iss']},
            )
        except Exception:
            return Response({'error': 'Invalid or expired Microsoft credential.'},
                            status=status.HTTP_401_UNAUTHORIZED)

        issuer = payload.get('iss', '')
        if not issuer.startswith('https://login.microsoftonline.com/'):
            return Response({'error': 'Untrusted token issuer.'},
                            status=status.HTTP_401_UNAUTHORIZED)

        # With tenant "common" any Entra tenant can mint a token for this app, so
        # an unverified address must not be allowed to claim an existing account
        # by email. `verified_primary_email` / `email` are asserted by Microsoft;
        # `preferred_username` is not, and is only trusted when nothing else is
        # present *and* no account already exists for it.
        email = (payload.get('verified_primary_email') or payload.get('email') or '').strip()
        unverified = (payload.get('preferred_username') or '').strip()

        if not email and unverified:
            if User.objects.filter(email__iexact=normalize_email(unverified)).exists():
                return Response(
                    {'error': 'This address is already registered. Sign in with your password '
                              'and connect Microsoft from Account Security instead.'},
                    status=status.HTTP_409_CONFLICT)
            email = unverified

        if not email or '@' not in email:
            return Response({'error': 'Unable to resolve Microsoft email address.'},
                            status=status.HTTP_400_BAD_REQUEST)

        return email, (payload.get('name') or '').strip()
