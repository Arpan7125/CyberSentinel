import React from 'react';
import { useAuth } from '../AuthContext';

const NAV_ITEMS = [
  { id: 'landing', icon: '🏠', label: 'Home Page' },
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'inbox', icon: '📥', label: 'Incident Inbox' },
  { id: 'text', icon: '📝', label: 'Text Scanner' },
  { id: 'url', icon: '🔗', label: 'URL Scanner' },
  { id: 'screenshot', icon: '📸', label: 'Screenshot Scan' },
  { id: 'quiz', icon: '🧠', label: 'Awareness Quiz' },
  { id: 'api-sandbox', icon: '⚡', label: 'API Sandbox' },
  { id: 'guidelines', icon: '📖', label: 'User Guide' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

export default function Sidebar({ activeTab, setActiveTab, onSubscribe, onShowAdmin }) {
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{
        padding: '32px 24px', 
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="Logo" style={{ width: 28, height: 28 }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>CyberSentinel</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
              Security Platform
            </div>
          </div>
        </div>
      </div>

      {/* User Session Info */}
      {user && (
        <div style={{ 
          padding: '20px 24px', 
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--accent-orange)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 900, color: 'white', flexShrink: 0,
              boxShadow: '0 0 12px var(--accent-orange-glow)',
            }}>
              {user.username[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', 
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                textTransform: 'uppercase', letterSpacing: '0.02em'
              }}>
                {user.username}
              </div>
              {isAdmin && (
                <span className="badge badge-admin" style={{ fontSize: 8, padding: '2px 8px', marginTop: 4 }}>
                  🛡️ Admin
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Nav Actions */}
      <nav className="sidebar-nav" style={{ padding: 0 }}>
        <div className="nav-section-title" style={{ padding: '20px 24px 8px', color: 'var(--text-muted)' }}>Security Center</div>

        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}
          >
            <span style={{ fontSize: 16, width: 20, textAlign: 'center', marginRight: 10 }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}

        {/* Administration Portal Toggle */}
        {isAdmin && (
          <>
            <div className="nav-section-title" style={{ padding: '20px 24px 8px', color: 'var(--text-muted)' }}>Admin control</div>
            <button
              id="nav-admin"
              className="nav-item"
              onClick={onShowAdmin}
              style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left', color: 'var(--text-primary)' }}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: 'center', marginRight: 10 }}>👑</span>
              <span>Admin Center</span>
            </button>
          </>
        )}
      </nav>

      {/* Bottom Actions Area */}
      <div style={{ 
        padding: '16px 20px', 
        borderTop: '1px solid var(--border-subtle)', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 8 
      }}>
        {/* Subscribe button */}
        <button
          id="nav-subscribe"
          className="cta-btn cta-btn-secondary"
          onClick={onSubscribe}
          style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}
        >
          <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Subscribe Updates</span>
        </button>

        {/* Logout */}
        {user && (
          <button
            id="nav-logout"
            onClick={handleLogout}
            style={{ 
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#FF6B6B', fontSize: 12, fontWeight: 800, 
              textTransform: 'uppercase', letterSpacing: '0.08em',
              padding: '12px 14px', width: '100%', textAlign: 'center',
              borderBottom: '1px solid transparent',
              transition: 'all 0.3s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255, 107, 107, 0.2)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
          >
            Sign Out
          </button>
        )}
      </div>
    </aside>
  );
}
