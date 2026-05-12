import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MeetingLinkPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (link: string) => void;
  initialLink?: string;
  isLoading?: boolean;
}

const MeetingLinkPromptModal: React.FC<MeetingLinkPromptModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialLink = '',
  isLoading = false
}) => {
  const [link, setLink] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLink(initialLink);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialLink]);

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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-primary/10 transition-all z-10"
          >
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-20">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined font-bold">videocam</span>
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-slate-900 dark:text-white tracking-tight">Liên kết trực tuyến</h2>
                <p className="text-[12px] text-slate-500 font-medium mt-0.5">Dán link Google Meet</p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-6">
              <div className="space-y-4">
                <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 ml-1">Nhập link buổi khám</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">link</span>
                  </span>
                  <input
                    type="text"
                    autoFocus
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-[14px] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all shadow-sm placeholder:text-slate-400"
                  />
                </div>
                <p className="text-[12px] text-slate-400 italic ml-1 flex gap-1.5 items-center">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  Để trống nếu bạn muốn sử dụng link tự động mặc định.
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
                Hủy bỏ
              </button>
              <button
                onClick={() => onConfirm(link)}
                disabled={isLoading}
                className="px-8 py-2.5 text-sm font-bold text-slate-900 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                type="button"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Duyệt lịch</span>
                    <span className="material-symbols-outlined font-bold text-[18px]">check_circle</span>
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

export default MeetingLinkPromptModal;
