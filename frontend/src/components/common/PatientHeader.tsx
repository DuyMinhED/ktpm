import React from 'react';

interface PatientHeaderProps {
    setIsSidebarOpen: (isOpen: boolean) => void;
}

const PatientHeader: React.FC<PatientHeaderProps> = ({ setIsSidebarOpen }) => {
    return (
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-primary/5 px-4 md:px-8 flex items-center justify-between sticky top-0 z-[100] transition-all">
            <div className="flex items-center gap-4 flex-1 text-left">
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl"
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>

                <div className="relative group max-w-md w-full hidden md:block">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors font-bold text-xl">search</span>
                    <input 
                        className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary/50 text-sm outline-none transition-all" 
                        placeholder="Tìm kiếm thông tin y tế..." 
                        type="search" 
                    />
                </div>
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
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest hidden xs:inline">VN</span>
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
                <div className="relative">
                    <button className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-background-light dark:bg-slate-800 text-slate-600 relative transition-all hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 group">
                        <span className="material-symbols-outlined text-xl font-bold group-hover:text-primary transition-colors">notifications</span>
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
                    </button>
                </div>

                <button className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-background-light dark:bg-slate-800 text-slate-600 transition-all hover:bg-slate-200 dark:hover:bg-slate-700 group">
                    <span className="material-symbols-outlined text-xl font-bold group-hover:text-primary transition-colors">settings</span>
                </button>
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

export default PatientHeader;
