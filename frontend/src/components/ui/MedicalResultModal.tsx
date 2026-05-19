import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface MedicalResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: any;
}

const MedicalResultModal: React.FC<MedicalResultModalProps> = ({
  isOpen,
  onClose,
  appointment
}) => {
  const [activeAppointment, setActiveAppointment] = useState<any>(null);

  useEffect(() => {
    if (appointment) {
      setActiveAppointment(appointment);
    }
  }, [appointment]);
  
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderContent = () => {
    const data = isOpen ? appointment : activeAppointment;
    if (!data) return null;

    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 font-display text-left">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px]"
              onClick={onClose}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 transition-all z-10"
            >
              {/* Modal Header */}
              <div className="px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20">
                <div className="flex items-center gap-4 text-left">
                    <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                       <span className="material-symbols-outlined font-bold text-2xl">description</span>
                    </div>
                    <div className="text-left">
                      <h2 className="text-[18px] font-bold text-slate-900 dark:text-white tracking-tight">Kết quả khám bệnh</h2>
                      <p className="text-[12px] text-slate-500 font-medium mt-0.5">{formatDate(data.appointmentTime)}</p>
                    </div>
                </div>
                <button onClick={onClose} className="size-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-colors">
                   <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 md:px-8 pt-6 pb-8 overflow-y-auto custom-scrollbar text-left flex-1 bg-white dark:bg-slate-900/50 space-y-6">
                 {/* Doctor Info Card */}
                 <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                     <div className="size-12 rounded-full overflow-hidden ring-2 ring-white dark:ring-slate-700 shadow-sm">
                          <img src={data.doctorAvatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(data.doctorName || 'Dr')} className="size-full object-cover" />
                     </div>
                     <div className="text-left">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Bác sĩ phụ trách</p>
                          <h4 className="text-[15px] font-bold text-slate-900 dark:text-white">{data.doctorName}</h4>
                     </div>
                 </div>

                 {/* Main Content */}
                 <div className="space-y-2 text-left">
                     <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 ml-1 flex items-center gap-2">
                         <span className="material-symbols-outlined text-[18px] text-primary">medical_information</span>
                         Chẩn đoán & Căn dặn
                     </label>
                     <div className="w-full min-h-[120px] p-5 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300 shadow-inner whitespace-pre-wrap">
                         {data.diagnosisSummary || "Bác sĩ chưa cập nhật chẩn đoán chi tiết cho buổi khám này."}
                     </div>
                 </div>

                 {/* Type & Location */}
                 <div className="grid grid-cols-2 gap-4 text-left">
                     <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Hình thức</span>
                          <div className="flex items-center gap-1.5 mt-1">
                              <span className="material-symbols-outlined text-[18px] text-blue-500">{data.appointmentType === 'ONLINE' ? 'video_call' : 'location_on'}</span>
                              <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200">{data.appointmentType === 'ONLINE' ? 'Trực tuyến' : 'Tại phòng khám'}</span>
                          </div>
                     </div>
                     <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Trạng thái</span>
                          <div className="flex items-center gap-1.5 mt-1">
                              <span className="material-symbols-outlined text-[18px] text-emerald-500">check_circle</span>
                              <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200">Đã hoàn tất</span>
                          </div>
                     </div>
                 </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 md:px-8 py-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end rounded-b-3xl">
                <button
                  onClick={onClose}
                  className="px-8 py-2.5 text-sm font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl shadow-lg transition-all active:scale-95"
                  type="button"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  };

  return createPortal(
    renderContent(),
    document.body
  );
};

export default MedicalResultModal;
