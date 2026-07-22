import React, { useState, useEffect } from 'react';
import { adminIntegrationService } from '../../../services/api';
import { Link2, Users, RefreshCw, AlertTriangle, CheckCircle2, XCircle, Power, Shield, Eye, EyeOff, Plus } from 'lucide-react';

export default function IntegrationsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingProvider, setEditingProvider] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminIntegrationService.getEcosystem();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load integrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggleProvider = async (providerId) => {
    try {
      await adminIntegrationService.toggleProvider(providerId);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        <RefreshCw size={16} className="spinner" style={{ marginRight: 8 }} /> Loading integrations ecosystem...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        Failed to load data. Check backend connection.
      </div>
    );
  }

  const { stats, providers, connections } = data;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'providers', label: `Providers (${providers.length})` },
    { id: 'connections', label: `User Connections (${connections.length})` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(175,82,222,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Link2 size={18} color="#AF52DE" />
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Integrations API</h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>OAuth Provider Management & Ecosystem Health</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 6, padding: '6px 12px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none', border: 'none', borderBottom: activeTab === tab.id ? '2px solid #AF52DE' : '2px solid transparent',
                padding: '8px 16px', fontSize: 13, cursor: 'pointer',
                color: activeTab === tab.id ? '#AF52DE' : 'var(--text-muted)',
                fontWeight: activeTab === tab.id ? 600 : 400,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {activeTab === 'overview' && <OverviewTab stats={stats} providers={providers} />}
        {activeTab === 'providers' && <ProvidersTab providers={providers} onToggle={handleToggleProvider} onEdit={setEditingProvider} />}
        {activeTab === 'connections' && <ConnectionsTab connections={connections} />}
      </div>

      {/* Edit Modal */}
      {editingProvider && (
        <CredentialModal
          provider={editingProvider}
          onClose={() => setEditingProvider(null)}
          onSave={async (id, creds) => {
            await adminIntegrationService.updateCredentials(id, creds);
            setEditingProvider(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color = 'var(--text-primary)' }) {
  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 16, border: '1px solid var(--border-color)', flex: 1, minWidth: 140 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
        <Icon size={14} color="var(--text-muted)" />
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function OverviewTab({ stats, providers }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stats Grid */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <StatCard label="OAuth Providers" value={stats.total_providers} icon={Link2} />
        <StatCard label="Active Connections" value={stats.active_connections} icon={CheckCircle2} color="#34C759" />
        <StatCard label="Failed Connections" value={stats.failed_connections} icon={AlertTriangle} color={stats.failed_connections > 0 ? '#FF3B30' : 'var(--text-primary)'} />
        <StatCard label="Total Syncs" value={stats.total_syncs} icon={RefreshCw} />
        <StatCard label="Sync Errors" value={stats.failed_syncs} icon={XCircle} color={stats.failed_syncs > 0 ? '#FF9500' : 'var(--text-primary)'} />
      </div>

      {/* Provider Health */}
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Provider Health</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {providers.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'var(--bg-secondary)', borderRadius: 6, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.is_active ? '#34C759' : '#8E8E93' }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', padding: '2px 8px', background: 'var(--bg-primary)', borderRadius: 4 }}>{p.category}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.connected_users} connected</span>
                <span style={{ fontSize: 12, color: p.is_active ? '#34C759' : '#8E8E93' }}>{p.is_active ? 'Active' : 'Disabled'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProvidersTab({ providers, onToggle, onEdit }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {providers.map(p => (
        <div key={p.id} style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 20, border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>{p.name}</h3>
                <span style={{ fontSize: 11, padding: '2px 8px', background: p.is_active ? 'rgba(52,199,89,0.1)' : 'rgba(142,142,147,0.1)', color: p.is_active ? '#34C759' : '#8E8E93', borderRadius: 4 }}>
                  {p.is_active ? 'Active' : 'Disabled'}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{p.category} · {p.description}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => onEdit(p)}
                style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 6, padding: '5px 10px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Shield size={12} /> Credentials
              </button>
              <button
                onClick={() => onToggle(p.id)}
                style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 6, padding: '5px 10px', color: p.is_active ? '#FF3B30' : '#34C759', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Power size={12} /> {p.is_active ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24, fontSize: 12, color: 'var(--text-muted)' }}>
            <span>Client ID: <strong style={{ color: 'var(--text-secondary)' }}>{p.client_id_masked}</strong></span>
            <span>Scopes: <strong style={{ color: 'var(--text-secondary)' }}>{p.default_scopes || 'None'}</strong></span>
            <span>Users: <strong style={{ color: 'var(--text-secondary)' }}>{p.connected_users}</strong></span>
            <span>Since: <strong style={{ color: 'var(--text-secondary)' }}>{p.created_at}</strong></span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ConnectionsTab({ connections }) {
  if (connections.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
        <Users size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
        <p>No user connections yet.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
            <th style={{ padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>User</th>
            <th style={{ padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Provider</th>
            <th style={{ padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account</th>
            <th style={{ padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
            <th style={{ padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Health</th>
            <th style={{ padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Last Sync</th>
            <th style={{ padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Connected</th>
          </tr>
        </thead>
        <tbody>
          {connections.map(c => (
            <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '10px 12px' }}>
                <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.username}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.email}</div>
              </td>
              <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{c.provider_name}</td>
              <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 12 }}>{c.provider_account_email}</td>
              <td style={{ padding: '10px 12px' }}>
                <span style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 4,
                  background: c.status === 'connected' ? 'rgba(52,199,89,0.1)' : (c.status === 'failed' ? 'rgba(255,59,48,0.1)' : 'rgba(142,142,147,0.1)'),
                  color: c.status === 'connected' ? '#34C759' : (c.status === 'failed' ? '#FF3B30' : '#8E8E93'),
                }}>
                  {c.status}
                </span>
              </td>
              <td style={{ padding: '10px 12px', color: c.health_status === 'Healthy' ? '#34C759' : '#FF9500', fontSize: 12 }}>{c.health_status}</td>
              <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 12 }}>{c.last_sync_at || '—'}</td>
              <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 12 }}>{c.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CredentialModal({ provider, onClose, onSave }) {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(provider.id, {
        client_id: clientId || undefined,
        client_secret: clientSecret || undefined,
        redirect_uri: redirectUri || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)',
    background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13, outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 24, width: 440, border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Shield size={18} color="#AF52DE" />
          <h2 style={{ fontSize: 16, margin: 0 }}>{provider.name} — OAuth Credentials</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Client ID</label>
            <input style={inputStyle} placeholder="Enter new Client ID" value={clientId} onChange={e => setClientId(e.target.value)} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Current: {provider.client_id_masked}</span>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Client Secret</label>
            <div style={{ position: 'relative' }}>
              <input style={inputStyle} type={showSecret ? 'text' : 'password'} placeholder="Enter new Client Secret" value={clientSecret} onChange={e => setClientSecret(e.target.value)} />
              <button onClick={() => setShowSecret(!showSecret)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Redirect URI</label>
            <input style={inputStyle} placeholder="https://yourdomain.com/callback" value={redirectUri} onChange={e => setRedirectUri(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 6, padding: '6px 16px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ background: '#AF52DE', border: 'none', borderRadius: 6, padding: '6px 16px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving...' : 'Update Credentials'}
          </button>
        </div>
      </div>
    </div>
  );
}
