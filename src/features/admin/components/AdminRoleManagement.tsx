import { useState, useEffect } from 'react';
import { AdminService, Role } from '../services/admin.service';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Trash2,
  Loader2,
  RefreshCw,
  Edit,
  Plus,
  Shield,
} from 'lucide-react';

// Available permissions
const AVAILABLE_PERMISSIONS = [
  { id: 'role:manage', label: 'Quản lý vai trò', description: 'Tạo, sửa, xóa vai trò' },
  { id: 'user:ban', label: 'Cấm người dùng', description: 'Cấm người dùng khỏi hệ thống' },
  { id: 'user:unban', label: 'Bỏ cấm người dùng', description: 'Bỏ cấm người dùng' },
  { id: 'post:delete', label: 'Xóa bài viết', description: 'Xóa bất kỳ bài viết nào' },
  { id: 'comment:delete', label: 'Xóa bình luận', description: 'Xóa bất kỳ bình luận nào' },
  { id: 'group:delete', label: 'Xóa nhóm', description: 'Xóa bất kỳ nhóm nào' },
  { id: 'report:view', label: 'Xem báo cáo', description: 'Xem các báo cáo vi phạm' },
  { id: 'report:handle', label: 'Xử lý báo cáo', description: 'Xử lý các báo cáo vi phạm' },
];

export default function AdminRoleManagement() {
  const { toast } = useToast();

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ name: '', permissions: [] as string[] });
  const [saving, setSaving] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await AdminService.getAllRoles();
      setRoles(response || []);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải danh sách vai trò',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng nhập tên vai trò',
      });
      return;
    }

    setSaving(true);
    try {
      await AdminService.createRole({
        name: formData.name.toUpperCase(),
        permissions: formData.permissions,
      });
      toast({
        title: 'Thành công',
        description: 'Đã tạo vai trò mới',
      });
      setShowCreateDialog(false);
      setFormData({ name: '', permissions: [] });
      fetchRoles();
    } catch (error) {
      console.error('Create failed:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Tạo vai trò thất bại',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedRole || !formData.name.trim()) return;

    setSaving(true);
    try {
      await AdminService.updateRole(selectedRole.id, {
        name: formData.name.toUpperCase(),
        permissions: formData.permissions,
      });
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật vai trò',
      });
      setShowEditDialog(false);
      setSelectedRole(null);
      setFormData({ name: '', permissions: [] });
      fetchRoles();
    } catch (error) {
      console.error('Update failed:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Cập nhật vai trò thất bại',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRole) return;

    setSaving(true);
    try {
      await AdminService.deleteRole(selectedRole.id);
      toast({
        title: 'Thành công',
        description: `Đã xóa vai trò ${selectedRole.name}`,
      });
      setShowDeleteDialog(false);
      setSelectedRole(null);
      fetchRoles();
    } catch (error) {
      console.error('Delete failed:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Xóa vai trò thất bại',
      });
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      permissions: role.permissions || [],
    });
    setShowEditDialog(true);
  };

  const togglePermission = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p) => p !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const getRoleBadge = (roleName: string) => {
    switch (roleName.toUpperCase()) {
      case 'ADMIN':
        return <Badge className="bg-slate-800 text-white font-normal">{roleName}</Badge>;
      case 'MODERATOR':
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 font-normal">{roleName}</Badge>;
      case 'USER':
        return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-normal">{roleName}</Badge>;
      default:
        return <Badge variant="outline" className="font-normal">{roleName}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 rounded-xl">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Quản Lý Vai Trò</h1>
            <p className="text-sm text-slate-500">Quản lý vai trò và quyền hạn</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchRoles} disabled={loading} className="border-slate-300">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button onClick={() => {
            setFormData({ name: '', permissions: [] });
            setShowCreateDialog(true);
          }} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Tạo vai trò
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="font-semibold text-slate-700">Tên vai trò</TableHead>
                <TableHead className="font-semibold text-slate-700">Quyền hạn</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                    <p className="text-sm text-slate-500 mt-2">Đang tải...</p>
                  </TableCell>
                </TableRow>
              ) : roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12 text-slate-500">
                    Chưa có vai trò nào
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow key={role.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-slate-400" />
                        {getRoleBadge(role.name)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions?.length > 0 ? (
                          role.permissions.slice(0, 4).map((perm) => (
                            <Badge key={perm} variant="outline" className="text-xs font-normal text-slate-600">
                              {perm}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-slate-500">Không có quyền đặc biệt</span>
                        )}
                        {role.permissions?.length > 4 && (
                          <Badge variant="outline" className="text-xs font-normal text-slate-500">
                            +{role.permissions.length - 4}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(role)}
                          title="Chỉnh sửa"
                          className="h-8 w-8 hover:bg-slate-100"
                        >
                          <Edit className="h-4 w-4 text-slate-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedRole(role);
                            setShowDeleteDialog(true);
                          }}
                          title="Xóa vai trò"
                          className="h-8 w-8 hover:bg-red-50"
                          disabled={role.name.toUpperCase() === 'ADMIN' || role.name.toUpperCase() === 'USER'}
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
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowEditDialog(false);
          setSelectedRole(null);
          setFormData({ name: '', permissions: [] });
        }
      }}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-800">
              {showCreateDialog ? 'Tạo vai trò mới' : 'Chỉnh sửa vai trò'}
            </DialogTitle>
            <DialogDescription>
              {showCreateDialog
                ? 'Tạo một vai trò mới với các quyền hạn tùy chỉnh'
                : `Chỉnh sửa vai trò ${selectedRole?.name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roleName" className="text-slate-700">Tên vai trò</Label>
              <Input
                id="roleName"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="VD: MODERATOR"
                disabled={showEditDialog && (selectedRole?.name === 'ADMIN' || selectedRole?.name === 'USER')}
                className="border-slate-300"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">Quyền hạn</Label>
              <div className="border border-slate-200 rounded-lg p-3 space-y-3 max-h-[280px] overflow-y-auto bg-slate-50">
                {AVAILABLE_PERMISSIONS.map((perm) => (
                  <div key={perm.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={perm.id}
                      checked={formData.permissions.includes(perm.id)}
                      onCheckedChange={() => togglePermission(perm.id)}
                      className="mt-0.5"
                    />
                    <div className="grid gap-0.5">
                      <Label htmlFor={perm.id} className="font-medium cursor-pointer text-slate-800">
                        {perm.label}
                      </Label>
                      <p className="text-xs text-slate-500">
                        {perm.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setShowEditDialog(false);
              }}
              disabled={saving}
              className="border-slate-300"
            >
              Hủy
            </Button>
            <Button
              onClick={showCreateDialog ? handleCreate : handleEdit}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {showCreateDialog ? 'Tạo' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800">Xóa vai trò</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa vai trò <strong>{selectedRole?.name}</strong>?
              Người dùng có vai trò này sẽ được chuyển về vai trò mặc định.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving} className="border-slate-300">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
