import { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Image, Paperclip, Film, X, Loader2 } from 'lucide-react';
import { FileUploadService } from '@/lib/file-upload.service';
import { toast } from 'sonner';
import type { MessageType } from '@/interfaces/chat.types';

export interface PendingMedia {
    urls: string[];
    type: MessageType;
    previews: string[];
}

export interface ChatMediaUploadRef {
    clearPendingMedia: () => void;
    getPendingMedia: () => PendingMedia | null;
}

interface ChatMediaUploadProps {
    onPendingMediaChange?: (media: PendingMedia | null) => void;
    disabled?: boolean;
}

interface UploadingFile {
    id: string;
    file: File;
    preview?: string;
    progress: number;
    type: 'image' | 'video' | 'file';
}

const ChatMediaUpload = forwardRef<ChatMediaUploadRef, ChatMediaUploadProps>(
    ({ onPendingMediaChange, disabled }, ref) => {
        const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
        const [isUploading, setIsUploading] = useState(false);
        const [pendingMedia, setPendingMedia] = useState<PendingMedia | null>(null);
        const imageInputRef = useRef<HTMLInputElement>(null);
        const videoInputRef = useRef<HTMLInputElement>(null);
        const fileInputRef = useRef<HTMLInputElement>(null);

        // Expose methods to parent via ref
        useImperativeHandle(ref, () => ({
            clearPendingMedia: () => {
                setPendingMedia(null);
            },
            getPendingMedia: () => pendingMedia,
        }));

        // Notify parent when pending media changes
        useEffect(() => {
            onPendingMediaChange?.(pendingMedia);
        }, [pendingMedia, onPendingMediaChange]);

        const handleFileSelect = async (
            files: FileList | null,
            type: 'image' | 'video' | 'file'
        ) => {
            if (!files || files.length === 0) return;

            const fileArray = Array.from(files);

            // Validate files before upload
            const fileUploadType = type === 'file' ? 'document' : type;
            for (const file of fileArray) {
                const validation = FileUploadService.validateFile(file, fileUploadType);
                if (!validation.valid) {
                    toast.error(validation.error || `File không hợp lệ: ${file.name}`);
                    return;
                }
            }

            const newUploadingFiles: UploadingFile[] = fileArray.map((file) => ({
                id: `${Date.now()}-${Math.random()}`,
                file,
                preview: type === 'image' ? URL.createObjectURL(file) :
                    type === 'video' ? URL.createObjectURL(file) : undefined,
                progress: 0,
                type,
            }));

            setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);
            setIsUploading(true);

            try {
                const uploadedUrls: string[] = [];
                const previews: string[] = [];

                for (const uploadingFile of newUploadingFiles) {
                    try {
                        let url: string;

                        switch (type) {
                            case 'image':
                                url = await FileUploadService.uploadImage(
                                    uploadingFile.file,
                                    (progress) => {
                                        setUploadingFiles((prev) =>
                                            prev.map((f) =>
                                                f.id === uploadingFile.id ? { ...f, progress } : f
                                            )
                                        );
                                    }
                                );
                                break;
                            case 'video':
                                url = await FileUploadService.uploadVideo(
                                    uploadingFile.file,
                                    (progress) => {
                                        setUploadingFiles((prev) =>
                                            prev.map((f) =>
                                                f.id === uploadingFile.id ? { ...f, progress } : f
                                            )
                                        );
                                    }
                                );
                                break;
                            case 'file':
                                url = await FileUploadService.uploadDocument(
                                    uploadingFile.file,
                                    (progress) => {
                                        setUploadingFiles((prev) =>
                                            prev.map((f) =>
                                                f.id === uploadingFile.id ? { ...f, progress } : f
                                            )
                                        );
                                    }
                                );
                                break;
                            default:
                                throw new Error('Unknown file type');
                        }

                        uploadedUrls.push(url);
                        if (uploadingFile.preview) {
                            previews.push(uploadingFile.preview);
                        }
                    } catch (error: any) {
                        console.error('Failed to upload file:', error);
                        toast.error(`Không thể tải lên: ${uploadingFile.file.name}`);
                    }
                }

                if (uploadedUrls.length > 0) {
                    const messageType: MessageType =
                        type === 'image' ? 'IMAGE' : type === 'video' ? 'VIDEO' : 'FILE';

                    // Store pending media instead of sending immediately
                    setPendingMedia({
                        urls: uploadedUrls,
                        type: messageType,
                        previews,
                    });
                }
            } finally {
                setUploadingFiles([]);
                setIsUploading(false);
                // Reset file inputs
                if (imageInputRef.current) imageInputRef.current.value = '';
                if (videoInputRef.current) videoInputRef.current.value = '';
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };

        const removeUploadingFile = (id: string) => {
            setUploadingFiles((prev) => {
                const file = prev.find((f) => f.id === id);
                if (file?.preview) {
                    URL.revokeObjectURL(file.preview);
                }
                return prev.filter((f) => f.id !== id);
            });
        };

        const removePendingMedia = () => {
            if (pendingMedia) {
                // Revoke preview URLs
                pendingMedia.previews.forEach((preview) => {
                    URL.revokeObjectURL(preview);
                });
                setPendingMedia(null);
            }
        };

        return (
            <div className="relative">
                {/* Preview uploading files (during upload) */}
                {uploadingFiles.length > 0 && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-white border border-slate-200 rounded-lg shadow-lg">
                        <div className="flex flex-wrap gap-2">
                            {uploadingFiles.map((file) => (
                                <div key={file.id} className="relative">
                                    {file.type === 'image' && file.preview ? (
                                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100">
                                            <img
                                                src={file.preview}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <span className="text-white text-xs font-medium">
                                                    {file.progress}%
                                                </span>
                                            </div>
                                        </div>
                                    ) : file.type === 'video' && file.preview ? (
                                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 relative">
                                            <video
                                                src={file.preview}
                                                className="w-full h-full object-cover"
                                                muted
                                            />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <Film className="w-4 h-4 text-white mb-1" />
                                                <span className="text-white text-xs font-medium absolute bottom-1">
                                                    {file.progress}%
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center">
                                            {file.type === 'video' ? (
                                                <Film className="w-6 h-6 text-slate-400" />
                                            ) : (
                                                <Paperclip className="w-6 h-6 text-slate-400" />
                                            )}
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                                                <span className="text-white text-xs font-medium">
                                                    {file.progress}%
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
                                        onClick={() => removeUploadingFile(file.id)}
                                    >
                                        <X className="w-3 h-3 text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Preview pending media (uploaded, waiting to send) */}
                {pendingMedia && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-white border border-blue-200 rounded-lg shadow-lg">
                        <div className="flex items-center gap-2">
                            <div className="flex flex-wrap gap-2 flex-1">
                                {pendingMedia.type === 'IMAGE' ? (
                                    pendingMedia.previews.map((preview, index) => (
                                        <div key={index} className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100">
                                            <img
                                                src={preview}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))
                                ) : pendingMedia.type === 'VIDEO' ? (
                                    pendingMedia.previews.map((preview, index) => (
                                        <div key={index} className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 relative">
                                            <video
                                                src={preview}
                                                className="w-full h-full object-cover"
                                                muted
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                <Film className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                                        <Paperclip className="w-5 h-5 text-slate-500" />
                                        <span className="text-sm text-slate-600">
                                            {pendingMedia.urls.length} tệp đính kèm
                                        </span>
                                    </div>
                                )}
                            </div>
                            <button
                                className="w-6 h-6 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                                onClick={removePendingMedia}
                                title="Xóa"
                            >
                                <X className="w-4 h-4 text-red-600" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Upload buttons */}
                <div className="flex items-center gap-1">
                    {/* Image upload */}
                    <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files, 'image')}
                        disabled={disabled || isUploading || !!pendingMedia}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={disabled || isUploading || !!pendingMedia}
                        title="Chọn ảnh"
                    >
                        {isUploading && uploadingFiles[0]?.type === 'image' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Image className="w-4 h-4" />
                        )}
                    </Button>

                    {/* Video upload */}
                    <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files, 'video')}
                        disabled={disabled || isUploading || !!pendingMedia}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={disabled || isUploading || !!pendingMedia}
                        title="Chọn video"
                    >
                        {isUploading && uploadingFiles[0]?.type === 'video' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Film className="w-4 h-4" />
                        )}
                    </Button>

                    {/* File upload */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.zip,.rar"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files, 'file')}
                        disabled={disabled || isUploading || !!pendingMedia}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled || isUploading || !!pendingMedia}
                        title="Chọn file"
                    >
                        {isUploading && uploadingFiles[0]?.type === 'file' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Paperclip className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </div>
        );
    }
);

ChatMediaUpload.displayName = 'ChatMediaUpload';

export default ChatMediaUpload;

