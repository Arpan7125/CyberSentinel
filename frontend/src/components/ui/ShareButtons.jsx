import React from 'react';

export default function ShareButtons({ url, title }) {
  const encodedUrl = encodeURIComponent(url || window.location.href);
  const encodedTitle = encodeURIComponent(title || document.title);

  const channels = [
    { name: 'Twitter', icon: '𝕏', href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`, color: '#000' },
    { name: 'LinkedIn', icon: 'in', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, color: '#0A66C2' },
    { name: 'Facebook', icon: 'f', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, color: '#1877F2' },
    { name: 'Email', icon: '✉', href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`, color: '#6B7280' },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url || window.location.href);
    } catch {}
  };

  return (
    <div className="share-buttons" role="group" aria-label="Share this page">
      {channels.map(ch => (
        <a
          key={ch.name}
          href={ch.href}
          target="_blank"
          rel="noopener noreferrer"
          className="share-btn"
          aria-label={`Share on ${ch.name}`}
          title={`Share on ${ch.name}`}
          style={{ '--share-color': ch.color }}
        >
          <span className="share-icon">{ch.icon}</span>
        </a>
      ))}
      <button className="share-btn share-copy" onClick={handleCopy} aria-label="Copy link" title="Copy link">
        <span className="share-icon">🔗</span>
      </button>
    </div>
  );
}
