import React from 'react';
import SEOHead, { schemas } from '../utils/seo';
const industries = [
  {
    id: 'financial-services',
    icon: '🏦',
    title: 'Financial Services',
    description: 'Protect customer financial data, meet regulatory requirements (PCI DSS, SOX, GLBA), and defend against sophisticated financial fraud. CyberSentinel serves banks, insurance companies, investment firms, and fintech startups.',
    threats: ['Business email compromise targeting wire transfers', 'ATM jackpotting and card skimming networks', 'Insider trading facilitated by data theft', 'Regulatory fines from compliance failures'],
  },
  {
    id: 'healthcare',
    icon: '🏥',
    title: 'Healthcare',
    description: 'Safeguard patient health information (PHI), ensure HIPAA compliance, and protect medical devices and clinical systems from cyber threats. Healthcare organizations face unique risks due to legacy systems and life-safety implications.',
    threats: ['Ransomware targeting EHR and clinical systems', 'PHI theft for insurance fraud', 'Medical device vulnerabilities', 'Third-party vendor access to clinical networks'],
  },
  {
    id: 'government',
    icon: '🏛️',
    title: 'Government & Public Sector',
    description: 'Defend critical infrastructure, citizen data, and democratic institutions from nation-state actors and cybercriminals. CyberSentinel holds FedRAMP Moderate authorization and meets NIST 800-53 requirements.',
    threats: ['Nation-state espionage campaigns', 'Critical infrastructure disruption', 'Citizen data theft and identity fraud', 'Election security threats'],
  },
  {
    id: 'education',
    icon: '🎓',
    title: 'Education',
    description: 'Protect student data, research intellectual property, and educational infrastructure with solutions designed for limited security budgets and diverse user populations.',
    threats: ['Student record theft (FERPA violations)', 'Research IP theft by nation-state actors', 'Ransomware targeting school districts', 'Phishing targeting faculty and staff'],
  },
  {
    id: 'retail',
    icon: '🛍️',
    title: 'Retail & E-Commerce',
    description: 'Secure point-of-sale systems, e-commerce platforms, and customer payment data. Retail organizations face unique challenges with distributed locations, seasonal staffing, and PCI DSS compliance.',
    threats: ['Payment card data theft (POS malware)', 'E-commerce fraud and account takeover', 'Supply chain compromise', 'Customer loyalty program abuse'],
  },
  {
    id: 'manufacturing',
    icon: '🏭',
    title: 'Manufacturing',
    description: 'Protect operational technology (OT), industrial control systems (ICS), and intellectual property from cyber threats. Modern manufacturing converges IT and OT networks, creating new attack surfaces.',
    threats: ['Ransomware disrupting production lines', 'IP theft of manufacturing processes and designs', 'OT/ICS exploitation and sabotage', 'Supply chain disruption attacks'],
  },
];

export default function IndustriesPage() {
  return (
    <>
      <SEOHead
        title="Industries"
        description="Learn how CyberSentinel protects key industries including Financial Services, Healthcare, Government, Education, and Manufacturing."
        path="/industries"
        structuredData={schemas.webpage('Industries', 'Explore CyberSentinel\'s security solutions by industry.', '/industries')}
      />

      {/* Hero Section */}
      <section className="page-hero">
        <div className="pub-container">
          <span className="section-label">Industries We Serve</span>
          <h1 className="page-hero-title">Custom-Fit Protection for Your Sector</h1>
          <p className="page-hero-desc">
            CyberSentinel delivers compliance-ready, purpose-built protection systems for organizations operating in highly regulated fields.
          </p>
        </div>
      </section>

      {/* Industries grid display */}
      <section className="page-section">
        <div className="pub-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
          {industries.map((ind) => (
            <div
              key={ind.id}
              className="glass-card"
              style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 28 }}>{ind.icon}</span>
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>{ind.title}</h3>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{ind.description}</p>
              
              <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-red)', marginBottom: 12 }}>Critical Threat Vectors:</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {ind.threats.map((t, i) => (
                    <li key={i} style={{ fontSize: 12.5, color: 'var(--text-primary)', display: 'flex', gap: 6 }}>
                      <span style={{ color: 'var(--accent-red)' }}>•</span> {t}
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
