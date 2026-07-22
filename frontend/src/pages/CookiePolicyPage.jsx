import React from 'react';
import SEOHead, { schemas } from '../utils/seo';

export default function CookiePolicyPage() {
  return (
    <>
      <SEOHead
        title="Cookie Policy"
        description="Learn about the cookies we utilize to authorize user sessions and sync theme parameters."
        path="/cookies"
        structuredData={schemas.webpage('Cookie Policy', 'Usage of cookies on our site.', '/cookies')}
      />

      <section className="page-hero">
        <div className="pub-container">
          <h1 className="page-hero-title">Cookie Policy</h1>
          <p className="page-hero-desc">Last updated: July 8, 2026</p>
        </div>
      </section>

      <section className="page-section">
        <div className="pub-container" style={{ maxWidth: 800 }}>
          <div className="glass-card" style={{ padding: 36, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>1. Essential Session Cookies</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              CyberSentinel utilizes essential session cookies (`cs_token` and `cs_remember`) to authorize user profile data accesses and maintain active session tokens. Disabling cookies will restrict access to authenticated dashboards.
            </p>

            <h3 style={{ fontSize: 18, fontWeight: 800 }}>2. Interface Preferences Cookies</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              We store interface details like manually selected theme attributes (`cs_theme`) and language settings to render correct localizations parameters.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
