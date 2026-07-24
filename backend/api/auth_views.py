from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token


class RegisterView(APIView):
    """Register a new user account."""
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')
        confirm_password = request.data.get('confirm_password', '')
        
        # Validation
        if not username or not email or not password:
            return Response({'error': 'Username, email, and password are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if len(username) < 3:
            return Response({'error': 'Username must be at least 3 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if len(password) < 6:
            return Response({'error': 'Password must be at least 6 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if password != confirm_password:
            return Response({'error': 'Passwords do not match.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username is already taken.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({'error': 'An account with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create user
        role = request.data.get('role', 'user').strip().lower()
        user = User.objects.create_user(username=username, email=email, password=password)
        if role == 'admin':
            user.is_staff = True
            user.is_superuser = True
            user.save()
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            'message': 'Account created successfully!',
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_admin': user.is_staff or user.is_superuser,
                'is_new_user': True,
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """Authenticate user and return auth token."""
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def post(self, request):
        from django.contrib.auth import authenticate
        
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')
        
        if not username or not password:
            return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Support login by email
        if '@' in username:
            try:
                user_obj = User.objects.get(email=username)
                username = user_obj.username
            except User.DoesNotExist:
                return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = authenticate(username=username, password=password)
        
        if not user:
            return Response({'error': 'Invalid credentials. Please try again.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user.is_active:
            return Response({'error': 'Account is disabled.'}, status=status.HTTP_403_FORBIDDEN)
        
        token, _ = Token.objects.get_or_create(user=user)
        
        from django.utils import timezone
        from datetime import timedelta
        is_new_user = (timezone.now() - user.date_joined) < timedelta(minutes=5)
        
        return Response({
            'message': 'Login successful.',
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_admin': user.is_staff or user.is_superuser
            }
        }, status=status.HTTP_200_OK)


class AdminRegisterView(APIView):
    """Register a new admin and send them an Auth Key via email."""
    authentication_classes = []
    permission_classes = [AllowAny]
    def post(self, request):
        import uuid
        from django.core.mail import send_mail
        from .models import AdminAuthKey
        
        email = request.data.get('email', '').strip()
        username = request.data.get('username', '').strip()
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()

        if not email or not username:
            return Response({'error': 'Email and Username are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists() or User.objects.filter(username=username).exists():
            return Response({'error': 'A user with this email or username already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            is_staff=True
        )
        user.set_unusable_password()
        user.save()

        # Generate unique auth key
        auth_key_str = f"CS-ADMIN-{uuid.uuid4().hex[:8].upper()}"
        AdminAuthKey.objects.create(user=user, auth_key=auth_key_str)

        subject = 'CyberSentinel - Admin Authentication Key'
        message = f"Hello {first_name or username},\n\nYour CyberSentinel Admin Authentication Key is: {auth_key_str}\n\nPlease keep this key secure. You will use this key along with your email to login to the SOC Dashboard."
        from_email = 'no-reply@cybersentinel.ai'
        
        email_sent = False
        try:
            send_mail(subject, message, from_email, [email], fail_silently=False)
            email_sent = True
        except Exception as e:
            print(f"\n[DEV MOCK MODE] Failed to send email via SMTP: {str(e)}")
            print(f"==================================================")
            print(f"ADMIN AUTH KEY FOR: {email}")
            print(f"AUTH KEY: {auth_key_str}")
            print(f"==================================================\n")

        return Response({
            'message': 'Admin registered successfully. Authentication key has been sent to your email.' if email_sent else 'Admin registered successfully (Mock Mode - check console for auth key).',
            'is_mocked': not email_sent,
            'dev_auth_key': auth_key_str if not email_sent else None
        }, status=status.HTTP_201_CREATED)


class AdminLoginView(APIView):
    """Login an admin using their email and Auth Key."""
    authentication_classes = []
    permission_classes = [AllowAny]
    def post(self, request):
        from .models import AdminAuthKey
        from django.utils import timezone
        
        email = request.data.get('email', '').strip()
        auth_key_str = request.data.get('auth_key', '').strip()

        if not email or not auth_key_str:
            return Response({'error': 'Email and Authentication Key are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            auth_key_obj = AdminAuthKey.objects.get(user__email=email, auth_key=auth_key_str)
        except AdminAuthKey.DoesNotExist:
            return Response({'error': 'Invalid email or authentication key.'}, status=status.HTTP_400_BAD_REQUEST)

        user = auth_key_obj.user
        
        if not (user.is_staff or user.is_superuser):
            return Response({'error': 'User does not have administrator privileges.'}, status=status.HTTP_403_FORBIDDEN)

        # Update last used
        auth_key_obj.last_used = timezone.now()
        auth_key_obj.save()

        token, _ = Token.objects.get_or_create(user=user)
        
        from django.utils import timezone
        from datetime import timedelta
        is_new_user = (timezone.now() - user.date_joined) < timedelta(minutes=5)

        return Response({
            'message': 'Admin login successful!',
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_admin': True,
                'is_new_user': is_new_user,
            }
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """Invalidate the user's auth token."""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)


class ProfileView(APIView):
    """Get the current user's profile."""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        from django.utils import timezone
        from datetime import timedelta
        is_new_user = (timezone.now() - user.date_joined) < timedelta(minutes=5)
        
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_admin': user.is_staff or user.is_superuser,
            'date_joined': user.date_joined.strftime('%Y-%m-%d'),
            'is_new_user': is_new_user,
        }, status=status.HTTP_200_OK)

    def patch(self, request):
        """Update the current user's profile fields."""
        user = request.user
        data = request.data
        
        if 'full_name' in data:
            name_parts = data['full_name'].strip().split(' ', 1)
            user.first_name = name_parts[0]
            user.last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        if 'email' in data:
            new_email = data['email'].strip()
            if new_email and new_email != user.email:
                if User.objects.filter(email=new_email).exclude(pk=user.pk).exists():
                    return Response({'error': 'This email is already in use.'}, status=status.HTTP_400_BAD_REQUEST)
                user.email = new_email
        
        user.save()
        
        # Update UserProfile fields (company, phone)
        try:
            from .models import UserProfile
            profile, _ = UserProfile.objects.get_or_create(user=user)
            if 'company' in data:
                profile.company = data['company'].strip()
                profile.save()
        except Exception:
            pass
        
        return Response({
            'message': 'Profile updated successfully.',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': f"{user.first_name} {user.last_name}".strip(),
                'is_admin': user.is_staff or user.is_superuser,
            }
        }, status=status.HTTP_200_OK)

    def delete(self, request):
        user = request.user
        if user.is_staff or user.is_superuser:
            return Response({'error': 'Administrator accounts cannot be deleted self-service.'}, status=status.HTTP_403_FORBIDDEN)
        user.delete()
        return Response({'message': 'Account deleted successfully.'}, status=status.HTTP_200_OK)


class ForgotPasswordView(APIView):
    """Generate OTP and send via email for password reset."""
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def post(self, request):
        import random
        from django.core.mail import send_mail
        from .models import PasswordResetOTP
        
        email = request.data.get('email', '').strip()
        if not email:
            return Response({'error': 'Email address is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not User.objects.filter(email=email).exists():
            return Response({'error': 'Account with this email does not exist.'}, status=status.HTTP_400_BAD_REQUEST)
            
        PasswordResetOTP.objects.filter(email=email).delete()
        
        otp = f"{random.randint(100000, 999999)}"
        PasswordResetOTP.objects.create(email=email, otp=otp)
        
        subject = 'CyberSentinel - Password Reset Verification Code'
        message = f"Your password reset verification code is: {otp}\nThis code will expire in 10 minutes."
        from_email = 'no-reply@cybersentinel.ai'
        
        email_sent = False
        try:
            send_mail(subject, message, from_email, [email], fail_silently=False)
            email_sent = True
        except Exception as e:
            print(f"\n[DEV MOCK MODE] Failed to send email via SMTP: {str(e)}")
            print(f"==================================================")
            print(f"PASSWORD RESET REQUEST FOR: {email}")
            print(f"VERIFICATION OTP CODE: {otp}")
            print(f"==================================================\n")
            
        return Response({
            'message': 'Verification code sent to your email.' if email_sent else 'Verification code generated (Dev Mode).',
            'dev_otp': otp if not email_sent else None,
            'is_mocked': not email_sent
        }, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    """Verify OTP and reset password."""
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def post(self, request):
        from .models import PasswordResetOTP
        
        email = request.data.get('email', '').strip()
        otp = request.data.get('otp', '').strip()
        new_password = request.data.get('new_password', '')
        confirm_password = request.data.get('confirm_password', '')
        
        if not email or not otp or not new_password:
            return Response({'error': 'Email, verification code, and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if new_password != confirm_password:
            return Response({'error': 'Passwords do not match.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if len(new_password) < 6:
            return Response({'error': 'Password must be at least 6 characters.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            otp_record = PasswordResetOTP.objects.get(email=email, otp=otp)
        except PasswordResetOTP.DoesNotExist:
            return Response({'error': 'Invalid verification code or email.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if otp_record.is_expired():
            otp_record.delete()
            return Response({'error': 'Verification code has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email)
            user.set_password(new_password)
            user.save()
            
            otp_record.delete()
            return Response({'message': 'Password has been reset successfully. You can now login.'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User matching this email no longer exists.'}, status=status.HTTP_400_BAD_REQUEST)


class RequestOTPView(APIView):
    """Generate and send 6-digit OTP to user for direct OTP login."""
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def post(self, request):
        import random
        from django.core.mail import send_mail
        from .models import PasswordResetOTP
        
        email = request.data.get('email', '').strip()
        if not email:
            return Response({'error': 'Email address or Username is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        user = User.objects.filter(email=email).first()
        if not user and '@' not in email:
            user = User.objects.filter(username=email).first()
            if user:
                email = user.email

        if not user:
            return Response({'error': 'No registered account found with this email or username.'}, status=status.HTTP_400_BAD_REQUEST)

        PasswordResetOTP.objects.filter(email=user.email).delete()
        
        otp = f"{random.randint(100000, 999999)}"
        PasswordResetOTP.objects.create(email=user.email, otp=otp)
        
        subject = 'CyberSentinel - Login Verification OTP Code'
        message = f"Hello {user.username},\n\nYour 6-digit login OTP code is: {otp}\nThis code will expire in 10 minutes."
        from_email = 'no-reply@cybersentinel.ai'
        
        email_sent = False
        try:
            send_mail(subject, message, from_email, [user.email], fail_silently=False)
            email_sent = True
        except Exception as e:
            print(f"\n[DEV MODE] OTP Generated for {user.email}: {otp}\n")
            
        return Response({
            'message': 'Login OTP code sent to your email.' if email_sent else 'Login OTP code generated.',
            'dev_otp': otp if not email_sent else None,
            'is_mocked': not email_sent,
            'email': user.email
        }, status=status.HTTP_200_OK)


class OTPLoginView(APIView):
    """Authenticate user with email and 6-digit OTP code."""
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def post(self, request):
        from .models import PasswordResetOTP
        
        email = request.data.get('email', '').strip()
        otp = request.data.get('otp', '').strip()
        
        if not email or not otp:
            return Response({'error': 'Email address and OTP code are required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            otp_record = PasswordResetOTP.objects.get(email=email, otp=otp)
        except PasswordResetOTP.DoesNotExist:
            user_by_name = User.objects.filter(username=email).first()
            if user_by_name:
                try:
                    otp_record = PasswordResetOTP.objects.get(email=user_by_name.email, otp=otp)
                    email = user_by_name.email
                except PasswordResetOTP.DoesNotExist:
                    return Response({'error': 'Invalid OTP code.'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'error': 'Invalid OTP code or email.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if otp_record.is_expired():
            otp_record.delete()
            return Response({'error': 'OTP code has expired. Please request a new code.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email)
            if not user.is_active:
                return Response({'error': 'Account is disabled.'}, status=status.HTTP_403_FORBIDDEN)
                
            token, _ = Token.objects.get_or_create(user=user)
            otp_record.delete()
            
            return Response({
                'message': 'OTP verification successful!',
                'token': token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_admin': user.is_staff or user.is_superuser
                }
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User matching this email no longer exists.'}, status=status.HTTP_400_BAD_REQUEST)


class GoogleLoginView(APIView):
    """
    Validates a Google ID Token or Google user credential sent from frontend.
    Auto-registers the user if their email is not already in the system.
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    def post(self, request):
        import requests
        token = request.data.get('id_token', '').strip()
        email = request.data.get('email', '').strip()
        full_name = request.data.get('name', '').strip()

        if not token and not email:
            return Response({'error': 'Google token or email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not email and token:
            try:
                res = requests.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={token}", timeout=5)
                if res.status_code == 200:
                    token_info = res.json()
                    email = token_info.get('email', '').strip()
                    full_name = token_info.get('name', full_name)
            except Exception:
                pass
            
            if not email and ('@' in token):
                email = token
            elif not email:
                email = "google_user@cybersentinel.ai"

        if not email:
            return Response({'error': 'Unable to resolve Google email address.'}, status=status.HTTP_400_BAD_REQUEST)

        user_exists = User.objects.filter(email=email).exists()
        if not user_exists:
            username_base = email.split('@')[0]
            username = username_base
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{username_base}_{counter}"
                counter += 1
            
            import secrets
            rand_pass = secrets.token_hex(16)
            user = User.objects.create_user(
                username=username,
                email=email,
                password=rand_pass,
                first_name=full_name.split()[0] if full_name else '',
                last_name=' '.join(full_name.split()[1:]) if full_name and len(full_name.split()) > 1 else ''
            )
            from .models import UserIntegration
            UserIntegration.objects.get_or_create(user=user)
        else:
            user = User.objects.get(email=email)
        
        if not user.is_active:
            return Response({'error': 'Account is disabled.'}, status=status.HTTP_403_FORBIDDEN)
        
        from rest_framework.authtoken.models import Token
        auth_token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            'message': 'Google authentication successful!',
            'token': auth_token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_admin': user.is_staff or user.is_superuser
            }
        }, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    """Allow an authenticated user to change their password."""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password', '')
        new_password = request.data.get('new_password', '')
        confirm_password = request.data.get('confirm_password', '')

        if not current_password or not new_password:
            return Response({'error': 'Current password and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(current_password):
            return Response({'error': 'Incorrect current password.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 6:
            return Response({'error': 'New password must be at least 6 characters long.'}, status=status.HTTP_400_BAD_REQUEST)

        if new_password != confirm_password:
            return Response({'error': 'New passwords do not match.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        # Update auth token after password change
        from rest_framework.authtoken.models import Token
        Token.objects.filter(user=user).delete()
        new_token = Token.objects.create(user=user)

        return Response({
            'message': 'Password updated successfully.',
            'token': new_token.key
        }, status=status.HTTP_200_OK)




