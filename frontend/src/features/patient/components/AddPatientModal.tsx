import { useState, useEffect } from 'react';
import Dropdown from '../../../components/ui/Dropdown';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (patientData: any) => void;
  isSaving?: boolean;
}

export default function AddPatientModal({ isOpen, onClose, onAdd, isSaving = false }: AddPatientModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    dob: '',
    gender: 'Nam',
    diseaseGroup: 'Tiểu đường',
    riskLevel: 'Bình thường',
    diagnosis: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = 'Bắt buộc';
    if (!formData.email) newErrors.email = 'Bắt buộc';
    if (!formData.password) newErrors.password = 'Bắt buộc';
    if (!formData.phone) newErrors.phone = 'Bắt buộc';
    if (!formData.dob) newErrors.dob = 'Bắt buộc';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onAdd(formData);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[field];
        return newErrs;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 font-display">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] transition-all duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in duration-300 border border-slate-200 dark:border-slate-800 transition-all">

        {/* Header */}
        <div className="px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-20 rounded-t-3xl">
          <h2 className="text-[20px] font-semibold text-slate-800 dark:text-white tracking-tight leading-tight">Thêm bệnh nhân mới</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors">
            <span className="material-symbols-outlined font-medium">close</span>
          </button>
        </div>

        {/* Content: 3-column Grid for Width Optimization */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white dark:bg-slate-900/50 custom-scrollbar text-left pb-12">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* ROW 1: ID, NAME, DOB */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Mã bệnh nhân</label>
              <input
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400 cursor-not-allowed px-4 py-2.5 outline-none font-medium"
                disabled
                placeholder="BN-2024-XXXX"
                type="text"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Họ và tên <span className="text-red-500">*</span></label>
              <input
                className={`rounded-xl border ${errors.fullName ? 'border-red-500 bg-red-50/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'} text-slate-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium`}
                placeholder="Nhập họ và tên đầy đủ"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
              />
              {errors.fullName && <p className="text-[12px] text-red-500 font-bold ml-1">{errors.fullName}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Ngày sinh <span className="text-red-500">*</span></label>
              <input
                className={`rounded-xl border ${errors.dob ? 'border-red-500 bg-red-50/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'} text-slate-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium`}
                type="date"
                value={formData.dob}
                onChange={(e) => handleChange('dob', e.target.value)}
              />
              {errors.dob && <p className="text-[12px] text-red-500 font-bold ml-1">{errors.dob}</p>}
            </div>

            {/* ROW 2: PHONE, GENDER, DISEASE */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Số điện thoại <span className="text-red-500">*</span></label>
              <input
                className={`rounded-xl border ${errors.phone ? 'border-red-500 bg-red-50/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'} text-slate-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium`}
                placeholder="0xxx xxx xxx"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
              {errors.phone && <p className="text-[12px] text-red-500 font-bold ml-1">{errors.phone}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Giới tính</label>
              <div className="flex gap-4 items-center h-[46px]">
                {['Nam', 'Nữ', 'Khác'].map((g) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      className="w-4 h-4 text-primary focus:ring-primary bg-white dark:bg-slate-800 border-slate-300"
                      name="gender"
                      type="radio"
                      checked={formData.gender === g}
                      onChange={() => handleChange('gender', g)}
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white font-medium">{g}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nhóm bệnh</label>
              <Dropdown
                options={['Tiểu đường', 'Cao huyết áp', 'Tim mạch', 'Hô hấp', 'Khác']}
                value={formData.diseaseGroup}
                onChange={(val) => handleChange('diseaseGroup', val)}
                className="w-full"
              />
            </div>

            {/* ACCOUNT SECTION: STANDS OUT (2 Cols wide + 1 helper/placeholder) */}
            <div className="md:col-span-3 h-[2px] bg-slate-100 dark:bg-slate-800 my-2"></div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-blue-600 dark:text-blue-400">Tên đăng nhập (Email) <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 text-sm">alternate_email</span>
                <input
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${errors.email ? 'border-red-500' : 'border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10'} text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-bold`}
                  placeholder="benhnhan@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>
              {errors.email && <p className="text-[12px] text-red-500 font-bold ml-1">{errors.email}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-blue-600 dark:text-blue-400">Mật khẩu khởi tạo <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 text-sm">lock</span>
                <input
                  className={`w-full pl-10 pr-12 py-2.5 rounded-xl border ${errors.password ? 'border-red-500' : 'border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10'} text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-bold tracking-widest`}
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                >
                  <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {errors.password && <p className="text-[12px] text-red-500 font-bold ml-1">{errors.password}</p>}
            </div>

            <div className="flex flex-col gap-2 pb-2 justify-end">
              <p className="text-[13px] text-slate-500 italic font-medium leading-relaxed">Bác sĩ cung cấp thông tin này để bệnh nhân có thể truy cập hệ thống.</p>
            </div>

            {/* RISK LEVEL FROM HTML: Segmented control */}
            <div className="md:col-span-3 flex flex-col gap-3">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Mức độ rủi ro ban đầu</label>
              <div className="flex flex-wrap p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                {['Bình thường', 'Cần theo dõi', 'Nguy cơ cao'].map((r) => (
                  <label key={r} className="flex-1 min-w-[120px]">
                    <input
                      className="sr-only peer"
                      name="risk"
                      type="radio"
                      checked={formData.riskLevel === r}
                      onChange={() => handleChange('riskLevel', r)}
                    />
                    <div className={`flex items-center justify-center py-2.5 text-[14px] font-extrabold rounded-lg cursor-pointer transition-all peer-checked:bg-white dark:peer-checked:bg-slate-700 peer-checked:shadow-sm ${r === 'Bình thường' ? 'peer-checked:text-emerald-500' :
                      r === 'Cần theo dõi' ? 'peer-checked:text-orange-500' : 'peer-checked:text-red-500'
                      } text-slate-500`}>
                      {r}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* DIAGNOSIS */}
            <div className="md:col-span-3 flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Chẩn đoán ban đầu / Ghi chú</label>
              <textarea
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none font-medium h-24"
                placeholder="Nhập nội dung chẩn đoán hoặc ghi chú quan trọng..."
                value={formData.diagnosis}
                onChange={(e) => handleChange('diagnosis', e.target.value)}
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 md:px-8 py-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-4 rounded-b-3xl sticky bottom-0 z-20">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 font-bold transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-8 py-2.5 text-[14px] font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-xl shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Đang xử lý...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                Thêm bệnh nhân
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
