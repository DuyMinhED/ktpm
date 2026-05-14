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

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  isSaving: boolean;
}

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isSaving,
}) => {
  const [formData, setFormData] = useState({
    subject: '',
    category: 'Kỹ thuật',
    priority: 'Trung bình',
    message: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setFormErrors({});
      setFormData({
        subject: '',
        category: 'Kỹ thuật',
        priority: 'Trung bình',
        message: ''
      });
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

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.subject.trim()) errors.subject = 'Vui lòng nhập tiêu đề yêu cầu';
    if (!formData.message.trim()) errors.message = 'Vui lòng nhập nội dung chi tiết';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const categories = ['Kỹ thuật', 'Hỗ trợ nghiệp vụ', 'Hạ tầng', 'Hệ thống', 'Yêu cầu tính năng', 'Khác'];
  const priorities = ['Khẩn cấp', 'Cao', 'Trung bình', 'Thấp'];

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
            className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200 dark:border-slate-800 italic-none"
          >
            <div className="px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20 transition-all italic-none">
              <h2 className="text-[20px] font-medium text-slate-900 dark:text-white leading-tight italic-none">
                Tạo yêu cầu hỗ trợ mới
              </h2>
            </div>

            {/* Form Body */}
            <div className="px-6 md:px-8 pt-3 pb-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-900/50 text-left">
              <div className="space-y-6 italic-none">
                
                {/* Section Header */}
                <div className="space-y-3 pt-3">
                  <div className="flex items-center pb-1">
                    <h3 className="font-medium text-slate-500 dark:text-slate-100 text-[15px] italic-none ml-1">Nội dung hỗ trợ</h3>
                  </div>

                  {/* Information Card - "Clinic Style" */}
                  <div className="bg-white dark:bg-slate-900 p-5 lg:p-6 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm space-y-5">
                    
                    {/* Subject */}
                    <div className="space-y-1.5 italic-none">
                      <label className="text-[14px] font-medium text-slate-500 ml-1 italic-none">Tiêu đề yêu cầu <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 z-10 pointer-events-none">subject</span>
                        <input
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          placeholder="Ví dụ: Lỗi không xuất được báo cáo..."
                          className={`w-full pl-11 pr-4 h-[42px] rounded-lg border ${formErrors.subject ? 'border-red-500/50 shadow-sm shadow-red-500/10' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all mb-1`}
                        />
                      </div>
                      {formErrors.subject && <p className="text-[11px] font-bold text-red-500 ml-1">{formErrors.subject}</p>}
                    </div>

                    {/* Category & Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 italic-none">
                      <div className="space-y-1.5 italic-none">
                        <label className="text-[14px] font-medium text-slate-500 ml-1 italic-none">Danh mục</label>
                        <Dropdown
                          options={categories}
                          value={formData.category}
                          onChange={(val) => setFormData(p => ({ ...p, category: val }))}
                          icon={<span className="material-symbols-outlined text-[20px] text-slate-400">category</span>}
                        />
                      </div>
                      <div className="space-y-1.5 italic-none">
                        <label className="text-[14px] font-medium text-slate-500 ml-1 italic-none">Độ ưu tiên</label>
                        <Dropdown
                          options={priorities}
                          value={formData.priority}
                          onChange={(val) => setFormData(p => ({ ...p, priority: val }))}
                          icon={<span className="material-symbols-outlined text-[20px] text-slate-400">priority_high</span>}
                        />
                      </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-1.5 pt-2 italic-none">
                      <label className="text-[14px] font-medium text-slate-500 ml-1 italic-none">Nội dung chi tiết <span className="text-red-500">*</span></label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={5}
                        placeholder="Mô tả cụ thể vấn đề hoặc yêu cầu tính năng..."
                        className={`w-full px-4 py-3 rounded-lg border ${formErrors.message ? 'border-red-500/50 shadow-sm shadow-red-500/10' : 'border-slate-400 dark:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all resize-none mb-1`}
                      />
                      {formErrors.message && <p className="text-[11px] font-bold text-red-500 ml-1">{formErrors.message}</p>}
                    </div>
                  </div>
                </div>

                {/* Important Notice */}
                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200/50 dark:border-amber-900/20 flex gap-3 italic-none">
                  <span className="material-symbols-outlined text-amber-500 text-[20px] shrink-0">info</span>
                  <p className="text-[13px] text-amber-700 dark:text-amber-400 font-medium leading-relaxed italic-none">
                    Yêu cầu <span className="font-bold uppercase tracking-tight">Khẩn cấp</span> sẽ được đội ngũ kỹ thuật phản hồi trong vòng tối đa 15 phút. Vui lòng mô tả chi tiết để được xử lý nhanh nhất.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 md:px-8 py-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end rounded-b-3xl italic-none">
              <div className="flex items-center gap-3 w-full md:w-auto justify-end px-1 italic-none">
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
                      <span>Đang gửi...</span>
                    </>
                  ) : (
                    <>
                      <span>Gửi yêu cầu hỗ trợ</span>
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

export default CreateTicketModal;
