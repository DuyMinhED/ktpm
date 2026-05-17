interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  isLoading?: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận xóa',
  message = 'Bạn có chắc chắn muốn xóa? Hành động này không thể hoàn tác.',
  itemName,
  isLoading = false,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
        <div className="p-6 text-center">
          {/* Warning Icon */}
          <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-red-500 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              warning
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
          
          {itemName && (
            <div className="mb-3 px-4 py-2 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20">
              <p className="text-sm font-semibold text-red-600 dark:text-red-400 truncate">{itemName}</p>
            </div>
          )}

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{message}</p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              Không, giữ lại
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">delete</span>
                  Xóa
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
