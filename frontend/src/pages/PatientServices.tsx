import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { medicalServiceApi } from '../api/medicalService';
import { useToast } from '../components/ui/ToastContext';

const PatientServices: React.FC = () => {
    const [services, setServices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();
    
    // Simulation state for subscribed service
    const [subscribedId, setSubscribedId] = useState<number | null>(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchServices = useCallback(async () => {
        setIsLoading(true);
        try {
            const clinicIdStr = localStorage.getItem('clinicId');
            const clinicId = clinicIdStr ? Number(clinicIdStr) : undefined;
            const res = await medicalServiceApi.getAll(clinicId);
            if (res && res.data && res.data.data) {
                // Filter to only active services
                const active = res.data.data.filter((s: any) => s.status === 'Đang kinh doanh');
                setServices(active);
            }
        } catch (error) {
            console.error('Failed to fetch medical services:', error);
            showToast('Không thể tải danh sách dịch vụ', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchServices();
        // Load subscription from simulator localStorage
        const sub = localStorage.getItem('simulatedSubscribedServiceId');
        if (sub) {
            setSubscribedId(Number(sub));
        }
    }, [fetchServices]);

    const handleOpenConfirm = (service: any) => {
        setSelectedService(service);
        setConfirmModalOpen(true);
    };

    const handleConfirmSubscription = async () => {
        if (!selectedService) return;
        setIsProcessing(true);
        
        // Simulate backend registration processing delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        try {
            localStorage.setItem('simulatedSubscribedServiceId', selectedService.id.toString());
            setSubscribedId(selectedService.id);
            showToast(`Đăng ký gói "${selectedService.name}" thành công!`, 'success');
            setConfirmModalOpen(false);
        } catch (e) {
            showToast('Đăng ký thất bại, vui lòng thử lại sau', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancelSubscription = () => {
        localStorage.removeItem('simulatedSubscribedServiceId');
        setSubscribedId(null);
        showToast('Đã hủy đăng ký gói dịch vụ hiện tại', 'success');
    };

    const activeSubscription = services.find(s => s.id === subscribedId);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 text-left font-display">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h2 className="text-xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">Gói dịch vụ chăm sóc</h2>
                <p className="text-[14px] md:text-[16px] text-slate-500 font-medium">Lựa chọn giải pháp theo dõi sức khỏe chuyên biệt từ đội ngũ bác sĩ hàng đầu.</p>
            </div>

            {/* Top Banner for active subscription */}
            {activeSubscription && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20 dark:border-primary/30 rounded-2xl p-6 relative overflow-hidden shadow-sm"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined text-3xl filled">verified</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-extrabold bg-primary text-slate-900 px-2 py-0.5 rounded-full uppercase">Đang hoạt động</span>
                                    <p className="text-slate-400 text-[13px] font-bold">Hạn gói: {activeSubscription.duration}</p>
                                </div>
                                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mt-1">{activeSubscription.name}</h3>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <button 
                                onClick={handleCancelSubscription}
                                className="px-6 py-2.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900/30 hover:text-red-500 rounded-xl font-bold text-[14px] transition-all flex items-center justify-center gap-2 flex-1 md:flex-initial shadow-sm active:scale-95"
                            >
                                Hủy gói
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Main Services Grid */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <span className="material-symbols-outlined text-primary">grid_view</span>
                    <h4 className="text-lg font-bold">Khám phá danh mục dịch vụ</h4>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl border border-primary/5 overflow-hidden shadow-sm p-6 space-y-6 animate-pulse">
                                <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-24"></div>
                                <div className="space-y-2">
                                    <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                                    <div className="h-4 bg-slate-100 dark:bg-slate-800/50 rounded w-1/3"></div>
                                </div>
                                <div className="h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl"></div>
                                <div className="space-y-3">
                                    {[...Array(4)].map((_, j) => (
                                        <div key={j} className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800"></div>
                                            <div className="h-3 bg-slate-100 dark:bg-slate-800/50 rounded w-full"></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full pt-2"></div>
                            </div>
                        ))}
                    </div>
                ) : services.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                        {services.map((service) => {
                            const isCurrent = service.id === subscribedId;
                            const isPopular = service.category?.toLowerCase().includes('tiêu đường') || service.price >= 2000000; // Simulating recommendation logic
                            
                            return (
                                <motion.div
                                    key={service.id}
                                    whileHover={{ y: -6 }}
                                    className={`relative bg-white dark:bg-slate-900 rounded-[2rem] border flex flex-col transition-all duration-300 group shadow-sm hover:shadow-xl hover:shadow-primary/5 ${
                                        isCurrent 
                                        ? 'border-primary bg-gradient-to-b from-primary/5 to-transparent' 
                                        : isPopular
                                        ? 'border-blue-200 dark:border-slate-800 md:scale-105 md:z-10 shadow-md relative before:absolute before:-inset-px before:rounded-[2rem] before:bg-gradient-to-b before:from-blue-400/20 before:to-transparent before:-z-10'
                                        : 'border-slate-200 dark:border-slate-800'
                                    }`}
                                >
                                    {/* Popular Tag */}
                                    {isPopular && !isCurrent && (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-primary text-slate-900 px-4 py-1 rounded-full font-black text-[11px] uppercase tracking-widest shadow-lg whitespace-nowrap z-20">
                                            Đề xuất phổ biến
                                        </div>
                                    )}

                                    <div className="p-6 md:p-8 flex-1 flex flex-col">
                                        {/* Category & Status Badge */}
                                        <div className="flex justify-between items-start mb-6">
                                            <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-[12.5px] font-bold uppercase tracking-wider">{service.category}</span>
                                            {isCurrent && (
                                                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-slate-900 text-[12px] font-black">
                                                    <span className="material-symbols-outlined text-[14px] filled">check</span> Gói của bạn
                                                </span>
                                            )}
                                        </div>

                                        {/* Name & ID */}
                                        <div className="mb-6">
                                            <h4 className="text-[20px] md:text-[22px] font-black text-slate-900 dark:text-white leading-tight group-hover:text-primary transition-colors mb-1">{service.name}</h4>
                                            <p className="text-slate-400 dark:text-slate-500 text-[13px] font-bold flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">schedule</span>
                                                Thời hạn: {service.duration}
                                            </p>
                                        </div>

                                        {/* Price Block */}
                                        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-5 rounded-2xl border border-slate-100 dark:border-slate-800 mb-8 text-left">
                                            <p className="text-[13px] text-slate-500 font-bold mb-1 uppercase tracking-wide">Mức chi phí trọn gói</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Features List */}
                                        <div className="flex-1">
                                            <p className="text-[13px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Đặc quyền đi kèm:</p>
                                            <ul className="space-y-3.5">
                                                {service.features && service.features.length > 0 ? (
                                                    service.features.map((feature: string, idx: number) => (
                                                        <li key={idx} className="flex items-start gap-3.5 text-[14.5px] font-medium text-slate-700 dark:text-slate-300 leading-tight">
                                                            <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">check_circle</span>
                                                            <span>{feature}</span>
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className="text-[14px] text-slate-500 italic">Không có đặc quyền nào</li>
                                                )}
                                            </ul>
                                        </div>

                                        {/* Action CTA */}
                                        <div className="mt-8">
                                            <button
                                                disabled={isCurrent}
                                                onClick={() => handleOpenConfirm(service)}
                                                className={`w-full py-3.5 rounded-xl font-extrabold text-[15px] tracking-tight transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                                                    isCurrent 
                                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 shadow-none border border-slate-200 dark:border-slate-800 cursor-not-allowed' 
                                                    : isPopular
                                                    ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 shadow-slate-900/10 dark:hover:bg-slate-100'
                                                    : 'bg-primary text-slate-900 hover:bg-primary/90 shadow-primary/20'
                                                }`}
                                            >
                                                {isCurrent ? 'Đang sử dụng' : 'Đăng ký gói này'}
                                                {!isCurrent && <span className="material-symbols-outlined text-[20px]">arrow_right_alt</span>}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
                        <div className="flex flex-col items-center gap-3 text-slate-400 max-w-xs mx-auto">
                            <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-700">medical_services</span>
                            <h5 className="font-bold text-slate-800 dark:text-white text-base mt-2">Chưa có gói dịch vụ khả dụng</h5>
                            <p className="text-xs font-medium text-slate-500">Ban quản trị đang hoàn thiện hệ thống bảng giá, vui lòng quay lại sau.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {confirmModalOpen && selectedService && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[4px]"
                            onClick={() => !isProcessing && setConfirmModalOpen(false)}
                        ></motion.div>

                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-primary/10 overflow-hidden flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-xl text-primary">
                                        <span className="material-symbols-outlined font-bold">shopping_bag</span>
                                    </div>
                                    <h3 className="text-[18px] font-black text-slate-900 dark:text-white tracking-tight">Xác nhận đăng ký</h3>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 text-left space-y-5 bg-white dark:bg-slate-900">
                                <div>
                                    <p className="text-slate-500 text-[13px] font-bold uppercase">Dịch vụ lựa chọn:</p>
                                    <h4 className="text-[19px] font-black text-slate-900 dark:text-white leading-tight mt-0.5">{selectedService.name}</h4>
                                    <div className="flex gap-2 mt-1.5">
                                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400">{selectedService.category}</span>
                                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400">Hạn {selectedService.duration}</span>
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="text-slate-500 font-bold text-[13px]">Tổng cộng chi phí:</span>
                                        <span className="text-xl font-black text-slate-900 dark:text-white">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedService.price)}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-400">*Chi phí trọn gói, không phát sinh phụ thu trong suốt kỳ hạn.</p>
                                </div>

                                <div className="flex items-start gap-3 text-[13px] text-slate-500 font-medium leading-relaxed">
                                    <span className="material-symbols-outlined text-amber-500 text-[18px] shrink-0">info</span>
                                    <p>Bằng cách bấm "Xác nhận", bạn đồng ý đăng ký gói chăm sóc. Sau khi đăng ký, điều phối viên y tế của chúng tôi sẽ trực tiếp liên hệ trong vòng 24 giờ để thiết lập lộ trình theo dõi.</p>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-5 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                                <button
                                    disabled={isProcessing}
                                    onClick={() => setConfirmModalOpen(false)}
                                    className="px-5 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50"
                                >
                                    Đóng
                                </button>
                                <button
                                    disabled={isProcessing}
                                    onClick={handleConfirmSubscription}
                                    className="px-6 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-sm font-black rounded-xl hover:opacity-90 transition-all shadow-lg flex items-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></span>
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            Xác nhận đăng ký
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
                .filled { font-variation-settings: 'FILL' 1; }
            `}</style>
        </div>
    );
};

export default PatientServices;
