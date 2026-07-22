import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

import { api } from '../services/api';

const AdminWorkspaceContext = createContext();

export function AdminWorkspaceProvider({ children }) {
  const [activeModule, setActiveModule] = useState('users'); // default to users
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data State
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());

  // Load items based on module
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let data = [];
        
        if (activeModule === 'users') {
          const res = await api.get('/users/');
          const rawUsers = res.results || res;
          data = Array.isArray(rawUsers) ? rawUsers.map(u => ({
             id: u.id,
             name: u.first_name ? `${u.first_name} ${u.last_name}` : (u.username || u.email),
             email: u.email,
             company: 'CyberSentinel Customer',
             plan: 'Standard', // TODO: populate from subscription relationships if needed
             country: 'Global',
             status: u.is_active ? 'Active' : 'Inactive',
             securityScore: 85,
             lastLogin: u.last_login || new Date().toISOString(),
             renewalDate: 'N/A',
             devices: 1,
             tags: u.is_staff ? ['Admin'] : []
          })) : [];
        } 
        else if (activeModule === 'inbox' || activeModule === 'support') {
          const res = await api.get('/tickets/');
          const rawTickets = res.results || res;
          data = Array.isArray(rawTickets) ? rawTickets.map(t => ({
             id: t.id,
             status: t.status === 'open' ? 'unread' : 'read',
             sender: 'User ' + (t.user || 'Guest'),
             company: '',
             email: '',
             subject: t.subject,
             preview: t.description ? t.description.substring(0, 100) + '...' : '',
             date: t.created_at || new Date().toISOString(),
             tags: [t.category || 'Support']
          })) : [];
        } 
        else if (activeModule === 'scam-reports') {
          const res = await api.get('/scam-reports/');
          const rawReports = res.results || res;
          data = Array.isArray(rawReports) ? rawReports.map(r => ({
             id: r.id,
             status: r.status === 'pending' ? 'unread' : 'read',
             sender: r.reported_by ? 'User ' + r.reported_by : 'Anonymous',
             company: '',
             email: '',
             subject: 'Scam Report: ' + r.url_or_email,
             preview: r.description ? r.description.substring(0, 100) + '...' : '',
             date: r.created_at || new Date().toISOString(),
             tags: ['Scam', r.status]
          })) : [];
        }
        else if (activeModule === 'subscriptions') {
          const res = await api.get('/subscriptions/');
          const rawSubs = res.results || res;
          data = Array.isArray(rawSubs) ? rawSubs.map(s => ({
             id: s.id,
             status: s.status === 'active' ? 'read' : 'unread',
             sender: 'User ' + s.user,
             subject: 'Subscription: ' + (s.plan || 'Plan'),
             preview: `Status: ${s.status}, Renews: ${new Date(s.current_period_end).toLocaleDateString()}`,
             date: s.current_period_end || new Date().toISOString(),
             tags: [s.status]
          })) : [];
        }
        else {
          // Fallback empty data for other modules
          data = [];
        }
        
        if (isMounted) setItems(data);
      } catch (err) {
        console.error('Admin API Error:', err);
        if (isMounted) setError(err.message || 'Failed to fetch module data');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchData();
    setSelectedItemId(null);
    setSelectedRowIds(new Set());
    
    return () => { isMounted = false; };
  }, [activeModule]);

  const toggleRowSelection = (id, multi = false) => {
    setSelectedRowIds(prev => {
      const next = new Set(multi ? prev : []);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllRows = () => {
    if (selectedRowIds.size === items.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(items.map(i => i.id)));
    }
  };

  // Keyboard Shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setSearchOpen(prev => !prev);
    }
    
    // Navigation
    if (e.key === 'j' || e.key === 'k') {
      const direction = e.key === 'j' ? 1 : -1;
      const currentIndex = items.findIndex(i => i.id === selectedItemId);
      let nextIndex = currentIndex + direction;
      
      if (nextIndex >= 0 && nextIndex < items.length) {
        setSelectedItemId(items[nextIndex].id);
        
        // Scroll list to item (we'll assume the item has an id in the DOM)
        const el = document.getElementById(`list-item-${items[nextIndex].id}`);
        if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
    
    // Selection & Deselection
    if (e.key === 'x' && selectedItemId) {
      toggleRowSelection(selectedItemId, true);
    }
    
    // Clear selection / close pane on ESC
    if (e.key === 'Escape') {
      setSelectedItemId(null);
      setSearchOpen(false);
    }
    
    // Focus search on /
    if (e.key === '/') {
      e.preventDefault();
      setSearchOpen(true);
    }
  }, [items, selectedItemId, searchOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const value = {
    activeModule, setActiveModule,
    items, setItems, loading, error,
    selectedItemId, setSelectedItemId,
    searchOpen, setSearchOpen,
    searchQuery, setSearchQuery,
    selectedRowIds, toggleRowSelection, selectAllRows
  };

  return (
    <AdminWorkspaceContext.Provider value={value}>
      {children}
    </AdminWorkspaceContext.Provider>
  );
}

export const useAdminWorkspace = () => useContext(AdminWorkspaceContext);
