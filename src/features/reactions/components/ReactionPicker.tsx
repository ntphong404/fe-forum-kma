import { ThumbsUp } from 'lucide-react';
import type { ReactionType } from '@/interfaces/post.types';

interface ReactionPickerProps {
    currentReaction?: ReactionType | null;
    reactionCount: number;
    onReact: (type: ReactionType) => void;
    disabled?: boolean;
    size?: 'sm' | 'md';
    showCount?: boolean;
    className?: string;
}

// Keep REACTIONS export for backward compatibility with PostStats and other components
export const REACTIONS: { type: ReactionType; emoji: string; label: string; color: string; hoverBg: string }[] = [
    { type: 'LIKE', emoji: '👍', label: 'Thích', color: 'text-blue-600', hoverBg: 'hover:bg-blue-50' },
];

export default function ReactionPicker({
    currentReaction,
    reactionCount,
    onReact,
    disabled = false,
    size = 'md',
    showCount = true,
    className = '',
}: ReactionPickerProps) {
    const isLiked = currentReaction === 'LIKE';

    const buttonPadding = size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5';
    const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
    const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

    const handleClick = () => {
        // Toggle like - send 'LIKE' to toggle on/off
        onReact('LIKE');
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled}
            className={`flex items-center gap-1.5 ${buttonPadding} transition-all duration-200 ${className || 'rounded-full'} ${isLiked
                ? 'text-blue-600 hover:bg-blue-50'
                : 'text-slate-500 hover:bg-slate-100'
                } disabled:opacity-50`}
        >
            <ThumbsUp className={`${iconSize} ${isLiked ? 'fill-blue-600' : ''}`} />
            <span className={`font-medium ${textSize}`}>Thích</span>
            {showCount && reactionCount > 0 && (
                <span className={`${textSize} font-semibold text-slate-600 ml-0.5`}>
                    {reactionCount}
                </span>
            )}
        </button>
    );
}
