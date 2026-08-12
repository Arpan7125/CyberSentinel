import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { dashboardService, integrationsService, insightsService } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { useApiData } from '../../hooks/useApiData';
import TimelineComponent from '../../components/ui/Timeline';
import ThreatMap from '../../components/ui/ThreatMap';
import WelcomeGuide from '../../components/ui/WelcomeGuide';
import GuidedTour from '../../components/ui/GuidedTour';
import { TrendChart, forecastCaption } from '../../components/charts';
import { Shield, ShieldAlert, Activity, Mail, Lock, Settings, Bot, CheckCircle2, AlertTriangle, Info, TrendingUp } from 'lucide-react';

/** Priority → colour token and icon for the recommendation list. */
const PRIORITY_STYLES = {
  critical: { color: 'var(--sev-critical)', icon: <ShieldAlert size={18} /> },
  high: { color: 'var(--sev-high)', icon: <AlertTriangle size={18} /> },
  medium: { color: 'var(--sev-medium)', icon: <Info size={18} /> },
  low: { color: 'var(--sev-low)', icon: <Info size={18} /> },
  info: { color: 'var(--accent)', icon: <CheckCircle2 size={18} /> },
};

export default function DashboardPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState([]);

  // Live push on every new scan — see backend/api/signals.py (ScanLog post_save).
  useSocket('/ws/dashboard/', {
    token,
    enabled: !!token,
    onMessage: (liveStats) => setStats(liveStats),
  });

  // Recommendations, forecasts, and the threat probability are all derived from
  // this user's own scan history server-side.
  const {
    data: insights,
    loading: insightsLoading,
    error: insightsError,
    refetch: refetchInsights,
  } = useApiData(() => insightsService.insights(30), []);

  const TOUR_STEPS = [
    { targetId: 'tour-health-score', title: 'Posture Score', content: 'This score gives you a quick overview of your overall security health across all connected accounts.' },
    { targetId: 'tour-threat-map', title: 'Live Threat Intel', content: 'A real-time feed of scan activity across the platform, streamed over WebSocket as it happens.' },
    { targetId: 'tour-ai-recs', title: 'AI Recommendations', content: 'The system will automatically suggest critical security actions here if any vulnerabilities are found.' },
    { targetId: 'tour-email-scan', title: 'Quick Scanners', content: 'Use this button to quickly scan suspicious emails directly from your dashboard.' }
  ];

  useEffect(() => {
    fetchStats();
    integrationsService.getConnectedAccounts().then(setConnectedAccounts).catch(() => {});
    if (user?.is_new_user && !localStorage.getItem('cs_hasSeenWelcome_Session')) {
      setShowWelcome(true);
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const data = await dashboardService.stats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate Health Score (100 - avg_risk)
  const avgRisk = stats?.avg_risk || 0;
  const healthScore = Math.max(0, Math.round(100 - avgRisk));
  
  let riskLevel = 'Low';
  let riskColor = 'var(--accent-green)';
  if (avgRisk > 75) { riskLevel = 'Critical'; riskColor = 'var(--accent-red)'; }
  else if (avgRisk > 50) { riskLevel = 'High'; riskColor = 'var(--accent-orange)'; }
  else if (avgRisk > 25) { riskLevel = 'Medium'; riskColor = 'var(--accent-yellow)'; }
  
  const recommendations = insights?.recommendations || [];
  const probability = insights?.threat_probability;
  const trajectory = insights?.risk_trajectory;

  // The insights endpoint returns a scan forecast but no history array, so the
  // dashboard charts the projection alone. The full history+forecast view lives
  // on the Reports page.
  const scanForecast = insights?.forecast;

  const timelineItems = (stats?.recent_scans || []).map((scan) => ({
    title: `${scan.scan_type} scan — ${scan.risk_level} risk`,
    desc: scan.risk_level === 'Low' ? 'No significant threats detected.' : `Risk score ${scan.risk_score}%.`,
    time: new Date(scan.created_at).toLocaleString(),
    active: scan.risk_level === 'Critical' || scan.risk_level === 'High',
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      {showWelcome && (
        <WelcomeGuide onDismiss={() => {
          localStorage.setItem('cs_hasSeenWelcome_Session', 'true');
          setShowWelcome(false);
          if (!localStorage.getItem('cs_hasSeenTour_Session')) {
            setShowTour(true);
          }
        }} />
      )}
      
      {showTour && (
        <GuidedTour 
          steps={TOUR_STEPS} 
          onComplete={() => {
            localStorage.setItem('cs_hasSeenTour_Session', 'true');
            setShowTour(false);
          }} 
        />
      )}
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 28, marginBottom: 8 }}>Overview</h1>
          <p className="page-subtitle" style={{ fontSize: 14 }}>Welcome back, {user?.first_name || user?.username || 'User'}. Here is your digital security posture.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button id="tour-email-scan" className="btn-pub btn-pub-primary btn-pub-sm" onClick={() => navigate('/dashboard/email-scanner')} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mail size={16} /> Scan Email
          </button>
        </div>
      </div>

      {/* Top Section: Score & Quick Stats */}
      <div className="md-fade-up" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        
        {/* Health Score Card */}
        <div id="tour-health-score" className="glass-card" style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          <h3 style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 24, fontWeight: 700 }}>Posture Score</h3>
          
          <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border-subtle)" strokeWidth="6" />
              <circle cx="50" cy="50" r="45" fill="none" stroke={riskColor} strokeWidth="6" strokeDasharray="283" strokeDashoffset={283 - (283 * healthScore) / 100} style={{ transition: 'stroke-dashoffset 1s ease-out' }} strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{loading ? '--' : healthScore}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>/ 100</div>
            </div>
          </div>

          <div style={{ marginTop: 24, padding: '6px 12px', background: `${riskColor}1A`, border: `1px solid ${riskColor}33`, borderRadius: 16, color: riskColor, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            {riskLevel === 'Critical' || riskLevel === 'High' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
            Risk Level: {loading ? '...' : riskLevel}
          </div>
        </div>

        {/* Bottom Section: Activity & Quick Actions */}
      <div className="md-fade-up md-delay-200" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Total Scans</span>
              <Shield size={18} color="var(--text-muted)" />
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginTop: 12 }}>{loading ? '--' : stats?.total_scans || 0}</div>
              <div style={{ fontSize: 12, color: 'var(--accent-green)', marginTop: 4 }}>Across all engines</div>
            </div>
          </div>
          
          <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Threats Detected</span>
              <ShieldAlert size={18} color="var(--accent-red)" />
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-red)', marginTop: 12 }}>{loading ? '--' : stats?.total_threats || 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Identified by AI</div>
            </div>
          </div>
          
          <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Threat Ratio</span>
              <Activity size={18} color="var(--text-muted)" />
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginTop: 12 }}>{loading ? '--' : `${stats?.threats_percentage || 0}%`}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Of all inputs</div>
            </div>
          </div>
          
          {/* Replaces a tile that always read "0": a forward-looking figure the
              backend computes from this account's observed threat arrival rate. */}
          <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Threat Likelihood</span>
              <TrendingUp size={18} color="var(--text-muted)" />
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginTop: 12 }}>
                {insightsLoading ? '--' : probability?.available ? `${probability.probability}%` : 'N/A'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {probability?.available
                  ? `${probability.band} in the next ${probability.horizon_days} days`
                  : 'Needs more scan history'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: AI Recs & Connected Accounts */}
      <div className="md-fade-up md-delay-100" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        
        {/* AI Recommendations */}
        <div id="tour-ai-recs" className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Bot size={20} color="var(--accent)" />
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Security Recommendations</h3>
          </div>

          {insightsLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[0, 1].map((i) => (
                <div key={i} className="animate-pulse" style={{ height: 76, borderRadius: 8, background: 'var(--bg-tertiary)' }} />
              ))}
            </div>
          )}

          {!insightsLoading && insightsError && (
            <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-subtle)' }} role="alert">
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {insightsError.message || 'Could not load your recommendations.'}
              </p>
              <button className="btn-pub btn-pub-ghost btn-pub-sm" style={{ marginTop: 12 }} onClick={refetchInsights}>
                Retry
              </button>
            </div>
          )}

          {/* Each item names the observation that triggered it, so the advice is
              traceable to this account's own history rather than generic. */}
          {!insightsLoading && !insightsError && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recommendations.map((rec, idx) => {
                const style = PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.info;
                return (
                  <div key={`${rec.title}-${idx}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-subtle)', borderLeft: `3px solid ${style.color}` }}>
                    <div style={{ color: style.color, marginTop: 2 }} aria-hidden="true">{style.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{rec.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{rec.detail}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Based on: {rec.basis}</div>
                    </div>
                    {rec.action && (
                      <button className="btn-pub btn-pub-ghost btn-pub-sm" style={{ flexShrink: 0 }} onClick={() => navigate(rec.action)}>
                        Open
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {trajectory?.available && (
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 16 }}>
              Exposure score {trajectory.exposure_score} and {trajectory.direction} — {trajectory.method.toLowerCase()}, {trajectory.sample_size} scans.
            </p>
          )}
        </div>

        {/* Threat Map */}
        <div id="tour-threat-map">
          <ThreatMap />
        </div>

        {/* Connected Accounts */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={20} color="var(--accent-purple)" />
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>Monitored Accounts</h3>
            </div>
            <Link to="/dashboard/account-security" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              Manage <Settings size={12} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {connectedAccounts.length === 0 && (
              <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                No accounts connected yet.
              </div>
            )}
            {connectedAccounts.map((acc) => (
              <div key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 18, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>
                  {acc.provider_name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{acc.provider_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{acc.email || 'No account email'}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 12, background: acc.status === 'connected' ? 'rgba(50,215,75,0.1)' : 'rgba(255,159,10,0.1)', color: acc.status === 'connected' ? 'var(--accent-green)' : '#FF9500', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'capitalize' }}>
                  {acc.status === 'connected' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                  {acc.status}
                </div>
              </div>
            ))}

            <button className="btn-pub btn-pub-ghost" style={{ width: '100%', marginTop: 8, fontSize: 13 }} onClick={() => navigate('/dashboard/account-security')}>
              Connect Additional Account
            </button>
          </div>
        </div>
      </div>

      {/* Forward projection of this account's own scan volume */}
      {scanForecast?.available && (
        <div className="md-fade-up md-delay-100">
          <TrendChart
            title="Your projected scan activity"
            subtitle={`Next ${scanForecast.horizon_days} days, extrapolated from ${scanForecast.basis_days} days of your history.`}
            labels={scanForecast.points.map((p) => p.date)}
            series={[{
              key: 'projected',
              label: 'Projected scans/day',
              values: scanForecast.points.map((p) => p.predicted),
              color: 'var(--chart-series-1)',
            }]}
            band={{
              lower: scanForecast.points.map((p) => p.lower),
              upper: scanForecast.points.map((p) => p.upper),
            }}
            footnote={forecastCaption(scanForecast)}
            height={220}
          />
        </div>
      )}

      {/* Bottom Section: Activity Timeline */}
      <div className="glass-card md-fade-up md-delay-200" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Activity size={20} color="var(--text-primary)" />
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Security Event Timeline</h3>
        </div>
        <TimelineComponent items={timelineItems} />
      </div>

    </div>
  );
}
