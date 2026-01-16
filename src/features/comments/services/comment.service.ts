import { ApiService } from '@/api/api.service';
import type {
  Comment,
  CreateCommentRequest,
  UpdateCommentRequest,
  ReactionType,
} from '@/interfaces/post.types';

export interface GetCommentsParams {
  postId: string;
  page?: number;
  size?: number;
}

// Backend API response interface
interface CommentApiResponse {
  commentId: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  content: string;
  parentCommentId: string | null;
  type: string | null;           // TEXT, IMAGE, VIDEO, DOC
  resourceUrls: string[] | null; // URLs of images/videos/docs
  replyCount: number;
  createdAt: string;
  updatedAt: string | null;
  reactionCount: number;
  userReactionType: string | null; // Backend uses this field name
}

// Helper function to map API response to frontend Comment type
function mapApiResponseToComment(apiResponse: CommentApiResponse): Comment {
  return {
    commentId: apiResponse.commentId,
    postId: apiResponse.postId,
    authorId: apiResponse.authorId,
    authorName: apiResponse.authorName,
    authorAvatarUrl: apiResponse.authorAvatarUrl || undefined,
    content: apiResponse.content,
    parentCommentId: apiResponse.parentCommentId || undefined,
    type: (apiResponse.type as Comment['type']) || 'TEXT',
    resourceUrls: apiResponse.resourceUrls || undefined,
    replyCount: apiResponse.replyCount,
    reactionCount: apiResponse.reactionCount,
    myReaction: apiResponse.userReactionType as ReactionType | null,
    createdAt: apiResponse.createdAt,
    updatedAt: apiResponse.updatedAt || undefined,
  };
}

export class CommentService {
  /**
   * Get comments by post ID (top-level comments only)
   */
  static async getCommentsByPost(params: GetCommentsParams): Promise<Comment[]> {
    const { postId, page = 0, size = 10 } = params;
    const queryParams = new URLSearchParams({
      postId,
      page: page.toString(),
      size: size.toString(),
    });

    try {
      // Backend returns paginated response: { content: [...], pageNumber, pageSize, totalElements, totalPages }
      const apiResponse = await ApiService.get<{ content: CommentApiResponse[] } | CommentApiResponse[]>(
        `/comments/post?${queryParams}`,
        true
      );

      // Handle case where apiResponse is null or undefined
      if (!apiResponse) {
        return [];
      }

      // Handle paginated response (object with 'content' array)
      let commentsArray: CommentApiResponse[];
      if (Array.isArray(apiResponse)) {
        // Direct array response (backward compatibility)
        commentsArray = apiResponse;
      } else if (apiResponse && typeof apiResponse === 'object' && 'content' in apiResponse) {
        // Paginated response - extract content array
        commentsArray = apiResponse.content || [];
      } else {
        return [];
      }

      return commentsArray.map(mapApiResponseToComment);
    } catch (error: any) {
      // Handle PS_003 (COMMENT_NOT_FOUND) as empty array, not an error
      if (error?.code === 'PS_003') {
        return [];
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Get replies for a specific comment
   */
  static async getRepliesByCommentId(commentId: string): Promise<Comment[]> {
    const apiResponse = await ApiService.get<CommentApiResponse[]>(`/comments/${commentId}/replies`, true);
    return apiResponse.map(mapApiResponseToComment);
  }

  /**
   * Create a new comment or reply
   */
  static async createComment(data: CreateCommentRequest): Promise<Comment> {
    const apiResponse = await ApiService.post<CommentApiResponse>('/comments', data, true);
    return mapApiResponseToComment(apiResponse);
  }

  /**
   * Update a comment
   */
  static async updateComment(commentId: string, data: UpdateCommentRequest): Promise<Comment> {
    const apiResponse = await ApiService.put<CommentApiResponse>(`/comments/${commentId}`, data, true);
    return mapApiResponseToComment(apiResponse);
  }

  /**
   * Delete a comment
   */
  static async deleteComment(commentId: string): Promise<void> {
    return ApiService.delete<void>(`/comments/${commentId}`, true);
  }
}
