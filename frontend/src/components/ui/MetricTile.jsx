import React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../hooks/useApiData';

/**
 * Renders one metric exactly as the analytics endpoints describe it:
 * `{ label, value, previous, change_pct, unit }`.
 *
 * Two deliberate behaviours:
 *  - `change_pct === null` means there was no prior period to compare with, and
 *    the tile says so. It does not render "0%", which would be a comparison the
 *    data does not support.
 *  - `lowerIsBetter` decouples direction from colour. Failed payments falling is
 *    good news; scans falling is not. Colouring by raw sign would get one of
 *    those backwards.
 */
export default function MetricTile({ metric, lowerIsBetter = false, loading = false, icon }) {
  const { label, value, change_pct: changePct, unit } = metric || {};

  const display =
    unit === 'currency'
      ? formatCurrency(value, { compact: true })
      : unit === '%'
        ? `${Number(value ?? 0)}%`
        : formatNumber(value);

  const hasChange = changePct !== null && changePct !== undefined;
  const rounded = hasChange ? Math.round(changePct * 10) / 10 : 0;
  const rising = rounded > 0;
  const flat = rounded === 0;

  const good = flat ? null : lowerIsBetter ? !rising : rising;
  const toneClass = good === null ? 'text-text-muted' : good ? 'text-accent-green' : 'text-accent-red';
  const Arrow = flat ? Minus : rising ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[0.8125rem] font-medium leading-tight text-text-secondary">
          {label}
        </span>
        {icon && (
          <span className="shrink-0 text-text-muted" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>

      {loading ? (
        <div className="mt-3 h-8 w-24 animate-pulse rounded bg-bg-tertiary" />
      ) : (
        <div className="mt-3 font-mono text-[1.75rem] font-bold leading-none tracking-tight tabular-nums text-text-primary">
          {display}
        </div>
      )}

      {!loading &&
        (hasChange ? (
          <p className={`mt-2 flex items-center gap-1 text-xs font-medium ${toneClass}`}>
            <Arrow size={13} aria-hidden="true" />
            {rounded > 0 ? '+' : ''}
            {rounded}%
            <span className="font-normal text-text-muted">vs prior period</span>
          </p>
        ) : (
          <p className="mt-2 text-xs text-text-muted">No prior period to compare</p>
        ))}
    </div>
  );
}
