import React from 'react';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  type: string;
  read?: boolean;
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkRead?: (id: number) => void;
  onClearAll?: () => void;
  onViewAll?: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onClearAll,
  onViewAll
}) => {
  const translateText = (txt: string) => {
    if (!txt) return txt;
    return txt
      .replace(/\[Clinic Alert\]/g, "[Cảnh báo]")
      .replace(/Blood Sugar/g, "Đường huyết")
      .replace(/Blood Pressure/g, "Huyết áp")
      .replace(/Heart Rate/g, "Nhịp tim");
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-[120] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 transform-gpu">
        <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white text-left">Thông báo</h3>
          {notifications.length > 0 && (
            <button 
              onClick={() => onClearAll?.()} 
              className="text-[13px] font-extrabold text-primary hover:underline tracking-tight"
            >
              Đọc tất cả
            </button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          {notifications.length > 0 ? (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  onClick={() => onMarkRead?.(notif.id)}
                  className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group relative ${!notif.read ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${notif.type === 'warning' ? 'bg-red-50 text-red-500' : 'bg-primary/10 text-primary'}`}>
                      <span className="material-symbols-outlined text-lg">{notif.type === 'warning' ? 'error' : 'info'}</span>
                    </div>
                    <div className="space-y-1 text-left">
                      <p className={`text-sm font-bold leading-tight group-hover:text-primary transition-colors ${!notif.read ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{translateText(notif.title)}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{translateText(notif.message)}</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-1">{notif.time}</p>
                    </div>
                  </div>
                  {!notif.read && (
                    <span className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full"></span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-4xl opacity-20">notifications_off</span>
              </div>
              <p className="text-sm font-extrabold tracking-tight text-slate-300 dark:text-slate-600 italic">Không có thông báo</p>
            </div>
          )}
        </div>
        {notifications.length > 0 && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => onViewAll?.()} 
              className="w-full py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
            >
              Xem tất cả thông báo
            </button>
          </div>
        )}
      </div>
  );
};

export default NotificationDropdown;
