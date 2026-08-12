import React, { useCallback, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import ChartFrame, { ChartTable } from './ChartFrame';
import {
  bandPath,
  compactNumber,
  labelStride,
  linePath,
  niceScale,
  useChartWidth,
  usePrefersReducedMotion,
} from './chartPrimitives';

const M = { top: 12, right: 14, bottom: 26, left: 46 };

/**
 * Line chart over a shared x axis, with a crosshair that reads every series at
 * the hovered point at once — comparing two lines by eyeballing their vertical
 * gap is exactly what a shared tooltip is for.
 *
 * `series[].dashedFrom` renders everything past that index as a dashed line, so
 * a forecast is visually distinct from measured history without needing a
 * second chart. `band` draws the prediction interval underneath it.
 */
export default function TrendChart({
  labels = [],
  series = [],
  band = null,
  height = 240,
  formatValue = compactNumber,
  title,
  subtitle,
  footnote,
  loading = false,
  error = null,
  onRetry,
  actions,
}) {
  const [wrapRef, width] = useChartWidth();
  const reducedMotion = usePrefersReducedMotion();
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);

  const innerW = Math.max(width - M.left - M.right, 10);
  const innerH = Math.max(height - M.top - M.bottom, 10);
  const n = labels.length;

  const hasPoint = series.some((s) => s.values?.some((v) => Number.isFinite(v)));
  const isEmpty = n === 0 || !hasPoint;

  const scale = useMemo(() => {
    const all = [];
    series.forEach((s) => (s.values || []).forEach((v) => Number.isFinite(v) && all.push(v)));
    if (band) {
      (band.upper || []).forEach((v) => Number.isFinite(v) && all.push(v));
      (band.lower || []).forEach((v) => Number.isFinite(v) && all.push(v));
    }
    return niceScale(Math.min(...all, 0), Math.max(...all, 0));
  }, [series, band]);

  const xOf = useCallback(
    (i) => (n <= 1 ? M.left + innerW / 2 : M.left + (i / (n - 1)) * innerW),
    [n, innerW],
  );

  const yOf = useCallback(
    (v) => {
      const span = scale.max - scale.min || 1;
      return M.top + innerH - ((v - scale.min) / span) * innerH;
    },
    [scale, innerH],
  );

  const stride = labelStride(n, innerW);

  const onMove = (event) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || n === 0) return;
    const x = event.clientX - rect.left;
    const ratio = n <= 1 ? 0 : (x - M.left) / innerW;
    const index = Math.round(Math.min(Math.max(ratio, 0), 1) * (n - 1));
    setHover(index);
  };

  const onKeyDown = (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    setHover((prev) => {
      const base = prev ?? 0;
      const next = event.key === 'ArrowLeft' ? base - 1 : base + 1;
      return Math.min(Math.max(next, 0), n - 1);
    });
  };

  const legend = series.map((s) => ({ label: s.label, color: s.color }));

  const table = (
    <ChartTable
      caption={title}
      columns={['Period', ...series.map((s) => s.label)]}
      rows={labels.map((label, i) => [
        label,
        ...series.map((s) => {
          const v = s.values?.[i];
          return Number.isFinite(v) ? formatValue(v) : '—';
        }),
      ])}
    />
  );

  // Tooltip sits in the wrapper's coordinate space, flipped to the left half
  // once the hovered point is far enough right that it would clip.
  const hoverX = hover !== null ? xOf(hover) : 0;
  const flip = hoverX > width * 0.6;

  return (
    <ChartFrame
      title={title}
      subtitle={subtitle}
      legend={legend}
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={isEmpty}
      height={height}
      table={table}
      footnote={footnote}
      actions={actions}
    >
      <div ref={wrapRef} className="relative w-full">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          role="img"
          aria-label={`${title || 'Trend chart'}. Switch to the table view for exact values.`}
          tabIndex={0}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          onFocus={() => setHover((prev) => prev ?? 0)}
          onBlur={() => setHover(null)}
          onKeyDown={onKeyDown}
          className="block touch-pan-y focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        >
          {/* Horizontal gridlines and y labels */}
          {scale.ticks.map((t) => (
            <g key={t}>
              <line
                x1={M.left}
                x2={M.left + innerW}
                y1={yOf(t)}
                y2={yOf(t)}
                stroke="var(--chart-grid)"
                strokeWidth="1"
              />
              <text
                x={M.left - 8}
                y={yOf(t)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="10"
                fill="var(--chart-axis-text)"
                className="font-mono tabular-nums"
              >
                {formatValue(t)}
              </text>
            </g>
          ))}

          {/* x labels */}
          {labels.map((label, i) =>
            i % stride === 0 || i === n - 1 ? (
              <text
                key={`${label}-${i}`}
                x={xOf(i)}
                y={M.top + innerH + 16}
                textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
                fontSize="10"
                fill="var(--chart-axis-text)"
              >
                {label}
              </text>
            ) : null,
          )}

          {/* Prediction interval, drawn under the lines */}
          {band && (
            <path
              d={bandPath(band.lower || [], band.upper || [], xOf, yOf)}
              fill={band.color || 'var(--chart-forecast-band)'}
              stroke="none"
            />
          )}

          {series.map((s) => {
            const values = s.values || [];
            const color = s.color || 'var(--chart-series-1)';
            const split = Number.isInteger(s.dashedFrom) ? s.dashedFrom : null;

            // A shared point at the split index keeps solid and dashed joined.
            const solid = split === null ? values : values.map((v, i) => (i <= split ? v : null));
            const dashed = split === null ? null : values.map((v, i) => (i >= split ? v : null));

            return (
              <g key={s.key || s.label}>
                <motion.path
                  d={linePath(solid, xOf, yOf)}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={reducedMotion ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: reducedMotion ? 0 : 0.7, ease: 'easeOut' }}
                />
                {dashed && (
                  <path
                    d={linePath(dashed, xOf, yOf)}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeDasharray="5 4"
                    strokeLinecap="round"
                  />
                )}
                {/* Single-point series would otherwise draw nothing at all. */}
                {values.filter((v) => Number.isFinite(v)).length === 1 &&
                  values.map((v, i) =>
                    Number.isFinite(v) ? (
                      <circle key={i} cx={xOf(i)} cy={yOf(v)} r="3" fill={color} />
                    ) : null,
                  )}
              </g>
            );
          })}

          {/* Crosshair */}
          {hover !== null && (
            <g pointerEvents="none">
              <line
                x1={hoverX}
                x2={hoverX}
                y1={M.top}
                y2={M.top + innerH}
                stroke="var(--chart-axis-text)"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.6"
              />
              {series.map((s) => {
                const v = s.values?.[hover];
                if (!Number.isFinite(v)) return null;
                return (
                  <circle
                    key={s.key || s.label}
                    cx={hoverX}
                    cy={yOf(v)}
                    r="4"
                    fill={s.color || 'var(--chart-series-1)'}
                    stroke="var(--bg-card)"
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          )}
        </svg>

        {hover !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-[9rem] rounded-md border border-border-subtle bg-bg-elevated px-3 py-2 text-xs shadow-lg"
            style={flip ? { right: width - hoverX + 12 } : { left: hoverX + 12 }}
            role="status"
            aria-live="polite"
          >
            <p className="mb-1.5 font-medium text-text-primary">{labels[hover]}</p>
            {series.map((s) => {
              const v = s.values?.[hover];
              return (
                <p
                  key={s.key || s.label}
                  className="flex items-center justify-between gap-4 text-text-secondary"
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-sm"
                      style={{ background: s.color || 'var(--chart-series-1)' }}
                      aria-hidden="true"
                    />
                    {s.label}
                  </span>
                  <span className="font-mono tabular-nums text-text-primary">
                    {Number.isFinite(v) ? formatValue(v) : '—'}
                  </span>
                </p>
              );
            })}
            {band && Number.isFinite(band.lower?.[hover]) && Number.isFinite(band.upper?.[hover]) && (
              <p className="mt-1.5 border-t border-border-subtle pt-1.5 text-text-muted">
                Range {formatValue(band.lower[hover])}–{formatValue(band.upper[hover])}
              </p>
            )}
          </div>
        )}
      </div>
    </ChartFrame>
  );
}
