import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const routeLabels = {
  '': 'Home',
  'about': 'About Us',
  'solutions': 'Solutions',
  'services': 'Services',
  'products': 'Products',
  'industries': 'Industries',
  'pricing': 'Pricing',
  'contact': 'Contact',
  'blog': 'Blog',
  'resources': 'Resources',
  'case-studies': 'Case Studies',
  'careers': 'Careers',
  'faq': 'FAQ',
  'docs': 'Documentation',
  'trust': 'Trust Center',
  'privacy': 'Privacy Policy',
  'terms': 'Terms & Conditions',
  'cookies': 'Cookie Policy',
  'security': 'Security Policy',
  'responsible-disclosure': 'Responsible Disclosure',
  'app': 'Platform',
};

export default function Breadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  if (pathSegments.length === 0) return null;

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb navigation">
      <ol className="breadcrumb-list">
        <li className="breadcrumb-item">
          <Link to="/" className="breadcrumb-link">Home</Link>
        </li>
        {pathSegments.map((segment, index) => {
          const path = '/' + pathSegments.slice(0, index + 1).join('/');
          const isLast = index === pathSegments.length - 1;
          const label = routeLabels[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

          return (
            <li key={path} className="breadcrumb-item">
              <span className="breadcrumb-separator" aria-hidden="true">/</span>
              {isLast ? (
                <span className="breadcrumb-current" aria-current="page">{label}</span>
              ) : (
                <Link to={path} className="breadcrumb-link">{label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
