import { useState } from 'react';
import { createPortal } from 'react-dom';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'sent'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setEmail('');
    setStep('email');
    setError('');
    setIsLoading(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }

    setIsLoading(true);
    // Simulate API call - in production, connect to real email service
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    setStep('sent');
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-display">
      <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] transition-all duration-300" onClick={handleClose} />

      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">

        {step === 'email' ? (
          <>
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-amber-500 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>mail_lock</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Quên mật khẩu</h3>
                    <p className="text-xs text-slate-500">Nhận link đặt lại mật khẩu qua email</p>
                  </div>
                </div>
                <button onClick={handleClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-slate-400 text-lg">close</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500 text-lg">error</span>
                  <span className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</span>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Địa chỉ email đăng ký</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vd: nguyenvana@email.com"
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={handleClose} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">send</span>
                      Gửi link đặt lại
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Success State */
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-emerald-500 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
            </div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Kiểm tra email của bạn</h4>
            <p className="text-sm text-slate-500 mb-1">
              Nếu tài khoản <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span> tồn tại,
            </p>
            <p className="text-sm text-slate-500 mb-6">
              bạn sẽ nhận được link đặt lại mật khẩu trong vài phút.
            </p>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30 text-left mb-6">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-blue-500 text-lg mt-0.5">info</span>
                <div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Không nhận được email?</p>
                  <ul className="text-xs text-blue-600 dark:text-blue-400 mt-1 space-y-0.5">
                    <li>• Kiểm tra thư mục spam/junk</li>
                    <li>• Đảm bảo email đúng với tài khoản đã đăng ký</li>
                    <li>• Liên hệ quản trị viên nếu cần hỗ trợ</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Đã hiểu, quay lại đăng nhập
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
