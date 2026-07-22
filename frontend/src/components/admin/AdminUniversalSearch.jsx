import React, { useEffect, useRef } from 'react';
import { useAdminWorkspace } from '../../contexts/AdminWorkspaceContext';
import { MOCK_ADMIN_DATA } from '../../data/AdminDataMock';

export default function AdminUniversalSearch() {
  const { searchOpen, setSearchOpen, searchQuery, setSearchQuery, setSelectedItemId, setActiveModule } = useAdminWorkspace();
  const inputRef = useRef(null);

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  if (!searchOpen) return null;

  const getResults = () => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    
    const results = [];
    MOCK_ADMIN_DATA.inbox.forEach(item => {
      if (item.subject.toLowerCase().includes(q) || item.sender.toLowerCase().includes(q)) {
        results.push({ ...item, _module: 'inbox', _title: item.subject, _desc: `Inbox - From ${item.sender}` });
      }
    });
    MOCK_ADMIN_DATA.users.forEach(item => {
      if (item.name.toLowerCase().includes(q) || item.email.toLowerCase().includes(q)) {
        results.push({ ...item, _module: 'users', _title: item.name, _desc: `User - ${item.email}` });
      }
    });
    MOCK_ADMIN_DATA.aiChats?.forEach(item => {
      if (item.topic.toLowerCase().includes(q) || item.user.toLowerCase().includes(q)) {
        results.push({ ...item, _module: 'ai-chats', _title: item.topic, _desc: `AI Chat - ${item.user}` });
      }
    });
    MOCK_ADMIN_DATA.auditLogs?.forEach(item => {
      if (item.action.toLowerCase().includes(q) || item.admin.toLowerCase().includes(q) || item.ip.toLowerCase().includes(q)) {
        results.push({ ...item, _module: 'logs', _title: item.action, _desc: `Log - ${item.admin} on ${item.ip}` });
      }
    });
    return results.slice(0, 10);
  };

  const results = getResults();

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
          placeholder="Ask AI Copilot or search for users, tickets, IP addresses..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Escape') setSearchOpen(false);
          }}
        />
        
        {searchQuery && (
          <div className="admin-ws-search-results">
            {/* AI Assistant Hook */}
            <div 
              className="admin-ws-search-result ai-hook" 
              style={{ borderBottom: '1px solid rgba(175,82,222,0.2)', background: 'rgba(175,82,222,0.05)' }}
              onClick={() => {
                // Mock applying an AI filter
                alert(`AI Copilot is analyzing query: "${searchQuery}" and will apply relevant filters.`);
                setSearchOpen(false);
                setSearchQuery('');
              }}
            >
              <div style={{ fontSize: 20 }}>✨</div>
              <div>
                <div className="admin-ws-search-result-title" style={{ color: '#AF52DE' }}>Ask AI Copilot: "{searchQuery}"</div>
                <div className="admin-ws-search-result-desc">Press Enter to parse intent, apply filters, and analyze data.</div>
              </div>
            </div>

            <div style={{ padding: '12px 16px', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
              Database Results
            </div>
            
            {results.length > 0 ? results.map(res => (
              <div key={res.id} className="admin-ws-search-result" onClick={() => handleSelect(res)}>
                <div style={{ fontSize: 18, color: 'var(--text-muted)' }}>
                  {res._module === 'inbox' ? '✉️' : res._module === 'ai-chats' ? '🤖' : res._module === 'logs' ? '📋' : '👤'}
                </div>
                <div>
                  <div className="admin-ws-search-result-title">{res._title}</div>
                  <div className="admin-ws-search-result-desc">{res._desc}</div>
                </div>
              </div>
            )) : (
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
