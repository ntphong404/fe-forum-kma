import { useAuthStore } from '@/store/useStore';
import { useWebSocket } from '@/features/chat/hooks/useWebSocket';

interface ChatMessageEvent {
    type: 'MESSAGE' | 'MESSAGE_DELETED';
    messageId: string;
    chatId: string;
    senderId: string;
    receiverId: string | null;
    participantIds: string[] | null;
    message: string;
    messageType: string;
    sentAt: string;
    resourceUrls?: string[];
    isDeleted?: boolean;
    isLatest?: boolean; // Indicates if the deleted message is the latest message in conversation
}

interface NotificationEvent {
    id: string;
    userId: string;
    senderId?: string;
    senderName?: string;
    type: 'POST' | 'LIKE_POST' | 'LIKE_COMMENT' | 'COMMENT' | 'CHAT' | 'MENTION' | 'ADMIN';
    title: string;
    content: string;
    postId?: string;
    commentId?: string;
    groupId?: string;
    referenceId?: string;
    isRead: boolean;
    createdAt: string | number[];
}

/**
 * WebSocketManager - Manages global WebSocket connection
 * 
 * Architecture:
 * - There's only ONE WebSocket connection to chat-service (port 8090)
 * - This WebSocket receives BOTH:
 *   1. Chat messages (type: "MESSAGE" or "MESSAGE_DELETED")
 *   2. Notifications (type: "POST", "LIKE_POST", etc.)
 * 
 * The handler distinguishes message types and dispatches to correct event handlers.
 */
export default function WebSocketManager() {
    const user = useAuthStore((s) => s.user);

    /**
     * Unified message handler for all WebSocket messages
     * Routes messages to correct handler based on 'type' field
     */
    const handleWebSocketMessage = (data: ChatMessageEvent | NotificationEvent | any) => {
        console.log('[WebSocketManager] Received message:', data);

        // Check message type to route correctly
        // Chat messages have type: "MESSAGE" or "MESSAGE_DELETED"
        // Notifications have type: "POST", "LIKE_POST", "LIKE_COMMENT", "COMMENT", "CHAT", "MENTION", "ADMIN"

        if (data.type === 'MESSAGE' || data.type === 'MESSAGE_DELETED') {
            // This is a chat message
            handleChatMessage(data as ChatMessageEvent);
        } else if (data.type && ['POST', 'LIKE_POST', 'LIKE_COMMENT', 'COMMENT', 'CHAT', 'MENTION', 'ADMIN'].includes(data.type)) {
            // This is a notification
            handleNotification(data as NotificationEvent);
        } else if (data.chatId && data.senderId) {
            // Fallback: If no type but has chatId and senderId, treat as chat message
            // This handles legacy format
            handleChatMessage(data as ChatMessageEvent);
        } else {
            // Unknown message format, log for debugging
            console.warn('[WebSocketManager] Unknown message format:', data);
        }
    };

    /**
     * Handle chat messages
     */
    const handleChatMessage = (data: ChatMessageEvent) => {
        console.log('[WebSocketManager] Handling chat message:', data);

        // Handle deleted message event
        // Backend sends 'MESSAGE_DELETED' for deleted messages
        if (data.type === 'MESSAGE_DELETED' || data.isDeleted) {
            console.log('[WebSocketManager] Message deleted event detected, dispatching chat-message-deleted with:', {
                messageId: data.messageId,
                chatId: data.chatId,
                type: data.type,
                isDeleted: data.isDeleted,
                isLatest: data.isLatest
            });
            window.dispatchEvent(new CustomEvent('chat-message-deleted', { detail: data }));
            return;
        }

        // Dispatch event for own messages (echo from server)
        if (data.senderId === user?.userId) {
            window.dispatchEvent(new CustomEvent('chat-message-sent', { detail: data }));
            return;
        }

        // Dispatch event for received messages
        window.dispatchEvent(new CustomEvent('chat-message-received', { detail: data }));
    };

    /**
     * Handle notifications (post likes, comments, etc.)
     */
    const handleNotification = (data: NotificationEvent) => {
        console.log('[WebSocketManager] Handling notification:', data);

        // Dispatch event for new notification
        window.dispatchEvent(new CustomEvent('notification-received', { detail: data }));

        // Also update unread count
        window.dispatchEvent(new CustomEvent('notification-unread-count-changed', { detail: data }));
    };

    // Initialize unified WebSocket connection (port 8090)
    // This receives both chat messages and notifications
    useWebSocket({
        userId: user?.userId || '',
        token: localStorage.getItem('accessToken') || '',
        onMessage: handleWebSocketMessage, // Use unified handler
        autoConnect: !!user?.userId,
    });

    return null;
}


