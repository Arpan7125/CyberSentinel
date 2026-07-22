import React, { useState } from 'react';

const API = 'http://localhost:8000/api';

export default function SubscribeModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/subscribe/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Subscription failed. Please try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        {success ? (
          /* Success state */
          <div style={{ textAlign: 'center', animation: 'revealUp 0.6s ease' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(62,182,73,0.06)',
              border: '1px solid var(--accent-green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, margin: '0 auto 24px',
              boxShadow: '0 0 20px var(--accent-green-glow)',
              color: 'var(--accent-green)'
            }}>✓</div>
            
            <h3 style={{ fontSize: 24, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 12 }}>
              NODE REGISTERED
            </h3>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, lineHeight: 1.6, marginBottom: 24 }}>
              Daily threat summaries will be dispatched to: <br />
              <strong className="mono-display" style={{ color: 'var(--accent-orange)' }}>{email}</strong>
            </p>

            <div style={{
              padding: '16px 20px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)', 
              marginBottom: 28,
              textAlign: 'left'
            }}>
              <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                DISPATCH FEATURES
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 650 }}>
                <div>✦ Daily phishing vector matrices</div>
                <div>✦ Real-time warning alert flags</div>
                <div>✦ Weekly system training briefings</div>
              </div>
            </div>
            
            <button 
              id="subscribe-done" 
              onClick={onClose} 
              className="cta-btn" 
              style={{ width: '100%' }}
            >
              <span className="cta-btn-inner">
                <span className="cta-btn-text-wrapper" style={{ height: 16 }}>
                  <span className="cta-btn-text" style={{ fontSize: 11 }}>Done</span>
                  <span className="cta-btn-text-hover" style={{ fontSize: 11 }}>Done</span>
                </span>
              </span>
            </button>
          </div>
        ) : (
          /* Form state */
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, margin: '0 auto 16px',
              }}>📧</div>
              
              <h3 style={{ fontSize: 24, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 8 }}>
                STAY SECURED
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
                Receive immediate telemetry reports and daily social engineering warning summaries.
              </p>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', marginBottom: 20,
                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 'var(--radius-sm)', color: '#EF4444', fontSize: 12.5,
              }}>⚠️ {error}</div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="auth-form-group">
                <label className="form-label">First Name (Optional)</label>
                <input
                  id="subscribe-name"
                  type="text"
                  className="input-field"
                  placeholder="enter name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              
              <div className="auth-form-group">
                <label className="form-label">Email Address *</label>
                <input
                  id="subscribe-email"
                  type="email"
                  className="input-field"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div style={{
                padding: '12px 14px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)', 
                fontSize: 11,
                color: 'var(--text-muted)',
                fontWeight: 650,
                textTransform: 'uppercase',
                letterSpacing: '0.02em'
              }}>
                🔒 Opt-out at any time. Single key triggers removal.
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button 
                  id="subscribe-cancel" 
                  type="button" 
                  onClick={onClose} 
                  className="cta-btn cta-btn-secondary" 
                  style={{ flex: 1, padding: '12px' }}
                >
                  <span className="cta-btn-inner">
                    <span className="cta-btn-text-wrapper" style={{ height: 16 }}>
                      <span className="cta-btn-text" style={{ fontSize: 11 }}>Cancel</span>
                      <span className="cta-btn-text-hover" style={{ fontSize: 11 }}>Cancel</span>
                    </span>
                  </span>
                </button>
                
                <button 
                  id="subscribe-submit" 
                  type="submit" 
                  className="cta-btn" 
                  disabled={loading} 
                  style={{ flex: 2, padding: '12px' }}
                >
                  <span className="cta-btn-inner">
                    <span className="cta-btn-text-wrapper" style={{ height: 16 }}>
                      <span className="cta-btn-text" style={{ fontSize: 11 }}>
                        {loading ? 'SUBSCRIBING...' : 'SUBSCRIBE'}
                      </span>
                      <span className="cta-btn-text-hover" style={{ fontSize: 11 }}>
                        {loading ? 'SUBSCRIBING...' : 'SUBSCRIBE'}
                      </span>
                    </span>
                  </span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
