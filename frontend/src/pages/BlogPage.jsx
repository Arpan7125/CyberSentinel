import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEOHead, { schemas } from '../utils/seo';
import { saasService } from '../services/api';

const blogCategories = ['All', 'Architecture', 'Threat Intelligence', 'Incident Response', 'Cloud Security', 'Security Culture'];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBlogs();
  }, [activeCategory]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const query = activeCategory !== 'All' ? `?category=${encodeURIComponent(activeCategory)}` : '';
      const response = await saasService.getBlogPosts(query);
      setPosts(Array.isArray(response?.results) ? response.results : (Array.isArray(response) ? response : []));
    } catch (err) {
      setError('Failed to load blog posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Security Blog"
        description="Stay updated with CyberSentinel threat research briefings, Zero Trust architectures, and incident response guides."
        path="/blog"
        structuredData={schemas.webpage('Blog', 'Read CyberSentinel security blogs.', '/blog')}
      />

      {/* Hero Section */}
      <section className="page-hero">
        <div className="pub-container">
          <span className="section-label">Threat Research</span>
          <h1 className="page-hero-title">The CyberSentinel Intelligence Blog</h1>
          <p className="page-hero-desc">
            Expert analysis, deep-dive vulnerability research, and security architecture best practices from our global SOC team.
          </p>
        </div>
      </section>

      {/* Categories filters */}
      <div className="pub-container" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
        {blogCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`btn-pub btn-pub-sm ${activeCategory === cat ? 'btn-pub-primary' : 'btn-pub-secondary'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Blog Posts Grid */}
      <section className="page-section">
        <div className="pub-container blog-grid">
          {loading ? (
            <div className="state-empty" style={{ gridColumn: '1 / -1' }}>
              <div className="loading-spinner"></div>
              <p>Loading the latest threat intelligence...</p>
            </div>
          ) : error ? (
            <div className="state-empty" style={{ gridColumn: '1 / -1' }}>
              <span className="state-empty-icon">⚠️</span>
              <h3>Error</h3>
              <p>{error}</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="state-empty" style={{ gridColumn: '1 / -1' }}>
              <span className="state-empty-icon">📝</span>
              <h3>No Reports Available Yet</h3>
              <p>Our threat researchers are currently drafting new content for this category.</p>
            </div>
          ) : (
            posts.map(post => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="blog-card">
                <div className="blog-card-img">
                  🛡️
                </div>
                <div className="blog-card-body">
                  <span className="blog-card-category">{post.category}</span>
                  <h3 className="blog-card-title">{post.title}</h3>
                  <p className="blog-card-excerpt">{post.excerpt}</p>
                  <div className="blog-card-meta">
                    <span>{post.author}</span>
                    <span>{post.date}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </>
  );
}
