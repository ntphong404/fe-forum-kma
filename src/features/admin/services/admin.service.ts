import { ApiService } from '@/api/api.service';
import endpoints from '@/api/endpoints';
import { User } from '@/interfaces/auth.types';

// Types
export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
}

export interface AdminPost {
  postId: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  groupId?: string;
  groupName?: string;
  status: 'PENDING' | 'PUBLISHED' | 'DELETED';
  reactionCount: number;
  commentCount: number;
  type: 'TEXT' | 'IMAGE' | 'DOC';
  resourceUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminGroup {
  id: string;
  name: string;
  description?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  memberCount: number;
  postCount: number;
  createdAt: string;
  ownerId: string;
  ownerName?: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

export interface AdminComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  parentId?: string;
  reactionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalPosts: number;
  totalGroups: number;
  totalComments: number;
  pendingReports: number;
}

export interface BackupInfo {
  date: string;
  size: string;
  mongoSize: string;
  postgresSize: string;
  minioSize: string;
  createdAt: string;
  location: string; // "local", "cloud", "local+cloud"
}

export interface BackupJobResponse {
  jobId: string;
  status: string;
  message?: string;
}

export interface RestoreJobResponse {
  jobId: string;
  status: string;
  date: string;
}

export interface JobStatus {
  jobId: string;
  status: string;
  progress: number;
  message?: string;
  error?: string;
}

export interface ReportResponse {
  reportId: string;
  postId: string;
  reportedById: string;
  reportedByName: string;
  reason: 'SPAM' | 'HARASSMENT' | 'OFFENSIVE_CONTENT' | 'MISINFORMATION' | 'COPYRIGHT' | 'ADULT_CONTENT' | 'VIOLENCE' | 'OTHER';
  description: string;
  status: 'PENDING' | 'RESOLVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  post?: AdminPost;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}
export class AdminService {
  // ============= USER MANAGEMENT =============

  /**
   * Transform API user response (uses 'id' field) to User interface (expects 'userId' field)
   */
  private static mapUserResponse(user: any): User {
    return {
      ...user,
      userId: user.id || user.userId,
    };
  }

  /**
   * Transform API group response (uses 'groupId'/'groupName') to AdminGroup interface (expects 'id'/'name')
   */
  private static mapGroupResponse(group: any): AdminGroup {
    return {
      ...group,
      id: group.groupId || group.id,
      name: group.groupName || group.name,
    };
  }

  /**
   * Get all users with pagination and optional status filter
   */
  static async getAllUsers(page = 0, size = 10, status?: string): Promise<PaginatedResponse<User>> {
    let url = `${endpoints.ADMIN_ENDPOINTS.GET_ALL_USERS}?page=${page}&size=${size}`;
    if (status) {
      url += `&status=${encodeURIComponent(status)}`;
    }
    const response = await ApiService.get<any>(url, true);
    // Map the response to transform 'id' to 'userId'
    if (response && response.content) {
      response.content = response.content.map((user: any) => this.mapUserResponse(user));
    }
    return response;
  }

