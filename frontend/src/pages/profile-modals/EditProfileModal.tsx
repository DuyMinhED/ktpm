import React, { useState, useEffect } from 'react';
import Dropdown from '../../components/ui/Dropdown';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    initialData: any;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState<any>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData({
                fullName: initialData.fullName || '',
                dateOfBirth: initialData.dateOfBirth || '',
                gender: initialData.gender || 'MALE',
                phone: initialData.phone || '',
                email: initialData.email || '',
                address: initialData.address || '',
                identityCard: initialData.identityCard || '',
                occupation: initialData.occupation || '',
                ethnicity: initialData.ethnicity || 'Kinh',
                healthInsuranceNumber: initialData.healthInsuranceNumber || '',
                bloodType: initialData.bloodType || '',
                heightCm: initialData.heightCm || '',
                weightKg: initialData.weightKg || '',
                avatarUrl: initialData.avatarUrl || '',
                medicalHistory: initialData.chronicDiseases ? initialData.chronicDiseases.join(', ') : '',
                allergies: initialData.allergies ? initialData.allergies.join(', ') : '',
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
            console.error("Failed to update profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 font-display">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-all duration-300" onClick={onClose}></div>

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 max-h-[90vh]">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        Chỉnh sửa hồ sơ cá nhân
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                        <span className="material-symbols-outlined text-slate-400">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar space-y-8 text-left">
                    {/* Section 0: Avatar */}
                    <div className="space-y-4">
                        <h3 className="text-[14px] font-bold text-primary flex items-center gap-2">
                            Ảnh đại diện
                        </h3>
                        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                            <div className="size-24 rounded-full border-4 border-primary/20 bg-primary/10 flex items-center justify-center text-primary overflow-hidden shrink-0">
                                {formData.avatarUrl ? (
                                    <img src={formData.avatarUrl} alt="Avatar" className="size-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-4xl">person</span>
                                )}
                            </div>
                            <div className="flex-1 w-full space-y-3">
                                <div className="space-y-2">
                                    <label className="text-[13px] font-medium text-slate-600 block">Chọn biểu tượng đại diện</label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            'https://api.dicebear.com/7.x/micah/svg?seed=Felix&backgroundColor=b6e3f4',
                                            'https://api.dicebear.com/7.x/micah/svg?seed=Aneka&backgroundColor=ffdfbf',
                                            'https://api.dicebear.com/7.x/micah/svg?seed=Mimi&backgroundColor=c0aede',
                                            'https://api.dicebear.com/7.x/micah/svg?seed=Max&backgroundColor=ffd5dc',
                                            'https://api.dicebear.com/7.x/micah/svg?seed=Leo&backgroundColor=d1d4f9',
                                            'https://api.dicebear.com/7.x/micah/svg?seed=Oliver&backgroundColor=c2f5e0'
                                        ].map((url, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setFormData((prev: any) => ({ ...prev, avatarUrl: url }))}
                                                className="size-10 rounded-full overflow-hidden border-2 hover:border-primary transition-colors focus:outline-none"
                                            >
                                                <img src={url} alt={`Preset ${idx}`} className="size-full bg-slate-100 object-cover" />
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setFormData((prev: any) => ({ ...prev, avatarUrl: '' }))}
                                            className="h-10 px-3 rounded-full border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                                        >
                                            Bỏ ảnh
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 1: Administrative */}
                    <div className="space-y-4">
                        <h3 className="text-[14px] font-bold text-primary flex items-center gap-2">
                            Thông tin hành chính
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[13px] font-medium text-slate-600">Họ và tên</label>
                                <input
                                    name="fullName" value={formData.fullName} onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-sm focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[13px] font-medium text-slate-600">Ngày sinh</label>
                                <input
                                    type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-sm focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[13px] font-medium text-slate-600">Giới tính</label>
                                <Dropdown
                                    options={[
                                        { label: 'Nam', value: 'MALE' },
                                        { label: 'Nữ', value: 'FEMALE' },
                                        { label: 'Khác', value: 'OTHER' }
                                    ]}
                                    value={formData.gender}
                                    onChange={(val) => setFormData((prev: any) => ({ ...prev, gender: val }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[13px] font-medium text-slate-600">Số định danh (CCCD)</label>
                                <input
                                    name="identityCard" value={formData.identityCard} onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-sm focus:border-primary outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Contact */}
                    <div className="space-y-4">
                        <h3 className="text-[14px] font-bold text-primary flex items-center gap-2">
                            Thông tin liên lạc
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[13px] font-medium text-slate-600">Số điện thoại</label>
                                <input
                                    name="phone" value={formData.phone} onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-sm focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[13px] font-medium text-slate-600">Email</label>
                                <input
                                    type="email" name="email" value={formData.email} onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-sm focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-[13px] font-medium text-slate-600">Địa chỉ thường trú</label>
                                <input
                                    name="address" value={formData.address} onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-sm focus:border-primary outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Professional & Health Card */}
                    <div className="space-y-4">
                        <h3 className="text-[14px] font-bold text-primary flex items-center gap-2">
                            Nghề nghiệp & Bảo hiểm
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[13px] font-medium text-slate-600">Nghề nghiệp</label>
                                <input
                                    name="occupation" value={formData.occupation} onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-sm focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[13px] font-medium text-slate-600">Số thẻ Bảo Hiểm Y Tế</label>
                                <input
                                    name="healthInsuranceNumber" value={formData.healthInsuranceNumber} onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-sm focus:border-primary outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Section 3.5: Medical History & Allergies */}
                    <div className="space-y-4">
                        <h3 className="text-[14px] font-bold text-primary flex items-center gap-2">
                            Thông tin y tế cá nhân
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[13px] font-medium text-slate-600">Tiền sử bệnh lý (mãn tính)</label>
                                <textarea
                                    name="medicalHistory" value={formData.medicalHistory || ''} 
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, medicalHistory: e.target.value }))}
                                    placeholder="VD: Cao huyết áp, Tiểu đường..."
                                    rows={2}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-sm focus:border-primary outline-none transition-all resize-none custom-scrollbar"
                                ></textarea>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[13px] font-medium text-slate-600">Thông tin dị ứng</label>
                                <textarea
                                    name="allergies" value={formData.allergies || ''} 
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, allergies: e.target.value }))}
                                    placeholder="VD: Dị ứng phấn hoa, Dị ứng Penicillin..."
                                    rows={2}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-sm focus:border-primary outline-none transition-all resize-none custom-scrollbar"
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Physical Metrics */}
                    <div className="space-y-4">
                        <h3 className="text-[14px] font-bold text-primary flex items-center gap-2">
                            Chỉ số cơ thể
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-[13px] font-medium text-slate-600">Nhóm máu</label>
                                <Dropdown
                                    options={[
                                        { label: 'Chưa rõ', value: '' },
                                        { label: 'A+', value: 'A+' },
                                        { label: 'A-', value: 'A-' },
                                        { label: 'B+', value: 'B+' },
                                        { label: 'B-', value: 'B-' },
                                        { label: 'AB+', value: 'AB+' },
                                        { label: 'AB-', value: 'AB-' },
                                        { label: 'O+', value: 'O+' },
                                        { label: 'O-', value: 'O-' }
                                    ]}
                                    value={formData.bloodType || ''}
                                    onChange={(val) => setFormData((prev: any) => ({ ...prev, bloodType: val }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[13px] font-medium text-slate-600">Chiều cao (cm)</label>
                                <input
                                    type="number"
                                    name="heightCm" value={formData.heightCm} onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-sm focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[13px] font-medium text-slate-600">Cân nặng (kg)</label>
                                <input
                                    type="number" step="0.1"
                                    name="weightKg" value={formData.weightKg} onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-sm focus:border-primary outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </form>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                        Hủy bỏ
                    </button>
                    <button onClick={handleSubmit} disabled={loading} className="px-8 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2">
                        {loading && <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                        Lưu thay đổi
                    </button>
                </div>
            </div >
        </div >
    );
};

export default EditProfileModal;
