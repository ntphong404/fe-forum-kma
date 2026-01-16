import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit2, Trash2, Check, X, ChevronDown, ChevronUp, Image, Film, FileText, Send, Loader2 } from 'lucide-react';
import type { Comment, ReactionType, CommentType } from '@/interfaces/post.types';
import { ReactionPicker } from '@/features/reactions';
import CommentMediaDisplay from './CommentMediaDisplay';
import { InteractionService } from '@/features/reactions/services/interaction.service';
import { CommentService } from '../services/comment.service';
import { ApiService } from '@/api/api.service';
import { useAuthStore } from '@/store/useStore';
import { formatTimeAgo } from '@/lib/date.utils';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SelectedFile {
  file: File;
  preview?: string;
  id: string;
}

interface CommentItemProps {
  comment: Comment;
  postId: string;
  onDelete: (commentId: string) => void;
  onUpdate: (commentId: string, content: string) => void;
  onReactionChange: (commentId: string, newCount: number, myReaction: ReactionType | null) => void;
  onReply?: (parentCommentId: string, content: string) => void;
  onReplyDeleted?: (parentCommentId: string) => void;
  depth?: number;
}

export default function CommentItem({
  comment,
  postId,
  onDelete,
  onUpdate,
  onReactionChange,
  onReply,
  onReplyDeleted,
  depth = 0,
}: CommentItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [reacting, setReacting] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [cachedTotalReplies, setCachedTotalReplies] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Reply media states
  const [replyFiles, setReplyFiles] = useState<SelectedFile[]>([]);
  const [replyMediaType, setReplyMediaType] = useState<CommentType>('TEXT');
  const replyImageRef = useRef<HTMLInputElement>(null);
  const replyVideoRef = useRef<HTMLInputElement>(null);
  const replyDocRef = useRef<HTMLInputElement>(null);

  const authorAvatarUrl = comment.authorAvatarUrl || null;
  const currentUser = useAuthStore((s) => s.user);

  const canModifyComment = currentUser && (
    currentUser.userId === comment.authorId ||
    currentUser.roleName === 'ADMIN' ||
    currentUser.roleName === 'ROLE_ADMIN' ||
    currentUser.roles?.includes('ADMIN') ||
    currentUser.roles?.includes('ROLE_ADMIN')
  );

  const calculateTotalReplies = (commentList: Comment[]): number => {
    return commentList.reduce((total, reply) => {
      return total + 1 + (reply.replyCount ?? 0);
    }, 0);
  };

  useEffect(() => {
    const prefetchTotalCount = async () => {
      if ((comment.replyCount ?? 0) > 0 && cachedTotalReplies === null) {
        try {
          const fetchedReplies = await CommentService.getRepliesByCommentId(comment.commentId);
          const total = calculateTotalReplies(fetchedReplies);
          setCachedTotalReplies(total);
          setReplies(fetchedReplies);
        } catch (err) {
          console.error('Failed to prefetch replies count:', err);
        }
      }
    };
    prefetchTotalCount();
  }, [comment.commentId, comment.replyCount]);

  const getTotalReplyCount = (): number => {
    if (cachedTotalReplies !== null) {
      return cachedTotalReplies;
    }
    return comment.replyCount ?? 0;
  };

  const formatTime = () => formatTimeAgo(comment.createdAt);

  const handleReaction = async (type: ReactionType) => {
    if (reacting) return;
    setReacting(true);
    try {
      const senderName = `${currentUser?.lastName || ''} ${currentUser?.firstName || ''}`.trim() || currentUser?.username || '';
      const result = await InteractionService.createOrUpdateInteraction({
        postId,
        commentId: comment.commentId,
        type,
        senderName,
      });
      // If result is null, it means the reaction was removed (toggle)
      const newReaction = result?.type || null;
      const count = await InteractionService.getInteractionCount(postId, comment.commentId);
      onReactionChange(comment.commentId, count.totalCount || 0, newReaction);
    } catch (err) {
      console.error('Failed to react:', err);
    } finally {
      setReacting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    try {
      await CommentService.updateComment(comment.commentId, { content: editContent.trim() });
      onUpdate(comment.commentId, editContent.trim());
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update comment:', err);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await CommentService.deleteComment(comment.commentId);
      onDelete(comment.commentId);
      setShowDeleteDialog(false);
    } catch (err) {
      console.error('Failed to delete comment:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleLoadReplies = async () => {
    if (showReplies) {
      setShowReplies(false);
      return;
    }

    if (replies.length > 0) {
      setShowReplies(true);
      return;
    }

    setLoadingReplies(true);
    try {
      const fetchedReplies = await CommentService.getRepliesByCommentId(comment.commentId);
      setReplies(fetchedReplies);
      const total = calculateTotalReplies(fetchedReplies);
      setCachedTotalReplies(total);
      setShowReplies(true);
    } catch (err) {
      console.error('Failed to load replies:', err);
    } finally {
      setLoadingReplies(false);
    }
  };

  // Reply file handling
  const handleReplyFileSelect = (files: FileList | null, type: CommentType) => {
    if (!files || files.length === 0) return;

    replyFiles.forEach(f => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });

    const newFiles: SelectedFile[] = Array.from(files).map(file => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      preview: (type === 'IMAGE' || type === 'VIDEO') ? URL.createObjectURL(file) : undefined,
    }));

    setReplyFiles(newFiles);
    setReplyMediaType(type);
  };

  const removeReplyFile = (fileId: string) => {
    setReplyFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      const remaining = prev.filter(f => f.id !== fileId);
      if (remaining.length === 0) {
        setReplyMediaType('TEXT');
      }
      return remaining;
    });
  };

  const clearReplyFiles = () => {
    replyFiles.forEach(f => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setReplyFiles([]);
    setReplyMediaType('TEXT');
  };

  const handleSubmitReply = async () => {
    if ((!replyContent.trim() && replyFiles.length === 0) || submittingReply) return;

    setSubmittingReply(true);
    try {
      let uploadedUrls: string[] = [];

      // Upload files if any
      if (replyFiles.length > 0) {
        for (const fileItem of replyFiles) {
          let uploadEndpoint: string;
          if (replyMediaType === 'IMAGE') {
            uploadEndpoint = '/files/upload/image';
          } else if (replyMediaType === 'VIDEO') {
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

      const senderName = `${currentUser?.lastName || ''} ${currentUser?.firstName || ''}`.trim() || currentUser?.username || '';
      const newReply = await CommentService.createComment({
        postId,
        content: replyContent.trim(),
        parentCommentId: comment.commentId,
        senderName,
        type: replyFiles.length > 0 ? replyMediaType : 'TEXT',
        urls: uploadedUrls,
      });

      const authorName = newReply.authorName && newReply.authorName !== newReply.authorId
        ? newReply.authorName
        : senderName || newReply.authorId;

      const replyAuthorAvatarUrl = newReply.authorAvatarUrl || currentUser?.avatarUrl;

      setReplies((prev) => [...prev, {
        ...newReply,
        authorName,
        authorAvatarUrl: replyAuthorAvatarUrl,
        myReaction: null
      }]);
      // Update cached reply count
      setCachedTotalReplies((prev) => (prev ?? 0) + 1);
      setReplyContent('');
      clearReplyFiles();
      setShowReplyInput(false);
      if (!showReplies) setShowReplies(true);
      onReply?.(comment.commentId, replyContent.trim());
      toast.success('Đã gửi trả lời');
    } catch (err: any) {
      console.error('Failed to submit reply:', err);
      toast.error(err?.message || 'Không thể gửi trả lời');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteReply = (replyId: string) => {
    setReplies((prev) => prev.filter((r) => r.commentId !== replyId));
    // Update cached reply count
    setCachedTotalReplies((prev) => Math.max((prev ?? 1) - 1, 0));
    // Notify parent that a reply was deleted
    onReplyDeleted?.(comment.commentId);
  };

  const handleUpdateReply = (replyId: string, content: string) => {
    setReplies((prev) =>
      prev.map((r) => (r.commentId === replyId ? { ...r, content } : r))
    );
  };

  const handleReplyReactionChange = (replyId: string, newCount: number, myReaction: ReactionType | null) => {
    setReplies((prev) =>
      prev.map((r) =>
        r.commentId === replyId
          ? { ...r, reactionCount: newCount, myReaction }
          : r
      )
    );
  };

  return (
    <div
      className={`group ${depth > 0 ? 'mt-2' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex gap-2">
        {/* Avatar */}
        <Link to={`/profile/${comment.authorId}`} className="flex-shrink-0">
          {authorAvatarUrl ? (
            <img
              src={authorAvatarUrl}
              alt={comment.authorName || 'avatar'}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center ring-2 ring-white shadow-sm">
              <span className="text-white text-xs font-bold">
                {comment.authorName?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </Link>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-1">
            {/* Comment Bubble */}
            <div className="bg-slate-100 rounded-2xl px-3.5 py-2.5 inline-block">
              <div className="flex items-center gap-2 mb-0.5">
                <Link
                  to={`/profile/${comment.authorId}`}
                  className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                >
                  {comment.authorName || 'Người dùng'}
                </Link>
                <span className="text-xs text-slate-400">{formatTime()}</span>
              </div>

              {isEditing ? (
                <div className="mt-1">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    rows={2}
                  />
                  <div className="flex justify-end gap-1.5 mt-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        setEditContent(comment.content);
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Hủy
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={!editContent.trim()}
                      className="h-6 px-2 bg-blue-500 hover:bg-blue-600 text-white text-xs"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Lưu
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-700 whitespace-pre-line">{comment.content}</p>
                  {/* Media Display */}
                  <CommentMediaDisplay type={comment.type} resourceUrls={comment.resourceUrls} />
                </>
              )}
            </div>

            {/* Actions Menu - Outside bubble */}
            {canModifyComment && showActions && !isEditing && (
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowActionMenu(!showActionMenu)}
                  className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
                  title="Tùy chọn"
                >
                  <MoreHorizontal className="w-4 h-4 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {showActionMenu && (
                  <>
                    {/* Backdrop to close menu */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowActionMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20">
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setEditContent(comment.content);
                          setShowActionMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-slate-500" />
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteDialog(true);
                          setShowActionMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Xóa
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Actions Bar */}
          {!isEditing && (
            <div className="flex items-center gap-3 mt-1 ml-1">
              <ReactionPicker
                currentReaction={comment.myReaction}
                reactionCount={comment.reactionCount}
                onReact={handleReaction}
                disabled={reacting}
                size="sm"
              />

              {/* Reply Button */}
              {depth < 2 && (
                <button
                  onClick={() => setShowReplyInput(!showReplyInput)}
                  className="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
                >
                  Trả lời
                </button>
              )}

              {/* Show Replies Button */}
              {(comment.replyCount ?? 0) > 0 && (
                <button
                  onClick={handleLoadReplies}
                  disabled={loadingReplies}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {showReplies ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Ẩn {getTotalReplyCount()} câu trả lời
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      {loadingReplies ? 'Đang tải...' : `Xem ${getTotalReplyCount()} câu trả lời`}
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Reply Input with Media Support */}
          {showReplyInput && depth < 2 && (
            <div className="mt-3 ml-2">
              <div className="flex items-start gap-2">
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.firstName || 'avatar'}
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow-sm"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0 ring-2 ring-white shadow-sm">
                    <span className="text-white text-[10px] font-bold">
                      {currentUser?.lastName?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Viết câu trả lời..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitReply();
                      }
                    }}
                  />

                  {/* Reply Files Preview */}
                  {replyFiles.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-lg p-2">
                      {replyMediaType === 'IMAGE' && (
                        <div className="flex flex-wrap gap-1.5">
                          {replyFiles.map((fileItem) => (
                            <div key={fileItem.id} className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-100 group">
                              {fileItem.preview && (
                                <img
                                  src={fileItem.preview}
                                  alt={fileItem.file.name}
                                  className="w-full h-full object-cover"
                                />
                              )}
                              <button
                                onClick={() => removeReplyFile(fileItem.id)}
                                className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center"
                              >
                                <X className="w-3 h-3 text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {replyMediaType === 'VIDEO' && (
                        <div className="space-y-1.5">
                          {replyFiles.map((fileItem) => (
                            <div key={fileItem.id} className="relative rounded-lg overflow-hidden bg-slate-900">
                              {fileItem.preview && (
                                <video
                                  src={fileItem.preview}
                                  className="w-full max-h-24 object-contain"
                                  muted
                                />
                              )}
                              <div className="absolute top-1 left-1 bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                <Film className="w-2.5 h-2.5" />
                                Video
                              </div>
                              <button
                                onClick={() => removeReplyFile(fileItem.id)}
                                className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center"
                              >
                                <X className="w-3 h-3 text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {replyMediaType === 'DOC' && (
                        <div className="space-y-1">
                          {replyFiles.map((fileItem) => (
                            <div key={fileItem.id} className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg">
                              <div className="w-7 h-7 bg-indigo-100 rounded flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 text-indigo-600" />
                              </div>
                              <p className="text-xs text-slate-700 truncate flex-1">{fileItem.file.name}</p>
                              <button
                                onClick={() => removeReplyFile(fileItem.id)}
                                className="w-5 h-5 hover:bg-red-50 rounded-full flex items-center justify-center"
                              >
                                <X className="w-3 h-3 text-slate-400" />
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
                    <div className="flex items-center gap-0.5">
                      <input
                        ref={replyImageRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleReplyFileSelect(e.target.files, 'IMAGE')}
                        className="hidden"
                      />
                      <input
                        ref={replyVideoRef}
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleReplyFileSelect(e.target.files, 'VIDEO')}
                        className="hidden"
                      />
                      <input
                        ref={replyDocRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.zip,.rar,.xls,.xlsx,.ppt,.pptx"
                        multiple
                        onChange={(e) => handleReplyFileSelect(e.target.files, 'DOC')}
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => replyImageRef.current?.click()}
                        disabled={submittingReply}
                        className={`p-1.5 rounded-lg transition-all ${replyMediaType === 'IMAGE' && replyFiles.length > 0
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                        title="Thêm ảnh"
                      >
                        <Image className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => replyVideoRef.current?.click()}
                        disabled={submittingReply}
                        className={`p-1.5 rounded-lg transition-all ${replyMediaType === 'VIDEO' && replyFiles.length > 0
                          ? 'bg-purple-50 text-purple-600'
                          : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'
                          }`}
                        title="Thêm video"
                      >
                        <Film className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => replyDocRef.current?.click()}
                        disabled={submittingReply}
                        className={`p-1.5 rounded-lg transition-all ${replyMediaType === 'DOC' && replyFiles.length > 0
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                          }`}
                        title="Thêm tài liệu"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowReplyInput(false);
                          setReplyContent('');
                          clearReplyFiles();
                        }}
                        className="h-7 px-2 text-xs text-slate-500"
                      >
                        Hủy
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSubmitReply}
                        disabled={(!replyContent.trim() && replyFiles.length === 0) || submittingReply}
                        className="h-7 px-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-xs rounded-lg shadow-sm"
                      >
                        {submittingReply ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Đang gửi
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3 mr-1" />
                            Gửi
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Replies List */}
          {showReplies && replies.length > 0 && (
            <div className="mt-3 ml-2 space-y-3 border-l-2 border-slate-100 pl-3">
              {replies.map((reply) => (
                <CommentItem
                  key={reply.commentId}
                  comment={reply}
                  postId={postId}
                  onDelete={handleDeleteReply}
                  onUpdate={handleUpdateReply}
                  onReactionChange={handleReplyReactionChange}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bình luận?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Bình luận sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
