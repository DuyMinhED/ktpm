import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { doctorApi } from '../../api/doctor';
import { supportApi } from '../../api/support';
import { useToast } from '../ui/ToastContext';
import CreateTicketModal from '../../features/admin/components/CreateTicketModal';
import DamDiepLogo from './DamDiepLogo';

interface DoctorSidebarProps {
    isSidebarOpen: boolean;
}

const DoctorSidebar: React.FC<DoctorSidebarProps> = ({
    isSidebarOpen
}) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
    const [isSavingSupport, setIsSavingSupport] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const res = await doctorApi.getConversations();
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

    const handleSaveSupport = async (data: any) => {
        setIsSavingSupport(true);
        try {
            await supportApi.createTicket({
                subject: data.subject,
                message: data.message,
                category: data.category,
                priority: data.priority,
                status: 'Mới'
            });
            showToast("Gửi yêu cầu thành công!", 'success');
            setIsSupportModalOpen(false);
        } catch (error) {
            console.error("Failed to create support ticket:", error);
            showToast("Không thể gửi yêu cầu hỗ trợ. Vui lòng thử lại sau.", "error");
        } finally {
            setIsSavingSupport(false);
        }
    };

    const navItems = [
        { path: ROUTES.DOCTOR.DASHBOARD, label: 'Bảng điều khiển', icon: 'dashboard' },
        { path: ROUTES.DOCTOR.PATIENTS, label: 'Danh sách bệnh nhân', icon: 'groups' },
        { path: ROUTES.DOCTOR.ANALYTICS, label: 'Phân tích nguy cơ', icon: 'analytics' },
        { path: ROUTES.DOCTOR.PRESCRIPTIONS, label: 'Đơn thuốc điện tử', icon: 'prescriptions' },
        { path: ROUTES.DOCTOR.APPOINTMENTS, label: 'Lịch hẹn khám', icon: 'calendar_today' },
        { path: ROUTES.DOCTOR.MESSAGES, label: 'Tin nhắn', icon: 'chat', badge: unreadCount > 0 ? `${unreadCount}` : undefined },
    ];


    return (
        <aside className={`fixed left-0 top-0 bottom-0 bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800/50 flex flex-col z-[150] transition-transform duration-300 w-72 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl lg:shadow-none shadow-primary/10 font-display`}>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/50">
                <DamDiepLogo size={40} />
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

                <button
                    type="button"
                    onClick={() => setIsSupportModalOpen(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all text-slate-600 dark:text-slate-400 hover:bg-amber-500/10 hover:text-amber-600 text-left mt-2 border border-dashed border-slate-200 dark:border-slate-800"
                >
                    <span className="material-symbols-outlined text-amber-500">support_agent</span>
                    <span>Hỗ trợ kỹ thuật</span>
                </button>
            </nav>

            <CreateTicketModal
                isOpen={isSupportModalOpen}
                onClose={() => setIsSupportModalOpen(false)}
                onSave={handleSaveSupport}
                isSaving={isSavingSupport}
            />

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; }
            `}</style>
        </aside>
    );
};

export default DoctorSidebar;
