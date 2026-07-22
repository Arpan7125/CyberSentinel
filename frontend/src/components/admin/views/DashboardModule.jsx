import React, { useState, useEffect } from 'react';
import { adminService } from '../../../services/api';
import { Users, CreditCard, ShieldAlert, Activity, ArrowRight, Bot, Globe, Shield, Radio, Sparkles } from 'lucide-react';

export default function DashboardModule() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    adminService.stats()
      .then(data => setStats(data))
      .catch(err => console.error("Admin stats load error:", err))
      .finally(() => setLoading(false));
  }, []);

  const totalUsers = stats?.stats?.total_users || 0;
  const totalScans = stats?.stats?.total_scans || 0;
  const totalThreats = stats?.stats?.total_threats || 0;
  const activeSubscribers = stats?.stats?.active_subscribers || 0;
  const recentScans = stats?.recent_scans || [];

  const threatNodes = [
    { id: 'node-us', name: 'US-East SIEM Node', ip: '192.168.1.104', lat: 38.89, lng: -77.03, status: 'Active', threats: 14 },
    { id: 'node-eu', name: 'EU-Central Edge Node', ip: '10.0.4.12', lat: 50.11, lng: 8.68, status: 'Active', threats: 8 },
    { id: 'node-ap', name: 'APAC Threat Scanner', ip: '172.16.0.42', lat: 1.35, lng: 103.81, status: 'Optimal', threats: 3 },
  ];

  return (
    <div style={{ padding: '32px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0', fontWeight: 700, color: 'var(--text-primary)', fontSize: 24 }}>Operations Overview</h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Real-time platform metrics, threat distribution, and live node diagnostics.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(50,215,75,0.1)', padding: '8px 16px', borderRadius: 20, border: '1px solid rgba(50,215,75,0.2)', fontSize: 13, color: '#32D74B', fontWeight: 600 }}>
          <Radio size={14} className="pulse-icon" /> Live Engine Connected
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
      
      {/* Live Interactive Threat Intelligence Map */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border-subtle)', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Global Threat Intelligence Map</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>Hover over active threat telemetry nodes to inspect live node diagnostics.</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {threatNodes.map(node => (
              <div 
                key={node.id}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ 
                  padding: '6px 14px', background: hoveredNode?.id === node.id ? 'var(--accent)' : 'var(--bg-primary)', 
                  border: '1px solid var(--border-subtle)', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                  color: hoveredNode?.id === node.id ? 'white' : 'var(--text-primary)', transition: 'all 0.2s'
                }}
              >
                📍 {node.name}
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 260, background: 'var(--bg-primary)', borderRadius: 10, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)' }}>
          {/* Radial grid backdrop */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.15, background: 'radial-gradient(circle at center, var(--accent) 0%, transparent 70%)' }} />
          
          <div style={{ textAlign: 'center', zIndex: 5 }}>
            <Globe size={48} color="var(--accent)" style={{ marginBottom: 12, opacity: 0.8 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              {hoveredNode ? hoveredNode.name : "3 SIEM Nodes Active & Monitoring"}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              {hoveredNode 
                ? `IP: ${hoveredNode.ip} | Status: ${hoveredNode.status} | Threats Blocked: ${hoveredNode.threats}` 
                : "Hover over any node above to inspect real-time server telemetry."}
            </div>
          </div>
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

