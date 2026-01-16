import { useState } from 'react';
import { FileText, Download, X, Film, Play, Image as ImageIcon, File, FileSpreadsheet, Presentation, Archive } from 'lucide-react';
import type { CommentType } from '@/interfaces/post.types';

interface CommentMediaDisplayProps {
    type?: CommentType;
    resourceUrls?: string[];
}

export default function CommentMediaDisplay({ type, resourceUrls }: CommentMediaDisplayProps) {
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [playingVideo, setPlayingVideo] = useState<string | null>(null);

    if (!resourceUrls || resourceUrls.length === 0 || type === 'TEXT') {
        return null;
    }

    const getFileName = (url: string) => {
        try {
            const parts = url.split('/');
            const fileName = parts[parts.length - 1];
            return decodeURIComponent(fileName.split('?')[0]);
        } catch {
            return 'file';
        }
    };

    const getFileExtension = (url: string) => {
        const fileName = getFileName(url);
        const parts = fileName.split('.');
        return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
    };

    const getFileIcon = (url: string) => {
        const ext = getFileExtension(url);
        switch (ext) {
            case 'pdf':
                return <FileText className="w-5 h-5 text-red-500" />;
            case 'doc':
            case 'docx':
                return <FileText className="w-5 h-5 text-blue-600" />;
            case 'xls':
            case 'xlsx':
                return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
            case 'ppt':
            case 'pptx':
                return <Presentation className="w-5 h-5 text-orange-500" />;
            case 'zip':
            case 'rar':
            case '7z':
                return <Archive className="w-5 h-5 text-amber-600" />;
            default:
                return <File className="w-5 h-5 text-slate-500" />;
        }
    };

    const getFileBgColor = (url: string) => {
        const ext = getFileExtension(url);
        switch (ext) {
            case 'pdf':
                return 'bg-red-50';
            case 'doc':
            case 'docx':
                return 'bg-blue-50';
            case 'xls':
            case 'xlsx':
                return 'bg-green-50';
            case 'ppt':
            case 'pptx':
                return 'bg-orange-50';
            case 'zip':
            case 'rar':
            case '7z':
                return 'bg-amber-50';
            default:
                return 'bg-slate-50';
        }
    };

    // Render images
    if (type === 'IMAGE') {
        return (
            <>
                <div className="mt-3">
                    {resourceUrls.length === 1 ? (
                        // Single image - larger display
                        <div
                            className="relative group cursor-pointer rounded-xl overflow-hidden inline-block"
                            onClick={() => setLightboxImage(resourceUrls[0])}
                        >
                            <img
                                src={resourceUrls[0]}
                                alt="Hình ảnh"
                                className="max-w-[280px] max-h-[200px] object-cover"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ImageIcon className="w-4 h-4 text-white" />
                            </div>
                        </div>
                    ) : (
                        // Multiple images - grid
                        <div className="grid grid-cols-3 gap-1.5 max-w-[320px]">
                            {resourceUrls.slice(0, 4).map((url, index) => (
                                <div
                                    key={index}
                                    className={`relative group cursor-pointer rounded-lg overflow-hidden aspect-square ${resourceUrls.length === 2 ? 'col-span-1' : ''
                                        }`}
                                    onClick={() => setLightboxImage(url)}
                                >
                                    <img
                                        src={url}
                                        alt={`Hình ảnh ${index + 1}`}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                    {index === 3 && resourceUrls.length > 4 && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <span className="text-white font-bold text-lg">+{resourceUrls.length - 4}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Lightbox */}
                {lightboxImage && (
                    <div
                        className="fixed inset-0 bg-black/90 backdrop-blur-lg z-[100] flex items-center justify-center p-4"
                        onClick={() => setLightboxImage(null)}
                    >
                        <button
                            className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
                            onClick={() => setLightboxImage(null)}
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                        <img
                            src={lightboxImage}
                            alt="Xem ảnh"
                            className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                        {/* Navigation for multiple images */}
                        {resourceUrls.length > 1 && (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
                                {resourceUrls.map((url, index) => (
                                    <button
                                        key={index}
                                        className={`w-2 h-2 rounded-full transition-colors ${url === lightboxImage ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
                                            }`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setLightboxImage(url);
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </>
        );
    }

    // Render videos
    if (type === 'VIDEO') {
        return (
            <div className="mt-3 space-y-2">
                {resourceUrls.map((url, index) => (
                    <div key={index} className="relative rounded-xl overflow-hidden bg-slate-900 max-w-[320px] group">
                        {playingVideo === url ? (
                            <video
                                src={url}
                                controls
                                autoPlay
                                className="w-full max-h-[220px] object-contain"
                                onEnded={() => setPlayingVideo(null)}
                            >
                                <track kind="captions" />
                            </video>
                        ) : (
                            <>
                                <video
                                    src={url}
                                    className="w-full max-h-[220px] object-cover"
                                    muted
                                    preload="metadata"
                                />
                                <div
                                    className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer hover:bg-black/40 transition-colors"
                                    onClick={() => setPlayingVideo(url)}
                                >
                                    <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                        <Play className="w-6 h-6 text-slate-800 ml-1" fill="currentColor" />
                                    </div>
                                </div>
                            </>
                        )}
                        <div className="absolute top-2 left-2 bg-purple-600/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                            <Film className="w-3 h-3" />
                            Video
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Render documents
    if (type === 'DOC') {
        return (
            <div className="mt-3 space-y-2">
                {resourceUrls.map((url, index) => (
                    <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group max-w-[300px] border border-slate-200 hover:border-blue-300 hover:shadow-md ${getFileBgColor(url)}`}
                    >
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                            {getFileIcon(url)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate group-hover:text-blue-600 transition-colors">
                                {getFileName(url)}
                            </p>
                            <p className="text-xs text-slate-500">
                                {getFileExtension(url).toUpperCase()} • Tải về
                            </p>
                        </div>
                        <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                            <Download className="w-4 h-4 text-blue-500" />
                        </div>
                    </a>
                ))}
            </div>
        );
    }

    return null;
}
