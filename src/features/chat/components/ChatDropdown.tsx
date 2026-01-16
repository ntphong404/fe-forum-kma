import { useState, useEffect } from 'react';
import { ChatService } from '../services/chat.service';
import { AuthService } from '../../auth/services/auth.service';
import { useAuthStore } from '@/store/useStore';
import type { Conversation } from '@/interfaces/chat.types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Users, ArrowRight } from 'lucide-react';
import AIAvatar from './AIAvatar';
import { AI_CONVERSATION_ID } from './ConversationList';
import { formatConversationTime } from '../utils/timeFormat';

interface ChatDropdownProps {
  onOpenFullChat: () => void;
  onSelectConversation: (conversation: Conversation) => void;
  onRefresh?: () => void;
}

export default function ChatDropdown({
  onOpenFullChat,
  onSelectConversation,
  onRefresh,
}: ChatDropdownProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});
  const [groupNames, setGroupNames] = useState<Record<string, string>>({});
  const [groupAvatars, setGroupAvatars] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const currentUser = useAuthStore((s) => s.user);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Listen for WebSocket messages to update conversation list in real-time
  useEffect(() => {
    const handleNewMessage = (event: CustomEvent) => {
      const data = event.detail;

      const messageConversationId = data.chatId || data.conversationId;

      // Update the conversation in the list
      setConversations((prev) => {
        const existingIndex = prev.findIndex(
          (c) => c.conversationId === messageConversationId
        );

        if (existingIndex >= 0) {
          // Update existing conversation
          const updated = [...prev];
          const conv = { ...updated[existingIndex] };
          conv.lastMessage = data.message;
          conv.lastMessageAt = data.sentAt || data.createdAt || new Date().toISOString();

          // Increment unread count if message is from someone else
          if (currentUser && data.senderId !== currentUser.userId) {
            conv.unreadCounts = {
              ...conv.unreadCounts,
              [currentUser.userId]: (conv.unreadCounts?.[currentUser.userId] || 0) + 1,
            };
          }

          // Remove from current position
          updated.splice(existingIndex, 1);
          // Add to the beginning (most recent)
          updated.unshift(conv);

          return updated.slice(0, 5); // Keep only first 5 conversations
        } else {
          // New conversation - reload the list
          loadConversations();
          return prev;
        }
      });
    };

    window.addEventListener('chat-message-received', handleNewMessage as EventListener);
    window.addEventListener('chat-message-sent', handleNewMessage as EventListener);

    return () => {
      window.removeEventListener('chat-message-received', handleNewMessage as EventListener);
      window.removeEventListener('chat-message-sent', handleNewMessage as EventListener);
    };
  }, [currentUser]);

  // Listen for conversation marked as read events
  useEffect(() => {
    const handleMarkedRead = (event: CustomEvent) => {
      const { conversationId, userId } = event.detail;

      setConversations((prev) => {
        return prev.map((conv) => {
          if (conv.conversationId === conversationId) {
            return {
              ...conv,
              unreadCounts: {
                ...conv.unreadCounts,
                [userId]: 0,
              },
            };
          }
          return conv;
        });
      });
    };

    window.addEventListener('conversation-marked-read', handleMarkedRead as EventListener);

    return () => {
      window.removeEventListener('conversation-marked-read', handleMarkedRead as EventListener);
    };
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await ChatService.getConversations();
      const list = data.slice(0, 5);
      setConversations(list);

      // Resolve participant names for private convos and group names
      if (currentUser) {
        const userIdsToFetch = new Set<string>();
        const groupIdsToFetch = new Set<string>();

        list.forEach((conv) => {
          if (conv.type === 'private' && conv.participantIds && conv.participantIds.length) {
            const other = conv.participantIds.find((p) => p !== currentUser.userId);
            if (other && !userNames[other]) userIdsToFetch.add(other);
          } else if (conv.type === 'group' && conv.groupId && !groupNames[conv.groupId]) {
            groupIdsToFetch.add(conv.groupId);
          }
        });

        // Fetch user names
        if (userIdsToFetch.size > 0) {
          const fetches = Array.from(userIdsToFetch).map(async (id) => {
            try {
              const u = await AuthService.getUserById(id);
              return {
                id,
                name: `${u.lastName || ''} ${u.firstName || u.username || ''}`.trim() || u.username || id,
                avatarUrl: u.avatarUrl || ''
              };
            } catch (err) {
              console.error('Failed to fetch user', id, err);
              return { id, name: id, avatarUrl: '' };
            }
          });

          const results = await Promise.all(fetches);
          setUserNames((prev) => {
            const next = { ...prev };
            results.forEach((r) => (next[r.id] = r.name));
            return next;
          });
          setUserAvatars((prev) => {
            const next = { ...prev };
            results.forEach((r) => (next[r.id] = r.avatarUrl));
            return next;
          });
        }

        // Fetch group names
        if (groupIdsToFetch.size > 0) {
          const groupFetches = Array.from(groupIdsToFetch).map(async (id) => {
            try {
              const group = await ChatService.getGroupById(id);
              return { id, name: group.name || 'Nhóm chat', avatarUrl: group.avatarUrl || '' };
            } catch (err) {
              console.error('Failed to fetch group', id, err);
              return { id, name: 'Nhóm chat', avatarUrl: '' };
            }
          });

          const groupResults = await Promise.all(groupFetches);
          setGroupNames((prev) => {
            const next = { ...prev };
            groupResults.forEach((r) => (next[r.id] = r.name));
            return next;
          });
          setGroupAvatars((prev) => {
            const next = { ...prev };
            groupResults.forEach((r) => (next[r.id] = r.avatarUrl));
            return next;
          });
        }
      }
      onRefresh?.();
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-200">
      {/* Header */}
      <div className="p-5 border-b border-slate-200/60 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
        <div>
          <h3 className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Tin nhắn</h3>
          <p className="text-xs text-slate-500 mt-0.5">{conversations.length} cuộc hội thoại</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onOpenFullChat();
          }}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-xl gap-1 font-medium"
        >
          Xem tất cả
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="h-[420px]">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center animate-pulse">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        ) : (
          <div className="p-2">
            {/* AI Assistant - Always First */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                onSelectConversation({
                  conversationId: AI_CONVERSATION_ID,
                  type: 'private',
                  participantIds: [],
                  unreadCounts: {}
                });
              }}
              className="p-3 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 cursor-pointer transition-all rounded-xl mb-1 border border-transparent hover:border-purple-200 hover:shadow-sm"
            >
              <div className="flex items-start gap-3">
                <AIAvatar size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm text-slate-900">Trợ lý AI</h4>
                    <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Online
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    Hỏi tôi bất cứ điều gì để được hỗ trợ tức thì
                  </p>
                </div>
              </div>
            </div>

            {/* Regular Conversations */}
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-3">
                  <MessageCircle className="w-7 h-7 text-blue-500" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Chưa có tin nhắn nào</p>
                <p className="text-xs text-slate-400 mt-1">Hãy bắt đầu trò chuyện!</p>
              </div>
            ) : (
              conversations.map((conversation) => {
                const unreadCount = currentUser && conversation.unreadCounts?.[currentUser.userId] || 0;
                const partnerId = conversation.participantIds?.find((p) => p !== currentUser?.userId) || '';

                return (
                  <div
                    key={conversation.conversationId}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectConversation(conversation);
                    }}
                    className="p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all rounded-xl mb-1 border border-transparent hover:border-blue-200 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20 overflow-hidden">
                          {conversation.type === 'group' ? (
                            conversation.groupId && groupAvatars[conversation.groupId] ? (
                              <img src={groupAvatars[conversation.groupId]} alt="Group" className="w-full h-full object-cover" />
                            ) : (
                              <Users className="w-6 h-6 text-white" />
                            )
                          ) : (
                            userAvatars[partnerId] ? (
                              <img src={userAvatars[partnerId]} alt="User" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-bold">
                                {(userNames[partnerId] || '?').charAt(0).toUpperCase()}
                              </span>
                            )
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-rose-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-red-500/40">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-sm truncate text-slate-900">
                            {conversation.type === 'private'
                              ? userNames[partnerId] || 'Người dùng'
                              : conversation.groupId ? (groupNames[conversation.groupId] || 'Nhóm chat') : 'Nhóm chat'}
                          </h4>
                          {conversation.lastMessageAt && (
                            <span className="text-xs text-slate-400 ml-2 flex-shrink-0">
                              {formatConversationTime(conversation.lastMessageAt)}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs truncate ${unreadCount > 0 ? 'text-slate-900 font-medium' : 'text-slate-500'
                          }`}>
                          {conversation.lastMessage || 'Chưa có tin nhắn'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
