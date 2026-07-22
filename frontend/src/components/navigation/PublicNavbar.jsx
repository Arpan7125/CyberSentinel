import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  {
    label: 'Solutions', href: '/solutions', children: [
      { label: 'Threat Intelligence Platform', href: '/solutions#threat-intelligence', desc: 'Global threat feeds & adversary tracking' },
      { label: 'Email Security Gateway', href: '/solutions#email-security', desc: 'AI-powered phishing & BEC protection' },
      { label: 'Endpoint Detection & Response', href: '/solutions#endpoint-protection', desc: 'Behavioral AI for endpoint security' },
      { label: 'Cloud Security (CSPM)', href: '/solutions#cloud-security', desc: 'Multi-cloud misconfiguration management' },
    ],
  },
  {
    label: 'Products', href: '/products', children: [
      { label: 'CyberSentinel Shield', href: '/products#shield', desc: 'Endpoint protection platform' },
      { label: 'CyberSentinel Eye', href: '/products#eye', desc: 'Security monitoring & analytics' },
      { label: 'CyberSentinel Vault', href: '/products#vault', desc: 'Data protection & DLP' },
    ],
  },
  {
    label: 'Services', href: '/services', children: [
      { label: 'Managed Detection & Response', href: '/services#mdr', desc: '24/7 SOC monitoring' },
      { label: 'Penetration Testing', href: '/services#pen-testing', desc: 'Offensive security assessments' },
      { label: 'Incident Response', href: '/services#incident-response', desc: 'Emergency breach response' },
      { label: 'Security Consulting', href: '/services#consulting', desc: 'Program development & compliance' },
    ],
  },
  { label: 'Industries', href: '/industries' },
  { label: 'Pricing', href: '/pricing' },
  {
    label: 'Resources', href: '/resources', children: [
      { label: 'Blog', href: '/blog', desc: 'Threat research & insights' },
      { label: 'Case Studies', href: '/case-studies', desc: 'Customer success stories' },
      { label: 'Documentation', href: '/docs', desc: 'Platform guides & API reference' },
      { label: 'FAQ', href: '/faq', desc: 'Common questions answered' },
    ],
  },
];

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const dropdownTimeout = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setActiveDropdown(null);
    setSearchOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleDropdownEnter = (index) => {
    clearTimeout(dropdownTimeout.current);
    setActiveDropdown(index);
  };
  const handleDropdownLeave = () => {
    dropdownTimeout.current = setTimeout(() => setActiveDropdown(null), 200);
  };

  const isActive = (href) => location.pathname === href || location.pathname.startsWith(href + '/');

  return (
    <>
      <header className={`pub-navbar ${scrolled ? 'scrolled' : ''}`} role="banner">
        <div className="pub-navbar-inner">
          {/* Logo */}
          <Link to="/" className="pub-logo" aria-label="CyberSentinel home">
            <img src="/logo.png" alt="" width="36" height="36" className="pub-logo-img" />
            <div className="pub-logo-text">
              <span className="pub-logo-name">CyberSentinel</span>
              <span className="pub-logo-tag">Security Platform</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="pub-nav-desktop" aria-label="Main navigation">
            {NAV_LINKS.map((link, idx) => (
              <div
                key={link.label}
                className="pub-nav-item"
                onMouseEnter={() => link.children && handleDropdownEnter(idx)}
                onMouseLeave={handleDropdownLeave}
              >
                <Link
                  to={link.href}
                  className={`pub-nav-link ${isActive(link.href) ? 'active' : ''}`}
                >
                  {link.label}
                  {link.children && (
                    <svg className="pub-nav-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                </Link>

                {/* Dropdown */}
                {link.children && activeDropdown === idx && (
                  <div className="pub-dropdown" onMouseEnter={() => handleDropdownEnter(idx)} onMouseLeave={handleDropdownLeave}>
                    {link.children.map(child => (
                      <Link key={child.href} to={child.href} className="pub-dropdown-item">
                        <span className="pub-dropdown-label">{child.label}</span>
                        <span className="pub-dropdown-desc">{child.desc}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="pub-nav-actions">
            <button className="pub-search-toggle" onClick={() => setSearchOpen(!searchOpen)} aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5"/><path d="M12 12L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
            <Link to="/login" className="pub-nav-login">Log In</Link>
            <Link to="/contact" className="pub-nav-cta">Get a Demo</Link>
            {/* Mobile Toggle */}
            <button className="pub-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen}>
              <span className={`hamburger ${mobileOpen ? 'open' : ''}`}>
                <span /><span /><span />
              </span>
            </button>
          </div>
        </div>

        {/* Search Overlay */}
        {searchOpen && (
          <div className="pub-search-overlay">
            <div className="pub-search-inner">
              <input
                type="search"
                placeholder="Search CyberSentinel..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pub-search-input"
                autoFocus
                aria-label="Search the site"
              />
              <button className="pub-search-close" onClick={() => { setSearchOpen(false); setSearchQuery(''); }} aria-label="Close search">×</button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="pub-mobile-overlay" onClick={() => setMobileOpen(false)}>
          <nav className="pub-mobile-drawer" onClick={e => e.stopPropagation()} aria-label="Mobile navigation">
            <div className="pub-mobile-header">
              <span className="pub-logo-name">CyberSentinel</span>
              <button className="pub-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">×</button>
            </div>
            <div className="pub-mobile-links">
              {NAV_LINKS.map(link => (
                <div key={link.label} className="pub-mobile-group">
                  <Link to={link.href} className="pub-mobile-link" onClick={() => setMobileOpen(false)}>{link.label}</Link>
                  {link.children && (
                    <div className="pub-mobile-sub">
                      {link.children.map(child => (
                        <Link key={child.href} to={child.href} className="pub-mobile-sublink" onClick={() => setMobileOpen(false)}>
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="pub-mobile-actions">
                <Link to="/login" className="pub-mobile-login" onClick={() => setMobileOpen(false)}>Log In</Link>
                <Link to="/contact" className="pub-mobile-cta" onClick={() => setMobileOpen(false)}>Get a Demo</Link>
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
