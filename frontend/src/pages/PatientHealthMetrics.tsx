import React, { useState, useEffect, useCallback } from 'react';
import AddHealthMetricModal from '../features/health-metrics/components/AddHealthMetricModal';
import Toast from '../components/ui/Toast';
import Dropdown from '../components/ui/Dropdown';
import { patientApi } from '../api/patient';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PatientHealthMetrics: React.FC = () => {
    const [activeTab, setActiveTab] = useState('WEEK');
    const [selectedMetric, setSelectedMetric] = useState('BLOOD_SUGAR');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState({ show: false, title: '', type: 'success' as 'success' | 'warning' | 'error' });

    const [summary, setSummary] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isChartLoading, setIsChartLoading] = useState(false);
    const [historyFilter, setHistoryFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 5; // Reduced page size for better UI balance

    const fetchHistory = useCallback(async (page: number) => {
        try {
            const res = await patientApi.getHistory(page, pageSize);
            if (res.success) {
                setHistory(res.data.content || []);
                setTotalPages(res.data.totalPages || 0);
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
        }
    }, [pageSize]);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const summaryRes = await patientApi.getMetricsSummary(activeTab);
            if (summaryRes.success) setSummary(summaryRes.data);
            await fetchHistory(currentPage);
        } catch (error: any) {
            const msg = error.response?.data?.message || error.message || 'Lỗi không xác định';
            console.error('Failed to fetch metrics data:', msg);
            setToast({ show: true, title: `Lỗi tải dữ liệu: ${msg}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, currentPage, fetchHistory]);

    const fetchChartData = useCallback(async () => {
        try {
            setIsChartLoading(true);
            const res = await patientApi.getChartData(selectedMetric, activeTab);
            if (res.success && res.data) {
                const formattedData = res.data.map((item: any) => ({
                    ...item,
                    label: new Date(item.measuredAt).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: activeTab !== 'DAY' ? '2-digit' : undefined,
                        month: activeTab !== 'DAY' ? '2-digit' : undefined,
                    }),
                    value: Number(item.value),
                    valueSecondary: item.valueSecondary ? Number(item.valueSecondary) : null
                }));
                setChartData(formattedData);
            }
        } catch (error) {
            console.error('Failed to fetch chart data:', error);
        } finally {
            setIsChartLoading(false);
        }
    }, [selectedMetric, activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        fetchChartData();
    }, [fetchChartData]);

    const handleSaveMetric = async (metricData: any) => {
        try {
            setIsSaving(true);
            const response = await patientApi.recordMetric({
                ...metricData,
                unit: determineUnit(metricData.metricType)
            });

            if (response.success) {
                setToast({
                    show: true,
                    title: 'Đã lưu chỉ số sức khỏe thành công!',
                    type: 'success'
                });
                setIsModalOpen(false);
                fetchData();
                fetchChartData();
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Lỗi không xác định';
            console.error('Failed to save metric:', msg);
            setToast({
                show: true,
                title: `Lưu thất bại: ${msg}`,
                type: 'error'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const determineUnit = (type: string) => {
        switch (type) {
            case 'BLOOD_PRESSURE': return 'mmHg';
            case 'BLOOD_SUGAR': return 'mmol/L';
            case 'HEART_RATE': return 'bpm';
            case 'HBA1C': case 'SPO2': return '%';
            default: return '';
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusVn = (status: string) => {
        switch (status) {
            case 'NORMAL': return 'Bình thường';
            case 'BORDERLINE_HIGH': return 'Cận cao';
            case 'HIGH': return 'Hơi cao';
            case 'LOW': return 'Thấp';
            default: return status;
        }
    };

    const getMetricIcon = (identifier: string | undefined | null) => {
        if (!identifier) return '';
        const type = String(identifier).toUpperCase().replace(' ', '_');
        if (type.includes('BLOOD_PRESSURE')) return 'vital_signs';
        if (type.includes('BLOOD_SUGAR')) return 'glucose';
        if (type.includes('HEART_RATE')) return 'favorite';
        if (type.includes('HBA1C')) return 'science';
        if (type.includes('SPO2')) return 'air';
        return 'analytics';
    };

    const getMetricNameVn = (identifier: string | undefined | null) => {
        if (!identifier) return '';
        const type = String(identifier).toUpperCase().replace(' ', '_');
        if (type.includes('BLOOD_PRESSURE')) return 'Huyết áp';
        if (type.includes('BLOOD_SUGAR')) return 'Đường huyết';
        if (type.includes('HEART_RATE')) return 'Nhịp tim';
        if (type.includes('HBA1C')) return 'Điểm HbA1c';
        if (type.includes('SPO2')) return 'Nồng độ Oxy (SpO2)';
        return String(identifier);
    };

    const getMetricColor = (metric: string) => {
        if (metric === 'BLOOD_PRESSURE') return '#f97316';
        return '#3bb9f3'; // Matching admin's signature sky blue style
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            // Filter out the duplicated entries and handle ranges
            const filteredPayload = payload.filter((entry: any) => {
                // If it's a range area (array value), it often shows up twice. 
                // We prefer entries with individual names like 'Tâm thu' or 'Chỉ số'.
                return !Array.isArray(entry.value);
            });

            return (
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 border border-primary/10 rounded-xl shadow-xl flex flex-col gap-2 min-w-[150px]">
                    <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1 mb-1">{label}</p>
                    <div className="space-y-1.5">
                        {filteredPayload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.stroke }} />
                                    <span className="text-[13px] font-medium text-slate-600 dark:text-slate-300">
                                        {entry.name || 'Chỉ số'}
                                    </span>
                                </div>
                                <span className="text-[13px] font-bold text-slate-900 dark:text-white">
                                    {entry.value}
                                    <span className="text-[11px] ml-1 font-normal text-slate-400">
                                        {selectedMetric === 'BLOOD_PRESSURE' ? 'mmHg' : determineUnit(selectedMetric)}
                                    </span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700 font-display">
            {/* Title and CTA */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-left">
                <div>
                    <h2 className="text-[26px] font-black text-slate-900 dark:text-white tracking-tight">Chỉ số sức khỏe</h2>
                    <p className="text-slate-500 mt-1">Theo dõi các chỉ số sinh tồn của bạn trong thời gian thực</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95 font-display"
                >
                    <span className="material-symbols-outlined font-bold">add_circle</span>
                    Nhập chỉ số mới
                </button>
            </div>

            {/* Filter removed from here, will be inside the chart card to match admin style */}

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-left">
                {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                        <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse border border-primary/5"></div>
                    ))
                ) : (
                    summary.map((item, idx) => (
                        <div key={idx} className={`bg-white dark:bg-slate-900 p-4 rounded-xl border ${idx === 0 ? 'border-primary ring-2 ring-primary/10' : 'border-primary/10'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2 rounded-lg ${item.metricType === 'BLOOD_PRESSURE' ? 'bg-orange-100 text-orange-600' :
                                    item.metricType === 'HEART_RATE' ? 'bg-red-100 text-red-600' :
                                        item.metricType === 'HBA1C' ? 'bg-purple-100 text-purple-600' :
                                            item.metricType === 'SPO2' ? 'bg-cyan-100 text-cyan-600' : 'bg-primary/10 text-primary'
                                    }`}>
                                    <span className="material-symbols-outlined text-xl font-bold">{item.icon}</span>
                                </div>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full tracking-wide ${item.status === 'NORMAL' ? 'bg-primary/10 text-primary' : 'bg-orange-100 text-orange-600'
                                    }`}>
                                    {getStatusVn(item.status)}
                                </span>
                            </div>
                            <p className="text-slate-500 text-[15px] font-medium ">{getMetricNameVn(item.metricType)}</p>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-2xl font-black text-slate-900 dark:text-white">
                                    {item.latestValue}
                                    {item.latestValueSecondary ? `/${item.latestValueSecondary}` : ''}
                                </span>
                                <span className="text-[13px] text-slate-500 font-medium">{item.unit}</span>
                            </div>
                            <div className={`mt-2 flex items-center gap-1 ${item.trend === 'UP' ? 'text-orange-600' : item.trend === 'DOWN' ? 'text-primary' : 'text-slate-400'}`}>
                                <span className="material-symbols-outlined text-sm font-bold">
                                    {item.trend === 'UP' ? 'trending_up' : item.trend === 'DOWN' ? 'trending_down' : 'horizontal_rule'}
                                </span>
                                <span className="text-xs font-bold">{item.changePercentage} so với lần trước</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Chart and Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative group/chart overflow-hidden text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                        <div>
                            <h3 className="text-[19px] font-bold text-slate-900 dark:text-white tracking-tight">Phân tích xu hướng</h3>
                            <p className="text-[15px] text-slate-500 mt-1 font-medium italic-none">Báo cáo chi tiết theo {getMetricNameVn(selectedMetric).toLowerCase()}</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                {['DAY', 'WEEK', 'MONTH', 'YEAR'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-1.5 text-[13px] font-bold rounded-lg transition-all ${activeTab === tab
                                            ? 'bg-white dark:bg-slate-700 text-[#3bb9f3] shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        {tab === 'DAY' ? 'Ngày' : tab === 'WEEK' ? 'Tuần' : tab === 'MONTH' ? 'Tháng' : 'Năm'}
                                    </button>
                                ))}
                            </div>
                            <Dropdown
                                options={[
                                    { label: 'Đường huyết', value: 'BLOOD_SUGAR' },
                                    { label: 'Huyết áp', value: 'BLOOD_PRESSURE' },
                                    { label: 'Nhịp tim', value: 'HEART_RATE' },
                                    { label: 'HbA1c', value: 'HBA1C' },
                                    { label: 'Nồng độ Oxy', value: 'SPO2' }
                                ]}
                                value={selectedMetric}
                                onChange={setSelectedMetric}
                                className="w-full sm:w-52"
                            />
                        </div>
                    </div>
                    <div className="h-[300px] w-full relative">
                        {isChartLoading && (
                            <div className="absolute inset-0 z-10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-4 border-[#3bb9f3] border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-[13px] font-medium text-slate-500">Đang tải dữ liệu...</p>
                                </div>
                            </div>
                        )}
                        {chartData.length === 0 && !isChartLoading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 font-bold opacity-50">
                                <span className="material-symbols-outlined text-4xl mb-2">bar_chart</span>
                                <p>Chưa có dữ liệu cho khoảng thời gian này</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 40 }}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={getMetricColor(selectedMetric)} stopOpacity={0.2} />
                                            <stop offset="95%" stopColor={getMetricColor(selectedMetric)} stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorValueSecondary" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4ade80" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203, 213, 225, 0.4)" />
                                    <XAxis
                                        dataKey="label"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#475569', fontSize: 13, fontWeight: 500 }}
                                        dy={22}
                                        textAnchor="middle"
                                        minTickGap={60}
                                        interval="preserveStartEnd"
                                        padding={{ left: 0, right: 0 }}
                                    />
                                    <YAxis
                                        hide
                                        domain={['auto', 'auto']}
                                    />
                                    <Tooltip
                                        content={<CustomTooltip />}
                                        cursor={{ stroke: getMetricColor(selectedMetric), strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />
                                    {selectedMetric === 'BLOOD_PRESSURE' ? (
                                        <>
                                            <Area
                                                type="monotone"
                                                dataKey={(d: any) => [d.valueSecondary, d.value]}
                                                stroke="none"
                                                fill="url(#colorValue)"
                                                fillOpacity={0.4}
                                                animationDuration={2000}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke={getMetricColor('BLOOD_PRESSURE')}
                                                strokeWidth={4}
                                                fill="none"
                                                dot={{ r: 4, fill: getMetricColor('BLOOD_PRESSURE'), stroke: '#fff', strokeWidth: 2 }}
                                                activeDot={{ r: 7, fill: getMetricColor('BLOOD_PRESSURE'), stroke: '#fff', strokeWidth: 3 }}
                                                name="Tâm thu"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="valueSecondary"
                                                stroke="#4ade80"
                                                strokeWidth={4}
                                                fill="none"
                                                dot={{ r: 4, fill: '#4ade80', stroke: '#fff', strokeWidth: 2 }}
                                                activeDot={{ r: 7, fill: '#4ade80', stroke: '#fff', strokeWidth: 3 }}
                                                name="Tâm trương"
                                            />
                                        </>
                                    ) : (
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke={getMetricColor(selectedMetric)}
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#colorValue)"
                                            animationDuration={2000}
                                            name={getMetricNameVn(selectedMetric)}
                                            dot={{
                                                r: 5,
                                                fill: getMetricColor(selectedMetric),
                                                stroke: '#fff',
                                                strokeWidth: 2
                                            }}
                                            activeDot={{
                                                r: 7,
                                                fill: getMetricColor(selectedMetric),
                                                stroke: '#fff',
                                                strokeWidth: 3,
                                                style: { cursor: 'pointer' }
                                            }}
                                        />
                                    )}
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-xl border border-primary/20 flex flex-col font-display">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-primary font-bold">auto_awesome</span>
                        <h3 className="font-bold text-slate-900 dark:text-white">Phân tích từ AI & Bác sĩ</h3>
                    </div>
                    <div className="space-y-4 flex-1">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-primary/5">
                            <p className="text-sm text-slate-600 dark:text-slate-300 italic font-bold leading-relaxed">
                                {summary.length > 0 && summary.find(s => s.metricType === 'BLOOD_PRESSURE')?.status !== 'NORMAL'
                                    ? "Chỉ số huyết áp của bạn đang hơi cao. Hãy chú ý nghỉ ngơi và hạn chế muối."
                                    : "Các chỉ số hiện tại của bạn đang nằm trong ngưỡng ổn định. Duy trì chế độ ăn uống này."
                                }
                            </p>
                            <div className="mt-3 flex items-center gap-2">
                                <div className="size-6 bg-primary rounded-full flex items-center justify-center text-[10px] text-white font-bold leading-none">AI</div>
                                <p className="text-[10px] font-extrabold text-slate-500 tracking-widest">Hệ thống phân tích Damian</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent History Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-primary/10 overflow-hidden text-left font-display">
                <div className="p-6 border-b border-primary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Lịch sử nhập liệu gần đây</h3>
                    <div className="flex flex-wrap items-center gap-3">
                        <Dropdown
                            options={[
                                { label: 'Tất cả chỉ số', value: 'ALL' },
                                { label: 'Huyết áp', value: 'BLOOD_PRESSURE' },
                                { label: 'Đường huyết', value: 'BLOOD_SUGAR' },
                                { label: 'Nhịp tim', value: 'HEART_RATE' },
                                { label: 'HbA1c', value: 'HBA1C' },
                                { label: 'Nồng độ Oxy', value: 'SPO2' }
                            ]}
                            value={historyFilter}
                            onChange={setHistoryFilter}
                            className="w-full sm:w-44"
                        />
                        <Dropdown
                            options={[
                                { label: 'Tất cả trạng thái', value: 'ALL' },
                                { label: 'Bình thường', value: 'NORMAL' },
                                { label: 'Cận cao', value: 'BORDERLINE_HIGH' },
                                { label: 'Cao', value: 'HIGH' },
                                { label: 'Thấp', value: 'LOW' }
                            ]}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            className="w-full sm:w-44"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto overflow-y-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-background-light dark:bg-slate-800/50">
                                <th className="px-6 py-3 text-[13px] font-bold text-slate-500 uppercase">Thời gian</th>
                                <th className="px-6 py-3 text-[13px] font-bold text-slate-500 uppercase">Chỉ số</th>
                                <th className="px-6 py-3 text-[13px] font-bold text-slate-500 uppercase">Giá trị</th>
                                <th className="px-6 py-3 text-[13px] font-bold text-slate-500 uppercase">Trạng thái</th>
                                <th className="px-6 py-3 text-[13px] font-bold text-slate-500 uppercase">Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5">
                            {isLoading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i}><td colSpan={5} className="px-6 py-4 animate-pulse bg-slate-50 dark:bg-slate-800/50 h-10"></td></tr>
                                ))
                            ) : history.filter(row => {
                                const matchType = historyFilter === 'ALL' || row.metricType === historyFilter;
                                const matchStatus = statusFilter === 'ALL' || row.status === statusFilter;
                                return matchType && matchStatus;
                            }).length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-bold">Không tìm thấy dữ liệu khớp với bộ lọc</td></tr>
                            ) : history.filter(row => {
                                const matchType = historyFilter === 'ALL' || row.metricType === historyFilter;
                                const matchStatus = statusFilter === 'ALL' || row.status === statusFilter;
                                return matchType && matchStatus;
                            }).map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{formatDate(row.measuredAt)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span className={`material-symbols-outlined text-[18px] font-bold ${String(row.metricType).includes('BLOOD_PRESSURE') ? 'text-orange-500' :
                                                String(row.metricType).includes('BLOOD_SUGAR') ? 'text-primary' :
                                                    String(row.metricType).includes('HEART_RATE') ? 'text-red-500' :
                                                        String(row.metricType).includes('HBA1C') ? 'text-purple-500' :
                                                            String(row.metricType).includes('SPO2') ? 'text-cyan-500' : 'text-slate-400'
                                                }`}>
                                                {getMetricIcon(row.metricType || row.metricDisplayName)}
                                            </span>
                                            <span className="text-sm text-slate-600 font-medium">{getMetricNameVn(row.metricType || row.metricDisplayName || '')}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">
                                        {row.value}{row.valueSecondary ? `/${row.valueSecondary}` : ''} {row.unit}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-[12px] font-bold rounded-full ${row.status === 'NORMAL' ? 'bg-primary/10 text-primary' : 'bg-orange-100 text-orange-600'
                                            }`}>
                                            {getStatusVn(row.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 truncate max-w-[200px] font-medium">{row.notes || 'Không có ghi chú'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="px-6 py-4 border-t border-primary/5 flex items-center justify-end bg-white dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                            disabled={currentPage === 0}
                            className="p-2 rounded-md text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                        </button>
                        <span className="px-3 py-1.5 min-w-[90px] text-center rounded-full bg-primary text-white text-[13px] font-bold shadow-md tracking-tight whitespace-nowrap">
                            Trang {currentPage + 1}/{totalPages || 1}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={currentPage >= totalPages - 1}
                            className="p-2 rounded-md text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            <AddHealthMetricModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveMetric}
                isSaving={isSaving}
                initialType={selectedMetric}
                lastValues={summary.reduce((acc, item) => {
                    acc[item.metricType] = { 
                        value: item.latestValue, 
                        valueSecondary: item.latestValueSecondary 
                    };
                    return acc;
                }, {} as any)}
            />

            <Toast
                show={toast.show}
                title={toast.title}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </div>
    );
};

export default PatientHealthMetrics;
