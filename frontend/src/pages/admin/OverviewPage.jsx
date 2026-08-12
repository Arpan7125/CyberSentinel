import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import TimelineComponent from '../../components/ui/Timeline';
import GuidedTour from '../../components/ui/GuidedTour';
import { useAuth } from '../../AuthContext';
import { Users, Zap, ShieldAlert, Ticket, Radio } from 'lucide-react';

const SCAN_TYPE_LABELS = {
  TEXT: 'Text messages',
  URL: 'Links',
  FILE: 'Files',
  SCREENSHOT: 'Screenshots',
  PHONE: 'Phone numbers',
};

export default function OverviewPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTour, setShowTour] = useState(false);

  const ADMIN_TOUR_STEPS = [
    { targetId: 'admin-kpis', title: 'SOC Overview', content: 'These KPIs give you a high-level view of platform health, total users, and blocked threats.' },
    { targetId: 'admin-sys-stats', title: 'System Diagnostics', content: 'Monitor system resources, API limits, and bandwidth directly from this pane.' },
    { targetId: 'admin-recent-events', title: 'Real-time Event Log', content: 'All security scans and actions across the network are streamed here in real-time.' }
  ];

  useEffect(() => {
    fetchStats();
    if (user?.is_new_user && !localStorage.getItem('cs_hasSeenAdminTour_Session')) {
      setShowTour(true);
    }
  }, [user]);

  // Real connection state to the live threat feed — the only "system health" signal
  // this build can honestly report, rather than fabricated per-service statuses.
  const { connected: feedLive } = useSocket('/ws/threat-feed/', { enabled: true });

  const fetchStats = async () => {
    try {
      const data = await adminService.stats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const kpis = [
    { label: 'Total Enrolled Users', value: stats?.stats?.total_users || 0, sub: 'Active portal accounts', icon: <Users size={18} /> },
    { label: 'Total Security Scans', value: stats?.stats?.total_scans || 0, sub: 'All engines combined', icon: <Zap size={18} />, color: '#AF52DE' },
    { label: 'Threats Blocked', value: stats?.stats?.total_threats || 0, sub: 'Medium/High/Critical', icon: <ShieldAlert size={18} />, color: 'var(--accent-red)' },
    { label: 'Active Subscribers', value: stats?.stats?.active_subscribers || 0, sub: 'Marketing list', icon: <Ticket size={18} />, color: '#FF9500' },
  ];

  const totalScans = stats?.stats?.total_scans || 0;
  const totalThreats = stats?.stats?.total_threats || 0;
  const adminStats = [
    { label: 'Threat Detection Ratio', value: `${totalScans ? Math.round((totalThreats / totalScans) * 100) : 0}% of scans flagged`, color: 'var(--accent)' },
    { label: 'Active Newsletter Subscribers', value: `${stats?.stats?.active_subscribers || 0} subscribers`, color: 'var(--accent)' },
    { label: 'Real-Time Engine', value: feedLive ? 'Connected' : 'Reconnecting…', color: feedLive ? 'var(--accent-green)' : 'var(--accent-orange)' }
  ];

  const scanTypeRows = Object.entries(stats?.scan_type_distribution || {})
    .filter(([, count]) => Number(count) > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {showTour && (
        <GuidedTour 
          steps={ADMIN_TOUR_STEPS} 
          onComplete={() => {
            localStorage.setItem('cs_hasSeenAdminTour_Session', 'true');
            setShowTour(false);
          }} 
        />
      )}
      {/* Header title */}
      <div className="md-fade-up">
        <h1 className="page-title" style={{ color: 'var(--accent-violet)' }}>Security Operations Center</h1>
        {/* Reports the actual socket state rather than asserting "CONNECTED" unconditionally. */}
        <p className="page-subtitle">
          Live scan activity across the platform · feed {feedLive ? 'connected' : 'reconnecting…'}
        </p>
      </div>

      {/* KPI Stats widgets */}
      <div id="admin-kpis" className="stat-card-grid md-fade-up md-delay-100">
        {kpis.map((kpi, idx) => (
          <div className="stat-card" key={idx} style={kpi.color ? { borderColor: `${kpi.color}33` } : {}}>
            <div className="stat-card-header">
              <span className="stat-card-label">{kpi.label}</span>
              <span className="stat-card-icon" style={kpi.color ? { color: kpi.color } : {}}>{kpi.icon}</span>
            </div>
            <div className="stat-card-value" style={kpi.color ? { color: kpi.color } : {}}>
              {loading ? '...' : kpi.value}
            </div>
            <div className="stat-card-change" style={{ color: 'var(--text-secondary)' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Grid: Admin stats, live SIEM feeds, activities */}
      <div className="md-fade-up md-delay-200" style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: 24 }}>
        {/* Live SIEM Log Feed */}
        <div id="admin-recent-events" className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 className="section-title">Live SOC & Agent Audit Logs</h3>
          <div className="data-table-wrap" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 140 }}>Time</th>
                  <th>Action / Event details</th>
                  <th style={{ width: 100 }}>Status / Risk</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="3" style={{ padding: 20 }}>Loading live feed...</td></tr>
                ) : (stats?.recent_scans || []).map((feed, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: '#AF52DE' }}>
                      {feed.created_at.split(' ')[1]}
                    </td>
                    <td style={{ fontSize: 13, fontWeight: 550 }}>
                      {feed.user__username ? `${feed.user__username} ran a ` : 'Anonymous ran a '}{feed.scan_type} scan
                    </td>
                    <td>
                      <span className={`badge ${feed.risk_level === 'Critical' ? 'badge-critical' : feed.risk_level === 'High' ? 'badge-high' : 'badge-low'}`}>
                        {feed.risk_level}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && (stats?.recent_scans || []).length === 0 && (
                  <tr><td colSpan="3" style={{ padding: 20 }}>No recent scan activity found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Platform Status Indicators */}
        <div id="admin-sys-stats" className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 className="section-title">Telemetry Resource Usage</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {adminStats.map((stat, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                  <span style={{ fontWeight: 650 }}>{stat.label}</span>
                </div>
                <div style={{ fontSize: 14, fontFamily: 'var(--font-mono)', fontWeight: 800, color: stat.color }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Threat heat maps & incident timelines */}
      <div className="md-fade-up md-delay-300" style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: 24 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 className="section-title" style={{ marginBottom: 16 }}>SOC Activity Timeline</h3>
          <TimelineComponent items={(stats?.recent_scans || []).slice(0, 8).map((s) => ({
            title: `${s.scan_type} scan — ${s.risk_level} risk`,
            desc: s.user__username ? `Run by ${s.user__username}` : 'Run anonymously',
            time: s.created_at,
            active: s.risk_level === 'Critical' || s.risk_level === 'High',
          }))} />
        </div>

        <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Radio size={16} className={feedLive ? 'pulse-icon' : ''} color={feedLive ? 'var(--accent-green)' : 'var(--text-muted)'} />
            Scan Type Distribution
          </h3>
          {/* Driven by whatever scan types the backend reports, so File and Phone
              scans are no longer silently dropped from this panel. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {scanTypeRows.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '16px 0', textAlign: 'center' }}>
                {loading ? 'Loading…' : 'No scans recorded yet.'}
              </div>
            )}
            {scanTypeRows.map(([type, count]) => (
              <div key={type} style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{SCAN_TYPE_LABELS[type] || type}</span>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
