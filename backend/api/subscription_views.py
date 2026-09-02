from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser
from django.core.mail import send_mail
from django.conf import settings
from .masking import mask_email
from .models import Subscriber


class SubscribeView(APIView):
    """Subscribe an email address for daily threat digest updates."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        name = request.data.get('name', '').strip()
        
        if not email:
            return Response({'error': 'Email address is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate email format simply
        if '@' not in email or '.' not in email.split('@')[-1]:
            return Response({'error': 'Please enter a valid email address.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if already subscribed
        existing = Subscriber.objects.filter(email=email).first()
        if existing:
            if existing.is_active:
                return Response({'message': 'You are already subscribed to CyberSentinel updates!'}, status=status.HTTP_200_OK)
            else:
                # Re-activate
                existing.is_active = True
                existing.name = name or existing.name
                existing.save()
                
                # Send welcome-back email
                self._send_welcome_email(existing)
                
                return Response({
                    'message': 'Welcome back! Your subscription has been reactivated.',
                    'email': email,
                }, status=status.HTTP_200_OK)
        
        # Create new subscriber
        subscriber = Subscriber.objects.create(email=email, name=name)
        
        # Send welcome email (prints to console in dev)
        self._send_welcome_email(subscriber)
        
        return Response({
            'message': f'Successfully subscribed! You will receive daily threat updates at {email}.',
            'email': email,
        }, status=status.HTTP_201_CREATED)
    
    def _send_welcome_email(self, subscriber):
        """Send a welcome confirmation email."""
        subject = '🛡️ Welcome to CyberSentinel Daily Threat Digest'
        message = f"""
Hello{' ' + subscriber.name if subscriber.name else ''},

Welcome to CyberSentinel – your AI-powered cybersecurity guardian!

You've successfully subscribed to our Daily Threat Digest. You'll receive:
  • Real-time phishing attack summaries
  • New scam patterns detected globally
  • Weekly cyber awareness tips
  • Critical zero-day threat alerts

Stay safe online,
The CyberSentinel Team

---
To unsubscribe, visit: https://cybersentinel.ai/unsubscribe/{subscriber.unsubscribe_token}
        """.strip()
        
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[subscriber.email],
                fail_silently=True,
            )
        except Exception:
            pass  # Don't fail the API call if email fails


class UnsubscribeView(APIView):
    """Unsubscribe using email or token."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        token = request.data.get('token', '').strip()
        
        subscriber = None
        
        if token:
            subscriber = Subscriber.objects.filter(unsubscribe_token=token).first()
        elif email:
            subscriber = Subscriber.objects.filter(email=email).first()
        
        if not subscriber:
            return Response({'error': 'Subscription not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        subscriber.is_active = False
        subscriber.save()
        
        return Response({'message': 'You have been successfully unsubscribed.'}, status=status.HTTP_200_OK)


class SubscriberListView(APIView):
    """Admin-only: list all subscribers.

    Authorisation is enforced by DRF rather than by re-implementing token
    lookup here, so it stays consistent with every other admin surface.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        subscribers = Subscriber.objects.all().order_by('-created_at')
        data = [{
            'id': s.id,
            # Masked on the way out; reveal is a deliberate, audited action.
            'email': mask_email(s.email),
            'name': s.name,
            'is_active': s.is_active,
            'created_at': s.created_at.strftime('%Y-%m-%d %H:%M'),
        } for s in subscribers]
        
        return Response({'subscribers': data, 'total': len(data)}, status=status.HTTP_200_OK)
