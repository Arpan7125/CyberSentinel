import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CreditCard, Download, Infinity as InfinityIcon, RefreshCw } from 'lucide-react';
import { insightsService } from '../../services/api';
import { useApiData, formatCurrency, formatNumber } from '../../hooks/useApiData';

/**
 * Plan, quota usage, and invoices — every figure read from `/api/usage/`.
 *
 * The previous version of this page derived "Scanned Data (GB)" by multiplying
 * the scan count by 0.1 and reported a fixed "2 protected endpoints". Neither
 * quantity exists anywhere in the system. They are replaced by the quotas the
 * backend actually enforces per plan.
 */
const STATUS_LABELS = {
  active: 'Active',
  past_due: 'Past due',
  canceled: 'Canceled',
  trialing: 'Trial',
  none: 'No subscription',
};

export default function BillingPage() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useApiData(() => insightsService.usage(), []);

  const metrics = data?.metrics || [];
  const invoices = data?.invoices || [];
  const status = data?.status || 'none';

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-display-xs font-bold text-text-primary">Billing &amp; usage</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Your plan, the quotas it carries, and what you have used in the current 30-day period.
        </p>
      </header>

      {error && (
        <div
          className="flex flex-wrap items-center gap-3 rounded-lg border border-accent-red/40 bg-bg-card p-4"
          role="alert"
        >
          <AlertTriangle size={18} className="text-accent-red" aria-hidden="true" />
          <p className="flex-1 text-sm text-text-secondary">
            {error.message || 'Could not load your billing details.'}
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-border-subtle bg-bg-card p-6 shadow-sm lg:col-span-2">
          {loading ? (
            <div className="h-24 animate-pulse rounded-md bg-bg-tertiary" />
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      status === 'active'
                        ? 'bg-accent-green/15 text-accent-green'
                        : status === 'past_due'
                          ? 'bg-accent-red/15 text-accent-red'
                          : 'bg-bg-tertiary text-text-secondary'
                    }`}
                  >
                    {STATUS_LABELS[status] || status}
                  </span>
                  <h2 className="mt-2 text-xl font-bold text-text-primary">{data?.plan}</h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    {data?.renews_at
                      ? data.cancel_at_period_end
                        ? `Ends ${data.renews_at} — cancellation is scheduled`
                        : `Renews ${data.renews_at}`
                      : 'No renewal date on file'}
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-pub btn-pub-primary btn-pub-sm"
                  onClick={() => navigate('/pricing')}
                >
                  {status === 'active' ? 'Change plan' : 'View plans'}
                </button>
              </div>

              <p className="mt-4 text-xs text-text-muted">
                Usage period {data?.period_start} to {data?.period_end}
              </p>
            </>
          )}
        </section>

        <section className="rounded-lg border border-border-subtle bg-bg-card p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-text-primary">Payment method</h3>
          <div className="mt-4 flex items-center gap-3 rounded-md border border-border-subtle bg-bg-secondary p-4">
            <CreditCard size={22} className="shrink-0 text-text-muted" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-text-primary">No card stored here</p>
              <p className="mt-0.5 text-xs text-text-secondary">
                Card details are collected by the payment provider at checkout, never by this
                application.
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-border-subtle bg-bg-card p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-text-primary">Plan limits</h3>
        <p className="mt-1 text-xs text-text-muted">
          Measured over the last 30 days against the quota your plan carries.
        </p>

        {loading ? (
          <div className="mt-5 flex flex-col gap-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-bg-tertiary" />
            ))}
          </div>
        ) : (
          <ul className="mt-5 flex flex-col gap-5">
            {metrics.map((metric) => {
              const pct = metric.unlimited ? 0 : (metric.pct ?? 0);
              const nearLimit = !metric.unlimited && pct >= 80;

              return (
                <li key={metric.label} className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium text-text-primary">{metric.label}</span>
                    <span className="font-mono tabular-nums text-text-secondary">
                      {formatNumber(metric.used)}
                      {metric.unlimited ? (
                        <span className="ml-1.5 inline-flex items-center gap-1 text-xs text-text-muted">
                          / <InfinityIcon size={12} aria-hidden="true" />
                          <span className="sr-only">unlimited</span>
                        </span>
                      ) : (
                        <span className="text-text-muted"> / {formatNumber(metric.limit)}</span>
                      )}
                    </span>
                  </div>

                  {!metric.unlimited && (
                    <div className="h-2 w-full overflow-hidden rounded-full bg-bg-hover">
                      <div
                        className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          background: nearLimit ? 'var(--sev-high)' : 'var(--accent)',
                        }}
                        role="img"
                        aria-label={`${metric.label}: ${pct}% of quota used`}
                      />
                    </div>
                  )}

                  {nearLimit && (
                    <p className="text-xs text-accent-orange">
                      {pct}% of this quota is used. Upgrading raises the limit.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-border-subtle bg-bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-text-primary">Invoices</h3>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-sm">
            <thead>
              <tr>
                {['Invoice', 'Date', 'Amount', 'Status', ''].map((h, i) => (
                  <th
                    key={h || i}
                    scope="col"
                    className={`border-b border-border-subtle px-3 py-2 text-xs font-semibold uppercase tracking-wide text-text-muted ${
                      i === 2 ? 'text-right' : 'text-left'
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-3 py-4">
                    <div className="h-5 animate-pulse rounded bg-bg-tertiary" />
                  </td>
                </tr>
              )}

              {!loading && invoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-text-muted">
                    No invoices have been issued on this account.
                  </td>
                </tr>
              )}

              {!loading &&
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-border-subtle/60 last:border-0">
                    <td className="px-3 py-2.5 font-mono text-xs text-text-secondary">
                      INV-{invoice.id}
                    </td>
                    <td className="px-3 py-2.5 text-text-secondary">{invoice.date}</td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-text-primary">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`text-xs font-medium ${
                          /paid|succeed/i.test(invoice.status)
                            ? 'text-accent-green'
                            : /fail/i.test(invoice.status)
                              ? 'text-accent-red'
                              : 'text-text-secondary'
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {invoice.pdf_url ? (
                        <a
                          href={invoice.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
                        >
                          <Download size={13} aria-hidden="true" />
                          PDF
                        </a>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
