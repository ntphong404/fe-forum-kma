/**
 * Constants cho Chat feature
 */

// Pagination
export const PAGINATION = {
    DEFAULT_MESSAGE_COUNT: 50,
    CONVERSATION_PAGE_SIZE: 20,
} as const;

// Time intervals (in milliseconds)
export const TIME_INTERVALS = {
    MESSAGE_GROUP_GAP: 5 * 60 * 1000, // 5 minutes - group messages together
    RECONNECT_DELAY: 3000, // WebSocket reconnect delay
    MESSAGE_DUPLICATE_THRESHOLD: 5000, // 5 seconds - prevent duplicate messages
} as const;

// Message types
export const MESSAGE_TYPES = {
    TEXT: 'TEXT',
    IMAGE: 'IMAGE',
    FILE: 'FILE',
} as const;

// Conversation types
export const CONVERSATION_TYPES = {
    PRIVATE: 'private',
    GROUP: 'group',
} as const;

// WebSocket events
export const WS_EVENTS = {
    MESSAGE: 'MESSAGE',
    TYPING: 'TYPING',
    READ: 'READ',
} as const;

// UI Constants
export const UI = {
    MINI_CHAT_WIDTH: 320,
    MINI_CHAT_HEIGHT: 480,
    MINI_CHAT_GAP: 20,
    MAX_OPEN_CHATS: 3,
} as const;

// AI Chat
export const AI_CHAT = {
    CONVERSATION_ID: 'ai-chat',
    NAME: 'Trợ lý AI',
    AVATAR: '🤖',
} as const;
