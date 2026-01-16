import { useState, useEffect } from 'react';
import { ChatService } from '../services/chat.service';
import { AuthService } from '../../auth/services/auth.service';
import type { Conversation } from '@/interfaces/chat.types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Users, Plus, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/useStore';
import AIAvatar from './AIAvatar';
import { formatConversationTime } from '../utils/timeFormat';

// Special constant for AI conversation
export const AI_CONVERSATION_ID = 'ai-assistant';

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
  onCreateGroup?: () => void;
}

export default function ConversationList({
  onSelectConversation,
  selectedConversationId,
  onCreateGroup,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});
  const [groupNames, setGroupNames] = useState<Record<string, string>>({});
  const [groupAvatars, setGroupAvatars] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUser = useAuthStore((s) => s.user);

  useEffect(() => {
    loadConversations();
  }, []);

  // Listen for WebSocket messages to update conversation list in real-time
  useEffect(() => {
    const handleChatMessage = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;

      // Update the conversation in the list
      if (data.chatId) {
        setConversations((prev) => {
          return prev.map((conv) => {
            if (conv.conversationId === data.chatId) {
              // Update lastMessage and lastMessageAt
              const updated = { ...conv };
              updated.lastMessage = data.message;
              updated.lastMessageAt = data.sentAt;

              // Increment unread count for current user if not the sender
              if (currentUser && data.senderId !== currentUser.userId) {
                updated.unreadCounts = {
                  ...updated.unreadCounts,
                  [currentUser.userId]: (updated.unreadCounts?.[currentUser.userId] || 0) + 1
                };
              }

              return updated;
            }
            return conv;
          }).sort((a, b) => {
            // Sort by lastMessageAt descending (newest first)
            const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return timeB - timeA;
          });
        });
      }
    };

    // Handle message deleted event - update lastMessage to "Tin nhắn đã bị xóa"
    // Only update sidebar if the deleted message is the latest message (isLatest !== false)
    const handleMessageDeleted = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;
      const convId = data.conversationId || data.chatId;

      // If isLatest is explicitly false, don't update the sidebar
      // This means the deleted message is not the latest message in conversation
      if (data.isLatest === false) {
        console.log('[ConversationList] Skipping sidebar update - deleted message is not the latest');
        return;
      }

      if (convId) {
        setConversations((prev) => {
          return prev.map((conv) => {
            if (conv.conversationId === convId) {
              // Update lastMessage to show deleted message text
              return { ...conv, lastMessage: 'Tin nhắn đã bị xóa' };
            }
            return conv;
          });
        });
      }
    };

    window.addEventListener('chat-message-received', handleChatMessage as EventListener);
    window.addEventListener('chat-message-sent', handleChatMessage as EventListener);
    window.addEventListener('chat-message-deleted', handleMessageDeleted as EventListener);

    return () => {
      window.removeEventListener('chat-message-received', handleChatMessage as EventListener);
      window.removeEventListener('chat-message-sent', handleChatMessage as EventListener);
      window.removeEventListener('chat-message-deleted', handleMessageDeleted as EventListener);
    };
  }, [currentUser]);

  // Listen for conversation marked as read events
  useEffect(() => {
    const handleConversationRead = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { conversationId, userId } = customEvent.detail;

      setConversations((prev) => {
        return prev.map((conv) => {
          if (conv.conversationId === conversationId) {
            const updated = { ...conv };
            // Reset unread count for this user
            updated.unreadCounts = {
              ...updated.unreadCounts,
              [userId]: 0
            };
            return updated;
          }
          return conv;
        });
      });
    };

    window.addEventListener('conversation-marked-read', handleConversationRead as EventListener);

    return () => {
      window.removeEventListener('conversation-marked-read', handleConversationRead as EventListener);
    };
  }, []);

  // Auto-update selected conversation when list changes
  useEffect(() => {
    if (selectedConversationId) {
      const updated = conversations.find(c => c.conversationId === selectedConversationId);
      if (updated) {
        // Dispatch event to update ChatPage's selectedConversation
        window.dispatchEvent(new CustomEvent('conversation-updated', {
          detail: updated
        }));
      }
    }
  }, [conversations, selectedConversationId]);


  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ChatService.getConversations();
      setConversations(data);

      // Resolve participant names for private conversations
      if (currentUser) {
        const userIdsToFetch = new Set<string>();
        const groupIdsToFetch = new Set<string>();

        data.forEach((conv) => {
          if (conv.type === 'private' && conv.participantIds && Array.isArray(conv.participantIds) && conv.participantIds.length) {
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
                name: `${u.firstName || u.username || ''} ${u.lastName || ''}`.trim() || u.username || id,
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
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
      setError(err.message || 'Không thể tải danh sách hội thoại');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="h-full p-4 border-0 rounded-none">
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div className="text-slate-500">Đang tải...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full p-4 border-0 rounded-none">
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="text-red-500">{error}</div>
          <Button onClick={loadConversations} variant="outline" className="rounded-xl">Thử lại</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col border-0 rounded-none bg-transparent">
      <div className="p-5 border-b border-slate-200/60 flex items-center justify-between backdrop-blur-sm">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Tin nhắn</h2>
          <p className="text-xs text-slate-500 mt-0.5">{conversations.length} cuộc hội thoại</p>
        </div>
        <div className="flex gap-2">
          {onCreateGroup && (
            <Button
              size="sm"
              onClick={onCreateGroup}
              className="gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          {/* AI Assistant - Always at the top */}
          <div
            onClick={() => onSelectConversation({
              conversationId: AI_CONVERSATION_ID,
              type: 'private',
              participantIds: [],
              unreadCounts: {}
            })}
            className={`p-3 cursor-pointer rounded-2xl mb-3 transition-all border ${selectedConversationId === AI_CONVERSATION_ID
              ? 'bg-gradient-to-r from-violet-50 to-purple-50 border-purple-300 shadow-md shadow-purple-500/10'
              : 'hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-purple-50/50 border-transparent hover:shadow-md hover:border-purple-200'
              }`}
          >
            <div className="flex items-start gap-3">
              <AIAvatar size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base text-slate-900">Trợ lý AI KMA</h3>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-full flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      AI
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-500 truncate">
                  Hỏi đáp về học tập, lịch thi, điểm số...
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          {conversations.length > 0 && (
            <div className="flex items-center gap-2 mb-3 px-2">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400">Tin nhắn</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          )}

          {/* Regular conversations */}
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-slate-500">Chưa có cuộc hội thoại nào</p>
            </div>
          ) : (
            <>
              {conversations.map((conversation) => {
                const unreadCount = currentUser && conversation.unreadCounts?.[currentUser.userId] || 0;
                const partnerId = conversation.participantIds?.find((p) => p !== currentUser?.userId) || '';

                return (
                  <div
                    key={conversation.conversationId}
                    onClick={() => onSelectConversation(conversation)}
                    className={`p-3 cursor-pointer rounded-2xl mb-2 transition-all border ${selectedConversationId === conversation.conversationId
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-md shadow-blue-500/10'
                      : 'hover:bg-white border-transparent hover:shadow-md hover:border-slate-200'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25 overflow-hidden">
                          {conversation.type === 'group' ? (
                            conversation.groupId && groupAvatars[conversation.groupId] ? (
                              <img src={groupAvatars[conversation.groupId]} alt="Group" className="w-full h-full object-cover" />
                            ) : (
                              <Users className="w-7 h-7 text-white" />
                            )
                          ) : (
                            userAvatars[partnerId] ? (
                              <img src={userAvatars[partnerId]} alt="User" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white text-xl font-bold">
                                {(userNames[partnerId] || '?').charAt(0).toUpperCase()}
                              </span>
                            )
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-red-500 to-rose-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-red-500/40">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-base truncate text-slate-900">
                            {conversation.type === 'private'
                              ? userNames[partnerId] || 'Người dùng'
                              : conversation.groupId ? (groupNames[conversation.groupId] || 'Nhóm chat') : 'Nhóm chat'}
                          </h3>
                          {conversation.lastMessageAt && (
                            <span className="text-xs text-slate-400 ml-2 flex-shrink-0">
                              {formatConversationTime(conversation.lastMessageAt)}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm truncate ${unreadCount > 0 ? 'text-slate-900 font-medium' : 'text-slate-500'
                          }`}>
                          {conversation.lastMessage || 'Chưa có tin nhắn'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
