import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientApi } from '../api/patient';
import AddAppointmentModal from '../features/patient/components/AddAppointmentModal';
import { AreaChart, Area, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const PatientDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [summary, setSummary] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [medications, setMedications] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [conversation, setConversation] = useState<any>(null);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [latestAdvice, setLatestAdvice] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddAppointmentModalOpen, setIsAddAppointmentModalOpen] = useState(false);
    const [isSavingAppointment, setIsSavingAppointment] = useState(false);

    const getDayVn = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        return days[date.getDay()];
    };

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await patientApi.getDashboard();
            if (res.success) {
                const data = res.data;
                setSummary(data.healthMetrics || []);
                setProfile(data.profile);
                setMedications(data.todayMedications || []);
                setAppointments(data.nextAppointment ? [data.nextAppointment] : []);
                setAlerts(data.alerts || []);
                setConversation(data.primaryDoctorChat);
                setLatestAdvice(data.latestAdvice);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getMetric = (type: string) => summary.find(s => s.metricType === type);

    const getStatusVn = (status: string) => {
        switch (status) {
            case 'NORMAL': return 'Ổn định';
            case 'BORDERLINE_HIGH': return 'Cận cao';
            case 'HIGH': return 'Cao';
            case 'LOW': return 'Thấp';
            default: return 'Bình thường';
        }
    };

    const bloodSugar = getMetric('BLOOD_SUGAR');
    const bloodPressure = getMetric('BLOOD_PRESSURE');
    const heartRate = getMetric('HEART_RATE');
    const spO2 = getMetric('SPO2');
    const hbA1c = getMetric('HBA1C');
    
    const parseAdvice = (text: string | null) => {
        if (!text) return null;
        const match = text.match(/^\[Tư vấn ([^\]]+)\](.*)/s);
        if (match) {
            return { category: match[1].trim(), content: match[2].trim() };
        }
        return { category: 'Chung', content: text };
    };
    const currentAdvice = parseAdvice(latestAdvice);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* 1. Profile Summary */}
            <section className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-8 items-center text-left">
                {isLoading ? (
                    <>
                        <div className="h-24 w-24 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse border-4 border-slate-50 dark:border-slate-800/50 shrink-0"></div>
                        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="h-3 bg-slate-50 dark:bg-slate-800 rounded w-16 animate-pulse"></div>
                                    <div className="h-5 bg-slate-100 dark:bg-slate-800 animate-pulse rounded w-24"></div>
                                </div>
                            ))}
                        </div>
                        <div className="h-10 w-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                    </>
                ) : (
                    <>
                        <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-4 border-primary/10 shrink-0">
                            <img
                                alt="Patient Avatar"
                                className="h-full w-full object-cover"
                                src={profile?.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuDtszSUkFV8-ySPzx5ShEcygZMGlLkCDs4d0864MNknx5EExH89OU4c8yPh8OVN1hs4lphO6fiLk2zNxiEVtKYNCEmFI8wlHiQWp_eNhWhDrDTnx0CzMMhMxEazQTGHz9vkoPO8nr1skAG0vHgWNL9WYSMCVUQCb0F38yyb4j9YXgtT9zCiHC8m8luedS4ciJqp8z63x9_AVk2Iy6aAsM3rPa-p8uNkLf-Ai8Ztas1voDuD-ytltUPtIAtEVk2Zdfo5YiyAOwuAFVk"}
                            />
                        </div>
                        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Chẩn đoán</p>
                                <p className="text-base font-bold text-primary">{profile?.chronicCondition || 'Đang cập nhật'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Nhóm máu</p>
                                <p className="text-base font-bold text-slate-900 dark:text-white">{profile?.bloodType || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Thể trạng</p>
                                <p className="text-base font-bold text-slate-900 dark:text-white">
                                    {profile?.heightCm ? `${profile.heightCm}cm` : '--'} | {profile?.weightKg ? `${profile.weightKg}kg` : '--'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tiền sử</p>
                                <p className="text-base font-bold text-slate-900 dark:text-white truncate" title={profile?.chronicDiseases?.join(', ')}>
                                    {profile?.chronicDiseases && profile.chronicDiseases.length > 0
                                        ? profile.chronicDiseases.join(', ')
                                        : 'Không có'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/patient/profile')}
                            className="px-6 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap text-slate-700 dark:text-slate-300"
                        >
                            Chỉnh sửa hồ sơ
                        </button>
                    </>
                )}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 3. Health Metrics Input & Charts */}
                <div className="lg:col-span-2 space-y-6 text-left">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">show_chart</span>
                            Chỉ số sức khỏe & Xu hướng
                        </h2>
                        <button
                            onClick={() => navigate('/patient/metrics')}
                            className="text-primary font-bold text-sm flex items-center gap-1 hover:underline"
                        >
                            <span className="material-symbols-outlined text-sm">add_circle</span> Nhập chỉ số mới
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Metric 1: Blood Sugar */}
                        {isLoading ? (
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse">
                                <div className="flex justify-between mb-4">
                                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-32"></div>
                                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-16"></div>
                                </div>
                                <div className="flex items-baseline gap-2 mb-6">
                                    <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                                </div>
                                <div className="h-44 w-full bg-slate-50 dark:bg-slate-800/50 rounded-lg"></div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="flex justify-between mb-4">
                                    <p className="text-sm font-medium text-slate-500">Đường huyết ({bloodSugar?.unit || 'mmol/L'})</p>
                                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${bloodSugar?.status === 'NORMAL' ? 'bg-green-100 text-green-700' : bloodSugar?.status === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {bloodSugar ? getStatusVn(bloodSugar.status) : 'Chưa có'}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-2 mb-6">
                                    <p className="text-3xl font-bold">{bloodSugar?.latestValue || '--'}</p>
                                    {bloodSugar?.changePercentage && (
                                    <p className={`text-sm font-bold flex items-center ${bloodSugar?.trend === 'UP' ? 'text-red-500' : 'text-green-500'
                                        }`}>
                                        <span className="material-symbols-outlined text-sm">
                                            {bloodSugar?.trend === 'UP' ? 'trending_up' : 'trending_down'}
                                        </span>
                                        {bloodSugar.changePercentage}
                                    </p>
                                    )}
                                </div>
                                <div className="h-44 w-full mt-4">
                                    {bloodSugar?.chartData && bloodSugar.chartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart
                                                data={bloodSugar.chartData.map((d: any) => ({
                                                    name: getDayVn(d.measuredAt),
                                                    value: Number(d.value)
                                                }))}
                                                margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                                            >
                                                <defs>
                                                    <linearGradient id="gradSugar" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#3bb9f3" stopOpacity={0.2} />
                                                        <stop offset="100%" stopColor="#3bb9f3" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis
                                                    dataKey="name"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                                                    interval="preserveStartEnd"
                                                    minTickGap={30}
                                                    height={30}
                                                />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    labelStyle={{ fontWeight: 'bold', color: '#3bb9f3' }}
                                                />
                                                <Area type="monotone" dataKey="value" stroke="#3bb9f3" strokeWidth={4} fill="url(#gradSugar)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 pb-6">
                                            <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-700 mb-1">analytics</span>
                                            <p className="text-xs font-medium">Chưa có dữ liệu đồ thị</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Metric 2: Blood Pressure */}
                        {isLoading ? (
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse">
                                <div className="flex justify-between mb-4">
                                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-32"></div>
                                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-16"></div>
                                </div>
                                <div className="flex items-baseline gap-2 mb-6">
                                    <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                                </div>
                                <div className="h-44 w-full bg-slate-50 dark:bg-slate-800/50 rounded-lg"></div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex justify-between mb-4">
                                <p className="text-sm font-medium text-slate-500">Huyết áp ({bloodPressure?.unit || 'mmHg'})</p>
                                <span className={`px-2 py-0.5 text-xs font-bold rounded ${bloodPressure?.status === 'NORMAL' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                    }`}>
                                    {bloodPressure ? getStatusVn(bloodPressure.status) : 'Chưa có'}
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2 mb-6">
                                <p className="text-3xl font-bold">
                                    {bloodPressure?.latestValue || '--'}
                                    {bloodPressure?.latestValueSecondary ? `/${bloodPressure.latestValueSecondary}` : ''}
                                </p>
                                {bloodPressure?.changePercentage && (
                                <p className={`text-sm font-bold flex items-center ${bloodPressure?.trend === 'UP' ? 'text-red-500' : 'text-green-500'
                                    }`}>
                                    <span className="material-symbols-outlined text-sm">
                                        {bloodPressure?.trend === 'UP' ? 'trending_up' : 'trending_down'}
                                    </span>
                                    {bloodPressure.changePercentage}
                                </p>
                                )}
                            </div>
                            <div className="h-44 w-full mt-4">
                                {bloodPressure?.chartData && bloodPressure.chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={bloodPressure.chartData.map((d: any) => ({
                                                name: getDayVn(d.measuredAt),
                                                value: Number(d.value)
                                            }))}
                                            margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                                        >
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                                                interval="preserveStartEnd"
                                                minTickGap={30}
                                                height={30}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                labelStyle={{ fontWeight: 'bold', color: '#3bb9f3' }}
                                            />
                                            <Bar dataKey="value" fill="#3bb9f3" radius={[4, 4, 0, 0]} opacity={0.8} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 pb-6">
                                        <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-700 mb-1">analytics</span>
                                        <p className="text-xs font-medium">Chưa có dữ liệu đồ thị</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        )}
                    </div>

                    {/* Secondary Metrics Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {isLoading ? (
                            [...Array(3)].map((_, i) => (
                                <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm animate-pulse">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                                    <div className="space-y-2 flex-1">
                                        <div className="h-3 bg-slate-50 dark:bg-slate-800/50 rounded w-12"></div>
                                        <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-20"></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <>
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm">
                                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-500">
                                        <span className="material-symbols-outlined filled">favorite</span>
                                    </div>
                                    <div>
                                        <p className="text-[14px] text-slate-500">Nhịp tim</p>
                                        <p className="text-lg font-bold">
                                            {heartRate?.latestValue || '--'} <span className="text-xs font-normal text-slate-400">{heartRate?.unit || 'bpm'}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-500">
                                        <span className="material-symbols-outlined filled">air</span>
                                    </div>
                                    <div>
                                        <p className="text-[14px] text-slate-500">SpO2</p>
                                        <p className="text-lg font-bold">
                                            {spO2?.latestValue || '--'}<span className="text-xs font-normal text-slate-400">{spO2?.unit || '%'}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm">
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-500">
                                        <span className="material-symbols-outlined filled">science</span>
                                    </div>
                                    <div>
                                        <p className="text-[14px] text-slate-500">HbA1c</p>
                                        <p className="text-lg font-bold">
                                            {hbA1c?.latestValue || '--'}<span className="text-xs font-normal text-slate-400">{hbA1c?.unit || '%'}</span>
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Sidebar Widgets */}
                <div className="space-y-6 text-left">
                    {/* 4. Automatic Alerts */}
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-xl">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2 font-bold">
                            <span className="material-symbols-outlined">warning</span>
                            Cảnh báo quan trọng
                        </div>
                        {isLoading ? (
                            <div className="h-10 bg-red-100/50 dark:bg-red-900/40 animate-pulse rounded w-full"></div>
                        ) : alerts.length > 0 ? (
                            <div className="space-y-3">
                                {alerts.slice(0, 2).map((alert: any) => (
                                    <div key={alert.id} className="border-b border-red-200 dark:border-red-900/40 pb-2 last:border-0">
                                        <p className="text-red-800 dark:text-red-400 font-bold text-xs uppercase mb-1">{alert.title}</p>
                                        <p className="text-sm text-red-700 dark:text-red-300">
                                            {alert.message?.replace(/\bHIGH\b/g, 'CAO').replace(/\bLOW\b/g, 'THẤP')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-red-700 dark:text-red-300">
                                Chỉ số hiện tại ổn định. Vui lòng duy trì các thói quen vận động và ăn uống khoa học.
                            </p>
                        )}
                    </div>

                    {/* 2. Medication Management */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                            <h3 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                <span className="material-symbols-outlined text-primary">pill</span>
                                Lịch uống thuốc
                            </h3>
                            <button
                                onClick={() => navigate('/patient/prescriptions')}
                                className="text-[14px] text-primary font-bold hover:underline"
                            >
                                Xem tất cả
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            {isLoading ? (
                                [...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 animate-pulse">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-24"></div>
                                            <div className="h-3 bg-slate-50 dark:bg-slate-800/50 rounded w-32"></div>
                                        </div>
                                    </div>
                                ))
                            ) : medications && medications.length > 0 ? (
                                medications.map((med: any) => (
                                    <div key={med.id} className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            med.todayStatus === 'TAKEN' 
                                            ? 'bg-primary/10 text-primary' 
                                            : 'border-2 border-primary text-primary animate-pulse'
                                        }`}>
                                            <span className="material-symbols-outlined text-lg">
                                                {med.todayStatus === 'TAKEN' ? 'done' : 'alarm'}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold">{med.medicationName} {med.dosage}</p>
                                            <p className="text-[13px] text-slate-500">
                                                {med.scheduledTime} - {med.todayStatus === 'TAKEN' ? 'Đã uống' : 'Cần uống'}
                                            </p>
                                        </div>
                                        {med.todayStatus !== 'TAKEN' && (
                                            <button 
                                                onClick={async () => {
                                                    try {
                                                        await patientApi.logMedication({ scheduleId: med.id, status: 'TAKEN' });
                                                        fetchData();
                                                    } catch (e) {}
                                                }}
                                                className="bg-primary text-slate-900 px-3 py-1 rounded-lg text-xs font-bold transition-transform"
                                            >
                                                Uống
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-slate-500 font-medium py-2 text-center">Không có lịch uống thuốc hôm nay</div>
                            )}
                        </div>
                    </div>

                    {/* 5. Follow-up Appointments */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 text-left">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                <span className="material-symbols-outlined text-primary">event_note</span>
                                Lịch khám sắp tới
                            </h3>
                            <button 
                                onClick={() => setIsAddAppointmentModalOpen(true)}
                                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-sm">add</span> Đặt lịch ngay
                            </button>
                        </div>
                        {isLoading ? (
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border-l-4 border-slate-200 animate-pulse space-y-3">
                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                                <div className="h-5 bg-slate-300 dark:bg-slate-600 rounded w-40"></div>
                                <div className="space-y-1">
                                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                                </div>
                            </div>
                        ) : appointments && appointments.length > 0 ? (
                            appointments.slice(0, 1).map((appt: any) => {
                                const d = new Date(appt.appointmentTime);
                                const dateStr = `Ngày ${d.getDate()} Tháng ${d.getMonth() + 1}`;
                                const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                                return (
                                <div key={appt.id} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border-l-4 border-primary relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-xs font-bold text-primary uppercase tracking-widest">{dateStr}</p>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    appt.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                                    appt.status === 'SCHEDULED' ? 'bg-green-100 text-green-700' :
                                                    'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {appt.status === 'PENDING' ? 'Chờ xác nhận' : 
                                                     appt.status === 'SCHEDULED' ? 'Đã xác nhận' : 
                                                     appt.status === 'CANCELLED' ? 'Đã hủy' : 'Hoàn thành'}
                                                </span>
                                            </div>
                                            <p className="text-base font-bold text-slate-900 dark:text-white">{appt.reason || (appt.appointmentType === 'ONLINE' ? 'Khám Online' : 'Khám Trực tiếp')}</p>
                                        </div>
                                        <span className="material-symbols-outlined text-slate-400 cursor-pointer">more_vert</span>
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span className="material-symbols-outlined text-sm">person_pin</span>
                                            {appt.doctorName}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                            <span className="material-symbols-outlined text-sm">schedule</span>
                                            {timeStr}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => navigate('/patient/appointments')}
                                        className="w-full mt-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors relative z-10"
                                    >
                                        Chi tiết lịch khám
                                    </button>
                                </div>
                                );
                            })
                        ) : (
                            <div className="text-sm text-slate-500 font-medium py-2 text-center">Không có lịch khám sắp tới</div>
                        )}
                    </div>

                    {/* 5.5 Latest Medical Advice (Spotlight) */}
                    {currentAdvice && (
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-5 relative overflow-hidden text-left shadow-sm">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-200/20 rounded-full -mr-8 -mt-8 animate-pulse"></div>
                            <div className="flex items-center justify-between mb-3 relative z-10">
                                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-extrabold text-sm tracking-wide uppercase">
                                    <span className="material-symbols-outlined text-[18px] filled">tips_and_updates</span>
                                    Lời khuyên mới nhất
                                </div>
                                <span className="bg-amber-200 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                                    {currentAdvice.category}
                                </span>
                            </div>
                            <p className="text-slate-800 dark:text-slate-100 font-bold text-[15px] leading-relaxed relative z-10 italic">
                                "{currentAdvice.content}"
                            </p>
                            <div className="mt-3 flex justify-end relative z-10">
                                <p className="text-[11px] font-medium text-amber-600/70 dark:text-amber-500/70">- Từ Bác sĩ phụ trách</p>
                            </div>
                        </div>
                    )}

                    {/* 6. Doctor Chat */}
                    <div 
                        onClick={() => navigate('/patient/messages')}
                        className="bg-primary/10 dark:bg-primary/5 rounded-xl border border-primary/20 p-4 flex items-center gap-4 group cursor-pointer hover:bg-primary/15 transition-all text-left">
                        {isLoading ? (
                            <>
                                <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 animate-pulse"></div>
                                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-16 animate-pulse"></div>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-primary/20 animate-pulse"></div>
                            </>
                        ) : conversation ? (
                            <>
                                <div className="h-12 w-12 rounded-full bg-primary/20 flex-shrink-0 relative overflow-hidden">
                                    <img alt="Doctor" className="object-cover h-full w-full" src={conversation.doctorAvatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(conversation.doctorName)} />
                                    <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-slate-900 rounded-full ${conversation.isOnline ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate">{conversation.doctorName}</p>
                                    <p className="text-xs text-slate-500 truncate">{conversation.lastMessage || 'Bắt đầu trò chuyện'}</p>
                                </div>
                                <button className="bg-primary p-2 rounded-full text-slate-900 shadow-md transition-transform">
                                    <span className="material-symbols-outlined">send</span>
                                </button>
                            </>
                        ) : (
                            <div className="flex-1 text-center text-sm font-medium text-slate-500">
                                Chưa có cuộc trò chuyện nào
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AddAppointmentModal 
                isOpen={isAddAppointmentModalOpen}
                onClose={() => setIsAddAppointmentModalOpen(false)}
                onSave={async (data) => {
                    setIsSavingAppointment(true);
                    try {
                        const res = await patientApi.createAppointment(data);
                        if (res.success) {
                            setIsAddAppointmentModalOpen(false);
                            fetchData();
                        }
                    } catch (e) {
                        console.error('Failed to create appointment', e);
                    } finally {
                        setIsSavingAppointment(false);
                    }
                }}
                isSaving={isSavingAppointment}
            />

            <style>{`
                .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
                .filled { font-variation-settings: 'FILL' 1; }
            `}</style>
        </div>
    );
};

export default PatientDashboard;
