import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ClinicDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinic: any;
}

const ClinicDetailsModal: React.FC<ClinicDetailsModalProps> = ({
  isOpen,
  onClose,
  clinic,
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

  if (!clinic) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200 dark:border-slate-800"
          >
            {/* Modal Header */}
            <div className="px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20">
              <h2 className="text-[20px] font-medium text-slate-900 dark:text-white leading-tight">Chi tiết phòng khám</h2>
              <span className={`px-4 py-1.5 rounded-xl text-[13px] font-bold shadow-sm ${clinic.status === 'Hoạt động' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                {clinic.status}
              </span>
            </div>

            {/* Content */}
            <div className="px-6 md:px-8 pt-6 pb-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-900/50 text-left">
              <div className="space-y-6">

                {/* Overview Banner */}
                <div className="bg-white dark:bg-slate-900 p-4 lg:p-5 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-6">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-lg flex-shrink-0 bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                    {clinic.image ? (
                      <img src={clinic.image} alt={clinic.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-4xl text-slate-300">home_health</span>
                    )}
                  </div>
                  <div className="flex-1 text-center md:text-left space-y-2">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{clinic.name}</h3>
                    <div className="flex flex-col md:flex-row items-center gap-4 text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px]">location_on</span>
                        <span className="text-[14px]">{clinic.address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <span className="material-symbols-outlined text-[24px]">stethoscope</span>
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-slate-500">Bác sĩ</p>
                      <p className="text-[20px] font-bold text-slate-900 dark:text-white leading-tight">{clinic.doctors}</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <span className="material-symbols-outlined text-[24px]">groups</span>
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-slate-500">Bệnh nhân</p>
                      <p className="text-[20px] font-bold text-slate-900 dark:text-white leading-tight">{clinic.patientCount !== undefined ? clinic.patientCount : '1,240'}</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <span className="material-symbols-outlined text-[24px]">receipt_long</span>
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-slate-500">Lượt khám</p>
                      <p className="text-[20px] font-bold text-slate-900 dark:text-white leading-tight">{clinic.appointmentCount !== undefined ? '+' + clinic.appointmentCount : '+342'}</p>
                    </div>
                  </div>
                </div>

                {/* Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {/* Contact Info Block */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 ml-1">
                      <div className="text-primary/80 dark:text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px]">contact_support</span>
                      </div>
                      <h3 className="font-medium text-slate-500 dark:text-slate-100 text-[15px] italic-none ml-1">Thông tin liên hệ</h3>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 lg:p-5 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0 border border-slate-200 dark:border-slate-700">
                          <span className="material-symbols-outlined text-[20px]">call</span>
                        </div>
                        <div>
                          <p className="text-[12px] font-medium text-slate-500 leading-tight">Số hotline phòng khám</p>
                          <p className="text-[14px] font-medium text-slate-800 dark:text-slate-200">{clinic.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0 border border-slate-200 dark:border-slate-700">
                          <span className="material-symbols-outlined text-[20px]">mail</span>
                        </div>
                        <div>
                          <p className="text-[12px] font-medium text-slate-500 leading-tight">Email đăng nhập</p>
                          <p className="text-[14px] font-medium text-slate-800 dark:text-slate-200">{clinic.adminEmail || 'admin.clinic@vitality.com'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Management Info Block */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 ml-1">
                      <div className="text-primary/80 dark:text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px]">admin_panel_settings</span>
                      </div>
                      <h3 className="font-medium text-slate-500 dark:text-slate-100 text-[15px] italic-none ml-1">Quản lý cơ sở</h3>
                    </div>

                    <div className="bg-primary/5 p-4 lg:p-5 rounded-2xl border border-primary/20 shadow-sm flex items-center gap-4 h-[calc(100%-36px)]">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <span className="material-symbols-outlined text-[24px]">manage_accounts</span>
                      </div>
                      <div>
                        <p className="text-[15px] font-semibold text-slate-900 dark:text-white">{clinic.adminFullName || 'Nguyễn Văn Quản Lý'}</p>
                        <p className="text-[13px] font-medium text-slate-500">Giám đốc phòng khám</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 md:px-8 py-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end rounded-b-3xl">
              <button
                onClick={onClose}
                className="px-8 py-2.5 bg-slate-800 dark:bg-slate-700 text-white text-[14px] font-medium rounded-xl shadow-lg shadow-slate-800/25 hover:bg-slate-700 dark:hover:bg-slate-600 transition-all flex items-center gap-2"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
                <span>Đóng thông tin</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ClinicDetailsModal;
