import AdminLayout from '../layouts/AdminLayout';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import Dropdown from '../components/ui/Dropdown';
import { adminApi } from '../api/admin';

export default function AdminReports() {
  const [reportType, setReportType] = useState('Tháng');
  const [performanceFilter, setPerformanceFilter] = useState('Tất cả kết quả');
  const [reportsData, setReportsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [reportType, performanceFilter]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getReportsData(reportType, performanceFilter);
      if (res && res.data) {
        const processedData = {
          ...res.data,
          growthTrend: (res.data.growthTrend || []).map((pt: any) => ({
            ...pt,
            label: pt.label.replace(/^Th\. /i, 'Tháng ')
          }))
        };
        setReportsData(processedData);
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    { label: 'Chỉ số hài lòng (NPS)', value: reportsData?.summary?.nps || '0', trend: '+0.0', trendType: 'up', icon: 'sentiment_very_satisfied', color: 'emerald' },
    { label: 'Thời gian khám TB', value: reportsData?.summary?.avgTime || '0', unit: 'phút', trend: 'Ổn định', trendType: 'check', icon: 'schedule', color: 'blue' },
    { label: 'Tỷ lệ tái khám', value: reportsData?.summary?.returnRate || '0', unit: '%', trend: 'Ổn định', trendType: 'check', icon: 'event_repeat', color: 'primary' },
    { label: 'Tỷ lệ giữ chân', value: reportsData?.summary?.retentionRate || '0', unit: '%', trend: 'Ổn định', trendType: 'check', icon: 'favorite', color: 'red' }
  ];

  return (
    <AdminLayout>
      <section className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-700 font-display">
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            {isLoading ? (
              <div className="space-y-3 mb-2">
                <div className="h-8 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-48 sm:w-64"></div>
                <div className="h-4 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded w-64 sm:w-96"></div>
              </div>
            ) : (
              <>
                <h2 className="text-lg md:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">Báo cáo hợp nhất</h2>
                <p className="text-[13px] md:text-[16px] text-slate-500 mt-1 font-medium italic-none">Phân tích dữ liệu vận hành toàn hệ thống</p>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {isLoading ? (
              <div className="w-48 h-10 bg-primary/5 dark:bg-slate-800 animate-pulse rounded-xl border border-primary/5"></div>
            ) : (
              <div className="bg-primary/5 dark:bg-slate-800 rounded-xl p-1 flex gap-1 border border-primary/5">
                {['Ngày', 'Tháng', 'Quý'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setReportType(type)}
                    className={`px-5 py-2 text-[14px] font-medium rounded-full transition-all ${reportType === type ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-700'
                      }`}
                  >
                    Theo {type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* High-level Stats Bento */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-primary/5 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
                  <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-full"></div>
                </div>
                <div className="h-4 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded w-32"></div>
                <div className="h-7 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-20"></div>
              </div>
            ))
          ) : (
            statCards.map((stat, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-primary/5 shadow-sm transition-all group hover:shadow-md">
                <div className="flex justify-between items-start mb-3 md:mb-4">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${stat.color === 'primary' ? 'bg-primary/10 text-primary' :
                    stat.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' :
                      stat.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' :
                        stat.color === 'amber' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' :
                          stat.color === 'red' ? 'bg-red-50 dark:bg-red-900/20 text-red-600' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-600'
                    }`}>
                    <span className="material-symbols-outlined text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] md:text-[13px] font-medium flex items-center gap-1 ${stat.trendType === 'up' ? 'bg-emerald-500 text-white' :
                    stat.trendType === 'up-warning' ? 'bg-amber-500 text-white' :
                      'bg-primary text-white'
                    }`}>
                    {stat.trend}
                  </span>
                </div>
                <p className="text-slate-500 text-[12px] md:text-[15px] font-medium mt-1 font-display tracking-tight leading-none">{stat.label}</p>
                <h3 className={`text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-2 leading-none`}>
                  {stat.value}
                  {stat.unit && <span className="text-[12px] md:text-[14px] font-bold ml-1 opacity-50">{stat.unit}</span>}
                </h3>
              </div>
            ))
          )}
        </div>

        {/* Charts & Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-4 md:p-8 rounded-2xl shadow-sm border border-primary/5 relative overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-8">
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-64"></div>
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 animate-pulse rounded w-48"></div>
                </div>
              ) : (
                <div>
                  <h4 className="text-[15px] md:text-[19px] font-bold tracking-tight text-slate-900 dark:text-white">Xu hướng tăng trưởng hệ thống</h4>
                  <p className="text-[12px] md:text-[15px] font-medium text-slate-500 mt-1">Dữ liệu tổng hợp toàn thời gian</p>
                </div>
              )}
            </div>

            <div className="relative h-48 md:h-64 w-full flex-1">
              {isLoading ? (
                <div className="absolute inset-0 flex items-end gap-2 px-2 overflow-hidden">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="flex-1 bg-primary/10 dark:bg-slate-800 animate-pulse rounded-t-lg" style={{ height: `${Math.random() * 80 + 20}%` }}></div>
                  ))}
                </div>
              ) : (
                <>
                  <svg className="w-full h-full relative z-10" preserveAspectRatio="none" viewBox="0 0 800 240">
                    <defs>
                      <linearGradient id="reportsChartGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#3bb9f3', stopOpacity: 0.15 }}></stop>
                        <stop offset="100%" style={{ stopColor: '#3bb9f3', stopOpacity: 0 }}></stop>
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,180 Q60,165 120,195 T240,150 T360,165 T480,120 T600,135 T720,105 T800,85 L800,240 L0,240 Z"
                      fill="url(#reportsChartGradient)"
                    />
                    <path
                      d="M0,180 Q60,165 120,195 T240,150 T360,165 T480,120 T600,135 T720,105 T800,85"
                      fill="none"
                      stroke="#3bb9f3"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute bottom-0 w-full flex justify-between px-2 text-[10px] font-extrabold text-slate-300 dark:text-slate-600 pt-6 uppercase tracking-widest pointer-events-none">
                    {reportsData?.growthTrend?.map((pt: any, i: number) => (
                      <span key={i}>{pt.label}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="mt-12 pt-8 border-t border-slate-50 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-4 md:gap-8">
                {isLoading ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                       <div className="h-4 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded w-24"></div>
                       <div className="h-5 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-16"></div>
                    </div>
                  ))
                ) : (
                  [
                    { label: 'Tỷ lệ tăng trưởng', val: reportsData?.analytics?.growthRate || '0%', icon: 'trending_up', color: 'emerald', sub: 'So với kỳ trước' },
                    { label: 'Điểm cao nhất', val: reportsData?.analytics?.peakMonth || 'N/A', icon: 'event', color: 'primary', sub: 'Dữ liệu thô' },
                    { label: 'Tỷ lệ quay lại', val: reportsData?.analytics?.returnRate || '0%', icon: 'replay', color: 'blue', sub: 'Bệnh nhân cũ' },
                    { label: 'Dự báo kỳ tới', val: reportsData?.analytics?.forecast || '0%', icon: 'bolt', color: 'amber', sub: 'Dự đoán thông minh' }
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1.5">
                        <span className={`material-symbols-outlined text-[18px] text-${item.color}-500`} style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                        <span className="text-[14px] font-medium text-slate-600 line-clamp-1">{item.label}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-[15px] font-black text-slate-900 dark:text-white leading-none tracking-tight">{item.val}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 md:p-8 rounded-2xl shadow-sm border border-primary/5 flex flex-col">
            {isLoading ? (
              <div className="space-y-2 mb-6 md:mb-10">
                <div className="h-6 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-48"></div>
                <div className="h-4 bg-slate-100 dark:bg-slate-800 animate-pulse rounded w-64"></div>
              </div>
            ) : (
              <>
                <h4 className="text-[15px] md:text-[19px] font-bold tracking-tight text-slate-900 dark:text-white mb-2 leading-tight">Phân bổ bệnh nhân</h4>
                <p className="text-[12px] md:text-[15px] font-medium text-slate-500 mb-6 md:mb-10">Mạng lưới chi nhánh tháng này</p>
              </>
            )}
            <div className="space-y-6 flex-1">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex justify-between">
                       <div className="h-4 bg-slate-100 dark:bg-slate-800 animate-pulse rounded w-32"></div>
                       <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-12"></div>
                    </div>
                    <div className="h-2 bg-slate-50 dark:bg-slate-800/50 animate-pulse rounded-full w-full"></div>
                  </div>
                ))
              ) : (
                reportsData?.clinicBreakdown?.map((item: any, idx: number) => (
                  <div key={idx} className="group">
                    <div className="flex items-center gap-3 mb-2 text-left">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[20px]">{item.icon || 'home_health'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[15px] font-medium text-slate-600 truncate max-w-[200px]">{item.name}</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-[14px] font-bold text-slate-900 dark:text-white">{item.value}</span>
                          <span className="text-[12px] font-medium text-slate-600">{item.percentage}</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-slate-50 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: item.percentage }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {isLoading ? (
              <div className="mt-10 h-14 bg-slate-900 dark:bg-slate-800 animate-pulse rounded-xl w-full"></div>
            ) : (
              <Link
                to={ROUTES.ADMIN.USERS}
                className="mt-10 py-3.5 w-full bg-slate-900 text-white text-[13px] font-medium rounded-full hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-slate-900/10"
              >
                Xem chi tiết bệnh nhân
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
            )}
          </div>
        </div>

        {/* Detailed Clinic PerformanceTable */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-primary/5 relative">
          <div className="p-4 md:p-8 border-b border-primary/5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-6 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-64"></div>
                <div className="h-4 bg-slate-100 dark:bg-slate-800 animate-pulse rounded w-80"></div>
              </div>
            ) : (
              <div>
                <h4 className="text-[15px] md:text-[19px] font-bold tracking-tight text-slate-900 dark:text-white">Chi tiết hiệu suất phòng khám</h4>
                <p className="text-[12px] md:text-[15px] font-medium text-slate-500 mt-1">Phân tích tải trọng và trạng thái vận hành</p>
              </div>
            )}
            {isLoading ? (
              <div className="w-44 h-10 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl shadow-sm border border-slate-100 dark:border-slate-800"></div>
            ) : (
              <Dropdown
                options={['Tất cả kết quả', 'Tốt', 'Ổn định', 'Cần lưu ý']}
                value={performanceFilter}
                onChange={setPerformanceFilter}
                className="w-44"
              />
            )}
          </div>
          {/* Mobile Card View */}
          <div className="block md:hidden">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="p-4 border-b border-slate-100 dark:border-slate-800 animate-pulse">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-40 mb-2"></div>
                  <div className="flex gap-3">
                    <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full w-16"></div>
                    <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full w-16"></div>
                  </div>
                </div>
              ))
            ) : (
              reportsData?.clinicPerformances?.map((row: any, idx: number) => (
                <div key={idx} className="p-4 border-b border-slate-50 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[14px] font-bold text-slate-900 dark:text-white truncate flex-1">{row.name}</p>
                    <span className={`font-black text-[13px] shrink-0 ml-2 ${row.status === 'Tốt' ? 'text-emerald-500' : row.status === 'Ổn định' ? 'text-primary' : 'text-amber-500'}`}>
                      {row.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg py-1.5">
                      <p className="text-[10px] text-slate-400 font-medium">Số ca</p>
                      <p className="text-[14px] font-extrabold text-slate-900 dark:text-white">{row.cases}</p>
                    </div>
                    <div className="text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg py-1.5">
                      <p className="text-[10px] text-slate-400 font-medium">Đặt lịch</p>
                      <p className="text-[14px] font-bold text-emerald-600">{row.appointments}</p>
                    </div>
                    <div className="text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg py-1.5">
                      <p className="text-[10px] text-slate-400 font-medium">Tuân thủ</p>
                      <span className={`text-[13px] font-bold ${parseInt(row.adherence) >= 90 ? 'text-emerald-500' : parseInt(row.adherence) >= 80 ? 'text-primary' : 'text-amber-500'}`}>
                        {row.adherence}
                      </span>
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
                <tr className="bg-slate-50/50 dark:bg-slate-800/10 border-b border-slate-50 dark:border-slate-800">
                  <th className="px-8 py-5">
                    {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-32"></div> : <span className="text-[15px] font-medium text-slate-500 leading-none">Phòng khám</span>}
                  </th>
                  <th className="px-6 py-5">
                    {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-16"></div> : <span className="text-[15px] font-medium text-slate-500 leading-none">Số ca khám</span>}
                  </th>
                  <th className="px-6 py-5">
                    {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-28"></div> : <span className="text-[15px] font-medium text-slate-500 leading-none">Lượt đặt lịch mới</span>}
                  </th>
                  <th className="px-6 py-5">
                    {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-24"></div> : <span className="text-[15px] font-medium text-slate-500 leading-none">Tuân thủ điều trị</span>}
                  </th>
                  <th className="px-8 py-5 text-right">
                    {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-16 ml-auto"></div> : <span className="text-[15px] font-medium text-slate-500 leading-none text-right">Trạng thái</span>}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-8 py-5">
                         <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-48"></div>
                      </td>
                      <td className="px-6 py-5">
                         <div className="h-4 bg-slate-100 dark:bg-slate-800/50 rounded w-16"></div>
                      </td>
                      <td className="px-6 py-5">
                         <div className="h-4 bg-slate-100 dark:bg-slate-800/50 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-5">
                         <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-full w-20"></div>
                      </td>
                      <td className="px-8 py-5 text-right">
                         <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-16 ml-auto"></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  reportsData?.clinicPerformances?.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-8 py-5 text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">{row.name}</td>
                      <td className="px-6 py-5 text-[15px] font-extrabold text-slate-900 dark:text-white">{row.cases}</td>
                      <td className="px-6 py-5 text-[15px] font-bold text-emerald-600 dark:text-emerald-400">{row.appointments}</td>
                      <td className="px-6 py-5">
                        <span className={`px-4 py-1 rounded-full text-[13px] font-bold shadow-sm inline-flex ${parseInt(row.adherence) >= 90 ? 'bg-emerald-500 text-white' :
                          parseInt(row.adherence) >= 80 ? 'bg-primary text-white' :
                            'bg-amber-500 text-white'
                          }`}>
                          {row.adherence}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className={`font-black text-[14px] ${row.status === 'Tốt' ? 'text-emerald-500' : row.status === 'Ổn định' ? 'text-primary' : 'text-amber-500'}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}
