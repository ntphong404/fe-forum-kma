// Friendship types based on backend API

export interface FriendshipResponse {
  id: string;
  userId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  status: 'PENDING' | 'ACCEPTED' | 'BLOCKED';
  createdAt: string;
  acceptedAt?: string;
  isRequester: boolean;
}

export interface FriendshipStatusResponse {
  userId: string;
  status: FriendshipStatus;
  friendshipId?: string;
  isRequester: boolean;
}

export enum FriendshipStatus {
  NOT_FRIENDS = 'NOT_FRIENDS',
  PENDING_SENT = 'PENDING_SENT',
  PENDING_RECEIVED = 'PENDING_RECEIVED',
  FRIENDS = 'FRIENDS',
  BLOCKED_BY_ME = 'BLOCKED_BY_ME',
  BLOCKED_BY_THEM = 'BLOCKED_BY_THEM',
}
