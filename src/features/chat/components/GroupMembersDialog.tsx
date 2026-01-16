import { useState, useEffect } from 'react';
import { ChatService } from '../services/chat.service';
import { AuthService } from '../../auth/services/auth.service';
import { FriendshipService } from '../../friends/services/friendship.service';
import { useAuthStore } from '@/store/useStore';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Users,
    UserPlus,
    UserMinus,
    Crown,
    Shield,
    Search,
    LogOut,
    Check
} from 'lucide-react';
import { toast } from 'sonner';

interface GroupMember {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    role: 'owner' | 'admin' | 'member';
}

interface GroupMembersDialogProps {
    isOpen: boolean;
    onClose: () => void;
    groupId: string;
    groupName: string;
    onMemberChange?: () => void;
}

export default function GroupMembersDialog({
    isOpen,
    onClose,
    groupId,
    groupName,
    onMemberChange,
}: GroupMembersDialogProps) {
    const currentUser = useAuthStore((s) => s.user);
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [friends, setFriends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddMembers, setShowAddMembers] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
    const [addingMembers, setAddingMembers] = useState(false);
    const [groupInfo, setGroupInfo] = useState<any>(null);

    // Confirm dialogs
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        type: 'remove' | 'leave';
        member: GroupMember | null;
    }>({
        isOpen: false,
        type: 'remove',
        member: null,
    });

    useEffect(() => {
        if (isOpen && groupId) {
            loadGroupData();
        }
    }, [isOpen, groupId]);

    const loadGroupData = async () => {
        try {
            setLoading(true);

            // Load group info and members in parallel
            const [groupData, membersData] = await Promise.all([
                ChatService.getGroupById(groupId),
                ChatService.getGroupMembers(groupId),
            ]);

            setGroupInfo(groupData);

            // Transform members data with user info
            const membersWithInfo: GroupMember[] = await Promise.all(
                membersData.map(async (member: any) => {
                    try {
                        const userId = member.userId || member.id;
                        const userInfo = await AuthService.getUserById(userId);

                        let role: 'owner' | 'admin' | 'member' = 'member';
                        if (groupData.ownerId === userId) {
                            role = 'owner';
                        } else if (groupData.adminIds?.includes(userId)) {
                            role = 'admin';
                        }

                        return {
                            id: userId,
                            username: userInfo.username,
                            firstName: userInfo.firstName,
                            lastName: userInfo.lastName,
                            avatarUrl: userInfo.avatarUrl,
                            role,
                        };
                    } catch (err) {
                        return {
                            id: member.userId || member.id,
                            username: member.username || 'Unknown',
                            role: 'member' as const,
                        };
                    }
                })
            );

            // Sort: owner first, then admins, then members
            membersWithInfo.sort((a, b) => {
                const order = { owner: 0, admin: 1, member: 2 };
                return order[a.role] - order[b.role];
            });

            setMembers(membersWithInfo);
        } catch (error: any) {
            console.error('Failed to load group data:', error);
            toast.error(error.message || 'Không thể tải thông tin nhóm');
        } finally {
            setLoading(false);
        }
    };

    const loadFriends = async () => {
        try {
            const friendsList = await FriendshipService.getFriends();
            // Filter out friends who are already members
            const memberIds = members.map(m => m.id);
            const availableFriends = friendsList.filter(f => !memberIds.includes(f.userId));
            setFriends(availableFriends);
        } catch (error) {
            console.error('Failed to load friends:', error);
        }
    };

    const handleShowAddMembers = async () => {
        setShowAddMembers(true);
        setSelectedFriends([]);
        await loadFriends();
    };

    const handleAddMembers = async () => {
        if (selectedFriends.length === 0) return;

        try {
            setAddingMembers(true);
            await ChatService.addGroupMembers(groupId, selectedFriends);
            toast.success(`Đã thêm ${selectedFriends.length} thành viên vào nhóm`);
            setShowAddMembers(false);
            setSelectedFriends([]);
            await loadGroupData();
            onMemberChange?.();
        } catch (error: any) {
            console.error('Failed to add members:', error);
            toast.error(error.message || 'Không thể thêm thành viên');
        } finally {
            setAddingMembers(false);
        }
    };

    const handleRemoveMember = async () => {
        if (!confirmDialog.member) return;

        try {
            await ChatService.removeGroupMember(groupId, confirmDialog.member.id);
            toast.success(`Đã xóa ${confirmDialog.member.username} khỏi nhóm`);
            setMembers(prev => prev.filter(m => m.id !== confirmDialog.member?.id));
            onMemberChange?.();
        } catch (error: any) {
            console.error('Failed to remove member:', error);
            toast.error(error.message || 'Không thể xóa thành viên');
        } finally {
            setConfirmDialog({ isOpen: false, type: 'remove', member: null });
        }
    };

    const handleLeaveGroup = async () => {
        try {
            await ChatService.leaveGroup(groupId);
            toast.success('Đã rời khỏi nhóm');
            onClose();
            onMemberChange?.();
            // Refresh conversation list via event
            window.dispatchEvent(new CustomEvent('refresh-conversations'));
        } catch (error: any) {
            console.error('Failed to leave group:', error);
            toast.error(error.message || 'Không thể rời nhóm');
        } finally {
            setConfirmDialog({ isOpen: false, type: 'leave', member: null });
        }
    };

    const toggleFriendSelection = (friendId: string) => {
        setSelectedFriends(prev =>
            prev.includes(friendId)
                ? prev.filter(id => id !== friendId)
                : [...prev, friendId]
        );
    };

    const getDisplayName = (member: GroupMember) => {
        if (member.firstName && member.lastName) {
            return `${member.firstName} ${member.lastName}`;
        }
        return member.username;
    };

    const getInitials = (member: GroupMember) => {
        if (member.firstName && member.lastName) {
            return `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
        }
        return member.username.substring(0, 2).toUpperCase();
    };

    const isOwner = groupInfo?.ownerId === currentUser?.userId;
    const isAdmin = isOwner || groupInfo?.adminIds?.includes(currentUser?.userId);

    const filteredFriends = friends.filter(friend => {
        if (!searchQuery) return true;
        const name = `${friend.firstName || ''} ${friend.lastName || ''} ${friend.username}`.toLowerCase();
        return name.includes(searchQuery.toLowerCase());
    });

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white rounded-2xl">
                    <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <DialogTitle className="flex items-center gap-3 text-xl">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">{groupName}</p>
                                <p className="text-sm font-normal text-slate-500">{members.length} thành viên</p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    {!showAddMembers ? (
                        // Members List View
                        <div className="flex flex-col">
                            {/* Actions */}
                            <div className="px-6 py-4 flex gap-2">
                                {isAdmin && (
                                    <Button
                                        onClick={handleShowAddMembers}
                                        className="flex-1 gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        Thêm thành viên
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={() => setConfirmDialog({ isOpen: true, type: 'leave', member: null })}
                                    className="gap-2 rounded-xl text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Rời nhóm
                                </Button>
                            </div>

                            {/* Members List */}
                            <ScrollArea className="h-[350px] px-6 pb-6">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {members.map((member) => (
                                            <div
                                                key={member.id}
                                                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-11 w-11 ring-2 ring-white shadow-md">
                                                        <AvatarImage src={member.avatarUrl} alt={member.username} />
                                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                                                            {getInitials(member)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold text-slate-900">
                                                                {getDisplayName(member)}
                                                                {member.id === currentUser?.userId && (
                                                                    <span className="text-slate-400 font-normal ml-1">(Bạn)</span>
                                                                )}
                                                            </p>
                                                            {member.role === 'owner' && (
                                                                <Crown className="w-4 h-4 text-yellow-500" />
                                                            )}
                                                            {member.role === 'admin' && (
                                                                <Shield className="w-4 h-4 text-blue-500" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-slate-500">@{member.username}</p>
                                                    </div>
                                                </div>

                                                {/* Remove button - only for admins, can't remove owner or self */}
                                                {isAdmin && member.role !== 'owner' && member.id !== currentUser?.userId && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setConfirmDialog({ isOpen: true, type: 'remove', member })}
                                                        className="h-9 w-9 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg"
                                                    >
                                                        <UserMinus className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    ) : (
                        // Add Members View
                        <div className="flex flex-col">
                            {/* Search */}
                            <div className="px-6 py-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Tìm kiếm bạn bè..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 h-11 rounded-xl border-slate-200"
                                    />
                                </div>
                            </div>

                            {/* Friends List */}
                            <ScrollArea className="h-[300px] px-6">
                                {filteredFriends.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <Users className="w-12 h-12 text-slate-300 mb-3" />
                                        <p className="text-slate-500">
                                            {friends.length === 0
                                                ? 'Tất cả bạn bè đã là thành viên'
                                                : 'Không tìm thấy bạn bè'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {filteredFriends.map((friend) => {
                                            const isSelected = selectedFriends.includes(friend.userId);
                                            return (
                                                <div
                                                    key={friend.userId}
                                                    onClick={() => toggleFriendSelection(friend.userId)}
                                                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${isSelected
                                                        ? 'bg-blue-50 border-2 border-blue-300'
                                                        : 'hover:bg-slate-50 border-2 border-transparent'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={friend.avatarUrl} alt={friend.username} />
                                                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                                                {friend.firstName?.[0] || friend.username[0]?.toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-semibold text-slate-900">
                                                                {friend.firstName && friend.lastName
                                                                    ? `${friend.firstName} ${friend.lastName}`
                                                                    : friend.username}
                                                            </p>
                                                            <p className="text-sm text-slate-500">@{friend.username}</p>
                                                        </div>
                                                    </div>

                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSelected
                                                        ? 'bg-blue-500 text-white'
                                                        : 'border-2 border-slate-300'
                                                        }`}>
                                                        {isSelected && <Check className="w-4 h-4" />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </ScrollArea>

                            {/* Actions */}
                            <div className="p-6 pt-4 border-t border-slate-100 flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowAddMembers(false);
                                        setSearchQuery('');
                                        setSelectedFriends([]);
                                    }}
                                    className="flex-1 rounded-xl"
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={handleAddMembers}
                                    disabled={selectedFriends.length === 0 || addingMembers}
                                    className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                                >
                                    {addingMembers ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        `Thêm (${selectedFriends.length})`
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Confirm Dialog */}
            <AlertDialog
                open={confirmDialog.isOpen}
                onOpenChange={(open: boolean) => !open && setConfirmDialog({ isOpen: false, type: 'remove', member: null })}
            >
                <AlertDialogContent className="rounded-2xl bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmDialog.type === 'remove'
                                ? 'Xóa thành viên'
                                : 'Rời khỏi nhóm'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmDialog.type === 'remove'
                                ? `Bạn có chắc muốn xóa ${confirmDialog.member?.username} khỏi nhóm?`
                                : 'Bạn có chắc muốn rời khỏi nhóm này? Bạn sẽ không thể xem tin nhắn trong nhóm nữa.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDialog.type === 'remove' ? handleRemoveMember : handleLeaveGroup}
                            className="rounded-xl bg-red-600 hover:bg-red-700"
                        >
                            {confirmDialog.type === 'remove' ? 'Xóa' : 'Rời nhóm'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
