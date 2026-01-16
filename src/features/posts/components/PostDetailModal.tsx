import { useState } from 'react';
import { X, MessageCircle, ChevronLeft, ChevronRight, FileText, ExternalLink, ThumbsUp, Film, Play } from 'lucide-react';
import { ApiPost, ReactionType } from '@/interfaces/post.types';
import { formatTimeAgo } from '@/lib/date.utils';
import { ReactionPicker } from '@/features/reactions';
import { CommentSection } from '@/features/comments';
import { useAuthorInfo, useGroupInfo } from '@/features/posts/hooks';

// Helper function to check if URL is a video
const isVideoUrl = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
};

interface PostDetailModalProps {
  post: ApiPost;
  isOpen: boolean;
  onClose: () => void;
  currentReaction: ReactionType | null;
  reactionCount: number;
  onReact: (type: ReactionType) => void;
  reacting: boolean;
}

export default function PostDetailModal({
  post,
  isOpen,
  onClose,
  currentReaction,
  reactionCount,
  onReact,
  reacting,
}: PostDetailModalProps) {
  // Custom hooks để fetch thông tin author và group
  const { authorName, authorAvatarUrl } = useAuthorInfo({
    authorId: post.authorId,
    initialName: post.authorName,
    initialAvatarUrl: post.authorAvatarUrl,
  });

  const { groupName } = useGroupInfo({
    groupId: post.groupId,
    initialGroupName: post.groupName,
  });

  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  const getTimeAgo = () => formatTimeAgo(post.createdAt);

  const handleCommentCountChange = (count: number) => {
    setCommentCount(count);
  };

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setIsImageExpanded(true);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.resourceUrls && currentImageIndex < post.resourceUrls.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-50 backdrop-blur-md transition-all duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 pointer-events-none">
        <div
          className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full sm:w-[1200px] max-w-[98vw] sm:max-w-[95vw] max-h-[95vh] sm:max-h-[90vh] flex flex-col pointer-events-auto transform transition-all duration-300 animate-in fade-in zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Gradient */}
          <div className="relative flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-slate-200 flex-shrink-0 rounded-t-xl sm:rounded-t-2xl">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {authorAvatarUrl ? (
                <img
                  src={authorAvatarUrl}
                  alt={authorName || 'avatar'}
                  className="w-9 h-9 sm:w-12 sm:h-12 rounded-full object-cover shadow-lg ring-2 sm:ring-4 ring-white flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/30 ring-2 sm:ring-4 ring-white flex-shrink-0">
                  <span className="text-white text-sm sm:text-lg font-bold">
                    {authorName?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-base sm:text-xl font-bold text-slate-900 truncate">{authorName}</h2>
                  {groupName && (
                    <>
                      <span className="text-slate-400 hidden xs:inline">•</span>
                      <span className="text-sm sm:text-base font-medium text-slate-600 truncate">{groupName}</span>
                    </>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-600">{getTimeAgo()}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white hover:bg-slate-100 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110 group flex-shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 group-hover:text-slate-900 transition-colors" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Post Info */}
            <div className="px-3 sm:px-6 py-4 sm:py-5">
              {/* Title if exists */}
              {post.title && (
                <h3 className="text-lg sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4 leading-tight">
                  {post.title}
                </h3>
              )}

              {/* Content */}
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed mb-4 sm:mb-5 whitespace-pre-line">
                {post.content}
              </p>
            </div>

            {/* Media (Images/Videos) if available */}
            {(post.type === 'IMAGE' || post.type === 'VIDEO') && post.resourceUrls && post.resourceUrls.length > 0 && (
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 relative">
                {post.resourceUrls.length === 1 ? (
                  <div className="relative border-t border-b border-slate-700">
                    {post.type === 'VIDEO' || isVideoUrl(post.resourceUrls[0]) ? (
                      <video
                        src={post.resourceUrls[0]}
                        className="w-full max-h-[400px] sm:max-h-[600px] object-contain"
                        controls
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={post.resourceUrls[0]}
                        alt={post.title}
                        className="w-full max-h-[400px] sm:max-h-[600px] object-contain cursor-pointer"
                        onClick={() => handleImageClick(0)}
                      />
                    )}
                  </div>
                ) : (
                  <div className={`grid ${post.resourceUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-2'} gap-1 p-1`}>
                    {post.resourceUrls.slice(0, 4).map((url, index) => {
                      const isVideo = post.type === 'VIDEO' || isVideoUrl(url);
                      return (
                        <div
                          key={index}
                          className={`relative overflow-hidden rounded-lg border border-slate-700 ${post.resourceUrls!.length === 3 && index === 0 ? 'col-span-2' : ''
                            }`}
                          style={{
                            aspectRatio: post.resourceUrls!.length === 3 && index === 0 ? '16/9' : '1/1'
                          }}
                        >
                          {isVideo ? (
                            <>
                              <video
                                src={url}
                                className="w-full h-full object-cover"
                                muted
                                preload="metadata"
                              />
                              <div
                                className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20 hover:bg-black/30 transition-colors"
                                onClick={() => handleImageClick(index)}
                              >
                                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                                  <Play className="w-6 h-6 text-slate-800 ml-0.5" fill="currentColor" />
                                </div>
                              </div>
                              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                <Film className="w-3 h-3" />
                                Video
                              </div>
                            </>
                          ) : (
                            <img
                              src={url}
                              alt={`${post.title} - ${index + 1}`}
                              className="w-full h-full object-cover cursor-pointer"
                              onClick={() => handleImageClick(index)}
                            />
                          )}
                          {index === 3 && post.resourceUrls!.length > 4 && (
                            <div
                              className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-black/80 transition-all duration-300"
                              onClick={() => handleImageClick(index)}
                            >
                              <span className="text-white text-4xl font-bold drop-shadow-lg">
                                +{post.resourceUrls!.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="px-3 sm:px-6 py-4 sm:py-5">

              {/* Post Document Links */}
              {post.type === 'DOC' && post.resourceUrls && post.resourceUrls.length > 0 && (
                <div className="mb-4 sm:mb-5 space-y-2">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 mb-2">Tài liệu đính kèm ({post.resourceUrls.length})</h4>
                  <div className="grid grid-cols-1 gap-2 sm:gap-3">
                    {post.resourceUrls.map((url, index) => {
                      // Extract filename from URL
                      const getFileName = (fileUrl: string) => {
                        try {
                          const urlObj = new URL(fileUrl);
                          const pathname = urlObj.pathname;
                          const filename = pathname.split('/').pop();
                          return filename ? decodeURIComponent(filename) : `Tài liệu đính kèm ${index + 1}`;
                        } catch {
                          return `Tài liệu đính kèm ${index + 1}`;
                        }
                      };

                      const fileName = getFileName(url);
                      const fileExt = fileName.split('.').pop()?.toUpperCase() || 'FILE';

                      return (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-lg sm:rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group"
                        >
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-slate-700 truncate group-hover:text-blue-600 transition-colors">
                              {fileName}
                            </p>
                            <p className="text-[10px] sm:text-xs text-slate-400">{fileExt}</p>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stats - Separated Layout */}
              <div className="border-t border-slate-200 pt-3 pb-2">
                <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500">
                  {/* Likes Section */}
                  {reactionCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="bg-blue-500 rounded-full p-1">
                        <ThumbsUp className="w-3 h-3 text-white fill-white" />
                      </div>
                      {currentReaction ? (
                        <>
                          {reactionCount > 1 ? (
                            <span className="hover:underline cursor-pointer">Bạn và {reactionCount - 1} người khác</span>
                          ) : (
                            <span className="hover:underline cursor-pointer">Bạn</span>
                          )}
                        </>
                      ) : (
                        <span className="hover:underline cursor-pointer">{reactionCount}</span>
                      )}
                    </div>
                  )}
                  {!reactionCount && <div />} {/* Spacer if no likes */}

                  {/* Comments Section */}
                  {commentCount > 0 && (
                    <div className="hover:underline cursor-pointer">
                      {commentCount} bình luận
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons - Separated with border */}
              <div className="border-t border-slate-200 pt-2 pb-1">
                <div className="flex items-center gap-0.5 sm:gap-1">
                  {/* Reaction Button */}
                  <div className="flex-1">
                    <ReactionPicker
                      currentReaction={currentReaction}
                      reactionCount={reactionCount}
                      onReact={onReact}
                      disabled={reacting}
                      size="md"
                      showCount={false}
                      className="w-full justify-center hover:bg-slate-50 rounded-lg py-1.5 sm:py-2"
                    />
                  </div>

                  {/* Comment Button */}
                  <button
                    className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 px-2 sm:px-4 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-all duration-200 group h-9 sm:h-10 text-xs sm:text-sm"
                    onClick={() => {
                      // Focus on comment input if possible, or just scroll to it
                      // Since CommentSection is already there, maybe just scroll
                    }}
                  >
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 group-hover:text-slate-600 transition-colors" />
                    <span className="group-hover:text-slate-600 transition-colors hidden xs:inline">Bình luận</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Comments */}
            <CommentSection
              postId={post.postId}
              isOpen={true}
              onCommentCountChange={handleCommentCountChange}
            />
          </div>
        </div >
      </div >

      {/* Media Lightbox */}
      {isImageExpanded && post.resourceUrls && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4"
          onClick={() => setIsImageExpanded(false)}
        >
          <button
            onClick={() => setIsImageExpanded(false)}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 backdrop-blur-md"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>

          <div className="relative max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
            {post.type === 'VIDEO' || isVideoUrl(post.resourceUrls[currentImageIndex]) ? (
              <video
                src={post.resourceUrls[currentImageIndex]}
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                controls
                autoPlay
              />
            ) : (
              <img
                src={post.resourceUrls[currentImageIndex]}
                alt={`${post.title} - ${currentImageIndex + 1}`}
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              />
            )}

            {post.resourceUrls.length > 1 && (
              <>
                {currentImageIndex > 0 && (
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all duration-200 hover:scale-110"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                )}

                {currentImageIndex < post.resourceUrls.length - 1 && (
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all duration-200 hover:scale-110"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                )}

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white text-sm font-medium">
                  {currentImageIndex + 1} / {post.resourceUrls.length}
                </div>
              </>
            )}
          </div>
        </div>
      )
      }
    </>
  );
}
