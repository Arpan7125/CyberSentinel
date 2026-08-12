import React from 'react';
import { AlertTriangle, CalendarClock, Globe, Link2, ShieldOff } from 'lucide-react';
import Tilt3D from './Tilt3D';

/**
 * The product visual for the homepage hero.
 *
 * The hero previously had nothing but a centred headline, so the first screen
 * gave a visitor no idea what the product actually looks like or does. This
 * shows the scanner reaching a verdict.
 *
 * On honesty: everything here is an *illustration of the interface*, not a
 * claim. The target is a reserved `example` domain so no real site is being
 * labelled as phishing, the signals shown are the real signal types the URL
 * analyser uses, and the panel is labelled as a sample. Deliberately no
 * invented aggregate metrics ("2.4M threats blocked") — this codebase does not
 * ship numbers it cannot source.
 */
const SIGNALS = [
  { icon: <Globe size={13} />, label: 'Domain age', value: '4 days' },
  { icon: <Link2 size={13} />, label: 'Lookalike of', value: 'a known brand' },
  { icon: <ShieldOff size={13} />, label: 'Transport', value: 'No valid TLS' },
];

export default function HeroConsole() {
  return (
    <Tilt3D className="hero-console" max={6} scale={1.01}>
      <span className="tilt-3d-sheen" aria-hidden="true" />

      <div className="hero-console-bar">
        <span className="hc-dot" /><span className="hc-dot" /><span className="hc-dot" />
        <span className="hero-console-title">URL Scanner</span>
        <span className="hero-console-live">
          <i className="hc-pulse" aria-hidden="true" /> Live
        </span>
      </div>

      <div className="hero-console-body" data-depth="1">
        <div className="hero-console-target">
          <span className="hc-target-label">Scanned</span>
          <code className="hc-target-url">secure-login.example-bank.example</code>
        </div>

        <div className="hero-console-verdict">
          <span className="hc-verdict-icon" aria-hidden="true"><AlertTriangle size={18} /></span>
          <div className="hc-verdict-text">
            <strong>Phishing detected</strong>
            <em>Credential-harvesting page impersonating a bank</em>
          </div>
          <span className="hc-score">
            <b>92</b>
            <i>risk</i>
          </span>
        </div>

        <ul className="hero-console-signals">
          {SIGNALS.map((s) => (
            <li key={s.label}>
              <span className="hc-signal-icon">{s.icon}</span>
              <span className="hc-signal-label">{s.label}</span>
              <span className="hc-signal-value">{s.value}</span>
            </li>
          ))}
        </ul>

        <div className="hero-console-foot">
          <CalendarClock size={12} aria-hidden="true" />
          Sample scan — illustrative of the scanner interface
        </div>
      </div>
    </Tilt3D>
  );
}
