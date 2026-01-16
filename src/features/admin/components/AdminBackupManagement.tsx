import { useState, useEffect } from 'react';
import { AdminService, BackupInfo, JobStatus } from '../services/admin.service';
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
  Database,
  HardDrive,
  Cloud,
  RefreshCw,
  Loader2,
  RotateCcw,
  Check,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function AdminBackupManagement() {
  const { toast } = useToast();

  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const response = await AdminService.getAllBackups();
      console.log('Backup response:', response);
      console.log('Backups array:', response.backups);
      setBackups(response.backups || []);
    } catch (error) {
      console.error('Failed to fetch backups:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải danh sách backup',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const handleTriggerBackup = async () => {
    setActionLoading(true);
    try {
      const response = await AdminService.triggerBackup();
      toast({
        title: 'Thành công',
        description: `Backup job đã được khởi tạo: ${response.jobId}`,
      });
      setActiveJobId(response.jobId);
      startPollingBackupStatus(response.jobId);
    } catch (error: any) {
      console.error('Failed to trigger backup:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error?.message || 'Không thể khởi tạo backup',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreClick = (backup: BackupInfo) => {
    setSelectedBackup(backup);
    setShowRestoreDialog(true);
  };

  const handleConfirmRestore = async () => {
    if (!selectedBackup) return;
    
    setActionLoading(true);
    setShowRestoreDialog(false);
    
    try {
      const response = await AdminService.triggerRestore(selectedBackup.date);
      toast({
        title: 'Thành công',
        description: `Restore job đã được khởi tạo: ${response.jobId}`,
      });
      setActiveJobId(response.jobId);
      startPollingRestoreStatus(response.jobId);
    } catch (error: any) {
      console.error('Failed to trigger restore:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error?.message || 'Không thể khởi tạo restore',
      });
    } finally {
      setActionLoading(false);
      setSelectedBackup(null);
    }
  };

  const startPollingBackupStatus = (jobId: string) => {
    // Clear existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Poll every 2 seconds
    const interval = setInterval(async () => {
      try {
        const status = await AdminService.getBackupStatus(jobId);
        setJobStatus(status);

        // Stop polling if completed or failed
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(interval);
          setPollingInterval(null);
          setActiveJobId(null);
          
          if (status.status === 'completed') {
            toast({
              title: 'Hoàn thành',
              description: 'Backup đã hoàn thành thành công',
            });
            fetchBackups(); // Refresh list
          } else {
            toast({
              variant: 'destructive',
              title: 'Lỗi',
              description: status.error || 'Backup thất bại',
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch backup status:', error);
      }
    }, 2000);

    setPollingInterval(interval);
  };

  const startPollingRestoreStatus = (jobId: string) => {
    // Clear existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Poll every 2 seconds
    const interval = setInterval(async () => {
      try {
        const status = await AdminService.getRestoreStatus(jobId);
        setJobStatus(status);

        // Stop polling if completed or failed
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(interval);
          setPollingInterval(null);
          setActiveJobId(null);
          
          if (status.status === 'completed') {
            toast({
              title: 'Hoàn thành',
              description: 'Restore đã hoàn thành thành công',
            });
            fetchBackups(); // Refresh list
          } else {
            toast({
              variant: 'destructive',
              title: 'Lỗi',
              description: status.error || 'Restore thất bại',
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch restore status:', error);
      }
    }, 2000);

    setPollingInterval(interval);
  };

  const formatSize = (size: string) => {
    return size || 'N/A';
  };

  const parseBackupDate = (dateStr: string) => {
    // Format: YYYY-MM-DD_HH-MM-SS
    const [datePart, timePart] = dateStr.split('_');
    const [year, month, day] = datePart.split('-');
    const [hour, minute, second] = timePart.split('-');
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    );
  };

  const getLocationBadges = (location: string) => {
    const hasLocal = location.includes('local');
    const hasCloud = location.includes('cloud');

    return (
      <div className="flex gap-2">
        {hasLocal && (
          <Badge variant="secondary" className="gap-1">
            <HardDrive className="h-3 w-3" />
            Local
          </Badge>
        )}
        {hasCloud && (
          <Badge variant="default" className="gap-1">
            <Cloud className="h-3 w-3" />
            Cloud
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with Create Backup button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Quản lý Backup
            </CardTitle>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={fetchBackups}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
              <Button
                type="button"
                onClick={handleTriggerBackup}
                disabled={actionLoading || !!activeJobId}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Tạo Backup
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Job Status Card */}
      {activeJobId && jobStatus && (
        <Card className="border-blue-500">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="font-medium">Job ID: {activeJobId}</span>
                </div>
                <Badge variant={jobStatus.status === 'in_progress' ? 'default' : 'secondary'}>
                  {jobStatus.status}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{jobStatus.message || 'Processing...'}</span>
                  <span>{jobStatus.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${jobStatus.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backups Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Chưa có backup nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Kích thước</TableHead>
                  <TableHead>MongoDB</TableHead>
                  <TableHead>PostgreSQL</TableHead>
                  <TableHead>MinIO</TableHead>
                  <TableHead>Vị trí</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => {
                  const backupDate = parseBackupDate(backup.date);
                  return (
                    <TableRow key={backup.date}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{backup.date}</div>
                          <div className="text-xs text-gray-500">
                            {formatDistanceToNow(backupDate, {
                              addSuffix: true,
                              locale: vi,
                            })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatSize(backup.size)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatSize(backup.mongoSize)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatSize(backup.postgresSize)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatSize(backup.minioSize)}
                      </TableCell>
                      <TableCell>{getLocationBadges(backup.location)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          onClick={() => handleRestoreClick(backup)}
                          variant="outline"
                          size="sm"
                          disabled={actionLoading || !!activeJobId}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Xác nhận Restore
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Bạn có chắc chắn muốn restore hệ thống về bản backup này?
              </p>
              {selectedBackup && (
                <div className="bg-gray-100 p-3 rounded space-y-1 text-sm">
                  <p>
                    <strong>Ngày backup:</strong> {selectedBackup.date}
                  </p>
                  <p>
                    <strong>Kích thước:</strong> {selectedBackup.size}
                  </p>
                  <p>
                    <strong>Vị trí:</strong> {selectedBackup.location}
                  </p>
                </div>
              )}
              <p className="text-red-600 font-medium">
                ⚠️ Cảnh báo: Hành động này sẽ ghi đè toàn bộ dữ liệu hiện tại!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRestore}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Xác nhận Restore
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
