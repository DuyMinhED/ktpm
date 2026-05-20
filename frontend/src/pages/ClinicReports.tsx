import { useState, useEffect } from 'react';
import * as ExcelJS from 'exceljs';
import { clinicApi } from '../api/clinic';
import ClinicSidebar from '../components/common/ClinicSidebar';
import TopBar from '../components/common/TopBar';
import Dropdown from '../components/ui/Dropdown';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function ClinicReports() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [reportTimeRange, setReportTimeRange] = useState('30 ngày');
    const [selectedChartMetric, setSelectedChartMetric] = useState('Lượng bệnh nhân');
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('Tất cả nhóm bệnh');

    const formatDateLabel = (val: any) => {
        if (!val || typeof val !== 'string') return val;
        const match = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (match) {
            return `${match[3]}/${match[2]}/${match[1]}`;
        }
        return val;
    };

    // Custom Tooltip for Recharts
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const getColor = () => {
                if (selectedChartMetric === 'Lượng bệnh nhân') return 'text-primary';
                if (selectedChartMetric === 'Tải lượng bác sĩ') return 'text-emerald-500';
                return 'text-red-500';
            };
            const getSuffix = () => {
                if (selectedChartMetric === 'Lượng bệnh nhân') return 'bệnh nhân mới';
                if (selectedChartMetric === 'Tải lượng bác sĩ') return 'ca khám/ngày';
                return 'ca nguy kịch';
            };
            return (
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl">
                    <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200 mb-1">{formatDateLabel(label)}</p>
                    <div className="flex items-center gap-2">
                        <p className={`text-[14px] font-black ${getColor()}`}>
                            {payload[0].value} <span className="text-slate-500 font-medium text-[12px]">{getSuffix()}</span>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    const [stats, setStats] = useState<any>(null);
    const currentClinicId = localStorage.getItem('clinicId') || '1';

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const periodMap: Record<string, string> = {
                    '7 ngày': '7d',
                    '30 ngày': '30d',
                    '6 tháng gần nhất': '6m',
                    'Năm nay': '1y'
                };
                const res = await clinicApi.getDashboard(currentClinicId, periodMap[reportTimeRange] || '30d');
                if (res.success) {
                    setStats(res.data);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard stats:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboardData();
    }, [currentClinicId, reportTimeRange]);

    const mainStats = (() => {
        const patientGrowthVal = stats?.patientGrowth || '+0%';
        const isDaily = reportTimeRange === '7 ngày' || reportTimeRange === '30 ngày';
        const periodUnit = isDaily ? 'ngày' : 'tháng';

        // Doctor Load Stats
        const docChart = stats?.doctorLoadChart || [];
        let totalDocLoad = 0;
        let maxDocLoad = -1;
        let peakDocPeriod = 'Chưa cập nhật';
        for (const item of docChart) {
            totalDocLoad += item.value;
            if (item.value > maxDocLoad) {
                maxDocLoad = item.value;
                peakDocPeriod = item.month;
            }
        }
        const doctorCount = stats?.doctorPerformances?.length || 1;
        const avgPerDoc = docChart.length > 0 ? (totalDocLoad / (docChart.length * doctorCount)) : 0;
        const avgPerDocStr = `${avgPerDoc.toFixed(1)} ca/${periodUnit}`;
        const peakDocPeriodFormatted = formatDateLabel(peakDocPeriod);
        const resolvedDocLoad = `${stats?.adherenceRate ? Math.round(totalDocLoad * (stats.adherenceRate / 100)) : 0} ca`;

        // Risk Stats
        const riskChart = stats?.riskIndexChart || [];
        let totalRisk = 0;
        let maxRisk = -1;
        let peakRiskPeriod = 'Chưa cập nhật';
        for (const item of riskChart) {
            totalRisk += item.value;
            if (item.value > maxRisk) {
                maxRisk = item.value;
                peakRiskPeriod = item.month;
            }
        }
        const totalHighRisk = stats?.highRiskAlerts || 0;
        const totalPatients = stats?.totalPatients || 1;
        const riskRate = (totalHighRisk * 100 / totalPatients).toFixed(1) + '%';
        const avgNewRisk = riskChart.length > 0 ? (totalRisk / riskChart.length) : 0;
        const avgNewRiskStr = `${avgNewRisk.toFixed(1)} ca/${periodUnit}`;

        return {
            totalPatients: stats?.totalPatients || '0',
            highRiskAlerts: stats?.highRiskAlerts || 0,
            patientGrowth: patientGrowthVal,
            adherenceRate: stats?.adherenceRate || 0,
            improvementRate: stats?.improvementRate || 0,
            avgConsultationTime: stats?.avgConsultationTime || 0,
            growthStats: stats?.growthStats || null,
            highRiskGrowth: stats?.highRiskGrowth || '+0%',
            riskIndexChart: stats?.riskIndexChart || [],
            diseaseAnalytics: stats?.diseaseAnalytics || [],
            diseaseRatios: stats?.diseaseRatios?.map((dr: any) => ({
                ...dr,
                value: dr.percentage
            })) || [],
            chartData: selectedChartMetric === 'Lượng bệnh nhân'
                ? (stats?.patientGrowthChart && stats.patientGrowthChart.length > 0
                    ? stats.patientGrowthChart.map((d: any) => ({
                        month: d.month,
                        value: d.value,
                        inpatientValue: d.secondaryValue || Math.floor(d.value * 0.4)
                    }))
                    : [{ month: 'T1', value: 0 }, { month: 'T2', value: 0 }, { month: 'T3', value: 0 }, { month: 'T4', value: 0 }, { month: 'T5', value: 0 }, { month: 'T6', value: 0 }])
                : selectedChartMetric === 'Tải lượng bác sĩ'
                    ? (stats?.doctorLoadChart && stats.doctorLoadChart.length > 0 ? stats.doctorLoadChart.map((d: any) => ({
                        month: d.month,
                        value: d.value
                    })) : [{ month: 'T1', value: 0 }, { month: 'T2', value: 0 }, { month: 'T3', value: 0 }, { month: 'T4', value: 0 }, { month: 'T5', value: 0 }, { month: 'T6', value: 0 }])
                    : (stats?.riskIndexChart && stats.riskIndexChart.length > 0 ? stats.riskIndexChart.map((d: any) => ({
                        month: d.month,
                        value: d.value
                    })) : [{ month: 'T1', value: 0 }, { month: 'T2', value: 0 }, { month: 'T3', value: 0 }, { month: 'T4', value: 0 }, { month: 'T5', value: 0 }, { month: 'T6', value: 0 }]),

            docTotal: `${totalDocLoad} ca`,
            docAvg: avgPerDocStr,
            docPeak: peakDocPeriodFormatted,
            docResolved: resolvedDocLoad,

            riskRate: riskRate,
            riskAvg: avgNewRiskStr,
            riskPeak: formatDateLabel(peakRiskPeriod),
            riskTotal: `${totalHighRisk} ca`
        };
    })();

    const CustomXAxisTick = ({ x, y, payload, index, length }: any) => {
        let textAnchor: "start" | "middle" | "end" = "middle";
        if (index === 0) textAnchor = "start";
        else if (index === length - 1) textAnchor = "end";

        return (
            <g transform={`translate(${x},${y})`}>
                <text
                    x={0}
                    y={0}
                    dy={16}
                    textAnchor={textAnchor}
                    fill="#64748b"
                    fontSize={window.innerWidth > 1024 ? 14 : 11}
                    fontWeight={500}
                >
                    {formatDateLabel(payload.value)}
                </text>
            </g>
        );
    };

    // Removed getMetricSummary as usage was removed

    const handleExportExcel = async () => {
        const today = new Date().toLocaleDateString('vi-VN');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Báo Cáo Tổng Hợp');

        // Main Title Row
        worksheet.addRow([`BÁO CÁO PHÂN TÍCH XU HƯỚNG BỆNH MÃN TÍNH - ${today}`]);
        worksheet.mergeCells('A1:E1');
        const titleRow = worksheet.getRow(1);
        titleRow.font = { name: 'Arial', family: 4, size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
        titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } }; // sky-600
        titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
        titleRow.height = 30;

        // Header Row
        const headerRow = worksheet.addRow([
            'Nhóm Bệnh',
            'Số Ca Mắc',
            'Chỉ Số Trung Bình',
            'Biến Động Rủi Ro',
            'Đánh Giá Tổng Quan'
        ]);

        headerRow.font = { bold: true, color: { argb: 'FF1E293B' } }; // slate-800
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // slate-100
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 25;

        // Column Widths
        worksheet.columns = [
            { width: 30 }, // Disease
            { width: 15 }, // Cases
            { width: 30 }, // Avg Index
            { width: 20 }, // Risk Var
            { width: 35 }  // Assessment
        ];

        // Data Rows
        const dataToExport = mainStats.diseaseAnalytics || [];
        dataToExport.forEach((item: any) => {
            const row = worksheet.addRow([
                item.diseaseName,
                `${item.totalCases} ca`,
                item.averageIndex,
                item.riskVariation,
                item.assessment
            ]);
            row.alignment = { vertical: 'middle' };

            // Color code the risk variation
            const riskVarCell = row.getCell(4);
            if (item.riskVariation.startsWith('-')) {
                riskVarCell.font = { color: { argb: 'FF10B981' }, bold: true }; // emerald-500
            } else {
                riskVarCell.font = { color: { argb: 'FFEF4444' }, bold: true }; // red-500
            }

            // Status Assessment Color
            const assessmentCell = row.getCell(5);
            if (item.assessment === 'Tốt' || item.assessment === 'Ổn định') {
                assessmentCell.font = { color: { argb: 'FF10B981' }, bold: true };
            } else if (item.assessment.includes('Rủi ro') || item.assessment.includes('Lưu ý')) {
                assessmentCell.font = { color: { argb: 'FFEF4444' }, bold: true };
            } else {
                assessmentCell.font = { color: { argb: 'FFF59E0B' }, bold: true }; // amber-500
            }
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
        link.download = `Bao_cao_dich_te_${today.replace(/\//g, '-')}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex min-h-screen font-display bg-background-light dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased italic-none">
            <ClinicSidebar isSidebarOpen={isSidebarOpen} />

            <div className="lg:ml-72 min-h-screen flex-1 flex flex-col bg-background-light dark:bg-slate-950">
                <TopBar
                    setIsSidebarOpen={setIsSidebarOpen}
                    notifications={notifications}
                    setNotifications={setNotifications}
                />

                <div className="p-4 md:p-8 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 italic-none">
                        <div className="space-y-1">
                            {isLoading ? (
                                <>
                                    <div className="h-7 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-48"></div>
                                    <div className="h-4 bg-slate-100 dark:bg-slate-800 animate-pulse rounded w-64 mt-2"></div>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Báo cáo Tổng hợp</h2>
                                    <p className="text-[13px] md:text-sm font-medium text-slate-500 italic-none">Xem và xuất dữ liệu báo cáo hoạt động phòng khám</p>
                                </>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                            {isLoading ? (
                                <>
                                    <div className="w-40 h-10 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl"></div>
                                    <div className="w-48 h-10 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl"></div>
                                </>
                            ) : (
                                <>
                                    <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1 rounded-xl gap-1 border border-primary/5">
                                        <button
                                            onClick={() => setReportTimeRange('7 ngày')}
                                            className={`px-5 py-2 text-[13px] font-bold rounded-lg transition-all ${reportTimeRange === '7 ngày' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-700'}`}
                                        >
                                            7 ngày
                                        </button>
                                        <button
                                            onClick={() => setReportTimeRange('30 ngày')}
                                            className={`px-5 py-2 text-[13px] font-bold rounded-lg transition-all ${reportTimeRange === '30 ngày' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-700'}`}
                                        >
                                            30 ngày
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleExportExcel}
                                            className="flex items-center gap-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all shadow-sm whitespace-nowrap"
                                        >
                                            <span className="material-symbols-outlined text-[20px] text-emerald-500">upload_file</span>
                                            Excel
                                        </button>
                                        <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all shadow-sm whitespace-nowrap">
                                            <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                                            PDF
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 italic-none mb-6">
                        {isLoading ? (
                            [...Array(4)].map((_, i) => (
                                <div key={i} className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-sm animate-pulse border border-slate-200/60 dark:border-slate-800/60 space-y-4 h-[180px] flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                                            <div className="w-12 h-5 bg-slate-50 dark:bg-slate-800 rounded-full"></div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-32"></div>
                                            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                                </div>
                            ))
                        ) : (
                            <>
                                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center text-rose-600">
                                            <span className="material-symbols-outlined size-6" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                                        </div>
                                        <span className="text-rose-500 text-xs font-bold">Cần chú ý</span>
                                    </div>
                                    <h3 className="text-[14px] font-medium text-slate-500">Bệnh nhân Nguy cơ cao</h3>
                                    <p className="text-3xl font-black mt-1 text-slate-900 dark:text-white">{mainStats.highRiskAlerts} <span className="text-sm font-bold text-slate-400">ca</span></p>
                                    <p className="text-[13px] text-rose-500 mt-2 font-medium flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">trending_up</span>
                                        {stats?.highRiskGrowth || '+0 ca'}
                                    </p>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600">
                                            <span className="material-symbols-outlined size-6" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                                        </div>
                                        <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-[12px] font-bold">{mainStats.adherenceRate > 85 ? 'Tốt' : 'TB'}</div>
                                    </div>
                                    <h3 className="text-[14px] font-medium text-slate-500">Tỷ lệ Tuân thủ</h3>
                                    <p className="text-3xl font-black mt-1 text-slate-900 dark:text-white">{mainStats.adherenceRate.toFixed(1)}%</p>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600">
                                            <span className="material-symbols-outlined size-6" style={{ fontVariationSettings: "'FILL' 1" }}>health_and_safety</span>
                                        </div>
                                        <div className="text-emerald-500 text-xs font-bold flex items-center gap-0.5">
                                            <span className="material-symbols-outlined text-[14px]">trending_up</span>
                                            +4.2%
                                        </div>
                                    </div>
                                    <h3 className="text-slate-500 text-sm font-medium">Tỷ lệ Cải thiện</h3>
                                    <p className="text-3xl font-black mt-1 text-slate-900 dark:text-white">{mainStats.improvementRate.toFixed(1)}%</p>
                                    <p className="text-[12px] text-slate-400 mt-2 font-medium">Chuyển sang nhóm ổn định</p>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-500">
                                            <span className="material-symbols-outlined size-6" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                                        </div>
                                        <span className="text-slate-400 text-xs font-bold font-display text-[11px] uppercase tracking-wider tabular-nums">TB 15p</span>
                                    </div>
                                    <h3 className="text-[14px] font-medium text-slate-500">Thời gian khám trung bình</h3>
                                    <p className="text-3xl font-black mt-1 text-slate-900 dark:text-white">{mainStats.avgConsultationTime.toFixed(1)} <span className="text-sm font-bold text-slate-400">phút</span></p>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all duration-300 hover:shadow-md">
                                {isLoading ? (
                                    <div className="animate-pulse space-y-10">
                                        <div className="flex justify-between items-center">
                                            <div className="space-y-3">
                                                <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-48"></div>
                                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-64"></div>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="w-20 h-4 bg-slate-100 dark:bg-slate-800 rounded"></div>
                                                <div className="w-20 h-4 bg-slate-100 dark:bg-slate-800 rounded"></div>
                                            </div>
                                        </div>
                                        <div className="h-64 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                                            <div className="absolute inset-0 flex items-end justify-around px-4">
                                                {[1, 2, 3, 4, 5, 6].map(i => (
                                                    <div key={i} className="w-5 bg-slate-100 dark:bg-slate-800 rounded-t-full" style={{ height: `${20 + (i * 10)}%` }}></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                                            <div>
                                                <h3 className="text-[18px] font-bold text-slate-900 dark:text-white tracking-tight">Thống kê xu hướng</h3>
                                                <p className="text-[15px] text-slate-500 font-medium italic-none">Dữ liệu phân tích theo {selectedChartMetric.toLowerCase()}</p>
                                            </div>
                                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700/50">
                                                {['Lượng bệnh nhân', 'Tải lượng bác sĩ', 'Chỉ số rủi ro'].map((m) => (
                                                    <button
                                                        key={m}
                                                        onClick={() => setSelectedChartMetric(m)}
                                                        className={`px-3 py-1.5 text-[13px] font-bold rounded-lg transition-all ${selectedChartMetric === m
                                                            ? `bg-white dark:bg-slate-700 ${selectedChartMetric === 'Chỉ số rủi ro' ? 'text-red-500' : selectedChartMetric === 'Tải lượng bác sĩ' ? 'text-emerald-500' : 'text-primary'} shadow-sm font-bold border border-slate-200/60`
                                                            : 'text-slate-600 hover:text-slate-700'
                                                            }`}
                                                    >
                                                        {m}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="h-[300px] w-full mt-4">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={mainStats.chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="colorValueClinic" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={selectedChartMetric === 'Chỉ số rủi ro' ? '#ef4444' : selectedChartMetric === 'Tải lượng bác sĩ' ? '#10b981' : '#0ea5e9'} stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor={selectedChartMetric === 'Chỉ số rủi ro' ? '#ef4444' : selectedChartMetric === 'Tải lượng bác sĩ' ? '#10b981' : '#0ea5e9'} stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203, 213, 225, 0.4)" />
                                                    <XAxis
                                                        dataKey="month"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={<CustomXAxisTick length={mainStats.chartData.length} />}
                                                        interval={mainStats.chartData.length > 15 ? 6 : 0}
                                                    />
                                                    <YAxis hide domain={['auto', 'auto']} />
                                                    <Tooltip
                                                        content={<CustomTooltip />}
                                                        cursor={{ stroke: selectedChartMetric === 'Chỉ số rủi ro' ? '#ef4444' : selectedChartMetric === 'Tải lượng bác sĩ' ? '#10b981' : '#0ea5e9', strokeWidth: 1, strokeDasharray: '4 4' }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="value"
                                                        stroke={selectedChartMetric === 'Chỉ số rủi ro' ? '#ef4444' : selectedChartMetric === 'Tải lượng bác sĩ' ? '#10b981' : '#0ea5e9'}
                                                        strokeWidth={4}
                                                        fillOpacity={1}
                                                        fill="url(#colorValueClinic)"
                                                        animationDuration={1500}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-50 dark:border-slate-800/50 mt-8">
                                            {[
                                                selectedChartMetric === 'Lượng bệnh nhân' ? { label: 'Tăng trưởng', value: mainStats.patientGrowth, trend: mainStats.patientGrowth.startsWith('+'), icon: 'show_chart' } :
                                                    selectedChartMetric === 'Tải lượng bác sĩ' ? { label: 'Tổng lượt khám', value: mainStats.docTotal, trend: true, icon: 'medical_services' } :
                                                        { label: 'Tỷ lệ rủi ro', value: mainStats.riskRate, trend: false, icon: 'emergency_home' },

                                                selectedChartMetric === 'Lượng bệnh nhân' ? { label: 'Trung bình', value: mainStats.growthStats?.average || '0 ca/tháng', icon: 'analytics' } :
                                                    selectedChartMetric === 'Tải lượng bác sĩ' ? { label: 'TB/Bác sĩ', value: mainStats.docAvg, icon: 'person_apron' } :
                                                        { label: 'Mới phát hiện', value: mainStats.riskAvg, icon: 'new_releases' },

                                                selectedChartMetric === 'Lượng bệnh nhân' ? { label: 'Tháng đỉnh điểm', value: mainStats.growthStats?.peakMonth || 'Chưa cập nhật', icon: 'leaderboard' } :
                                                    selectedChartMetric === 'Tải lượng bác sĩ' ? { label: 'Tháng cao điểm', value: mainStats.docPeak, icon: 'calendar_month' } :
                                                        { label: 'Số ca cảnh báo', value: mainStats.riskTotal, icon: 'task_alt' }
                                            ].map((item, idx) => (
                                                <div key={idx} className={`flex flex-col items-center ${idx === 1 ? 'border-x border-slate-100 dark:border-slate-800/50' : ''}`}>
                                                    <p className="text-[14px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">
                                                        <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                                                        {item.label}
                                                    </p>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-[16px] font-black ${selectedChartMetric === 'Chỉ số rủi ro' ? 'text-rose-500' :
                                                            selectedChartMetric === 'Tải lượng bác sĩ' ? 'text-emerald-500' :
                                                                'text-primary'
                                                            }`}>
                                                            {item.value}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all duration-300 hover:shadow-md overflow-hidden flex-1">
                                <div className="flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-[18px] font-bold text-slate-900 dark:text-white tracking-tight">Phân tích tình trạng</h3>
                                            <p className="text-[14px] text-slate-500 font-medium">Chỉ số biến động sức khỏe cộng đồng</p>
                                        </div>

                                    </div>

                                    <div className="flex-1 min-h-[120px] w-full mt-2 -mx-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart
                                                data={mainStats?.riskIndexChart && mainStats.riskIndexChart.length > 0 ? mainStats.riskIndexChart.map((d: any) => ({ v: d.value || 0 })) : [{ v: 0 }, { v: 0 }]}
                                                margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                                            >
                                                <defs>
                                                    <linearGradient id="colorMainPulse" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <Area
                                                    type="monotone"
                                                    dataKey="v"
                                                    stroke="#0ea5e9"
                                                    strokeWidth={5}
                                                    fillOpacity={1}
                                                    fill="url(#colorMainPulse)"
                                                    animationDuration={3000}
                                                    strokeLinecap="round"
                                                    dot={false}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="flex items-center justify-around mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                                        <div className="text-center">
                                            <p className="text-[15px] font-medium text-slate-600">Tuân thủ</p>
                                            <p className="text-[18px] font-black text-slate-800 dark:text-white">
                                                {mainStats?.adherenceRate ? (mainStats.adherenceRate * 100).toFixed(0) : 0}%
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[15px] font-medium text-slate-600">Xu hướng Rủi ro</p>
                                            <p className={`text-[18px] font-black flex items-center justify-center gap-1 ${mainStats?.highRiskGrowth?.startsWith('-') ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                <span className="material-symbols-outlined text-[20px] font-black">
                                                    {mainStats?.highRiskGrowth?.startsWith('-') ? 'trending_down' : 'trending_up'}
                                                </span>
                                                {mainStats?.highRiskGrowth?.startsWith('-') ? 'Giảm' : 'Tăng'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all duration-300 hover:shadow-md flex flex-col">
                            {isLoading ? (
                                <div className="w-full animate-pulse space-y-10">
                                    <div className="space-y-3 text-left">
                                        <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-48"></div>
                                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-32"></div>
                                    </div>
                                    <div className="h-64 bg-slate-50 dark:bg-slate-800/20 rounded-xl"></div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col">
                                    <div className="w-full text-left mb-6">
                                        <h3 className="text-[18px] font-bold text-slate-900 dark:text-white tracking-tight">So sánh mức độ rủi ro</h3>
                                        <p className="text-[15px] text-slate-500 font-medium italic-none">Phân tích chi tiết rủi ro theo từng nhóm bệnh</p>
                                    </div>

                                    <div className="flex-1 space-y-8 mt-4 overflow-y-auto pr-2 custom-scrollbar">
                                        {mainStats.diseaseRatios.map((item: any, i: number) => {
                                            const stablePx = parseInt(item.stableRate) || 0;
                                            const midPx = parseInt(item.midRate) || 0;
                                            const riskPx = parseInt(item.riskRate) || 0;
                                            const total = Math.max(stablePx + midPx + riskPx, 1);

                                            return (
                                                <div key={i} className="group animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                                    <div className="flex justify-between items-center mb-2.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-1.5 h-4 rounded-full ${item.color || 'bg-primary'}`}></div>
                                                            <span className="text-[14.5px] font-bold text-slate-800 dark:text-slate-200 tracking-tight">{item.label}</span>
                                                        </div>
                                                        <span className="text-[12.5px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-800">{item.percentage} tổng</span>
                                                    </div>

                                                    <div className="relative h-4 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden flex shadow-inner border border-slate-50 dark:border-slate-800">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000 ease-out relative group/seg"
                                                            style={{ width: `${(stablePx / total) * 100}%` }}
                                                        >
                                                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/seg:opacity-100 transition-opacity"></div>
                                                        </div>
                                                        <div
                                                            className="h-full bg-gradient-to-r from-amber-300 to-amber-400 transition-all duration-1000 ease-out delay-75 relative group/seg"
                                                            style={{ width: `${(midPx / total) * 100}%` }}
                                                        >
                                                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/seg:opacity-100 transition-opacity"></div>
                                                        </div>
                                                        <div
                                                            className="h-full bg-gradient-to-r from-rose-400 to-rose-500 transition-all duration-1000 ease-out delay-150 relative group/seg"
                                                            style={{ width: `${(riskPx / total) * 100}%` }}
                                                        >
                                                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/seg:opacity-100 transition-opacity"></div>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between mt-2 px-1">
                                                        <div className="flex gap-4">
                                                            <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">{stablePx}% <span className="text-slate-500 dark:text-slate-400 font-medium ml-0.5">Ổn định</span></span>
                                                            <span className="text-[13px] font-bold text-amber-600 dark:text-amber-400">{midPx}% <span className="text-slate-500 dark:text-slate-400 font-medium ml-0.5">Trung bình</span></span>
                                                            <span className="text-[13px] font-bold text-rose-600 dark:text-rose-400">{riskPx}% <span className="text-slate-500 dark:text-slate-400 font-medium ml-0.5">Rủi ro</span></span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center text-[14px] font-medium text-slate-500">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                <span>Ổn định</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                                                <span>Trung bình</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                                <span>Rủi ro cao</span>
                                            </div>
                                        </div>
                                        <button className="text-primary hover:underline transition-all">Chi tiết nhóm bệnh →</button>
                                    </div>

                                    <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-slate-50 dark:border-slate-800">
                                        <p className="text-[18px] font-bold text-slate-900 dark:text-white tracking-tight">Nhắc nhở</p>
                                        {[
                                            { icon: 'schedule', text: `${mainStats.highRiskAlerts || 2} bệnh nhân cần tái khám trong tuần`, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                                            { icon: 'monitoring', text: `Nhóm Tiểu đường có biến động rủi ro cao`, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
                                            { icon: 'task_alt', text: `${mainStats.diseaseRatios.length} nhóm bệnh đang được theo dõi`, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                                        ].map((item, idx) => (
                                            <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl ${item.bg} transition-all hover:scale-[1.01]`}>
                                                <span className={`material-symbols-outlined text-[18px] ${item.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                                                <p className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">{item.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all duration-300 hover:shadow-md relative z-10">
                        <div className="px-8 py-6 flex justify-between items-center border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10 rounded-t-2xl">
                            <div>
                                <h3 className="text-[18px] font-bold text-slate-900 dark:text-white tracking-tight">Phân tích xu hướng</h3>
                                <p className="text-[13px] text-slate-500 font-medium">Dữ liệu tổng hợp từ các chỉ số lâm sàng của bệnh nhân</p>
                            </div>
                            <div className="w-64">
                                <Dropdown
                                    options={[
                                        { label: 'Tất cả nhóm bệnh', value: 'Tất cả nhóm bệnh', icon: <span className="material-symbols-outlined text-[18px] text-slate-400">list</span> },
                                        { label: 'Nhóm Nguy cơ cao', value: 'Nhóm Nguy cơ cao', icon: <span className="material-symbols-outlined text-[18px] text-rose-500">error</span> },
                                        { label: 'Nhóm Ổn định', value: 'Nhóm Ổn định', icon: <span className="material-symbols-outlined text-[18px] text-emerald-500">check_circle</span> },
                                        { label: 'Nhóm đang theo dõi', value: 'Nhóm đang theo dõi', icon: <span className="material-symbols-outlined text-[18px] text-amber-500">visibility</span> }
                                    ]}
                                    value={activeFilter}
                                    onChange={setActiveFilter}
                                    icon={
                                        activeFilter === 'Nhóm Nguy cơ cao' ? <span className="material-symbols-outlined text-[18px] text-rose-500">error</span> :
                                            activeFilter === 'Nhóm Ổn định' ? <span className="material-symbols-outlined text-[18px] text-emerald-500">check_circle</span> :
                                                activeFilter === 'Nhóm đang theo dõi' ? <span className="material-symbols-outlined text-[18px] text-amber-500">visibility</span> :
                                                    <span className="material-symbols-outlined text-[18px] text-slate-400">filter_list</span>
                                    }
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto rounded-b-2xl">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-800/30 font-display border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-8 py-5 text-[15px] font-medium text-slate-700">Nhóm bệnh mãn tính</th>
                                        <th className="px-8 py-5 text-[15px] font-medium text-slate-700">Số ca mắc</th>
                                        <th className="px-8 py-5 text-[15px] font-medium text-slate-700">Chỉ số trung bình</th>
                                        <th className="px-8 py-5 text-[15px] font-medium text-slate-700 text-center">Biến động rủi ro</th>
                                        <th className="px-8 py-5 text-[15px] font-medium text-slate-700">Đánh giá chung</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {(() => {
                                        const list = (mainStats.diseaseAnalytics.length > 0 ? mainStats.diseaseAnalytics : []).filter((item: any) => {
                                            if (activeFilter === 'Tất cả nhóm bệnh') return true;
                                            if (activeFilter === 'Nhóm Nguy cơ cao') return item.statusColor === 'bg-rose-500' || (item.assessment && item.assessment.includes('Rủi ro'));
                                            if (activeFilter === 'Nhóm Ổn định') return item.statusColor === 'bg-emerald-500' || item.assessment === 'Ổn định';
                                            if (activeFilter === 'Nhóm đang theo dõi') return item.statusColor === 'bg-amber-500' || item.assessment === 'Cần lưu ý';
                                            return true;
                                        });

                                        if (list.length === 0) {
                                            const isPlaceholder = mainStats.diseaseAnalytics.length === 0;
                                            if (isPlaceholder) {
                                                return [
                                                    { diseaseName: 'Đang tải...', totalCases: 0, averageIndex: 'Chưa cập nhật', riskVariation: '0%', assessment: 'Chưa cập nhật', statusColor: 'bg-slate-400' }
                                                ].map((item: any, idx: number) => (
                                                    <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-2 h-8 rounded-full ${item.statusColor}`}></div>
                                                                <span className="font-bold text-slate-900 dark:text-white italic-none">{item.diseaseName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5 font-bold text-slate-700 dark:text-slate-300 tabular-nums">{item.totalCases} ca</td>
                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[14px] font-black text-slate-900 dark:text-white italic-none">{item.averageIndex.split(' ')[0]}</span>
                                                                <span className="text-[11px] font-bold text-slate-400 uppercase leading-none">{item.averageIndex.split(' ').slice(1).join(' ')}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5 text-center">
                                                            <span className={`text-[13px] font-bold px-3 py-1 rounded-lg ${item.riskVariation.startsWith('-') ? 'text-white bg-green-500 shadow-sm' : 'text-white bg-rose-500 shadow-sm'}`}>
                                                                {item.riskVariation} {item.riskVariation.startsWith('-') ? '↓' : '↑'}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[12px] font-bold px-3 py-1 rounded-full text-white shadow-sm bg-slate-500`}>
                                                                    {item.assessment}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ));
                                            }
                                            return (
                                                <tr>
                                                    <td colSpan={5} className="px-8 py-10 text-center text-slate-500 dark:text-slate-400 font-medium">
                                                        Không có nhóm bệnh nào thuộc nhóm này
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        return list.map((item: any, idx: number) => (
                                            <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-8 rounded-full ${item.statusColor}`}></div>
                                                        <span className="font-bold text-slate-900 dark:text-white italic-none">{item.diseaseName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 font-bold text-slate-700 dark:text-slate-300 tabular-nums">{item.totalCases} ca</td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[14px] font-black text-slate-900 dark:text-white italic-none">{item.averageIndex.split(' ')[0]}</span>
                                                        <span className="text-[11px] font-bold text-slate-400 uppercase leading-none">{item.averageIndex.split(' ').slice(1).join(' ')}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <span className={`text-[13px] font-bold px-3 py-1 rounded-lg ${item.riskVariation.startsWith('-') ? 'text-white bg-green-500 shadow-sm' : 'text-white bg-rose-500 shadow-sm'}`}>
                                                        {item.riskVariation} {item.riskVariation.startsWith('-') ? '↓' : '↑'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[12px] font-bold px-3 py-1 rounded-full text-white shadow-sm ${item.assessment === 'Ổn định' ? 'bg-emerald-500' :
                                                                item.assessment === 'Cần lưu ý' ? 'bg-amber-500' :
                                                                    item.assessment === 'Rủi ro cao' ? 'bg-rose-500' :
                                                                        'bg-slate-500'
                                                            }`}>
                                                            {item.assessment}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ));
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
