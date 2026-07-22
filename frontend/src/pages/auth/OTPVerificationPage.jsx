import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ParticleBackground from '../../components/ui/ParticleBackground';

export default function OTPVerificationPage() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resent, setResent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    // Auto-submit when all filled
    if (newOtp.every(d => d) && newOtp.join('').length === 6) {
      handleSubmit(null, newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    text.split('').forEach((c, i) => { if (i < 6) newOtp[i] = c; });
    setOtp(newOtp);
    if (newOtp.join('').length === 6) handleSubmit(null, newOtp.join(''));
  };

  const handleSubmit = async (e, code) => {
    if (e) e.preventDefault();
    const verifyCode = code || otp.join('');
    if (verifyCode.length !== 6) { setError('Please enter the complete 6-digit code.'); return; }
    setLoading(true);
    setError('');
    try {
      await new Promise(r => setTimeout(r, 1200));
      navigate('/dashboard');
    } catch {
      setError('Invalid code. Please try again.');
      setLoading(false);
    }
  };

  const handleResend = () => {
    setResent(true);
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); setResent(false); return 0; }
        return prev - 1;
      });
    }, 1000);
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

          <div style={{ fontSize: 48, margin: '8px 0 20px' }}>🔐</div>
          <h1 className="auth-title">Enter verification code</h1>
          <p className="auth-subtitle">We sent a 6-digit code to your device. Enter it below to verify your identity.</p>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="otp-inputs">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => inputRefs.current[idx] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className="otp-input"
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={idx === 0 ? handlePaste : undefined}
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <><span className="btn-spinner" /> Verifying...</> : 'Verify Identity'}
            </button>
          </form>

          <div style={{ marginTop: 20 }}>
            {!resent ? (
              <button onClick={handleResend} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Didn't receive a code? Resend
              </button>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Code sent! Resend available in {countdown}s
              </span>
            )}
          </div>

          <div style={{ marginTop: 8 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
              ← Use a different method
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
