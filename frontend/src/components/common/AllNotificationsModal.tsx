import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { notificationApi } from '../../api/notification';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  type: string;
  read?: boolean;
}

interface AllNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void; // Optional callback to tell parent to refresh its notifications state
}

export default function AllNotificationsModal({ isOpen, onClose, onUpdate }: AllNotificationsModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'warning' | 'info'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const translateText = (txt: string) => {
    if (!txt) return txt;
    return txt
      .replace(/\[Clinic Alert\]/g, "[Cảnh báo]")
      .replace(/Blood Sugar/g, "Đường huyết")
      .replace(/Blood Pressure/g, "Huyết áp")
      .replace(/Heart Rate/g, "Nhịp tim");
  };

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await notificationApi.getNotifications();
      if (res && res.data) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error("Failed to load all notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      loadNotifications();
      setCurrentPage(1);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Compute filtered notifications
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];
    if (activeFilter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (activeFilter === 'warning') {
      filtered = filtered.filter(n => n.type === 'warning' || n.type?.toLowerCase().includes('alert') || n.type?.toLowerCase().includes('risk'));
    } else if (activeFilter === 'info') {
      filtered = filtered.filter(n => n.type !== 'warning' && !n.type?.toLowerCase().includes('alert') && !n.type?.toLowerCase().includes('risk'));
    }
    return filtered;
  }, [notifications, activeFilter]);

  // Reset current page when filter changes to avoid out of bounds
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredNotifications.length / pageSize);
  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredNotifications.slice(start, start + pageSize);
  }, [filteredNotifications, currentPage]);

  const handleMarkSingleRead = async (id: number) => {
    try {
      // Optimistic UI
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      await notificationApi.markAsRead(id);
      onUpdate?.();
    } catch (err) {
      console.error("Failed to mark read:", err);
      loadNotifications(); // Revert
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      await notificationApi.markAllAsRead();
      onUpdate?.();
    } catch (err) {
      console.error("Failed to mark all read:", err);
      loadNotifications();
    }
  };

  const handleDeleteSingle = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger row click read
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await notificationApi.delete(id);
      onUpdate?.();
    } catch (err) {
      console.error("Failed to delete notification:", err);
      loadNotifications();
    }
  };

  const renderModalContent = () => {
    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden font-display text-left antialiased">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] transition-all duration-300"
              onClick={onClose}
            />

            {/* Modal container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl h-[640px] max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col relative overflow-hidden z-10 animate-in fade-in zoom-in duration-300"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[26px]">notifications_active</span>
                  </div>
                  <div>
                    <h3 className="font-black text-[20px] text-slate-900 dark:text-white tracking-tight">Trung tâm Thông báo</h3>
                    <p className="text-sm font-medium text-slate-500">Xem chi tiết và quản lý tất cả nhắc nhở, cảnh báo</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-auto sm:ml-0">
                  {notifications.some(n => !n.read) && (
                    <button
                      onClick={handleMarkAllRead}
                      className="px-4 py-2 bg-slate-100 hover:bg-primary/10 text-slate-700 hover:text-primary dark:bg-slate-800/60 dark:hover:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-transparent hover:border-primary/10 whitespace-nowrap"
                    >
                      Đọc tất cả
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>

              {/* Filter Tabs Section */}
              <div className="px-6 pt-4 pb-2 border-b border-slate-50 dark:border-slate-900 flex flex-wrap gap-2 shrink-0">
                {[
                  { key: 'all', label: 'Tất cả', count: notifications.length },
                  { key: 'unread', label: 'Chưa đọc', count: notifications.filter(n => !n.read).length },
                  { key: 'warning', label: 'Cảnh báo', count: notifications.filter(n => n.type === 'warning' || n.type?.toLowerCase().includes('alert') || n.type?.toLowerCase().includes('risk')).length },
                  { key: 'info', label: 'Thông tin', count: notifications.filter(n => n.type !== 'warning' && !n.type?.toLowerCase().includes('alert') && !n.type?.toLowerCase().includes('risk')).length }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveFilter(tab.key as any)}
                    className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold transition-all flex items-center gap-2 ${
                      activeFilter === tab.key
                        ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-[1.02]'
                        : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200/50 dark:border-slate-800/50'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                        activeFilter === tab.key ? 'bg-white/25 text-white' : 'bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Content Area List */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white dark:bg-slate-900/50">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-20 bg-slate-100 dark:bg-slate-900/50 rounded-2xl animate-pulse border border-slate-100 dark:border-slate-800"></div>
                    ))}
                  </div>
                ) : paginatedNotifications.length > 0 ? (
                  <div className="space-y-3">
                    {paginatedNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleMarkSingleRead(notif.id)}
                        className={`group p-4.5 rounded-2xl border transition-all duration-300 flex gap-4 items-start relative cursor-pointer ${
                          !notif.read
                            ? 'bg-white dark:bg-slate-900/80 border-primary/15 dark:border-primary/20 shadow-md shadow-slate-200/40 dark:shadow-none ring-1 ring-primary/5'
                            : 'bg-white/60 dark:bg-slate-900/30 border-slate-100 dark:border-slate-900/50 opacity-80 hover:opacity-100 hover:bg-white dark:hover:bg-slate-900/60'
                        }`}
                      >
                        {/* Type Icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm transition-transform group-hover:scale-105 duration-300 ${
                          notif.type === 'warning' || notif.type?.toLowerCase().includes('alert')
                            ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-100/30 dark:border-rose-900/30'
                            : 'bg-primary/5 dark:bg-primary/10 text-primary border border-primary/10'
                        }`}>
                          <span className="material-symbols-outlined text-[22px]">
                            {notif.type === 'warning' || notif.type?.toLowerCase().includes('alert') ? 'warning' : 'info'}
                          </span>
                        </div>

                        {/* Body Text */}
                        <div className="flex-1 min-w-0 space-y-1 pr-6">
                          <h4 className={`text-[15px] font-bold leading-snug transition-colors ${
                            !notif.read ? 'text-slate-900 dark:text-white group-hover:text-primary' : 'text-slate-600 dark:text-slate-400'
                          }`}>
                            {translateText(notif.title)}
                          </h4>
                          <p className={`text-[13.5px] font-medium leading-relaxed line-clamp-2 ${
                            !notif.read ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500 dark:text-slate-500'
                          }`}>
                            {translateText(notif.message)}
                          </p>
                          
                          <div className="flex items-center gap-3 mt-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-slate-300">schedule</span>
                              {notif.time}
                            </span>
                            {!notif.read && (
                              <span className="flex items-center gap-1 text-primary">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                Mới
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Delete Overlay Button */}
                        <div className="absolute top-4 right-4 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => handleDeleteSingle(notif.id, e)}
                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 dark:bg-slate-900 dark:hover:bg-rose-950/50 flex items-center justify-center transition-all border border-slate-200 dark:border-slate-800 hover:border-rose-100/50 dark:hover:border-rose-900/50 active:scale-90 shadow-sm"
                            title="Xóa thông báo"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-20">
                    <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-900/60 flex items-center justify-center mb-2 opacity-60">
                      <span className="material-symbols-outlined text-[48px] text-slate-300 dark:text-slate-600">notifications_off</span>
                    </div>
                    <div>
                      <h4 className="font-black text-[16px] text-slate-500 dark:text-slate-400 tracking-tight">Không tìm thấy thông báo</h4>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Thư mục thông báo này hiện đang trống.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Pagination Footer Controls */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between bg-white/80 dark:bg-slate-950/80 backdrop-blur-md shrink-0">
                  <p className="text-[12.5px] font-bold text-slate-500">
                    Trang <span className="text-slate-800 dark:text-slate-200">{currentPage}</span> trên <span className="text-slate-800 dark:text-slate-200">{totalPages}</span>
                  </p>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 border border-slate-200/50 dark:border-slate-800 text-slate-500 disabled:opacity-40 disabled:hover:bg-slate-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                    </button>

                    {[...Array(totalPages)].map((_, i) => {
                      const p = i + 1;
                      return (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`w-9 h-9 flex items-center justify-center rounded-xl text-[13px] font-black transition-all ${
                            currentPage === p
                              ? 'bg-primary text-white shadow-md shadow-primary/20 ring-1 ring-primary'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 border border-slate-200/50 dark:border-slate-800 text-slate-500 disabled:opacity-40 disabled:hover:bg-slate-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  };

  return createPortal(
    renderModalContent(),
    document.body
  );
}
