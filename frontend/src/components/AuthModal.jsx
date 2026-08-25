import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { authService, configService } from '../services/api';
import { Shield, X } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }) {
  const { login, register, setToken, setUser } = useAuth();
  
  // Tab: 'login' | 'register' | 'forgot'
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);
  
  // Role: 'user' | 'admin'
  const [role, setRole] = useState('user');
  
  // Form controls
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI states
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Password Recovery OTP flow
  const [forgotStep, setForgotStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Public configuration from the backend. The client ID is served by the
  // platform's own settings; there is deliberately no hard-coded fallback,
  // because a stale ID baked into the bundle fails at click time with an error
  // the user cannot act on.
  const [gmailClientId, setGmailClientId] = useState('');
  const [googleConfigured, setGoogleConfigured] = useState(false);
  const [microsoftClientId, setMicrosoftClientId] = useState('');
  const [microsoftConfigured, setMicrosoftConfigured] = useState(false);
  const [microsoftLoading, setMicrosoftLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    configService
      .publicConfig()
      .then((data) => {
        setGmailClientId(data?.gmail_client_id || '');
        setGoogleConfigured(Boolean(data?.google_oauth_configured));
        setMicrosoftClientId(data?.microsoft_client_id || '');
        setMicrosoftConfigured(Boolean(data?.microsoft_oauth_configured));
      })
      .catch(() => {
        setGmailClientId('');
        setGoogleConfigured(false);
        setMicrosoftClientId('');
        setMicrosoftConfigured(false);
      });
  }, [isOpen]);

  // Handle the signed JWT credential returned by Google Identity Services. The
  // backend verifies it against Google's public keys before trusting anything
  // inside it.
  const handleGoogleCredentialResponse = useCallback(async (response) => {
    setError('');
    setLoading(true);
    try {
      const data = await authService.googleLogin(response.credential);
      localStorage.setItem('cs_token', data.token);
      setToken(data.token);
      setUser(data.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  }, [onClose, setToken, setUser]);

  // Load and mount the real Google Sign-In SDK button
  useEffect(() => {
    /* global google */
    if (isOpen && activeTab !== 'forgot' && gmailClientId && typeof google !== 'undefined') {
      try {
        google.accounts.id.initialize({
          client_id: gmailClientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });

        google.accounts.id.renderButton(
          document.getElementById("google-signin-btn-container"),
          { 
            theme: "outline", 
            size: "large", 
            width: 368, 
            shape: "pill",
            text: "signin_with",
            logo_alignment: "left"
          }
        );
      } catch (err) {
        console.warn("Failed to render GIS button:", err);
      }
    }
  }, [isOpen, activeTab, gmailClientId, handleGoogleCredentialResponse]);

  // Sign in with Microsoft via MSAL's public-client popup flow (auth code +
  // PKCE — no client secret in the browser). The resulting ID token is a
  // signed JWT; the backend verifies it against Microsoft's public keys
  // before trusting anything inside it, same as the Google flow above.
  const handleMicrosoftLogin = useCallback(async () => {
    /* global msal */
    if (typeof msal === 'undefined' || !microsoftClientId) return;
    setError('');
    setMicrosoftLoading(true);
    try {
      const msalInstance = new msal.PublicClientApplication({
        auth: {
          clientId: microsoftClientId,
          authority: 'https://login.microsoftonline.com/common',
          redirectUri: window.location.origin,
        },
      });
      await msalInstance.initialize();
      const response = await msalInstance.loginPopup({ scopes: ['openid', 'profile', 'email'] });
      const data = await authService.microsoftLogin(response.idToken);
      localStorage.setItem('cs_token', data.token);
      setToken(data.token);
      setUser(data.user);
      onClose();
    } catch (err) {
      if (err?.errorCode !== 'user_cancelled') {
        setError(err.message || 'Microsoft login failed.');
      }
    } finally {
      setMicrosoftLoading(false);
    }
  }, [microsoftClientId, onClose, setToken, setUser]);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, role === 'admin');
      onClose();
    } catch (err) {
      setError(err.message || 'Login credentials invalid.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      // No role is sent. Registration cannot create an administrator — the
      // server ignores any role in the payload, and offering the choice here
      // would promise something that silently does not happen.
      await register(username, email, password, confirmPassword);
      onClose();
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateForgot = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authService.forgotPassword(email);
      // `otp` is only present when the server is running with a console email
      // backend; in production the code arrives by email and this stays unset.
      setForgotStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteForgot = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.resetPassword({ email, otp, new_password: newPassword });
      setSuccess('Password updated successfully! Please sign in.');
      setActiveTab('login');
      setForgotStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}>
      
      {/* iOS styled glass card */}
      <div className="ios-glass" style={{
        width: 420,
        padding: '36px 28px',
        position: 'relative',
        animation: 'revealUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 22
      }}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', right: 20, top: 20,
            background: 'rgba(255,255,255,0.04)', border: 'none',
            borderRadius: '50%', width: 26, height: 26,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', cursor: 'pointer'
          }}
        >
          <X size={13} />
        </button>

        {/* Brand details */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 8, textAlign: 'center' }}>
          <div style={{
            background: 'var(--accent-orange-glow)', color: 'var(--accent-orange)',
            width: 48, height: 48, borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 4
          }}>
            <Shield size={24} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Welcome to CyberSentinel
          </h3>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
            Sign in to access your secure dashboard
          </span>
        </div>

        {/* Sign-in audience selector. Shown only when signing in: choosing
            "Administrator" during registration used to send role=admin, which
            the server acted on. Registration is always a standard account. */}
        {activeTab === 'login' && (
          <div style={{
            display: 'flex',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: 4,
            marginBottom: 4
          }}>
            <button
              type="button"
              onClick={() => { setRole('user'); setError(''); }}
              style={{
                flex: 1, padding: '8px',
                background: role === 'user' ? 'var(--bg-glass)' : 'transparent',
                border: 'none', borderRadius: 6,
                boxShadow: role === 'user' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                color: role === 'user' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
                transition: 'all 0.25s'
              }}
            >
              User Login
            </button>
            <button
              type="button"
              onClick={() => { setRole('admin'); setError(''); }}
              style={{
                flex: 1, padding: '8px',
                background: role === 'admin' ? 'var(--bg-glass)' : 'transparent',
                border: 'none', borderRadius: 6,
                boxShadow: role === 'admin' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                color: role === 'admin' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
                transition: 'all 0.25s'
              }}
            >
              Administrator
            </button>
          </div>
        )}

        {/* Success / Error alerts */}
        {error && (
          <div className="slide-up-item" style={{
            padding: '8px 12px', background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.2)',
            borderRadius: 8, color: '#FF3B30', fontSize: 11.5
          }}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="slide-up-item" style={{
            padding: '8px 12px', background: 'rgba(52,199,89,0.06)', border: '1px solid rgba(52,199,89,0.2)',
            borderRadius: 8, color: '#34C759', fontSize: 11.5
          }}>
            ✓ {success}
          </div>
        )}

        {/* ── Tab: Login Form ────────────────────────────────────────────────── */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label className="form-label">EMAIL ADDRESS</label>
              <input
                type="email"
                className="ios-input"
                placeholder="e.g. user@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">PASSWORD</label>
                <button
                  type="button"
                  onClick={() => { setActiveTab('forgot'); setError(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-orange)', fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}
                >
                  Forgot?
                </button>
              </div>
              <input
                type="password"
                className="ios-input"
                placeholder="password credentials"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="ios-btn ios-btn-primary" style={{ width: '100%', marginTop: 6 }}>
              {loading ? 'Connecting...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* ── Tab: Register Form ─────────────────────────────────────────────── */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label className="form-label">USERNAME</label>
              <input
                type="text"
                className="ios-input"
                placeholder="choose username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label className="form-label">EMAIL ADDRESS</label>
              <input
                type="email"
                className="ios-input"
                placeholder="e.g. user@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label className="form-label">PASSWORD</label>
              <input
                type="password"
                className="ios-input"
                placeholder="create password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label className="form-label">CONFIRM PASSWORD</label>
              <input
                type="password"
                className="ios-input"
                placeholder="re-enter password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="ios-btn ios-btn-primary" style={{ width: '100%', marginTop: 6 }}>
              {loading ? 'Registering...' : 'Sign Up'}
            </button>
          </form>
        )}

        {/* ── Tab: Forgot Password Form ──────────────────────────────────────── */}
        {activeTab === 'forgot' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {forgotStep === 1 ? (
              <form onSubmit={handleInitiateForgot} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label className="form-label">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    className="ios-input"
                    placeholder="enter registered email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" disabled={loading} className="ios-btn ios-btn-primary" style={{ width: '100%' }}>
                  {loading ? 'Sending...' : 'Reset Password'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCompleteForgot} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label className="form-label">6-DIGIT OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    className="ios-input"
                    placeholder="enter code"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label className="form-label">NEW PASSWORD</label>
                  <input
                    type="password"
                    className="ios-input"
                    placeholder="enter new password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" disabled={loading} className="ios-btn ios-btn-primary" style={{ width: '100%', marginTop: 6 }}>
                  {loading ? 'Applying...' : 'Update Password'}
                </button>
              </form>
            )}
            <button
              onClick={() => { setActiveTab('login'); setForgotStep(1); setError(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Back to Login
            </button>
          </div>
        )}

        {/* ── Google sign-in ──────────────────────────────────────────────────
            Rendered only when the server reports Google OAuth as configured.
            The previous "Bypass via Sandbox" link minted a fake local token and
            a fake user object, which would have shipped a working auth bypass
            to production. There is no client-side path to a session here. */}
        {activeTab !== 'forgot' && (googleConfigured || microsoftConfigured) && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              {googleConfigured && (
                <div id="google-signin-btn-container" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}></div>
              )}
              {microsoftConfigured && (
                <button
                  type="button"
                  onClick={handleMicrosoftLogin}
                  disabled={microsoftLoading}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    width: '100%', padding: '10px 16px', borderRadius: 999,
                    border: '1px solid var(--border-input)', background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)', fontSize: 14, fontWeight: 600,
                    cursor: microsoftLoading ? 'not-allowed' : 'pointer', opacity: microsoftLoading ? 0.6 : 1,
                    transition: 'background 0.2s'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true">
                    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                  </svg>
                  {microsoftLoading ? 'Signing in…' : 'Sign in with Microsoft'}
                </button>
              )}
            </div>
          </>
        )}

        {/* Modal switching footer */}
        {activeTab !== 'forgot' && (
          <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 14, marginTop: 4 }}>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
              {activeTab === 'login' ? "Don't have an account?" : "Already registered?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setActiveTab(activeTab === 'login' ? 'register' : 'login');
                  setError('');
                }}
                style={{ background: 'none', border: 'none', color: 'var(--accent-orange)', fontWeight: 800, cursor: 'pointer' }}
              >
                {activeTab === 'login' ? 'Register' : 'Sign In'}
              </button>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
