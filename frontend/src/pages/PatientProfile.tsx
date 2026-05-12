import React, { useEffect, useState } from 'react';
import { patientApi } from '../api/patient';
import EditProfileModal from './profile-modals/EditProfileModal';
import EmergencyContactModal from './profile-modals/EmergencyContactModal';
import Toast from '../components/ui/Toast';

const PatientProfile: React.FC = () => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [isEmergencyContactOpen, setIsEmergencyContactOpen] = useState(false);
    const [toast, setToast] = useState({ show: false, title: '', type: 'success' as 'success' | 'error' | 'warning' });

    const fetchProfile = async () => {
        try {
            const response = await patientApi.getProfile();
            if (response.success) {
                setProfile(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch profile:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleSaveProfile = async (formData: any) => {
        try {
            const response = await patientApi.updateProfile(formData);
            if (response.success) {
                setProfile(response.data);
                // Trigger profile refresh event for other components if needed
                window.dispatchEvent(new CustomEvent('profileUpdate', { detail: response.data }));
                setToast({ show: true, title: 'Cập nhật hồ sơ cá nhân thành công!', type: 'success' });
            }
        } catch (error) {
            console.error("Failed to save profile:", error);
            throw error;
        }
    };

    const handleSaveEmergencyContact = async (formData: any) => {
        try {
            if (profile.emergencyContact) {
                await patientApi.updateEmergencyContact(profile.emergencyContact.id, formData);
            } else {
                await patientApi.addEmergencyContact(formData);
            }
            await fetchProfile();
            setToast({ show: true, title: 'Đã lưu thông tin liên hệ khẩn cấp!', type: 'success' });
        } catch (error) {
            console.error("Failed to save emergency contact:", error);
            throw error;
        }
    };

    const handleDownloadReport = async () => {
        try {
            const data = await patientApi.downloadReport();
            const blob = new Blob([data], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `bao_cao_suc_khoe_${profile.patientCode || 'patient'}.txt`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">Đang tải hồ sơ...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-slate-500">
                Không tìm thấy thông tin hồ sơ
            </div>
        );
    }

    const formatDateVN = (dateString: string) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    };

    const formatAge = (dob: string, age: number) => {
        if (!dob || age > 130) return 'Chưa cập nhật';
        return `${formatDateVN(dob)} (${age} tuổi)`;
    };

    const bmiValue = profile.heightCm && profile.weightKg 
        ? (profile.weightKg / (Math.pow(profile.heightCm / 100, 2))).toFixed(1)
        : "Chưa đo";

    return (
        <div className="max-w-5xl mx-auto px-6 py-8 animate-in fade-in duration-500 font-display">
            {/* Profile Header */}
            <header className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 mb-6 font-display">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="relative group cursor-pointer" onClick={() => setIsEditProfileOpen(true)}>
                        <div className="size-32 rounded-full border-4 border-primary/20 bg-primary/10 flex items-center justify-center text-primary overflow-hidden group-hover:opacity-80 transition-opacity">
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt="Avatar" className="size-full object-cover" />
                            ) : (
                                <span className="material-symbols-outlined text-6xl">person</span>
                            )}
                        </div>
                        <div className="absolute inset-0 rounded-full bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                        </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{profile.fullName}</h2>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Mã hồ sơ: <span className="font-semibold">{profile.patientCode || 'N/A'}</span>
                            <br />
                            Tham gia: {profile.joinedDate ? formatDateVN(profile.joinedDate) : 'Mới tham gia'}
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start mt-2">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                <span className="material-symbols-outlined text-primary text-lg">badge</span>
                                <span>CCCD: {profile.identityCard || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                <span className="material-symbols-outlined text-primary text-lg">work</span>
                                <span>{profile.occupation || 'Nghề nghiệp: Chưa cập nhật'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                <span className="material-symbols-outlined text-primary text-lg">monitoring</span>
                                <span>BMI: {bmiValue}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                        <button 
                            onClick={handleDownloadReport}
                            className="px-5 py-2 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm"
                        >
                            <span className="material-symbols-outlined text-base">download</span>
                            Tải báo cáo
                        </button>
                        <button 
                            onClick={() => setIsEditProfileOpen(true)}
                            className="px-5 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-sm"
                        >
                            <span className="material-symbols-outlined text-base">edit_note</span>
                            Chỉnh sửa hồ sơ
                        </button>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left font-display">
                {/* Left Column: Personal & Contact */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Personal Information */}
                    <section className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                <span className="material-symbols-outlined text-primary">person</span>
                                Thông tin cá nhân
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                            {[
                                { label: 'Họ và tên', value: profile.fullName },
                                { label: 'Ngày sinh', value: formatAge(profile.dateOfBirth, profile.age) },
                                { label: 'Giới tính', value: profile.gender === 'MALE' ? 'Nam' : profile.gender === 'FEMALE' ? 'Nữ' : profile.gender || 'Chưa cập nhật' },
                                { label: 'Căn cước công dân', value: profile.identityCard || 'Chưa cập nhật' },
                                { label: 'Nghề nghiệp', value: profile.occupation || 'Chưa cập nhật' },
                                { label: 'Chỉ số BMI', value: bmiValue !== "Chưa đo" ? `${bmiValue} (Bình thường)` : 'Chưa có thông tin đo' },
                                { label: 'Dân tộc', value: profile.ethnicity || 'Kinh' },
                                { label: 'Số thẻ Bảo Hiểm Y Tế', value: profile.healthInsuranceNumber || 'Chưa cập nhật' },
                            ].map((item, idx) => (
                                <div key={idx} className="border-b border-slate-100 dark:border-slate-800 pb-2">
                                    <p className="text-[13px] text-slate-500 font-medium">{item.label}</p>
                                    <p className="text-sm font-medium">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Contact Information */}
                    <section className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                <span className="material-symbols-outlined text-primary">contact_page</span>
                                Thông tin liên hệ
                            </h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-slate-400">call</span>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">Số điện thoại</p>
                                    <p className="text-sm font-medium">{profile.phone || 'Chưa cập nhật'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-slate-400">mail</span>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">Địa chỉ Email</p>
                                    <p className="text-sm font-medium">{profile.email || 'Chưa cập nhật'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-slate-400">location_on</span>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">Địa chỉ nhà</p>
                                    <p className="text-sm font-medium">{profile.address || 'Chưa cập nhật'}</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column: Medical History & Emergency */}
                <div className="space-y-6">
                    {/* Medical History Summary */}
                    <section className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-slate-900 dark:text-slate-100">
                            <span className="material-symbols-outlined text-primary">history_edu</span>
                            Tóm tắt y tế
                        </h3>
                        <div className="space-y-5">
                            <div>
                                <p className="text-[14px] text-slate-600 font-medium mb-2">Bệnh mãn tính</p>
                                <div className="flex flex-wrap gap-2">
                                    {(profile.chronicDiseases && profile.chronicDiseases.length > 0) ? (
                                        profile.chronicDiseases.map((d: string, i: number) => (
                                            <span key={i} className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-xs font-bold border border-red-100 dark:border-red-900/30">{d}</span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">Chưa xác nhận bệnh lý</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-[14px] text-slate-600 font-medium mb-2">Dị ứng</p>
                                <div className="flex flex-wrap gap-2">
                                    {(profile.allergies && profile.allergies.length > 0) ? (
                                        profile.allergies.map((a: string, i: number) => (
                                            <span key={i} className="px-3 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full text-xs font-bold border border-orange-100 dark:border-orange-900/30">{a}</span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">Không có dị ứng</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-[14px] text-slate-600 font-medium mb-2">Thuốc đang sử dụng</p>
                                <ul className="text-sm space-y-2 text-slate-600 dark:text-slate-300">
                                    {(profile.currentMedications && profile.currentMedications.length > 0) ? (
                                        profile.currentMedications.map((med: string, idx: number) => (
                                            <li key={idx} className="flex items-center gap-2 italic">
                                                <span className="size-1.5 rounded-full bg-primary"></span>
                                                {med}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="flex items-center gap-2 text-slate-400 italic">
                                            <span className="material-symbols-outlined text-[16px] opacity-50">event_busy</span>
                                            Chưa có chỉ định thuốc từ bác sĩ
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </section>
                    {/* Emergency Contact */}
                    <section className="bg-primary/10 dark:bg-primary/5 rounded-xl p-6 border-2 border-dashed border-primary/30">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-900 dark:text-slate-100">
                            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>emergency_home</span>
                            Liên hệ khẩn cấp
                        </h3>
                        {profile.emergencyContact ? (
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{profile.emergencyContact.contactName}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Mối quan hệ: {profile.emergencyContact.relationship}</p>
                                <div className="flex items-center gap-2 text-primary font-display">
                                    <span className="material-symbols-outlined text-lg">call</span>
                                    <span className="text-sm font-bold">{profile.emergencyContact.phone}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4 text-center">
                                <p className="text-xs text-slate-400 italic font-display">Chưa thiết lập liên hệ khẩn cấp</p>
                            </div>
                        )}
                        <button 
                            onClick={() => setIsEmergencyContactOpen(true)}
                            className="w-full mt-6 py-3 border border-dashed border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary hover:bg-primary/5 transition-all text-sm font-bold rounded-xl text-center"
                        >
                            {profile.emergencyContact ? 'Cập nhật thông tin khẩn cấp' : 'Thêm liên hệ khẩn cấp'}
                        </button>
                    </section>
                </div>
            </div>

            {/* Modals */}
            <EditProfileModal 
                isOpen={isEditProfileOpen} 
                onClose={() => setIsEditProfileOpen(false)} 
                onSave={handleSaveProfile} 
                initialData={profile}
            />
            
            <EmergencyContactModal 
                isOpen={isEmergencyContactOpen} 
                onClose={() => setIsEmergencyContactOpen(false)} 
                onSave={handleSaveEmergencyContact} 
                initialData={profile.emergencyContact}
            />

            <Toast 
                show={toast.show} 
                title={toast.title} 
                type={toast.type} 
                onClose={() => setToast({...toast, show: false})} 
            />
        </div>
    );
};

export default PatientProfile;
