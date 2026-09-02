import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Shared maths and browser plumbing for the SVG charts.
 *
 * These charts are hand-drawn SVG rather than a charting library: the project
 * has three runtime themes driven by CSS custom properties, and reading colours
 * straight out of `var(--chart-series-1)` in the SVG attributes keeps the marks
 * reactive to a theme switch with no JavaScript involved at all.
 */

/**
 * Measure the container so the SVG can be sized in real pixels.
 *
 * This returns a *callback* ref rather than an object ref on purpose. Charts
 * spend their first render inside a loading state where the measured element
 * does not exist yet, so a `useEffect(..., [])` reading `ref.current` would find
 * null, bail, and never run again — leaving every chart stuck at the fallback
 * width for the rest of the page's life. A callback ref fires when the node
 * actually attaches, whenever that turns out to be.
 */
export function useChartWidth(fallback = 640) {
  const [width, setWidth] = useState(fallback);
  const observer = useRef(null);

  const ref = useCallback((node) => {
    if (observer.current) {
      observer.current.disconnect();
      observer.current = null;
    }
    if (!node) return;

    const apply = (w) => {
      if (!w) return;
      setWidth((prev) => (Math.abs(w - prev) > 1 ? w : prev));
    };

    apply(node.clientWidth);

    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => apply(entries[0]?.contentRect?.width));
    ro.observe(node);
    observer.current = ro;
  }, []);

  // Detach on unmount; the callback ref handles every other transition.
  useEffect(() => () => observer.current?.disconnect(), []);

  return [ref, Math.max(width, 240)];
}

/** Honour the OS "reduce motion" setting for the line-draw animation. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  return reduced;
}

function niceNum(range, round) {
  if (range <= 0) return 1;
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / 10 ** exponent;
  let niceFraction;

  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else if (fraction <= 1) niceFraction = 1;
  else if (fraction <= 2) niceFraction = 2;
  else if (fraction <= 5) niceFraction = 5;
  else niceFraction = 10;

  return niceFraction * 10 ** exponent;
}

/**
 * Axis bounds on round numbers. Always includes zero for the counts and money
 * these charts show — a truncated baseline exaggerates differences.
 */
export function niceScale(rawMin, rawMax, tickCount = 4) {
  let min = Number.isFinite(rawMin) ? Math.min(rawMin, 0) : 0;
  let max = Number.isFinite(rawMax) ? rawMax : 1;

  if (max <= min) max = min + 1;

  const step = niceNum((max - min) / Math.max(tickCount - 1, 1), true);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;

  const ticks = [];
  for (let v = niceMin; v <= niceMax + step * 0.5; v += step) {
    ticks.push(Number(v.toPrecision(12)));
  }

  return { min: niceMin, max: niceMax, ticks };
}

/** Straight-segment path. `null` values break the line rather than drawing to zero. */
export function linePath(values, xOf, yOf) {
  let d = '';
  let pen = 'M';

  values.forEach((v, i) => {
    if (v === null || v === undefined || !Number.isFinite(v)) {
      pen = 'M';
      return;
    }
    d += `${pen}${xOf(i).toFixed(2)} ${yOf(v).toFixed(2)} `;
    pen = 'L';
  });

  return d.trim();
}

/** Closed path between an upper and lower bound — the prediction interval. */
export function bandPath(lower, upper, xOf, yOf) {
  const top = [];
  const bottom = [];

  upper.forEach((v, i) => {
    if (v === null || v === undefined || !Number.isFinite(v)) return;
    top.push(`${xOf(i).toFixed(2)} ${yOf(v).toFixed(2)}`);
  });

  for (let i = lower.length - 1; i >= 0; i -= 1) {
    const v = lower[i];
    if (v === null || v === undefined || !Number.isFinite(v)) continue;
    bottom.push(`${xOf(i).toFixed(2)} ${yOf(v).toFixed(2)}`);
  }

  if (top.length < 2 || bottom.length < 2) return '';
  return `M${top.join(' L')} L${bottom.join(' L')} Z`;
}

/** Thin out x labels so they never collide on a narrow container. */
export function labelStride(count, width, perLabel = 72) {
  const room = Math.max(Math.floor(width / perLabel), 2);
  return Math.max(Math.ceil(count / room), 1);
}

/**
 * Severity name → status colour token.
 *
 * Lives here rather than beside the component that uses it so that module keeps
 * exporting only components — mixing the two breaks React Fast Refresh, which
 * then full-reloads the page on every edit instead of preserving state.
 *
 * These are the reserved status colours, never the categorical series colours,
 * and callers must always pair them with a visible text label so meaning never
 * rests on colour alone.
 */
const SEVERITY_TONES = {
  critical: 'var(--sev-critical)',
  high: 'var(--sev-high)',
  medium: 'var(--sev-medium)',
  low: 'var(--sev-low)',
  safe: 'var(--sev-low)',
  unknown: 'var(--sev-unknown)',
};

export function severityColor(name) {
  return SEVERITY_TONES[String(name || '').toLowerCase()] || 'var(--chart-series-1)';
}

export const compactNumber = (value) => {
  const n = Number(value) || 0;
  const compact = Math.abs(n) >= 100000;
  return new Intl.NumberFormat('en-IN', {
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : Number.isInteger(n) ? 0 : 1,
  }).format(n);
};

export const compactCurrency = (value) => {
  const n = Number(value) || 0;
  // Compacts at a lakh rather than at ten thousand, because en-IN abbreviates
  // on the Indian scale (T, L, Cr) and switching at 10,000 would render an
  // axis of "10T" labels that mean nothing to the reader.
  const compact = Math.abs(n) >= 100000;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 0,
  }).format(n);
};
