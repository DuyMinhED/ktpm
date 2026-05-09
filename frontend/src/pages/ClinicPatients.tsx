import { useState, useEffect } from 'react';
import { clinicApi } from '../api/clinic';
import CreatePatientModal from '../features/clinic/components/CreatePatientModal';
import EditPatientModal from '../features/clinic/components/EditPatientModal';
import DeletePatientModal from '../features/clinic/components/DeletePatientModal';
import ClinicFilterDropdown from '../components/common/ClinicFilterDropdown';
import ClinicSidebar from '../components/common/ClinicSidebar';
import TopBar from '../components/common/TopBar';
import Toast from '../components/ui/Toast';
import PatientDetailModal from '../features/patient/components/PatientDetailModal';

export default function ClinicPatients() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const currentClinicId = localStorage.getItem('clinicId') || '1';

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [conditionFilter, setConditionFilter] = useState('Tất cả bệnh lý');
    const [riskFilter, setRiskFilter] = useState('Mức độ rủi ro');
    const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái');
    const [doctorFilter, setDoctorFilter] = useState('Tất cả bác sĩ');

    // Edit/Delete Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Toast State
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);
    const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
    const [availableConditions, setAvailableConditions] = useState<string[]>([]);

    const [patients, setPatients] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [pageSize] = useState(10);

    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPatients = async (page = currentPage, isSilent = false) => {
        if (!isSilent) setIsLoading(true);
        try {
            const res = await clinicApi.getPatients(currentClinicId, {
                keyword: debouncedSearch || undefined,
                condition: conditionFilter !== 'Tất cả bệnh lý' ? conditionFilter : undefined,
                riskLevel: riskFilter !== 'Mức độ rủi ro' ? riskFilter : undefined,
                status: statusFilter !== 'Tất cả trạng thái' ? statusFilter : undefined,
                doctor: doctorFilter !== 'Tất cả bác sĩ' ? doctorFilter : undefined,
                page: page,
                size: pageSize
            });
            if (res.success) {
                const pageData = res.data;
                const cleanedPatients = (pageData.content || []).map((p: any) => ({
                    ...p,
                    // Clean prefix "BS" or "Bác sĩ" if any
                    doctor: p.doctor ? p.doctor.replace(/^(BS\.|Bác sĩ\s*)/i, '').trim() : p.doctor
                }));
                setPatients(cleanedPatients);
                setTotalPages(pageData.totalPages || 0);
                setTotalElements(pageData.totalElements || 0);
                setCurrentPage(pageData.number || 0);
            }
        } catch (error) {
            console.error('Failed to fetch patients:', error);
        } finally {
            if (!isSilent) setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await clinicApi.getDashboard(currentClinicId);
            if (res.success) {
                setStats(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await clinicApi.getAvailableDoctors(currentClinicId);
                if (res.success) {
                    // Normalize doctor names if they have prefixes
                    const doctors = res.data.map((d: any) => ({
                        ...d,
                        name: d.name.replace(/^(BS\.|Bác sĩ\s*)/i, '').trim()
                    }));
                    setAvailableDoctors(doctors);
                }
            } catch (error) {
                console.error('Failed to fetch doctors:', error);
            }
        };

        const fetchConditions = async () => {
            try {
                const res = await clinicApi.getConditions(currentClinicId);
                if (res.success) {
                    setAvailableConditions(res.data);
                }
            } catch (error) {
                console.error('Failed to fetch conditions:', error);
                setAvailableConditions(['Tiểu đường Type 1', 'Tiểu đường Type 2', 'Cao huyết áp', 'Bệnh tim mạch', 'Suy thận', 'Hen suyễn', 'Khác']); // Fallback
            }
        };

        fetchDoctors();
        fetchConditions();
        fetchStats();
    }, [currentClinicId]);

    useEffect(() => {
        fetchPatients(0, false);
    }, [debouncedSearch, conditionFilter, riskFilter, statusFilter, doctorFilter]);

    const handleSavePatient = async (patientData: any) => {
        setIsSaving(true);
        try {
            const res = await clinicApi.createPatient(currentClinicId, patientData);
            if (res.success) {
                fetchPatients();
                setIsCreateModalOpen(false);
                setToastMessage('Thêm bệnh nhân thành công');
                setToastType('success');
                setShowToast(true);
            }
        } catch (error: any) {
            console.error('Failed to save patient:', error);
            const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi lưu hồ sơ. Vui lòng thử lại!';
            setToastMessage(errorMessage);
            setToastType('error');
            setShowToast(true);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditPatient = async (patientData: any) => {
        setIsEditing(true);
        try {
            // Use dbId for backend API, keep existing 'id' (patientCode) for UI consistency
            const res = await clinicApi.updatePatient(currentClinicId, selectedPatient.dbId, patientData);
            if (res.success) {
                fetchPatients();
                setIsEditing(false);
                setIsEditModalOpen(false);
                setToastMessage('Cập nhật hồ sơ thành công');
                setToastType('success');
                setShowToast(true);
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật hồ sơ:', error);
            setToastMessage('Lỗi khi cập nhật hồ sơ');
            setToastType('error');
            setShowToast(true);
            setIsEditing(false);
        }
    };

    const handleDeletePatient = async (patientId: any) => {
        setIsDeleting(true);
        // Note: patientId passed from modal could be 'id' or 'dbId' depending on implementation
        // Since we want the database ID for the endpoint:
        try {
            const res = await clinicApi.deletePatient(currentClinicId, patientId);
            if (res.success) {
                fetchPatients();
                setIsDeleting(false);
                setIsDeleteModalOpen(false);
                setToastMessage('Xóa hồ sơ thành công');
                setToastType('success');
                setShowToast(true);
            }
        } catch (error) {
            console.error('Lỗi khi xóa hồ sơ:', error);
            setToastMessage('Lỗi khi xóa hồ sơ');
            setToastType('error');
            setShowToast(true);
            setIsDeleting(false);
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
                    <div className="p-4 md:p-8 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            {isLoading ? (
                                <div className="space-y-2">
                                    <div className="h-8 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-64"></div>
                                    <div className="h-4 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded w-80"></div>
                                </div>
                            ) : (
                                <div className="space-y-1 text-left">
                                    <h3 className="text-lg md:text-xl font-bold italic-none text-slate-900 dark:text-white tracking-tight">Hồ sơ bệnh nhân mãn tính</h3>
                                    <p className="text-[13px] md:text-base text-slate-500 font-medium">Theo dõi và quản lý dữ liệu lâm sàng diện rộng</p>
                                </div>
                            )}

                            {isLoading ? (
                                <div className="w-48 h-10 bg-primary/20 animate-pulse rounded-xl shadow-sm"></div>
                            ) : (
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="bg-primary text-white px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all font-display whitespace-nowrap group shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-[20px]">add</span>
                                    Thêm bệnh nhân mới
                                </button>
                            )}
                        </div>

                        {/* Stats Summary - Separated Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 italic-none mb-6">
                            {isLoading || !stats ? (
                                [...Array(3)].map((_, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-primary/5 shadow-sm space-y-4 animate-pulse">
                                        <div className="flex items-center justify-between">
                                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                                            <div className="w-24 h-6 bg-slate-50 dark:bg-slate-800 rounded-full"></div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-20"></div>
                                            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <>
                                    {/* Visit Performance */}
                                    <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-300">
                                        <div className="flex items-center justify-between mb-3 md:mb-4">
                                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                                            </div>
                                            <span className="px-2 md:px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full uppercase tracking-wider border border-emerald-100/50">
                                                {stats?.patientGrowth || '+0%'} Tăng trưởng
                                            </span>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[12px] md:text-[14px] font-medium text-slate-500 mb-0.5">Hiệu suất khám bệnh</p>
                                            <h4 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">{stats?.totalPatients || '0'} <span className="text-xs md:text-sm font-medium text-slate-600">ca</span></h4>
                                        </div>
                                    </div>

                                    {/* High Risk */}
                                    <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-300">
                                        <div className="flex items-center justify-between mb-3 md:mb-4">
                                            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/10 rounded-xl flex items-center justify-center text-rose-600">
                                                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                                            </div>
                                            <span className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-full uppercase tracking-wider border border-slate-200/50">Thời gian thực</span>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[12px] md:text-[14px] font-medium text-slate-600 mb-0.5">Ca nguy cơ cao</p>
                                            <h4 className="text-lg md:text-2xl font-bold text-red-500 leading-tight">{stats?.highRiskAlerts || '0'} <span className="text-xs md:text-sm font-medium text-red-300">cảnh báo</span></h4>
                                        </div>
                                    </div>

                                    {/* Pending follow-up */}
                                    <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-300">
                                        <div className="flex items-center justify-between mb-3 md:mb-4">
                                            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl flex items-center justify-center text-indigo-600">
                                                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                                            </div>
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full uppercase tracking-wider border border-emerald-100/50">{stats?.highRiskGrowth || '+0 ca'} mới</span>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[12px] md:text-[14px] font-medium text-slate-600 mb-0.5">Chờ tái khám</p>
                                            <h4 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">{stats?.pendingFollowUps || '0'} <span className="text-xs md:text-sm font-medium text-slate-600">lịch hẹn</span></h4>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Combined Filters Container */}
                        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-2 md:flex md:flex-wrap items-center gap-4">
                            {isLoading ? (
                                <>
                                    <div className="col-span-2 md:w-[450px] h-11 bg-white/50 dark:bg-slate-800/50 rounded-full animate-pulse"></div>
                                    <div className="w-full h-11 bg-white/50 dark:bg-slate-800/50 rounded-full animate-pulse"></div>
                                    <div className="w-full h-11 bg-white/50 dark:bg-slate-800/50 rounded-full animate-pulse"></div>
                                    <div className="w-full h-11 bg-white/50 dark:bg-slate-800/50 rounded-full animate-pulse"></div>
                                </>
                            ) : (
                                <>
                                    <div className="col-span-2 md:w-[450px] relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-[20px] z-10 pointer-events-none">search</span>
                                        <input
                                            className="w-full pl-11 pr-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-400 dark:border-slate-700 rounded-full focus:ring-4 focus:ring-primary/5 focus:border-primary text-sm font-medium text-slate-700 dark:text-slate-200 transition-all outline-none italic-none shadow-sm"
                                            placeholder="Tìm kiếm theo tên bệnh nhân"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <ClinicFilterDropdown
                                            value={conditionFilter}
                                            options={['Tất cả bệnh lý', ...availableConditions]}
                                            onChange={setConditionFilter}
                                        />
                                        <ClinicFilterDropdown
                                            value={riskFilter}
                                            options={['Mức độ rủi ro', 'Ổn định', 'Theo dõi', 'Nguy cơ cao']}
                                            onChange={setRiskFilter}
                                        />
                                        <ClinicFilterDropdown
                                            value={statusFilter}
                                            options={['Tất cả trạng thái', 'Hoạt động', 'Ngưng hoạt động']}
                                            onChange={setStatusFilter}
                                        />
                                        <ClinicFilterDropdown
                                            value={doctorFilter}
                                            options={['Tất cả bác sĩ', ...availableDoctors.map(dr => dr.name)]}
                                            onChange={setDoctorFilter}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/50 overflow-hidden font-display transition-all duration-300 hover:shadow-md">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                            <th className="px-8 py-4">
                                                {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-24"></div> : <span className="text-[15px] font-medium text-slate-700">Người bệnh</span>}
                                            </th>
                                            <th className="px-6 py-4">
                                                {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-16"></div> : <span className="text-[15px] font-medium text-slate-700">Liên hệ</span>}
                                            </th>
                                            <th className="px-6 py-4">
                                                {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-20"></div> : <span className="text-[15px] font-medium text-slate-700">Bệnh lý</span>}
                                            </th>
                                            <th className="px-6 py-4">
                                                {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-16"></div> : <span className="text-[15px] font-medium text-slate-700">Tình trạng</span>}
                                            </th>
                                            <th className="px-6 py-4">
                                                {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-24"></div> : <span className="text-[15px] font-medium text-slate-700">Phụ trách</span>}
                                            </th>
                                            <th className="px-6 py-4">
                                                {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-16"></div> : <span className="text-[15px] font-medium text-slate-700">Rủi ro</span>}
                                            </th>
                                            <th className="px-6 py-4">
                                                {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-20"></div> : <span className="text-[15px] font-medium text-slate-700">Trạng thái hồ sơ</span>}
                                            </th>
                                            <th className="px-8 py-4 text-right">
                                                {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-16 ml-auto"></div> : <span className="text-[15px] font-medium text-slate-700">Thao tác</span>}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {isLoading ? (
                                            [...Array(pageSize)].map((_, i) => (
                                                <tr key={`skeleton-${i}`} className="animate-pulse">
                                                    <td className="px-8 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800"></div>
                                                            <div className="space-y-2">
                                                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24"></div>
                                                                <div className="h-3 bg-slate-50 dark:bg-slate-800 rounded w-16"></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4"><div className="h-4 bg-slate-50 dark:bg-slate-800 rounded w-24"></div></td>
                                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-28"></div></td>
                                                    <td className="px-6 py-4"><div className="h-4 bg-slate-50 dark:bg-slate-800 rounded w-20"></div></td>
                                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-20"></div></td>
                                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24"></div></td>
                                                    <td className="px-6 py-4"><div className="h-8 bg-slate-50 dark:bg-slate-800 rounded-full w-24"></div></td>
                                                    <td className="px-8 py-4"><div className="flex justify-end gap-2"><div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800"></div><div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800"></div></div></td>
                                                </tr>
                                            ))
                                        ) : patients.length > 0 ? patients.map((p, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer border-b border-slate-50 dark:border-slate-800 last:border-0">
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <img alt={p.name} className="w-11 h-11 rounded-xl object-cover ring-2 ring-primary/10" src={p.avatarUrl || p.img} />
                                                        <div className="text-left">
                                                            <p className="text-[14px] font-medium text-slate-700 dark:text-slate-200 transition-colors tracking-tight italic-none">{p.name}</p>
                                                            <p className="text-[12px] text-slate-500 font-medium">{p.age} tuổi</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-[14px] font-medium text-slate-600">
                                                        {p.phone}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-[14px] font-medium text-slate-600 italic-none">
                                                        {p.condition}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-[14px] font-medium">
                                                        {p.treatmentStatus || 'Đang điều trị'}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-[14px] font-medium text-slate-700">
                                                        {p.doctor && !p.doctor.startsWith('Bác sĩ') ? `Bác sĩ ${p.doctor}` : p.doctor}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[14px] font-medium text-slate-600 italic-none">
                                                            {p.riskLevel?.includes('HIGH') || p.riskLevel?.includes('Nguy cơ cao') ? 'Nguy cơ cao' : p.riskLevel?.includes('MONITORING') || p.riskLevel?.includes('theo dõi') ? 'Theo dõi' : 'Ổn định'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-bold italic-none shadow-md transition-all text-white ${p.status === 'Ngưng hoạt động'
                                                        ? 'bg-rose-500 dark:bg-rose-600'
                                                        : 'bg-emerald-500 dark:bg-emerald-600'
                                                        }`}>
                                                        {p.status === 'Ngưng hoạt động' ? 'Ngưng hoạt động' : 'Hoạt động'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 transition-all">
                                                        <button 
                                                            onClick={() => { setSelectedPatient(p); setIsDetailModalOpen(true); }}
                                                            className="p-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors" 
                                                            title="Xem hồ sơ"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                        </button>
                                                        <button
                                                            onClick={() => { setSelectedPatient(p); setIsEditModalOpen(true); }}
                                                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => { setSelectedPatient(p); setIsDeleteModalOpen(true); }}
                                                            className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                            title="Loại bỏ"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={7} className="px-8 py-20 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="material-symbols-outlined text-4xl opacity-20">person_off</span>
                                                        <p className="text-sm font-medium text-slate-500">Không tìm thấy bệnh nhân nào</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="px-8 py-6 bg-slate-50/30 dark:bg-slate-800/30 flex items-center justify-between border-t border-slate-200 dark:border-slate-700">
                                {isLoading ? (
                                    <>
                                        <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-48"></div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
                                            <div className="w-16 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-[14px] font-medium text-slate-500">
                                            Hiển thị <span className="font-medium text-slate-500 dark:text-white">{patients.length}</span> trên <span className="font-medium text-slate-500 dark:text-white">{totalElements}</span> hồ sơ
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => fetchPatients(currentPage - 1)}
                                                disabled={currentPage === 0}
                                                className="p-2 rounded-xl bg-white dark:bg-slate-100 border border-slate-200 text-slate-400 hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                                            </button>
                                            <div className="flex items-center gap-1.5">
                                                <button className="w-10 h-10 rounded-xl bg-primary text-white text-sm font-black shadow-lg shadow-primary/20 transition-all">
                                                    {currentPage + 1}
                                                </button>
                                                <span className="text-sm font-medium text-slate-400 mx-1">/ {totalPages || 1}</span>
                                            </div>
                                            <button
                                                onClick={() => fetchPatients(currentPage + 1)}
                                                disabled={currentPage >= totalPages - 1}
                                                className="p-2 rounded-xl bg-white dark:bg-slate-100 border border-slate-200 text-slate-400 hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <CreatePatientModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                isSaving={isSaving}
                onSave={handleSavePatient}
                availableDoctors={availableDoctors}
                availableConditions={availableConditions}
            />

            <EditPatientModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                isSaving={isEditing}
                onSave={handleEditPatient}
                patientData={selectedPatient}
                availableDoctors={availableDoctors}
            />

            <DeletePatientModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                isDeleting={isDeleting}
                onDelete={handleDeletePatient}
                patientData={selectedPatient}
            />

            <PatientDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                patient={selectedPatient}
            />


            <Toast
                show={showToast}
                title={toastMessage}
                type={toastType}
                onClose={() => setShowToast(false)}
            />
        </div>
    );
}
