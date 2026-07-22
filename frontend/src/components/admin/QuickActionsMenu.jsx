import React, { useState, useRef, useEffect } from 'react';
import { useAdminWorkspace } from '../../contexts/AdminWorkspaceContext';
import { Plus, UserPlus, ShieldAlert, FileText, Settings, X } from 'lucide-react';

export default function QuickActionsMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const { setActiveModule } = useAdminWorkspace();

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const actions = [
    { label: 'Invite User', icon: <UserPlus size={16} />, onClick: () => { setActiveModule('users'); setOpen(false); } },
    { label: 'Create Threat Intel', icon: <ShieldAlert size={16} />, onClick: () => { setActiveModule('threats'); setOpen(false); } },
    { label: 'Generate Report', icon: <FileText size={16} />, onClick: () => { setActiveModule('finance'); setOpen(false); } },
    { label: 'System Settings', icon: <Settings size={16} />, onClick: () => { setOpen(false); } }
  ];

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button 
        className="btn-pub btn-pub-primary btn-pub-sm" 
        style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, background: '#AF52DE' }}
        onClick={() => setOpen(!open)}
      >
        <Plus size={16} /> Quick Action
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 8,
          width: 200,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          zIndex: 100,
          overflow: 'hidden'
        }}>
          {actions.map((action, idx) => (
            <button 
              key={idx}
              onClick={action.onClick}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: idx === actions.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: 13,
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ color: 'var(--text-muted)' }}>{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
