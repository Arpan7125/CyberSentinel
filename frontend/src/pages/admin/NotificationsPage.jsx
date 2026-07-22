import React, { useState } from 'react';
import { Megaphone } from 'lucide-react';

export default function NotificationsPage() {
  const [broadcasts, setBroadcasts] = useState([
    { id: 1, type: 'Maintenance', target: 'In-App Banner', title: 'Scheduled Maintenance', date: '2026-07-06', status: 'Sent' },
    { id: 2, type: 'Emergency', target: 'All Channels', title: 'Zero-day security patching emergency alert', date: '2026-06-12', status: 'Expired' }
  ]);

  const [form, setForm] = useState({
    title: '',
    type: 'Maintenance Notice',
    target: 'All Channels',
    message: ''
  });

  const handleSendBroadcast = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;

    const newBroadcast = {
      id: Date.now(),
      type: form.type.replace(' Notice', ''),
      target: form.target,
      title: form.title,
      date: new Date().toISOString().split('T')[0],
      status: 'Sent'
    };

    setBroadcasts([newBroadcast, ...broadcasts]);
    setForm({ title: '', type: 'Maintenance Notice', target: 'All Channels', message: '' });
    alert('Global alert broadcast dispatched successfully.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="page-title">SOC Broadcast Center</h1>
        <p className="page-subtitle">Send urgent system maintenance notices, emergency alerts, or notifications to all users</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
        {/* Create Broadcast form */}
        <div className="glass-card" style={{ padding: 28 }}>
          <h3 className="section-title" style={{ marginBottom: 20 }}>Publish Global Broadcast</h3>
          <form onSubmit={handleSendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label-pub">Broadcast Title</label>
              <input
                type="text"
                className="form-input-pub"
                placeholder="Alert Subject/Headline..."
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label-pub">Notice Type</label>
                <select
                  className="form-select-pub"
                  value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                >
                  <option value="Maintenance Notice">Maintenance Notice</option>
                  <option value="Emergency Alert">Emergency Alert</option>
                  <option value="Product Update">Product Update</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label-pub">Distribution Channel</label>
                <select
                  className="form-select-pub"
                  value={form.target}
                  onChange={e => setForm(p => ({ ...p, target: e.target.value }))}
                >
                  <option value="All Channels">All Channels (Email + Push + SMS)</option>
                  <option value="In-App Banner">In-App Banner Only</option>
                  <option value="Email Only">Email Blast Only</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label-pub">Message Content</label>
              <textarea
                className="form-textarea-pub"
                placeholder="Write detailed notification message here..."
                value={form.message}
                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                required
              />
            </div>

            <button type="submit" className="btn-pub btn-pub-primary btn-pub-sm" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8 }}>
              Broadcast Alert <Megaphone size={16} />
            </button>
          </form>
        </div>

        {/* Previous broadcasts list */}
        <div className="glass-card" style={{ padding: 28 }}>
          <h3 className="section-title" style={{ marginBottom: 16 }}>Broadcast History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {broadcasts.map(b => (
              <div key={b.id} style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{b.title}</span>
                  <span className={`badge ${b.type === 'Emergency' ? 'badge-critical' : 'badge-high'}`} style={{ padding: '3px 8px' }}>{b.type}</span>
                </div>
                <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>Channel: {b.target} | Date: {b.date}</p>
                <span className="status-badge status-active" style={{ fontSize: 9, padding: '2px 8px', marginTop: 8 }}><span className="status-badge-dot" /> {b.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
