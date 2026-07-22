import React from 'react';
import SEOHead, { schemas } from '../utils/seo';
const solutions = [
  {
    id: 'threat-intelligence',
    icon: '🔍',
    title: 'Threat Intelligence Platform',
    tagline: 'Know your adversary before they strike',
    description: 'CyberSentinel\'s Threat Intelligence Platform aggregates, correlates, and enriches threat data from global sources to provide actionable intelligence that your security team can operationalize immediately.',
    features: [
      'Real-time threat feeds from 200+ global intelligence sources',
      'Automated indicator of compromise (IOC) enrichment and scoring',
      'APT group tracking and campaign attribution',
      'Integration with SIEMs, SOARs, and firewalls for automated blocking',
      'Custom threat landscape reports for your industry and geography',
      'Dark web monitoring for credential leaks and brand mentions',
    ],
    benefits: ['Reduce mean time to detect (MTTD) by 65%', 'Proactively block threats before they reach your environment', 'Contextualize alerts with adversary intelligence for faster triage'],
  },
  {
    id: 'email-security',
    icon: '📧',
    title: 'Email Security Gateway',
    tagline: 'AI-powered protection against phishing, BEC, and email-borne threats',
    description: 'Stop the #1 attack vector. CyberSentinel\'s Email Security Gateway uses advanced machine learning to detect and block phishing, business email compromise, malware, and spam before they reach user inboxes.',
    features: [
      'AI phishing detection with 97.3% accuracy on BEC attacks',
      'Real-time URL and attachment sandboxing',
      'Impersonation detection for executive and vendor communications',
      'DMARC, DKIM, and SPF enforcement and monitoring',
      'Automated incident response for confirmed threats',
      'User-reported phishing workflow with SOC triage',
    ],
    benefits: ['Block 99.7% of email threats before delivery', 'Eliminate credential harvesting and invoice fraud', 'Reduce SOC alert volume by 40% through automated triage'],
  },
  {
    id: 'endpoint-protection',
    icon: '💻',
    title: 'Endpoint Detection & Response',
    tagline: 'Behavioral AI that detects what signatures miss',
    description: 'CyberSentinel Shield protects endpoints with behavioral AI that detects and blocks ransomware, fileless malware, and zero-day exploits in real-time — without relying on signatures or daily updates.',
    features: [
      'Behavioral AI engine analyzing 200+ process attributes in real-time',
      'Ransomware rollback — automatically restore encrypted files',
      'Fileless attack detection and prevention',
      'Full attack chain visualization with MITRE ATT&CK mapping',
      'Remote isolation and remediation capabilities',
      'Lightweight agent with <2% CPU impact',
    ],
    benefits: ['Stop ransomware before encryption begins', 'Detect zero-day threats without signature updates', 'Full visibility into every endpoint across your organization'],
  },
  {
    id: 'cloud-security',
    icon: '☁️',
    title: 'Cloud Security Posture Management',
    tagline: 'Secure your cloud at the speed of DevOps',
    description: 'CyberSentinel\'s CSPM continuously monitors your AWS, Azure, and GCP environments for misconfigurations, compliance violations, and security risks — with automated remediation to fix issues before attackers exploit them.',
    features: [
      'Multi-cloud support: AWS, Azure, GCP, and Kubernetes',
      'Continuous compliance monitoring (SOC 2, PCI DSS, HIPAA, CIS, ISO 27001)',
      'Infrastructure-as-code scanning in CI/CD pipelines',
      'Automated remediation for 150+ common misconfigurations',
      'Asset inventory and network visualization',
      'Risk-based prioritization with business context',
    ],
    benefits: ['Achieve compliance 3x faster', 'Reduce cloud misconfigurations by 95%', 'Shift security left without slowing engineering velocity'],
  },
];

export default function SolutionsPage() {
  return (
    <>
      <SEOHead
        title="Solutions"
        description="Explore CyberSentinel's enterprise cybersecurity solutions including Threat Intelligence, Email Security, Endpoint Protection, and Cloud Security."
        path="/solutions"
        structuredData={schemas.webpage('Solutions', 'Explore CyberSentinel\'s cybersecurity solutions and services.', '/solutions')}
      />

      {/* Hero Section */}
      <section className="page-hero">
        <div className="pub-container">
          <span className="section-label">Our Capabilities</span>
          <h1 className="page-hero-title">Unified Security Across Every Surface</h1>
          <p className="page-hero-desc">
            Explore CyberSentinel's comprehensive solutions engineered to detect, prevent, and remediate threat activities in cloud, email, and endpoints.
          </p>
        </div>
      </section>

      {/* Solutions Detail Lists */}
      <section className="page-section">
        <div className="pub-container" style={{ display: 'flex', flexDirection: 'column', gap: 60 }}>
          {solutions.map((sol, idx) => (
            <div
              key={sol.id}
              id={sol.id}
              className="glass-card"
              style={{
                padding: 36, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40,
                borderColor: idx === 0 ? 'rgba(0,122,255,0.2)' : 'var(--border-card)',
                boxShadow: idx === 0 ? '0 0 30px rgba(0,122,255,0.05)' : 'none'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <span style={{ fontSize: 32 }}>{sol.icon}</span>
                <h2 style={{ fontSize: 24, fontWeight: 800 }}>{sol.title}</h2>
                <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{sol.tagline}</p>
                <p style={{ fontSize: 14.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{sol.description}</p>
                
                <div style={{ marginTop: 8 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>Key Business Benefits:</h4>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {sol.benefits.map((b, i) => (
                      <li key={i} style={{ fontSize: 13.5, color: 'var(--accent-green)', fontWeight: 600 }}>✓ {b}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: 13, fontWeight: 750, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>Included Capabilities:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {sol.features.map((feat, i) => (
                    <div key={i} style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, display: 'block' }}>{feat}</span>
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
