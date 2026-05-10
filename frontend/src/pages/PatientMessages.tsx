import React, { useState, useEffect, useRef } from 'react';
import { patientApi } from '../api/patient';

const PatientMessages: React.FC = () => {
    const [conversations, setConversations] = useState<any[]>([]);
    const [activeConv, setActiveConv] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [msgInput, setMsgInput] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        if (activeConv) {
            loadMessages(activeConv.id);
            // Mark as read
            patientApi.markMessagesAsRead(activeConv.id).catch(console.error);
        }
    }, [activeConv]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const loadConversations = async () => {
        try {
            const res = await patientApi.getConversations();
            setConversations(res.data || []);
            if (res.data?.length > 0 && !activeConv) {
                setActiveConv(res.data[0]);
            }
        } catch (error) {
            console.error(error);
            alert("Không thể tải danh sách cuộc trò chuyện");
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (convId: number) => {
        try {
            const res = await patientApi.getMessages(convId, 0, 100);
            // API is sorted sentAt desc? Wait, we passed sort: 'sentAt,asc'. 
            // So we just set it directly.
            setMessages(res.data?.content?.reverse() || []); // Reversing if backend defaults to page mapping desc.
        } catch (error) {
            console.error(error);
            alert("Không thể tải tin nhắn");
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!msgInput.trim() || !activeConv || sending) return;

        setSending(true);
        try {
            const res = await patientApi.sendMessage({
                conversationId: activeConv.id,
                content: msgInput.trim(),
                messageType: 'TEXT'
            });
            setMessages((prev: any[]) => [...prev, res.data]);
            setMsgInput('');
            // Optional: loadConversations() to update the left sidebar's 'last message' snippet
        } catch (error) {
            console.error(error);
            alert("Lỗi khi gửi tin nhắn");
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex -m-8 h-[calc(100vh-80px)] overflow-hidden animate-in fade-in duration-700 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 font-display">
            {/* Contact List Sidebar */}
            <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col shrink-0">
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Tin nhắn</h2>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                        <input className="w-full pl-10 pr-4 py-2 rounded-xl border-none bg-slate-100 dark:bg-slate-800 focus:ring-2 focus:ring-primary text-sm" placeholder="Tìm kiếm bác sĩ..." type="text" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto px-2 space-y-2 custom-scrollbar">
                    {loading ? (
                        <div className="p-4 text-center text-sm text-slate-500">Đang tải...</div>
                    ) : conversations.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">Chưa có tin nhắn nào</div>
                    ) : (
                        conversations.map((conv: any) => (
                            <div 
                                key={conv.id} 
                                onClick={() => setActiveConv(conv)}
                                className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-colors mb-2 group ${activeConv?.id === conv.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <div className="relative shrink-0">
                                    <img className="w-12 h-12 rounded-full object-cover bg-slate-200" src={conv.doctorAvatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(conv.doctorName)} alt="Bác sĩ" />
                                    <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-slate-900 rounded-full ${conv.isOnline ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <h4 className={`font-bold text-[15px] truncate ${activeConv?.id === conv.id ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'}`}>{conv.doctorName}</h4>
                                        <span className="text-xs text-slate-500">{formatTime(conv.lastMessageAt)}</span>
                                    </div>
                                    <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500'}`}>{conv.lastMessage || 'Chưa có tin nhắn'}</p>
                                </div>
                                {conv.unreadCount > 0 && activeConv?.id !== conv.id && (
                                    <div className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                        {conv.unreadCount}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Window */}
            {activeConv ? (
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 relative">
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                            <img className="w-10 h-10 rounded-full object-cover bg-slate-200" src={activeConv.doctorAvatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(activeConv.doctorName)} alt="Bác sĩ" />
                            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white dark:border-slate-900 rounded-full ${activeConv.isOnline ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                        </div>
                        <div>
                            <h3 className="font-bold text-[15px] text-slate-900 dark:text-white">{activeConv.doctorName}</h3>
                            <p className="text-xs text-slate-500">{activeConv.doctorSpecialty}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                            <span className="material-symbols-outlined text-xl">videocam</span>
                        </button>
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                            <span className="material-symbols-outlined text-xl">call</span>
                        </button>
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 xl:hidden">
                            <span className="material-symbols-outlined text-xl">info</span>
                        </button>
                    </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {messages.map((msg: any, idx: number) => {
                        const isDoctor = msg.senderType === 'DOCTOR';
                        return isDoctor ? (
                            <div key={idx} className="flex items-end gap-3 max-w-[80%]">
                                <img className="w-8 h-8 rounded-full shadow-sm bg-slate-200" src={activeConv.doctorAvatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(activeConv.doctorName)} alt="Dr" />
                                <div className="space-y-1">
                                    {msg.messageType === 'IMAGE' && msg.attachmentUrl && (
                                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl rounded-bl-none shadow-sm">
                                            <img src={msg.attachmentUrl} className="max-w-xs rounded-xl" alt="Attachment" />
                                        </div>
                                    )}
                                    <div className="bg-slate-100 dark:bg-slate-800 p-3.5 rounded-2xl rounded-bl-none shadow-sm">
                                        <p className="text-sm text-slate-700 dark:text-slate-300">{msg.content}</p>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">{formatTime(msg.sentAt)}</p>
                                </div>
                            </div>
                        ) : (
                            <div key={idx} className="flex flex-col items-end gap-1 ml-auto max-w-[80%]">
                                {msg.messageType === 'IMAGE' && msg.attachmentUrl && (
                                    <div className="bg-primary/5 border border-primary/20 p-2 rounded-2xl rounded-br-none mb-1">
                                        <img src={msg.attachmentUrl} className="max-w-xs rounded-xl" alt="Attachment" />
                                    </div>
                                )}
                                <div className="bg-primary text-white p-3.5 rounded-2xl rounded-br-none shadow-md shadow-primary/20">
                                    <p className="text-sm font-medium">{msg.content}</p>
                                </div>
                                <span className="text-[10px] text-slate-400">{formatTime(msg.sentAt)}</span>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-2xl p-2 transition-all focus-within:ring-2 focus-within:ring-primary/20">
                        <button type="button" className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-500 transition-colors">
                            <span className="material-symbols-outlined">add_circle</span>
                        </button>
                        <button type="button" className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-500 transition-colors">
                            <span className="material-symbols-outlined">image</span>
                        </button>
                        <button type="button" className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-500 transition-colors">
                            <span className="material-symbols-outlined">sentiment_satisfied</span>
                        </button>
                        <input 
                            value={msgInput}
                            onChange={e => setMsgInput(e.target.value)}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 text-slate-800 dark:text-white placeholder-slate-400 font-display outline-none" 
                            placeholder="Nhập tin nhắn..." 
                            type="text" 
                        />
                        <button 
                            type="submit"
                            disabled={sending || !msgInput.trim()}
                            className="bg-primary text-white p-2.5 rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 transition-all font-display disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined font-bold">send</span>
                        </button>
                    </form>
                </div>
            </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50">
                    <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4 animate-pulse">
                        <span className="material-symbols-outlined text-4xl">chat</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">Nhắn tin trực tiếp với bác sĩ</h3>
                    <p className="text-sm text-slate-500 mt-2 max-w-sm text-center">Chọn một cuộc trò chuyện ở danh sách bên trái để bắt đầu hoặc tiếp tục gửi tin nhắn của bạn.</p>
                </div>
            )}

            {/* Doctor Profile Detail Sidebar */}
            {activeConv && (
            <div className="hidden xl:flex w-80 bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex-col overflow-y-auto shrink-0 custom-scrollbar animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="p-8 text-center bg-white/50 dark:bg-slate-900/50 mb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative inline-block mb-4">
                        <img className="w-32 h-32 rounded-3xl object-cover shadow-xl border-4 border-white dark:border-slate-800 bg-slate-200" src={activeConv.doctorAvatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(activeConv.doctorName)} alt="Bác sĩ" />
                        <div className="absolute -bottom-2 -right-2 bg-primary text-white p-1.5 rounded-xl border-4 border-slate-50 dark:border-slate-900">
                            <span className="material-symbols-outlined text-sm font-bold">verified</span>
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{activeConv.doctorName}</h3>
                    <p className="text-slate-500 text-sm mt-1">{activeConv.doctorSpecialty}</p>
                    {activeConv.doctorExperience && (
                    <div className="flex justify-center gap-2 mt-4">
                        <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex-1">
                            <p className="text-[14px] text-slate-400 font-medium">Kinh nghiệm</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{activeConv.doctorExperience}</p>
                        </div>
                    </div>
                    )}
                </div>
                <div className="px-6 space-y-6 flex-1 py-4">
                    {activeConv.doctorBio && (
                    <div>
                        <h4 className="text-sm font-bold text-slate-500 mb-3">Giới thiệu</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
                            {activeConv.doctorBio}
                        </p>
                    </div>
                    )}
                    <div>
                        <h4 className="text-sm font-bold text-slate-500 mb-3">Thông tin liên hệ</h4>
                        <ul className="space-y-3">
                            {activeConv.doctorClinicName && (
                            <li className="flex items-center gap-3 text-sm">
                                <span className="material-symbols-outlined text-primary text-sm font-bold">location_on</span>
                                <span className="text-slate-600 dark:text-slate-400 font-medium">{activeConv.doctorClinicName}</span>
                            </li>
                            )}
                            <li className="flex items-center gap-3 text-sm">
                                <span className="material-symbols-outlined text-primary text-sm font-bold">medical_services</span>
                                <span className="text-slate-600 dark:text-slate-400 font-medium">{activeConv.doctorSpecialty}</span>
                            </li>
                        </ul>
                    </div>
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button 
                            onClick={() => window.location.href = '/patient/appointments'}
                            className="w-full py-3 bg-primary text-slate-900 font-medium rounded-full shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all mb-3 flex items-center justify-center gap-2 text-sm"
                        >
                            <span className="material-symbols-outlined text-sm font-bold">event</span>
                            Đặt lịch hẹn ngay
                        </button>
                    </div>
                </div>
            </div>
            )}
        </div>
    );
};

export default PatientMessages;
