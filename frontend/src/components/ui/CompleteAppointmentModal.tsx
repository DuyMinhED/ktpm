import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CompleteAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (diagnosis: string) => void;
  patientName?: string;
  isLoading?: boolean;
}

const CompleteAppointmentModal: React.FC<CompleteAppointmentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  patientName = 'Bệnh nhân',
  isLoading = false
}) => {
  const [diagnosis, setDiagnosis] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDiagnosis('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleConfirm = () => {
     // Even if empty it is fine, but usually recommended
     onConfirm(diagnosis);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 font-display text-left">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[4px]"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-emerald-500/10 transition-all z-10"
          >
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4 bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-900/10">
              <div className="size-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner shrink-0">
                 <span className="material-symbols-outlined font-bold text-2xl">task_alt</span>
              </div>
              <div>
                <h2 className="text-[20px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Hoàn tất buổi khám</h2>
                <p className="text-[13px] text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                    Bệnh nhân: <span className="text-slate-800 dark:text-slate-200 font-bold">{patientName}</span>
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-7">
               <div className="space-y-5">
                  <div className="space-y-2">
                      <label className="text-[14px] font-bold text-slate-700 dark:text-slate-300 ml-1 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-emerald-500">edit_note</span>
                          Ghi chú chẩn đoán & Kết quả
                      </label>
                      <textarea 
                         autoFocus
                         rows={5}
                         value={diagnosis}
                         onChange={(e) => setDiagnosis(e.target.value)}
                         placeholder="Nhập chẩn đoán sơ bộ, kết luận khám hoặc căn dặn cho bệnh nhân..."
                         className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-[15px] text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all shadow-sm placeholder:text-slate-400 resize-none leading-relaxed"
                      />
                  </div>
                  
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20 flex gap-3">
                      <span className="material-symbols-outlined text-amber-500 text-[20px]">lightbulb</span>
                      <p className="text-[13px] text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                          Sau khi hoàn tất, lịch khám này sẽ được chuyển vào <b>Lịch sử khám bệnh</b> và không thể chỉnh sửa thêm. Chẩn đoán sẽ hiển thị công khai với bệnh nhân.
                      </p>
                  </div>
               </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-6 py-3 text-[14px] font-bold text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-xl transition-all active:scale-95"
                type="button"
              >
                Quay lại
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="px-8 py-3 text-[14px] font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 hover:-translate-y-0.5 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 rounded-xl transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                type="button"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Xác nhận Hoàn tất</span>
                    <span className="material-symbols-outlined font-bold text-[20px]">check</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CompleteAppointmentModal;
