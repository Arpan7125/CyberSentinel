import React, { useState } from 'react';
import { Search, Filter, ShieldAlert, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import '../../assets/analyzer.css';

export default function CommunityDatabasePage() {
  const [search, setSearch] = useState('');

  const scams = [
    { id: 'SC-9241', title: 'Fake PayPal Invoice (GeekSquad)', type: 'Email Phishing', date: '2 hours ago', reports: 124, status: 'Confirmed Threat' },
    { id: 'SC-9240', title: 'Crypto Giveaway on X', type: 'Social Media', date: '4 hours ago', reports: 56, status: 'Investigating' },
    { id: 'SC-9239', title: 'USPS Missed Package SMS', type: 'Smishing', date: '5 hours ago', reports: 890, status: 'Confirmed Threat' },
    { id: 'SC-9238', title: 'LinkedIn Job Offer Advance Fee', type: 'Employment', date: '1 day ago', reports: 34, status: 'Confirmed Threat' }
  ];

  return (
    <div className="analyzer-page">
      <div className="analyzer-header">
        <h1>Global Scam Database</h1>
        <p>Access our community-driven database of the latest phishing campaigns, smishing texts, and social engineering scams reported worldwide.</p>
      </div>

      <div className="analyzer-content" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
          <div style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 12, border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: 'rgba(50,215,75,0.1)', padding: 12, borderRadius: 12 }}><ShieldAlert color="#32D74B" size={24} /></div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>12,405</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Scams Indexed Today</div>
            </div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 12, border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: 'rgba(175,82,222,0.1)', padding: 12, borderRadius: 12 }}><Users color="#AF52DE" size={24} /></div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>45.2K</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Community Reports (24h)</div>
            </div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 12, border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: 'rgba(255,69,58,0.1)', padding: 12, borderRadius: 12 }}><TrendingUp color="#FF453A" size={24} /></div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>Smishing</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Top Trending Threat</div>
            </div>
          </div>
        </div>

        {/* Database Search & List */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
          <div style={{ padding: 20, borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 16, top: 12, color: 'var(--text-muted)' }} size={18} />
              <input 
                type="text" 
                placeholder="Search database by keyword, phone number, or URL..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', padding: '12px 12px 12px 48px', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
              />
            </div>
            <button className="btn-pub btn-pub-ghost" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={16} /> Filters
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Threat ID & Title</th>
                <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reported</th>
                <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {scams.map((scam, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{scam.title}</div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{scam.id}</div>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>{scam.type}</td>
                  <td style={{ padding: '16px 20px', fontSize: 13 }}>
                    <div style={{ color: 'var(--text-primary)' }}>{scam.date}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{scam.reports} reports</div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ 
                      fontSize: 11, padding: '4px 10px', borderRadius: 20, fontWeight: 600,
                      background: scam.status === 'Confirmed Threat' ? 'rgba(255,69,58,0.1)' : 'rgba(255,159,10,0.1)',
                      color: scam.status === 'Confirmed Threat' ? '#FF453A' : '#FF9F0A'
                    }}>
                      {scam.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <button className="btn-pub btn-pub-ghost btn-pub-sm">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ padding: 20, textAlign: 'center', borderTop: '1px solid var(--border-subtle)' }}>
            <button className="btn-pub btn-pub-ghost btn-pub-sm">Load More Results</button>
          </div>
        </div>

      </div>
    </div>
  );
}
