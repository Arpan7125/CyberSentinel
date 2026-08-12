import React, { useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { analyticsService } from '../../services/api';
import { useApiData, formatNumber } from '../../hooks/useApiData';
import { SeverityBars, TrendChart, severityColor, forecastCaption } from '../../components/charts';

const RANGES = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

export default function ThreatCenterPage() {
  const [days, setDays] = useState(30);
  const { data, loading, error, refetch } = useApiData(
    () => analyticsService.adminThreatCenter(days),
    [days],
  );

  const severity = data?.severity_distribution || [];
  const criticalScans = data?.critical_scans || [];
  const reportQueue = data?.report_queue || [];

  // The threat-center endpoint returns a forecast but no history series of its
  // own, so the projection is charted on its own axis starting from today.
  const forecast = data?.forecast;
  const forecastChart = forecast?.available
    ? {
        labels: forecast.points.map((p) => p.date),
        series: [
          {
            key: 'projected',
            label: 'Projected threats/day',
            values: forecast.points.map((p) => p.predicted),
            color: 'var(--chart-series-2)',
          },
        ],
        band: {
          lower: forecast.points.map((p) => p.lower),
          upper: forecast.points.map((p) => p.upper),
          color: 'var(--chart-forecast-band)',
        },
      }
    : null;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-display-xs font-bold text-text-primary">Threat Center</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Severity distribution and the live investigation queue, built from scans this platform
            actually processed.
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
            {error.message || 'Could not load threat data.'}
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
        {severity.slice(0, 4).map((s) => (
          <div
            key={s.level}
            className="rounded-lg border border-border-subtle bg-bg-card p-5 shadow-sm"
            style={{ borderLeft: `3px solid ${severityColor(s.level)}` }}
          >
            <span className="text-[0.8125rem] font-medium text-text-secondary">
              {s.level} severity
            </span>
            {loading ? (
              <div className="mt-3 h-8 w-16 animate-pulse rounded bg-bg-tertiary" />
            ) : (
              <div
                className="mt-3 font-mono text-[1.75rem] font-bold leading-none tabular-nums"
                style={{ color: severityColor(s.level) }}
              >
                {formatNumber(s.count)}
              </div>
            )}
            <p className="mt-2 text-xs text-text-muted">
              {s.change_pct === null || s.change_pct === undefined
                ? 'No prior period to compare'
                : `${s.change_pct > 0 ? '+' : ''}${s.change_pct}% vs prior period`}
            </p>
          </div>
        ))}

        {!loading && severity.length === 0 && (
          <p className="col-span-full rounded-lg border border-dashed border-border-subtle p-6 text-center text-sm text-text-muted">
            No scans recorded in this period.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SeverityBars
          title="Severity distribution"
          subtitle={`${formatNumber(data?.total_scanned || 0)} scans in the last ${days} days · average risk score ${data?.average_risk_score ?? 0}`}
          items={severity.map((s) => ({ label: s.level, value: s.count, tone: s.level }))}
          valueLabel="Scans"
          loading={loading}
          error={error}
          onRetry={refetch}
        />

        {forecastChart ? (
          <TrendChart
            title="Projected threat volume"
            subtitle={`Next ${forecast.horizon_days} days, extrapolated from ${forecast.basis_days} days of history.`}
            labels={forecastChart.labels}
            series={forecastChart.series}
            band={forecastChart.band}
            loading={loading}
            error={error}
            onRetry={refetch}
            footnote={forecastCaption(forecast)}
          />
        ) : (
          <section className="flex flex-col justify-center rounded-lg border border-border-subtle bg-bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-text-primary">Projected threat volume</h3>
            <p className="mt-3 text-sm text-text-muted">
              {loading
                ? 'Loading…'
                : forecast?.reason ||
                  'A forecast needs a longer run of daily activity than the platform has recorded so far.'}
            </p>
          </section>
        )}
      </div>

      <section className="rounded-lg border border-border-subtle bg-bg-card p-5 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold text-text-primary">
          High and critical scans awaiting review
        </h3>
        <p className="mb-4 text-xs text-text-muted">
          The 25 most recent scans scored High or Critical in this period.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] border-collapse text-sm">
            <thead>
              <tr>
                {['Scan', 'Type', 'Content', 'Score', 'Account', 'Detected'].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={`border-b border-border-subtle px-3 py-2 text-xs font-semibold uppercase tracking-wide text-text-muted ${
                      i === 3 ? 'text-right' : 'text-left'
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading &&
                [0, 1, 2].map((i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-3 py-3">
                      <div className="h-5 animate-pulse rounded bg-bg-tertiary" />
                    </td>
                  </tr>
                ))}

              {!loading && criticalScans.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-text-muted">
                    No high or critical threats detected in this period.
                  </td>
                </tr>
              )}

              {!loading &&
                criticalScans.map((scan) => (
                  <tr key={scan.id} className="border-b border-border-subtle/60 last:border-0">
                    <td className="px-3 py-2.5 font-mono text-xs text-text-secondary">#{scan.id}</td>
                    <td className="px-3 py-2.5 text-text-secondary">{scan.scan_type}</td>
                    <td className="max-w-[22rem] truncate px-3 py-2.5 text-text-primary" title={scan.preview}>
                      {scan.preview}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold tabular-nums"
                        style={{ color: severityColor(scan.risk_level) }}
                      >
                        {scan.risk_score}
                        <span className="text-xs font-medium">{scan.risk_level}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-text-secondary">{scan.user}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-text-muted">
                      {scan.created_at}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-border-subtle bg-bg-card p-5 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold text-text-primary">Community scam reports</h3>
        <p className="mb-4 text-xs text-text-muted">
          Submissions from users, newest first.
          {data?.report_status_counts &&
            Object.entries(data.report_status_counts).length > 0 &&
            ` — ${Object.entries(data.report_status_counts)
              .map(([status, count]) => `${count} ${status}`)
              .join(', ')}`}
        </p>

        {loading && <div className="h-24 animate-pulse rounded-md bg-bg-tertiary" />}

        {!loading && reportQueue.length === 0 && (
          <p className="rounded-md border border-dashed border-border-subtle p-6 text-center text-sm text-text-muted">
            No scam reports have been submitted yet.
          </p>
        )}

        {!loading && reportQueue.length > 0 && (
          <ul className="flex flex-col gap-3">
            {reportQueue.map((report) => (
              <li
                key={report.id}
                className="rounded-md border border-border-subtle bg-bg-secondary p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-sm text-text-primary">{report.target}</span>
                  <span className="rounded-full border border-border-subtle px-2.5 py-0.5 text-xs text-text-secondary">
                    {report.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-text-secondary">{report.description}</p>
                <p className="mt-2 text-xs text-text-muted">
                  Reported by {report.reported_by} · {report.created_at}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
