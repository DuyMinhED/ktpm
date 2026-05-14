import React, { useState, useEffect } from 'react';
import { Mail, Lock, Building2, ArrowRight, ShieldCheck, Loader2, X } from 'lucide-react';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialRole?: string;
    onLoginSuccess: (role: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, initialRole = 'clinic', onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState(initialRole);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setRole(initialRole);
            setError('');
        }
    }, [isOpen, initialRole]);

    if (!isOpen) return null;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Simulation
        setTimeout(() => {
            if (email && password) {
                onLoginSuccess(role);
            } else {
                setError('Vui lòng nhập đầy đủ email và mật khẩu');
            }
            setIsLoading(false);
        }, 1500);
    };

    const roleData: Record<string, { title: string, color: string }> = {
        admin: { title: 'Quản trị hệ thống', color: 'text-primary' },
        clinic: { title: 'Quản lý phòng khám', color: 'text-emerald-600' },
        doctor: { title: 'Bác sĩ chuyên khoa', color: 'text-sky-600' },
        patient: { title: 'Cổng bệnh nhân', color: 'text-rose-500' }
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-primary/10 overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors z-10"
                >
                    <X size={20} />
                </button>

                <div className="p-10">
                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 animate-bounce-slow">
                            <Building2 size={32} />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-2 italic-none">
                            Chào mừng trở lại
                        </h2>
                        <p className="text-slate-500 font-medium">
                            Đăng nhập với vai trò <span className={roleData[role]?.color + " font-bold"}>{roleData[role]?.title}</span>
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-shake">
                                <ShieldCheck size={18} />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 dark:text-slate-300 ml-1">Email / Tên đăng nhập</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="manager@ductin.com"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl focus:border-primary/20 focus:bg-white outline-none font-bold text-slate-900 dark:text-white transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-sm font-black text-slate-700 dark:text-slate-300">Mật khẩu</label>
                                <button type="button" className="text-xs font-bold text-primary hover:underline">Quên mật khẩu?</button>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl focus:border-primary/20 focus:bg-white outline-none font-bold text-slate-900 dark:text-white transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <>
                                        Bắt đầu làm việc
                                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-sm text-slate-500 font-medium italic-none">
                            Hệ thống bảo mật tối cao dành cho y tế chuyên sâu
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
