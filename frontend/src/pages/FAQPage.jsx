import React, { useState, useEffect } from 'react';
import SEOHead, { schemas } from '../utils/seo';
import Accordion from '../components/ui/Accordion';
import { saasService } from '../services/api';

const faqCategories = ['General', 'Products', 'Pricing', 'Security', 'Support'];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('General');
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFaqs();
  }, [activeCategory]);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const query = activeCategory !== 'All' ? `?category=${encodeURIComponent(activeCategory)}` : '';
      const response = await saasService.getFAQs(query);
      setFaqs(Array.isArray(response?.results) ? response.results : (Array.isArray(response) ? response : []));
    } catch (err) {
      setError('Failed to load FAQs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Frequently Asked Questions"
        description="Find answers to common questions about CyberSentinel platforms, EDR products, pricing subscriptions, compliance, and SOC supports."
        path="/faq"
        structuredData={schemas.faqPage(
          faqItems.map(f => ({ question: f.question, answer: f.answer }))
        )}
      />

      {/* Hero Section */}
      <section className="page-hero">
        <div className="pub-container">
          <span className="section-label">FAQ</span>
          <h1 className="page-hero-title">Frequently Asked Questions</h1>
          <p className="page-hero-desc">
            Find answers to common questions regarding CyberSentinel's platform capabilities, compliance, billing, and support options.
          </p>
        </div>
      </section>

      {/* Category filters */}
      <div className="pub-container" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32, justifyContent: 'center' }}>
        {faqCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`btn-pub btn-pub-sm ${activeCategory === cat ? 'btn-pub-primary' : 'btn-pub-secondary'}`}
          >
            {cat} FAQs
          </button>
        ))}
      </div>

      {/* FAQs detailed accordion */}
      <section className="page-section">
        <div className="pub-container" style={{ maxWidth: 800 }}>
          <div className="glass-card" style={{ padding: 24 }}>
            {loading ? (
              <div className="state-empty">
                <div className="loading-spinner"></div>
                <p>Loading questions...</p>
              </div>
            ) : error ? (
              <div className="state-empty">
                <span className="state-empty-icon">⚠️</span>
                <p>{error}</p>
              </div>
            ) : faqs.length === 0 ? (
              <div className="state-empty">
                <span className="state-empty-icon">❓</span>
                <p>No questions found for this category.</p>
              </div>
            ) : (
              <Accordion items={faqs} />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
