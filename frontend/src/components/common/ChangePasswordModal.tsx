import { useState } from 'react';
import { createPortal } from 'react-dom';
import { userApi } from '../../api/user';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose, onSuccess }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (currentPassword === newPassword) {
      setError('Mật khẩu mới phải khác mật khẩu hiện tại');
      return;
    }

    setIsLoading(true);
    try {
      const res = await userApi.changePassword({ currentPassword, newPassword });
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          handleClose();
          onSuccess?.();
        }, 1500);
      } else {
        setError(res.message || 'Đổi mật khẩu thất bại');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const passwordStrength = () => {
    if (!newPassword) return { level: 0, text: '', color: '' };
    let score = 0;
    if (newPassword.length >= 6) score++;
    if (newPassword.length >= 10) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    if (score <= 2) return { level: score, text: 'Yếu', color: 'bg-red-500' };
    if (score <= 3) return { level: score, text: 'Trung bình', color: 'bg-amber-500' };
    return { level: score, text: 'Mạnh', color: 'bg-emerald-500' };
  };

  const strength = passwordStrength();

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-display">
      <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] transition-all duration-300" onClick={handleClose} />
      
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Đổi mật khẩu</h3>
                <p className="text-xs text-slate-500">Cập nhật mật khẩu tài khoản của bạn</p>
              </div>
            </div>
            <button onClick={handleClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-slate-400 text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Success State */}
        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-emerald-500 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Đổi mật khẩu thành công!</h4>
            <p className="text-sm text-slate-500">Mật khẩu mới đã được cập nhật.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500 text-lg">error</span>
                <span className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</span>
              </div>
            )}

            {/* Current Password */}
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Mật khẩu hiện tại</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  required
                  className="w-full px-4 py-2.5 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined text-lg">{showCurrent ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Mật khẩu mới</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined text-lg">{showNew ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {/* Strength Indicator */}
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.level ? strength.color : 'bg-slate-200 dark:bg-slate-700'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${strength.level <= 2 ? 'text-red-500' : strength.level <= 3 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    Độ mạnh: {strength.text}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Xác nhận mật khẩu mới</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  minLength={6}
                  className={`w-full px-4 py-2.5 pr-10 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all ${
                    confirmPassword && confirmPassword !== newPassword
                      ? 'border-red-300 dark:border-red-700'
                      : confirmPassword && confirmPassword === newPassword
                      ? 'border-emerald-300 dark:border-emerald-700'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined text-lg">{showConfirm ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-xs text-red-500 mt-1 font-medium">Mật khẩu không khớp</p>
              )}
              {confirmPassword && confirmPassword === newPassword && (
                <p className="text-xs text-emerald-500 mt-1 font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">check</span>
                  Mật khẩu khớp
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={handleClose} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">lock_reset</span>
                    Đổi mật khẩu
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
