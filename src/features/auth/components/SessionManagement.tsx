import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  Laptop, 
  Chrome, 
  Loader2, 
  MapPin, 
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SessionService } from '../services/session.service';
import type { Session } from '@/interfaces/auth.types';
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

export default function SessionManagement() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [_revokingAll, setRevokingAll] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);

  useEffect(() => {
    if (isExpanded && sessions.length === 0) {
      loadSessions();
    }
  }, [isExpanded]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await SessionService.getAllSessions();
      setSessions(data || []);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách phiên');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setRevoking(sessionId);
      setError('');
      setSuccess('');
      
      await SessionService.revokeSession(sessionId);
      
      setSuccess('Đã thu hồi phiên thành công');
      setSessions(sessions.filter(s => s.sessionId !== sessionId));
    } catch (err: any) {
      setError(err.message || 'Không thể thu hồi phiên');
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAll = async () => {
    try {
      setRevokingAll(true);
      setError('');
      setSuccess('');
      
      await SessionService.revokeAllSessions();
      
      setSuccess('Đã thu hồi tất cả phiên. Bạn sẽ được đăng xuất.');
      setSessions([]);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Không thể thu hồi tất cả phiên');
    } finally {
      setRevokingAll(false);
      setShowRevokeAllDialog(false);
    }
  };

  const getDeviceIcon = (deviceInfo: Session['deviceInfo']) => {
    const deviceName = deviceInfo.deviceName?.toLowerCase() || '';
    const userAgent = deviceInfo.userAgent?.toLowerCase() || '';
    
    if (deviceName.includes('mobile') || userAgent.includes('mobile')) {
      return <Smartphone className="w-5 h-5" />;
    }
    if (deviceName.includes('tablet') || userAgent.includes('tablet')) {
      return <Tablet className="w-5 h-5" />;
    }
    if (deviceName.includes('laptop')) {
      return <Laptop className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Không rõ';
    try {
      return new Date(dateString).toLocaleString('vi-VN');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="border rounded-lg">
      {/* Collapsed Header - Click to expand */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isExpanded ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Quản lý phiên đăng nhập</h4>
            <p className="text-sm text-gray-500">
              {loading ? 'Đang tải...' : sessions.length > 0 ? `${sessions.length} thiết bị đang đăng nhập` : 'Xem danh sách thiết bị'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-red-600" />
              <span className="ml-2">Đang tải...</span>
            </div>
          ) : (
            <>
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 text-green-900 border-green-200">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Không có phiên đăng nhập nào
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.sessionId}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                          {getDeviceIcon(session.deviceInfo)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">
                              {session.deviceInfo.deviceName || 'Thiết bị không xác định'}
                            </h4>
                          </div>
                          
                          <div className="mt-1 space-y-1 text-sm text-gray-600">
                            {session.deviceInfo.browser && (
                              <div className="flex items-center space-x-2">
                                <Chrome className="w-3 h-3" />
                                <span>{session.deviceInfo.browser}</span>
                                {session.deviceInfo.os && <span>• {session.deviceInfo.os}</span>}
                              </div>
                            )}
                            
                            {session.deviceInfo.ipAddress && (
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-3 h-3" />
                                <span>{session.deviceInfo.ipAddress}</span>
                                {session.deviceInfo.location && <span>• {session.deviceInfo.location}</span>}
                              </div>
                            )}
                            
                            {session.deviceInfo.lastAccessTime && (
                              <div className="flex items-center space-x-2">
                                <Clock className="w-3 h-3" />
                                <span>Truy cập lần cuối: {formatDate(session.deviceInfo.lastAccessTime)}</span>
                              </div>
                            )}
                            
                            <div className="text-xs text-gray-400 mt-1">
                              Session ID: {session.sessionId.substring(0, 12)}...
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeSession(session.sessionId)}
                        disabled={revoking === session.sessionId}
                        className="ml-4"
                      >
                        {revoking === session.sessionId ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Đang thu hồi...
                          </>
                        ) : (
                          'Thu hồi'
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Revoke All Confirmation Dialog */}
      <AlertDialog open={showRevokeAllDialog} onOpenChange={setShowRevokeAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Thu hồi tất cả phiên?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ đăng xuất bạn khỏi tất cả thiết bị, bao gồm cả thiết bị hiện tại. 
              Bạn sẽ cần đăng nhập lại.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAll}
              className="bg-red-600 hover:bg-red-700"
            >
              Thu hồi tất cả
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
