import { useEffect, useState } from 'react';
import Dropdown from '../../../components/ui/Dropdown';
import { uploadToCloudinary } from '../../../utils/cloudinary';

interface EditPatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    isSaving: boolean;
    onSave: (patientData: any) => Promise<void>;
    patientData: any;
    availableDoctors: any[];
}

export default function EditPatientModal({
    isOpen,
    onClose,
    isSaving,
    onSave,
    patientData,
    availableDoctors
}: EditPatientModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        gender: 'Nam',
        phone: '',
        email: '',
        address: '',
        condition: 'Tiểu đường Type 2',
        riskLevel: 'Theo dõi',
        assignedDoctor: '',
        notes: '',
        password: '',
        confirmPassword: '',
        identityCard: '',
        occupation: '',
        ethnicity: '',
        insuranceNumber: '',
        avatarUrl: '',
        status: 'Hoạt động',
        treatmentStatus: 'Đang điều trị'
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [avatarError, setAvatarError] = useState(false);

    // Map available doctors for Dropdown
    const doctorOptions = availableDoctors.map(d => ({
        label: d.name,
        value: d.id.toString()
    }));

    useEffect(() => {
        if (isOpen && patientData) {
            // Find doctor ID by name if doctorId not present in patientData, 
            // or use patientData.doctorId if available (which it should be in the new version)
            const currentDoctorId = patientData.doctorId ? patientData.doctorId.toString() :
                (availableDoctors.find(d => d.name === patientData.doctor)?.id.toString() || (availableDoctors[0]?.id.toString() || ''));

            let rawRisk = patientData.riskLevel || 'Theo dõi';
            if (rawRisk === 'HIGH_RISK') rawRisk = 'Nguy cơ cao';
            else if (rawRisk === 'MONITORING') rawRisk = 'Theo dõi';
            else if (rawRisk === 'STABLE') rawRisk = 'Ổn định';
            
            const cleanRisk = rawRisk.replace(/\([^)]*\)/g, '').trim();

            setFormData({
                name: patientData.fullName || patientData.name || '',
                age: patientData.age || '',
                gender: patientData.gender || 'Nam',
                phone: patientData.phone || '',
                email: patientData.email || '',
                address: patientData.address || '',
                condition: patientData.chronicCondition || patientData.condition || 'Tiểu đường Type 2',
                riskLevel: cleanRisk,
                assignedDoctor: currentDoctorId,
                notes: patientData.clinicalNotes || patientData.notes || '',
                password: '',
                confirmPassword: '',
                identityCard: patientData.identityCard || '',
                occupation: patientData.occupation || '',
                ethnicity: patientData.ethnicity || '',
                insuranceNumber: patientData.healthInsuranceNumber || patientData.insuranceNumber || '',
                avatarUrl: patientData.avatarUrl || patientData.img || '',
                status: patientData.profileStatus || patientData.status || 'Hoạt động',
                treatmentStatus: patientData.treatmentStatus || 'Đang điều trị'
            });
            setAvatarError(false);
            setFormErrors({});
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, patientData, availableDoctors]);

    if (!isOpen || !patientData) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                setAvatarError(false);
                setIsUploadingImage(true);
                const imageUrl = await uploadToCloudinary(file);
                setFormData(prev => ({ ...prev, avatarUrl: imageUrl }));
            } catch (error) {
                console.error("Lỗi upload ảnh:", error);
                setAvatarError(true);
            } finally {
                setIsUploadingImage(false);
            }
        }
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!formData.name.trim()) errors.name = 'Vui lòng nhập họ và tên bệnh nhân';

        if (!formData.age.toString().trim()) {
            errors.age = 'Vui lòng nhập tuổi';
        } else if (isNaN(Number(formData.age)) || Number(formData.age) < 0 || Number(formData.age) > 150) {
            errors.age = 'Tuổi không hợp lệ (0-150)';
        }

        const phoneRegex = /^(0|\+84)(\d{9})$/;
        if (!formData.phone.trim()) {
            errors.phone = 'Vui lòng nhập số điện thoại';
        } else if (!phoneRegex.test(formData.phone.trim().replace(/\s/g, ''))) {
            errors.phone = 'Số điện thoại không hợp lệ (10 số)';
        }

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Email không hợp lệ';
        }

        if (formData.identityCard && !/^\d{12}$/.test(formData.identityCard.trim())) {
            errors.identityCard = 'Số CCCD phải bao gồm 12 chữ số';
        }

        if (formData.password && formData.password.length < 6) {
            errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }

        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
        }

        if (!formData.condition) errors.condition = 'Vui lòng chọn bệnh lý';
        if (!formData.assignedDoctor) errors.assignedDoctor = 'Vui lòng phân công bác sĩ';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            onSave({ ...patientData, ...formData });
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 font-display">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] transition-all duration-300"
                onClick={onClose}
            ></div>

            <div className="relative bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 border border-primary/10 transition-all max-h-[92vh]">
                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-20">
                    <div className="flex items-center gap-4 text-left">
                        <div>
                            <h2 className="text-[20px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Cập nhật hồ sơ bệnh nhân</h2>
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="px-6 md:px-8 pt-3 pb-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-900/50 text-left">
                    {/* Hidden inputs for autofill trap */}
                    <input autoComplete="new-password" type="text" style={{ display: 'none' }} />
                    <input autoComplete="new-password" type="password" style={{ display: 'none' }} />

                    {/* Unified Form Layout */}
                    <div className="space-y-6">
                        {/* 1. Administrative Information Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 pb-1 ml-1">
                                <div className="text-slate-400 dark:text-slate-500 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[24px]">account_circle</span>
                                </div>
                                <h3 className="font-bold text-slate-500 dark:text-slate-100 text-[15px] italic-none ml-1">Thông tin hành chính</h3>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-4 lg:p-5 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-3">
                                    {/* Avatar Upload */}
                                    <div className="md:col-span-2 lg:col-span-3 flex items-center gap-5 pb-2 mb-1 border-b border-slate-50 dark:border-slate-800/50">
                                        <div
                                            onClick={() => !isUploadingImage && document.getElementById('avatar-input-edit-patient')?.click()}
                                            className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer overflow-hidden group relative transition-all hover:border-primary shrink-0"
                                        >
                                            {isUploadingImage ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                                    <span className="text-[10px] font-bold text-primary">Đang tải...</span>
                                                </div>
                                            ) : formData.avatarUrl && !avatarError ? (
                                                <img
                                                    src={formData.avatarUrl}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                    onError={() => setAvatarError(true)}
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center text-slate-400 group-hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined text-[32px]">add_a_photo</span>
                                                    <span className="text-[10px] font-bold mt-1">Ảnh hồ sơ</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[14px] font-bold text-slate-700 dark:text-slate-200">Ảnh chân dung bệnh nhân</p>
                                            <p className="text-[12px] text-slate-500 font-medium pb-1">Định dạng JPG, PNG. Tối đa 5MB.</p>
                                            <button
                                                type="button"
                                                onClick={() => document.getElementById('avatar-input-edit-patient')?.click()}
                                                className="text-[13px] font-black text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                                                Chọn tệp tin
                                            </button>
                                            <input
                                                id="avatar-input-edit-patient"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleAvatarChange}
                                            />
                                        </div>
                                    </div>
                                    {/* Line 1 */}
                                    <div className="space-y-1.5 flex-1">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Họ và tên bệnh nhân <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">person</span>
                                            <input
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                autoComplete="new-password"
                                                className={`w-full pl-11 pr-4 h-[42px] rounded-lg border ${formErrors.name ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                                            />
                                        </div>
                                        {formErrors.name && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.name}</p>}
                                    </div>
                                    <div className="space-y-1.5 flex-1">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Tuổi <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">calendar_today</span>
                                            <input
                                                name="age"
                                                value={formData.age}
                                                onChange={handleChange}
                                                autoComplete="new-password"
                                                className={`w-full pl-11 pr-4 h-[42px] rounded-lg border ${formErrors.age ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                                            />
                                        </div>
                                        {formErrors.age && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.age}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Giới tính</label>
                                        <Dropdown
                                            options={['Nam', 'Nữ', 'Khác']}
                                            value={formData.gender}
                                            onChange={(gender: string) => setFormData(prev => ({ ...prev, gender }))}
                                        />
                                    </div>

                                    {/* Line 2 */}
                                    <div className="space-y-1.5 flex-1">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Số điện thoại <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">call</span>
                                            <input
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                autoComplete="new-password"
                                                className={`w-full pl-11 pr-4 h-[42px] rounded-lg border ${formErrors.phone ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Email hồ sơ</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">mail</span>
                                            <input
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                autoComplete="new-password"
                                                className={`w-full pl-11 pr-4 h-[42px] rounded-lg border ${formErrors.email ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                                            />
                                        </div>
                                        {formErrors.email && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.email}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Số CCCD</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">badge</span>
                                            <input
                                                name="identityCard"
                                                value={formData.identityCard}
                                                onChange={handleChange}
                                                placeholder="12 chữ số"
                                                className={`w-full pl-11 pr-4 h-[42px] rounded-lg border ${formErrors.identityCard ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                                            />
                                        </div>
                                        {formErrors.identityCard && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.identityCard}</p>}
                                    </div>

                                    {/* Line 3: Address takes more space */}
                                    <div className="lg:col-span-2 space-y-1.5">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Địa chỉ thường trú</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">location_on</span>
                                            <input
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                className="w-full pl-11 pr-4 h-[42px] rounded-lg border border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Dân tộc</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">public</span>
                                            <input
                                                name="ethnicity"
                                                value={formData.ethnicity}
                                                onChange={handleChange}
                                                className="w-full pl-11 pr-4 h-[42px] rounded-lg border border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Line 4 */}
                                    <div className="space-y-1.5">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Nghề nghiệp</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">work</span>
                                            <input
                                                name="occupation"
                                                value={formData.occupation}
                                                onChange={handleChange}
                                                className="w-full pl-11 pr-4 h-[42px] rounded-lg border border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Số thẻ BHYT</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">health_and_safety</span>
                                            <input
                                                name="insuranceNumber"
                                                value={formData.insuranceNumber}
                                                onChange={handleChange}
                                                className="w-full pl-11 pr-4 h-[42px] rounded-lg border border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Trạng thái hồ sơ</label>
                                        <Dropdown
                                            options={['Hoạt động', 'Ngưng hoạt động']}
                                            value={formData.status}
                                            onChange={(status: string) => setFormData(prev => ({ ...prev, status }))}
                                        />
                                    </div>
                                </div>

                                {/* Security/Password */}
                                <div className="mt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[14px] font-medium text-slate-500 ml-1">Mật khẩu mới</label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[19px] text-slate-400">lock</span>
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    placeholder="Để trống nếu không muốn thay đổi"
                                                    className="w-full pl-11 pr-12 h-[42px] rounded-lg border border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors flex items-center justify-center p-1"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">
                                                        {showPassword ? 'visibility' : 'visibility_off'}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[14px] font-medium text-slate-500 ml-1">Xác nhận mật khẩu</label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[19px] text-slate-400">lock</span>
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    name="confirmPassword"
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                    placeholder="Để trống nếu không muốn thay đổi"
                                                    className={`w-full pl-11 pr-12 h-[42px] rounded-xl border ${formErrors.confirmPassword ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors flex items-center justify-center p-1"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">
                                                        {showConfirmPassword ? 'visibility' : 'visibility_off'}
                                                    </span>
                                                </button>
                                            </div>
                                            {formErrors.confirmPassword && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.confirmPassword}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Medical Information Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 pb-1 ml-1">
                                <div className="text-slate-400 dark:text-slate-500 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[24px]">clinical_notes</span>
                                </div>
                                <h3 className="font-bold text-slate-500 dark:text-slate-100 text-[15px] italic-none ml-1">Hồ sơ bệnh lý & Phân công</h3>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-4 lg:p-5 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-medium text-slate-500 ml-1">Nhóm bệnh chính</label>
                                    <Dropdown
                                        options={['Tiểu đường Type 1', 'Tiểu đường Type 2', 'Cao huyết áp', 'Bệnh tim mạch', 'Suy thận', 'Hen suyễn', 'Khác']}
                                        value={formData.condition}
                                        onChange={(condition: string) => setFormData(prev => ({ ...prev, condition }))}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-medium text-slate-500 ml-1">Bác sĩ điều trị</label>
                                    <Dropdown
                                        options={doctorOptions}
                                        value={formData.assignedDoctor}
                                        onChange={(assignedDoctor: string) => setFormData(prev => ({ ...prev, assignedDoctor }))}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-medium text-slate-500 ml-1">Mức độ rủi ro</label>
                                    <Dropdown
                                        options={['Ổn định', 'Theo dõi', 'Nguy cơ cao']}
                                        value={formData.riskLevel}
                                        onChange={(riskLevel: string) => setFormData(prev => ({ ...prev, riskLevel }))}
                                    />
                                </div>

                                {/* Treatment Status */}
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-medium text-slate-500 ml-1">Tình trạng điều trị</label>
                                    <Dropdown
                                        options={['Đang điều trị', 'Theo dõi', 'Tái khám', 'Chờ xét nghiệm', 'Ổn định', 'Cần can thiệp', 'Tạm ngưng']}
                                        value={formData.treatmentStatus}
                                        onChange={(treatmentStatus: string) => setFormData(prev => ({ ...prev, treatmentStatus }))}
                                    />
                                </div>
                                <div className="lg:col-span-3 space-y-1.5">
                                    <label className="text-[14px] font-medium text-slate-500 ml-1">Ghi chú lâm sàng</label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium outline-none text-slate-700 focus:border-primary resize-none custom-scrollbar"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 md:px-8 py-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end sticky bottom-0 z-20">
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-[14px] font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                            type="button"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="px-8 py-2.5 text-[14px] font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-xl shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                            type="button"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined font-bold text-[20px]">save</span>
                                    Cập nhật hồ sơ
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
