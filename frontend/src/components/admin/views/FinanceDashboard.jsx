import React from 'react';
import { useAdminWorkspace } from '../../../contexts/AdminWorkspaceContext';
import { DollarSign, TrendingUp, CreditCard, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function FinanceDashboard() {
  const { activeModule } = useAdminWorkspace();

  if (activeModule !== 'finance') return null;

  const kpis = [
    { label: "Monthly Recurring Revenue", value: "$482,400", change: "+12.4%", trend: "up", icon: <DollarSign size={20} /> },
    { label: "Annual Recurring Revenue", value: "$5.78M", change: "+15.2%", trend: "up", icon: <TrendingUp size={20} /> },
    { label: "Active Subscriptions", value: "14,204", change: "+8.1%", trend: "up", icon: <Activity size={20} /> },
    { label: "Failed Payments", value: "32", change: "-2.4%", trend: "down", icon: <CreditCard size={20} /> }
  ];

  return (
    <div style={{ flex: 1, padding: 32, overflowY: 'auto', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Finance & Analytics Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Overview of MRR, ARR, and payment gateways.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-pub btn-pub-ghost">Download Report</button>
          <button className="btn-pub btn-pub-primary" style={{ background: '#32D74B' }}>Generate Invoice</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
        {kpis.map((kpi, idx) => (
          <div key={idx} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ color: 'var(--text-muted)' }}>{kpi.icon}</div>
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700,
                color: kpi.trend === 'up' && kpi.label !== 'Failed Payments' ? '#32D74B' : kpi.label === 'Failed Payments' && kpi.trend === 'down' ? '#32D74B' : '#FF453A',
                background: kpi.trend === 'up' && kpi.label !== 'Failed Payments' ? 'rgba(50,215,75,0.1)' : kpi.label === 'Failed Payments' && kpi.trend === 'down' ? 'rgba(50,215,75,0.1)' : 'rgba(255,69,58,0.1)',
                padding: '4px 8px', borderRadius: 20
              }}>
                {kpi.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {kpi.change}
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{kpi.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Charts & Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>Revenue Growth</h3>
          <div style={{ height: 300, display: 'flex', alignItems: 'flex-end', gap: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
            {/* Mock Bar Chart */}
            {[40, 55, 45, 70, 65, 80, 95].map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: '100%', height: `${h}%`, background: 'linear-gradient(to top, rgba(50,215,75,0.2), #32D74B)', borderRadius: '4px 4px 0 0' }}></div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>M{i+1}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>Recent Payments</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { email: 'joshua@cybersentinel.ai', amount: '$499', status: 'Succeeded', gateway: 'Stripe' },
              { email: 'alice@umbrella.corp', amount: '$99', status: 'Succeeded', gateway: 'Stripe' },
              { email: 'bob@construct.io', amount: '$49', status: 'Failed', gateway: 'PayPal' },
              { email: 'charlie@bank.net', amount: '$999', status: 'Succeeded', gateway: 'Wire Transfer' },
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.email}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.gateway}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{p.amount}</div>
                  <div style={{ fontSize: 11, color: p.status === 'Succeeded' ? '#32D74B' : '#FF453A' }}>{p.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
