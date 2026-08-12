import React, { useState } from 'react';
import { AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { insightsService } from '../../services/api';
import { useApiData, formatNumber } from '../../hooks/useApiData';
import { TrendChart, SeverityBars, toForecastChart, forecastCaption } from '../../components/charts';

/**
 * A security report built from this account's own scan history.
 *
 * The previous version of this page listed four downloadable PDFs that did not
 * exist and asserted SOC 2 / ISO 27001 / GDPR compliance scores that nothing in
 * the system measures. Both are removed. The export below writes a CSV from the
 * same rows the charts draw, so what you download is what you see.
 */
const RANGES = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

const SCAN_TYPE_LABELS = {
  TEXT: 'Text messages',
  URL: 'Links',
  FILE: 'Files',
  SCREENSHOT: 'Screenshots',
  PHONE: 'Phone numbers',
};

function downloadCsv(filename, rows) {
  const escape = (cell) => {
    const value = String(cell ?? '');
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  };

  const csv = rows.map((row) => row.map(escape).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [days, setDays] = useState(30);

  const forecastQuery = useApiData(() => insightsService.forecast(days), [days]);
  const insightsQuery = useApiData(() => insightsService.insights(days), [days]);

  const loading = forecastQuery.loading || insightsQuery.loading;
  const error = forecastQuery.error || insightsQuery.error;
  const refetch = () => {
    forecastQuery.refetch();
    insightsQuery.refetch();
  };

  const report = forecastQuery.data;
  const insights = insightsQuery.data;

  const history = report?.history || [];
  const summary = insights?.summary;
  const probability = report?.encounter_probability;
  const trajectory = report?.risk_trajectory;

  const scanChart = toForecastChart({
    history,
    forecast: report?.scan_forecast,
    valueKey: 'scans',
    label: 'Scans',
    color: 'var(--chart-series-1)',
  });

  // Threats ride on the same x axis as scans; when the threat forecast is not
  // available its line simply stops at the last measured day.
  const threatForecast = report?.threat_forecast;
  const threatValues = history.map((h) => h.threats);
  const threatSeries = threatForecast?.available
    ? {
        key: 'threats',
        label: 'Threats',
        values: [...threatValues, ...threatForecast.points.map((p) => p.predicted)],
        color: 'var(--chart-series-2)',
        dashedFrom: threatValues.length - 1,
      }
    : {
        key: 'threats',
        label: 'Threats',
        values: [...threatValues, ...new Array(scanChart.labels.length - threatValues.length).fill(null)],
        color: 'var(--chart-series-2)',
      };

  const scanTypes = Object.entries(insights?.scan_type_distribution || {})
    .map(([key, count]) => ({ label: SCAN_TYPE_LABELS[key] || key, value: count }))
    .sort((a, b) => b.value - a.value);

  const exportCsv = () => {
    const rows = [
      ['CyberSentinel security report'],
      ['Period', `last ${days} days`],
      ['Generated', new Date().toISOString()],
      [],
      ['Date', 'Scans', 'Threats'],
      ...history.map((h) => [h.date, h.scans, h.threats]),
    ];

    if (report?.scan_forecast?.available) {
      rows.push([], ['Projected date', 'Predicted scans', 'Lower bound', 'Upper bound']);
      report.scan_forecast.points.forEach((p) =>
        rows.push([p.date, p.predicted, p.lower, p.upper]),
      );
    }

    downloadCsv(`cybersentinel-report-${days}d-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-display-xs font-bold text-text-primary">Security reports</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Your scan history, what it predicts, and an export of the underlying numbers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className="inline-flex rounded-md border border-border-subtle p-0.5"
            role="group"
            aria-label="Reporting period"
          >
            {RANGES.map((r) => (
              <button
                key={r.days}
                type="button"
                onClick={() => setDays(r.days)}
                aria-pressed={days === r.days}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  days === r.days
                    ? 'bg-accent text-text-inverse'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={exportCsv}
            disabled={loading || history.length === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={13} aria-hidden="true" />
            Export CSV
          </button>
        </div>
      </header>

      {error && (
        <div
          className="flex flex-wrap items-center gap-3 rounded-lg border border-accent-red/40 bg-bg-card p-4"
          role="alert"
        >
          <AlertTriangle size={18} className="text-accent-red" aria-hidden="true" />
          <p className="flex-1 text-sm text-text-secondary">
            {error.message || 'Could not load your report.'}
          </p>
          <button
            type="button"
            onClick={refetch}
            className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:border-border-strong"
          >
            <RefreshCw size={13} aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          ['Scans', summary?.scans],
          ['Threats found', summary?.threats],
          ['Critical', summary?.critical],
          ['Threat rate', summary ? `${summary.threat_rate_pct}%` : null],
          ['Average risk', summary?.average_risk],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border-subtle bg-bg-card p-4 shadow-sm">
            <p className="text-xs text-text-secondary">{label}</p>
            {loading ? (
              <div className="mt-2 h-7 w-14 animate-pulse rounded bg-bg-tertiary" />
            ) : (
              <p className="mt-2 font-mono text-2xl font-bold leading-none tabular-nums text-text-primary">
                {typeof value === 'string' ? value : formatNumber(value)}
              </p>
            )}
          </div>
        ))}
      </div>

      <TrendChart
        title="Scans and threats over time"
        subtitle={`Daily counts for the last ${days} days, with the projection appended.`}
        labels={scanChart.labels}
        series={[...scanChart.series, threatSeries]}
        band={scanChart.band}
        loading={loading}
        error={error}
        onRetry={refetch}
        height={300}
        footnote={forecastCaption(report?.scan_forecast)}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border-subtle bg-bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-text-primary">Threat outlook</h3>

          {loading ? (
            <div className="mt-4 h-20 animate-pulse rounded bg-bg-tertiary" />
          ) : probability?.available ? (
            <>
              <p className="mt-4 font-mono text-[2.25rem] font-bold leading-none tabular-nums text-text-primary">
                {probability.probability}%
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                {probability.band} that you encounter at least one threat in the next{' '}
                {probability.horizon_days} days.
              </p>
              <p className="mt-3 text-xs text-text-muted">
                {probability.model}. Fitted to {probability.observed_threats} threats across{' '}
                {probability.observed_days} days, a rate of {probability.daily_rate} per day.
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm text-text-muted">
              {probability?.reason || 'Not enough scan history to estimate this yet.'}
            </p>
          )}
        </section>

        <section className="rounded-lg border border-border-subtle bg-bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-text-primary">Risk trajectory</h3>

          {loading ? (
            <div className="mt-4 h-20 animate-pulse rounded bg-bg-tertiary" />
          ) : trajectory?.available ? (
            <>
              <p
                className="mt-4 font-mono text-[2.25rem] font-bold leading-none tabular-nums"
                style={{
                  color:
                    trajectory.direction === 'worsening'
                      ? 'var(--sev-high)'
                      : trajectory.direction === 'improving'
                        ? 'var(--sev-low)'
                        : 'var(--text-primary)',
                }}
              >
                {trajectory.exposure_score}
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                Exposure is {trajectory.direction} — {trajectory.delta > 0 ? '+' : ''}
                {trajectory.delta} points between your earliest and most recent scans in this
                period.
              </p>
              <p className="mt-3 text-xs text-text-muted">
                {trajectory.method}, over {trajectory.sample_size} scans.
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm text-text-muted">
              {trajectory?.reason || 'No scored scans yet.'}
            </p>
          )}
        </section>
      </div>

      <SeverityBars
        title="What you scanned"
        subtitle={`Your scan volume by input type over the last ${days} days.`}
        items={scanTypes}
        valueLabel="Scans"
        loading={loading}
        error={error}
        onRetry={refetch}
        emptyLabel="You have not run any scans in this period."
      />
    </div>
  );
}
