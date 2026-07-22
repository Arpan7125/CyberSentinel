import React from 'react';
import SEOHead, { schemas } from '../utils/seo';

export default function TermsPage() {
  return (
    <>
      <SEOHead
        title="Terms & Conditions"
        description="CyberSentinel subscription terms, acceptable usage policies, and platform service agreements."
        path="/terms"
        structuredData={schemas.webpage('Terms', 'Platform usage terms and conditions.', '/terms')}
      />

      <section className="page-hero">
        <div className="pub-container">
          <h1 className="page-hero-title">Terms & Conditions</h1>
          <p className="page-hero-desc">Last updated: July 8, 2026</p>
        </div>
      </section>

      <section className="page-section">
        <div className="pub-container" style={{ maxWidth: 800 }}>
          <div className="glass-card" style={{ padding: 36, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>1. Acceptable Telemetry Usage</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Customers agree not to upload malicious payloads into the scanners with intent to disrupt CyberSentinel host networks. Sandbox execution is intended solely for benign or defensive security evaluations.
            </p>

            <h3 style={{ fontSize: 18, fontWeight: 800 }}>2. Plan Subscriptions billing</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Billing follows pricing tiers calculations. Pro-rated billing calculations apply automatically when adding user seats during active subscription cycles.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
