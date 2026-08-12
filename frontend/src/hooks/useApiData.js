import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Fetch data from the API with consistent loading / error / empty handling.
 *
 * Every dashboard previously rendered a hard-coded array, so none of them had
 * any of these states. Centralising them here means a failed request shows a
 * real error with a retry rather than an empty page that looks like "you have
 * no data" — the two are very different messages to give a user.
 *
 * @param {() => Promise<any>} fetcher  Call that returns the data.
 * @param {Array} deps                  Re-fetch when these change.
 * @param {{ enabled?: boolean }} options
 */
export function useApiData(fetcher, deps = [], options = {}) {
  const { enabled = true } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  // Guards against setting state after unmount, and against a slow earlier
  // request overwriting the result of a faster later one.
  const requestId = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const load = useCallback(async () => {
    if (!enabled) return;

    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      if (mounted.current && id === requestId.current) {
        setData(result);
      }
    } catch (err) {
      if (mounted.current && id === requestId.current) {
        setError(err);
      }
    } finally {
      if (mounted.current && id === requestId.current) {
        setLoading(false);
      }
    }
    // `fetcher` is intentionally excluded: callers pass an inline arrow, which
    // would be a new reference on every render and loop forever. `deps` is the
    // caller's explicit statement of what should trigger a refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refetch: load, isEmpty: !loading && !error && !data };
}

/**
 * Format a value the API returned as a percentage change.
 *
 * The backend sends `null` when there is no prior period to compare against,
 * which is different from 0% — showing "0%" for a metric's first-ever period
 * is a fabricated comparison.
 */
export function formatChange(changePct) {
  if (changePct === null || changePct === undefined) {
    return { label: 'No prior period', direction: 'neutral' };
  }
  const rounded = Math.round(changePct * 10) / 10;
  return {
    label: `${rounded > 0 ? '+' : ''}${rounded}%`,
    direction: rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'neutral',
  };
}

/** Currency display for the revenue dashboards. */
export function formatCurrency(value, { compact = false } = {}) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: compact && Math.abs(amount) >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: compact && Math.abs(amount) >= 10000 ? 1 : 2,
  }).format(amount);
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value) || 0);
}
