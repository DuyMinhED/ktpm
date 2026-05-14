import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import { notificationApi } from '../../api/notification';
import { clinicApi } from '../../api/clinic';

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
  const [clinicName, setClinicName] = useState("");
  const [clinicLogo, setClinicLogo] = useState("");

  useEffect(() => {
    if (currentClinicId && (userRole?.includes('CLINIC_MANAGER') || userRole?.includes('ADMIN'))) {
      clinicApi.getProfile(currentClinicId).then(res => {
        if (res.data) {
          setClinicName(res.data.name || "Phòng khám");
          setClinicLogo(res.data.logoUrl || res.data.imageUrl || "");
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

        <div className="relative">
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
          />
        </div>



        {actionButton}

        {/* Professional User Identity Header Card */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-1.5 pl-3 border border-slate-100 dark:border-slate-800/50 shadow-sm ml-2 group hover:border-primary/20 hover:shadow-md transition-all duration-300">
          <div className="min-w-0 text-left hidden md:block">
            <p className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight whitespace-nowrap pr-1" title={displayName}>
              {displayName}
            </p>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {userRole?.includes('CLINIC_MANAGER') ? 'Phòng khám' : userRole?.includes('DOCTOR') ? 'Bác sĩ' : 'Hệ thống'}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-blue-400 p-0.5 shadow-md shrink-0 group-hover:scale-105 transition-transform">
            <img
              src={displayAvatar}
              alt="Avatar"
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
              }}
              className="w-full h-full object-cover rounded-[8px] border border-white bg-white"
            />
          </div>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-0.5"></div>
          <button
            onClick={handleLogout}
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
  );
};

export default TopBar;
