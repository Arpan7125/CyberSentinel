import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Palette, Sliders, ShieldCheck, Moon, Sun, Zap, BrainCircuit } from 'lucide-react';

export default function SettingsPanel() {
  
  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem('cs_theme') || 'light');
  
  // Preferences
  const [autoScan, setAutoScan] = useState(() => localStorage.getItem('cs_auto_scan') !== 'false');
  const [soundAlerts, setSoundAlerts] = useState(() => localStorage.getItem('cs_sound_alerts') === 'true');
  const [botProfile, setBotProfile] = useState(() => localStorage.getItem('cs_bot_profile') || 'fast');

  // Success save indicator
  const [saved, setSaved] = useState(false);

  // Apply theme class to document body
  const applyTheme = (themeMode) => {
    setTheme(themeMode);
    document.body.className = '';
    if (themeMode === 'light') {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.add('theme-dark');
    }
    localStorage.setItem('cs_theme', themeMode);
  };

  // Save settings
  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('cs_auto_scan', autoScan.toString());
    localStorage.setItem('cs_sound_alerts', soundAlerts.toString());
    localStorage.setItem('cs_bot_profile', botProfile);

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{
      padding: '40px',
      height: '100%',
      overflowY: 'auto',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
      gap: 32
    }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 18 }}>
        <h1 className="section-title text-gradient" style={{ fontSize: 24, marginBottom: 6 }}>
          USER SETTINGS
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Configure terminal interface preferences and automation parameters
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640 }}>
        
        {/* Success Alert */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {saved && (
              <span className="mono-display" style={{ color: 'var(--accent-green)', fontSize: 12, fontWeight: 800 }}>
                ✓ PREFERENCES UPDATED // LOCAL STATE PERSISTED
              </span>
            )}
          </div>
          <button type="submit" className="ios-btn ios-btn-primary" style={{ width: 180 }}>
            SAVE SETTINGS
          </button>
        </div>

        {/* Section 1: Themes Selection */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 900, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Palette size={16} style={{ color: 'var(--accent-orange)' }} />
            INTERFACE STYLE
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { id: 'dark', label: 'Dark Mode', icon: <Moon size={14} />, desc: 'Obsidian slate theme' },
              { id: 'light', label: 'Light Mode', icon: <Sun size={14} />, desc: 'Clean paper theme' }
            ].map(t => {
              const active = theme === t.id;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => applyTheme(t.id)}
                  style={{
                    padding: '16px 20px',
                    background: active ? 'rgba(0,122,255,0.06)' : 'rgba(255,255,255,0.01)',
                    border: `1px solid ${active ? 'var(--accent-orange)' : 'var(--border-subtle)'}`,
                    borderRadius: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 4,
                    transition: 'all 0.25s'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {t.icon}
                    {t.label}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Preferences */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 900, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sliders size={16} style={{ color: 'var(--accent-orange)' }} />
            WORKFLOW CONTROLS
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
              <div>
                <strong style={{ fontSize: 12.5, display: 'block', marginBottom: 2 }}>Auto-Scan Pasted Payloads</strong>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Instantly execute classifier analysis when text is pasted.</span>
              </div>
              <input
                type="checkbox"
                checked={autoScan}
                onChange={e => setAutoScan(e.target.checked)}
                style={{ accentColor: 'var(--accent-orange)', cursor: 'pointer', width: 15, height: 15 }}
              />
            </div>

            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
              <div>
                <strong style={{ fontSize: 12.5, display: 'block', marginBottom: 2 }}>Audio Threat Alerts</strong>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Play notification chime when scanner flags critical risk.</span>
              </div>
              <input
                type="checkbox"
                checked={soundAlerts}
                onChange={e => setSoundAlerts(e.target.checked)}
                style={{ accentColor: 'var(--accent-orange)', cursor: 'pointer', width: 15, height: 15 }}
              />
            </div>

            <div>
              <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>AI Threat Copilot Profile</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { id: 'fast', title: 'Fast Pipeline', icon: <Zap size={14}/>, desc: 'Rule Heuristics' },
                  { id: 'deep', title: 'Deep Pipeline', icon: <BrainCircuit size={14}/>, desc: 'Complete ML Verification' }
                ].map(p => {
                  const active = botProfile === p.id;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setBotProfile(p.id)}
                      style={{
                        flex: 1,
                        padding: '12px 14px',
                        textAlign: 'left',
                        background: active ? 'rgba(0,122,255,0.06)' : 'rgba(255,255,255,0.01)',
                        border: `1px solid ${active ? 'var(--accent-orange)' : 'var(--border-subtle)'}`,
                        borderRadius: 10,
                        cursor: 'pointer',
                        transition: 'all 0.25s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800, color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {p.icon}
                        {p.title}
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>{p.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Integrations */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 900, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sliders size={16} style={{ color: 'var(--accent-orange)' }} />
            INTEGRATIONS
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Gmail Integration */}
            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
              <div style={{ flex: 1, paddingRight: 20 }}>
                <strong style={{ fontSize: 12.5, display: 'block', marginBottom: 2 }}>Gmail Integration</strong>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Sign in to Google to sync and scan your email inbox.</span>
              </div>
              {/* Sends the user to the real OAuth flow on the integrations page.
                  This button previously popped a confirm dialog and wrote a fake
                  `ya29.mock_…` token to localStorage, which made the UI claim a
                  connection that did not exist and could never sync anything. */}
              <div style={{ flexShrink: 0 }}>
                <Link to="/dashboard/integrations" className="ios-btn ios-btn-primary" style={{ textDecoration: 'none' }}>
                  Manage connection
                </Link>
              </div>
            </div>

            {/* SMS scanning.
                There is no phone-number verification service behind this build.
                The previous control accepted the hard-coded OTP "123456" and
                recorded "✓ Number Verified" in localStorage — a verified state
                that no server ever agreed to. It now points at the SMS analyser,
                which is a real endpoint. */}
            <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
              <div style={{ marginBottom: 14 }}>
                <strong style={{ fontSize: 12.5, display: 'block', marginBottom: 2 }}>SMS scanning</strong>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  Automatic inbox sync is not available. Paste a suspicious message into the
                  message analyser to have it scored.
                </span>
              </div>
              <Link to="/dashboard/message-analyzer" className="ios-btn" style={{ textDecoration: 'none', alignSelf: 'flex-start' }}>
                Open message analyser
              </Link>
            </div>
          </div>
        </div>

        {/* Security message */}
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center',
          color: 'var(--text-muted)', fontSize: 11, fontWeight: 700
        }}>
          <ShieldCheck size={14} />
          <span>SYSTEM INTEGRATION CONFIGURATIONS CAN BE ACCESSED EXCLUSIVELY BY NODE ADMINISTRATORS IN THE ADMIN GATEWAY.</span>
        </div>

      </form>
    </div>
  );
}
