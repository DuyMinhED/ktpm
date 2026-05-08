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

interface CreateServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSaving: boolean;
  onSave: (serviceData: any) => Promise<void>;
  initialData?: any;
  existingCategories?: string[];
}

const CreateServiceModal: React.FC<CreateServiceModalProps> = ({
  isOpen,
  onClose,
  isSaving,
  onSave,
  initialData,
  existingCategories = [],
}) => {
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Gói điều trị',
    price: '',
    duration: '',
    description: '',
    features: [''],
    status: 'Đang kinh doanh',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setFormErrors({});
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          category: initialData.category || 'Gói điều trị',
          price: initialData.price || '',
          duration: initialData.duration || '',
          description: initialData.description || '',
          features: initialData.features && initialData.features.length > 0 ? initialData.features : [''],
          status: initialData.status || 'Đang kinh doanh',
        });
      } else {
        setFormData({
          name: '',
          category: 'Gói điều trị',
          price: '',
          duration: '',
          description: '',
          features: [''],
          status: 'Đang kinh doanh',
        });
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const addFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
  };

  const removeFeature = (index: number) => {
    if (formData.features.length > 1) {
      const newFeatures = formData.features.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, features: newFeatures }));
    }
  };



  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = 'Vui lòng nhập tên dịch vụ';
    if (!formData.price.trim()) errors.price = 'Vui lòng nhập giá dịch vụ';
    if (!formData.duration.trim()) errors.duration = 'Vui lòng nhập thời hạn';

    const validFeatures = formData.features.filter(f => f.trim() !== '');
    if (validFeatures.length === 0) errors.features = 'Vui lòng nhập ít nhất một đặc điểm dịch vụ';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave({
        ...formData,
        features: formData.features.filter(f => f.trim() !== '')
      });
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
            className="relative bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200 dark:border-slate-800 italic-none"
          >
            <div className="px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20">
              <h2 className="text-[20px] font-medium text-slate-900 dark:text-white leading-tight">
                {initialData ? 'Cập nhật dịch vụ' : 'Thiết lập dịch vụ mới'}
              </h2>
            </div>

            {/* Form Body */}
            <div className="px-6 md:px-8 pt-3 pb-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-900/50 text-left">
              <div className="space-y-6">
                {/* Section 1: Basic Information */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 ml-1">
                    <div className="text-slate-400 dark:text-slate-500 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">category</span>
                    </div>
                    <h3 className="font-medium text-slate-500 dark:text-slate-100 text-[15px] italic-none ml-1">Thông tin cơ bản</h3>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 lg:p-5 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-3">


                      {/* Service Name */}
                      <div className="lg:col-span-2 space-y-1.5">
                        <label className="text-[14px] font-medium text-slate-500 ml-1">Tên dịch vụ/Gói khám <span className="text-red-500">*</span></label>
                        <div className="relative group">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-500 z-10 pointer-events-none group-focus-within:text-primary transition-colors">medical_services</span>
                          <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Nhập tên dịch vụ"
                            className={`w-full pl-11 pr-4 h-[42px] rounded-lg border ${formErrors.name ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                          />
                        </div>
                        {formErrors.name && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.name}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center ml-1">
                          <label className="text-[14px] font-medium text-slate-500">Danh mục</label>
                          <button 
                            type="button"
                            onClick={() => setIsNewCategory(!isNewCategory)}
                            className="text-[11px] font-bold text-primary hover:underline"
                          >
                            {isNewCategory ? 'Chọn mục có sẵn' : 'Thêm mục mới'}
                          </button>
                        </div>
                        {isNewCategory ? (
                          <div className="relative group">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-500 z-10 pointer-events-none group-focus-within:text-primary transition-colors">add_circle</span>
                            <input
                              name="category"
                              value={formData.category}
                              onChange={handleChange}
                              placeholder="Nhập danh mục mới"
                              className="w-full pl-11 pr-4 h-[42px] rounded-lg border border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary transition-all"
                            />
                          </div>
                        ) : (
                          <Dropdown
                            options={existingCategories.length > 0 ? existingCategories : ['Gói điều trị', 'Tư vấn online', 'Dịch vụ tại nhà', 'Xét nghiệm']}
                            value={formData.category}
                            onChange={(val) => setFormData(p => ({ ...p, category: val }))}
                            icon={<span className="material-symbols-outlined text-[20px] text-slate-400">inventory_2</span>}
                          />
                        )}
                      </div>

                      {/* Price */}
                      <div className="space-y-1.5">
                        <label className="text-[14px] font-medium text-slate-500 ml-1">Giá niêm yết <span className="text-red-500">*</span></label>
                        <div className="relative group">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-500 z-10 pointer-events-none group-focus-within:text-primary transition-colors">payments</span>
                          <input
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            placeholder="VNĐ"
                            className={`w-full pl-11 pr-4 h-[42px] rounded-lg border ${formErrors.price ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                          />
                        </div>
                        {formErrors.price && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.price}</p>}
                      </div>

                      {/* Duration */}
                      <div className="space-y-1.5">
                        <label className="text-[14px] font-medium text-slate-500 ml-1">Thời hạn/Đơn vị <span className="text-red-500">*</span></label>
                        <div className="relative group">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-500 z-10 pointer-events-none group-focus-within:text-primary transition-colors">schedule</span>
                          <input
                            name="duration"
                            value={formData.duration}
                            onChange={handleChange}
                            placeholder="VD: 6 tháng, Mỗi lần..."
                            className={`w-full pl-11 pr-4 h-[42px] rounded-lg border ${formErrors.duration ? 'border-red-500/50' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all`}
                          />
                        </div>
                        {formErrors.duration && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.duration}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[14px] font-medium text-slate-500 ml-1">Trạng thái kinh doanh</label>
                        <Dropdown
                          options={['Đang kinh doanh', 'Ngừng kinh doanh']}
                          value={formData.status}
                          onChange={(val) => setFormData(p => ({ ...p, status: val }))}
                          icon={<span className="material-symbols-outlined text-[20px] text-slate-400">check_circle</span>}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Features & Description */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 ml-1">
                    <div className="text-slate-400 dark:text-slate-500 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">verified</span>
                    </div>
                    <h3 className="font-medium text-slate-500 dark:text-slate-100 text-[15px] italic-none ml-1">Đặc điểm & Mô tả phúc lợi</h3>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 lg:p-5 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm space-y-4">
                    {/* Features List */}
                    <div className="space-y-2">
                      <label className="text-[14px] font-medium text-slate-500 ml-1">Danh sách đặc điểm chính <span className="text-red-500">*</span></label>
                      <div className="space-y-2">
                        {formData.features.map((feature, idx) => (
                          <div key={idx} className="flex gap-2">
                            <div className="relative flex-1 group">
                              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[18px] text-slate-500 font-bold z-10 pointer-events-none group-focus-within:text-primary transition-colors">check</span>
                              <input
                                value={feature}
                                onChange={(e) => handleFeatureChange(idx, e.target.value)}
                                placeholder="Nhập phúc lợi dịch vụ..."
                                className="w-full pl-11 pr-4 h-[40px] rounded-lg border border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 text-[13.5px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary transition-all"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFeature(idx)}
                              className="w-[40px] h-[40px] flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={addFeature}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-primary hover:bg-primary/5 rounded-lg transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        Thêm đặc điểm
                      </button>
                      {formErrors.features && <p className="text-[11px] font-bold text-red-500 ml-1 mt-1">{formErrors.features}</p>}
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5 pt-2">
                      <label className="text-[14px] font-medium text-slate-500 ml-1">Mô tả chi tiết</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Mô tả thêm về các quy trình kỹ thuật hoặc lưu ý cho bệnh nhân..."
                        className="w-full px-4 py-3 rounded-lg border border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary transition-all resize-none"
                      />
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
                  className="px-6 py-2.5 text-[14px] font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
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
                      <span className="material-symbols-outlined text-[20px]">{initialData ? 'save_as' : 'post_add'}</span>
                      <span>{initialData ? 'Lưu thay đổi' : 'Kích hoạt dịch vụ'}</span>
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

export default CreateServiceModal;
