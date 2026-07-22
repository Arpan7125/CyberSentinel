import React from 'react';
import SEOHead, { schemas } from '../utils/seo';
const services = [
  {
    id: 'mdr',
    icon: '🛡️',
    title: 'Managed Detection & Response',
    description: 'Our 24/7 Security Operations Center (SOC) provides continuous threat monitoring, investigation, and response — acting as an extension of your security team. CyberSentinel MDR combines expert analysts with AI-powered detection to identify and contain threats in minutes, not hours.',
    highlights: ['24/7/365 monitoring by certified security analysts', 'Mean time to respond under 15 minutes for critical threats', 'Threat hunting campaigns tailored to your environment', 'Monthly security posture reports and quarterly business reviews'],
  },
  {
    id: 'pen-testing',
    icon: '🎯',
    title: 'Penetration Testing',
    description: 'Our offensive security team simulates real-world attacks to identify vulnerabilities before adversaries do. We offer network, application, cloud, and social engineering assessments with detailed remediation guidance.',
    highlights: ['CREST-certified penetration testers', 'Red team exercises simulating APT tactics', 'Web, mobile, API, and infrastructure testing', 'Retesting included to verify remediation effectiveness'],
  },
  {
    id: 'consulting',
    icon: '📋',
    title: 'Security Consulting',
    description: 'From security program development to regulatory compliance, our consulting team helps organizations build and mature their security capabilities. We bring decades of experience across industries and regulatory environments.',
    highlights: ['Security program maturity assessment and roadmap', 'Compliance gap analysis and certification support', 'Security architecture review and design', 'Board-level security briefings and risk assessments'],
  },
  {
    id: 'incident-response',
    icon: '🚨',
    title: 'Incident Response',
    description: 'When a breach occurs, every minute counts. CyberSentinel\'s incident response team provides rapid containment, forensic analysis, and recovery services. We offer both emergency response and proactive retainer agreements.',
    highlights: ['2-hour emergency response SLA', 'Full digital forensics and evidence preservation', 'Ransomware negotiation and recovery', 'Post-incident hardening and lessons learned'],
  },
  {
    id: 'training',
    icon: '🎓',
    title: 'Security Awareness Training',
    description: 'Transform your employees from your biggest vulnerability into your strongest defense. Our training platform delivers engaging, role-specific security education with realistic phishing simulations and behavioral analytics.',
    highlights: ['Continuous micro-learning modules (3-5 minutes each)', 'Realistic phishing simulations tailored to your industry', 'Behavioral analytics and risk scoring per employee', 'Compliance-ready training for PCI DSS, HIPAA, and SOX'],
  },
];

export default function ServicesPage() {
  return (
    <>
      <SEOHead
        title="Services"
        description="Explore CyberSentinel's professional security services including Managed Detection & Response, Penetration Testing, Incident Response, and Security Consulting."
        path="/services"
        structuredData={schemas.webpage('Services', 'Explore CyberSentinel\'s security services.', '/services')}
      />

      {/* Hero Section */}
      <section className="page-hero">
        <div className="pub-container">
          <span className="section-label">Professional Services</span>
          <h1 className="page-hero-title">Expert-Led Defensive & Offensive Security</h1>
          <p className="page-hero-desc">
            Partner with our certified SOC analysts, penetration testers, and incident response experts to secure your operations.
          </p>
        </div>
      </section>

      {/* Services detailed list */}
      <section className="page-section">
        <div className="pub-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
          {services.map((srv) => (
            <div
              key={srv.id}
              id={srv.id}
              className="glass-card"
              style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 28 }}>{srv.icon}</span>
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>{srv.title}</h3>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{srv.description}</p>
              
              <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>Service Highlights:</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {srv.highlights.map((h, i) => (
                    <li key={i} style={{ fontSize: 12.5, color: 'var(--text-primary)', display: 'flex', gap: 6 }}>
                      <span style={{ color: 'var(--accent)' }}>•</span> {h}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
