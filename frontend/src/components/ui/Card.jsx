import React from 'react';

/**
 * The workhorse panel surface. Replaces the
 * `<div className="glass-card" style={{ padding: 28 }}>` + `<h3 className="section-title">`
 * block that was copy-pasted across the customer console.
 *
 * <Card title="Recent scans" icon={<Activity />} actions={<Button/>}>…</Card>
 */
export default function Card({
  title,
  subtitle,
  icon,
  actions,
  padding = 'md',
  interactive = false,
  as: Tag = 'div',
  className = '',
  bodyClassName = '',
  children,
  ...rest
}) {
  const pad = {
    none: '',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  }[padding] ?? 'p-5 sm:p-6';

  const hasHeader = title || icon || actions;

  return (
    <Tag
      className={[
        'rounded-lg border border-border-subtle bg-bg-card shadow-sm',
        interactive ? 'hover-lift cursor-pointer' : '',
        pad,
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {hasHeader && (
        <div className={`flex items-start justify-between gap-4 ${children ? 'mb-5' : ''}`}>
          <div className="flex items-start gap-3 min-w-0">
            {icon && (
              <span className="mt-0.5 shrink-0 text-accent" aria-hidden="true">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="text-[0.9375rem] font-semibold tracking-tight text-text-primary">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-text-secondary">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children && <div className={bodyClassName}>{children}</div>}
    </Tag>
  );
}
