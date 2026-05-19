import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { patientApi } from '../../api/patient';
import { useToast } from '../ui/ToastContext';
import ChangePasswordModal from './ChangePasswordModal';
import DamDiepLogo from './DamDiepLogo';

interface PatientSidebarProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

const PatientSidebar: React.FC<PatientSidebarProps> = ({ isSidebarOpen, setIsSidebarOpen: _setIsSidebarOpen }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const { showToast } = useToast();
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const res = await patientApi.getConversations();
                if (res.data) {
                    const total = res.data.reduce((acc: number, curr: any) => acc + (curr.unreadCount || 0), 0);
                    setUnreadCount(total);
                }
            } catch (error) {
                console.error("Error fetching unread conversations count:", error);
            }
        };

        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 15000); // Refresh every 15s
        return () => clearInterval(interval);
    }, []);

    const navItems = [
        { path: '/patient', label: 'Bảng điều khiển', icon: 'dashboard' },
        { path: '/patient/prescriptions', label: 'Đơn thuốc', icon: 'prescriptions' },
        { path: '/patient/metrics', label: 'Chỉ số sức khỏe', icon: 'monitoring' },
        { path: '/patient/appointments', label: 'Lịch hẹn', icon: 'calendar_today' },
        { path: '/patient/messages', label: 'Tin nhắn bác sĩ', icon: 'chat', badge: unreadCount > 0 ? `${unreadCount}` : undefined },
        { path: '/patient/services', label: 'Gói dịch vụ', icon: 'medical_services' },
        { path: '/patient/profile', label: 'Hồ sơ cá nhân', icon: 'person' },
        { path: '/patient/support', label: 'Hỗ trợ kỹ thuật', icon: 'support_agent' },
    ];


    return (
        <aside className={`fixed left-0 top-0 bottom-0 bg-white dark:bg-slate-900 border-r border-primary/10 flex flex-col z-[150] transition-transform duration-300 w-72 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl lg:shadow-none shadow-primary/10 font-display`}>
            <div className="p-6 border-b border-primary/5">
                <DamDiepLogo size={40} />
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/patient'}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${isActive
                                ? 'bg-primary text-white shadow-lg shadow-primary/10'
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
                                    <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${(isActive as any) ? 'bg-white text-primary' : 'bg-red-500 text-white'}`}>
                                        {item.badge}
                                    </span>
                                )}
                            </>
                        )}
                    </NavLink>

                ))}

                <button
                    type="button"
                    onClick={() => setIsChangePasswordOpen(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary text-left border border-dashed border-slate-200 dark:border-slate-800 mt-2"
                >
                    <span className="material-symbols-outlined text-primary">lock</span>
                    <span>Đổi mật khẩu</span>
                </button>
            </nav>

            <ChangePasswordModal
                isOpen={isChangePasswordOpen}
                onClose={() => setIsChangePasswordOpen(false)}
                onSuccess={() => showToast('Đổi mật khẩu thành công!', 'success')}
            />

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; }
            `}</style>
        </aside>
    );
};

export default PatientSidebar;
