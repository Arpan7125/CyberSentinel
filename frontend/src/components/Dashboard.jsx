import React, { useState, useEffect, useCallback } from 'react';
import GlobalMap from './GlobalMap';
import { useAuth } from '../AuthContext';

const API = 'http://localhost:8000/api';

const EMPTY_STATS = {
  total_scans: 0, total_threats: 0, avg_risk: 0, threats_percentage: 0,
  types_distribution: { text: 0, url: 0, screenshot: 0 },
  risk_distribution: { low: 0, medium: 0, high: 0, critical: 0 },
  chart_data: [],
  recent_scans: [],
};

function StatCard({ icon, label, value, subtext, colorClass, borderGlow }) {
  return (
    <div 
      className="glass-card" 
      style={{
        padding: '24px 28px',
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{ fontSize: 16 }}>{icon}</span>
      </div>

      <div className={`mono-display ${colorClass}`} style={{ fontSize: 44, fontWeight: 900, lineHeight: 1 }}>
        {value}
      </div>
      
      {subtext && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 8 }}>
          // {subtext}
        </div>
      )}
    </div>
  );
}

function RiskBadge({ level }) {
  const map = { Low: 'badge-low', Medium: 'badge-medium', High: 'badge-high', Critical: 'badge-critical' };
  const icons = { Low: '●', Medium: '●', High: '▲', Critical: '■' };
  return (
    <span className={`badge ${map[level] || 'badge-medium'}`} style={{ fontSize: 9, padding: '4px 10px' }}>
      <span style={{ marginRight: 4 }}>{icons[level]}</span> {level}
    </span>
  );
}

