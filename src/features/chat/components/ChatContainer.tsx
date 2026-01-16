import { useEffect, useState } from 'react';
import { useChatConversations } from '../hooks/useChatConversations';
import MiniChatWindow from './MiniChatWindow';
import MiniAIChatWindow from './MiniAIChatWindow';
import FriendsList from './FriendsList';
import type { Conversation } from '@/interfaces/chat.types';
import { AI_CONVERSATION_ID } from './ConversationList';
import { ChatService } from '../services/chat.service';

interface ChatContainerProps {
    showFriendsList?: boolean;
}

export default function ChatContainer({ showFriendsList = false }: ChatContainerProps) {
    const { openConversations, openConversation, startChatWithUser, closeConversation, updateConversation } = useChatConversations();
    const [showAIChat, setShowAIChat] = useState(false);

    // Listen for conversation creation events
    useEffect(() => {
        const handleConversationCreated = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { tempId, realConversationId } = customEvent.detail;

            // Fetch the real conversation from backend
            try {
                const conversations = await ChatService.getConversations();
                const realConv = conversations.find(c => c.conversationId === realConversationId);

                if (realConv) {
                    updateConversation(tempId, realConv);
                }
            } catch {
                // Failed to update conversation - ignore
            }
        };

        window.addEventListener('conversation-created', handleConversationCreated);

        return () => {
            window.removeEventListener('conversation-created', handleConversationCreated);
        };
    }, [updateConversation]);

    // Listen for chat requests from profile pages (for private chats)
    useEffect(() => {
        const handleStartChat = (event: Event) => {
            const customEvent = event as CustomEvent;
            const { userId, userName, userAvatar } = customEvent.detail;
            startChatWithUser(userId, userName, userAvatar);
        };

        window.addEventListener('start-chat', handleStartChat);

        return () => {
            window.removeEventListener('start-chat', handleStartChat);
        };
    }, [startChatWithUser]);

    // Listen for open-mini-chat events (for group chats from ChatDropdown)
    useEffect(() => {
        const handleOpenMiniChat = (event: Event) => {
            const customEvent = event as CustomEvent;
            const conversation = customEvent.detail as Conversation;

            // Check if this is AI conversation
            if (conversation.conversationId === AI_CONVERSATION_ID) {
                setShowAIChat(true);
            } else {
                openConversation(conversation);
            }
        };

        window.addEventListener('open-mini-chat', handleOpenMiniChat);

        return () => {
            window.removeEventListener('open-mini-chat', handleOpenMiniChat);
        };
    }, [openConversation]);

    // Listen for open-mini-ai-chat event (specifically for AI chat from header dropdown)
    useEffect(() => {
        const handleOpenMiniAIChat = () => {
            setShowAIChat(true);
        };

        window.addEventListener('open-mini-ai-chat', handleOpenMiniAIChat);

        return () => {
            window.removeEventListener('open-mini-ai-chat', handleOpenMiniAIChat);
        };
    }, []);

    return (
        <>
            {/* Friends List - Fixed on right side */}
            {showFriendsList && (
                <div className="fixed right-4 bottom-0 w-80 h-[600px] z-40">
                    <FriendsList onStartChat={startChatWithUser} />
                </div>
            )}

            {/* AI Chat Window */}
            {showAIChat && (
                <MiniAIChatWindow
                    onClose={() => setShowAIChat(false)}
                    position={openConversations.length + (showFriendsList ? 1 : 0)}
                />
            )}

            {/* Chat Windows - Stacked from right */}
            {openConversations.map((conversation, index) => (
                <MiniChatWindow
                    key={conversation.conversationId}
                    conversation={conversation}
                    onClose={() => closeConversation(conversation.conversationId)}
                    position={index + (showFriendsList ? 1 : 0)} // Offset if friends list is shown
                />
            ))}
        </>
    );
}
