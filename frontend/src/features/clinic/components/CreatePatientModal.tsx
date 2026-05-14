import React, { useEffect, useState } from 'react';
import Dropdown from '../../../components/ui/Dropdown';
import { uploadToCloudinary } from '../../../utils/cloudinary';

interface CreatePatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    isSaving: boolean;
    onSave: (patientData: any) => Promise<void>;
    availableDoctors: any[];
    availableConditions: string[];
}

export default function CreatePatientModal({
    isOpen,
    onClose,
    isSaving,
    onSave,
    availableDoctors,
    availableConditions
}: CreatePatientModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        gender: 'Nam',
        phone: '',
        email: '',
        address: '',
        condition: '', // Primary Condition
        riskLevel: 'Theo dõi',
        assignedDoctor: '',
        notes: '',
        password: '',
        confirmPassword: '',
        identityCard: '',
        occupation: '',
        insuranceNumber: '',
        ethnicity: '',
        avatarUrl: '',
        status: 'Hoạt động',
        treatmentStatus: 'Đang điều trị',
        initialGlucose: '',
        initialBpSystolic: '',
        initialBpDiastolic: ''
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

    // Auto-update default values when lists are loaded
    useEffect(() => {
        if (isOpen) {
            if (!formData.assignedDoctor && availableDoctors.length > 0) {
                setFormData(prev => ({ ...prev, assignedDoctor: availableDoctors[0].id.toString() }));
            }
            if (!formData.condition && availableConditions.length > 0) {
                setFormData(prev => ({ ...prev, condition: availableConditions[0] }));
            }
        }
    }, [isOpen, availableDoctors, availableConditions]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setFormErrors({});
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'age') {
            if (value === '' || /^\d+$/.test(value)) {
                setFormData(prev => ({ ...prev, [name]: value }));
            }
            return;
        }

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

        if (!formData.email.trim()) {
            errors.email = 'Vui lòng nhập email đăng nhập';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Email không hợp lệ';
        }

        if (formData.identityCard && !/^\d{12}$/.test(formData.identityCard.trim())) {
            errors.identityCard = 'Số CCCD phải bao gồm 12 chữ số';
        }

        if (!formData.password) {
            errors.password = 'Vui lòng thiết lập mật khẩu';
        } else if (formData.password.length < 6) {
            errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }

        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
        }

        if (!formData.condition) errors.condition = 'Vui lòng chọn nhóm bệnh';
        if (!formData.assignedDoctor) errors.assignedDoctor = 'Vui lòng phân công bác sĩ';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            onSave(formData);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] transition-all duration-300" onClick={onClose}></div>

            <div className="relative bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 max-h-[95vh] border border-slate-200 dark:border-slate-800">
                {/* Modal Header */}
                <div className="px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20">
                    <h2 className="text-[20px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Thêm hồ sơ bệnh nhân mới</h2>
                </div>

                {/* Form Body */}
                <div className="px-6 md:px-8 pt-3 pb-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-900/50 text-left">
                    {/* Hidden inputs for autofill trap */}
                    <input autoComplete="new-password" type="text" style={{ display: 'none' }} />
                    <input autoComplete="new-password" type="password" style={{ display: 'none' }} />

                    <div className="space-y-6">
                        {/* Section 1: Administrative Information */}
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
                                            onClick={() => !isUploadingImage && document.getElementById('avatar-input-patient')?.click()}
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
                                                onClick={() => document.getElementById('avatar-input-patient')?.click()}
                                                className="text-[13px] font-black text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                                                Chọn tệp tin
                                            </button>
                                            <input
                                                id="avatar-input-patient"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleAvatarChange}
                                            />
                                        </div>
                                    </div>
                                    {/* Name */}
                                    <div className="space-y-1.5 flex-1">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Họ và tên bệnh nhân <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 z-10 pointer-events-none">person</span>
                                            <input
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="Tên bệnh nhân"
                                                className={`w-full pl-11 pr-4 h-[42px] rounded-lg border ${formErrors.name ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                                            />
                                        </div>
                                        {formErrors.name && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.name}</p>}
                                    </div>

                                    {/* Age */}
                                    <div className="space-y-1.5 flex-1">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Tuổi <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 z-10 pointer-events-none">calendar_today</span>
                                            <input
                                                name="age"
                                                value={formData.age}
                                                onChange={handleChange}
                                                placeholder="Nhập tuổi"
                                                className={`w-full pl-11 pr-4 h-[42px] rounded-xl border ${formErrors.age ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                                            />
                                        </div>
                                        {formErrors.age && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.age}</p>}
                                    </div>

                                    {/* Gender */}
                                    <div className="space-y-1.5 flex-1">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Giới tính</label>
                                        <Dropdown
                                            options={['Nam', 'Nữ', 'Khác']}
                                            value={formData.gender}
                                            onChange={(gender: string) => setFormData(prev => ({ ...prev, gender }))}
                                        />
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-1.5">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Số điện thoại bệnh nhân<span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 z-10 pointer-events-none">call</span>
                                            <input
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="hoặc người thân"
                                                className={`w-full pl-11 pr-4 h-[42px] rounded-xl border ${formErrors.phone ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                                            />
                                        </div>
                                        {formErrors.phone && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.phone}</p>}
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-1.5">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Email hồ sơ <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 z-10 pointer-events-none">mail</span>
                                            <input
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="Nhập email"
                                                className={`w-full pl-11 pr-4 h-[42px] rounded-xl border ${formErrors.email ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                                            />
                                        </div>
                                        {formErrors.email && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.email}</p>}
                                    </div>

                                    {/* CCCD */}
                                    <div className="space-y-1.5">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Số CCCD</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 z-10 pointer-events-none">badge</span>
                                            <input
                                                name="identityCard"
                                                value={formData.identityCard}
                                                onChange={handleChange}
                                                placeholder="12 chữ số"
                                                className={`w-full pl-11 pr-4 h-[42px] rounded-xl border ${formErrors.identityCard ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                                            />
                                        </div>
                                        {formErrors.identityCard && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.identityCard}</p>}
                                    </div>

                                    {/* Address */}
                                    <div className="lg:col-span-2 space-y-1.5">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Địa chỉ thường trú</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 z-10 pointer-events-none">location_on</span>
                                            <input
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                placeholder="Nhập địa chỉ thường trú"
                                                className="w-full pl-11 pr-4 h-[42px] rounded-lg border border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Ethnicity */}
                                    <div className="space-y-1.5">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Dân tộc</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 z-10 pointer-events-none">public</span>
                                            <input
                                                name="ethnicity"
                                                value={formData.ethnicity}
                                                onChange={handleChange}
                                                placeholder="Nhập dân tộc"
                                                className="w-full pl-11 pr-4 h-[42px] rounded-lg border border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Occupation */}
                                    <div className="space-y-1.5">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Nghề nghiệp</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 z-10 pointer-events-none">work</span>
                                            <input
                                                name="occupation"
                                                value={formData.occupation}
                                                onChange={handleChange}
                                                placeholder="Nhập nghề nghiệp"
                                                className="w-full pl-11 pr-4 h-[42px] rounded-lg border border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Insurance Number */}
                                    <div className="space-y-1.5">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Số thẻ BHYT</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 z-10 pointer-events-none">health_and_safety</span>
                                            <input
                                                name="insuranceNumber"
                                                value={formData.insuranceNumber}
                                                onChange={handleChange}
                                                placeholder="Mã thẻ BHYT"
                                                className="w-full pl-11 pr-4 h-[42px] rounded-lg border border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* STATUS FIELD RELOCATED HERE */}
                                    <div className="space-y-1.5">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Trạng thái hồ sơ</label>
                                        <Dropdown
                                            options={['Hoạt động', 'Ngưng hoạt động']}
                                            value={formData.status}
                                            onChange={(status: string) => setFormData(prev => ({ ...prev, status }))}
                                        />
                                    </div>

                                    {/* Security - Password Fields */}
                                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3 mt-1">
                                        <div className="space-y-1.5">
                                            <label className="text-[14px] font-medium text-slate-500 ml-1">Mật khẩu <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[19px] text-slate-400 z-10 pointer-events-none">lock</span>
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    placeholder="Nhập mật khẩu"
                                                    className={`w-full pl-11 pr-12 h-[42px] rounded-xl border ${formErrors.password ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors flex items-center justify-center p-1 z-10"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">
                                                        {showPassword ? 'visibility' : 'visibility_off'}
                                                    </span>
                                                </button>
                                            </div>
                                            {formErrors.password && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.password}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[14px] font-medium text-slate-500 ml-1">Xác nhận mật khẩu <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[19px] text-slate-400 z-10 pointer-events-none">lock</span>
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    name="confirmPassword"
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                    placeholder="Nhập lại mật khẩu"
                                                    className={`w-full pl-11 pr-12 h-[42px] rounded-xl border ${formErrors.confirmPassword ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors flex items-center justify-center p-1 z-10"
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

                        {/* Section 2: Medical Information */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 pb-1 ml-1">
                                <div className="text-slate-400 dark:text-slate-500 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[24px]">clinical_notes</span>
                                </div>
                                <h3 className="font-bold text-slate-500 dark:text-slate-100 text-[15px] italic-none ml-1">Hồ sơ bệnh lý & Phân công</h3>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-4 lg:p-5 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {/* Condition */}
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-medium text-slate-500 ml-1">Nhóm bệnh chính <span className="text-red-500">*</span></label>
                                    <div className={formErrors.condition ? 'ring-1 ring-red-500 rounded-xl' : ''}>
                                        <Dropdown
                                            options={availableConditions}
                                            value={formData.condition}
                                            onChange={(condition: string) => setFormData(prev => ({ ...prev, condition }))}
                                        />
                                    </div>
                                    {formErrors.condition && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.condition}</p>}
                                </div>

                                {/* Doctor */}
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-medium text-slate-500 ml-1">Bác sĩ điều trị <span className="text-red-500">*</span></label>
                                    <div className={formErrors.assignedDoctor ? 'ring-1 ring-red-500 rounded-xl' : ''}>
                                        <Dropdown
                                            options={doctorOptions}
                                            value={formData.assignedDoctor}
                                            onChange={(assignedDoctor: string) => setFormData(prev => ({ ...prev, assignedDoctor }))}
                                        />
                                    </div>
                                    {formErrors.assignedDoctor && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.assignedDoctor}</p>}
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

                                {/* Status was here - moved to administrative section */}

                                {/* Baseline Vital Signs */}
                                <div className="lg:col-span-3 border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                                    <h4 className="text-[13px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-2 mb-4 uppercase tracking-wide">
                                        <span className="material-symbols-outlined text-[18px]">vital_signs</span>
                                        Chỉ số sinh tồn khởi điểm (Baseline - Không bắt buộc)
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[14px] font-medium text-slate-500 ml-1">Đường huyết (mmol/L)</label>
                                            <input
                                                type="text"
                                                name="initialGlucose"
                                                value={formData.initialGlucose}
                                                onChange={handleChange}
                                                placeholder="VD: 6.5"
                                                className="w-full h-[48px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 text-[15px] font-bold text-slate-900 dark:text-white transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[14px] font-medium text-slate-500 ml-1">Huyết áp Tâm thu (Systolic)</label>
                                            <input
                                                type="text"
                                                name="initialBpSystolic"
                                                value={formData.initialBpSystolic}
                                                onChange={handleChange}
                                                placeholder="VD: 120"
                                                className="w-full h-[48px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 text-[15px] font-bold text-slate-900 dark:text-white transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[14px] font-medium text-slate-500 ml-1">Huyết áp Tâm trương (Diastolic)</label>
                                            <input
                                                type="text"
                                                name="initialBpDiastolic"
                                                value={formData.initialBpDiastolic}
                                                onChange={handleChange}
                                                placeholder="VD: 80"
                                                className="w-full h-[48px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 text-[15px] font-bold text-slate-900 dark:text-white transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Clinical Notes */}
                                <div className="lg:col-span-3 space-y-1.5 mt-2">
                                    <label className="text-[14px] font-medium text-slate-500 ml-1">Ghi chú lâm sàng ban đầu</label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        placeholder="Tiền sử bệnh, dị ứng..."
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-400 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium outline-none focus:border-primary resize-none custom-scrollbar"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 md:px-8 py-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end rounded-b-3xl">
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-[14px] font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                            type="button"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="px-8 py-2.5 bg-primary text-white text-[14px] font-bold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    <span>Đang lưu...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined font-bold text-[20px]">how_to_reg</span>
                                    <span>Xác nhận thêm</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
