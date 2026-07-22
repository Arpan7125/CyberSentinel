import React, { useState } from 'react';

export default function SettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [featureFlags, setFeatureFlags] = useState([
    { key: 'ff_gmail_sync', name: 'Gmail Threat Telemetry Sync', enabled: true },
    { key: 'ff_sandbox_ocr', name: 'OCR Sandbox Image Reading', enabled: true },
    { key: 'ff_enterprise_sso', name: 'Enterprise SAML/SSO login', enabled: false },
    { key: 'ff_mfa_sms', name: 'SMS Multi-Factor Authentication', enabled: false }
  ]);

  const [smtpForm, setSmtpForm] = useState({
    server: 'smtp.sendgrid.net',
    port: '587',
    username: 'apikey',
    sender: 'noreply@cybersentinel.ai'
  });

  const handleSmtpSave = (e) => {
    e.preventDefault();
    alert('SMTP email settings successfully saved.');
  };

  const handleToggleFlag = (key) => {
    setFeatureFlags(prev => prev.map(f => f.key === key ? { ...f, enabled: !f.enabled } : f));
  };

  const handleBackup = () => {
    alert('Database snapshot initialized. Backup task sent to background queue.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900 }}>
      <div>
        <h1 className="page-title">Global Configurations</h1>
        <p className="page-subtitle">Configure system API integrations, SMTP connections, OAuth SSO, feature flags, and backups</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
        {/* SMTP server Settings */}
        <div className="glass-card" style={{ padding: 28 }}>
          <h3 className="section-title" style={{ marginBottom: 20 }}>System SMTP Configurations</h3>
          <form onSubmit={handleSmtpSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label-pub">SMTP Host Address</label>
              <input
                type="text"
                className="form-input-pub"
                value={smtpForm.server}
                onChange={e => setSmtpForm(p => ({ ...p, server: e.target.value }))}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label-pub">SMTP Port</label>
                <input
                  type="text"
                  className="form-input-pub"
                  value={smtpForm.port}
                  onChange={e => setSmtpForm(p => ({ ...p, port: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label-pub">Sender Email Address</label>
                <input
                  type="email"
                  className="form-input-pub"
                  value={smtpForm.sender}
                  onChange={e => setSmtpForm(p => ({ ...p, sender: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label-pub">SMTP Username</label>
              <input
                type="text"
                className="form-input-pub"
                value={smtpForm.username}
                onChange={e => setSmtpForm(p => ({ ...p, username: e.target.value }))}
                required
              />
            </div>

            <button type="submit" className="btn-pub btn-pub-primary btn-pub-sm" style={{ alignSelf: 'flex-start' }}>
              Test & Save Configs
            </button>
          </form>
        </div>

        {/* Feature Flags & Operations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Feature flags panel */}
          <div className="glass-card" style={{ padding: 28 }}>
            <h3 className="section-title" style={{ marginBottom: 16 }}>Platform Feature Flags</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {featureFlags.map(flag => (
                <div key={flag.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{flag.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{flag.key}</div>
                  </div>
                  <button
                    className={`btn-pub btn-pub-sm ${flag.enabled ? 'btn-pub-primary' : 'btn-pub-secondary'}`}
                    onClick={() => handleToggleFlag(flag.key)}
                  >
                    {flag.enabled ? 'Active' : 'Disabled'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Maintenance & backups */}
          <div className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 className="section-title">System Operations</h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Maintenance Mode</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Show maintenance screen to all nodes</div>
              </div>
              <button
                className={`btn-pub btn-pub-sm ${maintenanceMode ? 'btn-pub-danger' : 'btn-pub-secondary'}`}
                onClick={() => setMaintenanceMode(!maintenanceMode)}
              >
                {maintenanceMode ? 'ONLINE' : 'OFFLINE'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Database Snapshots</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Run absolute system backups now</div>
              </div>
              <button className="btn-pub btn-pub-secondary btn-pub-sm" onClick={handleBackup}>
                Run Backup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
