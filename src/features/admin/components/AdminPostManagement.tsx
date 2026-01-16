import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminService, AdminPost, PaginatedResponse } from '../services/admin.service';
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
  MessageSquare,
  Heart,
  FileText,
  Image,
  File,
} from 'lucide-react';

export default function AdminPostManagement() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedPost, setSelectedPost] = useState<AdminPost | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const pageSize = 10;

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const response: PaginatedResponse<AdminPost> = await AdminService.getAllPosts(page, pageSize, searchQuery);
      setPosts(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải danh sách bài viết',
      });
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchPosts();
  };

  const handleDelete = async () => {
    if (!selectedPost) return;

    setDeleteLoading(true);
    try {
      await AdminService.deletePost(selectedPost.postId);
      toast({
        title: 'Thành công',
        description: 'Đã xóa bài viết',
      });
      fetchPosts();
    } catch (error) {
      console.error('Delete failed:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Xóa bài viết thất bại',
      });
    } finally {
      setDeleteLoading(false);
      setSelectedPost(null);
      setShowDeleteDialog(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-normal">Đã đăng</Badge>;
      case 'PENDING':
        return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 font-normal">Chờ duyệt</Badge>;
      case 'DELETED':
        return <Badge variant="destructive" className="font-normal">Đã xóa</Badge>;
      default:
        return <Badge variant="outline" className="font-normal">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'IMAGE':
        return <Image className="h-4 w-4 text-blue-500" />;
      case 'DOC':
        return <File className="h-4 w-4 text-amber-500" />;
      default:
        return <FileText className="h-4 w-4 text-slate-500" />;
    }
  };

  const truncateContent = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500 rounded-xl">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Quản Lý Bài Viết</h1>
            <p className="text-sm text-slate-500">{totalElements} bài viết</p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchPosts} disabled={loading} className="border-slate-300">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Search */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm bài viết..."
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
                <TableHead className="w-[50px] font-semibold text-slate-700">Loại</TableHead>
                <TableHead className="font-semibold text-slate-700">Nội dung</TableHead>
                <TableHead className="font-semibold text-slate-700">Tác giả</TableHead>
                <TableHead className="font-semibold text-slate-700">Nhóm</TableHead>
                <TableHead className="font-semibold text-slate-700">Tương tác</TableHead>
                <TableHead className="font-semibold text-slate-700">Trạng thái</TableHead>
                <TableHead className="font-semibold text-slate-700">Ngày tạo</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                    <p className="text-sm text-slate-500 mt-2">Đang tải...</p>
                  </TableCell>
                </TableRow>
              ) : posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                    Không tìm thấy bài viết nào
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post) => (
                  <TableRow key={post.postId} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {getTypeIcon(post.type)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[250px]">
                        {post.title && (
                          <p className="font-medium text-slate-800 truncate">{post.title}</p>
                        )}
                        <p className="text-sm text-slate-500 truncate">
                          {truncateContent(post.content, 60)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{post.authorName || post.authorId}</TableCell>
                    <TableCell className="text-slate-600">{post.groupName || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5" />
                          {post.reactionCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {post.commentCount}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(post.status)}</TableCell>
                    <TableCell className="text-slate-600">
                      {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/forum/post/${post.postId}`)}
                          title="Xem bài viết"
                          className="h-8 w-8 hover:bg-slate-100"
                        >
                          <Eye className="h-4 w-4 text-slate-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPost(post);
                            setShowDeleteDialog(true);
                          }}
                          title="Xóa bài viết"
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
            <AlertDialogTitle className="text-slate-800">Xóa bài viết</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.
              {selectedPost && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm font-medium text-slate-800">{selectedPost.title || 'Không có tiêu đề'}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {truncateContent(selectedPost.content, 150)}
                  </p>
                </div>
              )}
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
    </div>
  );
}
