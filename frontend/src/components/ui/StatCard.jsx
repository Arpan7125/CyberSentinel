import React from 'react';

export default function StatCard({ label, value, sub, icon, color }) {
  return (
    <div className="stat-card" style={color ? { borderColor: `${color}33` } : {}}>
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        {icon && <span className="stat-card-icon" style={color ? { color } : {}}>{icon}</span>}
      </div>
      <div className="stat-card-value" style={color ? { color } : {}}>{value}</div>
      {sub && <div className="stat-card-change" style={{ color: 'var(--text-secondary)' }}>{sub}</div>}
    </div>
  );
}
