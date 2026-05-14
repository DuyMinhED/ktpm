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
  initialPatientId?: string;
  isRescheduling?: boolean;
  initialMeetingLink?: string;
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
  patients: _patients = [],
  initialPatientId,
  isRescheduling,
  initialMeetingLink
}) => {
  const patients = Array.isArray(_patients) ? _patients : [];
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients.length > 0 ? patients[0].id.toString() : '');
  const [appointmentType, setAppointmentType] = useState('IN_PERSON');
  const [notes, setNotes] = useState('');
  const [meetingLink, setMeetingLink] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMeetingLink(initialMeetingLink || '');
    }
  }, [isOpen, initialMeetingLink]);

  useEffect(() => {
    if (isOpen) {
      if (initialPatientId) {
        setSelectedPatientId(initialPatientId);
      } else if (patients.length > 0 && !selectedPatientId) {
        setSelectedPatientId(patients[0].id.toString());
      }
    }
  }, [isOpen, initialPatientId, patients]);

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
          <h2 className="text-[20px] font-medium text-slate-900 dark:text-white">
            {isRescheduling ? 'Cập nhật / Dời lịch hẹn' : 'Đặt lịch tái khám'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors">
            <span className="material-symbols-outlined font-medium">close</span>
          </button>
        </div>

        <div className="p-6 md:p-10 overflow-y-auto custom-scrollbar text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <div className="space-y-6">
              <div className="space-y-2 relative z-20">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  <span className="material-symbols-outlined text-[20px] text-primary">person</span>
                  Thông tin bệnh nhân
                </label>
                <Dropdown
                  options={patients.map(p => ({
                    label: `${p.fullName} - Mã BN: ${p.patientCode || p.id}${!p.doctorId ? ' (⚠️ Chưa gán BS)' : ''}`,
                    value: p.id.toString()
                  }))}
                  value={selectedPatientId}
                  onChange={setSelectedPatientId}
                  className="w-full"
                  disabled={isRescheduling}
                />
                {selectedPatientId && patients.find(p => p.id.toString() === selectedPatientId) && !patients.find(p => p.id.toString() === selectedPatientId).doctorId && (
                  <p className="text-xs text-red-500 font-medium mt-1 pl-2">
                    <span className="material-symbols-outlined text-[14px] align-text-bottom mr-1">warning</span>
                    Bệnh nhân này chưa có BS phụ trách. Vui lòng gán BS trước khi đặt lịch.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  <span className="material-symbols-outlined text-[20px] text-primary">calendar_today</span>
                  Chọn ngày khám
                </label>
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
                  <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 mb-2 tracking-wide opacity-60">
                    <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
                  </div>
                  <div className="grid grid-cols-7 gap-3">
                    {[27, 28, 29, 30, 31].map(d => <div key={d} className="text-xs h-10 flex items-center justify-center text-slate-300 font-medium">{d}</div>)}
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSelectedDay(d)}
                        className={`text-xs font-bold h-10 flex items-center justify-center rounded-xl transition-all ${selectedDay === d
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
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  <span className="material-symbols-outlined text-[20px] text-primary">medical_services</span>
                  Hình thức khám bệnh
                </label>
                <div className="flex gap-4">
                  <label className="flex-1 cursor-pointer group">
                    <input
                      checked={appointmentType === 'IN_PERSON'}
                      onChange={() => setAppointmentType('IN_PERSON')}
                      className="peer hidden"
                      name="resched-type"
                      type="radio"
                    />
                    <div className="flex flex-col items-center gap-3 px-4 py-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary transition-all hover:border-primary/30">
                      <span className="material-symbols-outlined text-3xl font-light group-hover:scale-110 transition-transform">person_pin_circle</span>
                      <span className="text-[13px] font-bold tracking-wide">Trực tiếp</span>
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
                      <span className="text-[13px] font-bold tracking-wide">Online</span>
                    </div>
                  </label>
                </div>
              </div>

              {appointmentType === 'ONLINE' && (
                <div className="space-y-3 animate-in slide-in-from-top-1 duration-200">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                    <span className="material-symbols-outlined text-[20px] text-primary">link</span>
                    Link họp Trực tuyến
                  </label>
                  <input
                    type="text"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm font-medium transition-all shadow-sm outline-none"
                    placeholder="Dán link Google Meet"
                  />
                </div>
              )}

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  <span className="material-symbols-outlined text-[20px] text-primary">schedule</span>
                  Giờ khám ưu tiên
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '14:00', '14:30'].map(time => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`py-3 text-xs font-bold rounded-xl border-2 transition-all ${selectedTime === time
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
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  <span className="material-symbols-outlined text-[20px] text-primary">edit_note</span>
                  Ghi chú lâm sàng
                </label>
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
            className="px-8 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => onSave({
              patientId: Number(selectedPatientId),
              appointmentDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`,
              appointmentTime: selectedTime,
              type: appointmentType,
              notes: notes,
              meetingLink: appointmentType === 'ONLINE' ? meetingLink : undefined
            })}
            disabled={Boolean(isSaving || !selectedPatientId)}
            className="px-10 py-3 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-xl shadow-primary/20 flex items-center gap-3 active:scale-95 transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {isRescheduling ? 'Đang cập nhật...' : 'Đang đặt lịch...'}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined font-bold">send</span>
                {isRescheduling ? 'Xác nhận cập nhật' : 'Xác nhận đặt lịch'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;
