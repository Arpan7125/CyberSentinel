import React from 'react';
import SEOHead, { schemas } from '../utils/seo';

export default function TrustCenterPage() {
  const complianceItems = [
    { title: 'SOC 2 Type II Certified', body: 'Third-party audited security controls verification demonstrating continuous operational safety and trust.' },
    { title: 'ISO/IEC 27001 Alignment', body: 'Rigorous alignment with international benchmarks for organizing information security management systems (ISMS).' },
    { title: 'GDPR / HIPAA Readiness', body: 'Built-in privacy architectures supporting patient data protection (PHI) and user data deletion compliance.' }
  ];

  return (
    <>
      <SEOHead
        title="Trust Center"
        description="Verify CyberSentinel's platform security policies, compliance certifications, data protection measures, and encryption."
        path="/trust"
        structuredData={schemas.webpage('Trust Center', 'Security & Compliance at CyberSentinel.', '/trust')}
      />

      {/* Hero Section */}
      <section className="page-hero">
        <div className="pub-container">
          <span className="section-label">Trust Center</span>
          <h1 className="page-hero-title">Security & Compliance Safeguards</h1>
          <p className="page-hero-desc">
            We hold ourselves to the highest standards. Explore our compliance certificates, security reports, and data privacy controls.
          </p>
        </div>
      </section>

      {/* Trust Items detailed display */}
      <section className="page-section">
        <div className="pub-container" style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800 }}>
          {complianceItems.map((item, idx) => (
            <div key={idx} className="glass-card" style={{ padding: 24, display: 'flex', gap: 20 }}>
              <div style={{ fontSize: 32 }}>🛡️</div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800 }}>{item.title}</h3>
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.6 }}>{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
