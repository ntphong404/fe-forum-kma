import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/useStore';
import { PostService } from '@/features/posts/services/post.service';
import { AuthService } from '@/features/auth/services/auth.service';
import { FriendshipService } from '@/features/friends/services/friendship.service';
import { FriendButton } from '@/features/friends';
import { StartChatButton } from '@/features/chat';
import { PostCard } from '@/features/posts';
import type { ApiPost } from '@/interfaces/post.types';
import type { User } from '@/interfaces/auth.types';
import type { FriendshipResponse } from '@/interfaces/friendship.types';
import { FriendshipStatus } from '@/interfaces/friendship.types';
import {
  Info,
  FileText,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

type ProfileTab = 'about' | 'posts' | 'friends';

export default function ProfilePage() {
  const { userId: paramUserId } = useParams<{ userId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [friends, setFriends] = useState<FriendshipResponse[]>([]);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('about');
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);

  const isOwnProfile = !paramUserId || paramUserId === currentUser?.userId;
  const targetUserId = paramUserId || currentUser?.userId;

  // Sync activeTab with URL query params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['about', 'posts', 'friends'].includes(tab)) {
      setActiveTab(tab as ProfileTab);
    } else {
      setActiveTab('about');
    }
  }, [searchParams]);

  useEffect(() => {
    loadProfileData();
  }, [targetUserId]);

  const loadProfileData = async () => {
    if (!targetUserId) return;

    setLoading(true);
    try {
      if (isOwnProfile && currentUser) {
        setProfileUser(currentUser);
      } else {
        const user = await AuthService.getUserById(targetUserId);
        setProfileUser(user);
      }

      await loadPosts();
      await loadFriends();

      // Load friendship status for other users' profiles
      if (!isOwnProfile && targetUserId) {
        try {
          const statusResponse = await FriendshipService.checkFriendshipStatus(targetUserId);
          setFriendshipStatus(statusResponse.status);
        } catch (error) {
          console.error('Error checking friendship status:', error);
          setFriendshipStatus(null);
        }
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast.error('Không thể tải thông tin hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    if (!targetUserId) return;

    setPostsLoading(true);
    try {
      const response = await PostService.getPostsByAuthor(targetUserId, {
        limit: 20,
        sort: 'createdAt,DESC'
      });
      // Sắp xếp bài viết theo thứ tự mới nhất (createdAt giảm dần)
      const sortedPosts = (response.content || []).sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Mới nhất trước
      });
      setPosts(sortedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const loadFriends = async () => {
    try {
      const friendsList = await FriendshipService.getFriends();
      setFriends(friendsList || []);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
    const basePath = isOwnProfile ? '/profile' : `/profile/${targetUserId}`;
    navigate(`${basePath}?tab=${tab}`, { replace: true });
  };

  const handleReactionChange = (postId: string, newCount: number, myReaction: string | null) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.postId === postId
          ? { ...p, reactionCount: newCount, myReaction: myReaction as any }
          : p
      )
    );
  };

  const handlePostDelete = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.postId !== postId));
  };

  const getDisplayName = () => {
    if (!profileUser) return '';
    if (profileUser.lastName && profileUser.firstName) {
      return `${profileUser.lastName} ${profileUser.firstName}`;
    }
    return profileUser.username;
  };

  const getInitials = () => {
    if (!profileUser) return '';
    if (profileUser.lastName && profileUser.firstName) {
      return `${profileUser.lastName[0]}${profileUser.firstName[0]}`.toUpperCase();
    }
    return profileUser.username?.substring(0, 2).toUpperCase() || 'U';
  };

  if (!currentUser) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <p className="text-gray-600 dark:text-gray-400">Bạn chưa đăng nhập.</p>
        <Link to="/">
          <Button className="mt-4">Đăng nhập</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <div className="relative pt-8">
        {/* Profile Info */}
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
            {/* Avatar */}
            <Avatar className="w-32 h-32 border-4 border-white dark:border-gray-800 shadow-lg">
              <AvatarImage src={profileUser?.avatarUrl} />
              <AvatarFallback className="text-4xl bg-blue-500 text-white font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>

            {/* Name & Actions Row */}
            <div className="flex-1 flex flex-col sm:flex-row items-center sm:items-end justify-between w-full pb-4">
              {/* Name & Badge */}
              <div className="text-center sm:text-left mb-4 sm:mb-0">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {getDisplayName()}
                  </h1>
                  {profileUser?.roleName && (
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${profileUser.roleName === 'ADMIN'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      : profileUser.roleName === 'MODERATOR'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      }`}>
                      {profileUser.roleName}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start">
                  {isOwnProfile ? (
                    <Link to="/settings">
                      <Button variant="outline" size="sm">
                        Chỉnh sửa hồ sơ
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <FriendButton userId={targetUserId!} />
                      {friendshipStatus === FriendshipStatus.FRIENDS && (
                        <StartChatButton
                          userId={targetUserId!}
                          userName={getDisplayName()}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6">
                <div className="text-center px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-xl font-bold text-blue-600">{posts.length}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Bài viết</div>
                </div>
                <div className="text-center px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-xl font-bold text-blue-600">{friends.length}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Bạn bè</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="flex gap-2">
          <TabButton
            active={activeTab === 'about'}
            onClick={() => handleTabChange('about')}
            icon={<Info className="h-4 w-4" />}
          >
            Giới thiệu
          </TabButton>
          <TabButton
            active={activeTab === 'posts'}
            onClick={() => handleTabChange('posts')}
            icon={<FileText className="h-4 w-4" />}
          >
            Bài viết
          </TabButton>
          <TabButton
            active={activeTab === 'friends'}
            onClick={() => handleTabChange('friends')}
            icon={<Users className="h-4 w-4" />}
          >
            Bạn bè
          </TabButton>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'about' && (
          <AboutSection user={profileUser} isOwnProfile={isOwnProfile} />
        )}

        {activeTab === 'posts' && (
          <PostsSection
            posts={posts}
            loading={postsLoading}
            isOwnProfile={isOwnProfile}
            user={profileUser}
            onReactionChange={handleReactionChange}
            onDelete={handlePostDelete}
          />
        )}

        {activeTab === 'friends' && (
          <FriendsSection friends={friends} />
        )}
      </div>
    </div>
  );
}

// Tab Button Component
function TabButton({
  active,
  onClick,
  icon,
  children
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-full transition-colors ${active
        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
    >
      {icon}
      {children}
    </button>
  );
}

// About Section
function AboutSection({ user, isOwnProfile }: { user: User | null; isOwnProfile: boolean }) {
  return (
    <div className="space-y-4">
      {/* Contact Info */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Thông tin liên hệ</h3>
          {user?.email ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <span className="text-sm">Email:</span>
                <span className="text-gray-900 dark:text-white">{user.email}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm italic">
              Chưa có thông tin liên hệ
            </p>
          )}
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Thông tin cơ bản</h3>
          {user?.dob || user?.gender || user?.address ? (
            <div className="space-y-3">
              {user.dob && (
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <span className="text-sm">Ngày sinh:</span>
                  <span className="text-gray-900 dark:text-white">{user.dob}</span>
                </div>
              )}
              {user.gender && (
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <span className="text-sm">Giới tính:</span>
                  <span className="text-gray-900 dark:text-white">
                    {user.gender === 'MALE' ? 'Nam' : user.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                  </span>
                </div>
              )}
              {user.address && (
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <span className="text-sm">Địa chỉ:</span>
                  <span className="text-gray-900 dark:text-white">{user.address}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm italic">
              Chưa có thông tin cơ bản
            </p>
          )}
        </CardContent>
      </Card>

      {isOwnProfile && (
        <div className="text-center">
          <Link to="/settings">
            <Button variant="outline">Chỉnh sửa thông tin</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

// Posts Section
function PostsSection({
  posts,
  loading,
  isOwnProfile,
  user,
  onReactionChange,
  onDelete
}: {
  posts: ApiPost[];
  loading: boolean;
  isOwnProfile: boolean;
  user: User | null;
  onReactionChange: (postId: string, newCount: number, myReaction: string | null) => void;
  onDelete: (postId: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">
            {isOwnProfile ? 'Bạn chưa có bài viết nào' : 'Chưa có bài viết nào'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => {
        // Hydrate post with user info if missing, since we are on their profile
        const hydratedPost = { ...post };
        if (user) {
          if (!hydratedPost.authorName || hydratedPost.authorName === post.authorId) {
            hydratedPost.authorName = user.lastName && user.firstName
              ? `${user.lastName} ${user.firstName}`
              : user.username;
          }
          if (!hydratedPost.authorAvatarUrl) {
            hydratedPost.authorAvatarUrl = user.avatarUrl;
          }
        }

        return (
          <PostCard
            key={post.postId}
            post={hydratedPost}
            onReactionChange={onReactionChange}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
}

// Friends Section
function FriendsSection({ friends }: { friends: FriendshipResponse[] }) {
  if (friends.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">Chưa có bạn bè nào</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {friends.map((friend) => (
        <Card key={friend.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <Link
              to={`/profile/${friend.userId}`}
              className="flex items-center gap-4"
            >
              <Avatar className="w-14 h-14">
                <AvatarImage src={friend.avatarUrl} />
                <AvatarFallback className="bg-blue-500 text-white">
                  {friend.firstName?.[0] || friend.username[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate hover:underline">
                  {friend.lastName && friend.firstName
                    ? `${friend.lastName} ${friend.firstName}`
                    : friend.username}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{friend.username}</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
