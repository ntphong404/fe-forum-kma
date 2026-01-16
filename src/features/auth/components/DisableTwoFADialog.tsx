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
import { TwoFAService } from '../services/twofa.service';
import { ShieldOff, CheckCircle2 } from 'lucide-react';

interface DisableTwoFADialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = 'request' | 'otp';

export default function DisableTwoFADialog({
  isOpen,
  onClose,
  onSuccess,
}: DisableTwoFADialogProps) {
  const [step, setStep] = useState<Step>('request');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestDisable = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await TwoFAService.disable();
      setSuccess(response.message || 'OTP đã được gửi đến email của bạn');
      setTimeout(() => {
        setSuccess('');
        setStep('otp');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tắt xác thực 2 yếu tố');
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
      const response = await TwoFAService.disableVerify(otp);
      setSuccess(response.message || 'Đã tắt xác thực 2 yếu tố thành công!');
      setTimeout(() => {
        handleClose();
        onSuccess?.();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Mã OTP không chính xác hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('request');
    setOtp('');
    setError('');
    setSuccess('');
    setLoading(false);
    onClose();
  };

  const handleBack = () => {
    setStep('request');
    setOtp('');
    setError('');
    setSuccess('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl">Tắt xác thực 2 yếu tố</DialogTitle>
          <DialogDescription className="text-base">
            {step === 'request' 
              ? 'Chúng tôi sẽ gửi mã OTP đến email của bạn để xác thực'
              : 'Nhập mã OTP đã được gửi đến email của bạn'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-4 px-4">
          <div className="flex flex-col items-center flex-1">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              step === 'request' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
            }`}>
              {step === 'request' ? <ShieldOff size={24} /> : <CheckCircle2 size={24} />}
            </div>
            <span className="text-xs mt-2 font-medium">Gửi OTP</span>
          </div>
          
          <div className={`flex-1 h-1 mx-2 ${
            step === 'otp' ? 'bg-green-600' : 'bg-gray-300'
          }`} />
          
          <div className="flex flex-col items-center flex-1">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              step === 'otp' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              <span className="text-sm font-semibold">OTP</span>
            </div>
            <span className="text-xs mt-2 font-medium">Xác thực</span>
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

          {/* Step 1: Request */}
          {step === 'request' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <ShieldOff className="text-yellow-600 mt-0.5" size={20} />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Lưu ý quan trọng</p>
                    <p>
                      Sau khi tắt xác thực 2 yếu tố, tài khoản của bạn sẽ chỉ được bảo vệ bằng mật khẩu. 
                      Chúng tôi khuyến nghị bạn nên giữ tính năng này được bật để bảo mật tốt hơn.
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 text-center">
                Nhấn nút "Gửi OTP" để nhận mã xác thực qua email
              </p>
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
                  onClick={handleRequestDisable}
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
          {step === 'request' ? (
            <>
              <Button 
                variant="outline" 
                onClick={handleClose} 
                disabled={loading}
              >
                Hủy
              </Button>
              <Button 
                onClick={handleRequestDisable} 
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? 'Đang gửi...' : 'Gửi OTP'}
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
