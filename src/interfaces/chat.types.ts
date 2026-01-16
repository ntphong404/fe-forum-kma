export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'MESSAGE_DELETED';
export type ConversationType = 'private' | 'group';

// Backend response for ChatMessage
export interface Message {
  id: string; // MongoDB _id (messageId in backend)
  fromUserId: string;
  toUserId?: string | null; // null for group messages
  groupId?: string | null; // null for private messages
  conversationId: string;
  message: string; // Text content or caption for media
  type: MessageType;
  resourceUrls?: string[]; // URLs to media files in MinIO (for IMAGE, VIDEO, FILE)
  createdAt: string; // ISO timestamp
}

// Backend response for Conversation
export interface Conversation {
  conversationId: string; // MongoDB _id
  type: ConversationType; // "private" or "group"
  participantIds: string[]; // Array of user IDs
  groupId?: string | null; // null for private conversations
  partnerId?: string | null; // For private conversations - the other user's ID
  lastMessage?: string | null; // Last message text
  lastMessageAt?: string | null; // ISO timestamp
  unreadCounts: Record<string, number>; // { userId: count }
}

// Request to send a message
export interface SendMessageRequest {
  conversationId?: string; // For existing conversations
  receiverId?: string; // For new private chat (backend expects receiverId, not toUserId)
  groupId?: string; // For group chat
  message: string; // Required - text content or caption for media
  type?: MessageType; // Optional, defaults to TEXT
  resourceUrls?: string[]; // URLs to uploaded media files (for IMAGE, VIDEO, FILE types)
}

// Request to create a group
export interface CreateGroupRequest {
  name: string;
  description?: string;
  memberIds: string[]; // User IDs (creator is auto-added)
}

// Response when creating a group (from backend CreateGroupChatResponse)
export interface CreateGroupResponse {
  // Group info
  groupId: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  ownerId: string;
  adminIds: string[];
  memberIds: string[];
  settings?: {
    onlyAdminsCanSendMessages: boolean;
    onlyAdminsCanAddMembers: boolean;
    allowMembersToLeave: boolean;
    maxMembers: number;
  };
  createdAt: string;
  updatedAt?: string;

  // Conversation info
  conversationId: string;
  conversationType: string;
  participantIds: string[];
  lastMessage?: string | null;
  lastMessageAt?: string | null;
}
