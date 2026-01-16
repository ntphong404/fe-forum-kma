import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminService, PaginatedResponse } from '../services/admin.service';
import { User } from '@/interfaces/auth.types';
import { useToast } from '@/components/ui/use-toast';
import { debounce } from '@/lib/utils';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Ban,
  UserCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Eye,
  Users,
} from 'lucide-react';

export default function AdminUserManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'ban' | 'unban' | 'delete' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const pageSize = 10;
  const debouncedSearchRef = useRef<(query: string, pageNum: number) => void>();

  const fetchUsers = useCallback(async (currentPage: number = 0, searchTerm: string = '', status: string = '') => {
    setLoading(true);
    try {
      let response: PaginatedResponse<User>;
      if (searchTerm.trim()) {
        response = await AdminService.searchUsers(searchTerm, currentPage, pageSize);
      } else {
        response = await AdminService.getAllUsers(currentPage, pageSize, status || undefined);
      }
      setUsers(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải danh sách người dùng',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Initialize debounced search function
  useEffect(() => {
    debouncedSearchRef.current = debounce((query: string, pageNum: number) => {
      fetchUsers(pageNum, query, statusFilter);
    }, 300); // 300ms delay
  }, [fetchUsers, statusFilter]);

  // Fetch users when page changes
  useEffect(() => {
    if (searchQuery.trim()) {
      debouncedSearchRef.current?.(searchQuery, page);
    } else {
      fetchUsers(page, '', statusFilter);
    }
  }, [page, searchQuery, statusFilter, fetchUsers]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setPage(0); // Reset to first page when search query changes
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setPage(0); // Reset to first page when filter changes
  };

  const handleAction = async () => {
    if (!selectedUser || !actionType) return;

    console.log('Action:', actionType, 'User:', selectedUser);
    console.log('User ID:', selectedUser.userId);

    setActionLoading(true);
    try {
      switch (actionType) {
        case 'ban':
          await AdminService.banUser(selectedUser.userId);
          toast({
            title: 'Thành công',
            description: `Đã cấm người dùng ${selectedUser.username}`,
          });
          break;
        case 'unban':
          await AdminService.unbanUser(selectedUser.userId);
          toast({
            title: 'Thành công',
            description: `Đã bỏ cấm người dùng ${selectedUser.username}`,
          });
          break;
        case 'delete':
          await AdminService.deleteUser(selectedUser.userId);
          toast({
            title: 'Thành công',
            description: `Đã xóa người dùng ${selectedUser.username}`,
          });
          break;
      }
      fetchUsers();
    } catch (error: any) {
      console.error('Action failed:', error);
      const errorMessage = error?.message || 'Thao tác thất bại';
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: errorMessage,
      });
    } finally {
      setActionLoading(false);
      setSelectedUser(null);
      setActionType(null);
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.banned || user.userStatus === 'BANNED') {
      return <Badge className="bg-red-600 text-white font-normal hover:bg-red-700">Bị cấm</Badge>;
    }
    if (user.userStatus === 'PENDING') {
      return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 font-normal">Chờ xác thực</Badge>;
    }
    return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-normal">Hoạt động</Badge>;
  };

  const getRoleBadge = (user: User) => {
    const roleName = user.roleName || user.roles?.[0] || 'USER';
    switch (roleName.toUpperCase()) {
      case 'ADMIN':
        return <Badge className="bg-slate-800 text-white font-normal">{roleName}</Badge>;
      case 'MODERATOR':
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 font-normal">{roleName}</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-600 font-normal">{roleName}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500 rounded-xl">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Quản Lý Người Dùng</h1>
            <p className="text-sm text-slate-500">{totalElements} người dùng</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchUsers(page, searchQuery)}
          disabled={loading}
          className="border-slate-300"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Search */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm theo tên, email..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 border-slate-300"
              />
            </div>
            {searchQuery && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery('');
                  setPage(0);
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={statusFilter === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange('')}
              className={statusFilter === '' ? 'bg-blue-500 hover:bg-blue-600' : 'border-slate-300'}
            >
              Tất cả
            </Button>
            <Button
              variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange('ACTIVE')}
              className={statusFilter === 'ACTIVE' ? 'bg-emerald-500 hover:bg-emerald-600' : 'border-slate-300'}
            >
              Hoạt động
            </Button>
            <Button
              variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange('PENDING')}
              className={statusFilter === 'PENDING' ? 'bg-amber-500 hover:bg-amber-600' : 'border-slate-300'}
            >
              Chờ xác thực
            </Button>
            <Button
              variant={statusFilter === 'BANNED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange('BANNED')}
              className={statusFilter === 'BANNED' ? 'bg-red-500 hover:bg-red-600' : 'border-slate-300'}
            >
              Bị cấm
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="font-semibold text-slate-700">Người dùng</TableHead>
                <TableHead className="font-semibold text-slate-700">Email</TableHead>
                <TableHead className="font-semibold text-slate-700">Vai trò</TableHead>
                <TableHead className="font-semibold text-slate-700">Trạng thái</TableHead>
                <TableHead className="font-semibold text-slate-700">Ngày sinh</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                    <p className="text-sm text-slate-500 mt-2">Đang tải...</p>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                    Không tìm thấy người dùng nào
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.userId} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <span className="text-sm font-medium text-slate-600">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-slate-500">@{user.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user)}</TableCell>
                    <TableCell>{getStatusBadge(user)}</TableCell>
                    <TableCell className="text-slate-600">{user.dob ? new Date(user.dob).toLocaleDateString('vi-VN') : '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/profile/${user.userId}`)}
                          title="Xem hồ sơ"
                          className="h-8 w-8 hover:bg-slate-100"
                        >
                          <Eye className="h-4 w-4 text-slate-600" />
                        </Button>
                        {user.banned || user.userStatus === 'BANNED' ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType('unban');
                            }}
                            title="Bỏ cấm"
                            className="h-8 w-8 hover:bg-emerald-50"
                          >
                            <UserCheck className="h-4 w-4 text-emerald-600" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType('ban');
                            }}
                            title="Cấm người dùng"
                            className="h-8 w-8 hover:bg-amber-50"
                          >
                            <Ban className="h-4 w-4 text-amber-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(user);
                            setActionType('delete');
                          }}
                          title="Xóa người dùng"
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

      {/* Confirmation Dialog */}
      <AlertDialog open={!!selectedUser && !!actionType} onOpenChange={() => {
        setSelectedUser(null);
        setActionType(null);
      }}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800">
              {actionType === 'ban' && 'Cấm người dùng'}
              {actionType === 'unban' && 'Bỏ cấm người dùng'}
              {actionType === 'delete' && 'Xóa người dùng'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'ban' && (
                <>Bạn có chắc chắn muốn cấm người dùng <strong>{selectedUser?.username}</strong>? Người dùng sẽ không thể đăng nhập.</>
              )}
              {actionType === 'unban' && (
                <>Bạn có chắc chắn muốn bỏ cấm người dùng <strong>{selectedUser?.username}</strong>? Người dùng sẽ có thể đăng nhập lại.</>
              )}
              {actionType === 'delete' && (
                <>Bạn có chắc chắn muốn xóa người dùng <strong>{selectedUser?.username}</strong>? Hành động này không thể hoàn tác.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading} className="border-slate-300">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={actionLoading}
              className={actionType === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
