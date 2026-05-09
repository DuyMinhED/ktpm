import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { clinicApi } from '../../../api/clinic';
import Toast from '../../../components/ui/Toast';
import Dropdown from '../../../components/ui/Dropdown';
import EditPatientModal from './EditPatientModal';

interface DoctorAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    doctorData: any;
}

export default function DoctorAssignmentModal({
    isOpen,
    onClose,
    doctorData
}: DoctorAssignmentModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [assignedPatients, setAssignedPatients] = useState<any[]>([]);
    const [unassignedPatients, setUnassignedPatients] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
    const [isSavingPatient, setIsSavingPatient] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isAssigning, setIsAssigning] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMsg, setToastMsg] = useState('');
    const [activeTab, setActiveTab] = useState<'assigned' | 'new'>('assigned');
    const [visibleCount, setVisibleCount] = useState(10);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const currentClinicId = localStorage.getItem('clinicId') || '1';
    const doctorId = doctorData?.dbId || doctorData?.id;
    const observerTarget = useRef(null);

    useEffect(() => {
        if (isOpen && doctorId) {
            document.body.style.overflow = 'hidden';
            fetchData();
        } else {
            document.body.style.overflow = 'unset';
            setAssignedPatients([]);
            setUnassignedPatients([]);
            setActiveTab('assigned');
            setVisibleCount(10);
        }
        return () => {
            document.body.style.overflow = 'unset';
            setSearchQuery('');
        };
    }, [isOpen, doctorId]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && !isLoadingMore) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [isLoadingMore, visibleCount]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [patientsRes, doctorsRes] = await Promise.all([
                clinicApi.getPatients(currentClinicId, { size: 500 }),
                clinicApi.getDoctors(currentClinicId)
            ]);

            if (patientsRes.success) {
                const allPatients = patientsRes.data.content || [];
                setAssignedPatients(allPatients.filter((p: any) => p.assignedDoctorId === doctorId || p.doctorId === doctorId));
                setUnassignedPatients(allPatients.filter((p: any) => !p.assignedDoctorId && !p.doctorId));
            }

            if (doctorsRes.success) {
                // Handle both raw list and paginated response
                const docs = doctorsRes.data?.content || doctorsRes.data || [];
                setDoctors(Array.isArray(docs) ? docs : []);
            }
        } catch (error) {
            console.error('Failed to fetch data for assignment:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMore = () => {
        const allFilteredCount = (activeTab === 'assigned' ? assignedPatients : unassignedPatients).filter(p =>
            p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            String(p.id)?.toLowerCase().includes(searchQuery.toLowerCase())
        ).length;

        if (visibleCount >= allFilteredCount) return;

        setIsLoadingMore(true);
        // Simulate loading feel
        setTimeout(() => {
            setVisibleCount(prev => prev + 10);
            setIsLoadingMore(false);
        }, 400);
    };

    const handleAssign = async (patient: any, targetDoctorId: string) => {
        setIsAssigning(true);
        try {
            const res = await clinicApi.updatePatient(currentClinicId, patient.dbId || patient.id, {
                doctorId: targetDoctorId
            });
            if (res.success) {
                setToastMsg('Gán bệnh nhân thành công!');
                setShowToast(true);
                fetchData(); // Refresh list
            } else {
                setToastMsg('Lỗi khi gán bệnh nhân!');
                setShowToast(true);
            }
        } catch (error) {
            console.error('Lỗi khi gán:', error);
            setToastMsg('Đã có lỗi xảy ra!');
            setShowToast(true);
        } finally {
            setIsAssigning(false);
        }
    };

    const handleUnassign = async (patient: any) => {
        setIsAssigning(true);
        try {
            const res = await clinicApi.updatePatient(currentClinicId, patient.dbId || patient.id, {
                doctorId: -1 // Special value to unassign
            });
            if (res.success) {
                setToastMsg('Gỡ phân công thành công!');
                setShowToast(true);
                fetchData(); // Refresh list
            } else {
                setToastMsg('Lỗi khi gỡ phân công!');
                setShowToast(true);
            }
        } catch (error) {
            console.error('Lỗi khi gỡ phân công:', error);
            setToastMsg('Đã có lỗi xảy ra!');
            setShowToast(true);
        } finally {
            setIsAssigning(false);
        }
    };

    const handleSavePatient = async (updatedData: any) => {
        setIsSavingPatient(true);
        try {
            const res = await clinicApi.updatePatient(currentClinicId, updatedData.dbId || updatedData.id, updatedData);
            if (res.success) {
                setToastMsg('Cập nhật hồ sơ thành công!');
                setShowToast(true);
                setSelectedPatient(null);
                fetchData();
            } else {
                setToastMsg('Lỗi khi cập nhật!');
                setShowToast(true);
            }
        } catch (error) {
            console.error(error);
            setToastMsg('Lỗi kết nối!');
            setShowToast(true);
        } finally {
            setIsSavingPatient(false);
        }
    };

    if (!isOpen || !doctorData) return null;

    const allFiltered = (activeTab === 'assigned' ? assignedPatients : unassignedPatients).filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(p.id)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(p.primaryCondition || '')?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const paginatedPatients = allFiltered.slice(0, visibleCount);

    const MAX_PATIENTS = doctorData.maxPatients || 150;
    const currentLoad = assignedPatients.length;
    const loadPercentage = Math.round((currentLoad / MAX_PATIENTS) * 100);

    let loadColor = 'emerald';
    if (loadPercentage > 90) loadColor = 'red';
    else if (loadPercentage > 75) loadColor = 'amber';

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 font-display text-left">
            <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] transition-all duration-300" onClick={onClose}></div>

            <div className="relative bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 border border-slate-200 dark:border-slate-800 transition-all max-h-[92vh]">
                {/* Fixed Header */}
                <div className="px-6 md:px-8 pt-8 pb-3 flex flex-col bg-white dark:bg-slate-900 shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[19px] font-bold text-slate-800 dark:text-white">Gán bệnh nhân cho bác sĩ</h2>
                    </div>
                </div>

                <div className="overflow-y-auto custom-scrollbar flex-1 pb-32">
                    {/* Fixed Metrics Section */}
                    <div className="px-6 md:px-8 pt-1 pb-2 space-y-6 shrink-0">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2 ml-1">
                                <span className="material-symbols-outlined text-[22px] text-slate-600">monitoring</span>
                                <h3 className="text-[16px] font-bold text-slate-600">Thông số vận hành</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                                    <h4 className="text-[15px] font-semibold text-slate-600 mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[20px] text-slate-600">speed</span> Tải trọng bác sĩ
                                    </h4>
                                    <div className="flex items-end justify-between mb-3">
                                        <div className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                                            {currentLoad} <span className="text-[14px] font-medium text-slate-400">/ {MAX_PATIENTS} ca</span>
                                        </div>
                                        <div className={`text-[12px] font-black text-${loadColor}-600 bg-${loadColor}-50 dark:bg-${loadColor}-500/10 px-2 py-1 rounded-lg border border-${loadColor}-100 dark:border-${loadColor}-900/50`}>
                                            {loadPercentage}% Công suất
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                        <div className={`bg-${loadColor}-500 h-full rounded-full transition-all duration-1000 shadow-sm`} style={{ width: `${Math.min(loadPercentage, 100)}%` }}></div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                                    <div>
                                        <h4 className="text-[15px] font-semibold text-slate-600 mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[20px] text-slate-600">group</span> Tổng quan quản lý
                                        </h4>
                                        <div className="text-3xl font-black text-slate-900 dark:text-white leading-none">{assignedPatients.length} <span className="text-[15px] font-medium text-slate-500">Bệnh nhân</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4 ml-1">
                            <span className="material-symbols-outlined text-[22px] text-slate-600">assignment_ind</span>
                            <h3 className="text-[16px] font-bold text-slate-600">Danh sách bệnh nhân chi tiết</h3>
                        </div>
                    </div>

                    {/* Infinite Scrolling Table Section */}
                    <div className="px-6 md:px-8 pt-4 pb-0">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                            {/* Table Controls */}
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between shrink-0 bg-slate-50/40 dark:bg-slate-800/20">
                                <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1 rounded-xl">
                                    <button
                                        onClick={() => { setActiveTab('assigned'); setVisibleCount(10); }}
                                        className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${activeTab === 'assigned' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        Đang phụ trách ({assignedPatients.length})
                                    </button>
                                    <button
                                        onClick={() => { setActiveTab('new'); setVisibleCount(10); }}
                                        className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${activeTab === 'new' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        Chờ phân công ({unassignedPatients.length})
                                    </button>
                                </div>
                                <div className="relative w-full md:w-80">
                                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 font-bold">search</span>
                                    <input
                                        type="text"
                                        placeholder="Tìm tên, mã số hoặc chẩn đoán..."
                                        value={searchQuery}
                                        onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(10); }}
                                        className="w-full pl-11 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-[14px] text-slate-900 dark:text-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium outline-none shadow-sm h-[44px]"
                                    />
                                </div>
                            </div>

                            {/* Table content (Scrolling) */}
                            <div className="relative pb-10">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                        <p className="text-[14px] font-bold text-slate-400 tracking-wide">Đang đồng bộ dữ liệu...</p>
                                    </div>
                                ) : (
                                    <>
                                        <table className="w-full text-left">
                                            <thead className="sticky top-0 z-10 bg-white dark:bg-slate-900">
                                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 shadow-sm">
                                                    <th className="px-6 py-4 text-[14px] font-medium text-slate-800">Thông tin bệnh nhân</th>
                                                    <th className="px-6 py-4 text-[14px] font-medium text-slate-800 text-center">Tuổi</th>
                                                    <th className="px-6 py-4 text-[14px] font-medium text-slate-800 text-center">Giới tính</th>
                                                    <th className="px-6 py-4 text-[14px] font-medium text-slate-800">Chẩn đoán Chính</th>
                                                    <th className="px-6 py-4 text-[14px] font-medium text-slate-800 text-center">Bảo hiểm</th>
                                                    <th className="px-6 py-4 text-[14px] font-medium text-slate-800 text-right">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {paginatedPatients.length > 0 ? paginatedPatients.map((patient, idx) => (
                                                    <tr key={idx} className="transition-colors group hover:bg-slate-50/30 dark:hover:bg-slate-800/30">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="relative">
                                                                    <img
                                                                        src={patient.img || `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=random`}
                                                                        alt={patient.name}
                                                                        onError={(e) => {
                                                                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=random`;
                                                                        }}
                                                                        className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800 shadow-sm"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[14px] font-bold text-slate-800 dark:text-white transition-colors">{patient.name}</p>
                                                                    <p className="text-[12px] font-medium text-slate-600 mt-0.5">{patient.id}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="text-[14px] font-medium text-slate-700 dark:text-slate-300">{patient.age || '—'}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="text-[14px] font-medium text-slate-700 dark:text-slate-300">{patient.gender === 'Nam' ? 'Nam' : 'Nữ'}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-[14px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed max-w-[180px] truncate">{patient.primaryCondition || 'Chưa cập nhật'}</p>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`px-2.5 py-1 rounded-lg text-[12px] font-bold text-white ${patient.insuranceNumber ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                                                {patient.insuranceNumber ? 'Có' : 'Không'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {activeTab === 'assigned' ? (
                                                                <div className="flex items-center justify-end gap-2.5">
                                                                    <button onClick={() => {
                                                                        setSelectedPatient(patient);
                                                                    }} title="Xem hồ sơ" className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary hover:border-primary transition-all flex items-center justify-center group/btn shadow-sm">
                                                                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                                    </button>
                                                                    <button onClick={() => handleUnassign(patient)} title="Gỡ phân công" className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 hover:border-red-500 transition-all flex items-center justify-center group/btn shadow-sm">
                                                                        <span className="material-symbols-outlined text-[18px]">person_remove</span>
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex justify-end min-w-[150px] max-w-[170px]">
                                                                    <Dropdown
                                                                        size="sm"
                                                                        disabled={isAssigning}
                                                                        options={doctors.map(dr => ({
                                                                            label: isAssigning ? 'Đang gán...' : dr.name,
                                                                            value: String(dr.id || dr.dbId)
                                                                        }))}
                                                                        value=""
                                                                        onChange={(selectedId: string) => {
                                                                            if (selectedId) handleAssign(patient, selectedId);
                                                                        }}
                                                                        className="w-full"
                                                                    />
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-28 text-center bg-slate-50/20">
                                                            <div className="flex flex-col items-center gap-3">
                                                                <span className="material-symbols-outlined text-[48px] text-slate-200">person_search</span>
                                                                <p className="text-[15px] font-medium text-slate-400">Không tìm thấy bệnh nhân phù hợp</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>

                                        {/* Intersection Sentinel for Infinite Scroll */}
                                        <div ref={observerTarget} className={`${visibleCount < allFiltered.length ? 'h-10' : 'h-0'} flex items-center justify-center`}>
                                            {isLoadingMore && (
                                                <div className="flex items-center gap-3 py-4">
                                                    <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                                    <span className="text-[13px] font-bold text-slate-500">Đang tải thêm bệnh nhân...</span>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Summary Footer */}
                            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 shrink-0 flex items-center justify-center">
                                <p className="text-[14px] font-medium text-slate-600">
                                    Tổng cộng: {allFiltered.length} bệnh nhân
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <Toast show={showToast} title={toastMsg} onClose={() => setShowToast(false)} />
                {selectedPatient && (
                    <EditPatientModal
                        isOpen={!!selectedPatient}
                        onClose={() => setSelectedPatient(null)}
                        isSaving={isSavingPatient}
                        onSave={handleSavePatient}
                        patientData={selectedPatient}
                        availableDoctors={doctors}
                    />
                )}
            </div>
        </div>,
        document.body
    );
}
