import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface AdviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  adviceCategory: string;
  setAdviceCategory: React.Dispatch<React.SetStateAction<string>>;
  adviceContent: string;
  setAdviceContent: React.Dispatch<React.SetStateAction<string>>;
  isSaving: boolean;
  onSave: () => Promise<void>;
  patientName: string;
  patientAvatar?: string;
  patientData?: any;
}

const AdviceModal: React.FC<AdviceModalProps> = ({
  isOpen,
  onClose,
  adviceCategory,
  setAdviceCategory,
  adviceContent,
  setAdviceContent,
  isSaving,
  onSave,
  patientName,
  patientAvatar,
  patientData
}) => {
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

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] transition-all duration-300"
        onClick={onClose}
      ></div>

      <div className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 border border-slate-200 dark:border-slate-800 transition-all max-h-[90vh]">
        <div className="px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-20 font-display">
          <h2 className="text-[20px] font-medium text-slate-900 dark:text-white leading-tight">Gửi lời khuyên sức khỏe</h2>
        </div>

        {/* Advice Content Area */}
        <div className="px-6 md:px-8 pt-3 pb-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-900/50 space-y-8">
          {/* Patient Profile Banner - Responsive Stack */}
          <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-6 p-5 md:p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>

            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 md:gap-5 relative z-10 w-full md:w-auto text-left">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-slate-200 overflow-hidden shadow-inner flex-shrink-0 border-2 border-primary/20"
                style={{ backgroundImage: `url('${patientAvatar || patientData?.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuBUstbGh5q911TPTLus7gX2RIO2ML_RSZbjV67EFkDBw0zf6vQQzS7IP3LwXkWI6OWS4mwx5KhEFyn-NJ5T-OeMOhMLb321T1uEw1ypz_mfVSy4RJSGZA4h5NHgwDOx8syKTRjqsnQ5cRRZlRIs0lxo8cA7nJHIBpBUgVAUxh3e6QkBpGR5iW1WaEsU3Xu5JdVd5WA_HjKsBFimtKG_GF5CgYz-JAa03FTdaPVVyoP_Kqd8-PCCC03jKnqOMbqTRYOC5StfAJMV2wM"}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <p className="font-bold text-slate-700 dark:text-white text-lg whitespace-nowrap">{patientName}</p>
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[13px] font-bold rounded-md whitespace-nowrap">{patientData?.age ? `${patientData.age} tuổi` : 'Chưa cập nhật'}</span>
                  {patientData?.gender && (
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[13px] font-bold rounded-md">
                      {patientData.gender === 'MALE' ? 'Nam' : patientData.gender === 'FEMALE' ? 'Nữ' : patientData.gender}
                    </span>
                  )}
                  {patientData?.riskLevel && (
                    <span className={`px-2 py-0.5 text-[13px] font-bold rounded-md ${(() => {
                      let label = patientData.riskLevel;
                      if (label === 'HIGH_RISK') label = 'Nguy cơ cao';
                      else if (label === 'MONITORING') label = 'Theo dõi';
                      else if (label === 'STABLE') label = 'Ổn định';
                      label = label.replace(/\([^)]*\)/g, '').trim();

                      if (label.includes('Nguy cơ cao')) return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
                      if (label.includes('Theo dõi')) return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
                      return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400';
                    })()}`}>
                      {(() => {
                        let label = patientData.riskLevel;
                        if (label === 'HIGH_RISK') label = 'Nguy cơ cao';
                        else if (label === 'MONITORING') label = 'Theo dõi';
                        else if (label === 'STABLE') label = 'Ổn định';
                        return label.replace(/\([^)]*\)/g, '').trim();
                      })()}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  {patientData?.chronicCondition && (
                    <p className="text-[13px] text-slate-700 dark:text-slate-300 font-bold">
                      <span className="material-symbols-outlined text-[15px] text-primary align-middle mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>medical_information</span>
                      {patientData.chronicCondition}
                    </p>
                  )}
                  <p className="text-[13px] text-slate-500 font-medium">
                    {patientData?.treatmentStatus || 'BN quản lý thường trực'} - Mã bệnh nhân: {patientData?.patientCode || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>
            </div>

            {/* Vitals Section - Right Side */}
            {patientData && (
              <div className="relative z-10 flex gap-4 md:gap-6 text-center md:text-right w-full md:w-auto justify-center md:justify-end md:mr-4 shrink-0">
                <div className="flex flex-col items-center md:items-end">
                  <p className="text-[14px] text-slate-600 font-medium mb-1 whitespace-nowrap">Huyết áp</p>
                  <p className="text-[15px] font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                    {patientData.latestBp ? `${String(patientData.latestBp).replace(' mmHg', '')} mmHg` : 'N/A'}
                  </p>
                </div>
                <div className="w-px h-10 bg-slate-200 dark:bg-slate-700/50 hidden md:block self-center"></div>
                <div className="flex flex-col items-center md:items-end">
                  <p className="text-[14px] text-slate-600 font-medium mb-1 whitespace-nowrap">Đường huyết</p>
                  <p className="text-[15px] font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">
                    {patientData.latestGlucose ? `${String(patientData.latestGlucose).replace(' mmol/L', '')} mmol/L` : 'N/A'}
                  </p>
                </div>
                <div className="w-px h-10 bg-slate-200 dark:bg-slate-700/50 hidden md:block self-center"></div>
                <div className="flex flex-col items-center md:items-end">
                  <p className="text-[14px] text-slate-600 font-medium mb-1 whitespace-nowrap">Nhịp tim</p>
                  <p className="text-[15px] font-bold text-primary whitespace-nowrap">
                    {patientData.latestHeartRate ? `${String(patientData.latestHeartRate).replace(' bpm', '')} bpm` : 'N/A'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            {/* Left side: Category Selection */}
            <div className="space-y-4">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">category</span>
                Chọn nhóm tư vấn
              </label>
              <div className="grid grid-cols-2 gap-3 text-left">
                {[
                  { icon: 'restaurant', label: 'Dinh dưỡng' },
                  { icon: 'fitness_center', label: 'Vận động' },
                  { icon: 'pill', label: 'Dùng thuốc' },
                  { icon: 'monitoring', label: 'Theo dõi' }
                ].map((cat, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAdviceCategory(cat.label)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${adviceCategory === cat.label
                      ? 'bg-primary/5 text-primary border-primary ring-1 ring-primary shadow-md scale-[1.02]'
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-primary/30 text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                  >
                    <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
                    <span className="text-[13px] font-bold leading-none">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right side: Advice Content */}
            <div className="space-y-4 text-left">
              <label className="text-sm font-bold text-slate-600 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">edit_note</span>
                Lời khuyên từ bác sĩ
              </label>
              <div className="relative group text-left">
                <textarea
                  className="w-full rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary min-h-[160px] p-6 outline-none transition-all shadow-sm resize-none group-hover:bg-white dark:group-hover:bg-slate-800"
                  placeholder="Bác sĩ nhập lời khuyên chi tiết..."
                  value={adviceContent}
                  onChange={(e) => setAdviceContent(e.target.value)}
                ></textarea>
                <div className="absolute bottom-4 right-4 text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800">
                  {adviceContent.length} / 500
                </div>
              </div>
            </div>
          </div>

          {/* Suggestions Section */}
          <div className="space-y-4 text-left">
            <p className="text-[14px] font-semibold text-slate-700 dark:text-slate-100 pl-1">Gợi ý mẫu tư vấn nhanh</p>
            <div className="flex flex-wrap gap-3">
              {(() => {
                const templatesByCategory: Record<string, { text: string, icon: string }[]> = {
                  'Dinh dưỡng': [
                    { text: 'Hạn chế muối và gia vị mặn', icon: 'restaurant' },
                    { text: 'Uống đủ 2L nước mỗi ngày', icon: 'water_drop' },
                    { text: 'Tránh các chất kích thích, rượu bia', icon: 'smoke_free' },
                    { text: 'Hạn chế đồ ngọt và tinh bột', icon: 'bakery_dining' },
                  ],
                  'Vận động': [
                    { text: 'Đi bộ nhẹ nhàng 30 phút/ngày', icon: 'directions_walk' },
                    { text: 'Tập thể dục ít nhất 3 lần/tuần', icon: 'fitness_center' },
                    { text: 'Tránh vận động quá sức', icon: 'warning' },
                    { text: 'Khởi động kỹ trước khi tập', icon: 'sports_gymnastics' },
                  ],
                  'Dùng thuốc': [
                    { text: 'Uống thuốc đúng giờ, đúng liều', icon: 'pill' },
                    { text: 'Không tự ý ngưng hoặc đổi thuốc', icon: 'do_not_disturb_on' },
                    { text: 'Uống thuốc sau khi ăn no', icon: 'restaurant' },
                  ],
                  'Theo dõi': [
                    { text: 'Theo dõi huyết áp hàng ngày', icon: 'monitor_heart' },
                    { text: 'Kiểm tra đường huyết thường xuyên', icon: 'bloodtype' },
                    { text: 'Tái khám đúng hẹn', icon: 'event' },
                    { text: 'Ghi chép lại các chỉ số bất thường', icon: 'edit_document' },
                  ]
                };

                const currentTemplates = templatesByCategory[adviceCategory] || templatesByCategory['Theo dõi'];
                return currentTemplates.map((template, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAdviceContent(prev => prev ? prev + ', ' + template.text : template.text)}
                    className="px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-primary text-slate-600 dark:text-slate-400 hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px] opacity-70">{template.icon}</span>
                    {template.text}
                  </button>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* Premium Footer */}
        <div className="px-6 md:px-8 py-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-4 rounded-b-3xl sticky bottom-0 z-20 text-left">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            type="button"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex-[1.8] py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-extrabold text-sm shadow-lg shadow-primary/25 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-wait"
            type="button"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Đang gửi...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined font-bold">send</span>
                Gửi tư vấn đến bệnh nhân
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AdviceModal;
