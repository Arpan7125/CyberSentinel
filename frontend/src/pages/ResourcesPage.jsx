import React from 'react';
import SEOHead, { schemas } from '../utils/seo';

export default function ResourcesPage() {
  const resources = [
    { title: '2026 CyberSentinel Threat Landscape Report', type: 'Whitepaper', desc: 'Detailed intelligence research summarizing active threat vectors, ransomware variants, and cybersecurity predictions.', size: '4.2 MB' },
    { title: 'Zero Trust Implementation Blueprint', type: 'Checklist / PDF', desc: 'A step-by-step checklist guide for IT architects to configure least-privilege network boundaries.', size: '1.8 MB' },
    { title: 'CyberSentinel Platform Overview Sheet', type: 'Data Sheet', desc: 'Product feature checklists, licensing models parameters, and architectural integration summaries.', size: '920 KB' }
  ];

  const handleDownload = (title) => {
    alert(`Initiating download for: ${title}`);
  };

  return (
    <>
      <SEOHead
        title="Resources Hub"
        description="Download whitepapers, security checklists, platform data sheets, and security tool integrations blueprints."
        path="/resources"
        structuredData={schemas.webpage('Resources', 'Download CyberSentinel whitepapers and checklists.', '/resources')}
      />

      {/* Hero Section */}
      <section className="page-hero">
        <div className="pub-container">
          <span className="section-label">Resources Center</span>
          <h1 className="page-hero-title">Whitepapers, Checklists, & Tech sheets</h1>
          <p className="page-hero-desc">
            Download our latest security reports, integration blueprints, and tactical checklists written by our incident response teams.
          </p>
        </div>
      </section>

      {/* Resources grid display */}
      <section className="page-section">
        <div className="pub-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
          {resources.map((res, i) => (
            <div key={i} className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span className="badge badge-admin" style={{ padding: '3px 8px', width: 'fit-content' }}>{res.type}</span>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginTop: 4 }}>{res.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{res.desc}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Size: {res.size}</span>
                <button className="btn-pub btn-pub-primary btn-pub-sm" onClick={() => handleDownload(res.title)}>
                  Download ⬇
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
