import React, { useState, useEffect } from 'react';

interface EmergencyContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    initialData?: any;
}

const EmergencyContactModal: React.FC<EmergencyContactModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState<any>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                contactName: initialData?.contactName || '',
                relationship: initialData?.relationship || '',
                phone: initialData?.phone || '',
                isPrimary: initialData?.isPrimary !== undefined ? initialData.isPrimary : true
            });
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error("Failed to save emergency contact:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev: any) => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 font-display">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-all duration-300" onClick={onClose}></div>
            
            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>emergency_home</span>
                        {initialData ? 'Cập nhật liên hệ' : 'Thêm liên hệ khẩn cấp'}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                        <span className="material-symbols-outlined text-slate-400">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
                    <div className="space-y-1">
                        <label className="text-[13px] font-bold text-slate-500">Họ và tên người thân</label>
                        <input 
                            name="contactName" value={formData.contactName} onChange={handleChange} required
                            placeholder="Ví dụ: Nguyễn Thị B"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-sm focus:border-primary outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[13px] font-bold text-slate-500">Mối quan hệ</label>
                        <input 
                            name="relationship" value={formData.relationship} onChange={handleChange} required
                            placeholder="Ví dụ: Vợ, Chồng, Con..."
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-sm focus:border-primary outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[13px] font-bold text-slate-500">Số điện thoại</label>
                        <input 
                            name="phone" value={formData.phone} onChange={handleChange} required
                            placeholder="Nhập số điện thoại"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-sm focus:border-primary outline-none transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <input 
                            type="checkbox" id="isPrimary" name="isPrimary" 
                            checked={formData.isPrimary} onChange={handleChange}
                            className="size-5 rounded border-primary text-primary focus:ring-primary cursor-pointer"
                        />
                        <label htmlFor="isPrimary" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                            Đây là liên hệ ưu tiên
                        </label>
                    </div>
                </form>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                        Hủy
                    </button>
                    <button onClick={handleSubmit} disabled={loading} className="px-8 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2">
                        {loading && <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                        {initialData ? 'Cập nhật' : 'Thêm mới'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmergencyContactModal;
