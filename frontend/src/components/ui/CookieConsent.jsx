import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cs_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = (level) => {
    localStorage.setItem('cs_cookie_consent', level);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
      <div className="cookie-content">
        <div className="cookie-text">
          <h3 className="cookie-title">🍪 We value your privacy</h3>
          <p className="cookie-desc">
            We use cookies to enhance your experience, analyze site traffic, and personalize content.
            By clicking "Accept All", you consent to our use of cookies. Read our{' '}
            <Link to="/cookies" className="cookie-link">Cookie Policy</Link> for more details.
          </p>
        </div>
        <div className="cookie-actions">
          <button className="cookie-btn cookie-btn-accept" onClick={() => accept('all')}>Accept All</button>
          <button className="cookie-btn cookie-btn-essential" onClick={() => accept('essential')}>Essential Only</button>
          <button className="cookie-btn cookie-btn-decline" onClick={() => accept('declined')}>Decline</button>
        </div>
      </div>
    </div>
  );
}
