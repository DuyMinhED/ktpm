import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactDOM from 'react-dom';
import DoctorSidebar from '../components/common/DoctorSidebar';
import TopBar from '../components/common/TopBar';
import Dropdown from '../components/ui/Dropdown';
import CreateTicketModal from '../features/admin/components/CreateTicketModal';
import { useToast } from '../components/ui/ToastContext';
import { supportApi } from '../api/support';

// Local inline modal for clean viewing of support ticket detail & admin feedback
const DoctorTicketDetailModal = ({ isOpen, onClose, ticket }: any) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!ticket) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Mới': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
            case 'Đang xử lý': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
            case 'Chờ phản hồi': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
            case 'Đã giải quyết': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
            case 'Đã đóng': return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/20 dark:bg-slate-950/60 backdrop-blur-[2px]"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 350 }}
                        className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200 dark:border-slate-800 italic-none font-display"
                    >
                        {/* Header */}
                        <div className="px-6 md:px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20 transition-all">
                            <div className="text-left">
                                <div className="flex items-center gap-3 mb-1">
                                    <h2 className="text-[20px] font-black text-slate-900 dark:text-white leading-tight">
                                        Chi tiết yêu cầu {ticket.id}
                                    </h2>
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${getStatusColor(ticket.status)}`}>
                                        {ticket.status}
                                    </span>
                                </div>
                                <p className="text-[12px] font-medium text-slate-500">Danh mục: {ticket.category} • Ưu tiên: {ticket.priority}</p>
                            </div>
                            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 transition-all">
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        {/* Scrollable Chat Body */}
                        <div className="px-6 md:px-8 py-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30 dark:bg-slate-950/20 space-y-6 text-left">
                            
                            {/* Request Block */}
                            <div className="flex gap-4 items-start">
                                <div className="w-10 h-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0 font-bold shadow-sm border border-primary/5">
                                    BS
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-700 shadow-sm flex-1">
                                    <div className="flex justify-between items-start mb-2 border-b border-slate-50 dark:border-slate-700 pb-2">
                                        <h4 className="text-[14.5px] font-extrabold text-slate-900 dark:text-white leading-snug flex-1 pr-4">{ticket.subject}</h4>
                                        <span className="text-[11px] font-medium text-slate-400 shrink-0 mt-0.5">{ticket.date}</span>
                                    </div>
                                    <p className="text-[14px] text-slate-600 dark:text-slate-300 font-medium italic-none leading-relaxed whitespace-pre-line">
                                        {ticket.message || 'Không có mô tả.'}
                                    </p>
                                </div>
                            </div>

                            {/* Admin Feedback Block */}
                            {ticket.adminNote ? (
                                <div className="flex gap-4 items-start flex-row-reverse">
                                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                                        <span className="material-symbols-outlined text-lg font-black">verified_user</span>
                                    </div>
                                    <div className="bg-emerald-50/40 dark:bg-emerald-950/20 p-5 rounded-2xl rounded-tr-none border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm flex-1 relative group overflow-hidden">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full -mr-4 -mt-4"></div>
                                        <div className="flex justify-between items-center mb-2 border-b border-emerald-100 dark:border-emerald-900/30 pb-2">
                                            <span className="text-[13px] font-black text-emerald-600 dark:text-emerald-400 tracking-wide flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm font-black">chat</span>
                                                PHẢN HỒI TỪ QUẢN TRỊ VIÊN
                                            </span>
                                        </div>
                                        <p className="text-[14px] text-slate-700 dark:text-slate-200 font-bold italic-none leading-relaxed whitespace-pre-line">
                                            {ticket.adminNote}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl py-8 text-slate-400 text-sm font-medium">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="material-symbols-outlined text-2xl text-slate-300 animate-pulse">hourglass_top</span>
                                        <span>Đang chờ Quản trị viên xử lý & phản hồi...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 md:px-8 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-white dark:bg-slate-900">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-[13px]"
                            >
                                Đóng
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default function DoctorSupport() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [selectedStatus, setSelectedStatus] = useState('Tất cả trạng thái');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const itemsPerPage = 10;
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);

    const currentUserId = localStorage.getItem('userId') || '1';

    const fetchCreatorTickets = async () => {
        setIsLoading(true);
        try {
            const response = await supportApi.getCreatorTickets(currentUserId, {
                status: selectedStatus === 'Tất cả trạng thái' ? undefined : selectedStatus,
                page: currentPage - 1,
                size: itemsPerPage
            });

            const mapped = (response.data.content || []).map((t: any) => ({
                id: t.ticketCode || `TKT-${t.id}`,
                dbId: t.id,
                user: t.creator?.fullName || 'Bác sĩ',
                subject: t.subject,
                message: t.message,
                adminNote: t.adminNote,
                category: t.category,
                priority: t.priority,
                status: t.status,
                date: t.createdAt ? (new Date(t.createdAt).toLocaleDateString('vi-VN') + ' ' + new Date(t.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })) : '--',
            }));

            setTickets(mapped);
            setTotalElements(response.data.totalElements || 0);
        } catch (error) {
            console.error("Failed to fetch doctor tickets:", error);
            showToast("Không thể lấy danh sách đơn hỗ trợ", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCreatorTickets();
    }, [selectedStatus, currentPage, currentUserId]);

    const handleCreateTicket = async (data: any) => {
        setIsSaving(true);
        try {
            await supportApi.createTicket({
                subject: data.subject,
                message: data.message,
                category: data.category,
                priority: data.priority,
                status: 'Mới'
            });
            showToast("Đã gửi yêu cầu hỗ trợ kỹ thuật thành công!", "success");
            fetchCreatorTickets();
            setIsCreateOpen(false);
        } catch (error) {
            console.error("Failed to create ticket:", error);
            showToast("Gửi yêu cầu thất bại. Vui lòng thử lại.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenDetail = (ticket: any) => {
        setSelectedTicket(ticket);
        setIsDetailOpen(true);
    };

    const filteredTickets = tickets.filter(t => {
        const s = searchTerm.toLowerCase();
        return (t.subject || '').toLowerCase().includes(s) ||
               (t.id || '').toLowerCase().includes(s);
    });

    const totalPages = Math.ceil(totalElements / itemsPerPage);

    // Reset pagination on filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedStatus]);

    const getStatusBadge = (status: string) => {
        let style = "";
        switch (status) {
            case 'Mới': style = "bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-800"; break;
            case 'Đang xử lý': style = "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800"; break;
            case 'Chờ phản hồi': style = "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800"; break;
            case 'Đã giải quyết': style = "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800"; break;
            case 'Đã đóng': style = "bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-700"; break;
            default: style = "bg-slate-50 text-slate-500 border-slate-100";
        }
        return <span className={`text-[12px] font-bold px-3 py-1.5 rounded-full border ${style}`}>{status}</span>;
    };

    return (
        <div className="flex min-h-screen font-display bg-background-light dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
            <DoctorSidebar isSidebarOpen={isSidebarOpen} />

            <div className="lg:ml-72 min-h-screen flex-1 flex flex-col bg-background-light dark:bg-slate-950">
                <TopBar
                    setIsSidebarOpen={setIsSidebarOpen}
                    notifications={notifications}
                    setNotifications={setNotifications}
                />

                <main className="p-4 md:p-8 flex-1 flex flex-col min-h-0 relative">
                    <section className="py-2 flex-1 flex flex-col space-y-6 md:space-y-8 animate-in fade-in duration-500 text-left font-display">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                    Hỗ trợ kỹ thuật
                                </h2>
                                <p className="text-[13px] md:text-[15px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Gửi yêu cầu hỗ trợ kỹ thuật và theo dõi phản hồi từ Quản trị viên hệ thống.</p>
                            </div>
                            <button
                                onClick={() => setIsCreateOpen(true)}
                                className="h-11 bg-primary hover:bg-primary/95 text-white px-6 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all text-[14px]"
                            >
                                <span className="material-symbols-outlined text-[20px]">add</span>
                                Tạo yêu cầu mới
                            </button>
                        </div>

                        {/* Main content box */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-6 md:p-8 flex flex-col space-y-6">
                            {/* Search & Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">search</span>
                                    <input
                                        type="text"
                                        placeholder="Tìm theo tiêu đề, mã yêu cầu..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700 rounded-xl pl-11 pr-10 h-[42px] text-[13.5px] font-medium text-slate-700 dark:text-slate-200 outline-none hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary transition-all"
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all flex items-center justify-center"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">close</span>
                                        </button>
                                    )}
                                </div>
                                <div className="w-full md:w-[220px] md:ml-auto">
                                    <Dropdown
                                        options={['Tất cả trạng thái', 'Mới', 'Đang xử lý', 'Chờ phản hồi', 'Đã giải quyết', 'Đã đóng']}
                                        value={selectedStatus}
                                        onChange={setSelectedStatus}
                                        icon={<span className="material-symbols-outlined text-[20px] text-slate-400">filter_list</span>}
                                    />
                                </div>
                            </div>

                            {/* Desktop and Mobile Table Layout */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden flex-1 flex flex-col relative text-left">
                                <div className="overflow-x-auto flex-1">
                                    <table className="w-full text-left min-w-[700px]">
                                        <thead>
                                            <tr className="bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                                                <th className="px-6 py-4 text-[14.5px] font-bold text-slate-600">Thời gian</th>
                                                <th className="px-6 py-4 text-[14.5px] font-bold text-slate-600">Tiêu đề hỗ trợ</th>
                                                <th className="px-6 py-4 text-[14.5px] font-bold text-slate-600">Danh mục</th>
                                                <th className="px-6 py-4 text-[14.5px] font-bold text-slate-600">Cấp độ</th>
                                                <th className="px-6 py-4 text-[14.5px] font-bold text-slate-600">Trạng thái</th>
                                                <th className="px-6 py-4 text-[14.5px] font-bold text-slate-600">Phản hồi</th>
                                                <th className="px-6 py-4 text-[14.5px] font-bold text-slate-600 text-right">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                            {isLoading ? (
                                                [...Array(3)].map((_, i) => (
                                                    <tr key={i} className="animate-pulse">
                                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-16"></div></td>
                                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-48"></div></td>
                                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-20"></div></td>
                                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-12"></div></td>
                                                        <td className="px-6 py-4"><div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full w-20"></div></td>
                                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24"></div></td>
                                                        <td className="px-6 py-4 text-right"><div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl w-16 ml-auto"></div></td>
                                                    </tr>
                                                ))
                                            ) : filteredTickets.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <span className="material-symbols-outlined text-4xl text-slate-300">folder_off</span>
                                                            <span>Không tìm thấy đơn hỗ trợ nào</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredTickets.map((ticket) => (
                                                    <tr key={ticket.dbId} className="hover:bg-slate-50/50 dark:hover:bg-slate-850 transition-all group">
                                                        <td className="px-6 py-4">
                                                            <span className="text-[13.5px] font-medium text-slate-700 dark:text-slate-300">{ticket.date}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-[14px] font-bold text-slate-800 dark:text-white line-clamp-1">{ticket.subject}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                                                                {ticket.category}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`text-[13px] font-bold ${ticket.priority === 'Khẩn cấp' ? 'text-rose-500' : ticket.priority === 'Cao' ? 'text-orange-500' : 'text-slate-600'}`}>
                                                                {ticket.priority}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {getStatusBadge(ticket.status)}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {ticket.adminNote ? (
                                                                <span className="inline-flex items-center gap-1 text-[12.5px] text-emerald-600 dark:text-emerald-400 font-bold">
                                                                    <span className="material-symbols-outlined text-sm font-black">check_circle</span> Đã phản hồi
                                                                </span>
                                                            ) : (
                                                                <span className="text-[12.5px] text-slate-400 font-medium italic">Chưa có phản hồi</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => handleOpenDetail(ticket)}
                                                                className="px-4 py-1.5 bg-slate-100 hover:bg-primary/10 text-slate-600 hover:text-primary dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-bold text-[12.5px] rounded-xl transition-all shadow-sm border border-slate-200 dark:border-slate-700 whitespace-nowrap"
                                                            >
                                                                Xem chi tiết
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Footer */}
                                <div className="px-6 py-4 bg-slate-50/40 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center">
                                    <div className="flex items-center gap-2">
                                        <button
                                            disabled={currentPage === 1 || isLoading}
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            className="p-1.5 rounded-lg text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-all disabled:opacity-30"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                                        </button>
                                        <span className="px-3.5 py-1 text-[12.5px] font-extrabold bg-primary text-white rounded-full shadow-md">
                                            Trang {currentPage}/{totalPages || 1}
                                        </span>
                                        <button
                                            disabled={currentPage === totalPages || totalPages === 0 || isLoading}
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            className="p-1.5 rounded-lg text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-all disabled:opacity-30"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DoctorTicketDetailModal
                            isOpen={isDetailOpen}
                            onClose={() => setIsDetailOpen(false)}
                            ticket={selectedTicket}
                        />

                        <CreateTicketModal
                            isOpen={isCreateOpen}
                            onClose={() => setIsCreateOpen(false)}
                            isSaving={isSaving}
                            onSave={handleCreateTicket}
                        />
                    </section>
                </main>
            </div>
        </div>
    );
}
