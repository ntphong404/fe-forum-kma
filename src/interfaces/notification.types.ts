// Notification types for frontend - match với backend notification-service

export type NotificationType =
    | 'POST'           // Bài đăng mới trong group
    | 'LIKE_POST'      // Like bài đăng
    | 'LIKE_COMMENT'   // Like comment
    | 'COMMENT'        // Comment mới
    | 'CHAT'           // Tin nhắn chat
    | 'MENTION'        // Được mention
    | 'ADMIN';         // Thông báo từ admin

export type InteractionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

export interface Notification {
    id: string;
    userId?: string;           // Người nhận thông báo
    senderId?: string;         // Người tạo sự kiện
    senderName?: string;       // Tên người tạo sự kiện
    type: NotificationType;
    title: string;
    content: string;
    
    // Metadata fields
    postId?: string;           // ID bài đăng
    commentId?: string;        // ID bình luận
    groupId?: string;          // ID group
    interactionType?: InteractionType; // Loại reaction (LIKE, LOVE, etc.)
    referenceId?: string;      // Generic reference (postId, commentId, chatId)
    
    // Aggregated fields (cho like/comment notifications)
    aggregatedUserIds?: string[];    // Danh sách user IDs đã like/comment
    aggregatedUserNames?: string[];  // Danh sách user names tương ứng
    lastActivityAt?: string | number[];  // Lần cuối có interaction
    
    isRead: boolean;
    createdAt: string | number[];    // ISO string hoặc array [year, month, day, hour, minute, second, nano]
    readAt?: string | number[];
}

export interface NotificationListResponse {
    unreadCount: number;
    data: Notification[];
}
