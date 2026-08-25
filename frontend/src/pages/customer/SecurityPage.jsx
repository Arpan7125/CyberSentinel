import React, { useState, useEffect, useCallback } from 'react';
import { securityService } from '../../services/api';
import { useAuth } from '../../AuthContext';

export default function SecurityPage() {
  const [apiKeys, setApiKeys] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [error, setError] = useState('');
  const [confirmingRevoke, setConfirmingRevoke] = useState(null);
  const { logout } = useAuth();

  const loadAll = useCallback(async () => {
    try {
      const [keys, sess, history] = await Promise.all([
        securityService.getApiKeys(),
        securityService.getSessions(),
        securityService.getLoginHistory(),
      ]);
      setApiKeys(keys || []);
      setSessions(sess || []);
      setLoginHistory(history || []);
    } catch (err) {
      console.error('Failed to load security data:', err);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleGenerateKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    try {
      const res = await securityService.createApiKey(newKeyName.trim());
      setGeneratedKey(res.full_key);
      setApiKeys((prev) => [res.key, ...prev]);
      setNewKeyName('');
    } catch (err) {
      setError(err.message || 'Failed to generate API key.');
    }
  };

  const handleRevokeKey = async (id) => {
    try {
      await securityService.revokeApiKey(id);
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to revoke key.');
    }
  };

  /**
   * Revoking a session now genuinely ends it, which — because a single token
   * backs every device — means signing out everywhere, including here. The
   * confirmation step exists so that is a choice rather than a surprise; the
   * old button only hid the row from a list and left the device working.
   */
  const handleRevokeSession = async (id) => {
    setError('');
    try {
      await securityService.revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      await logout();
    } catch (err) {
      setError(err.message || 'Failed to revoke that session.');
    } finally {
      setConfirmingRevoke(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="page-title">Security &amp; Access</h1>
        <p className="page-subtitle">Manage device authorizations, threat audit history logs, and developer integrations</p>
      </div>

      {error && (
        <p className="field-error" role="alert"><span>{error}</span></p>
      )}

      {confirmingRevoke !== null && (
        <div className="glass-card" role="alertdialog" aria-labelledby="revoke-heading" style={{ padding: 24 }}>
          <h3 id="revoke-heading" className="section-title" style={{ marginBottom: 8 }}>
            Sign out of this device?
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
            Your account uses one access token across all devices, so revoking this
            session signs you out everywhere &mdash; including here. You&rsquo;ll need to
            sign in again. This is the right move if you think someone else has access.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              className="btn-pub btn-pub-primary"
              onClick={() => handleRevokeSession(confirmingRevoke)}
            >
              Sign out everywhere
            </button>
            <button
              type="button"
              className="btn-pub btn-pub-ghost"
              onClick={() => setConfirmingRevoke(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Developer API Keys widget */}
      <div className="glass-card" style={{ padding: 28 }}>
        <h3 className="section-title" style={{ marginBottom: 12 }}>Platform API Integrations</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          Generate cryptographic API keys to connect CyberSentinel telemetry feeds into your local SOC/SIEM platforms or custom endpoints.
        </p>

        {generatedKey && (
          <div style={{
            background: 'rgba(52,199,89,0.06)', border: '1px solid var(--accent-green)',
            padding: 16, borderRadius: 'var(--radius-sm)', marginBottom: 20
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-green)', marginBottom: 6 }}>
              API Key Generated Successfully! Copy it now as it will not be shown again.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                readOnly
                className="form-input-pub"
                value={generatedKey}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
                onClick={e => e.currentTarget.select()}
              />
              <button
                className="btn-pub btn-pub-secondary btn-pub-sm"
                onClick={() => {
                  navigator.clipboard.writeText(generatedKey);
                }}
              >
                Copy
              </button>
              <button
                className="btn-pub btn-pub-ghost btn-pub-sm"
                onClick={() => setGeneratedKey('')}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleGenerateKey} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <input
            type="text"
            className="form-input-pub"
            placeholder="Key Description (e.g., Jenkins pipeline, AWS SOC)"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            required
          />
          <button type="submit" className="btn-pub btn-pub-primary btn-pub-sm">
            Generate Key
          </button>
        </form>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>API Prefix</th>
                <th>Created At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)' }}>No API keys yet.</td></tr>
              ) : apiKeys.map(k => (
                <tr key={k.id}>
                  <td style={{ fontWeight: 650 }}>{k.name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{k.prefix}...</td>
                  <td>{new Date(k.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn-pub btn-pub-ghost btn-pub-sm"
                      style={{ color: 'var(--accent-red)' }}
                      onClick={() => handleRevokeKey(k.id)}
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Sessions Widget */}
      <div className="glass-card" style={{ padding: 28 }}>
        <h3 className="section-title" style={{ marginBottom: 16 }}>Authorized Active Sessions</h3>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Device Node</th>
                <th>IP Address</th>
                <th>Last Active</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)' }}>No active sessions recorded yet.</td></tr>
              ) : sessions.map(sess => (
                <tr key={sess.id}>
                  <td style={{ fontWeight: 650, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sess.device_name} {sess.is_current && <span className="status-badge status-active" style={{ fontSize: 9, padding: '2px 8px', marginLeft: 8 }}><span className="status-badge-dot" /> Current</span>}
                  </td>
                  <td>{sess.ip_address}</td>
                  <td>{new Date(sess.last_active).toLocaleString()}</td>
                  <td>
                    {!sess.is_current && (
                      <button
                        className="btn-pub btn-pub-secondary btn-pub-sm"
                        style={{ color: 'var(--accent-red)' }}
                        onClick={() => setConfirmingRevoke(sess.id)}
                      >
                        Terminate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Login History Logs */}
      <div className="glass-card" style={{ padding: 28 }}>
        <h3 className="section-title" style={{ marginBottom: 16 }}>Authentication Audit Logs</h3>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>IP address</th>
                <th>Device Info</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loginHistory.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)' }}>
                    No authentication records logged.
                  </td>
                </tr>
              ) : (
                loginHistory.map(h => (
                  <tr key={h.id}>
                    <td>{new Date(h.timestamp).toLocaleString()}</td>
                    <td>{h.ip_address}</td>
                    <td style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.device_info}</td>
                    <td>
                      <span className={`status-badge ${h.success ? 'status-active' : 'status-danger'}`}>
                        <span className="status-badge-dot" />
                        {h.success ? 'Success' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
