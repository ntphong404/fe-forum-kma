import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { emailVerificationService } from '../services/email-verification.service';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle2, X } from 'lucide-react';

interface EmailVerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete?: () => void;
}

type Step = 'send' | 'otp';

export default function EmailVerificationDialog({
  isOpen,
  onClose,
  onVerificationComplete,
}: EmailVerificationDialogProps) {
  const [step, setStep] = useState<Step>('send');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);

  const handleReset = () => {
    setStep('send');
    setOtp('');
    setError('');
    setSuccess('');
    setLoading(false);
    setCountdown(0);
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSendOtp = async () => {
    setError('');
    setSuccess('');

    setLoading(true);

    try {
      const response = await emailVerificationService.sendVerificationOtp();

      if (response.code === '200') {
        setSuccess(response.message || 'OTP đã được gửi đến email của bạn');
        setCountdown(60); // 60 seconds countdown
        setTimeout(() => {
          setSuccess('');
          setStep('otp');
        }, 1500);
      } else {
        setError(response.message || 'Có lỗi xảy ra khi gửi OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');
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
      const response = await emailVerificationService.completeVerification(otp);

      if (response.code === '200') {
        setSuccess(response.message || 'Xác thực email thành công!');
        setTimeout(() => {
          handleReset();
          onClose();
          onVerificationComplete?.();
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

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-6">
      {/* Step 1: Send OTP */}
      <div className="flex flex-col items-center flex-1">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
            step === 'send'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-500'
          }`}
        >
          <Mail className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium">Gửi OTP</p>
      </div>

      {/* Connector Line */}
      <div className="flex-1 h-0.5 bg-gray-300 mx-4 mb-8" />

      {/* Step 2: OTP */}
      <div className="flex flex-col items-center flex-1">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
            step === 'otp'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-500'
          }`}
        >
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium">Xác thực</p>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Xác thực Email</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Xác thực email của bạn để bảo mật tài khoản
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 text-green-900 border-green-200">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {step === 'send' && (
            <>
              <p className="text-sm text-gray-500">
                Chúng tôi sẽ gửi mã OTP đến email của bạn để xác thực
              </p>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={handleClose} disabled={loading}>
                  Hủy
                </Button>
                <Button onClick={handleSendOtp} disabled={loading}>
                  {loading ? 'Đang gửi...' : 'Gửi OTP'}
                </Button>
              </div>
            </>
          )}

          {step === 'otp' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp">Mã OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Nhập mã OTP 6 số"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleVerifyOtp();
                    }
                  }}
                  disabled={loading}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
              </div>

              <p className="text-sm text-gray-500">
                Vui lòng kiểm tra email của bạn và nhập mã OTP đã được gửi
              </p>

              <div className="flex items-center justify-center pt-2">
                <Button
                  variant="link"
                  onClick={handleSendOtp}
                  disabled={loading || countdown > 0}
                  className="text-sm"
                >
                  {countdown > 0 
                    ? `Gửi lại OTP sau ${countdown}s` 
                    : 'Không nhận được mã? Gửi lại'}
                </Button>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('send');
                    setOtp('');
                    setError('');
                  }}
                  disabled={loading}
                >
                  Quay lại
                </Button>
                <Button onClick={handleVerifyOtp} disabled={loading || otp.length !== 6}>
                  {loading ? 'Đang xác thực...' : 'Xác thực'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
