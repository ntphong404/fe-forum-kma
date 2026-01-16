import { useState, useEffect } from 'react';
import { Camera, UserCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// switch replaced by single button UI
import { useAuthStore } from '@/store/useStore';
import { AuthService } from '../services/auth.service';
import { TwoFAService } from '../services/twofa.service';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AvatarUpload } from './AvatarUpload';
import EmailVerificationDialog from './EmailVerificationDialog';
import ChangePasswordDialog from './ChangePasswordDialog';
import DisableTwoFADialog from './DisableTwoFADialog';
import SessionManagement from './SessionManagement';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [dob, setDob] = useState(user?.dob ?? '');
  const [gender, setGender] = useState(user?.gender ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEmailVerificationOpen, setIsEmailVerificationOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isDisableTwoFAOpen, setIsDisableTwoFAOpen] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [toggling2FA, setToggling2FA] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarSuccess, setAvatarSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profile = await AuthService.fetchUserProfile();
        setUser(profile);

        // Update form fields
        setUsername(profile.username);
        setEmail(profile.email);
        setFirstName(profile.firstName || '');
        setLastName(profile.lastName || '');
        setDob(profile.dob || '');
        setGender(profile.gender || '');
        setAddress(profile.address || '');
        setIs2FAEnabled(profile.is2FAEnabled || false);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [setUser]);

  const handleSave = async () => {
    setSaving(true);
    setProfileError('');
    setProfileSuccess('');

    if (!user?.userId) {
      setProfileError('Không tìm thấy thông tin user');
      setSaving(false);
      return;
    }

    try {
      const updatedUser = await AuthService.updateProfileInfo({
        firstName,
        lastName,
        dob: dob || undefined,
        gender: gender || undefined,
        address: address || undefined,
      });

      // Update local store
      setUser(updatedUser);
      setProfileSuccess('Cập nhật thông tin thành công!');
    } catch (error: any) {
      setProfileError(error.message || 'Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleDisable2FASuccess = () => {
    setIs2FAEnabled(false);
    setProfileSuccess('Đã tắt xác thực 2 yếu tố thành công');

    // Update user in store
    if (user) {
      setUser({ ...user, is2FAEnabled: false });
    }
  };

  const handleEnable2FA = async () => {
    setToggling2FA(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const response = await TwoFAService.enable();
      setIs2FAEnabled(true);
      setProfileSuccess(response.message || 'Đã bật xác thực 2 yếu tố');
      if (user) setUser({ ...user, is2FAEnabled: true });
    } catch (error: any) {
      console.error('Error enabling 2FA:', error);
      setProfileError(error.message || 'Có lỗi xảy ra khi bật xác thực 2 yếu tố');
    } finally {
      setToggling2FA(false);
    }
  };

  return (
    <div className="p-8 w-full max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-8">Cài đặt tài khoản</h2>

      {/* Avatar Section */}
      <div className="bg-white p-6 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900">Ảnh đại diện</h3>
        </div>

        {avatarError && (
          <Alert variant="destructive" className="rounded-xl border-red-200 bg-red-50 mb-4">
            <AlertDescription className="text-red-600">{avatarError}</AlertDescription>
          </Alert>
        )}

        {avatarSuccess && (
          <Alert className="border-green-200 text-green-700 bg-green-50 rounded-xl mb-4">
            <AlertDescription>{avatarSuccess}</AlertDescription>
          </Alert>
        )}

        {user && (
          <AvatarUpload
            user={user}
            onSuccess={(updatedUser) => {
              setUser(updatedUser);
              setAvatarSuccess('Cập nhật ảnh đại diện thành công!');
              setAvatarError('');
            }}
            onError={(error) => {
              setAvatarError(error);
              setAvatarSuccess('');
            }}
          />
        )}
      </div>

      {/* Thông tin cá nhân */}
      <div className="space-y-5 bg-white p-6 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <UserCircle className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900">Thông tin cá nhân</h3>
        </div>

        {profileError && (
          <Alert variant="destructive" className="rounded-xl border-red-200 bg-red-50 mb-4">
            <AlertDescription className="text-red-600">{profileError}</AlertDescription>
          </Alert>
        )}

        {profileSuccess && (
          <Alert className="border-green-200 text-green-700 bg-green-50 rounded-xl mb-4">
            <AlertDescription>{profileSuccess}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Họ</label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Nhập họ"
              className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Tên</label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Nhập tên"
              className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Email</label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@kma.vn"
            className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Tên đăng nhập</label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nhập tên đăng nhập"
            className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Ngày sinh</label>
            <Input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Giới tính</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all px-4 text-slate-900"
            >
              <option value="">Chọn giới tính</option>
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Địa chỉ</label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Nhập địa chỉ"
            className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>

        <div className="flex items-center justify-end pt-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-11 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all"
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>

      {/* Bảo mật */}
      <div className="bg-white p-6 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900">Bảo mật</h3>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-slate-50 transition-all">
            <div>
              <h4 className="font-semibold text-slate-900">Đổi mật khẩu</h4>
              <p className="text-sm text-slate-500 mt-0.5">
                Cập nhật mật khẩu của bạn để bảo vệ tài khoản
              </p>
            </div>
            <Button
              onClick={() => setIsChangePasswordOpen(true)}
              variant="outline"
              className="h-10 px-5 rounded-xl border-slate-200 hover:bg-slate-100 hover:border-slate-300 font-medium transition-all"
            >
              Đổi mật khẩu
            </Button>
          </div>

          <div className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-slate-50 transition-all">
            <div>
              <h4 className="font-semibold text-slate-900">Xác thực Email</h4>
              <p className="text-sm text-slate-500 mt-0.5">
                {user?.userStatus === 'ACTIVE'
                  ? 'Email của bạn đã được xác thực'
                  : 'Xác thực email để bảo vệ tài khoản của bạn'
                }
              </p>
            </div>
            {user?.userStatus === 'ACTIVE' ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold">Đã xác thực</span>
              </div>
            ) : (
              <Button
                onClick={() => setIsEmailVerificationOpen(true)}
                variant="outline"
                className="h-10 px-5 rounded-xl border-slate-200 hover:bg-slate-100 hover:border-slate-300 font-medium transition-all"
              >
                Xác thực Email
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-slate-50 transition-all">
            <div>
              <h4 className="font-semibold text-slate-900">Xác thực 2 yếu tố</h4>
              <p className="text-sm text-slate-500 mt-0.5">
                Bảo vệ tài khoản với xác thực 2 bước
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={is2FAEnabled ? () => setIsDisableTwoFAOpen(true) : handleEnable2FA}
                variant={is2FAEnabled ? "outline" : "default"}
                size="sm"
                disabled={toggling2FA || loading}
                className={`h-10 px-5 rounded-xl font-medium transition-all ${is2FAEnabled
                  ? 'border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25'
                  }`}
              >
                {toggling2FA ? 'Đang xử lý...' : (is2FAEnabled ? 'Tắt 2FA' : 'Bật 2FA')}
              </Button>
            </div>
          </div>

          <div className="py-4 px-4 rounded-xl">
            <div className="mb-4">
              <h4 className="font-semibold text-slate-900">Phiên đăng nhập</h4>
              <p className="text-sm text-slate-500 mt-0.5">
                Quản lý các thiết bị đã đăng nhập
              </p>
            </div>
            {/* Session Management Component */}
            <SessionManagement />
          </div>
        </div>
      </div>

      <EmailVerificationDialog
        isOpen={isEmailVerificationOpen}
        onClose={() => setIsEmailVerificationOpen(false)}
        onVerificationComplete={() => {
          setProfileSuccess('Email đã được xác thực thành công!');
        }}
      />

      <ChangePasswordDialog
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        is2FAEnabled={is2FAEnabled}
      />

      <DisableTwoFADialog
        isOpen={isDisableTwoFAOpen}
        onClose={() => setIsDisableTwoFAOpen(false)}
        onSuccess={handleDisable2FASuccess}
      />
    </div>
  );
}
