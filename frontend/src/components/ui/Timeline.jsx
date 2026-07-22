import React from 'react';

export default function Timeline({ items }) {
  const defaultItems = [
    { title: 'Auth Token Refreshed', desc: 'Secure session validated for node admin-42', time: '10 mins ago', active: true },
    { title: 'Sms Dispatch Verified', desc: 'Alert message dispatched to +1 (555) 019-2834', time: '1 hour ago', active: false },
    { title: 'Threat Feed Synchronized', desc: 'Successfully loaded 1,429 new IOC rules from AlienVault OTX', time: '3 hours ago', active: false },
  ];

  const timelineItems = items || defaultItems;

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
