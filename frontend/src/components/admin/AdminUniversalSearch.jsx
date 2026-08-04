import React, { useEffect, useRef, useState } from 'react';
import { useAdminWorkspace } from '../../contexts/AdminWorkspaceContext';
import { adminService, supportService, saasService } from '../../services/api';

export default function AdminUniversalSearch() {
  const { searchOpen, setSearchOpen, searchQuery, setSearchQuery, setSelectedItemId, setActiveModule } = useAdminWorkspace();
  const inputRef = useRef(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  // Live search against real backend data — debounced, no fabricated results.
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) { setResults([]); return; }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const [users, tickets, scamReports] = await Promise.all([
          adminService.getUsers().catch(() => []),
          supportService.getTickets().catch(() => []),
          saasService.getScamReports().catch(() => []),
        ]);

        const userList = Array.isArray(users) ? users : (users?.results || []);
        const ticketList = Array.isArray(tickets) ? tickets : (tickets?.results || []);
        const reportList = Array.isArray(scamReports) ? scamReports : (scamReports?.results || []);

        const found = [];
        userList.forEach(u => {
          if ((u.username || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)) {
            found.push({ id: u.id, _module: 'users', _title: u.username, _desc: `User - ${u.email}` });
          }
        });
        ticketList.forEach(t => {
          if ((t.subject || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q)) {
            found.push({ id: t.id, _module: 'tickets', _title: t.subject, _desc: `Ticket - ${t.status}` });
          }
        });
        reportList.forEach(r => {
          if ((r.url_or_email || '').toLowerCase().includes(q)) {
            found.push({ id: r.id, _module: 'scam-reports', _title: r.url_or_email, _desc: `Scam Report - ${r.status}` });
          }
        });
        setResults(found.slice(0, 10));
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!searchOpen) return null;

  const handleSelect = (result) => {
    setActiveModule(result._module);
    setSelectedItemId(result.id);
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="admin-ws-search-overlay" onClick={() => setSearchOpen(false)}>
      <div className="admin-ws-search-palette" onClick={e => e.stopPropagation()}>
        <input 
          ref={inputRef}
          type="text" 
          className="admin-ws-search-input"
          placeholder="Search users, tickets, scam reports..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Escape') setSearchOpen(false);
          }}
        />

        {searchQuery && (
          <div className="admin-ws-search-results">
            <div style={{ padding: '12px 16px', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
              {loading ? 'Searching…' : 'Database Results'}
            </div>

            {results.length > 0 ? results.map(res => (
              <div key={`${res._module}-${res.id}`} className="admin-ws-search-result" onClick={() => handleSelect(res)}>
                <div style={{ fontSize: 18, color: 'var(--text-muted)' }}>
                  {res._module === 'tickets' ? '🎫' : res._module === 'scam-reports' ? '🚩' : '👤'}
                </div>
                <div>
                  <div className="admin-ws-search-result-title">{res._title}</div>
                  <div className="admin-ws-search-result-desc">{res._desc}</div>
                </div>
              </div>
            )) : !loading && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No database records found matching "{searchQuery}"
              </div>
            )}
          </div>
        )}
        
        {!searchQuery && (
          <div style={{ padding: 20, display: 'flex', gap: 12, borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}><kbd style={{ background: '#333', padding: '2px 4px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>Esc</kbd> to close</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}><kbd style={{ background: '#333', padding: '2px 4px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>↑↓</kbd> to navigate</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}><kbd style={{ background: '#333', padding: '2px 4px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>Enter</kbd> to select</span>
          </div>
        )}
      </div>
    </div>
  );
}
