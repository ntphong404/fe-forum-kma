import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Mail, Lock, User, Sparkles } from 'lucide-react';
import { AuthService } from '../services/auth.service';
import { useAuthStore } from '@/store/useStore';
import { ApiError } from '@/interfaces/auth.types';
import EmailVerificationDialog from './EmailVerificationDialog';

// Password strength calculator
const getPasswordStrength = (password: string): { level: number; text: string } => {
  let score = 0;

  // Length checks
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;

  // Contains lowercase
  if (/[a-z]/.test(password)) score += 1;

  // Contains uppercase
  if (/[A-Z]/.test(password)) score += 1;

  // Contains number
  if (/[0-9]/.test(password)) score += 1;

  // Contains special character
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  // Calculate level (1-4)
  let level: number;
  let text: string;

  if (score <= 2) {
    level = 1;
    text = 'Yếu - Thêm chữ hoa, số hoặc ký tự đặc biệt';
  } else if (score <= 3) {
    level = 2;
    text = 'Trung bình - Mật khẩu có thể mạnh hơn';
  } else if (score <= 4) {
    level = 3;
    text = 'Khá - Gần đạt yêu cầu bảo mật';
  } else {
    level = 4;
    text = 'Mạnh - Mật khẩu an toàn';
  }

  return { level, text };
};

interface RegisterPageProps {
  onRegister: (user: any) => void;
  onSwitchToLogin?: () => void;
}

export default function RegisterPage({ onRegister, onSwitchToLogin }: RegisterPageProps) {
  const { login: setAuthLogin } = useAuthStore();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailVerification, setShowEmailVerification] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    setLoading(true);

    try {
      const response = await AuthService.register({
        username,
        email,
        firstName,
        lastName,
        password,
        dob: dob || undefined,
        gender: gender || undefined,
        address: address || undefined,
      });

      // Convert AuthData to User for the store
      const user = {
        userId: response.userId,
        username: response.username,
        email: response.email,
        firstName: response.firstName,
        lastName: response.lastName,
      };

      // Update auth store with user data
      setAuthLogin(user);

      // Show email verification dialog
      setShowEmailVerification(true);
    } catch (error: any) {
      const apiError = error as ApiError;
      setError(apiError.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Title */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-2xl shadow-blue-500/30 transform hover:scale-105 transition-transform">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Forum KMA
          </h1>
          <div className="flex items-center justify-center space-x-2 text-slate-500">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <p className="text-sm">Nơi chia sẻ và kết nối</p>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        {/* Register Card */}
        <Card className="border-0 shadow-2xl backdrop-blur-sm bg-white/90 rounded-3xl overflow-hidden animate-fade-in">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-slate-900">Tạo tài khoản mới 🎓</CardTitle>
            <CardDescription className="text-slate-500">Tham gia cộng đồng sinh viên ngay hôm nay</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">Họ</Label>
                  <div className="relative group">
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="pl-12 h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">Tên</Label>
                  <div className="relative group">
                    <Input
                      id="firstName"
                      type="text"

                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="pl-12 h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-slate-700">Tên đăng nhập</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="username"
                    type="text"

                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-12 h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Optional Profile Fields */}


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dob" className="text-sm font-medium text-slate-700">Ngày sinh</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-medium text-slate-700">Giới tính</Label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all px-4 text-slate-900"
                  >
                    <option value=""></option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium text-slate-700">Địa chỉ</Label>
                <Input
                  id="address"
                  type="text"

                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div className="pt-2 pb-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Bảo mật</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">Mật khẩu</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="password"
                    type="password"

                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    required
                  />
                </div>
                {/* Password Strength Indicator */}
                {password && (
                  <div className="flex mt-2">
                    {[1, 2, 3, 4].map((level) => {
                      const strength = getPasswordStrength(password);
                      const isActive = level <= strength.level;
                      return (
                        <div
                          key={level}
                          className={`h-1 flex-1 transition-all duration-300 first:rounded-l-full last:rounded-r-full ${isActive
                              ? strength.level === 1 ? 'bg-red-500'
                                : strength.level === 2 ? 'bg-orange-500'
                                  : strength.level === 3 ? 'bg-yellow-500'
                                    : 'bg-green-500'
                              : 'bg-slate-200'
                            }`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Xác nhận mật khẩu</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="confirmPassword"
                    type="password"

                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-12 h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    required
                  />
                </div>
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
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:shadow-xl transform hover:scale-[1.02] transition-all rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {loading ? 'Đang đăng ký...' : 'Đăng ký ngay'}
              </Button>
              {onSwitchToLogin && (
                <div className="text-center text-sm text-slate-500">
                  Đã có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="text-blue-600 hover:text-blue-700 hover:underline transition-colors font-semibold"
                  >
                    Đăng nhập ngay
                  </button>
                </div>
              )}
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-8">
          Bằng việc đăng ký, bạn đồng ý với{' '}
          <a href="#" className="text-blue-600 hover:underline transition-colors">
            Điều khoản sử dụng
          </a>{' '}
          và{' '}
          <a href="#" className="text-blue-600 hover:underline transition-colors">
            Chính sách bảo mật
          </a>
        </p>
      </div>

      {/* Email Verification Dialog */}
      <EmailVerificationDialog
        isOpen={showEmailVerification}
        onClose={() => {
          setShowEmailVerification(false);
          // Call the onRegister callback when verification dialog closes
          const user = useAuthStore.getState().user;
          onRegister(user);
        }}
        onVerificationComplete={() => {
          setShowEmailVerification(false);
          const user = useAuthStore.getState().user;
          onRegister(user);
        }}
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
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
