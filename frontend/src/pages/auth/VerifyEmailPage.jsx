import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ParticleBackground from '../../components/ui/ParticleBackground';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const res = await fetch(`${API}/verify-email/?token=${token}`);
        if (res.ok) setStatus('success');
        else setStatus(token ? 'error' : 'pending');
      } catch {
        setStatus(token ? 'error' : 'pending');
      }
    };
    if (token) {
      setTimeout(verify, 1500); // Brief delay for UX
    } else {
      setStatus('pending');
    }
  }, [token]);

  const handleResend = async () => {
    setResent(true);
    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      await fetch(`${API}/resend-verification/`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    } catch {}
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-effects">
        <ParticleBackground />
        <div className="auth-grid-lines" />
        <div className="auth-glow-1" />
        <div className="auth-glow-2" />
      </div>

      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-logo" style={{ justifyContent: 'center' }}>
            <div className="auth-logo-icon">🛡️</div>
            <span className="auth-logo-text">CyberSentinel</span>
          </div>

          {status === 'verifying' && (
            <>
              <div style={{ margin: '24px 0' }}>
                <div className="btn-spinner" style={{ width: 40, height: 40, borderWidth: 3, margin: '0 auto 20px', borderColor: 'rgba(0,122,255,0.2)', borderTopColor: 'var(--accent)' }} />
              </div>
              <h1 className="auth-title">Verifying your email...</h1>
              <p className="auth-subtitle">Please wait while we confirm your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={{ fontSize: 64, margin: '16px 0' }}>✅</div>
              <h1 className="auth-title">Email verified!</h1>
              <p className="auth-subtitle">Your email address has been successfully verified. You can now access all features of your CyberSentinel account.</p>
              <button className="auth-submit" onClick={() => navigate('/login')} style={{ marginTop: 24 }}>
                Continue to Sign In →
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{ fontSize: 64, margin: '16px 0' }}>❌</div>
              <h1 className="auth-title">Verification failed</h1>
              <p className="auth-subtitle">This verification link is invalid or has expired. Please request a new verification email.</p>
              <button className="auth-submit" onClick={handleResend} disabled={resent} style={{ marginTop: 24 }}>
                {resent ? '✓ Verification email sent' : 'Resend Verification Email'}
              </button>
              <div className="auth-footer">
                <Link to="/login">← Back to login</Link>
              </div>
            </>
          )}

          {status === 'pending' && (
            <>
              <div style={{ fontSize: 64, margin: '16px 0' }}>📬</div>
              <h1 className="auth-title">Check your email</h1>
              <p className="auth-subtitle">We've sent a verification link to your email address. Click the link to verify your account and get started.</p>
              <div style={{ margin: '24px 0', padding: 16, background: 'rgba(0,122,255,0.06)', border: '1px solid rgba(0,122,255,0.15)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, textAlign: 'left' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Tips:</strong><br />
                • Check your spam or junk folder<br />
                • Add noreply@cybersentinel.ai to your contacts<br />
                • The link expires in 24 hours
              </div>
              {!resent ? (
                <button className="auth-submit" onClick={handleResend}>
                  Resend Verification Email
                </button>
              ) : (
                <div style={{ padding: 12, background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-green)', fontSize: 14, fontWeight: 600 }}>
                  ✓ New verification email sent
                </div>
              )}
              <div className="auth-footer">
                <Link to="/login">← Back to login</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
