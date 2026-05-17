import React from 'react';
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

interface ClinicSidebarProps {
    isSidebarOpen: boolean;
}

const ClinicSidebar: React.FC<ClinicSidebarProps> = ({
    isSidebarOpen
}) => {
    const navItems = [
        { path: ROUTES.CLINIC.DASHBOARD, label: 'Tổng quan phòng khám', icon: 'dashboard' },
        { path: ROUTES.CLINIC.PATIENTS, label: 'Quản lý Bệnh nhân', icon: 'group' },
        { path: ROUTES.CLINIC.DOCTORS, label: 'Quản lý Bác sĩ', icon: 'medical_services' },
        { path: ROUTES.CLINIC.REPORTS, label: 'Báo cáo', icon: 'analytics' },
        { path: ROUTES.CLINIC.ALERTS, label: 'Cảnh báo nguy cơ', icon: 'warning' },
        { path: ROUTES.CLINIC.ASSIGNMENT, label: 'Điều phối bệnh nhân', icon: 'assignment_ind' },
        { path: ROUTES.CLINIC.APPOINTMENTS, label: 'Lịch hẹn khám', icon: 'calendar_today' },
        { path: ROUTES.CLINIC.SERVICES, label: 'Quản lý Dịch vụ', icon: 'medical_information' },
        { path: ROUTES.CLINIC.SETTINGS, label: 'Cấu hình phòng khám', icon: 'settings' },
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
                        end={item.path === ROUTES.CLINIC.DASHBOARD}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${isActive && item.path !== '#'
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: (isActive && item.path !== '#') ? "'FILL' 1" : "''" }}>
                                    {item.icon}
                                </span>
                                <span>{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}

                <NavLink
                    to={ROUTES.CLINIC.SUPPORT}
                    className={({ isActive }) =>
                        `w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all text-slate-600 dark:text-slate-400 hover:bg-amber-500/10 hover:text-amber-600 text-left mt-2 border border-dashed ${
                            isActive
                            ? 'border-amber-500 bg-amber-500/5 text-amber-600 dark:text-amber-400'
                            : 'border-slate-200 dark:border-slate-800'
                        }`
                    }
                >
                    <span className="material-symbols-outlined text-amber-500">support_agent</span>
                    <span>Hỗ trợ kỹ thuật</span>
                </NavLink>
            </nav>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; }
            `}</style>
        </aside>
    );
};

export default ClinicSidebar;
