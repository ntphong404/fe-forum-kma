import { ApiService } from '@/api/api.service';
import { ApiResponse } from '@/interfaces/auth.types';

export class EmailVerificationService {
  /**
   * Send OTP to user's email for verification
   */
  static async sendVerificationOtp(): Promise<ApiResponse<string>> {
    const result = await ApiService.post<string>(
      '/auth/verify-email',
      {},
      true
    );

    // API service returns just the result, wrap it in expected format
    return {
      code: '200',
      message: 'OTP đã được gửi đến email của bạn',
      result: result,
    };
  }

  /**
   * Complete email verification with OTP
   */
  static async completeVerification(otp: string): Promise<ApiResponse<string>> {
    if (!otp || otp.length !== 6) {
      throw new Error('Mã OTP phải có 6 ký tự');
    }

    const result = await ApiService.post<string>(
      '/auth/verify-email/complete',
      { otp },
      true
    );

    return {
      code: '200',
      message: 'Xác thực email thành công!',
      result: result,
    };
  }
}

export const emailVerificationService = EmailVerificationService;