  /**
   * Search users by keyword
   */
  static async searchUsers(keyword: string, page = 0, size = 10): Promise<PaginatedResponse<User>> {
    const response = await ApiService.get<any>(
      `${endpoints.ADMIN_ENDPOINTS.SEARCH_USERS}?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`,
      true
    );
    // Map the response to transform 'id' to 'userId'
    if (response && response.content) {
      response.content = response.content.map((user: any) => this.mapUserResponse(user));
    }
    return response;
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<User> {
    const response = await ApiService.get<any>(
      endpoints.ADMIN_ENDPOINTS.GET_USER_BY_ID(id),
      true
    );
    return this.mapUserResponse(response);
  }

  /**
   * Ban user
   */
  static async banUser(userId: string): Promise<User> {
    const response = await ApiService.post<any>(
      endpoints.ADMIN_ENDPOINTS.BAN_USER(userId),
      {},
      true
    );
    return this.mapUserResponse(response);
  }

  /**
   * Unban user
   */
  static async unbanUser(userId: string): Promise<User> {
    const response = await ApiService.post<any>(
      endpoints.ADMIN_ENDPOINTS.UNBAN_USER(userId),
      {},
      true
    );
    return this.mapUserResponse(response);
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: string): Promise<void> {
    await ApiService.delete<any>(
      endpoints.ADMIN_ENDPOINTS.DELETE_USER(userId),
      true
    );
  }

  /**
   * Create new user (admin)
   */
  static async createUser(data: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    const response = await ApiService.post<any>(
      endpoints.ADMIN_ENDPOINTS.CREATE_USER,
      data,
      true
    );
    return this.mapUserResponse(response);
  }

  // ============= ROLE MANAGEMENT =============

  /**
   * Get all roles
   */
  static async getAllRoles(): Promise<Role[]> {
    const response = await ApiService.get<any>(
      endpoints.ADMIN_ENDPOINTS.GET_ALL_ROLES,
      true
    );
    return response;
  }

  /**
   * Get role by ID
   */
  static async getRoleById(id: string): Promise<Role> {
    const response = await ApiService.get<any>(
      endpoints.ADMIN_ENDPOINTS.GET_ROLE_BY_ID(id),
      true
    );
    return response;
  }

  /**
   * Create new role
   */
  static async createRole(data: { name: string; permissions: string[] }): Promise<Role> {
    const response = await ApiService.post<any>(
      endpoints.ADMIN_ENDPOINTS.CREATE_ROLE,
      data,
      true
    );
    return response;
  }

  /**
   * Update role
   */
  static async updateRole(id: string, data: { name: string; permissions: string[] }): Promise<Role> {
    const response = await ApiService.put<any>(
      endpoints.ADMIN_ENDPOINTS.UPDATE_ROLE(id),
      data,
      true
    );
    return response;
  }

  /**
   * Delete role
   */
  static async deleteRole(id: string): Promise<void> {
    await ApiService.delete<any>(
      endpoints.ADMIN_ENDPOINTS.DELETE_ROLE(id),
      true
    );
  }

  // ============= POST MANAGEMENT =============

  /**
   * Get all posts with pagination and search
   */
  static async getAllPosts(page = 0, limit = 10, search = ''): Promise<PaginatedResponse<AdminPost>> {
    let url = `${endpoints.ADMIN_ENDPOINTS.GET_ALL_POSTS}?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const response = await ApiService.get<any>(url, true);
    return response;
  }

  /**
   * Delete post
   */
  static async deletePost(postId: string): Promise<void> {
    await ApiService.delete<any>(
      endpoints.ADMIN_ENDPOINTS.DELETE_POST(postId),
      true
    );
  }

  /**
   * Get posts by group with status filter
   */
  static async getPostsByGroup(
    groupId: string,
    page = 0,
    limit = 10,
    status?: 'PENDING' | 'PUBLISHED' | 'DELETED'
  ): Promise<PaginatedResponse<AdminPost>> {
    let url = `${endpoints.ADMIN_ENDPOINTS.GET_POSTS_BY_GROUP(groupId)}?page=${page}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    const response = await ApiService.get<any>(url, true);
    return response;
  }

  // ============= GROUP MANAGEMENT =============

  /**
   * Get all groups with pagination
   */
  static async getAllGroups(page = 0, size = 10, search = ''): Promise<PaginatedResponse<AdminGroup>> {
    let url = `${endpoints.ADMIN_ENDPOINTS.GET_ALL_GROUPS}?page=${page}&limit=${size}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const response = await ApiService.get<any>(url, true);

    // Map the response to transform 'groupId'/'groupName' to 'id'/'name'
    if (response && response.content) {
      response.content = response.content.map((group: any) => this.mapGroupResponse(group));
    }
    return response;
  }

  /**
   * Get group by ID
   */
  static async getGroupById(id: string): Promise<AdminGroup> {
    const response = await ApiService.get<any>(
      endpoints.ADMIN_ENDPOINTS.GET_GROUP_BY_ID(id),
      true
    );
    return this.mapGroupResponse(response);
  }

  /**
   * Delete group
   */
  static async deleteGroup(groupId: string): Promise<void> {
    await ApiService.delete<any>(
      endpoints.ADMIN_ENDPOINTS.DELETE_GROUP(groupId),
      true
    );
  }

  /**
   * Get group members with pagination
   */
  static async getGroupMembers(groupId: string, page = 0, limit = 20): Promise<PaginatedResponse<GroupMember>> {
    const response = await ApiService.get<any>(
      `${endpoints.ADMIN_ENDPOINTS.GET_GROUP_MEMBERS(groupId)}?page=${page}&limit=${limit}`,
      true
    );
    return response;
  }

  /**
   * Update member role
   */
  static async updateMemberRole(
    groupId: string,
    userId: string,
    role: 'ADMIN' | 'MEMBER'
  ): Promise<GroupMember> {
    const response = await ApiService.put<any>(
      endpoints.ADMIN_ENDPOINTS.UPDATE_MEMBER_ROLE(groupId),
      { userId, role },
      true
    );
    return response;
  }

  /**
   * Remove member from group
   */
  static async removeMember(groupId: string, userId: string): Promise<void> {
    await ApiService.delete<any>(
      endpoints.ADMIN_ENDPOINTS.REMOVE_MEMBER(groupId, userId),
      true
    );
  }

  // ============= COMMENT MANAGEMENT =============

  /**
   * Get comments by post with pagination
   */
  static async getCommentsByPost(postId: string, page = 0, size = 10): Promise<AdminComment[]> {
    const response = await ApiService.get<any>(
      `/comments/post?postId=${postId}&page=${page}&size=${size}`,
      true
    );
    return response || [];
  }

  /**
   * Delete comment
   */
  static async deleteComment(commentId: string): Promise<void> {
    await ApiService.delete<any>(
      endpoints.ADMIN_ENDPOINTS.DELETE_COMMENT(commentId),
      true
    );
  }

  // ============= STATISTICS =============

  /**
   * Get admin dashboard statistics from post-service
   * Returns aggregated system statistics in one API call
   */
  static async getDashboardStatistics(): Promise<any> {
    const response = await ApiService.get<any>(
      endpoints.ADMIN_ENDPOINTS.DASHBOARD_STATISTICS,
      true
    );
    console.log('Dashboard statistics response:', response);
    // Response is already extracted, no need to access .result or .data
    return response || {};
  }

  /**
   * Get admin dashboard statistics
   * Aggregates data from multiple endpoints
   */
  static async getStats(): Promise<AdminStats> {
    try {
      // Fetch data from multiple endpoints in parallel
      const [usersResponse, postsResponse, groupsResponse] = await Promise.allSettled([
        this.getAllUsers(0, 1),
        this.getAllPosts(0, 1),
        this.getAllGroups(0, 1),
      ]);

      const totalUsers = usersResponse.status === 'fulfilled' ? usersResponse.value.totalElements : 0;
      const totalPosts = postsResponse.status === 'fulfilled' ? postsResponse.value.totalElements : 0;
      const totalGroups = groupsResponse.status === 'fulfilled' ? groupsResponse.value.totalElements : 0;

      return {
        totalUsers,
        activeUsers: totalUsers,
        bannedUsers: 0,
        totalPosts,
        totalGroups,
        totalComments: 0,
        pendingReports: 0,
      };
    } catch {
      return {
        totalUsers: 0,
        activeUsers: 0,
        bannedUsers: 0,
        totalPosts: 0,
        totalGroups: 0,
        totalComments: 0,
        pendingReports: 0,
      };
    }
  }

  // ============= REPORT MANAGEMENT =============

  /**
   * Get all reports with pagination
   */
  static async getAllReports(page = 0, limit = 10): Promise<PageResponse<ReportResponse>> {
    const response = await ApiService.get<any>(
      `${endpoints.ADMIN_ENDPOINTS.GET_ALL_REPORTS}?page=${page}&limit=${limit}`,
      true
    );
    return response;
  }

  /**
   * Get pending reports only
   */
  static async getPendingReports(page = 0, limit = 10): Promise<PageResponse<ReportResponse>> {
    const response = await ApiService.get<any>(
      `${endpoints.ADMIN_ENDPOINTS.GET_PENDING_REPORTS}?page=${page}&limit=${limit}`,
      true
    );
    return response;
  }

  /**
   * Get all reports for a specific post
   */
  static async getPostReports(postId: string, page = 0, limit = 10): Promise<PageResponse<ReportResponse>> {
    const response = await ApiService.get<any>(
      `${endpoints.ADMIN_ENDPOINTS.GET_POST_REPORTS(postId)}?page=${page}&limit=${limit}`,
      true
    );
    return response;
  }

  /**
   * Resolve all reports for a specific post
   */
  static async resolvePostReports(
    postId: string,
    decision: 'RESOLVED' | 'REJECTED',
    reason: string
  ): Promise<string> {
    const response = await ApiService.post<any>(
      endpoints.ADMIN_ENDPOINTS.RESOLVE_POST_REPORTS(postId),
      {
        decision,
        reason,
      },
      true
    );
    return response;
  }

  // ============= BACKUP MANAGEMENT =============

  /**
   * Get all backups
   */
  static async getAllBackups(): Promise<{ backups: BackupInfo[] }> {
    const response = await ApiService.get<any>(
      endpoints.BACKUP_ENDPOINTS.GET_ALL,
      true
    );
    // Handle both array and object response formats
    if (Array.isArray(response)) {
      return { backups: response };
    }
    return response;
  }

  /**
   * Trigger a new backup
   */
  static async triggerBackup(): Promise<BackupJobResponse> {
    const response = await ApiService.post<BackupJobResponse>(
      endpoints.BACKUP_ENDPOINTS.TRIGGER_BACKUP,
      {},
      true
    );
    return response;
  }

  /**
   * Trigger restore from a backup
   */
  static async triggerRestore(date: string): Promise<RestoreJobResponse> {
    const response = await ApiService.post<RestoreJobResponse>(
      endpoints.BACKUP_ENDPOINTS.TRIGGER_RESTORE,
      { date },
      true
    );
    return response;
  }

  /**
   * Get backup job status
   */
  static async getBackupStatus(jobId: string): Promise<JobStatus> {
    const response = await ApiService.get<JobStatus>(
      endpoints.BACKUP_ENDPOINTS.GET_BACKUP_STATUS(jobId),
      true
    );
    return response;
  }

  /**
   * Get restore job status
   */
  static async getRestoreStatus(jobId: string): Promise<JobStatus> {
    const response = await ApiService.get<JobStatus>(
      endpoints.BACKUP_ENDPOINTS.GET_RESTORE_STATUS(jobId),
      true
    );
    return response;
  }
}
