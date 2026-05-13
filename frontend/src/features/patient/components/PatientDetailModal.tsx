import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Dropdown from '../../../components/ui/Dropdown';
import { doctorApi } from '../../../api/doctor';

interface PatientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
}

export default function PatientDetailModal({ isOpen, onClose, patient }: PatientDetailModalProps) {
  const [timeRange, setTimeRange] = useState('30 ngày qua');
  const [detailData, setDetailData] = useState<any>(null);
  const [activeDetailData, setActiveDetailData] = useState<any>(null);

  useEffect(() => {
    if (detailData) {
      setActiveDetailData(detailData);
    }
  }, [detailData]);

  useEffect(() => {
    if (isOpen && patient?.id) {
      document.body.style.overflow = 'hidden';
      const fetchDetail = async () => {
        try {
          const res = await doctorApi.getPatientDetail(patient.id);
          if (res.success) {
            setDetailData(res.data);
          }
        } catch (e) {
          console.error("Failed to fetch patient detail", e);
        }
      };
      fetchDetail();
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, patient?.id]);

  const renderModalContent = () => {
    const dataToRender = isOpen ? detailData : activeDetailData;
    
    const profile = dataToRender?.profile || patient || {};
    const metrics = dataToRender?.recentMetrics || [];
    const prescriptions = dataToRender?.prescriptionHistory || [];
    const appointments = dataToRender?.appointmentHistory || [];
    const adherence = dataToRender?.adherenceRate || 0;

    const getCleanRisk = (raw: string) => {
      if (!raw) return 'Ổn định';
      let norm = raw;
      if (norm === 'HIGH_RISK') norm = 'Nguy cơ cao';
      else if (norm === 'MONITORING') norm = 'Theo dõi';
      else if (norm === 'STABLE') norm = 'Ổn định';
      return norm.replace(/\([^)]*\)/g, '').trim();
    };

    const currentRisk = getCleanRisk(profile?.riskLevel || 'Ổn định');

    // 📊 Real-time dynamic SVG line generator
    const glucoseSeries = [...metrics]
      .filter((m: any) => m.metricType === 'BLOOD_SUGAR')
      .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());
      
    const bpSeries = [...metrics]
      .filter((m: any) => m.metricType === 'BLOOD_PRESSURE')
      .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());

    const generateSvgPath = (dataset: any[], valGetter: (o: any) => number, rangeMin: number, rangeMax: number, closePath = false) => {
      if (!dataset || dataset.length === 0) return "";
      const width = 800;
      const height = 200;
      const padding = 20;
      
      const points = dataset.map((d, i) => {
        const x = dataset.length > 1 ? (i / (dataset.length - 1)) * width : width / 2;
        const val = valGetter(d);
        const clamped = Math.max(rangeMin, Math.min(rangeMax, val));
        const pct = (clamped - rangeMin) / (rangeMax - rangeMin);
        const y = (height - padding) - (pct * (height - 2 * padding));
        return { x, y };
      });

      if (points.length === 1) {
        const p = points[0];
        return `M${p.x - 20},${p.y} L${p.x + 20},${p.y}`;
      }

      let dPath = `M${points[0].x},${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const curr = points[i];
        const next = points[i + 1];
        const cx = (curr.x + next.x) / 2;
        dPath += ` C${cx},${curr.y} ${cx},${next.y} ${next.x},${next.y}`;
      }

      if (closePath) {
        dPath += ` V${height} H${points[0].x} Z`;
      }
      return dPath;
    };

    const getSafeMax = (series: any[], fallback: number) => {
      if (series.length === 0) return fallback;
      const vals = series.map(m => Number(m.value));
      return Math.max(fallback, Math.max(...vals));
    };
    const getSafeMin = (series: any[], fallback: number) => {
      if (series.length === 0) return fallback;
      const vals = series.map(m => Number(m.value));
      return Math.min(fallback, Math.min(...vals));
    };

    const maxG = getSafeMax(glucoseSeries, 12);
    const minG = getSafeMin(glucoseSeries, 0);
    const maxB = getSafeMax(bpSeries, 160);
    const minB = getSafeMin(bpSeries, 60);

    const glucosePath = generateSvgPath(glucoseSeries, m => Number(m.value), minG, maxG);
    const glucoseFillPath = generateSvgPath(glucoseSeries, m => Number(m.value), minG, maxG, true);
    const bpPath = generateSvgPath(bpSeries, m => Number(m.value), minB, maxB);

    const getTimelineLabels = () => {
      const dates = metrics.map((m: any) => new Date(m.measuredAt))
        .sort((a: any, b: any) => a - b);
      
      if (dates.length < 2) return ["--", "--", "--", "--", "Hiện tại"];
      
      const firstDateStr = dates[0].toDateString();
      const allSameDay = dates.every((d: Date) => d.toDateString() === firstDateStr);

      const step = Math.max(1, Math.floor(dates.length / 4));
      const result = [];
      for (let i = 0; i < dates.length; i += step) {
        if (result.length >= 5) break;
        const d = dates[i];
        const dateLabel = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        const timeLabel = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        result.push(allSameDay ? timeLabel : dateLabel);
      }
      
      if (result.length < 5 && dates.length > 0) {
        const ld = dates[dates.length - 1];
        const dateLabel = `${ld.getDate().toString().padStart(2, '0')}/${(ld.getMonth() + 1).toString().padStart(2, '0')}`;
        const timeLabel = `${ld.getHours().toString().padStart(2, '0')}:${ld.getMinutes().toString().padStart(2, '0')}`;
        result.push(allSameDay ? timeLabel : dateLabel);
      }
      return result;
    };

    const timelineLabels = getTimelineLabels();

    const renderStatusBadge = (status: string) => {
      if (!status) return null;
      
      let text = 'Bình thường';
      let style = 'text-primary bg-primary/10';
      
      switch(status) {
        case 'NORMAL': 
          text = 'Bình thường'; 
          style = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
          break;
        case 'HIGH': 
          text = 'Cao'; 
          style = 'text-red-600 bg-red-50 dark:bg-red-900/20';
          break;
        case 'BORDERLINE_HIGH':
          text = 'Cảnh báo';
          style = 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
          break;
        case 'LOW':
        case 'BORDERLINE_LOW':
          text = 'Thấp';
          style = 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
          break;
      }
      return <span className={`text-[13px] font-bold px-2 py-0.5 rounded ${style}`}>{text}</span>;
    };

    const handlePrint = () => {
      window.print();
    };

    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 print:p-0 print:static print:bg-white font-display">
            <style>{`
              @media print {
                body * {
                  visibility: hidden;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .printable-report, .printable-report * {
                  visibility: visible;
                }
                .printable-report {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 210mm !important;
                  height: 296mm !important;
                  max-height: 296mm !important;
                  margin: 0 !important;
                  padding: 12mm !important;
                  background: white !important;
                  display: block !important;
                  overflow: hidden !important;
                  box-sizing: border-box !important;
                }
                .modal-main-container, .print-hidden {
                  display: none !important;
                }
                @page {
                  size: A4;
                  margin: 0;
                }
                .report-symbol {
                  font-family: 'Material Symbols Outlined' !important;
                }
              }
              .chart-path {
                stroke-dasharray: 1000;
                stroke-dashoffset: 1000;
                animation: draw 2s forwards;
              }
              @keyframes draw {
                to { stroke-dashoffset: 0; }
              }
            `}</style>

            {/* Printable Report Section (Hidden on screen) */}
            <div className="hidden print:block printable-report text-[#0f1711] bg-white">
              <div className="flex justify-between items-start mb-8">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#00391c]" style={{ fontVariationSettings: "'FILL' 1", fontSize: '18px' }}>health_and_safety</span>
                    </div>
                    <span className="text-lg font-extrabold text-[#059669] tracking-tight">DamDiep</span>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-lg font-extrabold text-[#0f1711] tracking-tight leading-tight">Báo cáo tổng quan sức khỏe</h2>
                  <p className="text-[13px] text-[#3f4942] font-semibold mt-1 opacity-70">Ngày báo cáo: {new Date().toLocaleDateString('vi-VN')}</p>
                </div>
              </div>

              <section className="grid grid-cols-12 gap-4 mb-5 items-stretch">
                <div className="col-span-8 bg-[#f1f4f2] p-4 rounded-xl flex items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-[#dde5de] flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                    <img
                      alt={profile?.fullName}
                      className="w-full h-full object-cover"
                      src={profile?.avatarUrl || "https://i.pravatar.cc/150?u=BN0892"}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#0f1711]">{profile?.fullName || 'Nguyễn Văn A'}</h3>
                    <div className="grid grid-cols-2 gap-x-4 mt-1">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-[#707972] font-bold">Tuổi</span>
                        <span className="text-[13px] font-semibold">{profile?.age || '65'} Tuổi</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] text-[#707972] font-bold">Mã bệnh nhân</span>
                        <span className="text-[13px] font-semibold tracking-wide text-[#047857]">{profile?.patientCode || 'BN0892'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`col-span-4 p-4 rounded-xl flex flex-col justify-between border-l-4 ${String(profile?.riskLevel || '').includes('Nguy cơ cao') ? 'bg-[#ffdad6] border-[#ba1a1a]' : 'bg-[#d1f9e1] border-[#059669]'}`}>
                  <span className={`text-[11px] font-bold ${String(profile?.riskLevel || '').includes('Nguy cơ cao') ? 'text-[#410002]' : 'text-[#00210e]'}`}>Mức độ rủi ro</span>
                  <div>
                    <span className={`text-lg font-extrabold tracking-tight ${String(profile?.riskLevel || '').includes('Nguy cơ cao') ? 'text-[#ba1a1a]' : 'text-[#059669]'}`}>
                      {profile?.riskLevel || 'Ổn định'}
                    </span>
                    <p className={`text-[12px] opacity-80 leading-snug mt-1 font-medium ${String(profile?.riskLevel || '').includes('Nguy cơ cao') ? 'text-[#410002]' : 'text-[#00210e]'}`}>
                      {String(profile?.riskLevel || '').includes('Nguy cơ cao') ? 'Cần can thiệp lâm sàng ngay lập tức.' : 'Tiếp tục duy trì lối sống lành mạnh.'}
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-6">
                <h4 className="text-[13px] font-bold text-[#707972] mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-3.5 bg-primary rounded-full"></span>
                  Chỉ số sinh tồn hiện tại
                </h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-[#c0c9c1]/40 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="material-symbols-outlined text-[#ba1a1a] text-xl">blood_pressure</span>
                      {(profile?.latestBp && parseInt(profile.latestBp) > 140) && <span className="text-[11px] bg-[#ba1a1a]/10 text-[#ba1a1a] px-2 py-0.5 rounded-full font-bold">Cao</span>}
                    </div>
                    <p className="text-xl font-extrabold text-[#0f1711]">{profile?.latestBp || 'N/A'}</p>
                    <p className="text-[12px] font-bold text-[#3f4942]">Huyết áp (mmHg)</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#c0c9c1]/40 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="material-symbols-outlined text-[#059669] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>glucose</span>
                      <span className="text-[11px] bg-[#d1f9e1] text-[#047857] px-2 py-0.5 rounded-full font-bold">Ổn định</span>
                    </div>
                    {/* Fix: Cast latestGlucose safely to string to prevent .split is not a function exception on initial activePatient loading */}
                    <p className="text-xl font-extrabold text-[#0f1711]">{String(profile?.latestGlucose || '').split(' ')[0] || 'N/A'}</p>
                    <p className="text-[12px] font-bold text-[#3f4942]">Đường huyết (mmol/L)</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#c0c9c1]/40 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="material-symbols-outlined text-[#f43f5e] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                      <span className="text-[11px] bg-[#fdf2f2] text-[#f43f5e] px-2 py-0.5 rounded-full font-bold">Bình thường</span>
                    </div>
                    <p className="text-xl font-extrabold text-[#0f1711]">{metrics.find((m: any) => m.metricType === 'HEART_RATE')?.value || '82'}</p>
                    <p className="text-[12px] font-bold text-[#3f4942]">Nhịp tim (BPM)</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#c0c9c1]/40 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="material-symbols-outlined text-[#0ea5e9] text-xl">air</span>
                      <span className="text-[11px] bg-[#f0f9ff] text-[#0ea5e9] px-2 py-0.5 rounded-full font-bold">Tốt</span>
                    </div>
                    <p className="text-xl font-extrabold text-[#0f1711]">{metrics.find((m: any) => m.metricType === 'SPO2')?.value || '98'}%</p>
                    <p className="text-[12px] font-bold text-[#3f4942]">SpO2 (Oxy máu)</p>
                  </div>
                </div>
              </section>

              <section className="mb-6">
                <h4 className="text-[13px] font-bold text-[#707972] mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-3.5 bg-primary rounded-full"></span>
                  Xu hướng sức khỏe (30 ngày)
                </h4>
                <div className="bg-[#ffffff] rounded-2xl p-4 h-44 border border-[#c0c9c1]/30 relative shadow-sm">
                  <div className="absolute inset-x-8 bottom-12 top-6 flex items-end justify-between">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-[0.03]">
                      <div className="border-t border-[#0f1711] w-full"></div>
                      <div className="border-t border-[#0f1711] w-full"></div>
                      <div className="border-t border-[#0f1711] w-full"></div>
                    </div>
                    <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                      <path className="opacity-80" d="M0,40 Q50,20 100,50 T200,30 T300,70 T400,10 T500,40 T600,60" fill="none" stroke="#ba1a1a" strokeWidth="2"></path>
                      <circle cx="600" cy="60" fill="#ba1a1a" r="3.5"></circle>
                    </svg>
                    <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                      <path d="M0,150 Q50,160 100,140 T200,155 T300,145 T400,150 T500,140 T600,148" fill="none" stroke="#10b981" strokeWidth="2"></path>
                      <circle cx="600" cy="148" fill="#10b981" r="3.5"></circle>
                    </svg>
                  </div>
                  <div className="absolute bottom-3 left-6 right-6 flex justify-between items-center">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span>
                        <span className="text-[11px] font-bold text-[#3f4942]">Huyết áp</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                        <span className="text-[11px] font-bold text-[#3f4942]">Đường huyết</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#707972] font-bold">Thời gian: {new Date().toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-2 gap-6 mb-5">
                <div className="bg-[#f1f4f2] p-4 rounded-xl border border-[#c0c9c1]/20">
                  <h4 className="text-[13px] font-bold text-[#0f1711] mb-3 border-b border-[#c0c9c1]/30 pb-2">Đơn thuốc gần nhất</h4>
                  <div className="space-y-3">
                    {prescriptions.length > 0 ? (
                      prescriptions[0].items.slice(0, 3).map((item: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3">
                          <span className="material-symbols-outlined text-primary text-sm mt-0.5">pill</span>
                          <div>
                            <p className="text-[13px] font-bold text-[#0f1711]">{item.medicationName} {item.dosage}</p>
                            <p className="text-[12px] text-[#3f4942] italic">{item.usageInstructions}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[12px] text-slate-400">Không có đơn thuốc gần đây</p>
                    )}
                  </div>
                </div>
                <div className="bg-[#f1f4f2] p-4 rounded-xl border border-[#c0c9c1]/20">
                  <h4 className="text-[13px] font-bold text-[#0f1711] mb-3 border-b border-[#c0c9c1]/30 pb-2">Ghi chú & Tuân thủ</h4>
                  <p className="text-[13px] leading-relaxed text-[#3f4942] font-medium">
                    Chỉ số tuân thủ điều trị: <span className="font-bold text-primary">{adherence.toFixed(1)}%</span>.
                  </p>
                  <p className="text-[12px] text-slate-500 mt-2">
                    Bệnh nhân {adherence < 70 ? 'cần được nhắc nhở uống thuốc đều đặn hơn.' : 'đang tuân thủ phác đồ điều trị rất tốt.'}
                  </p>
                </div>
              </section>

              <div className="flex justify-end mt-4 pt-4">
                <div className="text-center w-64">
                  <p className="text-[13px] font-bold text-[#0f1711] mb-8">Chữ ký bác sĩ chuyên khoa</p>
                  <div className="border-t border-[#0f1711] w-full pt-2">
                    <p className="text-[13px] font-extrabold text-[#0f1711]">BS. Lê Minh Tâm</p>
                    <p className="text-[11px] text-[#707972] font-bold">Mã số: CCH-9920</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] print:hidden"
              onClick={onClose}
            />

            {/* Modal Content Container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-6xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl overflow-hidden flex flex-col modal-main-container border border-primary/10 z-10"
            >
              {/* Modal Body with absolute close icon */}
              <button onClick={onClose} className="absolute top-6 right-6 z-20 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors print:hidden">
                <span className="material-symbols-outlined font-medium">close</span>
              </button>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar modal-scroll-area">
                <div className="space-y-8">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pr-8">
                    <div className="flex items-center gap-4">
                      <h2 className="text-[20px] font-medium text-slate-900 dark:text-white">Chi tiết hồ sơ bệnh án</h2>
                    </div>
                    <div className="flex flex-wrap gap-2 no-print">
                      <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 text-sm font-semibold transition-all"
                      >
                        <span className="material-symbols-outlined text-lg">print</span>
                        Xuất PDF / In báo cáo
                      </button>
                    </div>
                  </div>

                  {/* Patient Summary Card */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-6">
                      <div className="relative shrink-0">
                        <img
                          className="size-32 rounded-2xl object-cover"
                          src={profile?.avatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(profile?.fullName || 'P') + "&background=random"}
                          alt={profile?.fullName}
                        />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{profile?.fullName || 'Nguyễn Văn A'}</h2>
                            <span
                              className={`px-3 py-1 text-[13px] font-bold rounded-full tracking-wide border ${String(currentRisk).includes('Nguy cơ cao') ? 'bg-red-50 text-red-500 border-red-100' :
                                String(currentRisk).includes('Theo dõi') ? 'bg-orange-50 text-orange-500 border-orange-100' :
                                  'bg-green-50 text-green-500 border-green-100'
                                }`}>
                              {currentRisk}
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5 mt-1">
                            <p className="text-slate-500 text-sm">Giới tính: {profile?.gender === 'MALE' ? 'Nam' : profile?.gender === 'FEMALE' ? 'Nữ' : (profile?.gender || 'Khác')}</p>
                            <p className="text-slate-500 text-sm">Tuổi: {profile?.age || '65'}</p>
                            <p className="text-slate-500 text-sm">Mã bệnh nhân: {profile?.patientCode || 'BN0892'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs text-slate-400 uppercase font-bold">Bệnh lý nền</p>
                            <p className="text-sm font-semibold">{profile?.chronicCondition || 'Cao huyết áp'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-slate-400 uppercase font-bold">Dị ứng</p>
                            <p className="text-sm font-semibold text-red-500">{(Array.isArray(profile?.allergies) ? profile.allergies.join(', ') : profile?.allergies) || 'Không'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-slate-400 uppercase font-bold">Nhóm máu</p>
                            <p className="text-sm font-semibold">{profile?.bloodType || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-6 border border-primary/20 flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-bold text-slate-900 dark:text-white">Thao tác nhanh</h3>
                          <p className="text-[13px] text-slate-500 leading-relaxed">Kết nối trực tiếp với bệnh nhân</p>
                        </div>
                        <div className="size-10 bg-primary/20 text-primary rounded-lg flex items-center justify-center">
                          <span className="material-symbols-outlined">auto_awesome</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 mt-4">
                        <button
                          onClick={() => {
                              const role = localStorage.getItem('role');
                              if (role === 'ROLE_CLINIC_MANAGER') {
                                  window.location.href = '/clinic/assignment';
                              } else {
                                  window.location.href = '/doctor/appointments';
                              }
                          }}
                          className="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:shadow-md transition-all group"
                        >
                          <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">event_available</span>
                            Đặt lịch khám mới
                          </span>
                          <span className="material-symbols-outlined text-slate-300 group-hover:translate-x-1 transition-transform">chevron_right</span>
                        </button>
                        <button
                          onClick={() => window.location.href = '/doctor/messages'}
                          className="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:shadow-md transition-all group"
                        >
                          <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">forum</span>
                            Gửi tin nhắn tư vấn
                          </span>
                          <span className="material-symbols-outlined text-slate-300 group-hover:translate-x-1 transition-transform">chevron_right</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Vitals Dashboard */}
                  <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="material-symbols-outlined text-red-500">blood_pressure</span>
                        {renderStatusBadge(metrics.find((i: any) => i.metricType === 'BLOOD_PRESSURE')?.status)}
                      </div>
                      <p className="text-slate-400 text-[13px] font-medium">Huyết áp</p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <h4 className="text-[22px] font-bold text-slate-900 dark:text-white">
                          {(() => {
                            const m = metrics.find((i: any) => i.metricType === 'BLOOD_PRESSURE');
                            return m ? `${m.value}/${m.valueSecondary || '?'}` : 'N/A';
                          })()}
                        </h4>
                        <span className="text-[12px] text-slate-400 font-medium ml-1">mmHg</span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="material-symbols-outlined text-amber-500">bloodtype</span>
                        {renderStatusBadge(metrics.find((i: any) => i.metricType === 'BLOOD_SUGAR')?.status)}
                      </div>
                      <p className="text-slate-400 text-[13px] font-medium">Đường huyết</p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <h4 className="text-[22px] font-bold text-slate-900 dark:text-white">
                          {metrics.find((i: any) => i.metricType === 'BLOOD_SUGAR')?.value || 'N/A'}
                        </h4>
                        <span className="text-[12px] text-slate-400 font-medium ml-1">mmol/L</span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="material-symbols-outlined text-primary">favorite</span>
                        {renderStatusBadge(metrics.find((m: any) => m.metricType === 'HEART_RATE')?.status)}
                      </div>
                      <p className="text-slate-400 text-[13px] font-medium">Nhịp tim</p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <h4 className="text-[22px] font-bold text-slate-900 dark:text-white">{metrics.find((m: any) => m.metricType === 'HEART_RATE')?.value || 'N/A'}</h4>
                        <span className="text-[12px] text-slate-400 font-medium ml-1">bpm</span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="material-symbols-outlined text-blue-500">air</span>
                        {renderStatusBadge(metrics.find((m: any) => m.metricType === 'SPO2')?.status)}
                      </div>
                      <p className="text-slate-400 text-[13px] font-medium">SpO2</p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <h4 className="text-[22px] font-bold text-slate-900 dark:text-white">{metrics.find((m: any) => m.metricType === 'SPO2')?.value || 'N/A'}</h4>
                        <span className="text-[12px] text-slate-400 font-medium ml-1">%</span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="material-symbols-outlined text-purple-500">body_fat</span>
                        <span className="text-[13px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">BMI</span>
                      </div>
                      <p className="text-slate-400 text-[13px] font-medium">BMI</p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <h4 className="text-[22px] font-bold text-slate-900 dark:text-white">
                          {profile?.weightKg && profile?.heightCm 
                            ? (profile.weightKg / ((profile.heightCm/100)**2)).toFixed(1) 
                            : 'N/A'}
                        </h4>
                        <span className="text-[12px] text-slate-400 font-medium ml-1">kg/m²</span>
                      </div>
                    </div>
                  </div>

                  {/* Main Grid */}
                  <div className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-8 pb-12">
                    {/* Left: Charts & History */}
                    <div className="xl:col-span-2 space-y-8">
                      {/* Chart Section */}
                      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-8">
                          <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Xu hướng chỉ số (30 ngày)</h3>
                            <p className="text-sm text-slate-500">Biểu đồ so sánh Huyết áp & Đường huyết</p>
                          </div>
                          <div className="relative">
                            <Dropdown
                              options={['30 ngày qua', '90 ngày qua']}
                              value={timeRange}
                              onChange={setTimeRange}
                              className="w-44"
                            />
                          </div>
                        </div>
                        <div className="h-64 relative w-full overflow-hidden border-b border-slate-100 dark:border-slate-800">
                          {(!metrics || metrics.length === 0) ? (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">Chưa đủ dữ liệu để vẽ biểu đồ</div>
                          ) : (
                            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 200">
                              <line x1="0" y1="20" x2="800" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
                              <line x1="0" y1="90" x2="800" y2="90" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
                              <line x1="0" y1="160" x2="800" y2="160" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
                              
                              {glucoseFillPath && <path className="fill-primary/5" d={glucoseFillPath} />}
                              {glucosePath && <path d={glucosePath} fill="none" stroke="#4ade80" strokeWidth="3" className="drop-shadow-sm" />}
                              {bpPath && <path d={bpPath} fill="none" stroke="#ef4444" strokeDasharray="5,5" strokeWidth="2" />}
                            </svg>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-slate-400 font-extrabold tracking-wider pt-4 px-2">
                            {timelineLabels.map((label, idx) => <span key={idx}>{label}</span>)}
                          </div>
                        </div>
                        <div className="flex gap-6 mt-8 pt-6 border-t border-slate-50 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="size-3 rounded-full bg-red-500"></span>
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Huyết áp tâm thu</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="size-3 rounded-full bg-primary"></span>
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Đường huyết</span>
                          </div>
                        </div>
                      </div>

                      {/* Medical History Timeline */}
                      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Lịch sử khám bệnh</h3>
                        <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                          {appointments.length > 0 ? (
                            appointments.slice(0, 5).map((app: any, idx: number) => (
                              <div key={idx} className="relative pl-10">
                                <div className={`absolute left-0 top-1 size-6 ${app.status === 'COMPLETED' ? 'bg-primary/20' : 'bg-slate-200'} rounded-full flex items-center justify-center`}>
                                  <div className={`size-2.5 ${app.status === 'COMPLETED' ? 'bg-primary' : 'bg-slate-400'} rounded-full`}></div>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <p className="text-xs font-bold text-slate-400 uppercase">{new Date(app.appointmentTime).toLocaleDateString('vi-VN')}</p>
                                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] rounded uppercase font-bold">{app.appointmentType}</span>
                                </div>
                                <h4 className="font-bold text-slate-900 dark:text-white mt-1">{app.reason}</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">Trạng thái: {app.status}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-slate-400 pl-10">Không có lịch sử khám bệnh</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Medications & Notes */}
                    <div className="space-y-8">
                      {/* Current Medications */}
                      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Đơn thuốc hiện tại</h3>
                          <span className="size-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                            <span className="material-symbols-outlined text-xl">pill</span>
                          </span>
                        </div>
                        <div className="space-y-4">
                          {prescriptions.filter((p: any) => p.status === 'ACTIVE').length > 0 ? (
                            prescriptions.filter((p: any) => p.status === 'ACTIVE')[0].items.map((item: any, idx: number) => (
                              <div key={idx} className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-bold text-[17px] text-slate-900 dark:text-white leading-tight">{item.medicationName}</h4>
                                  <span className="text-[11px] font-bold text-sky-500 uppercase">ĐANG DÙNG</span>
                                </div>
                                <p className="text-[14px] text-slate-500 mt-2 font-medium">{item.dosage} - {item.usageInstructions}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-slate-400 italic">Không có đơn thuốc đang hoạt động</p>
                          )}
                        </div>
                      </div>

                      {/* Notes/Alerts Section */}
                      <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-6 border border-red-100 dark:border-red-900/30">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="material-symbols-outlined text-red-500">warning</span>
                          <h3 className="font-bold text-red-900 dark:text-red-400">Ghi chú quan trọng</h3>
                        </div>
                        <ul className="space-y-3">
                          {profile?.clinicalNotes ? (
                              String(profile.clinicalNotes).split('\n').map((note: string, idx: number) => note.trim() && (
                                  <li key={idx} className="flex gap-3 text-sm text-red-700 dark:text-red-300">
                                    <span className="material-symbols-outlined text-sm mt-1">circle</span>
                                    {note}
                                  </li>
                              ))
                          ) : (
                              <li className="flex gap-3 text-sm text-red-700 dark:text-red-300">
                                <span className="material-symbols-outlined text-sm mt-1">circle</span>
                                Chưa có ghi chú đặc biệt nào.
                              </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  };

  return createPortal(
    renderModalContent(),
    document.body
  );
}
