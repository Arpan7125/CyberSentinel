import React, { useState } from 'react';

export default function NotificationsPage() {
  const [filter, setFilter] = useState('All');
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'Threat', title: 'Critical Alert', text: 'Blocked malicious process on Endpoint D-42', time: '10m ago', unread: true },
    { id: 2, type: 'General', title: 'New Report Available', text: 'June monthly compliance summary report is ready', time: '2h ago', unread: true },
    { id: 3, type: 'Account', title: 'MFA Disabled Warning', text: 'Please ensure MFA is enabled on your account profile settings', time: '1d ago', unread: false },
    { id: 4, type: 'Billing', title: 'Subscription Renewed', text: 'Professional Plan successfully processed', time: '1d ago', unread: false },
    { id: 5, type: 'Threat', title: 'Security Threat Resolved', text: 'Simulated brute force attack logs collected and marked clean', time: '3d ago', unread: false },
  ]);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const handleToggleRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: !n.unread } : n));
  };

  const handleDelete = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filteredNotifications = notifications.filter(n => filter === 'All' || n.type === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Notification Center</h1>
          <p className="page-subtitle">View critical system nodes notifications, updates, and threat security advisories</p>
        </div>
        <button className="btn-pub btn-pub-secondary btn-pub-sm" onClick={handleMarkAllRead}>
           Mark All Read
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['All', 'Threat', 'Account', 'Billing', 'General'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`btn-pub btn-pub-sm ${filter === cat ? 'btn-pub-primary' : 'btn-pub-secondary'}`}
          >
            {cat}s
          </button>
        ))}
      </div>

      {/* Notifications List Container */}
      <div className="glass-card" style={{ padding: 20 }}>
        {filteredNotifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            No notifications found matching filter: {filter}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredNotifications.map(n => (
              <div
                key={n.id}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: 16, borderRadius: 'var(--radius-sm)',
                  background: n.unread ? 'rgba(0,122,255,0.03)' : 'transparent',
                  border: `1px solid ${n.unread ? 'rgba(0,122,255,0.1)' : 'var(--border-subtle)'}`,
                  transition: 'all 0.2s',
                  gap: 16
                }}
              >
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: n.type === 'Threat' ? 'rgba(255,59,48,0.1)' : n.type === 'Account' ? 'rgba(255,149,0,0.1)' : 'rgba(0,122,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0
                  }}>
                    {n.type === 'Threat' ? '' : n.type === 'Account' ? '' : ''}
                  </div>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {n.title}
                      {n.unread && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />}
                    </h4>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{n.text}</p>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 6 }}>{n.time}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-pub btn-pub-ghost btn-pub-sm" onClick={() => handleToggleRead(n.id)}>
                    {n.unread ? 'Mark Read' : 'Mark Unread'}
                  </button>
                  <button className="btn-pub btn-pub-ghost btn-pub-sm" style={{ color: 'var(--accent-red)' }} onClick={() => handleDelete(n.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
