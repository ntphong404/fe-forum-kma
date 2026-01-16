import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Users, MessageCircle, ChevronRight, Loader2, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FriendshipResponse } from '@/interfaces/friendship.types';
import { FriendshipService } from '../services/friendship.service';
import { useFriendSuggestions } from '../hooks/useFriendSuggestions';
import { toast } from 'sonner';

interface FriendsSidebarProps {
  onStartChat?: (userId: string, username: string) => void;
}

export default function FriendsSidebar({ onStartChat: _onStartChat }: FriendsSidebarProps) {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<FriendshipResponse[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendshipResponse[]>([]);
  // Sử dụng hook lấy gợi ý kết bạn với chức năng refresh
  const { suggestions: suggestedUsers, loading: loadingSuggestions, error: errorSuggestions, refresh: refreshSuggestions } = useFriendSuggestions();
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [friendsData, requestsData] = await Promise.all([
        FriendshipService.getFriends(),
        FriendshipService.getReceivedRequests(),
      ]);
      setFriends(friendsData?.slice(0, 5) || []);
      setReceivedRequests(requestsData?.slice(0, 3) || []);
    } catch (error) {
      console.error('Failed to load friends data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (request: FriendshipResponse) => {
    try {
      setProcessingIds((prev) => new Set(prev).add(request.id));
      await FriendshipService.acceptFriendRequest(request.id);
      toast.success(`Đã chấp nhận lời mời từ ${request.username}`);
      setReceivedRequests((prev) => prev.filter((r) => r.id !== request.id));
      // Reload friends list
      const friendsData = await FriendshipService.getFriends();
      setFriends(friendsData?.slice(0, 5) || []);
    } catch (error: any) {
      toast.error(error.message || 'Không thể chấp nhận lời mời');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(request.id);
        return next;
      });
    }
  };

  const handleReject = async (request: FriendshipResponse) => {
    try {
      setProcessingIds((prev) => new Set(prev).add(request.id));
      await FriendshipService.rejectFriendRequest(request.id);
      toast.success('Đã từ chối lời mời');
      setReceivedRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (error: any) {
      toast.error(error.message || 'Không thể từ chối lời mời');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(request.id);
        return next;
      });
    }
  };

  const handleSendRequest = async (user: any) => {
    try {
      setProcessingIds((prev) => new Set(prev).add(user.userId));
      await FriendshipService.sendFriendRequest(user.userId);
      toast.success(`Đã gửi lời mời kết bạn tới ${user.username}`);
      // Refresh danh sách gợi ý sau khi gửi lời mời thành công
      refreshSuggestions();
    } catch (error: any) {
      toast.error(error.message || 'Không thể gửi lời mời kết bạn');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(user.userId);
        return next;
      });
    }
  };

  // Hỗ trợ FriendSuggestion (firstName/lastName có thể undefined)
  const getInitials = (item: { username: string; firstName?: string; lastName?: string }) => {
    if (item.lastName && item.firstName) {
      return `${item.lastName[0]}${item.firstName[0]}`.toUpperCase();
    }
    return item.username.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (item: { username: string; firstName?: string; lastName?: string }) => {
    if (item.lastName && item.firstName) {
      return `${item.lastName} ${item.firstName}`;
    }
    return item.username;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Friend Requests - Always visible */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900">Lời mời kết bạn</h3>
          </div>
          {receivedRequests.length > 0 && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
              {receivedRequests.length}
            </span>
          )}
        </div>

        {receivedRequests.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-slate-500">Không có lời mời kết bạn</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {receivedRequests.map((request) => {
                const isProcessing = processingIds.has(request.id);
                return (
                  <div key={request.id} className="flex items-center gap-3">
                    <Link to={`/profile/${request.userId}`}>
                      <Avatar className="h-10 w-10 flex-shrink-0 hover:ring-2 hover:ring-blue-300 transition-all">
                        <AvatarImage src={request.avatarUrl} alt={request.username} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-xs">
                          {getInitials(request)}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <Link to={`/profile/${request.userId}`} className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate hover:text-blue-600 transition-colors">
                        {getDisplayName(request)}
                      </p>
                      <p className="text-xs text-slate-500 truncate">@{request.username}</p>
                    </Link>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        className="h-7 px-2 bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleAccept(request)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <UserCheck className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2"
                        onClick={() => handleReject(request)}
                        disabled={isProcessing}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link to="/friends" className="flex items-center justify-center gap-1 mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
              Xem tất cả
              <ChevronRight className="w-4 h-4" />
            </Link>
          </>
        )}
      </div>

      {/* Friends List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900">Bạn bè</h3>
          </div>
          {friends.length > 0 && (
            <span className="text-xs text-slate-500">{friends.length} người</span>
          )}
        </div>

        {friends.length === 0 ? (
          <div className="text-center py-4 text-sm text-slate-500">
            Bạn chưa có bạn bè nào
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all group"
              >
                <Link to={`/profile/${friend.userId}`}>
                  <Avatar className="h-9 w-9 hover:ring-2 hover:ring-blue-300 transition-all">
                    <AvatarImage src={friend.avatarUrl} alt={friend.username} />
                    <AvatarFallback className="bg-gradient-to-br from-green-400 to-emerald-500 text-white text-xs">
                      {getInitials(friend)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <Link to={`/profile/${friend.userId}`} className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate hover:text-blue-600 transition-colors">
                    {getDisplayName(friend)}
                  </p>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('start-chat', {
                      detail: {
                        userId: friend.userId,
                        userName: getDisplayName(friend),
                        userAvatar: friend.avatarUrl
                      }
                    }));
                  }}
                >
                  <MessageCircle className="w-4 h-4 text-slate-500" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Link to="/friends" className="flex items-center justify-center gap-1 mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
          Xem tất cả bạn bè
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Friend Suggestions */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/25">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Gợi ý kết bạn
        </h3>
        {loadingSuggestions ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          </div>
        ) : errorSuggestions ? (
          <p className="text-sm text-red-100 text-center py-2">{errorSuggestions}</p>
        ) : suggestedUsers.length === 0 ? (
          <p className="text-sm text-blue-100 text-center py-2">
            Không có gợi ý nào
          </p>
        ) : (
          <div className="space-y-3">
            {suggestedUsers.map((user) => {
              const isProcessing = processingIds.has(user.userId);
              return (
                <div key={user.userId} className="flex items-center gap-3">
                  <Avatar
                    className="h-9 w-9 border-2 border-white/30 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate(`/profile/${user.userId}`)}
                  >
                    <AvatarImage src={user.avatarUrl} alt={user.username} />
                    <AvatarFallback className="bg-white/20 text-white text-xs">
                      {getInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className="flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate(`/profile/${user.userId}`)}>

                    <p className="text-sm font-medium text-white truncate">
                      {getDisplayName(user)}
                    </p>
                    <p className="text-xs text-blue-100 truncate">
                      @{user.username}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 px-2 bg-white/20 hover:bg-white/30 text-white border-0"
                    onClick={() => handleSendRequest(user)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <UserPlus className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Links */}
      <div className="text-xs text-slate-500 space-y-1 px-2">
        <div className="flex flex-wrap gap-2">
          <button className="hover:underline">Về chúng tôi</button>
          <span>•</span>
          <button className="hover:underline">Điều khoản</button>
          <span>•</span>
          <button className="hover:underline">Chính sách</button>
        </div>
        <p>© 2025 Forum KMA</p>
      </div>
    </div>
  );
}
