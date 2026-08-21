import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../../services/api';
import { useSocket } from '../../../hooks/useSocket';
import { Users, ShieldAlert, Activity, Bot, Globe, Shield, Link2, Mail, Image, ArrowRight } from 'lucide-react';

const KPI_META = [
  { key: 'total_users', label: 'Registered users', sub: 'Active user base enrolled', icon: <Users size={18} />, color: 'var(--accent-green)' },
  { key: 'total_scans', label: 'Total security scans', sub: 'Real-time ML classifier', icon: <Activity size={18} />, color: 'var(--accent-violet)' },
  { key: 'total_threats', label: 'Threats intercepted', sub: 'Medium / High / Critical', icon: <ShieldAlert size={18} />, color: 'var(--accent-red)' },
  { key: 'active_subscribers', label: 'Alert subscribers', sub: 'Broadcast list active', icon: <Bot size={18} />, color: 'var(--accent-orange)' },
];

const RISK_COLOR = { Critical: 'var(--accent-red)', High: 'var(--accent-orange)' };
const riskColor = (level) => RISK_COLOR[level] || 'var(--accent-green)';

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

  const totalScans = stats?.stats?.total_scans || 0;
  const recentScans = stats?.recent_scans || [];
  const hasActivity = totalScans > 0 || recentScans.length > 0;

  return (
    <div style={{ padding: '32px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0', fontWeight: 700, color: 'var(--text-primary)', fontSize: 24 }}>Operations Overview</h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Real-time platform metrics, threat distribution, and live node diagnostics.</div>
        </div>
        <span className="soc-empty-status">
          <span className={`kpi-live-dot ${feedLive ? '' : 'off'}`} />
          {feedLive ? 'Live engine connected' : 'Reconnecting…'}
        </span>
      </div>

      {/* KPI cards — themed via the shared .stat-card system, not hardcoded hex,
          so these read correctly in every theme instead of only the dark one. */}
      <div className="stat-card-grid">
        {KPI_META.map((kpi) => (
          <div key={kpi.key} className="stat-card hover-lift">
            <div className="stat-card-header">
              <span className="stat-card-label">{kpi.label}</span>
              <span className="kpi-chip" style={{ background: `color-mix(in oklab, ${kpi.color} 12%, transparent)`, color: kpi.color }}>
                {kpi.icon}
              </span>
            </div>
            <div className="stat-card-value" style={{ color: kpi.color }}>
              {loading ? '—' : (stats?.stats?.[kpi.key] || 0).toLocaleString()}
            </div>
            <div className="stat-card-change" style={{ color: 'var(--text-secondary)' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {!loading && !hasActivity ? (
        /* Nothing has run yet on this deployment. Designed to read as "ready and
           waiting," never fabricating scans or users that don't exist. */
        <div className="glass-card soc-empty">
          <span className="soc-empty-badge" aria-hidden="true"><Activity size={30} /></span>
          <h3>Operations Overview is live and standing by</h3>
          <p>
            No scans or subscribers exist on this deployment yet, so there's nothing to chart —
            this dashboard never invents activity it hasn't seen. Every metric above updates the
            instant real activity happens.
          </p>
          <span className="soc-empty-status">
            <span className={`kpi-live-dot ${feedLive ? '' : 'off'}`} />
            {feedLive ? 'Listening for events' : 'Reconnecting to feed…'}
          </span>
          <div className="soc-empty-hints">
            <span className="soc-empty-hint"><Link2 size={15} /> URL &amp; file scans</span>
            <span className="soc-empty-hint"><Mail size={15} /> Email &amp; SMS analysis</span>
            <span className="soc-empty-hint"><Image size={15} /> Screenshot OCR</span>
            <span className="soc-empty-hint"><Users size={15} /> User signups</span>
          </div>
          <Link to="/dashboard/url-scanner" className="btn-pub btn-pub-primary" style={{ marginTop: 26, textDecoration: 'none' }}>
            Run the first scan <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <>
          {/* Live Threat Feed — every entry is a real ScanLog event pushed the instant it's created */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Live platform activity</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>Streaming in real time as scans happen across the platform — no simulated events.</p>
            </div>

            <div style={{ minHeight: 140, background: 'var(--bg-primary)', borderRadius: 10, border: '1px solid var(--border-subtle)', padding: liveFeed.length ? 8 : 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {liveFeed.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 140, textAlign: 'center' }}>
                  <Globe size={32} color="var(--text-muted)" style={{ marginBottom: 10, opacity: 0.6 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Waiting for new activity…</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>New scans anywhere on the platform will appear here instantly.</div>
                </div>
              )}
              {liveFeed.map((evt, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, background: 'var(--bg-secondary)', animation: idx === 0 ? 'md-fade-up 0.3s ease-out' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Shield size={14} color={riskColor(evt.risk_level)} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{evt.scan_type}</span>
                  </div>
                  <span style={{
                    padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                    background: `color-mix(in oklab, ${riskColor(evt.risk_level)} 15%, transparent)`,
                    color: riskColor(evt.risk_level),
                  }}>{evt.risk_level} · {evt.risk_score}%</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{new Date(evt.created_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent scans table */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700 }}>Recent scans</h3>
            <div className="data-table-wrap" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>User</th>
                    <th>Scan type</th>
                    <th>Risk level</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {recentScans.slice(0, 5).map((scan, idx) => (
                    <tr key={idx} title={`Input: ${scan.input_content}`}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{scan.created_at}</td>
                      <td style={{ fontWeight: 600 }}>{scan.user__username || 'Anonymous'}</td>
                      <td>{scan.scan_type}</td>
                      <td>
                        <span style={{
                          padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                          background: `color-mix(in oklab, ${riskColor(scan.risk_level)} 15%, transparent)`,
                          color: riskColor(scan.risk_level),
                        }}>{scan.risk_level}</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{scan.risk_score}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
