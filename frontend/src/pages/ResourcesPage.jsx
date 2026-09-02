import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead, { schemas } from '../utils/seo';
import { saasService } from '../services/api';
import { useApiData } from '../hooks/useApiData';

/**
 * Published research and guidance.
 *
 * This page previously advertised three downloadable PDFs — with stated file
 * sizes of 4.2 MB, 1.8 MB, and 920 KB — that did not exist. Clicking Download
 * fired an alert saying the download was starting and nothing else happened.
 * It now lists what has actually been published, and says so plainly when
 * nothing has been.
 */

const cardGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
  gap: 24,
};

/**
 * Mirrors the shape of a real post card, so the wait reads as content arriving
 * rather than as three empty boxes on an otherwise finished page.
 */
function PostCardSkeleton() {
  return (
    <div className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="skeleton" style={{ height: 18, width: 88, borderRadius: 999 }} />
      <div className="skeleton skeleton-title" style={{ width: '85%', margin: '4px 0 0' }} />
      <div className="skeleton skeleton-text" style={{ margin: 0 }} />
      <div className="skeleton skeleton-text" style={{ width: '70%', margin: 0 }} />
      <div
        style={{
          display: 'flex', justifyContent: 'space-between', gap: 16,
          marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <div className="skeleton skeleton-text" style={{ width: 90, height: 12, margin: 0 }} />
        <div className="skeleton skeleton-text" style={{ width: 56, height: 12, margin: 0 }} />
      </div>
    </div>
  );
}

/**
 * The hero promises API documentation, so there has to be a way through to it
 * from every state — not only from the empty one.
 */
function DocsCallout() {
  return (
    <div
      className="glass-card"
      style={{
        marginTop: 32, padding: '28px 32px', display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', justifyContent: 'space-between', gap: 20,
      }}
    >
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>Building against the platform?</h2>
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
          The API documentation covers authentication, endpoints, and webhooks.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/docs" className="btn-pub btn-pub-primary btn-pub-sm" style={{ textDecoration: 'none' }}>
          API documentation
        </Link>
        <Link to="/contact" className="btn-pub btn-pub-secondary btn-pub-sm" style={{ textDecoration: 'none' }}>
          Ask the team
        </Link>
      </div>
    </div>
  );
}

export default function ResourcesPage() {
  const { data, loading, error, slow, refetch } = useApiData(() => saasService.getBlogPosts(), []);
  const posts = Array.isArray(data) ? data : data?.results || [];

  return (
    <>
      <SEOHead
        title="Resources"
        description="Security research, guidance, and platform documentation published by CyberSentinel."
        path="/resources"
        structuredData={schemas.webpage(
          'Resources',
          'Security research and guidance published by CyberSentinel.',
          '/resources',
        )}
      />

      <section className="page-hero">
        <div className="pub-container">
          <span className="section-label">Resources</span>
          <h1 className="page-hero-title">Research, guidance, and documentation</h1>
          <p className="page-hero-desc">
            Everything the team has published, plus the API documentation for building against the
            platform.
          </p>
        </div>
      </section>

      <section className="page-section">
        <div className="pub-container">
          {loading && (
            <div aria-busy="true">
              <div style={cardGrid}>
                {[0, 1, 2].map((i) => (
                  <PostCardSkeleton key={i} />
                ))}
              </div>

              {/* Bare skeletons for the length of a cold start look like a
                  broken page. Say what is happening instead. */}
              {slow && (
                <p
                  role="status"
                  style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}
                >
                  Still loading — the server may be waking up. This can take up to a minute.
                </p>
              )}
            </div>
          )}

          {!loading && (error || posts.length === 0) && (
            <div
              className="glass-card"
              style={{ padding: 48, textAlign: 'center', maxWidth: 640, margin: '0 auto' }}
            >
              {/* "Nothing published yet" over a failed request is a lie: we do
                  not know what has been published, only that we could not ask. */}
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
                {error ? "Couldn't load the resource library" : 'Nothing published yet'}
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
                {error
                  ? 'The resource library could not be loaded right now.'
                  : 'When the team publishes research or guidance it appears here. In the meantime the API documentation covers how to build against the platform.'}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                {error && (
                  <button type="button" className="btn-pub btn-pub-primary btn-pub-sm" onClick={refetch}>
                    Try again
                  </button>
                )}
                <Link to="/docs" className="btn-pub btn-pub-primary btn-pub-sm" style={{ textDecoration: 'none' }}>
                  API documentation
                </Link>
                <Link to="/contact" className="btn-pub btn-pub-secondary btn-pub-sm" style={{ textDecoration: 'none' }}>
                  Ask the team
                </Link>
              </div>
            </div>
          )}

          {!loading && !error && posts.length > 0 && (
            <>
              <div style={cardGrid}>
                {posts.map((post) => (
                  <Link
                    key={post.id || post.slug}
                    to={`/blog/${post.slug}`}
                    className="glass-card glass-card-hover"
                    style={{
                      padding: 28, display: 'flex', flexDirection: 'column', gap: 12,
                      textDecoration: 'none', color: 'inherit',
                    }}
                  >
                    <span className="badge badge-admin" style={{ padding: '3px 8px', width: 'fit-content' }}>
                      {post.category}
                    </span>
                    <h3 style={{ fontSize: 16, fontWeight: 800, marginTop: 4 }}>{post.title}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {post.excerpt}
                    </p>
                    <div
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border-subtle)',
                        fontSize: 12, color: 'var(--text-muted)',
                      }}
                    >
                      <span>{post.author}</span>
                      <span>{post.read_time || post.date}</span>
                    </div>
                  </Link>
                ))}
              </div>

              <DocsCallout />
            </>
          )}
        </div>
      </section>
    </>
  );
}
