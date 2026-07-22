import React, { useState } from 'react';
import { useAuth } from '../../AuthContext';

export default function SecurityPage() {
  const { loginHistory, deviceSessions, revokeSession } = useAuth();
  
  // API Keys state mockup
  const [apiKeys, setApiKeys] = useState([
    { id: 'key-1', name: 'Production SIEM API', prefix: 'cs_live_3f92...', created: '2026-05-12' },
    { id: 'key-2', name: 'Dev Endpoint Sandbox', prefix: 'cs_test_8a11...', created: '2026-06-01' }
  ]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');

  const handleGenerateKey = (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    const secureRandomHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const fullKey = `cs_live_${secureRandomHex}`;
    setGeneratedKey(fullKey);
    setApiKeys(prev => [
      ...prev,
      { id: `key-${Date.now()}`, name: newKeyName, prefix: `${fullKey.slice(0, 12)}...`, created: new Date().toISOString().split('T')[0] }
    ]);
    setNewKeyName('');
  };

  const handleRevokeKey = (id) => {
    setApiKeys(prev => prev.filter(k => k.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="page-title">Security & Access</h1>
        <p className="page-subtitle">Manage device authorizations, threat audit history logs, and developer integrations</p>
      </div>

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
                  alert('Copied to clipboard');
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
              {apiKeys.map(k => (
                <tr key={k.id}>
                  <td style={{ fontWeight: 650 }}>{k.name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{k.prefix}</td>
                  <td>{k.created}</td>
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
                <th>Activity Rating</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {deviceSessions.map(sess => (
                <tr key={sess.id}>
                  <td style={{ fontWeight: 650 }}>
                    {sess.device} {sess.current && <span className="status-badge status-active" style={{ fontSize: 9, padding: '2px 8px', marginLeft: 8 }}><span className="status-badge-dot" /> Current</span>}
                  </td>
                  <td>{sess.ip}</td>
                  <td>{sess.lastActive}</td>
                  <td>
                    {!sess.current && (
                      <button
                        className="btn-pub btn-pub-secondary btn-pub-sm"
                        style={{ color: 'var(--accent-red)' }}
                        onClick={() => revokeSession(sess.id)}
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
                    <td>{h.ip}</td>
                    <td>{h.device}</td>
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
