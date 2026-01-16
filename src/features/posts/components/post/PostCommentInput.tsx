import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';

interface PostCommentInputProps {
    userAvatarUrl?: string;
    userInitials: string;
    onSubmit: (content: string) => Promise<void>;
    placeholder?: string;
    disabled?: boolean;
}

export default function PostCommentInput({
    userAvatarUrl,
    userInitials,
    onSubmit,
    placeholder = 'Tham gia thảo luận...',
    disabled = false,
}: PostCommentInputProps) {
    const [commentText, setCommentText] = useState('');
    const [sending, setSending] = useState(false);

    const handleSubmit = async () => {
        if (!commentText.trim() || sending) return;

        setSending(true);
        try {
            await onSubmit(commentText.trim());
            setCommentText('');
        } catch (err) {
            // Error handled by parent
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50">
            <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={userAvatarUrl} alt="User" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs font-medium">
                        {userInitials}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex items-center gap-2 bg-white rounded-full px-4 py-2 border border-slate-200 hover:border-slate-300 focus-within:border-blue-400 transition-colors">
                    <input
                        type="text"
                        placeholder={placeholder}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={disabled || sending}
                        className="flex-1 text-sm outline-none bg-transparent placeholder:text-slate-400"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={!commentText.trim() || sending}
                        className="text-blue-500 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors p-1"
                        type="button"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
