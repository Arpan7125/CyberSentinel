/**
 * Turn the backend's `{ history, forecast }` pair into TrendChart props.
 *
 * The forecast is appended to the same x axis as the measured history rather
 * than being drawn in its own panel, and the join point carries the last real
 * value so the dashed projection starts exactly where the solid line ends. The
 * prediction interval pinches to zero width at that join, which is the honest
 * shape: uncertainty is nil at the last observation and widens from there.
 *
 * When `forecast.available` is false the history is returned unchanged and the
 * caller shows the backend's `reason` instead of a projection.
 */
export function toForecastChart({
  history = [],
  forecast = null,
  valueKey = 'scans',
  label = 'Actual',
  labelKey = 'date',
  color = 'var(--chart-series-1)',
}) {
  const labels = history.map((h) => h[labelKey]);
  const actual = history.map((h) => Number(h[valueKey]) || 0);

  if (!forecast?.available || !forecast.points?.length || actual.length === 0) {
    return {
      labels,
      series: [{ key: 'actual', label, values: actual, color }],
      band: null,
      forecastAvailable: false,
      reason: forecast?.reason || null,
    };
  }

  const join = actual.length - 1;
  const points = forecast.points;

  const allLabels = [...labels, ...points.map((p) => p.date)];
  const values = [...actual, ...points.map((p) => Number(p.predicted) || 0)];

  const pad = new Array(join).fill(null);
  const lower = [...pad, actual[join], ...points.map((p) => Number(p.lower) || 0)];
  const upper = [...pad, actual[join], ...points.map((p) => Number(p.upper) || 0)];

  return {
    labels: allLabels,
    series: [{ key: 'actual', label, values, color, dashedFrom: join }],
    band: { lower, upper },
    forecastAvailable: true,
    reason: null,
  };
}

/** One-line description of a forecast, for the chart footnote. */
export function forecastCaption(forecast) {
  if (!forecast) return null;
  if (!forecast.available) return forecast.reason;

  const direction =
    forecast.trend === 'rising'
      ? 'trending up'
      : forecast.trend === 'falling'
        ? 'trending down'
        : 'holding steady';

  const change =
    forecast.change_pct === null || forecast.change_pct === undefined
      ? ''
      : ` (${forecast.change_pct > 0 ? '+' : ''}${forecast.change_pct}% vs the last 7 days)`;

  return (
    `Dashed line: next ${forecast.horizon_days} days, ${direction}${change}. ` +
    `Shaded band is the ${forecast.confidence}, fitted to ${forecast.basis_days} days of history.`
  );
}
