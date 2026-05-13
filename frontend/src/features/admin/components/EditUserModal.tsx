import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Dropdown from '../../../components/ui/Dropdown';
import { uploadToCloudinary } from '../../../utils/cloudinary';

const autofillStyles = `
  input:-webkit-autofill,
  input:-webkit-autofill:hover, 
  input:-webkit-autofill:focus, 
  input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px #f8fafc inset !important;
    -webkit-text-fill-color: inherit !important;
  }
`;

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  isSaving: boolean;
  onSave: (userData: any) => Promise<void>;
  availableClinics: any[];
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  isSaving,
  onSave,
  availableClinics,
}) => {
  const getInitialValues = (u: any) => {
    const roleMap: Record<string, string> = {
      'Quản trị viên': 'ADMIN',
      'Bác sĩ': 'DOCTOR',
      'Quản lý phòng khám': 'CLINIC_MANAGER',
      'Bệnh nhân': 'PATIENT',
      'Nhân viên': 'PATIENT'
    };

    return {
      name: u?.fullName || u?.name || u?.displayName || '',
      email: u?.email || u?.username || '',
      phone: (u?.phone && u?.phone !== '--') ? u?.phone : (u?.phoneNumber || ''),
      username: u?.email || u?.username || '',
      role: u?.rawRole || u?.roleCode || (u?.role && roleMap[u?.role]) || u?.role || 'PATIENT',
      clinic: u?.clinicId || null,
      status: u?.status === 'Hoạt động' || u?.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
      // Doctor specific
      avatarUrl: u?.avatarUrl || '',
      licenseNumber: u?.licenseNumber || '',
      degree: u?.degree || 'Bác sĩ',
      experience: u?.experience || '',
      specialty: u?.specialization || u?.specialty || 'Nội khoa',
      bio: u?.bio || '',
      licenseImageUrl: u?.licenseImageUrl || '',
    };
  };

  const [formData, setFormData] = useState(getInitialValues(user));
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [licenseError, setLicenseError] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      const values = getInitialValues(user);
      if (!values.clinic && (user.clinicName || user.clinic) && availableClinics.length > 0) {
        const cName = user.clinicName || user.clinic;
        const found = availableClinics.find((c: any) => c.name === cName);
        if (found) values.clinic = found.id;
      }
      setFormData(values);
      setFormErrors({});
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [user, isOpen, availableClinics]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    if (!formData.name.trim()) errors.name = 'Vui lòng nhập họ và tên';
    if (!formData.email.trim()) {
      errors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email không đúng định dạng';
    }
    
    if (formData.role === 'DOCTOR') {
      if (!formData.licenseNumber?.trim()) errors.licenseNumber = 'Vui lòng nhập số CCHN';
      if (!formData.licenseImageUrl?.trim()) errors.licenseImageUrl = 'Vui lòng tải ảnh bằng chứng CCHN';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const apiData: any = {
        fullName: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        clinicId: formData.clinic,
        status: formData.status
      };
      
      if (formData.role === 'DOCTOR') {
        apiData.avatarUrl = formData.avatarUrl;
        apiData.licenseNumber = formData.licenseNumber;
        apiData.degree = formData.degree;
        apiData.experience = formData.experience;
        apiData.specialization = formData.specialty;
        apiData.bio = formData.bio;
        apiData.licenseImageUrl = formData.licenseImageUrl;
      }
      
      onSave(apiData);
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <style>{autofillStyles}</style>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/20 dark:bg-slate-900/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200 dark:border-slate-800"
          >
            <div className="px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20">
              <h2 className="text-[20px] font-medium text-slate-900 dark:text-white leading-tight">Chỉnh sửa người dùng</h2>
            </div>

            {/* Body */}
            <div className="px-6 md:px-8 pt-3 pb-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-900/50 text-left">
              <div className="space-y-6">
                {/* Personal Information Section */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 pb-1 ml-1">
                    <div className="text-slate-400 dark:text-slate-500 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">contact_page</span>
                    </div>
                    <h3 className="font-medium text-slate-500 dark:text-slate-100 text-[15px] ml-1">Thông tin cá nhân</h3>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 lg:p-5 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="space-y-1.5 flex-1">
                        <label className="text-[14px] font-medium text-slate-500 ml-1">Họ và tên</label>
                        <div className="relative group">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-500 z-10 pointer-events-none group-focus-within:text-primary transition-colors">person</span>
                          <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Họ tên đầy đủ"
                            className={`w-full pl-11 pr-4 h-[42px] rounded-lg border ${formErrors.name ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all`}
                          />
                        </div>
                        {formErrors.name && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.name}</p>}
                      </div>

                      {/* Email */}
                      <div className="space-y-1.5 flex-1">
                        <label className="text-[14px] font-medium text-slate-500 ml-1">Email <span className="text-red-500">*</span></label>
                        <div className="relative group">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-500 z-10 pointer-events-none group-focus-within:text-primary transition-colors">mail</span>
                          <input
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Địa chỉ email liên hệ"
                            className={`w-full pl-11 pr-4 h-[42px] rounded-lg border ${formErrors.email ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all`}
                          />
                        </div>
                        {formErrors.email && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.email}</p>}
                      </div>

                      {/* Phone */}
                      <div className="space-y-1.5 flex-1 md:col-span-2">
                        <label className="text-[14px] font-medium text-slate-500 ml-1">Số điện thoại</label>
                        <div className="relative group">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-500 z-10 pointer-events-none group-focus-within:text-primary transition-colors">call</span>
                          <input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Số điện thoại cá nhân"
                            className={`w-full pl-11 pr-4 h-[42px] rounded-lg border border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role & Status Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 ml-1">
                    <div className="text-slate-400 dark:text-slate-500 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">admin_panel_settings</span>
                    </div>
                    <h3 className="font-medium text-slate-500 dark:text-slate-100 text-[15px] ml-1">Phân quyền & Trạng thái</h3>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 lg:p-5 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Role Selection */}
                      <div className="space-y-1.5 text-left relative z-[40]">
                        <label className="text-[14px] font-medium text-slate-500 ml-1">Vai trò hệ thống</label>
                        <Dropdown
                          options={[
                            { label: 'Quản trị viên', value: 'ADMIN' },
                            { label: 'Bác sĩ', value: 'DOCTOR' },
                            { label: 'Quản lý phòng khám', value: 'CLINIC_MANAGER' },
                            { label: 'Bệnh nhân', value: 'PATIENT' }
                          ]}
                          value={formData.role}
                          onChange={(role) => setFormData(prev => ({ ...prev, role }))}
                        />
                      </div>

                      {/* Clinic Selection */}
                      <div className="space-y-1.5 text-left relative z-[35]">
                        <label className="text-[14px] font-medium text-slate-500 ml-1">Cơ sở công tác</label>
                        <Dropdown
                          options={availableClinics.map(c => ({ label: c.name, value: c.id }))}
                          value={formData.clinic}
                          onChange={(clinic) => setFormData(prev => ({ ...prev, clinic }))}
                        />
                      </div>
                    </div>

                    {/* Status Buttons */}
                    <div className="space-y-1.5">
                      <label className="text-[14px] font-medium text-slate-500 ml-1 mb-1 block">Trạng thái tài khoản</label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, status: 'ACTIVE' }))}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all font-medium text-sm ${formData.status === 'ACTIVE'
                            ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                            : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 opacity-60'
                            }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          Hoạt động
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, status: 'INACTIVE' }))}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all font-medium text-sm ${formData.status === 'INACTIVE'
                            ? 'border-red-500 bg-red-500 text-white shadow-lg shadow-red-500/20'
                            : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 opacity-60'
                            }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">block</span>
                          Ngưng hoạt động
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Doctor Specific Profile Details Section */}
                {formData.role === 'DOCTOR' && (
                  <div className="space-y-3 pt-1 pb-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-2 pb-1 ml-1">
                      <div className="text-slate-400 dark:text-slate-500 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px]">clinical_notes</span>
                      </div>
                      <h3 className="font-medium text-slate-500 dark:text-slate-100 text-[15px] ml-1">Hồ sơ chuyên môn bác sĩ</h3>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 lg:p-5 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm space-y-5">
                      {/* Avatar Upload */}
                      <div className="flex items-center gap-5 pb-2 border-b border-slate-50 dark:border-slate-800/50">
                        <div
                          onClick={() => !isUploadingImage && document.getElementById('avatar-input-admin-edit')?.click()}
                          className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer overflow-hidden group relative transition-all hover:border-primary shrink-0"
                        >
                          {isUploadingImage ? (
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
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
                              <span className="material-symbols-outlined text-[24px]">add_a_photo</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Ảnh chân dung bác sĩ</p>
                          <button
                            type="button"
                            onClick={() => document.getElementById('avatar-input-admin-edit')?.click()}
                            className="text-[12px] font-black text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">upload_file</span>
                            Tải ảnh chân dung
                          </button>
                          <input
                            id="avatar-input-admin-edit"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Degree */}
                        <div className="space-y-1.5 text-left relative z-[30]">
                          <label className="text-[14px] font-medium text-slate-500 ml-1">Học hàm / Học vị</label>
                          <Dropdown
                            options={['Bác sĩ', 'Bác sĩ CKI', 'Bác sĩ CKII', 'Thạc sĩ', 'Tiến sĩ', 'Phó Giáo sư', 'Giáo sư']}
                            value={formData.degree}
                            onChange={(degree) => setFormData(prev => ({ ...prev, degree }))}
                          />
                        </div>

                        {/* Specialty */}
                        <div className="space-y-1.5 text-left relative z-[25]">
                          <label className="text-[14px] font-medium text-slate-500 ml-1">Chuyên khoa</label>
                          <Dropdown
                            options={['Nội khoa', 'Sản phụ khoa', 'Nhi khoa', 'Tim mạch', 'Thần kinh', 'Da liễu', 'Khác']}
                            value={formData.specialty}
                            onChange={(specialty) => setFormData(prev => ({ ...prev, specialty }))}
                          />
                        </div>

                        {/* Experience */}
                        <div className="space-y-1.5">
                          <label className="text-[14px] font-medium text-slate-500 ml-1">Kinh nghiệm (năm)</label>
                          <div className="relative group">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">history_edu</span>
                            <input
                              name="experience"
                              value={formData.experience}
                              onChange={handleChange}
                              placeholder="Nhập số năm"
                              className="w-full pl-11 pr-4 h-[42px] rounded-lg border border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                            />
                          </div>
                        </div>

                        {/* License Number */}
                        <div className="space-y-1.5">
                          <label className="text-[14px] font-medium text-slate-500 ml-1">Số chứng chỉ hành nghề (CCHN) <span className="text-red-500">*</span></label>
                          <div className="relative group">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">badge</span>
                            <input
                              name="licenseNumber"
                              value={formData.licenseNumber}
                              onChange={handleChange}
                              placeholder="Nhập số CCHN"
                              className={`w-full pl-11 pr-4 h-[42px] rounded-lg border ${formErrors.licenseNumber ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all`}
                            />
                          </div>
                          {formErrors.licenseNumber && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.licenseNumber}</p>}
                        </div>
                      </div>

                      {/* License Image */}
                      <div className="space-y-1.5">
                        <label className="text-[14px] font-medium text-slate-500 ml-1">Minh chứng chứng chỉ hành nghề <span className="text-red-500">*</span></label>
                        <div className="flex items-center gap-3 mt-1">
                          <div
                            onClick={() => !isUploadingLicense && document.getElementById('license-input-admin-edit')?.click()}
                            className="w-[42px] h-[42px] bg-slate-50 dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center cursor-pointer overflow-hidden group transition-all hover:border-primary relative shrink-0"
                          >
                            {isUploadingLicense ? (
                              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                            ) : formData.licenseImageUrl && !licenseError ? (
                              <img src={formData.licenseImageUrl} alt="License" className="w-full h-full object-cover" onError={() => setLicenseError(true)} />
                            ) : (
                              <span className="material-symbols-outlined text-slate-400 text-[20px] group-hover:text-primary">add_photo_alternate</span>
                            )}
                          </div>
                          <div className="flex-1 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => document.getElementById('license-input-admin-edit')?.click()}
                              className="text-[13px] font-bold text-primary hover:underline flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[18px]">upload</span>
                              Tải ảnh minh chứng
                            </button>
                            <input id="license-input-admin-edit" type="file" accept="image/*" className="hidden" onChange={handleLicenseUpload} />
                          </div>
                        </div>
                        {formErrors.licenseImageUrl && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.licenseImageUrl}</p>}
                      </div>

                      {/* Bio */}
                      <div className="space-y-1.5">
                        <label className="text-[14px] font-medium text-slate-500 ml-1">Giới thiệu tóm tắt (Bio)</label>
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          placeholder="Kinh nghiệm làm việc, chuyên môn sâu..."
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border border-slate-400 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 resize-none"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 md:px-8 py-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end rounded-b-3xl">
              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 text-[14px] font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                  type="button"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="px-8 py-2.5 bg-primary text-white text-[14px] font-medium rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
                  type="button"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">save</span>
                      <span>Lưu cập nhật</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default EditUserModal;
