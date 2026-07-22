import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead, { schemas } from '../utils/seo';
import ScrollReveal from '../components/ui/ScrollReveal';
import { ShieldAlert, Mail, Monitor, Cloud, ShieldCheck, Lock } from 'lucide-react';

const features = [
  { icon: <ShieldAlert size={24} />, title: 'AI Threat Intelligence', desc: 'Real-time threat feeds from global sources, enriched with machine learning for actionable insights.' },
  { icon: <Mail size={24} />, title: 'Email Security', desc: 'Advanced phishing detection powered by NLP and behavioral analysis — stops BEC and credential harvesting.' },
  { icon: <Monitor size={24} />, title: 'Endpoint Protection', desc: 'Behavioral AI detects ransomware, fileless malware, and zero-day exploits without relying on signatures.' },
  { icon: <Cloud size={24} />, title: 'Cloud Security', desc: 'Continuous posture management for cloud environments — finds misconfigurations before attackers do.' },
  { icon: <ShieldCheck size={24} />, title: 'Managed Detection', desc: '24/7 SOC monitoring with expert analysts who investigate, contain, and respond to threats rapidly.' },
  { icon: <Lock size={24} />, title: 'Data Protection', desc: 'Automated data discovery, classification, and DLP enforcement across cloud and on-premises environments.' },
];

export default function HomePage() {
  return (
    <>
      <SEOHead
        title=""
        description="CyberSentinel delivers AI-powered threat intelligence, endpoint protection, and managed detection & response for enterprises worldwide. Protect your organization with next-generation cybersecurity."
        path="/"
        structuredData={schemas.organization()}
      />

      {/* ── HERO ── */}
      <section className="hero-section" aria-label="Hero">
        <div className="hero-bg-effects">
          <div className="hero-gradient" />
          <div className="hero-grid-pattern" />
        </div>
        <div className="pub-container hero-content" style={{ gridTemplateColumns: '1fr', textAlign: 'center' }}>
          <div className="hero-text" style={{ alignItems: 'center', margin: '0 auto' }}>
            <ScrollReveal delay={0}>
              <div className="hero-badge"><ShieldCheck size={14} /> Enterprise-Grade Security</div>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <h1 className="hero-title" style={{ maxWidth: 800 }}>
                Cybersecurity That<br />
                <span className="hero-gradient-text">Thinks Ahead</span>
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <p className="hero-subtitle" style={{ maxWidth: 640 }}>
                AI-powered threat intelligence, endpoint protection, and managed detection & response — unified in a single platform that detects threats before they become breaches.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <div className="hero-actions" style={{ justifyContent: 'center' }}>
                <Link to="/contact" className="btn-pub btn-pub-primary btn-pub-lg">Get a Free Demo</Link>
                <Link to="/solutions" className="btn-pub btn-pub-ghost btn-pub-lg">Explore Solutions →</Link>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={400}>
              <div className="hero-trust-text" style={{ justifyContent: 'center', marginTop: 16 }}>
                <ShieldCheck size={16} style={{ color: 'var(--accent)' }} />
                SOC 2 Type II Certified · ISO 27001 Compliant · GDPR Ready
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="features-section" aria-label="Platform capabilities">
        <div className="pub-container">
          <ScrollReveal>
            <div className="section-header">
              <span className="section-label">Platform Capabilities</span>
              <h2 className="section-title-pub">One Platform, Complete Protection</h2>
              <p className="section-desc">From email inboxes to cloud infrastructure, CyberSentinel covers every attack surface with AI-powered detection and automated response.</p>
            </div>
          </ScrollReveal>
          <div className="features-grid">
            {features.map((f, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div className="feature-card" style={{ height: '100%' }}>
                  <div className="feature-icon" style={{ color: 'var(--accent)' }}>{f.icon}</div>
                  <h3 className="feature-title">{f.title}</h3>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="how-section" aria-label="How it works">
        <div className="pub-container">
          <ScrollReveal>
            <div className="section-header">
              <span className="section-label">Methodology</span>
              <h2 className="section-title-pub">Detect. Investigate. Respond.</h2>
            </div>
          </ScrollReveal>
          <div className="how-steps">
            <ScrollReveal className="how-step" delay={0}>
              <div className="how-number">01</div>
              <h3>Continuous Monitoring</h3>
              <p>CyberSentinel ingests security telemetry from endpoints, networks, cloud, email, and identity systems, providing complete visibility across your digital estate.</p>
            </ScrollReveal>
            <div className="how-connector" />
            <ScrollReveal className="how-step" delay={200}>
              <div className="how-number">02</div>
              <h3>AI-Powered Detection</h3>
              <p>Our machine learning models analyze behavioral patterns, network anomalies, and threat intelligence to identify sophisticated attacks that signature-based tools miss.</p>
            </ScrollReveal>
            <div className="how-connector" />
            <ScrollReveal className="how-step" delay={400}>
              <div className="how-number">03</div>
              <h3>Rapid Response</h3>
              <p>When a threat is confirmed, CyberSentinel automatically isolates affected systems, blocks malicious activity, and alerts your security team to contain the incident.</p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section" aria-label="Call to action">
        <ScrollReveal className="pub-container cta-content">
          <h2 className="cta-title">Ready to Secure Your Organization?</h2>
          <p className="cta-desc">Start your evaluation today. See how CyberSentinel protects your environment with next-generation security operations.</p>
          <div className="cta-actions">
            <Link to="/contact" className="btn-pub btn-pub-primary btn-pub-lg">Request Evaluation</Link>
            <Link to="/pricing" className="btn-pub btn-pub-outline btn-pub-lg">View Pricing</Link>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
