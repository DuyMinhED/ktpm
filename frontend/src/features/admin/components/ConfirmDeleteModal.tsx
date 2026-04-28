import { motion, AnimatePresence } from 'framer-motion';
import ReactDOM from 'react-dom';
import { useEffect } from 'react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
  isLoading?: boolean;
}

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title, itemName, isLoading }: ConfirmDeleteModalProps) {
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

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
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
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl text-red-500 animate-bounce">warning</span>
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 leading-tight">
                {title}
              </h3>
              
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
                Bạn có chắc chắn muốn xóa <span className="text-red-500 font-bold">"{itemName}"</span>? 
                Hành động này không thể hoàn tác và sẽ xóa sạch dữ liệu liên quan.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 rounded-2xl bg-red-500 text-white font-bold shadow-lg shadow-red-500/30 hover:bg-red-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xl">delete_forever</span>
                      Xác nhận xóa
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
