import React, { useState, useEffect } from 'react';
import { AdminWorkspaceProvider, useAdminWorkspace } from '../../contexts/AdminWorkspaceContext';
import { useAuth } from '../../AuthContext';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';
import AdminListPane from './AdminListPane';
import AdminDetailPane from './AdminDetailPane';
import AdminUniversalSearch from './AdminUniversalSearch';
import FinanceDashboard from './views/FinanceDashboard';
import IntegrationsDashboard from './views/IntegrationsDashboard';
import DashboardModule from './views/DashboardModule';
import SystemHealthModule from './views/SystemHealthModule';
import ApiIntegrationsPage from '../../pages/admin/ApiIntegrationsPage';
import AdminWelcomeGuide from './AdminWelcomeGuide';
import '../../assets/admin-workspace.css';

function WorkspaceRouter() {
  const { activeModule } = useAdminWorkspace();

  if (activeModule === 'dashboard') {
    return <DashboardModule />;
  }

  if (activeModule === 'health') {
    return <SystemHealthModule />;
  }

  if (activeModule === 'integrations') {
    return <IntegrationsDashboard />;
  }

  if (activeModule === 'api-keys') {
    return <div style={{ padding: 32, overflowY: 'auto', flex: 1 }}><ApiIntegrationsPage /></div>;
  }

  return (
    <div className="admin-ws-panes">
      <AdminListPane />
      <AdminDetailPane />
    </div>
  );
}

export default function AdminWorkspaceLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (user?.is_new_user) {
      setShowWelcome(true);
    }
  }, [user]);

  return (
    <AdminWorkspaceProvider>
      <div className="admin-workspace">
        <AdminSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        
        <div className="admin-ws-content">
          <AdminTopBar setSidebarCollapsed={setSidebarCollapsed} sidebarCollapsed={sidebarCollapsed} />
          
          <WorkspaceRouter />
        </div>

        <AdminUniversalSearch />
        
        {showWelcome && <AdminWelcomeGuide onClose={() => setShowWelcome(false)} />}
      </div>
    </AdminWorkspaceProvider>
  );
}
