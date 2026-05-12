import { useState, useEffect } from 'react';
import TopBar from '../components/common/TopBar';
import RescheduleModal from '../features/patient/components/RescheduleModal';
import Toast from '../components/ui/Toast';
import { doctorApi } from '../api/doctor';
import DoctorSidebar from '../components/common/DoctorSidebar';
import ConfirmActionModal from '../components/ui/ConfirmActionModal';
import BatchRescheduleModal from '../features/patient/components/BatchRescheduleModal';

export default function DoctorAppointments() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [patients, setPatients] = useState<any[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
    const [selectedTime, setSelectedTime] = useState<string>('09:00');
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState({ show: false, title: '', type: 'success' as 'success' | 'warning' | 'error' });
    const [activeView, setActiveView] = useState<'month' | 'week' | 'day'>('month');
    const [prefilledPatientId, setPrefilledPatientId] = useState<string | undefined>(undefined);
    const [reschedulingAppointmentId, setReschedulingAppointmentId] = useState<number | null>(null);
    const [prefilledMeetingLink, setPrefilledMeetingLink] = useState<string | undefined>(undefined);
    const [confirmModal, setConfirmModal] = useState<{ show: boolean; appointmentId?: number }>({ show: false });
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

    const handleSaveReschedule = async (appointmentData: any) => {
        setIsSaving(true);
        try {
            let res;
            let successMsg = '';
            if (reschedulingAppointmentId) {
                res = await doctorApi.rescheduleAppointment(reschedulingAppointmentId, appointmentData);
                successMsg = 'Dời lịch thành công!';
            } else {
                res = await doctorApi.createAppointment(appointmentData);
                successMsg = 'Đặt lịch thành công!';
            }

            if (res.success) {
                setIsRescheduleModalOpen(false);
                setReschedulingAppointmentId(null); // clear state
                setToast({ show: true, title: successMsg, type: 'success' });
                loadAppointments();
            }
        } catch (e) {
            console.error(e);
            setToast({ show: true, title: 'Có lỗi xảy ra khi thực hiện thao tác', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        try {
            const res = await doctorApi.getAllAppointments();
            setAppointments(res.data || []);

            const pRes = await doctorApi.getMyPatients({ size: 100 });
            setPatients(pRes.data?.content || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const updateStatus = async (id: number, status: string, meetingLink?: string) => {
        if (isUpdatingStatus) return; // Guard duplicate click
        setIsUpdatingStatus(true);
        try {
            await doctorApi.updateAppointmentStatus(id, status, meetingLink);
            setToast({ show: true, title: 'Cập nhật thành công', type: 'success' });
            await loadAppointments();
        } catch (error) {
            console.error(error);
            setToast({ show: true, title: 'Lỗi khi cập nhật', type: 'error' });
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const formatTime = (dateStr: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };



    // Create a helper for filtering active appointments only
    const activeAppointments = appointments.filter(a => a.status !== 'CANCELLED');

    const todayActiveCount = activeAppointments.filter(a => {
        const d = new Date(a.appointmentTime);
        const today = new Date();
        return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    }).length;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Chào buổi sáng';
        if (hour < 18) return 'Chào buổi chiều';
        return 'Chào buổi tối';
    };

    const doctorName = localStorage.getItem('userName') || 'Bác sĩ';
    const formattedName = doctorName.includes('Bác sĩ') ? doctorName : `BS. ${doctorName}`;

    // Filter for current selected day visually
    const agendaAppointments = activeAppointments.filter(a => {
        const d = new Date(a.appointmentTime);
        return d.getDate() === selectedDay && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const renderCalendar = () => {
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0: Sunday, 1: Monday...
        const offset = firstDay;

        const days = [];
        // Add empty cells for offset
        for (let i = 0; i < offset; i++) {
            days.push(<div key={`empty-${i}`} className="bg-white dark:bg-slate-800 min-h-[100px] p-2 opacity-50"></div>);
        }

        // Add actual days
        for (let d = 1; d <= daysInMonth; d++) {
            const dayAppointments = activeAppointments.filter(a => {
                const date = new Date(a.appointmentTime);
                return date.getDate() === d && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            });

            const isSelected = selectedDay === d;

            days.push(
                <div
                    key={d}
                    onClick={() => setSelectedDay(d)}
                    className={`bg-white dark:bg-slate-800 min-h-[100px] p-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer ${isSelected ? 'ring-2 ring-inset ring-primary bg-primary/5 dark:bg-primary/10' : ''}`}
                >
                    <span className={`text-sm font-medium ${isSelected ? 'text-primary font-bold underline underline-offset-4 decoration-2' : ''}`}>{d}</span>
                    <div className="mt-2 space-y-1">
                        {dayAppointments.slice(0, 2).map((appt, idx) => {
                            const isOnline = appt.appointmentType === 'ONLINE';
                            const bgColorClass = isOnline ? 'bg-primary/20 dark:bg-primary/30 text-primary-dark border-primary' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-500';
                            return (
                                <div key={idx} className={`text-[10px] p-1 rounded border-l-2 truncate ${bgColorClass}`} title={appt.patientName}>
                                    {formatTime(appt.appointmentTime)} - {appt.patientName}
                                </div>
                            );
                        })}
                        {dayAppointments.length > 2 && (
                            <div className="text-[10px] p-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded border-l-2 border-slate-400 truncate">
                                +{dayAppointments.length - 2} khác
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="flex min-h-screen font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
            {/* Sidebar Navigation */}
            <DoctorSidebar isSidebarOpen={isSidebarOpen} />

            {/* Main Content Area */}
            <main className="flex-1 lg:ml-72 min-h-screen flex flex-col transition-all duration-300">
                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[140] lg:hidden animate-in fade-in duration-300"
                        onClick={() => setIsSidebarOpen(false)}
                    ></div>
                )}
                {/* Top Bar */}
                <TopBar
                    setIsSidebarOpen={setIsSidebarOpen}
                    notifications={notifications}
                    setNotifications={setNotifications}
                />

                <div className="p-8 space-y-8">

                    {/* Title & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-[22px] font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Lịch
                                hẹn khám</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">{getGreeting()}, {formattedName}. Bạn có {todayActiveCount} lịch hẹn trong hôm nay.</p>

                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsRescheduleModalOpen(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-slate-900 font-bold text-sm rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined text-lg">add_circle</span>
                                <span>Thêm lịch hẹn mới</span>
                            </button>
                        </div>
                    </div>
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div
                            className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tổng lịch hẹn hôm nay
                                </p>
                                <div
                                    className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined text-3xl">event_available</span>
                                </div>
                            </div>
                            <div className="flex items-end justify-between">
                                <span className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{todayActiveCount}</span>
                                <span className="text-xs font-bold text-primary flex items-center gap-0.5">
                                    <span className="material-symbols-outlined text-xs">trending_up</span>
                                    +5%
                                </span>
                            </div>
                        </div>
                        <div
                            className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Khám trực tiếp</p>
                                <div
                                    className="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <span className="material-symbols-outlined text-3xl">person_search</span>
                                </div>
                            </div>
                            <div className="flex items-end justify-between">
                                <span className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                    {activeAppointments.filter(a => a.appointmentType === 'ONSITE').length}
                                </span>
                                <span className="text-xs font-bold text-primary flex items-center gap-0.5">
                                    <span className="material-symbols-outlined text-xs">trending_up</span>
                                    +2%
                                </span>
                            </div>
                        </div>
                        <div
                            className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tư vấn trực tuyến</p>
                                <div
                                    className="size-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                    <span className="material-symbols-outlined text-3xl">video_camera_front</span>
                                </div>
                            </div>
                            <div className="flex items-end justify-between">
                                <span className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                    {activeAppointments.filter(a => a.appointmentType === 'ONLINE').length}
                                </span>
                                <span className="text-xs font-bold text-red-500 flex items-center gap-0.5">
                                    <span className="material-symbols-outlined text-xs">trending_down</span>
                                    -1%
                                </span>
                            </div>
                        </div>
                        <div
                            className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Đang chờ xác nhận</p>
                                <div
                                    className="size-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                                    <span className="material-symbols-outlined text-3xl">hourglass_empty</span>
                                </div>
                            </div>
                            <div className="flex items-end justify-between">
                                <span className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                    {activeAppointments.filter(a => a.status === 'PENDING').length}
                                </span>
                                <span className="text-xs font-bold text-slate-400 flex items-center gap-0.5">
                                    <span className="material-symbols-outlined text-xs">horizontal_rule</span>
                                    0%
                                </span>
                            </div>
                        </div>
                    </div>
                    {/* Main Dashboard Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Calendar Section */}
                        <div className="lg:col-span-8 space-y-4">
                            <div
                                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                                <div
                                    className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-lg font-bold">Tháng {currentMonth + 1}, {currentYear}</h3>
                                        <div
                                            className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                            <button
                                                onClick={() => {
                                                    if (currentMonth === 0) {
                                                        setCurrentMonth(11);
                                                        setCurrentYear(currentYear - 1);
                                                    } else {
                                                        setCurrentMonth(currentMonth - 1);
                                                    }
                                                }}
                                                className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-r border-slate-200 dark:border-slate-700">
                                                <span
                                                    className="material-symbols-outlined text-lg leading-none">chevron_left</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (currentMonth === 11) {
                                                        setCurrentMonth(0);
                                                        setCurrentYear(currentYear + 1);
                                                    } else {
                                                        setCurrentMonth(currentMonth + 1);
                                                    }
                                                }}
                                                className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                                <span
                                                    className="material-symbols-outlined text-lg leading-none">chevron_right</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                                        <button
                                            onClick={() => setActiveView('month')}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeView === 'month' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                                            Tháng
                                        </button>
                                        <button
                                            onClick={() => setActiveView('week')}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeView === 'week' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                                            Tuần
                                        </button>
                                        <button
                                            onClick={() => setActiveView('day')}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeView === 'day' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                                            Ngày
                                        </button>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div
                                        className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                        {/* Weekdays */}
                                        <div
                                            className="bg-slate-50 dark:bg-slate-800 p-2 text-center text-xs font-bold text-slate-400">
                                            CN</div>
                                        <div
                                            className="bg-slate-50 dark:bg-slate-800 p-2 text-center text-xs font-bold text-slate-400">
                                            T2</div>
                                        <div
                                            className="bg-slate-50 dark:bg-slate-800 p-2 text-center text-xs font-bold text-slate-400">
                                            T3</div>
                                        <div
                                            className="bg-slate-50 dark:bg-slate-800 p-2 text-center text-xs font-bold text-slate-400">
                                            T4</div>
                                        <div
                                            className="bg-slate-50 dark:bg-slate-800 p-2 text-center text-xs font-bold text-slate-400">
                                            T5</div>
                                        <div
                                            className="bg-slate-50 dark:bg-slate-800 p-2 text-center text-xs font-bold text-slate-400">
                                            T6</div>
                                        <div
                                            className="bg-slate-50 dark:bg-slate-800 p-2 text-center text-xs font-bold text-slate-400">
                                            T7</div>
                                        {/* Calendar Days (Dynamic render) */}
                                        {renderCalendar()}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Agenda Section */}
                        <div className="lg:col-span-4 space-y-6">
                            <div
                                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Quản lý lịch hẹn</h3>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5 max-h-[600px]">
                                    {loading ? (
                                        <div className="text-center text-slate-500 text-sm py-8">Đang tải...</div>
                                    ) : (
                                        <>
                                            {/* 1. Pending queue at the top */}
                                            {activeAppointments.filter(a => a.status === 'PENDING').length > 0 && (
                                                <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                                                    <div className="flex items-center gap-2 mb-1 px-1">
                                                        <span className="material-symbols-outlined text-[18px] text-amber-500 filled">notifications_active</span>
                                                        <h4 className="text-[13px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-500">Yêu cầu chờ duyệt ({activeAppointments.filter(a => a.status === 'PENDING').length})</h4>
                                                    </div>
                                                    {activeAppointments.filter(a => a.status === 'PENDING').map(appt => (
                                                        <div key={`pending-${appt.id}`} className="group p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border-l-4 border-amber-400 transition-all shadow-sm hover:shadow-md">
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="size-10 rounded-full overflow-hidden bg-amber-100 ring-2 ring-white dark:ring-slate-800">
                                                                        <img className="size-full object-cover"
                                                                            src={appt.patientAvatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(appt.patientName)} />
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-[15px] font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                                                                            {appt.patientName}</h4>
                                                                        <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                                                                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                                                            {new Date(appt.appointmentTime).toLocaleDateString('vi-VN')}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <span className="text-[13px] font-bold px-3 py-1 bg-white dark:bg-slate-800 shadow-sm rounded-lg text-amber-600">{formatTime(appt.appointmentTime)}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-amber-200/30">
                                                                <div className="flex items-center gap-1 text-[12px] font-medium text-slate-600 bg-white/60 dark:bg-slate-800 px-2 py-1 rounded-md shadow-sm">
                                                                    <span className="material-symbols-outlined text-[14px]">{appt.appointmentType === 'ONLINE' ? 'video_call' : 'location_on'}</span>
                                                                    {appt.appointmentType === 'ONLINE' ? 'Online' : 'Trực tiếp'}
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button 
                                                                        onClick={() => setConfirmModal({ show: true, appointmentId: appt.id })} 
                                                                        disabled={isUpdatingStatus}
                                                                        className="px-3 py-1.5 flex items-center gap-1 bg-red-50 dark:bg-red-900/20 text-red-600 text-[12px] font-bold rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                                                                        Từ chối
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => {
                                                                            let link = undefined;
                                                                            if (appt.appointmentType === 'ONLINE') {
                                                                                const inp = window.prompt("Nhập Link Google Meet/Zoom cho buổi khám này (Để trống nếu dùng link tự động):", appt.meetingLink || "");
                                                                                if (inp === null) return; 
                                                                                link = inp;
                                                                            }
                                                                            updateStatus(appt.id, 'SCHEDULED', link);
                                                                        }}
                                                                        disabled={isUpdatingStatus}
                                                                        className="px-3 py-1.5 flex items-center gap-1 bg-emerald-500 text-white text-[12px] font-bold rounded-lg hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition-all active:scale-95">
                                                                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                                                        Duyệt
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {activeAppointments.filter(a => a.status === 'PENDING').length > 0 && (
                                                <hr className="border-slate-100 dark:border-slate-700 opacity-50 my-4" />
                                            )}

                                            {/* 2. Specific schedule queue */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between px-1 mb-2">
                                                    <h4 className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Lịch trình {selectedDay}/{currentMonth + 1}</h4>
                                                    {agendaAppointments.length > 0 && <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">{agendaAppointments.length} ca</span>}
                                                </div>

                                                {agendaAppointments.length === 0 ? (
                                                    <div className="text-center text-slate-400 text-xs font-medium bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">Không có ca khám trong ngày</div>
                                                ) : agendaAppointments.map(appt => {
                                                    const isOnline = appt.appointmentType === 'ONLINE';
                                                    const isPending = appt.status === 'PENDING';
                                                    const borderClass = isPending ? 'border-slate-300 dark:border-slate-600 opacity-70' : (isOnline ? 'border-primary' : 'border-blue-500');
                                                    const timeClass = isPending ? 'text-slate-400' : (isOnline ? 'bg-primary/20 text-slate-900 dark:text-white' : 'bg-blue-100 dark:bg-blue-900/40 text-slate-900 dark:text-white');

                                                    return (
                                                        <div key={appt.id} className={`group p-4 bg-white dark:bg-slate-900 rounded-xl border-l-4 ${borderClass} transition-all hover:shadow-sm border border-slate-100 dark:border-slate-800`}>
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="size-10 rounded-full overflow-hidden bg-slate-200">
                                                                        <img className="size-full object-cover"
                                                                            src={appt.patientAvatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(appt.patientName)} />
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-[15px] font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                                                            {appt.patientName}</h4>
                                                                        <p className="text-[13px] text-slate-500 font-medium">{appt.reason || "Không có lý do"}</p>
                                                                    </div>
                                                                </div>
                                                                <span className={`text-sm font-bold px-3 py-1 rounded-lg ${timeClass}`}>{formatTime(appt.appointmentTime)}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    {isPending ? (
                                                                        <>
                                                                            <span className="material-symbols-outlined text-[18px] text-slate-400">hourglass_top</span>
                                                                            <span className="text-[13px] font-medium text-slate-400">Chờ xác nhận</span>
                                                                        </>
                                                                    ) : isOnline ? (
                                                                        <>
                                                                            <span className="material-symbols-outlined text-[18px] text-primary">video_call</span>
                                                                            <span className="text-[13px] font-medium text-slate-600">Trực tuyến</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <span className="material-symbols-outlined text-[18px] text-blue-500">location_on</span>
                                                                            <span className="text-[13px] font-medium text-slate-600">Tại phòng khám</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <div className="flex gap-1.5">
                                                                    {isPending ? (
                                                                        <>
                                                                            <button 
                                                                                onClick={() => {
                                                                                    let link = undefined;
                                                                                    if (isOnline) {
                                                                                        const inp = window.prompt("Nhập Link Google Meet/Zoom cho buổi khám này (Để trống nếu dùng link tự động):", appt.meetingLink || "");
                                                                                        if (inp === null) return; 
                                                                                        link = inp;
                                                                                    }
                                                                                    updateStatus(appt.id, 'SCHEDULED', link);
                                                                                }} 
                                                                                disabled={isUpdatingStatus}
                                                                                className="size-8 flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full hover:bg-emerald-600 hover:text-white transition-all duration-300 active:scale-90 group/btn">
                                                                                <span className="material-symbols-outlined text-[18px] font-bold">done</span>
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => setConfirmModal({ show: true, appointmentId: appt.id })} 
                                                                                disabled={isUpdatingStatus}
                                                                                className="size-8 flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-full hover:bg-red-500 hover:text-white transition-all duration-300 active:scale-90 group/btn">
                                                                                <span className="material-symbols-outlined text-[18px] font-bold">close</span>
                                                                            </button>
                                                                        </>
                                                                    ) : isOnline ? (
                                                                        <div className="flex items-center gap-1.5">
                                                                            <button 
                                                                                onClick={() => window.open(appt.meetingLink || 'https://meet.google.com/abc-xyz', '_blank')}
                                                                                className="px-4 py-2 bg-primary text-slate-900 text-[12px] font-bold rounded-full shadow-md shadow-primary/20 transition-all active:scale-95 flex items-center gap-1">
                                                                                <span className="material-symbols-outlined text-[16px]">videocam</span>
                                                                                Vào phòng
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => {
                                                                                    setPrefilledPatientId(appt.patientId.toString());
                                                                                    setReschedulingAppointmentId(appt.id);
                                                                                    setPrefilledMeetingLink(appt.meetingLink);
                                                                                    setIsRescheduleModalOpen(true);
                                                                                }}
                                                                                className="size-8 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 rounded-full hover:bg-blue-500 hover:text-white transition-all duration-300 active:scale-90 group/btn">
                                                                                <span className="material-symbols-outlined text-[18px] font-bold">edit_calendar</span>
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => setConfirmModal({ show: true, appointmentId: appt.id })} 
                                                                                disabled={isUpdatingStatus}
                                                                                className="size-8 flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-full hover:bg-red-500 hover:text-white transition-all duration-300 active:scale-90 group/btn">
                                                                                <span className="material-symbols-outlined text-[18px] font-bold">close</span>
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            <button 
                                                                                onClick={() => {
                                                                                    setPrefilledPatientId(appt.patientId.toString());
                                                                                    setReschedulingAppointmentId(appt.id);
                                                                                    setPrefilledMeetingLink(appt.meetingLink);
                                                                                    setIsRescheduleModalOpen(true);
                                                                                }}
                                                                                className="size-8 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 rounded-full hover:bg-blue-500 hover:text-white transition-all duration-300 active:scale-90 group/btn">
                                                                                <span className="material-symbols-outlined text-[18px] font-bold">edit_calendar</span>
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => setConfirmModal({ show: true, appointmentId: appt.id })} 
                                                                                disabled={isUpdatingStatus}
                                                                                className="size-8 flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-full hover:bg-red-500 hover:text-white transition-all duration-300 active:scale-90 group/btn">
                                                                                <span className="material-symbols-outlined text-[18px] font-bold">close</span>
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                    {/* Empty/Add slot */}
                                    <button
                                        onClick={() => {
                                            setPrefilledPatientId(undefined);
                                            setReschedulingAppointmentId(null);
                                            setPrefilledMeetingLink(undefined);
                                            setIsRescheduleModalOpen(true);
                                        }}
                                        className="w-full p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-primary hover:border-primary transition-all">
                                        <span className="material-symbols-outlined">add_circle</span>
                                        <span className="text-sm font-medium">Đặt lịch cho giờ trống tiếp theo</span>
                                    </button>
                                </div>
                                <div
                                    className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl border-t border-slate-100 dark:border-slate-700">
                                    <div className="flex gap-2">
                                        <button className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[12px] rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                                            Dời lịch hàng loạt
                                        </button>
                                        <button className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[12px] rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                                            Xuất file CSV
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            <RescheduleModal
                isOpen={isRescheduleModalOpen}
                onClose={() => { 
                    setIsRescheduleModalOpen(false); 
                    setReschedulingAppointmentId(null); 
                    setPrefilledMeetingLink(undefined); 
                }}
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                currentYear={currentYear}
                setCurrentYear={setCurrentYear}
                selectedDay={selectedDay}
                setSelectedDay={setSelectedDay}
                selectedTime={selectedTime}
                setSelectedTime={setSelectedTime}
                isSaving={isSaving}
                onSave={handleSaveReschedule}
                patients={patients}
                initialPatientId={prefilledPatientId}
                initialMeetingLink={prefilledMeetingLink}
                isRescheduling={!!reschedulingAppointmentId}
            />

            <ConfirmActionModal
                isOpen={confirmModal.show}
                title="Xác nhận hủy lịch"
                description="Xác nhận hủy bỏ lịch hẹn này?"
                confirmText="Đồng ý hủy"
                cancelText="Quay lại"
                variant="danger"
                iconName="cancel"
                onClose={() => setConfirmModal({ show: false })}
                onConfirm={async () => {
                    if (confirmModal.appointmentId) {
                        await updateStatus(confirmModal.appointmentId, 'CANCELLED');
                    }
                    setConfirmModal({ show: false });
                }}
            />

            {toast.show && (
                <Toast
                    show={toast.show}
                    title={toast.title}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}
        </div>
    );
}