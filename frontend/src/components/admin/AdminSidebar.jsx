import React from 'react';
import { useAdminWorkspace } from '../../contexts/AdminWorkspaceContext';
import { useAuth } from '../../AuthContext';
import { 
  Users, Bot, ScrollText, Edit, Settings, LogOut, 
  ShieldAlert, LayoutDashboard, FileText, Shield, BarChart3, Bell, Activity, CreditCard as CardIcon, Inbox, Key
} from 'lucide-react';

export default function AdminSidebar({ collapsed, setCollapsed }) {
  const { activeModule, setActiveModule } = useAdminWorkspace();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <aside className={`admin-ws-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="admin-ws-brand">
        <button 
          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 4 }}
          onClick={() => setCollapsed(!collapsed)}
        >
          <img src="/logo.png" alt="CS Logo" />
        </button>
        <span>Admin SOC</span>
      </div>

      <div className="admin-ws-nav">
        <div className="admin-ws-nav-group">
          <div className="admin-ws-nav-label">Core Operations</div>
          <button className={`admin-ws-link ${activeModule === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveModule('dashboard')}>
            <span><LayoutDashboard size={16} /></span> <span>Dashboard</span>
          </button>
          <button className={`admin-ws-link ${activeModule === 'users' ? 'active' : ''}`} onClick={() => setActiveModule('users')}>
            <span><Users size={16} /></span> <span>Users</span>
          </button>
          <button className={`admin-ws-link ${activeModule === 'subscriptions' ? 'active' : ''}`} onClick={() => setActiveModule('subscriptions')}>
            <span><FileText size={16} /></span> <span>Subscriptions</span>
          </button>

        </div>

        <div className="admin-ws-nav-group">
          <div className="admin-ws-nav-label">Management</div>
          <button className={`admin-ws-link ${activeModule === 'reports' ? 'active' : ''}`} onClick={() => setActiveModule('reports')}>
            <span><ShieldAlert size={16} /></span> <span>Reports</span>
          </button>
          <button className={`admin-ws-link ${activeModule === 'scam-reports' ? 'active' : ''}`} onClick={() => setActiveModule('scam-reports')}>
            <span><Shield size={16} /></span> <span>Scam Reports</span>
          </button>
          <button className={`admin-ws-link ${activeModule === 'support' ? 'active' : ''}`} onClick={() => setActiveModule('support')}>
            <span><Inbox size={16} /></span> <span>Support</span>
            <span className="admin-ws-link-badge">4</span>
          </button>
          <button className={`admin-ws-link ${activeModule === 'ai-chats' ? 'active' : ''}`} onClick={() => setActiveModule('ai-chats')}>
            <span><Bot size={16} /></span> <span>AI Conversations</span>
          </button>
        </div>

        <div className="admin-ws-nav-group">
          <div className="admin-ws-nav-label">System</div>
          <button className={`admin-ws-link ${activeModule === 'analytics' ? 'active' : ''}`} onClick={() => setActiveModule('analytics')}>
            <span><BarChart3 size={16} /></span> <span>Analytics</span>
          </button>
          <button className={`admin-ws-link ${activeModule === 'content' ? 'active' : ''}`} onClick={() => setActiveModule('content')}>
            <span><Edit size={16} /></span> <span>Content</span>
          </button>
          <button className={`admin-ws-link ${activeModule === 'notifications' ? 'active' : ''}`} onClick={() => setActiveModule('notifications')}>
            <span><Bell size={16} /></span> <span>Notifications</span>
          </button>
          <button className={`admin-ws-link ${activeModule === 'logs' ? 'active' : ''}`} onClick={() => setActiveModule('logs')}>
            <span><ScrollText size={16} /></span> <span>Audit Logs</span>
          </button>
          <button className={`admin-ws-link ${activeModule === 'settings' ? 'active' : ''}`} onClick={() => setActiveModule('settings')}>
            <span><Settings size={16} /></span> <span>Settings</span>
          </button>
          <button className={`admin-ws-link ${activeModule === 'api-keys' ? 'active' : ''}`} onClick={() => setActiveModule('api-keys')}>
            <span><Key size={16} /></span> <span>API Keys</span>
          </button>
          <button className={`admin-ws-link ${activeModule === 'health' ? 'active' : ''}`} onClick={() => setActiveModule('health')}>
            <span><Activity size={16} /></span> <span>System Health</span>
          </button>
        </div>

        <div className="admin-ws-nav-group">
          <div className="admin-ws-nav-label">Labels</div>
          <button className="admin-ws-link"><span style={{ color: '#FF375F' }}><ShieldAlert size={14} /></span> <span>Urgent Threats</span></button>
          <button className="admin-ws-link"><span style={{ color: '#AF52DE' }}><ShieldAlert size={14} /></span> <span>Enterprise Lead</span></button>
          <button className="admin-ws-link"><span style={{ color: '#FF9F0A' }}><ShieldAlert size={14} /></span> <span>Bug Bounty</span></button>
        </div>
      </div>
      
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)' }}>
        <button className="admin-ws-link" onClick={handleLogout} style={{ color: 'var(--accent-red)' }}>
          <span><LogOut size={16} /></span> <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
