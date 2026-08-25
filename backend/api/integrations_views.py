import base64
import logging
import re

import phonenumbers
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated

from .crypto import mask
from .models import ScanLog
from .ml_classifier import classifier
from .throttles import SmsThrottle

logger = logging.getLogger('api')

#: Requests to third parties always get a deadline. Without one a slow or
#: hanging upstream pins a worker process until the platform kills it.
UPSTREAM_TIMEOUT = 10

# Attempt Google API client imports
try:
    from googleapiclient.discovery import build
    from google.oauth2.credentials import Credentials
    GOOGLE_LIBS_AVAILABLE = True
except ImportError:
    GOOGLE_LIBS_AVAILABLE = False


class UserIntegrationView(APIView):
    """Read or update the current user's integration settings.

    Credentials are write-only. The GET response reports whether each one is
    configured and shows a masked suffix so the user can tell which key is
    stored, but never returns the value — sending a customer's Twilio token or
    OpenAI key back down the wire would undo encrypting it at rest, and put it
    in browser memory, logs, and any proxy in between.
    """

    permission_classes = [IsAuthenticated]

    #: (field name, whether the value is secret)
    FIELDS = [
        ('gmail_client_id', False),
        ('twilio_sid', False),
        ('twilio_from', False),
        ('twilio_to', False),
        ('gmail_access_token', True),
        ('twilio_token', True),
        ('openai_api_key', True),
        ('virustotal_api_key', True),
    ]

    def get(self, request):
        from .models import UserIntegration
        config, _ = UserIntegration.objects.get_or_create(user=request.user)

        payload = {}
        for name, is_secret in self.FIELDS:
            value = getattr(config, name) or ''
            if is_secret:
                payload[name] = mask(value)
                payload[f'{name}_configured'] = bool(value)
            else:
                payload[name] = value
        return Response(payload, status=status.HTTP_200_OK)

    def post(self, request):
        from .models import UserIntegration
        config, _ = UserIntegration.objects.get_or_create(user=request.user)

        for name, is_secret in self.FIELDS:
            if name not in request.data:
                # Absent means "leave alone". The previous version defaulted
                # every missing key to '' and saved, so a partial update wiped
                # whatever it did not mention.
                continue
            value = (request.data.get(name) or '').strip()
            if is_secret and value.startswith('•'):
                # The client echoed the masked placeholder back unchanged.
                continue
            setattr(config, name, value[:2000])

        config.save()
        return Response({'message': 'Integration settings saved.'}, status=status.HTTP_200_OK)


def sync_gmail_real(user, access_token):
    """Fetch and scan real inbox messages via the Gmail API. Returns None if the
    Google client libs aren't installed or the API call fails — callers decide
    how to surface that (never silently substitute fake data themselves)."""
    if not GOOGLE_LIBS_AVAILABLE or not access_token:
        return None
    try:
        creds = Credentials(token=access_token)
        service = build('gmail', 'v1', credentials=creds)

        list_response = service.users().messages().list(userId='me', q='label:INBOX', maxResults=5).execute()
        messages = list_response.get('messages', [])

        results = []
        for msg in messages:
            msg_detail = service.users().messages().get(userId='me', id=msg['id'], format='full').execute()
            payload = msg_detail.get('payload', {})
            headers = payload.get('headers', [])

            subject = "No Subject"
            sender = "Unknown Sender"
            auth_results = ""
            for header in headers:
                h_name = header['name'].lower()
                if h_name == 'subject':
                    subject = header['value']
                elif h_name == 'from':
                    sender = header['value']
                elif h_name == 'authentication-results':
                    auth_results = header['value']

            def _auth_verdict(mechanism):
                m = re.search(rf'{mechanism}=(\w+)', auth_results, re.IGNORECASE)
                return m.group(1).capitalize() if m else 'Unavailable'

            body_text = msg_detail.get('snippet', '')
            for part in payload.get('parts', []):
                if part['mimeType'] == 'text/plain':
                    data = part.get('body', {}).get('data', '')
                    if data:
                        body_text = base64.urlsafe_b64decode(data.encode('ASCII')).decode('utf-8', errors='ignore')
                        break

            scan_content = f"Sender: {sender}\nSubject: {subject}\nContent: {body_text}"
            analysis = classifier.analyze_text(scan_content)

            log_entry = ScanLog.objects.create(
                user=user,
                scan_type='TEXT',
                input_content=body_text,
                sender=sender,
                subject=subject,
                risk_score=analysis["risk_score"],
                risk_level=analysis["risk_level"]
            )

            results.append({
                'id': log_entry.id,
                'sender': sender,
                'subject': subject,
                'body_snippet': body_text[:200] + ('...' if len(body_text) > 200 else ''),
                'risk_score': analysis["risk_score"],
                'risk_level': analysis["risk_level"],
                'threat_indicators': analysis["threat_indicators"],
                # Real values parsed from Gmail's Authentication-Results header, not derived from risk_score.
                'spf': _auth_verdict('spf'),
                'dkim': _auth_verdict('dkim'),
                'dmarc': _auth_verdict('dmarc'),
            })
        return results
    except Exception as e:
        print(f"[GMAIL API IMPORT ERROR] {str(e)}")
        return None


