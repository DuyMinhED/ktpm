import React, { useEffect } from 'react';

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
  patientAvatar
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

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] transition-all duration-300"
        onClick={onClose}
      ></div>

      <div className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 border border-primary/10 transition-all max-h-[90vh]">
        <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-20 font-display">
          <h2 className="text-[20px] font-medium text-slate-900 dark:text-white leading-tight">Gửi lời khuyên sức khỏe</h2>
        </div>

        {/* Advice Content Area */}
        <div className="p-6 md:p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-900">
          {/* Patient Profile Banner - Responsive Stack */}
          <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 p-5 md:p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-slate-200 overflow-hidden shadow-inner flex-shrink-0 border-2 border-primary/20 relative z-10"
              style={{ backgroundImage: `url('${patientAvatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuBUstbGh5q911TPTLus7gX2RIO2ML_RSZbjV67EFkDBw0zf6vQQzS7IP3LwXkWI6OWS4mwx5KhEFyn-NJ5T-OeMOhMLb321T1uEw1ypz_mfVSy4RJSGZA4h5NHgwDOx8syKTRjqsnQ5cRRZlRIs0lxo8cA7nJHIBpBUgVAUxh3e6QkBpGR5iW1WaEsU3Xu5JdVd5WA_HjKsBFimtKG_GF5CgYz-JAa03FTdaPVVyoP_Kqd8-PCCC03jKnqOMbqTRYOC5StfAJMV2wM"}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            </div>
            <div className="relative z-10 flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <p className="font-extrabold text-slate-900 dark:text-white text-lg">{patientName}</p>
                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold rounded-md">65 tuổi</span>
              </div>
              <p className="text-[10px] md:text-xs text-slate-500 font-bold tracking-wide opacity-70">BN quản lý thường trực • ID: BN-123456</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            {/* Left side: Category Selection */}
            <div className="space-y-4">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">category</span>
                Chọn nhóm tư vấn
              </label>
              <div className="grid grid-cols-2 gap-3">
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
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 underline decoration-primary/30 underline-offset-4">
                <span className="material-symbols-outlined text-primary text-lg">edit_note</span>
                Lời khuyên từ bác sĩ
              </label>
              <div className="relative group">
                <textarea
                  className="w-full rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary min-h-[160px] p-6 outline-none transition-all shadow-sm resize-none group-hover:bg-white dark:group-hover:bg-slate-800"
                  placeholder="BS nhập lời khuyên chi tiết..."
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
              {[
                { text: 'Hạn chế muối trong thức ăn', icon: 'restaurant' },
                { text: 'Đi bộ 30 phút mỗi ngày', icon: 'directions_walk' },
                { text: 'Theo dõi huyết áp hàng ngày', icon: 'monitor_heart' },
                { text: 'Uống đủ 2L nước mỗi ngày', icon: 'water_drop' },
                { text: 'Tránh các chất kích thích', icon: 'smoke_free' }
              ].map((template, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAdviceContent(prev => prev ? prev + ', ' + template.text : template.text)}
                  className="px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-primary text-slate-600 dark:text-slate-400 hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm opacity-70">{template.icon}</span>
                  {template.text}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Premium Footer */}
        <div className="px-8 py-6 bg-slate-50 dark:bg-slate-900/50 flex gap-4 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 z-20">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            type="button"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex-[1.8] py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-extrabold text-sm shadow-xl shadow-primary/25 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-wait"
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
    </div>
  );
};

export default AdviceModal;
