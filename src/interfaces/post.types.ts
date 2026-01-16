// Post types
export type PostStatus = 'PUBLISHED' | 'PENDING' | 'REJECTED';
export type PostType = 'TEXT' | 'IMAGE' | 'DOC' | 'VIDEO';
export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';
export type GroupPrivacy = 'PUBLIC' | 'PRIVATE';

// API Post interface (from backend)
export interface ApiPost {
  postId: string;
  title: string;
  content: string;
  authorId: string;
  authorName?: string;      // Author's full name from backend
  authorAvatarUrl?: string; // Author's avatar URL from backend
  groupId: string;
  groupName?: string;
  status: PostStatus;
  type: PostType;
  resourceUrls?: string[]; // Multiple images/documents
  reactionCount: number;
  commentCount?: number;
  viewCount?: number;
  myReaction?: ReactionType | null;
  createdAt: string;
  updatedAt?: string;
}

// Paginated response
export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Create post request
export interface CreatePostRequest {
  title: string;
  content: string;
  groupId?: string;
  type: PostType;
  resourceUrls?: string[]; // Multiple images/documents
}

// Update post request
export interface UpdatePostRequest {
  title?: string;
  content?: string;
  type?: PostType;
  resourceUrls?: string[];
}

// Comment types
export type CommentType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOC';

export interface Comment {
  commentId: string;
  postId: string;
  authorId: string;
  authorName?: string;
  authorAvatarUrl?: string;
  content: string;
  parentCommentId?: string;
  type?: CommentType;           // TEXT, IMAGE, VIDEO, DOC
  resourceUrls?: string[];       // URLs of images/videos/docs
  replyCount?: number;
  reactionCount: number;
  myReaction?: ReactionType | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCommentRequest {
  postId: string;
  content: string;
  parentCommentId?: string;
  senderName?: string;          // Current user's full name
  type?: CommentType;           // TEXT, IMAGE, VIDEO, DOC
  urls?: string[];              // URLs of uploaded files
}

export interface UpdateCommentRequest {
  content: string;
  type?: CommentType;
  urls?: string[];
}

// Interaction types
export interface Interaction {
  interactionId: string;
  userId: string;
  postId: string;
  commentId?: string;
  type: ReactionType;
  createdAt: string;
}

export interface CreateInteractionRequest {
  postId: string;
  commentId?: string;
  type: ReactionType;
  senderName: string;           // Current user's full name
}

export interface InteractionCount {
  postId: string;
  commentId?: string;
  likeCount: number;
  loveCount: number;
  hahaCount: number;
  wowCount: number;
  sadCount: number;
  angryCount: number;
  totalCount: number;
}

// Group types
export interface Group {
  groupId: string;
  name?: string;           // For /groups endpoint
  groupName?: string;      // For /groups/my-groups endpoint
  description: string;
  privacy?: GroupPrivacy;  // For /groups endpoint
  visibility?: 'PUBLIC' | 'PRIVATE';  // For /groups/my-groups endpoint
  memberCount: number;
  postCount?: number;      // Number of posts in the group
  createdBy?: string;
  ownerId?: string;        // For /groups/my-groups endpoint
  createdAt: string;
  updatedAt?: string;
}

export interface CreateGroupRequest {
  groupName: string;
  description: string;
  visibility: GroupPrivacy;
}

export interface UpdateGroupRequest {
  groupName?: string;
  description?: string;
  visibility?: GroupPrivacy;
}

export interface JoinGroupRequest {
  groupId: string;
}

// Group member types
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  avatarUrl?: string;  // User's avatar URL from backend
  role: MemberRole;
  joinedAt: string;
}

export interface GroupMemberCheck {
  isMember: boolean;
  role: MemberRole | null;
  isOwner: boolean;
  isAdmin: boolean;
  canPost: boolean;
  canManageMembers: boolean;
  canManagePosts: boolean;
}

export interface UpdateMemberRoleRequest {
  userId: string;
  role: MemberRole;
}

// Legacy types for backward compatibility
export interface Post {
  id: number;
  author: {
    name: string;
    avatar: string;
    group: string;
  };
  timeAgo: string;
  timestamp: number;
  title: string;
  content: string;
  image?: boolean;
  upvotes: number;
  comments: number;
  hasUpvoted: boolean;
}

export interface CreatePostData {
  title: string;
  content: string;
  group?: string;
  image?: string;
}
