import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ShieldAlert, Users, TrendingUp, AlertTriangle, X, Database, Globe, Mail, Phone, MessageSquare, ExternalLink, Calendar, Shield } from 'lucide-react';
import { saasService } from '../../services/api';
import '../../assets/analyzer.css';

/* ── UI Components ─────────────────────────────────────────────── */

function StatCard({ icon: Icon, value, label, color }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)', padding: '24px', borderRadius: '16px', 
      border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)', transition: 'transform 0.2s', cursor: 'default'
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ background: `${color}15`, padding: '16px', borderRadius: '14px', flexShrink: 0 }}>
        <Icon color={color} size={28} />
      </div>
      <div>
        <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '4px' }}>{label}</div>
      </div>
    </div>
  );
}

function ScamModal({ scam, onClose }) {
  if (!scam) return null;

  const isConfirmed = scam.status === 'Confirmed Threat';
  const statusColor = isConfirmed ? '#FF3B30' : '#FF9F0A';

  return (
    <div className="dash-modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, position: 'fixed', inset: 0 }}>
      <div className="dash-modal-content" style={{ maxWidth: '600px', width: '100%', background: 'var(--bg-primary)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
        
        {/* Header */}
        <div style={{ padding: '24px 32px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '4px' }}>{scam.id}</span>
              <span style={{ 
                fontSize: '11px', padding: '4px 10px', borderRadius: '20px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                background: isConfirmed ? 'rgba(255,59,48,0.1)' : 'rgba(255,159,10,0.1)',
                color: statusColor
              }}>
                {scam.status}
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>{scam.title}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Database size={18} color="var(--text-secondary)" />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Threat Type</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{scam.type}</div>
                </div>
             </div>
             
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={18} color="var(--text-secondary)" />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>First Reported</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{scam.date}</div>
                </div>
             </div>
             
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={18} color="var(--text-secondary)" />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Submitted</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{scam.date}</div>
                </div>
             </div>

             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={18} color="var(--text-secondary)" />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Analysis</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>AI & Analyst Verified</div>
                </div>
             </div>
          </div>

          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} color={statusColor} /> Threat Details & Indicators
            </h3>
            <div style={{ 
              background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '20px',
              fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto'
            }}>
              {scam.description || "No detailed description provided for this threat."}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div style={{ padding: '20px 32px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
           <button 
             onClick={onClose}
             style={{ 
               padding: '10px 24px', borderRadius: '8px', border: 'none', background: 'var(--text-primary)', color: 'var(--bg-primary)',
               fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s'
             }}
             onMouseEnter={e => e.currentTarget.style.opacity = 0.9}
             onMouseLeave={e => e.currentTarget.style.opacity = 1}
           >
             Close
           </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────── */

export default function CommunityDatabasePage() {
  const [search, setSearch] = useState('');
  const [scams, setScams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedScam, setSelectedScam] = useState(null);

  useEffect(() => {
    const fetchScams = async () => {
      setLoading(true);
      setError(null);
      try {
        const backendScams = (await saasService.getScamReports()) || [];

        // Reports are shown exactly as submitted. This list used to be padded
        // with four invented entries "to keep database looking rich", and the
        // per-report count was `1 + (s.id % 5)` — a number derived from the row's
        // primary key, not from how many people reported the scam.
        const mapped = backendScams.map((s) => ({
          id: `SC-${10000 + s.id}`,
          title: s.url_or_email,
          type: s.url_or_email.includes('@')
            ? 'Email Phishing'
            : s.url_or_email.includes('http')
              ? 'Website Phishing'
              : 'Social Engineering',
          date: new Date(s.created_at).toLocaleDateString(),
          status:
            s.status === 'verified'
              ? 'Confirmed Threat'
              : s.status === 'investigating'
                ? 'Investigating'
                : 'Pending Verification',
          description: s.description || 'No further detail was submitted with this report.',
        }));

        setScams(mapped);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchScams();
  }, []);

  // Headline figures counted from the reports actually in the database, so an
  // empty database reads as empty instead of "12,405 scams indexed today".
  const summary = useMemo(() => {
    const confirmed = scams.filter((s) => s.status === 'Confirmed Threat').length;
    const byType = scams.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1;
      return acc;
    }, {});
    const top = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];
    return { total: scams.length, confirmed, topType: top ? top[0] : '—' };
  }, [scams]);

  const filteredScams = useMemo(() => {
    if (!search.trim()) return scams;
    const q = search.toLowerCase();
    return scams.filter(s => 
      s.title.toLowerCase().includes(q) || 
      s.id.toLowerCase().includes(q) || 
      s.type.toLowerCase().includes(q) ||
      (s.description && s.description.toLowerCase().includes(q))
    );
  }, [scams, search]);

  return (
    <div className="dash-page">
      <div className="dash-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="dash-title" style={{ fontSize: '32px', marginBottom: '8px' }}>Global Scam Database</h1>
          <p className="dash-subtitle" style={{ fontSize: '15px', maxWidth: '800px', lineHeight: 1.5 }}>
            Access our community-driven database of the latest phishing campaigns, smishing texts, and social engineering scams reported worldwide.
          </p>
        </div>
      </div>

      <div className="dash-content" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <StatCard icon={ShieldAlert} value={loading ? '—' : summary.total.toLocaleString()} label="Reports in the database" color="var(--sev-low)" />
          <StatCard icon={Users} value={loading ? '—' : summary.confirmed.toLocaleString()} label="Confirmed threats" color="var(--accent-violet)" />
          <StatCard icon={TrendingUp} value={loading ? '—' : summary.topType} label="Most reported category" color="var(--sev-critical)" />
        </div>

        {/* Database Section */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          
          {/* Toolbar */}
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
              <input 
                type="text" 
                placeholder="Search database by keyword, phone number, or URL..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ 
                  width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', 
                  padding: '14px 14px 14px 48px', borderRadius: '12px', color: 'var(--text-primary)', 
                  fontSize: '15px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--text-muted)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
              />
            </div>
            <button style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 24px', borderRadius: '12px', 
              background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', 
              fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-primary)'}
            >
              <Filter size={18} /> Filters
            </button>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Threat ID & Title</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reported</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredScams.length === 0 ? (
                   <tr>
                     <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                       {loading
                         ? 'Loading reports…'
                         : error
                           ? (error.message || 'Could not load the report database.')
                           : search.trim()
                             ? `No results found for "${search}"`
                             : 'No scam reports have been submitted yet. Be the first — use the Report a Scam page.'}
                     </td>
                   </tr>
                ) : (
                  filteredScams.map((scam, i) => (
                    <tr key={i} 
                      style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.2s', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      onClick={() => setSelectedScam(scam)}
                    >
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', fontSize: '15px' }}>{scam.title}</div>
                        <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                           <Database size={12} /> {scam.id}
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--bg-primary)', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                           {scam.type === 'Email Phishing' ? <Mail size={14} color="var(--text-muted)"/> : scam.type === 'Smishing' ? <MessageSquare size={14} color="var(--text-muted)"/> : scam.type === 'Website Phishing' ? <Globe size={14} color="var(--text-muted)"/> : <AlertTriangle size={14} color="var(--text-muted)"/> }
                           {scam.type}
                        </span>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>{scam.date}</div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <span style={{ 
                          fontSize: '12px', padding: '6px 12px', borderRadius: '20px', fontWeight: 700, display: 'inline-block',
                          background: scam.status === 'Confirmed Threat' ? 'rgba(255,59,48,0.1)' : 'rgba(255,159,10,0.1)',
                          color: scam.status === 'Confirmed Threat' ? '#FF3B30' : '#FF9F0A'
                        }}>
                          {scam.status}
                        </span>
                      </td>
                      <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                        <button 
                          style={{ 
                            padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', 
                            color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' 
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--text-primary)'; e.currentTarget.style.color = 'var(--bg-primary)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                          onClick={(e) => { e.stopPropagation(); setSelectedScam(scam); }}
                        >
                          View Details <ExternalLink size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '20px', textAlign: 'center', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-primary)' }}>
            <button style={{
               background: 'transparent', border: '1px solid var(--border-subtle)', padding: '10px 24px', borderRadius: '20px',
               color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              Load More Results
            </button>
          </div>
        </div>
      </div>

      {/* Render Modal */}
      <ScamModal scam={selectedScam} onClose={() => setSelectedScam(null)} />
    </div>
  );
}
