import React from 'react';
import SEOHead, { schemas } from '../utils/seo';

export default function DocumentationPage() {
  const sections = [
    {
      title: 'Platform Quick Start',
      links: [
        { label: 'Vite & React Frontend Setup', desc: 'Step-by-step guidance to run Vite local development environments.' },
        { label: 'Django REST API Configuration', desc: 'Setup local databases, migrate schemas, and test REST endpoints.' }
      ]
    },
    {
      title: 'API Integrations',
      links: [
        { label: 'OAuth Handshake Workflow', desc: 'Securely sync third-party accounts, like Gmail integration.' },
        { label: 'Custom Webhooks & REST Alerts', desc: 'Construct developer webhook listeners to pipe alert payloads.' }
      ]
    }
  ];

  return (
    <>
      <SEOHead
        title="Documentation"
        description="Read CyberSentinel platform guidelines, developer API integrations guide, and deployment checklists."
        path="/docs"
        structuredData={schemas.webpage('Documentation', 'CyberSentinel Developer & Platform guides.', '/docs')}
      />

      {/* Hero Section */}
      <section className="page-hero">
        <div className="pub-container">
          <span className="section-label">Documentation</span>
          <h1 className="page-hero-title">Platform Guides & API Reference</h1>
          <p className="page-hero-desc">
            Explore complete technical guidelines, webhook payload examples, and api credentials configurations guides.
          </p>
        </div>
      </section>

      {/* Grid listing */}
      <section className="page-section">
        <div className="pub-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 32 }}>
          {sections.map((sec, i) => (
            <div key={i} className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
                {sec.title}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {sec.links.map((link, idx) => (
                  <div key={idx} style={{ cursor: 'pointer' }} onClick={() => alert(`Navigating to document: ${link.label}`)}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{link.label}</h4>
                    <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>{link.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
