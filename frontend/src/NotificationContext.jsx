import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

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
      // Mock notifications fallback
      setNotifications([
        { id: 1, title: 'Welcome to CyberSentinel', message: 'Explore scanners and platform security guidelines.', notification_type: 'General', is_read: false, created_at: new Date().toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

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
