import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useStore';
import { AdminService, AdminStats, AdminPost, ReportResponse } from '@/features/admin';
import { User } from '@/interfaces/auth.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  FileText,
  MessageSquare,
  Shield,
  UsersRound,
  RefreshCw,
  Loader2,
  TrendingUp,
  ArrowUpRight,
  AlertTriangle,
  Clock,
  UserPlus,
  PenSquare,
  Flag
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Recent activity data
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentPosts, setRecentPosts] = useState<AdminPost[]>([]);
  const [recentReports, setRecentReports] = useState<ReportResponse[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Call the new dashboard statistics API from post-service
      const dashboardStats = await AdminService.getDashboardStatistics();
      console.log('Admin Dashboard - Received stats:', dashboardStats);

      setStats({
        totalUsers: dashboardStats.totalUsers,
        activeUsers: dashboardStats.totalUsers,
        bannedUsers: 0,
        totalPosts: dashboardStats.totalPosts,
        totalGroups: dashboardStats.totalGroups,
        totalComments: 0,
        pendingReports: dashboardStats.totalReports,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        bannedUsers: 0,
        totalPosts: 0,
        totalGroups: 0,
        totalComments: 0,
        pendingReports: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    setActivityLoading(true);
    try {
      const [usersRes, postsRes, reportsRes] = await Promise.allSettled([
        AdminService.getAllUsers(0, 5),
        AdminService.getAllPosts(0, 5),
        AdminService.getPendingReports(0, 5),
      ]);

      if (usersRes.status === 'fulfilled') {
        setRecentUsers(usersRes.value.content || []);
      }
      if (postsRes.status === 'fulfilled') {
        setRecentPosts(postsRes.value.content || []);
      }
      if (reportsRes.status === 'fulfilled') {
        setRecentReports(reportsRes.value.content || []);
      }
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchRecentActivity();
  }, []);

  const handleRefresh = () => {
    fetchStats();
    fetchRecentActivity();
  };

  const statsCards = [
    {
      title: 'Người Dùng',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      description: 'Tổng số tài khoản',
      onClick: () => navigate('/admin/users'),
      color: 'bg-blue-500',
    },
    {
      title: 'Bài Viết',
      value: stats?.totalPosts ?? 0,
      icon: FileText,
      description: 'Bài viết đã đăng',
      onClick: () => navigate('/admin/posts'),
      color: 'bg-emerald-500',
    },
    {
      title: 'Danh Mục',
      value: stats?.totalGroups ?? 0,
      icon: UsersRound,
      description: 'Danh mục bài viết',
      onClick: () => navigate('/admin/groups'),
      color: 'bg-violet-500',
    },
    {
      title: 'Báo Cáo Chờ Xử Lý',
      value: stats?.pendingReports ?? 0,
      icon: AlertTriangle,
      description: 'Cần xử lý ngay',
      onClick: () => navigate('/admin/reports'),
      color: (stats?.pendingReports ?? 0) > 0 ? 'bg-red-500' : 'bg-amber-500',
    },
  ];

  // Format date to relative time
  // Backend returns LocalDateTime which is in UTC, but without timezone indicator
  // We need to treat it as UTC time to calculate correct relative time
  const formatRelativeTime = (dateString: string) => {
    // If the dateString doesn't have timezone info, append 'Z' to treat it as UTC
    let normalizedDateString = dateString;
    if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
      normalizedDateString = dateString + 'Z';
    }

    const date = new Date(normalizedDateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const quickActions = [
    {
      title: 'Quản Lý Người Dùng',
      description: 'Xem danh sách, cấm hoặc bỏ cấm người dùng',
      icon: Users,
      onClick: () => navigate('/admin/users'),
    },
    {
      title: 'Quản Lý Bài Viết',
      description: 'Kiểm duyệt và quản lý nội dung bài viết',
      icon: FileText,
      onClick: () => navigate('/admin/posts'),
    },
    {
      title: 'Quản Lý Danh Mục',
      description: 'Quản lý các danh mục bài viết',
      icon: UsersRound,
      onClick: () => navigate('/admin/groups'),
    },
    {
      title: 'Quản Lý Vai Trò',
      description: 'Tạo và phân quyền vai trò',
      icon: Shield,
      onClick: () => navigate('/admin/roles'),
    },
    {
      title: 'Xử Lý Báo Cáo',
      description: 'Xem và xử lý các báo cáo vi phạm',
      icon: MessageSquare,
      onClick: () => navigate('/admin/reports'),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Xin chào, {user?.firstName}!
          </h1>
          <p className="text-slate-500 mt-1">
            Đây là tổng quan về hoạt động của hệ thống
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={loading || activityLoading}
          className="border-slate-300"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading || activityLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card) => (
          <Card
            key={card.title}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-slate-200 bg-white group"
            onClick={card.onClick}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">
                    {card.title}
                  </p>
                  <div className="flex items-baseline gap-2">
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    ) : (
                      <span className="text-3xl font-bold text-slate-800">{card.value}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{card.description}</p>
                </div>
                <div className={`p-3 rounded-xl ${card.color}`}>
                  <card.icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  Cập nhật mới nhất
                </span>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Thao Tác Nhanh</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              className="hover:shadow-md transition-all duration-200 border-slate-200 bg-white cursor-pointer group"
              onClick={action.onClick}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 rounded-lg group-hover:bg-blue-50 transition-colors">
                    <action.icon className="h-5 w-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-800">
                      {action.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500 mt-0.5">
                      {action.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Hoạt Động Gần Đây</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Users */}
          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <UserPlus className="h-4 w-4 text-blue-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-slate-800">Người Dùng Mới</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/users')} className="text-xs text-blue-600 hover:text-blue-700">
                  Xem tất cả
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {activityLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : recentUsers.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">Không có dữ liệu</p>
              ) : (
                <div className="space-y-3">
                  {recentUsers.slice(0, 5).map((u) => (
                    <div key={u.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold overflow-hidden">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover" />
                        ) : (
                          u.firstName?.charAt(0) || u.username?.charAt(0) || 'U'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-slate-500 truncate">@{u.username}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(u.createdAt || new Date().toISOString())}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Posts */}
          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <PenSquare className="h-4 w-4 text-emerald-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-slate-800">Bài Viết Mới</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/posts')} className="text-xs text-emerald-600 hover:text-emerald-700">
                  Xem tất cả
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {activityLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : recentPosts.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">Không có dữ liệu</p>
              ) : (
                <div className="space-y-3">
                  {recentPosts.slice(0, 5).map((post) => (
                    <div key={post.postId} className="p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <p className="text-sm font-medium text-slate-800 truncate">{post.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">bởi {post.authorName}</span>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs text-slate-400">{formatRelativeTime(post.createdAt)}</span>
                      </div>
                      {post.groupName && (
                        <Badge variant="secondary" className="mt-1 text-xs bg-slate-100 text-slate-600">
                          {post.groupName}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Reports */}
          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Flag className="h-4 w-4 text-red-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-slate-800">Báo Cáo Chờ Xử Lý</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/reports')} className="text-xs text-red-600 hover:text-red-700">
                  Xem tất cả
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {activityLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : recentReports.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Shield className="h-6 w-6 text-emerald-600" />
                  </div>
                  <p className="text-sm text-emerald-600 font-medium">Không có báo cáo</p>
                  <p className="text-xs text-slate-500">Hệ thống sạch sẽ!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentReports.slice(0, 5).map((report) => (
                    <div key={report.reportId} className="p-2 rounded-lg hover:bg-slate-50 transition-colors border-l-2 border-red-400">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs border-red-200 text-red-600 bg-red-50">
                          {report.reason === 'SPAM' ? 'Spam' :
                            report.reason === 'HARASSMENT' ? 'Quấy rối' :
                              report.reason === 'OFFENSIVE_CONTENT' ? 'Nội dung xúc phạm' :
                                report.reason === 'MISINFORMATION' ? 'Thông tin sai' : 'Khác'}
                        </Badge>
                        <span className="text-xs text-slate-400">{formatRelativeTime(report.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{report.description || 'Không có mô tả'}</p>
                      <p className="text-xs text-slate-500 mt-1">Báo cáo bởi: {report.reportedByName}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
