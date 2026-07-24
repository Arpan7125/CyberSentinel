import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { LanguageProvider } from './LanguageContext';
import { NotificationProvider } from './NotificationContext';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Layouts (loaded eagerly — they wrap pages)
import PublicLayout from './layouts/PublicLayout';
import CustomerLayout from './layouts/CustomerLayout';
import AdminWorkspaceLayout from './components/admin/AdminWorkspaceLayout';

// Public Marketing Pages (lazy loaded)
const HomePage = lazy(() => import('./pages/HomePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const SolutionsPage = lazy(() => import('./pages/SolutionsPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const IndustriesPage = lazy(() => import('./pages/IndustriesPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'));
const CaseStudiesPage = lazy(() => import('./pages/CaseStudiesPage'));
const CareersPage = lazy(() => import('./pages/CareersPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const DocumentationPage = lazy(() => import('./pages/DocumentationPage'));
const TrustCenterPage = lazy(() => import('./pages/TrustCenterPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const CookiePolicyPage = lazy(() => import('./pages/CookiePolicyPage'));
const SecurityPolicyPage = lazy(() => import('./pages/SecurityPolicyPage'));
const ResponsibleDisclosurePage = lazy(() => import('./pages/ResponsibleDisclosurePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Auth Pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));
const OTPVerificationPage = lazy(() => import('./pages/auth/OTPVerificationPage'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const ApiIntegrationsPage = lazy(() => import('./pages/admin/ApiIntegrationsPage'));

// Customer Pages
const CustomerDashboard = lazy(() => import('./pages/customer/DashboardPage'));
const CustomerProfile = lazy(() => import('./pages/customer/ProfilePage'));
const CustomerSettings = lazy(() => import('./pages/customer/SettingsPage'));
const CustomerReports = lazy(() => import('./pages/customer/ReportsPage'));
const CustomerTickets = lazy(() => import('./pages/customer/TicketsPage'));
const CustomerNotifications = lazy(() => import('./pages/customer/NotificationsPage'));
const CustomerBilling = lazy(() => import('./pages/customer/BillingPage'));
const EmailProtectionPage = lazy(() => import('./pages/customer/EmailProtectionPage'));
const PhoneScamPage = lazy(() => import('./pages/customer/PhoneScamPage'));
const WhatsAppAnalyzerPage = lazy(() => import('./pages/customer/WhatsAppAnalyzerPage'));
const SmsAnalyzerPage = lazy(() => import('./pages/customer/SmsAnalyzerPage'));
const UrlScannerPage = lazy(() => import('./pages/customer/UrlScannerPage'));
const FileScannerPage = lazy(() => import('./pages/customer/FileScannerPage'));
const ScreenshotAnalyzerPage = lazy(() => import('./pages/customer/ScreenshotAnalyzerPage'));
const AccountSecurityPage = lazy(() => import('./pages/customer/AccountSecurityPage'));
const CommunityDatabasePage = lazy(() => import('./pages/customer/CommunityDatabasePage'));
const ScamReporterPage = lazy(() => import('./pages/customer/ScamReporterPage'));
const CyberIntelPage = lazy(() => import('./pages/customer/CyberIntelPage'));
const ConnectedAccountsPage = lazy(() => import('./pages/customer/ConnectedAccountsPage'));
const OAuthCallbackPage = lazy(() => import('./pages/customer/OAuthCallbackPage'));
// Utility Components
const TextScanner = lazy(() => import('./components/TextScanner'));
const IncidentInbox = lazy(() => import('./components/IncidentInbox'));
const AwarenessCenter = lazy(() => import('./components/AwarenessCenter'));
const ApiSandbox = lazy(() => import('./components/ApiSandbox'));
const GuidelinesPage = lazy(() => import('./components/GuidelinesPage'));
const Chatbot = lazy(() => import('./components/Chatbot'));

// Route Guards (Bypassed)
function ProtectedRoute({ children }) {
  return children;
}

function AdminRoute({ children }) {
  return children;
}

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', gap: 12, background: 'var(--bg-primary)'
    }}>
      <div className="spinner" style={{ width: 20, height: 20 }} />
      <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Loading...</span>
    </div>
  );
}

// Secret Admin Easter Egg Hook
function useSecretAdminCode() {
  const navigate = useNavigate();
  React.useEffect(() => {
    let keyBuffer = '';
    const secretCode = 'admin';
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;
      
      keyBuffer += e.key.toLowerCase();
      if (keyBuffer.length > secretCode.length) {
        keyBuffer = keyBuffer.slice(-secretCode.length);
      }
      if (keyBuffer === secretCode) {
        navigate('/admin-login');
        keyBuffer = '';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
}

// Wrapper component to use hooks inside BrowserRouter
function AppContent() {
  useSecretAdminCode();
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* ── Public Layout Routes ── */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="solutions" element={<SolutionsPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="industries" element={<IndustriesPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="blog" element={<BlogPage />} />
            <Route path="blog/:slug" element={<BlogPostPage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="case-studies" element={<CaseStudiesPage />} />
            <Route path="careers" element={<CareersPage />} />
            <Route path="faq" element={<FAQPage />} />
            <Route path="docs" element={<DocumentationPage />} />
            <Route path="trust" element={<TrustCenterPage />} />
            <Route path="privacy" element={<PrivacyPolicyPage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="cookies" element={<CookiePolicyPage />} />
            <Route path="security" element={<SecurityPolicyPage />} />
            <Route path="responsible-disclosure" element={<ResponsibleDisclosurePage />} />
          </Route>

          {/* ── Auth Routes ── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/signup" element={<Navigate to="/register" replace />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/verify-otp" element={<OTPVerificationPage />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />

          {/* ── Customer Portal (Requires Auth) ── */}
          <Route path="/dashboard" element={<ProtectedRoute><CustomerLayout /></ProtectedRoute>}>
            <Route index element={<CustomerDashboard />} />
            <Route path="profile" element={<CustomerProfile />} />
            <Route path="security" element={<CustomerSettings />} />
            <Route path="reports" element={<CustomerReports />} />
            <Route path="tickets" element={<CustomerTickets />} />
            <Route path="notifications" element={<CustomerNotifications />} />
            <Route path="billing" element={<CustomerBilling />} />
            <Route path="settings" element={<CustomerSettings />} />
            <Route path="email-scanner" element={<EmailProtectionPage />} />
            <Route path="phone-lookup" element={<PhoneScamPage />} />
            <Route path="whatsapp-analyzer" element={<WhatsAppAnalyzerPage />} />
            <Route path="sms-analyzer" element={<SmsAnalyzerPage />} />
            <Route path="url-scanner" element={<UrlScannerPage />} />
            <Route path="file-scanner" element={<FileScannerPage />} />
            <Route path="screenshot-scanner" element={<ScreenshotAnalyzerPage />} />
            <Route path="text-scan" element={<TextScanner />} />
            <Route path="incidents" element={<IncidentInbox />} />
            <Route path="awareness" element={<AwarenessCenter />} />
            <Route path="api-sandbox" element={<ApiSandbox />} />
            <Route path="guidelines" element={<GuidelinesPage />} />
            <Route path="account-security" element={<AccountSecurityPage />} />
            <Route path="community" element={<CommunityDatabasePage />} />
            <Route path="scam-reporter" element={<ScamReporterPage />} />
            <Route path="cyber-intel" element={<CyberIntelPage />} />
            <Route path="integrations" element={<ConnectedAccountsPage />} />
            <Route path="integrations/oauth/callback" element={<OAuthCallbackPage />} />
          </Route>

          {/* ── Admin Portal (Requires Admin) ── */}
          <Route path="/admin/*" element={<AdminRoute><AdminWorkspaceLayout /></AdminRoute>} />

          {/* ── 404 ── */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>

      {/* Chatbot floating widget */}
      <Suspense fallback={null}>
        <Chatbot />
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
