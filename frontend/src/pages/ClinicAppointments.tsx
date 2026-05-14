import { useState, useEffect } from 'react';
import TopBar from '../components/common/TopBar';
import RescheduleModal from '../features/patient/components/RescheduleModal';
import Toast from '../components/ui/Toast';
import { clinicApi } from '../api/clinic';
import ClinicSidebar from '../components/common/ClinicSidebar';

export default function ClinicAppointments() {
    const currentClinicId = localStorage.getItem('clinicId') || '1';
    const [appointments, setAppointments] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState<number>(1);
    const [selectedTime, setSelectedTime] = useState<string>('09:00');
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState({ show: false, title: '', type: 'success' as 'success' | 'warning' | 'error' });
    const [activeView, setActiveView] = useState<'month' | 'week' | 'day'>('month');
    const [editingAppointment, setEditingAppointment] = useState<any>(null);

    const handleSaveReschedule = async (appointmentData: any) => {
        setIsSaving(true);
        try {
            let res;
            if (editingAppointment) {
                res = await clinicApi.updateAppointment(currentClinicId, editingAppointment.id, appointmentData);
            } else {
                res = await clinicApi.createAppointment(currentClinicId, appointmentData);
            }
            if (res.success) {
                setIsRescheduleModalOpen(false);
                setEditingAppointment(null);
                setToast({ show: true, title: editingAppointment ? 'Cập nhật lịch hẹn thành công!' : 'Đặt lịch thành công!', type: 'success' });
                loadAppointments();
            }
        } catch (e: any) {
            const errorMsg = e.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại!';
            setToast({ show: true, title: errorMsg, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenEdit = (appt: any) => {
        const dateObj = new Date(appt.appointmentTime);
        setCurrentMonth(dateObj.getMonth());
        setCurrentYear(dateObj.getFullYear());
        setSelectedDay(dateObj.getDate());
        
        // Format hours and minutes nicely
        const hh = String(dateObj.getHours()).padStart(2, '0');
        const mm = String(dateObj.getMinutes()).padStart(2, '0');
        setSelectedTime(`${hh}:${mm}`);
        
        setEditingAppointment(appt);
        setIsRescheduleModalOpen(true);
    };

    useEffect(() => {
        loadAppointments();
        loadPatients();
    }, []);

    const loadPatients = async () => {
        try {
            const res = await clinicApi.getPatients(currentClinicId, { size: 100 });
            const mappedPatients = (res.data.content || []).map((p: any) => ({
                id: p.dbId || p.id,
                fullName: p.name || p.fullName,
                patientCode: p.id || p.patientCode,
                doctorId: p.doctorId
            }));
            setPatients(mappedPatients);
        } catch (error) {
            console.error(error);
        }
    };

    const loadAppointments = async () => {
        try {
            const res = await clinicApi.getAppointments(currentClinicId, { size: 100 });
            setAppointments(res.data.content || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: number, status: string) => {
        try {
            await clinicApi.updateAppointmentStatus(currentClinicId, id, status);
            loadAppointments();
            setToast({ show: true, title: 'Cập nhật thành công', type: 'success' });
        } catch (error) {
            console.error(error);
            setToast({ show: true, title: 'Lỗi khi cập nhật', type: 'error' });
        }
    };

    const formatTime = (dateStr: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const handleExportCSV = () => {
        if (agendaAppointments.length === 0) return;

        // Define CSV Headers in Vietnamese
        const headers = ["Thời gian", "Tên bệnh nhân", "Bác sĩ đảm nhiệm", "Hình thức khám", "Lý do khám bệnh", "Trạng thái hiện tại"];
        
        // Convert row data, quoting fields that may contain commas, and converting status keys
        const rows = agendaAppointments.map(appt => {
            const timeVal = formatTime(appt.appointmentTime);
            const patientName = appt.patientName;
            const doctorName = appt.doctorName || "Chưa phân công";
            const typeStr = appt.appointmentType === 'ONLINE' ? 'Trực tuyến' : 'Tại phòng khám';
            
            // Sanitize reason text by replacing interior double quotes and wrapping in quotes
            const rawReason = appt.reason || "Không có lý do";
            const sanitizedReason = `"${rawReason.replace(/"/g, '""')}"`;
            
            const statusStr = appt.status === 'COMPLETED' ? 'Đã hoàn thành' :
                              appt.status === 'CANCELLED' ? 'Đã hủy' :
                              appt.status === 'PENDING' ? 'Chờ xác nhận' : 'Đã lên lịch';
            
            return [timeVal, patientName, doctorName, typeStr, sanitizedReason, statusStr];
        });

        // Combine with a UTF-8 BOM character prefix (\uFEFF) so MS Excel opens Vietnamese characters natively!
        const csvString = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        
        // Execute automatic link injection to download
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const downloadUrl = URL.createObjectURL(blob);
        const downloadAnchor = document.createElement("a");
        const formattedFileDate = `${String(selectedDay).padStart(2, '0')}-${String(currentMonth + 1).padStart(2, '0')}-${currentYear}`;
        
        downloadAnchor.setAttribute("href", downloadUrl);
        downloadAnchor.setAttribute("download", `Lich_trinh_kham_${formattedFileDate}.csv`);
        downloadAnchor.style.visibility = 'hidden';
        
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        document.body.removeChild(downloadAnchor);

        // Revoke to free system memory
        URL.revokeObjectURL(downloadUrl);

        setToast({ show: true, title: 'Đã xuất lịch khám của ngày thành file CSV thành công!', type: 'success' });
    };



    // Filter for current selected day visually
    const agendaAppointments = appointments.filter(a => {
        const d = new Date(a.appointmentTime);
        return d.getDate() === selectedDay && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    return (
        <div className="flex min-h-screen font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
            {/* Sidebar Navigation */}
            <ClinicSidebar isSidebarOpen={isSidebarOpen} />

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
                                <p className="text-slate-500 dark:text-slate-400 mt-1">Phòng khám có {appointments.length} lịch hẹn hôm nay.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setEditingAppointment(null);
                                    setIsRescheduleModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold text-sm rounded-full hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined text-lg">calendar_add_on</span>
                                <span>Thêm lịch hẹn mới</span>
                            </button>
                        </div>
                    </div>
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div
                            className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tổng lịch hẹn
                                </p>
                                <div
                                    className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined text-3xl">event_available</span>
                                </div>
                            </div>
                            <div className="flex items-end justify-between">
                                <span className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{appointments.length}</span>
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
                                    {appointments.filter(a => a.appointmentType === 'IN_PERSON').length}
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
                                    {appointments.filter(a => a.appointmentType === 'ONLINE').length}
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
                                    {appointments.filter(a => a.status === 'PENDING').length}
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
                                        {/* Dynamic Calendar Cells */}
                                        {Array.from({ length: new Date(currentYear, currentMonth, 1).getDay() }).map((_, i) => (
                                            <div key={`empty-${i}`} className="bg-white dark:bg-slate-800 min-h-[100px] p-2 opacity-50"></div>
                                        ))}
                                        
                                        {Array.from({ length: new Date(currentYear, currentMonth + 1, 0).getDate() }).map((_, i) => {
                                            const day = i + 1;
                                            const dayAppointments = appointments.filter(a => {
                                                const d = new Date(a.appointmentTime);
                                                return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                                            });
                                            const isSelected = selectedDay === day;

                                            return (
                                                <div
                                                    key={day}
                                                    onClick={() => setSelectedDay(day)}
                                                    className={`${isSelected ? 'bg-primary/5 dark:bg-primary/10 ring-2 ring-inset ring-primary' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'} min-h-[100px] p-2 transition-colors cursor-pointer relative`}
                                                >
                                                    <span className={`text-sm font-medium ${isSelected ? 'text-primary font-bold underline decoration-2 underline-offset-4' : ''}`}>{day}</span>
                                                    <div className="mt-2 space-y-1 overflow-hidden">
                                                        {dayAppointments.slice(0, 2).map((appt, idx) => {
                                                            const isCalCompleted = appt.status === 'COMPLETED';
                                                            const isCalCancelled = appt.status === 'CANCELLED';
                                                            const cellStyle = isCalCompleted
                                                                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-500 font-semibold'
                                                                : isCalCancelled
                                                                ? 'bg-red-50 dark:bg-red-900/30 text-red-500 border-red-300 opacity-60 line-through'
                                                                : appt.appointmentType === 'ONLINE'
                                                                ? 'bg-primary/20 text-primary-dark border-primary'
                                                                : 'bg-blue-100 text-blue-600 border-blue-500';
                                                            return (
                                                                <div key={idx} className={`text-[10px] p-1 rounded border-l-2 truncate ${cellStyle}`}>
                                                                    {isCalCompleted && '✓ '}{formatTime(appt.appointmentTime)} - {appt.patientName.split(' ').pop()}
                                                                </div>
                                                            );
                                                        })}
                                                        {dayAppointments.length > 2 && (
                                                            <div className="text-[10px] p-1 bg-slate-100 text-slate-600 rounded border-l-2 border-slate-400 truncate">
                                                                +{dayAppointments.length - 2} khác
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
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
                                        <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Lịch trình</h3>
                                        <span className="text-[13px] text-slate-500 font-medium">{String(selectedDay).padStart(2, '0')}/{String(currentMonth + 1).padStart(2, '0')}/{currentYear}</span>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[600px]">
                                    {loading ? (
                                        <div className="text-center text-slate-500 text-sm py-8">Đang tải...</div>
                                    ) : agendaAppointments.length === 0 ? (
                                        <div className="text-center text-slate-500 text-sm py-8">Không có lịch hẹn nào</div>
                                    ) : agendaAppointments.map(appt => {
                                        const isOnline = appt.appointmentType === 'ONLINE';
                                        const isPending = appt.status === 'PENDING';
                                        const isCompleted = appt.status === 'COMPLETED';
                                        const isCancelled = appt.status === 'CANCELLED';

                                        const borderClass = 
                                            isCancelled ? 'border-red-300 dark:border-red-800 opacity-50' :
                                            isCompleted ? 'border-emerald-500 dark:border-emerald-700' :
                                            isPending ? 'border-slate-300 dark:border-slate-600 opacity-70' : 
                                            (isOnline ? 'border-primary' : 'border-blue-500');

                                        const timeClass = 
                                            isCancelled ? 'text-red-500 bg-red-50 dark:bg-red-950/30 line-through' :
                                            isCompleted ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 font-bold' :
                                            isPending ? 'text-slate-400' : 
                                            (isOnline ? 'bg-primary/20 text-slate-900 dark:text-white' : 'bg-blue-100 dark:bg-blue-900/40 text-slate-900 dark:text-white');

                                        return (
                                            <div key={appt.id} className={`group p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border-l-4 ${borderClass} transition-all hover:shadow-md`}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-10 rounded-full overflow-hidden bg-slate-200 shadow-sm shrink-0 border border-slate-100">
                                                            <img className="size-full object-cover"
                                                                alt="Doctor avatar"
                                                                src={appt.doctorAvatarUrl || "https://ui-avatars.com/api/?background=F1F5F9&color=64748B&bold=true&name=" + encodeURIComponent(appt.doctorName || 'BS')} />
                                                        </div>
                                                        <div>
                                                            <h4 className={`text-[15px] font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors ${isCancelled ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                                                                {appt.patientName}</h4>
                                                            <p className="text-[12px] font-bold text-teal-600 dark:text-teal-400">BS. {appt.doctorName || "Chưa phân công"}</p>
                                                            <p className="text-[12px] text-slate-500 font-medium truncate max-w-[150px]" title={appt.reason}>{appt.reason || "Không có lý do"}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-sm font-bold px-3 py-1 rounded-lg ${timeClass}`}>{formatTime(appt.appointmentTime)}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {isCompleted ? (
                                                            <>
                                                                <span className="material-symbols-outlined text-[18px] text-emerald-500">check_circle</span>
                                                                <span className="text-[13px] font-bold text-emerald-600">Đã hoàn thành</span>
                                                            </>
                                                        ) : isCancelled ? (
                                                            <>
                                                                <span className="material-symbols-outlined text-[18px] text-red-500">cancel</span>
                                                                <span className="text-[13px] font-bold text-red-500">Đã hủy</span>
                                                            </>
                                                        ) : isPending ? (
                                                            <>
                                                                <span className="material-symbols-outlined text-[18px] text-slate-400">hourglass_top</span>
                                                                <span className="text-[13px] font-medium text-slate-400">Đang chờ xác nhận</span>
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
                                                    <div className="flex gap-2">
                                                        {isCompleted ? (
                                                            <span className="text-[12px] px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 rounded-full font-bold flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-sm">done_all</span> Xong
                                                            </span>
                                                        ) : isCancelled ? (
                                                            <span className="text-[12px] px-3.5 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-800 rounded-full font-bold flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-sm">block</span> Đã hủy
                                                            </span>
                                                        ) : isPending ? (
                                                            <>
                                                                <button onClick={() => updateStatus(appt.id, 'SCHEDULED')} className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[13px] font-medium rounded-full transition-all outline-none">
                                                                    Xác nhận
                                                                </button>
                                                                <button onClick={() => updateStatus(appt.id, 'CANCELLED')} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                                                                    <span className="material-symbols-outlined text-lg">cancel</span>
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {isOnline && (
                                                                    <button className="px-5 py-2 bg-primary text-slate-900 text-[15px] font-medium rounded-full shadow-lg shadow-primary/20 transition-all">
                                                                        Bắt đầu cuộc gọi
                                                                    </button>
                                                                )}
                                                                <button onClick={() => handleOpenEdit(appt)} className="p-1.5 text-slate-400 hover:text-primary transition-colors" title="Sửa lịch hẹn">
                                                                    <span className="material-symbols-outlined text-lg">edit_calendar</span>
                                                                </button>
                                                                <button onClick={() => updateStatus(appt.id, 'CANCELLED')} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors" title="Hủy lịch hẹn">
                                                                    <span className="material-symbols-outlined text-lg">cancel</span>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {/* Empty/Add slot */}
                                    <button
                                        onClick={() => {
                                            setEditingAppointment(null);
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
                                        <button 
                                            onClick={handleExportCSV}
                                            disabled={agendaAppointments.length === 0}
                                            className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[12px] rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
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
                                                    setEditingAppointment(null);
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
                                                isRescheduling={Boolean(editingAppointment)}
                                                initialPatientId={editingAppointment?.patientId?.toString()}
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