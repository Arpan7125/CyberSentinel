import React from 'react';
import { AlertTriangle, CalendarClock, FileSearch, ScanLine, ShieldOff } from 'lucide-react';
import Tilt3D from './Tilt3D';

/**
 * The product visual for the homepage hero.
 *
 * Deliberately not a fake browser window. Three traffic-light dots, a title
 * bar and a floating card is the most-copied hero device in SaaS — it says
 * "some software exists" and nothing else, and it made this panel a lookalike
 * of a hundred other landing pages. What is drawn instead is a scan record:
 * the artefact this product actually produces.
 *
 * The centrepiece is the URL taken apart and labelled, because that is the
 * single thing CyberSentinel does that a blocklist does not — it shows why.
 * A visitor who reads nothing else should leave knowing that the registrable
 * domain is the part that matters, and that a brand name to the left of it is
 * decoration an attacker chooses freely.
 *
 * On honesty: everything here illustrates the interface, it is not a claim.
 * The target uses the reserved `example` TLD so no real site is labelled as
 * phishing, the signals are the real signal types the URL analyser produces,
 * and the panel says it is a sample. The previous version carried a pulsing
 * "Live" badge on a static illustration, which contradicted its own footer;
 * it now reads "sample", which is what it is. No invented aggregate metrics —
 * this codebase does not ship numbers it cannot source.
 */

/** The specimen, split at the dots so each label can be named underneath. */
const URL_PARTS = [
  { text: 'secure-login', role: 'subdomain', tone: 'mute' },
  { text: 'example-bank', role: 'also a subdomain', tone: 'flag' },
  { text: 'example', role: 'the real domain', tone: 'real' },
];

const EVIDENCE = [
  {
    icon: <CalendarClock size={13} />,
    label: 'Registered',
    value: '4 days ago',
    weight: 'high',
  },
  {
    icon: <FileSearch size={13} />,
    label: 'Brand name',
    value: 'in a subdomain',
    weight: 'critical',
  },
  {
    icon: <ShieldOff size={13} />,
    label: 'Certificate',
    value: 'none presented',
    weight: 'high',
  },
];

export default function HeroConsole() {
  return (
    <Tilt3D className="hero-console" max={6} scale={1.01}>
      <span className="tilt-3d-sheen" aria-hidden="true" />

      <div className="hero-console-body" data-depth="1">
        <div className="hc-head">
          <span className="hc-kicker"><ScanLine size={13} aria-hidden="true" /> URL scan</span>
          <span className="hc-sample">Sample</span>
        </div>

        {/* The specimen, dissected. Scrolls in its own container rather than
            wrapping, because breaking a URL across lines destroys the point. */}
        <div className="hc-dissect" role="img"
             aria-label="secure-login.example-bank.example — secure-login and example-bank are subdomains; example is the real registrable domain">
          <div className="hc-dissect-inner" aria-hidden="true">
            {URL_PARTS.map((part, i) => (
              <React.Fragment key={part.text}>
                {i > 0 && <span className="hc-sep">.</span>}
                <span className={`hc-seg hc-seg-${part.tone}`}>{part.text}</span>
              </React.Fragment>
            ))}

            {URL_PARTS.map((part, i) => (
              <React.Fragment key={`${part.text}-tick`}>
                {i > 0 && <span className="hc-sep-spacer" />}
                <span className={`hc-tick hc-tick-${part.tone}`} />
              </React.Fragment>
            ))}

            {URL_PARTS.map((part, i) => (
              <React.Fragment key={`${part.text}-role`}>
                {i > 0 && <span className="hc-sep-spacer" />}
                <span className={`hc-role hc-role-${part.tone}`}>{part.role}</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="hero-console-verdict">
          <span className="hc-verdict-icon" aria-hidden="true"><AlertTriangle size={18} /></span>
          <div className="hc-verdict-text">
            <strong>Phishing &mdash; credential harvesting</strong>
            <em>Imitates a bank sign-in to capture the password you type.</em>
          </div>
          <span className="hc-score">
            <b>92</b>
            <i>risk</i>
          </span>
        </div>

        <ul className="hero-console-signals">
          {EVIDENCE.map((s) => (
            <li key={s.label} data-weight={s.weight}>
              <span className="hc-signal-icon">{s.icon}</span>
              <span className="hc-signal-label">{s.label}</span>
              <span className="hc-signal-value">{s.value}</span>
            </li>
          ))}
        </ul>

        <div className="hero-console-foot">
          Sample scan. Every verdict shows the evidence behind it.
        </div>
      </div>
    </Tilt3D>
  );
}
