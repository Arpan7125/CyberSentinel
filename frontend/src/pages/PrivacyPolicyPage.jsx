import React from 'react';
import SEOHead, { schemas } from '../utils/seo';

export default function PrivacyPolicyPage() {
  return (
    <>
      <SEOHead
        title="Privacy Policy"
        description="Read CyberSentinel's platform privacy policy. Learn how we collect, process, and secure telemetry data."
        path="/privacy"
        structuredData={schemas.webpage('Privacy Policy', 'Data collection and privacy rules.', '/privacy')}
      />

      <section className="page-hero">
        <div className="pub-container">
          <h1 className="page-hero-title">Privacy Policy</h1>
          <p className="page-hero-desc">Last updated: July 8, 2026</p>
        </div>
      </section>

      <section className="page-section">
        <div className="pub-container" style={{ maxWidth: 800 }}>
          <div className="glass-card" style={{ padding: 36, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>1. Telemetry Ingestion Data We Collect</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              CyberSentinel collects security logs, alert details, IP source metrics, and file metadata uploaded during threat scanning runs. We do not inspect the contents of files except for identifying security threat signatures.
            </p>

            <h3 style={{ fontSize: 18, fontWeight: 800 }}>2. How We Utilize Mapped Telemetry</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Ingested telemetry data is utilized exclusively to train anomaly detection models, block malicious command processes, and generate user dashboard reports.
            </p>

            <h3 style={{ fontSize: 18, fontWeight: 800 }}>3. Information Safeguards</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              All ingested logs are encrypted in transit using TLS 1.3 protocols and at rest using AES-256 standards. Log storage retention matches customer settings panel preferences.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
