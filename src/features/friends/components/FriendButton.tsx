import { useEffect, useState } from 'react';
import { UserPlus, UserMinus, Clock, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FriendshipStatus, FriendshipStatusResponse } from '@/interfaces/friendship.types';
import { FriendshipService } from '../services/friendship.service';
import { toast } from 'sonner';

interface FriendButtonProps {
  userId: string;
  onStatusChange?: (status: FriendshipStatus) => void;
  size?: 'sm' | 'default' | 'lg';
}

export default function FriendButton({ userId, onStatusChange, size = 'default' }: FriendButtonProps) {
  const [status, setStatus] = useState<FriendshipStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkStatus();
  }, [userId]);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const data = await FriendshipService.checkFriendshipStatus(userId);
      setStatus(data);
    } catch (error: any) {
      console.error('Failed to check friendship status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    try {
      setProcessing(true);
      await FriendshipService.sendFriendRequest(userId);
      toast.success('Đã gửi lời mời kết bạn');
      setStatus((prev) =>
        prev
          ? { ...prev, status: FriendshipStatus.PENDING_SENT, isRequester: true }
          : null
      );
      onStatusChange?.(FriendshipStatus.PENDING_SENT);
    } catch (error: any) {
      toast.error(error.message || 'Không thể gửi lời mời kết bạn');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!status?.friendshipId) return;
    try {
      setProcessing(true);
      await FriendshipService.cancelFriendRequest(status.friendshipId);
      toast.success('Đã hủy lời mời kết bạn');
      setStatus((prev) =>
        prev ? { ...prev, status: FriendshipStatus.NOT_FRIENDS, friendshipId: undefined } : null
      );
      onStatusChange?.(FriendshipStatus.NOT_FRIENDS);
    } catch (error: any) {
      toast.error(error.message || 'Không thể hủy lời mời');
    } finally {
      setProcessing(false);
    }
  };

  const handleAccept = async () => {
    if (!status?.friendshipId) return;
    try {
      setProcessing(true);
      await FriendshipService.acceptFriendRequest(status.friendshipId);
      toast.success('Đã chấp nhận lời mời kết bạn');
      setStatus((prev) =>
        prev ? { ...prev, status: FriendshipStatus.FRIENDS } : null
      );
      onStatusChange?.(FriendshipStatus.FRIENDS);
    } catch (error: any) {
      toast.error(error.message || 'Không thể chấp nhận lời mời');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!status?.friendshipId) return;
    try {
      setProcessing(true);
      await FriendshipService.rejectFriendRequest(status.friendshipId);
      toast.success('Đã từ chối lời mời kết bạn');
      setStatus((prev) =>
        prev ? { ...prev, status: FriendshipStatus.NOT_FRIENDS, friendshipId: undefined } : null
      );
      onStatusChange?.(FriendshipStatus.NOT_FRIENDS);
    } catch (error: any) {
      toast.error(error.message || 'Không thể từ chối lời mời');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnfriend = async () => {
    try {
      setProcessing(true);
      await FriendshipService.unfriend(userId);
      toast.success('Đã hủy kết bạn');
      setStatus((prev) =>
        prev ? { ...prev, status: FriendshipStatus.NOT_FRIENDS, friendshipId: undefined } : null
      );
      onStatusChange?.(FriendshipStatus.NOT_FRIENDS);
    } catch (error: any) {
      toast.error(error.message || 'Không thể hủy kết bạn');
    } finally {
      setProcessing(false);
    }
  };



  if (loading) {
    return (
      <Button variant="outline" size={size} disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (!status) return null;

  const isProcessing = processing;

  // Blocked status - show nothing
  if (status.status === FriendshipStatus.BLOCKED_BY_THEM || status.status === FriendshipStatus.BLOCKED_BY_ME) {
    return null;
  }

  // Not friends - show add friend button
  if (status.status === FriendshipStatus.NOT_FRIENDS) {
    return (
      <Button
        size={size}
        onClick={handleSendRequest}
        disabled={isProcessing}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <UserPlus className="h-4 w-4 mr-1" />
        )}
        Kết bạn
      </Button>
    );
  }

  // Pending sent - show cancel button
  if (status.status === FriendshipStatus.PENDING_SENT) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={handleCancelRequest}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <Clock className="h-4 w-4 mr-1" />
        )}
        Đã gửi lời mời
      </Button>
    );
  }

  // Pending received - show accept/reject buttons
  if (status.status === FriendshipStatus.PENDING_RECEIVED) {
    return (
      <div className="flex items-center gap-2">
        <Button
          size={size}
          onClick={handleAccept}
          disabled={isProcessing}
          className="bg-green-600 hover:bg-green-700"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Check className="h-4 w-4 mr-1" />
          )}
          Chấp nhận
        </Button>
        <Button
          variant="outline"
          size={size}
          onClick={handleReject}
          disabled={isProcessing}
        >
          <X className="h-4 w-4 mr-1" />
          Từ chối
        </Button>
      </div>
    );
  }

  // Friends - show dropdown with unfriend/block options
  if (status.status === FriendshipStatus.FRIENDS) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={size} disabled={isProcessing}>
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Check className="h-4 w-4 mr-1" />
            )}
            Bạn bè
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-white shadow-lg border-slate-200">
          <DropdownMenuItem
            onClick={handleUnfriend}
            className="text-orange-600 focus:text-orange-600 focus:bg-orange-50 cursor-pointer"
          >
            <UserMinus className="h-4 w-4 mr-2" />
            Hủy kết bạn
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return null;
}
