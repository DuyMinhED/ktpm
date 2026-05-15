import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import ClinicSidebar from '../components/common/ClinicSidebar';
import TopBar from '../components/common/TopBar';
import Dropdown from '../components/ui/Dropdown';
import { clinicApi } from '../api/clinic';
import PatientDetailModal from '../features/patient/components/PatientDetailModal';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function ClinicDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('Tháng này');
  const [stats, setStats] = useState<any>(null);
  const [riskPatients, setRiskPatients] = useState<any[]>([]);
  const [diseaseDistribution, setDiseaseDistribution] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isPatientDetailModalOpen, setIsPatientDetailModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  const getPeriodParam = (p: string) => {
    switch (p) {
      case 'Tuần này': return '7d';
      case 'Tháng này': return '30d';
      case 'Năm này': return '1y';
      default: return '30d';
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    setIsLoadingChart(true);
    try {
      const clinicId = localStorage.getItem('clinicId') || '1';
      const periodParam = getPeriodParam(selectedPeriod);
      const res = await clinicApi.getDashboard(clinicId, periodParam);

      if (res && res.data) {
        setStats({
          ...res.data,
          chronicPatients: res.data.totalPatients,
          totalDoctors: res.data.doctorPerformances ? res.data.doctorPerformances.length : 0,
          highRiskCount: res.data.highRiskAlerts,
          missedFollowUps: res.data.pendingFollowUps,
          chronicRate: res.data.adherenceRate ? `${(res.data.adherenceRate * 100).toFixed(1)}%` : '0%',
          followUpRate: res.data.adherenceRate ? `${(res.data.adherenceRate * 100).toFixed(1)}%` : '0%',
          patientGrowth: res.data.patientGrowth,
          riskTrend: res.data.highRiskGrowth,
          insight: res.data.insights && res.data.insights.length > 0 ? res.data.insights[0] : null
        });

        setRiskPatients(res.data.riskPatients || []);

        // Add colors to disease distribution
        const baseColors = ['#3bb9f3', '#f59e0b', '#ef4444', '#10b981', '#6366f1', '#ec4899'];
        const distribution = (res.data.diseaseRatios || []).map((item: any, index: number) => ({
          ...item,
          color: item.color || baseColors[index % baseColors.length]
        }));
        setDiseaseDistribution(distribution);

        // Process and map chart data (mapping month to label)
        let growthData = [...(res.data.patientGrowthChart || [])];

        // Sort chronologically by Year/Month/Day before rendering
        growthData.sort((a: any, b: any) => {
          if (!a.month || !b.month) return 0;
          const partsA = a.month.toString().split(/[-/]/).map(Number);
          const partsB = b.month.toString().split(/[-/]/).map(Number);

          for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
            const valA = partsA[i] || 0;
            const valB = partsB[i] || 0;
            if (valA !== valB) return valA - valB;
          }
          return 0;
        });

        let mapped = growthData.map((item: any) => {
          let label = 'N/A';
          if (item.month) {
            const segments = item.month.toString().split(/[-/]/);
            if (segments.length === 3) {
              // It's a daily date: "YYYY-MM-DD" -> Format as "DD/MM"
              label = `${segments[2].padStart(2, '0')}/${segments[1].padStart(2, '0')}`;
            } else if (segments.length === 2) {
              // It's a monthly date: "YYYY/MM" -> Format as "Tháng MM"
              label = `Tháng ${segments[1].padStart(2, '0')}`;
            } else {
              label = item.month.replace(/^Th. /i, 'Tháng ');
            }
          }
          return {
            ...item,
            label
          };
        });

        // Padding if empty or only 1 item
        if (mapped.length === 1) {
          const val = mapped[0].value;
          mapped = [
            { label: 'Trước đó', value: Math.max(0, Math.floor(val * 0.8)) },
            mapped[0]
          ];
        } else if (mapped.length === 0) {
          mapped = [
            { label: 'Kỳ trước', value: 0 },
            { label: 'Hiện tại', value: 0 }
          ];
        }
        setChartData(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch clinic dashboard data:', error);
    } finally {
      setIsLoadingChart(false);
    }
  };

  // Custom Chart Tooltip Component (matching Admin)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 p-3 md:p-4 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 ring-1 ring-slate-900/5">
          <p className="text-[13px] md:text-[14px] font-bold text-slate-800 dark:text-slate-200 mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <p className="text-[13px] md:text-[14px] font-bold text-[#3bb9f3]">
              {payload[0].value}
              <span className="text-slate-500 dark:text-slate-400 font-bold text-[12.5px] md:text-[14px] ml-1.5">ca tiếp nhận</span>
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
    else if (index === 3 || index === chartData.length - 1) textAnchor = "end";

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

  return (
    <div className="flex min-h-screen font-display bg-background-light dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased italic-none">
      <ClinicSidebar
        isSidebarOpen={isSidebarOpen}
      />

      <div className="lg:ml-72 min-h-screen flex-1 flex flex-col bg-background-light dark:bg-slate-950">
        <TopBar
          setIsSidebarOpen={setIsSidebarOpen}
          notifications={notifications}
          setNotifications={setNotifications}
        />

        <main className="flex-1 overflow-y-auto">
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
                    <h2 className="text-lg md:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">Tổng quan phòng khám</h2>
                    <p className="text-[13px] md:text-[16px] text-slate-500 mt-1 font-medium italic-none">Báo cáo sức khỏe cộng đồng & Hiệu suất vận hành</p>
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
                    <Link
                      to={ROUTES.CLINIC.PATIENTS}
                      className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-primary text-white rounded-xl font-bold transition-all text-[12px] md:text-[13px] shadow-lg shadow-primary/20 hover:shadow-primary/30 whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined text-[16px] md:text-[18px]">group</span>
                      Quản lý bệnh nhân
                    </Link>
                    <button className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl font-bold transition-all text-[12px] md:text-[13px] border border-primary/10 shadow-sm whitespace-nowrap">
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
                  <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-primary/5 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow text-left">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center text-emerald-600">
                        <span className="material-symbols-outlined text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
                      </div>
                      <span className="text-[12px] md:text-[13.5px] font-black text-white bg-emerald-500 px-2.5 py-1 rounded-lg">{stats?.patientGrowth || '+0%'}</span>
                    </div>
                    <div className="mt-2 md:mt-4">
                      <h3 className="text-xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{stats?.chronicPatients || 0}</h3>
                      <p className="text-slate-500 text-[12.5px] md:text-[16.5px] font-medium mt-1.5 font-display">Tổng số bệnh nhân</p>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-primary/5 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow text-left">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-blue-600">
                        <span className="material-symbols-outlined text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>stethoscope</span>
                      </div>
                      <span className="text-[12px] md:text-[13.5px] font-black text-white bg-blue-500 px-2.5 py-1 rounded-lg">Hoạt động</span>
                    </div>
                    <div className="mt-2 md:mt-4">
                      <h3 className="text-xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{stats?.totalDoctors || 0}</h3>
                      <p className="text-slate-500 text-[12.5px] md:text-[16.5px] font-medium mt-1.5 font-display">Đội ngũ Bác sĩ</p>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-primary/5 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow text-left">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600">
                        <span className="material-symbols-outlined text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
                      </div>
                      <span className="text-[12px] md:text-[13.5px] font-black text-white bg-indigo-500 px-2.5 py-1 rounded-lg">Tuân thủ</span>
                    </div>
                    <div className="mt-2 md:mt-4">
                      <h3 className="text-xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{stats?.chronicRate || '0%'}</h3>
                      <p className="text-slate-500 text-[12.5px] md:text-[16.5px] font-medium mt-1.5 font-display">Tỷ lệ điều trị tốt</p>
                    </div>
                  </div>

                  {/* Card 4 */}
                  <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-primary/5 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow text-left">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-red-200 dark:bg-red-900/50 rounded-xl flex items-center justify-center text-red-600">
                        <span className="material-symbols-outlined text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                      </div>
                      <span className="px-2.5 py-1 bg-red-500 text-white text-[12px] md:text-[13.5px] font-black rounded-full">{stats?.riskTrend || '0%'}</span>
                    </div>
                    <div className="mt-2 md:mt-4">
                      <h3 className="text-xl md:text-4xl font-black text-red-600 tracking-tight leading-none">{stats?.highRiskCount || 0}</h3>
                      <p className="text-slate-500 text-[12.5px] md:text-[16.5px] font-medium mt-1.5 font-display">Bệnh nhân rủi ro cao</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Main Layout Section: Chart and Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">
              {/* Chart Section */}
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-4 md:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative group/chart overflow-hidden text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
                  <div>
                    {!stats ? (
                      <div className="space-y-2">
                        <div className="h-6 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-64"></div>
                        <div className="h-4 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded w-48"></div>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-[14px] md:text-[19px] font-bold text-slate-900 dark:text-white tracking-tight">Lưu lượng Tiếp nhận & Quản lý Ca bệnh</h2>
                        <p className="text-[11px] md:text-[15px] text-slate-500 mt-1">Biến động lưu lượng điều trị bệnh nhân mãn tính</p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 md:gap-6">
                    {/* Time Range Selector */}
                    {!stats ? (
                      <div className="w-40 h-10 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl"></div>
                    ) : (
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl ml-auto">
                        <button
                          onClick={() => setSelectedPeriod('Tuần này')}
                          className={`px-2.5 md:px-4 py-1 md:py-1.5 text-[11px] md:text-[13px] font-bold rounded-lg transition-all ${selectedPeriod === 'Tuần này'
                            ? 'bg-white dark:bg-slate-700 text-[#3bb9f3] shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                          Tuần
                        </button>
                        <button
                          onClick={() => setSelectedPeriod('Tháng này')}
                          className={`px-2.5 md:px-4 py-1 md:py-1.5 text-[11px] md:text-[13px] font-bold rounded-lg transition-all ${selectedPeriod === 'Tháng này'
                            ? 'bg-white dark:bg-slate-700 text-[#3bb9f3] shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                          Tháng
                        </button>
                        <button
                          onClick={() => setSelectedPeriod('Năm này')}
                          className={`px-2.5 md:px-4 py-1 md:py-1.5 text-[11px] md:text-[13px] font-bold rounded-lg transition-all ${selectedPeriod === 'Năm này'
                            ? 'bg-white dark:bg-slate-700 text-[#3bb9f3] shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                          Năm
                        </button>
                      </div>
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
                          <linearGradient id="clinicColorValue" x1="0" y1="0" x2="0" y2="1">
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
                          fill="url(#clinicColorValue)"
                          animationDuration={2000}
                          dot={(props: any) => {
                            const { cx, cy, index } = props;
                            const isMajorTick = [
                              0,
                              Math.floor(chartData.length * 0.33),
                              Math.floor(chartData.length * 0.66),
                              chartData.length - 1
                            ].includes(index);

                            if (isMajorTick || chartData.length <= 2) {
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

              {/* Right Section: Bệnh nhân nguy cơ (Styled like System Activity) */}
              <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-900/50 p-4 md:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col text-left">
                <div className="flex items-center justify-between mb-6">
                  {!stats ? (
                    <div className="h-6 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-48"></div>
                  ) : (
                    <h2 className="text-[14px] md:text-[19px] font-bold text-slate-900 dark:text-white tracking-tight">Bệnh nhân nguy cơ cao</h2>
                  )}
                  {!stats ? (
                    <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-full"></div>
                  ) : (
                    <Link
                      to={ROUTES.CLINIC.ALERTS}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-primary transition-all group"
                      title="Xem tất cả cảnh báo"
                    >
                      <span className="material-symbols-outlined text-[22px] group-active:rotate-[-45deg] transition-transform">notifications_active</span>
                    </Link>
                  )}
                </div>
                <div className="space-y-6 flex-1">
                  {!stats ? (
                    [...Array(3)].map((_, idx) => (
                      <div key={`activity-skeleton-${idx}`} className="flex gap-4 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                          <div className="h-3 bg-slate-100 dark:bg-slate-800/50 rounded w-full"></div>
                        </div>
                      </div>
                    ))
                  ) : riskPatients.length > 0 ? (
                    riskPatients.slice(0, 3).map((patient, idx) => (
                      <div
                        key={idx}
                        className="flex gap-4 group cursor-pointer"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setIsPatientDetailModalOpen(true);
                        }}
                      >
                        <div className="shrink-0 relative">
                          <img
                            src={patient.avatar || `https://i.pravatar.cc/100?u=${patient.id}`}
                            alt={patient.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                          />
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900 animate-pulse"></span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-[12px] md:text-[15px] font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                              {patient.name}
                            </p>
                            <span className="text-[10px] md:text-[12px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-md">
                              Rủi ro cao
                            </span>
                          </div>
                          <p className="text-[11px] md:text-[14px] text-slate-500 font-medium mt-0.5 truncate leading-relaxed">
                            {patient.condition}
                          </p>
                          <span className="text-[10px] md:text-[13px] font-medium text-slate-400 dark:text-slate-500 mt-2 inline-block italic-none tracking-tight">
                            {patient.lastUpdate}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10 opacity-50">
                      <span className="material-symbols-outlined text-4xl mb-2">verified_user</span>
                      <p className="text-sm font-medium">Mọi chỉ số đều an toàn</p>
                    </div>
                  )}
                </div>
                {stats && (
                  <div className="mt-6 bg-gradient-to-br from-[#3bb9f3] to-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-[#3bb9f3]/20">
                    <h4 className="font-bold mb-1 text-[13px] md:text-[15px]">Thông tin Phân tích</h4>
                    <p className="text-white/80 text-[12px] md:text-[13px] mb-3 leading-relaxed">
                      {stats?.insight || "Hệ thống đang phân tích dữ liệu để đưa ra các khuyến nghị lâm sàng phù hợp."}
                    </p>
                    <Link to={ROUTES.CLINIC.ALERTS} className="inline-block px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-[12px] font-bold transition-all">
                      Xem phân tích
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Full Width Section: Cơ cấu bệnh tật (Table Section styling from Admin) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-primary/10 overflow-hidden shadow-sm text-left flex flex-col">
              <div className="p-5 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] md:text-[19px] font-bold text-slate-900 dark:text-white tracking-tight">Phân bổ nhóm bệnh mãn tính</h3>
                  <p className="text-[11px] md:text-[14px] text-slate-500 mt-1 font-medium italic-none">Theo dõi tỷ lệ mặt bệnh phân bố trên toàn hệ thống bệnh nhân</p>
                </div>
              </div>

              <div className="p-6 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                <div className="w-full md:w-[40%] h-[260px] flex items-center justify-center relative">
                  {!stats ? (
                    <div className="w-48 h-48 rounded-full border-8 border-slate-100 dark:border-slate-800 animate-pulse"></div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={diseaseDistribution.length > 0 ? diseaseDistribution : [{ name: 'Trống', value: 1, color: '#f1f5f9' }]}
                            cx="50%"
                            cy="50%"
                            innerRadius={75}
                            outerRadius={95}
                            paddingAngle={diseaseDistribution.length > 0 ? 4 : 0}
                            dataKey="value"
                            stroke="none"
                          >
                            {diseaseDistribution.length > 0 ? (
                              diseaseDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))
                            ) : (
                              <Cell fill="#f1f5f9" />
                            )}
                          </Pie>
                          <Tooltip
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', backgroundColor: '#fff' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{stats?.chronicPatients || 0}</span>
                        <span className="text-[15px] text-slate-600 font-semibold mt-1">Tổng bệnh nhân</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="w-full md:w-[50%] grid grid-cols-1 sm:grid-cols-2 gap-4 self-center">
                  {!stats ? (
                    [...Array(4)].map((_, i) => (
                      <div key={i} className="w-full h-16 bg-slate-50 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
                    ))
                  ) : diseaseDistribution.length > 0 ? (
                    diseaseDistribution.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100/50 dark:border-slate-800/80 shadow-sm hover:scale-[1.02] transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                          <span className="text-[13.5px] md:text-[15px] font-bold text-slate-700 dark:text-slate-300 truncate">{item.label || item.name}</span>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className="text-[15px] font-black text-slate-900 dark:text-white">{item.percentage || `${item.value}%`}</span>
                          <p className="text-[12px] text-slate-600 font-bold mt-0.5">{item.value} ca bệnh</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-8 bg-slate-50 dark:bg-slate-800/20 rounded-2xl">
                      <p className="text-slate-400 text-sm font-medium italic-none">Chưa có dữ liệu phân bổ</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

      <PatientDetailModal
        isOpen={isPatientDetailModalOpen}
        onClose={() => setIsPatientDetailModalOpen(false)}
        patient={selectedPatient}
      />
    </div>
  );
}
