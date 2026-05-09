import { useState, useEffect } from 'react';
import { clinicApi } from '../api/clinic';
import ClinicSidebar from '../components/common/ClinicSidebar';
import TopBar from '../components/common/TopBar';
import CreateDoctorModal from '../features/clinic/components/CreateDoctorModal';
import EditDoctorModal from '../features/clinic/components/EditDoctorModal';
import DeleteDoctorModal from '../features/clinic/components/DeleteDoctorModal';
import DoctorAssignmentModal from '../features/clinic/components/DoctorAssignmentModal';
import ClinicFilterDropdown from '../components/common/ClinicFilterDropdown';
import Toast from '../components/ui/Toast';
import ImageModal from '../components/ui/ImageModal';

export default function ClinicDoctors() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const currentClinicId = localStorage.getItem('clinicId') || '1';

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Assignment Modal State
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);

    const specialties = ['Nội khoa', 'Sản phụ khoa', 'Nhi khoa', 'Tim mạch', 'Thần kinh', 'Da liễu'];

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tất cả bác sĩ');
    const [specialtyFilter, setSpecialtyFilter] = useState('Chuyên khoa');
    const [degreeFilter, setDegreeFilter] = useState('Học vị');
    const [experienceFilter, setExperienceFilter] = useState('Kinh nghiệm');

    const degrees = ['Tiến sĩ', 'Thạc sĩ', 'BSCKII', 'BSCKI', 'Bác sĩ'];
    const experiences = ['Trên 5 năm', 'Trên 10 năm', 'Trên 20 năm'];

    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const [doctors, setDoctors] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [pageSize] = useState(10);

    const fetchDoctors = async (page = 0, isSilent = false) => {
        if (!isSilent) setIsLoading(true);
        try {
            const res = await clinicApi.getDoctors(currentClinicId, {
                keyword: debouncedSearch || undefined,
                status: statusFilter === 'Tất cả bác sĩ' ? undefined : statusFilter,
                specialty: specialtyFilter === 'Chuyên khoa' ? undefined : specialtyFilter,
                degree: degreeFilter === 'Học vị' ? undefined : degreeFilter,
                experience: experienceFilter === 'Kinh nghiệm' ? undefined : experienceFilter,
                page: page,
                size: pageSize
            });
            if (res.success) {
                const pageData = res.data;
                setDoctors(pageData.content || []);
                setTotalPages(pageData.totalPages || 0);
                setTotalElements(pageData.totalElements || 0);
                setCurrentPage(pageData.number || 0);
            }
        } catch (error) {
            console.error('Failed to fetch doctors:', error);
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
        fetchDoctors(0, false);
        fetchStats();
    }, [currentClinicId, debouncedSearch, statusFilter, specialtyFilter, degreeFilter, experienceFilter]);

    const [notifications, setNotifications] = useState<any[]>([]);

    // Toast State
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const handleCreateDoctor = async (doctorData: any) => {
        setIsSaving(true);
        try {
            const res = await clinicApi.createDoctor(currentClinicId, doctorData);
            if (res.success) {
                fetchDoctors();
                setIsCreateModalOpen(false);
                setToastMessage(`Đã thêm bác sĩ ${doctorData.name} vào hệ thống!`);
                setShowToast(true);
            }
        } catch (error) {
            console.error('Failed to create doctor:', error);
            setToastMessage('Lỗi khi thêm bác sĩ');
            setShowToast(true);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditDoctor = async (doctorData: any) => {
        setIsEditing(true);
        try {
            const res = await clinicApi.updateDoctor(currentClinicId, doctorData.dbId, doctorData);
            if (res.success) {
                fetchDoctors();
                setIsEditing(false);
                setIsEditModalOpen(false);
                setToastMessage(`Đã cập nhật thông tin bác sĩ ${doctorData.name}`);
                setShowToast(true);
            }
        } catch (error) {
            console.error('Failed to edit doctor:', error);
            setToastMessage('Lỗi khi cập nhật thông tin');
            setShowToast(true);
        } finally {
            setIsEditing(false);
        }
    };

    const handleDeleteDoctor = async (doctorId: any) => {
        setIsDeleting(true);
        // Note: Modal works like DeletePatientModal
        const dbId = typeof doctorId === 'object' ? doctorId.dbId : doctorId;
        try {
            const res = await clinicApi.deleteDoctor(currentClinicId, dbId);
            if (res.success) {
                fetchDoctors();
                setIsDeleting(false);
                setIsDeleteModalOpen(false);
                setToastMessage('Đã gỡ bỏ hồ sơ bác sĩ khỏi hệ thống');
                setShowToast(true);
            }
        } catch (error) {
            console.error('Failed to delete doctor:', error);
            setToastMessage('Lỗi khi xóa hồ sơ');
            setShowToast(true);
        } finally {
            setIsDeleting(false);
        }
    };


    // Image Preview Modal State
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');

    const openImagePreview = (url: string, title: string) => {
        setPreviewImageUrl(url);
        setPreviewTitle(title);
        setIsPreviewModalOpen(true);
    };

    return (
        <div className="flex min-h-screen font-display bg-[#f6f8f7] dark:bg-slate-950 text-slate-900 dark:text-slate-100 italic-none">
            <ClinicSidebar
                isSidebarOpen={isSidebarOpen}
                isLoading={isLoading}
            />

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

                <div className="p-4 md:p-8 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        {isLoading ? (
                            <div className="space-y-2">
                                <div className="h-8 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-72"></div>
                                <div className="h-4 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded w-96"></div>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight">Danh sách đội ngũ bác sĩ</h3>
                                <p className="text-[13px] md:text-base text-slate-500 font-medium">Quản lý và điều phối nhân sự y tế trong phòng khám</p>
                            </div>
                        )}

                        {isLoading ? (
                            <div className="w-52 h-12 bg-primary/20 animate-pulse rounded-2xl shadow-sm"></div>
                        ) : (
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="bg-primary text-white px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all font-display whitespace-nowrap group shadow-sm"
                            >
                                <span className="material-symbols-outlined text-[20px]">add</span>
                                Thêm bác sĩ mới
                            </button>
                        )}
                    </div>

                    {/* Statistic Overview Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 italic-none mb-6">
                        {isLoading || !stats ? (
                            [...Array(4)].map((_, i) => (
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
                                {/* Total Doctors */}
                                <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-300">
                                    <div className="flex items-center justify-between mb-3 md:mb-4">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined text-[20px] md:text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>stethoscope</span>
                                        </div>
                                        <span className="px-2 md:px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] md:text-[12px] font-bold rounded-full border border-emerald-100/50">Đang hoạt động</span>
                                    </div>
                                    <div>
                                        <p className="text-[12px] md:text-[14px] font-medium text-slate-500 mb-0.5">Tổng số bác sĩ</p>
                                        <h4 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                                            {stats?.doctorPerformances?.length || totalElements} <span className="text-xs md:text-sm font-medium text-slate-600">nhân sự</span>
                                        </h4>
                                    </div>
                                </div>

                                {/* Active Doctors */}
                                <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-300">
                                    <div className="flex items-center justify-between mb-3 md:mb-4">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl flex items-center justify-center text-emerald-600">
                                            <span className="material-symbols-outlined text-[20px] md:text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                                        </div>
                                        <span className="px-2 md:px-3 py-1 bg-slate-50 text-slate-500 text-[10px] md:text-[12px] font-bold rounded-full border border-slate-200/50">Sẵn sàng</span>
                                    </div>
                                    <div>
                                        <p className="text-[12px] md:text-[14px] font-medium text-slate-600 mb-0.5">Đã cấp chứng chỉ</p>
                                        <h4 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                                            {stats?.doctorPerformances?.filter((d: any) => d.status === 'ACTIVE').length || 0} <span className="text-xs md:text-sm font-medium text-slate-600">bác sĩ</span>
                                        </h4>
                                    </div>
                                </div>

                                {/* Work Load/Performance */}
                                <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-300">
                                    <div className="flex items-center justify-between mb-3 md:mb-4">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl flex items-center justify-center text-indigo-600">
                                            <span className="material-symbols-outlined text-[20px] md:text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>monitoring</span>
                                        </div>
                                        <span className="px-2 md:px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] md:text-[12px] font-bold rounded-full border border-emerald-100/50">+12% Hiệu năng</span>
                                    </div>
                                    <div>
                                        <p className="text-[12px] md:text-[14px] font-medium text-slate-600 mb-0.5">Tỷ lệ hài lòng</p>
                                        <h4 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">98.5 <span className="text-xs md:text-sm font-medium text-slate-600">%</span></h4>
                                    </div>
                                </div>

                                {/* Average Load */}
                                <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-300">
                                    <div className="flex items-center justify-between mb-3 md:mb-4">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-sky-50 dark:bg-sky-900/10 rounded-xl flex items-center justify-center text-sky-600">
                                            <span className="material-symbols-outlined text-[20px] md:text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>speed</span>
                                        </div>
                                        <span className={`px-2 md:px-3 py-1 text-[10px] md:text-[12px] font-bold rounded-full border ${stats?.averageDoctorLoad > 50 ? 'bg-rose-50 text-rose-600 border-rose-100/50' : 'bg-sky-50 text-sky-600 border-sky-100/50'}`}>
                                            {stats?.averageDoctorLoad > 50 ? 'Cảnh báo' : 'Ổn định'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-[12px] md:text-[14px] font-medium text-slate-600 mb-0.5">Tải lượng trung bình</p>
                                        <h4 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                                            {stats?.averageDoctorLoad ? Math.round(stats.averageDoctorLoad) : 0}
                                            <span className="text-xs md:text-sm font-medium text-slate-600 ml-1">bệnh nhân / bác sĩ</span>
                                        </h4>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Filters Bar (Standardized to match Patients) */}
                    <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-2 md:flex md:flex-wrap items-center gap-4 italic-none">
                        {isLoading ? (
                            <>
                                <div className="col-span-2 md:w-[450px] h-11 bg-white/50 dark:bg-slate-800/50 rounded-lg animate-pulse"></div>
                                <div className="w-full h-11 bg-white/50 dark:bg-slate-800/50 rounded-lg animate-pulse"></div>
                                <div className="w-full h-11 bg-white/50 dark:bg-slate-800/50 rounded-lg animate-pulse"></div>
                                <div className="w-full h-11 bg-white/50 dark:bg-slate-800/50 rounded-lg animate-pulse"></div>
                                <div className="w-full h-11 bg-white/50 dark:bg-slate-800/50 rounded-lg animate-pulse"></div>
                            </>
                        ) : (
                            <>
                                <div className="col-span-2 md:w-[450px] relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-[20px]">search</span>
                                    <input
                                        className="w-full pl-12 pr-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 text-sm font-medium text-slate-700 dark:text-slate-200 transition-all outline-none shadow-sm"
                                        placeholder="Tìm kiếm bác sĩ theo tên hoặc mã số..."
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <ClinicFilterDropdown
                                        value={statusFilter}
                                        options={['Tất cả bác sĩ', 'Đang hoạt động', 'Ngưng hoạt động', 'Nghỉ phép']}
                                        onChange={setStatusFilter}
                                    />

                                    <ClinicFilterDropdown
                                        value={specialtyFilter}
                                        options={['Chuyên khoa', ...specialties]}
                                        onChange={setSpecialtyFilter}
                                    />

                                    <ClinicFilterDropdown
                                        value={degreeFilter}
                                        options={['Học vị', ...degrees]}
                                        onChange={setDegreeFilter}
                                    />

                                    <ClinicFilterDropdown
                                        value={experienceFilter}
                                        options={['Kinh nghiệm', ...experiences]}
                                        onChange={setExperienceFilter}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/50 overflow-hidden font-display transition-all duration-300 hover:shadow-md">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                {/* ... thead */}
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                        <th className="px-8 py-4">
                                            {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-32"></div> : <span className="text-[15px] font-medium text-slate-700">Thông tin bác sĩ</span>}
                                        </th>
                                        <th className="px-6 py-4">
                                            {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-24"></div> : <span className="text-[15px] font-medium text-slate-700">Chuyên khoa</span>}
                                        </th>
                                        <th className="px-6 py-4">
                                            {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-20"></div> : <span className="text-[15px] font-medium text-slate-700">Liên hệ</span>}
                                        </th>
                                        <th className="px-6 py-4 text-center">
                                            {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-16 mx-auto"></div> : <span className="text-[15px] font-medium text-slate-700">Lượng bệnh nhân</span>}
                                        </th>
                                        <th className="px-6 py-4">
                                            {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-24"></div> : <span className="text-[15px] font-medium text-slate-700">CC hành nghề</span>}
                                        </th>
                                        <th className="px-6 py-4">
                                            {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-24"></div> : <span className="text-[15px] font-medium text-slate-700">Kinh nghiệm</span>}
                                        </th>
                                        <th className="px-6 py-4">
                                            {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-20"></div> : <span className="text-[15px] font-medium text-slate-700">Trạng thái</span>}
                                        </th>
                                        <th className="px-8 py-4 text-right">
                                            {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-16 ml-auto"></div> : <span className="text-[15px] font-medium text-slate-700">Thao tác</span>}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {isLoading ? (
                                        [...Array(6)].map((_, i) => (
                                            <tr key={`dr-skeleton-${i}`} className="animate-pulse">
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0"></div>
                                                        <div className="space-y-2">
                                                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24"></div>
                                                            <div className="h-3 bg-slate-50 dark:bg-slate-800/50 rounded w-32"></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-20"></div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-28"></div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-8 mx-auto"></div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24"></div>
                                                </td>
                                                <td className="px-8 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                                                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                                                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : doctors.length > 0 ? (
                                        doctors.map((dr, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer border-b border-slate-50 dark:border-slate-800 last:border-0">
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openImagePreview(dr.img || `https://ui-avatars.com/api/?name=${encodeURIComponent(dr.name)}&background=e0f2fe&color=0369a1`, `Ảnh bác sĩ: ${dr.name}`); }}
                                                            className="relative shrink-0 group/avatar overflow-hidden rounded-xl"
                                                        >
                                                            <img alt={dr.name} className="w-11 h-11 rounded-xl object-cover ring-2 ring-primary/10 transition-transform duration-500 group-hover/avatar:scale-110" src={dr.img || `https://ui-avatars.com/api/?name=${encodeURIComponent(dr.name)}&background=e0f2fe&color=0369a1`} />
                                                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity border-0">
                                                                <span className="material-symbols-outlined text-white text-[16px]">zoom_in</span>
                                                            </div>
                                                        </button>
                                                        <div>
                                                            <p className="text-[14px] font-medium text-slate-700 dark:text-slate-200 transition-colors tracking-tight italic-none">{dr.name}</p>
                                                            <p className="text-[12px] text-slate-500 font-medium">{dr.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-slate-700 dark:text-slate-300 text-[14px] font-medium whitespace-nowrap">
                                                        {dr.specialty}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-[14px] font-medium text-slate-700 dark:text-slate-300 tracking-tight whitespace-nowrap">{dr.phone}</p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-[14px] font-medium text-slate-700 dark:text-white">{dr.load}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[14px] font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{dr.licenseNumber || 'Chưa cập nhật'}</span>
                                                        {dr.licenseImageUrl && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); openImagePreview(dr.licenseImageUrl, `Chứng chỉ hành nghề: ${dr.name}`); }}
                                                                className="w-7 h-7 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                                                                title="Xem ảnh bằng chứng CCHN"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">visibility</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-slate-700 dark:text-slate-300 text-[14px] font-medium whitespace-nowrap">
                                                        {dr.experience || 'Chưa cập nhật'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-bold italic-none shadow-md transition-all text-white ${dr.status === 'ACTIVE' ? 'bg-emerald-500' :
                                                            dr.status === 'ON_LEAVE' ? 'bg-amber-500' :
                                                                dr.status === 'INACTIVE' ? 'bg-rose-500' :
                                                                    'bg-slate-400'
                                                        }`}>
                                                        {dr.status === 'ACTIVE' ? 'Đang hoạt động' :
                                                            dr.status === 'ON_LEAVE' ? 'Nghỉ phép' :
                                                                dr.status === 'INACTIVE' ? 'Ngưng hoạt động' : dr.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={(e) => { e.stopPropagation(); setSelectedDoctor(dr); setIsEditModalOpen(true); }} className="p-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors" title="Chỉnh sửa">
                                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); setSelectedDoctor(dr); setIsAssignmentModalOpen(true); }} className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors" title="Điều phối">
                                                            <span className="material-symbols-outlined text-[20px]">assignment_ind</span>
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); setSelectedDoctor(dr); setIsDeleteModalOpen(true); }} className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors" title="Xóa">
                                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={8} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3 text-slate-400">
                                                    <span className="material-symbols-outlined text-4xl opacity-20">person_off</span>
                                                    <p className="text-sm font-medium text-slate-500">Không tìm thấy bác sĩ phù hợp</p>
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
                                        Hiển thị <span className="font-medium text-slate-900 dark:text-white">{doctors.length}</span>/<span className="font-medium text-slate-900 dark:text-white">{totalElements}</span> bác sĩ
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => fetchDoctors(currentPage - 1)}
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
                                            onClick={() => fetchDoctors(currentPage + 1)}
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

                <CreateDoctorModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} isSaving={isSaving} onSave={handleCreateDoctor} />
                <EditDoctorModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} isSaving={isEditing} onSave={handleEditDoctor} initialData={selectedDoctor} />
                <DeleteDoctorModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} isDeleting={isDeleting} onDelete={handleDeleteDoctor} doctorData={selectedDoctor} />
                <DoctorAssignmentModal isOpen={isAssignmentModalOpen} onClose={() => setIsAssignmentModalOpen(false)} doctorData={selectedDoctor} />
                <ImageModal isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} imageUrl={previewImageUrl} title={previewTitle} />

                <Toast
                    show={showToast}
                    title={toastMessage}
                    onClose={() => setShowToast(false)}
                />
            </main>
        </div>
    );
}
