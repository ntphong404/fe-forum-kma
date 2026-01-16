import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminService, ReportResponse, PageResponse } from '../services/admin.service';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Loader2,
  RefreshCw,
  Eye,
  Shield,
  Check,
  X,
  AlertCircle,
  Gavel,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function AdminReportManagement() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING'>('PENDING');

  const [selectedReport, setSelectedReport] = useState<ReportResponse | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolveDecision, setResolveDecision] = useState<'RESOLVED' | 'REJECTED'>('RESOLVED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolveLoading, setResolveLoading] = useState(false);

  const pageSize = 10;

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      let response: PageResponse<ReportResponse>;
      if (filterStatus === 'PENDING') {
        response = await AdminService.getPendingReports(page, pageSize);
      } else {
        response = await AdminService.getAllReports(page, pageSize);
      }
      setReports(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (error: any) {
      console.error('Failed to fetch reports:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error?.message || 'Không thể tải danh sách báo cáo',
      });
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, toast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleResolve = async () => {
    if (!selectedReport) return;

    setResolveLoading(true);
    try {
      await AdminService.resolvePostReports(
        selectedReport.postId,
        resolveDecision,
        resolutionNotes
      );
      toast({
        title: 'Thành công',
        description: `Đã xử lý báo cáo với quyết định: ${resolveDecision === 'RESOLVED' ? 'Phê duyệt' : 'Từ chối'}`,
      });
      setShowResolveDialog(false);
      setShowDetailsDialog(false);
      setResolveDecision('RESOLVED');
      setResolutionNotes('');
      fetchReports();
    } catch (error: any) {
      console.error('Resolve failed:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error?.message || 'Xử lý báo cáo thất bại',
      });
    } finally {
      setResolveLoading(false);
    }
  };

  const getReasonBadge = (reason: string) => {
    const reasonColors: Record<string, string> = {
      'SPAM': 'bg-blue-50 text-blue-700 border-blue-200',
      'HARASSMENT': 'bg-red-50 text-red-700 border-red-200',
      'OFFENSIVE_CONTENT': 'bg-purple-50 text-purple-700 border-purple-200',
      'MISINFORMATION': 'bg-orange-50 text-orange-700 border-orange-200',
      'COPYRIGHT': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'ADULT_CONTENT': 'bg-pink-50 text-pink-700 border-pink-200',
      'VIOLENCE': 'bg-red-100 text-red-800 border-red-300',
      'OTHER': 'bg-slate-50 text-slate-700 border-slate-200',
    };

    const reasonLabels: Record<string, string> = {
      'SPAM': 'Spam',
      'HARASSMENT': 'Qu\u1EA5y r\u1ED1i/T\u1EA5n c\u00F4ng',
      'OFFENSIVE_CONTENT': 'N\u1ED9i dung x\u00FAc ph\u1EA1m',
      'MISINFORMATION': 'Th\u00F4ng tin sai l\u1EBCch',
      'COPYRIGHT': 'Vi ph\u1EA1m b\u1EA3n quy\u1EC1n',
      'ADULT_CONTENT': 'N\u1ED9i dung ng\u01B0\u1EDDi l\u1EDBn',
      'VIOLENCE': 'B\u1EA1o l\u1EF1c',
      'OTHER': 'Kh\u00E1c',
    };

    return (
      <Badge variant="outline" className={`font-normal ${reasonColors[reason] || ''}`}>
        {reasonLabels[reason] || reason}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 font-normal">Chờ xử lý</Badge>;
      case 'RESOLVED':
        return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-normal">Đã phê duyệt</Badge>;
      case 'REJECTED':
        return <Badge variant="secondary" className="bg-slate-50 text-slate-700 border-slate-200 font-normal">Từ chối</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
            <h1 className="text-xl font-bold text-slate-800">Quản Lý Báo Cáo</h1>
            <p className="text-sm text-slate-500">{totalElements} báo cáo</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchReports()}
          disabled={loading}
          className="border-slate-300"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Filter */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'PENDING' ? 'default' : 'outline'}
              onClick={() => {
                setFilterStatus('PENDING');
                setPage(0);
              }}
              className={filterStatus === 'PENDING' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-slate-300'}
            >
              Chờ xử lý
            </Button>
            <Button
              variant={filterStatus === 'ALL' ? 'default' : 'outline'}
              onClick={() => {
                setFilterStatus('ALL');
                setPage(0);
              }}
              className={filterStatus === 'ALL' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-slate-300'}
            >
              Tất cả
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
                <TableHead className="font-semibold text-slate-700">Bài viết</TableHead>
                <TableHead className="font-semibold text-slate-700">Lý do</TableHead>
                <TableHead className="font-semibold text-slate-700">Người báo cáo</TableHead>
                <TableHead className="font-semibold text-slate-700">Trạng thái</TableHead>
                <TableHead className="font-semibold text-slate-700">Ngày báo cáo</TableHead>
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
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                    Không có báo cáo nào
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.reportId} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 truncate">
                            {report.post?.title || 'Bài viết đã xóa'}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{report.postId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getReasonBadge(report.reason)}</TableCell>
                    <TableCell className="text-slate-600">{report.reportedByName || 'Ẩn danh'}</TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell className="text-slate-600 text-sm">
                      {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/forum/post/${report.postId}`)}
                          title="Xem bài viết"
                          className="h-8 w-8 hover:bg-slate-100"
                        >
                          <Eye className="h-4 w-4 text-slate-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedReport(report);
                            setShowDetailsDialog(true);
                          }}
                          title="Xem chi tiết & Xử lý báo cáo"
                          className="h-8 w-8 hover:bg-amber-50"
                        >
                          <Gavel className="h-4 w-4 text-amber-600" />
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
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="border-slate-300"
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 bg-white border border-gray-300 shadow-2xl rounded-lg">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-2xl font-bold text-gray-900">Chi tiết báo cáo</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-6 py-4 overflow-y-auto flex-1">
              {/* Status and Reason Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Trạng thái</label>
                  <div>{getStatusBadge(selectedReport.status)}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Lý do báo cáo</label>
                  <div>{getReasonBadge(selectedReport.reason)}</div>
                </div>
              </div>

              {/* Reporter Info */}
              <div className="border-t pt-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Thông tin người báo cáo</h3>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-sm text-slate-600 mb-1">Tên người dùng</p>
                  <p className="text-base font-medium text-slate-800">{selectedReport.reportedByName || 'Ẩn danh'}</p>
                </div>
              </div>

              {/* Report Description */}
              <div className="border-t pt-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Nội dung báo cáo</h3>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">
                    {selectedReport.description || 'Không có mô tả'}
                  </p>
                </div>
              </div>

              {/* Post Info */}
              {selectedReport.post && (
                <div className="border-t pt-4 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700">Thông tin bài viết</h3>
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Tiêu đề</p>
                      <p className="text-sm font-medium text-slate-900">{selectedReport.post.title}</p>
                    </div>
                    <div className="border-t border-amber-200 pt-3">
                      <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Nội dung</p>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap line-clamp-4">
                        {selectedReport.post.content}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Resolution Info */}
              {selectedReport.status !== 'PENDING' && (
                <div className="border-t pt-4 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700">Thông tin xử lý</h3>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Xử lý bởi</p>
                      <p className="text-sm text-slate-800">{selectedReport.resolvedBy || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Ghi chú xử lý</p>
                      <p className="text-sm text-slate-800 bg-white p-3 rounded border border-green-200">
                        {selectedReport.resolutionNotes || 'Không có ghi chú'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="border-t pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">Ngày báo cáo</p>
                  <p className="text-sm text-slate-800">
                    {new Date(selectedReport.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">Cập nhật lần cuối</p>
                  <p className="text-sm text-slate-800">
                    {new Date(selectedReport.updatedAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="border-t pt-4 flex-shrink-0">
            {selectedReport?.status === 'PENDING' && (
              <div className="w-full space-y-4">
                {/* Resolution Notes */}
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">Ghi chú xử lý (tùy chọn)</p>
                  <Textarea
                    placeholder="Ghi chú về quyết định này..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="min-h-20"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailsDialog(false)}
                    disabled={resolveLoading}
                  >
                    Đóng
                  </Button>
                  <Button
                    onClick={() => {
                      setResolveDecision('REJECTED');
                      handleResolve();
                    }}
                    disabled={resolveLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {resolveLoading && resolveDecision === 'REJECTED' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Check className="h-4 w-4 mr-2" />
                    Từ chối báo cáo
                  </Button>
                  <Button
                    onClick={() => {
                      setResolveDecision('RESOLVED');
                      handleResolve();
                    }}
                    disabled={resolveLoading}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {resolveLoading && resolveDecision === 'RESOLVED' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <X className="h-4 w-4 mr-2" />
                    Phê duyệt (Xóa bài)
                  </Button>
                </div>
              </div>
            )}
            {selectedReport?.status !== 'PENDING' && (
              <Button
                variant="outline"
                onClick={() => setShowDetailsDialog(false)}
              >
                Đóng
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <AlertDialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <AlertDialogContent className="bg-white border border-gray-300 shadow-2xl rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-gray-900">Xử lý báo cáo</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Chọn quyết định cho báo cáo này
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedReport && (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Quyết định</p>
                <div className="flex gap-2">
                  <Button
                    variant={resolveDecision === 'RESOLVED' ? 'default' : 'outline'}
                    onClick={() => setResolveDecision('RESOLVED')}
                    className={resolveDecision === 'RESOLVED' ? 'bg-red-600 hover:bg-red-700' : 'border-slate-300'}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Phê duyệt (Xóa bài viết)
                  </Button>
                  <Button
                    variant={resolveDecision === 'REJECTED' ? 'default' : 'outline'}
                    onClick={() => setResolveDecision('REJECTED')}
                    className={resolveDecision === 'REJECTED' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-slate-300'}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Từ chối báo cáo
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Ghi chú (tùy chọn)</p>
                <Textarea
                  placeholder="Ghi chú về quyết định này..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="min-h-24"
                />
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={resolveLoading}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResolve}
              disabled={resolveLoading}
              className={resolveDecision === 'RESOLVED' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
            >
              {resolveLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
