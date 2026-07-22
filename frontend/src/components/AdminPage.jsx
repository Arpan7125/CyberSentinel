import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';

const API = 'http://localhost:8000/api';

function StatCard({ icon, label, value, colorClass, borderGlow }) {
  return (
    <div 
      className="glass-card" 
      style={{
        padding: '20px 24px',
        flex: 1, 
        position: 'relative',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        if (borderGlow) {
          e.currentTarget.style.borderColor = borderGlow;
          e.currentTarget.style.boxShadow = `0 12px 30px rgba(0,0,0,0.5), 0 0 15px ${borderGlow}55`;
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>

      <div className={`mono-display ${colorClass}`} style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

function RiskBadge({ level }) {
  const map = {
    'Low': 'badge-low',
    'Medium': 'badge-medium',
    'High': 'badge-high',
    'Critical': 'badge-critical',
  };
  return <span className={`badge ${map[level] || 'badge-medium'}`} style={{ fontSize: 9 }}>{level}</span>;
}

export default function AdminPage({ onBack }) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  // Integrations settings variables (strictly isolated to Admin console)
  const [gmailClientId, setGmailClientId] = useState('');
  const [gmailToken, setGmailToken] = useState('');
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [twilioFrom, setTwilioFrom] = useState('');
  const [twilioTo, setTwilioTo] = useState('');
  const [configSaving, setConfigSaving] = useState(false);

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch(`${API}/integrations/config/`, {
        headers: { Authorization: `Token ${token}` }
      });
      if (res.ok) {
        const d = await res.json();
        setGmailClientId(d.gmail_client_id || '');
        setGmailToken(d.gmail_access_token || '');
        setTwilioSid(d.twilio_sid || '');
        setTwilioToken(d.twilio_token || '');
        setTwilioFrom(d.twilio_from || '');
        setTwilioTo(d.twilio_to || '');
      }
    } catch (err) {
      console.warn("Failed to fetch integration settings", err);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'integrations') {
      fetchConfigs();
    }
  }, [activeTab, fetchConfigs]);

  const handleSaveConfigs = async (e) => {
    e.preventDefault();
    setConfigSaving(true);
    try {
      const res = await fetch(`${API}/integrations/config/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`
        },
        body: JSON.stringify({
          gmail_client_id: gmailClientId,
          gmail_access_token: gmailToken,
          twilio_sid: twilioSid,
          twilio_token: twilioToken,
          twilio_from: twilioFrom,
          twilio_to: twilioTo
        })
      });
      if (res.ok) {
        showToast('System integration configs saved successfully.');
      } else {
        showToast('Failed to apply integrations configs.', 'error');
      }
    } catch {
      showToast('Config save failed.', 'error');
    } finally {
      setConfigSaving(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/stats/`, {
        headers: { Authorization: `Token ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to load data');
      setData(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUserAction = async (userId, action) => {
    setActionLoading(`${userId}-${action}`);
    try {
      const res = await fetch(`${API}/admin/users/action/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Token ${token}` },
        body: JSON.stringify({ user_id: userId, action }),
      });
      const d = await res.json();
      if (res.ok) {
        showToast(d.message);
        fetchData();
      } else {
        showToast(d.error, 'error');
      }
    } catch {
      showToast('Action failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { id: 'overview', label: '📊 SYSTEM OVERVIEW' },
    { id: 'users', label: '👥 ACCOUNTS INDEX' },
    { id: 'scans', label: '🔍 LOG ARCHIVES' },
    { id: 'subscribers', label: '📧 DISPATCH LIST' },
    { id: 'integrations', label: '⚙️ API INTEGRATIONS' }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <div className="spinner" style={{ width: 24, height: 24 }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Synchronizing administrative telemetry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 42 }}>🚫</div>
        <h2 style={{ color: '#EF4444', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{error}</h2>
        <button 
          className="cta-btn" 
          onClick={onBack}
        >
          <span className="cta-btn-inner">
            <span className="cta-btn-text-wrapper" style={{ height: 16 }}>
              <span className="cta-btn-text" style={{ fontSize: 11 }}>RETURN TO PORTAL</span>
              <span className="cta-btn-text-hover" style={{ fontSize: 11 }}>RETURN TO PORTAL</span>
            </span>
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="page-container reveal-up">
      {/* Toast popup */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      {/* Ambient background glows */}
      <div className="glow-orb glow-orange" style={{ top: '10%', left: '40%', opacity: 0.1 }} />

      {/* Header */}
      <div className="page-header">
        <div>
          <button 
            onClick={onBack} 
            style={{ 
              background: 'none', border: 'none', cursor: 'pointer', 
              color: 'var(--accent-orange)', fontSize: 11, fontWeight: 800, 
              textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 
            }}
          >
            // RETURN TO TERMINAL
          </button>
          
          <h1 className="page-title text-gradient-orange">
            ADMIN GATEWAY
          </h1>
          <p className="page-subtitle">SYSTEM STATUS METRICS, THREAT AUDITING AND ACCOUNT RIGHTS CONFIGURATION</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="badge badge-admin" style={{ padding: '6px 12px' }}>👑 SUPERADMIN NODE</span>
          
          <button 
            className="cta-btn cta-btn-secondary" 
            onClick={fetchData} 
            style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)' }}
          >
            <span className="cta-btn-inner">
              <span className="cta-btn-text-wrapper" style={{ height: 16 }}>
                <span className="cta-btn-text" style={{ fontSize: 11 }}>REFRESH METRICS</span>
                <span className="cta-btn-text-hover" style={{ fontSize: 11 }}>REFRESH METRICS</span>
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* Stats Display Cards */}
      {data && (
        <div style={{ display: 'flex', gap: 20 }}>
          <StatCard icon="👥" label="Registered Profiles" value={data.stats.total_users} colorClass="text-gradient" borderGlow="rgba(255,255,255,0.25)" />
          <StatCard icon="🔍" label="Telemetry Checked" value={data.stats.total_scans} colorClass="text-gradient" borderGlow="rgba(255,255,255,0.25)" />
          <StatCard icon="⚠️" label="Malicious Detections" value={data.stats.total_threats} colorClass="text-gradient-orange" borderGlow="var(--accent-orange)" />
          <StatCard icon="📧" label="Active Subscriptions" value={data.stats.active_subscribers} colorClass="text-gradient" borderGlow="rgba(255,255,255,0.25)" />
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', gap: 10, padding: 4, 
        background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', 
        borderRadius: 'var(--radius-sm)', width: 'fit-content' 
      }}>
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="mono-display"
            style={{ 
              padding: '8px 18px', fontSize: 11, fontWeight: 900, cursor: 'pointer',
              background: activeTab === tab.id ? 'rgba(255,90,31,0.08)' : 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: activeTab === tab.id ? 'var(--accent-orange)' : 'var(--text-muted)',
              transition: 'all 0.3s'
            }}
            id={`admin-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab contents */}
      {data && (
        <div className="glass-card" style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                Scan Type Metrics breakdown
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                {Object.entries(data.scan_type_distribution || {}).map(([type, count]) => {
                  const icons = { TEXT: '📝', URL: '🔗', SCREENSHOT: '📸' };
                  const colors = { TEXT: '#2563EB', URL: 'var(--accent-orange)', SCREENSHOT: 'var(--accent-green)' };
                  const total = Object.values(data.scan_type_distribution).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={type} className="glass-card" style={{ flex: 1, padding: 24, textAlign: 'center', background: 'rgba(255,255,255,0.005)' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>{icons[type]}</div>
                      <div className="mono-display" style={{ fontSize: 28, fontWeight: 900, color: colors[type] }}>{count}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginTop: 6 }}>
                        {type} scans // {pct}% ratio
                      </div>
                      
                      <div style={{ marginTop: 14, height: 3, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: colors[type], transition: 'width 1s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Users tab */}
          {activeTab === 'users' && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 18 }}>
                Accounts Index ({data.recent_users.length} registered nodes)
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Node ID</th>
                      <th>Account Name</th>
                      <th>Email Registry</th>
                      <th>Registered On</th>
                      <th>Rights Role</th>
                      <th>Status</th>
                      <th>Directives</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_users.map(user => (
                      <tr key={user.id}>
                        <td className="mono-display" style={{ color: 'var(--text-muted)' }}>#{user.id}</td>
                        <td style={{ fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', fontSize: 13 }}>
                          {user.username}
                        </td>
                        <td>{user.email || '—'}</td>
                        <td>{user.date_joined}</td>
                        <td>
                          {user.is_staff
                            ? <span className="badge badge-admin">Admin Node</span>
                            : <span className="badge" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>User Node</span>
                          }
                        </td>
                        <td>
                          <span className={`badge ${user.is_active ? 'badge-low' : 'badge-critical'}`}>
                            {user.is_active ? 'Cleared' : 'Suspended'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <button
                              onClick={() => handleUserAction(user.id, 'toggle_active')}
                              disabled={actionLoading === `${user.id}-toggle_active`}
                              className="cta-btn cta-btn-secondary"
                              style={{ padding: '6px 12px', fontSize: 10, borderRadius: 'var(--radius-sm)' }}
                            >
                              <span className="cta-btn-inner">
                                <span className="cta-btn-text-wrapper" style={{ height: 14 }}>
                                  <span className="cta-btn-text">{user.is_active ? 'Suspend' : 'Reinstate'}</span>
                                  <span className="cta-btn-text-hover">{user.is_active ? 'Suspend' : 'Reinstate'}</span>
                                </span>
                              </span>
                            </button>
                            
                            <button
                              onClick={() => handleUserAction(user.id, 'toggle_staff')}
                              disabled={actionLoading === `${user.id}-toggle_staff`}
                              className="cta-btn cta-btn-secondary"
                              style={{ padding: '6px 12px', fontSize: 10, borderRadius: 'var(--radius-sm)' }}
                            >
                              <span className="cta-btn-inner">
                                <span className="cta-btn-text-wrapper" style={{ height: 14 }}>
                                  <span className="cta-btn-text">{user.is_staff ? 'Strip Rights' : 'Grant Admin'}</span>
                                  <span className="cta-btn-text-hover">{user.is_staff ? 'Strip Rights' : 'Grant Admin'}</span>
                                </span>
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Scan logs tab */}
          {activeTab === 'scans' && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 18 }}>
                Telemetry Log Archive (Recent 50 checks)
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Index</th>
                      <th>Sensor Mode</th>
                      <th>Scanned Content String</th>
                      <th>Heuristics Score</th>
                      <th>Severity</th>
                      <th>Agent Owner</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_scans.map(scan => (
                      <tr key={scan.id}>
                        <td className="mono-display" style={{ color: 'var(--text-muted)' }}>#{scan.id}</td>
                        <td>
                          <span style={{ fontSize: 12, fontWeight: 800 }}>
                            {scan.scan_type === 'TEXT' ? '📝 TEXT' : scan.scan_type === 'URL' ? '🔗 URL' : '📸 IMAGE'}
                          </span>
                        </td>
                        <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, fontFamily: 'monospace' }}>
                          {scan.input_content}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 50, height: 3,
                              background: 'var(--bg-secondary)',
                            }}>
                              <div style={{
                                height: '100%',
                                width: `${scan.risk_score}%`,
                                background: scan.risk_score >= 80 ? '#EF4444' : scan.risk_score >= 50 ? '#FF5A1F' : '#3EB649',
                                boxShadow: scan.risk_score >= 80 ? '0 0 8px #EF444477' : 'none'
                              }} />
                            </div>
                            <span className="mono-display" style={{ fontSize: 11 }}>{scan.risk_score}%</span>
                          </div>
                        </td>
                        <td><RiskBadge level={scan.risk_level} /></td>
                        <td style={{ fontSize: 12, textTransform: 'uppercase' }}>{scan['user__username'] || '—'}</td>
                        <td className="mono-display" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {new Date(scan.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Subscribers tab */}
          {activeTab === 'subscribers' && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 18 }}>
                Intel Dispatch Recipient Registry
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Subscriber ID</th>
                      <th>Email Dispatch Target</th>
                      <th>First Name Signature</th>
                      <th>Registry Status</th>
                      <th>Registry Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.subscribers.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 12 }}>
                          No dispatch nodes registered yet.
                        </td>
                      </tr>
                    ) : data.subscribers.map(sub => (
                      <tr key={sub.id}>
                        <td className="mono-display" style={{ color: 'var(--text-muted)' }}>#{sub.id}</td>
                        <td style={{ color: 'var(--accent-orange)', fontWeight: 800, fontFamily: 'monospace', fontSize: 13 }}>
                          {sub.email}
                        </td>
                        <td>{sub.name || '—'}</td>
                        <td>
                          <span className={`badge ${sub.is_active ? 'badge-low' : 'badge-critical'}`}>
                            {sub.is_active ? 'Subscribed' : 'Removed'}
                          </span>
                        </td>
                        <td className="mono-display" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {sub.created_at}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Integrations tab */}
          {activeTab === 'integrations' && (
            <form onSubmit={handleSaveConfigs} style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720 }}>
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  ⚙️ System Wide API Integrations
                </h3>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  Restrictive credentials config view. Standard profiles cannot verify or access this configuration.
                </p>
              </div>

              {/* Google OAuth Section */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 18 }}>
                <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>GOOGLE CLIENT ID</label>
                <input
                  type="text"
                  className="ios-input"
                  placeholder="Paste Google Web client ID"
                  value={gmailClientId}
                  onChange={e => setGmailClientId(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>GOOGLE AUTH MANUAL OVERRIDE TOKEN</label>
                <input
                  type="password"
                  className="ios-input"
                  placeholder="Paste active Google Access Token override"
                  value={gmailToken}
                  onChange={e => setGmailToken(e.target.value)}
                />
              </div>

              {/* Twilio configurations */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>TWILIO ACCOUNT SID</label>
                  <input
                    type="text"
                    className="ios-input"
                    placeholder="Enter Twilio Account SID"
                    value={twilioSid}
                    onChange={e => setTwilioSid(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>TWILIO AUTH TOKEN</label>
                  <input
                    type="password"
                    className="ios-input"
                    placeholder="Enter Twilio Auth Token"
                    value={twilioToken}
                    onChange={e => setTwilioToken(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>TWILIO OUTBOUND FROM NUMBER</label>
                  <input
                    type="text"
                    className="ios-input"
                    placeholder="e.g. +18889994444"
                    value={twilioFrom}
                    onChange={e => setTwilioFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>DEFAULT ALERTS RECIPIENT TO NUMBER</label>
                  <input
                    type="text"
                    className="ios-input"
                    placeholder="e.g. +14155552671"
                    value={twilioTo}
                    onChange={e => setTwilioTo(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <button type="submit" disabled={configSaving} className="cta-btn" style={{ width: 220 }}>
                  {configSaving ? 'APPLYING CONFIG...' : 'SAVE INTEGRATIONS'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
