import React, { useState } from 'react';
import { Shield, Key, Smartphone, Mail, Globe, Lock, AlertCircle } from 'lucide-react';
import '../../assets/analyzer.css';

export default function AccountSecurityPage() {
  const [accounts, setAccounts] = useState([
    { provider: 'Google', email: 'joshua@cybersentinel.ai', status: 'Connected', risk: 'Low', icon: <Mail color="#EA4335" /> },
    { provider: 'Microsoft', email: 'j.joby@outlook.com', status: 'Action Required', risk: 'High', icon: <Globe color="#00A4EF" /> },
    { provider: 'GitHub', email: 'joshua-dev', status: 'Connected', risk: 'Low', icon: <Shield color="#fff" /> },
  ]);

  const [mfaEnabled, setMfaEnabled] = useState(false);

  return (
    <div className="analyzer-page">
      <div className="analyzer-header">
        <h1>Account & Identity Security</h1>
        <p>Monitor your connected accounts, manage active sessions, and secure your identity across the web.</p>
      </div>

      <div className="analyzer-content" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Overall Security Posture */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
          <div style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'rgba(50,215,75,0.1)', padding: 8, borderRadius: 8 }}>
                <Shield color="#32D74B" size={24} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Identity Score</h3>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#32D74B' }}>85/100</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>Your accounts are relatively secure. Fix 1 issue to reach 100.</div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ background: mfaEnabled ? 'rgba(50,215,75,0.1)' : 'rgba(255,159,10,0.1)', padding: 8, borderRadius: 8 }}>
                <Key color={mfaEnabled ? '#32D74B' : '#FF9F0A'} size={24} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Multi-Factor Auth</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{mfaEnabled ? 'Enabled' : 'Disabled'}</div>
              <button 
                className="btn-pub btn-pub-ghost btn-pub-sm" 
                onClick={() => setMfaEnabled(!mfaEnabled)}
                style={{ color: mfaEnabled ? 'var(--text-muted)' : 'var(--accent)' }}
              >
                {mfaEnabled ? 'Manage' : 'Setup Now'}
              </button>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
              {mfaEnabled ? 'Authenticator App configured.' : 'Highly recommended to secure your account.'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'rgba(175,82,222,0.1)', padding: 8, borderRadius: 8 }}>
                <Smartphone color="#AF52DE" size={24} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Active Sessions</h3>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800 }}>3</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>Across 2 devices. <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Review</a></div>
          </div>
        </div>

        {/* Connected Accounts */}
        <div style={{ background: 'var(--bg-secondary)', padding: 32, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Connected Accounts (OAuth)</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Link your external accounts so CyberSentinel can monitor them for breaches and unauthorized access.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {accounts.map((acc, i) => (
              <div key={i} style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                padding: 20, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-subtle)' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {acc.icon}
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{acc.provider}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{acc.email}</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  {acc.status === 'Action Required' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#FF453A', fontSize: 13, fontWeight: 600, background: 'rgba(255,69,58,0.1)', padding: '4px 12px', borderRadius: 20 }}>
                      <AlertCircle size={14} /> Password breached
                    </div>
                  )}
                  {acc.status === 'Connected' && (
                    <div style={{ color: '#32D74B', fontSize: 13, fontWeight: 600 }}>Secure</div>
                  )}
                  <button className="btn-pub btn-pub-ghost btn-pub-sm">Manage</button>
                </div>
              </div>
            ))}
          </div>

          <button className="btn-pub btn-pub-ghost" style={{ marginTop: 24, width: '100%', borderStyle: 'dashed' }}>
            + Link Another Account
          </button>
        </div>

        {/* Password Health */}
        <div style={{ background: 'var(--bg-secondary)', padding: 32, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <Lock size={24} color="var(--accent)" />
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Password Health</h2>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Your master password was last changed 45 days ago.</div>
              <div style={{ width: '100%', height: 8, background: '#333', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: '80%', height: '100%', background: '#32D74B' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                <span>Weak</span>
                <span>Strong</span>
              </div>
            </div>
            <div>
              <button className="btn-pub btn-pub-primary">Update Password</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
