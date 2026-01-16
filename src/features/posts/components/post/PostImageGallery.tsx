import { Film, Play } from 'lucide-react';

interface PostMediaGalleryProps {
    images: string[];
    title: string;
    onMediaClick?: (url: string) => void;
    isVideo?: boolean; // true if this is a VIDEO type post
}

// Helper function to check if URL is a video (fallback for mixed content)
const isVideoUrl = (url: string): boolean => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext));
};

// Component to render either image or video
const MediaItem = ({
    url,
    alt,
    className,
    onClick,
    showPlayButton = true,
    forceVideo = false,
}: {
    url: string;
    alt: string;
    className?: string;
    onClick: () => void;
    showPlayButton?: boolean;
    forceVideo?: boolean;
}) => {
    const isVideo = forceVideo || isVideoUrl(url);

    if (isVideo) {
        return (
            <div className="relative w-full h-full">
                <video
                    src={url}
                    className={className}
                    onClick={onClick}
                    muted
                    preload="metadata"
                />
                {showPlayButton && (
                    <div
                        className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20 hover:bg-black/30 transition-colors"
                        onClick={onClick}
                    >
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                            <Play className="w-8 h-8 text-slate-800 ml-1" fill="currentColor" />
                        </div>
                    </div>
                )}
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Film className="w-3 h-3" />
                    Video
                </div>
            </div>
        );
    }

    return (
        <img
            src={url}
            alt={alt}
            className={className}
            onClick={onClick}
        />
    );
};

export default function PostImageGallery({
    images,
    title,
    onMediaClick,
    isVideo: forceVideo = false,
}: PostMediaGalleryProps) {
    if (!images || images.length === 0) return null;

    const handleClick = (url: string) => {
        if (onMediaClick) {
            onMediaClick(url);
        } else {
            window.open(url, '_blank');
        }
    };

    if (images.length === 1) {
        const isVideo = forceVideo || isVideoUrl(images[0]);

        // Single media - full width
        return (
            <div className="mb-3">
                <div className="overflow-hidden rounded-xl border border-slate-200">
                    {isVideo ? (
                        <div className="relative">
                            <video
                                src={images[0]}
                                className="w-full object-cover max-h-[500px] cursor-pointer"
                                controls
                                preload="metadata"
                            />
                        </div>
                    ) : (
                        <img
                            src={images[0]}
                            alt={title}
                            className="w-full object-cover max-h-[500px] cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => handleClick(images[0])}
                        />
                    )}
                </div>
            </div>
        );
    }

    if (images.length === 2) {
        // Two media items - side by side
        return (
            <div className="mb-3">
                <div className="grid grid-cols-2 gap-2">
                    {images.map((url, index) => (
                        <div key={index} className="overflow-hidden rounded-xl aspect-square border border-slate-200">
                            <MediaItem
                                url={url}
                                alt={`${title} - ${index + 1}`}
                                className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                onClick={() => handleClick(url)}
                                forceVideo={forceVideo}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (images.length === 3) {
        // Three media items - first large, two small
        return (
            <div className="mb-3">
                <div className="grid grid-cols-2 gap-2">
                    <div className="row-span-2 overflow-hidden rounded-xl border border-slate-200">
                        <MediaItem
                            url={images[0]}
                            alt={`${title} - 1`}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => handleClick(images[0])}
                            forceVideo={forceVideo}
                        />
                    </div>
                    {images.slice(1).map((url, index) => (
                        <div key={index + 1} className="overflow-hidden rounded-xl aspect-square border border-slate-200">
                            <MediaItem
                                url={url}
                                alt={`${title} - ${index + 2}`}
                                className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                onClick={() => handleClick(url)}
                                forceVideo={forceVideo}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Four or more media items - 2x2 grid, show +N overlay on 4th if more
    return (
        <div className="mb-3">
            <div className="grid grid-cols-2 gap-2">
                {images.slice(0, 4).map((url, index) => (
                    <div key={index} className="overflow-hidden rounded-xl aspect-square relative border border-slate-200">
                        <MediaItem
                            url={url}
                            alt={`${title} - ${index + 1}`}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => handleClick(url)}
                            showPlayButton={!(index === 3 && images.length > 4)}
                            forceVideo={forceVideo}
                        />
                        {index === 3 && images.length > 4 && (
                            <div
                                className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors"
                                onClick={() => handleClick(url)}
                            >
                                <span className="text-white text-3xl font-bold">
                                    +{images.length - 4}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
