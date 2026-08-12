import React, { useId, useState } from 'react';
import { AlertTriangle, RefreshCw, Table2, LineChart as LineChartIcon } from 'lucide-react';

/**
 * The shell every chart sits in: title, legend, loading / error / empty states,
 * and a toggle to the same numbers as a table.
 *
 * The table is not a nicety. A chart with no text alternative is unreadable to
 * a screen reader and to anyone who needs the exact figure rather than the
 * shape, so every chart here ships one.
 */
export default function ChartFrame({
  title,
  subtitle,
  legend = [],
  loading = false,
  error = null,
  onRetry,
  isEmpty = false,
  emptyLabel = 'No data for this period yet.',
  height = 240,
  table = null,
  footnote,
  actions,
  children,
}) {
  const [showTable, setShowTable] = useState(false);
  const headingId = useId();

  const showChart = !loading && !error && !isEmpty;

  return (
    <section
      className="rounded-lg border border-border-subtle bg-bg-card p-5 shadow-sm"
      aria-labelledby={title ? headingId : undefined}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {title && (
            <h3 id={headingId} className="text-sm font-semibold text-text-primary">
              {title}
            </h3>
          )}
          {subtitle && <p className="mt-1 text-xs text-text-muted">{subtitle}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {actions}
          {table && showChart && (
            <button
              type="button"
              onClick={() => setShowTable((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              aria-pressed={showTable}
            >
              {showTable ? <LineChartIcon size={13} /> : <Table2 size={13} />}
              {showTable ? 'Chart' : 'Table'}
            </button>
          )}
        </div>
      </header>

      {legend.length > 1 && showChart && (
        <ul className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          {legend.map((item) => (
            <li key={item.label} className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ background: item.color }}
                aria-hidden="true"
              />
              {item.label}
            </li>
          ))}
        </ul>
      )}

      {loading && (
        <div
          className="animate-pulse rounded-md bg-bg-tertiary"
          style={{ height }}
          role="status"
          aria-label="Loading chart data"
        />
      )}

      {!loading && error && (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border-subtle px-4 text-center"
          style={{ minHeight: height }}
          role="alert"
        >
          <AlertTriangle size={20} className="text-accent-red" aria-hidden="true" />
          <p className="text-sm text-text-secondary">
            {error.message || 'Could not load this chart.'}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:border-border-strong"
            >
              <RefreshCw size={13} aria-hidden="true" />
              Retry
            </button>
          )}
        </div>
      )}

      {!loading && !error && isEmpty && (
        <div
          className="flex items-center justify-center rounded-md border border-dashed border-border-subtle px-4 text-center text-sm text-text-muted"
          style={{ minHeight: height }}
        >
          {emptyLabel}
        </div>
      )}

      {showChart && (showTable ? <div className="overflow-x-auto">{table}</div> : children)}

      {footnote && showChart && <p className="mt-3 text-xs text-text-muted">{footnote}</p>}
    </section>
  );
}

/** Shared table styling so every chart's data view looks the same. */
export function ChartTable({ columns, rows, caption }) {
  return (
    <table className="w-full min-w-[20rem] border-collapse text-sm">
      {caption && <caption className="sr-only">{caption}</caption>}
      <thead>
        <tr>
          {columns.map((c, i) => (
            <th
              key={c}
              scope="col"
              className={`border-b border-border-subtle px-3 py-2 text-xs font-semibold uppercase tracking-wide text-text-muted ${
                i === 0 ? 'text-left' : 'text-right'
              }`}
            >
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={row[0] ?? r} className="border-b border-border-subtle/60 last:border-0">
            {row.map((cell, i) => (
              <td
                key={i}
                className={`px-3 py-2 ${
                  i === 0
                    ? 'text-left text-text-secondary'
                    : 'text-right font-mono tabular-nums text-text-primary'
                }`}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