class GmailImportView(APIView):
    """Import and scan the signed-in user's Gmail inbox.

    The access token comes from the user's own stored connection and nowhere
    else. It used to be accepted from the request body on an unauthenticated
    endpoint, which let anyone drive Gmail API traffic through this server with
    a token of their choosing — and meant the auth check the test suite expects
    never happened.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        from .models import UserIntegration
        config, _ = UserIntegration.objects.get_or_create(user=user)
        access_token = config.gmail_access_token

        if not access_token:
            return Response({
                'error': 'No Gmail account connected. Connect Gmail under Settings → Integrations first.'
            }, status=status.HTTP_400_BAD_REQUEST)

        results = sync_gmail_real(user, access_token)
        if results is None:
            return Response({
                'error': 'Could not read your Gmail inbox — the connection may have expired. Try reconnecting Gmail.'
            }, status=status.HTTP_502_BAD_GATEWAY)

        return Response({
            'message': f'Successfully synced {len(results)} emails from Gmail.',
            'source': 'Gmail API',
            'emails': results
        }, status=status.HTTP_200_OK)


class SmsDispatchView(APIView):
    """Send an SMS warning to a number the user has configured.

    This endpoint used to take an arbitrary body and an arbitrary destination
    with no validation and no dedicated rate limit, which under the default
    1000/hour user allowance made it a thousand-messages-an-hour smishing relay
    running on the platform's own Twilio credit. It now requires
    authentication, parses the destination as a real phone number, caps the
    body, and has its own throttle scope.
    """

    permission_classes = [IsAuthenticated]
    throttle_classes = [SmsThrottle]

    MAX_BODY_CHARS = 480  # three concatenated GSM segments

    def post(self, request):
        user = request.user
        message = (request.data.get('message') or '').strip()
        to_number = (request.data.get('to_number') or '').strip()

        from .models import UserIntegration
        config, _ = UserIntegration.objects.get_or_create(user=user)

        # Twilio credentials come from the user's stored config only. Accepting
        # them from the request body let a caller drive someone else's Twilio
        # account through our server, and put live credentials in request logs.
        sid = config.twilio_sid
        token = config.twilio_token
        from_number = config.twilio_from
        to_number = to_number or config.twilio_to

        if not message:
            return Response({'error': 'Message body is required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if len(message) > self.MAX_BODY_CHARS:
            return Response(
                {'error': f'Message is too long. Keep it under {self.MAX_BODY_CHARS} characters.'},
                status=status.HTTP_400_BAD_REQUEST)

        if not to_number:
            return Response({'error': 'A destination number is required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            parsed = phonenumbers.parse(to_number, None)
            if not phonenumbers.is_valid_number(parsed):
                raise phonenumbers.NumberParseException(0, 'invalid')
            to_number = phonenumbers.format_number(
                parsed, phonenumbers.PhoneNumberFormat.E164)
        except phonenumbers.NumberParseException:
            return Response(
                {'error': 'Enter the destination in international format, e.g. +14155550123.'},
                status=status.HTTP_400_BAD_REQUEST)

        # The destination stays user-chosen — sending an alert to a colleague is
        # the feature. What made this an open relay was the combination of no
        # authentication, no number validation, no rate limit, and credentials
        # accepted from the request body. All four are closed above: the caller
        # is authenticated, the number must parse, SmsThrottle caps the endpoint
        # at 20/hour, and the Twilio account billed is the user's own.

        analysis = classifier.analyze_text(message)

        log_entry = ScanLog.objects.create(
            user=user,
            scan_type='TEXT',
            input_content=message,
            sender='SYSTEM ALERT',
            subject=f"ALERT TO {to_number}",
            risk_score=analysis["risk_score"],
            risk_level=analysis["risk_level"],
        )

        if not (sid and token and from_number):
            return Response({
                'error': 'SMS alerts are not configured. Add your Twilio SID, auth token, and '
                         'sending number in Settings → Integrations.',
                'is_configured': False,
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            res = requests.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json",
                data={'From': from_number, 'To': to_number, 'Body': message},
                auth=(sid, token),
                timeout=UPSTREAM_TIMEOUT,
            )
        except requests.RequestException:
            logger.exception('Twilio dispatch failed for user %s', user.id)
            return Response({'error': "Couldn't reach Twilio. The alert was logged but not sent."},
                            status=status.HTTP_502_BAD_GATEWAY)

        if res.status_code not in (200, 201):
            logger.warning('Twilio rejected message for user %s: %s %s',
                           user.id, res.status_code, res.text[:300])
            return Response({'error': 'Twilio rejected the message. Check your sending number '
                                      'and account status.'},
                            status=status.HTTP_502_BAD_GATEWAY)

        return Response({
            'message': 'SMS alert sent.',
            'details': {
                'id': log_entry.id,
                'to': to_number,
                'risk_level': log_entry.risk_level,
                'risk_score': log_entry.risk_score,
            }
        }, status=status.HTTP_200_OK)


class GmailReplyDraftView(APIView):
    """Generate a reply draft from a phishing risk analysis."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        original_sender = (request.data.get('original_sender') or 'Unknown').strip()[:255]
        original_subject = (request.data.get('original_subject') or 'No Subject').strip()[:255]
        original_body = (request.data.get('original_body') or '').strip()[:5000]
        threat_level = (request.data.get('threat_level') or 'Low').strip()[:20]
        reply_style = (request.data.get('reply_style') or 'defensive').strip()[:20]

        draft = ""

        if reply_style == 'report':
            draft = (
                f"ALERT: SUSPICIOUS EMAIL FLAGGED BY CYBERSENTINEL\n"
                f"--------------------------------------------------\n"
                f"Sender Profile: {original_sender}\n"
                f"Subject Header: {original_subject}\n"
                f"Threat Level: {threat_level}\n\n"
                f"Analysis Detail:\n"
                f"Our heuristic engine detected anomalous indicators matching phishing vectors "
                f"(credential harvesting / fake authority pattern). The source domain is marked unsafe.\n\n"
                f"Original Body Summary:\n"
                f"\"\"{original_body[:250]}...\"\"\n\n"
                f"This log is queued for administrative audit."
            )
        elif reply_style == 'defensive':
            draft = (
                f"Dear Sender,\n\n"
                f"Thank you for contacting our department regarding '{original_subject}'.\n\n"
                f"To comply with corporate data security directives, we require authentication "
                f"verification for all emails requesting credentials, account resets, or payment reviews. "
                f"Please reply to this email providing your direct company extension and department code, "
                f"or resubmit this request using our verified intranet ticket portal.\n\n"
                f"If we do not receive official security validation, this transaction request will be dismissed.\n\n"
                f"Regards,\n"
                f"Security Operations Node\n"
                f"Ref ID: CS-{abs(hash(original_subject)) % 100000}"
            )
        else: # Standard reply style
            draft = (
                f"Hello,\n\n"
                f"I have received your correspondence regarding '{original_subject}'. "
                f"Our teams will review the details and respond as appropriate.\n\n"
                f"Best regards,\n"
                f"System Operations"
            )

        return Response({
            'draft': draft,
            'style': reply_style,
            'threat_level': threat_level
        }, status=status.HTTP_200_OK)

class PublicConfigView(APIView):
    """Public, non-secret client configuration the frontend needs before sign-in.

    Reads the platform's own credentials from settings. It must never fall back
    to `UserIntegration.objects.first()` — that served one arbitrary customer's
    OAuth client ID to every anonymous visitor.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        client_id = settings.GOOGLE_CLIENT_ID
        return Response({
            'gmail_client_id': client_id,
            # Lets the UI hide the Google button entirely instead of rendering
            # one that fails the moment it is clicked.
            'google_oauth_configured': bool(client_id and settings.GOOGLE_CLIENT_SECRET),
            'microsoft_client_id': settings.MICROSOFT_CLIENT_ID,
            'microsoft_oauth_configured': bool(settings.MICROSOFT_CLIENT_ID),
            'virustotal_configured': bool(settings.VIRUSTOTAL_API_KEY),
            'email_delivery_configured': (
                settings.EMAIL_BACKEND == 'django.core.mail.backends.smtp.EmailBackend'
            ),
            'realtime_configured': bool(settings.REDIS_URL),
        }, status=status.HTTP_200_OK)
