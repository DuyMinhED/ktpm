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
    };
  };

  const [formData, setFormData] = useState(getInitialValues(user));
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Vui lòng nhập họ và tên';
    if (!formData.email.trim()) {
      errors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email không đúng định dạng';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const apiData = {
        fullName: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        clinicId: formData.clinic,
        status: formData.status
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
