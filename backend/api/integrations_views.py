import re
import requests
import base64
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated

from .models import ScanLog
from .ml_classifier import classifier

# Attempt Google API client imports
try:
    from googleapiclient.discovery import build
    from google.oauth2.credentials import Credentials
    GOOGLE_LIBS_AVAILABLE = True
except ImportError:
    GOOGLE_LIBS_AVAILABLE = False


class UserIntegrationView(APIView):
    """GET or UPDATE the current user's integration settings stored in the database."""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .models import UserIntegration
        config, _ = UserIntegration.objects.get_or_create(user=request.user)
        return Response({
            'gmail_client_id': config.gmail_client_id,
            'gmail_access_token': config.gmail_access_token,
            'twilio_sid': config.twilio_sid,
            'twilio_token': config.twilio_token,
            'twilio_from': config.twilio_from,
            'twilio_to': config.twilio_to,
            'openai_api_key': config.openai_api_key,
            'virustotal_api_key': config.virustotal_api_key,
        }, status=status.HTTP_200_OK)

    def post(self, request):
        from .models import UserIntegration
        config, _ = UserIntegration.objects.get_or_create(user=request.user)
        
        config.gmail_client_id = request.data.get('gmail_client_id', '').strip()
        config.gmail_access_token = request.data.get('gmail_access_token', '').strip()
        config.twilio_sid = request.data.get('twilio_sid', '').strip()
        config.twilio_token = request.data.get('twilio_token', '').strip()
        config.twilio_from = request.data.get('twilio_from', '').strip()
        config.twilio_to = request.data.get('twilio_to', '').strip()
        config.openai_api_key = request.data.get('openai_api_key', '').strip()
        config.virustotal_api_key = request.data.get('virustotal_api_key', '').strip()
        
        config.save()
        return Response({'message': 'Integrations config saved successfully.'}, status=status.HTTP_200_OK)


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
    """Import and scan real Gmail inbox messages. Requires a real connected Gmail
    account (see oauth_views.OAuthCallbackView) — no simulated fallback."""

    def post(self, request):
        user = request.user if request.user and request.user.is_authenticated else None
        access_token = request.data.get('access_token', '').strip()

        if not access_token and user:
            from .models import UserIntegration
            try:
                config = UserIntegration.objects.get(user=user)
                access_token = config.gmail_access_token
            except UserIntegration.DoesNotExist:
                pass

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
    """Dispatch SMS warnings using Twilio or simulated console printout, and log in DB."""

    def post(self, request):
        user = request.user if request.user and request.user.is_authenticated else None
        message = request.data.get('message', '').strip()
        to_number = request.data.get('to_number', '').strip()
        
        # Pull optional Twilio config
        sid = request.data.get('twilio_sid', '').strip()
        token = request.data.get('twilio_auth_token', '').strip()
        from_number = request.data.get('twilio_from', '').strip()

        # Check database config if authenticated
        if user and (not sid or not token or not from_number):
            from .models import UserIntegration
            try:
                config = UserIntegration.objects.get(user=user)
                sid = sid or config.twilio_sid
                token = token or config.twilio_token
                from_number = from_number or config.twilio_from
                to_number = to_number or config.twilio_to
            except UserIntegration.DoesNotExist:
                pass

        if not message or not to_number:
            return Response({'error': 'Message body and target number are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Run risk analysis on outbound SMS to log it
        analysis = classifier.analyze_text(message)
        
        log_entry = ScanLog.objects.create(
            user=user,
            scan_type='TEXT', # Log as SMS/Text channel
            input_content=message,
            sender='SYSTEM ALERT',
            subject=f"ALERT TO {to_number}",
            risk_score=analysis["risk_score"],
            risk_level=analysis["risk_level"]
        )

        sms_dispatched = False

        if sid and token and from_number:
            try:
                # Basic Auth for Twilio API
                url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
                payload = {
                    'From': from_number,
                    'To': to_number,
                    'Body': message
                }
                res = requests.post(url, data=payload, auth=(sid, token))
                if res.status_code in [200, 201]:
                    sms_dispatched = True
                else:
                    print(f"[TWILIO ERROR RESPONSE] Code: {res.status_code} | Body: {res.text}")
            except Exception as e:
                print(f"[TWILIO DISPATCH EXCEPTION] {str(e)}")

        if not sms_dispatched:
            # Simulated debug printout
            print(f"\n[DEV MOCK SMS INTERACTION]")
            print(f"==================================================")
            print(f"TO TARGET: {to_number}")
            print(f"SMS ALERT MESSAGE PAYLOAD:")
            print(f"{message}")
            print(f"==================================================\n")

        return Response({
            'message': 'SMS dispatched successfully via Twilio.' if sms_dispatched else 'SMS alert logged (Simulated Dispatch Mode).',
            'is_mocked': not sms_dispatched,
            'details': {
                'id': log_entry.id,
                'to': to_number,
                'content': message,
                'risk_level': log_entry.risk_level,
                'risk_score': log_entry.risk_score
            }
        }, status=status.HTTP_200_OK)


class GmailReplyDraftView(APIView):
    """Generate an AI reply draft based on phishing risk analysis results."""
    
    def post(self, request):
        original_sender = request.data.get('original_sender', 'Unknown').strip()
        original_subject = request.data.get('original_subject', 'No Subject').strip()
        original_body = request.data.get('original_body', '').strip()
        threat_level = request.data.get('threat_level', 'Low').strip()
        reply_style = request.data.get('reply_style', 'defensive').strip()

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
    """Returns public system credentials like the active Google Client ID."""
    def get(self, request):
        from .models import UserIntegration
        config = UserIntegration.objects.first()
        client_id = config.gmail_client_id if config else ''
        return Response({
            'gmail_client_id': client_id or 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'
        }, status=status.HTTP_200_OK)
