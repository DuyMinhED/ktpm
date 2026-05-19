import React, { useState, useEffect } from 'react';

interface RecordMetricModalProps {
    isOpen: boolean;
    onClose: () => void;
    isSaving: boolean;
    patientData?: any;
    onSave: (data: {
        glucose?: string;
        bpSystolic?: string;
        bpDiastolic?: string;
        heartRate?: string;
        spo2?: string;
        notes?: string;
    }) => Promise<void>;
}

export default function RecordMetricModal({
    isOpen,
    onClose,
    isSaving,
    patientData,
    onSave
}: RecordMetricModalProps) {
    const [formData, setFormData] = useState({
        glucose: '',
        bpSystolic: '',
        bpDiastolic: '',
        heartRate: '',
        spo2: '',
        notes: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';

            // Parse existing values for easier incremental update
            let currentG = '';
            let currentSys = '';
            let currentDia = '';

            if (patientData?.latestGlucose && patientData.latestGlucose !== 'N/A') {
                // Extracts the first floating point number
                const match = String(patientData.latestGlucose).match(/^([0-9.]+)/);
                if (match) currentG = match[1];
            }

            if (patientData?.latestBp && patientData.latestBp !== 'N/A') {
                // Extracts numbers split by '/'
                const parts = String(patientData.latestBp).split(' ')[0].split('/');
                if (parts.length >= 1 && !isNaN(parseInt(parts[0]))) currentSys = parts[0];
                if (parts.length >= 2 && !isNaN(parseInt(parts[1]))) currentDia = parts[1];
            }

            let currentHR = '';
            if (patientData?.latestHeartRate && patientData.latestHeartRate !== 'N/A') {
                const match = String(patientData.latestHeartRate).match(/^(\d+)/);
                if (match) currentHR = match[1];
            }

            let currentSpo2 = '';
            if (patientData?.latestSpo2 && patientData.latestSpo2 !== 'N/A') {
                const match = String(patientData.latestSpo2).match(/^(\d+)/);
                if (match) currentSpo2 = match[1];
            }

            setFormData({
                glucose: currentG,
                bpSystolic: currentSys,
                bpDiastolic: currentDia,
                heartRate: currentHR,
                spo2: currentSpo2,
                notes: ''
            });
            setErrors({});
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, patientData]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErr = { ...prev };
                delete newErr[name];
                return newErr;
            });
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        const hasAnyValue = formData.glucose || formData.bpSystolic || formData.heartRate || formData.spo2;
        if (!hasAnyValue) {
            newErrors.general = "Vui lòng điền ít nhất một chỉ số đo lường.";
        }

        if (formData.bpSystolic && !formData.bpDiastolic) {
            newErrors.bpDiastolic = "Vui lòng nhập Tâm trương khi có Tâm thu.";
        }
        if (!formData.bpSystolic && formData.bpDiastolic) {
            newErrors.bpSystolic = "Vui lòng nhập Tâm thu khi có Tâm trương.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        await onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] transition-all duration-300"
                onClick={onClose}
            ></div>

            {/* Modal Container */}
            <div className="relative w-full max-w-[550px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800 transition-all">

                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-center items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20 rounded-t-3xl sticky top-0">
                    <h3 className="text-[20px] font-semibold text-slate-800 dark:text-white tracking-tight leading-tight">Ghi nhận chỉ số mới</h3>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[70vh] bg-white dark:bg-slate-900/50">

                    {errors.general && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[13px] font-bold border border-red-100 flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">error</span>
                            {errors.general}
                        </div>
                    )}

                    {/* Patient Profile Summary */}
                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden shadow-sm shrink-0 border border-primary/20">
                            {patientData?.avatarUrl ? (
                                <img src={patientData.avatarUrl} alt={patientData.fullName} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xl font-black">{patientData?.fullName?.charAt(0) || 'N'}</span>
                            )}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-[17px] font-bold text-slate-800 dark:text-white leading-tight">{patientData?.fullName || 'Bệnh nhân'}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[13px] font-medium text-slate-500">
                                <span>{patientData?.age || '--'} tuổi</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                <span>{patientData?.gender || 'Chưa XĐ'}</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block"></span>
                                <span className="text-primary truncate max-w-[150px] hidden sm:block">{patientData?.chronicCondition || 'Chưa xác định bệnh lý'}</span>
                            </div>
                        </div>
                        {patientData?.riskLevel && (
                            <div className="hidden sm:block">
                                <span className={`px-3 py-1.5 text-[12px] font-bold rounded-full text-white shadow-sm ${patientData.riskLevel.includes('HIGH_RISK') || patientData.riskLevel.includes('cao') ? 'bg-red-500 shadow-red-500/20' : patientData.riskLevel.includes('MONITORING') || patientData.riskLevel.includes('dõi') ? 'bg-orange-500 shadow-orange-500/20' : 'bg-emerald-500 shadow-emerald-500/20'}`}>
                                    {patientData.riskLevel === 'HIGH_RISK' ? 'Nguy cơ cao' : patientData.riskLevel === 'MONITORING' ? 'Theo dõi' : patientData.riskLevel === 'STABLE' ? 'Ổn định' : patientData.riskLevel.replace(/\([^)]*\)/g, '').trim()}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Glucose Section */}
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/80 dark:border-amber-800/50 rounded-2xl">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-amber-600 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>glucose</span>
                            <h4 className="text-[14px] font-bold text-amber-700 dark:text-amber-400">Đường huyết (Blood Sugar)</h4>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    name="glucose"
                                    value={formData.glucose}
                                    onChange={handleChange}
                                    placeholder="Nhập chỉ số..."
                                    className="w-full h-[46px] pl-4 pr-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white transition-all focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-medium text-slate-400">mmol/L</span>
                            </div>
                        </div>
                    </div>

                    {/* BP Section */}
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200/80 dark:border-red-800/50 rounded-2xl">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-red-600 text-[20px]">blood_pressure</span>
                            <h4 className="text-[14px] font-bold text-red-700 dark:text-red-400">Huyết áp (Blood Pressure)</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-bold text-slate-500 ml-1">Tâm thu (SYS)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="bpSystolic"
                                        value={formData.bpSystolic}
                                        onChange={handleChange}
                                        placeholder="120"
                                        className={`w-full h-[46px] pl-4 pr-12 bg-white dark:bg-slate-800 border ${errors.bpSystolic ? 'border-red-500' : 'border-slate-200'} dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none`}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-medium text-slate-400">mmHg</span>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-bold text-slate-500 ml-1">Tâm trương (DIA)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="bpDiastolic"
                                        value={formData.bpDiastolic}
                                        onChange={handleChange}
                                        placeholder="80"
                                        className={`w-full h-[46px] pl-4 pr-12 bg-white dark:bg-slate-800 border ${errors.bpDiastolic ? 'border-red-500' : 'border-slate-200'} dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none`}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-medium text-slate-400">mmHg</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Other Metrics (Grid) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-bold text-slate-600 dark:text-slate-300 ml-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-rose-500 text-lg">favorite</span> Nhịp tim
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="heartRate"
                                    value={formData.heartRate}
                                    onChange={handleChange}
                                    placeholder="75"
                                    className="w-full h-[46px] pl-4 pr-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-medium text-slate-400">bpm</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-bold text-slate-600 dark:text-slate-300 ml-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-sky-500 text-lg">air</span> Oxy máu (SpO2)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="spo2"
                                    value={formData.spo2}
                                    onChange={handleChange}
                                    placeholder="98"
                                    className="w-full h-[46px] pl-4 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-medium text-slate-400">%</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                        <label className="text-[13px] font-bold text-slate-600 dark:text-slate-300 ml-1">Ghi chú thăm khám (Nội bộ)</label>
                        <textarea
                            name="notes"
                            rows={3}
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Nhập ghi chú..."
                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[14px] text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                        ></textarea>
                    </div>
                </form>

                {/* Actions Footer */}
                <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 flex gap-3 justify-end bg-slate-50 dark:bg-slate-900 rounded-b-3xl sticky bottom-0 z-20">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-6 py-2.5 rounded-xl text-[14px] font-bold text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-[14px] font-extrabold shadow-lg shadow-primary/20 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:scale-100"
                    >
                        {isSaving ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[18px]">save</span>
                                Lưu chỉ số
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
