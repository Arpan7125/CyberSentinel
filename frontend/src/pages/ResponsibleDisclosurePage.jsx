import React from 'react';
import SEOHead, { schemas } from '../utils/seo';

export default function ResponsibleDisclosurePage() {
  return (
    <>
      <SEOHead
        title="Responsible Disclosure"
        description="Submit vulnerabilities found in CyberSentinel platforms. Review guidelines, scope, and reward structures."
        path="/responsible-disclosure"
        structuredData={schemas.webpage('Disclosure Policy', 'Responsible vulnerability reporting guidelines.', '/responsible-disclosure')}
      />

      <section className="page-hero">
        <div className="pub-container">
          <h1 className="page-hero-title">Responsible Disclosure</h1>
          <p className="page-hero-desc">Last updated: July 8, 2026</p>
        </div>
      </section>

      <section className="page-section">
        <div className="pub-container" style={{ maxWidth: 800 }}>
          <div className="glass-card" style={{ padding: 36, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>1. Reporting Guidelines</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              If you discover a vulnerability in CyberSentinel software or server systems, please email your proof-of-concept logs immediately to security@cybersentinel.ai. Give us at least 48 hours to patch the bug before publishing details.
            </p>

            <h3 style={{ fontSize: 18, fontWeight: 800 }}>2. Out of Scope Assessments</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Social engineering attacks targeting employees, physical data center intrusion attempts, and volumetric DDoS checks are strictly out of scope.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
