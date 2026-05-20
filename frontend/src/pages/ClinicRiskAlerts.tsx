import { useState, useEffect } from 'react';
import ClinicSidebar from '../components/common/ClinicSidebar';
import TopBar from '../components/common/TopBar';
import { clinicApi } from '../api/clinic';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { useToast } from '../components/ui/ToastContext';

export default function ClinicRiskAlerts() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [alertTimeFilter, setAlertTimeFilter] = useState('Hôm nay');
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [dashboardStats, setDashboardStats] = useState<any>(null);
    const [highRiskPatients, setHighRiskPatients] = useState<any[]>([]);
    const currentClinicId = localStorage.getItem('clinicId') || '1';

    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [dashRes, patientsRes] = await Promise.all([
                    clinicApi.getDashboard(currentClinicId),
                    clinicApi.getPatients(currentClinicId, { riskLevel: 'Nguy cơ cao', size: 5, page })
                ]);
                if (dashRes.success) {
                    setDashboardStats(dashRes.data);
                }
                if (patientsRes.success) {
                    setHighRiskPatients(patientsRes.data.content);
                    setTotalPages(patientsRes.data.totalPages);
                    setTotalElements(patientsRes.data.totalElements);
                }
            } catch (error) {
                console.error('Failed to fetch risk alerts:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [currentClinicId, page]);

    return (
        <div className="flex min-h-screen font-display bg-[#f6f8f7] dark:bg-slate-950 text-slate-900 dark:text-slate-100 italic-none">
            {/* Sidebar Navigation - Shared Component */}
            <ClinicSidebar
                isSidebarOpen={isSidebarOpen}
                isLoading={isLoading}
            />

            {/* Main Content Area */}
            <main className="flex-1 lg:ml-72 min-h-screen flex flex-col transition-all duration-300">
                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[140] lg:hidden animate-in fade-in duration-300"
                        onClick={() => setIsSidebarOpen(false)}
                    ></div>
                )}

                {/* Header */}
                <TopBar
                    setIsSidebarOpen={setIsSidebarOpen}
                    notifications={notifications}
                    setNotifications={setNotifications}
                />

                {/* Content Area */}
                <div className="p-4 md:p-8 space-y-6 md:space-y-8">
                    {/* Header Controls */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 italic-none mb-6">
                        <div className="space-y-1">
                            {isLoading ? (
                                <>
                                    <div className="h-7 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-48"></div>
                                    <div className="h-4 bg-slate-100 dark:bg-slate-800 animate-pulse rounded w-64 mt-2"></div>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Cảnh báo Nguy cơ</h2>
                                    <p className="text-[13px] md:text-sm font-medium text-slate-500 italic-none">Theo dõi các chỉ số sinh tồn và cảnh báo khẩn cấp</p>
                                </>
                            )}
                        </div>
                        {isLoading ? (
                            <div className="w-48 h-10 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl"></div>
                        ) : (
                            <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1 rounded-xl gap-1 border border-primary/5">
                                <button
                                    onClick={() => setAlertTimeFilter('Hôm nay')}
                                    className={`px-6 py-2 text-[13px] font-bold rounded-lg transition-all ${alertTimeFilter === 'Hôm nay' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-700'}`}
                                >
                                    Hôm nay
                                </button>
                                <button
                                    onClick={() => setAlertTimeFilter('Tuần này')}
                                    className={`px-6 py-2 text-[13px] font-bold rounded-lg transition-all ${alertTimeFilter === 'Tuần này' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-700'}`}
                                >
                                    Tuần này
                                </button>
                            </div>
                        )}
                    </div>
                    {/* Quick Stats Bento Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {isLoading ? (
                            [1, 2, 3, 4].map(i => (
                                <div key={`stat-${i}`} className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl shadow-sm animate-pulse border border-primary/5 space-y-4">
                                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24"></div>
                                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
                                    <div className="h-4 bg-slate-50 dark:bg-slate-800/50 rounded w-32 mt-4"></div>
                                </div>
                            ))
                        ) : (
                            <>
                                <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl shadow-sm relative overflow-hidden group border border-primary/5">
                                    <div className="relative z-10">
                                        <p className="text-[12px] md:text-sm font-medium text-slate-500 mb-3 md:mb-4">Tổng cảnh báo</p>
                                        <h3 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-none">{(dashboardStats?.highRiskAlerts || 0) + (dashboardStats?.pendingFollowUps || 0)}</h3>
                                    </div>
                                    <div className="mt-4 md:mt-6 flex items-center text-primary text-[11px] md:text-[13px] font-bold gap-1">
                                        <span className="material-symbols-outlined text-sm">monitor_heart</span>
                                        Theo dõi thời gian thực
                                    </div>
                                </div>
 
                                <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl shadow-sm relative overflow-hidden group border border-red-100 dark:border-red-900/30">
                                    <div>
                                        <div className="flex items-center gap-2 mb-3 md:mb-4">
                                            <p className="text-[12px] md:text-sm font-bold text-red-500">Khẩn cấp</p>
                                        </div>
                                        <h3 className="text-3xl md:text-5xl font-black text-red-500 leading-none">{dashboardStats?.highRiskAlerts || 0}</h3>
                                    </div>
                                    <p className="text-red-600/70 text-[12px] md:text-[14px] font-medium mt-3 md:mt-4">Nguy cơ cao</p>
                                </div>
 
                                <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl shadow-sm relative overflow-hidden group border border-amber-100 dark:border-amber-900/30">
                                    <div>
                                        <div className="flex items-center gap-2 mb-3 md:mb-4">
                                            <p className="text-[12px] md:text-sm font-bold text-amber-600">Theo dõi</p>
                                        </div>
                                        <h3 className="text-3xl md:text-5xl font-black text-amber-600 leading-none">{dashboardStats?.pendingFollowUps || 0}</h3>
                                    </div>
                                    <p className="text-amber-600/70 text-[12px] md:text-[14px] font-medium mt-3 md:mt-4">Đang trong ngưỡng theo dõi</p>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl shadow-sm border border-primary/5">
                                    <div>
                                        <p className="text-[12px] md:text-sm font-medium text-slate-500 mb-3 md:mb-4">Ổn định</p>
                                        <h3 className="text-3xl md:text-5xl font-black text-emerald-600 leading-none">{Math.max(0, (dashboardStats?.totalPatients || 0) - (dashboardStats?.highRiskAlerts || 0) - (dashboardStats?.pendingFollowUps || 0))}</h3>
                                    </div>
                                    <p className="text-emerald-600/70 text-[12px] md:text-[14px] font-medium mt-3 md:mt-4">Đã an toàn</p>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
                        {/* Patient Risk Table */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-primary/5">
                                <div className="px-4 md:px-8 py-4 md:py-6 flex justify-between items-center border-b border-primary/5">
                                    {isLoading ? (
                                        <div className="h-7 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-72"></div>
                                    ) : (
                                        <h4 className="text-[16px] md:text-[20px] font-bold text-slate-900 dark:text-white tracking-tight">Danh sách bệnh nhân nguy cơ cao</h4>
                                    )}
                                    {isLoading ? (
                                        <div className="h-5 bg-slate-100 dark:bg-slate-800 animate-pulse rounded w-32"></div>
                                    ) : (
                                        <button className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                                            Tải báo cáo <span className="material-symbols-outlined text-sm">download</span>
                                        </button>
                                    )}
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-800/50 font-display">
                                                <th className="px-8 py-5">
                                                    {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-700 animate-pulse rounded w-20"></div> : <span className="text-[15px] font-medium text-slate-700">Bệnh nhân</span>}
                                                </th>
                                                <th className="px-4 py-5 font-mono text-center">
                                                    {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-700 animate-pulse rounded w-12 mx-auto"></div> : <span className="text-[15px] font-medium text-slate-700">Tuổi</span>}
                                                </th>
                                                <th className="px-4 py-5">
                                                    {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-700 animate-pulse rounded w-16"></div> : <span className="text-[15px] font-medium text-slate-700"> Mã hồ sơ</span>}
                                                </th>
                                                <th className="px-4 py-5">
                                                    {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-700 animate-pulse rounded w-32"></div> : <span className="text-[15px] font-medium text-slate-700">Chỉ số sinh tồn</span>}
                                                </th>
                                                <th className="px-4 py-5">
                                                    {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-700 animate-pulse rounded w-20"></div> : <span className="text-[15px] font-medium text-slate-700">Thời điểm</span>}
                                                </th>
                                                <th className="px-4 py-5 text-center">
                                                    {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-700 animate-pulse rounded w-20 mx-auto"></div> : <span className="text-[15px] font-medium text-slate-700">Mức độ</span>}
                                                </th>
                                                <th className="px-8 py-5 text-right">
                                                    {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-700 animate-pulse rounded w-20 ml-auto"></div> : <span className="text-[15px] font-medium text-slate-700">Hành động</span>}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                            {isLoading ? (
                                                [1, 2, 3].map(i => (
                                                    <tr key={`alert-skeleton-${i}`} className="animate-pulse">
                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                                                                <div className="space-y-2">
                                                                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24"></div>
                                                                    <div className="h-3 bg-slate-50 dark:bg-slate-800/50 rounded w-32"></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-5">
                                                            <div className="h-4 bg-slate-50 dark:bg-slate-800/50 rounded w-14"></div>
                                                        </td>
                                                        <td className="px-4 py-5">
                                                            <div className="space-y-1">
                                                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-16"></div>
                                                                <div className="h-3 bg-slate-50 dark:bg-slate-800/50 rounded w-10"></div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-5">
                                                            <div className="h-4 bg-slate-50 dark:bg-slate-800/50 rounded w-16"></div>
                                                        </td>
                                                        <td className="px-4 py-5">
                                                            <div className="h-7 bg-slate-100 dark:bg-slate-800 rounded-full w-24 mx-auto"></div>
                                                        </td>
                                                        <td className="px-8 py-5 text-right flex justify-end gap-2">
                                                            <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded"></div>
                                                            <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded"></div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : highRiskPatients.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-8 py-10 text-center text-slate-500">
                                                        Không có bệnh nhân nào trong tệp nguy cơ cao.
                                                    </td>
                                                </tr>
                                            ) : highRiskPatients.map((patient, idx) => {
                                                const conditionStr = patient.chronicCondition || patient.condition || '';
                                                let isRed = false;
                                                let valueLabel = 'Không có DLTN';
                                                
                                                if (conditionStr.includes('huyết áp')) {
                                                    isRed = true;
                                                } else if (conditionStr.includes('Tiểu đường')) {
                                                    isRed = false;
                                                }

                                                return (
                                                    <tr key={idx} className="group">
                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center gap-3">
                                                                <img alt="Bệnh nhân" className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary/10" src={patient.avatarUrl || patient.img || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDT-wP05202-0C6gA-L8_9Z7wB6g_b6C1C1-V1wT13_9A2y-6G0D_1w-5969566_8-6oYg7KEx-iWv43R6wX7T--2_n0vM28148mX0G23-xQwTj_8-B7O-i-lE_h4QnO-aV4-Yw4H-x-L1-m0T8_m1mS2A5z-oV5019-3Yn'} />
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{patient.fullName || patient.name}</p>
                                                                    <p className="text-[13px] text-slate-500 font-medium">{conditionStr}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-5 text-center">
                                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                                {patient.age || '—'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-5 font-medium text-sm text-slate-600">{patient.patientCode || patient.id}</td>
                                                        <td className="px-4 py-5">
                                                            <div className="flex flex-col">
                                                                <span className={`text-[13px] font-bold ${isRed ? 'text-red-500' : 'text-amber-500'}`}>
                                                                    {valueLabel}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-5 font-medium text-sm text-slate-500 italic-none">
                                                            Vừa cập nhật
                                                        </td>
                                                        <td className="px-4 py-5">
                                                            <div className="flex justify-center">
                                                                <span className={`inline-flex px-4 py-1.5 ${patient.riskLevel === 'Nguy cơ cao' ? 'bg-red-500' : 'bg-amber-500'} text-white text-[13px] font-bold rounded-full shadow-sm whitespace-nowrap`}>
                                                                    {patient.riskLevel || 'Nguy cơ cao'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5 text-right space-x-2">
                                                            <button onClick={() => window.open(`tel:${patient.phone || '19001234'}`)} className="p-2 text-red-500 rounded-lg hover:bg-red-50 transition-colors" title="Can thiệp gấp">
                                                                <span className="material-symbols-outlined text-[22px]">call</span>
                                                            </button>
                                                            <button onClick={() => navigate(ROUTES.CLINIC.PATIENTS)} className="p-2 text-primary rounded-lg hover:bg-primary/10 transition-colors" title="Xem hồ sơ">
                                                                <span className="material-symbols-outlined text-[22px]">visibility</span>
                                                            </button>
                                                            <button onClick={() => showToast('Tính năng Kê đơn nhanh đang được phát triển', 'warning')} className="p-2 text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Kê đơn nhanh">
                                                                <span className="material-symbols-outlined text-[22px]">prescriptions</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Pagination Footer - Redesigned */}
                                <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-end border-t border-slate-100 dark:border-slate-800">
                                    {isLoading ? (
                                        <div className="flex gap-2">
                                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                                            <div className="w-20 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => setPage(Math.max(0, page - 1))}
                                                disabled={page === 0}
                                                className="p-2 rounded-md text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-primary transition-all disabled:opacity-30"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                                            </button>
                                            <span className="px-3 py-1.5 min-w-[90px] text-center rounded-full bg-primary text-white text-[13px] font-bold shadow-md tracking-tight whitespace-nowrap">
                                                Trang {page + 1}/{totalPages || 1}
                                            </span>
                                            <button 
                                                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                                                disabled={page >= totalPages - 1 || totalPages === 0}
                                                className="p-2 rounded-md text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-primary transition-all disabled:opacity-30"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Side Panels */}
                        <div className="space-y-6">


                            {/* Quick Actions Card */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-6 shadow-sm border border-primary/5">
                                {isLoading ? (
                                    <div className="h-5 bg-slate-100 dark:bg-slate-800 animate-pulse rounded w-28 mb-6"></div>
                                ) : (
                                    <h5 className="text-sm font-bold text-slate-500 mb-6">Truy cập nhanh</h5>
                                )}
                                <div className="space-y-3">
                                    {isLoading ? (
                                        [1, 2, 3].map(i => (
                                            <div key={`action-${i}`} className="w-full h-14 bg-slate-50 dark:bg-slate-800/50 animate-pulse rounded-2xl"></div>
                                        ))
                                    ) : (
                                        [
                                            { icon: 'contact_phone', label: 'Trạm y tế gần nhất', action: () => showToast('Đang tìm kiếm các trạm y tế và bệnh viện liên kết lân cận...', 'success') },
                                            { icon: 'description', label: 'Xuất hồ sơ khẩn cấp', action: () => showToast('Tính năng xuất hồ sơ cấp cứu (PDF) đang được phát triển.', 'warning') },
                                            { icon: 'history_edu', label: 'Lịch sử phác đồ', action: () => showToast('Hệ thống lưu trữ phác đồ điều trị đang được tích hợp.', 'warning') }
                                        ].map((item, idx) => (
                                            <button 
                                                key={idx} 
                                                onClick={item.action}
                                                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-2xl group"
                                            >
                                                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                                                    <span className="material-symbols-outlined text-primary text-lg">{item.icon}</span>
                                                    <span className="text-sm font-bold">{item.label}</span>
                                                </div>
                                                <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>


                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
