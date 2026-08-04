import React from 'react';

export default function Timeline({ items }) {
  const timelineItems = items || [];

  if (timelineItems.length === 0) {
    return (
      <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
        No security events recorded yet.
      </div>
    );
  }

  return (
    <div className="timeline">
      {timelineItems.map((item, idx) => (
        <div className="timeline-item" key={idx}>
          <div className={`timeline-dot ${item.active ? 'active' : ''}`}>
            {item.active ? '⚡' : '✓'}
          </div>
          <div className="timeline-content">
            <h4 className="timeline-title">{item.title}</h4>
            <p className="timeline-desc">{item.desc}</p>
            <span className="timeline-time">{item.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
