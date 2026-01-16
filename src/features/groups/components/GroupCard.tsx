import { useState } from 'react';
import { Users, Globe, Lock, UserPlus, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Group } from '@/interfaces/post.types';
import { GroupVisibility } from '@/interfaces/group.types';
import { GroupService } from '@/features/groups/services/group.service';
import { toast } from 'sonner';

interface GroupCardProps {
  group: Group;
  isMember?: boolean;
  onJoinSuccess?: () => void;
  onLeaveSuccess?: () => void;
}

export default function GroupCard({
  group,
  isMember = false,
  onJoinSuccess,
  onLeaveSuccess,
}: GroupCardProps) {
  const [processing, setProcessing] = useState(false);
  const [memberStatus, setMemberStatus] = useState(isMember);

  const handleJoinGroup = async () => {
    try {
      setProcessing(true);
      await GroupService.joinGroup({ groupId: group.groupId });
      toast.success(`Đã tham gia danh mục ${group.groupName}`);
      setMemberStatus(true);
      // Dispatch event to notify sidebar to refresh
      window.dispatchEvent(new CustomEvent('groupMembershipChanged'));
      onJoinSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Không thể tham gia danh mục');
    } finally {
      setProcessing(false);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      setProcessing(true);
      await GroupService.leaveGroup(group.groupId);
      toast.success(`Đã rời khỏi danh mục ${group.groupName}`);
      setMemberStatus(false);
      // Dispatch event to notify sidebar to refresh
      window.dispatchEvent(new CustomEvent('groupMembershipChanged'));
      onLeaveSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Không thể rời danh mục');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">
                  {group.groupName}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge
                    variant={
                      group.visibility === GroupVisibility.PUBLIC
                        ? 'secondary'
                        : 'outline'
                    }
                    className="text-xs"
                  >
                    {group.visibility === GroupVisibility.PUBLIC ? (
                      <>
                        <Globe className="w-3 h-3 mr-1" />
                        Công khai
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 mr-1" />
                        Riêng tư
                      </>
                    )}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {group.memberCount || 0} người tham gia
                  </span>
                </div>
              </div>
            </div>

            {group.description && (
              <p className="text-sm text-slate-600 line-clamp-2 mt-2">
                {group.description}
              </p>
            )}
          </div>

          <div className="flex-shrink-0">
            {memberStatus ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleLeaveGroup}
                disabled={processing}
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Đã tham gia
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleJoinGroup}
                disabled={processing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-1" />
                    Tham gia
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
