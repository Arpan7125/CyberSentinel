import React, { useState } from 'react';

const MICROSOFT_CLIENT_ID = import.meta.env.VITE_MICROSOFT_CLIENT_ID || '';
const SCRIPT_SRC = 'https://alcdn.msauth.net/browser/3.x/js/msal-browser.min.js';

let scriptPromise = null;
function loadMsalScript() {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (window.msal?.PublicClientApplication) return resolve();
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return scriptPromise;
}

let msalInstancePromise = null;
function getMsalInstance() {
  if (msalInstancePromise) return msalInstancePromise;
  msalInstancePromise = loadMsalScript().then(async () => {
    const instance = new window.msal.PublicClientApplication({
      auth: {
        clientId: MICROSOFT_CLIENT_ID,
        authority: 'https://login.microsoftonline.com/common',
        redirectUri: window.location.origin,
      },
    });
    await instance.initialize();
    return instance;
  });
  return msalInstancePromise;
}

/**
 * Real "Sign in with Microsoft" button using MSAL's public-client popup flow
 * (auth code + PKCE — no client secret ships to the browser). Returns a real
 * signed ID token that the backend cryptographically verifies (see
 * auth_views.MicrosoftLoginView). No client-side fallback: without a
 * configured client ID this honestly shows as unavailable.
 */
export default function MicrosoftSignInButton({ onCredential, onError, text = 'Sign in with Microsoft' }) {
  const [loading, setLoading] = useState(false);

  if (!MICROSOFT_CLIENT_ID) {
    return (
      <button type="button" className="auth-social-btn" disabled title="Microsoft sign-in is not configured (VITE_MICROSOFT_CLIENT_ID unset)">
        Microsoft (not configured)
      </button>
    );
  }

  const handleClick = async () => {
    setLoading(true);
    try {
      const instance = await getMsalInstance();
      const response = await instance.loginPopup({ scopes: ['openid', 'profile', 'email'] });
      onCredential(response.idToken);
    } catch (err) {
      if (err?.errorCode !== 'user_cancelled') {
        onError?.(err.message || 'Microsoft sign-in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" className="auth-social-btn" onClick={handleClick} disabled={loading}>
      <svg width="16" height="16" viewBox="0 0 21 21" aria-hidden="true" style={{ flexShrink: 0 }}>
        <rect x="1" y="1" width="9" height="9" fill="#F25022" />
        <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
        <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
        <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
      </svg>
      {loading ? 'Signing in…' : text}
    </button>
  );
}
