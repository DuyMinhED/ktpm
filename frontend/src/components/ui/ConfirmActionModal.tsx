import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  iconName?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'primary' | 'warning';
}

const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  iconName = 'check_circle',
  isLoading = false,
  variant = 'primary'
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

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          button: 'bg-red-500 hover:bg-red-600 shadow-red-500/30',
          border: 'border-red-500/10',
          bg: 'bg-red-50/30 dark:bg-red-900/10',
          iconColor: 'text-red-500'
        };
      case 'warning':
        return {
          button: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30',
          border: 'border-amber-500/10',
          bg: 'bg-amber-50/30 dark:bg-amber-900/10',
          iconColor: 'text-amber-500'
        };
      default:
        return {
          button: 'bg-primary hover:bg-primary/90 shadow-primary/30',
          border: 'border-primary/10',
          bg: 'bg-primary/5 dark:bg-primary/10',
          iconColor: 'text-primary'
        };
    }
  };

  const styles = getVariantStyles();

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
            className={`relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border ${styles.border} transition-all z-10`}
          >
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-20">
              <div>
                <h2 className="text-[20px] font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-6">
              <div className={`p-5 ${styles.bg} rounded-2xl flex gap-4 items-start`}>
                <span className={`material-symbols-outlined text-2xl mt-0.5 ${styles.iconColor}`}>{iconName}</span>
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
                className="px-6 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95"
                type="button"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`px-8 py-2.5 text-sm font-bold text-white ${styles.button} rounded-xl transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 active:scale-95`}
                type="button"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{confirmText}</span>
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

export default ConfirmActionModal;
