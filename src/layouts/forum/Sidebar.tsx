import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ChevronDown, ChevronUp, Plus, Loader2, Flame, Zap, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GroupService, CreateGroupDialog } from '@/features/groups';
import type { Group } from '@/interfaces/post.types';
import { useAuthStore } from '@/store/useStore';

const feedOptions = [
  { id: 'home', name: 'Trang chủ', icon: Home },
  { id: 'new', name: 'Mới', icon: Zap },
  { id: 'popular', name: 'Phổ biến', icon: Flame },
  { id: 'all', name: 'Tất cả', icon: LayoutGrid },
];

// Generate colors for communities - professional palette
const communityColors = [
  '#1e3a5f', '#2d5a87', '#3d7ab5', '#1a5f7a', '#2e8b57',
  '#4682b4', '#5f9ea0', '#6b8e9f', '#708090', '#4a6fa5',
];

export default function Sidebar() {
  const navigate = useNavigate();
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCommunities, setShowCommunities] = useState(true);
  const [showRecent, setShowRecent] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [suggestedGroups, setSuggestedGroups] = useState<Group[]>([]);
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);
  const [showAllMyGroups, setShowAllMyGroups] = useState(false);
  const [showAllSuggested, setShowAllSuggested] = useState(false);

  const MAX_VISIBLE_GROUPS = 5;

  useEffect(() => {
    loadMyGroups();
    loadSuggestedGroups();

    // Listen for group membership changes (join/leave)
    const handleMembershipChange = () => {
      loadMyGroups();
      loadSuggestedGroups();
    };
    window.addEventListener('groupMembershipChanged', handleMembershipChange);

    return () => {
      window.removeEventListener('groupMembershipChanged', handleMembershipChange);
    };
  }, []);

  const loadSuggestedGroups = async () => {
    try {
      // Use the new backend API for group suggestions
      // This returns random public groups that user is not a member of
      const suggestedGroupsList = await GroupService.getSuggestedGroups(5);
      setSuggestedGroups(suggestedGroupsList || []);
    } catch (err) {
      console.error('Failed to load suggested groups:', err);
      // Fallback to fetching all groups if the new endpoint fails
      try {
        const response = await GroupService.getAllGroups({ limit: 20 });
        setSuggestedGroups(response.content || []);
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
      }
    }
  };

  const loadMyGroups = async () => {
    try {
      setLoading(true);
      const myGroups = await GroupService.getMyGroups({ limit: 50 });
      setGroups(myGroups || []);
    } catch (err) {
      console.error('Failed to load groups:', err);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const getRandomColor = (index: number) => {
    return communityColors[index % communityColors.length];
  };

  const handleGroupClick = (groupId: string) => {
    navigate(`/forum/group/${groupId}`);
  };

  const handleGroupCreated = () => {
    loadMyGroups();
  };

  const handleJoinGroup = async (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    if (joiningGroupId) return;

    try {
      setJoiningGroupId(groupId);
      await GroupService.joinGroup({ groupId });
      // Refresh both lists to update UI
      await Promise.all([loadMyGroups(), loadSuggestedGroups()]);
    } catch (err) {
      console.error('Failed to join group:', err);
    } finally {
      setJoiningGroupId(null);
    }
  };

  return (
    <>
      <aside className="w-full flex-shrink-0">
        <div className="max-h-[calc(100vh-8rem)] lg:max-h-[calc(100vh-2rem)]">
          {/* Feed Options */}
          <div className="mb-4">
            {feedOptions.map((item) => {
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => {
                    navigate('/forum');
                    // Dispatch event to change sort filter in ForumFeed
                    if (item.id === 'all') {
                      window.dispatchEvent(new CustomEvent('changeSortFilter', { detail: 'all' }));
                    } else if (item.id === 'popular') {
                      window.dispatchEvent(new CustomEvent('changeSortFilter', { detail: 'popular' }));
                    } else if (item.id === 'new') {
                      window.dispatchEvent(new CustomEvent('changeSortFilter', { detail: 'new' }));
                    } else if (item.id === 'home') {
                      window.dispatchEvent(new CustomEvent('changeSortFilter', { detail: 'all' }));
                    }
                  }}
                  className="w-full justify-start h-10 px-3 rounded hover:bg-[#EAEDEF] text-sm font-normal text-[#1C1C1C]"
                >
                  <item.icon className="w-5 h-5 mr-3 text-[#878A8C]" />
                  {item.name}
                </Button>
              );
            })}
          </div>

          <div className="border-t border-[#EDEFF1] my-3"></div>

          {/* Suggested Categories */}
          <div className="mb-4 bg-white rounded-2xl border border-slate-200 p-2 shadow-sm">
            <button
              onClick={() => setShowRecent(!showRecent)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
            >
              <span>Gợi ý danh mục</span>
              {showRecent ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showRecent && (
              <div className="space-y-1 mt-1">
                {suggestedGroups.length > 0 ? (
                  <>
                    {(showAllSuggested ? suggestedGroups : suggestedGroups.slice(0, MAX_VISIBLE_GROUPS)).map((group: Group, index: number) => {
                      const categoryName = group.name || group.groupName || 'Danh mục';
                      const color = getRandomColor(index);
                      const isJoining = joiningGroupId === group.groupId;

                      return (
                        <div key={group.groupId} className="flex items-center gap-1 group/item">
                          <Button
                            variant="ghost"
                            onClick={() => handleGroupClick(group.groupId)}
                            className="flex-1 justify-start h-11 px-3 rounded-xl hover:bg-slate-100 text-sm font-medium text-slate-700 transition-all truncate"
                          >
                            <div
                              className="w-6 h-6 mr-3 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm"
                              style={{ backgroundColor: color }}
                            >
                              {categoryName[0]?.toUpperCase()}
                            </div>
                            <span className="truncate">{categoryName}</span>
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e: React.MouseEvent) => handleJoinGroup(e, group.groupId)}
                            disabled={isJoining}
                            className="h-8 w-8 rounded-full hover:bg-blue-50 text-slate-400 hover:text-blue-600 opacity-0 group-hover/item:opacity-100 transition-all"
                            title="Tham gia danh mục"
                          >
                            {isJoining ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      );
                    })}
                    {suggestedGroups.length > MAX_VISIBLE_GROUPS && (
                      <Button
                        variant="ghost"
                        onClick={() => setShowAllSuggested(!showAllSuggested)}
                        className="w-full justify-center h-9 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        {showAllSuggested ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-1" />
                            Ẩn bớt
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-1" />
                            Xem thêm {suggestedGroups.length - MAX_VISIBLE_GROUPS} danh mục
                          </>
                        )}
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4 px-3 text-sm text-slate-500">
                    Không có gợi ý nào
                  </div>
                )}
              </div>
            )}
          </div>

          {/* My Categories */}
          <div className="mb-4 bg-white rounded-2xl border border-slate-200 p-2 shadow-sm">
            <button
              onClick={() => setShowCommunities(!showCommunities)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
            >
              <span>Danh mục của bạn</span>
              {showCommunities ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showCommunities && (
              <div className="space-y-1 mt-1">
                {/* Create Category Button - Only visible for Admin */}
                {isAdmin && (
                  <Button
                    variant="ghost"
                    onClick={() => setShowCreateGroup(true)}
                    className="w-full justify-start h-11 px-3 rounded-xl hover:bg-blue-50 text-sm font-medium text-blue-600 transition-all"
                  >
                    <div className="w-6 h-6 mr-3 rounded-full border-2 border-dashed border-blue-400 flex items-center justify-center">
                      <Plus className="w-3 h-3 text-blue-500" />
                    </div>
                    Tạo danh mục
                  </Button>
                )}

                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  </div>
                ) : groups.length > 0 ? (
                  <>
                    {(showAllMyGroups ? groups : groups.slice(0, MAX_VISIBLE_GROUPS)).map((group, index) => {
                      const categoryName = group.groupName || group.name || 'Danh mục';
                      const color = getRandomColor(index);

                      return (
                        <Button
                          key={group.groupId}
                          variant="ghost"
                          onClick={() => handleGroupClick(group.groupId)}
                          className="w-full justify-start h-11 px-3 rounded-xl hover:bg-slate-100 text-sm font-medium text-slate-700 transition-all"
                        >
                          <div
                            className="w-6 h-6 mr-3 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                            style={{ backgroundColor: color }}
                          >
                            {categoryName[0]?.toUpperCase()}
                          </div>
                          <span className="truncate">{categoryName}</span>
                        </Button>
                      );
                    })}
                    {groups.length > MAX_VISIBLE_GROUPS && (
                      <Button
                        variant="ghost"
                        onClick={() => setShowAllMyGroups(!showAllMyGroups)}
                        className="w-full justify-center h-9 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        {showAllMyGroups ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-1" />
                            Ẩn bớt
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-1" />
                            Xem thêm {groups.length - MAX_VISIBLE_GROUPS} danh mục
                          </>
                        )}
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4 px-3 text-sm text-slate-500">
                    Bạn chưa tham gia danh mục nào
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 pb-4 px-3">
            <div className="text-xs text-slate-400 space-y-2">
              <div className="flex flex-wrap gap-x-3">
                <a href="#" className="hover:text-blue-500 transition-colors">Về chúng tôi</a>
                <a href="#" className="hover:text-blue-500 transition-colors">Điều khoản</a>
                <a href="#" className="hover:text-blue-500 transition-colors">Chính sách</a>
              </div>
              <p className="mt-2">&copy; 2025 Forum KMA</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Create Group Dialog */}
      <CreateGroupDialog
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={handleGroupCreated}
      />
    </>
  );
}