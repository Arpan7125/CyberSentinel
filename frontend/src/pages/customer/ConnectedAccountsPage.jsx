import React, { useState, useEffect } from 'react';
import { integrationsService } from '../../services/api';
import { useNotifications } from '../../NotificationContext';
import { Mail, Cloud, Users, Briefcase, RefreshCw, XCircle, CheckCircle2, AlertTriangle, Play, ShieldAlert, Link2, KeyRound } from 'lucide-react';

const CATEGORY_ICONS = {
  'Email': Mail,
  'Cloud Storage': Cloud,
  'Identity Providers': Users,
  'Productivity': Briefcase,
};

function IntegrationConnectModal({ provider, onClose, onConfirm }) {
  if (!provider) return null;

  return (
    <div className="dash-modal-overlay">
      <div className="dash-modal-content" style={{ maxWidth: 500 }}>
        <div className="dash-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="dash-icon-wrapper" style={{ background: 'rgba(175,82,222,0.1)', color: '#AF52DE' }}>
              <Link2 size={24} />
            </div>
            <div>
              <h2 className="dash-modal-title">Connect {provider.name}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>OAuth 2.0 Secure Authorization</p>
            </div>
          </div>
        </div>

        <div className="dash-modal-body">
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
            {provider.description}
          </p>

          <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 16, marginBottom: 24, border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <KeyRound size={16} color="var(--text-muted)" />
              <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>Requested Permissions</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {provider.scopes && provider.scopes.map(scope => (
                <li key={scope}>{scope}</li>
              ))}
            </ul>
          </div>

          <div className="dash-alert" style={{ background: 'rgba(52, 199, 89, 0.1)', borderLeftColor: '#34C759', marginBottom: 24 }}>
            <div className="dash-alert-icon">
              <ShieldAlert size={16} color="#34C759" />
            </div>
            <div className="dash-alert-content">
              <div className="dash-alert-title" style={{ color: '#34C759' }}>Secure Connection</div>
              <div className="dash-alert-desc">
                CyberSentinel will never see or store your {provider.name} password. You can revoke access at any time from your provider's security settings.
              </div>
            </div>
          </div>
        </div>

        <div className="dash-modal-footer">
          <button className="dash-btn dash-btn-outline" onClick={onClose}>Cancel</button>
          <button className="dash-btn dash-btn-primary" onClick={() => onConfirm(provider)}>
            Continue to {provider.name}
          </button>
        </div>
      </div>
    </div>
  );
}

function AccountManageModal({ account, onClose, onSync, onDisconnect }) {
  if (!account) return null;
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    integrationsService.getSyncLogs(account.id)
      .then(res => setLogs(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [account.id]);

  return (
    <div className="dash-modal-overlay">
      <div className="dash-modal-content" style={{ maxWidth: 600 }}>
        <div className="dash-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 className="dash-modal-title">{account.provider_name}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>{account.email}</p>
            </div>
            <div className={`dash-badge ${account.health_status === 'Healthy' ? 'success' : 'warning'}`}>
              {account.health_status}
            </div>
          </div>
        </div>
        
        <div className="dash-modal-body">
          <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: 12 }}>Recent Sync Logs</h3>
          
          {loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Loading logs...</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 8 }}>
              No sync history available.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 250, overflowY: 'auto' }}>
              {logs.map(log => (
                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'var(--bg-secondary)', borderRadius: 6, border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {log.status === 'success' ? <CheckCircle2 size={16} color="#34C759" /> : <AlertTriangle size={16} color="#FF3B30" />}
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{log.message}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(log.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>{log.items_synced} items</div>
                    {log.threats_detected > 0 && <div style={{ fontSize: 12, color: '#FF3B30' }}>{log.threats_detected} threats</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dash-modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="dash-btn" style={{ color: '#FF3B30', borderColor: '#FF3B30' }} onClick={() => onDisconnect(account)}>
            Revoke Access
          </button>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="dash-btn dash-btn-outline" onClick={onClose}>Close</button>
            <button className="dash-btn dash-btn-primary" onClick={() => onSync(account)}>
              <RefreshCw size={14} /> Force Sync
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConnectedAccountsPage() {
  const { addNotification } = useNotifications();
  const [providers, setProviders] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [connectModalProvider, setConnectModalProvider] = useState(null);
  const [manageModalAccount, setManageModalAccount] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [provRes, connRes] = await Promise.all([
        integrationsService.getProviders(),
        integrationsService.getConnectedAccounts()
      ]);
      setProviders(provRes.data);
      setConnections(connRes.data);
    } catch (err) {
      addNotification('error', 'Failed to load integration data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConnectInit = async (provider) => {
    try {
      const res = await integrationsService.startOAuth(provider.id);
      provider.scopes = res.data.scopes;
      provider.auth_url = res.data.auth_url;
      setConnectModalProvider(provider);
    } catch (err) {
      addNotification('error', 'Failed to initialize connection');
    }
  };

  const handleConfirmConnect = (provider) => {
    window.location.href = provider.auth_url;
  };

  const handleSync = async (account) => {
    addNotification('info', `Syncing ${account.provider_name}...`);
    try {
      const res = await integrationsService.syncAccount(account.id);
      addNotification('success', res.data.message);
      fetchData();
    } catch (err) {
      addNotification('error', 'Sync failed');
    }
  };

  const handleDisconnect = async (account) => {
    if (!window.confirm(`Are you sure you want to disconnect ${account.provider_name}?`)) return;
    try {
      await integrationsService.disconnectAccount(account.id);
      addNotification('success', `Disconnected ${account.provider_name}`);
      setManageModalAccount(null);
      fetchData();
    } catch (err) {
      addNotification('error', 'Failed to disconnect');
    }
  };

  const groupedProviders = providers.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  return (
    <div className="dash-page">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Connected Accounts</h1>
          <p className="dash-subtitle">Manage third-party integrations and monitor continuous synchronization</p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading integrations ecosystem...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {Object.entries(groupedProviders).map(([category, catProviders]) => {
            const Icon = CATEGORY_ICONS[category] || Link2;
            return (
              <div key={category}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Icon size={18} color="var(--text-muted)" />
                  <h2 style={{ fontSize: 16, margin: 0, color: 'var(--text-primary)', fontWeight: 600 }}>{category}</h2>
                </div>
                
                <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                  {catProviders.map(p => {
                    const conn = connections.find(c => c.provider_id === p.id && c.status === 'connected');
                    return (
                      <div key={p.id} className="dash-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <h3 style={{ fontSize: 15, margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</h3>
                          {conn ? (
                            <span className="dash-badge success">Connected</span>
                          ) : (
                            <span className="dash-badge neutral">Available</span>
                          )}
                        </div>
                        
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, flex: 1 }}>
                          {p.description}
                        </p>
                        
                        {conn ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{conn.email}</span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                Synced: {conn.last_sync_at ? new Date(conn.last_sync_at).toLocaleTimeString() : 'Never'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="dash-btn dash-btn-outline" style={{ flex: 1, padding: '6px 12px', fontSize: 13 }} onClick={() => setManageModalAccount(conn)}>
                                Manage
                              </button>
                              <button className="dash-btn dash-btn-outline" style={{ padding: '6px 12px' }} onClick={() => handleSync(conn)} title="Force Sync">
                                <RefreshCw size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                            <button className="dash-btn dash-btn-outline" style={{ width: '100%' }} onClick={() => handleConnectInit(p)}>
                              Connect {p.name}
                            </button>
                          </div>
                        )}
                      </div>
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
