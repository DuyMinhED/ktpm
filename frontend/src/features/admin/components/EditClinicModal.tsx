import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface EditClinicModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinic: any;
  isSaving: boolean;
  onSave: (clinicData: any) => Promise<void>;
}

const EditClinicModal: React.FC<EditClinicModalProps> = ({
  isOpen,
  onClose,
  clinic,
  isSaving,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    clinicCode: '',
    adminFullName: 'Quản lý hiện tại', // Assuming we don't always edit admin account here but maybe just clinic info
    adminEmail: 'admin@clinic.com',
    status: 'ACTIVE',
    imageUrl: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && clinic) {
      setFormData({
        name: clinic.name || '',
        address: clinic.address || '',
        phone: clinic.phone || '',
        clinicCode: clinic.id || '', // or whatever code
        adminFullName: clinic.adminFullName || 'Nguyễn Văn Quản Lý',
        adminEmail: clinic.adminEmail || 'admin.clinic@vitality.com',
        status: clinic.status === 'Hoạt động' ? 'ACTIVE' : 'INACTIVE',
        imageUrl: clinic.image || '',
      });
    }
  }, [isOpen, clinic]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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
    if (!formData.name) errors.name = 'Vui lòng nhập tên phòng khám';
    if (!formData.address) errors.address = 'Vui lòng nhập địa chỉ';
    if (!formData.phone) errors.phone = 'Vui lòng nhập số điện thoại';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave({ ...clinic, ...formData });
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
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
              <h2 className="text-[20px] font-medium text-slate-900 dark:text-white leading-tight">Chỉnh sửa phòng khám</h2>
            </div>

            {/* Form Body */}
            <div className="px-6 md:px-8 pt-3 pb-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-900/50 text-left">
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
                      {/* Avatar Upload */}
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
                            Chọn hình ảnh
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
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 z-10">apartment</span>
                          <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Tên cơ sở y tế"
                            className={`w-full pl-11 pr-4 h-[42px] rounded-lg border ${formErrors.name ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                          />
                        </div>
                        {formErrors.name && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.name}</p>}
                      </div>

                      {/* Clinic Code (Readonly) */}
                      <div className="space-y-1.5 flex-1">
                        <label className="text-[14px] font-medium text-slate-500 ml-1">Mã định danh</label>
                        <div className="relative cursor-not-allowed">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-300 z-10">qr_code</span>
                          <input
                            readOnly
                            value={formData.clinicCode}
                            className="w-full pl-11 pr-4 h-[42px] rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 shadow-sm text-[14px] font-medium text-slate-400 dark:text-slate-500 outline-none cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {/* Telephone */}
                      <div className="space-y-1.5 flex-1">
                        <label className="text-[14px] font-medium text-slate-500 ml-1">Số điện thoại <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 z-10">call</span>
                          <input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Hotline bệnh viện"
                            className={`w-full pl-11 pr-4 h-[42px] rounded-lg border ${formErrors.phone ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                          />
                        </div>
                        {formErrors.phone && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.phone}</p>}
                      </div>

                      {/* Address */}
                      <div className="lg:col-span-2 space-y-1.5">
                        <label className="text-[14px] font-medium text-slate-500 ml-1">Địa chỉ chi tiết <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 z-10">location_on</span>
                          <input
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Số nhà, đường, phường, thành phố"
                            className={`w-full pl-11 pr-4 h-[42px] rounded-lg border ${formErrors.address ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                          />
                        </div>
                        {formErrors.address && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.address}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Account Information & Status */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 ml-1">
                    <div className="text-slate-400 dark:text-slate-500 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">manage_accounts</span>
                    </div>
                    <h3 className="font-medium text-slate-500 dark:text-slate-100 text-[15px] italic-none ml-1">Trạng thái & Quản trị</h3>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 lg:p-5 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-5">

                    {/* Status Toggle */}
                    <div className="space-y-1.5 lg:col-span-2">
                      <label className="text-[14px] font-medium text-slate-500 ml-1">Trạng thái hoạt động</label>
                      <div className="flex gap-2 w-full lg:w-2/3">
                        {['ACTIVE', 'INACTIVE'].map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setFormData({ ...formData, status })}
                            className={`flex-1 py-2 rounded-xl border font-medium text-sm transition-all focus:outline-none ${formData.status === status
                              ? status === 'ACTIVE'
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                : 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20'
                              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 text-slate-500 hover:border-slate-400'
                              }`}
                          >
                            {status === 'ACTIVE' ? 'Hoạt động bình thường' : 'Ngưng hoạt động'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Admin Name */}
                    <div className="space-y-1.5 flex-1">
                      <label className="text-[14px] font-medium text-slate-500 ml-1">Họ và tên người quản lý</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 z-10">person</span>
                        <input
                          name="adminFullName"
                          value={formData.adminFullName}
                          onChange={handleChange}
                          placeholder="Nguyễn Văn A"
                          className="w-full pl-11 pr-4 h-[42px] rounded-lg border border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-[14px] font-medium text-slate-500 ml-1">Email đăng nhập</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 z-10">mail</span>
                        <input
                          name="adminEmail"
                          value={formData.adminEmail}
                          onChange={handleChange}
                          placeholder="admin@phongkham.com"
                          className="w-full pl-11 pr-4 h-[42px] rounded-lg border border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all"
                        />
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
                  className="px-6 py-2.5 text-[14px] font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
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
                      <span className="material-symbols-outlined text-[20px]">edit_note</span>
                      <span>Lưu thay đổi</span>
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

export default EditClinicModal;
