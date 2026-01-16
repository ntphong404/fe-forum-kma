import { Link } from 'react-router-dom';
import { Image as ImageIcon, FileText, Film } from 'lucide-react';
import type { PostType } from '@/interfaces/post.types';

// Helper function to check if URL is a video
const isVideoUrl = (url: string): boolean => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext));
};

interface PostHeaderProps {
    authorId: string;
    authorName: string;
    authorAvatarUrl: string | null;
    groupId?: string;
    groupName: string;
    timeAgo: string;
    postType: PostType;
    resourceUrls?: string[];
}

export default function PostHeader({
    authorId,
    authorName,
    authorAvatarUrl,
    groupId,
    groupName,
    timeAgo,
    postType,
    resourceUrls,
}: PostHeaderProps) {
    // Determine media type based on postType and resourceUrls content
    const getMediaTypeInfo = () => {
        // Handle VIDEO type
        if (postType === 'VIDEO') {
            return { icon: <Film className="w-3 h-3" />, label: 'Video' };
        }

        // Handle DOC type
        if (postType === 'DOC') {
            return { icon: <FileText className="w-3 h-3" />, label: 'Tài liệu' };
        }

        // Handle IMAGE type - check if mixed content
        if (postType === 'IMAGE') {
            const hasVideo = resourceUrls?.some(url => isVideoUrl(url)) ?? false;
            const hasImage = resourceUrls?.some(url => !isVideoUrl(url)) ?? false;

            if (hasVideo && hasImage) {
                return {
                    icon: <><ImageIcon className="w-3 h-3" /><Film className="w-3 h-3 -ml-1" /></>,
                    label: 'Ảnh/Video'
                };
            }
            if (hasVideo) {
                return { icon: <Film className="w-3 h-3" />, label: 'Video' };
            }
            return { icon: <ImageIcon className="w-3 h-3" />, label: 'Hình ảnh' };
        }

        return null;
    };

    const mediaInfo = postType !== 'TEXT' ? getMediaTypeInfo() : null;

    return (
        <div className="flex items-center text-sm text-slate-500 mb-3">
            <div className="flex items-center group">
                <Link to={`/profile/${authorId}`} className="flex items-center">
                    {authorAvatarUrl ? (
                        <img
                            src={authorAvatarUrl}
                            alt={authorName || 'avatar'}
                            className="w-8 h-8 rounded-full object-cover mr-2.5 shadow-md group-hover:ring-2 group-hover:ring-blue-300 transition-all"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mr-2.5 shadow-md shadow-blue-500/20 group-hover:ring-2 group-hover:ring-blue-300 transition-all">
                            <span className="text-white text-xs font-bold">
                                {authorName?.[0]?.toUpperCase() || 'U'}
                            </span>
                        </div>
                    )}
                </Link>
                <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                        <Link
                            to={`/profile/${authorId}`}
                            className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                        >
                            {authorName || 'loading...'}
                        </Link>
                        {groupName && groupId && (
                            <>
                                <span className="text-slate-400">•</span>
                                <Link
                                    to={`/forum/group/${groupId}`}
                                    className="text-slate-600 hover:text-blue-600 hover:underline transition-colors"
                                >
                                    {groupName}
                                </Link>
                            </>
                        )}
                    </div>
                    <span className="text-xs text-slate-400">{timeAgo}</span>
                </div>
            </div>
            {mediaInfo && (
                <span className="ml-auto flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-full text-xs text-slate-500">
                    {mediaInfo.icon}
                    {mediaInfo.label}
                </span>
            )}
        </div>
    );
}

