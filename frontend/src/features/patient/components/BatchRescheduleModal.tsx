import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BatchRescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (sourceDate: string, targetDate: string) => Promise<void>;
  isSaving: boolean;
  appointments: any[];
}

const BatchRescheduleModal: React.FC<BatchRescheduleModalProps> = ({
  isOpen, onClose, onConfirm, isSaving, appointments
}) => {
  const [sourceDate, setSourceDate] = useState('');
  const [targetDate, setTargetDate] = useState('');

  // Count appointments on source date
  const affectedCount = useMemo(() => {
    if (!sourceDate) return 0;
    return appointments.filter(a => {
      const d = new Date(a.appointmentTime);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return dateStr === sourceDate && (a.status === 'PENDING' || a.status === 'SCHEDULED');
    }).length;
  }, [sourceDate, appointments]);

  const affectedAppointments = useMemo(() => {
    if (!sourceDate) return [];
    return appointments.filter(a => {
      const d = new Date(a.appointmentTime);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return dateStr === sourceDate && (a.status === 'PENDING' || a.status === 'SCHEDULED');
    });
  }, [sourceDate, appointments]);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  };

  // Get today as min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 font-display text-left">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[3px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-primary/10 z-10"
          >
            {/* Header */}
            <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95">
              <h2 className="text-[20px] font-bold text-slate-900 dark:text-white tracking-tight">Dời lịch hàng loạt</h2>
              <p className="text-sm text-slate-500 mt-1">Dời toàn bộ lịch hẹn từ một ngày sang ngày khác</p>
            </div>

            {/* Body */}
            <div className="px-8 py-6 space-y-5">
              {/* Source Date */}
              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                  📅 Ngày cần dời (nguồn)
                </label>
                <input
                  type="date"
                  value={sourceDate}
                  onChange={e => setSourceDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                />
                {sourceDate && (
                  <p className="text-xs mt-2 font-medium text-slate-500">
                    {formatDisplayDate(sourceDate)}
                  </p>
                )}
              </div>

              {/* Affected appointments preview */}
              {sourceDate && (
                <div className={`p-4 rounded-2xl border ${affectedCount > 0 ? 'bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-800/30' : 'bg-slate-50 border-slate-100 dark:bg-slate-800/30 dark:border-slate-700'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`material-symbols-outlined text-lg ${affectedCount > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                      {affectedCount > 0 ? 'event_note' : 'event_busy'}
                    </span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {affectedCount > 0 ? `${affectedCount} lịch hẹn sẽ bị ảnh hưởng` : 'Không có lịch hẹn nào vào ngày này'}
                    </span>
                  </div>
                  {affectedCount > 0 && (
                    <div className="space-y-1.5 mt-3 max-h-32 overflow-y-auto">
                      {affectedAppointments.map(a => (
                        <div key={a.id} className="flex items-center gap-3 text-xs">
                          <span className="font-bold text-amber-600 dark:text-amber-400 w-12">{formatTime(a.appointmentTime)}</span>
                          <span className="text-slate-600 dark:text-slate-400 truncate flex-1">{a.patientName}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${a.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {a.status === 'PENDING' ? 'Chờ duyệt' : 'Đã duyệt'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Target Date */}
              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                  🎯 Ngày muốn dời tới (đích)
                </label>
                <input
                  type="date"
                  value={targetDate}
                  min={today}
                  onChange={e => setTargetDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                />
                {targetDate && (
                  <p className="text-xs mt-2 font-medium text-slate-500">
                    {formatDisplayDate(targetDate)}
                  </p>
                )}
              </div>

              {/* Summary */}
              {sourceDate && targetDate && affectedCount > 0 && sourceDate !== targetDate && (
                <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    <span className="font-bold text-primary">{affectedCount}</span> lịch hẹn sẽ được dời từ{' '}
                    <span className="font-bold">{formatDisplayDate(sourceDate)}</span> sang{' '}
                    <span className="font-bold">{formatDisplayDate(targetDate)}</span>.
                    Giờ khám giữ nguyên. Hệ thống sẽ tự động thông báo cho tất cả bệnh nhân.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => onConfirm(sourceDate, targetDate)}
                disabled={isSaving || !sourceDate || !targetDate || sourceDate === targetDate || affectedCount === 0}
                className="px-8 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                    Dời {affectedCount} lịch hẹn
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
