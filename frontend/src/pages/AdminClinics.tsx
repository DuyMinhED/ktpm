import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import * as ExcelJS from 'exceljs';
import AdminLayout from '../layouts/AdminLayout';
import CreateClinicModal from '../features/admin/components/CreateClinicModal';
import EditClinicModal from '../features/admin/components/EditClinicModal';
import ClinicDetailsModal from '../features/admin/components/ClinicDetailsModal';
import Dropdown from '../components/ui/Dropdown';
import { clinicApi } from '../api/clinic';
import { useToast } from '../components/ui/ToastContext';
import { Pencil, Eye, CheckCircle2, XCircle } from 'lucide-react';

interface ClinicStat {
  title: string;
  value: string;
  change?: string;
  icon: string;
  color: string;
}

interface ClinicData {
  id: string;
  realId: number;
  name: string;
  address: string;
  phone: string;
  doctors: number;
  patientCount: number;
  appointmentCount: number;
  status: string;
  image?: string;
  adminFullName?: string;
  adminEmail?: string;
}

export default function AdminClinics() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<ClinicData | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isSaving, setIsSaving] = useState(false);
  const { showToast: showNotification } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isQuerying, setIsQuerying] = useState(false);

  const [clinicList, setClinicList] = useState<ClinicData[]>([]);
  const [stats, setStats] = useState<ClinicStat[]>([
    { title: 'Tổng số phòng khám', value: '0', change: '+0%', icon: 'apartment', color: 'primary' },
    { title: 'Đang hoạt động', value: '0', icon: 'check_circle', color: 'emerald' },
    { title: 'Ngưng hoạt động', value: '0', icon: 'block', color: 'red' },
    { title: 'Tổng bác sĩ hệ thống', value: '0', icon: 'stethoscope', color: 'indigo' },
  ]);

  const fetchClinics = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsQuerying(true);
    try {
      const [response, statsRes] = await Promise.all([
        clinicApi.getClinics({
          keyword: debouncedSearchTerm,
          status: statusFilter === 'ALL' ? undefined : statusFilter
        }),
        clinicApi.getClinicStats()
      ]);

      const clinics = response.data.content;
      setClinicList(clinics.map((c: any) => ({
        id: c.clinicCode,
        realId: c.id,
        name: c.name,
        address: c.address,
        phone: c.phone,
        doctors: c.doctorCount || 0,
        patientCount: c.patientCount || 0,
        appointmentCount: 0,
        status: c.status === 'ACTIVE' ? 'Hoạt động' : 'Ngưng hoạt động',
        image: c.imageUrl,
        adminFullName: c.managerName,
        adminEmail: c.managerEmail
      })));

      const s = statsRes.data;
      setStats([
        { title: 'Tổng số phòng khám', value: s.totalClinics.toString(), change: '+0%', icon: 'apartment', color: 'primary' },
        { title: 'Đang hoạt động', value: s.activeClinics.toString(), icon: 'check_circle', color: 'emerald' },
        { title: 'Ngưng hoạt động', value: s.inactiveClinics.toString(), icon: 'block', color: 'red' },
        { title: 'Tổng bác sĩ hệ thống', value: s.totalDoctors.toString(), icon: 'stethoscope', color: 'indigo' },
      ]);
    } catch (error) {
      console.error('Failed to fetch clinics:', error);
    } finally {
      if (!silent) setIsLoading(false);
      setIsQuerying(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const isFirstLoad = clinicList.length === 0 && searchTerm === '' && statusFilter === 'ALL';
    fetchClinics(!isFirstLoad);
  }, [debouncedSearchTerm, statusFilter]);

  const handleExport = async () => {
    const today = new Date().toLocaleDateString('vi-VN');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh Sách Phòng Khám');

    worksheet.addRow([`DANH SÁCH CHI TIẾT CÁC CƠ SỞ / PHÒNG KHÁM HỆ THỐNG - ${today}`]);
    worksheet.mergeCells('A1:F1');
    const titleRow = worksheet.getRow(1);
    titleRow.font = { name: 'Arial', family: 4, size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
    titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    titleRow.height = 30;

    const headerRow = worksheet.addRow([
      'Mã Định Danh',
      'Tên Cơ Sở y Tế',
      'Địa Chỉ Thường Trú',
      'Hotline',
      'Số Bác Sĩ',
      'Trạng Thái Hệ Thống'
    ]);

    headerRow.font = { bold: true, color: { argb: 'FF1E293B' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    worksheet.columns = [
      { width: 18 }, // Code
      { width: 45 }, // Name
      { width: 60 }, // Address
      { width: 18 }, // Phone
      { width: 15 }, // Doctors
      { width: 25 }  // Status
    ];

    clinicList.forEach(clinic => {
      const row = worksheet.addRow([
        clinic.id,
        clinic.name,
        clinic.address,
        clinic.phone,
        clinic.doctors,
        clinic.status
      ]);
      row.alignment = { vertical: 'middle', wrapText: true };

      const statusCell = row.getCell(6);
      if (clinic.status === 'Hoạt động') {
        statusCell.font = { color: { argb: 'FF10B981' }, bold: true };
      } else {
        statusCell.font = { color: { argb: 'FFEF4444' }, bold: true };
      }
    });

    worksheet.eachRow((row: any, rowNumber: number) => {
      if (rowNumber > 1) {
        row.eachCell({ includeEmpty: true }, (cell: any) => {
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
    const blob = new Blob([buffer as any], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Danh_sach_phong_kham_${today.replace(/\//g, '-')}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
  };

  const handleCreateClinic = async (data: any) => {
    setIsSaving(true);
    try {
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

      showNotification(`Đã khởi tạo hệ thống cho ${data.name} thành công!`, 'success');
      fetchClinics(true);
    } catch (error: any) {
      console.error('Failed to create clinic:', error);
      const msg = error.response?.data?.message || 'Lỗi hệ thống';
      showNotification(msg, 'error');
    } finally {
      setIsSaving(false);
      setIsCreateModalOpen(false);
    }
  };

  const handleEditClinic = async (data: any) => {
    setIsSaving(true);
    try {
      await clinicApi.updateClinic(data.realId, {
        name: data.name,
        address: data.address,
        phone: data.phone,
        status: data.status,
        imageUrl: data.imageUrl,
        adminFullName: data.adminFullName,
        adminEmail: data.adminEmail
      });

      showNotification(`Cập nhật thông tin ${data.name} thành công!`, 'success');
      fetchClinics(true);
    } catch (error) {
      console.error('Failed to update clinic:', error);
      showNotification(`Lỗi khi cập nhật ${data.name}`, 'error');
    } finally {
      setIsSaving(false);
      setIsEditModalOpen(false);
    }
  };

  const handleLockClinic = async (clinic: ClinicData) => {
    const isCurrentlyActive = clinic.status === 'Hoạt động';
    const newStatusLabel = isCurrentlyActive ? 'Ngưng hoạt động' : 'Hoạt động';
    const action = isCurrentlyActive ? 'ngưng hoạt động' : 'kích hoạt';

    setClinicList((prev: ClinicData[]) => prev.map((c: ClinicData) => c.realId === clinic.realId ? { ...c, status: newStatusLabel } : c));

    try {
      await clinicApi.toggleClinicStatus(clinic.realId);
      showNotification(`Đã ${action} cơ sở ${clinic.name}`, 'success');
    } catch (error: any) {
      setClinicList((prev: ClinicData[]) => prev.map((c: ClinicData) => c.realId === clinic.realId ? { ...c, status: clinic.status } : c));
      console.error('Failed to toggle status:', error);
      showNotification(`Lỗi khi ${action} phòng khám`, 'error');
    }
  };

  const filteredClinics = clinicList;


  return (
    <>
      <AdminLayout>
        <section className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-700 font-display">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              {isLoading ? (
                <div className="space-y-3 mb-2">
                  <div className="h-8 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-48 sm:w-72"></div>
                  <div className="h-4 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded w-64 sm:w-96"></div>
                </div>
              ) : (
                <>
                  <h2 className="text-lg md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">Quản lý phòng khám</h2>
                  <p className="text-[13px] md:text-[16px] text-slate-500 mt-1 font-medium italic-none">Vận hành và giám sát mạng lưới phòng khám toàn hệ thống</p>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {isLoading ? (
                <>
                  <div className="w-40 h-10 bg-slate-900 dark:bg-slate-800 animate-pulse rounded-lg shadow-sm"></div>
                  <div className="w-32 h-10 bg-white dark:bg-slate-900 animate-pulse rounded-lg border border-primary/10"></div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-primary text-white px-3 md:px-5 py-1.5 md:py-2.5 rounded-full font-bold flex items-center gap-1.5 md:gap-2 transition-all text-[12px] md:text-[13px] shadow-lg shadow-primary/20 hover:shadow-primary/30"
                  >
                    <span className="material-symbols-outlined text-[16px] md:text-[18px]">add_location</span>
                    Thêm cơ sở mới
                  </button>
                  <button
                    onClick={handleExport}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 md:px-4 py-1.5 md:py-2 rounded-full font-bold flex items-center gap-1.5 md:gap-2 transition-all text-[12px] md:text-[13px] border border-primary/10 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px] md:text-[18px]">download</span>
                    Xuất dữ liệu
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bento Grid Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {isLoading ? (
              [...Array(4)].map((_, idx) => (
                <div key={`stat-skeleton-${idx}`} className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-primary/5 shadow-sm animate-pulse text-left">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
                  </div>
                  <div className="h-4 bg-slate-100 dark:bg-slate-800/50 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
                </div>
              ))
            ) : (
              stats.map((stat: ClinicStat, idx: number) => (
                <div key={idx} className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-primary/5 shadow-sm group hover:border-primary/20 transition-all text-left">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-${stat.color === 'primary' ? 'primary' : stat.color + '-500'}/10 flex items-center justify-center text-${stat.color === 'primary' ? 'primary' : stat.color + '-500'}`}>
                      <span className="material-symbols-outlined text-xl md:text-2xl">{stat.icon}</span>
                    </div>
                    {stat.change && (
                      <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-lg text-[11px] md:text-[13px] font-bold">{stat.change} tháng</span>
                    )}
                  </div>
                  <p className="text-slate-500 text-[13.5px] md:text-[16.5px] font-medium mb-1.5">{stat.title}</p>
                  <h3 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{stat.value}</h3>
                </div>
              ))
            )}
          </div>

          {/* List Table Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden border border-primary/5 text-left">
            <div className="px-4 md:px-8 py-4 md:py-6 border-b border-primary/10 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              {isLoading ? (
                <div className="h-6 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-48"></div>
              ) : (
                <h4 className="text-[14px] md:text-[19px] font-bold text-slate-900 dark:text-white">Danh sách phòng khám</h4>
              )}
              <div className="flex flex-row items-center gap-3 w-full sm:w-auto">
                {isLoading ? (
                  <>
                    <div className="h-[38px] md:h-[42px] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-full w-full sm:w-64"></div>
                    <div className="w-40 md:w-48 h-[38px] md:h-[42px] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-full"></div>
                  </>
                ) : (
                  <>
                    <div className="relative flex-1 sm:flex-none sm:w-64 group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-[18px] z-10 pointer-events-none group-focus-within:text-primary transition-colors">search</span>
                      <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        className="w-full h-[38px] md:h-[42px] bg-white dark:bg-slate-900 border border-slate-400 dark:border-slate-700 rounded-full pl-10 pr-4 text-[13px] md:text-[14px] focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Dropdown
                      options={[
                        { label: 'Tất cả hệ thống', value: 'ALL' },
                        { label: 'Đang hoạt động', value: 'ACTIVE' },
                        { label: 'Ngưng hoạt động', value: 'INACTIVE' }
                      ]}
                      value={statusFilter}
                      onChange={(val) => setStatusFilter(val as any)}
                      className="w-40 md:w-48"
                      icon={<span className="material-symbols-outlined text-[18px] text-slate-500">filter_list</span>}
                    />
                    {(searchTerm !== '' || statusFilter !== 'ALL') && (
                      <button
                        onClick={handleResetFilters}
                        className="h-[38px] md:h-[42px] flex items-center justify-center gap-2 px-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all active:scale-90 shadow-lg shadow-red-200 dark:shadow-none whitespace-nowrap text-[13px] font-bold"
                        title="Xóa tất cả bộ lọc"
                      >
                        <span className="material-symbols-outlined text-[20px]">filter_alt_off</span>
                        <span>Xóa bộ lọc</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            {/* Mobile Card View */}
            <div className="block md:hidden">
              {isLoading || isQuerying ? (
                [...Array(5)].map((_, i) => (
                  <div key={`clinic-skeleton-m-${i}`} className="p-4 border-b border-slate-100 dark:border-slate-800 animate-pulse">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32"></div>
                        <div className="h-3 bg-slate-100 dark:bg-slate-800/50 rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : filteredClinics.length === 0 ? (
                <div className="px-4 py-20 text-center">
                  <p className="text-slate-500 font-medium">Không tìm thấy phòng khám nào phù hợp.</p>
                </div>
              ) : (
                filteredClinics.map((clinic: ClinicData, idx: number) => (
                  <div key={idx} className="p-4 border-b border-slate-50 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center overflow-hidden border border-primary/10 shrink-0">
                        {clinic.image ? (
                          <img className="w-full h-full object-cover" src={clinic.image} alt={clinic.name} />
                        ) : (
                          <span className="material-symbols-outlined text-primary/40">home_health</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-slate-900 dark:text-white truncate">{clinic.name}</p>
                        <code className="text-[12px] text-slate-500 font-semibold">{clinic.id}</code>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-white text-[11px] font-medium shrink-0 ${clinic.status === 'Hoạt động' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                        {clinic.status === 'Hoạt động' ? 'Hoạt động' : 'Ngưng'}
                      </span>
                    </div>
                    <div className="space-y-1.5 mb-3">
                      <p className="text-[13px] text-slate-500 font-medium truncate flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-slate-400">location_on</span>
                        {clinic.address}
                      </p>
                      <p className="text-[13px] text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-slate-400">call</span>
                        {clinic.phone}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-primary">stethoscope</span>
                        <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">{clinic.doctors} bác sĩ</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelectedClinic(clinic); setIsEditModalOpen(true); }}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/30 text-sky-600 hover:bg-sky-600 hover:text-white active:scale-95 transition-all duration-300"
                          title="Chỉnh sửa"
                        >
                          <Pencil className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => handleLockClinic(clinic)}
                          className={`w-8 h-8 flex items-center justify-center rounded-xl active:scale-95 transition-all duration-300 ${clinic.status === 'Hoạt động'
                            ? 'bg-red-50 dark:bg-red-950/30 text-red-500 hover:bg-red-500 hover:text-white'
                            : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                          title={clinic.status === 'Hoạt động' ? 'Ngưng hoạt động' : 'Kích hoạt'}
                        >
                          {clinic.status === 'Hoạt động' ? (
                            <XCircle className="w-4 h-4" strokeWidth={2.5} />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                          )}
                        </button>
                        <button
                          onClick={() => { setSelectedClinic(clinic); setIsDetailsModalOpen(true); }}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 hover:bg-indigo-600 hover:text-white active:scale-95 transition-all duration-300"
                          title="Chi tiết"
                        >
                          <Eye className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Desktop Table View */}
            <div className="overflow-x-auto overflow-y-hidden hidden md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                    <th className="px-8 py-4">
                      {isLoading || isQuerying ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-48"></div> : <span className="text-[14px] font-bold text-slate-900 dark:text-white leading-none">Tên phòng khám</span>}
                    </th>
                    <th className="px-6 py-4">
                      {isLoading || isQuerying ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-16"></div> : <span className="text-[14px] font-bold text-slate-900 dark:text-white leading-none">Mã phòng khám</span>}
                    </th>
                    <th className="px-6 py-4">
                      {isLoading || isQuerying ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-32"></div> : <span className="text-[14px] font-bold text-slate-900 dark:text-white leading-none">Địa chỉ</span>}
                    </th>
                    <th className="px-6 py-4">
                      {isLoading || isQuerying ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-20"></div> : <span className="text-[14px] font-bold text-slate-900 dark:text-white leading-none">Số điện thoại</span>}
                    </th>
                    <th className="px-6 py-4 text-center">
                      {isLoading || isQuerying ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-8 mx-auto"></div> : <span className="text-[14px] font-bold text-slate-900 dark:text-white leading-none">Bác sĩ</span>}
                    </th>
                    <th className="px-6 py-4">
                      {isLoading || isQuerying ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-16"></div> : <span className="text-[14px] font-bold text-slate-900 dark:text-white leading-none">Trạng thái</span>}
                    </th>
                    <th className="px-8 py-4 text-right">
                      {isLoading || isQuerying ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-12 ml-auto"></div> : <span className="text-[14px] font-bold text-slate-900 dark:text-white leading-none">Thao tác</span>}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {isLoading || isQuerying ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={`clinic-skeleton-${i}`} className="animate-pulse">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32"></div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-4 bg-slate-100 dark:bg-slate-800/50 rounded w-48"></div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-8 mx-auto"></div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-full w-24"></div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                            <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                            <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : filteredClinics.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-8 py-20 text-center">
                        <p className="text-slate-500 font-medium">Không tìm thấy phòng khám nào phù hợp.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredClinics.map((clinic: ClinicData, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center overflow-hidden border border-primary/10">
                              {clinic.image ? (
                                <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={clinic.image} alt={clinic.name} />
                              ) : (
                                <span className="material-symbols-outlined text-primary/40">home_health</span>
                              )}
                            </div>
                            <div>
                              <span className="block font-semibold text-slate-900 dark:text-white text-[14px] leading-tight">{clinic.name}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <code className="text-[14px] font-bold text-primary bg-primary/5 dark:bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20 uppercase tracking-wider shadow-sm">
                            {clinic.id}
                          </code>
                        </td>
                        <td className="px-6 py-5 relative group/address">
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[220px]">
                            {clinic.address}
                          </p>
                          <div className="absolute left-6 bottom-[80%] hidden group-hover/address:block z-50 animate-in fade-in zoom-in duration-200 pointer-events-none">
                            <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white text-[13px] font-medium px-4 py-2.5 rounded-xl shadow-2xl border border-white/10 backdrop-blur-md w-max max-w-[320px] leading-relaxed">
                              {clinic.address}
                              <div className="absolute top-full left-4 border-8 border-transparent border-t-slate-900/95 dark:border-t-slate-800/95"></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400 font-bold">{clinic.phone}</td>
                        <td className="px-6 py-5 text-center">
                          <span className="text-[15px] font-bold text-slate-700 dark:text-slate-200">{clinic.doctors}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-4 py-1.5 rounded-xl text-white text-[13px] md:text-[14.5px] font-bold shadow-sm whitespace-nowrap inline-flex tracking-tighter ${clinic.status === 'Hoạt động' ? 'bg-emerald-500' : 'bg-red-500'
                            }`}>
                            {clinic.status}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2.5 transition-all">
                            <button
                              onClick={() => { setSelectedClinic(clinic); setIsEditModalOpen(true); }}
                              className="w-9 h-9 flex items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/30 text-sky-600 hover:bg-sky-600 hover:text-white hover:shadow-lg hover:shadow-sky-500/20 dark:hover:shadow-none active:scale-90 transition-all duration-300"
                              title="Chỉnh sửa"
                            >
                              <Pencil className="w-4 h-4" strokeWidth={2.5} />
                            </button>
                            <button
                              onClick={() => handleLockClinic(clinic)}
                              className={`w-9 h-9 flex items-center justify-center rounded-xl active:scale-90 transition-all duration-300 ${clinic.status === 'Hoạt động'
                                ? 'bg-red-50 dark:bg-red-950/30 text-red-500 hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/20 dark:hover:shadow-none'
                                : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 hover:bg-emerald-500 hover:text-white hover:shadow-lg hover:shadow-emerald-500/20 dark:hover:shadow-none'}`}
                              title={clinic.status === 'Hoạt động' ? 'Ngưng hoạt động phòng khám' : 'Kích hoạt phòng khám'}
                            >
                              {clinic.status === 'Hoạt động' ? (
                                <XCircle className="w-4 h-4" strokeWidth={2.5} />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                              )}
                            </button>
                            <button
                              onClick={() => { setSelectedClinic(clinic); setIsDetailsModalOpen(true); }}
                              className="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-500/20 dark:hover:shadow-none active:scale-90 transition-all duration-300"
                              title="Chi tiết"
                            >
                              <Eye className="w-4 h-4" strokeWidth={2.5} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 md:px-8 py-4 md:py-6 bg-slate-50/50 dark:bg-slate-800/30 border-t border-primary/10 flex flex-row justify-end items-center gap-3">
              {isLoading || isQuerying ? (
                <div className="flex gap-1">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                  <div className="w-8 h-8 rounded-lg bg-slate-300 dark:bg-slate-700 animate-pulse"></div>
                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:bg-white dark:hover:bg-slate-700 transition-colors disabled:opacity-30" disabled>
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  <span className="px-3 py-1.5 min-w-[90px] text-center rounded-full bg-primary text-white text-[13px] font-bold shadow-md tracking-tight whitespace-nowrap">
                    Trang 1/1
                  </span>
                  <button className="w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:bg-white dark:hover:bg-slate-700 transition-colors disabled:opacity-30" disabled>
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </AdminLayout>

      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateClinicModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            isSaving={isSaving}
            onSave={handleCreateClinic}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditModalOpen && (
          <EditClinicModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            clinic={selectedClinic}
            isSaving={isSaving}
            onSave={handleEditClinic}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDetailsModalOpen && (
          <ClinicDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            clinic={selectedClinic}
          />
        )}
      </AnimatePresence>
    </>
  );
}
