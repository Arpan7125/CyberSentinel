import React, { useState } from 'react';
import { Activity } from 'lucide-react';

export default function ThreatCenterPage() {
  const [threatLogs, setThreatLogs] = useState([]);

  const severityStats = [
    { label: 'Critical Severity', count: '0', color: '#AF52DE' },
    { label: 'High Severity', count: '0', color: 'var(--accent-red)' },
    { label: 'Medium Severity', count: '0', color: '#FF9500' },
    { label: 'Low Severity', count: '0', color: 'var(--accent-green)' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="page-title">Live Threat Center</h1>
        <p className="page-subtitle">Continuous SIEM threat analysis maps, threat severity distributions, and source metrics</p>
      </div>

      {/* Stats Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {severityStats.map((stat, i) => (
          <div key={i} className="glass-card" style={{ padding: 20, borderLeft: `4px solid ${stat.color}` }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 650 }}>{stat.label}</span>
            <div style={{ fontSize: 32, fontWeight: 900, marginTop: 8, color: stat.color }}>{stat.count}</div>
          </div>
        ))}
      </div>

      {/* Threat Intel Geo Map placeholder */}
      <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
        <h3 className="section-title" style={{ marginBottom: 16, textAlign: 'left' }}>SIEM Attack Vector Map</h3>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 40, border: '1px dashed var(--border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 380, gap: 12 }}>
          <Activity size={32} color="var(--text-muted)" />
          <div style={{ color: 'var(--text-secondary)' }}>Awaiting telemetry data to plot threat vectors.</div>
        </div>
      </div>

      {/* Incident Log Logs */}
      <div className="glass-card" style={{ padding: 28 }}>
        <h3 className="section-title" style={{ marginBottom: 16 }}>Live Threat Log Feed</h3>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Incident ID</th>
                <th>Time</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Target Node</th>
                <th>Attack Source</th>
                <th>Action Taken</th>
              </tr>
            </thead>
            <tbody>
              {threatLogs.length > 0 ? threatLogs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{log.id}</td>
                  <td>{log.timestamp}</td>
                  <td style={{ fontWeight: 650 }}>{log.category}</td>
                  <td>
                    <span className={`badge ${log.severity === 'Critical' ? 'badge-critical' : log.severity === 'High' ? 'badge-high' : 'badge-medium'}`}>
                      {log.severity}
                    </span>
                  </td>
                  <td>{log.target}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{log.source}</td>
                  <td>
                    <span className="status-badge status-active">
                      <span className="status-badge-dot" /> {log.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}>
                    No threats detected in the current timeframe.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
