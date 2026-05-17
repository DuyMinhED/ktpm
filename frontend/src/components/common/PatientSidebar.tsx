import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { patientApi } from '../../api/patient';
import { supportApi } from '../../api/support';
import { useToast } from '../ui/ToastContext';
import CreateTicketModal from '../../features/admin/components/CreateTicketModal';
import DamDiepLogo from './DamDiepLogo';

interface PatientSidebarProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

const PatientSidebar: React.FC<PatientSidebarProps> = ({ isSidebarOpen, setIsSidebarOpen }) => {
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState({
        name: localStorage.getItem('userName') || "Bệnh nhân",
        avatar: localStorage.getItem('userAvatar')
    });
    const [unreadCount, setUnreadCount] = useState(0);
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
    const [isSavingSupport, setIsSavingSupport] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await authApi.getMe();
                if (response.success && response.data) {
                    const { fullName, avatarUrl } = response.data;
                    setUserInfo({
                        name: fullName || "Bệnh nhân",
                        avatar: avatarUrl
                    });
                    if (fullName) localStorage.setItem('userName', fullName);
                    if (avatarUrl) localStorage.setItem('userAvatar', avatarUrl);
                }
            } catch (error) {
                console.error("Error fetching patient user profile:", error);
            }
        };

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

        fetchUserProfile();
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 15000); // Refresh every 15s
        return () => clearInterval(interval);
    }, []);

    const finalUserName = userInfo.name;
    const finalUserAvatar = userInfo.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(finalUserName) + "&background=0ea5e9&color=fff";

    const handleLogout = () => {
        localStorage.clear();
        navigate('/?action=login');
    };

    const handleSaveSupport = async (data: any) => {
        setIsSavingSupport(true);
        try {
            const response = await supportApi.createTicket({
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
        { path: '/patient', label: 'Bảng điều khiển', icon: 'dashboard' },
        { path: '/patient/prescriptions', label: 'Đơn thuốc', icon: 'prescriptions' },
        { path: '/patient/metrics', label: 'Chỉ số sức khỏe', icon: 'monitoring' },
        { path: '/patient/appointments', label: 'Lịch hẹn', icon: 'calendar_today' },
        { path: '/patient/messages', label: 'Tin nhắn bác sĩ', icon: 'chat', badge: unreadCount > 0 ? `${unreadCount}` : undefined },
        { path: '/patient/services', label: 'Gói dịch vụ', icon: 'medical_services' },
        { path: '/patient/profile', label: 'Hồ sơ cá nhân', icon: 'person' },
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
                    onClick={() => setIsSupportModalOpen(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all text-slate-600 dark:text-slate-400 hover:bg-amber-500/10 hover:text-amber-600 text-left mt-2 border border-dashed border-slate-200 dark:border-slate-800"
                >
                    <span className="material-symbols-outlined text-amber-500">support_agent</span>
                    <span>Hỗ trợ kỹ thuật</span>
                </button>
            </nav>

            <div className="p-4 mt-auto">
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                    <div className="flex items-center gap-3 mb-3">
                        <img
                            src={finalUserAvatar}
                            alt={finalUserName}
                            onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(finalUserName)}&background=0ea5e9&color=fff`;
                            }}
                            className="w-10 h-10 rounded-full object-cover shadow-inner border-2 border-white dark:border-slate-800"
                        />
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold truncate text-slate-900 dark:text-white" title={finalUserName}>{finalUserName}</p>
                            <p className="text-xs text-slate-500 font-medium">Bệnh nhân</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors active:scale-95"
                    >
                        <span className="material-symbols-outlined text-sm font-bold">logout</span>
                        Đăng xuất
                    </button>
                </div>
            </div>

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

export default PatientSidebar;
