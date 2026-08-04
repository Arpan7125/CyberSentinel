import { useEffect, useRef, useState } from 'react';

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

/**
 * Subscribes to a CyberSentinel WebSocket channel and calls onMessage with
 * each real push from the backend (see backend/api/consumers.py). Auto-
 * reconnects with backoff on drop. Pass token=null to skip connecting
 * (e.g. the public threat-feed channel needs no auth).
 */
export function useSocket(path, { token, enabled = true, onMessage } = {}) {
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!enabled) return undefined;

    let socket;
    let closedByClient = false;
    let retryDelay = 1000;
    let retryTimer;

    const connect = () => {
      const url = new URL(`${WS_BASE}${path}`);
      if (token) url.searchParams.set('token', token);
      socket = new WebSocket(url.toString());

      socket.onopen = () => {
        retryDelay = 1000;
        setConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessageRef.current?.(data);
        } catch {
          // Ignore malformed frames rather than crashing the socket handler.
        }
      };

      socket.onclose = () => {
        setConnected(false);
        if (closedByClient) return;
        retryTimer = setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 30000);
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connect();

    return () => {
      closedByClient = true;
      clearTimeout(retryTimer);
      socket?.close();
    };
  }, [path, token, enabled]);

  return { connected };
}
