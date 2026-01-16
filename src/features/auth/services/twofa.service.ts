import { ApiService } from '@/api/api.service';
import { TwoFAEnableResponse, TwoFADisableResponse } from '@/interfaces/auth.types';

export class TwoFAService {
  /**
   * Enable 2FA for user
   */
  static async enable(): Promise<TwoFAEnableResponse> {
    const response = await ApiService.post<TwoFAEnableResponse>('/auth/2fa/enable', {}, true);
    return response;
  }

  /**
   * Disable 2FA for user (Step 1: Send OTP)
   */
  static async disable(): Promise<TwoFADisableResponse> {
    const response = await ApiService.post<TwoFADisableResponse>('/auth/2fa/disable', {}, true);
    return response;
  }

  /**
   * Verify OTP to disable 2FA (Step 2: Verify OTP)
   */
  static async disableVerify(otp: string): Promise<TwoFADisableResponse> {
    const response = await ApiService.post<TwoFADisableResponse>('/auth/2fa/disable/verify', { otp }, true);
    return response;
  }
}
