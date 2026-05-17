import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import AllNotificationsModal from './AllNotificationsModal';
import { notificationApi } from '../../api/notification';
import { clinicApi } from '../../api/clinic';
import ConfirmActionModal from '../ui/ConfirmActionModal';

interface TopBarProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
  notifications: any[];
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  actionButton?: React.ReactNode;
}

const TopBar: React.FC<TopBarProps> = ({
  setIsSidebarOpen,
  notifications,
  setNotifications,
  actionButton
}) => {
  const navigate = useNavigate();
  const currentClinicId = localStorage.getItem('clinicId');
  const userRole = localStorage.getItem('userRole');

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAllNotificationsOpen, setIsAllNotificationsOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [clinicName, setClinicName] = useState(() => localStorage.getItem('cachedClinicName') || "");
  const [clinicLogo, setClinicLogo] = useState(() => localStorage.getItem('cachedClinicLogo') || "");

  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    if (isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationOpen]);

  useEffect(() => {
    if (currentClinicId && (userRole?.includes('CLINIC_MANAGER') || userRole?.includes('ADMIN'))) {
      clinicApi.getProfile(currentClinicId).then(res => {
        if (res.data) {
          const name = res.data.name || "Phòng khám";
          const logo = res.data.logoUrl || res.data.imageUrl || "";
          setClinicName(name);
          setClinicLogo(logo);
          localStorage.setItem('cachedClinicName', name);
          localStorage.setItem('cachedClinicLogo', logo);
        }
      }).catch(() => {});
    }
  }, [currentClinicId, userRole]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/?action=login');
  };

  const displayName = clinicName || localStorage.getItem('userName') || "Người dùng";
  const displayAvatar = clinicLogo || localStorage.getItem('userAvatar') || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff`;
  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getNotifications();
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error(error);
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/50 px-4 md:px-8 flex items-center justify-between sticky top-0 z-[100] transition-all">
      <div className="flex items-center gap-4 flex-1 text-left">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-400 bg-background-light dark:bg-slate-800 rounded-xl"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>
      <div className="flex items-center gap-2 md:gap-4 ml-4">
        {/* Animated Vietnam Flag */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-full border border-slate-100 dark:border-slate-800 group cursor-default">
          <div className="w-6 h-4 relative overflow-hidden rounded-sm shadow-sm animate-flag-wave">
            <svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <rect width="30" height="20" fill="#da251d" />
              <polygon points="15,4 11.47,14.85 20.71,8.15 9.29,8.15 18.53,14.85" fill="#ffff00" />
            </svg>
          </div>
          <span className="text-[10px] font-extrabold text-slate-500 uppercase hidden xs:inline">VN</span>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
          }}
          className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-background-light dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
          title="Chuyển đổi giao diện sáng/tối"
        >
          <span className="material-symbols-outlined text-xl dark:hidden">dark_mode</span>
          <span className="material-symbols-outlined text-xl hidden dark:block">light_mode</span>
        </button>
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-background-light dark:bg-slate-800 text-slate-600 relative transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            {notifications.some(n => !n.read) && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            )}
          </button>

          <NotificationDropdown
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
            notifications={notifications}
            onMarkRead={handleMarkRead}
            onClearAll={handleClearAll}
            onViewAll={() => {
              setIsNotificationOpen(false);
              setIsAllNotificationsOpen(true);
            }}
          />
        </div>



        {actionButton}

        {/* Professional User Identity Header Card */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-1.5 pl-3 border border-slate-100 dark:border-slate-800/50 shadow-sm ml-2 group hover:border-primary/20 hover:shadow-md transition-all duration-300 shrink-0">
          <div className="text-left hidden md:block shrink-0">
            <p className="text-[15px] font-semibold text-slate-700 dark:text-slate-200 leading-tight whitespace-nowrap pr-1" title={displayName}>
              {displayName}
            </p>
          </div>
          <img
            src={displayAvatar}
            alt="Avatar"
            onError={(e) => {
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
            }}
            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 bg-white shadow-sm shrink-0 hover:scale-105 transition-transform"
          />
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-0.5"></div>
          <button
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center shrink-0 hover:bg-red-500 hover:text-white transition-all active:scale-95 group/btn"
            title="Đăng xuất"
          >
            <span className="material-symbols-outlined text-[18px] font-bold group-hover/btn:scale-110 transition-transform">logout</span>
          </button>
        </div>
      </div>
      <style>{`
        @keyframes flag-wave {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .animate-flag-wave {
          animation: flag-wave 2s infinite ease-in-out;
        }
      `}</style>
      </header>
      <ConfirmActionModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
        title="Xác nhận đăng xuất"
        description="Bạn có chắc chắn muốn đăng xuất khỏi hệ thống làm việc?"
        confirmText="Đăng xuất"
        cancelText="Hủy bỏ"
        iconName="logout"
        variant="danger"
      />
      <AllNotificationsModal
        isOpen={isAllNotificationsOpen}
        onClose={() => setIsAllNotificationsOpen(false)}
        onUpdate={fetchNotifications}
      />
    </>
  );
};

export default TopBar;
