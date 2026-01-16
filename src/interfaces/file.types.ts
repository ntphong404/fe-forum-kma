export interface UploadResponse {
  resourceUrl: string;
}

export interface ApiResponse<T> {
  code?: string;
  message: string;
  result?: T;
  data?: T;
  success?: boolean;
}

export type FileUploadType = 'avatar' | 'image' | 'document' | 'video';

export interface FileUploadOptions {
  type: FileUploadType;
  file: File;
  onProgress?: (progress: number) => void;
}
