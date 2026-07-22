import React, { useState, useEffect } from 'react';
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useNotifications } from '../NotificationContext';
import Breadcrumbs from '../components/navigation/Breadcrumbs';
import { Shield, FileText, KeyRound, Mail, Link2, FolderSearch, Image, Phone, MessageCircle, MessageSquare, Globe, Flag, Newspaper, User, Settings, LogOut, PanelLeftClose, PanelLeft, Bell, ShieldCheck } from 'lucide-react';

const CUSTOMER_NAV = [
  {
    title: 'Overview',
    items: [
      { to: '/dashboard', icon: Shield, label: 'Dashboard', end: true },
      { to: '/dashboard/reports', icon: FileText, label: 'Reports' },
      { to: '/dashboard/account-security', icon: KeyRound, label: 'Account Checker' },
    ]
  },
  {
    title: 'Scanners',
    items: [
      { to: '/dashboard/email-scanner', icon: Mail, label: 'Email Protection' },
      { to: '/dashboard/url-scanner', icon: Link2, label: 'Website Scanner' },
      { to: '/dashboard/file-scanner', icon: FolderSearch, label: 'File Scanner' },
      { to: '/dashboard/screenshot-scanner', icon: Image, label: 'Screenshot Analyzer' },
    ]
  },
  {
    title: 'Communication',
    items: [
      { to: '/dashboard/phone-lookup', icon: Phone, label: 'Phone Lookup' },
      { to: '/dashboard/whatsapp-analyzer', icon: MessageCircle, label: 'WhatsApp Analyzer' },
      { to: '/dashboard/sms-analyzer', icon: MessageSquare, label: 'SMS Analyzer' },
    ]
  },
  {
    title: 'Community',
    items: [
      { to: '/dashboard/community', icon: Globe, label: 'Scam Database' },
      { to: '/dashboard/scam-reporter', icon: Flag, label: 'Report a Scam' },
      { to: '/dashboard/cyber-intel', icon: Newspaper, label: 'Cyber Intel' },
    ]
  },
  {
    title: 'Account',
    items: [
      { to: '/dashboard/profile', icon: User, label: 'Profile' },
      { to: '/dashboard/security', icon: Settings, label: 'Settings' },
      { to: '/dashboard/integrations', icon: Link2, label: 'Connected Accounts' },
    ]
  }
];

export default function CustomerLayout() {
  const { user, logout, isAdmin } = useAuth();
  const { notifications: contextNotifs, unreadCount, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  useEffect(() => {
    setShowNotifications(false);
    setShowUserDropdown(false);
  }, [location.pathname]);

  return (
    <div className="dash-layout">
      {/* ── Collapsible Sidebar ── */}
      <aside className={`dash-sidebar ${collapsed ? 'collapsed' : ''}`} role="navigation">
        <div className="dash-sidebar-header">
          <img src="/logo.png" alt="CyberSentinel logo" className="dash-sidebar-logo" />
          <div className="dash-sidebar-brand">
            <span className="dash-sidebar-name">CyberSentinel</span>
            <span className="dash-sidebar-tag">Security Console</span>
          </div>
        </div>

        <nav className="dash-nav" aria-label="Console navigation">
          {CUSTOMER_NAV.map((section, idx) => (
            <React.Fragment key={idx}>
              <div className="dash-nav-section">{section.title}</div>
              {section.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `dash-nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="dash-nav-icon" aria-hidden="true"><item.icon size={16} /></span>
                  <span className="dash-nav-label">{item.label}</span>
                  {item.to === '/dashboard/notifications' && unreadCount > 0 && (
                    <span className="dash-nav-badge">{unreadCount}</span>
                  )}
                </NavLink>
              ))}
            </React.Fragment>
          ))}

          {/* Admin center navigation link */}
          {isAdmin && (
            <React.Fragment>
              <div className="dash-nav-section">System</div>
              <Link to="/admin" className="dash-nav-item">
                <span className="dash-nav-icon" aria-hidden="true"><ShieldCheck size={16} /></span>
                <span className="dash-nav-label">Admin Center</span>
              </Link>
            </React.Fragment>
          )}
        </nav>

        {/* Sidebar Footer Account Action */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border-subtle)', marginTop: 'auto' }}>
          <button
            onClick={handleLogout}
            className="dash-nav-item"
            style={{ color: 'var(--accent-red)', width: '100%', background: 'none', border: 'none' }}
          >
            <span className="dash-nav-icon" aria-hidden="true"><LogOut size={16} /></span>
            <span className="dash-nav-label">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Section ── */}
      <div className="dash-main">
        {/* Top bar header */}
        <header className="dash-topbar" role="banner">
          <div className="dash-topbar-left">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="dash-sidebar-toggle"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
            </button>
            <div className="dash-topbar-title">
              <Breadcrumbs />
            </div>
          </div>

          <div className="dash-topbar-right">
            {/* Notifications Menu Trigger */}
            <div style={{ position: 'relative' }}>
              <button
                className="notif-bell"
                onClick={() => { setShowNotifications(!showNotifications); setShowUserDropdown(false); }}
                aria-label="Toggle notifications menu"
                aria-haspopup="true"
                aria-expanded={showNotifications}
              >
              <Bell size={16} />
                {unreadCount > 0 && <span className="notif-badge" />}
              </button>

              {showNotifications && (
                <div
                  className="pub-dropdown"
                  style={{ right: 0, left: 'auto', transform: 'none', width: 340, padding: 12, top: 'calc(100% + 8px)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Notifications</span>
                    <button
                      onClick={markAllAsRead}
                      style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}
                    >
                      Mark all read
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
                  {(contextNotifs || []).slice(0, 5).map(n => (
                      <div
                        key={n.id}
                        style={{
                          padding: 8, borderRadius: 'var(--radius-sm)',
                          background: !n.is_read ? 'var(--accent-muted)' : 'transparent',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: !n.is_read ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{n.title}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}</span>
                        </div>
                        <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>{n.message}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 8, marginTop: 8, textAlign: 'center' }}>
                    <Link to="/dashboard/notifications" style={{ fontSize: 12, fontWeight: 600 }}>View all notifications</Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                className="user-avatar"
                style={{ background: 'var(--accent)' }}
                onClick={() => { setShowUserDropdown(!showUserDropdown); setShowNotifications(false); }}
                aria-label="User profile options"
                aria-haspopup="true"
                aria-expanded={showUserDropdown}
              >
                {getInitials(user?.fullName || user?.username)}
              </button>

              {showUserDropdown && (
                <div
                  className="pub-dropdown"
                  style={{ right: 0, left: 'auto', transform: 'none', width: 220, top: 'calc(100% + 8px)' }}
                >
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{user?.fullName || user?.username}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{user?.email}</div>
                  </div>
                  <Link to="/dashboard/profile" className="pub-dropdown-item">
                    <span className="pub-dropdown-label">My Profile</span>
                  </Link>
                  <Link to="/dashboard/security" className="pub-dropdown-item">
                    <span className="pub-dropdown-label">Security Settings</span>
                  </Link>
                  <Link to="/dashboard/billing" className="pub-dropdown-item">
                    <span className="pub-dropdown-label">Billing</span>
                  </Link>
                  <button onClick={handleLogout} className="pub-dropdown-item" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: 'var(--accent-red)' }}>
                    <span className="pub-dropdown-label">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard page main content */}
        <main id="dashboard-content" className="dash-page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
