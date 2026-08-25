import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

/**
 * Authentication state.
 *
 * The rule this file now follows, which it previously did not: **only the
 * server can create a session.** Every auth call used to be wrapped in a catch
 * that, on any network error, called `createLocalUserSession()` — writing a
 * fabricated `cs_local_token_<timestamp>` and a logged-in user into
 * localStorage. The admin variant passed `role: 'admin'`, so blocking a single
 * request in devtools walked straight into the admin workspace with no
 * password. A hardcoded `'123456'` was also accepted as a valid OTP. All of
 * that is gone: a failed request is an error the user sees, never a sign-in.
 *
 * The cached user in localStorage is a rendering hint so the shell does not
 * flash on reload. It is never authority — `/auth/profile/` is re-verified on
 * mount, and a rejected token clears the session. Route guards keyed off this
 * object only decide what to *draw*; every privileged action is authorised
 * again server-side.
 */

const AuthContext = createContext(null);
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // sign out after 15 minutes idle
const TOKEN_KEY = 'cs_token';
const USER_KEY = 'cs_user';

/** Roles are derived from the server's own flags, never from a client field. */
function deriveUser(payload) {
  const isAdmin = Boolean(payload.is_admin || payload.is_staff || payload.is_superuser);
  return {
    ...payload,
    role: payload.role || (isAdmin ? 'admin' : 'customer'),
    is_admin: isAdmin,
  };
}

function readStoredUser() {
  try {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    // Corrupt or unreadable storage: start signed out rather than crashing.
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

/** Turn a fetch failure into a message a person can act on. */
async function readError(response, fallback) {
  let data = null;
  try {
    data = await response.json();
  } catch {
    // no JSON body
  }
  if (response.status === 429) {
    return 'Too many attempts. Wait a few minutes before trying again.';
  }
  return data?.error || data?.detail || fallback;
}

function isNetworkError(err) {
  return err instanceof TypeError || /fetch|network/i.test(err?.message || '');
}

const OFFLINE_MESSAGE =
  "Can't reach CyberSentinel right now. Check your connection and try again.";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(false);
  const [sessionNotice, setSessionNotice] = useState(null);

  const lastActivityRef = useRef(Date.now());

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const persistSession = useCallback((authToken, payload) => {
    const nextUser = deriveUser(payload);
    localStorage.setItem(TOKEN_KEY, authToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(authToken);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await fetch(`${API}/auth/logout/`, {
          method: 'POST',
          headers: { Authorization: `Token ${token}` },
        });
      } catch {
        // The token is being discarded locally regardless; a failed
        // server-side logout is not worth blocking the user on.
      }
    }
    clearSession();
  }, [token, clearSession]);

  // Idle timeout and global 401 handling.
  useEffect(() => {
    if (!user) return undefined;

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };
    const handleAuthError = () => {
      setSessionNotice('Your session ended. Sign in again to continue.');
      logout();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('auth-error', handleAuthError);

    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current > SESSION_TIMEOUT_MS) {
        // A blocking window.alert() steals focus and ignores the design
        // system; the notice is rendered in the UI instead.
        setSessionNotice('Signed out after 15 minutes of inactivity.');
        logout();
      }
    }, 30000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('auth-error', handleAuthError);
      clearInterval(interval);
    };
  }, [user, logout]);

  // Re-verify the stored token against the server on mount.
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);

    fetch(`${API}/auth/profile/`, { headers: { Authorization: `Token ${token}` } })
      .then(async (response) => {
        if (!active) return;
        if (response.ok) {
          const data = await response.json();
          const verified = deriveUser(data);
          setUser(verified);
          localStorage.setItem(USER_KEY, JSON.stringify(verified));
        } else if (response.status === 401 || response.status === 403) {
          // The server rejected this token. It is not valid, whatever
          // localStorage says.
          clearSession();
        }
        // Any other status (500, 502) is a server problem, not an invalid
        // session — keep the cached user and let the next call decide.
      })
      .catch(() => {
        // Offline. The cached user stays for rendering, but no privileged
        // request will succeed until the API is reachable again, so nothing
        // is actually granted by keeping it.
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, clearSession]);

  /** Shared request/response handling for every credential exchange. */
  const authRequest = useCallback(async (path, body, fallbackMessage) => {
    let response;
    try {
      response = await fetch(`${API}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err) {
      if (isNetworkError(err)) throw new Error(OFFLINE_MESSAGE);
      throw err;
    }

    if (!response.ok) {
      throw new Error(await readError(response, fallbackMessage));
    }
    return response.json();
  }, []);

  const login = useCallback(
    async (username, password) => {
      const data = await authRequest(
        '/auth/login/',
        { username: username.trim(), password },
        'Sign-in failed. Check your details and try again.',
      );
      return { user: persistSession(data.token, data.user) };
    },
    [authRequest, persistSession],
  );

  const requestOTP = useCallback(
    async (email) =>
      authRequest(
        '/auth/request-otp/',
        { email: email.trim() },
        "Couldn't send a sign-in code. Try again in a moment.",
      ),
    [authRequest],
  );

  const loginWithOTP = useCallback(
    async (email, otp) => {
      const data = await authRequest(
        '/auth/otp-login/',
        { email: email.trim(), otp: otp.trim() },
        'That code was not accepted.',
      );
      return { user: persistSession(data.token, data.user) };
    },
    [authRequest, persistSession],
  );

  const googleLogin = useCallback(
    async (credential) => {
      const data = await authRequest(
        '/auth/google-login/',
        { credential },
        'Google sign-in failed.',
      );
      return { user: persistSession(data.token, data.user) };
    },
    [authRequest, persistSession],
  );

  const microsoftLogin = useCallback(
    async (credential) => {
      const data = await authRequest(
        '/auth/microsoft-login/',
        { credential },
        'Microsoft sign-in failed.',
      );
      return { user: persistSession(data.token, data.user) };
    },
    [authRequest, persistSession],
  );

  const adminLogin = useCallback(
    async (email, authKey) => {
      const data = await authRequest(
        '/auth/admin-login/',
        { email: email.trim(), auth_key: authKey.trim() },
        'Administrator sign-in failed.',
      );
      // The admin flags come from the server's response. The old code forced
      // `is_staff` and `is_superuser` to true on the client regardless of what
      // the server said, so the admin UI rendered for anyone who got a 200
      // back from this endpoint.
      return { user: persistSession(data.token, data.user) };
    },
    [authRequest, persistSession],
  );

  const register = useCallback(
    async (username, email, password, confirmPassword) => {
      // No `role` is sent. The server ignores it now, but a client that keeps
      // sending one invites the next person to re-add the branch that read it.
      const data = await authRequest(
        '/auth/register/',
        { username, email, password, confirm_password: confirmPassword },
        'Registration failed.',
      );
      return persistSession(data.token, data.user);
    },
    [authRequest, persistSession],
  );

  const isAdmin = Boolean(user?.is_admin);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        setToken,
        loading,
        sessionNotice,
        dismissSessionNotice: () => setSessionNotice(null),
        login,
        requestOTP,
        loginWithOTP,
        googleLogin,
        microsoftLogin,
        adminLogin,
        register,
        logout,
        isAdmin,
        isEnterprise: isAdmin || user?.role === 'enterprise',
        isCustomer: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }
  return context;
}

export default AuthContext;
