import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Megaphone } from 'lucide-react';
import { notificationService } from '../../services/api';
import { useApiData } from '../../hooks/useApiData';

/**
 * Broadcasts a notification to every registered account.
 *
 * This form previously did nothing at all: it pushed an entry into local React
 * state, popped "Global alert broadcast dispatched successfully", and offered
 * Email / Push / SMS channels that were never wired to anything. It now posts to
 * `notifications/broadcast/`, which creates one in-app notification per user —
 * the only delivery channel that exists — and reports the count the server came
 * back with rather than assuming success.
 */

// Mirrors Notification.TYPE_CHOICES on the backend. Sending anything else would
// write a value the model does not recognise.
const TYPES = ['General', 'Threat', 'Account', 'Billing'];

export default function NotificationsPage() {
  const [form, setForm] = useState({ title: '', type: 'General', message: '' });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // A broadcast creates a copy for every account including this one, so the
  // admin's own inbox doubles as a record of what went out.
  const { data: mine, loading, refetch } = useApiData(() => notificationService.list(), []);
  const recent = (Array.isArray(mine) ? mine : mine?.results || []).slice(0, 8);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;

    setSending(true);
    setResult(null);
    setError(null);

    try {
      const res = await notificationService.broadcast({
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
      });
      setResult(res?.status || 'Broadcast sent.');
      setForm({ title: '', type: 'General', message: '' });
      refetch();
    } catch (err) {
      setError(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-display-xs font-bold text-text-primary">Broadcast a notification</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Delivers an in-app notification to every registered account. There is no email, push, or
          SMS channel behind this form.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-lg border border-border-subtle bg-bg-card p-6 shadow-sm">
          <h2 className="mb-5 text-sm font-semibold text-text-primary">Compose</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="bc-title" className="text-xs font-medium text-text-secondary">
                Title
              </label>
              <input
                id="bc-title"
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Scheduled maintenance on Saturday"
                className="rounded-md border border-border-subtle bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none focus-visible:border-border-focus"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="bc-type" className="text-xs font-medium text-text-secondary">
                Category
              </label>
              <select
                id="bc-type"
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                className="rounded-md border border-border-subtle bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none focus-visible:border-border-focus"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="bc-message" className="text-xs font-medium text-text-secondary">
                Message
              </label>
              <textarea
                id="bc-message"
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                placeholder="What every user needs to know."
                className="resize-y rounded-md border border-border-subtle bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none focus-visible:border-border-focus"
              />
            </div>

            <p className="text-xs text-text-muted">
              This cannot be recalled once sent — every account receives it immediately.
            </p>

            <button
              type="submit"
              disabled={sending || !form.title.trim() || !form.message.trim()}
              className="inline-flex items-center gap-2 self-start rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-inverse transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Megaphone size={15} aria-hidden="true" />
              {sending ? 'Sending…' : 'Send to all users'}
            </button>
          </form>

          {result && (
            <p
              className="mt-4 flex items-center gap-2 rounded-md border border-accent-green/40 bg-bg-secondary px-3 py-2 text-sm text-text-secondary"
              role="status"
            >
              <CheckCircle2 size={15} className="text-accent-green" aria-hidden="true" />
              {result}
            </p>
          )}

          {error && (
            <p
              className="mt-4 flex items-center gap-2 rounded-md border border-accent-red/40 bg-bg-secondary px-3 py-2 text-sm text-text-secondary"
              role="alert"
            >
              <AlertTriangle size={15} className="text-accent-red" aria-hidden="true" />
              {error.message || 'The broadcast was not sent.'}
            </p>
          )}
        </section>

        <section className="rounded-lg border border-border-subtle bg-bg-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-text-primary">Your recent notifications</h2>
          <p className="mb-4 mt-1 text-xs text-text-muted">
            Your own inbox. A broadcast lands here too, so it doubles as confirmation one went out.
          </p>

          {loading && (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-md bg-bg-tertiary" />
              ))}
            </div>
          )}

          {!loading && recent.length === 0 && (
            <p className="rounded-md border border-dashed border-border-subtle p-6 text-center text-sm text-text-muted">
              Nothing here yet.
            </p>
          )}

          {!loading && recent.length > 0 && (
            <ul className="flex flex-col gap-3">
              {recent.map((n) => (
                <li key={n.id} className="rounded-md border border-border-subtle bg-bg-secondary p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-text-primary">{n.title}</span>
                    <span className="rounded-full border border-border-subtle px-2 py-0.5 text-[0.6875rem] text-text-secondary">
                      {n.notification_type}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">{n.message}</p>
                  <p className="mt-1.5 text-[0.6875rem] text-text-muted">
                    {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
