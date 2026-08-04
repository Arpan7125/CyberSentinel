import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../../services/api';
import { useSocket } from '../../../hooks/useSocket';
import { Users, CreditCard, ShieldAlert, Activity, ArrowRight, Bot, Globe, Shield, Radio, Sparkles } from 'lucide-react';

export default function DashboardModule() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveFeed, setLiveFeed] = useState([]);

  const fetchStats = useCallback(() => {
    adminService.stats()
      .then(data => setStats(data))
      .catch(err => console.error("Admin stats load error:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Public sanitized live feed (see backend/api/signals.py) — every new scan across the
  // platform triggers this, so we both show it directly and use it to refresh the totals above.
  const { connected: feedLive } = useSocket('/ws/threat-feed/', {
    enabled: true,
    onMessage: (event) => {
      setLiveFeed((prev) => [event, ...prev].slice(0, 8));
      fetchStats();
    },
  });

  const totalUsers = stats?.stats?.total_users || 0;
  const totalScans = stats?.stats?.total_scans || 0;
  const totalThreats = stats?.stats?.total_threats || 0;
  const activeSubscribers = stats?.stats?.active_subscribers || 0;
  const recentScans = stats?.recent_scans || [];

  return (
    <div style={{ padding: '32px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0', fontWeight: 700, color: 'var(--text-primary)', fontSize: 24 }}>Operations Overview</h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Real-time platform metrics, threat distribution, and live node diagnostics.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: feedLive ? 'rgba(50,215,75,0.1)' : 'rgba(142,142,147,0.1)', padding: '8px 16px', borderRadius: 20, border: `1px solid ${feedLive ? 'rgba(50,215,75,0.2)' : 'rgba(142,142,147,0.2)'}`, fontSize: 13, color: feedLive ? '#32D74B' : 'var(--text-muted)', fontWeight: 600 }}>
          <Radio size={14} className={feedLive ? 'pulse-icon' : ''} /> {feedLive ? 'Live Engine Connected' : 'Reconnecting…'}
        </div>
      </div>

      {/* Metric Cards with Hover Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
        
        {/* Total Users */}
        <div 
          className="admin-hover-card"
          title="Hover Detail: Total registered accounts across Visitor, Customer, and Admin roles."
          style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 12, border: '1px solid var(--border-subtle)', position: 'relative', transition: 'all 0.2s', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>Registered Users</div>
            <Users color="#32D74B" size={20} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>{loading ? '...' : totalUsers}</div>
          <div style={{ marginTop: 10, color: '#32D74B', fontSize: 13, fontWeight: 600 }}>Active user base enrolled</div>
        </div>

        {/* Total Scans */}
        <div 
          className="admin-hover-card"
          title="Hover Detail: Combined count of email, SMS, URL, and screenshot scans processed."
          style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 12, border: '1px solid var(--border-subtle)', position: 'relative', transition: 'all 0.2s', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>Total Security Scans</div>
            <Activity color="#AF52DE" size={20} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>{loading ? '...' : totalScans}</div>
          <div style={{ marginTop: 10, color: '#AF52DE', fontSize: 13, fontWeight: 600 }}>Real-time ML Classifier</div>
        </div>

        {/* Blocked Threats */}
        <div 
          className="admin-hover-card"
          title="Hover Detail: Malicious URLs, phishing messages, and dangerous screenshots intercepted."
          style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 12, border: '1px solid var(--border-subtle)', position: 'relative', transition: 'all 0.2s', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>Threats Intercepted</div>
            <ShieldAlert color="#FF453A" size={20} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#FF453A' }}>{loading ? '...' : totalThreats}</div>
          <div style={{ marginTop: 10, color: '#FF453A', fontSize: 13, fontWeight: 600 }}>Medium / High / Critical</div>
        </div>

        {/* Active Subscribers */}
        <div 
          className="admin-hover-card"
          title="Hover Detail: Active email newsletter and security alert broadcast subscribers."
          style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 12, border: '1px solid var(--border-subtle)', position: 'relative', transition: 'all 0.2s', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>Alert Subscribers</div>
            <Bot color="#FF9F0A" size={20} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>{loading ? '...' : activeSubscribers}</div>
          <div style={{ marginTop: 10, color: '#FF9F0A', fontSize: 13, fontWeight: 600 }}>Broadcast list active</div>
        </div>
      </div>
      
      {/* Live Threat Feed — every entry is a real ScanLog event pushed the instant it's created (backend/api/signals.py) */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border-subtle)', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Live Platform Activity</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>Streaming in real time as scans happen across the platform — no simulated events.</p>
          </div>
        </div>

        <div style={{ minHeight: 180, background: 'var(--bg-primary)', borderRadius: 10, border: '1px solid var(--border-subtle)', padding: liveFeed.length ? 8 : 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {liveFeed.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 180, textAlign: 'center' }}>
              <Globe size={40} color="var(--text-muted)" style={{ marginBottom: 10, opacity: 0.6 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Waiting for activity…</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>New scans anywhere on the platform will appear here instantly.</div>
            </div>
          )}
          {liveFeed.map((evt, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, background: 'var(--bg-secondary)', animation: idx === 0 ? 'md-fade-up 0.3s ease-out' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Shield size={14} color={evt.risk_level === 'Critical' || evt.risk_level === 'High' ? '#FF453A' : '#32D74B'} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{evt.scan_type}</span>
              </div>
              <span style={{
                padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                background: evt.risk_level === 'Critical' ? 'rgba(255,69,58,0.15)' : evt.risk_level === 'High' ? 'rgba(255,159,10,0.15)' : 'rgba(50,215,75,0.15)',
                color: evt.risk_level === 'Critical' ? '#FF453A' : evt.risk_level === 'High' ? '#FF9F0A' : '#32D74B'
              }}>{evt.risk_level} · {evt.risk_score}%</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{new Date(evt.created_at).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Scan Table */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border-subtle)', padding: 24 }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700 }}>Recent Scans Feed</h3>
        <table style={{ width: '100%', fontSize: 13, textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              <th style={{ padding: 12 }}>Time</th>
              <th style={{ padding: 12 }}>User</th>
              <th style={{ padding: 12 }}>Scan Type</th>
              <th style={{ padding: 12 }}>Risk Level</th>
              <th style={{ padding: 12 }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {recentScans.slice(0, 5).map((scan, idx) => (
              <tr 
                key={idx} 
                title={`Hover Detail: Input Content: ${scan.input_content}`}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: 12, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{scan.created_at}</td>
                <td style={{ padding: 12, fontWeight: 600 }}>{scan.user__username || 'Anonymous'}</td>
                <td style={{ padding: 12 }}>{scan.scan_type}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ 
                    padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                    background: scan.risk_level === 'Critical' ? 'rgba(255,69,58,0.15)' : scan.risk_level === 'High' ? 'rgba(255,159,10,0.15)' : 'rgba(50,215,75,0.15)',
                    color: scan.risk_level === 'Critical' ? '#FF453A' : scan.risk_level === 'High' ? '#FF9F0A' : '#32D74B'
                  }}>
                    {scan.risk_level}
                  </span>
                </td>
                <td style={{ padding: 12, fontWeight: 700 }}>{scan.risk_score}%</td>
              </tr>
            ))}
            {recentScans.length === 0 && (
              <tr><td colSpan="5" style={{ padding: 16, color: 'var(--text-muted)' }}>No scan logs available.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

