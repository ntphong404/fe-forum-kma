import { useState, useEffect, useCallback } from 'react';
import { InteractionService } from '@/features/reactions/services/interaction.service';
import type { ReactionType } from '@/interfaces/post.types';
import type { User } from '@/interfaces/auth.types';

interface UseReactionParams {
    postId: string;
    commentId?: string;
    initialReaction?: ReactionType | null;
    initialCount: number;
    currentUser?: User | null;
    onReactionChange?: (
        id: string,
        newCount: number,
        myReaction: ReactionType | null
    ) => void;
}

interface UseReactionReturn {
    currentReaction: ReactionType | null;
    reactionCount: number;
    isReacting: boolean;
    handleReaction: (type: ReactionType) => Promise<void>;
}

/**
 * Custom hook để xử lý logic reaction (like, love, haha, etc.)
 * Bao gồm cả post reactions và comment reactions
 */
export function useReaction({
    postId,
    commentId,
    initialReaction,
    initialCount,
    currentUser,
    onReactionChange,
}: UseReactionParams): UseReactionReturn {
    const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(
        initialReaction || null
    );
    const [reactionCount, setReactionCount] = useState<number>(initialCount);
    const [isReacting, setIsReacting] = useState<boolean>(false);

    // Sync state khi props thay đổi
    useEffect(() => {
        setCurrentReaction(initialReaction || null);
        setReactionCount(initialCount);
    }, [initialReaction, initialCount]);

    const handleReaction = useCallback(
        async (type: ReactionType) => {
            if (isReacting) return;
            setIsReacting(true);

            try {
                const senderName = currentUser 
                    ? `${currentUser.lastName || ''} ${currentUser.firstName || ''}`.trim() || currentUser.username
                    : 'Unknown';

                await InteractionService.createOrUpdateInteraction({
                    postId,
                    commentId,
                    type,
                    senderName,
                });

                const isToggle = currentReaction === type;
                const entityId = commentId || postId;

                if (isToggle) {
                    // Removing reaction (toggle off)
                    const newCount = Math.max(0, reactionCount - 1);
                    setCurrentReaction(null);
                    setReactionCount(newCount);
                    onReactionChange?.(entityId, newCount, null);
                } else {
                    // Adding or changing reaction
                    let newCount = reactionCount;
                    if (currentReaction === null) {
                        // Adding new reaction
                        newCount = reactionCount + 1;
                    }
                    // If changing reaction type, count stays the same
                    setCurrentReaction(type);
                    setReactionCount(newCount);
                    onReactionChange?.(entityId, newCount, type);
                }
            } catch (err) {
                console.error('Failed to react:', err);
            } finally {
                setIsReacting(false);
            }
        },
        [postId, commentId, currentReaction, reactionCount, isReacting, currentUser, onReactionChange]
    );

    return {
        currentReaction,
        reactionCount,
        isReacting,
        handleReaction,
    };
}

export default useReaction;
