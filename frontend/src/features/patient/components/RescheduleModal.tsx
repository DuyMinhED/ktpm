import React, { useEffect, useState } from 'react';
import Dropdown from '../../../components/ui/Dropdown';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: number;
  setCurrentMonth: React.Dispatch<React.SetStateAction<number>>;
  currentYear: number;
  setCurrentYear: React.Dispatch<React.SetStateAction<number>>;
  selectedDay: number;
  setSelectedDay: React.Dispatch<React.SetStateAction<number>>;
  selectedTime: string;
  setSelectedTime: React.Dispatch<React.SetStateAction<string>>;
  isSaving: boolean;
  onSave: (appointmentData: any) => Promise<void>;
  patients?: any[];
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  currentMonth,
  setCurrentMonth,
  currentYear,
  setCurrentYear,
  selectedDay,
  setSelectedDay,
  selectedTime,
  setSelectedTime,
  isSaving,
  onSave,
  patients = []
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients.length > 0 ? patients[0].id.toString() : '');
  const [appointmentType, setAppointmentType] = useState('OFFLINE');
  const [notes, setNotes] = useState('');

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-white/20 dark:bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      ></div>

      <div className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] md:max-h-[90vh] animate-in fade-in zoom-in duration-200 border border-primary/10 transition-all mx-2 md:mx-4">
        <div className="px-6 md:px-10 py-5 md:py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10 transition-all">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">Đặt lịch tái khám</h2>
          </div>
        </div>

        <div className="p-6 md:p-10 overflow-y-auto custom-scrollbar text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold border-l-4 border-primary pl-2">Thông tin bệnh nhân</label>
                  <Dropdown 
                    options={patients.map(p => ({
                      label: `${p.fullName} - ID: ${p.patientCode || p.id}`,
                      value: p.id.toString()
                    }))}
                    value={selectedPatientId}
                    onChange={setSelectedPatientId}
                    className="w-full"
                  />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold border-l-4 border-primary pl-2">Chọn ngày khám</label>
                <div className="p-8 border border-slate-100 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-800/20 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <button
                      type="button"
                      onClick={() => {
                        if (currentMonth === 0) {
                          setCurrentMonth(11);
                          setCurrentYear(prev => prev - 1);
                        } else {
                          setCurrentMonth(prev => prev - 1);
                        }
                      }}
                      className="p-2 hover:bg-primary/10 rounded-xl transition-all text-slate-400 hover:text-primary active:scale-90"
                    >
                      <span className="material-symbols-outlined font-bold">chevron_left</span>
                    </button>
                    <span className="text-sm font-bold text-primary px-4">
                      Tháng {currentMonth + 1}, {currentYear}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (currentMonth === 11) {
                          setCurrentMonth(0);
                          setCurrentYear(prev => prev + 1);
                        } else {
                          setCurrentMonth(prev => prev + 1);
                        }
                      }}
                      className="p-2 hover:bg-primary/10 rounded-xl transition-all text-slate-400 hover:text-primary active:scale-90"
                    >
                      <span className="material-symbols-outlined font-bold">chevron_right</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-7 text-center text-xs font-extrabold text-slate-400 mb-2 tracking-wide opacity-60">
                    <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
                  </div>
                  <div className="grid grid-cols-7 gap-3">
                    {[27, 28, 29, 30, 31].map(d => <div key={d} className="text-xs h-10 flex items-center justify-center text-slate-300 font-medium">{d}</div>)}
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSelectedDay(d)}
                        className={`text-xs font-extrabold h-10 flex items-center justify-center rounded-xl transition-all ${selectedDay === d
                          ? 'bg-primary text-slate-900 shadow-xl shadow-primary/20 transform scale-110 z-10'
                          : 'hover:bg-primary/10 hover:text-primary'
                          }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold border-l-4 border-primary pl-2">Hình thức khám bệnh</label>
                <div className="flex gap-4">
                  <label className="flex-1 cursor-pointer group">
                    <input 
                      checked={appointmentType === 'OFFLINE'} 
                      onChange={() => setAppointmentType('OFFLINE')} 
                      className="peer hidden" 
                      name="resched-type" 
                      type="radio" 
                    />
                    <div className="flex flex-col items-center gap-3 px-4 py-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary transition-all hover:border-primary/30">
                      <span className="material-symbols-outlined text-3xl font-light group-hover:scale-110 transition-transform">person_pin_circle</span>
                      <span className="text-[13px] font-extrabold tracking-wide">Trực tiếp</span>
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer group">
                    <input 
                      checked={appointmentType === 'ONLINE'} 
                      onChange={() => setAppointmentType('ONLINE')} 
                      className="peer hidden" 
                      name="resched-type" 
                      type="radio" 
                    />
                    <div className="flex flex-col items-center gap-3 px-4 py-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary transition-all hover:border-primary/30">
                      <span className="material-symbols-outlined text-3xl font-light group-hover:scale-110 transition-transform">videocam</span>
                      <span className="text-[13px] font-extrabold tracking-wide">Online</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold border-l-4 border-primary pl-2">Giờ khám ưu tiên</label>
                <div className="grid grid-cols-4 gap-3">
                  {['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '14:00', '14:30'].map(time => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`py-3 text-xs font-extrabold rounded-xl border-2 transition-all ${selectedTime === time
                        ? 'border-primary bg-primary/5 text-primary scale-105 shadow-sm shadow-primary/10'
                        : 'border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-primary/30'
                        }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold border-l-4 border-primary pl-2">Ghi chú lâm sàng</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm font-medium transition-all shadow-sm outline-none resize-none"
                  placeholder="BS ghi chú thêm dặn dò cho bệnh nhân tại đây..."
                  rows={3}
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <div className="px-10 py-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 sticky bottom-0 z-10 transition-all">
          <button
            onClick={onClose}
            className="px-8 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => onSave({
              patientId: Number(selectedPatientId),
              appointmentDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`,
              appointmentTime: selectedTime,
              type: appointmentType,
              notes: notes
            })}
            disabled={isSaving || !selectedPatientId}
            className="px-10 py-3 text-sm font-medium text-slate-900 bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-xl shadow-primary/20 flex items-center gap-3 active:scale-95 transform disabled:opacity-50 disabled:cursor-wait"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                Đang lưu...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined font-bold">send</span>
                Lưu &amp; Gửi thông báo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;
