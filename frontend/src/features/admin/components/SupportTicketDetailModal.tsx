import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface SupportTicketDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: any;
  onUpdateStatus: (id: string, status: string, adminNote?: string) => void;
}

const SupportTicketDetailModal: React.FC<SupportTicketDetailModalProps> = ({
  isOpen,
  onClose,
  ticket,
  onUpdateStatus,
}) => {
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const adminName = localStorage.getItem('userName') || 'Hùng Admin';
  const adminAvatar = localStorage.getItem('userAvatar') || `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=3b82f6&color=fff`;

  const handleSendReply = async () => {
    if (!replyMessage.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Move status to "Chờ phản hồi" unless already completed
      let nextStatus = 'Chờ phản hồi';
      if (ticket.status === 'Đã giải quyết' || ticket.status === 'Đã đóng') {
        nextStatus = ticket.status;
      }
      await onUpdateStatus(ticket.id, nextStatus, replyMessage);
      setReplyMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (!ticket) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/20 dark:bg-slate-900/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800 italic-none"
          >
            {/* Modal Header */}
            <div className="px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20 transition-all italic-none">
              <div className="flex items-center">
                <div>
                  <h2 className="text-[20px] font-medium text-slate-900 dark:text-white leading-tight italic-none">
                    Yêu cầu {ticket.id}
                  </h2>
                  <p className="text-[12px] font-medium text-slate-400 italic-none">{ticket.category} • {ticket.priority}</p>
                </div>
              </div>

            </div>

            <div className="px-5 md:px-6 pt-3 pb-5 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-900/50 text-left space-y-4">

              {/* Conversation History */}
              <div className="bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/50 space-y-6 mt-1">
                {/* User Message */}
                <div className="flex gap-3">
                  <img className="w-9 h-9 rounded-xl ring-2 ring-primary/5 shrink-0" src={ticket.avatar} alt={ticket.user} />
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-700 flex-1 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{ticket.user}</span>
                        <span className="text-[11px] text-slate-500 font-bold dark:text-slate-400 mt-1 leading-none">{ticket.clinic || 'Không có phòng khám'}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 italic-none">{ticket.date}</span>
                    </div>
                    <h4 className="text-[14px] font-bold text-slate-800 dark:text-white mb-1">{ticket.subject}</h4>
                    <p className="text-[13.5px] text-slate-600 dark:text-slate-400 font-medium italic-none leading-relaxed">
                      {ticket.message || 'Không có nội dung chi tiết.'}
                    </p>
                  </div>
                </div>

                {ticket.adminNote && (
                  <div className="flex gap-3 flex-row-reverse">
                    <img 
                      className="w-9 h-9 rounded-xl ring-2 ring-primary/5 shrink-0 object-cover" 
                      src={adminAvatar} 
                      alt={adminName} 
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=3b82f6&color=fff`;
                      }}
                    />
                    <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-2xl rounded-tr-none border border-primary/20 flex-1 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-black text-primary uppercase tracking-tighter">{adminName}</span>
                      </div>
                      <p className="text-[13.5px] text-slate-600 dark:text-slate-300 font-medium italic-none leading-relaxed">
                        {ticket.adminNote}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Reply Area */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm space-y-3">
                <textarea
                  rows={2}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Nhập nội dung phản hồi..."
                  className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary transition-all resize-none italic-none"
                ></textarea>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <button className="p-1.5 text-slate-400 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">attach_file</span>
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">image</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold italic-none">
                    * {ticket.status !== 'Đang xử lý' && 'Sẽ tự động chuyển "Chờ phản hồi"'}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 md:px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between rounded-b-3xl italic-none">
              <div className="flex gap-2">
                {(ticket.status === 'Mới' || ticket.status === 'Chờ phản hồi') && (
                  <button
                    onClick={() => onUpdateStatus(ticket.id, 'Đang xử lý')}
                    className="h-10 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-5 rounded-xl font-medium flex items-center justify-center hover:bg-slate-300 transition-all text-[13px]"
                  >
                    Tiếp nhận
                  </button>
                )}
                <button
                  onClick={() => onUpdateStatus(ticket.id, 'Đã giải quyết')}
                  className="h-10 bg-emerald-500 text-white px-5 rounded-xl font-medium flex items-center justify-center hover:bg-emerald-600 transition-all text-[13px]"
                >
                  Giải quyết
                </button>
              </div>

              <button
                onClick={handleSendReply}
                disabled={!replyMessage.trim() || isSubmitting}
                className="h-10 bg-primary text-white px-8 rounded-xl font-medium flex items-center justify-center shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all disabled:opacity-50 text-[13px]"
              >
                {isSubmitting ? 'Đang gửi...' : 'Gửi phản hồi'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default SupportTicketDetailModal;
