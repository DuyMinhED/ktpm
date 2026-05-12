import { useState, useRef, useEffect } from 'react';
import PrescriptionModal from '../features/prescription/components/PrescriptionModal';
import AdviceModal from '../features/patient/components/AdviceModal';
import Toast from '../components/ui/Toast';
import PatientDetailModal from '../features/patient/components/PatientDetailModal';
import MedicalHistoryModal from '../features/patient/components/MedicalHistoryModal';
import { doctorApi } from '../api/doctor';
import TopBar from '../components/common/TopBar';
import DoctorSidebar from '../components/common/DoctorSidebar';

export default function DoctorMessages() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [conversations, setConversations] = useState<any[]>([]);
    const [activeConv, setActiveConv] = useState<any | null>(null);
    const [activePatient, setActivePatient] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [msgInput, setMsgInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
    const [isAdviceModalOpen, setIsAdviceModalOpen] = useState(false);
    const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isAddingNewMedicine, setIsAddingNewMedicine] = useState(false);
    const [medications, setMedications] = useState<any[]>([]);
    const [newMedForm, setNewMedForm] = useState({ name: '', dosage: '', frequency: '', duration: '', intakeType: '' });
    const [formErrors, setFormErrors] = useState({
        name: false,
        dosage: false,
        frequency: false,
        duration: false,
        intakeType: false
    });
    const [adviceCategory, setAdviceCategory] = useState('Dinh dưỡng');
    const [adviceContent, setAdviceContent] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [toastTitle, setToastTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        if (activeConv) {
            loadMessages(activeConv.id);
            doctorApi.markMessagesAsRead(activeConv.id).catch(console.error);
            loadPatientDetail(activeConv.patientId);
        }
    }, [activeConv]);

    const loadPatientDetail = async (patientId: number) => {
        try {
            const res = await doctorApi.getPatientDetail(patientId);
            if (res.success) setActivePatient(res.data);
        } catch (error) {
            console.error('Error loading patient details:', error);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const loadConversations = async () => {
        try {
            const res = await doctorApi.getConversations();
            setConversations(res.data || []);
            if (res.data?.length > 0 && !activeConv) {
                setActiveConv(res.data[0]);
            }
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const loadMessages = async (convId: number) => {
        try {
            const res = await doctorApi.getMessages(convId, { page: 0, size: 100 });
            setMessages(res.data?.content?.reverse() || []);
        } catch (error) { console.error(error); }
    };

    const handleSendMessage = async () => {
        if (!msgInput.trim() || !activeConv || sending) return;
        setSending(true);
        try {
            const res = await doctorApi.sendMessage({ conversationId: activeConv.id, content: msgInput.trim(), messageType: 'TEXT' });
            setMessages((prev) => [...prev, res.data]);
            setMsgInput('');
            loadConversations();
        } catch (error) { console.error(error); } finally { setSending(false); }
    };

    const formatTime = (dateStr: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const removeMedication = (id: number) => {
        setMedications(medications.filter(m => m.id !== id));
    };

    const addMedicationToPrescription = () => {
        const errors = {
            name: !newMedForm.name,
            dosage: !newMedForm.dosage,
            frequency: !newMedForm.frequency,
            duration: !newMedForm.duration,
            intakeType: !newMedForm.intakeType
        };

        if (Object.values(errors).some(v => v)) {
            setFormErrors(errors);
            return;
        }

        setMedications([...medications, { ...newMedForm, id: Date.now() }]);
        setNewMedForm({ name: '', dosage: '', frequency: '', duration: '', intakeType: '' });
        setIsAddingNewMedicine(false);
        setFormErrors({ name: false, dosage: false, frequency: false, duration: false, intakeType: false });
    };

    const handleSaveAdvice = async () => {
        if (!activeConv) return;
        setIsSaving(true);
        try {
            const messageContent = `[Tư vấn ${adviceCategory}] ${adviceContent}`;
            await doctorApi.sendMessage({ conversationId: activeConv.id, content: messageContent, messageType: 'TEXT' });
            setIsAdviceModalOpen(false);
            setAdviceContent('');
            setToastTitle('Gửi tư vấn thành công');
            setShowToast(true);
            loadMessages(activeConv.id);
        } catch (e) {
            setToastTitle('Có lỗi khi gửi tư vấn');
            setShowToast(true);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSavePrescription = async (prescriptionData: any) => {
        setIsSaving(true);
        try {
            const res = await doctorApi.createPrescription(prescriptionData);
            if (res.success) {
                setIsPrescriptionModalOpen(false);
                setMedications([]);
                setToastTitle('Kê đơn thành công');
                setShowToast(true);
            }
        } catch (e) {
            setToastTitle('Có lỗi khi kê đơn');
            setShowToast(true);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
            <DoctorSidebar isSidebarOpen={isSidebarOpen} />

            <main className="flex-1 lg:ml-72 flex flex-col h-screen overflow-hidden transition-all duration-300">
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[140] lg:hidden animate-in fade-in duration-300"
                        onClick={() => setIsSidebarOpen(false)}
                    ></div>
                )}
                <TopBar
                    setIsSidebarOpen={setIsSidebarOpen}
                    notifications={notifications}
                    setNotifications={setNotifications}
                />

                <div className="flex flex-1 overflow-hidden w-full">
                    {/* Left Column: Contact List */}
                    <section className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900/50">
                        <div className="p-4 border-b border-slate-50 dark:border-slate-800">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                                <input
                                    className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                                    placeholder="Tìm kiếm bệnh nhân..."
                                    type="text"
                                />
                            </div>
                        </div>

                        <div className="flex border-b border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'all' ? 'text-primary border-primary' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>
                                Tất cả
                            </button>
                            <button
                                onClick={() => setActiveTab('unread')}
                                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'unread' ? 'text-primary border-primary' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>
                                Chưa đọc
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="p-3 space-y-2">
                                {loading && <div className="p-4 text-center text-sm text-slate-500">Đang tải...</div>}
                                {!loading && conversations.length === 0 && <div className="p-4 text-center text-sm text-slate-500">Chưa có cuộc trò chuyện</div>}
                                {conversations.filter(c => activeTab === 'all' || c.unreadCount > 0).map(conv => (
                                    <div key={conv.id} onClick={() => setActiveConv(conv)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${activeConv?.id === conv.id ? 'bg-primary/5 border border-primary/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                        <div className="relative">
                                            <img className="size-12 rounded-full object-cover bg-slate-200" src={conv.patientAvatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(conv.patientName)} alt="Avatar" />
                                            <span className={`absolute bottom-0 right-0 size-3 border-2 border-white rounded-full ${conv.isOnline ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <h3 className={`text-sm font-bold truncate ${activeConv?.id === conv.id ? 'text-primary' : ''}`}>{conv.patientName}</h3>
                                                <span className="text-[10px] text-slate-400">{formatTime(conv.lastMessageAt)}</span>
                                            </div>
                                            <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-500'}`}>{conv.lastMessage || '...'}</p>
                                        </div>
                                        {conv.unreadCount > 0 && <div className="size-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-white font-bold">{conv.unreadCount}</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Middle Column: Chat Window */}
                    <section className="flex-1 flex flex-col bg-background-light dark:bg-background-dark">
                        {/* Chat Header */}
                        {activeConv ? (
                        <>
                        <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-slate-200 overflow-hidden relative">
                                    <img className="w-full h-full object-cover" src={activeConv.patientAvatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(activeConv.patientName)} alt="P" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold leading-none">{activeConv.patientName}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`size-2 rounded-full ${activeConv.isOnline ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                                        <span className="text-xs text-slate-500">{activeConv.isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><span className="material-symbols-outlined">call</span></button>
                                <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><span className="material-symbols-outlined">videocam</span></button>
                            </div>
                        </div>

                        {/* Chat History */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {messages.map((msg, i) => (
                                <div key={msg.id || i} className={`flex gap-3 max-w-[80%] ${msg.senderType === 'DOCTOR' ? 'flex-row-reverse ml-auto' : ''}`}>
                                    {msg.senderType !== 'DOCTOR' && (
                                        <img className="size-8 rounded-full self-end bg-slate-200" src={activeConv.patientAvatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(activeConv.patientName)} alt="P" />
                                    )}
                                    <div className={`${msg.senderType === 'DOCTOR' ? 'bg-primary text-slate-900 rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-none border border-slate-100 dark:border-slate-700'} p-4 rounded-2xl shadow-sm`}>
                                        <p className="text-[15px] font-medium leading-relaxed">{msg.content}</p>
                                        <span className={`text-[12px] mt-1.5 block font-medium ${msg.senderType === 'DOCTOR' ? 'text-slate-900/60 text-right' : 'text-slate-400'}`}>
                                            {formatTime(msg.sentAt)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input Area */}
                        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 no-scrollbar text-left font-medium">
                                <button
                                    onClick={() => setIsAdviceModalOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-extrabold rounded-full whitespace-nowrap hover:bg-primary hover:text-white transition-all">
                                    <span className="material-symbols-outlined text-sm font-medium">recommend</span> Gửi khuyến nghị
                                </button>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-600 text-xs font-extrabold rounded-full whitespace-nowrap hover:bg-red-500 hover:text-white transition-all">
                                    <span className="material-symbols-outlined text-sm font-medium">warning</span> Gửi cảnh báo
                                </button>
                                <button
                                    onClick={() => setIsPrescriptionModalOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-600 text-xs font-extrabold rounded-full whitespace-nowrap hover:bg-blue-500 hover:text-white transition-all">
                                    <span className="material-symbols-outlined text-sm font-medium">medication</span> Đơn thuốc mới
                                </button>
                            </div>
                            <div className="flex items-end gap-2 px-1">
                                <div className="flex gap-1 mb-1.5 font-medium">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        ref={imageInputRef}
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                console.log("Selected image:", e.target.files[0]);
                                            }
                                        }}
                                    />
                                    <input
                                        type="file"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                console.log("Selected file:", e.target.files[0]);
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => imageInputRef.current?.click()}
                                        className="p-2 text-slate-400 hover:text-primary transition-all active:bg-slate-50 dark:active:bg-slate-800 rounded-lg">
                                        <span className="material-symbols-outlined">image</span>
                                    </button>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 text-slate-400 hover:text-primary transition-all active:bg-slate-50 dark:active:bg-slate-800 rounded-lg">
                                        <span className="material-symbols-outlined">attach_file</span>
                                    </button>
                                </div>
                                <div className="flex-1 relative">
                                    <textarea 
                                        rows={1} 
                                        value={msgInput}
                                        onChange={(e) => setMsgInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-[15px] font-medium focus:ring-2 focus:ring-primary/50 resize-none outline-none text-slate-700 dark:text-slate-200" placeholder="Nhập tin nhắn..." />
                                </div>
                                <button onClick={handleSendMessage} disabled={sending || !msgInput.trim()} className="bg-primary hover:bg-primary/90 text-slate-900 p-3 rounded-xl shadow-lg transition-transform flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                                    <span className="material-symbols-outlined font-bold">send</span>
                                </button>
                            </div>
                        </div>
                        </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center flex-col text-slate-400 gap-4">
                                <span className="material-symbols-outlined text-6xl opacity-20">forum</span>
                                <p className="font-medium">Vui lòng chọn một cuộc trò chuyện</p>
                            </div>
                        )}
                    </section>

                    {/* Right Column: Patient Summary */}
                    <section className="w-72 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col p-5 overflow-y-auto custom-scrollbar">
                        {activePatient ? (
                        <>
                        <div className="text-center mb-6">
                            <div className="size-20 mx-auto rounded-full border-4 border-primary/20 p-1 mb-3">
                                <img className="w-full h-full rounded-full object-cover bg-slate-200" src={activeConv?.patientAvatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(activePatient.fullName)} alt="Profile" />
                            </div>
                            <h3 className="font-bold text-xl mb-2">{activePatient.fullName}</h3>
                            <div className="flex flex-col text-[15px] font-medium text-slate-500">
                                <span>Giới tính: {activePatient.gender === 'MALE' ? 'Nam' : activePatient.gender === 'FEMALE' ? 'Nữ' : 'Khác'}</span>
                                <span>Tuổi: {activePatient.dateOfBirth ? (new Date().getFullYear() - new Date(activePatient.dateOfBirth).getFullYear()) : 'Trống'}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <h4 className="text-[15px] font-medium text-slate-700 leading-none">Chỉ số sinh tồn</h4>
                                    <span className="text-[13px] text-primary font-black tracking-tighter">Mới nhất</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-red-500 text-sm">blood_pressure</span>
                                            <span className="text-[15px] font-medium text-slate-600 dark:text-slate-400">Huyết áp</span>
                                        </div>
                                        <span className="text-[15px] font-bold text-red-500">{activePatient.latestBp || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-blue-500 text-sm">favorite</span>
                                            <span className="text-[15px] font-medium text-slate-600 dark:text-slate-400">Nhịp tim</span>
                                        </div>
                                        <span className="text-[15px] font-bold text-slate-900 dark:text-white">{activePatient.latestHeartRate || 'N/A'} bpm</span>
                                    </div>
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-orange-500 text-sm">water_drop</span>
                                            <span className="text-[15px] font-medium text-slate-600 dark:text-slate-400">Đường huyết</span>
                                        </div>
                                        <span className="text-[15px] font-bold text-slate-900 dark:text-white">{activePatient.latestGlucose ? `${activePatient.latestGlucose} mmol/L` : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <h4 className="text-[15px] font-medium text-slate-700 pl-1 mb-3">Lối tắt</h4>
                                {[
                                { icon: 'description', label: 'Hồ sơ đầy đủ', action: () => setIsDetailModalOpen(true) },
                                { icon: 'pill', label: 'Kê đơn thuốc', action: () => setIsPrescriptionModalOpen(true) },
                                { icon: 'history', label: 'Lịch sử khám', action: () => setIsHistoryModalOpen(true) }
                            ].map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={item.action}
                                    className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                                >
                                    <span className="material-symbols-outlined text-primary">{item.icon}</span>
                                    <span className="flex-1 text-center text-sm font-medium">{item.label}</span>
                                    <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    </>
                    ) : (
                        <div className="text-center text-slate-500 mt-10">Chọn bệnh nhân để xem tóm tắt</div>
                    )}
                </section>
            </div>
            </main>

            <AdviceModal
                isOpen={isAdviceModalOpen}
                onClose={() => setIsAdviceModalOpen(false)}
                adviceCategory={adviceCategory}
                setAdviceCategory={setAdviceCategory}
                adviceContent={adviceContent}
                setAdviceContent={setAdviceContent}
                isSaving={isSaving}
                onSave={handleSaveAdvice}
                patientName={activeConv?.patientName || "Bệnh nhân"}
                patientAvatar={activeConv?.patientAvatarUrl}
            />

            {activePatient && (
                <PatientDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    patient={activePatient}
                />
            )}

            <MedicalHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                patientName={activeConv?.patientName || "Bệnh nhân"}
                patientAvatar={activeConv?.patientAvatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(activeConv?.patientName || "P")}
            />

            <PrescriptionModal
                isOpen={isPrescriptionModalOpen}
                onClose={() => setIsPrescriptionModalOpen(false)}
                isAddingNewMedicine={isAddingNewMedicine}
                setIsAddingNewMedicine={setIsAddingNewMedicine}
                medications={medications}
                removeMedication={removeMedication}
                newMedForm={newMedForm}
                setNewMedForm={setNewMedForm}
                formErrors={formErrors}
                setFormErrors={setFormErrors}
                addMedicationToPrescription={addMedicationToPrescription}
                isSaving={isSaving}
                onSave={handleSavePrescription}
                patients={activeConv ? [{ id: activeConv.patientId, name: activeConv.patientName }] : []}
            />

            <Toast
                show={showToast}
                title={toastTitle}
                onClose={() => setShowToast(false)}
            />
        </div>
    );
}