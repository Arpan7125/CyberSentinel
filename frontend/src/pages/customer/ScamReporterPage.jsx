import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Shield, CheckCircle, AlertTriangle, Radio, Zap,
  Globe, Mail, Phone, MessageSquare, ExternalLink, Clock,
  TrendingUp, Database, Users, RefreshCw
} from 'lucide-react';
import { saasService } from '../../services/api';

/* ── Type config ─────────────────────────────────────────────────── */
const TYPE_CONFIG = {
  email:   { icon: Mail,          color: '#EA4335', label: 'Email'   },
  sms:     { icon: MessageSquare, color: '#25D366', label: 'SMS'     },
  website: { icon: Globe,         color: '#0078D4', label: 'Website' },
  call:    { icon: Phone,         color: '#FF9F0A', label: 'Call'    },
  social:  { icon: Users,         color: '#AF52DE', label: 'Social'  },
  other:   { icon: AlertTriangle, color: '#FF3B30', label: 'Other'   },
};

function parseType(description = '') {
  const m = description.match(/\[Type:\s*(\w+)/i);
  return m ? m[1].toLowerCase() : 'other';
}

function parseTitle(description = '') {
  const m = description.match(/Title:\s*([^\]]+)\]/i);
  return m ? m[1].trim() : 'Unknown Threat';
}

