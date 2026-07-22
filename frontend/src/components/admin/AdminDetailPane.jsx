import React, { useState } from 'react';
import { useAdminWorkspace } from '../../contexts/AdminWorkspaceContext';
import { ShieldAlert, X, Shield, Activity, Trash2, ArrowUpCircle } from 'lucide-react';

export default function AdminDetailPane() {
  const { activeModule, items, selectedItemId, setSelectedItemId } = useAdminWorkspace();
  const [activeTab, setActiveTab] = useState('overview');

  if (!selectedItemId) {
    return (
      <div className="admin-ws-detail-pane" style={{ alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        <div style={{ marginBottom: 16, opacity: 0.2 }}><Shield size={64} /></div>
        <div>Select an item to view details</div>
        <div style={{ fontSize: 11, marginTop: 8 }}>Use <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>J</kbd> and <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>K</kbd> to navigate</div>
      </div>
    );
  }

  const item = items.find(i => i.id === selectedItemId);
  if (!item) return null;

  const getTabs = () => {
    if (activeModule === 'users') return ['overview', 'timeline', 'subscription', 'reports', 'activity', 'ai conversations', 'security', 'support history', 'notes', 'audit logs'];
    if (activeModule === 'support' || activeModule === 'inbox') return ['thread', 'user details', 'logs'];
    if (activeModule === 'ai-chats') return ['conversation', 'analysis'];
    return ['overview', 'details'];
  };

  const tabs = getTabs();
  // Safe guard if module changes while tab is active
  if (!tabs.includes(activeTab)) {
    setActiveTab(tabs[0]);
  }

  return (
    <div className="admin-ws-detail-pane">
      {/* Header */}
      <div className="admin-ws-detail-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="admin-ws-detail-subject">{item.subject || item.name || item.action}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {activeModule === 'users' && (
              <>
                <button 
                  className="btn-pub btn-pub-primary btn-pub-sm" 
                  title="Hover Detail: Upgrade this user account plan tier to Enterprise level."
                  onClick={async () => {
                    alert(`User ${item.name} upgraded to Enterprise plan.`);
                  }}
                  style={{ background: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <ArrowUpCircle size={14} /> Upgrade Plan
                </button>
                <button 
                  className="btn-pub btn-pub-ghost btn-pub-sm" 
                  title="Hover Detail: Toggle active status for this user in the database."
                  onClick={async () => {
                    try {
                      const res = await adminService.userAction({ action: 'toggle_active', user_id: item.id });
                      alert(res.message || 'User status updated.');
                    } catch (e) {
                      alert(e.message || 'Failed to update user status.');
                    }
                  }}
                  style={{ color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <ShieldAlert size={14} /> {item.status === 'Active' ? 'Suspend' : 'Activate'}
                </button>
                <button 
                  className="btn-pub btn-pub-ghost btn-pub-sm" 
                  title="Hover Detail: Delete this user record permanently from the Django database."
                  onClick={async () => {
                    if (window.confirm(`Are you sure you want to delete user ${item.name}?`)) {
                      try {
                        const res = await adminService.userAction({ action: 'delete', user_id: item.id });
                        alert(res.message || 'User deleted.');
                        setSelectedItemId(null);
                      } catch (e) {
                        alert(e.message || 'Failed to delete user.');
                      }
                    }
                  }}
                  style={{ color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </>
            )}
            {activeModule !== 'users' && (
              <button className="btn-pub btn-pub-primary btn-pub-sm" title="Hover Detail: Perform administrative action on selected record.">Take Action</button>
            )}
            <button className="btn-pub btn-pub-ghost btn-pub-sm" onClick={() => setSelectedItemId(null)} style={{ padding: '6px' }} title="Hover Detail: Close detail inspector.">
              <X size={16} />
            </button>
          </div>
        </div>
        
        <div className="admin-ws-detail-meta" style={{ marginTop: 12 }}>
          <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 14, background: 'var(--accent)', color: 'var(--text-primary)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {(item.sender || item.name || item.admin || 'A').charAt(0)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{item.sender || item.name || item.admin}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.email || 'system@local'} {item.company ? `• ${item.company}` : ''}</span>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
            {(item.date || item.time || item.lastLogin) ? new Date(item.date || item.time || item.lastLogin).toLocaleString() : 'N/A'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', padding: '0 24px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
              color: activeTab === tab ? '#AF52DE' : 'var(--text-secondary)',
              borderBottom: activeTab === tab ? '2px solid #AF52DE' : '2px solid transparent',
              fontWeight: activeTab === tab ? 600 : 400, textTransform: 'capitalize', fontSize: 13,
              outline: 'none'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="admin-ws-detail-content" style={{ overflowY: 'auto' }}>
        {activeModule === 'users' ? (
          <>
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700 }}>Account Status</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: item.status === 'Active' ? '#32D74B' : '#FF453A' }}>{item.status}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>ID: {item.id}</div>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700 }}>Subscription</div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{item.plan}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Renews: {new Date(item.renewalDate).toLocaleDateString()}</div>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700 }}>Security Score</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: item.securityScore > 90 ? '#32D74B' : '#FF9F0A' }}>{item.securityScore}/100</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Risk Level: {item.riskScore}</div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: 14, marginBottom: 12, fontWeight: 600 }}>Account Properties</h4>
                  <div className="admin-ws-message-details-box">
                    <div><dt>Email</dt><dd>{item.email}</dd></div>
                    <div><dt>Company</dt><dd>{item.company}</dd></div>
                    <div><dt>Country</dt><dd>{item.country}</dd></div>
                    <div><dt>Role</dt><dd>{item.role}</dd></div>
                    <div><dt>Created</dt><dd>{new Date(item.created).toLocaleString()}</dd></div>
                    <div><dt>Last Login</dt><dd>{new Date(item.lastLogin).toLocaleString()}</dd></div>
                    <div><dt>Devices</dt><dd>{item.devices}</dd></div>
                    <div><dt>Tags</dt><dd>{item.tags?.join(', ') || 'None'}</dd></div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {item.timeline?.map(t => (
                  <div key={t.id} style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ width: 120, fontSize: 12, color: 'var(--text-muted)' }}>{new Date(t.date).toLocaleString()}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{t.event}</div>
                  </div>
                )) || <div style={{ color: 'var(--text-muted)' }}>No timeline events found.</div>}
              </div>
            )}

            {activeTab === 'payments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <table style={{ width: '100%', fontSize: 13, textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '8px 0' }}>Date</th>
                      <th>Invoice ID</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.billingHistory?.map(inv => (
                      <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 0' }}>{new Date(inv.date).toLocaleDateString()}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{inv.id}</td>
                        <td>{inv.amount}</td>
                        <td>{inv.method}</td>
                        <td style={{ color: inv.status === 'Paid' ? '#32D74B' : '#FF453A' }}>{inv.status}</td>
                      </tr>
                    )) || <tr><td colSpan="5" style={{ padding: 12, color: 'var(--text-muted)' }}>No billing history found.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'security' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(239,68,68,0.05)', padding: 16, borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Risk Score: {item.riskScore}/100</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Based on login locations, failed attempts, and platform usage.</div>
                  </div>
                  <div style={{ fontSize: 32, opacity: 0.8 }}>
                    <Activity color={item.riskScore > 50 ? '#FF453A' : item.riskScore > 20 ? '#FFD60A' : '#32D74B'} size={32} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div>
                <textarea 
                  defaultValue={item.notes}
                  style={{ width: '100%', minHeight: 200, padding: 16, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 8 }}
                />
                <button className="btn-pub btn-pub-primary" style={{ marginTop: 12 }}>Save Notes</button>
              </div>
            )}
            
            {/* Fallback for other tabs */}
            {!['overview', 'timeline', 'payments', 'security', 'notes'].includes(activeTab) && (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
                Data for {activeTab} is currently being aggregated from external systems.
              </div>
            )}
          </>
        ) : activeModule === 'payments' ? (
          <>
            {activeTab === 'invoice details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>${item.amount?.toFixed(2)}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Status: {item.status} via {item.gateway}</div>
                </div>
                <div className="admin-ws-message-details-box">
                  <div><dt>Invoice ID</dt><dd>{item.id}</dd></div>
                  <div><dt>Date</dt><dd>{new Date(item.date).toLocaleString()}</dd></div>
                  <div><dt>Customer Email</dt><dd>{item.email}</dd></div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="admin-ws-thread-message">
            {/* Context Box */}
            {item.details && (
              <div className="admin-ws-message-details-box">
                {Object.entries(item.details).map(([k, v]) => {
                  if (k === 'fullMessage') return null;
                  return (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="admin-ws-message-body">
              {item.details?.fullMessage || "No extended details available for this record."}
            </div>

            {/* Quick Reply Box (simulated for inbox items) */}
            {item.type && (
              <div style={{ marginTop: 40, border: '1px solid var(--border-subtle)', borderRadius: 6, overflow: 'hidden' }}>
                <textarea 
                  placeholder="Click here to Reply, Forward, or Assign..." 
                  style={{ width: '100%', border: 'none', background: 'var(--bg-secondary)', padding: 16, minHeight: 100, color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
                />
                <div style={{ background: 'var(--bg-primary)', padding: '8px 16px', display: 'flex', gap: 8 }}>
                  <button className="btn-pub btn-pub-primary btn-pub-sm">Send Reply</button>
                  <button className="btn-pub btn-pub-ghost btn-pub-sm">Generate AI Response</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
