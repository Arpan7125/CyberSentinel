import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

function ToastItem({ toast, onDismiss }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };

  return (
    <div
      className={`toast-item toast-${toast.type} ${exiting ? 'toast-exit' : 'toast-enter'}`}
      role="alert"
      aria-live="polite"
    >
      <span className="toast-icon">{icons[toast.type] || 'ℹ'}</span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-close" onClick={() => { setExiting(true); setTimeout(() => onDismiss(toast.id), 300); }} aria-label="Dismiss notification">×</button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container" aria-label="Notifications">
        {toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />)}
      </div>
    </ToastContext.Provider>
  );
}
