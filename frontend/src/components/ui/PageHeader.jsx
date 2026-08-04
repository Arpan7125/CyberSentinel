import React from 'react';

/**
 * Standard console page heading. Replaces the
 * `<div><h1 className="page-title">…<p className="page-subtitle">…</div>`
 * block that was repeated verbatim across nearly every customer page.
 */
export default function PageHeader({ title, subtitle, actions, eyebrow, icon, className = '' }) {
  return (
    <header
      className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${className}`}
    >
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <div className="flex items-center gap-3">
          {icon && (
            <span
              className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent"
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-[1.75rem]">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}
