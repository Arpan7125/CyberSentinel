import React from 'react';

/**
 * Avatar + title/subtitle + trailing status row. Replaces the duplicated
 * markup in DashboardPage ("Monitored Accounts") and ConnectedAccountsPage.
 */
export default function ListRow({
  avatar,
  title,
  subtitle,
  status,
  statusTone = 'neutral',
  actions,
  onClick,
  className = '',
}) {
  const toneClasses = {
    success: 'bg-accent-green/12 text-accent-green',
    danger: 'bg-accent-red/12 text-accent-red',
    warning: 'bg-accent-yellow/12 text-accent-yellow',
    accent: 'bg-accent-soft text-accent',
    neutral: 'bg-bg-tertiary text-text-secondary',
  }[statusTone] ?? 'bg-bg-tertiary text-text-secondary';

  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      onClick={onClick}
      className={[
        'flex w-full items-center gap-3 rounded-md border border-border-subtle bg-bg-secondary p-3 text-left sm:gap-4 sm:p-4',
        onClick ? 'transition-colors hover:border-border-strong hover:bg-bg-hover' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {avatar && (
        <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-bg-tertiary text-sm font-bold text-text-primary">
          {avatar}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="truncate text-[0.8125rem] font-semibold text-text-primary">{title}</div>
        {subtitle && (
          <div className="truncate text-xs text-text-secondary">{subtitle}</div>
        )}
      </div>

      {status && (
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[0.6875rem] font-bold capitalize ${toneClasses}`}
        >
          {status}
        </span>
      )}

      {actions && <div className="shrink-0">{actions}</div>}
    </Tag>
  );
}
