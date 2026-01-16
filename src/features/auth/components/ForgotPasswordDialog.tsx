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
import { passwordService } from '../services/password.service';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, KeyRound, CheckCircle2 } from 'lucide-react';

interface ForgotPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'email' | 'otp' | 'password';

export default function ForgotPasswordDialog({
  isOpen,
  onClose,
}: ForgotPasswordDialogProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOtp = async () => {
    setError('');
    setSuccess('');

    if (!email || !email.includes('@')) {
      setError('Vui lòng nhập email hợp lệ');
      return;
    }

    setLoading(true);

    try {
      const response = await passwordService.forgotPassword(email);

      if (response.code == '200') {
        setSuccess(response.message || 'OTP đã được gửi đến email của bạn');
        setTimeout(() => {
          setSuccess('');
          setStep('otp');
        }, 1500);
      } else {
        setError(response.message || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      setError(err.message || 'Email không tồn tại trong hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setSuccess('');

    if (!otp || otp.length !== 6) {
      setError('Vui lòng nhập mã OTP 6 số');
      return;
    }

    setLoading(true);

    try {
      const response = await passwordService.verifyOtp(email, otp);

      if (response.code == '200') {
        setSuccess(response.message || 'Xác thực OTP thành công!');
        setTimeout(() => {
          setSuccess('');
          setStep('password');
        }, 1500);
      } else {
        setError(response.message || 'Mã OTP không chính xác');
      }
    } catch (err: any) {
      setError(err.message || 'Mã OTP không chính xác hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    setSuccess('');

    if (!newPassword || !confirmPassword) {
      setError('Vui lòng nhập mật khẩu mới');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);

    try {
      const response = await passwordService.resetPassword(email, otp, newPassword);

      if (response.code == '200') {
        setSuccess('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.');
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError(response.message || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    onClose();
  };

  const getStepTitle = () => {
    switch (step) {
      case 'email':
        return 'Quên mật khẩu';
      case 'otp':
        return 'Xác thực OTP';
      case 'password':
        return 'Đặt mật khẩu mới';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'email':
        return 'Nhập email của bạn để nhận mã OTP';
      case 'otp':
        return 'Nhập mã OTP đã được gửi đến email của bạn';
      case 'password':
        return 'Tạo mật khẩu mới cho tài khoản của bạn';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl">{getStepTitle()}</DialogTitle>
          <DialogDescription className="text-base">
            {getStepDescription()}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-4 px-4">
          <div className="flex flex-col items-center flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step === 'email' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
              }`}>
              {step === 'email' ? <Mail size={20} /> : <CheckCircle2 size={20} />}
            </div>
            <span className="text-xs mt-2 font-medium">Email</span>
          </div>

          <div className={`flex-1 h-1 mx-2 ${step === 'otp' || step === 'password' ? 'bg-green-600' : 'bg-gray-300'
            }`} />

          <div className="flex flex-col items-center flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step === 'email' ? 'bg-gray-300 text-gray-600' :
                step === 'otp' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
              }`}>
              {step === 'password' ? <CheckCircle2 size={20} /> : <span className="text-sm font-semibold">OTP</span>}
            </div>
            <span className="text-xs mt-2 font-medium">Xác thực</span>
          </div>

          <div className={`flex-1 h-1 mx-2 ${step === 'password' ? 'bg-green-600' : 'bg-gray-300'
            }`} />

          <div className="flex flex-col items-center flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step === 'password' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
              <KeyRound size={20} />
            </div>
            <span className="text-xs mt-2 font-medium">Mật khẩu</span>
          </div>
        </div>

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

          {/* Step 1: Email Input */}
          {step === 'email' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Địa chỉ Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  className="h-11"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                />
                <p className="text-sm text-gray-500">
                  Chúng tôi sẽ gửi mã OTP (6 số) đến email này
                </p>
              </div>
            </div>
          )}

          {/* Step 2: OTP Verification */}
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
                  className="text-center text-3xl tracking-[0.5em] font-semibold h-14"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                />
                <div className="text-sm text-gray-600 text-center space-y-1">
                  <p>Kiểm tra email <span className="font-semibold text-blue-600">{email}</span></p>
                  <p className="text-xs">Mã OTP có hiệu lực trong 10 phút</p>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <Button
                  variant="link"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="text-sm"
                >
                  Không nhận được mã? Gửi lại
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: New Password */}
          {step === 'password' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  className="h-11"
                  autoFocus
                />
                <p className="text-xs text-gray-500">
                  Mật khẩu phải có ít nhất 6 ký tự
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="h-11"
                  onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                />
              </div>

              {newPassword && confirmPassword && (
                <div className="text-sm">
                  {newPassword === confirmPassword ? (
                    <p className="text-green-600 flex items-center gap-1">
                      <CheckCircle2 size={16} /> Mật khẩu khớp
                    </p>
                  ) : (
                    <p className="text-red-600">❌ Mật khẩu không khớp</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {step === 'email' && (
            <>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Hủy
              </Button>
              <Button onClick={handleSendOtp} disabled={loading} className="min-w-[120px]">
                {loading ? 'Đang gửi...' : 'Gửi OTP'}
              </Button>
            </>
          )}

          {step === 'otp' && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setStep('email');
                  setOtp('');
                  setError('');
                }}
                disabled={loading}
              >
                Quay lại
              </Button>
              <Button onClick={handleVerifyOtp} disabled={loading} className="min-w-[120px]">
                {loading ? 'Đang xác thực...' : 'Xác thực OTP'}
              </Button>
            </>
          )}

          {step === 'password' && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setStep('otp');
                  setNewPassword('');
                  setConfirmPassword('');
                  setError('');
                }}
                disabled={loading}
              >
                Quay lại
              </Button>
              <Button onClick={handleResetPassword} disabled={loading} className="min-w-[140px]">
                {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
