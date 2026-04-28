import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import ClinicSidebar from '../components/common/ClinicSidebar';
import TopBar from '../components/common/TopBar';
import Dropdown from '../components/ui/Dropdown';
import { clinicApi } from '../api/clinic';
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

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      // For demo/mock purposes, if API fails we use mock data
      const clinicId = 1; // This should come from auth context
      const res = await clinicApi.getDashboard(clinicId, selectedPeriod);

      if (res && res.data) {
        setStats(res.data.stats);
        setRiskPatients(res.data.riskPatients || []);
        setDiseaseDistribution(res.data.diseaseDistribution || []);
        setChartData(res.data.chartData || []);
      }
    } catch (error) {
      console.error('Failed to fetch clinic dashboard data:', error);
    } finally {
      // Loading state can be added here if needed in future
    }
  };


  return (
    <div className="flex min-h-screen font-display bg-background-light dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased italic-none">
      <ClinicSidebar
        isSidebarOpen={isSidebarOpen}
        userName="Clinic Manager"
        userRole="Quản lý phòng khám"
        userAvatar="https://images.unsplash.com/photo-1559839734-2b71f1536780?auto=format&fit=crop&q=80&w=100&h=100"
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
                <h2 className="text-xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">Tổng quan phòng khám</h2>
                <p className="text-[14px] md:text-[16px] text-slate-500 mt-1 font-medium">Báo cáo sức khỏe cộng đồng & Hiệu suất vận hành</p>
              </div>
              <div className="flex items-center gap-3">
                <Dropdown
                  options={['Hôm nay', 'Tuần này', 'Tháng này', 'Quý này']}
                  value={selectedPeriod}
                  onChange={setSelectedPeriod}
                  className="w-40"
                />
                <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl font-bold border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 transition-all">
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Xuất dữ liệu
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {/* Total Chronic Patients */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm group hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>personal_injury</span>
                  </div>
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded-lg">{stats?.patientGrowth}</span>
                </div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats?.chronicPatients || 0}</h3>
                <p className="text-slate-500 text-[14px] font-medium mt-1">Bệnh nhân mãn tính</p>
                <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center gap-2 text-[12px] text-slate-400">
                  <span className="font-bold text-slate-600 dark:text-slate-300">{stats?.totalPatients}</span>
                  <span>tổng số bệnh nhân</span>
                </div>
              </div>

              {/* High Risk Cases */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm group hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-600">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                  </div>
                  <span className="px-2 py-1 bg-red-50 text-red-600 text-[11px] font-bold rounded-lg">{stats?.riskTrend}</span>
                </div>
                <h3 className="text-3xl font-black text-red-600 tracking-tight">{stats?.highRiskCount || 0}</h3>
                <p className="text-slate-500 text-[14px] font-medium mt-1">Ca nguy cơ cao</p>
                <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <img key={i} src={`https://i.pravatar.cc/100?u=${i + 10}`} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900" alt="avatar" />
                    ))}
                  </div>
                  <span className="text-[12px] text-slate-400 font-medium">Cần xử lý ngay</span>
                </div>
              </div>

              {/* Missed Follow-ups */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm group hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>event_busy</span>
                  </div>
                  <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[11px] font-bold rounded-lg">{stats?.followUpRate} tỷ lệ tái khám</span>
                </div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats?.missedFollowUps || 0}</h3>
                <p className="text-slate-500 text-[14px] font-medium mt-1">Bệnh nhân chưa tái khám</p>
                <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <button className="text-[12px] font-bold text-primary hover:underline">Gửi nhắc nhở hàng loạt</button>
                </div>
              </div>

              {/* Chronic Rate Chart Mini */}
              <div className="bg-primary p-6 rounded-3xl shadow-lg shadow-primary/20 flex flex-col justify-between text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="relative z-10">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-md">
                    <span className="material-symbols-outlined text-xl">analytics</span>
                  </div>
                  <h3 className="text-3xl font-black tracking-tight leading-none">{stats?.chronicRate}</h3>
                  <p className="text-white/80 text-[14px] font-medium mt-1">Tỷ lệ bệnh mãn tính</p>
                </div>
                <div className="relative z-10 mt-4 h-12 flex items-end gap-1">
                  {[40, 60, 45, 70, 55, 80, 65].map((h, i) => (
                    <div key={i} className="flex-1 bg-white/30 rounded-t-sm" style={{ height: `${h}%` }}></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Dashboard Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
              {/* Left Column: Patient Trends & Distribution */}
              <div className="lg:col-span-8 space-y-6 md:space-y-8">
                {/* Patient Visit Trend */}
                <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Lượt khám & Theo dõi</h3>
                      <p className="text-sm text-slate-500 font-medium">Thống kê theo từng ngày trong tuần</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <span className="text-[12px] font-medium text-slate-500">Bệnh nhân mới</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="clinicGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3bb9f3" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3bb9f3" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203, 213, 225, 0.3)" />
                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: window.innerWidth > 1024 ? 14 : 11, fontWeight: 500 }}
                          dy={10}
                        />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                          itemStyle={{ color: '#3bb9f3', fontWeight: 'bold' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#3bb9f3"
                          strokeWidth={4}
                          fill="url(#clinicGradient)"
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Disease Distribution Table/Chart */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Cơ cấu bệnh tật</h3>
                    <div className="h-[240px] flex items-center justify-center relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={diseaseDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {diseaseDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">840</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ca bệnh</span>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      {diseaseDistribution.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-[12px] font-bold text-slate-600 dark:text-slate-400 truncate">{item.name}</span>
                          <span className="text-[12px] font-black text-slate-900 dark:text-white ml-auto">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Hiệu suất Bác sĩ</h3>
                      <Link to={ROUTES.CLINIC.DOCTORS} className="text-primary text-[12px] font-bold hover:underline">Xem tất cả</Link>
                    </div>
                    <div className="space-y-4">
                      {[
                        { name: 'BS. Lê Minh', patients: 120, satisfaction: 98, avatar: 'https://i.pravatar.cc/150?u=11' },
                        { name: 'BS. Trần Hà', patients: 95, satisfaction: 96, avatar: 'https://i.pravatar.cc/150?u=12' },
                        { name: 'BS. Ngô Quân', patients: 88, satisfaction: 92, avatar: 'https://i.pravatar.cc/150?u=13' },
                      ].map((doc, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl group hover:bg-primary/5 transition-colors cursor-pointer">
                          <img src={doc.avatar} className="w-10 h-10 rounded-full object-cover" alt={doc.name} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-bold text-slate-900 dark:text-white truncate">{doc.name}</p>
                            <p className="text-[12px] text-slate-500 font-medium">{doc.patients} bệnh nhân</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[13px] font-black text-emerald-600">{doc.satisfaction}%</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Hài lòng</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: High Risk Alerts */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bệnh nhân nguy cơ</h3>
                      <p className="text-sm text-slate-500 font-medium">Cần can thiệp khẩn cấp</p>
                    </div>
                    <div className="w-8 h-8 bg-red-50 text-red-600 rounded-full flex items-center justify-center animate-pulse">
                      <span className="material-symbols-outlined text-[20px]">notifications_active</span>
                    </div>
                  </div>

                  <div className="space-y-4 flex-1">
                    {riskPatients.map((patient) => (
                      <div key={patient.id} className="p-4 rounded-2xl border border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary/20 transition-all group cursor-pointer relative overflow-hidden">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${patient.riskLevel === 'HIGH' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                        <div className="flex items-start gap-4">
                          <img src={patient.avatar} className="w-12 h-12 rounded-xl object-cover" alt={patient.name} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-[15px] font-bold text-slate-900 dark:text-white truncate">{patient.name}</p>
                              <span className="text-[10px] text-slate-400 font-medium">{patient.lastUpdate}</span>
                            </div>
                            <p className="text-[13px] text-slate-500 font-medium mb-2">{patient.condition}</p>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${patient.riskLevel === 'HIGH' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                                }`}>
                                {patient.riskLevel === 'HIGH' ? 'Rất cao' : 'Trung bình'}
                              </span>
                              <button className="ml-auto text-[12px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                Chi tiết <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Link
                    to={ROUTES.CLINIC.ALERTS}
                    className="mt-6 w-full py-3 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 rounded-2xl font-bold text-sm text-center hover:bg-slate-100 transition-colors"
                  >
                    Xem tất cả cảnh báo
                  </Link>
                </div>

                {/* Quick Actions / Tips */}
                <div className="bg-gradient-to-br from-primary to-blue-600 p-6 rounded-3xl text-white shadow-lg shadow-primary/20">
                  <h4 className="font-bold mb-2">Mẹo Quản lý</h4>
                  <p className="text-white/80 text-sm mb-4 leading-relaxed">
                    Bệnh nhân tiểu đường có tỷ lệ bỏ tái khám cao hơn 15% vào mùa lễ. Hãy thiết lập nhắc nhở tự động.
                  </p>
                  <button className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-sm font-bold transition-all">
                    Thiết lập ngay
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

    </div>
  );
}
