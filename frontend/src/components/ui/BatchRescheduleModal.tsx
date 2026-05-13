import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BatchRescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (sourceDate: string, targetDate: string) => Promise<void>;
  initialSourceDate?: string;
  isLoading?: boolean;
}

const BatchRescheduleModal: React.FC<BatchRescheduleModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialSourceDate = '',
  isLoading = false,
}) => {
  const [sourceDate, setSourceDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setSourceDate(initialSourceDate || new Date().toISOString().split('T')[0]);
      setTargetDate('');
      setError('');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialSourceDate]);

  const handleConfirm = async () => {
    if (!sourceDate) {
      setError('Vui lòng chọn ngày nguồn cần dời lịch!');
      return;
    }
    if (!targetDate) {
      setError('Vui lòng chọn ngày đích mới!');
      return;
    }
    if (sourceDate === targetDate) {
      setError('Ngày nguồn và ngày đích không được trùng nhau!');
      return;
    }

    setError('');
    await onConfirm(sourceDate, targetDate);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 font-display text-left">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[3px]"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-primary/10 transition-all z-10"
          >
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined font-bold text-[22px]">sync_alt</span>
                </div>
                <h2 className="text-[20px] font-bold text-slate-900 dark:text-white tracking-tight">Dời lịch hàng loạt</h2>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-6 space-y-5">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                Dời toàn bộ ca khám sang ngày mới và giữ nguyên khung giờ cũ.
              </p>

              <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-slate-400 block">Ngày hiện tại (Nguồn)</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">calendar_today</span>
                    <input 
                      type="date"
                      value={sourceDate}
                      onChange={(e) => setSourceDate(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none text-slate-900 dark:text-white transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined font-bold text-[18px]">south</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-slate-400 block">Ngày chuyển đến (Đích)</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-primary text-[20px]">event_upcoming</span>
                    <input 
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none text-slate-900 dark:text-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl text-center border border-red-100 dark:border-red-900/30">
                  {error}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50 sticky bottom-0 z-20">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-6 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95"
                type="button"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="px-8 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                type="button"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px] font-bold">update</span>
                    <span>Thực hiện dời lịch</span>
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

export default BatchRescheduleModal;
