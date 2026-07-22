import React, { useState } from 'react';
import { useAuth } from '../../AuthContext';
import { authService } from '../../services/api';

export default function SettingsPage() {
  const { logout } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem('cs_theme') || 'dark');
  const [lang, setLang] = useState('English');
  const [retention, setRetention] = useState('30');
  const [telemetryOptIn, setTelemetryOptIn] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('cs_theme', newTheme);
    document.body.className = '';
    if (newTheme !== 'amber') {
      document.body.classList.add(`theme-${newTheme}`);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText === 'DELETE MY ACCOUNT') {
      try {
        await authService.deleteAccount();
        alert('Account deleted successfully.');
        logout();
      } catch (err) {
        alert(err.message || 'Failed to delete account. Please try again.');
      }
    } else {
      alert('Confirmation text mismatch.');
    }
  };

  const languages = [
    'English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Malayalam',
    'French', 'German', 'Spanish', 'Japanese', 'Chinese', 'Arabic',
    'Portuguese', 'Russian', 'Italian'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800 }}>
      <div>
        <h1 className="page-title">Portal Settings</h1>
        <p className="page-subtitle">Configure theme layouts, localization metrics, data retention, and privacy</p>
      </div>

      {/* Theme Settings */}
      <div className="glass-card" style={{ padding: 28 }}>
        <h3 className="section-title" style={{ marginBottom: 16 }}>Interface Theme Style</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          {['light', 'dark', 'amber'].map(t => (
            <button
              key={t}
              onClick={() => handleThemeChange(t)}
              className={`btn-pub ${theme === t ? 'btn-pub-primary' : 'btn-pub-secondary'}`}
              style={{ flex: 1, textTransform: 'capitalize' }}
            >
              {t === 'amber' ? '⚡ Amber Glow' : `${t} Mode`}
            </button>
          ))}
        </div>
      </div>

      {/* Language Settings */}
      <div className="glass-card" style={{ padding: 28 }}>
        <h3 className="section-title" style={{ marginBottom: 12 }}>Localization Language</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Choose your preferred language for the console UI and AI assistant interaction.
        </p>
        <select
          className="form-select-pub"
          value={lang}
          onChange={e => setLang(e.target.value)}
        >
          {languages.map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      {/* Privacy and Data Retention */}
      <div className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h3 className="section-title">Telemetry Data Privacy Controls</h3>
        
        <div className="form-checkbox-wrap">
          <input
            type="checkbox"
            id="telemetryOptIn"
            className="form-checkbox"
            checked={telemetryOptIn}
            onChange={e => setTelemetryOptIn(e.target.checked)}
          />
          <label htmlFor="telemetryOptIn" className="form-checkbox-label">
            <strong>Share telemetry logs</strong><br />
            Share anonymized threat telemetry files with global databases to improve collective detection systems.
          </label>
        </div>

        <div className="form-group">
          <label className="form-label-pub">Telemetry Logs Retention Period</label>
          <select
            className="form-select-pub"
            value={retention}
            onChange={e => setRetention(e.target.value)}
          >
            <option value="7">7 Days</option>
            <option value="30">30 Days (Recommended)</option>
            <option value="90">90 Days</option>
            <option value="365">1 Year</option>
          </select>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card" style={{ padding: 28, border: '1px solid var(--accent-red)' }}>
        <h3 className="section-title" style={{ color: 'var(--accent-red)' }}>Danger Zone</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, marginBottom: 16 }}>
          Permanently delete your CyberSentinel security account portal. This action will purge all registered endpoint nodes, API logs, and data history.
        </p>
        <button
          className="btn-pub btn-pub-danger btn-pub-sm"
          onClick={() => setShowDeleteModal(true)}
        >
          Delete My Account
        </button>
      </div>

      {/* Delete Account Modal Dialog */}
      {showDeleteModal && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-content modal-md">
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: 'var(--accent-red)' }}>Confirm Account Deletion</h2>
              <button className="modal-close-btn" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Are you absolutely sure you want to delete your security node credentials? This action is irreversible.
              </p>
              <div className="form-group">
                <label className="form-label-pub">
                  Type <strong style={{ color: 'var(--text-primary)' }}>DELETE MY ACCOUNT</strong> to confirm:
                </label>
                <input
                  type="text"
                  className="form-input-pub"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  className="btn-pub btn-pub-danger btn-pub-sm"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE MY ACCOUNT'}
                >
                  Delete Account
                </button>
                <button
                  className="btn-pub btn-pub-secondary btn-pub-sm"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
