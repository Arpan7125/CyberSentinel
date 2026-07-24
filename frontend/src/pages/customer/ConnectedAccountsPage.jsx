import React, { useState, useEffect } from 'react';
import { integrationsService } from '../../services/api';
import { useNotifications } from '../../NotificationContext';
import {
  Mail, Cloud, Users, Briefcase, RefreshCw, CheckCircle2, AlertTriangle,
  ShieldAlert, Link2, KeyRound, MessageCircle, Plug, Zap, Shield
} from 'lucide-react';

/* ── Brand config ─────────────────────────────────────────────────── */
const PROVIDER_BRAND = {
  'Gmail':             { bg: '#EA4335', letter: 'G', color: '#fff', gradient: 'linear-gradient(135deg,#EA4335,#c62828)' },
  'Microsoft Outlook': { bg: '#0078D4', letter: 'O', color: '#fff', gradient: 'linear-gradient(135deg,#0078D4,#005a9e)' },
  'Google Drive':      { bg: '#34A853', letter: 'D', color: '#fff', gradient: 'linear-gradient(135deg,#34A853,#1e8e3e)' },
  'Dropbox':           { bg: '#0061FF', letter: 'D', color: '#fff', gradient: 'linear-gradient(135deg,#0061FF,#0040c8)' },
  'WhatsApp':          { bg: '#25D366', letter: 'W', color: '#fff', gradient: 'linear-gradient(135deg,#25D366,#128C7E)' },
  'Slack':             { bg: '#4A154B', letter: 'S', color: '#fff', gradient: 'linear-gradient(135deg,#4A154B,#611f69)' },
  'GitHub':            { bg: '#24292e', letter: 'G', color: '#fff', gradient: 'linear-gradient(135deg,#24292e,#444d56)' },
  'Google Workspace':  { bg: '#4285F4', letter: 'W', color: '#fff', gradient: 'linear-gradient(135deg,#4285F4,#1a73e8)' },
};

const CATEGORY_ICONS = {
  'Email': Mail,
  'Cloud Storage': Cloud,
  'Identity Providers': Users,
  'Productivity': Briefcase,
  'Communication': MessageCircle,
};

