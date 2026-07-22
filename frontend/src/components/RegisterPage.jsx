import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

export default function RegisterPage({ onSwitch, onSuccess }) {
  const { register } = useAuth();
  
  // Registration states
  const [activeRole, setActiveRole] = useState('user'); // 'user' | 'admin'
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm_password: '' });
  const [showPass, setShowPass] = useState(false);
  
  // Message states
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = passwordStrength(form.password);
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const strengthColors = ['', '#EF4444', '#FF5A1F', '#FBBF24', '#3EB649', '#00E5FF'];

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    
    setLoading(true);
    try {
      const user = await register(
        form.username, 
        form.email, 
        form.password, 
        form.confirm_password, 
        activeRole
      );
      onSuccess(user);
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

      {/* Left branding */}
      <div className="auth-left reveal-up">
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            fontSize: 20, fontWeight: 900, color: 'var(--accent-orange)', letterSpacing: '0.15em'
          }}>CS // 02</div>
        </div>

        {/* Hero Section */}
        <div style={{ margin: '60px 0' }}>
          <h1 className="display-title text-gradient" style={{ marginBottom: 30 }}>
            JOIN THE<br />
            SHIELD<span style={{ color: 'var(--accent-green)' }}>.</span>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 440, marginBottom: 40 }}>
            Create a profile to unlock personalized threat log summaries, full history tracking, security challenges, and automated security reports.
          </p>

          {/* Benefits Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, borderTop: '1px solid var(--border-subtle)', paddingTop: 32 }}>
            {[
              { label: 'PERSONAL HISTORY', desc: 'Secure database records' },
              { label: 'DAILY INTEL', desc: 'Email safety alerts digest' },
              { label: 'AWARENESS RATING', desc: 'Interactive security quiz' },
              { label: 'FREE LICENSE', desc: 'No financial inputs required' }
            ].map((f, i) => (
              <div key={i} className="slide-up-item" style={{ animationDelay: `${0.1 * i}s` }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-green)', letterSpacing: '0.08em', marginBottom: 4 }}>{f.label}</div>
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
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.03em', marginBottom: 8 }}>REGISTER</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Create credentials to setup your security node</p>
          </div>

          {/* User vs Admin Role Toggle */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: 4,
            marginBottom: 24
          }}>
            <button
              type="button"
              onClick={() => { setActiveRole('user'); setError(''); }}
              style={{
                flex: 1,
                padding: '8px 16px',
                background: activeRole === 'user' ? 'var(--accent-green)' : 'transparent',
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
              👤 Standard User
            </button>
            <button
              type="button"
              onClick={() => { setActiveRole('admin'); setError(''); }}
              style={{
                flex: 1,
                padding: '8px 16px',
                background: activeRole === 'admin' ? 'var(--accent-green)' : 'transparent',
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
              🛡️ Security Admin
            </button>
          </div>

          {error && (
            <div className="slide-up-item" style={{
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="auth-form-group">
              <label className="form-label">Username</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">👤</span>
                <input
                  id="reg-username"
                  type="text"
                  className="auth-input"
                  placeholder="choose username"
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label className="form-label">Email Address</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">✉️</span>
                <input
                  id="reg-email"
                  type="email"
                  className="auth-input"
                  placeholder="enter email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label className="form-label">Password</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">🔒</span>
                <input
                  id="reg-password"
                  type={showPass ? 'text' : 'password'}
                  className="auth-input"
                  style={{ paddingRight: 40 }}
                  placeholder="create password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                  autoComplete="new-password"
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

              {/* Password Strength Indicator */}
              {form.password && (
                <div className="slide-up-item" style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      Strength: <strong style={{ color: strengthColors[strength] }}>{strengthLabels[strength]}</strong>
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{strength}/5</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, height: 4 }}>
                    {[1, 2, 3, 4, 5].map(step => (
                      <div
                        key={step}
                        style={{
                          flex: 1,
                          height: '100%',
                          borderRadius: 2,
                          background: step <= strength ? strengthColors[strength] : 'rgba(255,255,255,0.06)',
                          transition: 'all 0.4s'
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="auth-form-group">
              <label className="form-label">Confirm Password</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">🔒</span>
                <input
                  id="reg-confirm-password"
                  type="password"
                  className="auth-input"
                  placeholder="re-enter password"
                  value={form.confirm_password}
                  onChange={e => setForm(p => ({ ...p, confirm_password: e.target.value }))}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              id="reg-submit"
              type="submit"
              className="cta-btn"
              disabled={loading}
              style={{ width: '100%', marginTop: 8 }}
            >
              <span className="cta-btn-inner">
                <span className="cta-btn-text-wrapper">
                  <span className="cta-btn-text">{loading ? 'CREATING NODE...' : 'CREATE ACCOUNT'}</span>
                  <span className="cta-btn-text-hover">{loading ? 'CREATING NODE...' : 'CREATE ACCOUNT'}</span>
                </span>
                {!loading && <span>→</span>}
              </span>
            </button>
          </form>

          <div style={{ marginTop: 32, borderTop: '1px solid var(--border-subtle)', paddingTop: 24 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Already registered?{' '}
              <button
                id="goto-login"
                onClick={onSwitch}
                style={{ 
                  background: 'none', border: 'none', cursor: 'pointer', 
                  color: 'var(--accent-orange)', fontWeight: 700, 
                  textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.05em' 
                }}
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
