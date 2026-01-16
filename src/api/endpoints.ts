export default {
    AUTH_ENDPOINTS: {
        LOGIN: "/auth/login",
        LOGOUT: "/auth/logout",
        REGISTER: "/auth/register",
        REFRESH_TOKEN: "/auth/refresh",
        ME: "/users/myinfo",
        UPDATE_ME: "/users/update",
        UPDATE_AVATAR: "/users/avatar",
        UPDATE_PASSWORD: "/users/password",
    },
    USER_ENDPOINTS: {
        GET_BY_ID: (id: string) => `/users/${id}`,
        GET_ALL: "/users",
        SEARCH: "/users/search",
    },
    POST_ENDPOINTS: {
        GET_ALL: "/posts",
        GET_BY_ID: (id: string) => `/posts/${id}`,
        CREATE: "/posts",
        UPDATE: (id: string) => `/posts/${id}`,
        DELETE: (id: string) => `/posts/${id}`,
        GET_BY_GROUP: (groupId: string) => `/posts/group/${groupId}`,
        GET_BY_USER: (userId: string) => `/posts/user/${userId}`,
        SEARCH: "/posts/search",
    },
    COMMENT_ENDPOINTS: {
        GET_BY_POST: (postId: string) => `/comments/post/${postId}`,
        CREATE: "/comments",
        UPDATE: (id: string) => `/comments/${id}`,
        DELETE: (id: string) => `/comments/${id}`,
    },
    INTERACTION_ENDPOINTS: {
        CREATE_OR_UPDATE: "/interactions",
        GET_BY_POST: (postId: string) => `/interactions/post/${postId}`,
    },
    GROUP_ENDPOINTS: {
        GET_ALL: "/groups",
        GET_BY_ID: (id: string) => `/groups/${id}`,
        CREATE: "/groups",
        UPDATE: (id: string) => `/groups/${id}`,
        DELETE: (id: string) => `/groups/${id}`,
        JOIN: (id: string) => `/groups/${id}/join`,
        LEAVE: (id: string) => `/groups/${id}/leave`,
        GET_MEMBERS: (id: string) => `/groups/${id}/members`,
        GET_MY_GROUPS: "/groups/my-groups",
        SUGGESTIONS: "/groups/suggestions",
        CHECK_MEMBERSHIP: (id: string) => `/groups/${id}/membership`,
        UPDATE_MEMBER_ROLE: (id: string) => `/groups/${id}/members/role`,
        REMOVE_MEMBER: (groupId: string, userId: string) => `/groups/${groupId}/members/${userId}`,
        TRANSFER_OWNERSHIP: (id: string) => `/groups/${id}/transfer-ownership`,
    },
    FRIENDSHIP_ENDPOINTS: {
        // New API endpoints matching backend FriendshipController
        GET_FRIENDS: "/friends",
        GET_REQUESTS_RECEIVED: "/friends/requests/received",
        GET_REQUESTS_SENT: "/friends/requests/sent",
        SEND_REQUEST: (userId: string) => `/friends/request/${userId}`,
        ACCEPT: (friendshipId: string) => `/friends/accept/${friendshipId}`,
        REJECT: (friendshipId: string) => `/friends/reject/${friendshipId}`,
        UNFRIEND: (userId: string) => `/friends/${userId}`,
        BLOCK: (userId: string) => `/friends/block/${userId}`,
        UNBLOCK: (userId: string) => `/friends/unblock/${userId}`,
        GET_BLOCKED: "/friends/blocked",
        GET_STATUS: (userId: string) => `/friends/status/${userId}`,
        SUGGESTIONS: "/friends/suggestions",
    },
    CHAT_ENDPOINTS: {
        SEND_MESSAGE: "/chat/send",
        GET_MESSAGES: "/chat/messages",
        GET_CONVERSATIONS: "/chat/conversations",
        GET_CONVERSATION: (id: string) => `/chat/conversation/${id}`,
        CREATE_GROUP: "/chat/group",
        ADD_MEMBER: "/chat/group/member",
        REMOVE_MEMBER: "/chat/group/member/remove",
        MARK_READ: "/chat/read",
    },
    FILE_ENDPOINTS: {
        UPLOAD_IMAGE: "/files/upload/image",
        UPLOAD_AVATAR: "/files/upload/avatar",
        UPLOAD_DOCUMENT: "/files/upload/document",
        DELETE: "/files/delete",
    },
    NOTIFICATION_ENDPOINTS: {
        GET_ALL: "/notifications",
        MARK_READ: (id: string) => `/notifications/${id}/read`,
        MARK_ALL_READ: "/notifications/read-all",
        UNREAD_COUNT: "/notifications/unread-count",
    },
    ADMIN_ENDPOINTS: {
        // User Management
        GET_ALL_USERS: "/users",
        GET_USER_BY_ID: (id: string) => `/users/${id}`,
        SEARCH_USERS: "/users/search",
        CREATE_USER: "/users",
        BAN_USER: (id: string) => `/users/${id}/ban`,
        UNBAN_USER: (id: string) => `/users/${id}/unban`,
        DELETE_USER: (id: string) => `/users/${id}`,

        // Role Management
        GET_ALL_ROLES: "/roles",
        GET_ROLE_BY_ID: (id: string) => `/roles/${id}`,
        CREATE_ROLE: "/roles",
        UPDATE_ROLE: (id: string) => `/roles/${id}`,
        DELETE_ROLE: (id: string) => `/roles/${id}`,

        // Post Management
        GET_ALL_POSTS: "/posts",
        DELETE_POST: (id: string) => `/posts/${id}`,
        GET_POSTS_BY_GROUP: (groupId: string) => `/posts/feed/group/${groupId}`,

        // Group Management
        GET_ALL_GROUPS: "/groups",
        GET_GROUP_BY_ID: (id: string) => `/groups/${id}`,
        DELETE_GROUP: (id: string) => `/groups/${id}`,
        GET_GROUP_MEMBERS: (id: string) => `/groups/${id}/members`,
        UPDATE_MEMBER_ROLE: (id: string) => `/groups/${id}/members/role`,
        REMOVE_MEMBER: (groupId: string, userId: string) => `/groups/${groupId}/members/${userId}`,

        // Comment Management
        DELETE_COMMENT: (id: string) => `/comments/${id}`,

        // Report Management
        GET_ALL_REPORTS: "/posts/reports",
        GET_PENDING_REPORTS: "/posts/reports/pending",
        GET_POST_REPORTS: (postId: string) => `/posts/reports/post/${postId}`,
        RESOLVE_POST_REPORTS: (postId: string) => `/posts/reports/post/${postId}`,

        // Statistics
        GET_STATS: "/admin/stats",
        DASHBOARD_STATISTICS: "/dashboard/statistics",
    },
    BACKUP_ENDPOINTS: {
        GET_ALL: "/backups",
        TRIGGER_BACKUP: "/backups/trigger",
        TRIGGER_RESTORE: "/backups/restore",
        GET_BACKUP_STATUS: (jobId: string) => `/backups/backup/status/${jobId}`,
        GET_RESTORE_STATUS: (jobId: string) => `/backups/restore/status/${jobId}`,
    },
} as const;
