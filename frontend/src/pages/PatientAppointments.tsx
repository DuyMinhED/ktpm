import React, { useState, useEffect } from 'react';
import AddAppointmentModal from '../features/patient/components/AddAppointmentModal';
import Toast from '../components/ui/Toast';
import ConfirmActionModal from '../components/ui/ConfirmActionModal';
import { patientApi } from '../api/patient';
import MedicalResultModal from '../components/ui/MedicalResultModal';

const PatientAppointments: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState({ show: false, title: '', type: 'success' as 'success' | 'warning' | 'error' });
    const [doctors, setDoctors] = useState<any[]>([]);
    const [upcoming, setUpcoming] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Cancellation confirmation state
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [selectedCancelId, setSelectedCancelId] = useState<number | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [selectedResult, setSelectedResult] = useState<any>(null);
    const [selectedDoctorId, setSelectedDoctorId] = useState<number | undefined>(undefined);
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const handleToggleReminder = async (id: number, currentStatus: boolean) => {
        try {
            const nextStatus = !currentStatus;
            await patientApi.toggleReminder(id, nextStatus);
            if (nextStatus) {
                setToast({ show: true, title: 'Thiết lập nhắc nhở thành công', type: 'success' });
            }
            // Update localized upcoming state optimistically for instant feedback
            setUpcoming(prev => prev.map(item => item.id === id ? { ...item, reminderEnabled: nextStatus } : item));
        } catch (error) {
            console.error(error);
            setToast({ show: true, title: 'Lỗi khi thiết lập nhắc nhở', type: 'error' });
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [docsRes, upcomingRes, historyRes] = await Promise.all([
                patientApi.getAvailableDoctors(),
                patientApi.getUpcomingAppointments(),
                patientApi.getAppointmentHistory(0, 100)
            ]);
            setDoctors(docsRes.data || []);
            setUpcoming(upcomingRes.data || []);
            setHistory(historyRes.data?.content || []);
        } catch (error) {
            console.error(error);
            setToast({ show: true, title: 'Lỗi tải dữ liệu', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAppointment = async (data: any) => {
        setIsSaving(true);
        try {
            // Build LocalDateTime from selectedDate and selectedTime
            const dateObj = new Date(data.selectedDate);
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            // Assuming time is HH:mm
            const timeStr = data.selectedTime + ':00';
            const appointmentTime = `${year}-${month}-${day}T${timeStr}`;

            await patientApi.createAppointment({
                doctorId: parseInt(data.doctorId),
                appointmentTime,
                appointmentType: data.appointmentType,
                reason: data.reason
            });
            
            setIsModalOpen(false);
            setToast({
                show: true,
                title: 'Đặt lịch thành công!',
                type: 'success'
            });
            loadData();
        } catch (error) {
            console.error(error);
            setToast({ show: true, title: 'Lỗi khi đặt lịch hẹn', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenCancelModal = (id: number) => {
        setSelectedCancelId(id);
        setIsCancelModalOpen(true);
    };

    const confirmCancel = async () => {
        if (!selectedCancelId) return;
        setIsCancelling(true);
        try {
            await patientApi.cancelAppointment(selectedCancelId);
            setToast({ show: true, title: 'Hủy lịch thành công!', type: 'success' });
            setIsCancelModalOpen(false);
            loadData();
        } catch (error) {
            console.error(error);
            setToast({ show: true, title: 'Lỗi khi hủy lịch hẹn', type: 'error' });
        } finally {
            setIsCancelling(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    };

    const formatTime = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const filteredHistory = history.filter(item => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (item.doctorName?.toLowerCase() || "").includes(query) || 
               (item.diagnosisSummary?.toLowerCase() || "").includes(query);
    });

    return (
        <div className="flex flex-col lg:flex-row -m-8 h-[calc(100vh-64px)] overflow-hidden animate-in fade-in duration-700 font-display">
            {/* Main Content Area */}
            <div className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-[26px] font-bold tracking-tight text-slate-900 dark:text-white">Lịch hẹn</h2>
                        <p className="text-slate-500 dark:text-slate-400">Quản lý và theo dõi các buổi khám của bạn</p>
                    </div>
                    <button
                    onClick={() => {
                        setSelectedDoctorId(undefined);
                        setIsModalOpen(true);
                    }}
                    className="px-6 py-3.5 bg-primary hover:bg-primary/90 text-slate-900 font-extrabold rounded-full shadow-lg shadow-primary/30 hover:shadow-primary/50 active:scale-95 transition-all flex items-center gap-2 group text-[15px] tracking-tight"
                >
                        <span className="material-symbols-outlined">add_circle</span>
                        Đặt lịch mới
                    </button>
                </header>

                {/* Upcoming Appointments */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Lịch khám sắp tới</h3>
                        {upcoming.length > 0 && <span className="text-sm text-primary font-medium cursor-pointer hover:underline">Xem tất cả</span>}
                    </div>
                    {loading ? (
                        <div className="text-slate-500">Đang tải...</div>
                    ) : upcoming.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-500">Bạn không có lịch hẹn nào sắp tới</div>
                    ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {upcoming.map((appt) => (
                        <div key={appt.id} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex gap-4">
                                    <div className={`size-16 rounded-xl overflow-hidden shadow-inner ring-1 ${appt.appointmentType === 'ONLINE' ? 'ring-blue-100/50' : 'ring-primary/10'}`}>
                                        <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 bg-slate-100" src={appt.doctorAvatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(appt.doctorName || 'Dr')} alt="Bác sĩ" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-slate-900 dark:text-white">{appt.doctorName}</h4>
                                        <p className="text-sm text-primary font-medium">{appt.doctorSpecialty || "Chuyên môn trống"}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    {appt.appointmentType === 'ONLINE' ? (
                                        <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Online</div>
                                    ) : (
                                        <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Trực tiếp</div>
                                    )}
                                    {appt.status === 'PENDING' ? (
                                        <div className="bg-amber-50 text-amber-600 border border-amber-100 px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 animate-pulse">
                                            <span className="size-1.5 rounded-full bg-amber-500"></span>
                                            Chờ xác nhận
                                        </div>
                                    ) : (
                                        <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1">
                                            <span className="size-1.5 rounded-full bg-emerald-500"></span>
                                            Đã duyệt
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                    <span className="material-symbols-outlined text-sm">event</span>
                                    <span className="text-sm">{formatDate(appt.appointmentTime)}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                    <span className="material-symbols-outlined text-sm">schedule</span>
                                    <span className="text-sm">{formatTime(appt.appointmentTime)} - {appt.endTime ? formatTime(appt.endTime) : (parseInt(formatTime(appt.appointmentTime).split(":")[0]) + 1).toString().padStart(2, '0') + ":" + formatTime(appt.appointmentTime).split(":")[1]}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                     {appt.appointmentType === 'ONLINE' ? (
                                     <>
                                         <span className="material-symbols-outlined text-sm text-blue-500">videocam</span>
                                         {appt.status === 'PENDING' ? (
                                             <span className="text-sm font-medium text-slate-400 italic">Link sẽ có sau khi bác sĩ duyệt</span>
                                         ) : (
                                             <span className="text-sm font-medium text-blue-500 underline cursor-pointer" onClick={() => window.open(appt.meetingLink || '#', '_blank')}>{appt.meetingLink || "Sẽ cập nhật Link sau"}</span>
                                         )}
                                     </>
                                    ) : (
                                    <>
                                        <span className="material-symbols-outlined text-sm">location_on</span>
                                        <span className="text-sm">{appt.location || "Phòng khám"}</span>
                                    </>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    disabled={appt.status === 'PENDING'}
                                    onClick={() => {
                                        if (appt.appointmentType === 'ONLINE') {
                                            window.open(appt.meetingLink || '#', '_blank');
                                        } else {
                                            handleToggleReminder(appt.id, appt.reminderEnabled);
                                        }
                                    }}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2 ${
                                    appt.status === 'PENDING'
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                        : appt.appointmentType === 'ONLINE' 
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90' 
                                            : appt.reminderEnabled
                                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                                                : 'bg-[#37b5eb] text-white hover:bg-[#37b5eb]/90 shadow-lg shadow-[#37b5eb]/20'
                                    }`}>
                                    <span className="material-symbols-outlined text-[18px]">
                                        {appt.status === 'PENDING' ? 'hourglass_top' : appt.appointmentType === 'ONLINE' ? 'video_call' : 'notifications_active'}
                                    </span>
                                    {appt.status === 'PENDING'
                                        ? 'Đang chờ duyệt...'
                                        : appt.appointmentType === 'ONLINE' 
                                            ? 'Tham gia tư vấn' 
                                            : appt.reminderEnabled
                                                ? 'Đã thiết lập nhắc nhở' 
                                                : 'Nhắc tôi'}
                                </button>
                                {appt.status === 'PENDING' && (
                                    <button onClick={() => handleOpenCancelModal(appt.id)} className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-95">Hủy lịch</button>
                                )}

                            </div>
                        </div>
                        ))}
                    </div>
                    )}
                </section>

                {/* History Section */}
                <section>
                    <div className="flex items-center justify-between mb-4 gap-4 h-10">
                        {!isSearchVisible ? (
                            <>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white animate-in slide-in-from-left-2">Lịch sử khám bệnh</h3>
                                <div className="flex gap-2">
                                    <button className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-colors text-slate-400 hover:text-primary" title="Lọc">
                                        <span className="material-symbols-outlined">filter_list</span>
                                    </button>
                                    <button onClick={() => setIsSearchVisible(true)} className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-colors text-slate-400 hover:text-primary" title="Tìm kiếm">
                                        <span className="material-symbols-outlined">search</span>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center gap-2 animate-in slide-in-from-right-2 duration-200">
                                <div className="relative flex-1">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                                    <input 
                                        autoFocus
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Tìm kiếm theo tên bác sĩ hoặc chẩn đoán..."
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-white"
                                    />
                                </div>
                                <button 
                                    onClick={() => {
                                        setIsSearchVisible(false);
                                        setSearchQuery("");
                                    }}
                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-500">Ngày khám</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-500">Bác sĩ</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-500">Chẩn đoán</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-500">Trạng thái</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-500 text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-medium">
                                                Không tìm thấy lịch sử khám nào phù hợp.
                                            </td>
                                        </tr>
                                    ) : (
                                    filteredHistory.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700 dark:text-slate-300">{formatDate(row.appointmentTime)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-full shadow-inner ring-1 ring-slate-100 overflow-hidden">
                                                        <img src={row.doctorAvatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(row.doctorName || 'Dr')} alt="Bác sĩ" className="w-full h-full object-cover bg-slate-200" />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-900 dark:text-white">{row.doctorName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-[200px] truncate">{row.diagnosisSummary || "-"}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${row.status === 'COMPLETED' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600'}`}>{row.status === 'COMPLETED' ? 'Hoàn tất' : 'Đã hủy'}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedResult(row);
                                                    }}
                                                    className="text-primary hover:text-primary/80 text-sm font-bold transition-colors">
                                                    Xem kết quả
                                                 </button>
                                            </td>
                                        </tr>
                                    )))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>

            {/* Right Sidebar */}
            <aside className="w-full lg:w-80 bg-white dark:bg-background-dark border-l border-slate-200 dark:border-slate-800 p-6 space-y-8 overflow-y-auto custom-scrollbar">
                {/* Mini Calendar */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-slate-900 dark:text-white">Lịch cá nhân</h4>
                        <span className="text-xs font-medium text-slate-400">Tháng {new Date().getMonth() + 1}, {new Date().getFullYear()}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
                                <span key={d} className="text-[10px] font-bold text-slate-400 uppercase">{d}</span>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center">
                            {(() => {
                                const now = new Date();
                                const year = now.getFullYear();
                                const month = now.getMonth();
                                const daysInMonth = new Date(year, month + 1, 0).getDate();
                                const firstDayOfWeek = new Date(year, month, 1).getDay();
                                const appointmentDays = [...upcoming, ...history]
                                    .filter(a => {
                                        const ad = new Date(a.appointmentTime);
                                        return ad.getMonth() === month && ad.getFullYear() === year;
                                    })
                                    .map(a => new Date(a.appointmentTime).getDate());
                                const cells = [];
                                for (let i = 0; i < firstDayOfWeek; i++) {
                                    cells.push(<div key={`empty-${i}`} />);
                                }
                                for (let d = 1; d <= daysInMonth; d++) {
                                    const isToday = d === now.getDate();
                                    const hasAppt = appointmentDays.includes(d);
                                    cells.push(
                                        <div
                                            key={d}
                                            className={`py-2 text-xs font-medium rounded-full transition-all relative ${
                                                isToday
                                                    ? 'bg-primary text-slate-900 font-bold shadow-lg shadow-primary/20 scale-110'
                                                    : hasAppt
                                                    ? 'text-primary font-bold'
                                                    : ''
                                            }`}
                                        >
                                            {d}
                                            {hasAppt && !isToday && (
                                                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                                            )}
                                        </div>
                                    );
                                }
                                return cells;
                            })()}
                        </div>
                    </div>
                </section>

                {/* My Doctors */}
                <section>
                    <h4 className="font-bold mb-4 text-slate-900 dark:text-white">Bác sĩ khả dụng</h4>
                    <div className="space-y-4">
                        {doctors.slice(0, 3).map((doc) => (
                            <div key={doc.id} 
                                onClick={() => {
                                    setSelectedDoctorId(doc.id);
                                    setIsModalOpen(true);
                                }}
                                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer group hover:shadow-sm"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-full overflow-hidden shadow-inner ring-1 ring-slate-100">
                                        <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 bg-slate-200" src={doc.avatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(doc.name)} alt={doc.name} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold leading-tight text-slate-900 dark:text-white">{doc.name}</p>
                                        <p className="text-[10px] text-slate-500 font-medium">{doc.specialty}</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-primary text-xl group-hover:rotate-12 transition-transform">calendar_add_on</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Health Tip Widget */}
                <section className="bg-primary/10 p-5 rounded-2xl border border-primary/20 relative overflow-hidden group">
                    <div className="relative z-10">
                        <span className="material-symbols-outlined text-primary mb-2 animate-bounce">lightbulb</span>
                        <h5 className="font-bold text-sm mb-1 text-slate-900 dark:text-slate-100">Lời khuyên hôm nay</h5>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">Bạn có thể đặt lịch tư vấn trực tuyến để tiết kiệm thời gian đi lại!</p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 size-24 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all"></div>
                </section>
            </aside>
            <AddAppointmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveAppointment}
                isSaving={isSaving}
                doctors={doctors}
                preSelectedDoctorId={selectedDoctorId}
            />
            <ConfirmActionModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={confirmCancel}
                title="Xác nhận hủy lịch"
                description="Xác nhận hủy lịch hẹn này?"
                confirmText="Xác nhận hủy"
                cancelText="Không, quay lại"
                iconName="event_busy"
                isLoading={isCancelling}
                variant="warning"
            />
            <MedicalResultModal
                isOpen={!!selectedResult}
                onClose={() => setSelectedResult(null)}
                appointment={selectedResult}
            />
            <Toast
                show={toast.show}
                title={toast.title}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default PatientAppointments;
