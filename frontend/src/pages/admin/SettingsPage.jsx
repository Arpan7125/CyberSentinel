import React from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, XCircle, MinusCircle } from 'lucide-react';
import { healthService } from '../../services/api';
import { useApiData } from '../../hooks/useApiData';

/**
 * Live system configuration, read from the readiness probe.
 *
 * This page used to present controls that did nothing. "Test & Save Configs"
 * only fired an alert saying SMTP had been saved; the feature-flag toggles moved
 * React state and nothing else; "Run Backup" reported that a database snapshot
 * had been queued when no such task exists. An administrator could have believed
 * they held a backup they did not have.
 *
 * Configuration on this platform lives in environment variables on the host, so
 * the honest UI is a read-only report of what the running process resolved them
 * to — plus a plain statement of where to change them.
 */
const STATE_STYLES = {
  ok: { color: 'var(--sev-low)', Icon: CheckCircle2, label: 'Operational' },
  degraded: { color: 'var(--sev-medium)', Icon: AlertTriangle, label: 'Degraded' },
  error: { color: 'var(--sev-critical)', Icon: XCircle, label: 'Failing' },
  off: { color: 'var(--sev-unknown)', Icon: MinusCircle, label: 'Not configured' },
};

/** Map a raw check string from the probe onto one of four display states. */
function classify(value) {
  const raw = String(value || '').toLowerCase();
  if (raw.startsWith('error')) return 'error';
  if (raw.startsWith('degraded')) return 'degraded';
  if (raw.startsWith('not configured') || raw === 'console only') return 'off';
  return 'ok';
}

const CHECK_META = {
  database: {
    label: 'Database',
    detail: 'Set with DATABASE_URL. Without it the app falls back to SQLite, which an ephemeral host wipes on every deploy.',
  },
  redis: {
    label: 'Redis / live push',
    detail: 'Set with REDIS_URL. Without it WebSocket broadcasts cannot cross worker processes; REST keeps working.',
  },
  virustotal: {
    label: 'VirusTotal',
    detail: 'Set with VIRUSTOTAL_API_KEY. Unset, the file and URL scanners report "unscanned" rather than guessing a verdict.',
  },
  google_oauth: {
    label: 'Google sign-in',
    detail: 'Set with GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET. Unset, the Google button is hidden rather than shown broken.',
  },
  email: {
    label: 'Email delivery',
    detail: 'Set with EMAIL_HOST, EMAIL_HOST_USER and EMAIL_HOST_PASSWORD. On "console only", password-reset codes print to the server log instead of being sent.',
  },
};

export default function SettingsPage() {
  const { data, loading, error, refetch } = useApiData(() => healthService.readiness(), []);

  // A 503 from the probe is still a useful answer — the error body carries the
  // per-dependency detail that explains why.
  const checks = data?.checks || error?.data?.checks || null;
  const status = data?.status || error?.data?.status;

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-display-xs font-bold text-text-primary">System configuration</h1>
          <p className="mt-1 text-sm text-text-secondary">
            What this running instance resolved its environment to, checked live.
          </p>
        </div>

        <button
          type="button"
          onClick={refetch}
          className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:border-border-strong"
        >
          <RefreshCw size={13} aria-hidden="true" />
          Re-check
        </button>
      </header>

      {status && (
        <div
          className={`rounded-lg border p-4 ${
            status === 'ready' ? 'border-border-subtle bg-bg-card' : 'border-accent-red/40 bg-bg-card'
          }`}
          role={status === 'ready' ? undefined : 'alert'}
        >
          <p className="text-sm font-semibold text-text-primary">
            {status === 'ready' ? 'All required dependencies are reachable.' : 'This instance is not ready to serve.'}
          </p>
          {status !== 'ready' && (
            <p className="mt-1 text-sm text-text-secondary">
              A required dependency failed its check. The detail is in the list below.
            </p>
          )}
        </div>
      )}

      {loading && (
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-bg-tertiary" />
          ))}
        </div>
      )}

      {!loading && !checks && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-accent-red/40 bg-bg-card p-4" role="alert">
          <AlertTriangle size={18} className="text-accent-red" aria-hidden="true" />
          <p className="flex-1 text-sm text-text-secondary">
            {error?.message || 'Could not reach the readiness endpoint.'}
          </p>
        </div>
      )}

      {!loading && checks && (
        <ul className="flex flex-col gap-3">
          {Object.entries(checks).map(([key, value]) => {
            const state = STATE_STYLES[classify(value)];
            const meta = CHECK_META[key] || { label: key, detail: null };
            const { Icon } = state;

            return (
              <li
                key={key}
                className="flex items-start gap-4 rounded-lg border border-border-subtle bg-bg-card p-4 shadow-sm"
                style={{ borderLeft: `3px solid ${state.color}` }}
              >
                <Icon size={18} style={{ color: state.color, marginTop: 2 }} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-text-primary">{meta.label}</span>
                    <span className="font-mono text-xs" style={{ color: state.color }}>
                      {value}
                    </span>
                  </div>
                  {meta.detail && (
                    <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">{meta.detail}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <section className="rounded-lg border border-border-subtle bg-bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-text-primary">Changing any of this</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          These values come from environment variables on the backend host, not from the database, so
          they cannot be edited from this screen. Update them in the Render dashboard under
          <span className="font-mono text-xs"> Environment</span>, then redeploy — the new values are
          read at process start. <span className="font-mono text-xs">backend/.env.example</span>{' '}
          lists every variable the application reads, and DEPLOYMENT.md covers the deployed setup.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          Database backups are handled by the database provider, not by this application. On Render,
          Postgres backups are configured on the database instance itself.
        </p>
      </section>
    </div>
  );
}
