import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, FileIcon, ImageIcon, Loader2 } from 'lucide-react';
import { FileUploadService } from '@/lib/file-upload.service';
import { FileUploadType } from '@/interfaces/file.types';

interface FileUploadProps {
  onUploadSuccess: (url: string) => void;
  onUploadError?: (error: string) => void;
  uploadType?: FileUploadType;
  maxSizeMB?: number;
  accept?: string;
  showPreview?: boolean;
  className?: string;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'ghost' | 'secondary';
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  uploadType = 'image',
  maxSizeMB = 10,
  accept,
  showPreview = true,
  className,
  buttonText,
  buttonVariant = 'outline',
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getDefaultAccept = (): string => {
    switch (uploadType) {
      case 'avatar':
      case 'image':
        return 'image/jpeg,image/jpg,image/png,image/gif,image/webp';
      case 'document':
        return '.pdf,.doc,.docx,.zip,.rar';
      default:
        return '*/*';
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = FileUploadService.validateFile(file, uploadType, maxSizeMB);
    if (!validation.valid) {
      onUploadError?.(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (showPreview && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);

    try {
      const url = await FileUploadService.uploadFile(
        selectedFile,
        uploadType,
        (progress) => setProgress(progress)
      );
      onUploadSuccess(url);
      handleClear();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getButtonText = (): string => {
    if (buttonText) return buttonText;
    switch (uploadType) {
      case 'avatar':
        return 'Choose Avatar';
      case 'image':
        return 'Choose Image';
      case 'document':
        return 'Choose Document';
      default:
        return 'Choose File';
    }
  };

  return (
    <div className={`space-y-4 ${className || ''}`}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={buttonVariant}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          {getButtonText()}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept || getDefaultAccept()}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {selectedFile && !uploading && (
          <Button
            type="button"
            variant="default"
            onClick={handleUpload}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        )}
      </div>

      {selectedFile && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-16 h-16 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
                  {uploadType === 'document' ? (
                    <FileIcon className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            {!uploading && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uploading...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {uploading && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Uploading file...</span>
        </div>
      )}
    </div>
  );
};