export default function Dashboard({ triggerScanRefetch }) {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Gmail Sync states
  const [syncingGmail, setSyncingGmail] = useState(false);
  const [gmailMessage, setGmailMessage] = useState('');
  const [gmailEmails, setGmailEmails] = useState([]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Token ${token}`;
      const res = await fetch(`${API}/dashboard/stats/`, { headers });
      if (!res.ok) throw new Error('Failed');
      setStats(await res.json());
    } catch {
      setStats(EMPTY_STATS);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleGmailSync = async () => {
    setSyncingGmail(true);
    setGmailMessage('');
    try {
      const tokenOverride = localStorage.getItem('cs_gmail_token') || '';
      const response = await fetch('http://localhost:8000/api/integrations/gmail/import/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Token ${token}` } : {})
        },
        body: JSON.stringify({
          access_token: tokenOverride,
          simulated: !tokenOverride
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to sync Gmail feed.');
      
      setGmailEmails(data.emails || []);
      setGmailMessage(`Inbox scanned via ${data.source}.`);
      fetchStats();
    } catch (err) {
      setGmailMessage(`Gmail import failed: ${err.message}`);
    } finally {
      setSyncingGmail(false);
    }
  };

  useEffect(() => { fetchStats(); }, [triggerScanRefetch, fetchStats]);

  const typeIcons = { TEXT: '📝', URL: '🔗', SCREENSHOT: '📸' };

  const formatTime = (dt) => {
    try {
      return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return dt; }
  };

  if (loading && !stats) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16 }}>
        <div className="spinner" style={{ width: 24, height: 24 }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Synchronizing dashboard...</p>
      </div>
    );
  }

  const s = stats || EMPTY_STATS;

  return (
    <div className="page-container reveal-up">
      {/* Ambient glows */}
      <div className="glow-orb glow-orange" style={{ top: '20%', right: '10%', opacity: 0.15 }} />
      <div className="glow-orb glow-green" style={{ bottom: '10%', left: '20%', opacity: 0.15 }} />

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title text-gradient-orange">OVERVIEW RATINGS</h1>
          <p className="page-subtitle">LOGGED PORTAL NODE FOR {user?.username?.toUpperCase() || 'AGENT'} // NO WARNING FLAGS LOADED</p>
        </div>
        <button 
          className="cta-btn cta-btn-secondary" 
          onClick={fetchStats}
          style={{ padding: '10px 20px', borderRadius: 'var(--radius-sm)' }}
        >
          <span className="cta-btn-inner">
            <span className="cta-btn-text-wrapper" style={{ height: 16 }}>
              <span className="cta-btn-text" style={{ fontSize: 11 }}>SYNC TELEMETRY</span>
              <span className="cta-btn-text-hover" style={{ fontSize: 11 }}>SYNC TELEMETRY</span>
            </span>
          </span>
        </button>
      </div>

      {/* Stat Cards Row */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <StatCard
          icon="🔍" label="Telemetry Scans" value={s.total_scans}
          subtext="Total processed scans"
          colorClass="text-gradient"
          borderGlow="rgba(255,255,255,0.25)"
        />
        <StatCard
          icon="⚠️" label="Threats Confirmed" value={s.total_threats}
          subtext={`${s.threats_percentage}% alert rating`}
          colorClass="text-gradient-orange"
          borderGlow="var(--accent-orange)"
        />
        <StatCard
          icon="📊" label="Mean Risk Score" value={`${s.avg_risk}%`}
          subtext="Aggregate risk evaluation"
          colorClass="text-gradient-orange"
          borderGlow="var(--accent-orange)"
        />
        <StatCard
          icon="🛡️" label="Low Risk Clearances" value={s.risk_distribution?.low || 0}
          subtext="No alerts resolved"
          colorClass="text-gradient-green"
          borderGlow="var(--accent-green)"
        />
      </div>

      {/* Gmail Inbox Intelligence Scanner */}
      <div className="glass-card" style={{ padding: 24, margin: '24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              📧 GMAIL INBOX IMPORT VERIFIER
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Scan incoming mailbox files using the NLP heuristic classification engine
            </div>
          </div>
          <button
            onClick={handleGmailSync}
            disabled={syncingGmail}
            className="cta-btn cta-btn-secondary"
            style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)' }}
          >
            <span className="cta-btn-inner">
              <span className="cta-btn-text-wrapper" style={{ height: 16 }}>
                <span className="cta-btn-text" style={{ fontSize: 11 }}>{syncingGmail ? 'SCANNING FEED...' : 'SYNC GMAIL FEED'}</span>
                <span className="cta-btn-text-hover" style={{ fontSize: 11 }}>{syncingGmail ? 'SCANNING FEED...' : 'SYNC GMAIL FEED'}</span>
              </span>
            </span>
          </button>
        </div>

        {gmailMessage && (
          <div className="slide-up-item" style={{
            padding: '12px 16px',
            background: gmailMessage.includes('failed') ? 'rgba(239,68,68,0.06)' : 'rgba(62,182,73,0.06)',
            border: `1px solid ${gmailMessage.includes('failed') ? 'rgba(239,68,68,0.2)' : 'rgba(62,182,73,0.2)'}`,
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            color: gmailMessage.includes('failed') ? '#F87171' : '#3EB649',
            marginBottom: 16
          }}>
            {gmailMessage}
          </div>
        )}

        {gmailEmails.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {gmailEmails.map(mail => (
              <div key={mail.id} className="slide-up-item" style={{
                padding: 16,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ flex: 1, minWidth: 0, marginRight: 16 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--accent-orange)', letterSpacing: '0.04em' }}>FROM: {mail.sender}</span>
                  </div>
                  <strong style={{ fontSize: 13, display: 'block', color: 'var(--text-primary)', marginBottom: 4 }}>
                    {mail.subject}
                  </strong>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {mail.body_snippet}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                  <RiskBadge level={mail.risk_level} />
                  <span className="mono-display" style={{ fontSize: 10, color: 'var(--text-muted)' }}>Threat Score: {mail.risk_score}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '24px 0', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: 12 }}>
            No emails synced. Connect your credentials in Settings or click Sync to fetch simulated logs.
          </div>
        )}
      </div>

      {/* Main split grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
        {/* Global Map Terminal Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-card" style={{ padding: 24, flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  GLOBAL ATTACK TELEMETRY RADAR
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase' }}>
                  Simulated active cyber vectors and origins
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 800, color: 'var(--accent-orange)', letterSpacing: '0.05em' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-orange)', animation: 'pulseGlow 1.5s infinite' }} />
                LIVE RADAR STATE
              </div>
            </div>
            <GlobalMap height={320} />
          </div>
        </div>

        {/* Right column: Risk logs and distributions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Risk distribution bars */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20 }}>
              Risk Level Metrics
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Critical Alert', value: s.risk_distribution?.critical || 0, color: '#EF4444', total: s.total_scans },
                { label: 'High Alert', value: s.risk_distribution?.high || 0, color: '#FF5A1F', total: s.total_scans },
                { label: 'Medium Alert', value: s.risk_distribution?.medium || 0, color: '#FBBF24', total: s.total_scans },
                { label: 'Low Alert / Safe', value: s.risk_distribution?.low || 0, color: '#3EB649', total: s.total_scans },
              ].map(item => {
                const pct = s.total_scans > 0 ? Math.round((item.value / s.total_scans) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color }} />
                        {item.label}
                      </span>
                      <span style={{ color: item.color, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
                        {item.value} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({pct}%)</span>
                      </span>
                    </div>
                    <div style={{ height: 4, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: item.color,
                        transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: `0 0 10px ${item.color}60`,
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="divider" style={{ margin: '20px 0' }} />

            {/* Scan distributions */}
            <div style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
              Channel breakdown
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { label: 'Text Scan', value: s.types_distribution?.text || 0, icon: '📝', color: 'var(--text-primary)' },
                { label: 'URL Scan', value: s.types_distribution?.url || 0, icon: '🔗', color: 'var(--accent-orange)' },
                { label: 'Image Scan', value: s.types_distribution?.screenshot || 0, icon: '📸', color: 'var(--accent-green)' },
              ].map(t => (
                <div key={t.label} style={{
                  flex: 1, padding: '14px 10px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 16, marginBottom: 6 }}>{t.icon}</div>
                  <div className="mono-display" style={{ fontSize: 18, fontWeight: 900, color: t.color }}>{t.value}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, marginTop: 2 }}>{t.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Row: Chart + Recents */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* 7-Day Activity */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>7-Day Scanned Activity</div>
            <div style={{ display: 'flex', gap: 12, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-orange)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Scans</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(239,68,68,0.5)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Threats</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 100, paddingBottom: 16 }}>
            {s.chart_data && s.chart_data.length > 0 ? s.chart_data.map((d, i) => {
              const maxScans = Math.max(...s.chart_data.map(x => x.scans), 1);
              const scanH = (d.scans / maxScans) * 80;
              const threatH = d.scans > 0 ? (d.threats / d.scans) * scanH : 0;
              return (
                <div key={i} title={`${d.date}: ${d.scans} scans, ${d.threats} threats`}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ position: 'relative', width: '100%', height: scanH, display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{
                      width: '100%', height: '100%',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--border-subtle)',
                    }} />
                    {d.threats > 0 && (
                      <div style={{
                        position: 'absolute', bottom: 0, width: '100%',
                        height: threatH,
                        background: 'rgba(239, 68, 68, 0.45)',
                        borderTop: '1px solid #EF4444',
                      }} />
                    )}
                  </div>
                  <div className="mono-display" style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {d.date.split(' ')[1]}
                  </div>
                </div>
              );
            }) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13, borderBottom: '1px dashed var(--border-subtle)' }}>
                No telemetry data for the past 7 days.
              </div>
            )}
          </div>
        </div>

        {/* Recent logs */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20 }}>
            Recent Scan Terminal Records
          </div>
          {s.recent_scans && s.recent_scans.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 180, overflowY: 'auto' }}>
              {s.recent_scans.map((scan, i) => (
                <div key={scan.id || i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'all 0.3s',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, flexShrink: 0,
                  }}>{typeIcons[scan.scan_type]}</div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {scan.input_content}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase', fontWeight: 700 }}>
                      {scan.scan_type} // {formatTime(scan.created_at)}
                    </div>
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    <RiskBadge level={scan.risk_level} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: 13 }}>
              No recent scans available.<br/><span style={{ fontSize: 11, opacity: 0.7 }}>Try using the Text or URL scanners.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
