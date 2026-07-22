import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { Search, ChevronDown, Globe } from 'lucide-react';

export default function TopNavbar({ activeTab, setActiveTab, onSubscribe, onShowAdmin, onAuth }) {
  const { user, logout, isAdmin } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const NAV_ITEMS = [
    { id: 'dashboard', label: t('nav.dashboard') },
    { id: 'inbox', label: t('nav.incidents') },
    { id: 'text', label: t('nav.textScan') },
    { id: 'url', label: t('nav.urlScan') },
    { id: 'screenshot', label: t('nav.screenshot') },
    { id: 'quiz', label: t('nav.quiz') },
    { id: 'api-sandbox', label: t('nav.api') },
    { id: 'guidelines', label: t('nav.guide') },
    { id: 'settings', label: t('nav.settings') },
  ];

  return (
    <header className="top-navbar-wrapper" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Top Mini Nav */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', transition: 'all 0.3s' }}>
        <div className="top-navbar-inner" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', height: 42, gap: 24, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
          {!user ? (
            <>
              <span className="mini-nav-link" onClick={() => onAuth('register')}>{t('nav.signup')}</span>
              <span className="mini-nav-link" onClick={() => onAuth('login')}>{t('nav.login')}</span>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ background: 'var(--accent-orange)', color: 'white', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                  {user.username[0].toUpperCase()}
                </div>
                <span>{user.username}</span>
              </div>
              <span className="mini-nav-link" style={{ color: '#FF3B30' }} onClick={logout}>{t('nav.signout')}</span>
            </>
          )}
          <span className="mini-nav-link" style={{ color: 'var(--accent-orange)' }} onClick={onSubscribe}>{t('nav.subscribe')}</span>
          
          {/* Language Dropdown */}
          <div style={{ position: 'relative' }}>
            <span 
              className="mini-nav-link" 
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            >
              <Globe size={14} /> {language} <ChevronDown size={12} />
            </span>
            {langDropdownOpen && (
              <div style={{ 
                position: 'absolute', top: '100%', right: 0, marginTop: 8, 
                background: 'var(--bg-primary)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                padding: '8px 0', minWidth: 120, zIndex: 50, border: '1px solid var(--border-subtle)'
              }}>
                {['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Arabic', 'Russian', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Gujarati', 'Tamil'].map(lang => (
                  <div key={lang} style={{ padding: '8px 16px', fontSize: 13, cursor: 'pointer', transition: 'background 0.2s', color: 'var(--text-primary)' }} 
                       onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'} 
                       onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                       onClick={() => { setLanguage(lang); setLangDropdownOpen(false); }}>
                    {lang}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Animated Search Bar */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder={t('nav.search')} 
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                border: searchFocused ? '1px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                borderRadius: 20,
                padding: '6px 12px 6px 30px',
                fontSize: 12,
                outline: 'none',
                width: searchFocused ? 180 : 150,
                transition: 'all 0.3s ease',
                background: searchFocused ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
            />
            <Search size={14} style={{ position: 'absolute', left: 10, color: searchFocused ? 'var(--accent-orange)' : 'var(--text-secondary)', transition: 'color 0.3s' }} />
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div style={{ 
        background: 'var(--bg-secondary)', 
        borderBottom: '1px solid var(--border-subtle)', 
        transition: 'all 0.3s'
      }}>
        <div className="top-navbar-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 76 }}>
          
          {/* Logo */}
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'transform 0.2s' }} 
            onClick={() => setActiveTab('landing')}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <img src="/logo.png" alt="Logo" style={{ width: 40, height: 40 }} />
            <div>
              <div style={{ fontSize: 19, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>CyberSentinel</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 1 }}>
                Security Platform
              </div>
            </div>
          </div>

          {/* Links */}
          <nav style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                {item.label}
              </button>
            ))}
            
            {isAdmin && (
              <button
                className="nav-link"
                onClick={onShowAdmin}
                style={{ color: '#AF52DE', fontWeight: 800 }}
              >
                Admin
              </button>
            )}
          </nav>
        </div>
      </div>
      
      <style>{`
        .mini-nav-link {
          cursor: pointer;
          transition: color 0.15s;
        }
        .mini-nav-link:hover { color: var(--text-primary); }
        .nav-link {
          padding: 8px 16px;
          border-radius: 24px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          border: none;
          background: none;
        }
        .nav-link:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }
        .nav-link.active {
          color: var(--accent);
          background: var(--accent-muted);
          font-weight: 600;
        }
      `}</style>
    </header>
  );
}
