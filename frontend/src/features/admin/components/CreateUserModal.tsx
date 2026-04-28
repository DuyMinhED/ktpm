import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Dropdown from '../../../components/ui/Dropdown';

const autofillStyles = `
  input:-webkit-autofill,
  input:-webkit-autofill:hover, 
  input:-webkit-autofill:focus, 
  input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px #f8fafc inset !important;
    -webkit-text-fill-color: inherit !important;
  }
`;

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSaving: boolean;
  onSave: (userData: any) => Promise<void>;
  availableClinics: any[];
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  isSaving,
  onSave,
  availableClinics,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    username: '',
    role: 'Quản lý phòng khám',
    clinic: '',
    status: 'Hoạt động',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setFormErrors({});
      // Set default clinic if not set
      if (!formData.clinic && availableClinics.length > 0) {
        setFormData(prev => ({ ...prev, clinic: availableClinics[0].name }));
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Vui lòng nhập họ và tên';
    if (!formData.email.trim()) {
      errors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email không đúng định dạng';
    }
    
    if (!formData.username.trim()) errors.username = 'Vui lòng nhập tên đăng nhập';
    if (!formData.password) {
      errors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      errors.password = 'Mật khẩu phải từ 6 ký tự';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const roleMapping: any = {
        'Quản trị viên': 'ADMIN',
        'Bác sĩ': 'DOCTOR',
        'Quản lý phòng khám': 'CLINIC_MANAGER',
        'Bệnh nhân': 'PATIENT'
      };

      const selectedClinicObj = availableClinics.find(c => c.name === formData.clinic);

      const apiData = {
        fullName: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: roleMapping[formData.role] || formData.role,
        clinicId: selectedClinicObj ? selectedClinicObj.id : null,
        password: formData.password
      };

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
            {/* Header */}
            <div className="px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20">
              <h2 className="text-[20px] font-medium text-slate-900 dark:text-white leading-tight">Thêm người dùng mới</h2>
            </div>

            {/* Body */}
            <div className="px-6 md:px-8 pt-3 pb-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-900/50 text-left">
              {/* Hidden Trap */}
              <input autoComplete="new-password" type="text" style={{ display: 'none' }} />
              <input autoComplete="new-password" type="password" style={{ display: 'none' }} />

              <div className="space-y-6">
                {/* Personal Information Section */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 pb-1 ml-1">
                    <h3 className="font-medium text-slate-500 dark:text-slate-100 text-[15px]">Thông tin cá nhân</h3>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 lg:p-5 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="space-y-1.5 flex-1">
                        <label className="text-[14px] font-medium text-slate-500 ml-1">Họ và tên <span className="text-red-500">*</span></label>
                          <div className="relative group">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-500 z-10 pointer-events-none group-focus-within:text-primary transition-colors">person</span>
                          <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Nhập họ và tên"
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
                            placeholder="Nhập địa chỉ email"
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
                            placeholder="Nhập số điện thoại"
                            className={`w-full pl-11 pr-4 h-[42px] rounded-lg border border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account & Permissions Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 ml-1">
                    <div className="text-slate-400 dark:text-slate-500 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">manage_accounts</span>
                    </div>
                    <h3 className="font-medium text-slate-500 dark:text-slate-100 text-[15px] ml-1">Thiết lập tài khoản & Phân quyền</h3>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 lg:p-5 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Username */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[14px] font-medium text-slate-500 ml-1">Tên đăng nhập <span className="text-red-500">*</span></label>
                      <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-500 z-10 pointer-events-none group-focus-within:text-primary transition-colors">alternate_email</span>
                        <input
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          placeholder="Tên tài khoản truy cập"
                          className={`w-full pl-11 pr-4 h-[42px] rounded-lg border ${formErrors.username ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all`}
                        />
                      </div>
                      {formErrors.username && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.username}</p>}
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-1.5 text-left relative z-[40]">
                      <label className="text-[14px] font-medium text-slate-500 ml-1">Vai trò hệ thống</label>
                      <Dropdown
                        options={['Quản trị viên', 'Bác sĩ', 'Quản lý phòng khám', 'Bệnh nhân']}
                        value={formData.role}
                        onChange={(role) => setFormData(prev => ({ ...prev, role }))}
                      />
                    </div>

                    {/* Clinic Selection */}
                    <div className="space-y-1.5 text-left relative z-[35]">
                      <label className="text-[14px] font-medium text-slate-500 ml-1">Đơn vị công tác</label>
                      <Dropdown
                        options={availableClinics.map(c => c.name)}
                        value={formData.clinic}
                        onChange={(clinic) => setFormData(prev => ({ ...prev, clinic }))}
                      />
                    </div>

                    {/* Passwords */}
                    <div className="space-y-1.5 md:col-span-1">
                      <label className="text-[14px] font-medium text-slate-500 ml-1">Mật khẩu <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[19px] text-slate-400 z-10 pointer-events-none">lock</span>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Tối thiểu 6 ký tự"
                          className={`w-full pl-11 pr-12 h-[42px] rounded-lg border ${formErrors.password ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined text-[19px]">{showPassword ? 'visibility' : 'visibility_off'}</span>
                        </button>
                      </div>
                      {formErrors.password && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.password}</p>}
                    </div>

                    <div className="space-y-1.5 md:col-span-1">
                      <label className="text-[14px] font-medium text-slate-500 ml-1">Xác nhận mật khẩu <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[19px] text-slate-400 z-10 pointer-events-none">lock_reset</span>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Nhập lại mật khẩu"
                          className={`w-full pl-11 pr-12 h-[42px] rounded-lg border ${formErrors.confirmPassword ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined text-[19px]">{showConfirmPassword ? 'visibility' : 'visibility_off'}</span>
                        </button>
                      </div>
                      {formErrors.confirmPassword && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.confirmPassword}</p>}
                    </div>
                  </div>
                </div>
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
                      <span className="material-symbols-outlined text-[20px]">person_add</span>
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

export default CreateUserModal;
