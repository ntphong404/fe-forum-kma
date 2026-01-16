import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminService, AdminGroup, PaginatedResponse } from '../services/admin.service';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Eye,
  Users,
  FileText,
  Globe,
  Lock,
  UsersRound,
  Plus,
} from 'lucide-react';
import AdminCreateGroupDialog from './AdminCreateGroupDialog';

export default function AdminGroupManagement() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedGroup, setSelectedGroup] = useState<AdminGroup | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const pageSize = 10;

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const response: PaginatedResponse<AdminGroup> = await AdminService.getAllGroups(page, pageSize);
      const groupList = response.content || [];
      setGroups(groupList);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải danh sách danh mục',
      });
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchGroups();
  };

  const handleDelete = async () => {
    if (!selectedGroup) return;

    setDeleteLoading(true);
    try {
      await AdminService.deleteGroup(selectedGroup.id);
      toast({
        title: 'Thành công',
        description: `Đã xóa danh mục ${selectedGroup.name}`,
      });
      fetchGroups();
    } catch (error) {
      console.error('Delete failed:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Xóa danh mục thất bại',
      });
    } finally {
      setDeleteLoading(false);
      setSelectedGroup(null);
      setShowDeleteDialog(false);
    }
  };

  const getVisibilityBadge = (visibility: string) => {
    switch (visibility) {
      case 'PUBLIC':
        return (
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-normal">
            <Globe className="h-3 w-3 mr-1" />
            Công khai
          </Badge>
        );
      case 'PRIVATE':
        return (
          <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 font-normal">
            <Lock className="h-3 w-3 mr-1" />
            Riêng tư
          </Badge>
        );
      default:
        return <Badge variant="outline" className="font-normal">{visibility}</Badge>;
    }
  };

  const filteredGroups = searchQuery
    ? groups.filter(
      (g) =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : groups;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500 rounded-xl">
            <UsersRound className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Quản Lý Danh Mục Bài Viết</h1>
            <p className="text-sm text-slate-500">{totalElements} danh mục</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Tạo danh mục
          </Button>
          <Button variant="outline" onClick={fetchGroups} disabled={loading} className="border-slate-300">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm danh mục..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-slate-300"
              />
            </div>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Tìm kiếm</Button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="font-semibold text-slate-700">Tên danh mục</TableHead>
                <TableHead className="font-semibold text-slate-700">Mô tả</TableHead>
                <TableHead className="font-semibold text-slate-700">Tham gia</TableHead>
                <TableHead className="font-semibold text-slate-700">Bài viết</TableHead>
                <TableHead className="font-semibold text-slate-700">Hiển thị</TableHead>
                <TableHead className="font-semibold text-slate-700">Ngày tạo</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                    <p className="text-sm text-slate-500 mt-2">Đang tải...</p>
                  </TableCell>
                </TableRow>
              ) : filteredGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    Không tìm thấy danh mục nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredGroups.map((group) => (
                  <TableRow key={group.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <p className="font-medium text-slate-800">{group.name}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-500 max-w-[200px] truncate">
                        {group.description || '-'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Users className="h-4 w-4 text-slate-400" />
                        {group.memberCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <FileText className="h-4 w-4 text-slate-400" />
                        {group.postCount ?? 0}
                      </div>
                    </TableCell>
                    <TableCell>{getVisibilityBadge(group.visibility)}</TableCell>
                    <TableCell className="text-slate-600">
                      {new Date(group.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/forum/group/${group.id}`)}
                          title="Xem danh mục"
                          className="h-8 w-8 hover:bg-slate-100"
                        >
                          <Eye className="h-4 w-4 text-slate-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedGroup(group);
                            setShowDeleteDialog(true);
                          }}
                          title="Xóa danh mục"
                          className="h-8 w-8 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Trang <span className="font-medium">{page + 1}</span> / <span className="font-medium">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="border-slate-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="border-slate-300"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800">Xóa danh mục</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa danh mục <strong>{selectedGroup?.name}</strong>?
              Tất cả bài viết và người tham gia trong danh mục sẽ bị xóa. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading} className="border-slate-300">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Group Dialog */}
      <AdminCreateGroupDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onGroupCreated={fetchGroups}
      />
    </div>
  );
}
