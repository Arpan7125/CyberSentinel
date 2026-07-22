import React, { useState, useEffect } from 'react';
import SEOHead, { schemas } from '../utils/seo';
import Accordion from '../components/ui/Accordion';
import { saasService } from '../services/api';

export default function PricingPage() {
  const [plans, setPlans] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, faqsRes] = await Promise.all([
        saasService.getPlans(),
        saasService.getFAQs('?category=Pricing')
      ]);
      setPlans(Array.isArray(plansRes?.results) ? plansRes.results : (Array.isArray(plansRes) ? plansRes : []));
      setFaqs(Array.isArray(faqsRes?.results) ? faqsRes.results : (Array.isArray(faqsRes) ? faqsRes : []));
    } catch (err) {
      setError('Failed to load pricing information.');
    } finally {
      setLoading(false);
    }
  };
  const formatPrice = (p) => {
    if (p === null) return 'Custom';
    return `$${p}`;
  };

  return (
    <>
      <SEOHead
        title="Pricing Plans"
        description="View pricing plans for CyberSentinel platform. Compare Starter, Professional, and custom Enterprise subscription features."
        path="/pricing"
        structuredData={schemas.webpage('Pricing', 'Check CyberSentinel pricing options.', '/pricing')}
      />

      {/* Hero Section */}
      <section className="page-hero">
        <div className="pub-container">
          <span className="section-label">Transparent Plans</span>
          <h1 className="page-hero-title">Predictable Pricing at Scale</h1>
          <p className="page-hero-desc">
            Choose the cybersecurity subscription plan that matches your organization size, security posture, and compliance needs.
          </p>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="page-section">
        <div className="pub-container pricing-grid">
          {loading ? (
            <div className="state-empty" style={{ gridColumn: '1 / -1' }}>
              <div className="loading-spinner"></div>
              <p>Loading subscription plans...</p>
            </div>
          ) : error ? (
            <div className="state-empty" style={{ gridColumn: '1 / -1' }}>
              <span className="state-empty-icon">⚠️</span>
              <p>{error}</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="state-empty" style={{ gridColumn: '1 / -1' }}>
              <span className="state-empty-icon">💰</span>
              <p>No plans available at the moment.</p>
            </div>
          ) : (
            plans.map((tier, idx) => {
              const parsedFeatures = Array.isArray(tier.features) ? tier.features : [];
              return (
                <div
                  key={idx}
                  className={`pricing-card ${tier.name === 'Professional' ? 'highlighted' : ''}`}
                >
                  {tier.name === 'Professional' && <span className="pricing-badge">Most Popular</span>}
                  <h3 className="pricing-name">{tier.name}</h3>
                  <div className="pricing-price">{formatPrice(tier.price)}</div>
                  <div className="pricing-period">/ month (billed annually)</div>
                  <p className="pricing-desc">Comprehensive protection for scaling organizations.</p>
                  
                  <ul className="pricing-features">
                    {parsedFeatures.slice(0, 8).map((f, i) => {
                      const isIncluded = f.included !== false;
                      return (
                        <li key={i} className={`pricing-feature ${isIncluded ? 'included' : ''}`}>
                          <span className={`pricing-check ${isIncluded ? 'yes' : 'no'}`}>
                            {isIncluded ? '✓' : '✕'}
                          </span>
                          {f.text || f}
                        </li>
                      );
                    })}
                  </ul>

                  <button
                    className={`btn-pub ${tier.name === 'Professional' ? 'btn-pub-primary' : 'btn-pub-secondary'}`}
                    style={{ width: '100%' }}
                    onClick={() => alert(`Starting setup for ${tier.name}`)}
                  >
                    Select Plan
                  </button>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Pricing FAQs accordion */}
      <section className="page-section">
        <div className="pub-container" style={{ maxWidth: 800 }}>
          <div className="section-header">
            <span className="section-label">Pricing FAQ</span>
            <h2 className="section-title-pub">Common Pricing Questions</h2>
          </div>
          <Accordion items={faqs.map(f => ({ question: f.question, answer: f.answer }))} />
        </div>
      </section>
    </>
  );
}