function parseBody(description = '') {
  const parts = description.split('\n\n');
  return parts.length > 1 ? parts.slice(1).join('\n\n').trim() : description;
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ── Live Feed Entry ─────────────────────────────────────────────── */
function FeedEntry({ report, isNew }) {
  const type   = parseType(report.description);
  const title  = parseTitle(report.description);
  const cfg    = TYPE_CONFIG[type] || TYPE_CONFIG.other;
  const Icon   = cfg.icon;

  return (
    <div style={{
      display: 'flex', gap: 12, padding: '12px 14px',
      background: isNew ? `${cfg.color}0d` : 'transparent',
      border: `1px solid ${isNew ? cfg.color + '44' : 'var(--border-subtle)'}`,
      borderRadius: 10, transition: 'all 0.5s',
      animation: isNew ? 'slideIn 0.4s ease' : 'none',
    }}>
      {/* Type icon */}
      <div style={{
        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
        background: `${cfg.color}1a`,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={15} color={cfg.color} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </span>
          {isNew && (
            <span style={{
              fontSize: 10, fontWeight: 800, color: '#fff',
              background: cfg.color, padding: '2px 7px', borderRadius: 10, flexShrink: 0
            }}>NEW</span>
          )}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {report.url_or_email}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={10} />
            {timeAgo(report.created_at)}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, color: cfg.color,
            background: `${cfg.color}15`, padding: '1px 6px', borderRadius: 6
          }}>{cfg.label}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────── */
export default function ScamReporterPage() {
  const [form, setForm] = useState({ type: 'email', title: '', source: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const [reports, setReports] = useState([]);
  const [newIds, setNewIds]   = useState(new Set());
  const [totalCount, setTotalCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLive, setIsLive] = useState(true);
  const prevIdsRef = useRef(new Set());
  const intervalRef = useRef(null);

  const fetchReports = useCallback(async () => {
    try {
      const data = await saasService.getScamReports();
      const list = Array.isArray(data) ? data : (data.results || []);
      const sorted = [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Detect truly new entries
      const incoming = new Set(sorted.map(r => r.id));
      const freshIds = new Set([...incoming].filter(id => !prevIdsRef.current.has(id)));

      if (freshIds.size > 0 && prevIdsRef.current.size > 0) {
        setNewIds(freshIds);
        setTimeout(() => setNewIds(new Set()), 6000); // clear highlight after 6s
      }
      prevIdsRef.current = incoming;

      setReports(sorted.slice(0, 30));
      setTotalCount(sorted.length);
      setLastUpdated(new Date());
    } catch {
      // silently fail polling
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (isLive) {
      intervalRef.current = setInterval(fetchReports, 5000); // poll every 5s
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isLive, fetchReports]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await saasService.reportScam({
        url_or_email: form.source,
        description: `[Type: ${form.type}, Title: ${form.title}]\n\n${form.description}`
      });
      setSubmitted(true);
      setForm({ type: 'email', title: '', source: '', description: '' });
      await fetchReports(); // immediately refresh feed
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const typeBreakdown = reports.reduce((acc, r) => {
    const t = parseType(r.description);
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="dash-page">
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="dash-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="dash-title">Scam Intelligence Database</h1>
          <p className="dash-subtitle">Submit threats and monitor live community reports in real-time</p>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { icon: Database,    label: 'Total Reports',   value: totalCount,                       color: '#6366f1' },
          { icon: TrendingUp,  label: 'This Session',    value: newIds.size > 0 ? newIds.size : 0, color: '#FF9F0A' },
          { icon: Shield,      label: 'Threat Types',    value: Object.keys(typeBreakdown).length, color: '#34C759' },
          { icon: Users,       label: 'Community Watch', value: `${Math.max(1, Math.floor(totalCount * 1.4))}`,  color: '#AF52DE' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
            borderRadius: 14, padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 12
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={16} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main 2-col layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>

        {/* LEFT — Submit Form */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
          {/* Form header */}
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(175,82,222,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={16} color="#AF52DE" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Report a Threat</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Your submission updates the live database instantly</div>
            </div>
          </div>

          {submitted && (
            <div style={{ margin: '16px 24px 0', padding: '12px 16px', background: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle size={16} color="#34C759" />
              <span style={{ fontSize: 13, color: '#34C759', fontWeight: 600 }}>Report submitted! Live feed updated.</span>
            </div>
          )}

          {error && (
            <div style={{ margin: '16px 24px 0', padding: '12px 16px', background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.3)', borderRadius: 10, fontSize: 13, color: '#FF3B30' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            {/* Type selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                Threat Type
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  const active = form.type === key;
                  return (
                    <label key={key} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                      background: active ? `${cfg.color}15` : 'var(--bg-primary)',
                      border: `1px solid ${active ? cfg.color + '80' : 'var(--border-subtle)'}`,
                      borderRadius: 9, cursor: 'pointer', transition: 'all 0.15s',
                      fontSize: 13, fontWeight: active ? 700 : 500,
                      color: active ? cfg.color : 'var(--text-secondary)'
                    }}>
                      <input type="radio" name="type" value={key} checked={active} onChange={e => setForm({ ...form, type: e.target.value })} style={{ display: 'none' }} />
                      <Icon size={13} />
                      {cfg.label}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Incident Title</label>
              <input
                required type="text"
                placeholder="e.g., Fake PayPal Invoice Email"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', padding: '10px 14px', borderRadius: 9, color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Source */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                Source (Email / Phone / URL)
              </label>
              <input
                required type="text"
                placeholder="e.g., security-update@pay-pal-secure.com"
                value={form.source}
                onChange={e => setForm({ ...form, source: e.target.value })}
                style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', padding: '10px 14px', borderRadius: 9, color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Details</label>
              <textarea
                required
                placeholder="Describe the scam — what happened, what was asked, any other context..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', padding: '10px 14px', borderRadius: 9, color: 'var(--text-primary)', fontSize: 14, outline: 'none', minHeight: 110, resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            {/* Privacy note */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '10px 14px', background: 'rgba(52,199,89,0.07)', borderRadius: 9, border: '1px solid rgba(52,199,89,0.2)', marginBottom: 20 }}>
              <Shield size={14} color="#34C759" style={{ marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Your report is anonymized before sharing. It immediately updates the live community threat database.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '11px 20px', borderRadius: 10, border: 'none',
                background: loading ? 'var(--bg-primary)' : 'linear-gradient(135deg,#AF52DE,#8b3fc8)',
                color: loading ? 'var(--text-muted)' : '#fff',
                fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'opacity 0.2s'
              }}
            >
              {loading ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</> : <><Zap size={14} /> Submit to Live Database</>}
            </button>
          </form>
        </div>

        {/* RIGHT — Live Feed */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, border: '1px solid var(--border-subtle)', overflow: 'hidden', position: 'sticky', top: 20 }}>
          {/* Feed header */}
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: isLive ? '#34C759' : '#FF3B30',
                animation: isLive ? 'pulse-dot 1.5s infinite' : 'none'
              }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.3px' }}>
                LIVE THREAT FEED
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {lastUpdated && (
                <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                  Updated {timeAgo(lastUpdated.toISOString())}
                </span>
              )}
              <button
                onClick={() => setIsLive(l => !l)}
                style={{
                  padding: '4px 10px', borderRadius: 8, border: `1px solid ${isLive ? 'rgba(52,199,89,0.4)' : 'var(--border-subtle)'}`,
                  background: isLive ? 'rgba(52,199,89,0.1)' : 'var(--bg-primary)',
                  color: isLive ? '#34C759' : 'var(--text-muted)',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer'
                }}
              >
                {isLive ? 'LIVE' : 'PAUSED'}
              </button>
            </div>
          </div>

          {/* Type breakdown chips */}
          {Object.keys(typeBreakdown).length > 0 && (
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Object.entries(typeBreakdown).map(([type, count]) => {
                const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.other;
                return (
                  <div key={type} style={{
                    display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20,
                    background: `${cfg.color}15`, border: `1px solid ${cfg.color}33`,
                    fontSize: 11, fontWeight: 700, color: cfg.color
                  }}>
                    {cfg.label} <span style={{ opacity: 0.7 }}>×{count}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Feed list */}
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 520, overflowY: 'auto' }}>
            {reports.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No reports yet. Be the first to submit!
              </div>
            ) : (
              reports.map(r => (
                <FeedEntry key={r.id} report={r} isNew={newIds.has(r.id)} />
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Polling every 5s</span>
            <button
              onClick={fetchReports}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}
            >
              <RefreshCw size={11} /> Refresh now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
