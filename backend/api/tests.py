from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .ml_classifier import classifier
from .models import PaymentInvoice, ScanLog, SubscriptionPlan, UserSubscription
from .url_analyzer import analyze_url

# Throttling is exercised by its own test below. Everywhere else it would make
# results depend on how many requests earlier tests happened to make.
NO_THROTTLE = override_settings(
    REST_FRAMEWORK={
        'DEFAULT_AUTHENTICATION_CLASSES': [
            'rest_framework.authentication.TokenAuthentication',
            'rest_framework.authentication.SessionAuthentication',
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

    def test_sms_dispatch_works_when_authenticated(self):
        self.authenticate()
        response = self.client.post(
            reverse('integrations-sms-dispatch'),
            {"message": "Alert! CyberSentinel flagged high risk.", "to_number": "+1234567890"},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

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

    def test_admin_registration(self):
        response = self.client.post(reverse('auth-register'), {
            "username": "newadmin",
            "email": "newadmin@cybersentinel.ai",
            "password": "adminpassword123",
            "confirm_password": "adminpassword123",
            "role": "admin",
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["user"]["is_admin"])

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