/* ── Connect Modal ────────────────────────────────────────────────── */
function IntegrationConnectModal({ provider, onClose, onConfirm }) {
  if (!provider) return null;
  const brand = PROVIDER_BRAND[provider.name] || { bg: '#6c757d', letter: provider.name[0], color: '#fff', gradient: 'linear-gradient(135deg,#6c757d,#495057)' };

  return (
    <div className="dash-modal-overlay">
      <div className="dash-modal-content" style={{ maxWidth: 480 }}>
        <div className="dash-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, background: brand.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 900, color: brand.color, flexShrink: 0,
              boxShadow: `0 6px 20px ${brand.bg}44`
            }}>
              {brand.letter}
            </div>
            <div>
              <h2 className="dash-modal-title">Connect {provider.name}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Shield size={12} /> OAuth 2.0 Secure Authorization
              </p>
            </div>
          </div>
        </div>

        <div className="dash-modal-body">
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
            {provider.description}
          </p>

          <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: 16, marginBottom: 20, border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <KeyRound size={14} color="var(--text-muted)" />
              <strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>Permissions Requested</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {provider.scopes && provider.scopes.map(scope => (
                <div key={scope} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: brand.bg, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{scope}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, padding: 14,
            background: 'rgba(52,199,89,0.08)', borderRadius: 10, border: '1px solid rgba(52,199,89,0.2)'
          }}>
            <ShieldAlert size={16} color="#34C759" style={{ marginTop: 1, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#34C759', marginBottom: 4 }}>Secure Connection</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                CyberSentinel never sees or stores your {provider.name} password. Revoke access anytime from your provider's security settings.
              </div>
            </div>
          </div>
        </div>

        <div className="dash-modal-footer">
          <button className="dash-btn dash-btn-outline" onClick={onClose}>Cancel</button>
          <button
            className="dash-btn"
            style={{ background: brand.gradient, color: '#fff', border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={() => onConfirm(provider)}
          >
            <Plug size={14} /> Continue to {provider.name}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Manage Modal ─────────────────────────────────────────────────── */
function AccountManageModal({ account, onClose, onSync, onDisconnect }) {
  if (!account) return null;
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    integrationsService.getSyncLogs(account.id)
      .then(res => setLogs(res || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [account.id]);

  const brand = PROVIDER_BRAND[account.provider_name] || { bg: '#6c757d', gradient: 'linear-gradient(135deg,#6c757d,#495057)', letter: account.provider_name[0], color: '#fff' };

  return (
    <div className="dash-modal-overlay">
      <div className="dash-modal-content" style={{ maxWidth: 580 }}>
        <div className="dash-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: brand.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 900, color: brand.color
              }}>
                {brand.letter}
              </div>
              <div>
                <h2 className="dash-modal-title">{account.provider_name}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>{account.email}</p>
              </div>
            </div>
            <span className={`dash-badge ${account.health_status === 'Healthy' ? 'success' : 'warning'}`}>
              {account.health_status}
            </span>
          </div>
        </div>

        <div className="dash-modal-body">
          <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600 }}>
            Sync History
          </h3>

          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Loading...</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 10, fontSize: 14 }}>
              No sync history yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
              {logs.map(log => (
                <div key={log.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8,
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {log.status === 'success'
                      ? <CheckCircle2 size={15} color="#34C759" />
                      : <AlertTriangle size={15} color="#FF3B30" />}
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{log.message}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(log.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{log.items_synced} items</div>
                    {log.threats_detected > 0 && (
                      <div style={{ fontSize: 11, color: '#FF3B30' }}>{log.threats_detected} threats</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dash-modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            className="dash-btn"
            style={{ color: '#FF3B30', border: '1px solid rgba(255,59,48,0.3)', background: 'rgba(255,59,48,0.06)' }}
            onClick={() => onDisconnect(account)}
          >
            Revoke Access
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="dash-btn dash-btn-outline" onClick={onClose}>Close</button>
            <button className="dash-btn dash-btn-primary" onClick={() => onSync(account)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={13} /> Sync Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Provider Card ────────────────────────────────────────────────── */
function ProviderCard({ p, conn, onConnect, onManage, onSync }) {
  const brand = PROVIDER_BRAND[p.name] || { bg: '#6c757d', letter: p.name[0], color: '#fff', gradient: 'linear-gradient(135deg,#6c757d,#495057)' };

  return (
    <div style={{
      background: 'var(--bg-card, var(--bg-secondary))',
      border: '1px solid var(--border-subtle)',
      borderRadius: 16,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      transition: 'box-shadow 0.2s, transform 0.2s',
      cursor: 'default',
      position: 'relative',
      overflow: 'hidden',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 28px ${brand.bg}22`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
    >
      {/* Left border accent */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
        background: brand.gradient, borderRadius: '16px 0 0 16px'
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Logo avatar */}
        <div style={{
          width: 46, height: 46, borderRadius: 12,
          background: brand.gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 900, color: brand.color, flexShrink: 0,
          boxShadow: `0 4px 14px ${brand.bg}40`
        }}>
          {brand.letter}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 2 }}>{p.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{p.category}</div>
        </div>

        {/* Status pill */}
        {conn ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 20,
            background: 'rgba(52,199,89,0.12)', border: '1px solid rgba(52,199,89,0.3)',
            fontSize: 11, fontWeight: 700, color: '#34C759', flexShrink: 0
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34C759' }} />
            Connected
          </div>
        ) : (
          <div style={{
            padding: '4px 10px', borderRadius: 20,
            background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)',
            fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0
          }}>
            Available
          </div>
        )}
      </div>

      {/* Description */}
      <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, paddingLeft: 4 }}>
        {p.description}
      </p>

      {/* Footer */}
      {conn ? (
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={12} color="#34C759" />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{conn.email}</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {conn.last_sync_at ? new Date(conn.last_sync_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never synced'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="dash-btn dash-btn-outline"
              style={{ flex: 1, fontSize: 12, padding: '7px 10px', fontWeight: 600 }}
              onClick={() => onManage(conn)}
            >
              Manage
            </button>
            <button
              className="dash-btn dash-btn-outline"
              style={{ padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
              onClick={() => onSync(conn)}
              title="Sync now"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ paddingLeft: 0 }}>
          <button
            style={{
              width: '100%', padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: brand.gradient, color: '#fff', fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              boxShadow: `0 4px 14px ${brand.bg}33`,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            onClick={() => onConnect(p)}
          >
            <Plug size={13} />
            Connect {p.name}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────── */
export default function ConnectedAccountsPage() {
  const { addNotification } = useNotifications();
  const [providers, setProviders]   = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [connectModalProvider, setConnectModalProvider] = useState(null);
  const [manageModalAccount, setManageModalAccount]     = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [provRes, connRes] = await Promise.all([
        integrationsService.getProviders(),
        integrationsService.getConnectedAccounts(),
      ]);
      setProviders(provRes || []);
      setConnections(connRes || []);
    } catch {
      addNotification('error', 'Failed to load integration data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleConnectInit = async (provider) => {
    try {
      const res = await integrationsService.startOAuth(provider.id);
      provider.scopes   = res.scopes;
      provider.auth_url = res.auth_url;
      setConnectModalProvider(provider);
    } catch {
      addNotification('error', 'Failed to initialize connection');
    }
  };

  const handleConfirmConnect = (provider) => { window.location.href = provider.auth_url; };

  const handleSync = async (account) => {
    addNotification('info', `Syncing ${account.provider_name}…`);
    try {
      const res = await integrationsService.syncAccount(account.id);
      addNotification('success', res.message || 'Sync complete');
      fetchData();
    } catch { addNotification('error', 'Sync failed'); }
  };

  const handleDisconnect = async (account) => {
    if (!window.confirm(`Disconnect ${account.provider_name}?`)) return;
    try {
      await integrationsService.disconnectAccount(account.id);
      addNotification('success', `Disconnected ${account.provider_name}`);
      setManageModalAccount(null);
      fetchData();
    } catch { addNotification('error', 'Failed to disconnect'); }
  };

  const groupedProviders = providers.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  const totalConnected = connections.filter(c => c.status === 'connected').length;

  return (
    <div className="dash-page">

      {/* ── Page header ── */}
      <div className="dash-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="dash-title">Connected Accounts</h1>
          <p className="dash-subtitle">Link third-party services and enable real-time threat monitoring</p>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 32
      }}>
        {[
          { icon: Plug,    label: 'Available Integrations', value: providers.length,  color: '#6366f1' },
          { icon: CheckCircle2, label: 'Connected',         value: totalConnected,    color: '#34C759' },
          { icon: Zap,     label: 'Protected Services',     value: totalConnected,    color: '#FF9F0A' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
            borderRadius: 14, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 14
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Provider groups ── */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          Loading integrations…
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          {Object.entries(groupedProviders).map(([category, catProviders]) => {
            const Icon = CATEGORY_ICONS[category] || Link2;
            return (
              <div key={category}>
                {/* Category heading */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                  paddingBottom: 10, borderBottom: '1px solid var(--border-subtle)'
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Icon size={14} color="var(--text-muted)" />
                  </div>
                  <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--text-primary)', letterSpacing: '0.2px' }}>
                    {category}
                  </h2>
                  <span style={{
                    marginLeft: 4, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                    background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)',
                    padding: '2px 8px', borderRadius: 20
                  }}>
                    {catProviders.length}
                  </span>
                </div>

                {/* Cards grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 16
                }}>
                  {catProviders.map(p => {
                    const conn = connections.find(c => c.provider_id === p.id && c.status === 'connected');
                    return (
                      <ProviderCard
                        key={p.id}
                        p={p}
                        conn={conn}
                        onConnect={handleConnectInit}
                        onManage={setManageModalAccount}
                        onSync={handleSync}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {connectModalProvider && (
        <IntegrationConnectModal
          provider={connectModalProvider}
          onClose={() => setConnectModalProvider(null)}
          onConfirm={handleConfirmConnect}
        />
      )}

      {manageModalAccount && (
        <AccountManageModal
          account={manageModalAccount}
          onClose={() => setManageModalAccount(null)}
          onSync={handleSync}
          onDisconnect={handleDisconnect}
        />
      )}
    </div>
  );
}
