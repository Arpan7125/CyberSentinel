import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { dashboardService } from '../../services/api';
import TimelineComponent from '../../components/ui/Timeline';
import ThreatMap from '../../components/ui/ThreatMap';
import WelcomeGuide from '../../components/ui/WelcomeGuide';
import GuidedTour from '../../components/ui/GuidedTour';
import { Shield, ShieldAlert, Activity, Mail, Lock, Flag, Settings, ExternalLink, Bot, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const TOUR_STEPS = [
    { targetId: 'tour-health-score', title: 'Posture Score', content: 'This score gives you a quick overview of your overall security health across all connected accounts.' },
    { targetId: 'tour-threat-map', title: 'Live Threat Intel', content: 'Watch live simulations of global cyber threats being blocked in real-time by the Sentinel AI.' },
    { targetId: 'tour-ai-recs', title: 'AI Recommendations', content: 'The system will automatically suggest critical security actions here if any vulnerabilities are found.' },
    { targetId: 'tour-email-scan', title: 'Quick Scanners', content: 'Use this button to quickly scan suspicious emails directly from your dashboard.' }
  ];

  useEffect(() => {
    fetchStats();
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
  else if (avgRisk > 25) { riskLevel = 'Medium'; riskColor = '#FF9500'; }
  
  const connectedAccounts = [
    { provider: 'Google Workspace', email: user?.email || 'user@example.com', status: 'Secure' },
  ];

  const aiRecommendations = [
    { title: 'Review Suspicious Links', desc: `Our AI flagged ${stats?.total_threats || 0} threats recently.`, icon: <ShieldAlert size={18} />, action: '/dashboard/url-scanner', urgent: true },
    { title: 'Update Authentication', desc: 'Your current password is 6 months old. Consider updating it.', icon: <Lock size={18} />, action: '/dashboard/security', urgent: false }
  ];

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
          
          <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Community Reports</span>
              <Flag size={18} color="var(--text-muted)" />
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginTop: 12 }}>{loading ? '--' : '0'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Active contributions</div>
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
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>AI Recommendations</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {aiRecommendations.map((rec, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, border: `1px solid ${rec.urgent ? 'rgba(239,68,68,0.2)' : 'var(--border-subtle)'}` }}>
                <div style={{ color: rec.urgent ? 'var(--accent-red)' : 'var(--accent)' }}>{rec.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{rec.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{rec.desc}</div>
                </div>
                <button className="btn-pub btn-pub-ghost btn-pub-sm" onClick={() => navigate(rec.action)}>Review</button>
              </div>
            ))}
          </div>
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
            {connectedAccounts.map((acc, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 18, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>
                  {acc.provider.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{acc.provider}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{acc.email}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 12, background: acc.status === 'Secure' ? 'rgba(50,215,75,0.1)' : 'rgba(255,159,10,0.1)', color: acc.status === 'Secure' ? 'var(--accent-green)' : '#FF9500', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {acc.status === 'Secure' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
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

      {/* Bottom Section: Activity Timeline */}
      <div className="glass-card md-fade-up md-delay-200" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Activity size={20} color="var(--text-primary)" />
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Security Event Timeline</h3>
        </div>
        <TimelineComponent />
      </div>

    </div>
  );
}
