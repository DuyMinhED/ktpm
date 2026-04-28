import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import AdminLayout from '../layouts/AdminLayout';
import Dropdown from '../components/ui/Dropdown';
import CreateServiceModal from '../features/admin/components/CreateServiceModal';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import { medicalServiceApi } from '../api/medicalService';
import { useToast } from '../components/ui/ToastContext';

export default function AdminServices() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả danh mục');
  const [selectedStatus, setSelectedStatus] = useState('Tất cả trạng thái');
  const { showToast: showNotification } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [deletingService, setDeletingService] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalServices: 0,
    activeServices: 0,
    totalEstimatedValue: 0,
    newRegistrations: 0,
    registrationGrowth: '+0%'
  });

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const [servicesRes, statsRes] = await Promise.all([
        medicalServiceApi.getAll(),
        medicalServiceApi.getStats()
      ]);

      if (servicesRes && servicesRes.data && servicesRes.data.data) {
        setServices(servicesRes.data.data);
      }
      if (statsRes && statsRes.data && statsRes.data.data) {
        setStats(statsRes.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch services and stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const categories = ['Tất cả danh mục', 'Gói điều trị', 'Tư vấn online', 'Dịch vụ tại nhà', 'Xét nghiệm chuyên sâu'];

  const filteredServices = services.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Tất cả danh mục' || s.category === selectedCategory;
    const matchesStatus = selectedStatus === 'Tất cả trạng thái' || (selectedStatus === 'Đang kinh doanh' && s.status === 'Đang kinh doanh') || (selectedStatus === 'Ngừng kinh doanh' && s.status === 'Ngừng kinh doanh');
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleToggleStatus = async (id: number, name: string) => {
    try {
      const res = await medicalServiceApi.toggleStatus(id);
      if (res && res.data && res.data.data) {
        setServices(services.map(s => s.id === id ? res.data.data : s));
        showNotification(`Đã chuyển trạng thái dịch vụ ${name}`, 'success');
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
      showNotification('Lỗi khi chuyển trạng thái', 'error');
    }
  };

  const handleSaveService = async (data: any) => {
    setIsSaving(true);
    try {
      if (editingService) {
        const res = await medicalServiceApi.update(editingService.id, data);
        if (res && res.data && res.data.data) {
          setServices(services.map(s => s.id === editingService.id ? res.data.data : s));
          showNotification(`Đã cập nhật dịch vụ ${data.name} thành công!`, 'success');
        }
      } else {
        const res = await medicalServiceApi.create(data);
        if (res && res.data && res.data.data) {
          setServices([res.data.data, ...services]);
          showNotification(`Đã khởi tạo dịch vụ ${data.name} thành công!`, 'success');
        }
      }
      setIsCreateModalOpen(false);
      setEditingService(null);
    } catch (error) {
      console.error('Failed to save service:', error);
      showNotification('Lỗi khi lưu dịch vụ', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (service: any) => {
    setEditingService(service);
    setIsCreateModalOpen(true);
  };

  const handleCreateOpen = () => {
    setEditingService(null);
    setIsCreateModalOpen(true);
  };

  const handleDeleteService = (service: any) => {
    setDeletingService(service);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingService) return;
    setIsSaving(true);
    try {
      await medicalServiceApi.delete(deletingService.id);
      setServices(services.filter(s => s.id !== deletingService.id));
      showNotification(`Đã xóa dịch vụ ${deletingService.name} thành công!`, 'success');
      setIsDeleteModalOpen(false);
      setDeletingService(null);
    } catch (error) {
      console.error('Failed to delete service:', error);
      showNotification('Lỗi khi xóa dịch vụ', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('Tất cả danh mục');
    setSelectedStatus('Tất cả trạng thái');
  };

  return (
    <AdminLayout>
      <section className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-700 font-display text-left">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            {isLoading ? (
              <div className="space-y-3 mb-2">
                <div className="h-8 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-48 sm:w-80"></div>
                <div className="h-4 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded w-64 sm:w-96"></div>
              </div>
            ) : (
              <>
                <h2 className="text-lg md:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">Quản lý dịch vụ</h2>
                <p className="text-[13px] md:text-[16px] text-slate-500 mt-1 font-medium">Thiết lập các gói chăm sóc sức khỏe và phí dịch vụ y tế.</p>
              </>
            )}
          </div>
          {isLoading ? (
            <div className="w-40 h-10 bg-slate-900 dark:bg-slate-800 animate-pulse rounded-lg shadow-sm"></div>
          ) : (
            <button
              onClick={handleCreateOpen}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all text-[14px]"
            >
              <span className="material-symbols-outlined text-[20px]">add_box</span>
              Tạo dịch vụ mới
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-primary/5 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse text-transparent">X</div>
                <div className="h-4 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded w-24"></div>
                <div className="h-7 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-16"></div>
              </div>
            ))
          ) : (
            [
              { label: 'Tổng số dịch vụ', value: stats.totalServices.toString(), icon: 'medical_information', color: 'primary' },
              { label: 'Gói khám hoạt động', value: stats.activeServices.toString(), icon: 'package_2', color: 'emerald' },
              { label: 'Ước tính (VNĐ)', value: (stats.totalEstimatedValue / 1000000).toFixed(0) + 'M', icon: 'payments', color: 'amber' },
              { label: 'Lượt đăng ký mới', value: `+${stats.newRegistrations}`, icon: 'trending_up', color: 'blue', subValue: stats.registrationGrowth }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-primary/5 shadow-sm hover:shadow-md transition-all">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-3 md:mb-4 ${stat.color === 'primary' ? 'bg-primary/10 text-primary' :
                  stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                    stat.color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                  <span className="material-symbols-outlined text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <p className="text-slate-500 text-[12px] md:text-[15px] font-medium">{stat.label}</p>
                  {stat.subValue && <span className="text-[11px] font-bold text-emerald-500">{stat.subValue}</span>}
                </div>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{stat.value}</h3>
              </div>
            ))
          )}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 p-4 md:p-8 rounded-2xl shadow-sm border border-primary/5 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="relative">
            <label className="text-[14px] font-medium text-slate-500 mb-2 block px-1">
              {isLoading ? <div className="h-3 bg-slate-100 dark:bg-slate-800 animate-pulse rounded w-32 mb-2"></div> : "Tìm kiếm dịch vụ"}
            </label>
            {isLoading ? (
              <div className="h-11 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl w-full"></div>
            ) : (
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-[20px] z-10 pointer-events-none group-focus-within:text-primary transition-colors">search</span>
                <input
                  className="w-full bg-white dark:bg-slate-900 border border-slate-400 dark:border-slate-700 rounded-full pl-11 pr-4 h-[38px] md:h-[42px] text-[13px] md:text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none hover:border-slate-500 dark:hover:border-slate-500 focus:border-primary focus:shadow-lg focus:shadow-primary/10 focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                  placeholder="Tên gói hoặc mã..."
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
          </div>
          <div>
            <label className="text-[14px] font-medium text-slate-500 mb-2 block px-1">
              {isLoading ? <div className="h-3 bg-slate-100 dark:bg-slate-800 animate-pulse rounded w-20 mb-2"></div> : "Danh mục"}
            </label>
            {isLoading ? (
              <div className="h-11 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl w-full"></div>
            ) : (
              <Dropdown
                options={categories}
                value={selectedCategory}
                onChange={setSelectedCategory}
                icon={<span className="material-symbols-outlined text-[20px] text-slate-400">category</span>}
              />
            )}
          </div>
          <div className="flex flex-col">
            <label className="text-[14px] font-medium text-slate-500 mb-2 block px-1">
              {isLoading ? <div className="h-3 bg-slate-100 dark:bg-slate-800 animate-pulse rounded w-20 mb-2"></div> : "Trạng thái"}
            </label>
            <div className="flex gap-3">
              <div className="flex-1">
                {isLoading ? (
                  <div className="h-11 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl w-full"></div>
                ) : (
                  <Dropdown
                    options={['Tất cả trạng thái', 'Đang kinh doanh', 'Ngừng kinh doanh']}
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    icon={<span className="material-symbols-outlined text-[20px] text-slate-400">check_circle</span>}
                  />
                )}
              </div>
              {(searchTerm || selectedCategory !== 'Tất cả danh mục' || selectedStatus !== 'Tất cả trạng thái') && (
                <button
                  onClick={handleResetFilters}
                  className="px-4 h-[38px] md:h-[42px] bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center gap-2 transition-all shadow-lg shadow-red-500/20 whitespace-nowrap text-[13px] md:text-[14px] font-bold"
                >
                  <span className="material-symbols-outlined text-[20px]">filter_alt_off</span>
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Services Grid/Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-primary/5 overflow-hidden shadow-sm p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="h-6 bg-slate-100 dark:bg-slate-800 animate-pulse rounded w-24"></div>
                  <div className="h-5 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-full w-20"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-5 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-3/4"></div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded w-1/4"></div>
                </div>
                <div className="flex gap-4">
                  <div className="h-12 bg-slate-50 dark:bg-slate-800/50 animate-pulse rounded-xl flex-1"></div>
                  <div className="h-12 bg-slate-50 dark:bg-slate-800/50 animate-pulse rounded-xl flex-1"></div>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="h-4 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded w-full"></div>
                  <div className="h-4 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded w-5/6"></div>
                  <div className="h-4 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded w-4/6"></div>
                </div>
              </div>
            ))
          ) : (
            filteredServices.map((service) => (
              <div key={service.id} className={`bg-white dark:bg-slate-900 rounded-2xl border border-primary/5 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col ${service.status === 'Ngừng kinh doanh' ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                <div className="p-6 space-y-4 flex-1">
                  <div className="flex justify-between items-start">
                    <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[13px] font-bold">{service.category}</span>
                    <span className={`px-4 py-1.5 rounded-full text-[13px] md:text-[14px] font-black tracking-tight ${service.status === 'Đang kinh doanh' ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}`}>
                      {service.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-[18px] md:text-[20px] font-black text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-primary transition-colors">{service.name}</h4>
                    <p className="text-slate-400 text-[13px] font-bold">Mã dịch vụ: {service.id}</p>
                  </div>
                  <div className="flex items-center gap-4 py-2">
                    <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl flex-1">
                      <p className="text-[13px] text-slate-400 font-bold mb-1">Giá dịch vụ</p>
                      <p className="text-[18px] md:text-[20px] font-black text-primary leading-none">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price)}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl flex-1">
                      <p className="text-[13px] text-slate-400 font-bold mb-1">Thời hạn</p>
                      <p className="text-[18px] md:text-[20px] font-black text-slate-700 dark:text-slate-200 leading-none">{service.duration}</p>
                    </div>
                  </div>
                  <ul className="space-y-3 pt-2">
                    {service.features.map((feature: string, i: number) => (
                      <li key={i} className="flex items-center gap-3 text-[15px] font-medium text-slate-600 dark:text-slate-400">
                        <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-primary/5 flex justify-between items-center">
                  <button
                    onClick={() => handleEditClick(service)}
                    className="text-slate-500 hover:text-primary font-bold text-[15px] transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[22px]">edit</span>
                    Chỉnh sửa
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleToggleStatus(service.id, service.name)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${service.status === 'Đang kinh doanh'
                        ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white'
                        : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                        }`}
                      title={service.status === 'Đang kinh doanh' ? 'Ngừng kinh doanh' : 'Kích hoạt lại'}
                    >
                      <span className="material-symbols-outlined text-[20px]">{service.status === 'Đang kinh doanh' ? 'block' : 'play_arrow'}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteService(service)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                      title="Xóa dịch vụ"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateServiceModal
            isOpen={isCreateModalOpen}
            onClose={() => {
              setIsCreateModalOpen(false);
              setEditingService(null);
            }}
            isSaving={isSaving}
            onSave={handleSaveService}
            initialData={editingService}
          />
        )}

        {isDeleteModalOpen && (
          <DeleteConfirmModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setDeletingService(null);
            }}
            onConfirm={handleConfirmDelete}
            title="Xác nhận xóa dịch vụ"
            description={`Bạn có chắc chắn muốn xóa dịch vụ "${deletingService?.name}" không? Hành động này không thể hoàn tác và sẽ ảnh hưởng đến các cơ sở đang sử dụng dịch vụ này.`}
            isLoading={isSaving}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
