import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ApiService } from '@/api/api.service';
import { KeyRound, CheckCircle2 } from 'lucide-react';

interface ChangePasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  is2FAEnabled?: boolean;
}

type Step = 'password' | 'otp';

export default function ChangePasswordDialog({
  isOpen,
  onClose,
  is2FAEnabled = false,
}: ChangePasswordDialogProps) {
  const [step, setStep] = useState<Step>('password');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestChange = async () => {
    setError('');
    setSuccess('');

    // Validation
    if (!oldPassword.trim()) {
      setError('Vui lòng nhập mật khẩu cũ');
      return;
    }

    if (!newPassword.trim()) {
      setError('Vui lòng nhập mật khẩu mới');
      return;
    }

    if (!confirmPassword.trim()) {
      setError('Vui lòng xác nhận mật khẩu mới');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và xác nhận không khớp');
      return;
    }

    if (oldPassword === newPassword) {
      setError('Mật khẩu mới phải khác mật khẩu cũ');
      return;
    }

    setLoading(true);

    try {
      const response = await ApiService.post<any>(
        '/auth/change-password',
        {
          oldPassword,
          newPassword,
        },
        true
      );

      // Response có thể là full object hoặc chỉ là result, kiểm tra cả 2 trường hợp
      const isSuccess = response === 'ok' || response?.code === '200' || response?.code === 200;

      if (isSuccess) {
        if (is2FAEnabled) {
          setSuccess(response?.message || 'OTP đã được gửi đến email của bạn');
          setTimeout(() => {
            setSuccess('');
            setStep('otp');
          }, 1500);
        } else {
          setSuccess(response?.message || 'Đổi mật khẩu thành công!');
          setTimeout(() => {
            handleClose();
          }, 800);
        }
      } else {
        setError(response?.message || 'Có lỗi xảy ra khi đổi mật khẩu');
      }
    } catch (err: any) {
      setError(err.message || 'Mật khẩu cũ không chính xác');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setSuccess('');

    if (!otp.trim() || otp.length !== 6) {
      setError('Vui lòng nhập mã OTP 6 số');
      return;
    }

    setLoading(true);

    try {
      const response = await ApiService.post<any>(
        '/auth/change-password/verify',
        { otp },
        true
      );

      // Response có thể là full object hoặc chỉ là result
      const isSuccess = response === 'ok' || response?.code === '200' || response?.code === 200;

      if (isSuccess) {
        setSuccess(response?.message || 'Đổi mật khẩu thành công!');
        setTimeout(() => {
          handleClose();
        }, 800);
      } else {
        setError(response?.message || 'Mã OTP không chính xác');
      }
    } catch (err: any) {
      setError(err.message || 'Mã OTP không chính xác hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('password');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setOtp('');
    setError('');
    setSuccess('');
    setLoading(false);
    onClose();
  };

  const handleBack = () => {
    setStep('password');
    setOtp('');
    setError('');
    setSuccess('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl">Đổi mật khẩu</DialogTitle>
          <DialogDescription className="text-base">
            {step === 'password'
              ? 'Nhập mật khẩu cũ và mật khẩu mới của bạn'
              : 'Nhập mã OTP đã được gửi đến email của bạn'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator - Only show when 2FA is enabled */}
        {is2FAEnabled && (
          <div className="flex items-center justify-between mb-4 px-4">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step === 'password' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                }`}>
                {step === 'password' ? <KeyRound size={24} /> : <CheckCircle2 size={24} />}
              </div>
              <span className="text-xs mt-2 font-medium">Mật khẩu</span>
            </div>

            <div className={`flex-1 h-1 mx-2 ${step === 'otp' ? 'bg-green-600' : 'bg-gray-300'
              }`} />

            <div className="flex flex-col items-center flex-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step === 'otp' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                <span className="text-sm font-semibold">OTP</span>
              </div>
              <span className="text-xs mt-2 font-medium">Xác thực</span>
            </div>
          </div>
        )}

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 text-green-700 bg-green-50">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Password Fields */}
          {step === 'password' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="oldPassword">Mật khẩu cũ</Label>
                <Input
                  id="oldPassword"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  disabled={loading}
                  autoFocus
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  disabled={loading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  disabled={loading}
                  className="h-11"
                  onKeyDown={(e) => e.key === 'Enter' && handleRequestChange()}
                />
                {is2FAEnabled && (
                  <p className="text-sm text-gray-500">
                    Chúng tôi sẽ gửi mã OTP đến email của bạn để xác thực
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: OTP Field */}
          {step === 'otp' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Mã OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  disabled={loading}
                  autoFocus
                  className="text-center text-3xl tracking-[0.5em] font-semibold h-14"
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                />
                <div className="text-sm text-gray-600 text-center space-y-1">
                  <p>Kiểm tra email của bạn để lấy mã OTP</p>
                  <p className="text-xs">Mã OTP có hiệu lực trong 10 phút</p>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <Button
                  variant="link"
                  onClick={handleRequestChange}
                  disabled={loading}
                  className="text-sm"
                >
                  Không nhận được mã? Gửi lại
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {step === 'password' ? (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button
                onClick={handleRequestChange}
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? 'Đang xử lý...' : (is2FAEnabled ? 'Gửi OTP' : 'Đổi mật khẩu')}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={loading}
              >
                Quay lại
              </Button>
              <Button
                onClick={handleVerifyOtp}
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? 'Đang xác thực...' : 'Xác nhận'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
