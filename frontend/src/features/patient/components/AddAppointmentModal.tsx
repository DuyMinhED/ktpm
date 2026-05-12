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
}

const AddAppointmentModal: React.FC<AddAppointmentModalProps> = ({ isOpen, onClose, onSave, isSaving, doctors = [] }) => {
    const [localDoctors, setLocalDoctors] = useState<any[]>(doctors);
    const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
    
    const [appointmentType, setAppointmentType] = useState('direct');
    const [selectedDateObj, setSelectedDateObj] = useState(new Date(new Date().setDate(new Date().getDate() + 1)));
    const [selectedTime, setSelectedTime] = useState('08:30');
    const [specialty, setSpecialty] = useState('');
    const [reason, setReason] = useState('');

    const specialtyOptions = [
        { label: 'Chọn bác sĩ', value: '' },
        ...localDoctors.map(d => ({ label: `${d.name} - ${d.specialty}`, value: d.id.toString() }))
    ];

    const today = new Date();
    const next7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(today.getDate() + i + 1);
        return d;
    });
    const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (doctors && doctors.length > 0) {
                setLocalDoctors(doctors);
                // Auto-select first doctor if none chosen yet
                if (!specialty) {
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
            {/* Background Overlay (Skeleton/Simulated Background) */}
            <div className="fixed inset-0 z-0 overflow-hidden blur-sm opacity-40 pointer-events-none">
                <div className="p-8 max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                        <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                        <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                        <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                    </div>
                </div>
            </div>

            {/* Modal Backdrop (Matched with Health Metric Backdrop) */}
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Container */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 border border-primary/10 font-display">

                {/* Modal Header */}
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 text-left bg-primary/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Đặt lịch khám mới</h2>
                            <p className="text-slate-500 text-sm mt-1 font-medium">Hoàn thành các bước dưới đây để đặt lịch hẹn</p>
                        </div>
                    </div>
                </div>

                {/* Modal Content (Scrollable) */}
                <div className="p-8 overflow-y-auto custom-scrollbar text-left flex-1 space-y-8">
                    {/* Section: Form Progress (Visual Guide) */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                            <span className="size-6 rounded-full bg-primary text-slate-900 flex items-center justify-center text-xs font-bold">1</span>
                            <span className="text-sm font-bold text-primary">Thông tin khám</span>
                        </div>
                        <div className="h-px w-8 bg-slate-200 dark:bg-slate-800"></div>
                        <div className="flex items-center gap-2 opacity-50">
                            <span className="size-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-bold font-display">2</span>
                            <span className="text-sm font-bold text-slate-400">Xác nhận</span>
                        </div>
                    </div>

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
                                    <span className="text-[10px] font-bold text-center leading-tight dark:text-slate-300">
                                        {dr.name}<br /><span className="text-slate-400 font-normal">{dr.specialty}</span>
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
                                    <span className="font-bold text-sm dark:text-white">Tháng {today.getMonth() + 1}, {today.getFullYear()}</span>
                                    <div className="flex gap-2">
                                        <button className="size-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600">
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button className="size-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600">
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
                                            className={`h-8 rounded-lg text-xs transition-all font-bold ${selectedDateObj.getDate() === d.getDate()
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
                <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-4 items-center justify-end z-10">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-10 py-3 rounded-full text-[16px] font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
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
                        className={`w-full sm:w-auto px-10 py-3 rounded-full text-[16px] font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 ${isSaving || !specialty ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isSaving ? (
                            <div className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
