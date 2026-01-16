// Group types based on backend API

export interface Group {
  groupId: string;
  groupName: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  visibility: GroupVisibility;
  memberCount?: number;
}

export enum GroupVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export interface CreateGroupRequest {
  groupName: string;
  description?: string;
  visibility: GroupVisibility;
}

export interface UpdateGroupRequest {
  groupName?: string;
  description?: string;
  visibility?: GroupVisibility;
}

export interface GroupMemberCheckResponse {
  isMember: boolean;
  role?: GroupRole;
  isOwner: boolean;
  isAdmin: boolean;
  canPost: boolean;
  canManageMembers: boolean;
  canManagePosts: boolean;
}

export interface GroupMemberResponse {
  memberId: string;
  groupId: string;
  userId: string;
  role: GroupRole;
  joinedAt: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export enum GroupRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export interface PageResponse<T> {
  data: T[];
  page: number;
  limit: number;
  totalElements: number;
  totalPages: number;
}
