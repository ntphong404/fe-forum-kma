import { useState, useEffect } from 'react';
import { Users, UserPlus, ArrowLeft, Sparkles } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FriendsList from './FriendsList';
import FriendRequests from './FriendRequests';

interface FriendsPageProps {
  onStartChat?: (userId: string, username: string) => void;
}

type FriendTab = 'friends' | 'requests';

export default function FriendsPage({ onStartChat }: FriendsPageProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FriendTab>('friends');
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync activeTab with URL query params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['friends', 'requests'].includes(tab)) {
      setActiveTab(tab as FriendTab);
    } else {
      setActiveTab('friends');
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as FriendTab);
    navigate(`/friends?tab=${value}`, { replace: true });
  };

  const handleRequestHandled = () => {
    // Refresh friends list when a request is accepted
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/forum">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-white shadow-sm hover:shadow-md transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Bạn bè
            </h1>
            <p className="text-slate-500 text-sm mt-1">Quản lý danh sách bạn bè của bạn</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-blue-500/5 border border-white/50 overflow-hidden">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            {/* Tab Navigation */}
            <div className="border-b border-slate-100 px-6 pt-6">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100/50 p-1 rounded-2xl h-14">
                <TabsTrigger
                  value="friends"
                  className="flex items-center gap-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium">Bạn bè</span>
                </TabsTrigger>
                <TabsTrigger
                  value="requests"
                  className="flex items-center gap-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <UserPlus className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium">Lời mời</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              <TabsContent value="friends" className="mt-0">
                <FriendsList key={refreshKey} onStartChat={onStartChat} />
              </TabsContent>

              <TabsContent value="requests" className="mt-0">
                <FriendRequests onRequestHandled={handleRequestHandled} />
              </TabsContent>


            </div>
          </Tabs>
        </div>

        {/* Decorative Element */}
        <div className="flex items-center justify-center gap-2 mt-8 text-slate-400 text-sm">
          <Sparkles className="h-4 w-4" />
          <span>Kết nối với mọi người tại Forum KMA</span>
        </div>
      </div>
    </div>
  );
}
