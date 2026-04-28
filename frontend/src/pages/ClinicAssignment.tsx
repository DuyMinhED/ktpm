import { useState, useEffect } from 'react';
import { clinicApi } from '../api/clinic';
import Toast from '../components/ui/Toast';
import Dropdown from '../components/ui/Dropdown';
import ClinicSidebar from '../components/common/ClinicSidebar';
import TopBar from '../components/common/TopBar';

export default function ClinicAssignment() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const currentClinicId = localStorage.getItem('clinicId') || '1';    // Data States
    const [unassignedPatients, setUnassignedPatients] = useState<any[]>([]);
    const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Form States
    const [formData, setFormData] = useState({
        patientName: '',
        contactNumber: '',
        emailAddress: '',
        address: '',
        assignmentDate: new Date().toISOString().split('T')[0],
        assignmentTime: '',
        procedure: '',
        doctorId: '',
        assignmentType: 'IN_PERSON',
        meetingLink: '',
        riskLevel: 'Ổn định',
        notes: ''
    });

    // Toast State
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');

    useEffect(() => {
        fetchInitialData();
    }, [currentClinicId]);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const [patientsRes, doctorsRes] = await Promise.all([
                clinicApi.getPatients(currentClinicId, { size: 100 }),
                clinicApi.getAvailableDoctors(currentClinicId)
            ]);

            if (patientsRes.success) {
                setUnassignedPatients(patientsRes.data.content || []);
            }
            if (doctorsRes.success) {
                setAvailableDoctors(doctorsRes.data);
            }
        } catch (error) {
            console.error('Failed to fetch assignment data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectPatient = (patient: any) => {
        setSelectedPatient(patient);
        setFormData({
            ...formData,
            patientName: patient.name || '',
            contactNumber: patient.phone || '',
            emailAddress: patient.email || '',
            address: patient.address || '',
            doctorId: patient.doctorId || ''
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient) {
            setToastMessage('Vui lòng chọn một bệnh nhân từ danh sách bên trái!');
            setToastType('warning');
            setShowToast(true);
            return;
        }

        if (!formData.doctorId || !formData.procedure) {
            setToastMessage('Vui lòng chọn đầy đủ Bác sĩ và Chương trình điều trị');
            setToastType('warning');
            setShowToast(true);
            return;
        }

        setIsSubmitting(true);
        try {
            const selectedProcedureLabel = procedureOptions.find(opt => opt.value === formData.procedure)?.label || formData.procedure;

            const res = await clinicApi.updatePatient(currentClinicId, selectedPatient.dbId || selectedPatient.id, {
                ...selectedPatient,
                doctorId: formData.doctorId,
                condition: selectedProcedureLabel,
                assignmentDate: formData.assignmentDate,
                assignmentTime: formData.assignmentTime,
                appointmentType: formData.assignmentType,
                meetingLink: formData.meetingLink,
                riskLevel: formData.riskLevel,
                notes: formData.notes
            });

            if (res.success) {
                setToastMessage(`Đã gán bệnh nhân ${formData.patientName} cho bác sĩ thành công!`);
                setToastType('success');
                setShowToast(true);
                fetchInitialData();
                setSelectedPatient(null);
                setFormData({
                    patientName: '',
                    contactNumber: '',
                    emailAddress: '',
                    address: '',
                    assignmentDate: new Date().toISOString().split('T')[0],
                    assignmentTime: '',
                    procedure: '',
                    doctorId: '',
                    assignmentType: 'IN_PERSON',
                    meetingLink: '',
                    riskLevel: 'Ổn định',
                    notes: ''
                });
            }
        } catch (error) {
            console.error('Submit failed:', error);
            setToastMessage('Lỗi khi thực hiện gán bệnh nhân');
            setToastType('error');
            setShowToast(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredPatients = unassignedPatients.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone?.includes(searchTerm)
    );

    // Options for Custom Dropdowns
    const procedureOptions = [
        { label: 'Chọn chương trình', value: '' },
        { label: 'Điều trị Tiểu đường Type 1', value: 'T1' },
        { label: 'Điều trị Tiểu đường Type 2', value: 'T2' },
        { label: 'Quản lý Huyết áp Cao', value: 'HA' },
        { label: 'Theo dõi Tim mạch', value: 'TM' }
    ];

    const doctorOptions = [
        { label: 'Chọn Bác sĩ phụ trách', value: '' },
        ...availableDoctors.map(dr => ({
            label: `${dr.name} - ${dr.specialty}`,
            value: dr.id.toString()
        }))
    ];

    // Generate time slots (07:00 to 20:00, every 30 mins)
    const riskOptions = [
        { label: 'Ổn định', value: 'Ổn định' },
        { label: 'Trung bình', value: 'Trung bình' },
        { label: 'Nguy cơ cao', value: 'Nguy cơ cao' }
    ];

    const timeOptions = [
        { label: 'Chọn giờ khám', value: '' },
        ...Array.from({ length: 27 }).map((_, i) => {
            const hours = Math.floor(i / 2) + 7;
            const minutes = i % 2 === 0 ? '00' : '30';
            const time = `${hours.toString().padStart(2, '0')}:${minutes}`;
            return { label: time, value: time };
        })
    ];

    return (
        <div className="flex h-screen font-display bg-[#f6f8f7] dark:bg-slate-950 text-slate-900 dark:text-slate-100 italic-none overflow-hidden">
            <ClinicSidebar isSidebarOpen={isSidebarOpen} />

            <main className="flex-1 lg:ml-72 h-screen flex flex-col transition-all duration-300 overflow-hidden">
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[140] lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    ></div>
                )}
                
                <TopBar setIsSidebarOpen={setIsSidebarOpen} notifications={notifications} setNotifications={setNotifications} />

                <div className="p-4 md:p-8 flex-1 overflow-hidden flex flex-col space-y-4 md:space-y-6">

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-start flex-1 overflow-hidden">
                        {/* Selector Column */}
                        <div className="lg:col-span-4 h-full flex flex-col overflow-hidden">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4 md:space-y-6 h-full flex flex-col">
                                <div className="space-y-4 flex-shrink-0">
                                    <h4 className="text-[15px] md:text-[17px] font-bold text-slate-700">Danh sách chờ điều phối</h4>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                                        <input
                                            type="text"
                                            placeholder="Tìm tên bệnh nhân..."
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-400 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                                    {isLoading ? (
                                        [...Array(5)].map((_, i) => (
                                            <div key={i} className="h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                                        ))
                                    ) : filteredPatients.length > 0 ? (
                                        filteredPatients.map((p) => (
                                            <button
                                                key={p.dbId || p.id}
                                                onClick={() => handleSelectPatient(p)}
                                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${selectedPatient?.dbId === p.dbId ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                            >
                                                <img src={p.img || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}`} className="w-10 h-10 rounded-lg object-cover border border-white/20" alt="" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[15px] font-bold truncate">{p.name}</p>
                                                    <p className={`text-[13px] font-medium truncate ${selectedPatient?.dbId === p.dbId ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>{p.condition || 'Chưa cập nhật'}</p>
                                                </div>
                                                {selectedPatient?.dbId === p.dbId && <span className="material-symbols-outlined text-[18px]">check_circle</span>}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 text-slate-400 italic text-sm">Không tìm thấy bệnh nhân</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Form Column */}
                        <div className="lg:col-span-8 h-full overflow-hidden">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-12 shadow-xl shadow-slate-200/20 dark:shadow-none border border-slate-200 dark:border-slate-800 relative overflow-hidden h-full flex flex-col md:flex-row gap-6 md:gap-12">
                                <form onSubmit={handleSubmit} className="flex-1 space-y-4 relative z-10 overflow-y-auto custom-scrollbar pr-4 pb-1">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="col-span-2 space-y-1.5">
                                            <label className="text-[14px] font-medium text-slate-500 ml-1">Họ và tên Bệnh nhân</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="relative">
                                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">person</span>
                                                    <input
                                                        type="text"
                                                        placeholder="Họ"
                                                        className="w-full pl-11 pr-4 h-[42px] rounded-lg border border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                                                        value={formData.patientName.split(' ')[0] || ''}
                                                        readOnly={!!selectedPatient}
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        placeholder="Tên"
                                                        className="w-full px-4 h-[42px] rounded-lg border border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                                                        value={formData.patientName.split(' ').slice(1).join(' ') || ''}
                                                        readOnly={!!selectedPatient}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 flex-1">
                                            <label className="text-[14px] font-medium text-slate-500 ml-1">Số điện thoại liên hệ</label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">call</span>
                                                <input
                                                    type="text"
                                                    placeholder="Số điện thoại bệnh nhân hoặc người thân"
                                                    className="w-full pl-11 pr-4 h-[42px] rounded-lg border border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                                                    value={formData.contactNumber}
                                                    readOnly={!!selectedPatient}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 flex-1">
                                            <label className="text-[14px] font-medium text-slate-500 ml-1">Địa chỉ Email</label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">mail</span>
                                                <input
                                                    type="email"
                                                    placeholder="Nhập địa chỉ email"
                                                    className="w-full pl-11 pr-4 h-[42px] rounded-lg border border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                                                    value={formData.emailAddress}
                                                    readOnly={!!selectedPatient}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 flex-1">
                                            <label className="text-[14px] font-medium text-slate-500 ml-1">Địa chỉ cư trú</label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">location_on</span>
                                                <input
                                                    type="text"
                                                    placeholder="Nhập địa chỉ chi tiết"
                                                    className="w-full pl-11 pr-4 h-[42px] rounded-lg border border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                                                    value={formData.address}
                                                    readOnly={!!selectedPatient}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 flex-1">
                                            <label className="text-[14px] font-medium text-slate-500 ml-1">Mức độ Nguy cơ</label>
                                            <Dropdown
                                                options={riskOptions}
                                                value={formData.riskLevel}
                                                onChange={(value: string) => setFormData({ ...formData, riskLevel: value })}
                                                icon={<span className="material-symbols-outlined text-[20px] text-slate-400">warning</span>}
                                            />
                                        </div>

                                        <div className="space-y-1.5 flex-1">
                                            <label className="text-[14px] font-medium text-slate-500 ml-1">Ngày gán chỉ định</label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 z-10">calendar_today</span>
                                                <input
                                                    type="date"
                                                    className="w-full pl-11 pr-4 h-[42px] rounded-lg border border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all relative"
                                                    value={formData.assignmentDate}
                                                    onChange={(e) => setFormData({ ...formData, assignmentDate: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 flex-1">
                                            <label className="text-[14px] font-medium text-slate-500 ml-1">Giờ bắt đầu</label>
                                            <Dropdown
                                                options={timeOptions}
                                                value={formData.assignmentTime}
                                                onChange={(value: string) => setFormData({ ...formData, assignmentTime: value })}
                                                icon={<span className="material-symbols-outlined text-[20px] text-slate-400">schedule</span>}
                                            />
                                        </div>

                                        <div className="space-y-1.5 flex-1">
                                            <label className="text-[14px] font-medium text-slate-500 ml-1">Chương trình Quản lý</label>
                                            <Dropdown
                                                options={procedureOptions}
                                                value={formData.procedure}
                                                onChange={(value: string) => setFormData({ ...formData, procedure: value })}
                                                icon={<span className="material-symbols-outlined text-[20px] text-slate-400">clinical_notes</span>}
                                            />
                                        </div>
                                        <div className="space-y-1.5 flex-1">
                                            <label className="text-[14px] font-medium text-slate-500 ml-1">Bác sĩ Phân công</label>
                                            <Dropdown
                                                options={doctorOptions}
                                                value={formData.doctorId}
                                                onChange={(value: string) => setFormData({ ...formData, doctorId: value })}
                                                icon={<span className="material-symbols-outlined text-[20px] text-slate-400">medical_services</span>}
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-1.5">
                                            <label className="text-[14px] font-medium text-slate-500 ml-1">Hình thức khám</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, assignmentType: 'IN_PERSON', meetingLink: '' })}
                                                    className={`flex items-center justify-center gap-3 p-3 rounded-lg border transition-all ${formData.assignmentType === 'IN_PERSON' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-400 dark:border-slate-700 text-slate-500 hover:border-slate-500'}`}
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">person_pin_circle</span>
                                                    <span className="text-sm font-bold">Trực tiếp</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, assignmentType: 'ONLINE' })}
                                                    className={`flex items-center justify-center gap-3 p-3 rounded-lg border transition-all ${formData.assignmentType === 'ONLINE' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-400 dark:border-slate-700 text-slate-500 hover:border-slate-500'}`}
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">videocam</span>
                                                    <span className="text-sm font-bold">Trực tuyến</span>
                                                </button>
                                            </div>
                                        </div>

                                        {formData.assignmentType === 'ONLINE' && (
                                            <div className="col-span-2 space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                                                <label className="text-[14px] font-medium text-slate-500 ml-1">Link Google Meet / Hội chẩn trực tuyến</label>
                                                <div className="relative">
                                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">link</span>
                                                    <input
                                                        type="text"
                                                        placeholder="https://meet.google.com/xxx-xxxx-xxx"
                                                        className="w-full pl-11 pr-4 h-[42px] rounded-lg border border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                                                        value={formData.meetingLink}
                                                        onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        )}



                                        <div className="col-span-2 space-y-1.5 pt-1">
                                            <label className="text-[14px] font-medium text-slate-500 ml-1">Ghi chú chỉ định</label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-4 top-3 text-[20px] text-slate-400">description</span>
                                                <textarea
                                                    placeholder="Nhập ghi chú, triệu chứng hoặc hướng dẫn thêm cho bác sĩ..."
                                                    className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all min-h-[80px] resize-none"
                                                    value={formData.notes}
                                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            title={!selectedPatient ? "Vui lòng chọn bệnh nhân từ danh sách bên trái trước khi thực hiện gán chỉ định" : ""}
                                            className={`w-full md:w-auto px-6 py-2.5 bg-slate-900 dark:bg-primary text-white rounded-lg font-bold text-sm shadow-xl shadow-slate-200 dark:shadow-primary/20 hover:bg-slate-800 dark:hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group ${(!selectedPatient || isSubmitting) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            {isSubmitting ? (
                                                <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined text-[22px] group-hover:rotate-12 transition-transform">assignment_turned_in</span>
                                                    <span>Xác nhận gán chỉ định</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                <Toast
                    show={showToast}
                    title={toastMessage}
                    type={toastType}
                    onClose={() => setShowToast(false)}
                />

                <style>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; }
                    input[type="date"]::-webkit-calendar-picker-indicator {
                        opacity: 0;
                        position: absolute;
                        right: 15px;
                        width: 25px;
                        cursor: pointer;
                        z-index: 20;
                    }
                `}</style>
            </main>
        </div>
    );
}
