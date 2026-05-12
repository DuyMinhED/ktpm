import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import TopBar from '../components/common/TopBar';
import { authApi } from '../api/auth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({
    name: localStorage.getItem('userName') || "Admin",
    avatar: localStorage.getItem('userAvatar')
  });

  useEffect(() => {
    document.body.classList.add('admin-theme');
    const fetchUserProfile = async () => {
      try {
        const response = await authApi.getMe();
        if (response.success && response.data) {
          const { fullName, avatarUrl } = response.data;
          setUserInfo({ name: fullName || "Admin", avatar: avatarUrl });
          if (fullName) localStorage.setItem('userName', fullName);
          if (avatarUrl) localStorage.setItem('userAvatar', avatarUrl);
        }
      } catch (error) { console.error(error); }
    };
    fetchUserProfile();
    return () => {
      document.body.classList.remove('admin-theme');
    };
  }, []);

  const finalUserName = userInfo.name;
  const finalUserAvatar = userInfo.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(finalUserName) + "&background=3b82f6&color=fff";

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Cảnh báo hệ thống', message: 'Phòng khám Quận 1 đang quá tải bệnh nhân.', time: '5 phút trước', type: 'warning' },
    { id: 2, title: 'Báo cáo mới', message: 'Báo cáo hợp nhất tháng 10 đã sẵn sàng.', time: '2 giờ trước', type: 'info' }
  ]);

  const location = useLocation();

  const navItems = [
    { path: ROUTES.ADMIN.DASHBOARD, label: 'Tổng quan hệ thống', icon: 'dashboard' },
    { path: ROUTES.ADMIN.CLINICS, label: 'Quản lý phòng khám', icon: 'home_health' },
    { path: ROUTES.ADMIN.USERS, label: 'Quản lý người dùng', icon: 'group' },
    { path: ROUTES.ADMIN.SERVICES, label: 'Quản lý dịch vụ', icon: 'medical_information' },
    { path: ROUTES.ADMIN.REPORTS, label: 'Báo cáo hợp nhất', icon: 'analytics' },
    { path: ROUTES.ADMIN.SUPPORT, label: 'Trung tâm hỗ trợ', icon: 'support_agent' },
    { path: ROUTES.ADMIN.AUDIT_LOGS, label: 'Nhật ký hệ thống', icon: 'history' },
    { path: ROUTES.ADMIN.SETTINGS, label: 'Cấu hình hệ thống', icon: 'settings' },
    { path: ROUTES.HOME, label: 'Xem trang chủ', icon: 'visibility' },
  ];

  return (
    <div className="flex min-h-screen font-display bg-background-light dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased italic-none">
      {/* Mobile overlay backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[140] lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation - Shared across Admin Pages */}
      <aside className={`fixed left-0 top-0 bottom-0 bg-white dark:bg-slate-900 border-r border-primary/10 flex flex-col z-[150] transition-transform duration-300 ease-out w-[280px] lg:w-72 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl lg:shadow-none shadow-primary/10`}>
        <div className="p-6 flex items-center justify-between border-b border-primary/5">
          <Link to={ROUTES.HOME} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-xl text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>health_metrics</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white leading-none">DamDiep</h1>
            </div>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-90"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar italic-none">
          {navItems.map((item, idx) => {
            const isActive = location.pathname === item.path;
            const isExternal = item.path === ROUTES.HOME;
            return (
              <Link
                key={idx}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary font-medium'
                  }`}
                to={item.path}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "''" }}>
                  {item.icon}
                </span>
                <span className="text-base">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-4 border-t border-primary/5">
          <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-primary/5 group relative">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="relative shrink-0">
                <img
                  alt={finalUserName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
                  src={finalUserAvatar}
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(finalUserName)}&background=3b82f6&color=fff`;
                  }}
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
              </div>
              <div className="overflow-hidden text-left">
                <p className="text-[14px] font-bold text-slate-900 dark:text-white truncate" title={finalUserName}>{finalUserName}</p>
                <p className="text-[12px] text-slate-500 font-medium opacity-70 leading-tight">Quản trị viên</p>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                navigate('/?action=login');
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0 active:scale-90"
              title="Đăng xuất"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:ml-72 min-h-screen flex-1 flex flex-col bg-background-light dark:bg-slate-950">
        <TopBar
          setIsSidebarOpen={setIsSidebarOpen}
          notifications={notifications}
          setNotifications={setNotifications}
        />
        {children}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3bb9f333; border-radius: 10px; }
      `}</style>
    </div>
  );
}
