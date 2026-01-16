import React, { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from '@/features/auth/components/LoginPage';
import RegisterPage from '@/features/auth/components/RegisterPage';
import SettingsPage from '@/features/auth/components/SettingsPage';
import { ProfilePage } from '@/features/profile';
import { MainForum, ForumHeader } from '@/layouts/forum';
import { GroupPage } from '@/features/groups';
import Notifications from '@/features/notifications/Notifications';
import { ChatPage, ChatContainer } from '@/features/chat';
import WebSocketManager from '@/common/WebSocketManager';
import { Toaster } from '@/components/ui/toaster';
import { FriendsPage } from '@/features/friends';
import { GroupsPage } from '@/features/groups';
import { useAuthStore } from '@/store/useStore';
import { MainAppLayout, AdminLayout } from '@/layouts';
import { AdminDashboard } from '@/pages';
import {
    AdminUserManagement,
    AdminPostManagement,
    AdminGroupManagement,
    AdminRoleManagement,
    AdminReportManagement,
    AdminBackupManagement,
} from '@/features/admin';

function LoginWrapper() {
    const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
    const isAdmin = useAuthStore((s) => s.isAdmin());
    const navigate = useNavigate();

    if (isLoggedIn) {
        // Redirect admin users to admin dashboard
        if (isAdmin) {
            return <Navigate to="/admin" replace />;
        }
        return <Navigate to="/forum" replace />;
    }

    return <LoginPage
        onLogin={(user) => {
            // Check if user is admin from the user data directly
            const userIsAdmin = user?.roleName?.toUpperCase() === 'ADMIN' ||
                user?.roles?.some((role: string) => role.toUpperCase() === 'ADMIN');

            // Use navigate for routing in hash-based router
            if (userIsAdmin) {
                navigate('/admin', { replace: true });
            } else {
                navigate('/forum', { replace: true });
            }
        }}
        onSwitchToRegister={() => navigate('/register')}
    />;
}

function RegisterWrapper() {
    const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
    const isAdmin = useAuthStore((s) => s.isAdmin());
    const navigate = useNavigate();

    if (isLoggedIn) {
        // Check if user is admin and redirect accordingly
        return <Navigate to={isAdmin ? '/admin' : '/forum'} replace />;
    }

    return <RegisterPage
        onRegister={(registeredUser) => {
            // Check if registered user is admin and redirect accordingly
            const userIsAdmin = registeredUser?.roleName?.toUpperCase() === 'ADMIN' ||
                registeredUser?.roles?.some((role: string) => role.toUpperCase() === 'ADMIN');
            if (userIsAdmin) navigate('/admin', { replace: true });
            else navigate('/forum', { replace: true });
        }}
        onSwitchToLogin={() => navigate('/login')}
    />;
}

function ForumWrapper({ children }: { children?: React.ReactNode }) {
    const logout = useAuthStore((s) => s.logout);
    const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [showFriendsList, setShowFriendsList] = useState(false);

    const handleNotificationsOpen = () => {
        setIsNotificationsOpen((prev) => !prev);
    };

    const handleFriendsListToggle = () => {
        setShowFriendsList(!showFriendsList);
    };

    if (!isLoggedIn) return <Navigate to="/" replace />;

    return (
        <>
            {/* WebSocket Manager - Auto-connects when logged in */}
            <WebSocketManager />

            <MainForum
                onLogout={logout}
                onOpenNotifications={handleNotificationsOpen}
                onOpenFriendsList={handleFriendsListToggle}
            >
                {children}
            </MainForum>

            <Notifications
                isOpen={isNotificationsOpen}
                onOpenChange={setIsNotificationsOpen}
            />

            {/* Chat Container - Manages all chat windows and friends list */}
            <ChatContainer showFriendsList={showFriendsList} />

            {/* Toast Notifications */}
            <Toaster />
        </>
    );
}

function SimplePageWrapper({ children }: { children: React.ReactNode }) {
    const logout = useAuthStore((s) => s.logout);
    const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [showFriendsList, setShowFriendsList] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleNotificationsOpen = () => {
        setIsNotificationsOpen((prev) => !prev);
    };

    const handleFriendsListToggle = () => {
        setShowFriendsList(!showFriendsList);
    };

    if (!isLoggedIn) return <Navigate to="/" replace />;

    return (
        <>
            {/* WebSocket Manager - Auto-connects when logged in */}
            <WebSocketManager />

            <MainAppLayout
                header={
                    <ForumHeader
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onLogout={logout}
                        onOpenNotifications={handleNotificationsOpen}
                        onOpenFriendsList={handleFriendsListToggle}
                    />
                }
            >
                {children}
            </MainAppLayout>

            <Notifications
                isOpen={isNotificationsOpen}
                onOpenChange={setIsNotificationsOpen}
            />

            {/* Chat Container - Manages all chat windows and friends list */}
            <ChatContainer showFriendsList={showFriendsList} />

            {/* Toast Notifications */}
            <Toaster />
        </>
    );
}

// Admin Wrapper - Protected route for admin users only
function AdminWrapper({ children }: { children?: React.ReactNode }) {
    const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
    const isAdmin = useAuthStore((s) => s.isAdmin());

    if (!isLoggedIn) return <Navigate to="/login" replace />;
    if (!isAdmin) return <Navigate to="/forum" replace />;

    return (
        <>
            <WebSocketManager />
            <AdminLayout>
                {children || <AdminDashboard />}
            </AdminLayout>
            <Toaster />
        </>
    );
}

function ChatWrapper() {
    const logout = useAuthStore((s) => s.logout);
    const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [showFriendsList, setShowFriendsList] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleNotificationsOpen = () => {
        setIsNotificationsOpen((prev) => !prev);
    };

    const handleFriendsListToggle = () => {
        setShowFriendsList(!showFriendsList);
    };

    if (!isLoggedIn) return <Navigate to="/" replace />;

    return (
        <>
            {/* WebSocket Manager - Auto-connects when logged in */}
            <WebSocketManager />

            <MainAppLayout
                header={
                    <ForumHeader
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onLogout={logout}
                        onOpenNotifications={handleNotificationsOpen}
                        onOpenFriendsList={handleFriendsListToggle}
                    />
                }
            >
                <ChatPage />
            </MainAppLayout>

            <Notifications
                isOpen={isNotificationsOpen}
                onOpenChange={setIsNotificationsOpen}
            />

            {/* Chat Container - Manages all chat windows and friends list */}
            <ChatContainer showFriendsList={showFriendsList} />

            {/* Toast Notifications */}
            <Toaster />
        </>
    );
}

export default function AppRouter() {
    const initAuth = useAuthStore((s) => s.initAuth);
    const hasHydrated = useAuthStore((s) => s._hasHydrated);

    // Initialize auth state from localStorage on app start
    useEffect(() => {
        initAuth();
    }, [initAuth]);

    const router = createBrowserRouter(
        [
            { path: '/', element: <Navigate to="/login" replace /> },
            { path: '/login', element: <LoginWrapper /> },
            { path: '/register', element: <RegisterWrapper /> },

            // Admin routes
            { path: '/admin', element: <AdminWrapper /> },
            { path: '/admin/users', element: <AdminWrapper><AdminUserManagement /></AdminWrapper> },
            { path: '/admin/posts', element: <AdminWrapper><AdminPostManagement /></AdminWrapper> },
            { path: '/admin/groups', element: <AdminWrapper><AdminGroupManagement /></AdminWrapper> },
            { path: '/admin/roles', element: <AdminWrapper><AdminRoleManagement /></AdminWrapper> },
            { path: '/admin/reports', element: <AdminWrapper><AdminReportManagement /></AdminWrapper> },
            { path: '/admin/backups', element: <AdminWrapper><AdminBackupManagement /></AdminWrapper> },
            { path: '/admin/settings', element: <AdminWrapper><div className="p-6"><h1 className="text-2xl font-bold">Cài Đặt Hệ Thống</h1><p className="text-muted-foreground mt-2">Tính năng đang phát triển...</p></div></AdminWrapper> },

            // Forum routes
            { path: '/forum', element: <ForumWrapper /> },
            { path: '/forum/group/:groupId', element: <ForumWrapper><GroupPage /></ForumWrapper> },
            { path: '/forum/post/:postId', element: <ForumWrapper /> },
            { path: '/settings', element: <SimplePageWrapper><SettingsPage /></SimplePageWrapper> },
            { path: '/profile', element: <SimplePageWrapper><ProfilePage /></SimplePageWrapper> },
            { path: '/profile/:userId', element: <SimplePageWrapper><ProfilePage /></SimplePageWrapper> },
            { path: '/friends', element: <SimplePageWrapper><FriendsPage /></SimplePageWrapper> },
            { path: '/groups', element: <ForumWrapper><GroupsPage /></ForumWrapper> },
            { path: '/chat', element: <ChatWrapper /> },
            { path: '/chat/:conversationId', element: <ChatWrapper /> },
            { path: '*', element: <Navigate to="/login" replace /> },
        ],
        {
            future: {
                v7_relativeSplatPath: true,
            },
        }
    );

    // Wait for auth hydration before rendering router
    if (!hasHydrated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return <RouterProvider router={router} />;
}
