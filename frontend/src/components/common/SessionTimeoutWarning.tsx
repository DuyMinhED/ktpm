import { useState, useEffect, useCallback } from 'react';

/**
 * Monitors JWT token expiration and shows a warning modal
 * 5 minutes before the session expires.
 */
export default function SessionTimeoutWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const getTokenExpiry = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? payload.exp * 1000 : null; // Convert to ms
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const checkExpiry = () => {
      const expiry = getTokenExpiry();
      if (!expiry) {
        setShowWarning(false);
        return;
      }

      const now = Date.now();
      const remaining = expiry - now;
      const FIVE_MINUTES = 5 * 60 * 1000;

      if (remaining <= 0) {
        // Already expired - logout
        localStorage.clear();
        window.location.href = '/?action=login';
        return;
      }

      if (remaining <= FIVE_MINUTES) {
        setShowWarning(true);
        setTimeLeft(Math.ceil(remaining / 1000));
      } else {
        setShowWarning(false);
      }
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [getTokenExpiry]);

  // Countdown timer when warning is shown
  useEffect(() => {
    if (!showWarning || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          localStorage.clear();
          window.location.href = '/?action=login';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showWarning, timeLeft]);

  const handleRelogin = () => {
    localStorage.clear();
    window.location.href = '/?action=login';
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />

      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-amber-200 dark:border-amber-800">
        <div className="p-6 text-center">
          {/* Timer Icon */}
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-amber-500 text-3xl animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
              timer
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Phiên sắp hết hạn
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Phiên đăng nhập của bạn sẽ hết hạn sau:
          </p>

          {/* Countdown */}
          <div className="text-3xl font-black text-amber-500 mb-5 font-mono tracking-wider">
            {formatTime(timeLeft)}
          </div>

          <p className="text-xs text-slate-400 mb-5">
            Vui lòng đăng nhập lại để tiếp tục sử dụng hệ thống.
          </p>

          <button
            onClick={handleRelogin}
            className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">login</span>
            Đăng nhập lại
          </button>
        </div>
      </div>
    </div>
  );
}
