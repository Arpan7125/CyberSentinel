import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { authService } from '../services/api';

export default function LoginPage({ onSwitch, onSuccess }) {
  const { login, logout } = useAuth();
  
  // Login states
  const [activeRole, setActiveRole] = useState('user'); // 'user' | 'admin'
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  // Forgot password flow states
  const [mode, setMode] = useState('login'); // 'login' | 'forgot'
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: Code + Password
  const [forgotForm, setForgotForm] = useState({ email: '', otp: '', newPassword: '', confirmPassword: '' });
  const [mockOtpHelp, setMockOtpHelp] = useState('');
  
  // Message states
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(form.username, form.password, activeRole);
      if (res.success) {
        if (onSuccess) onSuccess(res.user);
      } else {
        setError(res.error || 'Invalid credentials');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async e => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setMockOtpHelp('');
    setLoading(true);
    try {
      const data = await authService.forgotPassword(forgotForm.email);
      setForgotStep(2);
      if (data.is_mocked && data.dev_otp) {
        setMockOtpHelp(`[Dev Mock Mode] Reset code: ${data.dev_otp} (Check server console logs)`);
      }
      setSuccessMessage('Verification code generated.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const data = await authService.resetPassword({
        email: forgotForm.email,
        otp: forgotForm.otp,
        new_password: forgotForm.newPassword,
        confirm_password: forgotForm.confirmPassword
      });
      
      setMode('login');
      setForgotStep(1);
      setForgotForm({ email: '', otp: '', newPassword: '', confirmPassword: '' });
      setSuccessMessage('Credentials reset successfully. Sign in with your new password.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background elements */}
      <div className="cyber-bg" />
      <div className="cyber-grid" style={{ opacity: 0.35 }} />
      <div className={`glow-orb glow-${activeRole === 'admin' ? 'orange' : 'green'}`} style={{ top: '-10%', left: '-10%' }} />
      <div className={`glow-orb glow-${activeRole === 'admin' ? 'green' : 'orange'}`} style={{ bottom: '-15%', right: '20%' }} />

      {/* Left panel — Bold Brand Editorial */}
      <div className="auth-left reveal-up">
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            fontSize: 20, fontWeight: 900, color: 'var(--accent-orange)', letterSpacing: '0.15em'
          }}>CS // 01</div>
        </div>

        {/* Hero Section */}
        <div style={{ margin: '60px 0' }}>
          <h1 className="display-title text-gradient" style={{ marginBottom: 30 }}>
            CYBER<br />
            SENTINEL<span style={{ color: 'var(--accent-orange)' }}>.</span>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 440, marginBottom: 40 }}>
            An AI-powered cybersecurity terminal. Scans text, inspects links, extracts OCR images, and monitors threats in real-time.
          </p>

          {/* Highlights Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, borderTop: '1px solid var(--border-subtle)', paddingTop: 32 }}>
            {[
              { label: 'THREAT AI', desc: 'NLP content classification' },
              { label: 'URL RADAR', desc: 'Brand-spoofing heuristic flags' },
              { label: 'OCR OPTICS', desc: 'Screen analysis & text extract' },
              { label: 'GLOBAL MAP', desc: 'Live simulated threat radar' }
            ].map((f, i) => (
              <div key={i} className="slide-up-item" style={{ animationDelay: `${0.1 * i}s` }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-orange)', letterSpacing: '0.08em', marginBottom: 4 }}>{f.label}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          SECURED DATA PROTOCOL // V2.4.0
        </div>
      </div>

      {/* Right panel — Input Form */}
      <div className="auth-right reveal-up" style={{ animationDelay: '0.15s' }}>
        <div className="auth-form-card">
          
          {mode === 'login' ? (
            <>
              {/* Header */}
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 28, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.03em', marginBottom: 8 }}>SIGN IN</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Enter credentials to access the security portal</p>
              </div>

              {/* User vs Admin Role Toggle */}
              <div style={{
                display: 'flex',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: 4,
                marginBottom: 28
              }}>
                <button
                  type="button"
                  onClick={() => { setActiveRole('user'); setError(''); }}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: activeRole === 'user' ? 'var(--accent-orange)' : 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: activeRole === 'user' ? 'white' : 'var(--text-secondary)',
                    fontWeight: 800,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  👤 User Access
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveRole('admin'); setError(''); }}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: activeRole === 'admin' ? 'var(--accent-orange)' : 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: activeRole === 'admin' ? 'white' : 'var(--text-secondary)',
                    fontWeight: 800,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  🛡️ Admin Gateway
                </button>
              </div>

              {error && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#F87171',
                  fontSize: 13,
                  marginBottom: 24,
                  display: 'flex', alignItems: 'center', gap: 10
                }}>
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(62,182,73,0.06)',
                  border: '1px solid rgba(62,182,73,0.2)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#3EB649',
                  fontSize: 13,
                  marginBottom: 24,
                  display: 'flex', alignItems: 'center', gap: 10
                }}>
                  <span>✓</span>
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                <div className="auth-form-group">
                  <label className="form-label">Username</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">👤</span>
                    <input
                      id="login-username"
                      type="text"
                      className="auth-input"
                      placeholder="enter username"
                      value={form.username}
                      onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="auth-form-group" style={{ marginBottom: 4 }}>
                  <label className="form-label">Password</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">🔒</span>
                    <input
                      id="login-password"
                      type={showPass ? 'text' : 'password'}
                      className="auth-input"
                      style={{ paddingRight: 40 }}
                      placeholder="enter password"
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(p => !p)}
                      style={{
                        position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-secondary)', fontSize: 14,
                      }}
                    >{showPass ? 'HIDE' : 'SHOW'}</button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -12 }}>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); setSuccessMessage(''); }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  id="login-submit"
                  type="submit"
                  className="cta-btn"
                  disabled={loading}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  <span className="cta-btn-inner">
                    <span className="cta-btn-text-wrapper">
                      <span className="cta-btn-text">{loading ? 'SIGNING IN...' : 'ACCESS PORTAL'}</span>
                      <span className="cta-btn-text-hover">{loading ? 'SIGNING IN...' : 'ACCESS PORTAL'}</span>
                    </span>
                    {!loading && <span>→</span>}
                  </span>
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Forgot Password View */}
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 28, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.03em', marginBottom: 8 }}>RESET ACCESS KEY</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  {forgotStep === 1 ? 'Verify account identity using secure OTP routing' : 'Enter OTP verification code & new credentials'}
                </p>
              </div>

              {error && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#F87171',
                  fontSize: 13,
                  marginBottom: 24,
                  display: 'flex', alignItems: 'center', gap: 10
                }}>
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(62,182,73,0.06)',
                  border: '1px solid rgba(62,182,73,0.2)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#3EB649',
                  fontSize: 13,
                  marginBottom: 24,
                  display: 'flex', alignItems: 'center', gap: 10
                }}>
                  <span>✓</span>
                  <span>{successMessage}</span>
                </div>
              )}

              {mockOtpHelp && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(255, 90, 31, 0.04)',
                  border: '1px dashed var(--accent-orange-glow)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--accent-orange)',
                  fontSize: 12.5,
                  marginBottom: 24,
                  lineHeight: 1.5
                }}>
                  {mockOtpHelp}
                </div>
              )}

              {forgotStep === 1 ? (
                <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  <div className="auth-form-group">
                    <label className="form-label">Email Address</label>
                    <div className="auth-input-wrapper">
                      <span className="auth-input-icon">✉️</span>
                      <input
                        type="email"
                        className="auth-input"
                        placeholder="enter account email"
                        value={forgotForm.email}
                        onChange={e => setForgotForm(p => ({ ...p, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 16 }}>
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setError(''); setSuccessMessage(''); }}
                      className="cta-btn cta-btn-secondary"
                      style={{ flex: 1 }}
                    >
                      <span className="cta-btn-inner">
                        <span className="cta-btn-text-wrapper" style={{ height: 16 }}>
                          <span className="cta-btn-text" style={{ fontSize: 11 }}>Back</span>
                          <span className="cta-btn-text-hover" style={{ fontSize: 11 }}>Back</span>
                        </span>
                      </span>
                    </button>
                    
                    <button
                      type="submit"
                      className="cta-btn"
                      disabled={loading}
                      style={{ flex: 2 }}
                    >
                      <span className="cta-btn-inner">
                        <span className="cta-btn-text-wrapper" style={{ height: 16 }}>
                          <span className="cta-btn-text" style={{ fontSize: 11 }}>{loading ? 'SENDING...' : 'INITIATE RESET'}</span>
                          <span className="cta-btn-text-hover" style={{ fontSize: 11 }}>{loading ? 'SENDING...' : 'INITIATE RESET'}</span>
                        </span>
                      </span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div className="auth-form-group">
                    <label className="form-label">OTP Verification Code</label>
                    <div className="auth-input-wrapper">
                      <span className="auth-input-icon">🔑</span>
                      <input
                        type="text"
                        className="auth-input"
                        placeholder="6-digit code"
                        maxLength="6"
                        value={forgotForm.otp}
                        onChange={e => setForgotForm(p => ({ ...p, otp: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="auth-form-group">
                    <label className="form-label">New Password</label>
                    <div className="auth-input-wrapper">
                      <span className="auth-input-icon">🔒</span>
                      <input
                        type="password"
                        className="auth-input"
                        placeholder="new password"
                        value={forgotForm.newPassword}
                        onChange={e => setForgotForm(p => ({ ...p, newPassword: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="auth-form-group">
                    <label className="form-label">Confirm New Password</label>
                    <div className="auth-input-wrapper">
                      <span className="auth-input-icon">🔒</span>
                      <input
                        type="password"
                        className="auth-input"
                        placeholder="confirm new password"
                        value={forgotForm.confirmPassword}
                        onChange={e => setForgotForm(p => ({ ...p, confirmPassword: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 16 }}>
                    <button
                      type="button"
                      onClick={() => { setForgotStep(1); setError(''); setSuccessMessage(''); setMockOtpHelp(''); }}
                      className="cta-btn cta-btn-secondary"
                      style={{ flex: 1 }}
                    >
                      <span className="cta-btn-inner">
                        <span className="cta-btn-text-wrapper" style={{ height: 16 }}>
                          <span className="cta-btn-text" style={{ fontSize: 11 }}>Retry Email</span>
                          <span className="cta-btn-text-hover" style={{ fontSize: 11 }}>Retry Email</span>
                        </span>
                      </span>
                    </button>
                    
                    <button
                      type="submit"
                      className="cta-btn"
                      disabled={loading}
                      style={{ flex: 2 }}
                    >
                      <span className="cta-btn-inner">
                        <span className="cta-btn-text-wrapper" style={{ height: 16 }}>
                          <span className="cta-btn-text" style={{ fontSize: 11 }}>{loading ? 'RESETTING...' : 'APPLY RESET'}</span>
                          <span className="cta-btn-text-hover" style={{ fontSize: 11 }}>{loading ? 'RESETTING...' : 'APPLY RESET'}</span>
                        </span>
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          <div style={{ marginTop: 32, borderTop: '1px solid var(--border-subtle)', paddingTop: 24 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              First time here?{' '}
              <button
                id="goto-register"
                onClick={onSwitch}
                style={{ 
                  background: 'none', border: 'none', cursor: 'pointer', 
                  color: 'var(--accent-orange)', fontWeight: 700, 
                  textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.05em' 
                }}
              >
                Create Account
              </button>
            </p>
          </div>

          {/* Credentials box helper */}
          <div style={{
            marginTop: 24,
            padding: 16,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 12.5,
            color: 'var(--text-secondary)'
          }}>
            <div style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.05em', color: 'var(--text-primary)', marginBottom: 6 }}>🔑 Access Tokens</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div>Admin: <code style={{ color: 'var(--accent-orange)', fontFamily: 'monospace' }}>admin</code> / <code style={{ color: 'var(--accent-orange)', fontFamily: 'monospace' }}>admin123</code></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
