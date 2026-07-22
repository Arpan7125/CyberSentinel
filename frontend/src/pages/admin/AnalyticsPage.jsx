import React from 'react';

export default function AnalyticsPage() {
  const trafficMetrics = [
    { label: 'Total Pageviews (30d)', value: '0', change: '0.0%', trend: 'neutral' },
    { label: 'Unique Visitors', value: '0', change: '0.0%', trend: 'neutral' },
    { label: 'Avg Session Duration', value: '0m 00s', change: '0.0%', trend: 'neutral' },
    { label: 'Bounce Rate', value: '0.0%', change: '0.0%', trend: 'neutral' },
  ];

  const conversionStats = [
    { label: 'Free Trial Registrations', value: '0', rate: '0.0% conversion' },
    { label: 'Demo Request Submissions', value: '0', rate: '0.0% conversion' },
    { label: 'Newsletter Subscriptions', value: '0', rate: '0.0% conversion' },
    { label: 'AI Conversations Started', value: '0', rate: '0.0% engage rate' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="page-title">Platform Analytics</h1>
        <p className="page-subtitle">Monitor traffic volume, conversion rates, subscription growth, and AI usage metrics</p>
      </div>

      {/* Traffic KPI row */}
      <div className="stat-card-grid">
        {trafficMetrics.map((m, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">{m.label}</span>
            </div>
            <div className="stat-card-value">{m.value}</div>
            <div className={`stat-card-change ${m.trend}`}>
              {m.change} vs last month
            </div>
          </div>
        ))}
      </div>

      {/* Conversion stats & growth grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Conversion channels */}
        <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 className="section-title">Conversion Operations</h3>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event Action</th>
                  <th>Conversions</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {conversionStats.map((stat, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 650 }}>{stat.label}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{stat.value}</td>
                    <td><span className="badge badge-admin" style={{ padding: '3px 8px' }}>{stat.rate}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI helper stats */}
        <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 className="section-title">AI Assistant Engagements</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Overall AI Helpfulness Score', value: '0.00 / 5.00', details: '0% positive user response rating' },
              { label: 'Auto-resolved Inquiries', value: '0.0%', details: 'Inquiries answered without ticket escalations' },
              { label: 'Top AI Trigger Intent', value: 'N/A', details: 'Not enough data' },
              { label: 'Demo Bookings via AI', value: '0 bookings', details: 'Initiated directly inside AI chats' },
            ].map((stat, idx) => (
              <div key={idx} style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{stat.label}</span>
                  <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{stat.value}</span>
                </div>
                <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>{stat.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
