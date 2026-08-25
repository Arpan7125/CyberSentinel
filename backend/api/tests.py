import re

from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .ml_classifier import classifier
from .models import (
    AdminAuthKey, ConnectedAccount, DeviceSession, OAuthProvider, OAuthState,
    PasswordResetOTP, PaymentInvoice, ScamReport, ScanLog, SubscriptionPlan,
    SupportTicket, TicketReply, UserIntegration, UserSubscription,
)
from .url_analyzer import analyze_url

# Throttling is exercised by its own test below. Everywhere else it would make
# results depend on how many requests earlier tests happened to make.
NO_THROTTLE = override_settings(
    REST_FRAMEWORK={
        'DEFAULT_AUTHENTICATION_CLASSES': [
            'rest_framework.authentication.TokenAuthentication',
            'rest_framework.authentication.SessionAuthentication',
            'api.authentication.DeveloperApiKeyAuthentication',
        ],
        'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
        'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
        'PAGE_SIZE': 100,
    }
)


class ClassifierTestCase(TestCase):
    def test_phishing_message_is_flagged(self):
        result = classifier.analyze_text(
            "URGENT: Your account is suspended. Verify credentials at http://secure-bank-login.net"
        )
        self.assertGreater(result["risk_score"], 60.0)
        self.assertIn(result["risk_level"], ["High", "Critical"])

        indicator_types = [ind["type"] for ind in result["threat_indicators"]]
        self.assertIn("Manufactured Urgency", indicator_types)

    def test_ordinary_message_is_not_flagged(self):
        result = classifier.analyze_text(
            "Hi team, just a reminder that our weekly progress meeting is scheduled "
            "for tomorrow at 10:00 AM in the main conference room."
        )
        self.assertLess(result["risk_score"], 30.0)
        self.assertEqual(result["risk_level"], "Low")

    def test_legitimate_receipt_wording_is_not_a_false_positive(self):
        """Real receipts are full of scam-adjacent words like refund and invoice.

        Scoring these as threats is what trains users to ignore warnings, so it
        is guarded explicitly.
        """
        for message in [
            "Your refund of $24.99 has been issued to your original payment method.",
            "Your invoice for March is attached. Payment terms are 30 days as agreed.",
            "We have processed your refund request. The credit appears on your next statement.",
        ]:
            with self.subTest(message=message):
                result = classifier.analyze_text(message)
                self.assertLess(
                    result["risk_score"], 50.0,
                    f"Legitimate message scored as a threat: {message}",
                )

    def test_reputable_link_lowers_score(self):
        result = classifier.analyze_text(
            "Your order has shipped. Track it on our official site at https://www.amazon.com/orders"
        )
        self.assertLess(result["risk_score"], 50.0)

    def test_lookalike_domain_is_not_rescued_by_the_allowlist(self):
        """`amazon.com.evil.xyz` must never match the `amazon.com` allowlist entry."""
        result = classifier.analyze_text(
            "Urgent: verify your account at http://amazon.com.secure-verify.xyz/login"
        )
        self.assertGreater(result["risk_score"], 70.0)

    def test_conclusive_rule_beats_a_reputable_link(self):
        """A seed-phrase request stays critical even when hosted on a real domain."""
        result = classifier.analyze_text(
            "Please enter your 12 word seed phrase at https://www.google.com/forms to restore your wallet."
        )
        self.assertGreater(result["risk_score"], 80.0)

    def test_empty_input_is_handled(self):
        result = classifier.analyze_text("")
        self.assertEqual(result["risk_score"], 0.0)
        self.assertEqual(result["risk_level"], "Low")


class UrlAnalyzerTestCase(TestCase):
    def test_spoofed_brand_is_detected(self):
        result = analyze_url("http://paypa1-security-verification.xyz/signin")
        self.assertGreater(result["risk_score"], 70.0)
        self.assertIn(result["risk_level"], ["High", "Critical"])
        self.assertTrue(result["details"]["brand_spoofing"])
        self.assertEqual(result["details"]["spoofed_brand"], "PayPal")

    def test_safe_url(self):
        result = analyze_url("https://www.google.com")
        self.assertEqual(result["risk_score"], 0.0)
        self.assertEqual(result["risk_level"], "Low")


