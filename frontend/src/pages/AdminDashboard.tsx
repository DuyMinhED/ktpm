import { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import AdminLayout from '../layouts/AdminLayout';
import Dropdown from '../components/ui/Dropdown';
import CreateClinicModal from '../features/admin/components/CreateClinicModal';
import Toast from '../components/ui/Toast';
import { adminApi } from '../api/admin';
import { clinicApi } from '../api/clinic';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function AdminDashboard() {
  const [selectedChartMetric, setSelectedChartMetric] = useState('Lượng bệnh nhân');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastTitle, setToastTitle] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [clinics, setClinics] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('DAY'); // 'DAY' or 'MONTH'
  const [isLoadingChart, setIsLoadingChart] = useState(true);

  useEffect(() => {
    fetchDashboardData(timeRange, selectedChartMetric);
  }, [timeRange, selectedChartMetric]);

  const fetchDashboardData = async (range: string = 'DAY', metric: string = 'Lượng bệnh nhân') => {
    setIsLoadingChart(true);
    try {
      const res = await adminApi.getDashboardData(range, metric);
      if (res && res.data) {
        setStats(res.data.stats);
        setClinics(res.data.clinicPerformances || []);
        setActivities(res.data.recentActivities || []);
        const processedChart = (res.data.chartData || []).map((item: any) => ({
          ...item,
          label: item.label.replace(/^Th\. /i, 'Tháng ')
        }));
        setChartData(processedChart);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoadingChart(false);
    }
  };

  // Custom Chart Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 p-3 md:p-4 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 ring-1 ring-slate-900/5">
          <p className="text-[13px] md:text-[14px] font-bold text-slate-800 dark:text-slate-200 mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <p className="text-[13px] md:text-[14px] font-bold text-[#3bb9f3]">
              {selectedChartMetric === 'Doanh thu'
                ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(payload[0].value)
                : selectedChartMetric === 'Tỷ lệ hài lòng'
                  ? `${payload[0].value}%`
                  : payload[0].value}
              <span className="text-slate-500 dark:text-slate-400 font-bold text-[12.5px] md:text-[14px] ml-1.5">
                {selectedChartMetric === 'Lượng bệnh nhân' && 'bệnh nhân'}
                {selectedChartMetric === 'Lượt đặt lịch' && 'lịch hẹn'}
                {selectedChartMetric === 'Tỷ lệ hài lòng' && 'hài lòng'}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomXAxisTick = ({ x, y, payload, index }: any) => {
    let textAnchor: "middle" | "start" | "end" = "middle";
    if (index === 0) textAnchor = "start";
    else if (index === 3) textAnchor = "end";

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={18}
          textAnchor={textAnchor}
          fill="#475569"
          fontSize={window.innerWidth > 1024 ? 14 : 11}
          fontWeight={500}
        >
          {payload.value}
        </text>
      </g>
    );
  };

  const handleExportExcel = async () => {
    const today = new Date().toLocaleDateString('vi-VN');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Báo Cáo Tổng Hợp');

    // Title Row
    worksheet.addRow([`BÁO CÁO HOẠT ĐỘNG TOÀN TUYẾN CƠ SỞ Y TẾ - NGÀY ${today}`]);
    worksheet.mergeCells('A1:G1');
    const titleRow = worksheet.getRow(1);
    titleRow.font = { name: 'Arial', family: 4, size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } }; // sky-600
    titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    titleRow.height = 30;

    // Header Row
    const headerRow = worksheet.addRow([
      'Mã Định Danh',
      'Tên Cơ Sở/Phòng Khám',
      'Liên Hệ',
      'Đội Ngũ Bác Sĩ',
      'Lượng Bệnh Nhân',
      'Tăng Trưởng',
      'Trạng Thái Kích Hoạt'
    ]);

    headerRow.font = { bold: true, color: { argb: 'FF1E293B' } }; // slate-800
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // slate-100
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // Default Widths
    worksheet.columns = [
      { width: 18 },  // Code
      { width: 45 },  // Name
      { width: 20 },  // Phone
      { width: 18 },  // Doctors
      { width: 20 },  // Patients
      { width: 15 },  // Growth
      { width: 25 }   // Status
    ];

    // Data Binding from State
    clinics.forEach(c => {
      const displayStatus = c.status === 'ACTIVE' ? 'Hoạt động' : 'Ngưng hoạt động';
      const row = worksheet.addRow([
        c.clinicCode || c.id,
        c.name,
        c.phone || c.address,
        c.doctorCount || 0,
        c.patientCount || 0,
        c.growth || '0%',
        displayStatus
      ]);
      row.alignment = { vertical: 'middle', wrapText: true };

      const statusCell = row.getCell(7);
      if (c.status === 'ACTIVE') {
        statusCell.font = { color: { argb: 'FF10B981' }, bold: true };
      } else {
        statusCell.font = { color: { argb: 'FFEF4444' }, bold: true };
      }

      // Format growth column
      const growthCell = row.getCell(6);
      growthCell.font = { color: { argb: 'FF3B82F6' }, bold: true }; // blue-500
    });

    // Outer and Inner Borders
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

    // Execute Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Bao_cao_tong_hop_${today.replace(/\//g, '-')}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateClinic = async (data: any) => {
    setIsSaving(true);
    try {
      // Call Real API
      await clinicApi.createClinic({
        name: data.name,
        address: data.address,
        phone: data.phone,
        clinicCode: data.clinicCode,
        adminFullName: data.adminFullName,
        adminEmail: data.adminEmail,
        adminPassword: data.adminPassword,
        imageUrl: data.imageUrl
      });

      setToastTitle(`Đã khởi tạo hệ thống cho ${data.name} thành công!`);
    } catch (error) {
      console.error('Failed to create clinic:', error);
      setToastTitle(`Lỗi tạo phòng khám (Chế độ Mock được kích hoạt)`);
    } finally {
      setIsSaving(false);
      setIsCreateModalOpen(false);
      setShowToast(true);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-700 font-display text-left">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex-1 min-w-0">
            {!stats ? (
              <div className="space-y-3">
                <div className="h-8 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-48 sm:w-72"></div>
                <div className="h-4 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded w-64 sm:w-96"></div>
              </div>
            ) : (
              <>
                <h2 className="text-lg md:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">Tổng quan</h2>
                <p className="text-[13px] md:text-[16px] text-slate-500 mt-1 font-medium italic-none">Theo dõi hiệu suất vận hành hệ thống</p>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {!stats ? (
              <>
                <div className="w-32 h-10 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg shadow-sm"></div>
                <div className="w-32 h-10 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-lg shadow-sm"></div>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-primary text-white rounded-xl font-bold transition-all text-[12px] md:text-[13px] shadow-lg shadow-primary/20 hover:shadow-primary/30 whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[16px] md:text-[18px]">add</span>
                  Thêm phòng khám
                </button>
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl font-bold transition-all text-[12px] md:text-[13px] border border-primary/10 shadow-sm whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[16px] md:text-[18px]">ios_share</span>
                  Xuất báo cáo
                </button>
              </>
            )}
          </div>
        </div>

        {/* Summary Cards Bento Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {!stats ? (
            // Skeleton Summary Cards
            [...Array(4)].map((_, idx) => (
              <div key={`summary-skeleton-${idx}`} className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-primary/5 shadow-sm animate-pulse text-left">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                  <div className="w-10 h-5 bg-slate-50 dark:bg-slate-800 rounded-lg"></div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24"></div>
                  <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
                </div>
              </div>
            ))
          ) : (
            <>
              {/* Card 1 */}
              <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-primary/5 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center text-emerald-600">
                    <span className="material-symbols-outlined text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
                  </div>
                  <span className="text-[12px] md:text-[13.5px] font-black text-white bg-emerald-500 px-2.5 py-1 rounded-lg">{stats?.patientGrowth || '+0%'}</span>
                </div>
                <div className="mt-2 md:mt-4">
                  <h3 className="text-xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{stats?.totalPatients || 0}</h3>
                  <p className="text-slate-500 text-[12.5px] md:text-[16.5px] font-medium mt-1.5 font-display">Tổng số bệnh nhân</p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-primary/5 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-blue-600">
                    <span className="material-symbols-outlined text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>apartment</span>
                  </div>
                  <span className="text-[12px] md:text-[13.5px] font-black text-white bg-blue-500 px-2.5 py-1 rounded-lg">{stats?.clinicTrend || 'Ổn định'}</span>
                </div>
                <div className="mt-2 md:mt-4">
                  <h3 className="text-xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{stats?.activeClinics || 0}</h3>
                  <p className="text-slate-500 text-[12.5px] md:text-[16.5px] font-medium mt-1.5 font-display">Phòng khám hoạt động</p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-primary/5 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600">
                    <span className="material-symbols-outlined text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>stethoscope</span>
                  </div>
                  <span className="text-[12px] md:text-[13.5px] font-black text-white bg-indigo-500 px-2.5 py-1 rounded-lg">{stats?.doctorTrend || '+0 mới'}</span>
                </div>
                <div className="mt-2 md:mt-4">
                  <h3 className="text-xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{stats?.totalDoctors || 0}</h3>
                  <p className="text-slate-500 text-[12.5px] md:text-[16.5px] font-medium mt-1.5 font-display">Đội ngũ Bác sĩ</p>
                </div>
              </div>

              {/* Card 4 - High Risk Level Style from Doctor */}
              <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-primary/5 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-red-200 dark:bg-red-900/50 rounded-xl flex items-center justify-center text-red-600">
                    <span className="material-symbols-outlined text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                  </div>
                  <span className="px-2.5 py-1 bg-red-500 text-white text-[12px] md:text-[13.5px] font-black rounded-full">Theo dõi</span>
                </div>
                <div className="mt-2 md:mt-4">
                  <h3 className="text-xl md:text-4xl font-black text-red-600 tracking-tight leading-none">{stats?.highRiskAlerts || 0}</h3>
                  <p className="text-slate-500 text-[12.5px] md:text-[16.5px] font-medium mt-1.5 font-display">Cảnh báo rủi ro cao</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Main Layout Section: Chart and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">
          {/* Chart Section (Placeholder for real charts) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-4 md:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative group/chart overflow-hidden text-left">
            <div className="flex flex-col gap-4 mb-6 md:mb-8">
              <div>
                {!stats ? (
                  <div className="space-y-2">
                    <div className="h-6 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-64"></div>
                    <div className="h-4 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded w-48"></div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-[14px] md:text-[19px] font-bold text-slate-900 dark:text-white tracking-tight">Thống kê vận hành hệ thống</h2>
                    <p className="text-[11px] md:text-[15px] text-slate-500 mt-1">Báo cáo chi tiết theo {selectedChartMetric.toLowerCase()}</p>
                  </>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 md:gap-6">
                {/* Time Range Selector */}
                {!stats ? (
                  <div className="w-40 h-10 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl"></div>
                ) : (
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      onClick={() => setTimeRange('DAY')}
                      className={`px-2.5 md:px-4 py-1 md:py-1.5 text-[11px] md:text-[13px] font-bold rounded-lg transition-all ${timeRange === 'DAY'
                        ? 'bg-white dark:bg-slate-700 text-[#3bb9f3] shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      Ngày
                    </button>
                    <button
                      onClick={() => setTimeRange('MONTH')}
                      className={`px-2.5 md:px-4 py-1 md:py-1.5 text-[11px] md:text-[13px] font-bold rounded-lg transition-all ${timeRange === 'MONTH'
                        ? 'bg-white dark:bg-slate-700 text-[#3bb9f3] shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      Tháng
                    </button>
                    <button
                      onClick={() => setTimeRange('YEAR')}
                      className={`px-2.5 md:px-4 py-1 md:py-1.5 text-[11px] md:text-[13px] font-bold rounded-lg transition-all ${timeRange === 'YEAR'
                        ? 'bg-white dark:bg-slate-700 text-[#3bb9f3] shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      Năm
                    </button>
                  </div>
                )}

                {!stats ? (
                  <div className="w-48 h-10 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl"></div>
                ) : (
                  <Dropdown
                    options={[
                      { label: 'Tổng bệnh nhân', value: 'Lượng bệnh nhân' },
                      { label: 'Tổng lịch hẹn', value: 'Lượt đặt lịch' },
                      { label: 'Doanh thu', value: 'Doanh thu' },
                      { label: 'Tỷ lệ hài lòng', value: 'Tỷ lệ hài lòng' }
                    ]}
                    value={selectedChartMetric}
                    onChange={setSelectedChartMetric}
                    className="w-[140px] sm:w-[160px] sm:ml-auto"
                    size="sm"
                  />
                )}
              </div>
            </div>

            {/* Visual Chart Area */}
            <div className="h-[220px] md:h-[300px] w-full relative">
              {isLoadingChart ? (
                <div className="absolute inset-0 bg-slate-50 dark:bg-slate-800/50 animate-pulse rounded-xl flex flex-col justify-end p-8 gap-12">
                  <div className="flex items-end justify-between gap-4 h-full">
                    {[...Array(7)].map((_, i) => (
                      <div key={i} className={`bg-slate-200 dark:bg-slate-700/50 rounded-lg w-full`} style={{ height: `${20 + Math.random() * 60}%` }}></div>
                    ))}
                  </div>
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 30 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3bb9f3" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3bb9f3" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203, 213, 225, 0.4)" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      padding={{ left: 10, right: 0 }}
                      tick={<CustomXAxisTick />}
                      ticks={Array.from(new Set([
                        chartData[0]?.label,
                        chartData[Math.floor(chartData.length * 0.33)]?.label,
                        chartData[Math.floor(chartData.length * 0.66)]?.label,
                        chartData[chartData.length - 1]?.label
                      ].filter(Boolean)))}
                      interval={0}
                    />
                    <YAxis
                      hide
                      domain={['auto', 'auto']}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3bb9f3', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#3bb9f3"
                      strokeWidth={window.innerWidth > 1024 ? 4 : 2.5}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                      animationDuration={2000}
                      dot={(props: any) => {
                        const { cx, cy, index } = props;
                        const isMajorTick = [
                          0,
                          Math.floor(chartData.length * 0.33),
                          Math.floor(chartData.length * 0.66),
                          chartData.length - 1
                        ].includes(index);

                        if (isMajorTick) {
                          return (
                            <circle
                              key={index}
                              cx={cx}
                              cy={cy}
                              r={6}
                              fill="#fff"
                              stroke="#3bb9f3"
                              strokeWidth={3}
                              className="drop-shadow-md"
                            />
                          );
                        }
                        return null;
                      }}
                      activeDot={{
                        r: 8,
                        fill: '#3bb9f3',
                        stroke: '#fff',
                        strokeWidth: 3,
                        className: 'drop-shadow-lg'
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Recent Activity (Placeholder logic) */}
          <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-900/50 p-4 md:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col text-left">
            <div className="flex items-center justify-between mb-6">
              {!stats ? (
                <div className="h-6 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-48"></div>
              ) : (
                <h2 className="text-[14px] md:text-[19px] font-bold text-slate-900 dark:text-white tracking-tight">Hoạt động hệ thống</h2>
              )}
              {!stats ? (
                <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-full"></div>
              ) : (
                <Link
                  to={ROUTES.ADMIN.AUDIT_LOGS}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-primary transition-all group"
                  title="Xem tất cả nhật ký"
                >
                  <span className="material-symbols-outlined text-[22px] group-active:rotate-[-45deg] transition-transform">history</span>
                </Link>
              )}
            </div>
            <div className="space-y-6 flex-1">
              {!stats ? (
                // Skeleton Activities
                [...Array(3)].map((_, idx) => (
                  <div key={`activity-skeleton-${idx}`} className="flex gap-4 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                      <div className="h-3 bg-slate-100 dark:bg-slate-800/50 rounded w-full"></div>
                    </div>
                  </div>
                ))
              ) : activities.length > 0 ? (
                activities.slice(0, 3).map((act, idx) => {
                  const actionMap: Record<string, string> = {
                    'UPDATE_PATIENT': 'Cập nhật Bệnh nhân',
                    'CREATE_PATIENT': 'Tạo mới Bệnh nhân',
                    'DELETE_PATIENT': 'Xóa Bệnh nhân',
                    'UPDATE_DOCTOR': 'Cập nhật Bác sĩ',
                    'CREATE_DOCTOR': 'Tạo mới Bác sĩ',
                    'DELETE_DOCTOR': 'Xóa Bác sĩ',
                    'CREATE_CLINIC': 'Thêm mới Phòng khám',
                    'UPDATE_CLINIC': 'Cập nhật Phòng khám',
                    'CREATE_APPOINTMENT': 'Tạo Lịch hẹn khám',
                    'UPDATE_APPOINTMENT': 'Cập nhật Lịch hẹn',
                    'LOGIN': 'Đăng nhập hệ thống',
                    'LOGOUT': 'Đăng xuất'
                  };

                  const moduleMap: Record<string, string> = {
                    'PATIENT_MANAGEMENT': 'Quản lý bệnh nhân',
                    'DOCTOR_MANAGEMENT': 'Quản lý bác sĩ',
                    'CLINIC_MANAGEMENT': 'Quản lý phòng khám',
                    'USER_MANAGEMENT': 'Quản lý tài khoản',
                    'APPOINTMENT_MANAGEMENT': 'Quản lý lịch hẹn',
                    'AUTH_MANAGEMENT': 'Bảo mật hệ thống'
                  };

                  const translatedTitle = actionMap[act.title] || act.title;

                  let translatedDesc = act.description || '';
                  if (translatedDesc.includes(':')) {
                    const parts = translatedDesc.split(':');
                    const mod = parts[0].trim();
                    const details = parts.slice(1).join(':').trim();

                    const transMod = moduleMap[mod] || mod;
                    const transDetails = details
                      .replace('Action completed successfully', 'Thao tác hoàn thành thành công')
                      .replace('successful', 'thành công')
                      .replace(/\bINACTIVE\b/g, 'NGƯNG HOẠT ĐỘNG')
                      .replace(/\bACTIVE\b/g, 'HOẠT ĐỘNG');
                    translatedDesc = `${transMod}: ${transDetails}`;
                  }

                  return (
                    <div key={idx} className="flex gap-4 group">
                      <div className={`w-10 h-10 rounded-full bg-${act.color || 'blue'}-100 dark:bg-${act.color || 'blue'}-900/30 flex items-center justify-center text-${act.color || 'blue'}-600 dark:text-${act.color || 'blue'}-400 shrink-0`}>
                        <span className="material-symbols-outlined text-lg">{act.icon || 'history'}</span>
                      </div>
                      <div>
                        <p className="text-[12px] md:text-[15px] font-bold text-slate-900 dark:text-white">{translatedTitle}</p>
                        <p className="text-[11px] md:text-[14px] text-slate-500 font-medium mt-0.5 leading-relaxed">{translatedDesc}</p>
                        <span className="text-[10px] md:text-[13px] font-medium text-slate-400 dark:text-slate-500 mt-2 inline-block italic-none tracking-tight">{act.timeAgo}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10 opacity-50">
                  <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                  <p className="text-sm font-medium">Chưa có hoạt động mới</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Table Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-primary/10 overflow-hidden shadow-sm font-display text-left">
          <div className="p-4 md:p-6 border-b border-primary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              {!stats ? (
                <>
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-64 mb-3"></div>
                  <div className="h-4 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded w-80"></div>
                </>
              ) : (
                <>
                  <h3 className="text-[15px] md:text-[19px] font-bold text-slate-900 dark:text-white">Danh sách chi nhánh mới</h3>
                  <p className="text-[12px] md:text-[15px] text-slate-500 mt-1">Lấy dữ liệu trực tiếp từ các phòng khám</p>
                </>
              )}
            </div>
          </div>
          {/* Mobile Card View */}
          <div className="block md:hidden">
            {!stats ? (
              [...Array(4)].map((_, i) => (
                <div key={`clinic-skeleton-m-${i}`} className="p-4 border-b border-slate-100 dark:border-slate-800 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-40"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24"></div>
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-20"></div>
                  </div>
                </div>
              ))
            ) : (
              clinics.map((clinic) => (
                <div key={clinic.id} className="p-4 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#3bb9f3] shrink-0">
                      <span className="material-symbols-outlined text-[20px]">home_health</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold text-slate-900 dark:text-white truncate">{clinic.name}</p>
                      <code className="text-[11px] font-bold text-slate-400">{clinic.clinicCode}</code>
                    </div>
                    <span className={`px-2.5 py-1 text-white text-[11px] font-bold rounded-full shrink-0 ${clinic.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                      {clinic.status === 'ACTIVE' ? 'Hoạt động' : 'Ngưng'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg py-1.5">
                      <p className="text-[10px] text-slate-400 font-medium">Bác sĩ</p>
                      <p className="text-[14px] font-bold text-slate-900 dark:text-white">{clinic.doctorCount || 0}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg py-1.5">
                      <p className="text-[10px] text-slate-400 font-medium">Bệnh nhân</p>
                      <p className="text-[14px] font-bold text-slate-900 dark:text-white">{clinic.patientCount || 0}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg py-1.5">
                      <p className="text-[10px] text-slate-400 font-medium">Tăng trưởng</p>
                      <p className="text-[14px] font-bold text-[#3bb9f3]">{clinic.growth}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Desktop Table View */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                  <th className="px-8 py-4">
                    {(!stats) ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-24"></div> : <span className="text-[15px] font-medium text-slate-500">Tên Phòng Khám</span>}
                  </th>
                  <th className="px-6 py-4">
                    {(!stats) ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-16"></div> : <span className="text-[15px] font-medium text-slate-500">Mã cơ sở</span>}
                  </th>
                  <th className="px-6 py-4">
                    {(!stats) ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-16"></div> : <span className="text-[15px] font-medium text-slate-500">Liên Hệ</span>}
                  </th>
                  <th className="px-6 py-4">
                    {(!stats) ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-12"></div> : <span className="text-[15px] font-medium text-slate-500">Bác Sĩ</span>}
                  </th>
                  <th className="px-6 py-4">
                    {(!stats) ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-16"></div> : <span className="text-[15px] font-medium text-slate-500">Bệnh Nhân</span>}
                  </th>
                  <th className="px-6 py-4">
                    {(!stats) ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-16"></div> : <span className="text-[15px] font-medium text-slate-500">Tăng Trưởng</span>}
                  </th>
                  <th className="px-6 py-4">
                    {!stats ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-16"></div> : <span className="text-[15px] font-medium text-slate-500">Trạng Thái</span>}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {!stats ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={`clinic-skeleton-${i}`} className="animate-pulse">
                      <td className="px-8 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-48"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-12"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-8"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-12"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-300 dark:bg-slate-800 rounded w-16"></div></td>
                      <td className="px-6 py-4"><div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-24"></div></td>
                    </tr>
                  ))
                ) : (
                  clinics.map((clinic) => (
                    <tr key={clinic.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-8 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#3bb9f3]">
                            <span className="material-symbols-outlined text-[23px]">home_health</span>
                          </div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white leading-none">{clinic.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-[14px] font-bold text-primary bg-primary/5 dark:bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20 uppercase tracking-wider shadow-sm">
                          {clinic.clinicCode}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{clinic.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{clinic.doctorCount || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{clinic.patientCount || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-[#3bb9f3]">{clinic.growth}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-white text-[13px] md:text-[14.5px] font-bold rounded-xl ${clinic.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                          {clinic.status === 'ACTIVE' ? 'Hoạt động' : 'Ngưng hoạt động'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CreateClinicModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        isSaving={isSaving}
        onSave={handleCreateClinic}
      />

      <Toast
        show={showToast}
        title={toastTitle}
        onClose={() => setShowToast(false)}
      />
    </AdminLayout>
  );
}
