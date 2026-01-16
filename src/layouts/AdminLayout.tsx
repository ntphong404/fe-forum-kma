import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useStore';
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  Shield,
  Settings,
  LogOut,
  Menu,
  UsersRound,
  ChevronRight,
  Home,
  Database,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Người Dùng', path: '/admin/users' },
    { icon: FileText, label: 'Bài Viết', path: '/admin/posts' },
    { icon: UsersRound, label: 'Danh Mục', path: '/admin/groups' },
    { icon: Shield, label: 'Vai Trò', path: '/admin/roles' },
    { icon: MessageSquare, label: 'Báo Cáo', path: '/admin/reports' },
    { icon: Database, label: 'Backup', path: '/admin/backups' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBackToForum = () => {
    navigate('/forum');
  };

  const getInitials = () => {
    if (user?.lastName && user?.firstName) {
      return `${user.lastName[0]}${user.firstName[0]}`.toUpperCase();
    }
    return 'AD';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 bg-[#1e293b] transition-all duration-300 z-30 flex flex-col ${sidebarOpen ? 'w-64' : 'w-20'
          }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-slate-700">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="h-5 w-5 text-white" />
          </div>
          {sidebarOpen && (
            <span className="ml-3 text-lg font-semibold text-white">
              Admin Page
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-slate-700">
          <div className={`flex items-center gap-3 ${sidebarOpen ? '' : 'justify-center'}`}>
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={`${user.lastName} ${user.firstName}`}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-600 flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center ring-2 ring-slate-600 flex-shrink-0">
                <span className="text-sm font-bold text-white">{getInitials()}</span>
              </div>
            )}
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.lastName} {user?.firstName}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user?.roleName || 'ADMIN'}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu className="h-5 w-5 text-slate-600" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Admin</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
              <span className="text-slate-800 font-medium">
                {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToForum}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Home className="h-4 w-4" />
              Về Trang Chủ
            </button>
            <div className="w-px h-6 bg-slate-200" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
