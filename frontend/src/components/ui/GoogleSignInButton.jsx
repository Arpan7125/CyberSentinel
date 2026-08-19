import React, { useEffect, useRef, useState } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let scriptPromise = null;
function loadGoogleScript() {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
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

/**
 * Real "Sign in with Google" button using Google Identity Services — renders
 * Google's own widget, which returns a real signed JWT credential that the
 * backend cryptographically verifies (see auth_views.GoogleLoginView). There
 * is no client-side fallback: without a configured client ID this honestly
 * shows as unavailable instead of faking a successful login.
 */
export default function GoogleSignInButton({ onCredential, onError, text = 'signin_with' }) {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);

  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onCredentialRef.current = onCredential;
    onErrorRef.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => onCredentialRef.current?.(response.credential),
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text,
        });
        setReady(true);
      })
      .catch(() => onErrorRef.current?.('Failed to load Google Sign-In.'));

    return () => { cancelled = true; };
  }, [text]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <button type="button" className="auth-social-btn" disabled title="Google sign-in is not configured (VITE_GOOGLE_CLIENT_ID unset)">
        Google (not configured)
      </button>
    );
  }

  return <div ref={containerRef} style={{ display: ready ? 'block' : 'none' }} />;
}
