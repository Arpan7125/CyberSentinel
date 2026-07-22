import React, { useState, useEffect } from 'react';
import { supportService } from '../../services/api';

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  
  const [internalNotes, setInternalNotes] = useState('');
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await supportService.getTickets();
      setTickets(Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (id, assignee_id) => {
    try {
      await supportService.assignTicket(id, assignee_id);
      fetchTickets();
      alert(`Ticket assigned successfully`);
    } catch (err) {
      console.error(err);
      alert('Failed to assign ticket.');
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;
    try {
      await supportService.replyTicket(activeTicket.id, replyText, false);
      setReplyText('');
      // Reload ticket details
      const updatedTicket = await supportService.getTicket(activeTicket.id);
      setActiveTicket(updatedTicket);
    } catch (err) {
      console.error(err);
      alert('Failed to send reply');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!internalNotes.trim() || !activeTicket) return;
    try {
      await supportService.replyTicket(activeTicket.id, internalNotes, true);
      setInternalNotes('');
      // Reload ticket details
      const updatedTicket = await supportService.getTicket(activeTicket.id);
      setActiveTicket(updatedTicket);
    } catch (err) {
      console.error(err);
      alert('Failed to add internal note');
    }
  };

  const handleStatusChange = async (status) => {
    if (!activeTicket) return;
    try {
      const updatedTicket = await supportService.updateTicket(activeTicket.id, { status });
      setActiveTicket(updatedTicket);
      fetchTickets();
    } catch (err) {
      console.error(err);
      alert(`Failed to mark ticket as ${status}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="page-title">Incidents & Support Tickets</h1>
        <p className="page-subtitle">Assign support incidents, coordinate resolutions, add internal notes, and write replies</p>
      </div>

      {activeTicket ? (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          {/* Chat thread box */}
          <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
              <div>
                <button
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, marginBottom: 8 }}
                  onClick={() => { setActiveTicket(null); fetchTickets(); }}
                >
                  ← Back to list
                </button>
                <h3 className="section-title">{activeTicket.subject}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Customer: {activeTicket.customer_email || 'Unknown'} | Assigned to: {activeTicket.assignee_name || 'Unassigned'}
                </p>
              </div>
            </div>

            {/* Conversation Log */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 340, overflowY: 'auto', padding: 8 }}>
              {activeTicket.replies && activeTicket.replies.map(log => (
                <div
                  key={log.id}
                  style={{
                    padding: 12, borderRadius: 'var(--radius-md)',
                    background: log.is_internal ? 'rgba(255,149,0,0.06)' : log.sender_name === activeTicket.customer_email ? 'rgba(255,255,255,0.02)' : 'var(--accent-muted)',
                    border: `1px solid ${log.is_internal ? '#FF9500' : log.sender_name === activeTicket.customer_email ? 'var(--border-subtle)' : 'var(--accent)'}`,
                    alignSelf: log.sender_name === activeTicket.customer_email ? 'flex-start' : 'flex-end',
                    maxWidth: '80%'
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                    {log.is_internal ? 'Internal Note (Staff)' : log.sender_name}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{log.content}</p>
                </div>
              ))}
              {(!activeTicket.replies || activeTicket.replies.length === 0) && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No replies yet.</p>
              )}
            </div>

            {/* Response forms */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
              {/* Send customer reply */}
              <form onSubmit={handleSendReply} style={{ display: 'flex', gap: 12 }}>
                <input
                  type="text"
                  className="form-input-pub"
                  placeholder="Type reply to customer..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  required
                />
                <button type="submit" className="btn-pub btn-pub-primary btn-pub-sm">
                  Send Reply
                </button>
              </form>

              {/* Add internal note */}
              <form onSubmit={handleAddNote} style={{ display: 'flex', gap: 12 }}>
                <input
                  type="text"
                  className="form-input-pub"
                  placeholder="Add internal SOC note (staff only)..."
                  value={internalNotes}
                  onChange={e => setInternalNotes(e.target.value)}
                  required
                  style={{ borderColor: 'rgba(255,149,0,0.4)' }}
                />
                <button type="submit" className="btn-pub btn-pub-secondary btn-pub-sm" style={{ borderColor: '#FF9500', color: '#FF9500' }}>
                  Add Note
                </button>
              </form>
            </div>
          </div>

          {/* Ticket metadata panel */}
          <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 className="section-title">Incident Details</h3>
            
            <div className="form-group">
              <label className="form-label-pub">Ticket Priority</label>
              <span className={`badge ${activeTicket.priority === 'Critical' ? 'badge-critical' : activeTicket.priority === 'High' ? 'badge-high' : 'badge-medium'}`} style={{ padding: '8px 12px', width: 'fit-content' }}>
                {activeTicket.priority}
              </span>
            </div>
            
            <div className="form-group">
              <label className="form-label-pub">Status</label>
              <span className={`badge ${activeTicket.status === 'Resolved' ? 'badge-admin' : 'badge-high'}`} style={{ padding: '8px 12px', width: 'fit-content' }}>
                {activeTicket.status}
              </span>
            </div>

            {activeTicket.status !== 'Resolved' && (
              <button onClick={() => handleStatusChange('Resolved')} className="btn-pub btn-pub-secondary btn-pub-sm" style={{ color: 'var(--accent-green)', borderColor: 'var(--accent-green)' }}>
                Mark Resolved
              </button>
            )}
            
            {activeTicket.status === 'Resolved' && (
              <button onClick={() => handleStatusChange('Open')} className="btn-pub btn-pub-secondary btn-pub-sm">
                Reopen Ticket
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 28 }}>
          <h3 className="section-title" style={{ marginBottom: 16 }}>Support Queue</h3>
          {loading ? (
             <p>Loading tickets...</p>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Customer</th>
                    <th>Subject</th>
                    <th>Priority</th>
                    <th>Assignee</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(t => (
                    <tr
                      key={t.id}
                      onClick={async () => {
                        const fullTicket = await supportService.getTicket(t.id);
                        setActiveTicket(fullTicket);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>T-{t.id}</td>
                      <td>{t.customer_email || 'Unknown'}</td>
                      <td style={{ fontWeight: 650 }}>{t.subject}</td>
                      <td>
                        <span className={`badge ${t.priority === 'Critical' ? 'badge-critical' : t.priority === 'High' ? 'badge-high' : 'badge-medium'}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td>{t.assignee_name || 'Unassigned'}</td>
                      <td>
                        <span className={`status-badge ${t.status === 'Resolved' ? 'status-active' : 'status-warning'}`}>
                          <span className="status-badge-dot" /> {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {tickets.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>No tickets found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
