import React, { useState, useEffect } from 'react';
import SEOHead, { schemas } from '../utils/seo';
import { saasService } from '../services/api';

const benefits = [
  { icon: '🏥', title: 'Health & Wellness', description: 'Comprehensive medical, dental, and vision coverage for you and your family. Mental health support, gym membership reimbursement, and wellness stipend.' },
  { icon: '💰', title: 'Competitive Compensation', description: 'Top-of-market salary, equity grants, annual performance bonuses, and 401(k) matching up to 6%.' },
  { icon: '🏖️', title: 'Flexible Time Off', description: 'Unlimited PTO with a 15-day minimum. We encourage our team to recharge. Plus 12 paid holidays and volunteer days.' },
  { icon: '🏠', title: 'Remote Flexibility', description: 'Hybrid and remote options available for most roles. $2,000 home office setup stipend for remote employees.' },
  { icon: '📚', title: 'Learning & Development', description: '$5,000 annual learning budget for conferences, courses, and certifications. Access to CyberSentinel Academy and internal mentorship programs.' },
  { icon: '👶', title: 'Parental Leave', description: '16 weeks paid parental leave for all parents, regardless of gender. Gradual return-to-work program and backup childcare benefit.' },
];

export default function CareersPage() {
  const [activeJob, setActiveJob] = useState(null);
  const [jobOpenings, setJobOpenings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await saasService.getJobs();
      setJobOpenings(Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error('Failed to load job openings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (title) => {
    alert(`Thank you for your interest in the ${title} position. Please dispatch your security resume directly to careers@cybersentinel.ai`);
  };

  return (
    <>
      <SEOHead
        title="Careers"
        description="Join the CyberSentinel team. Explore open job positions in threat research, system engineering, and security operations."
        path="/careers"
        structuredData={schemas.webpage('Careers', 'Explore job opportunities at CyberSentinel.', '/careers')}
      />

      {/* Hero Section */}
      <section className="page-hero">
        <div className="pub-container">
          <span className="section-label">We Are Hiring</span>
          <h1 className="page-hero-title">Build the Future of Cybersecurity</h1>
          <p className="page-hero-desc">
            Join a global team of threat intelligence researchers, system developers, and SOC analysts working to secure digital ecosystems.
          </p>
        </div>
      </section>

      {/* Benefits grid display */}
      <section className="page-section">
        <div className="pub-container">
          <div className="section-header">
            <span className="section-label">Team Benefits</span>
            <h2 className="section-title-pub">Why You'll Love Working Here</h2>
          </div>
          <div className="features-grid">
            {benefits.map((b, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{b.icon}</div>
                <h3 className="feature-title">{b.title}</h3>
                <p className="feature-desc">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Openings detailed list */}
      <section className="page-section">
        <div className="pub-container" style={{ maxWidth: 800 }}>
          <div className="section-header">
            <span className="section-label">Open Positions</span>
            <h2 className="section-title-pub">Current Job Opportunities</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {loading ? (
              <div className="state-empty">
                <div className="loading-spinner"></div>
                <p>Loading open roles...</p>
              </div>
            ) : jobOpenings.length === 0 ? (
              <div className="state-empty">
                <span className="state-empty-icon">🤝</span>
                <h3>No Open Positions</h3>
                <p>We are currently fully staffed, but check back soon for new opportunities!</p>
              </div>
            ) : (
              jobOpenings.map((job) => (
                <div key={job.id} className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 17, fontWeight: 800 }}>{job.title}</h3>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                        Department: {job.department} | Location: {job.location} | Type: {job.job_type}
                      </p>
                    </div>
                    <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      Salary: {job.salary}
                    </div>
                  </div>

                  <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{job.description}</p>
                  
                  {activeJob === job.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, borderTop: '1px solid var(--border-subtle)', paddingTop: 16, marginTop: 4 }}>
                      <div>
                        <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Key Responsibilities:</h4>
                        <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {(job.responsibilities || []).map((r, idx) => (
                            <li key={idx} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Role Requirements:</h4>
                        <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {(job.requirements || []).map((r, idx) => (
                            <li key={idx} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r}</li>
                          ))}
                        </ul>
                      </div>

                      <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn-pub btn-pub-primary btn-pub-sm" onClick={() => handleApply(job.title)}>Apply Now</button>
                        <button className="btn-pub btn-pub-secondary btn-pub-sm" onClick={() => setActiveJob(null)}>Show Less</button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn-pub btn-pub-secondary btn-pub-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setActiveJob(job.id)}>
                      View Details & Apply
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}
