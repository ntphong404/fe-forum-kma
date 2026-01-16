import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users, Settings, ChevronLeft, Loader2, Shield, Crown,
  UserMinus, UserPlus, Globe, Lock, Edit2, Trash2, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GroupService } from '@/features/groups/services/group.service';
import { PostService } from '@/features/posts/services/post.service';
import { PostCard, CreatePost } from '@/features/posts';
import type { Group, GroupMember, GroupMemberCheck, ApiPost } from '@/interfaces/post.types';
import { useAuthStore } from '@/store/useStore';

export default function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const isAdmin = useAuthStore((s) => s.isAdmin());

  const [group, setGroup] = useState<Group | null>(null);
  const [membership, setMembership] = useState<GroupMemberCheck | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'members'>('posts');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Settings states
  const [showSettings, setShowSettings] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVisibility, setEditVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (groupId) {
      loadGroupData();
    }
  }, [groupId]);

  useEffect(() => {
    if (groupId && activeTab === 'posts') {
      loadPosts(0);
    } else if (groupId && activeTab === 'members') {
      loadMembers();
    }
  }, [groupId, activeTab]);

  const loadGroupData = async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      setError(null);

      const [groupData, membershipData] = await Promise.all([
        GroupService.getGroupById(groupId),
        GroupService.checkMembership(groupId),
      ]);

      setGroup(groupData);
      setMembership(membershipData);
    } catch (err: any) {
      console.error('Failed to load group:', err);
      setError(err.message || 'Không thể tải thông tin danh mục');
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async (pageNum: number = 0) => {
    if (!groupId) return;

    try {
      setLoadingPosts(true);
      const response = await PostService.getFeedByGroup(groupId, {
        page: pageNum,
        limit: 10,
        sort: 'createdAt,DESC'
      });

      if (pageNum === 0) {
        setPosts(response.content);
      } else {
        setPosts(prev => [...prev, ...response.content]);
      }

      setHasMore(pageNum < response.totalPages - 1);
      setPage(pageNum);
    } catch (err: any) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadMembers = async () => {
    if (!groupId) return;

    try {
      setLoadingMembers(true);
      const response = await GroupService.getGroupMembers(groupId, { page: 0, limit: 50 });
      setMembers(response.content);
    } catch (err: any) {
      console.error('Failed to load members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!groupId) return;

    try {
      await GroupService.joinGroup({ groupId });
      // Dispatch event to notify sidebar to refresh
      window.dispatchEvent(new CustomEvent('groupMembershipChanged'));
      await loadGroupData();
    } catch (err: any) {
      console.error('Failed to join group:', err);
    }
  };

  const handleLeaveGroup = async () => {
    if (!groupId) return;

    try {
      await GroupService.leaveGroup(groupId);
      // Dispatch event to notify sidebar to refresh
      window.dispatchEvent(new CustomEvent('groupMembershipChanged'));
      await loadGroupData();
    } catch (err: any) {
      console.error('Failed to leave group:', err);
    }
  };

  const handlePostCreated = () => {
    loadPosts(0);
  };

  const handleReactionChange = (postId: string, newReactionCount: number, myReaction: string | null) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.postId === postId
          ? { ...post, reactionCount: newReactionCount, myReaction: myReaction as any }
          : post
      )
    );
  };

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openEditModal = () => {
    if (!group) return;
    setEditName(group.groupName || group.name || '');
    setEditDescription(group.description || '');
    setEditVisibility(group.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC');
    setShowEditModal(true);
    setShowSettings(false);
  };

  const handleUpdateGroup = async () => {
    if (!groupId || !editName.trim()) return;

    try {
      setUpdating(true);
      await GroupService.updateGroup(groupId, {
        groupName: editName.trim(),
        description: editDescription.trim(),
        visibility: editVisibility,
      });
      await loadGroupData();
      setShowEditModal(false);
    } catch (err: any) {
      console.error('Failed to update group:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupId) return;

    try {
      setDeleting(true);
      await GroupService.deleteGroup(groupId);
      window.dispatchEvent(new CustomEvent('groupMembershipChanged'));
      navigate('/forum');
    } catch (err: any) {
      console.error('Failed to delete group:', err);
    } finally {
      setDeleting(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="w-4 h-4 text-amber-500" />;
      case 'ADMIN':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">Quản trị viên</span>;
      case 'ADMIN':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">Quản trị</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">Thành viên</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 mb-4">{error || 'Không tìm thấy danh mục'}</p>
        <Button onClick={() => navigate('/forum')}>Quay lại</Button>
      </div>
    );
  }

  const categoryName = group.groupName || group.name || 'Danh mục';
  const isPublic = group.visibility === 'PUBLIC' || group.privacy === 'PUBLIC';

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
      {/* Header */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <button
            onClick={() => navigate('/forum')}
            className="flex items-center text-slate-500 hover:text-slate-700 transition-colors text-sm sm:text-base"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
            <span className="hidden xs:inline">Quay lại</span>
          </button>

          {isAdmin && (
            <div className="relative" ref={settingsRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="text-xs sm:text-sm"
              >
                <Settings className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Cài đặt</span>
              </Button>

              {/* Settings Dropdown */}
              {showSettings && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg py-2 z-50">
                  <button
                    onClick={openEditModal}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-slate-500" />
                    Chỉnh sửa thông tin
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(true); setShowSettings(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Xóa danh mục
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-lg flex-shrink-0">
            {categoryName[0]?.toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold text-slate-900 break-words">{categoryName}</h1>
              {isPublic ? (
                <span title="Công khai">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                </span>
              ) : (
                <span title="Riêng tư">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0" />
                </span>
              )}
            </div>
            <p className="text-slate-500 mt-1 text-xs sm:text-sm line-clamp-2">{group.description || 'Không có mô tả'}</p>
            <div className="flex items-center gap-4 mt-2 text-xs sm:text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {group.memberCount} người tham gia
              </span>
            </div>
          </div>

          {/* Ẩn nút Rời danh mục/Tham gia với Admin */}
          {!isAdmin && (
            <div className="w-full sm:w-auto mt-2 sm:mt-0">
              {membership?.isMember ? (
                <Button variant="outline" onClick={handleLeaveGroup} className="w-full sm:w-auto text-xs sm:text-sm">
                  <UserMinus className="w-4 h-4 mr-2" />
                  Rời danh mục
                </Button>
              ) : (
                <Button onClick={handleJoinGroup} className="w-full sm:w-auto text-xs sm:text-sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Tham gia
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 mb-4 sm:mb-6 shadow-sm">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'posts'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Bài viết
          </button>
          {/* Chỉ admin mới có thể xem danh sách người tham gia */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'members'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Người tham gia ({group.memberCount})
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'posts' && (
        <div>
          {membership?.canPost && (
            <CreatePost onPostCreated={handlePostCreated} defaultGroupId={groupId} />
          )}

          {loadingPosts && posts.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <p className="text-slate-500">Chưa có bài viết nào trong danh mục này</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.postId}
                  post={post}
                  onReactionChange={handleReactionChange}
                />
              ))}

              {hasMore && (
                <div className="flex justify-center py-4">
                  <Button onClick={() => loadPosts(page + 1)} disabled={loadingPosts}>
                    {loadingPosts ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang tải...
                      </>
                    ) : (
                      'Xem thêm'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'members' && isAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          {loadingMembers ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-500">Không có thành viên nào</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {members.map((member) => (
                <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                      <AvatarImage 
                        src={member.avatarUrl} 
                        alt={member.userName} 
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-sm">
                        {member.userName?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{member.userName}</span>
                        {getRoleIcon(member.role)}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {getRoleBadge(member.role)}
                        <span className="text-xs text-slate-400">
                          Tham gia {new Date(member.joinedAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Group Modal */}
      {showEditModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl z-50 p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Chỉnh sửa thông tin danh mục</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập tên danh mục"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px] resize-none"
                  placeholder="Mô tả về danh mục..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Quyền riêng tư
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditVisibility('PUBLIC')}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${editVisibility === 'PUBLIC'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                  >
                    <Globe className="w-6 h-6" />
                    <span className="text-sm font-medium">Công khai</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditVisibility('PRIVATE')}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${editVisibility === 'PRIVATE'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                  >
                    <Lock className="w-6 h-6" />
                    <span className="text-sm font-medium">Riêng tư</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setShowEditModal(false)}
                  disabled={updating}
                >
                  Hủy
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleUpdateGroup}
                  disabled={!editName.trim() || updating}
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    'Lưu thay đổi'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-xl z-50 p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Xóa danh mục này?</h2>
              <p className="text-slate-500 text-sm">
                Hành động này không thể hoàn tác. Tất cả bài viết và thành viên sẽ bị xóa vĩnh viễn.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Hủy
              </Button>
              <Button
                variant="default" // Using default variant but styling as red via className if needed, or stick to default meaning
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDeleteGroup}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  'Xóa danh mục'
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

