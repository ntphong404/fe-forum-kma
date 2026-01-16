import { ThumbsUp } from 'lucide-react';
import type { ReactionType } from '@/interfaces/post.types';

interface PostStatsProps {
    reactionCount: number;
    commentCount: number;
    currentReaction: ReactionType | null;
    onCommentClick?: () => void;
}

export default function PostStats({
    reactionCount,
    commentCount,
    currentReaction,
    onCommentClick,
}: PostStatsProps) {
    const isLiked = currentReaction === 'LIKE';

    return (
        <div className="flex items-center justify-between text-sm text-slate-500 py-2 border-t border-slate-100 mt-2">
            {reactionCount > 0 ? (
                <div className="flex items-center gap-1.5">
                    <div className="bg-blue-500 rounded-full p-1">
                        <ThumbsUp className="w-3 h-3 text-white fill-white" />
                    </div>
                    {isLiked ? (
                        <>
                            {reactionCount > 1 ? (
                                <span className="hover:underline cursor-pointer">Bạn và {reactionCount - 1} người khác</span>
                            ) : (
                                <span className="hover:underline cursor-pointer">Bạn</span>
                            )}
                        </>
                    ) : (
                        <span className="hover:underline cursor-pointer">{reactionCount}</span>
                    )}
                </div>
            ) : (
                <div /> // Spacer if no likes
            )}

            {commentCount > 0 && (
                <div
                    className="hover:underline cursor-pointer"
                    onClick={onCommentClick}
                >
                    {commentCount} bình luận
                </div>
            )}
        </div>
    );
}

