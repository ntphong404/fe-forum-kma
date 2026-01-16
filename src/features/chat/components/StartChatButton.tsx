import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { startChatWithUser } from '../utils/chatActions';
import { AuthService } from '../../auth/services/auth.service';

interface StartChatButtonProps {
    userId: string;
    userName?: string;
    userAvatar?: string;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
    showIcon?: boolean;
    children?: React.ReactNode;
}

export default function StartChatButton({
    userId,
    userName,
    userAvatar,
    variant = 'default',
    size = 'default',
    className = '',
    showIcon = true,
    children,
}: StartChatButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleStartChat = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent parent click handlers

        try {
            setLoading(true);

            // Get user info if not provided
            let displayName = userName;
            let avatar = userAvatar;

            if (!displayName) {
                try {
                    const user = await AuthService.getUserById(userId);
                    displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
                    avatar = user.avatarUrl;
                } catch {
                    displayName = 'Người dùng';
                }
            }

            // Trigger chat window to open
            startChatWithUser(userId, displayName || 'Người dùng', avatar);
        } catch {
            // Failed to start chat - ignore
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleStartChat}
            disabled={loading}
            className={className}
        >
            {showIcon && <MessageCircle className="w-4 h-4 mr-2" />}
            {children || (loading ? 'Đang mở...' : 'Nhắn tin')}
        </Button>
    );
}
