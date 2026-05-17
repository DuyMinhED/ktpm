import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import TopBar from '../components/common/TopBar';
import Dropdown from '../components/ui/Dropdown';
import Toast from '../components/ui/Toast';
import AdviceModal from '../features/patient/components/AdviceModal';
import RescheduleModal from '../features/patient/components/RescheduleModal';
import PrescriptionModal from '../features/prescription/components/PrescriptionModal';

import { Link } from 'react-router-dom';
import { doctorApi } from '../api/doctor';
import DoctorSidebar from '../components/common/DoctorSidebar';
import Skeleton from '../components/ui/Skeleton';
import { ROUTES } from '../constants/routes';

export default function DoctorDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashData, setDashData] = useState<any>(null);
  const [myPatients, setMyPatients] = useState<any[]>([]);
  const [patientStats, setPatientStats] = useState<any>(null);
  const [isChartLoading, setIsChartLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [dRes, pRes, sRes] = await Promise.all([
        doctorApi.getDashboard(),
        doctorApi.getMyPatients({ size: 100 }),
        doctorApi.getPatientStats({ days: 7 })
      ]);
      if (dRes.success) {
        setDashData(dRes.data);
      }
      if (pRes.success) {
        setMyPatients(pRes.data.content || []);
      }
      if (sRes.success) {
        setPatientStats(sRes.data);
      }
    } catch (e) {
      console.error('Failed to fetch dashboard data', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChartStats = async (days: number) => {
    setIsChartLoading(true);
    try {
      const sRes = await doctorApi.getPatientStats({ days });
      if (sRes.success) {
        setPatientStats(sRes.data);
      }
    } catch (e) {
      console.error('Failed to fetch chart stats', e);
    } finally {
      setIsChartLoading(false);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isAddingNewMedicine, setIsAddingNewMedicine] = useState(false);

  // Advice Modal State
  const [isAdviceModalOpen, setIsAdviceModalOpen] = useState(false);
  const [adviceCategory, setAdviceCategory] = useState('Theo dõi');
  const [adviceContent, setAdviceContent] = useState('');
  const [isAdviceSaving, setIsAdviceSaving] = useState(false);
  const [advicePatient, setAdvicePatient] = useState<any>(null);
  const [advicePatientName, setAdvicePatientName] = useState('');
  const [advicePatientAvatar, setAdvicePatientAvatar] = useState('');

  // Toast State
  const [showToast, setShowToast] = useState(false);
  const [toastTitle, setToastTitle] = useState('');
  const [dashboardTimeRange, setDashboardTimeRange] = useState('7 ngày qua');

  useEffect(() => {
    if (!isLoading) {
      const days = dashboardTimeRange === '30 ngày qua' ? 30 : 7;
      fetchChartStats(days);
    }
  }, [dashboardTimeRange]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSaveAdvice = async () => {
    if (!advicePatient?.id) return;
    setIsAdviceSaving(true);
    try {
      // Find or create a conversation for this patient in a real app
      // For now, let's just send the message payload directly (assumes backend handles conversation creation if not exists)
      const messageContent = `[Tư vấn ${adviceCategory}] ${adviceContent}`;
      await doctorApi.sendMessage({ receiverId: advicePatient.id, content: messageContent });

      setToastTitle(`Đã gửi lời khuyên đến ${advicePatientName} thành công!`);
      setShowToast(true);
      setIsAdviceModalOpen(false);
      setAdvicePatient(null);
    } catch (e) {
      setToastTitle('Có lỗi xảy ra khi gửi lời khuyên');
      setShowToast(true);
    } finally {
      setIsAdviceSaving(false);
    }
  };
  const [medications, setMedications] = useState<any[]>([]);

  const [newMedForm, setNewMedForm] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    intakeType: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [selectedDay, setSelectedDay] = useState(5);
  // const [adviceCategory, setAdviceCategory] = useState('Dinh dưỡng'); // Duplicate, removed
  // const [adviceContent, setAdviceContent] = useState(''); // Duplicate, removed
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [isSaving, setIsSaving] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const removeMedication = (id: number) => {
    setMedications(prev => prev.filter(m => m.id !== id));
  };

  const addMedicationToPrescription = () => {
    const errors: Record<string, boolean> = {};
    if (!newMedForm.name) errors.name = true;
    if (!newMedForm.dosage) errors.dosage = true;
    if (!newMedForm.frequency) errors.frequency = true;
    if (!newMedForm.duration) errors.duration = true;
    if (!newMedForm.intakeType) errors.intakeType = true;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setMedications([...medications, { ...newMedForm, id: Date.now() }]);
    setNewMedForm({ name: '', dosage: '', frequency: '', duration: '', intakeType: '' });
    setIsAddingNewMedicine(false);
  };

  const handleSaveReschedule = async (appointmentData: any) => {
    setIsSaving(true);
    try {
      const res = await doctorApi.createAppointment(appointmentData);
      if (res.success) {
        setIsModalOpen(false);
        setToastTitle('Đặt lịch thành công');
        setShowToast(true);
        fetchDashboardData();
      }
    } catch (e) {
      setToastTitle('Có lỗi xảy ra khi đặt lịch');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrescription = async (prescriptionData: any) => {
    setIsSaving(true);
    try {
      const res = await doctorApi.createPrescription(prescriptionData);
      if (res.success) {
        setIsPrescriptionModalOpen(false);
        setMedications([]);
        setToastTitle('Kê đơn thành công!');
        setShowToast(true);
        fetchDashboardData();
      }
    } catch (e) {
      console.error('Failed to save prescription', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex min-h-screen font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
        <DoctorSidebar isSidebarOpen={isSidebarOpen} />

        {/* Main Content Area - Responsive Flex */}
        <main className="flex-1 lg:ml-72 min-h-screen flex flex-col transition-all duration-300">
          {/* Mobile Sidebar Overlay */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[140] lg:hidden animate-in fade-in duration-300"
              onClick={() => setIsSidebarOpen(false)}
            ></div>
          )}
          {/* Top Bar - Responsive Header */}
          <TopBar
            setIsSidebarOpen={setIsSidebarOpen}
            notifications={notifications}
            setNotifications={setNotifications}
          />

          <div className="p-4 md:p-8 space-y-6 md:space-y-8">
            {/* Summary Cards */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-primary/5 shadow-sm space-y-4 h-[130px]">
                    <div className="flex justify-between items-start">
                      <Skeleton className="w-12 h-12" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-8 w-1/3" />
                  </div>
                ))
              ) : (
                <>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-primary/5 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined size-6">person</span>
                      </div>
                      <span className="text-xs font-bold text-green-500 flex items-center">+2.4% <span className="material-symbols-outlined text-xs">trending_up</span></span>
                    </div>
                    <h3 className="text-slate-600 dark:text-slate-400 text-base font-bold tracking-tight">Tổng bệnh nhân</h3>
                    <p className="text-3xl font-extrabold mt-1">{dashData?.stats?.totalPatients || 0}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-primary/5 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center text-red-500">
                        <span className="material-symbols-outlined size-6">emergency</span>
                      </div>
                      <span className="px-3 py-1.5 bg-red-500 text-white text-[12px] font-bold rounded-full">Cảnh báo</span>
                    </div>
                    <h3 className="text-slate-600 dark:text-slate-400 text-base font-bold tracking-tight">Nguy cơ cao</h3>
                    <p className="text-3xl font-extrabold mt-1 text-red-500">{dashData?.stats?.highRiskCount || 0}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-primary/5 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-500">
                        <span className="material-symbols-outlined size-6">event_upcoming</span>
                      </div>
                    </div>
                    <h3 className="text-slate-600 dark:text-slate-400 text-base font-bold tracking-tight">Lịch hẹn chờ</h3>
                    <p className="text-3xl font-extrabold mt-1">{dashData?.upcomingAppointments?.length || 0}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-primary/5 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center text-amber-500">
                        <span className="material-symbols-outlined size-6">mail</span>
                      </div>
                    </div>
                    <h3 className="text-slate-600 dark:text-slate-400 text-base font-bold tracking-tight">Tin nhắn mới</h3>
                    <p className="text-3xl font-extrabold mt-1">{dashData?.stats?.unreadMessagesCount || 0}</p>
                  </div>
                </>
              )}
            </section>

            {/* High Risk Patients Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                {isLoading ? (
                  <Skeleton className="h-7 w-48" />
                ) : (
                  <h2 className="text-xl font-medium text-slate-800 dark:text-slate-400 flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-500">warning</span>
                    Phân tích nguy cơ cao
                  </h2>
                )}
                {isLoading ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  <Link className="text-primary text-sm font-bold hover:underline cursor-pointer" to={ROUTES.DOCTOR.ANALYTICS}>Xem tất cả</Link>
                )}
              </div>
              <div className="space-y-4">
                {isLoading ? (
                  [...Array(2)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-primary/5 flex items-center justify-between h-[80px]">
                      <div className="flex items-center gap-4 flex-1">
                        <Skeleton variant="circular" className="w-14 h-14" />
                        <div className="space-y-2 flex-1 max-w-xs">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                      <div className="hidden sm:flex flex-col gap-2 flex-1 items-center">
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-5 w-1/4" />
                      </div>
                      <Skeleton className="w-24 h-8 rounded-full" />
                    </div>
                  ))
                ) : (
                  <>
                    {dashData?.highRiskPatients?.length > 0 ? (
                      dashData.highRiskPatients.map((p: any) => (
                        <div key={p.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border-l-4 border-l-red-500 border border-primary/5 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-all group/card">
                          {/* Info Section */}
                          <div className="flex items-center gap-4 xl:w-1/3">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary/10 overflow-hidden flex-shrink-0 flex items-center justify-center text-primary font-bold border border-primary/20 shadow-inner">
                              {p.avatarUrl ? (
                                <img src={p.avatarUrl} alt={p.fullName} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.fullName || '')}&background=random`; }} />
                              ) : (
                                p.fullName?.charAt(0)
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-base md:text-lg text-slate-700 dark:text-white truncate flex items-center gap-2">
                                {p.fullName}
                                {p.treatmentStatus && <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30 text-[11px] font-bold rounded-full">{p.treatmentStatus}</span>}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-[13px] text-slate-500 mt-1 font-medium">
                                <span>{p.age} tuổi</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{p.chronicCondition}</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block"></span>
                                <span className="flex items-center gap-1 text-slate-400 hidden sm:flex" title="Thời gian cập nhật chỉ số sinh tồn gần nhất"><span className="material-symbols-outlined text-[14px]">schedule</span> Cập nhật: {p.lastUpdate || 'Vừa xong'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Metrics Grid */}
                          <div className="flex items-center gap-3 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
                            <div className="flex flex-col bg-red-50 dark:bg-red-900/10 px-4 py-2.5 rounded-xl border border-red-100 dark:border-red-900/20 min-w-[110px]">
                              <span className="text-[12px] font-bold text-red-400 mb-0.5">Huyết áp</span>
                              <span className="text-lg font-bold text-red-600 dark:text-red-400 leading-none">{p.latestBp || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 min-w-[110px]">
                              <span className="text-[12px] font-bold text-slate-400 mb-0.5">Glucose</span>
                              <span className="text-lg font-bold text-slate-700 dark:text-slate-200 leading-none">{p.latestGlucose || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 min-w-[110px]">
                              <span className="text-[12px] font-bold text-slate-400 mb-0.5">Nhịp tim</span>
                              <span className="text-lg font-bold text-slate-700 dark:text-slate-200 leading-none">{p.latestHeartRate || 'N/A'} <span className="text-[10px] font-bold text-slate-400">bpm</span></span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between xl:justify-end gap-6 w-full xl:w-auto border-t xl:border-t-0 border-slate-100 dark:border-slate-800 pt-4 xl:pt-0">
                            <div className="flex flex-col items-start xl:items-end">
                              <span className="bg-red-500 text-white text-[14px] font-bold px-4 py-1.5 rounded-lg shadow-sm shadow-red-500/20 mb-1">Nguy cấp</span>
                              <span className={`text-[12px] font-bold ${p.trendColor || 'text-red-500'} flex items-center gap-1`}><span className="material-symbols-outlined text-[16px]">trending_up</span> {p.healthTrend || 'Cần chú ý'}</span>
                            </div>
                            <div className="flex gap-3">
                              <Link to={ROUTES.DOCTOR.MESSAGES} title="Nhắn tin" className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 hover:bg-blue-500 hover:text-white hover:-translate-y-1 transition-all flex items-center justify-center shadow-sm">
                                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
                              </Link>
                              <button
                                onClick={() => { setIsAdviceModalOpen(true); setAdvicePatientName(p.fullName); setAdvicePatient(p); setAdvicePatientAvatar(p.avatarUrl); }}
                                title="Gửi lời khuyên"
                                className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 hover:bg-amber-500 hover:text-white hover:-translate-y-1 transition-all flex items-center justify-center shadow-sm">
                                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-primary/5 text-slate-400 italic">
                        Không có bệnh nhân nguy cơ cao nào hiện tại
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Dynamic Chart Section */}
              <section className="col-span-12 lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-primary/5 shadow-sm text-left relative overflow-hidden group">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 px-2">
                  <div className="space-y-1">
                    {isLoading ? (
                      <Skeleton className="h-6 w-48 mb-2" />
                    ) : (
                      <h2 className="text-[19px] font-medium text-slate-900 dark:text-white leading-tight">Biểu đồ rủi ro bệnh nhân</h2>
                    )}
                    {isLoading ? (
                      <Skeleton className="h-4 w-64" />
                    ) : (
                      <p className="text-[15px] text-slate-500 font-medium tracking-tight">Thống kê ca nguy cơ cao theo thời gian</p>
                    )}
                  </div>
                  {isLoading ? (
                    <Skeleton className="w-40 h-10 shadow-sm" />
                  ) : (
                    <Dropdown
                      options={['7 ngày qua', '30 ngày qua']}
                      value={dashboardTimeRange}
                      onChange={setDashboardTimeRange}
                      className="min-w-[140px]"
                    />
                  )}
                </div>

                <div className="h-[250px] mt-6 w-full relative">
                  {(isLoading || isChartLoading) ? (
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
                        data={(patientStats?.chartDataBp || []).map((val: number | null, i: number, arr: any[]) => {
                          const d = new Date();
                          d.setDate(d.getDate() - (arr.length - 1 - i));
                          return {
                            name: dashboardTimeRange === '30 ngày qua'
                              ? `${d.getDate()}/${d.getMonth() + 1}`
                              : ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][d.getDay()],
                            value: val === null ? null : Math.round(val)
                          };
                        })}
                        margin={{ top: 10, right: 25, left: 5, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorBp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#cbd5e1" opacity={0.4} />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                          dy={12}
                          minTickGap={dashboardTimeRange === '30 ngày qua' ? 60 : 5}
                          interval={dashboardTimeRange === '30 ngày qua' ? 'preserveStartEnd' : 0}
                        />
                        <YAxis
                          domain={['dataMin - 5', 'dataMax + 5']}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                          dx={-10}
                          width={40}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)', backgroundColor: '#fff', color: '#0f172a', fontWeight: 'bold', padding: '8px 12px' }}
                          itemStyle={{ color: '#0ea5e9', fontWeight: 'bold', fontSize: '13px' }}
                          cursor={{ stroke: '#2dd4bf', strokeWidth: 1, strokeDasharray: '4 4' }}
                          formatter={(value: number) => [`${value} mmHg`, 'Huyết áp']}
                          labelStyle={{ color: '#64748b', marginBottom: '2px', fontSize: '11px', fontWeight: '500' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#2dd4bf"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorBp)"
                          connectNulls={true}
                          activeDot={{ r: 6, strokeWidth: 0, fill: "#0f766e" }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </section>

              {/* Sidebar Content */}
              <aside className="col-span-12 lg:col-span-4 space-y-8">
                {/* Quick Actions */}
                <section>
                  {isLoading ? (
                    <Skeleton className="h-7 w-40 mb-4" />
                  ) : (
                    <h2 className="text-xl font-medium text-slate-900 dark:text-slate-400 mb-4">Thao tác nhanh</h2>
                  )}
                  <div className="grid grid-cols-1 gap-3">
                    {isLoading ? (
                      [...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-primary/10 shadow-sm h-[75px]">
                          <Skeleton className="w-10 h-10" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      ))
                    ) : (
                      <>
                        <button
                          onClick={() => setIsPrescriptionModalOpen(true)}
                          className="relative flex items-center gap-4 p-4 bg-white dark:bg-slate-800/50 hover:bg-violet-50/50 dark:hover:bg-violet-900/20 transition-all duration-300 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-800 shadow-sm hover:shadow-md text-left group overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/0 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative w-12 h-12 bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-500/20 dark:to-violet-500/10 text-violet-600 dark:text-violet-400 group-hover:scale-110 rounded-xl flex items-center justify-center transition-all duration-300 shadow-inner">
                            <span className="material-symbols-outlined text-[24px]">prescriptions</span>
                          </div>
                          <div className="relative z-10 flex flex-col">
                            <span className="font-semibold text-[15px] text-slate-900 dark:text-slate-100 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">Kê đơn thuốc mới</span>
                            <span className="text-[12px] font-medium text-slate-500">Tạo đơn thuốc điện tử</span>
                          </div>
                          <span className="material-symbols-outlined absolute right-4 text-slate-300 group-hover:text-violet-500 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">arrow_forward</span>
                        </button>
                        <button
                          onClick={() => { setIsAdviceModalOpen(true); setAdvicePatient(null); setAdvicePatientName(''); setAdvicePatientAvatar(''); }}
                          className="relative flex items-center gap-4 p-4 bg-white dark:bg-slate-800/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-all duration-300 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 shadow-sm hover:shadow-md text-left group overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-500/20 dark:to-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 rounded-xl flex items-center justify-center transition-all duration-300 shadow-inner">
                            <span className="material-symbols-outlined text-[24px]">mark_email_read</span>
                          </div>
                          <div className="relative z-10 flex flex-col">
                            <span className="font-semibold text-[15px] text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">Gửi lời khuyên</span>
                            <span className="text-[12px] font-medium text-slate-500">Nhắn tin dặn dò bệnh nhân</span>
                          </div>
                          <span className="material-symbols-outlined absolute right-4 text-slate-300 group-hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">arrow_forward</span>
                        </button>
                        <button
                          onClick={() => setIsModalOpen(true)}
                          className="relative flex items-center gap-4 p-4 bg-white dark:bg-slate-800/50 hover:bg-amber-50/50 dark:hover:bg-amber-900/20 transition-all duration-300 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-800 shadow-sm hover:shadow-md text-left group overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/0 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-500/20 dark:to-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 rounded-xl flex items-center justify-center transition-all duration-300 shadow-inner">
                            <span className="material-symbols-outlined text-[24px]">edit_calendar</span>
                          </div>
                          <div className="relative z-10 flex flex-col">
                            <span className="font-semibold text-[15px] text-slate-900 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">Đặt lịch tái khám</span>
                            <span className="text-[12px] font-medium text-slate-500">Hẹn lịch khám tiếp theo</span>
                          </div>
                          <span className="material-symbols-outlined absolute right-4 text-slate-300 group-hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">arrow_forward</span>
                        </button>
                      </>
                    )}
                  </div>
                </section>

                {/* Recent Appointments */}
                <section className="mt-8">
                  {isLoading ? (
                    <Skeleton className="h-6 w-40 mb-6" />
                  ) : (
                    <h2 className="text-[18px] font-medium text-slate-900 dark:text-slate-400 mb-6 tracking-tight">Lịch hẹn sắp tới</h2>
                  )}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-primary/5 shadow-sm divide-y divide-primary/5 overflow-hidden">
                    {isLoading ? (
                      [...Array(3)].map((_, i) => (
                        <div key={i} className="p-5 flex items-center gap-5 h-[85px]">
                          <div className="min-w-[70px] space-y-1">
                            <Skeleton className="h-3 w-10" />
                            <Skeleton className="h-5 w-14" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-full" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        {dashData?.upcomingAppointments?.length > 0 ? (
                          dashData.upcomingAppointments.slice(0, 3).map((appt: any) => {
                            const timeParts = appt.displayTime?.split(' ') || [];
                            const timeStr = timeParts.pop() || 'N/A';
                            const dateStr = timeParts.join(' ');

                            return (
                              <div key={appt.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group">
                                <div className="flex-shrink-0 text-center min-w-[80px] bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800">
                                  <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                                    {appt.isPast ? 'Đã qua' : 'Sắp tới'}
                                  </p>
                                  <p className="text-[17px] font-black text-primary leading-tight">
                                    {timeStr}
                                  </p>
                                  <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                                    {dateStr}
                                  </p>
                                </div>

                                <div className="flex-1 min-w-0 flex items-center gap-3">
                                  <div className="relative flex-shrink-0">
                                    {appt.avatarUrl ? (
                                      <img src={appt.avatarUrl} alt="Avatar" className="w-11 h-11 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm" />
                                    ) : (
                                      <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[16px] border-2 border-white dark:border-slate-800 shadow-sm">
                                        {appt.patientName?.charAt(0)}
                                      </div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-[1px] shadow-sm border border-slate-100 dark:border-slate-800">
                                      <span className={`material-symbols-outlined text-[13px] leading-none ${appt.gender === 'Nam' ? 'text-blue-500' : 'text-pink-500'}`}>
                                        {appt.gender === 'Nam' ? 'male' : 'female'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex-1 overflow-hidden">
                                    <p className="font-bold truncate text-[15px] text-slate-900 dark:text-white group-hover:text-primary transition-colors mb-0.5">{appt.patientName}</p>
                                    <div className="flex items-center gap-1.5 text-[13px] text-slate-500 font-medium truncate">
                                      {appt.age && <span>{appt.age} tuổi</span>}
                                      {appt.age && appt.condition && <span className="w-1 h-1 bg-slate-300 rounded-full flex-shrink-0"></span>}
                                      <span className="truncate">{appt.condition || appt.reason || appt.type || 'Khám định kỳ'}</span>
                                    </div>
                                  </div>
                                </div>
                                <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-all text-xl">chevron_right</span>
                              </div>
                            )
                          })
                        ) : (
                          <div className="p-8 text-center text-slate-400 text-sm italic">Không có lịch hẹn sắp tới</div>
                        )}
                      </>
                    )}
                  </div>
                  {isLoading ? (
                    <Skeleton className="w-full h-[46px] mt-4 rounded-lg" />
                  ) : (
                    <Link
                      to={ROUTES.DOCTOR.APPOINTMENTS}
                      className="w-full mt-4 py-3 border border-dashed border-primary/30 text-primary font-bold text-[14px] rounded-lg hover:bg-primary/5 transition-colors flex items-center justify-center"
                    >
                      Xem toàn bộ lịch trình
                    </Link>
                  )}
                </section>
              </aside>
            </div>
          </div>
        </main>

        <RescheduleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          currentYear={currentYear}
          setCurrentYear={setCurrentYear}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          selectedTime={selectedTime}
          setSelectedTime={setSelectedTime}
          isSaving={isSaving}
          onSave={handleSaveReschedule}
          patients={myPatients}
        />

        <PrescriptionModal
          isOpen={isPrescriptionModalOpen}
          onClose={() => setIsPrescriptionModalOpen(false)}
          isAddingNewMedicine={isAddingNewMedicine}
          setIsAddingNewMedicine={setIsAddingNewMedicine}
          medications={medications}
          setMedications={setMedications}
          removeMedication={removeMedication}
          newMedForm={newMedForm}
          setNewMedForm={setNewMedForm}
          formErrors={formErrors as any}
          setFormErrors={setFormErrors as any}
          addMedicationToPrescription={addMedicationToPrescription}
          isSaving={isSaving}
          onSave={handleSavePrescription}
          patients={myPatients}
        />



        <AdviceModal
          isOpen={isAdviceModalOpen}
          onClose={() => setIsAdviceModalOpen(false)}
          adviceCategory={adviceCategory}
          setAdviceCategory={setAdviceCategory}
          adviceContent={adviceContent}
          setAdviceContent={setAdviceContent}
          isSaving={isAdviceSaving}
          onSave={handleSaveAdvice}
          patientName={advicePatientName}
          patientAvatar={advicePatientAvatar}
          patientData={advicePatient}
        />

        <Toast
          show={showToast}
          title={toastTitle}
          onClose={() => setShowToast(false)}
        />
        {/* MODAL REMOVED - Redirecting to appointments instead */}
      </div>

      <style>{`
        @keyframes toast-progress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
    </>
  );
}
