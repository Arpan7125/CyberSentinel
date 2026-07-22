import React, { useState, useEffect } from 'react';
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Breadcrumbs from '../components/navigation/Breadcrumbs';
import { ShieldAlert, Activity, Users, Ticket, FileText, BarChart3, Megaphone, Settings, Link2 } from 'lucide-react';

const ADMIN_NAV = [
  {
    title: 'SIEM Operations',
    items: [
      { to: '/admin', icon: <ShieldAlert size={16} />, label: 'SOC Overview', end: true },
      { to: '/admin/threats', icon: <Activity size={16} />, label: 'Live Threat Center' },
      { to: '/admin/users', icon: <Users size={16} />, label: 'User Directory' },
      { to: '/admin/tickets', icon: <Ticket size={16} />, label: 'Incidents & Tickets' },
    ]
  },
  {
    title: 'Platform Control',
    items: [
      { to: '/admin/content', icon: <FileText size={16} />, label: 'CMS Content Manager' },
      { to: '/admin/analytics', icon: <BarChart3 size={16} />, label: 'Platform Analytics' },
      { to: '/admin/notifications', icon: <Megaphone size={16} />, label: 'Broadcast Center' },
      { to: '/admin/settings', icon: <Settings size={16} />, label: 'Global Configurations' },
      { to: '/admin/integrations', icon: <Link2 size={16} />, label: 'Integrations API' },
    ]
  }
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="dash-layout">
      {/* ── Admin Sidebar ── */}
      <aside className={`dash-sidebar ${collapsed ? 'collapsed' : ''}`} role="navigation" style={{ background: 'var(--bg-primary)', borderRight: '1px solid rgba(175,82,222,0.15)' }}>
        <div className="dash-sidebar-header" style={{ borderBottom: '1px solid rgba(175,82,222,0.15)' }}>
          <img src="/logo.png" alt="CyberSentinel logo" className="dash-sidebar-logo" />
          <div className="dash-sidebar-brand">
            <span className="dash-sidebar-name" style={{ color: '#AF52DE' }}>CyberSentinel</span>
            <span className="dash-sidebar-tag" style={{ color: 'var(--text-muted)' }}>SOC Admin</span>
          </div>
        </div>

        <nav className="dash-nav" aria-label="Admin console navigation">
          {ADMIN_NAV.map((section, idx) => (
            <React.Fragment key={idx}>
              <div className="dash-nav-section" style={{ color: 'rgba(175,82,222,0.6)' }}>{section.title}</div>
              {section.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `dash-nav-item ${isActive ? 'active' : ''}`}
                  style={({ isActive }) => isActive ? { color: '#AF52DE', background: 'rgba(175,82,222,0.08)' } : {}}
                >
                  <span className="dash-nav-icon" aria-hidden="true">{item.icon}</span>
                  <span className="dash-nav-label">{item.label}</span>
                </NavLink>
              ))}
            </React.Fragment>
          ))}

          <div className="dash-nav-section" style={{ color: 'rgba(175,82,222,0.6)' }}>Links</div>
          <Link to="/dashboard" className="dash-nav-item">
            <span className="dash-nav-icon" aria-hidden="true">👤</span>
            <span className="dash-nav-label">Customer Portal</span>
          </Link>
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(175,82,222,0.15)', marginTop: 'auto' }}>
          <button
            onClick={handleLogout}
            className="dash-nav-item"
            style={{ color: 'var(--accent-red)', width: '100%', background: 'none', border: 'none' }}
          >
            <span className="dash-nav-icon" aria-hidden="true">🚪</span>
            <span className="dash-nav-label">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Panel ── */}
      <div className="dash-main">
        {/* Header bar */}
        <header className="dash-topbar" role="banner" style={{ background: 'rgba(9,10,15,0.85)', borderBottom: '1px solid rgba(175,82,222,0.15)' }}>
          <div className="dash-topbar-left">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="dash-sidebar-toggle"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? '▶' : '◀'}
            </button>
            <div className="dash-topbar-title">
              <Breadcrumbs />
            </div>
          </div>

          <div className="dash-topbar-right" style={{ gap: 20 }}>
            {/* Live Clock Widget */}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#AF52DE', background: 'rgba(175,82,222,0.05)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(175,82,222,0.2)' }}>
              📟 SOC TIME: {currentTime.toLocaleTimeString()}
            </div>

            {/* Profile Dropdown */}
            <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #AF52DE, #5856D6)' }}>
              {getInitials(user?.fullName || user?.username)}
            </div>
          </div>
        </header>

        {/* Admin content view */}
        <main id="admin-content" className="dash-page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
