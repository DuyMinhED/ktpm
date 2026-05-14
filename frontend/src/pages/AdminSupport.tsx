import { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import Dropdown from '../components/ui/Dropdown';
import CreateTicketModal from '../features/admin/components/CreateTicketModal';
import SupportTicketDetailModal from '../features/admin/components/SupportTicketDetailModal';
import Toast from '../components/ui/Toast';
import { supportApi } from '../api/support';

export default function AdminSupport() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('Tất cả trạng thái');
  const [selectedPriority, setSelectedPriority] = useState('Tất cả cấp độ');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastTitle, setToastTitle] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const itemsPerPage = 10;
  const [isLoading, setIsLoading] = useState(true);

  const [stats, setStats] = useState([
    { label: 'Tổng yêu cầu', value: '0', icon: 'confirmation_number', color: 'primary' },
    { label: 'Mới', value: '0', icon: 'pending_actions', color: 'amber' },
    { label: 'Đang xử lý', value: '0', icon: 'loop', color: 'primary' },
    { label: 'Khẩn cấp', value: '0', icon: 'report_problem', color: 'red' },
  ]);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const response = await supportApi.getAllTickets({
        status: selectedStatus === 'Tất cả trạng thái' ? undefined : selectedStatus,
        priority: selectedPriority === 'Tất cả cấp độ' ? undefined : selectedPriority,
        page: currentPage - 1,
        size: itemsPerPage
      });

      const mappedTickets = response.data.content.map((t: any) => ({
        id: t.ticketCode || `TKT-${t.id}`,
        dbId: t.id,
        user: t.creator?.fullName || 'BS. Nguyễn Văn An',
        clinic: t.clinic?.name || 'Phòng khám Đức An',
        clinicCode: t.clinic?.clinicCode || 'VD-301',
        subject: t.subject,
        message: t.message,
        category: t.category,
        priority: t.priority,
        status: t.status,
        date: t.createdAt ? (new Date(t.createdAt).toLocaleDateString('vi-VN') + ' ' + new Date(t.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })) : '--',
        avatar: t.creator?.avatar || `https://i.pravatar.cc/150?u=${t.id}`
      }));

      setTickets(mappedTickets);
      setTotalElements(response.data.totalElements);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await supportApi.getStats();
      const s = response.data;
      setStats([
        { label: 'Tổng yêu cầu', value: s.total?.toString() || '0', icon: 'confirmation_number', color: 'primary' },
        { label: 'Mới', value: s['new']?.toString() || '0', icon: 'pending_actions', color: 'amber' },
        { label: 'Đang xử lý', value: s.processing?.toString() || '0', icon: 'loop', color: 'primary' },
        { label: 'Khẩn cấp', value: s.urgent?.toString() || '0', icon: 'report_problem', color: 'red' },
      ]);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [selectedStatus, selectedPriority, currentPage]);

  const statusOptions = ['Mới', 'Đang xử lý', 'Chờ phản hồi', 'Đã giải quyết', 'Đã đóng'];



  const handleStatusUpdate = async (id: string | number, newStatus: string, adminNote?: string) => {
    try {
      const ticket = tickets.find(t => t.id === id);
      if (!ticket) return;
      await supportApi.updateTicketStatus(ticket.dbId, newStatus, adminNote);
      await fetchTickets();
      await fetchStats();
      setIsTicketModalOpen(false);
      setToastTitle(adminNote ? "Đã gửi phản hồi thành công!" : "Đã cập nhật trạng thái yêu cầu");
      setShowToast(true);
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleOpenTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setIsTicketModalOpen(true);
  };

  const handleCreateTicket = async (data: any) => {
    setIsSaving(true);
    try {
      const response = await supportApi.createTicket({
        subject: data.subject,
        message: data.message,
        category: data.category,
        priority: data.priority,
        status: 'Mới'
      });
      setToastTitle("Gửi yêu cầu thành công!");
      setShowToast(true);
      fetchTickets();
      fetchStats();
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Failed to create ticket:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const search = searchTerm.toLowerCase();
    return (t.subject || '').toLowerCase().includes(search) ||
      (t.id || '').toString().toLowerCase().includes(search) ||
      (t.user || '').toLowerCase().includes(search);
  });

  const totalPages = Math.ceil(totalElements / itemsPerPage);
  const paginatedTickets = filteredTickets;

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, selectedPriority]);

  return (
    <AdminLayout>
      <section className="py-6 md:py-10 px-4 md:px-8 flex-1 flex flex-col space-y-6 md:space-y-8 animate-in fade-in duration-700 font-display text-left">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            {isLoading ? (
              <div className="space-y-3 mb-2">
                <div className="h-8 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-48 sm:w-64"></div>
                <div className="h-4 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded w-64 sm:w-96"></div>
              </div>
            ) : (
              <>
                <h2 className="text-lg md:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                  Trung tâm hỗ trợ
                </h2>
                <p className="text-[13px] md:text-[16px] text-slate-500 mt-1 font-medium">Tiếp nhận và quản lý các yêu cầu kỹ thuật từ đội ngũ bác sĩ & phòng khám.</p>
              </>
            )}
          </div>
          {isLoading ? (
            <div className="w-40 h-10 bg-primary/20 dark:bg-slate-800 animate-pulse rounded-xl shadow-sm"></div>
          ) : (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/20 active:scale-95 transition-all text-[14px] hover:shadow-primary/30"
            >
              Tạo yêu cầu mới
            </button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-primary/5 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
                <div className="h-4 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded w-24"></div>
                <div className="h-7 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-12"></div>
              </div>
            ))
          ) : (
            stats.map((stat, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-primary/5 shadow-sm">
                <p className="text-slate-500 text-[12px] md:text-[15px] font-medium mt-1">{stat.label}</p>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mt-1 leading-none">{stat.value}</h3>
              </div>
            ))
          )}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 p-4 md:p-8 rounded-2xl shadow-sm border border-primary/5 space-y-4 md:space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="relative col-span-2 md:col-span-1">
              <label className="text-[14px] font-medium text-slate-500 mb-2 block px-1">
                {isLoading ? <div className="h-3 bg-slate-100 dark:bg-slate-800 animate-pulse rounded w-32 mb-2"></div> : "Tìm kiếm yêu cầu"}
              </label>
              {isLoading ? (
                <div className="h-11 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl w-full"></div>
              ) : (
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] md:text-[20px] z-10 pointer-events-none">search</span>
                  <input
                    className="w-full bg-white dark:bg-slate-900 border border-slate-400 dark:border-slate-700 rounded-full pl-11 pr-4 h-[38px] md:h-[42px] text-[13px] md:text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none hover:border-slate-500 dark:hover:border-slate-500 focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                    placeholder="Tiêu đề, mã yêu cầu hoặc người gửi..."
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div>
              <label className="text-[14px] font-medium text-slate-500 mb-2 block px-1">
                {isLoading ? <div className="h-3 bg-slate-100 dark:bg-slate-800 animate-pulse rounded w-32 mb-2"></div> : "Trạng thái xử lý"}
              </label>
              {isLoading ? (
                <div className="h-11 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl w-full"></div>
              ) : (
                <Dropdown
                  options={['Tất cả trạng thái', 'Mới', 'Đang xử lý', 'Chờ phản hồi', 'Đã giải quyết', 'Đã đóng']}
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  icon={<span className="material-symbols-outlined text-[20px] text-slate-400">settings</span>}
                />
              )}
            </div>
            <div>
              <label className="text-[14px] font-medium text-slate-500 mb-2 block px-1">
                {isLoading ? <div className="h-3 bg-slate-100 dark:bg-slate-800 animate-pulse rounded w-24 mb-2"></div> : "Độ ưu tiên"}
              </label>
              {isLoading ? (
                <div className="h-11 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl w-full"></div>
              ) : (
                <Dropdown
                  options={['Tất cả cấp độ', 'Khẩn cấp', 'Cao', 'Trung bình', 'Thấp']}
                  value={selectedPriority}
                  onChange={setSelectedPriority}
                  icon={<span className="material-symbols-outlined text-[20px] text-slate-400">priority_high</span>}
                />
              )}
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-primary/5 relative">
          {/* Mobile Card View */}
          <div className="block md:hidden">
            {isLoading ? (
              [...Array(itemsPerPage)].map((_, i) => (
                <div key={i} className="p-4 border-b border-slate-100 dark:border-slate-800 animate-pulse">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32"></div>
                      <div className="h-3 bg-slate-100 dark:bg-slate-800/50 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                </div>
              ))
            ) : (
              paginatedTickets.map((t) => (
                <div key={t.id} className="p-4 border-b border-slate-50 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-2">
                    <img className="w-9 h-9 rounded-full ring-2 ring-primary/10 shrink-0" src={t.avatar} alt={t.user} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-black text-slate-900 dark:text-white truncate">{t.user}</p>
                      <p className="text-[11px] text-slate-400">{t.date}</p>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md shrink-0">{t.id}</span>
                  </div>
                  <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-2 line-clamp-2">{t.subject}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{t.priority}</span>
                      <Dropdown
                        options={statusOptions}
                        value={t.status}
                        onChange={(val) => handleStatusUpdate(t.id, val)}
                        variant="badge"
                      />
                    </div>
                    <button
                      onClick={() => handleOpenTicket(t)}
                      className="px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-primary text-[12px] font-medium border border-slate-200 dark:border-slate-700"
                    >
                      Xử lý
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Desktop Table View */}
          <div className="overflow-visible hidden md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 rounded-t-3xl">
                  <th className="px-8 py-5">
                    {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-20"></div> : <span className="text-[15px] font-medium text-slate-600">Mã yêu cầu</span>}
                  </th>
                  <th className="px-6 py-5">
                    {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-48"></div> : <span className="text-[15px] font-medium text-slate-600">Người gửi & Phòng khám</span>}
                  </th>
                  <th className="px-6 py-5">
                    {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-32"></div> : <span className="text-[15px] font-medium text-slate-600">Tiêu đề</span>}
                  </th>
                  <th className="px-6 py-5">
                    {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-16"></div> : <span className="text-[15px] font-medium text-slate-600">Ưu tiên</span>}
                  </th>
                  <th className="px-6 py-5">
                    {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-24"></div> : <span className="text-[15px] font-medium text-slate-600">Trạng thái</span>}
                  </th>
                  <th className="px-8 py-5 text-right">
                    {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-12 ml-auto"></div> : <span className="text-[15px] font-medium text-slate-600 text-right">Chi tiết</span>}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {isLoading ? (
                  [...Array(itemsPerPage)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-8 py-5">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20 mb-2"></div>
                        <div className="h-3 bg-slate-100 dark:bg-slate-800/50 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800"></div>
                          <div className="h-4 bg-slate-100 dark:bg-slate-800/50 rounded w-24"></div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-48"></div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-4 bg-slate-100 dark:bg-slate-800/50 rounded w-16"></div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-8 bg-slate-50 dark:bg-slate-800 rounded-xl w-32"></div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl ml-auto"></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  paginatedTickets.map((t) => (
                    <tr key={t.id} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-8 py-5">
                        <span className="text-[14px] font-bold">{t.id}</span>
                        <p className="text-[13px] text-slate-500 font-medium mt-0.5">{t.date}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3 relative group/tooltip">
                          <img className="w-9 h-9 rounded-full ring-2 ring-primary/10" src={t.avatar} alt={t.user} />
                          <div>
                            <p className="text-[14px] font-black text-slate-900 dark:text-white leading-tight cursor-default">{t.user}</p>
                          </div>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-10 mb-2 invisible group-hover/tooltip:visible opacity-0 group-hover/tooltip:opacity-100 transition-all duration-300 translate-y-2 group-hover/tooltip:translate-y-0 z-[100]">
                            <div className="bg-slate-900 text-white text-[12px] font-bold px-4 py-2 rounded-2xl whitespace-nowrap shadow-2xl relative">
                              {t.clinic}
                              <div className="absolute top-full left-4 border-[6px] border-transparent border-t-slate-900"></div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-[14px] font-bold text-slate-800 dark:text-slate-200 line-clamp-1 max-w-xs">{t.subject}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-[14px] font-bold text-slate-700 dark:text-slate-200">
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-6 py-5 min-w-[160px]">
                        <Dropdown
                          options={statusOptions}
                          value={t.status}
                          onChange={(val) => handleStatusUpdate(t.id, val)}
                          variant="badge"
                        />
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => handleOpenTicket(t)}
                          className="px-4 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10 transition-all font-medium text-[13px] border border-slate-200 dark:border-slate-700 shadow-sm">
                          Xử lý
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-8 py-5 bg-slate-50/50 dark:bg-slate-800/50 border-t border-primary/10 flex flex-col md:flex-row items-center justify-end gap-4">
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-2 rounded-md text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <span className="px-3 py-1.5 min-w-[90px] text-center rounded-full bg-primary text-white text-[13px] font-bold shadow-md tracking-tight whitespace-nowrap">
                Trang {currentPage}/{totalPages || 1}
              </span>
              <button
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-2 rounded-md text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>


        <SupportTicketDetailModal
          isOpen={isTicketModalOpen}
          onClose={() => setIsTicketModalOpen(false)}
          ticket={selectedTicket}
          onUpdateStatus={handleStatusUpdate}
        />
        <CreateTicketModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          isSaving={isSaving}
          onSave={handleCreateTicket}
        />

        <Toast
          show={showToast}
          title={toastTitle}
          onClose={() => setShowToast(false)}
        />
      </section>
    </AdminLayout>
  );
}
