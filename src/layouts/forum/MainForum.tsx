import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ForumHeader from './ForumHeader';
import { ForumFeed } from '@/features/posts';
import { FriendsSidebar } from '@/features/friends';
import { useAuthStore } from '@/store/useStore';
import { AuthService } from '@/features/auth/services/auth.service';
import { MainAppLayout } from '@/layouts';

interface MainForumProps {
  onLogout: () => void;
  onOpenNotifications?: () => void;
  onOpenMiniChat?: (conversation: any) => void;
  onStartChat?: (userId: string, username: string) => void;
  onOpenFriendsList?: () => void;
  children?: React.ReactNode;
}

export default function MainForum({ onLogout, onOpenNotifications, onOpenMiniChat, onStartChat, onOpenFriendsList, children }: MainForumProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    let active = true;
    const loadUser = async () => {
      try {
        const token = AuthService.getAccessToken();
        if (!token) return;
        const profile = await AuthService.fetchUserProfile();
        if (active && profile) {
          setUser(profile);
        }
      } catch (error) {
        console.error('Failed to load user profile', error);
      }
    };

    loadUser();
    return () => {
      active = false;
    };
  }, [setUser]);

  return (
    <MainAppLayout
      header={
        <ForumHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLogout={onLogout}
          onOpenNotifications={onOpenNotifications}
          onOpenMiniChat={onOpenMiniChat}
          onOpenFriendsList={onOpenFriendsList}
        />
      }
      leftSidebar={<Sidebar />}
      rightSidebar={<FriendsSidebar onStartChat={onStartChat} />}
      leftSidebarWidth="280px"
      rightSidebarWidth="320px"
    >
      {children ?? <ForumFeed />}
    </MainAppLayout>
  );
}