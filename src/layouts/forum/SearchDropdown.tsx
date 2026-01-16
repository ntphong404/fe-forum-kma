import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, FolderOpen } from 'lucide-react';
import { PostService } from '@/features/posts/services/post.service';
import { GroupService } from '@/features/groups/services/group.service';
import { AuthService } from '@/features/auth/services/auth.service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { ApiPost, Group } from '@/interfaces/post.types';
import type { User } from '@/interfaces/auth.types';

interface SearchDropdownProps {
    searchQuery: string;
    onClose: () => void;
    isOpen: boolean;
    inputRef?: React.RefObject<HTMLInputElement>;
}

// Generate colors for categories
const categoryColors = [
    '#1e3a5f', '#2d5a87', '#3d7ab5', '#1a5f7a', '#2e8b57',
    '#4682b4', '#5f9ea0', '#6b8e9f', '#708090', '#4a6fa5',
];

export default function SearchDropdown({ searchQuery, onClose, isOpen, inputRef }: SearchDropdownProps) {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<ApiPost[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    // Update dropdown position based on input element
    useEffect(() => {
        if (isOpen && inputRef?.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 8,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    }, [isOpen, inputRef]);

    // Search posts, users, and groups when query changes
    useEffect(() => {
        const search = async () => {
            if (!searchQuery.trim()) {
                setPosts([]);
                setUsers([]);
                setGroups([]);
                return;
            }

            setLoading(true);
            try {
                const query = searchQuery.toLowerCase().trim();

                // Search posts
                const postsResponse = await PostService.getFeed({
                    page: 0,
                    limit: 50,
                    search: searchQuery.trim()
                });

                // Filter posts that actually contain the keyword in title or content
                const filteredPosts = postsResponse.content.filter(post => {
                    const title = (post.title || '').toLowerCase();
                    const content = (post.content || '').toLowerCase();
                    return title.includes(query) || content.includes(query);
                });

                setPosts(filteredPosts.slice(0, 10));

                // Search users
                try {
                    const usersResponse = await AuthService.getAllUsers(0, 50);
                    const filteredUsers = usersResponse.content.filter(user => {
                        const fullName = `${user.lastName || ''} ${user.firstName || ''}`.toLowerCase();
                        const username = (user.username || '').toLowerCase();
                        return fullName.includes(query) || username.includes(query);
                    });
                    setUsers(filteredUsers.slice(0, 5));
                } catch (error) {
                    console.error('User search failed:', error);
                    setUsers([]);
                }

                // Search groups/categories
                try {
                    const groupsResponse = await GroupService.getAllGroups({
                        page: 0,
                        limit: 20,
                        search: searchQuery.trim()
                    });
                    const filteredGroups = groupsResponse.content.filter(group => {
                        const name = (group.groupName || group.name || '').toLowerCase();
                        const description = (group.description || '').toLowerCase();
                        return name.includes(query) || description.includes(query);
                    });
                    setGroups(filteredGroups.slice(0, 5));
                } catch (error) {
                    console.error('Group search failed:', error);
                    setGroups([]);
                }
            } catch (error) {
                console.error('Search failed:', error);
                setPosts([]);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(search, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const handlePostClick = (postId: string) => {
        onClose();
        // Navigate to post detail page with proper URL
        navigate(`/forum/post/${postId}`, { replace: true });
        window.dispatchEvent(new CustomEvent('open-post-modal', { detail: { postId } }));
    };

    const handleUserClick = (userId: string) => {
        onClose();
        navigate(`/profile/${userId}`);
    };

    const handleGroupClick = (groupId: string) => {
        onClose();
        navigate(`/forum/group/${groupId}`);
    };

    const getGroupColor = (index: number) => {
        return categoryColors[index % categoryColors.length];
    };

    if (!isOpen || !searchQuery.trim()) {
        return null;
    }

    const hasResults = posts.length > 0 || users.length > 0 || groups.length > 0;

    const dropdownContent = (
        <div
            ref={dropdownRef}
            className="fixed bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden z-[10000]"
            style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
                maxWidth: '800px'
            }}
        >
            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
            )}

            {/* Results */}
            {!loading && hasResults && (
                <div className="max-h-96 overflow-y-auto">
                    {/* Groups/Categories Section */}
                    {groups.length > 0 && (
                        <div className="py-2">
                            <div className="px-4 py-2">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                                    <FolderOpen className="w-3.5 h-3.5" />
                                    DANH MỤC
                                </span>
                            </div>
                            {groups.map((group, index) => {
                                const groupName = group.groupName || group.name || 'Danh mục';
                                const color = getGroupColor(index);
                                return (
                                    <div
                                        key={group.groupId}
                                        onClick={() => handleGroupClick(group.groupId)}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/60 cursor-pointer transition-colors"
                                    >
                                        <div
                                            className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-lg"
                                            style={{ backgroundColor: color }}
                                        >
                                            {groupName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium text-sm line-clamp-1">
                                                {highlightMatch(groupName, searchQuery)}
                                            </p>
                                            {group.description && (
                                                <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">
                                                    {highlightMatch(group.description, searchQuery)}
                                                </p>
                                            )}
                                            <p className="text-slate-500 text-xs mt-0.5">
                                                {group.memberCount || 0} người tham gia
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Users Section */}
                    {users.length > 0 && (
                        <div className={`py-2 ${groups.length > 0 ? 'border-t border-slate-700/50' : ''}`}>
                            <div className="px-4 py-2">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                                    NGƯỜI DÙNG
                                </span>
                            </div>
                            {users.map((user) => {
                                const displayName = `${user.lastName || ''} ${user.firstName || ''}`.trim() || user.username || 'Người dùng';
                                return (
                                    <div
                                        key={user.userId}
                                        onClick={() => handleUserClick(user.userId)}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/60 cursor-pointer transition-colors"
                                    >
                                        <Avatar className="h-10 w-10 flex-shrink-0">
                                            <AvatarImage src={user.avatarUrl} alt={displayName} />
                                            <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white text-sm">
                                                {displayName.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium text-sm line-clamp-1">
                                                {highlightMatch(displayName, searchQuery)}
                                            </p>
                                            {user.username && (
                                                <p className="text-slate-400 text-xs mt-0.5">
                                                    @{user.username}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Posts Section */}
                    {posts.length > 0 && (
                        <div className={`py-2 ${(groups.length > 0 || users.length > 0) ? 'border-t border-slate-700/50' : ''}`}>
                            <div className="px-4 py-2">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                                    BÀI VIẾT
                                </span>
                            </div>
                            {posts.map((post) => {
                                const postImage = post.resourceUrls && post.resourceUrls.length > 0 && post.type === 'IMAGE'
                                    ? post.resourceUrls[0]
                                    : null;

                                const getSnippet = () => {
                                    const query = searchQuery.toLowerCase().trim();
                                    const content = post.content || '';
                                    const lowerContent = content.toLowerCase();

                                    if (lowerContent.includes(query)) {
                                        const pos = lowerContent.indexOf(query);
                                        const start = Math.max(0, pos - 20);
                                        const end = Math.min(content.length, pos + query.length + 40);
                                        let snippet = content.substring(start, end);
                                        if (start > 0) snippet = '...' + snippet;
                                        if (end < content.length) snippet = snippet + '...';
                                        return snippet;
                                    }
                                    return content.substring(0, 60) + (content.length > 60 ? '...' : '');
                                };

                                return (
                                    <div
                                        key={post.postId}
                                        onClick={() => handlePostClick(post.postId)}
                                        className="flex items-start gap-3 px-4 py-3 hover:bg-slate-800/60 cursor-pointer transition-colors"
                                    >
                                        <div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden bg-slate-700">
                                            {postImage ? (
                                                <img src={postImage} alt={post.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                                                    <span className="text-white text-lg">📝</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium text-sm line-clamp-1">
                                                {highlightMatch(post.title || 'Bài viết', searchQuery)}
                                            </p>
                                            <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">
                                                {highlightMatch(getSnippet(), searchQuery)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* No Results */}
            {!loading && !hasResults && searchQuery.trim() && (
                <div className="flex flex-col items-center justify-center py-8">
                    <Search className="w-8 h-8 text-slate-500 mb-2" />
                    <p className="text-slate-400 text-sm">Không tìm thấy kết quả</p>
                    <p className="text-slate-500 text-xs mt-1">Thử từ khóa khác</p>
                </div>
            )}
        </div>
    );

    return createPortal(dropdownContent, document.body);
}

// Helper function to highlight matching text
function highlightMatch(text: string, query: string): React.ReactNode {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
        regex.test(part) ? (
            <span key={index} className="text-blue-400 font-semibold">{part}</span>
        ) : (
            part
        )
    );
}

// Helper to escape special regex characters
function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
