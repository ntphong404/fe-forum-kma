import { useState, useEffect } from 'react';
import { Globe, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { GroupService } from '@/features/groups/services/group.service';
import type { GroupPrivacy } from '@/interfaces/post.types';

interface AdminCreateGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated?: () => void;
}

export default function AdminCreateGroupDialog({ isOpen, onClose, onGroupCreated }: AdminCreateGroupDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<GroupPrivacy>('PUBLIC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setPrivacy('PUBLIC');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Tên danh mục không được để trống');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await GroupService.createGroup({
        groupName: name.trim(),
        description: description.trim(),
        visibility: privacy,
      });

      onGroupCreated?.();
      onClose();
    } catch (err: any) {
      console.error('Failed to create group:', err);
      setError(err.message || 'Không thể tạo danh mục');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden bg-white border-0 shadow-2xl">
        <DialogHeader className="p-4 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800">Tạo danh mục mới</DialogTitle>
        </DialogHeader>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center">
                <span className="mr-2">⚠️</span> {error}
              </div>
            )}

            {/* Group Name */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">
                Tên danh mục <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên danh mục..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                maxLength={100}
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">
                Mô tả
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả về danh mục..."
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-sm"
                maxLength={500}
              />
            </div>

            {/* Privacy */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Quyền riêng tư
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPrivacy('PUBLIC')}
                  className={`flex flex-col items-start gap-2 p-3 rounded-xl border-2 transition-all ${
                    privacy === 'PUBLIC'
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`p-2 rounded-full ${
                      privacy === 'PUBLIC' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div
                      className={`font-semibold text-sm ${
                        privacy === 'PUBLIC' ? 'text-blue-900' : 'text-slate-700'
                      }`}
                    >
                      Công khai
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">Ai cũng có thể thấy</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPrivacy('PRIVATE')}
                  className={`flex flex-col items-start gap-2 p-3 rounded-xl border-2 transition-all ${
                    privacy === 'PRIVATE'
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`p-2 rounded-full ${
                      privacy === 'PRIVATE' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div
                      className={`font-semibold text-sm ${
                        privacy === 'PRIVATE' ? 'text-blue-900' : 'text-slate-700'
                      }`}
                    >
                      Riêng tư
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">Chỉ thành viên xem</div>
                  </div>
                </button>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={loading}
                className="h-11 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20"
                disabled={loading || !name.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  'Tạo danh mục'
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
