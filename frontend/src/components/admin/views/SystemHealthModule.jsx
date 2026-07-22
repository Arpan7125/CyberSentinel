import React from 'react';
import { Activity, Server, Database, Cloud, ShieldAlert, Cpu } from 'lucide-react';

export default function SystemHealthModule() {
  return (
    <div style={{ padding: '32px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h2 style={{ margin: '0 0 8px 0', fontWeight: 600, color: 'var(--text-primary)' }}>System Health Monitoring</h2>
        <div style={{ color: 'var(--text-secondary)' }}>Real-time telemetry and service status.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {/* API Servers */}
        <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, border: '1px solid rgba(50,215,75,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Server size={16} color="#32D74B" />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>API Gateway</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#32D74B' }}>99.99%</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Latency: 45ms</div>
        </div>

        {/* Database */}
        <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, border: '1px solid rgba(50,215,75,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Database size={16} color="#32D74B" />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Primary DB</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#32D74B' }}>Healthy</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Connections: 1,204</div>
        </div>

        {/* AI Engine */}
        <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, border: '1px solid rgba(50,215,75,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Cpu size={16} color="#32D74B" />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>AI Inference</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#32D74B' }}>Healthy</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Avg Response: 1.2s</div>
        </div>

        {/* WAF Queue */}
        <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, border: '1px solid rgba(255,69,58,0.2)', boxShadow: '0 0 0 1px #FF453A' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <ShieldAlert size={16} color="#FF453A" />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>WAF Queue</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#FF453A' }}>Degraded</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Queue Size: 4,502 (High)</div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border-subtle)', flex: 1, padding: 24 }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>CPU & Memory Utilization</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ height: 200, background: 'var(--bg-primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
            [CPU Chart]
          </div>
          <div style={{ height: 200, background: 'var(--bg-primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
            [Memory Chart]
          </div>
        </div>
      </div>
    </div>
  );
}
