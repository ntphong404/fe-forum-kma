import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2, MessageSquare, Image, Film, FileText, X } from 'lucide-react';
import { CommentService } from '../services/comment.service';
import { ApiService } from '@/api/api.service';
import type { Comment, ReactionType, CommentType } from '@/interfaces/post.types';
import CommentItem from './CommentItem';
import { useAuthStore } from '@/store/useStore';
import { toast } from 'sonner';

interface SelectedFile {
  file: File;
  preview?: string;
  id: string;
}

interface CommentSectionProps {
  postId: string;
  isOpen: boolean;
  onCommentCountChange?: (count: number) => void;
}

export default function CommentSection({ postId, isOpen, onCommentCountChange }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCommentCount, setTotalCommentCount] = useState(0);

  // Selected files for upload
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [mediaType, setMediaType] = useState<CommentType>('TEXT');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const currentUser = useAuthStore((s) => s.user);

  // Helper function to calculate total comment count including all nested replies
  const calculateTotalCommentsWithNestedReplies = async (commentList: Comment[]): Promise<number> => {
    let totalCount = 0;

    // Recursive function to count replies at any depth
    const countRepliesRecursively = async (replies: Comment[]): Promise<number> => {
      let count = 0;
      for (const reply of replies) {
        count += 1; // Count this reply

        if ((reply.replyCount ?? 0) > 0) {
          try {
            // Fetch nested replies
            const nestedReplies = await CommentService.getRepliesByCommentId(reply.commentId);
            count += await countRepliesRecursively(nestedReplies);
          } catch (err) {
            // Fallback to replyCount if fetch fails
            count += reply.replyCount ?? 0;
          }
        }
      }
      return count;
    };

    for (const comment of commentList) {
      totalCount += 1; // Count the comment itself

      if ((comment.replyCount ?? 0) > 0) {
        try {
          // Fetch replies to get accurate nested count
          const replies = await CommentService.getRepliesByCommentId(comment.commentId);
          totalCount += await countRepliesRecursively(replies);
        } catch (err) {
          // Fallback to replyCount if fetch fails
          totalCount += comment.replyCount ?? 0;
        }
      }
    }

    return totalCount;
  };

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      selectedFiles.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
    };
  }, []);

  const loadComments = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    if (!isOpen) return;

    try {
      if (pageNum === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await CommentService.getCommentsByPost({
        postId,
        page: pageNum,
        size: 10,
      });

      const commentsWithReactions = response.map((comment) => ({
        ...comment,
        myReaction: comment.myReaction || null,
      }));

      if (append) {
        setComments((prev) => [...prev, ...commentsWithReactions]);
      } else {
        setComments(commentsWithReactions);
        if (pageNum === 0) {
          // Calculate total comments including all nested replies
          calculateTotalCommentsWithNestedReplies(commentsWithReactions).then(totalCount => {
            setTotalCommentCount(totalCount);
            onCommentCountChange?.(totalCount);
          });
        }
      }

      setHasMore(response.length === 10);
      setPage(pageNum);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải bình luận');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [postId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadComments(0, false);
    }
  }, [isOpen, loadComments]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadComments(page + 1, true);
    }
  };

  const handleFileSelect = (files: FileList | null, type: CommentType) => {
    if (!files || files.length === 0) return;

    // Clear previous files
    selectedFiles.forEach(f => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });

    const newFiles: SelectedFile[] = Array.from(files).map(file => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      preview: (type === 'IMAGE' || type === 'VIDEO') ? URL.createObjectURL(file) : undefined,
    }));

    setSelectedFiles(newFiles);
    setMediaType(type);
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      const remaining = prev.filter(f => f.id !== fileId);
      if (remaining.length === 0) {
        setMediaType('TEXT');
      }
      return remaining;
    });
  };

  const clearFiles = () => {
    selectedFiles.forEach(f => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setSelectedFiles([]);
    setMediaType('TEXT');
  };

  const handleSubmitComment = async () => {
    if ((!newComment.trim() && selectedFiles.length === 0) || submitting) return;

    setSubmitting(true);
    try {
      let uploadedUrls: string[] = [];

      // Upload files if any
      if (selectedFiles.length > 0) {
        for (const fileItem of selectedFiles) {
          let uploadEndpoint: string;
          if (mediaType === 'IMAGE') {
            uploadEndpoint = '/files/upload/image';
          } else if (mediaType === 'VIDEO') {
            uploadEndpoint = '/files/upload/video';
          } else {
            uploadEndpoint = '/files/upload/document';
          }

          const result = await ApiService.uploadFile<{ resourceUrl: string }>(
            uploadEndpoint,
            fileItem.file
          );
          uploadedUrls.push(result.resourceUrl);
        }
      }

      const senderName = `${currentUser?.lastName || ''} ${currentUser?.firstName || ''}`.trim() || currentUser?.username;

      const created = await CommentService.createComment({
        postId,
        content: newComment.trim(),
        senderName,
        type: selectedFiles.length > 0 ? mediaType : 'TEXT',
        urls: uploadedUrls,
      });

      const authorName = created.authorName && created.authorName !== created.authorId
        ? created.authorName
        : senderName || created.authorId;

      const authorAvatarUrl = created.authorAvatarUrl || currentUser?.avatarUrl;

      setComments((prev) => {
        const newComments = [{
          ...created,
          authorName,
          authorAvatarUrl,
          myReaction: null,
          replyCount: 0
        }, ...prev];
        return newComments;
      });

      // Increment total count by 1 for the new comment
      const newCount = totalCommentCount + 1;
      setTotalCommentCount(newCount);
      onCommentCountChange?.(newCount);

      setNewComment('');
      clearFiles();
      toast.success('Đã gửi bình luận');
    } catch (err: any) {
      console.error('Failed to create comment:', err);
      toast.error(err?.message || 'Không thể gửi bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await CommentService.deleteComment(commentId);

      // Find the comment to get its replyCount before removing
      const deletedComment = comments.find((c) => c.commentId === commentId);
      const deletedRepliesCount = deletedComment?.replyCount || 0;

      setComments((prev) => prev.filter((c) => c.commentId !== commentId));

      // Decrement total count (comment + all its replies)
      const newCount = Math.max(totalCommentCount - 1 - deletedRepliesCount, 0);
      setTotalCommentCount(newCount);
      onCommentCountChange?.(newCount);
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleUpdateComment = async (commentId: string, content: string) => {
    try {
      const updated = await CommentService.updateComment(commentId, { content });
      setComments((prev) =>
        prev.map((c) => (c.commentId === commentId ? { ...c, ...updated } : c))
      );
    } catch (err) {
      console.error('Failed to update comment:', err);
    }
  };

  const handleReactionChange = (commentId: string, newCount: number, myReaction: ReactionType | null) => {
    setComments((prev) =>
      prev.map((c) =>
        c.commentId === commentId
          ? { ...c, reactionCount: newCount, myReaction }
          : c
      )
    );
  };

  // Handle when a reply is added to a comment (at any depth)
  const handleReplyAdded = (parentCommentId: string, _content: string) => {
    // Update parent comment's replyCount for UI display
    setComments((prev) =>
      prev.map((c) =>
        c.commentId === parentCommentId
          ? { ...c, replyCount: (c.replyCount || 0) + 1 }
          : c
      )
    );
    // Increment total count by 1 (for the new reply)
    const newCount = totalCommentCount + 1;
    setTotalCommentCount(newCount);
    onCommentCountChange?.(newCount);
  };

  // Handle when a reply is deleted from a comment (at any depth)
  const handleReplyDeleted = (parentCommentId: string) => {
    // Update parent comment's replyCount for UI display
    setComments((prev) =>
      prev.map((c) =>
        c.commentId === parentCommentId
          ? { ...c, replyCount: Math.max((c.replyCount || 0) - 1, 0) }
          : c
      )
    );
    // Decrement total count by 1
    const newCount = Math.max(totalCommentCount - 1, 0);
    setTotalCommentCount(newCount);
    onCommentCountChange?.(newCount);
  };

  if (!isOpen) return null;

  return (
    <div className="border-t border-slate-100 bg-slate-50/50">
      {/* Comment Input */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          {currentUser?.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.firstName || 'avatar'}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow-sm"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0 ring-2 ring-white shadow-sm">
              <span className="text-white text-xs font-bold">
                {currentUser?.lastName?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          )}

          <div className="flex-1 space-y-3">
            {/* Text Input */}
            <div className="relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Viết bình luận của bạn..."
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-slate-400"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
              />
            </div>

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-3">
                {/* Image Preview */}
                {mediaType === 'IMAGE' && (
                  <div className="grid grid-cols-4 gap-2">
                    {selectedFiles.map((fileItem) => (
                      <div key={fileItem.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 group">
                        {fileItem.preview && (
                          <img
                            src={fileItem.preview}
                            alt={fileItem.file.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <button
                          onClick={() => removeFile(fileItem.id)}
                          className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
                        >
                          <X className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Video Preview */}
                {mediaType === 'VIDEO' && (
                  <div className="space-y-2">
                    {selectedFiles.map((fileItem) => (
                      <div key={fileItem.id} className="relative rounded-lg overflow-hidden bg-slate-900 group">
                        {fileItem.preview && (
                          <video
                            src={fileItem.preview}
                            className="w-full max-h-48 object-contain"
                            muted
                          />
                        )}
                        <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Film className="w-3 h-3" />
                          Video
                        </div>
                        <button
                          onClick={() => removeFile(fileItem.id)}
                          className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
                        >
                          <X className="w-3.5 h-3.5 text-white" />
                        </button>
                        <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                          {fileItem.file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Document Preview */}
                {mediaType === 'DOC' && (
                  <div className="space-y-2">
                    {selectedFiles.map((fileItem) => (
                      <div key={fileItem.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg group">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{fileItem.file.name}</p>
                          <p className="text-xs text-slate-400">{(fileItem.file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button
                          onClick={() => removeFile(fileItem.id)}
                          className="w-7 h-7 hover:bg-red-50 rounded-full flex items-center justify-center transition-colors"
                        >
                          <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between">
              {/* Media Buttons */}
              <div className="flex items-center gap-1">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files, 'IMAGE')}
                  className="hidden"
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileSelect(e.target.files, 'VIDEO')}
                  className="hidden"
                />
                <input
                  ref={docInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.zip,.rar,.xls,.xlsx,.ppt,.pptx"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files, 'DOC')}
                  className="hidden"
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={submitting}
                  className={`h-8 px-2.5 rounded-lg transition-all ${mediaType === 'IMAGE' && selectedFiles.length > 0
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  title="Thêm ảnh"
                >
                  <Image className="w-4 h-4 mr-1" />
                  <span className="text-xs">Ảnh</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={submitting}
                  className={`h-8 px-2.5 rounded-lg transition-all ${mediaType === 'VIDEO' && selectedFiles.length > 0
                    ? 'bg-purple-50 text-purple-600'
                    : 'text-slate-500 hover:text-purple-600 hover:bg-purple-50'
                    }`}
                  title="Thêm video"
                >
                  <Film className="w-4 h-4 mr-1" />
                  <span className="text-xs">Video</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => docInputRef.current?.click()}
                  disabled={submitting}
                  className={`h-8 px-2.5 rounded-lg transition-all ${mediaType === 'DOC' && selectedFiles.length > 0
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
                    }`}
                  title="Thêm tài liệu"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  <span className="text-xs">Tài liệu</span>
                </Button>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmitComment}
                disabled={(!newComment.trim() && selectedFiles.length === 0) || submitting}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl px-5 h-9 text-sm font-medium shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-1.5" />
                    Gửi
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500 mr-2" />
            <span className="text-sm text-slate-500">Đang tải bình luận...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-red-500">
            <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm font-medium">Lỗi: {error}</p>
            <button
              onClick={() => loadComments(0, false)}
              className="mt-2 text-xs text-blue-500 hover:underline"
            >
              Thử lại
            </button>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">Chưa có bình luận nào</p>
            <p className="text-xs">Hãy là người đầu tiên bình luận!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.commentId}
                comment={comment}
                postId={postId}
                onDelete={handleDeleteComment}
                onUpdate={handleUpdateComment}
                onReactionChange={handleReactionChange}
                onReply={handleReplyAdded}
                onReplyDeleted={handleReplyDeleted}
              />
            ))}

            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tải...
                  </>
                ) : (
                  'Xem thêm bình luận'
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
