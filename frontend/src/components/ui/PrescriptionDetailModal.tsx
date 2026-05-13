import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface PrescriptionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: any;
}

const PrescriptionDetailModal: React.FC<PrescriptionDetailModalProps> = ({
  isOpen,
  onClose,
  prescription
}) => {
  const [activePrescription, setActivePrescription] = useState<any>(null);

  useEffect(() => {
    if (prescription) {
      setActivePrescription(prescription);
    }
  }, [prescription]);

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

  const getStatusVn = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Đang dùng';
      case 'COMPLETED': return 'Hoàn thành';
      case 'EXPIRED': return 'Hết hạn';
      case 'PENDING_RENEWAL': return 'Chờ cấp lại';
      default: return status;
    }
  };

  // Render modal content
  const renderContent = () => {
    const data = isOpen ? prescription : activePrescription;
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
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[3px]"
              onClick={onClose}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800 transition-all z-10 max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                       <span className="material-symbols-outlined font-bold text-2xl">medication</span>
                    </div>
                    <div>
                      <h2 className="text-[18px] font-bold text-slate-900 dark:text-white tracking-tight">Chi tiết đơn thuốc</h2>
                      <p className="text-[12px] text-slate-500 font-bold mt-0.5">Mã đơn: <span className="text-primary">{data.prescriptionCode}</span></p>
                    </div>
                </div>
                <button onClick={onClose} className="size-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-colors">
                   <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-8 py-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                 {/* Summary Details */}
                 <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                         <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ngày kê đơn</span>
                         <h4 className="text-[14px] font-bold text-slate-900 dark:text-white mt-1">{data.createdDate || 'N/A'}</h4>
                     </div>
                     <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                         <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bác sĩ kê đơn</span>
                         <h4 className="text-[14px] font-bold text-slate-900 dark:text-white mt-1">{data.doctorName || 'Bác sĩ điều trị'}</h4>
                     </div>
                 </div>

                 {/* Diagnosis */}
                 <div className="space-y-2">
                     <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 ml-1">
                         <span className="material-symbols-outlined text-[18px] text-primary">description</span>
                         Chẩn đoán bệnh lý
                     </label>
                     <div className="w-full p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 text-[14px] font-medium text-slate-700 dark:text-slate-300">
                         {data.diagnosis || "Không có thông tin chẩn đoán cụ thể"}
                     </div>
                 </div>

                 {/* Medication Items */}
                 <div className="space-y-3">
                     <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 ml-1">
                         <span className="material-symbols-outlined text-[18px] text-primary">pill</span>
                         Danh sách dược phẩm ({data.items?.length || 0})
                     </label>
                     <div className="space-y-3">
                         {data.items && data.items.length > 0 ? (
                             data.items.map((item: any, index: number) => (
                                 <div key={item.id || index} className="p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex gap-3">
                                     <div className="size-10 rounded-xl bg-emerald-100/50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center shrink-0">
                                         <span className="material-symbols-outlined font-bold text-lg">pill</span>
                                     </div>
                                     <div className="flex-1 min-w-0 text-left">
                                         <div className="flex justify-between items-start gap-2">
                                             <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.medicationName}</h4>
                                             <span className="text-xs font-black bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded shrink-0">{item.dosage}</span>
                                         </div>
                                         {item.usageInstructions && (
                                             <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed italic font-medium">Hướng dẫn: {item.usageInstructions}</p>
                                         )}
                                         {item.frequency && (
                                             <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-medium">
                                                 <span className="material-symbols-outlined text-[14px]">event_repeat</span>
                                                 {item.frequency}
                                             </p>
                                         )}
                                     </div>
                                 </div>
                             ))
                         ) : (
                             <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                 <p className="text-sm text-slate-400 italic">Không tìm thấy thông tin chi tiết dược phẩm</p>
                             </div>
                         )}
                     </div>
                 </div>
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between mt-auto shrink-0">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    data.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                    data.status === 'PENDING_RENEWAL' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    data.status === 'EXPIRED' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 
                    'bg-primary/10 text-primary'
                }`}>
                    {getStatusVn(data.status)}
                </span>
                <button
                  onClick={onClose}
                  className="px-8 py-2.5 text-sm font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl shadow-lg transition-all active:scale-95 hover:opacity-90"
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

export default PrescriptionDetailModal;
