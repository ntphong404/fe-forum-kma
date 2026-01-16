export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dob?: string;
  gender?: string;
  address?: string;
}

export interface AuthData {
  userId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  accessToken: string;
  refreshToken: string;
  roleName?: string;
  roleId?: string;
  userStatus?: 'ACTIVE' | 'PENDING' | 'BANNED';
  is2FAEnabled?: boolean;
  dob?: string;
  gender?: string;
  address?: string;
  avatarUrl?: string;
}

export interface User {
  userId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles?: string[];
  banned?: boolean;
  createdAt?: string;
  userStatus?: 'ACTIVE' | 'PENDING' | 'BANNED';
  is2FAEnabled?: boolean;
  postCount?: number;
  totalPosts?: number;
  dob?: string;
  gender?: string;
  address?: string;
  avatarUrl?: string;
  roleId?: string;
  roleName?: string;
}

export interface ApiResponse<T = any> {
  code: string;
  message: string;
  result: T;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  code?: string;
  sessionId?: string;
  errors?: Record<string, string[]>;
}

export interface DeviceInfo {
  deviceName?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  location?: string;
  lastAccessTime?: string;
  userAgent?: string;
}

export interface Session {
  sessionId: string;
  deviceInfo: DeviceInfo;
}

export interface SessionResponse {
  sessionId: string;
  deviceInfo: DeviceInfo;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UpdateProfileRequest {
  username?: string;
  password?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  userStatus?: 'PENDING' | 'ACTIVE' | 'BANNED';
  is2FAEnabled?: boolean;
  dob?: string;
  gender?: string;
  address?: string;
  avatarUrl?: string;
}

export interface VerifyEmailRequest {
  otp: string;
}

export interface VerifyLoginOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyEmailResponse {
  message: string;
}

export interface TwoFAEnableResponse {
  qrCode: string;
  secret: string;
  message: string;
}

export interface TwoFADisableResponse {
  message: string;
}
