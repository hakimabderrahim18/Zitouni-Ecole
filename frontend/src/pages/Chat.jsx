import { motion } from 'framer-motion';
import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import {
  Send,
  Paperclip,
  Search,
  User as UserIcon,
  Users,
  MessageSquare,
  X,
  Image as ImageIcon,
  Check,
  CheckCheck,
  ShieldAlert,
  GraduationCap,
  Layers,
  ArrowRight,
  Smile,
  CornerDownLeft,
  Eye,
  EyeOff,
  Trash2,
  Flag,
  FileText,
  Video,
  Download,
  AlertTriangle,
} from 'lucide-react';
import axios from 'axios';

const roleLabels = {
  admin: 'الإدارة العامة',
  school: 'المدرسة',
  teacher: 'أستاذ',
  general_supervisor: 'مراقب عام',
  pedagogical_supervisor: 'مراقب تربوي',
  receptionist: 'موظف الاستقبال',
  student: 'تلميذ',
  parent: 'ولي أمر',
};

const roleBadge = {
  admin: 'bg-[#7B1E3A]/10 text-[#7B1E3A] border-[#7B1E3A]/25',
  school: 'bg-[#7B1E3A]/10 text-[#7B1E3A] border-[#7B1E3A]/25',
  teacher: 'bg-[#F3E9DC] text-[#7B1E3A] border-[#C9A24D]/40',
  general_supervisor: 'bg-[#C9A24D]/15 text-[#7B1E3A] border-[#C9A24D]/40',
  pedagogical_supervisor: 'bg-[#C9A24D]/15 text-[#7B1E3A] border-[#C9A24D]/40',
  receptionist: 'bg-[#F3E9DC] text-[#7B1E3A] border-[#C9A24D]/40',
  student: 'bg-blue-50 text-blue-900 border-blue-200',
  parent: 'bg-emerald-50 text-emerald-900 border-emerald-200',
};

const isImageUrl = (url = '') => /\.(jpeg|jpg|gif|png|webp)/i.test(url);
const isVideoUrl = (url = '') => /\.(mp4|webm|mov)/i.test(url);

