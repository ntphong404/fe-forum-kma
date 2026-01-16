import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Bell, MessageSquare, Heart, AtSign, Megaphone, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationService } from './services/notification.service';
import type { Notification, NotificationType } from '@/interfaces/notification.types';
import { useAuthStore } from '@/store/useStore';
import { formatTimeAgo } from '@/lib/date.utils';
import { toast } from 'sonner';

interface NotificationsProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function Notifications({ isOpen: externalIsOpen, onOpenChange }: NotificationsProps = {}) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) onOpenChange(open);
    else setInternalIsOpen(open);
  };

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!user?.userId) return;

    setLoading(true);
    try {
      const response = await NotificationService.getNotifications(user.userId);
      setNotifications(response.data || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  // Fetch when panel opens
  useEffect(() => {
    if (isOpen && user?.userId) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications, user?.userId]);

  // Listen for real-time notifications via WebSocket
  useEffect(() => {
    const handleNewNotification = (event: CustomEvent) => {
      const notification = event.detail as Notification;

      setNotifications((prev) => {
        // Kiểm tra xem notification đã tồn tại hay chưa (cùng id)
        const existingIndex = prev.findIndex((n) => n.id === notification.id);

        if (existingIndex >= 0) {
          // Notification đã tồn tại - cập nhật và đưa lên đầu list (mới nhất)
          const existingNotif = prev[existingIndex];
          const updatedList = [...prev];
          updatedList.splice(existingIndex, 1); // Xóa notification cũ

          // Nếu notification cũ đã đọc và notification mới chưa đọc thì tăng unreadCount
          if (existingNotif.isRead && !notification.isRead) {
            setUnreadCount((count) => count + 1);
          }

          return [notification, ...updatedList]; // Thêm notification mới vào đầu
        }

        // Notification mới hoàn toàn - thêm vào đầu list và tăng unreadCount
        if (!notification.isRead) {
          setUnreadCount((count) => count + 1);
        }
        return [notification, ...prev];
      });
    };

    window.addEventListener('notification-received', handleNewNotification as EventListener);

    return () => {
      window.removeEventListener('notification-received', handleNewNotification as EventListener);
    };
  }, []);

  // Mark single notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    if (!user?.userId) return;

    try {
      await NotificationService.markAsRead(notificationId, user.userId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Dispatch event to sync with header
      window.dispatchEvent(new CustomEvent('notification-marked-read'));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (!user?.userId) return;

    setMarkingAllRead(true);
    try {
      await NotificationService.markAllAsRead(user.userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      // Dispatch event to sync with header
      window.dispatchEvent(new CustomEvent('notification-all-marked-read'));

      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Không thể đánh dấu đã đọc');
    } finally {
      setMarkingAllRead(false);
    }
  };

  // Handle notification click - navigate to the relevant page
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'POST':        // Bài đăng mới
      case 'LIKE_POST':   // Like bài đăng
      case 'LIKE_COMMENT':// Like comment
      case 'COMMENT':     // Comment mới
      case 'MENTION':     // Được mention
        // Ưu tiên postId, sau đó referenceId
        const postId = notification.postId || notification.referenceId;
        if (postId) {
          navigate(`/forum/post/${postId}`);
          handleOpenChange(false);
        }
        break;
      case 'CHAT':        // Tin nhắn chat
        navigate('/chat');
        handleOpenChange(false);
        break;
      case 'ADMIN':
        // Admin notifications - có thể navigate tới trang thông báo chi tiết
        break;
      default:
        break;
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'COMMENT':      // Comment mới
        return MessageSquare;
      case 'LIKE_POST':    // Like bài đăng
      case 'LIKE_COMMENT': // Like comment
        return Heart;
      case 'POST':         // Bài đăng mới
        return Bell;
      case 'CHAT':         // Tin nhắn chat
        return MessageSquare;
      case 'MENTION':      // Được mention
        return AtSign;
      case 'ADMIN':        // Thông báo admin
        return Megaphone;
      default:
        return Bell;
    }
  };

  // Get icon color based on notification type
  const getIconColor = (type: NotificationType) => {
    switch (type) {
      case 'COMMENT':      // Comment mới - màu xanh
        return 'from-blue-500 to-indigo-500';
      case 'LIKE_POST':    // Like bài đăng - màu hồng
      case 'LIKE_COMMENT': // Like comment - màu hồng
        return 'from-rose-500 to-pink-500';
      case 'POST':         // Bài đăng mới - màu xanh lá
        return 'from-green-500 to-emerald-500';
      case 'CHAT':         // Tin nhắn chat - màu tím
        return 'from-violet-500 to-purple-500';
      case 'MENTION':      // Được mention - màu cam
        return 'from-amber-500 to-orange-500';
      case 'ADMIN':        // Thông báo admin - màu xám
        return 'from-slate-600 to-slate-700';
      default:
        return 'from-slate-500 to-slate-600';
    }
  };

  return (
    <>
      {/* Notifications Panel (triggered from header bell) */}
      {isOpen && (
        <Card className="fixed top-16 right-4 w-[400px] h-[520px] z-50 shadow-2xl flex flex-col overflow-hidden border-0 bg-white rounded-2xl">
          {/* Header */}
          <div className="p-5 flex items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-600 border-b border-white/20">
            <div>
              <h3 className="font-bold text-xl text-white">Thông báo</h3>
              <p className="text-xs text-blue-100 mt-0.5">
                {unreadCount > 0 ? `${unreadCount} thông báo mới` : 'Tất cả đã đọc'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-white/20 rounded-xl"
              onClick={() => handleOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-white">
            <div className="p-2">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-slate-500 font-medium">Chưa có thông báo nào</p>
                  <p className="text-xs text-slate-400 mt-1">Thông báo sẽ xuất hiện ở đây</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  const iconColor = getIconColor(notification.type);

                  return (
                    <div
                      key={notification.id}
                      className={`rounded-xl mb-2 p-3 transition-all border cursor-pointer ${notification.isRead
                        ? 'bg-white border-transparent hover:border-slate-200 hover:shadow-sm'
                        : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm hover:shadow-md'
                        }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconColor} flex items-center justify-center flex-shrink-0 shadow-md`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className={`text-sm font-semibold ${notification.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                              {notification.title}
                            </p>
                            <span className="text-xs text-slate-400 flex-shrink-0">
                              {formatTimeAgo(notification.lastActivityAt || notification.createdAt)}
                            </span>
                          </div>
                          <p className={`text-xs ${notification.isRead ? 'text-slate-500' : 'text-slate-700'} leading-relaxed line-clamp-2`}>
                            {notification.content}
                          </p>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mt-2"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-200 bg-white">
              <Button
                variant="ghost"
                className="w-full font-semibold text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl gap-2"
                onClick={handleMarkAllAsRead}
                disabled={markingAllRead || unreadCount === 0}
              >
                {markingAllRead ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Đánh dấu tất cả là đã đọc
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>
      )}
    </>
  );
}
