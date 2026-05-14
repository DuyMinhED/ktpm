import React, { useEffect, useState } from 'react';
import Dropdown from '../../../components/ui/Dropdown';
import { uploadToCloudinary } from '../../../utils/cloudinary';

interface EditDoctorModalProps {
    isOpen: boolean;
    onClose: () => void;
    isSaving: boolean;
    onSave: (doctorData: any) => Promise<void>;
    initialData: any;
}

export default function EditDoctorModal({
    isOpen,
    onClose,
    isSaving,
    onSave,
    initialData
}: EditDoctorModalProps) {
    const [formData, setFormData] = useState({
        dbId: '',
        id: '',
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        licenseNumber: '',
        degree: 'Bác sĩ',
        experience: '',
        specialty: 'Nội khoa',
        bio: '',
        maxPatients: '150',
        status: 'ACTIVE',
        avatarUrl: '',
        licenseImageUrl: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [avatarError, setAvatarError] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isUploadingLicense, setIsUploadingLicense] = useState(false);
    const [licenseError, setLicenseError] = useState(false);

    useEffect(() => {
        if (isOpen && initialData) {
            document.body.style.overflow = 'hidden';
            setFormErrors({});
            setAvatarError(false);
            setFormData({
                dbId: initialData.dbId || '',
                id: initialData.id || '',
                name: initialData.name || '',
                email: initialData.email || '',
                phone: initialData.phone || '',
                password: '', // Keep empty unless user wants to change
                confirmPassword: '',
                licenseNumber: initialData.licenseNumber || '',
                degree: initialData.degree || 'Bác sĩ',
                experience: initialData.experience || '',
                specialty: initialData.specialty || 'Nội khoa',
                bio: initialData.bio || '',
                maxPatients: initialData.maxPatients ? String(initialData.maxPatients) : '150',
                status: (initialData.status === 'Đang hoạt động' || initialData.status === 'ACTIVE') ? 'ACTIVE' :
                    (initialData.status === 'Ngưng hoạt động' || initialData.status === 'Tạm dừng' || initialData.status === 'INACTIVE') ? 'INACTIVE' : 'ACTIVE',
                avatarUrl: initialData.img || initialData.avatarUrl || '',
                licenseImageUrl: initialData.licenseImageUrl || ''
            });
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, initialData]);

    if (!isOpen) return null;

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

    const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                setLicenseError(false);
                setIsUploadingLicense(true);
                const imageUrl = await uploadToCloudinary(file);
                setFormData(prev => ({ ...prev, licenseImageUrl: imageUrl }));
            } catch (error) {
                console.error("Lỗi upload CCHN:", error);
                setLicenseError(true);
            } finally {
                setIsUploadingLicense(false);
            }
        }
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!formData.name.trim()) errors.name = 'Vui lòng nhập họ tên bác sĩ';

        if (!formData.email.trim()) {
            errors.email = 'Vui lòng nhập email đăng nhập';
        } else if (!/^\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Email không hợp lệ';
        }

        const phoneRegex = /^(0|\+84)(\d{9})$/;
        if (!formData.phone.trim()) {
            errors.phone = 'Vui lòng nhập số điện thoại';
        } else if (!phoneRegex.test(formData.phone.trim().replace(/\s/g, ''))) {
            errors.phone = 'Số điện thoại không hợp lệ (10 số)';
        }

        if (formData.password && formData.password.length < 6) {
            errors.password = 'Mật khẩu phải từ 6 ký tự';
        }

        if (formData.password && formData.confirmPassword !== formData.password) {
            errors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp';
        }

        if (!formData.licenseNumber.trim()) {
            errors.licenseNumber = 'Vui lòng nhập số CCHN';
        }

        if (!formData.licenseImageUrl) {
            errors.licenseImageUrl = 'Vui lòng tải ảnh bằng chứng CCHN';
        }

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
                <div className="px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20 rounded-t-3xl">
                    <h2 className="text-[20px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight italic-none">Cập nhật hồ sơ bác sĩ</h2>
                </div>

                {/* Form Body */}
                <div className="px-6 md:px-8 pt-3 pb-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-900/50 text-left">
                    {/* Hidden inputs for autofill trap */}
                    <input autoComplete="new-password" type="text" style={{ display: 'none' }} />
                    <input autoComplete="new-password" type="password" style={{ display: 'none' }} />

                    <div className="space-y-6">
                        {/* Section 1: Administrative & Account Information */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 pb-1 ml-1">
                                <div className="text-slate-400 dark:text-slate-500 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[24px]">account_circle</span>
                                </div>
                                <h3 className="font-bold text-slate-500 dark:text-slate-100 text-[15px] italic-none ml-1">Thông tin tài khoản</h3>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-4 lg:p-5 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-3">
                                    {/* Avatar Upload */}
                                    <div className="md:col-span-2 lg:col-span-3 flex items-center gap-5 pb-2 mb-1 border-b border-slate-50 dark:border-slate-800/50">
                                        <div
                                            onClick={() => !isUploadingImage && document.getElementById('avatar-input-doctor-edit')?.click()}
                                            className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer overflow-hidden group relative transition-all hover:border-primary shrink-0"
                                        >
                                            {isUploadingImage ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                                    <span className="text-[10px] font-bold text-primary">Đang tải...</span>
                                                </div>
                                            ) : formData.avatarUrl && !avatarError ? (
                                                <a href={formData.avatarUrl} target="_blank" rel="noopener noreferrer" className="w-full h-full block" onClick={(e) => e.stopPropagation()}>
                                                    <img
                                                        src={formData.avatarUrl}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover"
                                                        onError={() => setAvatarError(true)}
                                                    />
                                                </a>
                                            ) : (
                                                <div className="flex flex-col items-center text-slate-400 group-hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined text-[32px]">add_a_photo</span>
                                                    <span className="text-[10px] font-bold mt-1">Ảnh bác sĩ</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[14px] font-bold text-slate-700 dark:text-slate-200">Ảnh chân dung bác sĩ</p>
                                            <p className="text-[12px] text-slate-500 font-medium pb-1">Định dạng JPG, PNG. Tối đa 5MB.</p>
                                            <button
                                                type="button"
                                                onClick={() => document.getElementById('avatar-input-doctor-edit')?.click()}
                                                className="text-[13px] font-black text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                                                Chọn tệp tin
                                            </button>
                                            <input
                                                id="avatar-input-doctor-edit"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleAvatarChange}
                                            />
                                        </div>
                                    </div>

                                    {/* Name */}
                                    <div className="space-y-1.5 flex-1">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Họ và tên bác sĩ <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 z-10 pointer-events-none">person</span>
                                            <input
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="Nhập họ tên bác sĩ"
                                                className={`w-full pl-11 pr-4 h-[42px] rounded-lg border ${formErrors.name ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                                            />
                                        </div>
                                        {formErrors.name && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.name}</p>}
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-1.5 flex-1">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Số điện thoại <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 z-10 pointer-events-none">call</span>
                                            <input
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="Nhập số điện thoại"
                                                className={`w-full pl-11 pr-4 h-[42px] rounded-lg border ${formErrors.phone ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                                            />
                                        </div>
                                        {formErrors.phone && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.phone}</p>}
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-1.5 flex-1">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Email đăng nhập <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 z-10 pointer-events-none">mail</span>
                                            <input
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="Nhập email"
                                                className={`w-full pl-11 pr-4 h-[42px] rounded-lg border ${formErrors.email ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                                            />
                                        </div>
                                        {formErrors.email && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.email}</p>}
                                    </div>

                                    {/* Password */}
                                    <div className="space-y-1.5 min-w-0">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Đổi mật khẩu</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[19px] text-slate-400 z-10 pointer-events-none">lock</span>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                placeholder="Để trống nếu không đổi"
                                                title="Bỏ trống nếu không muốn thay đổi mật khẩu"
                                                autoComplete="new-password"
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

                                    {/* Confirm Password */}
                                    <div className="space-y-1.5 min-w-0">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Xác nhận mật khẩu mới</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[19px] text-slate-400 z-10 pointer-events-none">lock</span>
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                placeholder="Để trống nếu không đổi"
                                                title="Bỏ trống nếu không muốn thay đổi mật khẩu"
                                                autoComplete="new-password"
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

                                    {/* Status */}
                                    <div className="space-y-1.5 flex-1">
                                        <label className="text-[14px] font-medium text-slate-500 ml-1">Trạng thái làm việc</label>
                                        <Dropdown
                                            options={[
                                                { label: 'Đang hoạt động', value: 'ACTIVE' },
                                                { label: 'Ngưng hoạt động', value: 'INACTIVE' }
                                            ]}
                                            value={formData.status}
                                            onChange={(status: string) => setFormData(prev => ({ ...prev, status }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Professional Profile */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 pb-1 ml-1">
                                <div className="text-slate-400 dark:text-slate-500 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[24px]">clinical_notes</span>
                                </div>
                                <h3 className="font-bold text-slate-500 dark:text-slate-100 text-[15px] italic-none ml-1">Hồ sơ chuyên môn</h3>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-4 lg:p-5 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {/* Degree */}
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-medium text-slate-500 ml-1">Học hàm / Học vị</label>
                                    <Dropdown
                                        options={['Bác sĩ', 'Bác sĩ CKI', 'Bác sĩ CKII', 'Thạc sĩ', 'Tiến sĩ', 'Phó Giáo sư', 'Giáo sư']}
                                        value={formData.degree}
                                        onChange={(degree: string) => setFormData(prev => ({ ...prev, degree }))}
                                    />
                                </div>

                                {/* Specialty */}
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-medium text-slate-500 ml-1">Chuyên khoa</label>
                                    <Dropdown
                                        options={['Nội khoa', 'Sản phụ khoa', 'Nhi khoa', 'Tim mạch', 'Thần kinh', 'Da liễu', 'Khác']}
                                        value={formData.specialty}
                                        onChange={(specialty: string) => setFormData(prev => ({ ...prev, specialty }))}
                                    />
                                </div>

                                {/* Experience */}
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-medium text-slate-500 ml-1">Kinh nghiệm (năm)</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 z-10 pointer-events-none">history_edu</span>
                                        <input
                                            name="experience"
                                            value={formData.experience}
                                            onChange={handleChange}
                                            placeholder="Nhập số năm"
                                            className="w-full pl-11 pr-4 h-[42px] rounded-lg border border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* License Number */}
                                <div className="space-y-1.5 min-w-0">
                                    <label className="text-[14px] font-medium text-slate-500 ml-1">Số chứng chỉ hành nghề <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 z-10 pointer-events-none">badge</span>
                                        <input
                                            name="licenseNumber"
                                            value={formData.licenseNumber}
                                            onChange={handleChange}
                                            placeholder="Nhập số CCHN"
                                            className={`w-full pl-11 pr-4 h-[42px] rounded-lg border ${formErrors.licenseNumber ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                                        />
                                    </div>
                                    {formErrors.licenseNumber && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.licenseNumber}</p>}
                                </div>

                                {/* License Image Upload */}
                                <div className="md:col-span-2 lg:col-span-1 space-y-1.5 min-w-0">
                                    <label className="text-[14px] font-medium text-slate-500 ml-1">Bằng chứng CCHN <span className="text-red-500">*</span></label>
                                    <div className="flex items-center gap-3">
                                        <div
                                            onClick={() => !isUploadingLicense && document.getElementById('license-image-input-edit')?.click()}
                                            className="w-[42px] h-[42px] bg-slate-50 dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center cursor-pointer overflow-hidden group transition-all hover:border-primary relative"
                                        >
                                            {isUploadingLicense ? (
                                                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                            ) : formData.licenseImageUrl && !licenseError ? (
                                                <a href={formData.licenseImageUrl} target="_blank" rel="noopener noreferrer" className="w-full h-full block" onClick={(e) => e.stopPropagation()}>
                                                    <img src={formData.licenseImageUrl} alt="License" className="w-full h-full object-cover" onError={() => setLicenseError(true)} />
                                                </a>
                                            ) : (
                                                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">add_photo_alternate</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <button
                                                type="button"
                                                onClick={() => document.getElementById('license-image-input-edit')?.click()}
                                                className="text-[13px] font-bold text-primary hover:underline flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">upload</span>
                                                {formData.licenseImageUrl ? 'Thay đổi ảnh' : 'Tải ảnh lên'}
                                            </button>
                                            <input id="license-image-input-edit" type="file" accept="image/*" className="hidden" onChange={handleLicenseUpload} />
                                        </div>
                                    </div>
                                    {licenseError && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">Lỗi tải ảnh</p>}
                                    {formErrors.licenseImageUrl && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.licenseImageUrl}</p>}
                                </div>

                                {/* Bio */}
                                <div className="lg:col-span-3 space-y-1.5">
                                    <label className="text-[14px] font-medium text-slate-500 ml-1">Giới thiệu tóm tắt (Bio)</label>
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        placeholder="Kinh nghiệm làm việc, thế mạnh chuyên môn..."
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-400 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 resize-none custom-scrollbar"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 md:px-8 py-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end rounded-b-3xl sticky bottom-0 z-20">
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
                                    <span className="material-symbols-outlined text-[20px]">save</span>
                                    <span>Lưu thay đổi</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
