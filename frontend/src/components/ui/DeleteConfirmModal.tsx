import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isLoading?: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isLoading = false
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 font-display text-left">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-white/20 dark:bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-red-500/10 transition-all z-10"
      >

        {/* Modal Header */}
        <div className="px-8 py-5 border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-20">
          <div>
            <h2 className="text-[20px] font-medium text-slate-900 dark:text-white leading-tight">{title}</h2>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-8 py-6">
          <div className="p-5 bg-red-50/30 dark:bg-red-900/10 rounded-2xl border border-red-500/5">
            <p className="text-[15px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50 sticky bottom-0 z-20">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            type="button"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-8 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-2xl transition-all shadow-xl shadow-red-500/30 flex items-center gap-2 disabled:opacity-50 active:scale-95"
            type="button"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                Xác nhận xóa
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DeleteConfirmModal;
