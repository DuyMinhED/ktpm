import React, { useState, useEffect } from 'react';
import { patientApi } from '../api/patient';
import Toast from '../components/ui/Toast';
import PrescriptionDetailModal from '../components/ui/PrescriptionDetailModal';

const PatientPrescriptions: React.FC = () => {
    const [activePrescriptions, setActivePrescriptions] = useState<any[]>([]);
    const [historyPrescriptions, setHistoryPrescriptions] = useState<any[]>([]);
    const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, title: '', type: 'success' as 'success' | 'warning' | 'error' });
    const [selectedDetail, setSelectedDetail] = useState<any | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [activeRes, historyRes, scheduleRes] = await Promise.all([
                    patientApi.getActivePrescriptions(),
                    patientApi.getPrescriptionHistory(),
                    patientApi.getTodayMedicationSchedule(),
                ]);
                if (activeRes.success) setActivePrescriptions(activeRes.data || []);
                if (historyRes.success) setHistoryPrescriptions(historyRes.data || []);
                if (scheduleRes.success) setTodaySchedule(scheduleRes.data || []);
            } catch (e) {
                console.error('Failed to fetch prescriptions', e);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const handleLogMedication = async (scheduleId: number) => {
        try {
            await patientApi.logMedication({ scheduleId, status: 'TAKEN' });
            setTodaySchedule(prev => prev.map(s => s.id === scheduleId ? { ...s, todayStatus: 'TAKEN', takenAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) } : s));
            setToast({ show: true, title: 'Đã ghi nhận uống thuốc!', type: 'success' });
        } catch (e) { console.error(e); }
    };

    const handleRequestRefill = async (prescriptionId: number) => {
        try {
            await patientApi.requestRefill(prescriptionId);
            setToast({ show: true, title: 'Đã gửi yêu cầu tái cấp đơn thuốc!', type: 'success' });
        } catch (e) { console.error(e); }
    };

    const remainingSchedules = todaySchedule.filter(s => s.todayStatus !== 'TAKEN').length;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 text-left">
                <div>
                    <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900 dark:text-white">Đơn thuốc của tôi</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Quản lý và theo dõi các loại thuốc đang sử dụng cho bệnh mãn tính</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => document.getElementById('prescription-history')?.scrollIntoView({ behavior: 'smooth' })}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        <span className="material-symbols-outlined text-lg">history</span>
                        Lịch sử
                    </button>
                    <button 
                        onClick={() => activePrescriptions.length > 0 && handleRequestRefill(activePrescriptions[0].id)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-transform">
                        <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                        Yêu cầu cấp lại
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 text-left">
                {/* Left Column: Active Prescriptions */}
                <div className="xl:col-span-2 space-y-6">
                    <section>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                            <span className="material-symbols-outlined text-primary font-bold">pill</span>
                            Đang điều trị
                        </h2>
                        <div className="grid gap-4">
                            {loading ? (
                                [...Array(2)].map((_, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 shadow-sm animate-pulse">
                                        <div className="flex gap-5">
                                            <div className="w-32 h-32 bg-slate-100 rounded-xl"></div>
                                            <div className="flex-1 space-y-3">
                                                <div className="h-5 bg-slate-200 rounded w-40"></div>
                                                <div className="h-4 bg-slate-100 rounded w-60"></div>
                                                <div className="h-4 bg-slate-100 rounded w-48"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : activePrescriptions.length === 0 ? (
                                <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-10 border border-slate-100 dark:border-slate-700/50 shadow-sm text-center">
                                    <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">medication</span>
                                    <p className="text-slate-400 text-sm">Chưa có đơn thuốc đang điều trị</p>
                                </div>
                            ) : activePrescriptions.map((rx: any) => (
                                <div key={rx.id} className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col md:flex-row gap-5 hover:shadow-md transition-all group">
                                    <div className="w-full md:w-32 h-32 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <span className="material-symbols-outlined text-5xl text-slate-400 group-hover:text-primary transition-colors">medication</span>
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{rx.diagnosis || 'Đơn thuốc'}</h3>
                                                <span className="bg-primary/20 text-primary-dark dark:text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{rx.prescriptionCode}</span>
                                            </div>
                                            <div className="mt-2 space-y-2">
                                                {rx.items?.map((item: any) => (
                                                    <div key={item.id} className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                                        <p className="text-sm flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                                                            <span className="material-symbols-outlined text-base text-primary">pill</span>
                                                            {item.medicationName} - {item.dosage}
                                                        </p>
                                                        {item.usageInstructions && (
                                                            <p className="text-[13px] text-slate-500 dark:text-slate-400 ml-6 mt-0.5 font-medium italic">
                                                                {item.usageInstructions}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-slate-500">Ngày cấp: {rx.createdDate || 'N/A'}</span>
                                            </div>
                                            <button 
                                                onClick={() => handleRequestRefill(rx.id)}
                                                className="text-primary hover:underline text-sm font-bold flex items-center gap-1 transition-all">
                                                <span className="material-symbols-outlined text-lg">autorenew</span>
                                                Tái cấp
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Prescription History Table */}
                    <section className="mt-10" id="prescription-history">
                        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Lịch sử đơn thuốc</h2>
                        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm font-display">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                                            <th className="px-6 py-4">Ngày cấp</th>
                                            <th className="px-6 py-4">Mã đơn</th>
                                            <th className="px-6 py-4">Chẩn đoán</th>
                                            <th className="px-6 py-4">Trạng thái</th>
                                            <th className="px-6 py-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {loading ? (
                                            [...Array(2)].map((_, i) => (
                                                <tr key={i} className="animate-pulse">
                                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                                                    <td className="px-6 py-4"><div className="h-5 bg-slate-100 rounded-full w-20"></div></td>
                                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-8"></div></td>
                                                </tr>
                                            ))
                                        ) : historyPrescriptions.length === 0 ? (
                                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-sm">Chưa có lịch sử đơn thuốc</td></tr>
                                        ) : historyPrescriptions.map((row: any) => (
                                            <tr key={row.id} onClick={() => setSelectedDetail(row)} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer">
                                                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{row.createdDate || 'N/A'}</td>
                                                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{row.prescriptionCode}</td>
                                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">{row.diagnosis || 'N/A'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                        row.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 
                                                        row.status === 'PENDING_RENEWAL' ? 'bg-amber-100 text-amber-700' :
                                                        row.status === 'EXPIRED' ? 'bg-rose-100 text-rose-700' : 
                                                        'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {
                                                            row.status === 'COMPLETED' ? 'Hoàn thành' : 
                                                            row.status === 'PENDING_RENEWAL' ? 'Chờ cấp lại' :
                                                            row.status === 'EXPIRED' ? 'Hết hạn' :
                                                            row.status === 'ACTIVE' ? 'Đang dùng' : row.status
                                                        }
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={(e) => { e.stopPropagation(); setSelectedDetail(row); }} className="text-primary material-symbols-outlined font-bold transition-transform hover:scale-110">visibility</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column: Reminders & Alerts */}
                <div className="space-y-6">
                    <section className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Lịch uống thuốc hôm nay</h2>
                            <span className="text-primary text-[10px] font-black px-2 py-1 bg-primary/10 rounded uppercase tracking-widest">{remainingSchedules} lần nữa</span>
                        </div>
                        <div className="space-y-6 relative before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-700">
                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <div key={i} className="relative pl-8 flex items-start gap-4 animate-pulse">
                                        <div className="absolute left-0 top-1.5 size-6 rounded-full bg-slate-200 border-4 border-white dark:border-slate-800 z-10"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 bg-slate-100 rounded w-16"></div>
                                            <div className="h-4 bg-slate-200 rounded w-28"></div>
                                        </div>
                                    </div>
                                ))
                            ) : todaySchedule.length === 0 ? (
                                <div className="text-center py-6 text-sm text-slate-400">Chưa có lịch uống thuốc</div>
                            ) : todaySchedule.map((schedule: any) => (
                                <div key={schedule.id} className="relative pl-8 flex items-start gap-4 group">
                                    <div className={`absolute left-0 top-1.5 size-6 rounded-full border-4 border-white dark:border-slate-800 z-10 flex items-center justify-center shadow-sm ${schedule.todayStatus === 'TAKEN' ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-600 transition-transform'}`}>
                                        {schedule.todayStatus === 'TAKEN' && <span className="material-symbols-outlined text-white text-[10px] font-black">check</span>}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${schedule.todayStatus === 'TAKEN' ? 'text-slate-400' : 'text-primary'}`}>{schedule.scheduledTime}</p>
                                        <h4 className={`font-bold tracking-tight ${schedule.todayStatus === 'TAKEN' ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>{schedule.medicationName} {schedule.dosage}</h4>
                                        {schedule.todayStatus === 'TAKEN' ? (
                                            <p className="text-xs text-slate-400 italic">Đã uống lúc {schedule.takenAt}</p>
                                        ) : (
                                            <button 
                                                onClick={() => handleLogMedication(schedule.id)}
                                                className="mt-4 w-full py-2.5 bg-slate-100 dark:bg-slate-700 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-all">
                                                Đánh dấu đã uống
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-6 border border-primary/20 relative group overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="material-symbols-outlined text-primary fill-1 animate-pulse">notifications_active</span>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Thông báo đơn thuốc</h2>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                                {activePrescriptions.length > 0 ? 
                                    `Bạn đang có ${activePrescriptions.length} đơn thuốc đang điều trị. Hãy đảm bảo uống thuốc đúng giờ.` :
                                    'Chưa có đơn thuốc nào đang điều trị. Vui lòng liên hệ bác sĩ.'
                                }
                            </p>
                            <button 
                                onClick={() => activePrescriptions.length > 0 && handleRequestRefill(activePrescriptions[0].id)}
                                className="w-full bg-primary text-white font-black py-3.5 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:bg-primary/90 hover:-translate-y-1 transition-all uppercase tracking-widest text-xs">
                                <span className="material-symbols-outlined text-lg">autorenew</span>
                                Tái cấp ngay
                            </button>
                        </div>
                        <div className="absolute -right-8 -bottom-8 size-32 bg-primary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                    </section>
                </div>
            </div>
            <Toast show={toast.show} title={toast.title} onClose={() => setToast({ ...toast, show: false })} />
            <PrescriptionDetailModal 
                isOpen={!!selectedDetail} 
                onClose={() => setSelectedDetail(null)} 
                prescription={selectedDetail} 
            />
        </div>
    );
};

export default PatientPrescriptions;