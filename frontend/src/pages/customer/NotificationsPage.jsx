import React, { useState } from 'react';
import { useNotifications } from '../../NotificationContext';
import { api } from '../../services/api';

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();
  const [filter, setFilter] = useState('All');
  const [error, setError] = useState('');

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}/`);
      fetchNotifications();
    } catch (err) {
      setError(err.message || "Couldn't delete that notification.");
    }
  };

  const filteredNotifications = (notifications || []).filter(
    (n) => filter === 'All' || n.notification_type === filter
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {error && (
        <p className="field-error" role="alert"><span>{error}</span></p>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Notification Center</h1>
          <p className="page-subtitle">View critical system nodes notifications, updates, and threat security advisories</p>
        </div>
        <button className="btn-pub btn-pub-secondary btn-pub-sm" onClick={markAllAsRead}>
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
                  background: !n.is_read ? 'rgba(0,122,255,0.03)' : 'transparent',
                  border: `1px solid ${!n.is_read ? 'rgba(0,122,255,0.1)' : 'var(--border-subtle)'}`,
                  transition: 'all 0.2s',
                  gap: 16
                }}
              >
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: n.notification_type === 'Threat' ? 'rgba(255,59,48,0.1)' : n.notification_type === 'Account' ? 'rgba(255,149,0,0.1)' : 'rgba(0,122,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0
                  }}>
                    {n.notification_type === 'Threat' ? '⚠️' : n.notification_type === 'Account' ? '👤' : '🔔'}
                  </div>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {n.title}
                      {!n.is_read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />}
                    </h4>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{n.message}</p>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 6 }}>{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {!n.is_read && (
                    <button className="btn-pub btn-pub-ghost btn-pub-sm" onClick={() => markAsRead(n.id)}>
                      Mark Read
                    </button>
                  )}
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
