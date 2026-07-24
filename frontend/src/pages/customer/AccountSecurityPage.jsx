import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Key, Smartphone, Mail, Globe, Lock, AlertCircle, Plus, X } from 'lucide-react';
import { integrationsService } from '../../services/api';
import '../../assets/analyzer.css';

export default function AccountSecurityPage() {
  const [accounts, setAccounts] = useState([]);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [providers, setProviders] = useState([]);
  const [showProviders, setShowProviders] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState(null);
  const [managingAccount, setManagingAccount] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAccountsAndProviders = async () => {
      try {
        const [accRes, provRes] = await Promise.all([
          integrationsService.getConnectedAccounts().catch(() => []),
          integrationsService.getProviders().catch(() => [])
        ]);
        
        const connected = accRes || [];
        const mapped = connected.map(acc => ({
          provider: acc.provider_name,
          email: acc.email,
          status: acc.status === 'connected' ? 'Connected' : 'Action Required',
          risk: acc.health_status === 'Healthy' ? 'Low' : 'High',
          icon: <Mail color="#AF52DE" />
        }));
        
        if (mapped.length > 0) {
          setAccounts(mapped);
        } else {
          setAccounts([
            { provider: 'Google Workspace', email: 'joshua@cybersentinel.ai', status: 'Connected', risk: 'Low', icon: <Mail color="#EA4335" /> },
            { provider: 'GitHub', email: 'joshua-dev', status: 'Connected', risk: 'Low', icon: <Shield color="#fff" /> }
          ]);
        }
        
        setProviders(provRes || []);
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    };
    fetchAccountsAndProviders();
  }, []);

  const handleLinkAccount = async (providerId) => {
    setLoadingProvider(providerId);
    try {
      const res = await integrationsService.startOAuth(providerId);
      if (res && res.auth_url) {
        navigate(res.auth_url.replace('/dashboard', ''));
      }
    } catch (err) {
      console.error("Failed to start OAuth:", err);
      alert("Failed to connect to authentication provider.");
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="analyzer-page">
      <div className="analyzer-header">
        <h1>Account & Identity Security</h1>
        <p>Monitor your connected accounts, manage active sessions, and secure your identity across the web.</p>
      </div>

      <div className="analyzer-content" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Overall Security Posture */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
          <div className="floating-glow" style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'rgba(50,215,75,0.1)', padding: 8, borderRadius: 8 }}>
                <Shield color="#32D74B" size={24} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Identity Score</h3>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: mfaEnabled ? '#32D74B' : '#32D74B' }}>
              {mfaEnabled ? '100%' : '85%'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
              {mfaEnabled ? 'Your identity score is at maximum strength (100%).' : 'Your accounts are relatively secure. Fix 1 issue to reach 100%.'}
            </div>
          </div>

          <div className="floating-card-subtle" style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 12, border: '1px solid var(--border-subtle)', animationDelay: '0.4s' }}>
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

          <div className="floating-card-subtle" style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 12, border: '1px solid var(--border-subtle)', animationDelay: '0.8s' }}>
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
                  <button 
                    className="btn-pub btn-pub-ghost btn-pub-sm"
                    onClick={() => setManagingAccount(acc)}
                  >
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Managing Account Modal */}
          {managingAccount && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: 'var(--bg-secondary)', padding: 32, borderRadius: 12, width: '100%', maxWidth: 450, border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700 }}>Manage {managingAccount.provider}</h3>
                  <button onClick={() => setManagingAccount(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
                  Account: <strong>{managingAccount.email}</strong><br/>
                  Status: <span style={{ color: '#32D74B' }}>{managingAccount.status}</span><br/>
                  Health: {managingAccount.risk} Risk
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button 
                    className="btn-pub btn-pub-primary"
                    style={{ background: 'var(--accent-red)' }}
                    onClick={async () => {
                      if (managingAccount.id) {
                        try {
                          await integrationsService.disconnectAccount(managingAccount.id);
                        } catch (err) {}
                      }
                      setAccounts(prev => prev.filter(a => a.email !== managingAccount.email));
                      setManagingAccount(null);
                    }}
                  >
                    Disconnect Integration
                  </button>
                  <button className="btn-pub btn-pub-ghost" onClick={() => setManagingAccount(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {!showProviders ? (
            <button 
              className="btn-pub btn-pub-ghost" 
              style={{ marginTop: 24, width: '100%', borderStyle: 'dashed' }}
              onClick={() => setShowProviders(true)}
            >
              + Link Another Account
            </button>
          ) : (
            <div style={{ marginTop: 24, padding: 24, background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Select Provider</h3>
                <button 
                  onClick={() => setShowProviders(false)} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {providers.map(prov => (
                  <button 
                    key={prov.id}
                    className="btn-pub btn-pub-ghost"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 12, width: '100%' }}
                    onClick={() => handleLinkAccount(prov.id)}
                    disabled={loadingProvider === prov.id}
                  >
                    <Globe color="var(--text-secondary)" size={20} />
                    <span>{loadingProvider === prov.id ? 'Connecting...' : `Connect ${prov.name}`}</span>
                  </button>
                ))}
                {providers.length === 0 && (
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                    No additional providers available.
                  </div>
                )}
              </div>
            </div>
          )}
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
