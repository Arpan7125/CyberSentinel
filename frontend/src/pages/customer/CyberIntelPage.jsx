import React from 'react';
import { Newspaper, ShieldAlert, ArrowRight, ExternalLink } from 'lucide-react';
import '../../assets/analyzer.css';

export default function CyberIntelPage() {
  const articles = [
    {
      title: 'Global Ransomware Surge Targeting Healthcare',
      source: 'CyberSentinel Threat Research',
      date: 'Today',
      category: 'Threat Landscape',
      description: 'A new variant of the LockBit ransomware is exploiting unpatched vulnerabilities in healthcare administration systems worldwide.',
      readTime: '5 min read',
      important: true
    },
    {
      title: 'Zero-Day Vulnerability Found in Popular VPN Client',
      source: 'Security Weekly',
      date: 'Yesterday',
      category: 'Vulnerabilities',
      description: 'CVE-2023-XXXXX allows unauthenticated remote code execution. Patch immediately if you use EnterpriseVPN v10.4 or lower.',
      readTime: '3 min read',
      important: true
    },
    {
      title: 'The Rise of AI-Generated Voice Phishing',
      source: 'CyberSentinel Insights',
      date: '3 days ago',
      category: 'Social Engineering',
      description: 'Scammers are using deepfake audio to mimic the voices of executives, tricking finance departments into authorizing fraudulent wire transfers.',
      readTime: '7 min read',
      important: false
    },
    {
      title: 'NIST Releases Updated Password Guidelines',
      source: 'NIST',
      date: '1 week ago',
      category: 'Compliance',
      description: 'The National Institute of Standards and Technology has revised its digital identity guidelines, dropping the mandatory periodic password reset rule.',
      readTime: '4 min read',
      important: false
    }
  ];

  return (
    <div className="analyzer-page">
      <div className="analyzer-header">
        <h1>Cyber Intel Center</h1>
        <p>Stay informed about the latest cyber threats, vulnerabilities, and security best practices curated by our threat intelligence team.</p>
      </div>

      <div className="analyzer-content" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Featured Alert */}
        <div style={{ background: 'linear-gradient(135deg, rgba(255,69,58,0.1) 0%, rgba(175,82,222,0.1) 100%)', border: '1px solid rgba(255,69,58,0.3)', borderRadius: 12, padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <ShieldAlert color="#FF453A" size={24} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#FF453A' }}>Critical Threat Advisory</h2>
          </div>
          <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Active Exploitation of ConnectWise ScreenConnect</h3>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24, maxWidth: 800 }}>
            CyberSentinel analysts have detected active, widespread exploitation of an authentication bypass vulnerability (CVE-2024-1709) in ConnectWise ScreenConnect. All users must patch to version 23.9.8 immediately.
          </p>
          <button className="btn-pub btn-pub-primary" style={{ background: '#FF453A', color: 'var(--text-primary)', border: 'none' }}>
            Read Mitigation Guide
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
          {['All News', 'Threat Landscape', 'Vulnerabilities', 'Social Engineering', 'Compliance', 'CyberSentinel Updates'].map(f => (
            <button key={f} style={{ 
              background: f === 'All News' ? 'var(--accent)' : 'rgba(255,255,255,0.05)', 
              color: f === 'All News' ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${f === 'All News' ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`, 
              padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
            }}>
              {f}
            </button>
          ))}
        </div>

        {/* Article Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
          {articles.map((article, i) => (
            <div key={i} style={{ 
              background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border-subtle)', 
              padding: 24, display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease', cursor: 'pointer'
            }} className="intel-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ 
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                  color: article.important ? '#FF453A' : 'var(--accent)',
                  background: article.important ? 'rgba(255,69,58,0.1)' : 'rgba(175,82,222,0.1)',
                  padding: '4px 10px', borderRadius: 4
                }}>
                  {article.category}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{article.readTime}</span>
              </div>
              
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, lineHeight: 1.4 }}>{article.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24, flex: 1 }}>{article.description}</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 16, marginTop: 'auto' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{article.source}</div>
                  <div>{article.date}</div>
                </div>
                <div style={{ width: 32, height: 32, borderRadius: 16, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowRight size={16} color="var(--text-secondary)" />
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      <style>{`
        .intel-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255,255,255,0.2) !important;
          background: rgba(255,255,255,0.04) !important;
        }
      `}</style>
    </div>
  );
}
