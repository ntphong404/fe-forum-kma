import { ApiService } from '@/api/api.service';
import type {
  Message,
  Conversation,
  SendMessageRequest,
  CreateGroupRequest,
  CreateGroupResponse,
} from '@/interfaces/chat.types';

const CHAT_SERVICE_BASE = '/chat';

export class ChatService {
  /**
   * Gửi tin nhắn (private chat hoặc group chat)
   */
  static async sendMessage(request: SendMessageRequest): Promise<Message> {
    const response = await ApiService.post<any>(
      `${CHAT_SERVICE_BASE}/send`,
      request,
      true
    );
    return response;
  }

  /**
   * Lấy danh sách cuộc hội thoại
   */
  static async getConversations(): Promise<Conversation[]> {
    const response = await ApiService.get<any[]>(
      `${CHAT_SERVICE_BASE}/conversations`,
      true
    );

    // Transform response to ensure correct field mapping
    return (response || []).map((conv: any) => ({
      conversationId: conv.conversationId || conv.id,
      type: conv.type || 'private',
      participantIds: conv.participantIds || [],
      groupId: conv.groupId || null,
      partnerId: conv.partnerId || null,
      lastMessage: conv.lastMessage || null,
      lastMessageAt: conv.lastMessageAt || null,
      unreadCounts: conv.unreadCounts || {},
    }));
  }

  /**
   * Lấy thông tin một cuộc hội thoại theo ID
   */
  static async getConversationById(conversationId: string): Promise<Conversation> {
    const conversations = await this.getConversations();
    const conversation = conversations.find(c => c.conversationId === conversationId);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    return conversation;
  }


  /**
   * Lấy lịch sử tin nhắn với phân trang
   * Backend trả về PageResponse, extract content để lấy messages
   */
  static async getMessages(conversationId: string, page = 0, limit = 50): Promise<Message[]> {
    const response = await ApiService.get<any>(
      `${CHAT_SERVICE_BASE}/messages?conversationId=${conversationId}&page=${page}&limit=${limit}`,
      true
    );

    // Helper to normalize message type from backend
    const normalizeMessageType = (msg: any): Message => {
      // Backend may return different type values for deleted messages
      // Normalize to MESSAGE_DELETED for consistent frontend handling
      let type = msg.type || 'TEXT';
      if (type === 'DELETE' || type === 'DELETED' || type === 'MESSAGE DELETED' || msg.isDeleted) {
        type = 'MESSAGE_DELETED';
      }
      return {
        ...msg,
        type,
      };
    };

    // Backend returns PageResponse format with content array
    // Backend returns messages sorted by createdAt DESC (newest first)
    // We need to reverse to show oldest at top, newest at bottom in chat UI
    if (response && response.content) {
      const messages = response.content.map(normalizeMessageType);
      return messages.reverse();
    }
    // Fallback for direct array response (backward compatibility)
    if (Array.isArray(response)) {
      return response.map(normalizeMessageType).reverse();
    }
    return [];
  }

  /**
   * Đánh dấu đã đọc
   */
  static async markAsRead(conversationId: string): Promise<void> {
    await ApiService.post<any>(
      `${CHAT_SERVICE_BASE}/conversations/${conversationId}/mark-as-read`,
      {},
      true
    );
  }

  /**
   * Tạo nhóm chat
   */
  static async createGroup(request: CreateGroupRequest): Promise<Conversation> {
    const response = await ApiService.post<CreateGroupResponse>(
      `${CHAT_SERVICE_BASE}/groups`,
      request,
      true
    );

    // Convert CreateGroupResponse to Conversation format
    return {
      conversationId: response.conversationId,
      type: 'group',
      participantIds: response.participantIds || response.memberIds || [],
      groupId: response.groupId,
      lastMessage: response.lastMessage || null,
      lastMessageAt: response.lastMessageAt || null,
      unreadCounts: {},
    };
  }

  /**
   * Lấy thông tin nhóm theo ID
   */
  static async getGroupById(groupId: string): Promise<any> {
    const response = await ApiService.get<any>(
      `${CHAT_SERVICE_BASE}/groups/${groupId}`,
      true
    );
    return response;
  }

  /**
   * Lấy danh sách thành viên nhóm
   */
  static async getGroupMembers(groupId: string): Promise<any[]> {
    const response = await ApiService.get<any[]>(
      `${CHAT_SERVICE_BASE}/groups/${groupId}/members`,
      true
    );
    return response;
  }

  /**
   * Thêm thành viên vào nhóm
   */
  static async addGroupMembers(groupId: string, userIds: string[]): Promise<any> {
    const response = await ApiService.post<any>(
      `${CHAT_SERVICE_BASE}/groups/members/add`,
      { groupId, userIds },
      true
    );
    return response;
  }

  /**
   * Xóa thành viên khỏi nhóm
   */
  static async removeGroupMember(groupId: string, userId: string): Promise<void> {
    await ApiService.delete<void>(
      `${CHAT_SERVICE_BASE}/groups/${groupId}/members/${userId}`,
      true
    );
  }

  /**
   * Rời khỏi nhóm
   */
  static async leaveGroup(groupId: string): Promise<void> {
    await ApiService.post<void>(
      `${CHAT_SERVICE_BASE}/groups/${groupId}/leave`,
      {},
      true
    );
  }

  /**
   * Cập nhật thông tin nhóm (tên, mô tả, avatar)
   */
  static async updateGroup(groupId: string, data: { name?: string; description?: string; avatarUrl?: string }): Promise<any> {
    const response = await ApiService.put<any>(
      `${CHAT_SERVICE_BASE}/groups/${groupId}`,
      data,
      true
    );
    return response;
  }

  /**
   * Xóa nhóm (chỉ OWNER)
   */
  static async deleteGroup(groupId: string): Promise<void> {
    await ApiService.delete<void>(
      `${CHAT_SERVICE_BASE}/groups/${groupId}`,
      true
    );
  }

  /**
   * Cập nhật vai trò thành viên (chỉ OWNER)
   */
  static async updateMemberRole(groupId: string, userId: string, role: 'ADMIN' | 'MEMBER'): Promise<any> {
    const response = await ApiService.put<any>(
      `${CHAT_SERVICE_BASE}/groups/members/role`,
      { groupId, userId, role },
      true
    );
    return response;
  }

  /**
   * Chuyển quyền sở hữu nhóm (chỉ OWNER)
   */
  static async transferOwnership(groupId: string, newOwnerId: string): Promise<any> {
    const response = await ApiService.post<any>(
      `${CHAT_SERVICE_BASE}/groups/${groupId}/transfer-ownership?newOwnerId=${newOwnerId}`,
      {},
      true
    );
    return response;
  }

  /**
   * Xóa tin nhắn
   * Chỉ chủ tin nhắn hoặc chủ cuộc hội thoại mới có thể xóa
   */
  static async deleteMessage(messageId: string): Promise<void> {
    await ApiService.delete<void>(
      `${CHAT_SERVICE_BASE}/messages/${messageId}`,
      true
    );
  }
}
