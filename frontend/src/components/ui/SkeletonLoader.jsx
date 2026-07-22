import React from 'react';

export default function SkeletonLoader({ type = 'text', count = 1 }) {
  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, idx) => (
        <div key={idx} style={{ width: '100%', marginBottom: 12 }}>
          {type === 'text' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-text" />
              <div className="skeleton skeleton-text" style={{ width: '80%' }} />
            </div>
          )}
          {type === 'card' && (
            <div className="skeleton skeleton-card" />
          )}
          {type === 'profile' && (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div className="skeleton skeleton-avatar" />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="skeleton skeleton-title" style={{ width: '40%' }} />
                <div className="skeleton skeleton-text" style={{ width: '60%' }} />
              </div>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
