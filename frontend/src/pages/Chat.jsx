import { motion } from 'framer-motion';
import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { Send, Paperclip, Search, User as UserIcon, Users, MessageSquare, X, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';

const roleLabels = {
  admin: 'الإدارة',
  school: 'المدرسة',
  teacher: 'أستاذ',
  general_supervisor: 'مراقب عام',
  pedagogical_supervisor: 'مراقب تربوي',
  receptionist: 'موظف الاستقبال',
  student: 'تلميذ',
  parent: 'ولي أمر',
};

const roleBadge = {
  admin: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  school: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  teacher: 'bg-brand-500/10 text-brand-300 border-brand-500/25',
  general_supervisor: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  pedagogical_supervisor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25',
  receptionist: 'bg-teal-500/10 text-teal-300 border-teal-500/25',
  student: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  parent: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
};

const isImageUrl = (url = '') => /\.(jpeg|jpg|gif|png|webp)/i.test(url);
const isVideoUrl = (url = '') => /\.(mp4|webm|mov)/i.test(url);

export default function Chat() {
  const { user } = useAuthStore();
  const {
    conversations,
    contacts,
    messages,
    activeChatPartner,
    fetchConversations,
    fetchContacts,
    setActiveChatPartner,
    sendDirectMessage,
  } = useChatStore();

  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarTab, setSidebarTab] = useState('chats'); // 'chats' | 'contacts'
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    fetchContacts();
  }, []);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert('Fichier trop volumineux. La limite est de 50 Mo.');
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(null);
    }
  };

  const clearAttachment = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectPartner = (partner) => {
    setActiveChatPartner(partner);
    setSidebarTab('chats');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!messageText.trim() && !selectedFile) || !activeChatPartner) return;

    let attachmentUrl = '';
    let attachmentName = '';

    if (selectedFile) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      try {
        const res = await axios.post('/api/messages/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        attachmentUrl = res.data.url;
        attachmentName = res.data.name;
      } catch (err) {
        alert(err.response?.data?.message || 'Erreur lors de l\'envoi du fichier');
        setIsUploading(false);
        return;
      }
    }

    await sendDirectMessage(activeChatPartner._id, messageText, attachmentUrl, attachmentName);
    setMessageText('');
    clearAttachment();
    setIsUploading(false);
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredConversations = conversations.filter((c) => {
    if (!q) return true;
    const name = `${c.user?.firstName || ''} ${c.user?.lastName || ''}`.toLowerCase();
    return name.includes(q);
  });
  const filteredContacts = contacts.filter((c) => {
    if (!q) return true;
    const name = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
    return name.includes(q);
  });

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        dir="rtl"
        className="h-[calc(100vh-12rem)] flex rounded-2xl border border-luxury-border overflow-hidden glass-panel text-right"
      >
        
        {/* Conversations / Contacts Sidebar */}
        <div className="w-80 border-r border-luxury-border flex flex-col bg-slate-900/20">
          {/* Tabs */}
          <div className="p-3 border-b border-luxury-border flex gap-2">
            <button
              onClick={() => setSidebarTab('chats')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                sidebarTab === 'chats' ? 'bg-brand-600 text-white' : 'bg-slate-950/50 text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> المحادثات
            </button>
            <button
              onClick={() => setSidebarTab('contacts')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                sidebarTab === 'contacts' ? 'bg-brand-600 text-white' : 'bg-slate-950/50 text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> جهات الاتصال
            </button>
          </div>

          <div className="p-4 border-b border-luxury-border">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="البحث عن جهة اتصال..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/60 border border-luxury-border rounded-xl pr-9 pl-4 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-luxury-border/30">
            {sidebarTab === 'chats' ? (
              filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-slate-550 text-sm">
                  لا توجد محادثات نشطة. اختر "جهات الاتصال" لبدء محادثة.
                </div>
              ) : (
                filteredConversations.map((chat, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveChatPartner(chat.user)}
                    className={`w-full p-4 flex items-center gap-3 text-right transition-colors hover:bg-slate-900/40 ${
                      activeChatPartner?._id === chat.user?._id ? 'bg-slate-900/50' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-brand-900/50 flex items-center justify-center font-bold text-brand-300 border border-luxury-border/30 shrink-0">
                      {chat.user?.profilePic ? (
                        <img src={chat.user.profilePic} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <span>{chat.user?.firstName?.[0]}{chat.user?.lastName?.[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="text-sm font-semibold truncate text-white">
                          {chat.user?.firstName} {chat.user?.lastName}
                        </h4>
                        <span className="text-[10px] text-slate-500">
                          {new Date(chat.lastUpdated).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{chat.lastMessage || 'مرفق 📎'}</p>
                    </div>
                    {chat.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {chat.unreadCount}
                      </span>
                    )}
                  </button>
                ))
              )
            ) : filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-slate-550 text-sm">لا توجد جهات اتصال متاحة.</div>
            ) : (
              filteredContacts.map((c) => (
                <button
                  key={c._id}
                  onClick={() => handleSelectPartner(c)}
                  className="w-full p-4 flex items-center gap-3 text-right transition-colors hover:bg-slate-900/40"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-brand-900/50 flex items-center justify-center font-bold text-brand-300 border border-luxury-border/30 shrink-0">
                    {c.profilePic ? (
                      <img src={c.profilePic} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span>{c.firstName?.[0]}{c.lastName?.[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold truncate text-white">
                      {c.firstName} {c.lastName}
                    </h4>
                    <span className={`inline-flex items-center text-[9px] font-semibold px-1.5 py-0.5 rounded-full border mt-0.5 ${roleBadge[c.role] || roleBadge.student}`}>
                      {roleLabels[c.role] || c.role}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Messaging Chat Window Area */}
        <div className="flex-1 flex flex-col bg-slate-950/40">
          {activeChatPartner ? (
            <>
              {/* Chat room header */}
              <div className="p-4 border-b border-luxury-border flex items-center gap-3 bg-slate-900/10">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-brand-900/50 flex items-center justify-center font-bold text-brand-300 uppercase border border-luxury-border/30">
                  {activeChatPartner.profilePic ? (
                    <img src={activeChatPartner.profilePic} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span>{activeChatPartner.firstName?.[0]}{activeChatPartner.lastName?.[0]}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {activeChatPartner.firstName} {activeChatPartner.lastName}
                  </h3>
                  <p className="text-xs text-brand-400 capitalize">{activeChatPartner.role}</p>
                </div>
              </div>

              {/* Message scroll container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, idx) => {
                  const isOwnMessage = msg.sender === user?.id;
                  return (
                    <div
                      key={idx}
                      className={`flex ${isOwnMessage ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-md rounded-2xl p-4 text-sm ${
                          isOwnMessage
                            ? 'bg-brand-600 text-white rounded-br-none'
                            : 'bg-slate-900 border border-luxury-border text-slate-200 rounded-bl-none'
                        }`}
                      >
                        <p className="leading-relaxed">{msg.content}</p>
                        {msg.attachmentUrl && (
                          isImageUrl(msg.attachmentUrl) ? (
                            <img
                              src={msg.attachmentUrl}
                              alt={msg.attachmentName}
                              className="max-w-xs max-h-52 rounded-lg mt-2 cursor-pointer object-cover border border-luxury-border/30 hover:opacity-85 transition-all shadow-md"
                              onClick={() => window.open(msg.attachmentUrl, '_blank')}
                            />
                          ) : isVideoUrl(msg.attachmentUrl) ? (
                            <video
                              src={msg.attachmentUrl}
                              controls
                              className="max-w-xs max-h-52 rounded-lg mt-2 border border-luxury-border/30 shadow-md"
                            />
                          ) : (
                            <a
                              href={msg.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 mt-2 p-2.5 border rounded-xl text-xs transition-all w-fit ${
                                isOwnMessage
                                  ? 'bg-brand-700 border-brand-500 text-white hover:bg-brand-650'
                                  : 'bg-slate-950/60 border-luxury-border/40 text-brand-300 hover:text-white'
                              }`}
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[150px] font-medium">{msg.attachmentName || 'Fichier joint'}</span>
                            </a>
                          )
                        )}
                        <span className="text-[9px] text-slate-300/80 block text-right mt-1.5">
                          {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Attachment preview */}
              {selectedFile && (
                <div className="px-4 pt-3 flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-900 border border-luxury-border rounded-xl p-2 pl-3">
                    {filePreview ? (
                      <img src={filePreview} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-950 flex items-center justify-center">
                        <Paperclip className="w-4 h-4 text-brand-400" />
                      </div>
                    )}
                    <span className="text-xs text-slate-300 truncate max-w-[160px]">{selectedFile.name}</span>
                    <button type="button" onClick={clearAttachment} className="p-1 text-slate-400 hover:text-red-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Message Input bar */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-luxury-border flex gap-2 items-center bg-slate-900/20">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/*,application/pdf"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="إرفاق صورة أو فيديو أو ملف"
                  className="p-3 bg-slate-950/60 hover:bg-slate-900 border border-luxury-border rounded-xl text-brand-400 hover:text-brand-300 transition-colors shrink-0"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  placeholder="اكتب رسالتك هنا..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 bg-slate-950/60 border border-luxury-border rounded-xl px-4 py-3 text-sm focus:border-brand-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isUploading || (!messageText.trim() && !selectedFile)}
                  className="p-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 rounded-xl text-white transition-colors shrink-0"
                >
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <UserIcon className="w-12 h-12 text-slate-700 mb-4 animate-pulse" />
              <p className="text-sm">يرجى اختيار جهة اتصال لبدء المحادثة.</p>
            </div>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
