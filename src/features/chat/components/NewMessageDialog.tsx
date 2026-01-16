import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, MessageCircle } from 'lucide-react';
import { ChatService } from '../services/chat.service';
import type { User } from '@/interfaces/auth.types';

interface NewMessageDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConversationCreated: (conversationId: string) => void;
}

export default function NewMessageDialog({
    isOpen,
    onClose,
    onConversationCreated,
}: NewMessageDialogProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadUsers();
        }
    }, [isOpen]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            // You might want to create an API to get friends list or search users
            // For now, this is a placeholder
            setUsers([]);
        } catch (err) {
            console.error('Failed to load users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStartChat = async (userId: string) => {
        try {
            setSending(true);
            // Send initial message to create conversation
            const message = await ChatService.sendMessage({
                receiverId: userId,
                message: 'Xin chào!',
                type: 'TEXT',
            });

            onConversationCreated(message.conversationId);
            onClose();
        } catch (err) {
            console.error('Failed to start chat:', err);
        } finally {
            setSending(false);
        }
    };

    const filteredUsers = users.filter((user) =>
        `${user.firstName} ${user.lastName} ${user.username}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Tin nhắn mới
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm người dùng..."
                            className="pl-10 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    {/* User List */}
                    <ScrollArea className="h-[400px]">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                                    <MessageCircle className="w-8 h-8 text-blue-500" />
                                </div>
                                <p className="text-slate-500">Không tìm thấy người dùng</p>
                                <p className="text-xs text-slate-400 mt-1">Thử tìm kiếm với từ khóa khác</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredUsers.map((user) => (
                                    <div
                                        key={user.userId}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                                        onClick={() => handleStartChat(user.userId)}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
                                            <span className="text-white font-bold">
                                                {user.firstName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-900 truncate">
                                                {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate">@{user.username}</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={sending}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg"
                                        >
                                            <MessageCircle className="w-4 h-4 mr-1" />
                                            Chat
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