export default function Chat() {
  const { user } = useAuthStore();
  const {
    conversations,
    contacts,
    groups,
    messages,
    activeChatPartner,
    activeGroup,
    chatMode,
    fetchConversations,
    fetchContacts,
    fetchGroups,
    setActiveChatPartner,
    setActiveGroup,
    sendDirectMessage,
    sendGroupMessage,
    reactToMessage,
    markMessageSeen,
    toggleHideMessage,
    deleteMessage,
  } = useChatStore();

  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarTab, setSidebarTab] = useState('groups'); // Default to groups for easy access
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileType, setFileType] = useState('none');
  const [isUploading, setIsUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  // Reporting modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingMessage, setReportingMessage] = useState(null);
  const [reportReason, setReportReason] = useState('inappropriate_language');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // Message hover action bar
  const [activeEmojiBarMsgId, setActiveEmojiBarMsgId] = useState(null);

  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditReason, setAuditReason] = useState('');
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResult, setAuditResult] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    fetchContacts();
    fetchGroups();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Automatically mark incoming messages as seen with exact timestamp
  useEffect(() => {
    if (messages.length > 0 && user?.id) {
      messages.forEach((msg) => {
        const senderId = msg.sender?._id || msg.sender;
        if (String(senderId) !== String(user.id)) {
          const alreadySeen = (msg.seenBy || []).some(
            (s) => String(s.user?._id || s.user) === String(user.id)
          );
          if (!alreadySeen && msg._id) {
            markMessageSeen(msg._id);
          }
        }
      });
    }
  }, [messages, user?.id]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert('حجم الملف كبير جداً. الحد الأقصى هو 50 ميغابايت.');
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      setFileType('image');
      setFilePreview(URL.createObjectURL(file));
    } else if (file.type.startsWith('video/')) {
      setFileType('video');
      setFilePreview(URL.createObjectURL(file));
    } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      setFileType('pdf');
      setFilePreview(null);
    } else {
      setFileType('file');
      setFilePreview(null);
    }
  };

  const clearAttachment = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileType('none');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectPartner = (partner) => {
    setActiveChatPartner(partner);
    setSidebarTab('chats');
  };

  const handleSelectGroup = (group) => {
    setActiveGroup(group);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() && !selectedFile) return;

    let attachmentUrl = '';
    let attachmentName = '';
    let finalMediaType = fileType;

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
        finalMediaType = res.data.mediaType || fileType;
      } catch (err) {
        alert(err.response?.data?.message || 'خطأ أثناء رفع الملف');
        setIsUploading(false);
        return;
      }
    }

    const replyToId = replyingTo?._id || null;

    if (chatMode === 'direct' && activeChatPartner) {
      await sendDirectMessage(activeChatPartner._id, messageText, attachmentUrl, attachmentName, finalMediaType, replyToId);
    } else if (chatMode === 'group' && activeGroup) {
      await sendGroupMessage(activeGroup.channelId, messageText, attachmentUrl, attachmentName, activeGroup, finalMediaType, replyToId);
    }

    setMessageText('');
    setReplyingTo(null);
    clearAttachment();
    setIsUploading(false);
  };

  const handleSendReport = async (e) => {
    e.preventDefault();
    if (!reportingMessage) return;

    setSubmittingReport(true);
    try {
      await axios.post(`/api/messages/${reportingMessage._id}/report`, {
        reason: reportReason,
        details: reportDetails,
      });
      alert('تم إرسال البلاغ بنجاح إلى الإدارة والمشرف العام للمراجعة والتدقيق.');
      setReportModalOpen(false);
      setReportingMessage(null);
      setReportDetails('');
    } catch (err) {
      alert(err.response?.data?.message || 'تعذر إرسال البلاغ.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleExecuteAudit = async () => {
    if (!activeChatPartner || !auditReason.trim()) {
      alert('يرجى تقديم مبرر رسمي لعملية التدقيق (المادة 18-19).');
      return;
    }

    setAuditLoading(true);
    try {
      const res = await axios.post('/api/messages/audit/inspect', {
        userAId: user?.id,
        userBId: activeChatPartner._id,
        reason: auditReason.trim(),
      });
      setAuditResult(res.data);
      alert('تم تسجيل عملية التفتيش الإداري بنجاح في سجل الأمان.');
    } catch (err) {
      alert(err.response?.data?.message || 'فشل إجراء التفتيش الإداري.');
    } finally {
      setAuditLoading(false);
    }
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredConversations = conversations.filter((c) => {
    if (!q) return true;
    const name = `${c.user?.firstName || ''} ${c.user?.lastName || ''}`.toLowerCase();
    return name.includes(q);
  });
  const filteredGroups = groups.filter((g) => {
    if (!q) return true;
    return g.title.toLowerCase().includes(q) || (g.description && g.description.toLowerCase().includes(q));
  });
  const filteredContacts = contacts.filter((c) => {
    if (!q) return true;
    const name = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
    return name.includes(q);
  });

  const isAdmin = ['admin', 'school'].includes(user?.role);

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        dir="rtl"
        className="h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)] flex rounded-3xl border border-[#C9A24D]/35 overflow-hidden bg-[#FDFBF7] text-right max-w-full shadow-sm"
      >
        {/* Conversations / Groups / Contacts Sidebar - Prestige Académique */}
        <div className={`border-l border-[#C9A24D]/25 flex flex-col bg-[#F3E9DC]/30 shrink-0 ${
          (activeChatPartner || activeGroup) ? 'hidden md:flex md:w-80' : 'w-full md:w-80'
        }`}>
          {/* Navigation Tabs */}
          <div className="p-3 border-b border-[#C9A24D]/25 grid grid-cols-3 gap-1.5 bg-[#F3E9DC]/60">
            <button
              onClick={() => setSidebarTab('groups')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                sidebarTab === 'groups'
                  ? 'bg-[#7B1E3A] text-white shadow-xs'
                  : 'bg-white text-[#2B2022]/70 hover:text-[#7B1E3A] border border-[#C9A24D]/20'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>المجموعات</span>
            </button>
            <button
              onClick={() => setSidebarTab('chats')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                sidebarTab === 'chats'
                  ? 'bg-[#7B1E3A] text-white shadow-xs'
                  : 'bg-white text-[#2B2022]/70 hover:text-[#7B1E3A] border border-[#C9A24D]/20'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>المحادثات</span>
            </button>
            <button
              onClick={() => setSidebarTab('contacts')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                sidebarTab === 'contacts'
                  ? 'bg-[#7B1E3A] text-white shadow-xs'
                  : 'bg-white text-[#2B2022]/70 hover:text-[#7B1E3A] border border-[#C9A24D]/20'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>جهات الاتصال</span>
            </button>
          </div>

          {/* Search box */}
          <div className="p-3 border-b border-[#C9A24D]/20">
            <div className="relative">
              <Search className="w-4 h-4 text-[#2B2022]/40 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  sidebarTab === 'groups'
                    ? 'ابحث في الأفواج والمجموعات...'
                    : 'ابحث عن جهة اتصال أو محادثة...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#C9A24D]/30 rounded-xl pr-9 pl-3 py-2 text-xs text-[#2B2022] placeholder-[#2B2022]/40 focus:border-[#7B1E3A] focus:outline-none"
              />
            </div>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#C9A24D]/15">
            {sidebarTab === 'chats' && (
              filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-[#2B2022]/50 text-xs">
                  لا توجد محادثات نشطة حالياً. اختر "جهات الاتصال" لبدء مراسلة جديدة.
                </div>
              ) : (
                filteredConversations.map((chat, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveChatPartner(chat.user)}
                    className={`w-full p-3.5 flex items-center gap-3 text-right transition-colors hover:bg-[#F3E9DC]/40 cursor-pointer ${
                      chatMode === 'direct' && activeChatPartner?._id === chat.user?._id
                        ? 'bg-[#F3E9DC] border-r-4 border-[#7B1E3A]'
                        : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[#7B1E3A]/10 flex items-center justify-center font-bold text-[#7B1E3A] border border-[#C9A24D]/35 shrink-0">
                      {chat.user?.profilePic ? (
                        <img src={chat.user.profilePic} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <span>{chat.user?.firstName?.[0]}{chat.user?.lastName?.[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="text-xs font-bold truncate text-[#2B2022]">
                          {chat.user?.firstName} {chat.user?.lastName}
                        </h4>
                        <span className="text-[10px] text-[#2B2022]/50 font-mono">
                          {chat.lastUpdated ? new Date(chat.lastUpdated).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-[#2B2022]/70 truncate max-w-[150px]">
                          {chat.lastMessage || '📎 مرفق'}
                        </p>
                        {chat.lastStatus === 'read' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-cyan-600 inline" />
                        ) : chat.lastStatus === 'delivered' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-[#2B2022]/40 inline" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-[#2B2022]/40 inline" />
                        )}
                      </div>
                    </div>
                    {chat.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[#7B1E3A] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {chat.unreadCount}
                      </span>
                    )}
                  </button>
                ))
              )
            )}

            {sidebarTab === 'groups' && (
              filteredGroups.length === 0 ? (
                <div className="p-6 text-center text-[#2B2022]/50 text-xs">
                  لا توجد مجموعات متاحة لحسابك حالياً.
                </div>
              ) : (
                filteredGroups.map((grp) => (
                  <button
                    key={grp.channelId}
                    onClick={() => handleSelectGroup(grp)}
                    className={`w-full p-3.5 flex items-center gap-3 text-right transition-colors hover:bg-[#F3E9DC]/40 cursor-pointer ${
                      chatMode === 'group' && activeGroup?.channelId === grp.channelId
                        ? 'bg-[#F3E9DC] border-r-4 border-[#7B1E3A]'
                        : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-white flex items-center justify-center font-bold text-[#7B1E3A] border border-[#C9A24D]/35 shrink-0 shadow-2xs">
                      {grp.groupType === 'teachers' ? (
                        <GraduationCap className="w-5 h-5 text-[#7B1E3A]" />
                      ) : grp.groupType === 'supervisors' ? (
                        <ShieldAlert className="w-5 h-5 text-[#C9A24D]" />
                      ) : (
                        <Users className="w-5 h-5 text-emerald-700" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="text-xs font-bold truncate text-[#2B2022]">
                          {grp.title}
                        </h4>
                        {grp.lastUpdated && (
                          <span className="text-[10px] text-[#2B2022]/50 font-mono">
                            {new Date(grp.lastUpdated).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#2B2022]/70 truncate">
                        {grp.lastMessage || grp.description || 'مجموعة مدرسية رسمية'}
                      </p>
                    </div>
                    {grp.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[#7B1E3A] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {grp.unreadCount}
                      </span>
                    )}
                  </button>
                ))
              )
            )}

            {sidebarTab === 'contacts' && (
              filteredContacts.length === 0 ? (
                <div className="p-6 text-center text-[#2B2022]/50 text-xs">
                  لا توجد جهات اتصال متاحة وفقاً لصلاحيات المراسلة المحددة (المادة 18).
                </div>
              ) : (
                filteredContacts.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => handleSelectPartner(c)}
                    className="w-full p-3.5 flex items-center gap-3 text-right transition-colors hover:bg-[#F3E9DC]/40 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[#7B1E3A]/10 flex items-center justify-center font-bold text-[#7B1E3A] border border-[#C9A24D]/35 shrink-0">
                      {c.profilePic ? (
                        <img src={c.profilePic} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <span>{c.firstName?.[0]}{c.lastName?.[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold truncate text-[#2B2022]">
                        {c.firstName} {c.lastName}
                      </h4>
                      <span
                        className={`inline-flex items-center text-[9px] font-semibold px-2 py-0.5 rounded-full border mt-1 ${
                          roleBadge[c.role] || roleBadge.student
                        }`}
                      >
                        {roleLabels[c.role] || c.role}
                      </span>
                    </div>
                  </button>
                ))
              )
            )}
          </div>
        </div>

        {/* Messaging Chat Window Area */}
        <div className={`flex-1 flex flex-col bg-white min-w-0 ${
          !(activeChatPartner || activeGroup) ? 'hidden md:flex' : 'flex'
        }`}>
          {(chatMode === 'direct' && activeChatPartner) || (chatMode === 'group' && activeGroup) ? (
            <>
              {/* Chat room header */}
              <div className="p-3 sm:p-4 border-b border-[#C9A24D]/25 flex items-center justify-between bg-[#F3E9DC]/60">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveChatPartner(null);
                      setActiveGroup(null);
                    }}
                    className="md:hidden p-1.5 hover:bg-white rounded-lg text-[#2B2022] shrink-0 cursor-pointer"
                    title="رجوع للقائمة"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-white flex items-center justify-center font-bold text-[#7B1E3A] border border-[#C9A24D]/35 shrink-0 shadow-2xs">
                    {chatMode === 'direct' ? (
                      activeChatPartner.profilePic ? (
                        <img src={activeChatPartner.profilePic} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <span>{activeChatPartner.firstName?.[0]}{activeChatPartner.lastName?.[0]}</span>
                      )
                    ) : (
                      <Users className="w-5 h-5 text-[#7B1E3A]" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-serif font-black text-[#7B1E3A] text-sm">
                      {chatMode === 'direct'
                        ? `${activeChatPartner.firstName} ${activeChatPartner.lastName}`
                        : activeGroup.title}
                    </h3>
                    <p className="text-xs text-[#2B2022]/70 flex items-center gap-2">
                      {chatMode === 'direct' ? (
                        <span className="capitalize">{roleLabels[activeChatPartner.role] || activeChatPartner.role}</span>
                      ) : (
                        <span>{activeGroup.description || 'فوج مدرسي رسمي'}</span>
                      )}
                      {chatMode === 'direct' && activeChatPartner.phoneNumber && (
                        <span className="text-[#2B2022]/50 text-[11px] font-mono" dir="ltr">
                          {activeChatPartner.phoneNumber}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Administrative Conversation Audit Button (Art. 18-19) */}
                {isAdmin && chatMode === 'direct' && (
                  <button
                    onClick={() => setAuditModalOpen(true)}
                    title="تفتيش ومراجعة أمنية رسمية مع التوثيق (المادة 18)"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-300 hover:bg-rose-100 rounded-xl transition-all cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>تفتيش إداري معلل</span>
                  </button>
                )}
              </div>

              {/* Message scroll container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#FDFBF7]">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-[#2B2022]/50 text-xs">
                    <MessageSquare className="w-8 h-8 text-[#C9A24D]/50 mb-2" />
                    <p>لا توجد رسائل سابقة. ابدأ المحادثة الآن.</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const senderId = msg.sender?._id || msg.sender;
                    const myId = user?.id || user?._id;
                    const isOwnMessage = String(senderId) === String(myId);
                    const isPrivileged = ['admin', 'school', 'general_supervisor'].includes(user?.role);
                    const showEmojiBar = activeEmojiBarMsgId === msg._id;

                    return (
                      <div
                        key={idx}
                        className={`w-full flex ${isOwnMessage ? 'justify-start' : 'justify-end'} group relative`}
                      >
                        <div className={`flex flex-col ${isOwnMessage ? 'items-start' : 'items-end'} max-w-[78%] sm:max-w-[70%]`}>
                          <div className={`flex items-start gap-1 w-full ${isOwnMessage ? 'flex-row' : 'flex-row-reverse'}`}>
                            <div
                              className={`rounded-2xl p-3.5 sm:p-4 text-xs shadow-xs transition-all relative ${
                                isOwnMessage
                                  ? 'bg-[#7B1E3A] !text-white rounded-br-none shadow-sm chat-own-bubble'
                                  : 'bg-white border border-[#C9A24D]/30 text-[#2B2022] rounded-bl-none shadow-2xs'
                              }`}
                            >
                              {/* In group chat, show sender name */}
                              {chatMode === 'group' && !isOwnMessage && (
                                <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-[#C9A24D]/20">
                                  <span className="font-serif font-black text-[#7B1E3A] text-[11px]">
                                    {msg.sender?.firstName} {msg.sender?.lastName}
                                  </span>
                                  <span className="text-[9px] px-1.5 py-0.2 bg-[#F3E9DC] text-[#7B1E3A] rounded-full border border-[#C9A24D]/30">
                                    {roleLabels[msg.sender?.role] || msg.sender?.role}
                                  </span>
                                </div>
                              )}

                              {/* Quoted Message / Reply Preview */}
                              {msg.replyTo && (
                                <div
                                  className={`p-2 rounded-xl mb-2 text-[11px] border-r-3 ${
                                    isOwnMessage
                                      ? 'bg-black/25 border-white/60 !text-white/90'
                                      : 'bg-[#F3E9DC]/70 border-[#7B1E3A] text-slate-700'
                                  }`}
                                >
                                  <span className="font-bold block text-[10px] text-[#C9A24D]">
                                    رد على: {msg.replyTo.sender?.firstName || 'مستخدم'}
                                  </span>
                                  <p className="truncate line-clamp-1">{msg.replyTo.content || 'مرفق'}</p>
                                </div>
                              )}

                              {/* Message Content */}
                              {msg.isDeleted ? (
                                <p className="italic text-slate-400 text-xs">تم حذف هذه الرسالة من قبل صاحبها أو الإدارة.</p>
                              ) : msg.isHidden && !isPrivileged ? (
                                <p className="italic text-amber-700 text-xs">تم إخفاء هذه الرسالة من قبل الإدارة.</p>
                              ) : (
                                <>
                                  {msg.isHidden && (
                                    <div className="mb-1 text-[10px] text-amber-400 font-bold flex items-center gap-1">
                                      <EyeOff className="w-3 h-3" />
                                      <span>هذه الرسالة مخفية عن غير المسؤولين</span>
                                    </div>
                                  )}
                                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                </>
                              )}

                              {/* Multi-Media Attachment rendering */}
                              {msg.attachmentUrl && !msg.isDeleted && (
                                msg.mediaType === 'image' || isImageUrl(msg.attachmentUrl) ? (
                                  <img
                                    src={msg.attachmentUrl}
                                    alt={msg.attachmentName}
                                    className="max-w-xs max-h-52 rounded-xl mt-2 cursor-pointer object-cover border border-[#C9A24D]/30 hover:opacity-90 transition-all shadow-sm"
                                    onClick={() => window.open(msg.attachmentUrl, '_blank')}
                                  />
                                ) : msg.mediaType === 'video' || isVideoUrl(msg.attachmentUrl) ? (
                                  <video
                                    src={msg.attachmentUrl}
                                    controls
                                    className="max-w-xs max-h-52 rounded-xl mt-2 border border-[#C9A24D]/30 shadow-sm"
                                  />
                                ) : msg.mediaType === 'pdf' || msg.attachmentUrl.toLowerCase().endsWith('.pdf') ? (
                                  <a
                                    href={msg.attachmentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-3 mt-2 p-3 border rounded-xl text-xs transition-all w-fit ${
                                      isOwnMessage
                                        ? 'bg-[#62162d] border-[#C9A24D]/40 text-white hover:bg-[#501224]'
                                        : 'bg-[#F3E9DC] border-[#C9A24D]/30 text-[#7B1E3A] hover:bg-[#ebdcc7]'
                                    }`}
                                  >
                                    <FileText className="w-6 h-6 text-rose-500 shrink-0" />
                                    <div className="truncate max-w-[170px]">
                                      <span className="font-bold block truncate">{msg.attachmentName || 'ملف PDF'}</span>
                                      <span className="text-[9px] opacity-75 font-mono">وثيقة PDF رسمية</span>
                                    </div>
                                    <Download className="w-3.5 h-3.5 text-[#C9A24D] shrink-0" />
                                  </a>
                                ) : (
                                  <a
                                    href={msg.attachmentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 mt-2 p-2.5 border rounded-xl text-xs transition-all w-fit ${
                                      isOwnMessage
                                        ? 'bg-[#62162d] border-[#C9A24D]/40 text-white hover:bg-[#501224]'
                                        : 'bg-[#F3E9DC] border-[#C9A24D]/30 text-[#7B1E3A] hover:bg-[#ebdcc7]'
                                    }`}
                                  >
                                    <Paperclip className="w-3.5 h-3.5" />
                                    <span className="truncate max-w-[170px] font-medium font-mono">
                                      {msg.attachmentName || 'ملف مرفق 📎'}
                                    </span>
                                  </a>
                                )
                              )}

                              {/* Emoji Reactions List on Message */}
                              {msg.reactions && msg.reactions.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {Object.entries(
                                    msg.reactions.reduce((acc, r) => {
                                      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                      return acc;
                                    }, {})
                                  ).map(([emoji, count]) => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() => reactToMessage(msg._id, emoji)}
                                      className="px-2 py-0.5 rounded-full bg-white border border-[#C9A24D]/30 text-xs shadow-2xs hover:scale-110 transition-transform flex items-center gap-1 cursor-pointer"
                                    >
                                      <span>{emoji}</span>
                                      <span className="text-[10px] font-bold text-[#7B1E3A]">{count}</span>
                                    </button>
                                  ))}
                                </div>
                              )}

                              {/* Time and Exact Seen System Indicator */}
                              <div
                                className={`flex items-center justify-between mt-2 pt-1 border-t text-[10px] ${
                                  isOwnMessage ? 'border-white/20 !text-white/80' : 'border-[#C9A24D]/20 text-[#2B2022]/60'
                                }`}
                              >
                                <span className="font-mono">
                                  {new Date(msg.createdAt).toLocaleTimeString('ar-DZ', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>

                                {isOwnMessage && (
                                  <div className="flex items-center gap-1">
                                    {msg.seenBy && msg.seenBy.length > 0 ? (
                                      <span
                                        className="text-[#C9A24D] flex items-center gap-1 font-bold cursor-help"
                                        title={`شوهد في ${new Date(msg.seenBy[msg.seenBy.length - 1].seenAt).toLocaleDateString('ar-DZ')} الساعة ${new Date(msg.seenBy[msg.seenBy.length - 1].seenAt).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}`}
                                      >
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        <span className="text-[9px]">
                                          شوهد {new Date(msg.seenBy[msg.seenBy.length - 1].seenAt).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </span>
                                    ) : msg.status === 'delivered' ? (
                                      <span className="!text-white/80 flex items-center text-[10px]" title="تم التسليم">
                                        <CheckCheck className="w-3.5 h-3.5" /> تم التسليم
                                      </span>
                                    ) : (
                                      <span className="!text-white/60 flex items-center text-[10px]" title="تم الإرسال">
                                        <Check className="w-3.5 h-3.5" /> أُرسل
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Quick Message Actions (Hover / Tap) */}
                            {!msg.isDeleted && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-[#C9A24D]/35 rounded-xl p-1 shadow-xs shrink-0 self-center">
                                {/* Reply */}
                                <button
                                  type="button"
                                  onClick={() => setReplyingTo(msg)}
                                  title="رد على هذه الرسالة"
                                  className="p-1 hover:bg-[#F3E9DC] text-slate-600 hover:text-[#7B1E3A] rounded-lg transition-colors cursor-pointer"
                                >
                                  <CornerDownLeft className="w-3.5 h-3.5" />
                                </button>

                                {/* Emoji Picker trigger */}
                                <button
                                  type="button"
                                  onClick={() => setActiveEmojiBarMsgId(showEmojiBar ? null : msg._id)}
                                  title="تفاعل مع الرسالة"
                                  className="p-1 hover:bg-[#F3E9DC] text-slate-600 hover:text-[#7B1E3A] rounded-lg transition-colors cursor-pointer"
                                >
                                  <Smile className="w-3.5 h-3.5" />
                                </button>

                                {/* Report message (if not sent by self) */}
                                {!isOwnMessage && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReportingMessage(msg);
                                      setReportModalOpen(true);
                                    }}
                                    title="إبلاغ عن هذه الرسالة"
                                    className="p-1 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Flag className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Administration Moderation Controls */}
                                {isPrivileged && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => toggleHideMessage(msg._id)}
                                      title={msg.isHidden ? 'إظهار الرسالة' : 'إخفاء الرسالة'}
                                      className="p-1 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <EyeOff className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (window.confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
                                          deleteMessage(msg._id);
                                        }
                                      }}
                                      title="حذف الرسالة نهائياً"
                                      className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Inline Emoji Selector Popup */}
                          {showEmojiBar && (
                            <div className="flex items-center gap-1.5 p-1.5 bg-white border border-[#C9A24D]/40 rounded-2xl shadow-lg mt-1 z-10 animate-in fade-in zoom-in-95">
                              {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => {
                                    reactToMessage(msg._id, emoji);
                                    setActiveEmojiBarMsgId(null);
                                  }}
                                  className="p-1 hover:scale-125 transition-transform text-base cursor-pointer"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Replying Banner */}
              {replyingTo && (
                <div className="px-4 py-2 border-t border-[#C9A24D]/25 bg-[#F3E9DC]/70 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CornerDownLeft className="w-4 h-4 text-[#7B1E3A] rotate-180" />
                    <span className="text-[#2B2022]">
                      الرد على <strong className="text-[#7B1E3A]">{replyingTo.sender?.firstName || 'مستخدم'}</strong>: {replyingTo.content ? replyingTo.content.substring(0, 45) + '...' : 'مرفق'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Attachment Preview Bar */}
              {selectedFile && (
                <div className="px-4 py-2 border-t border-[#C9A24D]/25 bg-[#F3E9DC]/40 flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white border border-[#C9A24D]/35 rounded-xl p-2 pl-3 shadow-2xs">
                    {fileType === 'image' && filePreview ? (
                      <img src={filePreview} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : fileType === 'video' ? (
                      <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                        <Video className="w-5 h-5 text-[#C9A24D]" />
                      </div>
                    ) : fileType === 'pdf' ? (
                      <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                        <FileText className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#F3E9DC] flex items-center justify-center">
                        <Paperclip className="w-4 h-4 text-[#7B1E3A]" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-xs text-[#2B2022] truncate max-w-[180px] font-mono">
                        {selectedFile.name}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">
                        {fileType === 'pdf' ? 'مستند PDF' : fileType === 'video' ? 'فيديو' : fileType === 'image' ? 'صورة' : 'ملف'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={clearAttachment}
                      className="p-1 text-[#2B2022]/40 hover:text-rose-600 transition-colors cursor-pointer mr-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Input Form */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-[#C9A24D]/25 flex gap-2 items-center bg-[#F3E9DC]/40"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="إرفاق صورة، فيديو، أو مستند PDF"
                  className="p-3 bg-white hover:bg-[#F3E9DC]/50 border border-[#C9A24D]/35 rounded-xl text-[#7B1E3A] transition-colors shrink-0 cursor-pointer shadow-2xs"
                >
                  <Paperclip className="w-5 h-5 text-[#C9A24D]" />
                </button>
                <input
                  type="text"
                  placeholder={
                    chatMode === 'group'
                      ? `اكتب رسالة إلى ${activeGroup.title}...`
                      : `اكتب رسالتك إلى ${activeChatPartner?.firstName}...`
                  }
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 bg-white border border-[#C9A24D]/35 rounded-xl px-4 py-3 text-xs text-[#2B2022] focus:border-[#7B1E3A] focus:outline-none placeholder:text-[#2B2022]/40 shadow-2xs"
                />
                <button
                  type="submit"
                  disabled={isUploading || (!messageText.trim() && !selectedFile)}
                  className="p-3 bg-[#7B1E3A] hover:bg-[#62162d] disabled:opacity-40 rounded-xl text-white transition-colors shrink-0 shadow-md shadow-[#7B1E3A]/20 cursor-pointer border border-[#C9A24D]/30"
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
            <div className="flex-1 flex flex-col items-center justify-center text-[#2B2022]/50 p-6 text-center bg-[#FDFBF7]">
              <UserIcon className="w-14 h-14 text-[#C9A24D]/40 mb-3 animate-pulse" />
              <h4 className="text-[#7B1E3A] text-base font-serif font-black mb-1">منصة المراسلات المدرسية الآمنة</h4>
              <p className="text-xs text-[#2B2022]/60 max-w-sm">
                اختر محادثة مباشرة أو فوجاً مدرسياً من القائمة الجانبية لبدء التواصل الآمن والمحمي.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Administrative Audit Modal (Art. 18-19) */}
      {auditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-3xl p-6 shadow-2xl text-right"
          >
            <div className="flex items-center justify-between mb-4 border-b border-[#C9A24D]/25 pb-3">
              <div className="flex items-center gap-2 text-[#7B1E3A] font-serif font-black">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span className="text-base">إجراء تفتيش إداري معلل للمحادثة (المادة 18)</span>
              </div>
              <button onClick={() => setAuditModalOpen(false)} className="text-[#2B2022]/60 hover:text-[#7B1E3A] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#2B2022]/80 leading-relaxed mb-4">
              طبقاً للمادة 18 من النظام الداخلي لمؤسسة التربية والتعليم حبر وألوان، فإن المحادثات الخاصة محمية تماماً،
              ولا يجوز للإدارة الاطلاع عليها إلا لضرورة قصوى مع وجوب إدراج مبرر رسمي وتوثيق اسم المسؤول والتاريخ وعنوان IP.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-[#7B1E3A] mb-1.5 font-serif">
                المبرر الإداري الرسمي لعملية الفحص والتفتيش :
              </label>
              <textarea
                rows={3}
                value={auditReason}
                onChange={(e) => setAuditReason(e.target.value)}
                placeholder="مثال: فحص شكوى رسمية مقدمة بتاريخ اليوم برقم وارد 2026/..."
                className="w-full bg-white border border-[#C9A24D]/35 rounded-xl p-3 text-xs text-[#2B2022] focus:border-[#7B1E3A] focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExecuteAudit}
                disabled={auditLoading || auditReason.trim().length < 5}
                className="flex-1 py-2.5 px-4 bg-[#7B1E3A] hover:bg-[#62162d] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer border border-[#C9A24D]/30"
              >
                {auditLoading ? 'جارِ التوثيق والفحص...' : 'توثيق التدقيق والإذن بالمطالعة'}
              </button>
              <button
                onClick={() => setAuditModalOpen(false)}
                className="py-2.5 px-4 bg-white hover:bg-[#F3E9DC]/40 border border-[#C9A24D]/30 text-[#2B2022]/70 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Message Reporting Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-3xl p-6 shadow-2xl text-right"
          >
            <div className="flex items-center justify-between mb-4 border-b border-[#C9A24D]/25 pb-3">
              <div className="flex items-center gap-2 text-[#7B1E3A] font-serif font-black">
                <Flag className="w-5 h-5 text-amber-600" />
                <span className="text-base">إبلاغ عن رسالة للإدارة</span>
              </div>
              <button
                onClick={() => setReportModalOpen(false)}
                className="text-[#2B2022]/60 hover:text-[#7B1E3A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#2B2022]/70 leading-relaxed mb-4 font-sans">
              سيتم إرسال هذا التبليغ مباشرة إلى لوحة المشرف العام والإدارة العامة لفحصه واتخاذ الإجراءات التأديبية المناسبة.
            </p>

            <form onSubmit={handleSendReport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#7B1E3A] mb-1.5 font-sans">سبب البلاغ:</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-white border border-[#C9A24D]/35 rounded-xl p-2.5 text-xs text-[#2B2022] focus:border-[#7B1E3A] focus:outline-none font-sans"
                >
                  <option value="inappropriate_language">ألفاظ غير لائقة أو سب وشتم</option>
                  <option value="harassment">مضايقة أو تنمر أو إساءة</option>
                  <option value="spam">إعلانات غير مصرح بها أو إزعاج متكرر</option>
                  <option value="false_info">معلومات غير صحيحة أو مضللة</option>
                  <option value="other">أسباب أخرى تخالف النظام المدرسي</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7B1E3A] mb-1.5 font-sans">تفاصيل إضافية (اختياري):</label>
                <textarea
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="وضح سبب البلاغ بالتفصيل لمساعدة الإدارة..."
                  className="w-full bg-white border border-[#C9A24D]/35 rounded-xl p-3 text-xs text-[#2B2022] focus:border-[#7B1E3A] focus:outline-none font-sans"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="flex-1 py-2.5 px-4 bg-[#7B1E3A] hover:bg-[#62162d] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer border border-[#C9A24D]/30 font-sans"
                >
                  {submittingReport ? 'جارِ الإرسال...' : 'إرسال البلاغ للإدارة'}
                </button>
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="py-2.5 px-4 bg-white hover:bg-[#F3E9DC]/40 border border-[#C9A24D]/30 text-[#2B2022]/70 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
