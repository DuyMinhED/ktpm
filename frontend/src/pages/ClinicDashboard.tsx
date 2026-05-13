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

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      const clinicId = localStorage.getItem('clinicId') || '1';
      const res = await clinicApi.getDashboard(clinicId, selectedPeriod);

      if (res && res.data) {
        setStats({
          ...res.data,
          // Mapping backend fields to frontend names if they differ
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
        setDiseaseDistribution(res.data.diseaseRatios || []);
        setChartData(res.data.patientGrowthChart || []);
      }
    } catch (error) {
      console.error('Failed to fetch clinic dashboard data:', error);
    }
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
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                  </div>
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded-lg">{stats?.patientGrowth}</span>
                </div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats?.chronicPatients || 0}</h3>
                <p className="text-slate-900 dark:text-white text-[14px] font-bold mt-1">Tổng Bệnh nhân</p>
                <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center gap-2 text-[12px] text-slate-400">
                  <span className="font-medium">Số hồ sơ bệnh án quản lý</span>

                </div>
              </div>

              {/* High Risk Cases */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm group hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/20 rounded-2xl flex items-center justify-center text-teal-600">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
                  </div>
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[11px] font-bold rounded-lg">Đang trực</span>
                </div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats?.totalDoctors || 0}</h3>
                <p className="text-slate-900 dark:text-white text-[14px] font-bold mt-1">Tổng Bác sĩ</p>
                <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center gap-2">
                  <span className="text-[12px] text-slate-400 font-medium">Nhân sự vận hành chuyên môn</span>
                </div>
              </div>

              {/* Missed Follow-ups */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm group hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-600">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                  </div>
                  <span className="px-2 py-1 bg-red-50 text-red-600 text-[11px] font-bold rounded-lg">{stats?.riskTrend}</span>
                </div>
                <h3 className="text-3xl font-black text-red-600 tracking-tight">{stats?.highRiskCount || 0}</h3>
                <p className="text-slate-900 dark:text-white text-[14px] font-bold mt-1">Nguy cơ Cao</p>
                <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[12px] text-slate-400 font-medium">Yêu cầu theo dõi khẩn cấp</span>

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
                  <p className="text-white text-[14px] font-bold mt-1">Hiệu suất Khám bệnh</p>
                </div>
                <div className="relative z-10 mt-4 h-12 flex items-end gap-1">
                  {chartData.slice(-7).map((d, i) => (
                    <div key={i} className="flex-1 bg-white/30 rounded-t-sm" style={{ height: `${(d.value / (stats?.chronicPatients || 10) * 100) || 20}%` }}></div>
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
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Lưu lượng Tiếp nhận & Quản lý Ca bệnh</h3>
                      <p className="text-sm text-slate-500 font-medium">Biến động lưu lượng điều trị theo thời gian</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <span className="text-[12px] font-medium text-slate-500">Ca tiếp nhận mới</span>
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

                {/* Disease Distribution Section */}
                <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cơ cấu bệnh tật</h3>
                      <p className="text-sm text-slate-500 font-medium">Phân bổ bệnh nhân theo mặt bệnh mãn tính</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                    <div className="w-full md:w-1/2 h-[280px] flex items-center justify-center relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={diseaseDistribution.length > 0 ? diseaseDistribution : [{ name: 'Trống', value: 1, color: '#f1f5f9' }]}
                            cx="50%"
                            cy="50%"
                            innerRadius={75}
                            outerRadius={100}
                            paddingAngle={diseaseDistribution.length > 0 ? 5 : 0}
                            dataKey="value"
                            stroke="none"
                          >
                            {diseaseDistribution.length > 0 ? (
                              diseaseDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color || `hsl(${index * 45}, 70%, 60%)`} />
                              ))
                            ) : (
                              <Cell fill="#f1f5f9" />
                            )}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{stats?.chronicPatients || 0}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Tổng bệnh nhân</span>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-1/2 space-y-4">
                      {diseaseDistribution.length > 0 ? (
                        diseaseDistribution.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-slate-100 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color || `hsl(${idx * 45}, 70%, 60%)` }}></div>
                              <span className="text-[14px] font-bold text-slate-700 dark:text-slate-300">{item.label || item.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[14px] font-black text-slate-900 dark:text-white">{item.percentage || `${item.value}%`}</span>
                              <p className="text-[10px] text-slate-400 font-bold">{item.value} bệnh nhân</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-slate-400 text-sm italic">Chưa có dữ liệu phân bổ bệnh tật</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: High Risk Alerts */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bệnh nhân nguy cơ</h3>
                      <p className="text-sm text-slate-500 font-medium">Cần can thiệp khẩn cấp</p>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${riskPatients.length > 0 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-emerald-50 text-emerald-600'}`}>
                      <span className="material-symbols-outlined text-[20px]">
                        {riskPatients.length > 0 ? 'notifications_active' : 'verified_user'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {riskPatients.length > 0 ? (
                      riskPatients.slice(0, 5).map((patient) => (
                        <div key={patient.id} className="p-4 rounded-2xl border border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary/20 transition-all group cursor-pointer relative overflow-hidden">
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${patient.riskLevel === 'HIGH' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                          <div className="flex items-start gap-4">
                            <img src={patient.avatar || `https://i.pravatar.cc/100?u=${patient.id}`} className="w-12 h-12 rounded-xl object-cover" alt={patient.name} />
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
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPatient(patient);
                                    setIsPatientDetailModalOpen(true);
                                  }}
                                  className="ml-auto text-[12px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                                >
                                  Chi tiết <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-10 px-4 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                          <span className="material-symbols-outlined text-3xl">check_circle</span>
                        </div>
                        <h4 className="text-slate-900 dark:text-white font-bold mb-1">An toàn lâm sàng</h4>
                        <p className="text-slate-400 text-[13px] font-medium leading-relaxed">
                          Hiện tại không có bệnh nhân nào ở mức nguy cơ cao cần can thiệp.
                        </p>
                      </div>
                    )}
                  </div>

                  <Link
                    to={ROUTES.CLINIC.ALERTS}
                    className="mt-6 w-full py-3 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 rounded-2xl font-bold text-sm text-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  >
                    Xem tất cả cảnh báo
                  </Link>
                </div>

                {/* Quick Actions / Tips */}
                <div className="bg-gradient-to-br from-primary to-blue-600 p-6 rounded-3xl text-white shadow-lg shadow-primary/20">
                  <h4 className="font-bold mb-2">Thông tin Phân tích</h4>
                  <p className="text-white/80 text-sm mb-4 leading-relaxed">
                    {stats?.insight || "Hệ thống đang phân tích dữ liệu để đưa ra các khuyến nghị lâm sàng phù hợp."}
                  </p>
                  <Link to={ROUTES.CLINIC.REPORTS} className="inline-block px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-sm font-bold transition-all">
                    Xem báo cáo chi tiết
                  </Link>
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
