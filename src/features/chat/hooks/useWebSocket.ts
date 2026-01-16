import { useEffect, useRef, useCallback } from 'react';

interface UseWebSocketOptions {
  userId: string;
  token: string;
  onMessage: (data: any) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
  autoConnect?: boolean;
}

export function useWebSocket({
  userId,
  token,
  onMessage,
  onError,
  onOpen,
  onClose,
  autoConnect = true,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Get WebSocket base URL from environment or use default
  const getWsUrl = useCallback(() => {
    // WebSocket is on port 8090, not 8080 (API port)
    const wsBase = import.meta.env.VITE_WS_BASE_URL || 'ws://72.60.198.235:8090';
    return `${wsBase}/ws?userId=${userId}`;
  }, [userId]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(getWsUrl());

      ws.onopen = () => {
        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Note: Global event dispatch is handled by WebSocketManager
          // No need to dispatch here to avoid duplicates
          onMessage(data);
        } catch (err) {
          onMessage(event.data);
        }
      };

      ws.onerror = (error) => {
        onError?.(error);
      };

      ws.onclose = () => {
        wsRef.current = null;
        onClose?.();

        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      wsRef.current = ws;
    } catch (err) {
      onError?.(err as any);
    }
  }, [token, getWsUrl, onMessage, onError, onOpen, onClose]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const send = useCallback(
    (data: any) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(data));
      } else {
        console.warn('⚠️ WebSocket is not connected. Message not sent:', data);
      }
    },
    []
  );

  const isConnected = useCallback(() => {
    return wsRef.current?.readyState === WebSocket.OPEN;
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && userId && token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, userId, token, connect, disconnect]);

  return {
    ws: wsRef.current,
    send,
    connect,
    disconnect,
    isConnected: isConnected(),
  };
}
