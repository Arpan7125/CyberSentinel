import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Activity } from 'lucide-react';
import ParticleBackground from './ParticleBackground';

const POINTS = [
  { icon: <Activity size={16} />, title: 'Real-time threat monitoring', desc: 'URLs, email, SMS and files scored the moment you submit them.' },
  { icon: <Lock size={16} />, title: 'Your data stays yours', desc: 'Scans are tied to your account and never sold or shared.' },
  { icon: <ShieldCheck size={16} />, title: 'Sourced intelligence', desc: 'Advisories come from CISA, linked to their primary source.' },
];

/**
 * Shared shell for every authentication screen.
 *
 * Exists because these pages had drifted apart: login rendered a full-width
 * split screen while register, forgot-password, OTP, reset and verify each
 * rendered a ~390px card marooned in the middle of a 1440px viewport. Same
 * product, same step in the same flow, two unrelated layouts — which is what
 * made the narrow ones read as cramped and unfinished.
 *
 * The brand panel is `aria-hidden` and drops out below 900px: it is marketing
 * reassurance, not content, and on a phone the form should own the screen.
 */
export default function AuthLayout({ children, wide = false, actions = null }) {
  return (
    <div className="auth-shell">
      <aside className="auth-brand-panel" aria-hidden="true">
        <div className="auth-brand-fx">
          <ParticleBackground />
          <div className="auth-grid-lines" />
        </div>

        <div className="auth-brand-inner">
          <div className="auth-brand-logo">
            <img src="/logo.svg" alt="" width="34" height="34" />
            <span>CyberSentinel</span>
          </div>

          <div>
            <h2 className="auth-brand-title">Security that explains itself.</h2>
            <p className="auth-brand-sub">
              Every verdict this platform gives you comes with its reasoning and its source.
            </p>
          </div>

          <ul className="auth-brand-points">
            {POINTS.map((p) => (
              <li key={p.title}>
                <span className="auth-brand-point-icon">{p.icon}</span>
                <span>
                  <strong>{p.title}</strong>
                  <em>{p.desc}</em>
                </span>
              </li>
            ))}
          </ul>

          <div className="auth-brand-badges">
            <span>SOC 2 Type II</span>
            <span>ISO 27001</span>
            <span>GDPR</span>
          </div>
        </div>
      </aside>

      <main className="auth-form-panel">
        <div className="auth-panel-actions">
          <Link to="/" className="auth-back-home">← Back to home</Link>
          {actions}
        </div>
        <div className={`auth-form-col ${wide ? 'is-wide' : ''}`}>{children}</div>
      </main>
    </div>
  );
}
