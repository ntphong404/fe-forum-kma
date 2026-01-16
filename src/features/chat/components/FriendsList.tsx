import { useState, useEffect } from 'react';
import { FriendshipService } from '../../friends/services/friendship.service';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, MessageCircle, Users } from 'lucide-react';

interface Friend {
    userId: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
}

interface FriendsListProps {
    onStartChat: (friendId: string, friendName: string, friendAvatar?: string) => void;
}

export default function FriendsList({ onStartChat }: FriendsListProps) {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadFriends();
    }, []);

    const loadFriends = async () => {
        try {
            setLoading(true);
            const friendships = await FriendshipService.getFriends();

            // FriendshipResponse already contains user info, just map it
            const friendsData: Friend[] = friendships.map((friendship) => ({
                userId: friendship.userId,
                username: friendship.username,
                firstName: friendship.firstName,
                lastName: friendship.lastName,
                avatarUrl: friendship.avatarUrl,
            }));

            setFriends(friendsData);
        } catch (error) {
            console.error('Failed to load friends:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredFriends = friends.filter((friend) => {
        const fullName = `${friend.firstName || ''} ${friend.lastName || ''}`.trim();
        const searchLower = searchQuery.toLowerCase();
        return (
            friend.username.toLowerCase().includes(searchLower) ||
            fullName.toLowerCase().includes(searchLower)
        );
    });

    const getFriendDisplayName = (friend: Friend) => {
        const fullName = `${friend.firstName || ''} ${friend.lastName || ''}`.trim();
        return fullName || friend.username;
    };

    return (
        <Card className="h-full flex flex-col bg-white shadow-sm border-slate-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h2 className="font-semibold text-lg">Bạn bè</h2>
                    <span className="ml-auto text-sm text-slate-500">{friends.length}</span>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Tìm bạn bè..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 text-sm"
                    />
                </div>
            </div>

            {/* Friends List */}
            <ScrollArea className="flex-1">
                {loading ? (
                    <div className="p-8 text-center text-slate-400">
                        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-sm">Đang tải...</p>
                    </div>
                ) : filteredFriends.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                            {searchQuery ? 'Không tìm thấy bạn bè' : 'Chưa có bạn bè'}
                        </p>
                    </div>
                ) : (
                    <div className="p-2">
                        {filteredFriends.map((friend) => (
                            <button
                                key={friend.userId}
                                onClick={() => onStartChat(friend.userId, getFriendDisplayName(friend), friend.avatarUrl)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                            >
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                                        {friend.avatarUrl ? (
                                            <img
                                                src={friend.avatarUrl}
                                                alt={getFriendDisplayName(friend)}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            getFriendDisplayName(friend).charAt(0).toUpperCase()
                                        )}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 text-left min-w-0">
                                    <p className="font-medium text-sm text-slate-900 truncate">
                                        {getFriendDisplayName(friend)}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate">
                                        @{friend.username}
                                    </p>
                                </div>

                                {/* Chat icon */}
                                <MessageCircle className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                            </button>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </Card>
    );
}
