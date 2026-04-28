import React from 'react';
import { Outlet } from 'react-router-dom';
import PatientSidebar from '../components/common/PatientSidebar';
import PatientHeader from '../components/common/PatientHeader';

const PatientLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    return (
        <div className="flex min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display transition-colors">
            {/* Nav Sidebar */}
            <PatientSidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            
            {/* Main Area */}
            <main className="flex-1 lg:ml-72 flex flex-col min-w-0 relative bg-background-light dark:bg-background-dark transition-all duration-300">
                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[140] lg:hidden animate-in fade-in duration-300"
                        onClick={() => setIsSidebarOpen(false)}
                    ></div>
                )}

                <PatientHeader setIsSidebarOpen={setIsSidebarOpen} />
                
                {/* Content View */}
                <div className="flex-1 p-4 md:p-8">
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Outlet />
                    </div>
                </div>

            </main>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </div>
    );
};

export default PatientLayout;
