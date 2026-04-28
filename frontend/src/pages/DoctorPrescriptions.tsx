import { useState, useEffect } from 'react';
import PrescriptionModal from '../features/prescription/components/PrescriptionModal';
import Toast from '../components/ui/Toast';
import { doctorApi } from '../api/doctor';
import DoctorSidebar from '../components/common/DoctorSidebar';
import TopBar from '../components/common/TopBar';

export default function DoctorPrescriptions() {
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [myPatients, setMyPatients] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pRes, sRes, patRes] = await Promise.all([
                doctorApi.getPrescriptions(),
                doctorApi.getPrescriptionStats(),
                doctorApi.getMyPatients({ size: 100 })
            ]);
            if (pRes.success) setPrescriptions(pRes.data.content || []);
            if (sRes.success) setStats(sRes.data);
            if (patRes.success) setMyPatients(patRes.data.content || []);
        } catch (error) {
            console.error('Failed to fetch prescriptions', error);
        } finally {
            setLoading(false);
        }
    };
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('Tất cả trạng thái');
    const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
    const [isAddingNewMedicine, setIsAddingNewMedicine] = useState(false);
    const [medications, setMedications] = useState<any[]>([]);
    const [isSavingPrescription, setIsSavingPrescription] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [newMedForm, setNewMedForm] = useState({
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        intakeType: '',
    });
    const [formErrors, setFormErrors] = useState({
        name: false,
        dosage: false,
        frequency: false,
        duration: false,
        intakeType: false,
    });

    const addMedicationToPrescription = () => {
        const errors = {
            name: !newMedForm.name,
            dosage: !newMedForm.dosage,
            frequency: !newMedForm.frequency,
            duration: !newMedForm.duration,
            intakeType: !newMedForm.intakeType,
        };
        setFormErrors(errors);

        if (Object.values(errors).some(v => v)) return;

        setMedications([...medications, { ...newMedForm, id: Date.now() }]);
        setNewMedForm({
            name: '',
            dosage: '',
            frequency: '',
            duration: '',
            intakeType: '',
        });
        setIsAddingNewMedicine(false);
    };

    const removeMedication = (id: number) => {
        setMedications(medications.filter(m => m.id !== id));
    };

    const handleSavePrescription = async (prescriptionData: any) => {
        setIsSavingPrescription(true);
        try {
            const res = await doctorApi.createPrescription(prescriptionData);
            if (res.success) {
                setIsPrescriptionModalOpen(false);
                setMedications([]);
                setShowSuccessToast(true);
                fetchData(); // Refresh list
            }
        } catch (error) {
            console.error('Failed to save prescription', error);
        } finally {
            setIsSavingPrescription(false);
        }
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-[22px] font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Đơn thuốc điện tử</h2>
                        <p className="text-slate-500 mt-1">Quản lý và theo dõi phác đồ điều trị của bệnh nhân trực tiếp qua hệ thống</p>
                    </div>
                    <button
                        onClick={() => setIsPrescriptionModalOpen(true)}
                        className="bg-primary text-slate-900 font-bold px-6 py-3.5 rounded-2xl text-[15px] flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                        Kê đơn thuốc mới
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Tổng đơn thuốc</p>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats?.totalPrescriptions || 0}</h3>
                            </div>
                            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-2xl">description</span>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-primary text-[14px] font-bold">
                            <span className="material-symbols-outlined text-sm">trending_up</span>
                            +12% tháng này
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-primary relative overflow-hidden group transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Đang hiệu lực</p>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats?.activePrescriptions || 0}</h3>
                            </div>
                            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-2xl">medication</span>
                            </div>
                        </div>
                        <p className="mt-4 text-[14px] text-slate-500 font-medium">Đang được bệnh nhân sử dụng</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Chờ tái cấp</p>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats?.pendingRenewals || 0}</h3>
                            </div>
                            <div className="size-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-400">
                                <span className="material-symbols-outlined text-2xl">update</span>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-orange-500 text-[14px] font-bold">
                            <span className="material-symbols-outlined text-sm">priority_high</span>
                            Cần phê duyệt ngay
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Hoàn thành</p>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats?.completedPrescriptions || 0}</h3>
                            </div>
                            <div className="size-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-400">
                                <span className="material-symbols-outlined text-2xl">task_alt</span>
                            </div>
                        </div>
                        <p className="mt-4 text-[14px] text-blue-500 font-bold tracking-wide">Hoàn thành: {stats?.completedPrescriptions || 0}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Table Section */}
                    <div className="xl:col-span-8 space-y-6">
                        <div className="bg-slate-50 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center border border-slate-100">
                            <div className="relative w-full md:w-auto md:flex-1">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                                <input
                                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-transparent focus:border-primary/20 rounded-2xl focus:shadow-lg focus:shadow-primary/5 outline-none text-[15px] font-medium transition-all"
                                    placeholder="Tìm bệnh nhân hoặc mã đơn..."
                                    type="text"
                                />
                            </div>
                            <div className="flex gap-2.5 w-full md:w-auto">
                                {/* Custom Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                        className="bg-white border-2 border-transparent hover:border-primary/20 rounded-2xl text-[14px] font-bold py-3 px-5 flex items-center gap-3 transition-all active:scale-95 whitespace-nowrap shadow-sm"
                                    >
                                        <span className="text-slate-700">{selectedStatus}</span>
                                        <span className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${isStatusDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                                    </button>

                                    {isStatusDropdownOpen && (
                                        <div className="absolute top-full left-0 mt-2 w-full min-w-[200px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                                            {['Tất cả trạng thái', 'Đang hiệu lực', 'Hết hạn', 'Đã hủy'].map((status) => (
                                                <button
                                                    key={status}
                                                    onClick={() => {
                                                        setSelectedStatus(status);
                                                        setIsStatusDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2.5 rounded-xl text-[14px] font-medium transition-colors ${selectedStatus === status ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button className="bg-white p-3 rounded-2xl text-slate-500 hover:text-primary transition-all border-2 border-transparent hover:border-primary/20 active:scale-95 shadow-sm">
                                    <span className="material-symbols-outlined text-[22px]">calendar_month</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-6 py-4 text-[13px] font-medium uppercase tracking-wider text-slate-400">Mã đơn</th>
                                            <th className="px-6 py-4 text-[13px] font-medium uppercase tracking-wider text-slate-400">Bệnh nhân</th>
                                            <th className="px-6 py-4 text-[13px] font-medium uppercase tracking-wider text-slate-400">Chẩn đoán</th>
                                            <th className="px-6 py-4 text-[13px] font-medium uppercase tracking-wider text-slate-400 text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-10 text-center text-slate-500">Đang tải đơn thuốc...</td>
                                            </tr>
                                        ) : prescriptions.length > 0 ? (
                                            prescriptions.map((row, i) => (
                                                <tr key={i} className="transition-colors group border-b border-slate-50/50 last:border-0">
                                                    <td className="px-6 py-5 text-[15px] font-medium text-slate-500">{row.prescriptionCode || `#RX-${row.id}`}</td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary`}>
                                                                {row.patientName?.charAt(0)}
                                                            </div>
                                                            <span className="text-[15px] font-bold text-slate-900 dark:text-white">{row.patientName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-[15px] text-slate-600 dark:text-slate-400 font-medium max-w-[250px] truncate">{row.diagnosis}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-colors">
                                                                <span className="material-symbols-outlined text-lg">visibility</span>
                                                            </button>
                                                            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-colors">
                                                                <span className="material-symbols-outlined text-lg">print</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-10 text-center text-slate-500 italic">Chưa có đơn thuốc nào</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-6 flex items-center justify-between border-t border-slate-50 bg-slate-50/30">
                                <p className="text-[13px] font-medium text-slate-400">Hiển thị 10/1,284 kết quả</p>
                                <div className="flex gap-2.5">
                                    <button className="p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm disabled:opacity-50 hover:bg-slate-50 transition-colors">
                                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                    </button>
                                    <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-slate-900 text-[14px] font-bold shadow-md shadow-primary/20">1</button>
                                    <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">2</button>
                                    <button className="p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors">
                                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="xl:col-span-4 space-y-8">
                        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-[15px] font-bold uppercase tracking-tight text-slate-900 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>pill</span>
                                    THUỐC HAY DÙNG
                                </h4>
                                <a className="text-[13px] font-medium text-primary hover:underline" href="#">Tất cả</a>
                            </div>
                            <div className="space-y-4">
                                {(stats?.favoriteMeds || []).length > 0 ? (
                                    (stats?.favoriteMeds || []).map((med: any, i: number) => (
                                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group border border-transparent hover:border-slate-100">
                                            <div className={`w-10 h-10 rounded-xl bg-${med.color === 'primary' ? 'primary' : med.color || 'primary'}-50 flex items-center justify-center text-${med.color === 'primary' ? 'primary' : med.color || 'primary'}-500`}>
                                                <span className="material-symbols-outlined">{med.desc?.includes('Kháng sinh') ? 'vaccines' : 'medication'}</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[15px] font-bold text-slate-800 dark:text-white leading-tight">{med.name}</p>
                                                <p className="text-[13px] text-slate-500 font-medium mt-0.5">{med.desc}</p>
                                            </div>
                                            <button className="text-slate-200 group-hover:text-primary transition-colors">
                                                <span className="material-symbols-outlined text-lg">add_circle</span>
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center p-4 text-slate-400 text-sm italic">
                                        Chưa có dữ liệu thuốc thường dùng
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-blue-400">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-[17px] font-medium uppercase tracking-tight text-slate-900 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-500 text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
                                    MẪU ĐƠN GẦN ĐÂY
                                </h4>
                            </div>
                            <div className="space-y-3">
                                <div className="p-5 rounded-2xl bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all cursor-pointer border-dashed border border-slate-200 group">
                                    <div className="flex justify-between items-start mb-1.5">
                                        <span className="text-[15px] font-bold text-slate-900 leading-tight">Điều trị Viêm xoang</span>
                                        <span className="text-[11px] bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-bold uppercase tracking-widest shadow-sm">Linh động</span>
                                    </div>
                                    <p className="text-[13px] text-slate-500 font-medium line-clamp-2 leading-relaxed">Amoxicillin, Loratadine, Nước muối sinh lý, Xịt mũi Corticoid...</p>
                                </div>
                                <button className="w-full py-3.5 border-2 border-dashed border-slate-200 rounded-2xl text-[14px] font-bold text-slate-500 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all mt-6 flex items-center justify-center gap-2.5 active:scale-[0.98]">
                                    <span className="material-symbols-outlined text-[20px] font-bold">save</span>
                                    Lưu đơn hiện tại làm mẫu
                                </button>
                            </div>
                        </section>

                        <div className="bg-gradient-to-br from-primary to-emerald-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-primary/20">
                            <div className="relative z-10">
                                <h5 className="font-extrabold text-lg mb-2 leading-tight">Quy định Kê đơn mới nhất</h5>
                                <p className="text-xs opacity-90 leading-relaxed mb-4 font-medium">Đảm bảo tuân thủ thông tư 27/2021/TT-BYT về đơn thuốc điện tử an toàn.</p>
                                <button className="bg-white text-primary px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-md hover:bg-emerald-50 transition-colors">
                                    Xem hướng dẫn
                                </button>
                            </div>
                            <div className="absolute -right-6 -bottom-6 opacity-20">
                                <span className="material-symbols-outlined text-[120px] rotate-12">verified_user</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Prescription Modal */}
            <PrescriptionModal
                isOpen={isPrescriptionModalOpen}
                onClose={() => setIsPrescriptionModalOpen(false)}
                isAddingNewMedicine={isAddingNewMedicine}
                setIsAddingNewMedicine={setIsAddingNewMedicine}
                medications={medications}
                removeMedication={removeMedication}
                newMedForm={newMedForm}
                setNewMedForm={setNewMedForm}
                formErrors={formErrors}
                setFormErrors={setFormErrors}
                addMedicationToPrescription={addMedicationToPrescription}
                isSaving={isSavingPrescription}
                onSave={handleSavePrescription}
                patients={myPatients}
            />
            {/* Success Toast Notification */}
            <Toast
                show={showSuccessToast}
                title="Kê đơn thành công"
                onClose={() => setShowSuccessToast(false)}
                type="success"
            />
            </main>
        </div>
    );
}
