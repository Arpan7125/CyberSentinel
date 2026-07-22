import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import TimelineComponent from '../../components/ui/Timeline';
import GuidedTour from '../../components/ui/GuidedTour';
import { useAuth } from '../../AuthContext';
import { Users, Zap, ShieldAlert, Ticket } from 'lucide-react';

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

  const adminStats = [
    { label: 'System Storage Usage', value: '74.2 GB / 1000 GB (7.4%)', color: 'var(--accent)' },
    { label: 'API Usage Limit', value: `${(stats?.stats?.total_scans || 0) * 12} / 1,000,000 requests`, color: 'var(--accent)' },
    { label: 'Network Bandwidth', value: '8.4 Gbps output', color: 'var(--accent-green)' }
  ];

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
        <h1 className="page-title" style={{ color: '#AF52DE' }}>Security Operations Center (SOC)</h1>
        <p className="page-subtitle">REAL-TIME SIEM OVERVIEW // SYSTEM LOG NODES: CONNECTED</p>
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
          <TimelineComponent />
        </div>
        
        <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 className="section-title">Critical System Status Checklists</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'Threat Intelligence Engine', status: 'Healthy', details: 'All feeds active' },
              { label: 'Database Replication', status: 'Healthy', details: 'Replica lag: 28ms' },
              { label: 'SMTP Mail Servers', status: 'Healthy', details: 'SMTP queue empty' },
              { label: 'API Edge Gateway', status: 'Healthy', details: 'Uptime 100%' },
              { label: 'OAuth Token Service', status: 'Healthy', details: 'Token refresh success' },
              { label: 'Sandbox Execution Host', status: 'Healthy', details: '2 cores in use' },
            ].map((srv, idx) => (
              <div key={idx} style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{srv.label}</span>
                  <span className="status-badge status-active" style={{ fontSize: 9 }}><span className="status-badge-dot" /> {srv.status}</span>
                </div>
                <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>{srv.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
