import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const AuthContext = createContext(null);
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes session timeout

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('cs_token') || null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('cs_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  const lastActivityRef = useRef(Date.now());

  const logout = useCallback(async () => {
    if (token) {
      try {
        await fetch(`${API}/auth/logout/`, {
          method: 'POST',
          headers: { Authorization: `Token ${token}` }
        });
      } catch (err) {
        console.error("Logout request error:", err);
      }
    }
    localStorage.removeItem('cs_token');
    localStorage.removeItem('cs_user');
    setToken(null);
    setUser(null);
  }, [token]);

  // Session Inactivity & Auth Error Monitor
  useEffect(() => {
    if (!user) return;

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const handleAuthError = () => {
      logout();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('auth-error', handleAuthError);

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivityRef.current > SESSION_TIMEOUT_MS) {
        alert('Session expired due to inactivity. Please log in again.');
        logout();
      }
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('auth-error', handleAuthError);
      clearInterval(interval);
    };
  }, [user, logout]);

  // Verify stored token on mount or token changes
  useEffect(() => {
    let active = true;
    if (token) {
      setLoading(true);
      fetch(`${API}/auth/profile/`, {
        headers: { Authorization: `Token ${token}` }
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!active) return;
          if (data) {
            const fetchedUser = {
              ...data,
              role: data.role || (data.is_admin || data.is_superuser || data.is_staff ? 'admin' : 'customer')
            };
            setUser(fetchedUser);
            localStorage.setItem('cs_user', JSON.stringify(fetchedUser));
          } else {
            logout();
          }
        })
        .catch(() => {
          if (!active) return;
          logout();
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else {
      setLoading(false);
    }
    return () => {
      active = false;
    };
  }, [token, logout]);

  const login = useCallback(async (username, password) => {
    const res = await fetch(`${API}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid username or password.');
    }

    if (data.requiresMFA) {
      return { requiresMFA: true };
    }

    localStorage.setItem('cs_token', data.token);
    setToken(data.token);
    
    const loggedUser = {
      ...data.user,
      role: data.user.role || (data.user.is_superuser || data.user.is_staff ? 'admin' : 'customer')
    };
    setUser(loggedUser);
    localStorage.setItem('cs_user', JSON.stringify(loggedUser));
    return { user: loggedUser };
  }, []);

  const requestOTP = useCallback(async (email) => {
    const res = await fetch(`${API}/auth/request-otp/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send login OTP.');
    }
    return data;
  }, []);

  const loginWithOTP = useCallback(async (email, otp) => {
    const res = await fetch(`${API}/auth/otp-login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid OTP code.');
    }

    localStorage.setItem('cs_token', data.token);
    setToken(data.token);

    const loggedUser = {
      ...data.user,
      role: data.user.role || (data.user.is_superuser || data.user.is_staff ? 'admin' : 'customer')
    };
    setUser(loggedUser);
    localStorage.setItem('cs_user', JSON.stringify(loggedUser));
    return { user: loggedUser };
  }, []);

  const googleLogin = useCallback(async (credential) => {
    const res = await fetch(`${API}/auth/google-login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Google authentication failed.');
    }

    localStorage.setItem('cs_token', data.token);
    setToken(data.token);
    
    const loggedUser = {
      ...data.user,
      role: data.user.role || (data.user.is_superuser || data.user.is_staff ? 'admin' : 'customer')
    };
    setUser(loggedUser);
    localStorage.setItem('cs_user', JSON.stringify(loggedUser));
    return { user: loggedUser };
  }, []);

  const adminLogin = useCallback(async (email, auth_key) => {
    const res = await fetch(`${API}/auth/admin-login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, auth_key }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Admin authentication failed.');
    }

    localStorage.setItem('cs_token', data.token);
    setToken(data.token);
    
    const loggedUser = {
      ...data.user,
      role: 'admin',
      is_staff: true,
      is_superuser: true
    };
    setUser(loggedUser);
    localStorage.setItem('cs_user', JSON.stringify(loggedUser));
    return { user: loggedUser };
  }, []);

  const register = useCallback(async (username, email, password, confirm_password, role = 'customer') => {
    const res = await fetch(`${API}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, confirm_password, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.detail || 'Registration failed.');
    }
    localStorage.setItem('cs_token', data.token);
    setToken(data.token);
    const newUser = {
      ...data.user,
      role: data.user.role || role
    };
    setUser(newUser);
    localStorage.setItem('cs_user', JSON.stringify(newUser));
    return newUser;
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      token,
      setToken,
      loading,
      login,
      requestOTP,
      loginWithOTP,
      googleLogin,
      adminLogin,
      register,
      logout,
      isAdmin: user?.role === 'admin' || user?.is_superuser || user?.is_staff,
      isEnterprise: user?.role === 'enterprise' || user?.role === 'admin' || user?.is_superuser,
      isCustomer: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

