import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, Save } from 'lucide-react';
import { FileUploadService } from '@/lib/file-upload.service';
import { AuthService } from '../services/auth.service';
import { User } from '@/interfaces/auth.types';

interface AvatarUploadProps {
  user: User;
  onSuccess: (updatedUser: User) => void;
  onError?: (error: string) => void;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({ user, onSuccess, onError }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [hovering, setHovering] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = FileUploadService.validateFile(file, 'avatar', 5);
    if (!validation.valid) {
      onError?.(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!selectedFile) return;

    setUploading(true);

    try {
      // Step 1: Upload file to get URL
      const avatarUrl = await FileUploadService.uploadAvatar(selectedFile);

      // Step 2: Update user profile with new avatar URL
      const updatedUser = await AuthService.updateAvatar(avatarUrl);

      onSuccess(updatedUser);

      // Clear selection
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onError?.(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const currentAvatarUrl = user.avatarUrl || 'https://via.placeholder.com/150?text=Avatar';
  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative group"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <img
          src={displayUrl}
          alt={`${user.firstName} ${user.lastName}`}
          className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/150?text=Avatar';
          }}
        />

        {/* Overlay on hover */}
        {!selectedFile && (
          <div
            className={`absolute inset-0 bg-black rounded-full flex items-center justify-center transition-opacity ${hovering && !uploading ? 'opacity-70' : 'opacity-0'
              }`}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-white hover:text-white hover:bg-transparent"
            >
              <Camera className="h-8 w-8" />
            </Button>
          </div>
        )}

        {/* Preview indicator */}
        {selectedFile && !uploading && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-full border-4 border-blue-500 flex items-center justify-center">
            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
              Xem trước
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-70 rounded-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
      </div>

      <div className="text-center space-y-3">
        {!selectedFile ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              <Camera className="h-4 w-4" />
              Chọn ảnh mới
            </Button>
            <p className="text-xs text-slate-500">
              JPG, PNG, GIF hoặc WebP. Tối đa 5MB
            </p>
          </>
        ) : (
          <>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="default"
                onClick={handleSave}
                disabled={uploading}
                className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Lưu ảnh đại diện
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={uploading}
              >
                Hủy
              </Button>
            </div>
            <p className="text-xs text-blue-600 font-medium">
              Nhấn "Lưu" để cập nhật ảnh đại diện
            </p>
          </>
        )}
      </div>
    </div>
  );
};
