import React from 'react';

export default function StatusBadge({ status }) {
  const getBadgeClass = (s) => {
    const lower = s?.toLowerCase() || '';
    if (lower === 'active' || lower === 'resolved' || lower === 'healthy' || lower === 'paid' || lower === 'success') {
      return 'status-active';
    }
    if (lower === 'pending' || lower === 'warning' || lower === 'open' || lower === 'medium') {
      return 'status-warning';
    }
    if (lower === 'suspended' || lower === 'danger' || lower === 'critical' || lower === 'failed' || lower === 'blocked') {
      return 'status-danger';
    }
    return 'status-neutral';
  };

  return (
    <span className={`status-badge ${getBadgeClass(status)}`}>
      <span className="status-badge-dot" />
      {status}
    </span>
  );
}
