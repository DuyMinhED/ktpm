import React from 'react';
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

interface DoctorSidebarProps {
    isSidebarOpen: boolean;
    userName?: string;
    userRole?: string;
    userAvatar?: string;
    isLoading?: boolean;
}

const DoctorSidebar: React.FC<DoctorSidebarProps> = ({
    isSidebarOpen,
    userName,
    userRole,
    userAvatar,
    isLoading = false
}) => {
    // Dynamic fallback to localStorage or generic text
    const finalUserName = userName || localStorage.getItem('userName') || "Bác sĩ (Chưa có tên)";
    const finalUserRole = userRole || localStorage.getItem('userRole') || "Chuyên khoa Nội";
    const finalUserAvatar = userAvatar || localStorage.getItem('userAvatar') || "https://ui-avatars.com/api/?name=" + encodeURIComponent(finalUserName) + "&background=0D8ABC&color=fff";

    const navItems = [
        { path: ROUTES.DOCTOR.DASHBOARD, label: 'Bảng điều khiển', icon: 'dashboard' },
        { path: ROUTES.DOCTOR.PATIENTS, label: 'Danh sách bệnh nhân', icon: 'groups' },
        { path: ROUTES.DOCTOR.ANALYTICS, label: 'Phân tích nguy cơ', icon: 'analytics' },
        { path: ROUTES.DOCTOR.PRESCRIPTIONS, label: 'Đơn thuốc điện tử', icon: 'prescriptions' },
        { path: ROUTES.DOCTOR.APPOINTMENTS, label: 'Lịch hẹn khám', icon: 'calendar_today' },
        { path: ROUTES.DOCTOR.MESSAGES, label: 'Tin nhắn', icon: 'chat', badge: '5' },
    ];

    return (
        <aside className={`fixed left-0 top-0 bottom-0 bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800/50 flex flex-col z-[150] transition-transform duration-300 w-72 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl lg:shadow-none shadow-primary/10 font-display`}>
            <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/50">
                <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-xl text-white shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined fill-1">health_metrics</span>
                </div>
                <div>
                    <h1 className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">DamDiep</h1>
                </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar italic-none">
                {navItems.map((item, idx) => (
                    <NavLink
                        key={idx}
                        to={item.path}
                        end={item.path === ROUTES.DOCTOR.DASHBOARD}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${isActive
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "''" }}>
                                    {item.icon}
                                </span>
                                <span>{item.label}</span>
                                {item.badge && (
                                    <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-white text-primary' : 'bg-red-500 text-white'}`}>
                                        {item.badge}
                                    </span>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 mt-auto">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-4 border border-slate-100 dark:border-slate-800 flex items-center gap-3 group cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm hover:shadow-md">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-blue-400 p-0.5 shadow-lg shadow-primary/20 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                        <img
                            src={finalUserAvatar}
                            alt={finalUserName}
                            onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(finalUserName)}&background=random`;
                            }}
                            className="w-full h-full object-cover rounded-[14px] border-2 border-white dark:border-slate-900"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        {isLoading ? (
                            <div className="space-y-2 animate-pulse pr-2">
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-16"></div>
                            </div>
                        ) : (
                            <>
                                <p className="text-[15px] font-bold text-slate-900 dark:text-white truncate leading-tight tracking-tight ">{finalUserName}</p>
                                <p className="text-[12px] font-medium text-slate-600 dark:text-slate-500 mt-0.5 truncate">{finalUserRole}</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; }
            `}</style>
        </aside>
    );
};

export default DoctorSidebar;
