import { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import type { MessageType } from '@/interfaces/chat.types';

interface ChatMessageContentProps {
    message: string;
    type: MessageType;
    resourceUrls?: string[];
    isMine?: boolean;
}

// Helper to get file extension from URL
const getFileExtension = (url: string): string => {
    const parts = url.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'FILE';
};

// Helper to get file name from URL
const getFileName = (url: string): string => {
    const parts = url.split('/');
    const fileName = parts[parts.length - 1];
    // Decode URI and limit length
    try {
        const decoded = decodeURIComponent(fileName);
        return decoded.length > 30 ? decoded.substring(0, 27) + '...' : decoded;
    } catch {
        return fileName.length > 30 ? fileName.substring(0, 27) + '...' : fileName;
    }
};

export default function ChatMessageContent({
    message,
    type,
    resourceUrls,
    isMine = false,
}: ChatMessageContentProps) {
    const [imageError, setImageError] = useState<Record<string, boolean>>({});
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

    // Deleted message - show italic text
    // Check for MESSAGE_DELETED type
    if (type === 'MESSAGE_DELETED') {
        return (
            <p
                className={`text-sm italic ${isMine ? 'text-white/70' : 'text-slate-400'}`}
                style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
            >
                {message || 'Tin nhắn đã bị xóa'}
            </p>
        );
    }

    // Text message
    if (type === 'TEXT' || !resourceUrls || resourceUrls.length === 0) {
        return (
            <p
                className="text-sm whitespace-pre-wrap break-words"
                style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
            >
                {message}
            </p>
        );
    }

    // Image message
    if (type === 'IMAGE') {
        return (
            <div className="space-y-2">
                {/* Caption text if exists */}
                {message && message.trim() && (
                    <p
                        className="text-sm whitespace-pre-wrap break-words mb-2"
                        style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                    >
                        {message}
                    </p>
                )}

                {/* Image grid */}
                <div
                    className={`grid gap-1 ${resourceUrls.length === 1
                        ? 'grid-cols-1'
                        : resourceUrls.length === 2
                            ? 'grid-cols-2'
                            : 'grid-cols-2'
                        }`}
                >
                    {resourceUrls.map((url, index) => (
                        <div
                            key={index}
                            className="relative rounded-lg overflow-hidden cursor-pointer bg-slate-100"
                            onClick={() => setFullscreenImage(url)}
                        >
                            {imageError[url] ? (
                                <div className="w-full h-32 flex items-center justify-center bg-slate-200">
                                    <span className="text-xs text-slate-500">Không thể tải ảnh</span>
                                </div>
                            ) : (
                                <img
                                    src={url}
                                    alt={`Image ${index + 1}`}
                                    className="w-full h-auto max-h-48 object-cover hover:opacity-90 transition-opacity"
                                    onError={() => setImageError((prev) => ({ ...prev, [url]: true }))}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Fullscreen image modal */}
                {fullscreenImage && (
                    <div
                        className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
                        onClick={() => setFullscreenImage(null)}
                    >
                        <img
                            src={fullscreenImage}
                            alt="Fullscreen"
                            className="max-w-full max-h-full object-contain"
                        />
                        <button
                            className="absolute top-4 right-4 text-white hover:text-slate-300 text-2xl"
                            onClick={() => setFullscreenImage(null)}
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Video message
    if (type === 'VIDEO') {
        return (
            <div className="space-y-2">
                {/* Caption text if exists */}
                {message && message.trim() && (
                    <p
                        className="text-sm whitespace-pre-wrap break-words mb-2"
                        style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                    >
                        {message}
                    </p>
                )}

                {/* Video players */}
                {resourceUrls.map((url, index) => (
                    <div key={index} className="relative rounded-lg overflow-hidden bg-black">
                        <video
                            src={url}
                            controls
                            className="w-full max-h-64"
                            preload="metadata"
                        >
                            <source src={url} type="video/mp4" />
                            Trình duyệt không hỗ trợ video.
                        </video>
                    </div>
                ))}
            </div>
        );
    }

    // File message
    if (type === 'FILE') {
        return (
            <div className="space-y-2">
                {/* Caption text if exists */}
                {message && message.trim() && (
                    <p
                        className="text-sm whitespace-pre-wrap break-words mb-2"
                        style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                    >
                        {message}
                    </p>
                )}

                {/* File attachments */}
                {resourceUrls.map((url, index) => {
                    const extension = getFileExtension(url);
                    const fileName = getFileName(url);

                    return (
                        <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isMine
                                ? 'bg-white/20 hover:bg-white/30'
                                : 'bg-slate-100 hover:bg-slate-200'
                                }`}
                        >
                            <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${isMine ? 'bg-white/20' : 'bg-blue-100'
                                    }`}
                            >
                                <FileText
                                    className={`w-5 h-5 ${isMine ? 'text-white' : 'text-blue-600'}`}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p
                                    className={`text-sm font-medium truncate ${isMine ? 'text-white' : 'text-slate-900'
                                        }`}
                                >
                                    {fileName}
                                </p>
                                <p
                                    className={`text-xs ${isMine ? 'text-white/70' : 'text-slate-500'
                                        }`}
                                >
                                    {extension}
                                </p>
                            </div>
                            <Download
                                className={`w-4 h-4 ${isMine ? 'text-white/70' : 'text-slate-400'}`}
                            />
                        </a>
                    );
                })}
            </div>
        );
    }

    // Fallback for unknown types
    return (
        <p
            className="text-sm whitespace-pre-wrap break-words"
            style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
        >
            {message}
        </p>
    );
}
