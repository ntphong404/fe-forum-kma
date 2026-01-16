import { useEffect, useRef, useCallback } from 'react';

interface UseNotificationWebSocketOptions {
    userId: string;
    onNotification: (data: any) => void;
    onError?: (error: Event) => void;
    onOpen?: () => void;
    onClose?: () => void;
    autoConnect?: boolean;
}

/**
 * Hook to manage WebSocket connection for real-time notifications
 */
export function useNotificationWebSocket({
    userId,
    onNotification,
    onError,
    onOpen,
    onClose,
    autoConnect = true,
}: UseNotificationWebSocketOptions) {
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
    const isConnectingRef = useRef(false);

    // Use refs to store callbacks to avoid recreating connect function
    const onNotificationRef = useRef(onNotification);
    const onErrorRef = useRef(onError);
    const onOpenRef = useRef(onOpen);
    const onCloseRef = useRef(onClose);

    // Update refs when callbacks change
    useEffect(() => {
        onNotificationRef.current = onNotification;
        onErrorRef.current = onError;
        onOpenRef.current = onOpen;
        onCloseRef.current = onClose;
    }, [onNotification, onError, onOpen, onClose]);


    // Get WebSocket URL for notification service (port 8090 - same as chat)
    const getWsUrl = useCallback(() => {
        const wsBase = import.meta.env.VITE_WS_BASE_URL || 'ws://72.60.198.235:8090';
        return `${wsBase}/ws?userId=${userId}`;
    }, [userId]);


    const connect = useCallback(() => {
        // Prevent multiple simultaneous connection attempts
        if (isConnectingRef.current) {
            console.log('[NotificationWS] Already connecting, skipping...');
            return;
        }

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            console.log('[NotificationWS] Already connected');
            return;
        }

        if (wsRef.current?.readyState === WebSocket.CONNECTING) {
            console.log('[NotificationWS] Connection in progress...');
            return;
        }

        if (!userId) {
            console.log('[NotificationWS] No userId, skipping connection');
            return;
        }

        isConnectingRef.current = true;
        console.log('[NotificationWS] Attempting to connect...', getWsUrl());

        try {
            const ws = new WebSocket(getWsUrl());

            ws.onopen = () => {
                console.log('[NotificationWS] ✅ Connected successfully');
                isConnectingRef.current = false;
                onOpenRef.current?.();
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('[NotificationWS] 📩 Received notification:', data);
                    onNotificationRef.current(data);
                } catch (err) {
                    console.error('[NotificationWS] Failed to parse message:', event.data);
                }
            };

            ws.onerror = (error) => {
                console.error('[NotificationWS] ❌ Error:', error);
                isConnectingRef.current = false;
                onErrorRef.current?.(error);
            };

            ws.onclose = (event) => {
                console.log('[NotificationWS] 🔌 Disconnected, code:', event.code, 'reason:', event.reason);
                wsRef.current = null;
                isConnectingRef.current = false;
                onCloseRef.current?.();

                // Auto-reconnect after 5 seconds if userId still exists
                if (userId) {
                    console.log('[NotificationWS] Will reconnect in 5 seconds...');
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, 5000);
                }
            };

            wsRef.current = ws;
        } catch (err) {
            console.error('[NotificationWS] Connection error:', err);
            isConnectingRef.current = false;
            onErrorRef.current?.(err as any);
        }
    }, [userId, getWsUrl]);

    const disconnect = useCallback(() => {
        console.log('[NotificationWS] Disconnecting...');
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        isConnectingRef.current = false;
    }, []);

    // Auto-connect on mount when userId is available
    useEffect(() => {
        if (autoConnect && userId) {
            console.log('[NotificationWS] Auto-connecting for user:', userId);
            connect();
        }

        return () => {
            disconnect();
        };
    }, [autoConnect, userId, connect, disconnect]);

    return {
        ws: wsRef.current,
        connect,
        disconnect,
        isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    };
}
