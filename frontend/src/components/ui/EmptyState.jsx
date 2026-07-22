import React from 'react';

export default function EmptyState({ icon = '📂', title = 'No data available', desc = 'There is currently no data to display.', actionLabel, onActionClick }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden="true">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{desc}</p>
      {actionLabel && (
        <button className="btn-pub btn-pub-primary btn-pub-sm" onClick={onActionClick}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
