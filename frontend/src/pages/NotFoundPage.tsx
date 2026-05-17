import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 font-display">
      <div className="text-center max-w-md">
        {/* Animated 404 number */}
        <div className="relative mb-8">
          <h1 className="text-[160px] font-black text-slate-100 dark:text-slate-900 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#0891B2] to-[#059669] rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 animate-bounce">
              <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                search_off
              </span>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
          Không tìm thấy trang
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển sang địa chỉ khác.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-semibold transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Quay lại
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#0891B2] to-[#059669] text-white rounded-xl hover:opacity-90 text-sm font-semibold transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-lg">home</span>
            Trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
