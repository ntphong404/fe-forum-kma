import { useEffect, useState, useCallback } from 'react';
import { FriendshipService } from '@/features/friends/services/friendship.service';
import { FriendshipResponse } from '@/interfaces/friendship.types';

export interface FriendSuggestion {
  userId: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

/**
 * Hook to get friend suggestions using the new backend API
 * Instead of fetching all users and filtering on client-side,
 * this now uses the optimized /friends/suggestions endpoint
 */
export function useFriendSuggestions(limit: number = 5) {
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the new backend API for friend suggestions
      // This is much more efficient than fetching all users and filtering
      const suggestedUsers = await FriendshipService.getSuggestedUsers(limit);

      // Map FriendshipResponse to FriendSuggestion
      const suggestionList: FriendSuggestion[] = (suggestedUsers || []).map(
        (user: FriendshipResponse) => ({
          userId: user.userId,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
        })
      );

      setSuggestions(suggestionList);
    } catch (err: any) {
      console.error('[Gợi ý kết bạn] Error:', err);
      setError(err?.message || 'Lỗi khi lấy gợi ý kết bạn');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // Allow manual refresh of suggestions
  const refresh = useCallback(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  return { suggestions, loading, error, refresh };
}
