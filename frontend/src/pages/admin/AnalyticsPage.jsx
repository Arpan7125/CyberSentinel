import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Users, ShieldAlert, Activity, Mail } from 'lucide-react';
import { analyticsService } from '../../services/api';
import { useApiData, formatNumber } from '../../hooks/useApiData';
import MetricTile from '../../components/ui/MetricTile';
import { TrendChart, SeverityBars, forecastCaption } from '../../components/charts';

/** Metrics where a fall is the good outcome. */
const LOWER_IS_BETTER = new Set(['Threats Detected', 'Threat Hit Rate']);

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

const ICONS = {
  'New Accounts': <Users size={16} />,
  'Scans Performed': <Activity size={16} />,
  'Threats Detected': <ShieldAlert size={16} />,
  'Newsletter Signups': <Mail size={16} />,
};

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data, loading, error, refetch } = useApiData(
    () => analyticsService.adminAnalytics(days),
    [days],
  );

  const timeseries = data?.timeseries || [];
  const labels = timeseries.map((p) => p.date);

  const scanTypes = Object.entries(data?.scan_type_distribution || {})
    .map(([key, count]) => ({ label: SCAN_TYPE_LABELS[key] || key, value: count }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-display-xs font-bold text-text-primary">Platform Analytics</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Traffic, engagement, and conversion measured from platform activity — no sampled or
            estimated figures.
          </p>
        </div>

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
      </header>

      {error && (
        <div
          className="flex flex-wrap items-center gap-3 rounded-lg border border-accent-red/40 bg-bg-card p-4"
          role="alert"
        >
          <AlertTriangle size={18} className="text-accent-red" aria-hidden="true" />
          <p className="flex-1 text-sm text-text-secondary">
            {error.message || 'Could not load analytics.'}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(data?.traffic_metrics || Array.from({ length: 4 }, () => ({}))).map((m, i) => (
          <MetricTile
            key={m.label || i}
            metric={m}
            loading={loading}
            icon={ICONS[m.label]}
            lowerIsBetter={LOWER_IS_BETTER.has(m.label)}
          />
        ))}
      </div>

      <TrendChart
        title="Scans and threats per day"
        subtitle={`Daily volume across the last ${days} days, with a ${data?.forecast?.scans?.horizon_days || 7}-day projection.`}
        labels={labels}
        series={[
          {
            key: 'scans',
            label: 'Scans',
            values: timeseries.map((p) => p.scans),
            color: 'var(--chart-series-1)',
          },
          {
            key: 'threats',
            label: 'Threats',
            values: timeseries.map((p) => p.threats),
            color: 'var(--chart-series-2)',
          },
        ]}
        loading={loading}
        error={error}
        onRetry={refetch}
        height={280}
        footnote={forecastCaption(data?.forecast?.scans)}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-border-subtle bg-bg-card p-5 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-text-primary">Conversion and engagement</h3>
          <p className="mb-4 text-xs text-text-muted">
            Counted from accounts, scans, and leads recorded in this period.
          </p>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-md bg-bg-tertiary" />
              ))}
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {(data?.conversion_metrics || []).map((m) => (
                <li
                  key={m.label}
                  className="flex items-center justify-between gap-4 rounded-md border border-border-subtle bg-bg-secondary px-4 py-3"
                >
                  <span className="text-sm text-text-secondary">{m.label}</span>
                  <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-text-primary">
                    {m.unit === '%' ? `${m.value}%` : formatNumber(m.value)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <SeverityBars
          title="What people are scanning"
          subtitle={`Scan volume by input type over the last ${days} days.`}
          items={scanTypes}
          valueLabel="Scans"
          loading={loading}
          error={error}
          onRetry={refetch}
          emptyLabel="No scans have been run in this period."
        />
      </div>

      {data?.totals && (
        <section className="rounded-lg border border-border-subtle bg-bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">Platform totals (all time)</h3>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ['Registered users', data.totals.users],
              ['Paying accounts', data.totals.paying_users],
              ['Scans run', data.totals.scans],
              ['Open tickets', data.totals.open_tickets],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-text-muted">{label}</dt>
                <dd className="mt-1 font-mono text-xl font-bold tabular-nums text-text-primary">
                  {formatNumber(value)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
