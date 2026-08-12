import React, { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import ChartFrame, { ChartTable } from './ChartFrame';
import {
  compactNumber,
  labelStride,
  niceScale,
  useChartWidth,
  usePrefersReducedMotion,
} from './chartPrimitives';

const M = { top: 12, right: 12, bottom: 26, left: 52 };

/**
 * Vertical bars for a single measure over time — monthly revenue, monthly scan
 * volume. One series only: two side-by-side series make the reader compare
 * across a gap, which is what the line chart is for.
 */
export default function BarChart({
  labels = [],
  values = [],
  color = 'var(--chart-series-1)',
  height = 240,
  formatValue = compactNumber,
  valueLabel = 'Value',
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
  const [hover, setHover] = useState(null);

  const innerW = Math.max(width - M.left - M.right, 10);
  const innerH = Math.max(height - M.top - M.bottom, 10);
  const n = labels.length;

  const isEmpty = n === 0 || !values.some((v) => Number.isFinite(v) && v !== 0);

  const scale = useMemo(
    () => niceScale(0, Math.max(...values.filter(Number.isFinite), 0)),
    [values],
  );

  const yOf = useCallback(
    (v) => {
      const span = scale.max - scale.min || 1;
      return M.top + innerH - ((v - scale.min) / span) * innerH;
    },
    [scale, innerH],
  );

  const slot = n > 0 ? innerW / n : innerW;
  const barW = Math.max(Math.min(slot * 0.62, 48), 4);
  const stride = labelStride(n, innerW);

  const table = (
    <ChartTable
      caption={title}
      columns={['Period', valueLabel]}
      rows={labels.map((label, i) => [
        label,
        Number.isFinite(values[i]) ? formatValue(values[i]) : '—',
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
      height={height}
      table={table}
      footnote={footnote}
      actions={actions}
    >
      <div ref={wrapRef} className="relative w-full">
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`${title || 'Bar chart'}. Switch to the table view for exact values.`}
          className="block"
        >
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

          {labels.map((label, i) => {
            const v = Number.isFinite(values[i]) ? values[i] : 0;
            const x = M.left + slot * i + (slot - barW) / 2;
            const y = yOf(v);
            const h = Math.max(M.top + innerH - y, v > 0 ? 1 : 0);

            return (
              <g key={`${label}-${i}`}>
                <motion.rect
                  x={x}
                  width={barW}
                  rx="3"
                  fill={color}
                  opacity={hover === null || hover === i ? 1 : 0.45}
                  initial={reducedMotion ? false : { y: M.top + innerH, height: 0 }}
                  animate={{ y, height: h }}
                  transition={{
                    duration: reducedMotion ? 0 : 0.5,
                    delay: reducedMotion ? 0 : i * 0.03,
                    ease: 'easeOut',
                  }}
                />
                {/* Full-height hit area: a short bar is otherwise hard to hover. */}
                <rect
                  x={M.left + slot * i}
                  y={M.top}
                  width={slot}
                  height={innerH}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                />
                {(i % stride === 0 || i === n - 1) && (
                  <text
                    x={M.left + slot * i + slot / 2}
                    y={M.top + innerH + 16}
                    textAnchor="middle"
                    fontSize="10"
                    fill="var(--chart-axis-text)"
                  >
                    {label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {hover !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 rounded-md border border-border-subtle bg-bg-elevated px-3 py-2 text-xs shadow-lg"
            style={
              M.left + slot * hover > width * 0.6
                ? { right: width - (M.left + slot * hover + slot / 2) + 12 }
                : { left: M.left + slot * hover + slot / 2 + 12 }
            }
            role="status"
            aria-live="polite"
          >
            <p className="font-medium text-text-primary">{labels[hover]}</p>
            <p className="mt-1 font-mono tabular-nums text-text-secondary">
              {Number.isFinite(values[hover]) ? formatValue(values[hover]) : '—'}
            </p>
          </div>
        )}
      </div>
    </ChartFrame>
  );
}
