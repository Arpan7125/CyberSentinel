import React, { useState, useEffect } from 'react';
import SEOHead, { schemas } from '../utils/seo';
import { saasService } from '../services/api';

const companyTimeline = [
  { year: '2019', title: 'Founded', description: 'CyberSentinel founded in San Francisco with a mission to democratize enterprise cybersecurity through AI-powered threat intelligence.' },
  { year: '2020', title: 'Seed Funding', description: 'Raised $8M seed round led by Andreessen Horowitz. Launched first product: AI-powered email security gateway.' },
  { year: '2021', title: 'Series A & Growth', description: 'Raised $35M Series A. Expanded to 100 employees. Launched endpoint detection & response platform. Achieved SOC 2 Type II certification.' },
  { year: '2022', title: 'Enterprise Expansion', description: 'Signed first Fortune 500 client. Opened London office. Launched managed detection & response (MDR) service. Team grew to 250.' },
  { year: '2023', title: 'Series B', description: 'Raised $120M Series B at $800M valuation. Launched Cloud Security Posture Management. Expanded to 500+ enterprise clients.' },
  { year: '2024', title: 'Global Presence', description: 'Opened Singapore and Tel Aviv offices. Launched CyberSentinel Academy for security education. Processed 1 billion security events daily.' },
  { year: '2025', title: 'Platform Consolidation', description: 'Unified all products into the CyberSentinel Platform. Achieved FedRAMP authorization. Named a Leader in Gartner Magic Quadrant for Endpoint Protection.' },
  { year: '2026', title: 'Today', description: 'Protecting 2,000+ enterprises globally. Processing 5 billion security events daily. 800+ employees across 6 offices worldwide.' },
];

const companyValues = [
  { icon: '🛡️', title: 'Security First', description: 'We practice what we preach. Security is embedded in every decision, from product design to internal operations.' },
  { icon: '🔬', title: 'Relentless Innovation', description: 'The threat landscape evolves daily. We invest heavily in R&D to stay ahead of adversaries through AI, machine learning, and automation.' },
  { icon: '🤝', title: 'Customer Obsession', description: 'Our success is measured by our customers\' security outcomes. We are partners in their security journey, not just vendors.' },
  { icon: '🌍', title: 'Transparency', description: 'We publish our security practices, respond openly to incidents, and believe trust is earned through transparency.' },
  { icon: '📚', title: 'Continuous Learning', description: 'Security professionals never stop learning. We invest in our team\'s growth and share knowledge with the broader community.' },
  { icon: '⚡', title: 'Operational Excellence', description: 'Speed matters in security. We build systems that detect threats in milliseconds and respond to incidents in minutes.' },
];

export default function AboutPage() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const response = await saasService.getTeam();
      setTeamMembers(Array.isArray(response?.results) ? response.results : (Array.isArray(response) ? response : []));
    } catch (err) {
      setError('Failed to load team data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="About Us"
        description="Learn about CyberSentinel's mission, leadership team, and history. We protect over 2,000 global enterprises with AI-powered threat intelligence."
        path="/about"
        structuredData={schemas.webpage('About Us', 'Learn about CyberSentinel\'s history, mission, leadership, and core values.', '/about')}
      />

      {/* Hero Section */}
      <section className="page-hero">
        <div className="pub-container">
          <span className="section-label">Our Mission</span>
          <h1 className="page-hero-title">Securing the Digital Future</h1>
          <p className="page-hero-desc">
            CyberSentinel was founded with a clear purpose: to democratize enterprise-grade cybersecurity through AI-powered threat intelligence, automation, and operational excellence.
          </p>
        </div>
      </section>

      {/* Values Section */}
      <section className="page-section">
        <div className="pub-container">
          <div className="section-header">
            <span className="section-label">Core Values</span>
            <h2 className="section-title-pub">What Drives Us Every Day</h2>
          </div>
          <div className="features-grid">
            {companyValues.map((v, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{v.icon}</div>
                <h3 className="feature-title">{v.title}</h3>
                <p className="feature-desc">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="page-section">
        <div className="pub-container">
          <div className="section-header">
            <span className="section-label">Our Leadership</span>
            <h2 className="section-title-pub">Experienced Security Pioneers</h2>
          </div>
          <div className="features-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {loading ? (
              <div className="state-empty" style={{ gridColumn: '1 / -1' }}>
                <div className="loading-spinner"></div>
                <p>Loading leadership team...</p>
              </div>
            ) : error ? (
              <div className="state-empty" style={{ gridColumn: '1 / -1' }}>
                <span className="state-empty-icon">⚠️</span>
                <p>{error}</p>
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="state-empty" style={{ gridColumn: '1 / -1' }}>
                <span className="state-empty-icon">👥</span>
                <p>Team information is being updated.</p>
              </div>
            ) : (
              teamMembers.map((m, i) => (
                <div key={i} className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', background: m.color || 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700, color: 'white'
                  }}>
                    {m.initials}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>{m.name}</h3>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.role}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{m.bio}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="page-section">
        <div className="pub-container">
          <div className="section-header">
            <span className="section-label">Our Journey</span>
            <h2 className="section-title-pub">Milestones & History</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800, margin: '0 auto' }}>
            {companyTimeline.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 24, borderLeft: '2px solid var(--border-subtle)', paddingLeft: 24, position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: -9, top: 4, width: 16, height: 16, borderRadius: '50%',
                  background: 'var(--accent)', border: '4px solid var(--bg-primary)'
                }} />
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent)' }}>{item.year}</span>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: '4px 0' }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
