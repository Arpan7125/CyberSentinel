import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../utils/seo';

export default function NotFoundPage() {
  return (
    <>
      <SEOHead
        title="404 Page Not Found"
        description="The requested platform page does not exist."
      />
      <div className="pub-container" style={{ padding: '120px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 72 }}>🔍</div>
        <h1 style={{ fontSize: 32, fontWeight: 800 }}>404 Node Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', maxDWidth: 460, lineHeight: 1.6 }}>
          The requested URL path segment was not matched on this CyberSentinel server console.
        </p>
        <Link to="/" className="btn-pub btn-pub-primary btn-pub-sm" style={{ marginTop: 12 }}>
          Back to Homepage
        </Link>
      </div>
    </>
  );
}
