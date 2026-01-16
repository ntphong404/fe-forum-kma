import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import ChatDropdown from './ChatDropdown';
import { ChatService } from '../services/chat.service';
import { AuthService } from '../../auth/services/auth.service';
import { startChatWithUser } from '../utils/chatActions';
import { useAuthStore } from '@/store/useStore';
import type { Conversation } from '@/interfaces/chat.types';
import { AI_CONVERSATION_ID } from './ConversationList';

interface ChatHeaderIconProps {
  onOpenMiniChat?: (conversation: Conversation) => void;
}

export default function ChatHeaderIcon({ onOpenMiniChat: _onOpenMiniChat }: ChatHeaderIconProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const currentUser = useAuthStore((s) => s.user);

  // Load unread count when component mounts or user changes
  useEffect(() => {
    if (currentUser?.userId) {
      loadUnreadCount();
      // WebSocket handles real-time updates, no polling needed
    }
  }, [currentUser?.userId]);

  // Listen for WebSocket messages to update unread count in real-time
  useEffect(() => {
    const handleNewMessage = () => {
      // Reload unread count to get accurate count
      loadUnreadCount();
    };

    const handleMarkedRead = () => {
      // Reload unread count when a conversation is marked as read
      loadUnreadCount();
    };

    window.addEventListener('chat-message-received', handleNewMessage as EventListener);
    window.addEventListener('conversation-marked-read', handleMarkedRead as EventListener);

    return () => {
      window.removeEventListener('chat-message-received', handleNewMessage as EventListener);
      window.removeEventListener('conversation-marked-read', handleMarkedRead as EventListener);
    };
  }, []);

  const loadUnreadCount = async () => {
    try {
      const conversations = await ChatService.getConversations();
      // Count number of conversations with unread messages
      const userId = currentUser?.userId || '';
      const unreadConversations = conversations.filter((conv) => {
        return (conv.unreadCounts?.[userId] || 0) > 0;
      });
      setUnreadCount(unreadConversations.length);
    } catch {
      // Failed to load unread count - ignore
    }
  };

  const handleOpenFullChat = () => {
    setIsOpen(false);
    navigate('/chat');
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    setIsOpen(false);

    // Handle AI conversation - open MiniAIChatWindow
    if (conversation.conversationId === AI_CONVERSATION_ID) {
      window.dispatchEvent(new CustomEvent('open-mini-ai-chat'));
      return;
    }

    // Get partner user ID for private chats
    if (conversation.type === 'private') {
      // Calculate partnerId from participantIds if not provided
      const partnerId = conversation.partnerId ||
        conversation.participantIds?.find(id => id !== currentUser?.userId);

      if (partnerId) {
        try {
          const user = await AuthService.getUserById(partnerId);
          const displayName = `${user.lastName || ''} ${user.firstName || ''}`.trim() || user.username;
          startChatWithUser(partnerId, displayName, user.avatarUrl);
        } catch {
          // Fallback to just opening with ID
          startChatWithUser(partnerId, 'Người dùng');
        }
      } else {
        navigate('/chat');
      }
    } else if (conversation.type === 'group') {
      // For group chats, dispatch event to open mini chat window
      window.dispatchEvent(new CustomEvent('open-mini-chat', {
        detail: conversation
      }));
    } else {
      // Fallback to full chat page
      navigate('/chat');
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-red-50 rounded-xl transition-colors"
        >
          <MessageCircle className="w-5 h-5 text-gray-700" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-red-600 text-white text-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <ChatDropdown
          onOpenFullChat={handleOpenFullChat}
          onSelectConversation={handleSelectConversation}
          onRefresh={loadUnreadCount}
        />
      </PopoverContent>
    </Popover>
  );
}
