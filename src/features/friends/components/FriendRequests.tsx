import { useEffect, useState } from 'react';
import { Check, X, Inbox, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FriendshipResponse } from '@/interfaces/friendship.types';
import { FriendshipService } from '../services/friendship.service';
import { toast } from 'sonner';

interface FriendRequestsProps {
  onRequestHandled?: () => void;
}

export default function FriendRequests({ onRequestHandled }: FriendRequestsProps) {
  const [receivedRequests, setReceivedRequests] = useState<FriendshipResponse[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendshipResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [activeSection, setActiveSection] = useState<'received' | 'sent'>('received');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const [received, sent] = await Promise.all([
        FriendshipService.getReceivedRequests(),
        FriendshipService.getSentRequests(),
      ]);
      setReceivedRequests(received || []);
      setSentRequests(sent || []);
    } catch (error: any) {
      toast.error(error.message || 'Không thể tải lời mời kết bạn');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (request: FriendshipResponse) => {
    try {
      setProcessingIds((prev) => new Set(prev).add(request.id));
      await FriendshipService.acceptFriendRequest(request.id);
      toast.success(`Đã chấp nhận lời mời kết bạn từ ${request.username}`);
      setReceivedRequests((prev) => prev.filter((r) => r.id !== request.id));
      onRequestHandled?.();
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
      toast.success('Đã từ chối lời mời kết bạn');
      setReceivedRequests((prev) => prev.filter((r) => r.id !== request.id));
      onRequestHandled?.();
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

  const handleCancelRequest = async (request: FriendshipResponse) => {
    try {
      setProcessingIds((prev) => new Set(prev).add(request.id));
      // Use cancelFriendRequest with friendshipId (request.id) instead of unfriend
      await FriendshipService.cancelFriendRequest(request.id);
      toast.success('Đã hủy lời mời kết bạn');
      setSentRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (error: any) {
      toast.error(error.message || 'Không thể hủy lời mời');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(request.id);
        return next;
      });
    }
  };

  const getInitials = (request: FriendshipResponse) => {
    if (request.lastName && request.firstName) {
      return `${request.lastName[0]}${request.firstName[0]}`.toUpperCase();
    }
    return request.username.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (request: FriendshipResponse) => {
    if (request.lastName && request.firstName) {
      return `${request.lastName} ${request.firstName}`;
    }
    return request.username;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
        <p className="mt-4 text-slate-500">Đang tải...</p>
      </div>
    );
  }

  const currentRequests = activeSection === 'received' ? receivedRequests : sentRequests;

  return (
    <div className="space-y-6">
      {/* Section Toggle */}
      <div className="flex gap-3">
        <button
          onClick={() => setActiveSection('received')}
          className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 ${activeSection === 'received'
            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg shadow-blue-500/10'
            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeSection === 'received'
            ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
            : 'bg-slate-100'
            }`}>
            <ArrowDownLeft className={`h-5 w-5 ${activeSection === 'received' ? 'text-white' : 'text-slate-500'}`} />
          </div>
          <div className="text-left">
            <p className={`font-semibold ${activeSection === 'received' ? 'text-blue-700' : 'text-slate-700'}`}>
              Đã nhận
            </p>
            <p className={`text-sm ${activeSection === 'received' ? 'text-blue-500' : 'text-slate-500'}`}>
              {receivedRequests.length} lời mời
            </p>
          </div>
        </button>

        <button
          onClick={() => setActiveSection('sent')}
          className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 ${activeSection === 'sent'
            ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg shadow-orange-500/10'
            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeSection === 'sent'
            ? 'bg-gradient-to-br from-orange-500 to-red-500'
            : 'bg-slate-100'
            }`}>
            <ArrowUpRight className={`h-5 w-5 ${activeSection === 'sent' ? 'text-white' : 'text-slate-500'}`} />
          </div>
          <div className="text-left">
            <p className={`font-semibold ${activeSection === 'sent' ? 'text-orange-700' : 'text-slate-700'}`}>
              Đã gửi
            </p>
            <p className={`text-sm ${activeSection === 'sent' ? 'text-orange-500' : 'text-slate-500'}`}>
              {sentRequests.length} lời mời
            </p>
          </div>
        </button>
      </div>

      {/* Content */}
      {currentRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4">
            <Inbox className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            {activeSection === 'received' ? 'Không có lời mời nào' : 'Chưa gửi lời mời nào'}
          </h3>
          <p className="text-slate-500 max-w-sm">
            {activeSection === 'received'
              ? 'Bạn chưa nhận được lời mời kết bạn nào. Hãy chia sẻ trang của bạn để mọi người có thể kết nối!'
              : 'Bạn chưa gửi lời mời kết bạn nào. Hãy tìm kiếm và kết nối với những người dùng khác!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {currentRequests.map((request) => {
            const isProcessing = processingIds.has(request.id);

            return (
              <div
                key={request.id}
                className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <Link to={`/profile/${request.userId}`}>
                    <Avatar className="h-14 w-14 ring-4 ring-white shadow-md hover:ring-blue-200 transition-all">
                      <AvatarImage src={request.avatarUrl} alt={request.username} />
                      <AvatarFallback className={`text-white font-semibold ${activeSection === 'received'
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        : 'bg-gradient-to-br from-orange-500 to-red-500'
                        }`}>
                        {getInitials(request)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/profile/${request.userId}`} className="hover:text-blue-600 transition-colors">
                      <h3 className="font-semibold text-slate-900 truncate">{getDisplayName(request)}</h3>
                      <p className="text-sm text-slate-500 truncate">@{request.username}</p>
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  {activeSection === 'received' ? (
                    <>
                      <Button
                        onClick={() => handleAccept(request)}
                        disabled={isProcessing}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl h-10"
                      >
                        {isProcessing ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Chấp nhận
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleReject(request)}
                        disabled={isProcessing}
                        className="flex-1 rounded-xl h-10 border-slate-200 hover:bg-slate-100"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Từ chối
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => handleCancelRequest(request)}
                      disabled={isProcessing}
                      className="w-full rounded-xl h-10 border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                    >
                      {isProcessing ? (
                        <div className="w-4 h-4 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          Hủy lời mời
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
