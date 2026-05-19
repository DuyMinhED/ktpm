import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Dropdown from '../../../components/ui/Dropdown';
import { patientApi } from '../../../api/patient';

interface AddAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (data: any) => void;
    isSaving?: boolean;
    doctors?: any[];
    preSelectedDoctorId?: number;
}

const AddAppointmentModal: React.FC<AddAppointmentModalProps> = ({ isOpen, onClose, onSave, isSaving, doctors = [], preSelectedDoctorId }) => {
    const [localDoctors, setLocalDoctors] = useState<any[]>(doctors);
    const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);

    const [appointmentType, setAppointmentType] = useState('direct');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1); // Start from tomorrow
        d.setHours(0, 0, 0, 0);
        return d;
    });
    const [selectedDateObj, setSelectedDateObj] = useState(startDate);
    const [selectedTime, setSelectedTime] = useState('08:30');
    const [specialty, setSpecialty] = useState('');
    const [reason, setReason] = useState('');

    const specialtyOptions = [
        { label: 'Chọn bác sĩ', value: '' },
        ...localDoctors.map(d => ({ label: `${d.name} - ${d.specialty}`, value: d.id.toString() }))
    ];

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const isPrevDisabled = startDate.getTime() <= tomorrow.getTime();

    const handlePrevWeek = () => {
        const newStartDate = new Date(startDate);
        newStartDate.setDate(startDate.getDate() - 7);
        newStartDate.setHours(0, 0, 0, 0);

        let finalStartDate = newStartDate;
        if (newStartDate < tomorrow) {
            finalStartDate = tomorrow;
        }
        setStartDate(finalStartDate);
        setSelectedDateObj(finalStartDate);
    };

    const handleNextWeek = () => {
        const newStartDate = new Date(startDate);
        newStartDate.setDate(startDate.getDate() + 7);
        setStartDate(newStartDate);
        setSelectedDateObj(newStartDate);
    };

    const next7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        return d;
    });
    const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (doctors && doctors.length > 0) {
                setLocalDoctors(doctors);
                // Pre-select specific doctor if passed, otherwise default to first
                if (preSelectedDoctorId) {
                    setSpecialty(preSelectedDoctorId.toString());
                } else if (!specialty && doctors.length > 0) {
                    setSpecialty(doctors[0].id.toString());
                }
            } else {
                fetchDoctors();
            }
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, doctors]);

    const fetchDoctors = async () => {
        setIsLoadingDoctors(true);
        try {
            const res = await patientApi.getAvailableDoctors();
            if (res.success && res.data) {
                setLocalDoctors(res.data);
                // Auto-select first doctor if none chosen yet
                if (res.data.length > 0 && !specialty) {
                    setSpecialty(res.data[0].id.toString());
                }
            }
        } catch (error) {
            console.error('Failed to fetch available doctors:', error);
        } finally {
            setIsLoadingDoctors(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 font-display">
            {/* Modal Backdrop */}
            <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] transition-all duration-300" onClick={onClose}></div>

            {/* Modal Container */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in duration-300 border border-slate-200 dark:border-slate-800">

                {/* Modal Header */}
                <div className="px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20 rounded-t-3xl">
                    <h2 className="text-[20px] font-semibold text-slate-800 dark:text-white tracking-tight leading-tight">Đặt lịch khám mới</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors">
                        <span className="material-symbols-outlined font-medium">close</span>
                    </button>
                </div>

                {/* Modal Content (Scrollable) */}
                <div className="px-6 md:px-8 pt-6 pb-8 overflow-y-auto custom-scrollbar text-left flex-1 bg-white dark:bg-slate-900/50 space-y-8">


                    {/* Section: Appointment Type */}
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Hình thức khám</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="relative cursor-pointer group">
                                <input
                                    checked={appointmentType === 'direct'}
                                    onChange={() => setAppointmentType('direct')}
                                    className="peer sr-only" name="appt_type" type="radio"
                                />
                                <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 peer-checked:border-primary peer-checked:bg-primary/5 transition-all group-hover:border-primary/30">
                                    <span className="material-symbols-outlined text-slate-400 peer-checked:text-primary">person_pin_circle</span>
                                    <div className="text-left">
                                        <p className="font-bold text-sm text-slate-900 dark:text-white">Khám trực tiếp</p>
                                        <p className="text-xs text-slate-500">Tại cơ sở y tế</p>
                                    </div>
                                </div>
                            </label>
                            <label className="relative cursor-pointer group">
                                <input
                                    checked={appointmentType === 'online'}
                                    onChange={() => setAppointmentType('online')}
                                    className="peer sr-only" name="appt_type" type="radio"
                                />
                                <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 peer-checked:border-primary peer-checked:bg-primary/5 transition-all group-hover:border-primary/30">
                                    <span className="material-symbols-outlined text-slate-400 peer-checked:text-primary">videocam</span>
                                    <div className="text-left">
                                        <p className="font-bold text-sm text-slate-900 dark:text-white">Tư vấn trực tuyến</p>
                                        <p className="text-xs text-slate-500">Qua Video Call</p>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Section: Doctor Selection */}
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Chọn bác sĩ chuyên khoa</h3>
                        <div className="mb-6">
                            <Dropdown
                                options={specialtyOptions}
                                value={specialty}
                                onChange={setSpecialty}
                            />
                        </div>

                        {/* Doctor Avatars List (Quick Select) */}
                        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                            {isLoadingDoctors ? (
                                <div className="flex gap-4 animate-pulse">
                                    {[1, 2, 3].map(i => <div key={i} className="size-14 rounded-full bg-slate-100 dark:bg-slate-800"></div>)}
                                </div>
                            ) : localDoctors.map(dr => (
                                <div key={dr.id} onClick={() => setSpecialty(dr.id.toString())} className="flex-shrink-0 flex flex-col items-center gap-2 group cursor-pointer">
                                    <div className={`size-14 rounded-full border-2 ${specialty === dr.id.toString() ? 'border-primary' : 'border-transparent group-hover:border-slate-200'} p-0.5 transition-all`}>
                                        <img alt={dr.name} className="rounded-full bg-slate-100 size-full object-cover" src={dr.avatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(dr.name)} />
                                    </div>
                                    <span className="text-[14px] font-bold text-center leading-tight text-slate-800 dark:text-slate-200">
                                        {dr.name}<br /><span className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">{dr.specialty}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section: Date & Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Mini Calendar Placeholder */}
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Ngày khám</h3>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="font-bold text-sm dark:text-white">Tháng {selectedDateObj.getMonth() + 1}, {selectedDateObj.getFullYear()}</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handlePrevWeek}
                                            disabled={isPrevDisabled}
                                            className={`size-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600 ${isPrevDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50'}`}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={handleNextWeek}
                                            className="size-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600 hover:bg-slate-50"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2">
                                    {next7Days.map((d, i) => (
                                        <div key={i}>{dayLabels[d.getDay()]}</div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {next7Days.map(d => (
                                        <button
                                            key={d.getTime()}
                                            onClick={() => setSelectedDateObj(d)}
                                            className={`h-8 rounded-lg text-xs transition-all font-bold ${selectedDateObj.toDateString() === d.toDateString()
                                                ? 'bg-primary text-slate-900'
                                                : 'hover:bg-slate-200 dark:hover:bg-slate-700 dark:text-slate-300'
                                                }`}
                                        >
                                            {d.getDate()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Time Slots */}
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Khung giờ</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {['08:00', '08:30', '09:00', '09:30', '10:00', '14:00', '14:30', '15:00', '15:30'].map(slot => (
                                    <button
                                        key={slot}
                                        onClick={() => setSelectedTime(slot)}
                                        className={`py-2.5 rounded-lg border-2 text-xs font-bold transition-all ${selectedTime === slot
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-primary/30 dark:text-slate-400 hover:text-primary'
                                            }`}
                                    >
                                        {slot}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Section: Reason for visit */}
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Lý do khám / Triệu chứng</h3>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full p-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white font-bold text-sm min-h-[120px] resize-none outline-none shadow-sm transition-all"
                            placeholder="Mô tả tình trạng sức khỏe của bạn hoặc các triệu chứng đang gặp phải..."
                        ></textarea>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 md:px-8 py-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-end rounded-b-3xl z-10">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all"
                        type="button"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={() => onSave?.({
                            appointmentType: appointmentType === 'direct' ? 'IN_PERSON' : 'ONLINE',
                            doctorId: specialty,
                            selectedDate: selectedDateObj,
                            selectedTime,
                            reason
                        })}
                        disabled={isSaving || !specialty}
                        className={`w-full sm:w-auto px-8 py-2.5 bg-primary text-white text-[14px] font-bold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${isSaving || !specialty ? 'cursor-not-allowed' : ''}`}
                    >
                        {isSaving ? (
                            <div className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Đang xử lý...</span>
                            </div>
                        ) : (
                            'Xác nhận đặt lịch'
                        )}
                    </button>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default AddAppointmentModal;
