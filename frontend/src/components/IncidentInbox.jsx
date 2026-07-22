import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { 
  Inbox, 
  Search, 
  Sparkles, 
  AlertOctagon, 
  CheckCircle,
  MessageSquare,
  Mail
} from 'lucide-react';

const API = 'http://localhost:8000/api';

export default function IncidentInbox() {
  const { token } = useAuth();
  
  // Navigation & Logs State
  const [activeTab, setActiveTab] = useState('gmail'); // 'gmail' | 'sms'
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | '7days' | '30days'

  // AI Reply Composer State
  const [replyStyle, setReplyStyle] = useState('defensive'); // 'defensive' | 'report' | 'standard'
  const [replyDraft, setReplyDraft] = useState('');
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Fetch all scan logs on load
  const fetchInboxLogs = useCallback(async () => {
    setLoading(true);
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Token ${token}`;
      const res = await fetch(`${API}/dashboard/stats/`, { headers });
      if (!res.ok) throw new Error('Failed to load logs');
      const data = await res.json();
      
      // Filter out only text channel logs for our inbox
      const textLogs = (data.recent_scans || []).filter(item => item.scan_type === 'TEXT');
      setLogs(textLogs);
      
      if (textLogs.length > 0) {
        // Pre-select first log
        setSelectedLog(textLogs[0]);
      } else {
        setSelectedLog(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInboxLogs();
  }, [fetchInboxLogs]);

  // Handle selected item change
  const handleSelectLog = (log) => {
    setSelectedLog(log);
    setReplyDraft('');
    setSendSuccess(false);
  };

  // Date Filtering Logic
  const filterByDate = (log) => {
    if (!log.created_at) return true;
    const logDate = new Date(log.created_at);
    const now = new Date();
    
    if (dateFilter === 'today') {
      return logDate.toDateString() === now.toDateString();
    }
    if (dateFilter === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return logDate >= sevenDaysAgo;
    }
    if (dateFilter === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return logDate >= thirtyDaysAgo;
    }
    return true;
  };

  // Query filtering logic
  const filteredLogs = logs
    .filter(log => {
      // Switch categories
      const isSms = (log.sender || '').includes('SYSTEM ALERT') || (log.subject || '').includes('ALERT TO');
      if (activeTab === 'sms') return isSms;
      return !isSms;
    })
    .filter(filterByDate)
    .filter(log => {
      const q = searchQuery.toLowerCase();
      return (
        (log.sender || '').toLowerCase().includes(q) ||
        (log.subject || '').toLowerCase().includes(q) ||
        (log.input_content || '').toLowerCase().includes(q)
      );
    });

  // Call Backend to generate AI Draft
  const handleGenerateDraft = async () => {
    if (!selectedLog) return;
    setGeneratingDraft(true);
    setReplyDraft('');
    setSendSuccess(false);
    
    try {
      const res = await fetch(`${API}/integrations/gmail/reply-draft/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_sender: selectedLog.sender || 'Unknown',
          original_subject: selectedLog.subject || 'No Subject',
          original_body: selectedLog.input_content || '',
          threat_level: selectedLog.risk_level || 'Low',
          reply_style: replyStyle
        })
      });
      if (!res.ok) throw new Error('Failed to generate draft');
      const data = await res.json();
      setReplyDraft(data.draft);
    } catch (err) {
      console.error(err);
      setReplyDraft("Failed to generate AI response. Verify network connectivity.");
    } finally {
      setGeneratingDraft(false);
    }
  };

  // Mock sending draft response
  const handleSendResponse = () => {
    if (!replyDraft.trim()) return;
    setSendingReply(true);
    setTimeout(() => {
      setSendingReply(false);
      setSendSuccess(true);
      setReplyDraft('');
    }, 1800);
  };

  const getRiskColor = (lvl) => {
    if (lvl === 'Critical') return '#EF4444';
    if (lvl === 'High') return '#FF5A1F';
    if (lvl === 'Medium') return '#FBBF24';
    return '#3EB649';
  };

  const formatTime = (dt) => {
    try {
      return new Date(dt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dt;
    }
  };

  return (
    <div style={{ padding: 40, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Upper header segment */}
      <div style={{ marginBottom: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h1 className="section-title text-gradient-orange" style={{ fontSize: 30, marginBottom: 6 }}>
            INCIDENT OPERATIONS INBOX
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Threat validation workspace // Real-time feed response logs
          </p>
        </div>
        
        {/* Refresh button */}
        <button
          onClick={fetchInboxLogs}
          className="cta-btn cta-btn-secondary"
          style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)' }}
        >
          <span className="cta-btn-inner">
            <span className="cta-btn-text" style={{ fontSize: 11 }}>REFRESH FEEDS</span>
          </span>
        </button>
      </div>

      {/* Primary Split Console Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, flex: 1, minHeight: 0 }}>
        
        {/* Left Side: Inbox List Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
          
          {/* Channel Selector */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: 3,
            flexShrink: 0
          }}>
            <button
              onClick={() => { setActiveTab('gmail'); setReplyDraft(''); }}
              style={{
                flex: 1, padding: '10px',
                background: activeTab === 'gmail' ? 'var(--accent-orange)' : 'transparent',
                border: 'none', borderRadius: 'var(--radius-sm)',
                color: activeTab === 'gmail' ? 'white' : 'var(--text-secondary)',
                fontWeight: 800, fontSize: 11, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.3s'
              }}
            >
              <Mail size={12} />
              GMAIL FEEDS
            </button>
            <button
              onClick={() => { setActiveTab('sms'); setReplyDraft(''); }}
              style={{
                flex: 1, padding: '10px',
                background: activeTab === 'sms' ? 'var(--accent-orange)' : 'transparent',
                border: 'none', borderRadius: 'var(--radius-sm)',
                color: activeTab === 'sms' ? 'white' : 'var(--text-secondary)',
                fontWeight: 800, fontSize: 11, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.3s'
              }}
            >
              <MessageSquare size={12} />
              SMS WARNINGS
            </button>
          </div>

          {/* Filtering Bar Panel */}
          <div className="glass-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search sender, keywords..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px 8px 36px',
                  color: 'white',
                  fontSize: 12,
                  outline: 'none'
                }}
              />
            </div>

            {/* Date Filters Row */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: '7days', label: '7 Days' },
                { id: '30days', label: '30 Days' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setDateFilter(f.id)}
                  style={{
                    flex: 1, padding: '6px 4px', fontSize: 10, fontWeight: 700,
                    background: dateFilter === f.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                    border: `1px solid ${dateFilter === f.id ? 'var(--accent-orange)' : 'var(--border-subtle)'}`,
                    borderRadius: 4, cursor: 'pointer', color: dateFilter === f.id ? 'white' : 'var(--text-muted)',
                    transition: 'all 0.2s'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message List */}
          <div className="glass-card" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: 10 }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                <div className="spinner" style={{ width: 18, height: 18 }} />
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>LOADING INBOX...</span>
              </div>
            ) : filteredLogs.length > 0 ? (
              filteredLogs.map(log => {
                const isActive = selectedLog && selectedLog.id === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => handleSelectLog(log)}
                    style={{
                      padding: '12px 14px',
                      background: isActive ? 'rgba(255,255,255,0.02)' : 'transparent',
                      borderBottom: '1px solid var(--border-subtle)',
                      borderLeft: `3px solid ${isActive ? 'var(--accent-orange)' : 'transparent'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800,
                        color: log.sender === 'SYSTEM ALERT' ? 'var(--accent-green)' : 'var(--accent-orange)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 190
                      }}>
                        {log.sender === 'SYSTEM ALERT' ? log.subject : log.sender}
                      </span>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                        {formatTime(log.created_at)}
                      </span>
                    </div>

                    <div style={{
                      fontSize: 12, fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'white' : 'var(--text-secondary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6
                    }}>
                      {log.sender === 'SYSTEM ALERT' ? log.input_content : log.subject}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                        {log.input_content}
                      </span>
                      <span style={{
                        fontSize: 9, fontWeight: 800, color: getRiskColor(log.risk_level),
                        background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 2
                      }}>
                        {log.risk_level.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', padding: 20, textAlign: 'center' }}>
                <Inbox size={24} style={{ marginBottom: 12, opacity: 0.3 }} />
                <span style={{ fontSize: 11 }}>No items found matching the current filters.</span>
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Message Details and AI Composer */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {selectedLog ? (
            <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 32, minHeight: 0, overflowY: 'auto' }}>
              
              {/* Top Title & Metadata */}
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 20, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 900, color: 'white', marginBottom: 10 }}>
                    {selectedLog.subject || 'SMS Alert dispatch'}
                  </h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span><strong>FROM:</strong> {selectedLog.sender}</span>
                    <span><strong>TIMESTAMP:</strong> {formatTime(selectedLog.created_at)}</span>
                  </div>
                </div>

                {/* Score Dial */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div style={{
                    fontSize: 20, fontWeight: 900,
                    color: getRiskColor(selectedLog.risk_level),
                    fontFamily: 'JetBrains Mono, monospace'
                  }}>{selectedLog.risk_score}%</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>THREAT RATING</div>
                </div>
              </div>

              {/* Message Payload Body */}
              <div style={{
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: 20,
                fontSize: 13.5,
                lineHeight: 1.7,
                color: 'var(--text-secondary)',
                fontFamily: 'JetBrains Mono, monospace',
                whiteSpace: 'pre-wrap',
                marginBottom: 28,
                flexShrink: 0
              }}>
                {selectedLog.input_content}
              </div>

              {/* Threat Heuristics Summary */}
              <div style={{
                padding: '12px 18px',
                background: `${getRiskColor(selectedLog.risk_level)}0d`,
                border: `1px solid ${getRiskColor(selectedLog.risk_level)}20`,
                borderRadius: 'var(--radius-sm)',
                marginBottom: 32,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexShrink: 0
              }}>
                <AlertOctagon size={16} style={{ color: getRiskColor(selectedLog.risk_level) }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Log flagged as <strong>{selectedLog.risk_level.toUpperCase()} RISK</strong>. Our ML models detected Urgency vectors and Spoofed URL structures.
                </span>
              </div>

              {/* AI Reply Operations Section */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 28 }}>
                <h3 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={14} style={{ color: 'var(--accent-orange)' }} />
                  AI ASSISTANT RESPONSE DRAFTER
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Select Tone / Directive */}
                  <div style={{ display: 'flex', gap: 12 }}>
                    {[
                      { id: 'defensive', label: '🛡️ Defensive Verification', desc: 'Request authentication' },
                      { id: 'report', label: '🚨 Report Phish to IT', desc: 'Draft warning report' },
                      { id: 'standard', label: '✉️ Normal Reply', desc: 'Polite acknowledgement' }
                    ].map(style => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setReplyStyle(style.id)}
                        style={{
                          flex: 1, padding: 12, textAlign: 'left',
                          background: replyStyle === style.id ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.1)',
                          border: `1px solid ${replyStyle === style.id ? 'var(--accent-orange)' : 'var(--border-subtle)'}`,
                          borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.3s'
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 800, color: replyStyle === style.id ? 'white' : 'var(--text-secondary)' }}>
                          {style.label}
                        </div>
                        <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 4 }}>
                          {style.desc}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Actions Row */}
                  <div style={{ display: 'flex', gap: 16 }}>
                    <button
                      onClick={handleGenerateDraft}
                      disabled={generatingDraft}
                      className="cta-btn cta-btn-secondary"
                      style={{ padding: '10px 20px', borderRadius: 'var(--radius-sm)', width: 220 }}
                    >
                      <span className="cta-btn-inner">
                        <span className="cta-btn-text" style={{ fontSize: 11 }}>
                          {generatingDraft ? 'GENERATING DRAFT...' : 'GENERATE AI DRAFT'}
                        </span>
                      </span>
                    </button>
                  </div>

                  {/* Draft Output Text Area */}
                  {replyDraft && (
                    <div className="slide-up-item" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <label className="form-label">Editable Response Draft</label>
                      <textarea
                        value={replyDraft}
                        onChange={e => setReplyDraft(e.target.value)}
                        rows={8}
                        style={{
                          width: '100%',
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: 16,
                          color: 'var(--text-secondary)',
                          fontSize: 12.5,
                          fontFamily: 'JetBrains Mono, monospace',
                          outline: 'none',
                          lineHeight: 1.6,
                          resize: 'vertical'
                        }}
                      />
                      
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={handleSendResponse}
                          disabled={sendingReply}
                          className="cta-btn"
                          style={{ width: 200 }}
                        >
                          <span className="cta-btn-inner">
                            <span className="cta-btn-text">
                              {sendingReply ? 'TRANSMITTING...' : 'APPROVE & DISPATCH'}
                            </span>
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {sendSuccess && (
                    <div className="slide-up-item" style={{
                      padding: '16px',
                      background: 'rgba(62,182,73,0.06)',
                      border: '1px solid rgba(62,182,73,0.2)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--accent-green)',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12
                    }}>
                      <CheckCircle size={16} />
                      <span><strong>✓ SECURE DISPATCH SENT</strong>: Response successfully dispatched back to recipient node. Logged to archive.</span>
                    </div>
                  )}

                </div>
              </div>

            </div>
          ) : (
            <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <Inbox size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
              <span style={{ fontSize: 13 }}>Select a threat log from the inbox list to audit details</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
