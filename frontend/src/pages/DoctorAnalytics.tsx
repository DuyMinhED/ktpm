import { useState, useEffect } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ExcelJS from 'exceljs';
import TopBar from '../components/common/TopBar';
import DoctorSidebar from '../components/common/DoctorSidebar';
import PatientDetailModal from '../features/patient/components/PatientDetailModal';
import AdviceModal from '../features/patient/components/AdviceModal';
import Toast from '../components/ui/Toast';
import Skeleton from '../components/ui/Skeleton';
import { doctorApi } from '../api/doctor';

export default function DoctorAnalytics() {
    const [patients, setPatients] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [insights, setInsights] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        fetchData();
    }, [currentPage]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pRes, sRes, dRes] = await Promise.all([
                doctorApi.getMyPatients({ riskLevel: 'Nguy cơ cao', size: 10, page: currentPage }),
                doctorApi.getPatientStats(),
                doctorApi.getDashboard()
            ]);
            if (pRes.success) {
                setPatients(pRes.data.content || []);
                setTotalPages(pRes.data.totalPages || 0);
            }
            if (sRes.success) setStats(sRes.data);
            if (dRes.success) setInsights(dRes.data.insights || []);
        } catch (error) {
            console.error('Failed to fetch analytics data', error);
        } finally {
            setLoading(false);
        }
    };
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isPatientDetailModalOpen, setIsPatientDetailModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [chartType, setChartType] = useState<'bp' | 'glucose'>('bp');

    // Advice Modal State
    const [isAdviceModalOpen, setIsAdviceModalOpen] = useState(false);
    const [adviceCategory, setAdviceCategory] = useState('Theo dõi');
    const [adviceContent, setAdviceContent] = useState('');
    const [isAdviceSaving, setIsAdviceSaving] = useState(false);
    const [advicePatient, setAdvicePatient] = useState<any>(null);

    const [showToast, setShowToast] = useState(false);
    const [toastTitle, setToastTitle] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');

    const handleSaveAdvice = async () => {
        if (!advicePatient || !advicePatient.userId) return;
        setIsAdviceSaving(true);
        try {
            const messageContent = `[Cảnh báo rủi ro - ${adviceCategory}] ${adviceContent}`;
            await doctorApi.sendMessage({ receiverId: advicePatient.userId, content: messageContent, messageType: 'TEXT' });
            setIsAdviceModalOpen(false);
            setAdviceContent('');
            setToastTitle(`Đã gửi cảnh báo đến ${advicePatient.fullName} thành công!`);
            setToastType('success');
            setShowToast(true);
        } catch (error) {
            setToastTitle('Có lỗi khi gửi cảnh báo');
            setToastType('error');
            setShowToast(true);
        } finally {
            setIsAdviceSaving(false);
        }
    };
    const handleExportExcel = async () => {
        const today = new Date().toLocaleDateString('vi-VN');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Phân Tích Nguy Cơ');

        // Title Row
        worksheet.addRow([`BÁO CÁO PHÂN TÍCH NGUY CƠ SỨC KHỎE BỆNH NHÂN - ${today}`]);
        worksheet.mergeCells('A1:E1');
        const titleRow = worksheet.getRow(1);
        titleRow.font = { name: 'Arial', family: 4, size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
        titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } }; // sky-600
        titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
        titleRow.height = 30;

        // Header Row
        const headerRow = worksheet.addRow([
            'Họ và Tên',
            'Mã Bệnh Nhân',
            'Chỉ Số Gần Nhất',
            'Phân Tích AI',
            'Bệnh Lý Ghi Nhận'
        ]);

        headerRow.font = { bold: true, color: { argb: 'FF1E293B' } }; // slate-800
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // slate-100
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 25;

        // Column Widths
        worksheet.columns = [
            { width: 35 }, // Name
            { width: 15 }, // Code
            { width: 25 }, // Index
            { width: 45 }, // AI analysis
            { width: 30 }  // Condition
        ];

        // Data Rows
        patients.forEach(p => {
            const row = worksheet.addRow([
                p.fullName,
                p.patientCode || 'N/A',
                p.latestBp || p.latestGlucose || 'N/A',
                p.chronicCondition || 'Cần kiểm tra ngay',
                p.chronicCondition || 'Chưa xác định'
            ]);
            row.alignment = { vertical: 'middle', wrapText: true };

            const indexCell = row.getCell(3);
            indexCell.font = { color: { argb: 'FFEF4444' }, bold: true }; // Analytics mostly shows high risk

            const aiCell = row.getCell(4);
            aiCell.font = { color: { argb: 'FFEF4444' }, bold: true };
        });

        // Borders
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                row.eachCell({ includeEmpty: true }, (cell) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                    };
                });
            }
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Phan_tich_nguy_co_${today.replace(/\//g, '-')}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                <TopBar
                    setIsSidebarOpen={setIsSidebarOpen}
                    notifications={notifications}
                    setNotifications={setNotifications}
                />

                <div className="p-4 md:p-8 space-y-6 md:space-y-8">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            {loading ? (
                                <>
                                    <Skeleton className="h-7 w-48 mb-2" />
                                    <Skeleton className="h-5 w-80" />
                                </>
                            ) : (
                                <>
                                    <h2 className="text-[22px] font-semibold text-slate-900 dark:text-slate-100">Phân tích nguy cơ</h2>
                                    <p className="text-slate-500 text-[15px] font-medium mt-1">Hệ thống giám sát và dự báo rủi ro sức khỏe bệnh nhân</p>
                                </>
                            )}
                        </div>

                        <button
                            onClick={handleExportExcel}
                            className="bg-white text-slate-700 border border-slate-200 px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-sm transition-all hover:bg-slate-50">
                            <span className="material-symbols-outlined text-[20px]">ios_share</span>
                            Xuất dữ liệu
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-primary/5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 mb-1">Tổng bệnh nhân</p>
                                    {loading ? <Skeleton className="h-9 w-16 mt-1" /> : <h3 className="text-3xl font-extrabold mt-1 text-slate-900 dark:text-white">{stats?.totalPatients || 0}</h3>}
                                </div>
                                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-500">
                                    <span className="material-symbols-outlined text-3xl">monitoring</span>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-[14px] text-blue-600 dark:text-blue-400 font-bold">
                                <span className="material-symbols-outlined text-[14px] mr-1">schedule</span>
                                Theo dõi trực tiếp
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-primary/5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 mb-1">Nguy cơ cao</p>
                                    {loading ? <Skeleton className="h-9 w-16 mt-1" /> : <h3 className="text-3xl font-extrabold mt-1 text-red-500">{stats?.highRiskCount || 0}</h3>}
                                </div>
                                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center text-red-500">
                                    <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                                </div>
                            </div>
                            <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-4 italic font-medium">Cần can thiệp khẩn cấp ngay</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-primary/5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 mb-1">Cần theo dõi</p>
                                    {loading ? <Skeleton className="h-9 w-16 mt-1" /> : <h3 className="text-3xl font-extrabold mt-1 text-orange-500">{stats?.monitoringCount || 0}</h3>}
                                </div>
                                <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-500">
                                    <span className="material-symbols-outlined text-3xl">trending_down</span>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-[14px] text-orange-500 dark:text-orange-400 font-bold">
                                Dữ liệu thực tế
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-primary/5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 mb-1">Ổn định</p>
                                    {loading ? <Skeleton className="h-9 w-16 mt-1" /> : <h3 className="text-3xl font-extrabold mt-1 text-primary">{stats?.stableCount || 0}</h3>}
                                </div>
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined text-3xl"
                                        style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-[14px] text-primary dark:text-primary/80 font-bold">
                                Duy trì trạng thái tốt
                            </div>
                        </div>
                    </div>

                    {/* Middle Section: Chart & AI Insights */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Chart Section */}
                        <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-sm border border-slate-100">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h4 className="text-lg font-medium text-slate-800">Xu hướng sức khỏe</h4>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setChartType('bp')}
                                        className={`px-5 py-2.5 text-sm font-bold rounded-lg border transition-all ${chartType === 'bp' ? 'bg-primary/5 text-primary border-transparent shadow-sm' : 'text-slate-500 hover:bg-slate-50 border-transparent'}`}>
                                        Huyết áp
                                    </button>
                                    <button
                                        onClick={() => setChartType('glucose')}
                                        className={`px-5 py-2.5 text-sm font-bold rounded-lg border transition-all ${chartType === 'glucose' ? 'bg-primary/5 text-primary border-transparent shadow-sm' : 'text-slate-500 hover:bg-slate-50 border-transparent'}`}>
                                        Đường huyết
                                    </button>
                                </div>
                            </div>
                            {/* Dynamic Chart (Recharts) */}
                            <div className="h-[260px] mt-6 w-full relative">
                                {loading ? (
                                    <div className="w-full h-full flex flex-col justify-end pb-6 pt-2 px-2">
                                        <Skeleton className="w-full h-full rounded-xl opacity-60" />
                                        <div className="flex justify-between mt-4">
                                            <Skeleton className="w-12 h-3" />
                                            <Skeleton className="w-12 h-3" />
                                            <Skeleton className="w-12 h-3" />
                                            <Skeleton className="w-12 h-3" />
                                            <Skeleton className="w-12 h-3" />
                                        </div>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={(chartType === 'bp' ? stats?.chartDataBp : stats?.chartDataGlucose) ? (chartType === 'bp' ? stats?.chartDataBp : stats?.chartDataGlucose).map((val: number, i: number, arr: any[]) => {
                                                const d = new Date();
                                                d.setDate(d.getDate() - (arr.length - 1 - i));
                                                return {
                                                    name: ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][d.getDay()],
                                                    value: val
                                                };
                                            }) : []}
                                            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={chartType === 'bp' ? "#2dd4bf" : "#3b82f6"} stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor={chartType === 'bp' ? "#2dd4bf" : "#3b82f6"} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#cbd5e1" opacity={0.4} />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                                                dy={12}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                                                domain={chartType === 'bp' ? [90, 150] : [4, 10]}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                                                itemStyle={{ fontWeight: 'bold' }}
                                                labelStyle={{ color: '#64748b', marginBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}
                                                formatter={(value: number) => [`${value} ${chartType === 'bp' ? 'mmHg' : 'mmol/L'}`, chartType === 'bp' ? 'Huyết áp trung bình' : 'Đường huyết trung bình']}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke={chartType === 'bp' ? "#2dd4bf" : "#3b82f6"}
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorValue)"
                                                connectNulls={true}
                                                activeDot={{ r: 6, strokeWidth: 0, fill: chartType === 'bp' ? "#0f766e" : "#1d4ed8" }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                        {/* AI Insights Panel */}
                        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-100 space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-primary"
                                    style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                <h4 className="text-lg font-medium">AI Insights</h4>
                            </div>
                            {insights.length > 0 ? (
                                insights.map((insight, idx) => (
                                    <div key={idx} className={`p-4 rounded-lg border-l-4 ${idx % 3 === 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-500' : idx % 3 === 1 ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500' : 'bg-primary/5 border-primary'}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`material-symbols-outlined text-sm ${idx % 3 === 0 ? 'text-red-500' : idx % 3 === 1 ? 'text-orange-500' : 'text-primary'}`}>
                                                {idx % 3 === 0 ? 'emergency' : idx % 3 === 1 ? 'groups_2' : 'query_stats'}
                                            </span>
                                            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${idx % 3 === 0 ? 'text-red-600' : idx % 3 === 1 ? 'text-orange-600' : 'text-primary'}`}>
                                                {idx % 3 === 0 ? 'Cảnh báo khẩn' : idx % 3 === 1 ? 'Phân tích cụm' : 'Dự báo biến chứng'}
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                            {insight}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 italic text-slate-400 text-sm">
                                    Hệ thống chưa ghi nhận bất thường đáng kể trong hôm nay
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Patient Table Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                            <h4 className="text-lg font-medium text-slate-900 dark:text-white">Bệnh nhân nguy cơ cao</h4>
                            <button
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                <span className="material-symbols-outlined text-sm">filter_list</span>
                                Lọc dữ liệu
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-primary/5 border-b border-primary/5">
                                        <th className="px-8 py-4 text-[14px] font-bold text-slate-500">Bệnh nhân</th>
                                        <th className="px-8 py-4 text-[14px] font-bold text-slate-500">Thông tin cá nhân</th>
                                        <th className="px-8 py-4 text-[14px] font-bold text-slate-500">Bệnh lý</th>
                                        <th className="px-8 py-4 text-[14px] font-bold text-slate-500">Chỉ số mới nhất</th>
                                        <th className="px-8 py-4 text-[14px] font-bold text-slate-500">Phân tích từ AI</th>
                                        <th className="px-8 py-4 text-[14px] font-bold text-slate-500 text-right whitespace-nowrap">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i}>
                                                <td className="px-8 py-5 h-[80px]">
                                                    <div className="flex items-center gap-3">
                                                        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                                                        <div className="space-y-2 flex-1">
                                                            <Skeleton className="h-4 w-24" />
                                                            <Skeleton className="h-3 w-32" />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="space-y-2">
                                                        <Skeleton className="h-4 w-20" />
                                                        <Skeleton className="h-3 w-16" />
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <Skeleton className="h-4 w-24" />
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <Skeleton className="h-5 w-16" />
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <Skeleton className="h-7 rounded-full w-36" />
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <Skeleton variant="circular" className="h-8 w-8 ml-auto" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : patients.length > 0 ? (
                                        patients.map((p, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                                            {p.avatarUrl ? (
                                                                <img src={p.avatarUrl} alt={p.fullName} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-black text-[15px]">
                                                                    {p.fullName?.split(' ').pop()?.charAt(0).toUpperCase() || '?'}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-[16px] font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors tracking-tight">{p.fullName}</p>
                                                            <p className="text-[13px] text-slate-400 dark:text-slate-500 font-medium tracking-tight">Mã hồ sơ: {p.patientCode}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <p className="text-[14px] text-slate-600 font-medium">{p.age ? `${p.age} tuổi` : '-'} • {p.gender || '-'}</p>
                                                    <p className="text-[13px] text-slate-400 font-medium mt-0.5">{p.phone || 'Chưa cập nhật SĐT'}</p>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[13px] font-medium">
                                                        {p.chronicCondition || 'Chưa xác định'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[15px] font-extrabold text-red-500`}>{p.latestBp || p.latestGlucose || 'N/A'}</span>
                                                        <span className={`material-symbols-outlined text-red-500 text-[14px]`}>arrow_upward</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[13px] font-bold gap-2 text-white shadow-sm whitespace-nowrap bg-red-500`}>
                                                        <span className="material-symbols-outlined text-[13px] font-variation-settings: 'FILL' 1" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                                                        {p.chronicCondition || 'Cần kiểm tra ngay'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <a href="/doctor/messages" className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all flex items-center justify-center cursor-pointer">
                                                            <span className="material-symbols-outlined text-xl">chat</span>
                                                        </a>
                                                        <button onClick={() => { setSelectedPatient(p); setIsPatientDetailModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
                                                            <span className="material-symbols-outlined text-xl">visibility</span>
                                                        </button>
                                                        <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" onClick={() => { setAdvicePatient(p); setIsAdviceModalOpen(true); }}>
                                                            <span className="material-symbols-outlined text-xl">campaign</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-10 text-center text-slate-500 italic">Không có bệnh nhân nguy cơ cao nào</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination Footer - Redesigned */}
                        <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-end border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                    disabled={currentPage === 0}
                                    className="p-2 rounded-md text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                                </button>
                                <span className="px-3 py-1.5 min-w-[90px] text-center rounded-full bg-primary text-white text-[13px] font-bold shadow-md tracking-tight whitespace-nowrap">
                                    Trang {currentPage + 1}/{totalPages || 1}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                                    disabled={currentPage >= totalPages - 1}
                                    className="p-2 rounded-md text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            {selectedPatient && (
                <PatientDetailModal
                    isOpen={isPatientDetailModalOpen}
                    onClose={() => setIsPatientDetailModalOpen(false)}
                    patient={selectedPatient}
                />
            )}

            <AdviceModal
                isOpen={isAdviceModalOpen}
                onClose={() => setIsAdviceModalOpen(false)}
                adviceCategory={adviceCategory}
                setAdviceCategory={setAdviceCategory}
                adviceContent={adviceContent}
                setAdviceContent={setAdviceContent}
                isSaving={isAdviceSaving}
                onSave={handleSaveAdvice}
                patientName={advicePatient?.fullName || ""}
                patientAvatar={advicePatient?.avatarUrl}
                patientData={advicePatient}
            />

            <Toast
                show={showToast}
                title={toastTitle}
                type={toastType}
                onClose={() => setShowToast(false)}
            />
        </div>
    );
}