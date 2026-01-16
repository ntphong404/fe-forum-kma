import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import { AuthService } from '../services/auth.service';
import { useAuthStore } from '@/store/useStore';
import { ApiError } from '@/interfaces/auth.types';
import ForgotPasswordDialog from './ForgotPasswordDialog';

interface LoginPageProps {
  onLogin: (user: any) => void;
  onSwitchToRegister?: () => void;
}

export default function LoginPage({ onLogin, onSwitchToRegister }: LoginPageProps) {
  const { login: setAuthLogin } = useAuthStore();

  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [_tempSession, setTempSession] = useState<string>('');
  const [emailForOtp, setEmailForOtp] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Load remembered username on mount
  useEffect(() => {
    try {
      const rememberedUsername = localStorage.getItem('rememberedUsername');
      if (rememberedUsername) {
        setUsername(rememberedUsername);
        setRememberMe(true);
      }
    } catch (error) {
      console.error('Failed to load remembered username:', error);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await AuthService.login({
        username,
        password,
      });

      // Kiểm tra xem response có yêu cầu OTP không (code: AS_010)
      if ((response as any).code === 'AS_010' || !response.accessToken) {
        // Nếu cần 2FA, chuyển sang bước nhập OTP
        setStep('otp');
        setEmailForOtp(''); // Luôn để trống khi vào OTP
        setTempSession((response as any).sessionId || (response as any).tempToken || '');
        setLoading(false);
        return;
      }

      // Fetch full user profile from API (since AuthResponse only contains tokens)
      const userProfile = await AuthService.fetchUserProfile();

      // Build user object with fetched profile data
      const user = {
        userId: userProfile.userId,
        username: userProfile.username,
        email: userProfile.email,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        roleName: userProfile.roleName,
        roleId: userProfile.roleId,
        userStatus: userProfile.userStatus,
        is2FAEnabled: userProfile.is2FAEnabled,
        dob: userProfile.dob,
        gender: userProfile.gender,
        address: userProfile.address,
        avatarUrl: userProfile.avatarUrl,
      };

      // Update auth store with user data
      setAuthLogin(user);

      // Save credentials if remember me is checked
      if (rememberMe) {
        try {
          localStorage.setItem('rememberedUsername', username);
        } catch (error) {
          console.error('Failed to save username:', error);
        }
      } else {
        // Clear remembered username if not checking remember me
        try {
          localStorage.removeItem('rememberedUsername');
        } catch (error) {
          console.error('Failed to clear username:', error);
        }
      }

      // Call the onLogin callback with user data
      onLogin(user);
    } catch (error: any) {
      const apiError = error as ApiError;

      // Kiểm tra nếu lỗi là yêu cầu 2FA (code: AS_010)
      if (apiError.code === 'AS_010') {
        setStep('otp');
        setEmailForOtp(''); // Luôn để trống khi vào OTP
        setTempSession(apiError.sessionId || '');
        setLoading(false);
        return;
      }

      setError(apiError.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await AuthService.verifyLoginOtp({
        email: emailForOtp,
        otp,
      });

      // Fetch full user profile from API (since AuthResponse only contains tokens)
      const userProfile = await AuthService.fetchUserProfile();

      // Build user object with fetched profile data
      const user = {
        userId: userProfile.userId,
        username: userProfile.username,
        email: userProfile.email,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        roleName: userProfile.roleName,
        roleId: userProfile.roleId,
        userStatus: userProfile.userStatus,
        is2FAEnabled: userProfile.is2FAEnabled,
        dob: userProfile.dob,
        gender: userProfile.gender,
        address: userProfile.address,
        avatarUrl: userProfile.avatarUrl,
      };

      // Update auth store with user data
      setAuthLogin(user);

      // Save credentials if remember me is checked
      if (rememberMe) {
        try {
          localStorage.setItem('rememberedUsername', username);
        } catch (error) {
          console.error('Failed to save username:', error);
        }
      }

      // Call the onLogin callback with user data
      onLogin(user);
    } catch (error: any) {
      const apiError = error as ApiError;
      setError(apiError.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setStep('login');
    setOtp('');
    setError(null);
    setEmailForOtp('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-3 sm:p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 sm:w-96 h-64 sm:h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-64 sm:w-96 h-64 sm:h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-64 sm:w-96 h-64 sm:h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Title */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center mb-3 sm:mb-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30 transform hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Forum KMA</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">Cộng đồng sinh viên Học viện Kỹ thuật Mật mã</p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-2xl backdrop-blur-sm bg-white/90 rounded-2xl sm:rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1 pb-3 sm:pb-4 px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900">
              {step === 'login' ? 'Đăng nhập' : 'Xác thực 2 yếu tố'}
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs sm:text-sm">
              {step === 'login'
                ? 'Chào mừng bạn quay trở lại!'
                : 'Nhập mã OTP đã được gửi đến email của bạn'
              }
            </CardDescription>
          </CardHeader>

          {/* Step 1: Login Form */}
          {step === 'login' && (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 sm:space-y-5 px-4 sm:px-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs sm:text-sm font-medium text-slate-700">Tên đăng nhập</Label>
                  <div className="relative group">
                    <User className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 sm:pl-12 h-10 sm:h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs sm:text-sm font-medium text-slate-700">Mật khẩu</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 sm:pl-12 pr-10 sm:pr-12 h-10 sm:h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm transition-all [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none z-10"
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-600">Ghi nhớ đăng nhập</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2">
                    <span>⚠️</span>
                    {error}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-4 pt-2 pb-6 px-6">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
                >
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
                {onSwitchToRegister && (
                  <div className="text-center text-sm text-slate-500">
                    Chưa có tài khoản?{' '}
                    <button
                      type="button"
                      onClick={onSwitchToRegister}
                      className="text-blue-600 hover:text-blue-700 hover:underline font-semibold"
                    >
                      Đăng ký ngay
                    </button>
                  </div>
                )}
              </CardFooter>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp}>
              <CardContent className="space-y-5">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="emailForOtp" className="text-sm font-medium text-slate-700">Email</Label>
                    <Input
                      id="emailForOtp"
                      type="email"
                      value={emailForOtp}
                      onChange={(e) => setEmailForOtp(e.target.value)}
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm transition-all"
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-sm font-medium text-slate-700">Mã OTP</Label>
                    <Input
                      id="otp"
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      disabled={loading}
                      autoFocus
                      className="text-center text-2xl tracking-[0.5em] font-bold h-16 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp(e as any)}
                    />
                  </div>

                  <div className="text-sm text-slate-500 text-center space-y-1 mt-4 p-4 bg-slate-50 rounded-xl">
                    <p>📧 Kiểm tra email của bạn để lấy mã OTP</p>
                    <p className="text-xs">Mã OTP có hiệu lực trong 5 phút</p>
                  </div>
                </div>
                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2">
                    <span>⚠️</span>
                    {error}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-3 pt-2 pb-6 px-6">
                <Button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-blue-500/25"
                >
                  {loading ? 'Đang xác thực...' : 'Xác nhận'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToLogin}
                  disabled={loading}
                  className="w-full h-12 rounded-xl border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50"
                >
                  Quay lại
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-8">
          Bằng việc đăng nhập, bạn đồng ý với{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Điều khoản sử dụng
          </a>{' '}
          và{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Chính sách bảo mật
          </a>
        </p>
      </div>

      <ForgotPasswordDialog
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}