import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useAdminWorkspace } from '../../../contexts/AdminWorkspaceContext';
import { analyticsService } from '../../../services/api';
import { useApiData, formatCurrency, formatNumber } from '../../../hooks/useApiData';
import MetricTile from '../../ui/MetricTile';
import { BarChart, compactCurrency } from '../../charts';

/** Failed payments going down is the good direction; everything else goes up. */
const LOWER_IS_BETTER = new Set(['Failed Payments (30d)']);

export default function FinanceDashboard() {
  const { activeModule } = useAdminWorkspace();
  const enabled = activeModule === 'finance';

  const { data, loading, error, refetch } = useApiData(() => analyticsService.adminRevenue(7), [], {
    enabled,
  });

  if (!enabled) return null;

  const revenueSeries = data?.revenue_series || [];
  const hasBillingData = data?.has_billing_data;

  return (
    <div className="flex-1 overflow-y-auto bg-bg-primary p-8 text-text-primary">
      <header className="mb-8">
        <h1 className="text-display-xs font-bold">Finance</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Recurring revenue and collections, computed from active subscriptions and recorded
          invoices.
        </p>
      </header>

      {error && (
        <div
          className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-accent-red/40 bg-bg-card p-4"
          role="alert"
        >
          <AlertTriangle size={18} className="text-accent-red" aria-hidden="true" />
          <p className="flex-1 text-sm text-text-secondary">
            {error.message || 'Could not load revenue data.'}
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

      {!loading && !error && !hasBillingData && (
        <div className="mb-6 rounded-lg border border-dashed border-border-subtle bg-bg-card p-6">
          <h2 className="text-sm font-semibold text-text-primary">No billing activity yet</h2>
          <p className="mt-2 text-sm text-text-secondary">
            There are no active subscriptions or recorded invoices, so every figure below is
            genuinely zero rather than missing. Charts stay empty until the first payment is
            recorded.
          </p>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(data?.kpis || Array.from({ length: 4 }, () => ({}))).map((kpi, i) => (
          <MetricTile
            key={kpi.label || i}
            metric={kpi}
            loading={loading}
            lowerIsBetter={LOWER_IS_BETTER.has(kpi.label)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <BarChart
            title="Collected revenue by month"
            subtitle="Sum of paid invoices per calendar month."
            labels={revenueSeries.map((r) => r.label)}
            values={revenueSeries.map((r) => r.amount)}
            formatValue={compactCurrency}
            valueLabel="Collected"
            loading={loading}
            error={error}
            onRetry={refetch}
            height={280}
            footnote={
              data
                ? `Lifetime collected ${formatCurrency(data.lifetime_collected, { compact: true })} · churn rate ${data.churn_rate_pct}%`
                : undefined
            }
          />
        </div>

        <section className="rounded-lg border border-border-subtle bg-bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">Recent payments</h3>

          {loading && (
            <div className="flex flex-col gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-bg-tertiary" />
              ))}
            </div>
          )}

          {!loading && (data?.recent_payments || []).length === 0 && (
            <p className="rounded-md border border-dashed border-border-subtle p-6 text-center text-sm text-text-muted">
              No invoices recorded yet.
            </p>
          )}

          {!loading && (data?.recent_payments || []).length > 0 && (
            <ul className="flex flex-col divide-y divide-border-subtle">
              {data.recent_payments.map((payment, i) => (
                <li
                  key={`${payment.email}-${payment.date}-${i}`}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {payment.email}
                    </p>
                    <p className="text-xs text-text-muted">{payment.date}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm font-semibold tabular-nums">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p
                      className={`text-xs ${
                        /paid|succeed/i.test(payment.status)
                          ? 'text-accent-green'
                          : /fail/i.test(payment.status)
                            ? 'text-accent-red'
                            : 'text-text-muted'
                      }`}
                    >
                      {payment.status}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-border-subtle bg-bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-text-primary">Plans and subscribers</h3>

        {loading && <div className="h-24 animate-pulse rounded-md bg-bg-tertiary" />}

        {!loading && (data?.plan_breakdown || []).length === 0 && (
          <p className="rounded-md border border-dashed border-border-subtle p-6 text-center text-sm text-text-muted">
            No active plans are configured.
          </p>
        )}

        {!loading && (data?.plan_breakdown || []).length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse text-sm">
              <thead>
                <tr>
                  {['Plan', 'Price', 'Billing', 'Active subscribers'].map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={`border-b border-border-subtle px-3 py-2 text-xs font-semibold uppercase tracking-wide text-text-muted ${
                        i === 0 ? 'text-left' : 'text-right'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.plan_breakdown.map((plan) => (
                  <tr key={plan.plan} className="border-b border-border-subtle/60 last:border-0">
                    <td className="px-3 py-2.5 text-text-primary">{plan.plan}</td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                      {formatCurrency(plan.price)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-text-secondary">
                      per {plan.interval}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                      {formatNumber(plan.subscribers)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data?.subscription_states && (
          <p className="mt-4 text-xs text-text-muted">
            {formatNumber(data.subscription_states.active)} active ·{' '}
            {formatNumber(data.subscription_states.past_due)} past due ·{' '}
            {formatNumber(data.subscription_states.canceled)} canceled
          </p>
        )}
      </section>
    </div>
  );
}
