import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const autofillStyles = `
  input:-webkit-autofill,
  input:-webkit-autofill:hover, 
  input:-webkit-autofill:focus, 
  input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px #f8fafc inset !important;
    -webkit-text-fill-color: inherit !important;
  }
`;

interface CreateClinicModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSaving: boolean;
  onSave: (clinicData: any) => Promise<void>;
}

const CreateClinicModal: React.FC<CreateClinicModalProps> = ({
  isOpen,
  onClose,
  isSaving,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    clinicCode: '',
    adminFullName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=200',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isClinicCodeEdited, setIsClinicCodeEdited] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [randomSuffix, setRandomSuffix] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset logic when modal opens
      setIsClinicCodeEdited(false);
      setFormErrors({});
      const suffix = Math.floor(1000 + Math.random() * 9000).toString();
      setRandomSuffix(suffix);
      setFormData({
        name: '',
        address: '',
        phone: '',
        clinicCode: 'PK' + suffix,
        adminFullName: '',
        adminEmail: '',
        adminPassword: '',
        confirmPassword: '',
        imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=200',
      });
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Real-time related event bindings
  useEffect(() => {
    if (!isClinicCodeEdited && randomSuffix) {
      let prefix = 'PK';
      if (formData.name.trim().length > 0) {
        prefix = formData.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[đĐ]/g, 'd')
          .replace(/[^a-z0-9 ]/g, '')
          .split(' ')
          .filter(word => word.length > 0)
          .map(word => word[0])
          .join('')
          .toUpperCase() || 'PK';
      }
      const realTimeCode = prefix + randomSuffix;
      if (formData.clinicCode !== realTimeCode) {
        setFormData(prev => ({ ...prev, clinicCode: realTimeCode }));
      }
    }
  }, [formData.name, randomSuffix, isClinicCodeEdited]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'clinicCode') setIsClinicCodeEdited(true);

    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Clinic Info
    if (!formData.name.trim()) {
      errors.name = 'Vui lòng nhập tên phòng khám';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Tên phòng khám phải có ít nhất 3 ký tự';
    }

    if (!formData.clinicCode.trim()) {
      errors.clinicCode = 'Vui lòng nhập mã phòng khám';
    }

    if (!formData.address.trim()) {
      errors.address = 'Vui lòng nhập địa chỉ';
    }

    const phoneRegex = /^(0|84)(3|5|7|8|9)([0-9]{8})$/;
    if (!formData.phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!phoneRegex.test(formData.phone.trim())) {
      errors.phone = 'Số điện thoại không hợp lệ';
    }

    // Admin Info
    if (!formData.adminFullName.trim()) {
      errors.adminFullName = 'Vui lòng nhập tên người quản lý';
    } else if (formData.adminFullName.trim().length < 2) {
      errors.adminFullName = 'Họ tên quá ngắn';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.adminEmail.trim()) {
      errors.adminEmail = 'Vui lòng nhập email quản lý';
    } else if (!emailRegex.test(formData.adminEmail.trim())) {
      errors.adminEmail = 'Email không đúng định dạng';
    }

    if (!formData.adminPassword) {
      errors.adminPassword = 'Vui lòng nhập mật khẩu';
    } else if (formData.adminPassword.length < 6) {
      errors.adminPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.adminPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(formData);
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
            {/* Modal Header */}
            <div className="px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20">
              <h2 className="text-[20px] font-medium text-slate-900 dark:text-white leading-tight">Thêm phòng khám mới</h2>
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
                      <span className="material-symbols-outlined text-[24px]">local_hospital</span>
                    </div>
                    <h3 className="font-medium text-slate-500 dark:text-slate-100 text-[15px] italic-none ml-1">Thông tin cơ sở</h3>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 lg:p-5 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-3">
                      {/* Avatar Upload - Same style as Patient */}
                      <div className="md:col-span-2 lg:col-span-3 flex items-center gap-5 pb-2 mb-1 border-b border-slate-50 dark:border-slate-800/50">
                        <div
                          onClick={() => !isSaving && fileInputRef.current?.click()}
                          className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer overflow-hidden group relative transition-all hover:border-primary shrink-0"
                        >
                          {formData.imageUrl ? (
                            <img
                              src={formData.imageUrl}
                              alt="Preview"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="flex flex-col items-center text-slate-400 group-hover:text-primary transition-colors">
                              <span className="material-symbols-outlined text-[32px]">add_a_photo</span>
                              <span className="text-[10px] font-bold mt-1">Ảnh đại diện</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-[14px] font-bold text-slate-700 dark:text-slate-200">Ảnh đại diện phòng khám</p>
                          <p className="text-[12px] text-slate-500 font-medium pb-1">Định dạng JPG, PNG để làm ảnh bìa.</p>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[13px] font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[18px]">upload_file</span>
                            Chọn tệp tin
                          </button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </div>
                      </div>

                      {/* Name */}
                      <div className="lg:col-span-2 space-y-1.5 flex-1">
                        <label className="text-[14px] font-medium text-slate-500 ml-1">Tên phòng khám <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">apartment</span>
                          <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Tên cơ sở y tế"
                            className={`w-full pl-11 pr-4 h-[42px] rounded-lg border ${formErrors.name ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                          />
                        </div>
                        {formErrors.name && <p className="text-[11px] md:text-[13.5px] font-medium text-red-500 ml-1 mt-1">{formErrors.name}</p>}
                      </div>

                      {/* Clinic Code */}
                      <div className="space-y-1.5 flex-1">
                        <label className="text-[14px] font-medium text-slate-500 ml-1">Mã định danh <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">qr_code</span>
                          <input
                            name="clinicCode"
                            value={formData.clinicCode}
                            readOnly
                            placeholder="Hệ thống tự tạo mã"
                            className={`w-full pl-11 pr-4 h-[42px] rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shadow-sm text-[14px] font-medium text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed transition-all`}
                          />
                        </div>
                        {formErrors.clinicCode && <p className="text-[11px] md:text-[13.5px] font-medium text-red-500 ml-1 mt-1">{formErrors.clinicCode}</p>}
                      </div>

                      {/* Telephone */}
                      <div className="space-y-1.5 flex-1">
                        <label className="text-[14px] font-medium text-slate-500 ml-1">Số điện thoại <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">call</span>
                          <input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Hotline phòng khám"
                            className={`w-full pl-11 pr-4 h-[42px] rounded-lg border ${formErrors.phone ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                          />
                        </div>
                        {formErrors.phone && <p className="text-[11px] md:text-[13.5px] font-medium text-red-500 ml-1 mt-1">{formErrors.phone}</p>}
                      </div>

                      {/* Address */}
                      <div className="lg:col-span-2 space-y-1.5">
                        <label className="text-[14px] font-medium text-slate-500 ml-1">Địa chỉ chi tiết <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">location_on</span>
                          <input
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Số nhà, đường, phường, thành phố"
                            className={`w-full pl-11 pr-4 h-[42px] rounded-lg border ${formErrors.address ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                          />
                        </div>
                        {formErrors.address && <p className="text-[11px] md:text-[13.5px] font-medium text-red-500 ml-1 mt-1">{formErrors.address}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Account Information */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 ml-1">
                    <div className="text-slate-400 dark:text-slate-500 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">manage_accounts</span>
                    </div>
                    <h3 className="font-medium text-slate-500 dark:text-slate-100 text-[15px] italic-none ml-1">Tài khoản quản trị phòng khám</h3>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 lg:p-5 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Admin Name */}
                    <div className="space-y-1.5 flex-1 lg:col-span-2">
                      <label className="text-[14px] font-medium text-slate-500 ml-1">Họ và tên người quản lý <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">person_add</span>
                        <input
                          name="adminFullName"
                          value={formData.adminFullName}
                          onChange={handleChange}
                          placeholder="Nhập tên người quản lý"
                          className={`w-full pl-11 pr-4 h-[42px] rounded-lg border ${formErrors.adminFullName ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                        />
                      </div>
                      {formErrors.adminFullName && <p className="text-[11px] md:text-[13.5px] font-medium text-red-500 ml-1 mt-1">{formErrors.adminFullName}</p>}
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-[14px] font-medium text-slate-500 ml-1">Email đăng nhập <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">mail</span>
                        <input
                          name="adminEmail"
                          value={formData.adminEmail}
                          onChange={handleChange}
                          placeholder="Nhập email"
                          className={`w-full pl-11 pr-4 h-[42px] rounded-xl border ${formErrors.adminEmail ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                        />
                      </div>
                      {formErrors.adminEmail && <p className="text-[11px] md:text-[13.5px] font-medium text-red-500 ml-1 mt-1">{formErrors.adminEmail}</p>}
                    </div>

                    {/* Password Fields */}
                    <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[14px] font-medium text-slate-500 ml-1">Mật khẩu <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[19px] text-slate-400">lock</span>
                          <input
                            type={showPassword ? "text" : "password"}
                            name="adminPassword"
                            value={formData.adminPassword}
                            onChange={handleChange}
                            placeholder="Nhập mật khẩu"
                            className={`w-full pl-11 pr-12 h-[42px] rounded-xl border ${formErrors.adminPassword ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                            autoComplete="new-password"
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
                        {formErrors.adminPassword && <p className="text-[11px] md:text-[13.5px] font-medium text-red-500 ml-1 mt-1">{formErrors.adminPassword}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[14px] font-medium text-slate-500 ml-1">Xác nhận mật khẩu <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[19px] text-slate-400">lock</span>
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Nhập lại mật khẩu"
                            className={`w-full pl-11 pr-12 h-[42px] rounded-xl border ${formErrors.confirmPassword ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                            autoComplete="new-password"
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
                        {formErrors.confirmPassword && <p className="text-[11px] md:text-[13.5px] font-medium text-red-500 ml-1 mt-1">{formErrors.confirmPassword}</p>}
                      </div>
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
                  className="px-6 py-2.5 text-[14px] font-medium text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                  type="button"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="px-8 py-2.5 bg-primary text-white text-[14px] font-medium rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">domain_add</span>
                      <span>Xác nhận thêm</span>
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

export default CreateClinicModal;
