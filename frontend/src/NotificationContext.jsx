import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './hooks/useSocket';

const NotificationContext = createContext(null);
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export function NotificationProvider({ children }) {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/notifications/`, {
        headers: { Authorization: `Token ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []));
      }
    } catch {
      // Real fetch failed — leave existing state as-is rather than showing a fabricated notification.
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial load only — live updates arrive over the WebSocket below.
  // The socket auto-reconnects, but if it's ever down for a stretch this
  // periodic refresh is the fallback so notifications don't go stale.
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const { connected: notificationsLive } = useSocket('/ws/notifications/', {
    token,
    enabled: !!token,
    onMessage: (notification) => {
      setNotifications((prev) => [notification, ...prev.filter((n) => n.id !== notification.id)]);
    },
  });

  const markAsRead = async (id) => {
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      if (token) {
        await fetch(`${API}/notifications/${id}/mark_read/`, {
          method: 'POST',
          headers: { Authorization: `Token ${token}` }
        });
      }
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      if (token) {
        await fetch(`${API}/notifications/mark_all_read/`, {
          method: 'POST',
          headers: { Authorization: `Token ${token}` }
        });
      }
    } catch {}
  };

  const addLocalNotification = (title, message, type = 'General') => {
    const newNotif = {
      id: Date.now(),
      title,
      message,
      notification_type: type,
      is_read: false,
      created_at: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      notificationsLive,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      addLocalNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
