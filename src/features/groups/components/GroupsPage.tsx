import { useState, useEffect } from 'react';
import { Search, Plus, Loader2, Filter, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import GroupCard from './GroupCard';
import { Group, CreateGroupRequest } from '@/interfaces/post.types';
import { GroupVisibility } from '@/interfaces/group.types';
import { GroupService } from '@/features/groups/services/group.service';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useStore';

export default function GroupsPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create group form
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupVisibility, setNewGroupVisibility] = useState<GroupVisibility>(
    GroupVisibility.PUBLIC
  );

  useEffect(() => {
    loadGroups();
    loadMyGroups();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadGroups();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await GroupService.getAllGroups({ page: 0, limit: 50, search: searchQuery });
      setAllGroups(response.content || []);
    } catch (error: any) {
      console.error('Failed to load groups:', error);
      toast.error(error.message || 'Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  const loadMyGroups = async () => {
    try {
      const groups = await GroupService.getMyGroups();
      setMyGroups(groups || []);
    } catch (error: any) {
      console.error('Failed to load my groups:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }

    try {
      setCreating(true);
      const request: CreateGroupRequest = {
        groupName: newGroupName,
        description: newGroupDescription,
        visibility: newGroupVisibility,
      };

      await GroupService.createGroup(request);
      toast.success('Tạo danh mục thành công!');

      // Reset form
      setNewGroupName('');
      setNewGroupDescription('');
      setNewGroupVisibility(GroupVisibility.PUBLIC);
      setCreateDialogOpen(false);

      // Reload groups
      loadGroups();
      loadMyGroups();
    } catch (error: any) {
      toast.error(error.message || 'Không thể tạo danh mục');
    } finally {
      setCreating(false);
    }
  };

  const myGroupIds = new Set(myGroups.map((g) => g.groupId));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Danh mục bài viết</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tìm kiếm và tham gia các danh mục bài viết
          </p>
        </div>

        {isAdmin && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Tạo danh mục
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo danh mục mới</DialogTitle>
                <DialogDescription>
                  Tạo danh mục để phân loại các bài viết theo chủ đề
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Tên danh mục *</Label>
                  <Input
                    id="groupName"
                    placeholder="Nhập tên danh mục"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    placeholder="Mô tả về danh mục"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visibility">Quyền riêng tư</Label>
                  <Select
                    value={newGroupVisibility}
                    onValueChange={(value) =>
                      setNewGroupVisibility(value as GroupVisibility)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={GroupVisibility.PUBLIC}>
                        Công khai - Ai cũng có thể tham gia
                      </SelectItem>
                      <SelectItem value={GroupVisibility.PRIVATE}>
                        Riêng tư - Chỉ tham gia khi được mời
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={creating}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleCreateGroup}
                  disabled={creating}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    'Tạo danh mục'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm danh mục..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="all">
            <FolderOpen className="w-4 h-4 mr-2" />
            Tất cả danh mục
          </TabsTrigger>
          <TabsTrigger value="my-groups">
            <Filter className="w-4 h-4 mr-2" />
            Danh mục của tôi ({myGroups.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : allGroups.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              {searchQuery
                ? 'Không tìm thấy danh mục nào'
                : 'Chưa có danh mục nào'}
            </div>
          ) : (
            allGroups.map((group) => (
              <GroupCard
                key={group.groupId}
                group={group}
                isMember={myGroupIds.has(group.groupId)}
                onJoinSuccess={() => {
                  loadMyGroups();
                  loadGroups();
                }}
                onLeaveSuccess={() => {
                  loadMyGroups();
                  loadGroups();
                }}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="my-groups" className="space-y-3">
          {myGroups.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Bạn chưa tham gia danh mục nào
            </div>
          ) : (
            myGroups.map((group) => (
              <GroupCard
                key={group.groupId}
                group={group}
                isMember={true}
                onLeaveSuccess={() => {
                  loadMyGroups();
                  loadGroups();
                }}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
