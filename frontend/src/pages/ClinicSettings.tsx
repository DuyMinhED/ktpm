import { useState, useEffect } from 'react';
import { clinicApi } from '../api/clinic';
import Toast from '../components/ui/Toast';
import ClinicSidebar from '../components/common/ClinicSidebar';
import TopBar from '../components/common/TopBar';
import ChangePasswordModal from '../components/common/ChangePasswordModal';

export default function ClinicSettings() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const currentClinicId = localStorage.getItem('clinicId') || '1';

    // Clinic Data State
    const [clinicData, setClinicData] = useState({
        name: '',
        address: '',
        phone: '',
        imageUrl: '',
        clinicCode: '',
        status: ''
    });

    // Toast State
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    useEffect(() => {
        const fetchClinicProfile = async () => {
            setIsLoading(true);
            try {
                const res = await clinicApi.getProfile(currentClinicId);
                if (res.success) {
                    setClinicData(res.data);
                }
            } catch (error) {
                console.error('Failed to fetch clinic profile:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchClinicProfile();
    }, [currentClinicId]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await clinicApi.updateProfile(currentClinicId, {
                name: clinicData.name,
                address: clinicData.address,
                phone: clinicData.phone,
                imageUrl: clinicData.imageUrl
            });
            if (res.success) {
                setToastMessage('Cập nhật thông tin phòng khám thành công');
                setToastType('success');
                setShowToast(true);
            }
        } catch (error) {
            console.error('Failed to update clinic profile:', error);
            setToastMessage('Lỗi khi cập nhật thông tin');
            setToastType('error');
            setShowToast(true);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex min-h-screen font-display bg-[#f6f8f7] dark:bg-slate-950 text-slate-900 dark:text-slate-100 italic-none">
            <ClinicSidebar
                isSidebarOpen={isSidebarOpen}
                isLoading={isLoading}
            />

            <main className="flex-1 lg:ml-72 min-h-screen flex flex-col transition-all duration-300">
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[140] lg:hidden animate-in fade-in duration-300"
                        onClick={() => setIsSidebarOpen(false)}
                    ></div>
                )}

                <TopBar
                    setIsSidebarOpen={setIsSidebarOpen}
                    notifications={notifications}
                    setNotifications={setNotifications}
                />

                <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-5xl mx-auto w-full">


                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 italic-none">
                        {/* Profile Photo Section - Premium Redesign */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[40px] shadow-sm overflow-hidden group">
                                {/* Header Decorative Background */}
                                <div className="h-24 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent relative">
                                    <div className="absolute top-4 right-6 w-12 h-12 bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-full border border-white/20"></div>
                                </div>

                                <div className="px-8 pb-8 -mt-12 flex flex-col items-center text-center">
                                    {/* Avatar with Ring */}
                                    <div className="relative mb-6">
                                        <div className="w-28 h-28 rounded-[32px] bg-white dark:bg-slate-800 p-1.5 shadow-xl shadow-primary/10 ring-1 ring-slate-200/50 dark:ring-slate-700">
                                            <img
                                                src={clinicData.imageUrl || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=200'}
                                                className="w-full h-full object-cover rounded-[26px]"
                                                alt="Clinic Logo"
                                            />
                                        </div>
                                        <button className="absolute -bottom-1 -right-1 w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 border-2 border-white dark:border-slate-900 hover:scale-110 active:scale-95 transition-all">
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                        </button>
                                    </div>

                                    {/* Name & Code */}
                                    <div className="space-y-2 mb-8">
                                        <h4 className="text-[17px] md:text-[20px] font-bold text-slate-900 dark:text-white leading-tight">{clinicData.name || 'Tên phòng khám'}</h4>
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-full border border-slate-100 dark:border-slate-800">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">{clinicData.clinicCode || 'CL-0000'}</span>
                                        </div>
                                    </div>

                                    {/* Status Cards */}
                                    <div className="w-full space-y-3">
                                        <div className="flex items-center justify-between p-4 bg-emerald-50/40 dark:bg-emerald-500/5 border border-emerald-100/50 dark:border-emerald-500/10 rounded-2xl transition-all hover:bg-emerald-50/60">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center text-emerald-500">
                                                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[11px] font-bold text-emerald-600/60 uppercase tracking-wider">Trạng thái</p>
                                                    <p className="text-[14px] font-bold text-emerald-700 dark:text-emerald-400">
                                                        {clinicData.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngừng'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-blue-50/40 dark:bg-blue-500/5 border border-blue-100/50 dark:border-blue-500/10 rounded-2xl transition-all hover:bg-blue-50/60">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-500">
                                                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[11px] font-bold text-blue-600/60 uppercase tracking-wider">Xác thực</p>
                                                    <p className="text-[14px] font-bold text-blue-700 dark:text-blue-400">Đã xác minh</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Profile Settings Form */}
                        <div className="lg:col-span-8">
                            <form onSubmit={handleSaveProfile} className="bg-white dark:bg-slate-900 rounded-[32px] p-6 md:p-10 border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-6 md:space-y-8">
                                <div className="space-y-6">
                                    <h4 className="text-base md:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary text-[22px]">info</span>
                                        Thông tin cơ bản
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[14px] font-bold text-slate-900/80 dark:text-slate-200 ml-1">Tên Phòng khám</label>
                                            <div className="relative group/input">
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-primary transition-colors text-[20px]">home_health</span>
                                                <input
                                                    type="text"
                                                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[18px] text-[14px] font-semibold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary/5 focus:border-primary/50 outline-none transition-all shadow-sm"
                                                    value={clinicData.name}
                                                    onChange={e => setClinicData({ ...clinicData, name: e.target.value })}
                                                    placeholder="Nhập tên phòng khám"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[14px] font-bold text-slate-900/80 dark:text-slate-200 ml-1">Số điện thoại</label>
                                            <div className="relative group/input">
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-primary transition-colors text-[20px]">call</span>
                                                <input
                                                    type="text"
                                                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[18px] text-[14px] font-semibold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary/5 focus:border-primary/50 outline-none transition-all shadow-sm"
                                                    value={clinicData.phone}
                                                    onChange={e => setClinicData({ ...clinicData, phone: e.target.value })}
                                                    placeholder="Số điện thoại liên hệ"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-[14px] font-bold text-slate-900/80 dark:text-slate-200 ml-1">Địa chỉ chi tiết</label>
                                            <div className="relative group/input">
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-primary transition-colors text-[20px]">location_on</span>
                                                <input
                                                    type="text"
                                                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[18px] text-[14px] font-semibold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary/5 focus:border-primary/50 outline-none transition-all shadow-sm"
                                                    value={clinicData.address}
                                                    onChange={e => setClinicData({ ...clinicData, address: e.target.value })}
                                                    placeholder="Số nhà, tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>



                                <div className="pt-6 flex flex-col md:flex-row gap-4 justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSaving || isLoading}
                                        className="px-6 py-2.5 bg-gradient-to-r from-primary to-sky-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? (
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-[20px]">save</span>
                                                Lưu thay đổi cấu hình
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl font-bold text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">close</span>
                                        Hủy bỏ
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                    {/* Account Security Section */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mt-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-900 dark:text-white">
                            <span className="material-symbols-outlined text-primary">shield_person</span>
                            Bảo mật tài khoản
                        </h3>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-lg">lock</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Mật khẩu đăng nhập</p>
                                    <p className="text-xs text-slate-400">Thay đổi mật khẩu để bảo vệ tài khoản</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsChangePasswordOpen(true)}
                                className="px-4 py-2 text-xs font-bold text-primary border border-primary/20 rounded-lg hover:bg-primary/5 transition-all"
                            >
                                Đổi mật khẩu
                            </button>
                        </div>
                    </div>

                <ChangePasswordModal
                    isOpen={isChangePasswordOpen}
                    onClose={() => setIsChangePasswordOpen(false)}
                    onSuccess={() => {
                        setToastMessage('Đổi mật khẩu thành công!');
                        setToastType('success');
                        setShowToast(true);
                    }}
                />

                <Toast
                    show={showToast}
                    title={toastMessage}
                    type={toastType}
                    onClose={() => setShowToast(false)}
                />
            </main>
        </div>
    );
}
