import React from 'react';
import { motion } from 'framer-motion';
import ChartFrame, { ChartTable } from './ChartFrame';
import { compactNumber, severityColor, usePrefersReducedMotion } from './chartPrimitives';

/**
 * Horizontal bars with the category name and value printed beside each bar.
 *
 * This replaces what would naturally be a donut or a five-colour categorical
 * chart. Two reasons: length along a common baseline is read far more
 * accurately than angle, and a five-hue categorical set could not be made to
 * survive colour-vision-deficiency separation on the dark surfaces at the
 * lightness these themes need. Direct labels mean colour is never the only
 * carrier of meaning here.
 */
export default function SeverityBars({
  items = [],
  height = 240,
  formatValue = compactNumber,
  valueLabel = 'Count',
  showPercent = true,
  title,
  subtitle,
  footnote,
  loading = false,
  error = null,
  onRetry,
  emptyLabel = 'No scans recorded for this period yet.',
  actions,
}) {
  const reducedMotion = usePrefersReducedMotion();

  const rows = items.map((item) => ({
    ...item,
    value: Number(item.value) || 0,
    color: item.color || severityColor(item.tone ?? item.label),
  }));

  const total = rows.reduce((sum, r) => sum + r.value, 0);
  const max = Math.max(...rows.map((r) => r.value), 0);
  const isEmpty = rows.length === 0 || total === 0;

  const table = (
    <ChartTable
      caption={title}
      columns={['Category', valueLabel, ...(showPercent ? ['Share'] : [])]}
      rows={rows.map((r) => [
        r.label,
        formatValue(r.value),
        ...(showPercent ? [`${total ? Math.round((r.value / total) * 100) : 0}%`] : []),
      ])}
    />
  );

  return (
    <ChartFrame
      title={title}
      subtitle={subtitle}
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={isEmpty}
      emptyLabel={emptyLabel}
      height={height}
      table={table}
      footnote={footnote}
      actions={actions}
    >
      <ul className="flex flex-col gap-3">
        {rows.map((r, i) => {
          const pct = total ? (r.value / total) * 100 : 0;
          const widthPct = max ? Math.max((r.value / max) * 100, r.value > 0 ? 1.5 : 0) : 0;

          return (
            <li key={r.label}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-sm text-text-secondary">
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ background: r.color }}
                    aria-hidden="true"
                  />
                  <span className="truncate">{r.label}</span>
                </span>
                <span className="shrink-0 font-mono text-sm tabular-nums text-text-primary">
                  {formatValue(r.value)}
                  {showPercent && (
                    <span className="ml-2 text-xs text-text-muted">{Math.round(pct)}%</span>
                  )}
                </span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-bg-tertiary"
                role="img"
                aria-label={`${r.label}: ${formatValue(r.value)}${
                  showPercent ? `, ${Math.round(pct)} percent of total` : ''
                }`}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: r.color }}
                  initial={reducedMotion ? false : { width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{
                    duration: reducedMotion ? 0 : 0.5,
                    delay: reducedMotion ? 0 : i * 0.05,
                    ease: 'easeOut',
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </ChartFrame>
  );
}
