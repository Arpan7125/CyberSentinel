import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import TopNavbar from '../components/TopNavbar';
import Chatbot from '../components/Chatbot';
import SubscribeModal from '../components/SubscribeModal';
import AuthModal from '../components/AuthModal';
import AdminPage from '../components/AdminPage';

/**
 * AppLayout — wraps the authenticated platform section (/app/*)
 * Preserves all existing tab-based navigation behavior from the original App.jsx,
 * but now lives under the /app route namespace.
 */
export default function AppLayout() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // Map route to active tab
  const pathSegment = location.pathname.replace('/app', '').replace(/^\//, '') || 'dashboard';

  const openAuth = (tab) => {
    setAuthTab(tab);
    setShowAuthModal(true);
  };

  const handleNavigate = (tabId) => {
    if (tabId === 'landing') {
      navigate('/');
      return;
    }
    if (!user && tabId !== 'settings') {
      setAuthTab('login');
      setShowAuthModal(true);
      return;
    }
    navigate(`/app/${tabId === 'dashboard' ? '' : tabId}`);
  };

  // Redirect unauthenticated users to show auth modal
  React.useEffect(() => {
    if (!loading && !user && pathSegment !== 'settings') {
      setAuthTab('login');
      setShowAuthModal(true);
    }
  }, [loading, user, pathSegment]);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('cs_theme') || 'light';
    document.body.className = '';
    if (savedTheme !== 'amber') {
      document.body.classList.add(`theme-${savedTheme}`);
    }
    const savedGlow = localStorage.getItem('cs_glow_intensity') || '75';
    document.documentElement.style.setProperty('--border-glow', `rgba(255, 90, 31, ${parseInt(savedGlow, 10) / 100 * 0.45})`);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16, background: 'var(--bg-primary)' }}>
        <div style={{ width: 60, height: 60, borderRadius: 'var(--radius-xl)', background: 'var(--accent-muted)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🛡️</div>
        <div className="spinner" style={{ width: 28, height: 28 }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading CyberSentinel...</p>
      </div>
    );
  }

  if (showAdmin && isAdmin) {
    return (
      <>
        <AdminPage onBack={() => setShowAdmin(false)} />
        {showSubscribe && <SubscribeModal onClose={() => setShowSubscribe(false)} />}
        <Chatbot />
      </>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopNavbar
        activeTab={pathSegment}
        setActiveTab={handleNavigate}
        onSubscribe={() => setShowSubscribe(true)}
        onShowAdmin={() => setShowAdmin(true)}
        onAuth={openAuth}
      />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="main-container">
          <Outlet />
        </div>
      </main>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} initialTab={authTab} />
      {showSubscribe && <SubscribeModal onClose={() => setShowSubscribe(false)} />}
      <Chatbot onNavigate={handleNavigate} />
    </div>
  );
}
