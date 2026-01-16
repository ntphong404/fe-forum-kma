import { useState, useCallback } from 'react';
import { ChatService } from '@/features/chat/services/chat.service';
import type { Conversation } from '@/interfaces/chat.types';

export function useChatConversations() {
    const [openConversations, setOpenConversations] = useState<Conversation[]>([]);

    /**
     * Open an existing conversation directly (used for group chats)
     */
    const openConversation = useCallback((conversation: Conversation) => {
        // Check if already open
        const existingOpen = openConversations.find(
            (conv) => conv.conversationId === conversation.conversationId
        );

        if (existingOpen) {
            return;
        }

        // Limit to 3 open conversations
        setOpenConversations((prev) => {
            if (prev.length >= 3) {
                return [...prev.slice(1), conversation];
            }
            return [...prev, conversation];
        });
    }, [openConversations]);

    /**
     * Start a chat with a user
     * - If conversation exists, open it
     * - If not, create a new empty conversation UI
     */
    const startChatWithUser = useCallback(async (
        userId: string,
        _userName: string,
        _userAvatar?: string
    ) => {
        try {
            // Check if conversation already open
            const existingOpen = openConversations.find(
                (conv) => conv.partnerId === userId || conv.participantIds.includes(userId)
            );

            if (existingOpen) {
                // Already open, just focus it
                return;
            }

            // Try to find existing conversation from backend
            const conversations = await ChatService.getConversations();
            const existingConv = conversations.find(
                (conv) => conv.type === 'private' &&
                    (conv.partnerId === userId || conv.participantIds.includes(userId))
            );

            if (existingConv) {
                // Open existing conversation
                setOpenConversations((prev) => [...prev, existingConv]);
            } else {
                // Create a temporary conversation object for UI
                // The actual conversation will be created when first message is sent
                const tempConversation: Conversation = {
                    conversationId: `temp-${userId}-${Date.now()}`,
                    type: 'private',
                    participantIds: [userId],
                    partnerId: userId,
                    lastMessage: null,
                    lastMessageAt: null,
                    unreadCounts: {},
                };

                setOpenConversations((prev) => [...prev, tempConversation]);
            }
        } catch {
            // Failed to start chat - ignore
        }
    }, [openConversations]);

    /**
     * Close a conversation window
     */
    const closeConversation = useCallback((conversationId: string) => {
        setOpenConversations((prev) =>
            prev.filter((conv) => conv.conversationId !== conversationId)
        );
    }, []);

    /**
     * Update conversation after first message sent
     */
    const updateConversation = useCallback((
        tempId: string,
        realConversation: Conversation
    ) => {
        setOpenConversations((prev) =>
            prev.map((conv) =>
                conv.conversationId === tempId ? realConversation : conv
            )
        );
    }, []);

    return {
        openConversations,
        openConversation,
        startChatWithUser,
        closeConversation,
        updateConversation,
    };
}
