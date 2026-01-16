import { ApiService } from '@/api/api.service';

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface VerifyChangePasswordRequest {
  otp: string;
}

export interface ApiResponse<T> {
  code: string;
  message: string;
  result: T;
}

export const passwordService = {
  // Bước 1: Yêu cầu đổi mật khẩu (sẽ gửi OTP)
  async requestChangePassword(
    data: ChangePasswordRequest,
    _accessToken: string
  ): Promise<ApiResponse<string>> {
    const result = await ApiService.post<string>('/auth/change-password', data, true);
    return {
      code: '200',
      message: 'OTP đã được gửi đến email của bạn',
      result: result,
    };
  },

  // Bước 2: Xác nhận đổi mật khẩu với OTP
  async verifyChangePassword(
    data: VerifyChangePasswordRequest,
    _accessToken: string
  ): Promise<ApiResponse<string>> {
    const result = await ApiService.post<string>('/auth/change-password/verify', data, true);
    return {
      code: '200',
      message: 'Đổi mật khẩu thành công',
      result: result,
    };
  },

  // Quên mật khẩu - Bước 1: Gửi OTP
  async forgotPassword(email: string): Promise<ApiResponse<string>> {
    const result = await ApiService.post<string>('/auth/forgot-password', { email });
    return {
      code: '200',
      message: 'OTP đã được gửi đến email của bạn',
      result: result,
    };
  },

  // Quên mật khẩu - Bước 2: Xác thực OTP
  async verifyOtp(email: string, otp: string): Promise<ApiResponse<string>> {
    const result = await ApiService.post<string>('/auth/verify-otp', { email, otp });
    return {
      code: '200',
      message: 'Xác thực OTP thành công',
      result: result,
    };
  },

  // Quên mật khẩu - Bước 3: Reset mật khẩu
  async resetPassword(
    email: string,
    otp: string,
    newPassword: string
  ): Promise<ApiResponse<string>> {
    const result = await ApiService.post<string>('/auth/reset-password', { 
      email, 
      otp, 
      newPassword 
    });
    return {
      code: '200',
      message: 'Đặt lại mật khẩu thành công',
      result: result,
    };
  },
};
