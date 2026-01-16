// ===================================
// GROUPS FEATURE
// ===================================

// Components
export { default as GroupsPage } from './components/GroupsPage';
export { default as GroupCard } from './components/GroupCard';
export { default as GroupPage } from './components/GroupPage';
export { default as CreateGroupDialog } from './components/CreateGroupDialog';

// Services
export { GroupService } from './services/group.service';

// Hooks
export { useGroupInfo } from './hooks/useGroupInfo';

// Types
export type {
    Group,
    CreateGroupRequest,
    UpdateGroupRequest,
    JoinGroupRequest,
    GroupMember,
    GroupMemberCheck,
    MemberRole,
    UpdateMemberRoleRequest,
    GroupPrivacy,
} from '@/interfaces/post.types';

export { GroupVisibility, GroupRole } from '@/interfaces/group.types';
export type {
    GroupMemberCheckResponse,
    GroupMemberResponse,
    PageResponse,
} from '@/interfaces/group.types';
