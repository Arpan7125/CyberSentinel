import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ParticleBackground from '../../components/ui/ParticleBackground';
import PasswordStrength from '../../components/ui/PasswordStrength';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required.'); return; }
    if (!otp.trim()) { setError('6-digit OTP code is required.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${API}/auth/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          new_password: form.password,
          confirm_password: form.confirmPassword
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Password reset failed.');
      }
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please check your code and try again.');
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

          {!success ? (
            <>
              <h1 className="auth-title">Set new password</h1>
              <p className="auth-subtitle">Enter your OTP verification code and choose your new password.</p>

              {error && <div className="auth-error">{error}</div>}

              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-input-group">
                  <label className="auth-input-label">Email Address</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">📧</span>
                    <input
                      type="email"
                      className="auth-input"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label className="auth-input-label">6-Digit OTP Code</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">🔑</span>
                    <input
                      type="text"
                      className="auth-input"
                      value={otp}
                      onChange={(e) => { setOtp(e.target.value); setError(''); }}
                      placeholder="123456"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label className="auth-input-label">New Password</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">🔒</span>
                    <input type={showPwd ? 'text' : 'password'} name="password" className="auth-input" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} autoComplete="new-password" required />
                    <button type="button" className="auth-input-action" onClick={() => setShowPwd(!showPwd)} tabIndex={-1}>
                      {showPwd ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <PasswordStrength password={form.password} />
                </div>

                <div className="auth-input-group">
                  <label className="auth-input-label">Confirm Password</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">🔒</span>
                    <input type={showPwd ? 'text' : 'password'} name="confirmPassword" className="auth-input" placeholder="Re-enter new password" value={form.confirmPassword} onChange={handleChange} autoComplete="new-password" required />
                  </div>
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <span style={{ fontSize: 12, color: 'var(--accent-red)' }}>Passwords do not match</span>
                  )}
                </div>

                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? <><span className="btn-spinner" /> Resetting...</> : 'Reset Password'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center', fontSize: 64, margin: '8px 0 16px' }}>✅</div>
              <h1 className="auth-title">Password reset complete</h1>
              <p className="auth-subtitle">Your password has been successfully updated. You can now sign in with your new password.</p>

              <button className="auth-submit" onClick={() => navigate('/login')} style={{ marginTop: 24 }}>
                Sign In →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

