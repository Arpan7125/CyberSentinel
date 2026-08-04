import React from 'react';

/**
 * Metric tile. Replaces the 10-line label/icon/value/sub block that was
 * repeated 4× in DashboardPage and 3× in ReportsPage.
 *
 * `tone` colours the value and icon from the theme tokens; `color` is still
 * accepted for callers that need an arbitrary one-off colour.
 */
const TONES = {
  default: 'text-text-primary',
  accent: 'text-accent',
  success: 'text-accent-green',
  danger: 'text-accent-red',
  warning: 'text-accent-yellow',
  violet: 'text-accent-violet',
};

export default function StatCard({
  label,
  value,
  sub,
  icon,
  tone = 'default',
  color,
  loading = false,
  className = '',
}) {
  const toneClass = TONES[tone] ?? TONES.default;

  return (
    <div
      className={`group rounded-lg border border-border-subtle bg-bg-card p-5 shadow-sm transition-colors duration-200 hover:border-border-strong ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[0.8125rem] font-medium leading-tight text-text-secondary">
          {label}
        </span>
        {icon && (
          <span
            className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${color ? '' : toneClass}`}
            style={color ? { color } : undefined}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>

      {loading ? (
        <div className="mt-3 h-8 w-20 animate-pulse rounded bg-bg-tertiary" />
      ) : (
        <div
          className={`mt-3 font-mono text-[1.75rem] font-bold leading-none tracking-tight tabular-nums ${color ? '' : toneClass}`}
          style={color ? { color } : undefined}
        >
          {value}
        </div>
      )}

      {sub && <p className="mt-2 text-xs text-text-muted">{sub}</p>}
    </div>
  );
}
