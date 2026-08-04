import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Single button primitive consolidating the old `.btn-pub-*`, `.cta-btn` and
 * `.dash-btn` families. Renders an <a>/<Link> when `href`/`to` is supplied so
 * navigation stays semantic.
 */
const VARIANTS = {
  primary:
    'bg-accent text-white border border-transparent hover:bg-accent-hover shadow-sm hover:shadow-[0_8px_24px_-8px_var(--accent-glow)]',
  secondary:
    'bg-bg-secondary text-text-primary border border-border-subtle hover:border-border-strong hover:bg-bg-hover',
  ghost:
    'bg-transparent text-text-secondary border border-transparent hover:bg-bg-hover hover:text-text-primary',
  outline:
    'bg-transparent text-accent border border-accent/40 hover:bg-accent-soft hover:border-accent',
  danger:
    'bg-accent-red text-white border border-transparent hover:opacity-90 shadow-sm',
};

const SIZES = {
  sm: 'h-8 px-3 text-[0.8125rem] gap-1.5 rounded-md',
  md: 'h-10 px-4 text-sm gap-2 rounded-md',
  lg: 'h-12 px-6 text-[0.9375rem] gap-2.5 rounded-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconRight,
  to,
  href,
  className = '',
  children,
  ...rest
}) {
  const isDisabled = disabled || loading;

  const classes = [
    'inline-flex items-center justify-center font-semibold tracking-tight',
    'transition-[background-color,border-color,box-shadow,transform,color] duration-200',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
    'active:scale-[0.98] whitespace-nowrap',
    VARIANTS[variant] ?? VARIANTS.primary,
    SIZES[size] ?? SIZES.md,
    isDisabled ? 'opacity-55 pointer-events-none' : '',
    className,
  ].filter(Boolean).join(' ');

  const content = (
    <>
      {loading ? (
        <span
          className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : (
        icon && <span className="shrink-0" aria-hidden="true">{icon}</span>
      )}
      {children}
      {iconRight && !loading && <span className="shrink-0" aria-hidden="true">{iconRight}</span>}
    </>
  );

  if (to && !isDisabled) {
    return <Link to={to} className={classes} {...rest}>{content}</Link>;
  }
  if (href && !isDisabled) {
    return <a href={href} className={classes} {...rest}>{content}</a>;
  }

  return (
    <button className={classes} disabled={isDisabled} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  );
}
