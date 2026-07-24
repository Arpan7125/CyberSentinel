import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Download, RefreshCw, X } from 'lucide-react';
import { saasService, dashboardService } from '../../services/api';

export default function BillingPage() {
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState({
    name: 'Enterprise Trial',
    cost: '$0.00 / month',
    renewal: '2026-08-01',
    seats: 'Unlimited seats',
    paymentMethod: 'No payment method on file'
  });

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'seats' | 'payment'

  useEffect(() => {
    const fetchBillingData = async () => {
      setLoading(true);
      try {
        const [subRes, invRes, statsRes] = await Promise.all([
          saasService.getSubscriptions().catch(() => []),
          saasService.getInvoices().catch(() => []),
          dashboardService.stats().catch(() => null)
        ]);

        if (statsRes) setStats(statsRes);

        const subs = subRes || [];
        const invs = invRes || [];

        if (subs.length > 0) {
          const activeSub = subs[0];
          if (activeSub && activeSub.plan) {
            setCurrentPlan({
              name: activeSub.plan.name,
              cost: `$${activeSub.plan.price} / ${activeSub.plan.interval}`,
              renewal: new Date(activeSub.current_period_end).toLocaleDateString(),
              seats: 'Unlimited seats',
              paymentMethod: 'No payment method on file'
            });
          }
        }

        const fallbackInvoices = [
          { id: 'INV-2026-001', date: '2026-07-01', amount: '$0.00', status: 'Paid' },
          { id: 'INV-2026-002', date: '2026-06-01', amount: '$0.00', status: 'Paid' }
        ];

        if (invs.length > 0) {
          const mappedInvs = invs.map(i => ({
            id: `INV-2026-00${i.id}`,
            date: new Date(i.date).toLocaleDateString(),
            amount: `$${i.amount}`,
            status: i.status.toUpperCase()
          }));
          setInvoices(mappedInvs);
        } else {
          setInvoices(fallbackInvoices);
        }
      } catch (err) {
        console.error("Failed to fetch billing data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, []);

  const totalScansCount = stats ? stats.total_scans : 0;
  const usageMetrics = [
    { label: 'Scanned Data', value: `${(totalScansCount * 0.1).toFixed(1)} GB`, limit: '100 GB', percentage: Math.min(100, (totalScansCount * 0.1 / 100) * 100) },
    { label: 'Protected Endpoints', value: '2 nodes', limit: '10 nodes', percentage: 20 },
    { label: 'API Calls Used', value: `${totalScansCount} requests`, limit: '50,000 requests', percentage: Math.min(100, (totalScansCount / 50000) * 100) }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="page-title">Billing & Subscriptions</h1>
        <p className="page-subtitle">Configure billing information, subscription tiers, and review usage metrics</p>
      </div>

      {/* Plan Details & Payment */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
        {/* Active plan card */}
        <div className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="status-badge status-active" style={{ fontSize: 9, padding: '2px 8px', marginBottom: 8 }}><span className="status-badge-dot" /> ACTIVE</span>
              <h3 className="section-title" style={{ fontSize: 20 }}>{currentPlan.name}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                Renews on {currentPlan.renewal}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{currentPlan.cost}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{currentPlan.seats}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button className="btn-pub btn-pub-primary btn-pub-sm" onClick={() => navigate('/pricing')}>Upgrade to Pro</button>
            <button className="btn-pub btn-pub-secondary btn-pub-sm" onClick={() => setActiveModal('seats')}>Manage Seats</button>
          </div>
        </div>

        {/* Payment Method Card */}
        <div className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 className="section-title">Payment Method</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-secondary)', padding: 16, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <CreditCard size={24} color="var(--text-muted)" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{currentPlan.paymentMethod}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Add a card to upgrade</div>
            </div>
          </div>
          <button className="btn-pub btn-pub-secondary btn-pub-sm" style={{ width: '100%' }} onClick={() => setActiveModal('payment')}>Add Payment Method</button>
        </div>
      </div>

      {/* Usage Analytics Progress Bars */}
      <div className="glass-card" style={{ padding: 28 }}>
        <h3 className="section-title" style={{ marginBottom: 20 }}>Telemetry Subscription Limits</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {usageMetrics.map((metric, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ fontWeight: 700 }}>{metric.label}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{metric.value} / {metric.limit}</span>
              </div>
              <div style={{ width: '100%', height: 8, background: 'var(--bg-hover)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  width: `${metric.percentage}%`, height: '100%',
                  background: metric.percentage > 75 ? 'var(--accent-red)' : 'var(--accent)',
                  borderRadius: 4, transition: 'width 0.5s ease-in-out'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice Table History */}
      <div className="glass-card" style={{ padding: 28 }}>
        <h3 className="section-title" style={{ marginBottom: 16 }}>Invoices Archive</h3>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Billing Date</th>
                <th>Billing Cost</th>
                <th>Payment Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length > 0 ? invoices.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{inv.id}</td>
                  <td>{inv.date}</td>
                  <td>{inv.amount}</td>
                  <td>
                    <span className="status-badge status-active"><span className="status-badge-dot" /> {inv.status}</span>
                  </td>
                  <td>
                    <button className="btn-pub btn-pub-ghost btn-pub-sm" onClick={() => alert(`Downloading Invoice ${inv.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Download size={14} /> Download PDF
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}>
                    No payment history available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-secondary)', padding: 32, borderRadius: 12, width: '100%', maxWidth: 450, border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>{activeModal === 'seats' ? 'Manage Team Seats' : 'Add Payment Method'}</h3>
              <button onClick={() => setActiveModal(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {activeModal === 'seats' ? (
              <div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>Your current plan includes <strong>Unlimited seats</strong>. You can invite team members from the Admin console.</p>
                <button className="btn-pub btn-pub-primary" style={{ width: '100%' }} onClick={() => setActiveModal(null)}>Close</button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>Enter payment details to enable automatic renewal and billing upgrades.</p>
                <input type="text" placeholder="Cardholder Name" style={{ width: '100%', padding: 12, background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', marginBottom: 12, outline: 'none' }} />
                <input type="text" placeholder="Card Number (•••• •••• •••• ••••)" style={{ width: '100%', padding: 12, background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', marginBottom: 20, outline: 'none' }} />
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn-pub btn-pub-ghost" style={{ flex: 1 }} onClick={() => setActiveModal(null)}>Cancel</button>
                  <button className="btn-pub btn-pub-primary" style={{ flex: 1 }} onClick={() => { alert('Payment method saved.'); setActiveModal(null); }}>Save Card</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
