import React, { useState, useEffect } from 'react';
import { supportService } from '../../services/api';

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTicket, setActiveTicket] = useState(null);
  const [newTicketForm, setNewTicketForm] = useState({
    subject: '',
    category: 'General Support',
    priority: 'Medium',
    description: ''
  });

  const [replyText, setReplyText] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await supportService.getTickets();
      // Adjust if pagination is applied globally
      setTickets(Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error('Failed to load support tickets', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicketForm.subject.trim() || !newTicketForm.description.trim()) return;

    try {
      const newTicket = await supportService.createTicket(newTicketForm);
      setTickets([newTicket, ...tickets]);
      setNewTicketForm({ subject: '', category: 'General Support', priority: 'Medium', description: '' });
      setShowCreateForm(false);
    } catch (err) {
      console.error('Failed to create ticket', err);
      alert('Failed to create ticket. Please try again.');
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      const newReply = await supportService.replyTicket(activeTicket.id, replyText, false);
      const updatedReplies = [...(activeTicket.replies || []), newReply];
      
      // Update local active ticket state
      setActiveTicket({ ...activeTicket, replies: updatedReplies });
      
      // Update main tickets array
      setTickets(tickets.map(t => 
        t.id === activeTicket.id ? { ...t, replies: updatedReplies } : t
      ));
      
      setReplyText('');
    } catch (err) {
      console.error('Failed to send reply', err);
      alert('Failed to send reply. Please try again.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Support Tickets</h1>
          <p className="page-subtitle">Submit incident tickets directly to security customer service managers</p>
        </div>
        <button
          className="btn-pub btn-pub-primary btn-pub-sm"
          onClick={() => { setShowCreateForm(true); setActiveTicket(null); }}
        >
           Open Support Ticket
        </button>
      </div>

      {showCreateForm && (
        <div className="glass-card" style={{ padding: 28 }}>
          <h3 className="section-title" style={{ marginBottom: 20 }}>Create New Support Incident</h3>
          <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label-pub">Incident Subject</label>
              <input
                type="text"
                className="form-input-pub"
                placeholder="Brief summary of the issue..."
                value={newTicketForm.subject}
                onChange={e => setNewTicketForm(p => ({ ...p, subject: e.target.value }))}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label-pub">Category</label>
                <select
                  className="form-select-pub"
                  value={newTicketForm.category}
                  onChange={e => setNewTicketForm(p => ({ ...p, category: e.target.value }))}
                >
                  <option value="Integration">Integration issues</option>
                  <option value="Detections">Threat False Positives</option>
                  <option value="Billing">Billing & Plan Subscription</option>
                  <option value="General Support">General Support</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label-pub">Urgency/Priority</label>
                <select
                  className="form-select-pub"
                  value={newTicketForm.priority}
                  onChange={e => setNewTicketForm(p => ({ ...p, priority: e.target.value }))}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical Incident</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label-pub">Detailed Description</label>
              <textarea
                className="form-textarea-pub"
                placeholder="Please describe the incident in detail..."
                value={newTicketForm.description}
                onChange={e => setNewTicketForm(p => ({ ...p, description: e.target.value }))}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn-pub btn-pub-primary btn-pub-sm">Submit Ticket</button>
              <button type="button" className="btn-pub btn-pub-secondary btn-pub-sm" onClick={() => setShowCreateForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {activeTicket ? (
        <div className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
            <div>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, marginBottom: 8 }}
                onClick={() => setActiveTicket(null)}
              >
                ← Back to list
              </button>
              <h3 className="section-title">
                {activeTicket.subject} <span style={{ color: 'var(--text-muted)' }}>(#{activeTicket.id})</span>
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                Category: {activeTicket.category} | Priority: {activeTicket.priority}
              </p>
            </div>
            <div>
              <span className={`status-badge ${activeTicket.status === 'Resolved' ? 'status-active' : 'status-warning'}`}>
                <span className="status-badge-dot" /> {activeTicket.status}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 400, overflowY: 'auto', padding: 8 }}>
            <div
              style={{
                padding: 14, borderRadius: 'var(--radius-md)',
                alignSelf: 'flex-start',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                maxWidth: '85%'
              }}
            >
               <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>You (Original Description)</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(activeTicket.created_at).toLocaleString()}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{activeTicket.description}</p>
            </div>

            {(activeTicket.replies || []).map(r => (
              <div
                key={r.id}
                style={{
                  padding: 14, borderRadius: 'var(--radius-md)',
                  alignSelf: r.sender === activeTicket.customer ? 'flex-end' : 'flex-start',
                  background: r.sender === activeTicket.customer ? 'rgba(11, 87, 208, 0.08)' : '#f8fafc',
                  border: `1px solid ${r.sender === activeTicket.customer ? '#0b57d0' : 'var(--border-subtle)'}`,
                  maxWidth: '85%',
                  display: r.is_internal ? 'none' : 'block' // Hide internal notes from customer
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {r.sender === activeTicket.customer ? 'You' : r.sender_name || 'Agent'}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleString()}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{r.content}</p>
              </div>
            ))}
          </div>

          {activeTicket.status !== 'Resolved' && (
            <form onSubmit={handleSendReply} style={{ display: 'flex', gap: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
              <input
                type="text"
                className="form-input-pub"
                placeholder="Type reply..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                required
              />
              <button type="submit" className="btn-pub btn-pub-primary btn-pub-sm">
                Send Reply
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 28 }}>
          <h3 className="section-title" style={{ marginBottom: 16 }}>Support Tickets History</h3>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Created At</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ padding: 20, textAlign: 'center' }}>Loading tickets...</td></tr>
                ) : tickets.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: 20, textAlign: 'center' }}>No support tickets found.</td></tr>
                ) : tickets.map(t => (
                  <tr
                    key={t.id}
                    onClick={() => setActiveTicket(t)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>#{t.id}</td>
                    <td style={{ fontWeight: 650 }}>{t.subject}</td>
                    <td>{t.category}</td>
                    <td>
                      <span className={`badge ${t.priority === 'Critical' ? 'badge-critical' : t.priority === 'High' ? 'badge-high' : t.priority === 'Medium' ? 'badge-medium' : 'badge-low'}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td>{new Date(t.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${t.status === 'Resolved' ? 'status-active' : 'status-warning'}`}>
                        <span className="status-badge-dot" /> {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
