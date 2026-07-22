import React from 'react';
import { useAdminWorkspace } from '../../contexts/AdminWorkspaceContext';
import { useAuth } from '../../AuthContext';
import { Search, Settings, Bell, PanelLeftClose, PanelLeft } from 'lucide-react';
import QuickActionsMenu from './QuickActionsMenu';

export default function AdminTopBar({ setSidebarCollapsed, sidebarCollapsed }) {
  const { setSearchOpen } = useAdminWorkspace();
  const { user } = useAuth();
  
  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="admin-ws-toolbar">
      <div 
        className="admin-ws-search-trigger" 
        onClick={() => setSearchOpen(true)}
      >
        <Search size={16} color="var(--text-muted)" style={{ marginRight: 8 }} />
        <span>Ask AI Copilot or Search (Users, Tickets, Logs, etc.)</span>
        <span className="kbd">Ctrl + K</span>
      </div>
      
      <div style={{ flex: 1 }} />

      {/* Toolbar Actions */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <QuickActionsMenu />
        
        <button className="btn-pub btn-pub-ghost btn-pub-sm" style={{ padding: '6px' }} title="Settings">
          <Settings size={18} />
        </button>
        
        <button className="btn-pub btn-pub-ghost btn-pub-sm" style={{ padding: '6px' }} title="Notifications">
          <Bell size={18} />
          <span className="notif-badge"></span>
        </button>
        
        <div className="user-avatar" style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #AF52DE, #5856D6)', fontSize: 13, color: '#fff' }}>
          {getInitials(user?.fullName || user?.username)}
        </div>
      </div>
    </div>
  );
}
