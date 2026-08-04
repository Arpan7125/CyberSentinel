from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .ml_classifier import classifier
from .url_analyzer import analyze_url
from .models import ScanLog, QuizQuestion

class ModelTestCase(TestCase):
    def test_ml_classifier_phishing(self):
        # A typical bank phishing message
        phish_msg = "URGENT: Your account is suspended. Verify credentials at http://secure-bank-login.net"
        res = classifier.analyze_text(phish_msg)
        self.assertGreater(res["risk_score"], 60.0)
        self.assertIn(res["risk_level"], ["High", "Critical"])
        
        # Verify urgency indicator is triggered
        indicator_types = [ind["type"] for ind in res["threat_indicators"]]
        self.assertIn("Urgency", indicator_types)

    def test_ml_classifier_safe(self):
        # A normal business/social message
        safe_msg = "Hi team, just a reminder that our weekly progress meeting is scheduled for tomorrow at 10:00 AM in the main conference room."
        res = classifier.analyze_text(safe_msg)
        self.assertLess(res["risk_score"], 30.0)
        self.assertEqual(res["risk_level"], "Low")

    def test_url_analyzer_spoofing(self):
        # Spoofed PayPal link
        url = "http://paypa1-security-verification.xyz/signin"
        res = analyze_url(url)
        self.assertGreater(res["risk_score"], 70.0)
        self.assertIn(res["risk_level"], ["High", "Critical"])
        
        # Verify brand spoofing flag
        self.assertTrue(res["details"]["brand_spoofing"])
        self.assertEqual(res["details"]["spoofed_brand"], "PayPal")

    def test_url_analyzer_safe(self):
        # Safe URL
        url = "https://www.google.com"
        res = analyze_url(url)
        self.assertEqual(res["risk_score"], 0.0)
        self.assertEqual(res["risk_level"], "Low")


class ApiEndpointsTestCase(APITestCase):
    def test_text_analysis_endpoint(self):
        url = reverse('analyze-text')
        data = {"text": "URGENT security alert: Reset password http://verification-support-login.info"}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("risk_score", response.data)
        self.assertIn("risk_level", response.data)
        
        # Verify it logged to the DB
        self.assertEqual(ScanLog.objects.count(), 1)
        self.assertEqual(ScanLog.objects.first().scan_type, 'TEXT')

    def test_url_analysis_endpoint(self):
        url = reverse('analyze-url')
        data = {"url": "http://netflix-billing-update.com"}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("risk_score", response.data)
        
        # Verify it logged to DB
        self.assertEqual(ScanLog.objects.count(), 1)
        self.assertEqual(ScanLog.objects.first().scan_type, 'URL')

    def test_dashboard_stats_endpoint_empty_state(self):
        # No scans yet — stats must reflect that honestly, not synthesize fake history.
        url = reverse('dashboard-stats')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_scans"], 0)
        self.assertEqual(response.data["recent_scans"], [])
        self.assertIn("chart_data", response.data)

    def test_dashboard_stats_endpoint_reflects_real_scan(self):
        # Stats must be computed from a real ScanLog row, not seeded data.
        analyze_url_endpoint = reverse('analyze-url')
        self.client.post(analyze_url_endpoint, {"url": "https://example.com"}, format='json')

        url = reverse('dashboard-stats')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_scans"], 1)
        self.assertEqual(len(response.data["recent_scans"]), 1)

    def test_quiz_questions_endpoint(self):
        url = reverse('quiz-questions')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify prepopulation of quiz questions
        self.assertGreater(len(response.data), 0)
        self.assertIn("scenario_name", response.data[0])


class AuthAndIntegrationsTestCase(APITestCase):
    def test_admin_registration(self):
        url = reverse('auth-register')
        data = {
            "username": "newadmin",
            "email": "newadmin@cybersentinel.ai",
            "password": "adminpassword123",
            "confirm_password": "adminpassword123",
            "role": "admin"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["user"]["is_admin"])

    def test_password_forgot_and_reset_flow(self):
        # 1. Register a user
        from django.contrib.auth.models import User
        user = User.objects.create_user(username="testuser", email="test@cybersentinel.ai", password="oldpassword123")
        
        # 2. Request OTP
        forgot_url = reverse('auth-forgot-password')
        forgot_data = {"email": "test@cybersentinel.ai"}
        response = self.client.post(forgot_url, forgot_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        otp = response.data.get("dev_otp")
        if not otp:
            from django.core import mail
            self.assertEqual(len(mail.outbox), 1)
            import re
            body = mail.outbox[0].body
            otp_match = re.search(r'verification code is: (\d{6})', body)
            self.assertIsNotNone(otp_match)
            otp = otp_match.group(1)
        self.assertIsNotNone(otp)
        
        # 3. Reset password
        reset_url = reverse('auth-reset-password')
        reset_data = {
            "email": "test@cybersentinel.ai",
            "otp": otp,
            "new_password": "newpassword123",
            "confirm_password": "newpassword123"
        }
        response = self.client.post(reset_url, reset_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 4. Verify login with new password
        login_url = reverse('auth-login')
        login_data = {"username": "testuser", "password": "newpassword123"}
        response = self.client.post(login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_gmail_import_without_connection_is_honest_error(self):
        # No Gmail account connected — must fail clearly, never fabricate an inbox.
        url = reverse('integrations-gmail-import')
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_sms_dispatch_simulated_endpoint(self):
        url = reverse('integrations-sms-dispatch')
        data = {
            "message": "Alert! CyberSentinel flagged high risk.",
            "to_number": "+1234567890"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_mocked"])

    def test_integrations_config_endpoint(self):
        # 1. Create user and authenticate
        from django.contrib.auth.models import User
        from rest_framework.authtoken.models import Token
        user = User.objects.create_user(username="configuser", email="config@cybersentinel.ai", password="password123")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key)

        # 2. Save config
        url = reverse('integrations-config')
        data = {
            "gmail_client_id": "test-client-id",
            "gmail_access_token": "test-access-token",
            "twilio_sid": "test-sid",
            "twilio_token": "test-token",
            "twilio_from": "+15005550006",
            "twilio_to": "+1234567890"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 3. Retrieve config
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["gmail_client_id"], "test-client-id")
        self.assertEqual(response.data["twilio_sid"], "test-sid")


