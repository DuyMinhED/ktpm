import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface DeleteDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (doctorId: string) => Promise<void>;
  isDeleting: boolean;
  doctorData: any;
}

export default function DeleteDoctorModal({
  isOpen,
  onClose,
  onDelete,
  isDeleting,
  doctorData
}: DeleteDoctorModalProps) {
  const [confirmName, setConfirmName] = useState('');
  const [confirmPhrase, setConfirmPhrase] = useState('');

  const targetPhrase = 'Xóa hồ sơ bác sĩ';

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset inputs when modal opens
      setConfirmName('');
      setConfirmPhrase('');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !doctorData) return null;

  const isConfirmed = confirmName === doctorData.name && confirmPhrase.toLowerCase() === targetPhrase.toLowerCase();

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 text-left font-display">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] transition-all duration-300"
        onClick={onClose}
      ></div>

      <div className="relative bg-white dark:bg-slate-900 w-full max-w-[500px] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 border border-slate-200 dark:border-slate-800 transition-all max-h-[95vh]">
        {/* Modal Header */}
        <div className="px-6 md:px-8 py-5 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-20 rounded-t-3xl">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight italic-none">
            Xóa hồ sơ bác sĩ
          </h2>
        </div>

        {/* Content Area */}
        <div className="px-6 md:px-8 pb-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 text-left bg-white dark:bg-slate-900">
          <div className="pt-6 space-y-4">
            <p className="text-[15px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic-none">
              Hành động này sẽ xóa vĩnh viễn hồ sơ và tài khoản truy cập của bác sĩ khỏi hệ thống. Bệnh nhân phụ trách sẽ cần được phân công lại.
            </p>
          </div>

          <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-6">
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-slate-600 dark:text-slate-400 italic-none">
                Để xác nhận, vui lòng nhập <span className="font-bold text-slate-900 dark:text-slate-200">"{doctorData.name}"</span>
              </label>
              <input
                type="text"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                autoComplete="off"
                className="w-full h-11 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[14px] font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all font-display"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-medium text-slate-600 dark:text-slate-400 italic-none">
                Để xác nhận, vui lòng nhập <span className="font-bold text-slate-900 dark:text-slate-200">"{targetPhrase}"</span>
              </label>
              <input
                type="text"
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value)}
                autoComplete="off"
                className="w-full h-11 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[14px] font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all font-display"
              />
            </div>
          </div>

          <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl flex items-center gap-3 font-display">
            <span className="material-symbols-outlined text-red-500 text-[20px]">error</span>
            <p className="text-[13px] font-bold text-red-600 dark:text-red-400 italic-none mb-0">
              Việc xóa hồ sơ của bác sĩ {doctorData.name} không thể hoàn tác.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 md:px-8 py-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between sticky bottom-0 z-20 rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
            type="button"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => onDelete(doctorData.dbId)}
            disabled={isDeleting || !isConfirmed}
            className={`px-8 py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-md flex items-center gap-2 ${isConfirmed
                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700 shadow-none'
              }`}
            type="button"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Đang xóa...
              </>
            ) : (
              'Xóa hồ sơ bác sĩ'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
