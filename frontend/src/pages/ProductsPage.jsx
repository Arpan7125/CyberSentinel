import React from 'react';
import SEOHead, { schemas } from '../utils/seo';
const products = [
  {
    id: 'shield',
    name: 'CyberSentinel Shield',
    icon: '🛡️',
    category: 'Endpoint Protection',
    tagline: 'AI-powered endpoint detection and response',
    description: 'Shield protects every endpoint in your organization with behavioral AI that detects, prevents, and responds to threats in real-time. From laptops and servers to containerized workloads, Shield provides comprehensive protection without impacting performance.',
    keyFeatures: ['Behavioral AI detection engine', 'Ransomware prevention & rollback', 'Fileless attack protection', 'MITRE ATT&CK mapping', 'Remote isolation & remediation', 'Threat hunting toolkit'],
  },
  {
    id: 'eye',
    name: 'CyberSentinel Eye',
    icon: '👁️',
    category: 'Security Monitoring',
    tagline: 'Unified security visibility across your entire environment',
    description: 'Eye aggregates and correlates security signals from endpoints, networks, cloud infrastructure, email, and identity providers into a single pane of glass. Powered by advanced analytics, Eye surfaces the threats that matter and suppresses the noise that doesn\'t.',
    keyFeatures: ['Cross-source correlation engine', 'AI-powered alert prioritization', 'Custom detection rules', 'Automated investigation workflows', 'Executive dashboards & reporting', 'API-first architecture'],
  },
  {
    id: 'vault',
    name: 'CyberSentinel Vault',
    icon: '🔒',
    category: 'Data Protection',
    tagline: 'Discover, classify, and protect sensitive data everywhere',
    description: 'Vault automatically discovers and classifies sensitive data across cloud storage, databases, file shares, and SaaS applications. It enforces encryption, access controls, and data loss prevention policies to keep your most valuable assets protected.',
    keyFeatures: ['Automated data discovery & classification', 'DLP policy engine', 'Encryption key management', 'Access governance & monitoring', 'Regulatory compliance reporting', 'Cloud DLP for SaaS applications'],
  },
];

export default function ProductsPage() {
  return (
    <>
      <SEOHead
        title="Products"
        description="Learn about CyberSentinel Shield (endpoint protection), CyberSentinel Eye (security monitoring), and CyberSentinel Vault (data protection)."
        path="/products"
        structuredData={schemas.webpage('Products', 'Explore CyberSentinel\'s security products.', '/products')}
      />

      {/* Hero Section */}
      <section className="page-hero">
        <div className="pub-container">
          <span className="section-label">Enterprise Products</span>
          <h1 className="page-hero-title">Next-Gen Cybersecurity Platform</h1>
          <p className="page-hero-desc">
            Explore our suite of cloud-native security products engineered for automated threat prevention, analytics, and data loss prevention.
          </p>
        </div>
      </section>

      {/* Products list detailed display */}
      <section className="page-section">
        <div className="pub-container" style={{ display: 'flex', flexDirection: 'column', gap: 60 }}>
          {products.map((prod, idx) => (
            <div
              key={prod.id}
              id={prod.id}
              className="glass-card"
              style={{
                padding: 36, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40,
                borderColor: idx === 0 ? 'rgba(0,122,255,0.2)' : 'var(--border-card)'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <span style={{ fontSize: 32 }}>{prod.icon}</span>
                <h2 style={{ fontSize: 24, fontWeight: 800 }}>{prod.name}</h2>
                <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{prod.tagline}</p>
                <p style={{ fontSize: 14.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{prod.description}</p>
              </div>

              <div>
                <h4 style={{ fontSize: 13, fontWeight: 750, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>Key Features:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {prod.keyFeatures.map((feat, i) => (
                    <div key={i} style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
