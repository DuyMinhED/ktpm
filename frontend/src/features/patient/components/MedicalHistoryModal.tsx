import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { doctorApi } from '../../../api/doctor';
import MedicalResultModal from '../../../components/ui/MedicalResultModal';

interface MedicalHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
  patientAvatar?: string;
  patientId?: number;
}

const MedicalHistoryModal: React.FC<MedicalHistoryModalProps> = ({
  isOpen,
  onClose,
  patientName = "Bệnh nhân",
  patientId,
}) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [triggerFilter, setTriggerFilter] = useState(false);

  // Child view modal
  const [selectedResult, setSelectedResult] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (patientId) {
        fetchHistory();
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, patientId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await doctorApi.getPatientDetail(patientId!);
      if (res.success && res.data) {
        const history = res.data.appointmentHistory || [];
        setAppointments(history);
        setFilteredAppointments(history);
      }
    } catch (e) {
      console.error("Failed to fetch history", e);
    } finally {
      setLoading(false);
    }
  };

  // Handle filtering
  const handleApplyFilters = () => {
    let results = [...appointments];

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      results = results.filter(app => 
        (app.doctorName && app.doctorName.toLowerCase().includes(query)) ||
        (app.reason && app.reason.toLowerCase().includes(query)) ||
        (app.diagnosisSummary && app.diagnosisSummary.toLowerCase().includes(query))
      );
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      results = results.filter(app => new Date(app.appointmentTime) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      results = results.filter(app => new Date(app.appointmentTime) <= end);
    }

    setFilteredAppointments(results);
  };

  // Automatically filter when searchTerm resets or date inputs change slightly
  useEffect(() => {
    handleApplyFilters();
  }, [searchTerm, startDate, endDate, appointments]);

  const handleCreateAppointment = () => {
    window.location.href = `/doctor/appointments`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderContent = () => (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 font-display">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Modal Body */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden border border-primary/10 z-10"
          >
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined font-bold">history</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Lịch sử khám bệnh - {patientName}</h2>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[240px] relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                  <input 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/30 outline-none text-slate-900 dark:text-white" 
                    placeholder="Tìm kiếm chẩn đoán, bác sĩ..." 
                    type="text" 
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 font-medium whitespace-nowrap">Khoảng ngày:</span>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                    <input 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-transparent border-none text-xs p-0 focus:ring-0 text-slate-600 dark:text-slate-300 outline-none w-28" 
                      type="date" 
                    />
                    <span className="text-slate-400">→</span>
                    <input 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-transparent border-none text-xs p-0 focus:ring-0 text-slate-600 dark:text-slate-300 outline-none w-28" 
                      type="date" 
                    />
                  </div>
                </div>
                <button 
                  onClick={handleApplyFilters}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm font-bold">filter_list</span>
                  Lọc
                </button>
              </div>

              {/* Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50">
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày khám</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Bác sĩ</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Chẩn đoán</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Hình thức</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">Đang tải lịch sử...</td>
                        </tr>
                      ) : filteredAppointments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">Không tìm thấy lịch sử phù hợp.</td>
                        </tr>
                      ) : (
                        filteredAppointments.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-4 text-sm font-bold text-slate-700 dark:text-slate-300">{formatDate(row.appointmentTime)}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <div className="size-6 rounded-full bg-slate-200 overflow-hidden border border-slate-100 dark:border-slate-700">
                                  <img 
                                    className="w-full h-full object-cover" 
                                    src={row.doctorAvatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(row.doctorName || "DR") + "&background=random"} 
                                    alt="Doctor" 
                                    onError={(e) => e.currentTarget.src = "https://ui-avatars.com/api/?name=DR&background=random"} 
                                  />
                                </div>
                                <span className="text-sm font-medium text-slate-900 dark:text-white">{row.doctorName || "Bác sĩ phụ trách"}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-1" title={row.diagnosisSummary || row.reason}>
                                {row.diagnosisSummary || row.reason || "Chưa có thông tin"}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap ${
                                row.appointmentType === 'ONLINE' 
                                ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                                : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                              }`}>
                                {row.appointmentType === 'ONLINE' ? 'Tư vấn trực tuyến' : 'Tại phòng khám'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => setSelectedResult(row)}
                                  className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors" 
                                  title="Xem chi tiết"
                                >
                                  <span className="material-symbols-outlined text-lg font-bold">visibility</span>
                                </button>
                                <button 
                                  onClick={() => setSelectedResult(row)} // Opening view will allow printing PDF
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" 
                                  title="Xem và Tải PDF"
                                >
                                  <span className="material-symbols-outlined text-lg font-bold">picture_as_pdf</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-xs text-slate-500 font-medium">
                Hiển thị {filteredAppointments.length} trên {appointments.length} lượt khám
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-95"
                >
                  Đóng
                </button>
                <button 
                  onClick={handleCreateAppointment}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-extrabold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                >
                  Tạo lượt khám mới
                </button>
              </div>
            </div>
          </motion.div>

          <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
          `}</style>
        </div>
      )}

      {/* Sub-modal to view individual results */}
      {selectedResult && (
        <MedicalResultModal
          isOpen={!!selectedResult}
          onClose={() => setSelectedResult(null)}
          appointment={selectedResult}
        />
      )}
    </AnimatePresence>
  );

  return createPortal(
    renderContent(),
    document.body
  );
};

export default MedicalHistoryModal;
