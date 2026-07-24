from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TextAnalysisView, UrlAnalysisView, ScreenshotAnalysisView, DashboardStatsView, QuizQuestionView, FileAnalysisView, PhoneAnalysisView
from .auth_views import RegisterView, LoginView, LogoutView, ProfileView, ForgotPasswordView, ResetPasswordView, GoogleLoginView, AdminRegisterView, AdminLoginView, RequestOTPView, OTPLoginView, ChangePasswordView
from .subscription_views import SubscribeView, UnsubscribeView, SubscriberListView
from .chat_views import ChatbotView
from .admin_views import AdminStatsView, AdminUserActionView
from .integrations_views import GmailImportView, SmsDispatchView, UserIntegrationView, GmailReplyDraftView, PublicConfigView
from .ticket_views import TicketViewSet
from .notification_views import NotificationViewSet
from .saas_views import (
    SubscriptionPlanViewSet, UserSubscriptionViewSet, PaymentInvoiceViewSet,
    BlogPostViewSet, FAQViewSet, TeamMemberViewSet, ScamReportViewSet,
    UserViewSet, JobOpeningViewSet, CaseStudyViewSet, ContactLeadViewSet
)

router = DefaultRouter()
router.register(r'tickets', TicketViewSet, basename='tickets')
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'plans', SubscriptionPlanViewSet, basename='plans')
router.register(r'subscriptions', UserSubscriptionViewSet, basename='subscriptions')
router.register(r'invoices', PaymentInvoiceViewSet, basename='invoices')
router.register(r'blogs', BlogPostViewSet, basename='blogs')
router.register(r'faqs', FAQViewSet, basename='faqs')
router.register(r'team', TeamMemberViewSet, basename='team')
router.register(r'scam-reports', ScamReportViewSet, basename='scam-reports')
router.register(r'users', UserViewSet, basename='users')
router.register(r'jobs', JobOpeningViewSet, basename='jobs')
router.register(r'case-studies', CaseStudyViewSet, basename='case-studies')
router.register(r'contact', ContactLeadViewSet, basename='contact')
urlpatterns = [
    # Router endpoints (Tickets & Notifications)
    path('', include(router.urls)),

    # Scanning endpoints
    path('analyze/text/', TextAnalysisView.as_view(), name='analyze-text'),
    path('analyze/url/', UrlAnalysisView.as_view(), name='analyze-url'),
    path('analyze/screenshot/', ScreenshotAnalysisView.as_view(), name='analyze-screenshot'),
    path('analyze/file/', FileAnalysisView.as_view(), name='analyze-file'),
    path('analyze/phone/', PhoneAnalysisView.as_view(), name='analyze-phone'),
    
    # Dashboard
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    
    # Quiz
    path('quiz/', QuizQuestionView.as_view(), name='quiz-questions'),
    
    # Auth
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/profile/', ProfileView.as_view(), name='auth-profile'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='auth-reset-password'),
    path('auth/request-otp/', RequestOTPView.as_view(), name='auth-request-otp'),
    path('auth/otp-login/', OTPLoginView.as_view(), name='auth-otp-login'),
    path('auth/google-login/', GoogleLoginView.as_view(), name='auth-google-login'),
    path('auth/admin-register/', AdminRegisterView.as_view(), name='auth-admin-register'),
    path('auth/admin-login/', AdminLoginView.as_view(), name='auth-admin-login'),
    
    # Integrations
    path('integrations/gmail/import/', GmailImportView.as_view(), name='integrations-gmail-import'),
    path('integrations/sms/dispatch/', SmsDispatchView.as_view(), name='integrations-sms-dispatch'),
    path('integrations/config/', UserIntegrationView.as_view(), name='integrations-config'),
    path('integrations/gmail/reply-draft/', GmailReplyDraftView.as_view(), name='integrations-gmail-reply-draft'),
    
    # New OAuth & Connected Accounts Integrations
    path('integrations/providers/', __import__('api.oauth_views', fromlist=['']).OAuthProviderListView.as_view(), name='oauth-providers'),
    path('integrations/oauth/start/', __import__('api.oauth_views', fromlist=['']).OAuthStartView.as_view(), name='oauth-start'),
    path('integrations/oauth/callback/', __import__('api.oauth_views', fromlist=['']).OAuthCallbackView.as_view(), name='oauth-callback'),
    path('integrations/connected/', __import__('api.oauth_views', fromlist=['']).ConnectedAccountListView.as_view(), name='integrations-connected'),
    path('integrations/sync/', __import__('api.oauth_views', fromlist=['']).IntegrationSyncView.as_view(), name='integrations-sync'),
    path('integrations/disconnect/', __import__('api.oauth_views', fromlist=['']).IntegrationDisconnectView.as_view(), name='integrations-disconnect'),
    path('integrations/connected/<int:account_id>/logs/', __import__('api.oauth_views', fromlist=['']).IntegrationSyncLogsView.as_view(), name='integrations-logs'),
    
    path('config/public/', PublicConfigView.as_view(), name='config-public'),
    
    # Subscriptions
    path('subscribe/', SubscribeView.as_view(), name='subscribe'),
    path('unsubscribe/', UnsubscribeView.as_view(), name='unsubscribe'),
    path('admin/subscribers/', SubscriberListView.as_view(), name='admin-subscribers'),
    
    # Chatbot
    path('chat/', ChatbotView.as_view(), name='chatbot'),
    
    # Admin
    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('admin/users/action/', AdminUserActionView.as_view(), name='admin-user-action'),
    path('admin/integrations/', __import__('api.admin_views', fromlist=['']).AdminIntegrationsView.as_view(), name='admin-integrations'),
]