@NO_THROTTLE
class PublicEndpointsTestCase(APITestCase):
    def setUp(self):
        cache.clear()

    def test_text_analysis_endpoint(self):
        response = self.client.post(
            reverse('analyze-text'),
            {"text": "URGENT security alert: Reset password http://verification-support-login.info"},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("risk_score", response.data)
        self.assertIn("risk_level", response.data)
        self.assertEqual(ScanLog.objects.count(), 1)
        self.assertEqual(ScanLog.objects.first().scan_type, 'TEXT')

    def test_url_analysis_endpoint(self):
        response = self.client.post(
            reverse('analyze-url'), {"url": "http://netflix-billing-update.com"}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(ScanLog.objects.count(), 1)
        self.assertEqual(ScanLog.objects.first().scan_type, 'URL')

    def test_dashboard_stats_empty_state(self):
        response = self.client.get(reverse('dashboard-stats'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_scans"], 0)
        self.assertEqual(response.data["recent_scans"], [])
        self.assertIn("chart_data", response.data)

    def test_dashboard_stats_reflect_a_real_scan(self):
        self.client.post(reverse('analyze-url'), {"url": "https://example.com"}, format='json')
        response = self.client.get(reverse('dashboard-stats'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_scans"], 1)
        self.assertEqual(len(response.data["recent_scans"]), 1)

    def test_quiz_questions_endpoint(self):
        response = self.client.get(reverse('quiz-questions'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)
        self.assertIn("scenario_name", response.data[0])

    def test_health_endpoints(self):
        self.assertEqual(self.client.get(reverse('health')).status_code, status.HTTP_200_OK)

        ready = self.client.get(reverse('health-ready'))
        self.assertEqual(ready.status_code, status.HTTP_200_OK)
        self.assertEqual(ready.data['checks']['database'], 'ok')

    def test_public_config_does_not_leak_a_user_key(self):
        """Regression guard: this endpoint once returned the first user's
        OAuth client ID to every anonymous caller."""
        from .models import UserIntegration

        user = User.objects.create_user(username='leaky', password='password123')
        UserIntegration.objects.create(user=user, gmail_client_id='PRIVATE-USER-CLIENT-ID')

        response = self.client.get(reverse('config-public'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotEqual(response.data['gmail_client_id'], 'PRIVATE-USER-CLIENT-ID')


@NO_THROTTLE
class PermissionTestCase(APITestCase):
    """The default permission is 'authenticated'; these guard the exceptions."""

    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(username='member', password='password123')
        self.token = Token.objects.create(user=self.user)

    def authenticate(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

    def test_sms_dispatch_requires_authentication(self):
        """Dispatching SMS costs money — it must never be anonymous."""
        response = self.client.post(
            reverse('integrations-sms-dispatch'),
            {"message": "test", "to_number": "+1234567890"},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_sms_dispatch_requires_authentication(self):
        response = self.client.post(
            reverse('integrations-sms-dispatch'),
            {"message": "Alert!", "to_number": "+14155550123"},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_sms_dispatch_rejects_an_invalid_number(self):
        self.authenticate()
        response = self.client.post(
            reverse('integrations-sms-dispatch'),
            {"message": "Alert!", "to_number": "not a phone number"},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_sms_dispatch_without_twilio_config_is_an_honest_error(self):
        """No Twilio credentials means no send — and we say so, rather than
        reporting a simulated success the user will believe."""
        self.authenticate()
        response = self.client.post(
            reverse('integrations-sms-dispatch'),
            {"message": "Alert! CyberSentinel flagged high risk.", "to_number": "+14155550123"},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data.get("is_configured", True))

    def test_gmail_import_requires_authentication(self):
        response = self.client.post(reverse('integrations-gmail-import'), {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_gmail_import_without_connection_is_an_honest_error(self):
        """Never fabricate an inbox — say the account is not connected."""
        self.authenticate()
        response = self.client.post(reverse('integrations-gmail-import'), {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_admin_endpoints_reject_a_normal_user(self):
        self.authenticate()
        for name in ['admin-stats', 'admin-analytics', 'admin-revenue', 'admin-threat-center']:
            with self.subTest(endpoint=name):
                self.assertEqual(
                    self.client.get(reverse(name)).status_code, status.HTTP_403_FORBIDDEN
                )

    def test_admin_endpoints_reject_anonymous(self):
        self.assertEqual(
            self.client.get(reverse('admin-stats')).status_code, status.HTTP_401_UNAUTHORIZED
        )


@NO_THROTTLE
class AuthFlowTestCase(APITestCase):
    def setUp(self):
        cache.clear()

    def test_registration_ignores_a_requested_role(self):
        """Signup must never be able to mint a privileged account.

        This test previously asserted the opposite — that posting
        `role: "admin"` produced an administrator — so the escalation was not
        just present, it was covered.
        """
        response = self.client.post(reverse('auth-register'), {
            "username": "newadmin",
            "email": "newadmin@cybersentinel.ai",
            "password": "adminpassword123",
            "confirm_password": "adminpassword123",
            "role": "admin",
            "is_staff": True,
            "is_superuser": True,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.data["user"]["is_admin"])

        created = User.objects.get(username="newadmin")
        self.assertFalse(created.is_staff)
        self.assertFalse(created.is_superuser)

    def test_password_forgot_and_reset_flow(self):
        User.objects.create_user(
            username="testuser", email="test@cybersentinel.ai", password="oldpassword123"
        )

        response = self.client.post(
            reverse('auth-forgot-password'), {"email": "test@cybersentinel.ai"}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        otp = response.data.get("dev_otp")
        if not otp:
            import re
            from django.core import mail
            self.assertEqual(len(mail.outbox), 1)
            otp_match = re.search(r'verification code is: (\d{6})', mail.outbox[0].body)
            self.assertIsNotNone(otp_match)
            otp = otp_match.group(1)

        response = self.client.post(reverse('auth-reset-password'), {
            "email": "test@cybersentinel.ai",
            "otp": otp,
            "new_password": "newpassword123",
            "confirm_password": "newpassword123",
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.post(
            reverse('auth-login'),
            {"username": "testuser", "password": "newpassword123"},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_integrations_config_roundtrip(self):
        user = User.objects.create_user(username="configuser", password="password123")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

        url = reverse('integrations-config')
        response = self.client.post(url, {
            "gmail_client_id": "test-client-id",
            "gmail_access_token": "test-access-token",
            "twilio_sid": "test-sid",
            "twilio_token": "test-token",
            "twilio_from": "+15005550006",
            "twilio_to": "+1234567890",
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["gmail_client_id"], "test-client-id")
        self.assertEqual(response.data["twilio_sid"], "test-sid")


@NO_THROTTLE
class LiveAnalyticsTestCase(APITestCase):
    """The analytics endpoints must report what is in the database — including
    reporting nothing when there is nothing."""

    def setUp(self):
        cache.clear()
        self.admin = User.objects.create_user(
            username='boss', password='password123', is_staff=True
        )
        self.token = Token.objects.create(user=self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

    def test_revenue_reports_zero_without_billing_data(self):
        response = self.client.get(reverse('admin-revenue'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['has_billing_data'])

        mrr = next(k for k in response.data['kpis'] if k['label'].startswith('Monthly'))
        self.assertEqual(mrr['value'], 0)

    def test_revenue_reflects_real_subscriptions(self):
        from django.utils import timezone
        from datetime import timedelta

        plan = SubscriptionPlan.objects.create(
            name='Pro', price='49.00', interval='month', features=[]
        )
        UserSubscription.objects.create(
            user=self.admin, plan=plan, status='active',
            current_period_end=timezone.now() + timedelta(days=30),
        )
        PaymentInvoice.objects.create(user=self.admin, amount='49.00', status='paid')

        response = self.client.get(reverse('admin-revenue'))
        self.assertTrue(response.data['has_billing_data'])

        mrr = next(k for k in response.data['kpis'] if k['label'].startswith('Monthly'))
        self.assertEqual(mrr['value'], 49.0)

        arr = next(k for k in response.data['kpis'] if k['label'].startswith('Annual'))
        self.assertEqual(arr['value'], 588.0)

    def test_annual_plan_is_normalised_into_monthly_revenue(self):
        """A yearly plan must not inflate MRR twelvefold."""
        from django.utils import timezone
        from datetime import timedelta

        plan = SubscriptionPlan.objects.create(
            name='Yearly', price='1200.00', interval='year', features=[]
        )
        UserSubscription.objects.create(
            user=self.admin, plan=plan, status='active',
            current_period_end=timezone.now() + timedelta(days=365),
        )

        response = self.client.get(reverse('admin-revenue'))
        mrr = next(k for k in response.data['kpis'] if k['label'].startswith('Monthly'))
        self.assertEqual(mrr['value'], 100.0)

    def test_analytics_endpoint_shape(self):
        response = self.client.get(reverse('admin-analytics'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for key in ['traffic_metrics', 'conversion_metrics', 'timeseries', 'forecast', 'totals']:
            self.assertIn(key, response.data)

    def test_threat_center_endpoint_shape(self):
        response = self.client.get(reverse('admin-threat-center'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('severity_distribution', response.data)
        self.assertIn('report_queue', response.data)

    def test_recommendation_actions_point_at_real_frontend_routes(self):
        """A recommendation whose action 404s is worse than no recommendation.

        These paths are hrefs the dashboard navigates to, so they have to match
        the router in frontend/src/App.jsx.
        """
        from .analytics_views import _build_recommendations
        from .models import ScanLog

        known_routes = {
            '/dashboard/text-scan',
            '/dashboard/url-scanner',
            '/dashboard/reports',
            '/dashboard/account-security',
            '/dashboard/integrations',
        }

        ScanLog.objects.create(
            user=self.admin, scan_type='TEXT', input_content='hi',
            risk_score=90, risk_level='Critical',
        )
        window = ScanLog.objects.filter(user=self.admin)

        recommendations = _build_recommendations(
            self.admin, window, {'TEXT': 1},
            {'available': True, 'direction': 'worsening', 'exposure_score': 80.0, 'delta': 12.0},
            critical=1,
        )
        self.assertTrue(recommendations)

        for rec in recommendations:
            if rec['action'] is not None:
                self.assertIn(rec['action'], known_routes, f"{rec['title']} links nowhere")


@NO_THROTTLE
class BroadcastTestCase(APITestCase):
    """Admin broadcasts reach every account and reject unknown categories."""

    def setUp(self):
        cache.clear()
        self.admin = User.objects.create_user(
            username='chief', password='password123', is_staff=True
        )
        User.objects.create_user(username='member', password='password123')
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Token {Token.objects.create(user=self.admin).key}'
        )

    def test_broadcast_creates_one_notification_per_account(self):
        from .models import Notification

        response = self.client.post(
            '/api/notifications/broadcast/',
            {'title': 'Maintenance', 'message': 'Saturday 02:00 UTC', 'type': 'General'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Notification.objects.count(), User.objects.count())

    def test_broadcast_rejects_a_category_the_model_does_not_define(self):
        from .models import Notification

        response = self.client.post(
            '/api/notifications/broadcast/',
            {'title': 'Hi', 'message': 'There', 'type': 'Maintenance'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Notification.objects.count(), 0)

    def test_broadcast_is_refused_to_non_admins(self):
        from .models import Notification

        member = User.objects.get(username='member')
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Token {Token.objects.create(user=member).key}'
        )
        response = self.client.post(
            '/api/notifications/broadcast/',
            {'title': 'Hi', 'message': 'There'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Notification.objects.count(), 0)


@NO_THROTTLE
class HealthTestCase(APITestCase):
    """The readiness probe backs the admin's system-configuration page."""

    def test_liveness_needs_no_auth_and_touches_no_database(self):
        response = self.client.get(reverse('health'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'ok')

    def test_readiness_reports_every_dependency(self):
        response = self.client.get(reverse('health-ready'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for key in ['database', 'redis', 'virustotal', 'google_oauth', 'email']:
            self.assertIn(key, response.data['checks'])


@NO_THROTTLE
class PredictionTestCase(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(username='predictee', password='password123')
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

    def test_forecast_declines_to_guess_without_history(self):
        """A confident-looking forecast drawn from no data is worse than none."""
        response = self.client.get(reverse('threat-forecast'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['scan_forecast']['available'])
        self.assertIn('reason', response.data['scan_forecast'])

    def test_forecast_becomes_available_with_enough_history(self):
        from datetime import timedelta
        from django.utils import timezone

        # Ten consecutive days of scans, backdated past auto_now_add.
        for day in range(10):
            log = ScanLog.objects.create(
                user=self.user, scan_type='TEXT', input_content='x',
                risk_score=40.0, risk_level='Medium',
            )
            ScanLog.objects.filter(pk=log.pk).update(
                created_at=timezone.now() - timedelta(days=day)
            )

        response = self.client.get(reverse('threat-forecast'))
        forecast = response.data['scan_forecast']
        self.assertTrue(forecast['available'])
        self.assertEqual(len(forecast['points']), forecast['horizon_days'])
        for point in forecast['points']:
            self.assertLessEqual(point['lower'], point['predicted'])
            self.assertLessEqual(point['predicted'], point['upper'])
            self.assertGreaterEqual(point['lower'], 0)

    def test_insights_recommend_a_first_scan_when_empty(self):
        response = self.client.get(reverse('user-insights'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['summary']['scans'], 0)
        self.assertTrue(
            any('first scan' in r['title'].lower() for r in response.data['recommendations'])
        )

    def test_critical_scan_produces_a_critical_recommendation(self):
        ScanLog.objects.create(
            user=self.user, scan_type='TEXT', input_content='bad',
            risk_score=95.0, risk_level='Critical',
        )
        response = self.client.get(reverse('user-insights'))
        priorities = [r['priority'] for r in response.data['recommendations']]
        self.assertIn('critical', priorities)

    def test_usage_metrics_count_real_scans(self):
        for _ in range(3):
            ScanLog.objects.create(
                user=self.user, scan_type='FILE', input_content='f',
                risk_score=10.0, risk_level='Low',
            )
        response = self.client.get(reverse('usage-metrics'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        file_metric = next(m for m in response.data['metrics'] if m['label'] == 'File scans')
        self.assertEqual(file_metric['used'], 3)


class ThrottleTestCase(APITestCase):
    """Scanning calls paid third-party APIs, so anonymous use must be capped."""

    def setUp(self):
        cache.clear()

    def tearDown(self):
        cache.clear()

    def test_anonymous_scanning_is_rate_limited(self):
        # DRF binds THROTTLE_RATES as a class attribute at import time, so
        # `override_settings` cannot reach it. Patching the resolved `rate`
        # directly is the only way to exercise this without firing the real
        # production allowance of requests.
        from unittest import mock

        from .throttles import ScanAnonThrottle

        url = reverse('analyze-text')
        with mock.patch.dict(ScanAnonThrottle.THROTTLE_RATES, {'scan_anon': '3/hour'}):
            for attempt in range(3):
                response = self.client.post(url, {"text": "hello there"}, format='json')
                self.assertEqual(
                    response.status_code, status.HTTP_200_OK,
                    f"request {attempt + 1} should have been allowed",
                )

            response = self.client.post(url, {"text": "hello there"}, format='json')
            self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


# ═══════════════════════════════════════════════════════════════════════════
# Regression tests for the security review of 24 Aug 2026.
#
# Each test below corresponds to a specific finding. They exist to fail loudly
# if any of these behaviours is ever reintroduced — several of the original
# holes were the kind that look like a convenience feature until you read them
# from an attacker's side.
# ═══════════════════════════════════════════════════════════════════════════

@NO_THROTTLE
class PrivilegeEscalationRegressionTests(APITestCase):
    """The five critical findings: four routes to superuser, one to the admin UI."""

    def test_signup_cannot_grant_staff_or_superuser(self):
        """BE-01. `role` in the request body used to set is_staff and is_superuser."""
        for index, payload_extra in enumerate(
                ({'role': 'admin'}, {'is_staff': True}, {'is_superuser': True})):
            username = f'escalate{index}'
            body = {
                'username': username,
                'email': f'{username}@example.com',
                'password': 'a-perfectly-fine-passphrase',
                'confirm_password': 'a-perfectly-fine-passphrase',
            }
            body.update(payload_extra)
            response = self.client.post(reverse('auth-register'), body, format='json')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED, payload_extra)
            user = User.objects.get(username=username)
            self.assertFalse(user.is_staff, payload_extra)
            self.assertFalse(user.is_superuser, payload_extra)

    def test_hardcoded_master_keys_no_longer_work(self):
        """BE-02. Two literal keys in the source used to create a superuser for
        any email address presented alongside them."""
        for legacy_key in ('ARPAN-ADMIN-7125-KEY', 'ADMIN-KEY-123456'):
            response = self.client.post(reverse('auth-admin-login'), {
                'email': 'attacker@example.com',
                'auth_key': legacy_key,
            }, format='json')
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, legacy_key)
            self.assertNotIn('token', response.data)
            self.assertFalse(User.objects.filter(email='attacker@example.com').exists())

    def test_admin_login_rejects_a_wrong_key_for_a_real_admin(self):
        """BE-03. The fallback accepted *any* key once the address belonged to
        someone flagged as staff."""
        admin = User.objects.create_user(
            username='realadmin', email='realadmin@example.com',
            password='x-long-enough-password', is_staff=True, is_superuser=True)
        key = AdminAuthKey(user=admin)
        key.set_key('CS-ADMIN-THE-REAL-ONE')
        key.save()

        response = self.client.post(reverse('auth-admin-login'), {
            'email': 'realadmin@example.com',
            'auth_key': 'anything-at-all',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertNotIn('token', response.data)

    def test_admin_login_accepts_the_correct_key(self):
        """The counterpart to the test above: locking it down must not lock out
        the legitimate administrator."""
        admin = User.objects.create_user(
            username='realadmin2', email='realadmin2@example.com',
            password='x-long-enough-password', is_staff=True)
        key = AdminAuthKey(user=admin)
        key.set_key('CS-ADMIN-CORRECT-KEY')
        key.save()

        response = self.client.post(reverse('auth-admin-login'), {
            'email': 'realadmin2@example.com',
            'auth_key': 'CS-ADMIN-CORRECT-KEY',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    def test_admin_auth_key_is_not_stored_in_plaintext(self):
        admin = User.objects.create_user(username='hashme', email='hashme@example.com',
                                         password='x-long-enough-password', is_staff=True)
        key = AdminAuthKey(user=admin)
        key.set_key('CS-ADMIN-SECRET-VALUE')
        key.save()
        key.refresh_from_db()
        self.assertNotIn('SECRET-VALUE', key.key_hash)
        self.assertEqual(len(key.key_hash), 64)

    def test_admin_registration_is_not_public(self):
        """BE-04. This endpoint was AllowAny, so anyone could provision staff."""
        response = self.client.post(reverse('auth-admin-register'), {
            'email': 'selfmade@example.com', 'username': 'selfmade',
        }, format='json')
        self.assertIn(response.status_code,
                      (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))
        self.assertFalse(User.objects.filter(username='selfmade').exists())

    def test_admin_registration_works_for_an_existing_admin(self):
        admin = User.objects.create_superuser(
            username='boss', email='boss@example.com', password='x-long-enough-password')
        self.client.force_authenticate(user=admin)
        response = self.client.post(reverse('auth-admin-register'), {
            'email': 'colleague@example.com', 'username': 'colleague',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.get(username='colleague').is_staff)


@NO_THROTTLE
class CredentialLeakageRegressionTests(APITestCase):
    """BE-05: verification codes and auth keys used to come back in responses."""

    def test_forgot_password_never_returns_the_code(self):
        User.objects.create_user(username='leak', email='leak@example.com',
                                 password='x-long-enough-password')
        response = self.client.post(reverse('auth-forgot-password'),
                                    {'email': 'leak@example.com'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = str(response.data)
        self.assertNotIn('dev_otp', body)
        self.assertNotIn('is_mocked', body)
        # And nothing that looks like a six-digit code.
        self.assertIsNone(re.search(r'\b\d{6}\b', body))

    def test_request_otp_never_returns_the_code(self):
        User.objects.create_user(username='leak2', email='leak2@example.com',
                                 password='x-long-enough-password')
        response = self.client.post(reverse('auth-request-otp'),
                                    {'email': 'leak2@example.com'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('dev_otp', str(response.data))

    def test_verification_code_is_stored_hashed(self):
        User.objects.create_user(username='hashcode', email='hashcode@example.com',
                                 password='x-long-enough-password')
        self.client.post(reverse('auth-forgot-password'),
                         {'email': 'hashcode@example.com'}, format='json')
        record = PasswordResetOTP.objects.get(email='hashcode@example.com')
        self.assertEqual(len(record.otp), 64)
        self.assertEqual(record.purpose, PasswordResetOTP.PURPOSE_RESET)


@NO_THROTTLE
class UserEnumerationRegressionTests(APITestCase):
    """BE-22: three endpoints used to confirm whether an address was registered."""

    def setUp(self):
        User.objects.create_user(username='known', email='known@example.com',
                                 password='x-long-enough-password')

    def test_forgot_password_answers_identically_either_way(self):
        known = self.client.post(reverse('auth-forgot-password'),
                                 {'email': 'known@example.com'}, format='json')
        unknown = self.client.post(reverse('auth-forgot-password'),
                                   {'email': 'nobody@example.com'}, format='json')
        self.assertEqual(known.status_code, unknown.status_code)
        self.assertEqual(known.data, unknown.data)

    def test_login_answers_identically_for_bad_password_and_unknown_user(self):
        bad_password = self.client.post(reverse('auth-login'),
                                        {'username': 'known@example.com',
                                         'password': 'wrong-password'}, format='json')
        no_such_user = self.client.post(reverse('auth-login'),
                                        {'username': 'nobody@example.com',
                                         'password': 'wrong-password'}, format='json')
        self.assertEqual(bad_password.status_code, no_such_user.status_code)
        self.assertEqual(bad_password.data, no_such_user.data)


@NO_THROTTLE
class PasswordPolicyRegressionTests(APITestCase):
    """BE-06: views hand-rolled `len(password) < 6` and never ran the validators
    configured in settings, so "123456" was an acceptable password."""

    def test_signup_rejects_a_short_password(self):
        response = self.client.post(reverse('auth-register'), {
            'username': 'shorty', 'email': 'shorty@example.com',
            'password': 'abc123', 'confirm_password': 'abc123',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signup_rejects_a_common_password(self):
        response = self.client.post(reverse('auth-register'), {
            'username': 'common', 'email': 'common@example.com',
            'password': 'password123', 'confirm_password': 'password123',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signup_rejects_an_all_numeric_password(self):
        response = self.client.post(reverse('auth-register'), {
            'username': 'numeric', 'email': 'numeric@example.com',
            'password': '928374651029', 'confirm_password': '928374651029',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signup_accepts_a_reasonable_password(self):
        response = self.client.post(reverse('auth-register'), {
            'username': 'sensible', 'email': 'sensible@example.com',
            'password': 'correct-horse-battery', 'confirm_password': 'correct-horse-battery',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_signup_rejects_a_malformed_email(self):
        response = self.client.post(reverse('auth-register'), {
            'username': 'bademail', 'email': 'not-an-email',
            'password': 'correct-horse-battery', 'confirm_password': 'correct-horse-battery',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signup_is_case_insensitive_about_duplicate_emails(self):
        User.objects.create_user(username='first', email='dup@example.com',
                                 password='x-long-enough-password')
        response = self.client.post(reverse('auth-register'), {
            'username': 'second', 'email': 'DUP@Example.com',
            'password': 'correct-horse-battery', 'confirm_password': 'correct-horse-battery',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


@NO_THROTTLE
class SessionInvalidationRegressionTests(APITestCase):
    """BE-14 / BE-15: a password reset left old tokens alive, and 'revoke
    session' did not revoke anything."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='sessions', email='sessions@example.com',
            password='the-original-password')

    def _current_code(self, email, purpose):
        from django.core import mail
        body = mail.outbox[-1].body
        return re.search(r'\b(\d{6})\b', body).group(1)

    def test_password_reset_invalidates_existing_tokens(self):
        stolen = Token.objects.create(user=self.user).key

        self.client.post(reverse('auth-forgot-password'),
                         {'email': 'sessions@example.com'}, format='json')
        code = self._current_code('sessions@example.com', 'reset')

        response = self.client.post(reverse('auth-reset-password'), {
            'email': 'sessions@example.com', 'otp': code,
            'new_password': 'a-brand-new-passphrase',
            'confirm_password': 'a-brand-new-passphrase',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Token.objects.filter(key=stolen).exists())

    def test_revoking_a_session_drops_the_token(self):
        token = Token.objects.create(user=self.user)
        session = DeviceSession.objects.create(
            user=self.user, device_name='Some Browser', ip_address='198.51.100.7')

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        response = self.client.post(
            reverse('security-sessions-revoke', args=[session.id]), {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Token.objects.filter(pk=token.pk).exists())


@NO_THROTTLE
class VerificationCodeRegressionTests(APITestCase):
    """BE-16: codes were predictable, unlimited-guess, and shared between the
    password-reset and passwordless-login flows."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='codes', email='codes@example.com', password='the-original-password')

    def _latest_code(self):
        from django.core import mail
        return re.search(r'\b(\d{6})\b', mail.outbox[-1].body).group(1)

    def test_a_reset_code_cannot_be_used_to_sign_in(self):
        self.client.post(reverse('auth-forgot-password'),
                         {'email': 'codes@example.com'}, format='json')
        reset_code = self._latest_code()

        response = self.client.post(reverse('auth-otp-login'), {
            'email': 'codes@example.com', 'otp': reset_code,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertNotIn('token', response.data)

    def test_a_login_code_cannot_be_used_to_reset_a_password(self):
        self.client.post(reverse('auth-request-otp'),
                         {'email': 'codes@example.com'}, format='json')
        login_code = self._latest_code()

        response = self.client.post(reverse('auth-reset-password'), {
            'email': 'codes@example.com', 'otp': login_code,
            'new_password': 'a-brand-new-passphrase',
            'confirm_password': 'a-brand-new-passphrase',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_repeated_wrong_guesses_burn_the_code(self):
        self.client.post(reverse('auth-request-otp'),
                         {'email': 'codes@example.com'}, format='json')
        real_code = self._latest_code()

        wrong = '000000' if real_code != '000000' else '111111'
        for _ in range(PasswordResetOTP.MAX_ATTEMPTS):
            self.client.post(reverse('auth-otp-login'),
                             {'email': 'codes@example.com', 'otp': wrong}, format='json')

        self.assertFalse(PasswordResetOTP.objects.filter(email='codes@example.com').exists())

        # Even the genuine code is now dead — the record is gone.
        response = self.client.post(reverse('auth-otp-login'),
                                    {'email': 'codes@example.com', 'otp': real_code},
                                    format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_a_valid_login_code_works(self):
        self.client.post(reverse('auth-request-otp'),
                         {'email': 'codes@example.com'}, format='json')
        response = self.client.post(reverse('auth-otp-login'), {
            'email': 'codes@example.com', 'otp': self._latest_code(),
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)


@NO_THROTTLE
class ObjectPermissionRegressionTests(APITestCase):
    """BE-07 / BE-08: an AllowAny ModelViewSet and two unscoped create paths."""

    def setUp(self):
        self.owner = User.objects.create_user(
            username='owner', email='owner@example.com', password='x-long-enough-password')
        self.other = User.objects.create_user(
            username='other', email='other@example.com', password='x-long-enough-password')
        self.report = ScamReport.objects.create(
            reported_by=self.owner, url_or_email='refunds@fake-bank.example',
            description='They asked for my bank details.')

    def test_anonymous_callers_cannot_list_scam_reports(self):
        response = self.client.get(reverse('scam-reports-list'))
        self.assertIn(response.status_code,
                      (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    def test_anonymous_callers_cannot_delete_a_scam_report(self):
        response = self.client.delete(reverse('scam-reports-detail', args=[self.report.id]))
        self.assertIn(response.status_code,
                      (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))
        self.assertTrue(ScamReport.objects.filter(pk=self.report.pk).exists())

    def test_a_user_cannot_read_someone_elses_scam_report(self):
        self.client.force_authenticate(user=self.other)
        response = self.client.get(reverse('scam-reports-detail', args=[self.report.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_anonymous_callers_may_still_submit_a_report(self):
        """The feature has to keep working — locking it down must not close the
        front door it exists to provide."""
        response = self.client.post(reverse('scam-reports-list'), {
            'url_or_email': 'delivery@fake-courier.example',
            'description': 'Fake delivery text message.',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_a_user_cannot_create_a_subscription_for_someone_else(self):
        plan = SubscriptionPlan.objects.create(name='Enterprise', price=999)
        self.client.force_authenticate(user=self.other)
        response = self.client.post(reverse('subscriptions-list'), {
            'user': self.owner.id, 'plan': plan.id, 'status': 'active',
        }, format='json')
        if response.status_code == status.HTTP_201_CREATED:
            created = UserSubscription.objects.get(pk=response.data['id'])
            self.assertEqual(created.user_id, self.other.id,
                             'subscription was attributed to the user named in the payload')

    def test_invoices_cannot_be_forged(self):
        self.client.force_authenticate(user=self.other)
        response = self.client.post(reverse('invoices-list'), {
            'user': self.other.id, 'amount': 0, 'status': 'paid',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


@NO_THROTTLE
class ScanInputValidationTests(APITestCase):
    """FE-04 / BE-19 / BE-23: the scanners scored anything they were given."""

    def test_url_scanner_rejects_input_that_is_not_a_link(self):
        for junk in ('hello world', 'notadomain', 'javascript:alert(1)', 'data:text/html,x'):
            response = self.client.post(reverse('analyze-url'), {'url': junk}, format='json')
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, junk)
            self.assertNotIn('risk_score', response.data, junk)

    def test_url_scanner_still_accepts_a_real_link(self):
        response = self.client.post(reverse('analyze-url'),
                                    {'url': 'http://paypa1-verify.xyz/signin'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('risk_score', response.data)

    def test_text_scanner_rejects_an_oversized_body(self):
        response = self.client.post(reverse('analyze-text'),
                                    {'text': 'a' * 50000}, format='json')
        self.assertEqual(response.status_code, status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)

    def test_screenshot_scanner_rejects_a_renamed_non_image(self):
        """A filename extension is a claim, not evidence."""
        from django.core.files.uploadedfile import SimpleUploadedFile
        payload = SimpleUploadedFile('totally-a-screenshot.png',
                                     b'MZ\x90\x00this is a windows executable',
                                     content_type='image/png')
        response = self.client.post(reverse('analyze-screenshot'),
                                    {'image': payload}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


@NO_THROTTLE
class InternalNoteVisibilityTests(APITestCase):
    """BE-18: staff-only notes were serialized to the customer."""

    def test_a_customer_does_not_see_internal_replies(self):
        customer = User.objects.create_user(
            username='cust', email='cust@example.com', password='x-long-enough-password')
        agent = User.objects.create_user(
            username='agent', email='agent@example.com',
            password='x-long-enough-password', is_staff=True)

        ticket = SupportTicket.objects.create(customer=customer, subject='Help please')
        TicketReply.objects.create(ticket=ticket, sender=agent,
                                   content='Visible answer', is_internal=False)
        TicketReply.objects.create(ticket=ticket, sender=agent,
                                   content='SECRET internal note', is_internal=True)

        self.client.force_authenticate(user=customer)
        response = self.client.get(reverse('tickets-detail', args=[ticket.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('SECRET internal note', str(response.data))

        self.client.force_authenticate(user=agent)
        staff_view = self.client.get(reverse('tickets-detail', args=[ticket.id]))
        self.assertIn('SECRET internal note', str(staff_view.data))


@NO_THROTTLE
class CredentialStorageTests(APITestCase):
    """BE-11: third-party credentials were plain columns, and the config
    endpoint handed them straight back to the browser."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='creds', email='creds@example.com', password='x-long-enough-password')
        self.client.force_authenticate(user=self.user)

    def test_stored_credentials_are_encrypted_at_rest(self):
        from django.db import connection

        config, _ = UserIntegration.objects.get_or_create(user=self.user)
        config.twilio_token = 'super-secret-twilio-token'
        config.save()

        with connection.cursor() as cursor:
            cursor.execute('SELECT twilio_token FROM api_userintegration WHERE user_id = %s',
                           [self.user.id])
            raw = cursor.fetchone()[0]

        self.assertNotIn('super-secret-twilio-token', raw)
        self.assertTrue(raw.startswith('enc$v1$'))

        # ...and still readable through the ORM.
        config.refresh_from_db()
        self.assertEqual(config.twilio_token, 'super-secret-twilio-token')

    def test_the_config_endpoint_does_not_return_secrets(self):
        config, _ = UserIntegration.objects.get_or_create(user=self.user)
        config.openai_api_key = 'sk-do-not-leak-me'
        config.save()

        response = self.client.get(reverse('integrations-config'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('sk-do-not-leak-me', str(response.data))
        self.assertTrue(response.data['openai_api_key_configured'])

    def test_a_partial_update_does_not_wipe_other_credentials(self):
        config, _ = UserIntegration.objects.get_or_create(user=self.user)
        config.openai_api_key = 'sk-keep-me'
        config.twilio_sid = 'AC123'
        config.save()

        self.client.post(reverse('integrations-config'), {'twilio_sid': 'AC999'}, format='json')

        config.refresh_from_db()
        self.assertEqual(config.twilio_sid, 'AC999')
        self.assertEqual(config.openai_api_key, 'sk-keep-me')


@NO_THROTTLE
class OAuthStateTests(APITestCase):
    """BE-09 / BE-10: `state` was minted and never checked, and the callback
    could never actually store a connection."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='oauth', email='oauth@example.com', password='x-long-enough-password')
        self.provider = OAuthProvider.objects.create(
            name='Gmail', category='email', is_active=True)

    def test_the_callback_requires_authentication(self):
        response = self.client.post(reverse('oauth-callback'),
                                    {'code': 'x', 'state': 'y'}, format='json')
        self.assertIn(response.status_code,
                      (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    def test_the_callback_rejects_an_unknown_state(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(reverse('oauth-callback'),
                                    {'code': 'anything', 'state': 'never-issued'},
                                    format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_the_callback_rejects_another_users_state(self):
        victim = User.objects.create_user(
            username='victim', email='victim@example.com', password='x-long-enough-password')
        state = OAuthState.objects.create(
            state='issued-to-the-attacker', user=self.user, provider=self.provider)

        self.client.force_authenticate(user=victim)
        response = self.client.post(reverse('oauth-callback'),
                                    {'code': 'anything', 'state': state.state}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


@NO_THROTTLE
class DeveloperApiKeyAuthenticationTests(APITestCase):
    """BE-24: keys were issued but no authentication class consumed them."""

    def test_a_developer_key_authenticates_a_request(self):
        user = User.objects.create_user(
            username='dev', email='dev@example.com', password='x-long-enough-password')
        self.client.force_authenticate(user=user)
        created = self.client.post(reverse('security-api-keys'), {'name': 'CI'}, format='json')
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        raw_key = created.data['full_key']

        # A fresh client: force_authenticate(None) would disable authentication
        # entirely rather than falling through to the header.
        from rest_framework.test import APIClient
        api_client = APIClient()
        api_client.credentials(HTTP_AUTHORIZATION=f'Api-Key {raw_key}')
        response = api_client.get(reverse('auth-profile'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'dev')

    def test_an_invalid_developer_key_is_rejected(self):
        from rest_framework.test import APIClient
        api_client = APIClient()
        api_client.credentials(HTTP_AUTHORIZATION='Api-Key cs_live_not_a_real_key')
        response = api_client.get(reverse('auth-profile'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
