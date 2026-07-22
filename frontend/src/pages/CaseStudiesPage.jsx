import React, { useState, useEffect } from 'react';
import SEOHead, { schemas } from '../utils/seo';
import { saasService } from '../services/api';

export default function CaseStudiesPage() {
  const [caseStudies, setCaseStudies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCaseStudies();
  }, []);

  const fetchCaseStudies = async () => {
    try {
      setLoading(true);
      const data = await saasService.getCaseStudies();
      setCaseStudies(Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error('Failed to load case studies:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Case Studies"
        description="Read customer success stories about CyberSentinel deployment in financial services, healthcare networks, and cloud SaaS platforms."
        path="/case-studies"
        structuredData={schemas.webpage('Case Studies', 'Explore CyberSentinel customer success stories.', '/case-studies')}
      />

      {/* Hero Section */}
      <section className="page-hero">
        <div className="pub-container">
          <span className="section-label">Customer Success</span>
          <h1 className="page-hero-title">Proven Protection in Production</h1>
          <p className="page-hero-desc">
            Explore how global banks, clinical healthcare networks, and scale SaaS organizations secure their operations with CyberSentinel.
          </p>
        </div>
      </section>

      {/* Case studies list detailed display */}
      <section className="page-section">
        <div className="pub-container" style={{ display: 'flex', flexDirection: 'column', gap: 60 }}>
          {loading ? (
            <div className="state-empty" style={{ gridColumn: '1 / -1' }}>
              <div className="loading-spinner"></div>
              <p>Loading customer success stories...</p>
            </div>
          ) : caseStudies.length === 0 ? (
            <div className="state-empty" style={{ gridColumn: '1 / -1' }}>
              <span className="state-empty-icon">📈</span>
              <h3>No Case Studies Found</h3>
              <p>Check back soon for new customer success stories!</p>
            </div>
          ) : (
            caseStudies.map((caseStudy) => (
              <div
                key={caseStudy.id}
                className="glass-card"
                style={{ padding: 36, display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
                  <div>
                    <span style={{ fontSize: 32 }}>{caseStudy.logo}</span>
                    <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 8 }}>{caseStudy.title}</h2>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Industry: {caseStudy.industry}</p>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>
                    {caseStudy.timeline}
                  </div>
                </div>

                {/* Grid: challenge vs metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 750, textTransform: 'uppercase', color: 'var(--accent-red)', marginBottom: 6 }}>The Challenge:</h4>
                      <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{caseStudy.challenge}</p>
                    </div>
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 750, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 6 }}>The Solution:</h4>
                      <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{caseStudy.solution}</p>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 750, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>Confirmed Outcomes:</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      {(caseStudy.results || []).map((res, i) => (
                        <div key={i} style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent-green)' }}>{res.metric}</div>
                          <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>{res.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Testimonial Quote */}
                {caseStudy.testimonial && caseStudy.testimonial.quote && (
                  <div style={{ background: 'var(--bg-secondary)', padding: 20, borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent)', marginTop: 8 }}>
                    <blockquote style={{ fontSize: 13.5, fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      "{caseStudy.testimonial.quote}"
                    </blockquote>
                    <div style={{ fontSize: 12, fontWeight: 700, marginTop: 8, color: 'var(--text-primary)' }}>
                      — {caseStudy.testimonial.author}, {caseStudy.testimonial.company}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
