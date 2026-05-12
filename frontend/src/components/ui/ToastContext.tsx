import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// --- Types ---
export type ToastType = 'success' | 'error' | 'warning';

export interface ToastData {
  id: string;
  title: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (title: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

// --- Context ---
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// --- Individual Toast Item ---
const ToastItem: React.FC<{
  title: string;
  type: ToastType;
  onClose: () => void;
}> = ({ title, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, []); // Only run once on mount to prevent timer reset when other toasts are added

  const config = {
    success: {
      bg: 'bg-emerald-500/5',
      border: 'border-emerald-500/50',
      iconBg: 'bg-emerald-500',
      icon: 'check_circle',
      text: 'text-emerald-600 dark:text-emerald-400',
      progress: 'bg-emerald-500'
    },
    error: {
      bg: 'bg-red-500/5',
      border: 'border-red-500/50',
      iconBg: 'bg-red-500',
      icon: 'error',
      text: 'text-red-600 dark:text-red-400',
      progress: 'bg-red-500'
    },
    warning: {
      bg: 'bg-amber-500/5',
      border: 'border-amber-500/50',
      iconBg: 'bg-amber-500',
      icon: 'warning',
      text: 'text-amber-600 dark:text-amber-400',
      progress: 'bg-amber-500'
    }
  }[type];

  return (
    <div className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border ${config.border} shadow-2xl rounded-2xl p-0.5 overflow-hidden w-fit min-w-[320px] max-w-[450px]`}>
        <div className={`px-6 py-4 flex items-center gap-4 ${config.bg}`}>
          <div className={`w-10 h-10 ${config.iconBg} text-white rounded-xl flex items-center justify-center shadow-lg shadow-${type === 'success' ? 'emerald' : type === 'error' ? 'red' : 'amber'}-500/20`}>
            <span className="material-symbols-outlined font-extrabold text-2xl">{config.icon}</span>
          </div>
          <div className="flex-1 text-left">
            <p className={`text-[15px] md:text-[16px] font-medium ${config.text} tracking-tight leading-relaxed`}>{title}</p>
          </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all active:scale-90">
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
      <div className="h-1 bg-slate-100 dark:bg-slate-800 w-full overflow-hidden">
        <div 
          className={`h-full ${config.progress} origin-left`}
          style={{ animation: 'toast-progress 4s linear forwards' }}
        ></div>
      </div>
      <style>{`
        @keyframes toast-progress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
};

// --- Toast Container ---
const ToastContainer: React.FC<{
  toasts: ToastData[];
  onRemove: (id: string) => void;
}> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-6 right-6 z-[3000] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="pointer-events-auto"
          >
            <ToastItem
              title={toast.title}
              type={toast.type}
              onClose={() => onRemove(toast.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// --- Provider & Hook ---
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const lastToastRef = useRef<{ title: string, time: number } | null>(null);

  const showToast = useCallback((title: string, type: ToastType = 'success') => {
    const now = Date.now();
    // Prevent duplicates within 300ms
    if (lastToastRef.current && lastToastRef.current.title === title && (now - lastToastRef.current.time < 300)) {
      return;
    }
    lastToastRef.current = { title, time: now };

    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};


export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
