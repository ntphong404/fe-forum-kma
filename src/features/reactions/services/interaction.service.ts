import { ApiService } from '@/api/api.service';
import type {
    Interaction,
    InteractionCount,
    CreateInteractionRequest,
} from '@/interfaces/post.types';

export class InteractionService {
    /**
     * Create or update interaction (reaction)
     * If user already has same reaction type → toggles it (removes)
     * If user has different reaction type → updates to new type
     */
    static async createOrUpdateInteraction(
        data: CreateInteractionRequest
    ): Promise<Interaction | null> {
        return ApiService.post<Interaction | null>('/interactions', data, true);
    }

    /**
     * Get interaction counts for a post or comment
     */
    static async getInteractionCount(
        postId: string,
        commentId?: string
    ): Promise<InteractionCount> {
        const queryParams = new URLSearchParams({ postId });
        if (commentId) queryParams.append('commentId', commentId);

        return ApiService.get<InteractionCount>(`/interactions/count?${queryParams}`, true);
    }

    /**
     * Get current user's reaction on a post or comment
     */
    static async getMyReaction(postId: string, commentId?: string): Promise<Interaction | null> {
        const queryParams = new URLSearchParams({ postId });
        if (commentId) queryParams.append('commentId', commentId);

        return ApiService.get<Interaction | null>(`/interactions/my-reaction?${queryParams}`, true);
    }

    /**
     * Remove user's reaction from a post or comment
     */
    static async removeInteraction(postId: string, commentId?: string): Promise<void> {
        const queryParams = new URLSearchParams({ postId });
        if (commentId) queryParams.append('commentId', commentId);

        return ApiService.delete<void>(`/interactions?${queryParams}`, true);
    }
}
