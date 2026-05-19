import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Dropdown from '../../../components/ui/Dropdown';

interface AddHealthMetricModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (metricData: any) => void;
    isSaving?: boolean;
    initialType?: string;
    lastValues?: Record<string, { value: string | number, valueSecondary?: string | number | null }>;
}

const AddHealthMetricModal: React.FC<AddHealthMetricModalProps> = ({ isOpen, onClose, onSave, isSaving, initialType, lastValues }) => {
    const [metricType, setMetricType] = useState('BLOOD_PRESSURE');
    const [value, setValue] = useState('');
    const [valueSecondary, setValueSecondary] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
    const [notes, setNotes] = useState('');

    const metricOptions = [
        { label: 'Huyết áp', value: 'BLOOD_PRESSURE' },
        { label: 'Đường huyết', value: 'BLOOD_SUGAR' },
        { label: 'Nhịp tim', value: 'HEART_RATE' },
        { label: 'HbA1c', value: 'HBA1C' },
        { label: 'Nồng độ Oxy', value: 'SPO2' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!onSave) return;

        const measuredAt = `${date}T${time}:00`;
        onSave({
            metricType,
            value: parseFloat(value),
            valueSecondary: valueSecondary ? parseFloat(valueSecondary) : null,
            measuredAt,
            notes
        });
    };

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            const type = initialType || 'BLOOD_PRESSURE';
            setMetricType(type);
            
            // Pre-fill from lastValues if available
            if (lastValues && lastValues[type]) {
                setValue(String(lastValues[type].value || ''));
                setValueSecondary(String(lastValues[type].valueSecondary || ''));
            } else {
                setValue('');
                setValueSecondary('');
            }
            
            setNotes('');
            
            // Set current date and time
            const now = new Date();
            setDate(now.toISOString().split('T')[0]);
            setTime(now.toTimeString().slice(0, 5));
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, initialType, lastValues]);

    useEffect(() => {
        if (isOpen && lastValues && lastValues[metricType]) {
            setValue(String(lastValues[metricType].value || ''));
            setValueSecondary(String(lastValues[metricType].valueSecondary || ''));
        }
    }, [metricType, isOpen, lastValues]);

    if (!isOpen) return null;

    const isBloodPressure = metricType === 'BLOOD_PRESSURE';

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Modal Backdrop */}
            <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] transition-all duration-300" onClick={onClose}></div>

            {/* Modal Container */}
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in duration-300 border border-slate-200 dark:border-slate-800 font-display">
                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20">
                    <h2 className="text-[20px] font-semibold text-slate-800 dark:text-white tracking-tight leading-tight">Nhập chỉ số sức khỏe</h2>
                </div>

                {/* Form Body */}
                <div className="px-6 py-6 overflow-y-auto custom-scrollbar text-left flex-1 bg-white dark:bg-slate-900/50 space-y-4">
                    <form id="health-metric-form" onSubmit={handleSubmit} className="space-y-3">
                        <div className="grid grid-cols-[1.2fr,1fr] gap-4 items-end">
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 ml-1">Loại chỉ số</label>
                                <Dropdown
                                    options={metricOptions}
                                    value={metricType}
                                    onChange={setMetricType}
                                    className="z-[50]"
                                />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 ml-1">
                                    {isBloodPressure ? 'Huyết áp (mmHg)' : 'Giá trị'}
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl h-[40px] px-4 focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-white outline-none transition-all font-medium text-[14px]"
                                        placeholder={isBloodPressure ? "120/80" : "5.6"}
                                        type="text"
                                        required
                                        value={isBloodPressure ? (value && valueSecondary ? `${value}/${valueSecondary}` : value) : value}
                                        onChange={(e) => {
                                            if (isBloodPressure) {
                                                const val = e.target.value;
                                                if (val.includes('/')) {
                                                    const parts = val.split('/');
                                                    setValue(parts[0]);
                                                    setValueSecondary(parts[1] || '');
                                                } else {
                                                    setValue(val);
                                                }
                                            } else {
                                                setValue(e.target.value);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 ml-1">Ngày đo</label>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[11px] font-medium text-slate-500 ml-2">Ngày</span>
                                    <Dropdown
                                        options={Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'))}
                                        value={date.split('-')[2]}
                                        onChange={(d) => {
                                            const parts = date.split('-');
                                            parts[2] = d;
                                            setDate(parts.join('-'));
                                        }}
                                    />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[11px] font-medium text-slate-500 ml-2">Tháng</span>
                                    <Dropdown
                                        options={Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'))}
                                        value={date.split('-')[1]}
                                        onChange={(m) => {
                                            const parts = date.split('-');
                                            parts[1] = m;
                                            setDate(parts.join('-'));
                                        }}
                                    />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[11px] font-medium text-slate-500 ml-2">Năm</span>
                                    <Dropdown
                                        options={Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString())}
                                        value={date.split('-')[0]}
                                        onChange={(y) => {
                                            const parts = date.split('-');
                                            parts[0] = y;
                                            setDate(parts.join('-'));
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 ml-1">Giờ đo</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="custom-input-group">
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl h-[40px] px-4 focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-white outline-none transition-all font-medium text-[14px]"
                                        placeholder="HH:mm"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                    />
                                    <span className="material-symbols-outlined custom-input-icon">schedule</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => setTime(new Date().toTimeString().slice(0, 5))}
                                        className="h-[40px] px-4 rounded-xl border border-primary/20 bg-primary/5 text-primary text-[13px] font-medium hover:bg-primary/10 transition-all flex items-center gap-1.5"
                                    >
                                        <span className="material-symbols-outlined text-[19px]">history</span>
                                        Bây giờ
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 ml-1">Ghi chú / Triệu chứng</label>
                            <textarea
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-white outline-none transition-all resize-none font-medium text-[14px] h-[72px]"
                                placeholder="Nhập tình trạng sức khỏe hiện tại của bạn..."
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            ></textarea>
                        </div>
                    </form>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 rounded-b-3xl z-10">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-[14px] font-bold text-slate-500 hover:bg-slate-100 transition-all"
                        type="button"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="submit"
                        form="health-metric-form"
                        disabled={isSaving}
                        className={`px-8 py-2.5 bg-primary text-white text-[14px] font-bold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${isSaving ? 'cursor-not-allowed' : ''}`}
                    >
                        {isSaving ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Đang lưu...</span>
                            </div>
                        ) : (
                            'Lưu chỉ số'
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AddHealthMetricModal;
