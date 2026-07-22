import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import PublicNavbar from '../components/navigation/PublicNavbar';
import Footer from '../components/navigation/Footer';
import ScrollToTop from '../components/ui/ScrollToTop';
import CookieConsent from '../components/ui/CookieConsent';
import Breadcrumbs from '../components/navigation/Breadcrumbs';

export default function PublicLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  // Scroll to top on route change
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="pub-layout">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <PublicNavbar />
      {!isHome && (
        <div className="pub-breadcrumb-bar">
          <div className="pub-container">
            <Breadcrumbs />
          </div>
        </div>
      )}
      <main id="main-content" className="pub-main">
        <Outlet />
      </main>
      <Footer />
      <ScrollToTop />
      <CookieConsent />
    </div>
  );
}
