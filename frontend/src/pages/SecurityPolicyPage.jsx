import React from 'react';
import SEOHead, { schemas } from '../utils/seo';

export default function SecurityPolicyPage() {
  return (
    <>
      <SEOHead
        title="Security Policy"
        description="Learn about CyberSentinel's platform security parameters, physical defenses, and internal audits rules."
        path="/security"
        structuredData={schemas.webpage('Security Policy', 'Information security policies.', '/security')}
      />

      <section className="page-hero">
        <div className="pub-container">
          <h1 className="page-hero-title">Security Policy</h1>
          <p className="page-hero-desc">Last updated: July 8, 2026</p>
        </div>
      </section>

      <section className="page-section">
        <div className="pub-container" style={{ maxWidth: 800 }}>
          <div className="glass-card" style={{ padding: 36, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>1. Infrastructure Protections</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              CyberSentinel platform hosts are deployed inside Tier-IV data centers protected by multi-factor biometric checks, 24/7 surveillance cameras, and redundant backup power grids.
            </p>

            <h3 style={{ fontSize: 18, fontWeight: 800 }}>2. Information Encryptions</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              We enforce HTTPS connection standards carrying TLS 1.3 encryption configurations. Databases are protected using AES-256 block ciphers with automated key rotations.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
