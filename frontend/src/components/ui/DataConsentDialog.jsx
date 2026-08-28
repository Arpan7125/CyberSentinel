import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileScan, UserRound, Database, AlertTriangle } from 'lucide-react';
import { authService } from '../../services/api';

/**
 * Asks the signed-in user whether CyberSentinel may process the details and
 * content they submit, before they start using the console.
 *
 * Deliberately says what actually happens rather than "we value your privacy":
 * each row below names a real thing the backend does with the data. Declining
 * is a real answer with a real effect — `api/consent.py` stops attaching scans
 * to the account — so this is not a button that only pretends to decide
 * something. The answer is stored server-side against the wording that was
 * shown, so clearing the browser does not erase it and a later change to the
 * wording asks again.
 */

const WHAT_WE_DO = [
  {
    icon: UserRound,
    title: 'Your account details',
    body: 'Your name, email address, phone number and organization, as you enter them on your profile. Used to identify your account and to contact you about your scans.',
  },
  {
    icon: FileScan,
    title: 'What you submit to the scanners',
    body: 'The links, messages, files, screenshots and phone numbers you ask us to check. These are analysed to produce your result.',
  },
  {
    icon: Database,
    title: 'Your scan history',
    body: 'Results are filed under your account so your dashboard and reports can show them. If you decline, scans still run — they are simply not linked to you.',
  },
];

export default function DataConsentDialog({ onResolved }) {
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(null); // 'granted' | 'declined' | null
  const [error, setError] = useState('');
  const dialogRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await authService.dataConsent();
        if (!cancelled && res?.needs_decision) setVisible(true);
      } catch {
        // If we cannot reach the endpoint we stay silent rather than blocking
        // the console behind a dialog we cannot record the answer to.
      }
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!visible) return undefined;

    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector('button')?.focus();

    // No Escape handler and no overlay click-to-close on purpose: dismissing
    // this by accident would leave the question unanswered while looking like
    // it had been answered.
    return () => { document.body.style.overflow = ''; };
  }, [visible]);

  const decide = useCallback(async (decision) => {
    setSubmitting(decision);
    setError('');
    try {
      const res = await authService.setDataConsent(decision);
      setVisible(false);
      onResolved?.(res?.status || decision);
    } catch (err) {
      setError(err.message || 'Could not save your choice. Check your connection and try again.');
    } finally {
      setSubmitting(null);
    }
  }, [onResolved]);

  if (!visible) return null;

  return (
    <div className="consent-overlay">
      <div
        className="consent-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        aria-describedby="consent-intro"
        ref={dialogRef}
      >
        <div className="consent-head">
          <img src="/logo.png" alt="" className="consent-logo" aria-hidden="true" />
          <h2 id="consent-title" className="consent-title">
            CyberSentinel wants to use your data
          </h2>
          <p id="consent-intro" className="consent-intro">
            Before you use the console, please confirm you are happy for us to process
            the information below.
          </p>
        </div>

        <ul className="consent-list">
          {WHAT_WE_DO.map(({ icon: Icon, title, body }) => (
            <li key={title} className="consent-item">
              <span className="consent-item-icon" aria-hidden="true"><Icon size={18} /></span>
              <div>
                <p className="consent-item-title">{title}</p>
                <p className="consent-item-body">{body}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="consent-note">
          <ShieldCheck size={14} aria-hidden="true" />
          <span>
            We do not sell your data. You can change this answer at any time under{' '}
            <Link to="/dashboard/security" className="consent-link">Settings</Link>, or delete
            your account entirely.
          </span>
        </p>

        <p className="consent-policies">
          Read our <Link to="/privacy" className="consent-link">Privacy Policy</Link>,{' '}
          <Link to="/terms" className="consent-link">Terms</Link> and{' '}
          <Link to="/cookies" className="consent-link">Cookie Policy</Link>.
        </p>

        {error && (
          <p className="consent-error" role="alert">
            <AlertTriangle size={14} aria-hidden="true" /><span>{error}</span>
          </p>
        )}

        <div className="consent-actions">
          <button
            type="button"
            className="consent-btn consent-btn-ghost"
            onClick={() => decide('declined')}
            disabled={submitting !== null}
          >
            {submitting === 'declined' ? 'Saving…' : "Don't allow"}
          </button>
          <button
            type="button"
            className="consent-btn consent-btn-primary"
            onClick={() => decide('granted')}
            disabled={submitting !== null}
          >
            {submitting === 'granted' ? 'Saving…' : 'I agree'}
          </button>
        </div>
      </div>
    </div>
  );
}
