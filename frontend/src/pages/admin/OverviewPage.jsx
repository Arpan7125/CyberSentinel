/* NOT currently routed. The live admin dashboard is rendered by
   components/admin/views/DashboardModule.jsx (see AdminWorkspaceLayout's
   WorkspaceRouter) — that is where the same design pass was actually applied.
   This file is kept in sync stylistically in case it gets wired in later, but
   editing it alone has no effect on the running app. */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import TimelineComponent from '../../components/ui/Timeline';
import GuidedTour from '../../components/ui/GuidedTour';
import { useAuth } from '../../AuthContext';
import { Users, Zap, ShieldAlert, Ticket, Radio, Activity, Link2, Mail, Image, ArrowRight } from 'lucide-react';

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
    { targetId: 'admin-main', title: 'Live activity', content: 'Every security scan across the platform streams here in real time. It fills in as soon as scans run.' },
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
    { label: 'Enrolled users', value: stats?.stats?.total_users || 0, sub: 'Portal accounts', icon: <Users size={17} />, color: 'var(--accent)' },
    { label: 'Security scans', value: stats?.stats?.total_scans || 0, sub: 'All engines', icon: <Zap size={17} />, color: 'var(--accent-violet)' },
    { label: 'Threats blocked', value: stats?.stats?.total_threats || 0, sub: 'Medium / High / Critical', icon: <ShieldAlert size={17} />, color: 'var(--accent-red)' },
    { label: 'Subscribers', value: stats?.stats?.active_subscribers || 0, sub: 'Newsletter list', icon: <Ticket size={17} />, color: 'var(--accent-orange)' },
  ];

  const recentScans = stats?.recent_scans || [];
  const totalScans = stats?.stats?.total_scans || 0;
  const totalThreats = stats?.stats?.total_threats || 0;
  const hasActivity = totalScans > 0 || recentScans.length > 0;

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

      {/* Header */}
      <div className="md-fade-up" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title" style={{ color: 'var(--accent-violet)' }}>Security Operations Center</h1>
          <p className="page-subtitle">Live scan activity across the platform.</p>
        </div>
        <span className="soc-empty-status" style={{ marginLeft: 'auto' }}>
          <span className={`kpi-live-dot ${feedLive ? '' : 'off'}`} />
          {feedLive ? 'Real-time feed connected' : 'Reconnecting…'}
        </span>
      </div>

      {/* KPI cards */}
      <div id="admin-kpis" className="stat-card-grid md-fade-up md-delay-100">
        {kpis.map((kpi, idx) => (
          <div className="stat-card hover-lift" key={idx}>
            <div className="stat-card-header">
              <span className="stat-card-label">{kpi.label}</span>
              <span className="kpi-chip" style={{ background: `color-mix(in oklab, ${kpi.color} 12%, transparent)`, color: kpi.color }}>{kpi.icon}</span>
            </div>
            <div className="stat-card-value" style={{ color: kpi.color }}>
              {loading ? '—' : kpi.value.toLocaleString()}
            </div>
            <div className="stat-card-change" style={{ color: 'var(--text-secondary)' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Main region: designed empty state when there's no activity yet,
          full dashboard once scans start coming in. */}
      <div id="admin-main">
        {!loading && !hasActivity ? (
          <div className="glass-card md-fade-up md-delay-200 soc-empty">
            <span className="soc-empty-badge" aria-hidden="true"><Activity size={30} /></span>
            <h3>Your SOC is live and standing by</h3>
            <p>
              No scans have run yet, so there's nothing to report — and this platform never invents
              activity it hasn't seen. The moment a user scans a link, email, message, file or number,
              it streams in here in real time with its risk verdict.
            </p>
            <span className="soc-empty-status">
              <span className={`kpi-live-dot ${feedLive ? '' : 'off'}`} />
              {feedLive ? 'Listening for events' : 'Reconnecting to feed…'}
            </span>
            <div className="soc-empty-hints">
              <span className="soc-empty-hint"><Link2 size={15} /> URL &amp; file scans</span>
              <span className="soc-empty-hint"><Mail size={15} /> Email &amp; SMS analysis</span>
              <span className="soc-empty-hint"><Image size={15} /> Screenshot OCR</span>
              <span className="soc-empty-hint"><Users size={15} /> User activity</span>
            </div>
            <Link to="/dashboard/url-scanner" className="btn-pub btn-pub-primary" style={{ marginTop: 26, textDecoration: 'none' }}>
              Run the first scan <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Live log + telemetry */}
            <div className="md-fade-up md-delay-200" style={{ display: 'grid', gridTemplateColumns: '2fr 1.1fr', gap: 24 }}>
              <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 className="section-title">Live audit log</h3>
                <div className="data-table-wrap" style={{ border: 'none' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: 120 }}>Time</th>
                        <th>Event</th>
                        <th style={{ width: 96 }}>Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="3" style={{ padding: 20, color: 'var(--text-muted)' }}>Loading live feed…</td></tr>
                      ) : recentScans.map((feed, i) => (
                        <tr key={i}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-muted)' }}>
                            {(feed.created_at || '').split(' ')[1] || feed.created_at}
                          </td>
                          <td style={{ fontSize: 13, fontWeight: 550 }}>
                            <strong style={{ color: 'var(--text-primary)' }}>{feed.user__username || 'Anonymous'}</strong> ran a {feed.scan_type} scan
                          </td>
                          <td>
                            <span className={`badge ${feed.risk_level === 'Critical' ? 'badge-critical' : feed.risk_level === 'High' ? 'badge-high' : 'badge-low'}`}>
                              {feed.risk_level}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
                <h3 className="section-title">At a glance</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 650, color: 'var(--text-secondary)' }}>Threat detection ratio</div>
                    <div style={{ fontSize: 15, fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent)', marginTop: 6 }}>
                      {totalScans ? Math.round((totalThreats / totalScans) * 100) : 0}% of scans flagged
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 650, color: 'var(--text-secondary)' }}>Newsletter subscribers</div>
                    <div style={{ fontSize: 15, fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent)', marginTop: 6 }}>
                      {(stats?.stats?.active_subscribers || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 650, color: 'var(--text-secondary)' }}>Real-time engine</div>
                    <div style={{ fontSize: 15, fontFamily: 'var(--font-mono)', fontWeight: 800, color: feedLive ? 'var(--accent-green)' : 'var(--accent-orange)', marginTop: 6 }}>
                      {feedLive ? 'Connected' : 'Reconnecting…'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline + distribution */}
            <div className="md-fade-up md-delay-300" style={{ display: 'grid', gridTemplateColumns: '1.1fr 2fr', gap: 24 }}>
              <div className="glass-card" style={{ padding: 24 }}>
                <h3 className="section-title" style={{ marginBottom: 16 }}>Activity timeline</h3>
                <TimelineComponent items={recentScans.slice(0, 8).map((s) => ({
                  title: `${s.scan_type} scan — ${s.risk_level} risk`,
                  desc: s.user__username ? `Run by ${s.user__username}` : 'Run anonymously',
                  time: s.created_at,
                  active: s.risk_level === 'Critical' || s.risk_level === 'High',
                }))} />
              </div>

              <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Radio size={16} className={feedLive ? 'pulse-icon' : ''} color={feedLive ? 'var(--accent-green)' : 'var(--text-muted)'} />
                  Scan type distribution
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {scanTypeRows.length === 0 && (
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '16px 0', textAlign: 'center' }}>
                      {loading ? 'Loading…' : 'No scans recorded yet.'}
                    </div>
                  )}
                  {scanTypeRows.map(([type, count]) => {
                    const max = Math.max(...scanTypeRows.map(([, c]) => Number(c)), 1);
                    const pct = Math.max((Number(count) / max) * 100, 4);
                    return (
                      <div key={type}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{SCAN_TYPE_LABELS[type] || type}</span>
                          <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{count}</span>
                        </div>
                        <div style={{ height: 7, borderRadius: 999, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: 'var(--accent)' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
