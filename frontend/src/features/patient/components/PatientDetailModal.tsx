import { useEffect, useState } from 'react';
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

  const profile = detailData?.profile || patient || {};
  const metrics = detailData?.recentMetrics || [];
  const prescriptions = detailData?.prescriptionHistory || [];
  const appointments = detailData?.appointmentHistory || [];
  const adherence = detailData?.adherenceRate || 0;

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 print:p-0 print:static print:bg-white">
      <style>{`
        @media print {
          /* Hide everything by default */
          body * {
            visibility: hidden;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Show only the report container */
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

          /* Hide modal UI */
          .modal-main-container, .print-hidden {
            display: none !important;
          }

          @page {
            size: A4;
            margin: 0;
          }

          /* Utility for report symbols */
          .report-symbol {
            font-family: 'Material Symbols Outlined' !important;
          }
        }

        /* Mock chart animation for report */
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
      <div className="hidden print:block printable-report font-display text-[#0f1711] bg-white">
        {/* Clinical Header */}
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

        {/* Patient Profile & Risk Section */}
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
          <div className={`col-span-4 p-4 rounded-xl flex flex-col justify-between border-l-4 ${profile?.riskLevel?.includes('Nguy cơ cao') ? 'bg-[#ffdad6] border-[#ba1a1a]' : 'bg-[#d1f9e1] border-[#059669]'}`}>
            <span className={`text-[11px] font-bold ${profile?.riskLevel?.includes('Nguy cơ cao') ? 'text-[#410002]' : 'text-[#00210e]'}`}>Mức độ rủi ro</span>
            <div>
              <span className={`text-lg font-extrabold tracking-tight ${profile?.riskLevel?.includes('Nguy cơ cao') ? 'text-[#ba1a1a]' : 'text-[#059669]'}`}>
                {profile?.riskLevel || 'Ổn định'}
              </span>
              <p className={`text-[12px] opacity-80 leading-snug mt-1 font-medium ${profile?.riskLevel?.includes('Nguy cơ cao') ? 'text-[#410002]' : 'text-[#00210e]'}`}>
                {profile?.riskLevel?.includes('Nguy cơ cao') ? 'Cần can thiệp lâm sàng ngay lập tức.' : 'Tiếp tục duy trì lối sống lành mạnh.'}
              </p>
            </div>
          </div>
        </section>

        {/* Vital Signs Bento Grid */}
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
              <p className="text-xl font-extrabold text-[#0f1711]">{profile?.latestGlucose?.split(' ')[0] || 'N/A'}</p>
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

        {/* Health Trends Visualization */}
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

        {/* Medications & Remarks */}
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

        {/* Signature Section */}
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

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-300 print:hidden"
        onClick={onClose}
      ></div>

      {/* Modal Content: Matched with Scheduling Modal styling */}
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 modal-main-container border border-primary/10">

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar modal-scroll-area">
          <div className="space-y-8">
            {/* Breadcrumb & Actions (Simplified for Modal) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
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
                    src={profile?.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuBQIVC5UVVnYFrHotJWRdOzSC_E3FBCQEoE184wQ53tVIU99mCmsnvpRBP8AxOgPqY4ybn9yh-ls0TdYzrW84tXyVp1chICLHuqh24SPAwmF-JJMZOAY5b6sWBcWHx0HE2pfkknQ3kbNOCOHncZou8wv9681_qfeqqF6ei7-c2tYKJiOih9gpWegaVqMzBBcsL__BBf1ERBs4ya9r4R9MusSrAo8G1F6a0xU-jwmEaQav_vPqmUpMzOJYXGCugRCcfNmQ_TNYls7KQ"}
                    alt={profile?.fullName}
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{profile?.fullName || 'Nguyễn Văn A'}</h2>
                      <span
                        className={`px-3 py-1 text-[13px] font-bold rounded-full tracking-wide border ${profile?.riskLevel?.includes('Nguy cơ cao') ? 'bg-red-50 text-red-500 border-red-100' :
                          profile?.riskLevel?.includes('theo dõi') ? 'bg-orange-50 text-orange-500 border-orange-100' :
                            'bg-green-50 text-green-500 border-green-100'
                          }`}>
                        {profile?.riskLevel || 'Ổn định'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <p className="text-slate-500 text-sm">Giới tính: {profile?.gender || 'Nam'}</p>
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
                      <p className="text-sm font-semibold text-red-500">{profile?.allergies?.join(', ') || 'Không'}</p>
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
                  {profile?.latestBp && parseInt(profile.latestBp) > 140 && <span className="text-[13px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">Cao</span>}
                </div>
                <p className="text-slate-400 text-[13px] font-medium">Huyết áp</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <h4 className="text-[22px] font-bold text-slate-900 dark:text-white">{profile?.latestBp || 'N/A'}</h4>
                  <span className="text-[12px] text-slate-400 font-medium ml-1">mmHg</span>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="material-symbols-outlined text-amber-500">bloodtype</span>
                  <span className="text-[13px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded">Cảnh báo</span>
                </div>
                <p className="text-slate-400 text-[13px] font-medium">Đường huyết</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <h4 className="text-[22px] font-bold text-slate-900 dark:text-white">{profile?.latestGlucose?.split(' ')[0] || 'N/A'}</h4>
                  <span className="text-[12px] text-slate-400 font-medium ml-1">mmol/L</span>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="material-symbols-outlined text-primary">favorite</span>
                  <span className="text-[13px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">Bình thường</span>
                </div>
                <p className="text-slate-400 text-[13px] font-medium">Nhịp tim</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <h4 className="text-[22px] font-bold text-slate-900 dark:text-white">{metrics.find((m: any) => m.metricType === 'HEART_RATE')?.value || '82'}</h4>
                  <span className="text-[12px] text-slate-400 font-medium ml-1">bpm</span>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="material-symbols-outlined text-blue-500">air</span>
                  <span className="text-[13px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">Tốt</span>
                </div>
                <p className="text-slate-400 text-[13px] font-medium">SpO2</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <h4 className="text-[22px] font-bold text-slate-900 dark:text-white">{metrics.find((m: any) => m.metricType === 'SPO2')?.value || '98'}</h4>
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
                  <h4 className="text-[22px] font-bold text-slate-900 dark:text-white">{(profile?.weightKg / ((profile?.heightCm/100)**2)).toFixed(1) || '24.5'}</h4>
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
                  <div className="h-64 relative w-full overflow-hidden">
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 200">
                      <path d="M0,150 Q50,140 100,160 T200,130 T300,140 T400,110 T500,120 T600,80 T700,90 T800,60" fill="none" stroke="#4ade80" strokeWidth="3" />
                      <path className="fill-primary/5" d="M0,150 Q50,140 100,160 T200,130 T300,140 T400,110 T500,120 T600,80 T700,90 T800,60 V200 H0 Z" />
                      <path d="M0,100 Q50,90 100,110 T200,80 T300,90 T400,60 T500,70 T600,30 T700,40 T800,10" fill="none" stroke="#ef4444" strokeDasharray="5,5" strokeWidth="2" />
                    </svg>
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-slate-400 font-bold uppercase pt-4">
                      <span>01/10</span><span>07/10</span><span>14/10</span><span>21/10</span><span>28/10</span>
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
                        profile.clinicalNotes.split('\n').map((note: string, idx: number) => note.trim() && (
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
      </div>
    </div>
  );
}
