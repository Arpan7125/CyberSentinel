import React from 'react';
import { useAdminWorkspace } from '../../contexts/AdminWorkspaceContext';
import { RotateCw, Archive, Trash2, Tag, MailOpen, Star, Settings, ShieldAlert, Loader2 } from 'lucide-react';

const LABELS = [
  { name: 'Enterprise', color: '#AF52DE', bg: 'rgba(175,82,222,0.1)' },
  { name: 'Urgent', color: '#FF453A', bg: 'rgba(255,69,58,0.1)' },
];

export default function AdminListPane() {
  const { 
    activeModule, items, loading, error,
    selectedItemId, setSelectedItemId,
    selectedRowIds, toggleRowSelection, selectAllRows
  } = useAdminWorkspace();

  const getModuleTitle = () => {
    switch (activeModule) {
      case 'inbox': return 'Unified Inbox';
      case 'users': return 'User Directory';
      case 'logs': return 'System Audit Logs';
      default: return 'Data View';
    }
  };

  const renderLabel = (tag) => {
    const labelData = LABELS.find(l => l.name === tag);
    if (!labelData) return <span className="admin-ws-label" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{tag}</span>;
    return <span className="admin-ws-label" style={{ background: labelData.bg, color: labelData.color }}>{tag}</span>;
  };

  return (
    <div className="admin-ws-list-pane">
      {/* Toolbar / Header */}
      <div className="admin-ws-list-header">
        <input 
          type="checkbox" 
          checked={items.length > 0 && selectedRowIds.size === items.length}
          onChange={selectAllRows}
          style={{ width: 14, height: 14, accentColor: '#AF52DE' }}
        />
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          <RotateCw size={16} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, flex: 1, marginLeft: 8 }}>{getModuleTitle()}</span>
        
        {/* Actions toolbar */}
        {selectedRowIds.size > 0 && (
          <div className="admin-ws-list-actions" style={{ display: 'flex', gap: 4 }}>
            <button title="Archive" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px' }}><Archive size={16} /></button>
            <button title="Delete" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px' }}><Trash2 size={16} /></button>
            <button title="Tag" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px' }}><Tag size={16} /></button>
            <button title="Mark Unread" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px' }}><MailOpen size={16} /></button>
          </div>
        )}
        
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          1-{items.length} of {items.length}
        </div>
      </div>

      {activeModule === 'users' && (
        <div style={{ padding: '8px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 8, overflowX: 'auto', whiteSpace: 'nowrap' }}>
          {['All Users', 'Expiring in 7 days', 'Enterprise', 'Trial Ending', 'Overdue Payment'].map(f => (
            <button key={f} style={{ 
              background: f === 'All Users' ? 'var(--accent)' : 'rgba(255,255,255,0.05)', 
              color: f === 'All Users' ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${f === 'All Users' ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`, 
              padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer' 
            }}>
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Virtualized/Dense List */}
      {activeModule === 'users' && (
        <div className="admin-ws-row grid-users admin-ws-grid-header" style={{ height: 32 }}>
          <div></div>
          <div></div>
          <div>User</div>
          <div>Organization</div>
          <div>Plan</div>
          <div>Sec Score</div>
          <div>Status</div>
          <div>Last Login</div>
          <div>Renewal</div>
          <div>Actions</div>
        </div>
      )}
      <div className="admin-ws-list">
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-muted)' }}>
            <Loader2 className="animate-spin" size={32} style={{ marginBottom: 16 }} />
            <div>Loading {getModuleTitle()} data...</div>
          </div>
        )}

        {error && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--accent-red)' }}>
            <ShieldAlert size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
            <div style={{ fontWeight: 600 }}>Failed to load data</div>
            <div style={{ fontSize: 13, marginTop: 4, color: 'var(--text-muted)' }}>{error}</div>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-muted)' }}>
            <div style={{ background: 'var(--bg-tertiary)', padding: 16, borderRadius: 32, marginBottom: 16 }}>
              <Archive size={32} />
            </div>
            <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 15 }}>No {activeModule} found</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>There is currently no data to display for this module.</div>
          </div>
        )}

        {!loading && !error && items.map(item => {
          const isSelected = selectedItemId === item.id;
          const isChecked = selectedRowIds.has(item.id);

          const renderGridRow = () => {
            if (activeModule === 'users') {
              return (
                <div 
                  key={item.id} id={`list-item-${item.id}`}
                  className={`admin-ws-row grid-users ${isSelected ? 'selected' : ''} ${isChecked ? 'active' : ''}`}
                  onClick={() => setSelectedItemId(item.id)}
                >
                  <input type="checkbox" checked={isChecked} onChange={(e) => { e.stopPropagation(); toggleRowSelection(item.id, true); }} style={{ width: 14, height: 14, accentColor: '#AF52DE' }} />
                  <div style={{ width: 28, height: 28, borderRadius: 14, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                    {item.name ? item.name.charAt(0) : 'U'}
                  </div>
                  <div className="admin-ws-grid-cell">
                    <div className="admin-ws-grid-cell primary">{item.name}</div>
                    <div className="admin-ws-grid-cell meta">{item.email}</div>
                  </div>
                  <div className="admin-ws-grid-cell">
                    <div className="admin-ws-grid-cell primary">{item.company}</div>
                    <div className="admin-ws-grid-cell meta">{item.country}</div>
                  </div>
                  <div className="admin-ws-grid-cell">{renderLabel(item.plan)}</div>
                  <div className="admin-ws-grid-cell">
                    <span style={{ color: item.securityScore > 90 ? '#32D74B' : item.securityScore > 70 ? '#FF9F0A' : '#FF453A', fontWeight: 600 }}>{item.securityScore}</span>
                  </div>
                  <div className="admin-ws-grid-cell" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: item.status === 'Active' ? '#32D74B' : '#FF9F0A' }}></span>
                    {item.status}
                  </div>
                  <div className="admin-ws-grid-cell meta">
                    {new Date(item.lastLogin).toLocaleDateString()}
                  </div>
                  <div className="admin-ws-grid-cell meta">
                    {item.renewalDate !== 'N/A' ? new Date(item.renewalDate).toLocaleDateString() : 'N/A'}
                  </div>
                  <div className="admin-ws-grid-cell">
                    <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Settings size={14} /></button>
                  </div>
                </div>
              );
            }



            // Default Row (Inbox, Logs, Support, AI Chats)
            return (
              <div 
                key={item.id}
                id={`list-item-${item.id}`}
                className={`admin-ws-row ${isSelected ? 'selected' : ''} ${isChecked ? 'active' : ''} ${item.status === 'unread' ? 'unread' : ''}`}
                onClick={() => setSelectedItemId(item.id)}
              >
                <input 
                  type="checkbox" 
                  checked={isChecked}
                  onChange={(e) => { e.stopPropagation(); toggleRowSelection(item.id, true); }}
                  style={{ width: 14, height: 14, accentColor: '#AF52DE' }}
                />
                
                <button 
                  style={{ background: 'none', border: 'none', color: item.status === 'unread' ? '#FFD60A' : 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Star size={16} fill={item.status === 'unread' ? '#FFD60A' : 'none'} />
                </button>

                {(activeModule === 'inbox' || activeModule === 'support' || activeModule === 'scam-reports') && (
                  <>
                    <div className="admin-ws-row-sender">{item.sender} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({item.company})</span></div>
                    <div className="admin-ws-row-subject">
                      <span style={{ color: 'var(--text-primary)', marginRight: 6 }}>{item.subject}</span>
                      <span style={{ color: 'var(--text-muted)' }}>- {item.preview}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {item.tags?.map(t => <React.Fragment key={t}>{renderLabel(t)}</React.Fragment>)}
                    </div>
                    <div className="admin-ws-row-date">{new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  </>
                )}

                {activeModule === 'ai-chats' && (
                  <>
                    <div className="admin-ws-row-sender" style={{ width: 140 }}>{item.user}</div>
                    <div className="admin-ws-row-subject">
                      <span style={{ color: 'var(--text-primary)', marginRight: 6 }}>{item.topic}</span>
                      <span style={{ color: 'var(--text-muted)' }}>- {item.preview}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, width: 120 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Conf: {item.confidence}%</span>
                    </div>
                    <div className="admin-ws-row-date">{new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  </>
                )}

                {activeModule === 'logs' && (
                  <>
                    <div className="admin-ws-row-sender" style={{ width: 180 }}>{item.admin}</div>
                    <div className="admin-ws-row-subject" style={{ fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: '#AF52DE', marginRight: 6 }}>{item.action}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{item.target} (IP: {item.ip})</span>
                    </div>
                    <div className="admin-ws-row-date">{new Date(item.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  </>
                )}
              </div>
            );
          };

          return renderGridRow();
        })}
      </div>
    </div>
  );
}
