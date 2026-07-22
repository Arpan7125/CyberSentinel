import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ParticleBackground from '../../components/ui/ParticleBackground';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${API}/auth/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset code.');
      }
      if (data.dev_otp) {
        setDevOtp(data.dev_otp);
      }
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
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
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">🛡️</div>
            <span className="auth-logo-text">CyberSentinel</span>
          </div>

          {!sent ? (
            <>
              <h1 className="auth-title">Reset your password</h1>
              <p className="auth-subtitle">Enter your email address to receive a 6-digit verification code.</p>

              {error && <div className="auth-error">{error}</div>}

              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-input-group">
                  <label className="auth-input-label">Email Address</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">📧</span>
                    <input
                      type="email"
                      className="auth-input"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      autoComplete="email"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? <><span className="btn-spinner" /> Sending OTP Code...</> : 'Send Verification Code'}
                </button>
              </form>

              <div className="auth-footer">
                <Link to="/login">← Back to login</Link>
              </div>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center', fontSize: 64, margin: '8px 0 16px' }}>📧</div>
              <h1 className="auth-title">Check your email</h1>
              <p className="auth-subtitle">
                We've sent a 6-digit verification code to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
              </p>

              {devOtp && (
                <div style={{ padding: 12, background: 'rgba(175,82,222,0.1)', color: '#AF52DE', border: '1px solid rgba(175,82,222,0.2)', borderRadius: 6, fontSize: 13, fontWeight: 700, margin: '16px 0', textAlign: 'center' }}>
                  Dev Mode Code: {devOtp}
                </div>
              )}

              <button className="auth-submit" onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)} style={{ marginTop: 16 }}>
                Enter Code & Reset Password →
              </button>

              <div className="auth-footer" style={{ marginTop: 16 }}>
                <Link to="/login">← Back to login</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

