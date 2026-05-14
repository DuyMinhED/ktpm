import { useState, useEffect, useCallback } from 'react';
import ExcelJS from 'exceljs';
import PrescriptionModal from '../features/prescription/components/PrescriptionModal';
import AdviceModal from '../features/patient/components/AdviceModal';
import RescheduleModal from '../features/patient/components/RescheduleModal';
import Toast from '../components/ui/Toast';
import FilterDropdown from '../components/ui/FilterDropdown';
import PatientDetailModal from '../features/patient/components/PatientDetailModal';
import CreatePatientModal from '../features/clinic/components/CreatePatientModal';
import EditPatientModal from '../features/clinic/components/EditPatientModal';
import RecordMetricModal from '../features/clinic/components/RecordMetricModal';
import { doctorApi } from '../api/doctor';
import { clinicApi } from '../api/clinic';
import TopBar from '../components/common/TopBar';
import DoctorSidebar from '../components/common/DoctorSidebar';
import Skeleton from '../components/ui/Skeleton';

export default function DoctorPatients() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdviceModalOpen, setIsAdviceModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [diseaseFilter, setDiseaseFilter] = useState('Tất cả bệnh lý');
  const [riskFilter, setRiskFilter] = useState('Mọi mức độ');
  const [isPatientDetailModalOpen, setIsPatientDetailModalOpen] = useState(false);
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  const [isEditPatientModalOpen, setIsEditPatientModalOpen] = useState(false);
  const [isRecordMetricModalOpen, setIsRecordMetricModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Real data states
  const [patients, setPatients] = useState<any[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [highRiskCount, setHighRiskCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingPatients, setLoadingPatients] = useState(true);

  const fetchPatients = useCallback(async () => {
    setLoadingPatients(true);
    try {
      const res = await doctorApi.getMyPatients({
        page: currentPage,
        size: 10,
        condition: diseaseFilter !== 'Tất cả bệnh lý' ? diseaseFilter : undefined,
        riskLevel: riskFilter !== 'Mọi mức độ' ? riskFilter : undefined,
      });
      if (res.success) {
        setPatients(res.data.content || []);
        setTotalPages(res.data.totalPages || 0);
      }
    } catch (e) { console.error('Failed to fetch patients', e); }
    setLoadingPatients(false);
  }, [currentPage, diseaseFilter, riskFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await doctorApi.getPatientStats();
      if (res.success) {
        setTotalPatients(res.data.totalPatients || 0);
        setHighRiskCount(res.data.highRiskCount || 0);
      }
    } catch (e) { console.error('Failed to fetch stats', e); }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Date & Time states for RescheduleModal
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Toast state
  const [toast, setToast] = useState({ show: false, title: '', type: 'success' as 'success' | 'warning' | 'error' });

  // Prescription states
  const [medications, setMedications] = useState([
    { id: 1, name: 'Metformin', dosage: '500mg', frequency: '2 lần/ngày', duration: '30 ngày', intakeType: 'Sau ăn' }
  ]);
  const [isAddingNewMedicine, setIsAddingNewMedicine] = useState(false);
  const [newMedForm, setNewMedForm] = useState({
    name: '',
    dosage: '',
    frequency: '1 lần/ngày',
    duration: '',
    intakeType: 'Sau ăn'
  });

  // Advice states
  const [adviceCategory, setAdviceCategory] = useState('Dinh dưỡng');
  const [adviceContent, setAdviceContent] = useState('');

  const [formErrors, setFormErrors] = useState({
    name: false,
    dosage: false,
    duration: false,
    frequency: false,
    intakeType: false
  });

  const removeMedication = (id: number) => {
    setMedications(medications.filter(m => m.id !== id));
  };

  const addMedicationToPrescription = () => {
    const errors = {
      name: !newMedForm.name,
      dosage: !newMedForm.dosage,
      duration: !newMedForm.duration,
      frequency: !newMedForm.frequency,
      intakeType: !newMedForm.intakeType
    };
    setFormErrors(errors);

    if (!errors.name && !errors.dosage && !errors.duration && !errors.frequency && !errors.intakeType) {
      setMedications([...medications, { ...newMedForm, id: Date.now() }]);
      setNewMedForm({ name: '', dosage: '', frequency: '1 lần/ngày', duration: '', intakeType: 'Sau ăn' });
      setIsAddingNewMedicine(false);
    }
  };

  const handleSaveHealthMetrics = async (data: any) => {
    if (!selectedPatient?.id) return;
    setIsSaving(true);
    try {
      const currentClinicId = localStorage.getItem('clinicId') || '1';
      const promises = [];

      if (data.glucose) {
        promises.push(clinicApi.recordHealthMetric(currentClinicId, selectedPatient.id, {
          metricType: 'BLOOD_SUGAR',
          value: data.glucose,
          unit: 'mmol/L',
          notes: data.notes
        }));
      }
      
      if (data.bpSystolic) {
        promises.push(clinicApi.recordHealthMetric(currentClinicId, selectedPatient.id, {
          metricType: 'BLOOD_PRESSURE',
          value: data.bpSystolic,
          valueSecondary: data.bpDiastolic,
          unit: 'mmHg',
          notes: data.notes
        }));
      }

      if (data.heartRate) {
        promises.push(clinicApi.recordHealthMetric(currentClinicId, selectedPatient.id, {
          metricType: 'HEART_RATE',
          value: data.heartRate,
          unit: 'bpm',
          notes: data.notes
        }));
      }

      if (data.spo2) {
        promises.push(clinicApi.recordHealthMetric(currentClinicId, selectedPatient.id, {
          metricType: 'SPO2',
          value: data.spo2,
          unit: '%',
          notes: data.notes
        }));
      }

      await Promise.all(promises);
      setIsRecordMetricModalOpen(false);
      setToast({ show: true, title: 'Đã ghi nhận chỉ số sức khỏe thành công!', type: 'success' });
      fetchPatients();
    } catch (e) {
      console.error("Save error:", e);
      setToast({ show: true, title: 'Có lỗi xảy ra khi lưu chỉ số', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportExcel = async () => {
    const today = new Date().toLocaleDateString('vi-VN');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh Sách Bệnh Nhân');

    // Title Row
    worksheet.addRow([`DANH SÁCH BỆNH NHÂN ĐANG QUẢN LÝ - ${today}`]);
    worksheet.mergeCells('A1:G1');
    const titleRow = worksheet.getRow(1);
    titleRow.font = { name: 'Arial', family: 4, size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } }; // sky-600
    titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    titleRow.height = 30;

    // Header Row
    const headerRow = worksheet.addRow([
      'Họ và Tên',
      'Mã Bệnh Nhân',
      'Tuổi',
      'Bệnh Lý',
      'Chỉ Số Gần Nhất',
      'Cập Nhật Cuối',
      'Mức Độ Nguy Cơ'
    ]);

    headerRow.font = { bold: true, color: { argb: 'FF1E293B' } }; // slate-800
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // slate-100
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // Column Widths
    worksheet.columns = [
      { width: 35 }, // Name
      { width: 15 }, // Code
      { width: 10 }, // Age
      { width: 30 }, // Condition
      { width: 25 }, // Index
      { width: 20 }, // Last Update
      { width: 25 }  // Risk
    ];

    // Data Rows
    patients.forEach(p => {
      let rowRisk = p.riskLevel || 'Ổn định';
      if (rowRisk === 'HIGH_RISK') rowRisk = 'Nguy cơ cao';
      else if (rowRisk === 'MONITORING') rowRisk = 'Theo dõi';
      else if (rowRisk === 'STABLE') rowRisk = 'Ổn định';

      const row = worksheet.addRow([
        p.fullName,
        p.patientCode || 'N/A',
        p.age || '-',
        p.chronicCondition || 'N/A',
        `${p.latestGlucose || ''} | ${p.latestBp || ''}`,
        p.lastUpdate || 'N/A',
        rowRisk
      ]);
      row.alignment = { vertical: 'middle', wrapText: true };

      const riskCell = row.getCell(7);
      if (p.riskLevel?.includes('Nguy cơ cao') || p.riskLevel === 'HIGH_RISK') {
        riskCell.font = { color: { argb: 'FFEF4444' }, bold: true };
      } else if (p.riskLevel?.includes('theo dõi') || p.riskLevel === 'MONITORING') {
        riskCell.font = { color: { argb: 'FFF59E0B' }, bold: true };
      } else {
        riskCell.font = { color: { argb: 'FF10B981' }, bold: true };
      }
    });

    // Borders
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

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Danh_sach_benh_nhan_${today.replace(/\//g, '-')}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="flex min-h-screen font-display bg-[#f6f8f7] dark:bg-slate-950 text-slate-900 dark:text-slate-100 italic-none">
      <DoctorSidebar isSidebarOpen={isSidebarOpen} />

      <main className="flex-1 lg:ml-72 min-h-screen flex flex-col transition-all duration-300">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[140] lg:hidden animate-in fade-in duration-300"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}
        <TopBar
          setIsSidebarOpen={setIsSidebarOpen}
          notifications={notifications}
          setNotifications={setNotifications}
        />

        <div className="p-8 space-y-8">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="max-w-2xl">
              <h2 className="text-[22px] font-extrabold tracking-tight text-slate-900 mb-2">Danh sách bệnh nhân</h2>
              <p className="text-slate-500 text-[15px] font-medium">Quản lý và theo dõi lộ trình chăm sóc sức khỏe của {totalPatients} bệnh nhân đang điều trị trực tiếp.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExportExcel}
                className="bg-white text-slate-700 border border-slate-200 px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm transition-all hover:bg-slate-50">
                <span className="material-symbols-outlined text-[20px]">ios_share</span>
                Xuất danh sách
              </button>
              <button
                onClick={() => setIsAddPatientModalOpen(true)}
                className="bg-primary text-slate-900 px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/10 transition-all">
                <span className="material-symbols-outlined text-[20px]">person_add</span>
                Thêm bệnh nhân mới
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <FilterDropdown
              label="Loại bệnh"
              icon="filter_list"
              iconBgColor="bg-primary/10"
              iconTextColor="text-primary"
              options={['Tất cả bệnh lý', 'Tiểu đường Type 2', 'Tăng huyết áp', 'Tim mạch']}
              value={diseaseFilter}
              onChange={setDiseaseFilter}
            />

            <FilterDropdown
              label="Mức độ nguy cơ"
              icon="error"
              iconBgColor="bg-orange-50"
              iconTextColor="text-orange-500"
              options={['Mọi mức độ', 'Nguy cơ cao', 'Đang theo dõi', 'Bình thường']}
              value={riskFilter}
              onChange={setRiskFilter}
              optionColors={{
                'Mọi mức độ': 'text-primary',
                'Nguy cơ cao': 'text-red-500 hover:bg-red-50',
                'Đang theo dõi': 'text-orange-500 hover:bg-orange-50',
                'Bình thường': 'text-green-500 hover:bg-green-50'
              }}
            />

            <div className="bg-white p-6 rounded-2xl shadow-sm flex items-center gap-4 border border-slate-100">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
                <span className="material-symbols-outlined">groups</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-slate-500 mb-1">Tổng bệnh nhân</p>
                <p className="text-3xl font-black text-slate-900 mt-1 tracking-tight truncate">{totalPatients.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm flex items-center gap-4 border border-slate-100">
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center text-red-600 flex-shrink-0">
                <span className="material-symbols-outlined">notification_important</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-slate-500 mb-1">Cần can thiệp</p>
                <p className="text-3xl font-black text-red-500 mt-1 tracking-tight truncate">{highRiskCount}</p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 pb-32">
            <div className="">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-5 text-[14px] font-extrabold text-slate-400 tracking-wide">Bệnh nhân</th>
                    <th className="px-6 py-5 text-[14px] font-extrabold text-slate-400 tracking-wide">Mã Bệnh nhân</th>
                    <th className="px-6 py-5 text-[14px] font-extrabold text-slate-400 tracking-wide">Tuổi / Giới tính</th>
                    <th className="px-6 py-5 text-[14px] font-extrabold text-slate-400 tracking-wide">Chỉ số</th>
                    <th className="px-6 py-5 text-[14px] font-extrabold text-slate-400 tracking-wide">Cập nhật</th>
                    <th className="px-6 py-5 text-[14px] font-extrabold text-slate-400 tracking-wide">Xu hướng</th>
                    <th className="px-6 py-5 text-[14px] font-extrabold text-slate-400 tracking-wide">Nguy cơ</th>
                    <th className="px-6 py-5 text-[14px] font-extrabold text-slate-400 tracking-wide text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loadingPatients ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-5 h-[80px]">
                          <div className="flex items-center gap-3">
                            <Skeleton variant="circular" className="w-10 h-10 shrink-0" />
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5"><Skeleton className="h-4 w-16" /></td>
                        <td className="px-6 py-5"><Skeleton className="h-4 w-8" /></td>
                        <td className="px-6 py-5">
                          <div className="flex gap-2">
                            <Skeleton className="h-8 rounded-lg w-20" />
                            <Skeleton className="h-8 rounded-lg w-20" />
                          </div>
                        </td>
                        <td className="px-6 py-5"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-6 py-5"><Skeleton className="h-7 rounded-lg w-24" /></td>
                        <td className="px-6 py-5"><Skeleton className="h-7 rounded-full w-20" /></td>
                        <td className="px-6 py-5 text-right relative"><Skeleton variant="circular" className="h-8 w-8 ml-auto" /></td>
                      </tr>
                    ))
                  ) : patients.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-16 text-center text-slate-400 text-sm">Chưa có bệnh nhân nào được phân công</td></tr>
                  ) : patients.map((p: any) => {
                    const isHighRisk = p.riskLevel?.toUpperCase().includes('HIGH_RISK') || p.riskLevel?.toLowerCase().includes('nguy cơ cao');
                    const isMonitor = p.riskLevel?.toUpperCase().includes('MONITORING') || p.riskLevel?.toLowerCase().includes('theo dõi');
                    const riskColor = isHighRisk ? 'red' : isMonitor ? 'orange' : 'emerald';
                    let rawRiskLabel = p.riskLevel || 'Ổn định';
                    // Normalize English database enums to Vietnamese
                    if (rawRiskLabel === 'HIGH_RISK') rawRiskLabel = 'Nguy cơ cao';
                    else if (rawRiskLabel === 'MONITORING') rawRiskLabel = 'Theo dõi';
                    else if (rawRiskLabel === 'STABLE') rawRiskLabel = 'Ổn định';
                    
                    const riskLabel = rawRiskLabel.replace(/\([^)]*\)/g, '').trim();
                    const menuKey = `p-${p.id}`;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              {p.avatarUrl ? (
                                <img src={p.avatarUrl} alt={p.fullName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                                  {p.fullName?.split(' ').pop()?.charAt(0).toUpperCase() || '?'}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-[16px] font-bold text-slate-900 group-hover:text-primary transition-colors tracking-tight">{p.fullName}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-[13px] text-slate-500 font-medium tracking-tight">{p.chronicCondition || 'Chưa xác định'}</p>
                                {p.phone && (
                                  <>
                                    <span className="text-slate-300 text-[10px]">•</span>
                                    <p className="text-[12px] text-slate-400 font-bold flex items-center gap-0.5 tracking-tight">
                                      <span className="material-symbols-outlined text-[13px]">call</span>
                                      {p.phone}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-[15px] font-bold text-slate-600">{p.patientCode || 'N/A'}</td>
                        <td className="px-6 py-5 text-[15px] font-bold text-slate-600">{p.age || '-'}<span className="text-slate-300 font-medium mx-1">/</span><span className="text-slate-400 text-[14px] font-medium">{p.gender || '-'}</span></td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[13px] font-bold rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">{p.latestGlucose || 'N/A'}</span>
                            <span className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[13px] font-bold rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">{p.latestBp || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-[14px] text-slate-500 font-medium">{p.lastUpdate || 'Chưa ghi nhận'}</td>
                        <td className="px-6 py-5">
                          <div className={`flex items-center gap-1 inline-flex px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/50 ${p.trendColor || 'text-slate-500'} font-bold text-[13px]`}>
                            <span className="material-symbols-outlined text-[18px]">
                              {p.trendColor?.includes('rose') ? 'trending_up' : p.trendColor?.includes('emerald') ? 'trending_down' : 'trending_flat'}
                            </span>
                            {p.healthTrend || 'Ổn định'}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`px-4 py-1.5 text-[13px] font-bold rounded-full text-white shadow-sm whitespace-nowrap inline-flex ${riskColor === 'red' ? 'bg-red-500 shadow-red-500/10' :
                                riskColor === 'orange' ? 'bg-amber-500 shadow-amber-500/10' :
                                  'bg-emerald-500 shadow-emerald-500/10'
                              }`}
                          >
                            {riskLabel}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right relative">
                          <button
                            onClick={() => setActiveMenu(activeMenu === menuKey ? null : menuKey)}
                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 rounded-full transition-all ml-auto">
                            <span className="material-symbols-outlined text-[22px]">more_vert</span>
                          </button>

                          {activeMenu === menuKey && (
                            <>
                              <div className="fixed inset-0 z-[100]" onClick={() => setActiveMenu(null)}></div>
                              <div className="absolute right-6 top-12 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 py-2.5 z-[110] animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 overflow-hidden text-left">
                                <button
                                  onClick={() => { setSelectedPatient(p); setIsPatientDetailModalOpen(true); setActiveMenu(null); }}
                                  className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 group">
                                  <span className="material-symbols-outlined text-slate-400 group-hover:text-primary text-xl">visibility</span>
                                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Xem chi tiết hồ sơ</span>
                                </button>
                                <button
                                  onClick={() => { setSelectedPatient(p); setIsEditPatientModalOpen(true); setActiveMenu(null); }}
                                  className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 group">
                                  <span className="material-symbols-outlined text-slate-400 group-hover:text-primary text-xl">edit</span>
                                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Chỉnh sửa thông tin</span>
                                </button>
                                <button
                                  onClick={() => { setSelectedPatient(p); setIsRecordMetricModalOpen(true); setActiveMenu(null); }}
                                  className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 group">
                                  <span className="material-symbols-outlined text-slate-400 group-hover:text-rose-500 text-xl" style={{fontVariationSettings: "'FILL' 1"}}>monitor_heart</span>
                                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Ghi nhận chỉ số</span>
                                </button>
                                <button
                                  onClick={() => { setSelectedPatient(p); setIsAdviceModalOpen(true); setActiveMenu(null); }}
                                  className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 group">
                                  <span className="material-symbols-outlined text-slate-400 group-hover:text-primary text-xl">send</span>
                                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Gửi lời khuyên</span>
                                </button>
                                <button
                                  onClick={() => { setSelectedPatient(p); setIsPrescriptionModalOpen(true); setActiveMenu(null); }}
                                  className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 group">
                                  <span className="material-symbols-outlined text-slate-400 group-hover:text-primary text-xl">description</span>
                                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Kê đơn thuốc</span>
                                </button>
                                <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                                <button
                                  onClick={() => { setIsModalOpen(true); setActiveMenu(null); }}
                                  className="w-full px-4 py-3 text-left hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors flex items-center gap-3 group">
                                  <span className="material-symbols-outlined text-primary text-xl">event</span>
                                  <span className="text-sm font-bold text-primary">Đặt lịch tái khám</span>
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Redesigned */}
            <div className="px-8 py-6 bg-slate-50/30 dark:bg-slate-800/20 flex items-center justify-end border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="p-2 rounded-md text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-primary transition-all disabled:opacity-30">
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <span className="px-3 py-1.5 min-w-[90px] text-center rounded-full bg-primary text-white text-[13px] font-bold shadow-md tracking-tight whitespace-nowrap">
                  Trang {currentPage + 1}/{totalPages || 1}
                </span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1} className="p-2 rounded-md text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-primary transition-all disabled:opacity-30">
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modals & Feedback */}
        <PrescriptionModal
          isOpen={isPrescriptionModalOpen}
          onClose={() => setIsPrescriptionModalOpen(false)}
          patients={patients}
          isAddingNewMedicine={isAddingNewMedicine}
          setIsAddingNewMedicine={setIsAddingNewMedicine}
          medications={medications}
          setMedications={setMedications}
          removeMedication={removeMedication}
          newMedForm={newMedForm}
          setNewMedForm={setNewMedForm}
          formErrors={formErrors}
          setFormErrors={setFormErrors}
          addMedicationToPrescription={addMedicationToPrescription}
          isSaving={isSaving}
          onSave={async (prescriptionData: any) => {
            setIsSaving(true);
            try {
              const res = await doctorApi.createPrescription(prescriptionData);
              if (res.success) {
                setIsPrescriptionModalOpen(false);
                setMedications([]);
                setToast({ show: true, title: 'Đã gửi đơn thuốc thành công!', type: 'success' });
                fetchPatients();
              }
            } catch (e) {
              setToast({ show: true, title: 'Có lỗi khi gửi đơn thuốc', type: 'error' });
            } finally {
              setIsSaving(false);
            }
          }}
        />

        <AdviceModal
          isOpen={isAdviceModalOpen}
          onClose={() => setIsAdviceModalOpen(false)}
          patientName={selectedPatient?.fullName || ''}
          patientAvatar={selectedPatient?.avatarUrl}
          adviceCategory={adviceCategory}
          setAdviceCategory={setAdviceCategory}
          adviceContent={adviceContent}
          setAdviceContent={setAdviceContent}
          isSaving={isSaving}
          onSave={async () => {
            if (!selectedPatient?.id) return;
            setIsSaving(true);
            try {
              const messageContent = `[Tư vấn ${adviceCategory}] ${adviceContent}`;
              await doctorApi.sendMessage({ receiverId: selectedPatient.id, content: messageContent });
              setIsAdviceModalOpen(false);
              setAdviceContent('');
              setToast({ show: true, title: 'Đã gửi lời khuyên thành công!', type: 'success' });
            } catch (e) {
              setToast({ show: true, title: 'Có lỗi khi gửi lời khuyên', type: 'error' });
            } finally {
              setIsSaving(false);
            }
          }}
        />

        <RescheduleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          isSaving={isSaving}
          onSave={async (appointmentData: any) => {
            setIsSaving(true);
            try {
              const res = await doctorApi.createAppointment(appointmentData);
              if (res.success) {
                setIsModalOpen(false);
                setToast({ show: true, title: 'Đã đặt lịch tái khám thành công!', type: 'success' });
                fetchPatients();
              }
            } catch (e) {
              setToast({ show: true, title: 'Có lỗi khi đặt lịch', type: 'error' });
            } finally {
              setIsSaving(false);
            }
          }}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          selectedTime={selectedTime}
          setSelectedTime={setSelectedTime}
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          currentYear={currentYear}
          setCurrentYear={setCurrentYear}
          patients={patients}
        />

        <PatientDetailModal
          isOpen={isPatientDetailModalOpen}
          onClose={() => setIsPatientDetailModalOpen(false)}
          patient={selectedPatient}
        />

        <CreatePatientModal
          isOpen={isAddPatientModalOpen}
          onClose={() => setIsAddPatientModalOpen(false)}
          isSaving={isSaving}
          availableDoctors={[{ id: localStorage.getItem('userId'), name: localStorage.getItem('userName') || 'Bác sĩ' }]}
          availableConditions={['Tiểu đường', 'Cao huyết áp', 'Tim mạch', 'Hô hấp', 'Khác']}
          onSave={async (data) => {
            setIsSaving(true);
            try {
              const currentClinicId = localStorage.getItem('clinicId') || '1';
              const res = await clinicApi.createPatient(currentClinicId, data);
              if (res.success) {
                setIsAddPatientModalOpen(false);
                setToast({ show: true, title: `Đã cấp tài khoản cho bệnh nhân ${data.name} thành công!`, type: 'success' });
                fetchPatients();
                fetchStats();
              }
            } catch (e) {
              setToast({ show: true, title: 'Có lỗi khi thêm bệnh nhân', type: 'error' });
            } finally {
              setIsSaving(false);
            }
          }}
        />

        <EditPatientModal
          isOpen={isEditPatientModalOpen}
          onClose={() => setIsEditPatientModalOpen(false)}
          isSaving={isSaving}
          patientData={selectedPatient}
          availableDoctors={[{ id: localStorage.getItem('userId'), name: localStorage.getItem('userName') || 'Bác sĩ' }]}
          onSave={async (data) => {
            if (!selectedPatient?.id) return;
            setIsSaving(true);
            try {
              const currentClinicId = localStorage.getItem('clinicId') || '1';
              const res = await clinicApi.updatePatient(currentClinicId, selectedPatient.id, data);
              if (res.success) {
                setIsEditPatientModalOpen(false);
                setToast({ show: true, title: `Đã cập nhật thông tin thành công!`, type: 'success' });
                fetchPatients();
              }
            } catch (e) {
              setToast({ show: true, title: 'Có lỗi khi cập nhật thông tin', type: 'error' });
            } finally {
              setIsSaving(false);
            }
          }}
        />

        <RecordMetricModal
          isOpen={isRecordMetricModalOpen}
          onClose={() => setIsRecordMetricModalOpen(false)}
          isSaving={isSaving}
          patientData={selectedPatient}
          onSave={handleSaveHealthMetrics}
        />

        <Toast
          show={toast.show}
          title={toast.title}
          onClose={() => setToast({ ...toast, show: false })}
        />
      </main>
    </div>
  );
}