import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEOHead, { schemas } from '../utils/seo';
import { saasService } from '../services/api';
import ShareButtons from '../components/ui/ShareButtons';

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await saasService.getBlogPosts(`?slug=${encodeURIComponent(slug)}`);
      const results = response.results || response;
      if (results.length > 0) {
        setPost(results[0]);
      } else {
        setPost(null);
      }
    } catch (err) {
      setError('Failed to load the article.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pub-container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
        <p>Loading article...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="pub-container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h2>Article Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 12, marginBottom: 24 }}>The blog post you are looking for does not exist or has been moved.</p>
        <Link to="/blog" className="btn-pub btn-pub-primary btn-pub-sm">Back to Blog</Link>
      </div>
    );
  }

  // Parse custom markdown layout paragraphs
  const paragraphs = post.content.split('\n\n');

  return (
    <>
      <SEOHead
        title={post.title}
        description={post.excerpt}
        path={`/blog/${post.slug}`}
        type="article"
        structuredData={schemas.article(post.title, post.excerpt, post.date, post.author, `/blog/${post.slug}`)}
      />

      <article className="pub-container" style={{ padding: '60px 24px', maxWidth: 800 }}>
        {/* Header metadata */}
        <header style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 24, marginBottom: 32 }}>
          <span className="blog-card-category" style={{ fontSize: 13 }}>{post.category}</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, lineHeight: 1.2, margin: '12px 0' }}>
            {post.title}
          </h1>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                {post.author[0]}
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{post.author}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{post.authorRole} · {post.readTime}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Published: {post.date}
            </div>
          </div>
        </header>

        {/* Article Body Content */}
        <div className="blog-post-content">
          {paragraphs.map((para, idx) => {
            if (para.startsWith('## ')) {
              return <h2 key={idx}>{para.replace('## ', '')}</h2>;
            }
            if (para.startsWith('**') && para.endsWith('**')) {
              return <p key={idx}><strong>{para.replace(/\*\*/g, '')}</strong></p>;
            }
            return <p key={idx}>{para}</p>;
          })}
        </div>

        {/* Share buttons widget */}
        <div style={{ marginTop: 48, borderTop: '1px solid var(--border-subtle)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Share this article:</span>
          <ShareButtons url={window.location.href} title={post.title} />
        </div>
      </article>
    </>
  );
}
