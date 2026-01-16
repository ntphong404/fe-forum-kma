import { useState, useEffect } from 'react';
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
import { useAuthStore } from '@/store/useStore';
import type { Conversation } from '@/interfaces/chat.types';

interface ChatIconButtonProps {
  onOpenFullChat: () => void;
  onOpenMiniChat: (conversation: Conversation) => void;
}

export default function ChatIconButton({ onOpenFullChat, onOpenMiniChat }: ChatIconButtonProps) {
  const currentUser = useAuthStore((s) => s.user);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
    // WebSocket handles real-time updates, no polling needed
  }, []);

  // Listen for WebSocket messages to update unread count in real-time
  useEffect(() => {
    const handleNewMessage = () => {
      // Increment unread count when receiving message from others
      setUnreadCount((prev) => prev + 1);
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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <MessageCircle className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <ChatDropdown
          onOpenFullChat={() => {
            setIsOpen(false);
            onOpenFullChat();
          }}
          onSelectConversation={(conv) => {
            setIsOpen(false);
            onOpenMiniChat(conv);
          }}
          onRefresh={loadUnreadCount}
        />
      </PopoverContent>
    </Popover>
  );
}
