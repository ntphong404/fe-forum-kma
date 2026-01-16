import { ApiService } from '@/api/api.service';
import type {
  Group,
  PaginatedResponse,
  CreateGroupRequest,
  UpdateGroupRequest,
  JoinGroupRequest,
  GroupMember,
  GroupMemberCheck,
  UpdateMemberRoleRequest,
} from '@/interfaces/post.types';

export interface GetGroupsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetMembersParams {
  page?: number;
  limit?: number;
}

export class GroupService {
  /**
   * Create a new group
   */
  static async createGroup(data: CreateGroupRequest): Promise<Group> {
    return ApiService.post<Group>('/groups', data, true);
  }

  /**
   * Get all groups (paginated, with search)
   */
  static async getAllGroups(params: GetGroupsParams = {}): Promise<PaginatedResponse<Group>> {
    const { page = 0, limit = 10, search = '' } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
    });

    return ApiService.get<PaginatedResponse<Group>>(`/groups?${queryParams}`, true);
  }

  /**
   * Get group by ID
   */
  static async getGroupById(groupId: string): Promise<Group> {
    return ApiService.get<Group>(`/groups/${groupId}`, true);
  }

  /**
   * Update a group
   */
  static async updateGroup(groupId: string, data: UpdateGroupRequest): Promise<Group> {
    return ApiService.put<Group>(`/groups/${groupId}`, data, true);
  }

  /**
   * Delete a group
   */
  static async deleteGroup(groupId: string): Promise<void> {
    return ApiService.delete<void>(`/groups/${groupId}`, true);
  }

  /**
   * Join a group
   */
  static async joinGroup(data: JoinGroupRequest): Promise<{ groupId: string; userId: string; joinedAt: string }> {
    return ApiService.post<{ groupId: string; userId: string; joinedAt: string }>('/groups/join', data, true);
  }

  /**
   * Leave a group
   */
  static async leaveGroup(groupId: string): Promise<void> {
    return ApiService.post<void>(`/groups/leave/${groupId}`, {}, true);
  }

  /**
   * Get groups that the current user has joined
   */
  static async getMyGroups(params: GetGroupsParams = {}): Promise<Group[]> {
    const { page = 0, limit = 50, search = '' } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
    });

    // /groups/my-groups returns array directly, not paginated response
    try {
      const groups = await ApiService.get<Group[]>(`/groups/my-groups?${queryParams}`, true);
      return groups || [];
    } catch (error: any) {
      // If endpoint doesn't exist (404), fallback to getAllGroups
      if (error.statusCode === 404) {
        console.warn('Endpoint /groups/my-groups not found, using /groups instead');
        const paginatedResponse = await this.getAllGroups(params);
        return paginatedResponse.content;
      }
      throw error;
    }
  }

  /**
   * Get group members with pagination
   */
  static async getGroupMembers(
    groupId: string,
    params: GetMembersParams = {}
  ): Promise<PaginatedResponse<GroupMember>> {
    const { page = 0, limit = 20 } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return ApiService.get<PaginatedResponse<GroupMember>>(
      `/groups/${groupId}/members?${queryParams}`,
      true
    );
  }

  /**
   * Check current user's membership status in a group
   */
  static async checkMembership(groupId: string): Promise<GroupMemberCheck> {
    return ApiService.get<GroupMemberCheck>(`/groups/${groupId}/membership`, true);
  }

  /**
   * Update a member's role (OWNER or ADMIN only)
   */
  static async updateMemberRole(
    groupId: string,
    data: UpdateMemberRoleRequest
  ): Promise<GroupMember> {
    return ApiService.put<GroupMember>(`/groups/${groupId}/members/role`, data, true);
  }

  /**
   * Remove a member from the group (OWNER or ADMIN only)
   */
  static async removeMember(groupId: string, userId: string): Promise<void> {
    return ApiService.delete<void>(`/groups/${groupId}/members/${userId}`, true);
  }

  /**
   * Transfer group ownership to another member (OWNER only)
   */
  static async transferOwnership(groupId: string, newOwnerId: string): Promise<GroupMember> {
    const queryParams = new URLSearchParams({ newOwnerId });
    return ApiService.post<GroupMember>(
      `/groups/${groupId}/transfer-ownership?${queryParams}`,
      {},
      true
    );
  }

  /**
   * Get suggested groups to join
   * Returns random public groups that user is not a member of
   * @param limit - Maximum number of suggestions (default: 5)
   */
  static async getSuggestedGroups(limit: number = 5): Promise<Group[]> {
    return ApiService.get<Group[]>(`/groups/suggestions?limit=${limit}`, true);
  }
}
