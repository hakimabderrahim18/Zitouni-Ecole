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
  Sparkles,
  Plus,
  Edit3,
} from 'lucide-react';
import axios from 'axios';

const roleLabels = {
  admin: 'الإدارة العامة',
  school: 'المدرسة',
  teacher: 'أستاذ(ة)',
  general_supervisor: 'مراقب عام',
  pedagogical_supervisor: 'مشرف تربوي',
  receptionist: 'موظف الاستقبال',
  student: 'تلميذ(ة)',
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

// Helper: Formats bilingual titles to prevent RTL parenthesis inversion glitches
const renderBilingualTitle = (rawTitle = '') => {
  const match = rawTitle.match(/^(.*?)\s*\((.*?)\)\s*$/);
  if (match) {
    const mainArabic = match[1].trim();
    const englishBadge = match[2].trim();
    return (
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        <span className="font-serif font-black text-[#7B1E3A] text-sm sm:text-base leading-tight truncate">
          {mainArabic}
        </span>
        <span
          dir="ltr"
          className="inline-flex items-center font-sans text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#7B1E3A]/10 text-[#7B1E3A] border border-[#7B1E3A]/25 shrink-0"
        >
          {englishBadge}
        </span>
      </div>
    );
  }
  return (
    <span className="font-serif font-black text-[#7B1E3A] text-sm sm:text-base leading-tight truncate">
      <bdi>{rawTitle}</bdi>
    </span>
  );
};

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
    connectSocket,
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
    createGroupChannel,
    updateGroupChannel,
    deleteGroupChannel,
  } = useChatStore();

  const isPrivileged = ['admin', 'school', 'general_supervisor', 'pedagogical_supervisor'].includes(user?.role);

  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarTab, setSidebarTab] = useState('groups'); // Default to groups
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileType, setFileType] = useState('none');
  const [isUploading, setIsUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  // Group Management modal state
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupModalMode, setGroupModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState(null);
  const [groupFormTitle, setGroupFormTitle] = useState('');
  const [groupFormDesc, setGroupFormDesc] = useState('');
  const [groupFormAudience, setGroupFormAudience] = useState(['all']);
  const [groupFormType, setGroupFormType] = useState('custom'); // 'custom' | 'class' | 'class_group' | 'class_parents'
  const [groupFormClassId, setGroupFormClassId] = useState('');
  const [groupFormGroupId, setGroupFormGroupId] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableClassGroups, setAvailableClassGroups] = useState([]);
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);

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
  const messageContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch classes and groups for administrative assignment
  useEffect(() => {
    if (isPrivileged) {
      axios.get('/api/admin/classes')
        .then((res) => {
          if (Array.isArray(res.data)) setAvailableClasses(res.data);
        })
        .catch(() => {});
      axios.get('/api/admin/groups')
        .then((res) => {
          if (Array.isArray(res.data)) setAvailableClassGroups(res.data);
        })
        .catch(() => {});
    }
  }, [isPrivileged]);

  useEffect(() => {
    const currentUserId = user?.id || user?._id;
    if (currentUserId) {
      connectSocket(currentUserId);
    }
    fetchConversations();
    fetchContacts();
    fetchGroups();
  }, [user]);

  // Robust auto-scroll to bottom on conversation load & incoming messages
  const scrollToBottom = (behavior = 'auto') => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
    const timer1 = setTimeout(() => scrollToBottom('auto'), 40);
    const timer2 = setTimeout(() => scrollToBottom('smooth'), 150);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [messages, activeChatPartner, activeGroup]);

  // Automatically mark incoming messages as seen with exact timestamp
  useEffect(() => {
    const myId = String(user?.id || user?._id || '');
    if (messages.length > 0 && myId) {
      messages.forEach((msg) => {
        const senderId = String(msg.sender?._id || msg.sender);
        if (senderId && senderId !== myId) {
          const alreadySeen = (msg.seenBy || []).some(
            (s) => String(s.user?._id || s.user) === myId
          );
          if (!alreadySeen && msg._id) {
            markMessageSeen(msg._id);
          }
        }
      });
    }
  }, [messages, user]);

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
      await sendDirectMessage(
        activeChatPartner._id,
        messageText,
        attachmentUrl,
        attachmentName,
        finalMediaType,
        replyToId
      );
    } else if (chatMode === 'group' && activeGroup) {
      await sendGroupMessage(
        activeGroup.channelId,
        messageText,
        attachmentUrl,
        attachmentName,
        activeGroup,
        finalMediaType,
        replyToId
      );
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

  // Group Management Handlers (Administration)
  const handleOpenCreateGroup = () => {
    setGroupModalMode('create');
    setSelectedGroupForEdit(null);
    setGroupFormType('custom');
    setGroupFormClassId('');
    setGroupFormGroupId('');
    setGroupFormTitle('');
    setGroupFormDesc('');
    setGroupFormAudience(['all']);
    setGroupModalOpen(true);
  };

  const handleOpenEditGroup = (grp) => {
    setGroupModalMode('edit');
    setSelectedGroupForEdit(grp);
    setGroupFormType(grp.groupType || 'custom');
    setGroupFormClassId(grp.classId?._id || grp.classId || '');
    setGroupFormGroupId(grp.groupId?._id || grp.groupId || '');
    setGroupFormTitle(grp.title || '');
    setGroupFormDesc(grp.description || '');
    setGroupFormAudience(
      Array.isArray(grp.targetAudience) && grp.targetAudience.length > 0
        ? grp.targetAudience
        : ['all']
    );
    setGroupModalOpen(true);
  };

  const handleClassSelect = (cId) => {
    setGroupFormClassId(cId);
    setGroupFormGroupId('');
    const cls = availableClasses.find((c) => String(c._id) === String(cId));
    if (cls) {
      if (groupFormType === 'class') {
        setGroupFormTitle(`مجموعة قسم: ${cls.name}`);
        setGroupFormDesc(`قناة التواصل والمتابعة الأكاديمية لقسم ${cls.name}`);
      } else if (groupFormType === 'class_parents') {
        setGroupFormTitle(`أولياء أمور قسم: ${cls.name}`);
        setGroupFormDesc(`قناة التواصل مع أولياء تلاميذ قسم ${cls.name}`);
      }
    }
  };

  const handleGroupSelect = (gId) => {
    setGroupFormGroupId(gId);
    const grp = availableClassGroups.find((g) => String(g._id) === String(gId));
    const cls = availableClasses.find((c) => String(c._id) === String(groupFormClassId));
    if (grp) {
      const clsName = cls ? cls.name : (grp.class?.name || '');
      setGroupFormTitle(`فوج: ${grp.name} - ${clsName}`);
      setGroupFormDesc(`قناة العمل والأنشطة الخاصة بفوج ${grp.name}`);
    }
  };

  const toggleAudienceTag = (tag) => {
    if (tag === 'all') {
      setGroupFormAudience(['all']);
      return;
    }
    setGroupFormAudience((prev) => {
      const filtered = prev.filter((t) => t !== 'all');
      if (filtered.includes(tag)) {
        const next = filtered.filter((t) => t !== tag);
        return next.length === 0 ? ['all'] : next;
      } else {
        return [...filtered, tag];
      }
    });
  };

  const handleSubmitGroup = async (e) => {
    e.preventDefault();
    if (!groupFormTitle.trim() || isSubmittingGroup) return;
    setIsSubmittingGroup(true);
    try {
      const payload = {
        title: groupFormTitle.trim(),
        description: groupFormDesc.trim(),
        targetAudience: groupFormAudience,
        groupType: groupFormType,
        classId: groupFormClassId || null,
        groupId: groupFormGroupId || null,
      };
      if (groupModalMode === 'create') {
        await createGroupChannel(payload);
      } else if (selectedGroupForEdit) {
        await updateGroupChannel(selectedGroupForEdit.channelId, payload);
      }
      setGroupModalOpen(false);
      setGroupFormTitle('');
      setGroupFormDesc('');
      setGroupFormClassId('');
      setGroupFormGroupId('');
      setSelectedGroupForEdit(null);
    } catch (err) {
      alert(err.response?.data?.message || 'فشلت معالجة بيانات المجموعة.');
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  const handleDeleteGroup = async (grp) => {
    if (window.confirm(`هل أنت متأكد من حذف مجموعة "${grp.title || 'هذه المجموعة'}" نهائياً؟`)) {
      try {
        await deleteGroupChannel(grp.channelId);
        if (activeGroup?.channelId === grp.channelId) {
          setActiveGroup(null);
        }
      } catch (err) {
        alert(err.response?.data?.message || 'فشل حذف المجموعة.');
      }
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
    } catch (err) {
      alert(err.response?.data?.message || 'تعذر إتمام عملية التدقيق.');
    } finally {
      setAuditLoading(false);
    }
  };

  const q = searchQuery.toLowerCase().trim();
  const filteredConversations = conversations.filter((c) => {
    if (!q) return true;
    const name = `${c.user?.firstName || ''} ${c.user?.lastName || ''}`.toLowerCase();
    const lastMsg = (c.lastMessage || '').toLowerCase();
    return name.includes(q) || lastMsg.includes(q);
  });
  const filteredGroups = groups.filter((g) => {
    if (!q) return true;
    const title = (g.title || '').toLowerCase();
    const desc = (g.description || '').toLowerCase();
    return title.includes(q) || desc.includes(q);
  });
  const filteredContacts = contacts.filter((c) => {
    if (!q) return true;
    const name = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
    const role = (roleLabels[c.role] || c.role || '').toLowerCase();
    return name.includes(q) || role.includes(q);
  });

  const isAdmin = ['admin', 'school'].includes(user?.role);

  return (
    <DashboardLayout noPadding>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        dir="rtl"
        className="flex-1 h-full min-h-0 flex rounded-2xl sm:rounded-3xl border border-[#C9A24D]/35 overflow-hidden bg-[#FDFBF7] text-right max-w-full shadow-lg"
      >
        {/* ================================================================ */}
        {/* SIDEBAR: Groups / Conversations / Contacts                       */}
        {/* ================================================================ */}
        <div
          className={`border-l border-[#C9A24D]/25 flex flex-col bg-[#F3E9DC]/35 shrink-0 ${
            activeChatPartner || activeGroup ? 'hidden md:flex md:w-80 lg:w-88' : 'w-full md:w-80 lg:w-88'
          }`}
        >
          {/* Top Segmented Tabs */}
          <div className="p-3 border-b border-[#C9A24D]/25 bg-[#F3E9DC]/75">
            <div className="grid grid-cols-3 gap-1 p-1 bg-white/70 border border-[#C9A24D]/25 rounded-2xl shadow-inner">
              <button
                onClick={() => setSidebarTab('groups')}
                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  sidebarTab === 'groups'
                    ? 'bg-[#7B1E3A] text-white shadow-sm'
                    : 'text-[#2B2022]/70 hover:text-[#7B1E3A]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>المجموعات</span>
                {groups.length > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      sidebarTab === 'groups' ? 'bg-white/20 text-white' : 'bg-[#7B1E3A]/10 text-[#7B1E3A]'
                    }`}
                  >
                    {groups.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setSidebarTab('chats')}
                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  sidebarTab === 'chats'
                    ? 'bg-[#7B1E3A] text-white shadow-sm'
                    : 'text-[#2B2022]/70 hover:text-[#7B1E3A]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>المحادثات</span>
                {conversations.length > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      sidebarTab === 'chats' ? 'bg-white/20 text-white' : 'bg-[#7B1E3A]/10 text-[#7B1E3A]'
                    }`}
                  >
                    {conversations.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setSidebarTab('contacts')}
                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  sidebarTab === 'contacts'
                    ? 'bg-[#7B1E3A] text-white shadow-sm'
                    : 'text-[#2B2022]/70 hover:text-[#7B1E3A]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>الدليل</span>
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="p-3 border-b border-[#C9A24D]/20 bg-white/40">
            <div className="relative">
              <Search className="w-4 h-4 text-[#2B2022]/40 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  sidebarTab === 'groups'
                    ? 'ابحث في الأفواج والمجموعات...'
                    : sidebarTab === 'contacts'
                    ? 'ابحث في قائمة الأساتذة والإدارة...'
                    : 'ابحث في المحادثات النشطة...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#C9A24D]/30 rounded-xl pr-9 pl-8 py-2 text-xs text-[#2B2022] placeholder-[#2B2022]/40 focus:border-[#7B1E3A] focus:outline-none shadow-2xs transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#C9A24D]/15 sidebar-scroll">
            {/* TAB: CHATS */}
            {sidebarTab === 'chats' &&
              (filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-[#2B2022]/50 text-xs">
                  <MessageSquare className="w-8 h-8 text-[#C9A24D]/50 mx-auto mb-2" />
                  <p className="font-bold text-[#7B1E3A] mb-1">لا توجد محادثات نشطة</p>
                  <p className="text-[11px] text-[#2B2022]/60">
                    اختر تبويب "الدليل" لبدء مراسلة جديدة مع الأساتذة أو الإدارة.
                  </p>
                </div>
              ) : (
                filteredConversations.map((chat, idx) => {
                  const isActive = chatMode === 'direct' && activeChatPartner?._id === chat.user?._id;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectPartner(chat.user)}
                      className={`w-full p-3 sm:p-3.5 flex items-center gap-3 text-right transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#F3E9DC] border-r-4 border-[#7B1E3A] shadow-xs'
                          : 'hover:bg-[#F3E9DC]/45'
                      }`}
                    >
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white flex items-center justify-center font-bold text-[#7B1E3A] border border-[#C9A24D]/35 shrink-0 shadow-2xs">
                        {chat.user?.profilePic ? (
                          <img src={chat.user.profilePic} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <span>
                            {chat.user?.firstName?.[0]}
                            {chat.user?.lastName?.[0]}
                          </span>
                        )}
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h4 className="text-xs font-bold truncate text-[#2B2022]">
                            {chat.user?.firstName} {chat.user?.lastName}
                          </h4>
                          <span className="text-[10px] text-[#2B2022]/50 font-mono">
                            {chat.lastUpdated
                              ? new Date(chat.lastUpdated).toLocaleTimeString('ar-DZ', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-[11px] text-[#2B2022]/70 truncate flex-1">
                            {chat.lastMessage || '📎 مرفق'}
                          </p>
                          {chat.lastStatus === 'read' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                          ) : chat.lastStatus === 'delivered' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-[#2B2022]/40 shrink-0" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-[#2B2022]/40 shrink-0" />
                          )}
                        </div>
                      </div>
                      {chat.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-[#7B1E3A] text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-xs">
                          {chat.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              ))}

            {/* TAB: GROUPS */}
            {sidebarTab === 'groups' && (
              <>
                {isPrivileged && (
                  <div className="p-2 sm:p-2.5 border-b border-[#C9A24D]/15 bg-white/40 sticky top-0 z-10">
                    <button
                      type="button"
                      onClick={handleOpenCreateGroup}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#7B1E3A] hover:bg-[#60172D] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة مجموعة / قناة جديدة</span>
                    </button>
                  </div>
                )}

                {filteredGroups.length === 0 ? (
                  <div className="p-8 text-center text-[#2B2022]/50 text-xs">
                    <Layers className="w-8 h-8 text-[#C9A24D]/50 mx-auto mb-2" />
                    <p className="font-bold text-[#7B1E3A] mb-1">لا توجد مجموعات</p>
                    <p className="text-[11px] text-[#2B2022]/60">لا توجد قنوات رسمية مسندة لحسابك حالياً.</p>
                    {isPrivileged && (
                      <button
                        type="button"
                        onClick={handleOpenCreateGroup}
                        className="mt-3 inline-flex items-center gap-1.5 py-1.5 px-3 bg-[#7B1E3A] text-white rounded-lg text-xs font-bold shadow-xs hover:bg-[#60172D] transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إنشاء أول مجموعة</span>
                      </button>
                    )}
                  </div>
                ) : (
                  filteredGroups.map((grp) => {
                    const isActive = chatMode === 'group' && activeGroup?.channelId === grp.channelId;
                    const isTeacher = grp.groupType === 'teachers';
                    const isSupervisor = grp.groupType === 'supervisors';

                    return (
                      <div
                        key={grp.channelId}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectGroup(grp)}
                        className={`group relative w-full p-3 sm:p-3.5 flex items-center gap-3 text-right transition-all cursor-pointer select-none ${
                          isActive
                            ? 'bg-[#F3E9DC] border-r-4 border-[#7B1E3A] shadow-xs'
                            : 'hover:bg-[#F3E9DC]/45'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-white flex items-center justify-center font-bold text-[#7B1E3A] border border-[#C9A24D]/35 shrink-0 shadow-2xs">
                          {isTeacher ? (
                            <GraduationCap className="w-5 h-5 text-[#7B1E3A]" />
                          ) : isSupervisor ? (
                            <ShieldAlert className="w-5 h-5 text-[#C9A24D]" />
                          ) : (
                            <Users className="w-5 h-5 text-emerald-700" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <h4 className="text-xs font-bold truncate text-[#2B2022]">
                              {grp.title}
                            </h4>
                            {grp.lastUpdated && (
                              <span className="text-[10px] text-[#2B2022]/50 font-mono">
                                {new Date(grp.lastUpdated).toLocaleTimeString('ar-DZ', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#2B2022]/70 truncate">
                            {grp.lastMessage || grp.description || 'مجموعة مدرسية رسمية'}
                          </p>
                        </div>
                        {grp.unreadCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-[#7B1E3A] text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-xs">
                            {grp.unreadCount}
                          </span>
                        )}

                        {/* Administration Action Buttons (Edit, Delete) */}
                        {isPrivileged && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditGroup(grp);
                              }}
                              title="تعديل بيانات المجموعة"
                              className="p-1.5 hover:bg-white text-amber-700 hover:text-amber-800 rounded-lg transition-colors cursor-pointer shadow-xs border border-[#C9A24D]/20"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGroup(grp);
                              }}
                              title="حذف المجموعة"
                              className="p-1.5 hover:bg-white text-rose-600 hover:text-rose-700 rounded-lg transition-colors cursor-pointer shadow-xs border border-rose-200"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* TAB: CONTACTS */}
            {sidebarTab === 'contacts' &&
              (filteredContacts.length === 0 ? (
                <div className="p-8 text-center text-[#2B2022]/50 text-xs">
                  <Users className="w-8 h-8 text-[#C9A24D]/50 mx-auto mb-2" />
                  <p className="font-bold text-[#7B1E3A] mb-1">لا توجد نتائج</p>
                  <p className="text-[11px] text-[#2B2022]/60">لم يتم العثور على أي جهة اتصال مطابقة.</p>
                </div>
              ) : (
                filteredContacts.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => handleSelectPartner(c)}
                    className="w-full p-3 sm:p-3.5 flex items-center gap-3 text-right transition-all hover:bg-[#F3E9DC]/45 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white flex items-center justify-center font-bold text-[#7B1E3A] border border-[#C9A24D]/35 shrink-0 shadow-2xs">
                      {c.profilePic ? (
                        <img src={c.profilePic} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <span>
                          {c.firstName?.[0]}
                          {c.lastName?.[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold truncate text-[#2B2022]">
                        {c.firstName} {c.lastName}
                      </h4>
                      <span
                        className={`inline-flex items-center text-[9px] font-semibold px-2 py-0.5 rounded-full border mt-0.5 ${
                          roleBadge[c.role] || roleBadge.student
                        }`}
                      >
                        {roleLabels[c.role] || c.role}
                      </span>
                    </div>
                  </button>
                ))
              ))}
          </div>
        </div>

        {/* ================================================================ */}
        {/* MESSAGING MAIN CHAT WINDOW                                      */}
        {/* ================================================================ */}
        <div
          className={`flex-1 flex flex-col bg-white min-w-0 ${
            !(activeChatPartner || activeGroup) ? 'hidden md:flex' : 'flex'
          }`}
        >
          {(chatMode === 'direct' && activeChatPartner) || (chatMode === 'group' && activeGroup) ? (
            <>
              {/* Chat Room Top Bar */}
              <div className="p-3 sm:px-5 sm:py-3.5 border-b border-[#C9A24D]/30 flex items-center justify-between bg-gradient-to-r from-[#FAF6F0] via-white to-[#FAF6F0] shadow-xs">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Back button for mobile view */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveChatPartner(null);
                      setActiveGroup(null);
                    }}
                    className="md:hidden p-1.5 hover:bg-[#F3E9DC] rounded-xl text-[#2B2022] shrink-0 cursor-pointer transition-colors"
                    title="رجوع للقائمة"
                  >
                    <ArrowRight className="w-5 h-5 text-[#7B1E3A]" />
                  </button>

                  {/* Avatar with Prestige Ring */}
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-white flex items-center justify-center font-bold text-[#7B1E3A] border-2 border-[#C9A24D]/45 shrink-0 shadow-sm">
                    {chatMode === 'direct' ? (
                      activeChatPartner.profilePic ? (
                        <img src={activeChatPartner.profilePic} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <span className="font-serif">
                          {activeChatPartner.firstName?.[0]}
                          {activeChatPartner.lastName?.[0]}
                        </span>
                      )
                    ) : (
                      <Users className="w-5 h-5 text-[#7B1E3A]" />
                    )}
                  </div>

                  {/* Titles with RTL parenthesis isolation */}
                  <div className="min-w-0 flex-1">
                    {chatMode === 'direct' ? (
                      <h3 className="font-serif font-black text-[#7B1E3A] text-sm sm:text-base leading-tight truncate">
                        {activeChatPartner.firstName} {activeChatPartner.lastName}
                      </h3>
                    ) : (
                      renderBilingualTitle(activeGroup.title)
                    )}

                    <div className="flex items-center gap-2 mt-0.5 text-xs text-[#2B2022]/70 flex-wrap">
                      {chatMode === 'direct' ? (
                        <span className="flex items-center gap-1 font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                          <span>{roleLabels[activeChatPartner.role] || activeChatPartner.role}</span>
                          <span className="text-[#2B2022]/40">• متصل عبر المنصة</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-[#2B2022]/60 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A24D] inline-block" />
                          <span>{activeGroup.description || 'غرفة التنسيق بين الإدارة والمراقبين'}</span>
                        </span>
                      )}

                      {chatMode === 'direct' && activeChatPartner.phoneNumber && (
                        <span className="text-[#2B2022]/50 text-[11px] font-mono mr-1" dir="ltr">
                          {activeChatPartner.phoneNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Administrative Conversation Audit Button (Art. 18-19) */}
                {isAdmin && chatMode === 'direct' && (
                  <button
                    onClick={() => setAuditModalOpen(true)}
                    title="تفتيش ومراجعة أمنية رسمية مع التوثيق (المادة 18)"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-300 hover:bg-rose-100 rounded-xl transition-all cursor-pointer shrink-0 mr-2 shadow-xs"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span className="hidden sm:inline">تفتيش إداري معلل</span>
                  </button>
                )}
              </div>

              {/* Message Feed Area */}
              <div
                ref={messageContainerRef}
                className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-3.5 bg-[#FDFBF7] chat-scroll"
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-[#2B2022]/50 text-xs py-12">
                    <div className="w-14 h-14 rounded-2xl bg-[#F3E9DC]/60 flex items-center justify-center border border-[#C9A24D]/35 mb-3 shadow-sm">
                      <MessageSquare className="w-7 h-7 text-[#7B1E3A]" />
                    </div>
                    <p className="font-serif font-black text-[#7B1E3A] text-sm mb-1">
                      المحادثة جديدة ومحمية
                    </p>
                    <p className="text-[11px] text-[#2B2022]/60 max-w-xs text-center">
                      ابدأ التواصل الأكاديمي والتربوي الآن عبر كتابة رسالتك في الشريط أدناه.
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const senderId = msg.sender?._id || msg.sender;
                    const myId = user?.id || user?._id;
                    const isOwnMessage = String(senderId) === String(myId);
                    const showEmojiBar = activeEmojiBarMsgId === msg._id;

                    return (
                      <div
                        key={msg._id || idx}
                        className={`w-full flex ${isOwnMessage ? 'justify-start' : 'justify-end'} group relative my-2`}
                      >
                        <div
                          className={`relative flex flex-col ${
                            isOwnMessage ? 'items-start' : 'items-end'
                          } max-w-[85%] sm:max-w-[75%] md:max-w-[65%]`}
                        >
                          {/* Floating Micro-Action Toolbar (Hover Pill Overlay — Does not squeeze bubble) */}
                          {!msg.isDeleted && (
                            <div
                              className={`absolute -top-3.5 ${
                                isOwnMessage ? 'right-2' : 'left-2'
                              } z-20 opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none group-hover:pointer-events-auto flex items-center gap-0.5 bg-white/95 backdrop-blur-md border border-[#C9A24D]/35 rounded-full px-1.5 py-0.5 shadow-md`}
                            >
                              {/* Reply */}
                              <button
                                type="button"
                                onClick={() => setReplyingTo(msg)}
                                title="رد على الرسالة"
                                className="p-1 hover:bg-[#F3E9DC] text-[#2B2022]/70 hover:text-[#7B1E3A] rounded-full transition-colors cursor-pointer"
                              >
                                <CornerDownLeft className="w-3.5 h-3.5" />
                              </button>

                              {/* Emoji Reaction Trigger */}
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveEmojiBarMsgId(activeEmojiBarMsgId === msg._id ? null : msg._id)
                                }
                                title="تفاعل برمز تعبيري"
                                className="p-1 hover:bg-[#F3E9DC] text-[#2B2022]/70 hover:text-[#7B1E3A] rounded-full transition-colors cursor-pointer"
                              >
                                <Smile className="w-3.5 h-3.5" />
                              </button>

                              {/* Report */}
                              {!isOwnMessage && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReportingMessage(msg);
                                    setReportModalOpen(true);
                                  }}
                                  title="إبلاغ الإدارة عن هذه الرسالة"
                                  className="p-1 hover:bg-rose-50 text-[#2B2022]/70 hover:text-rose-600 rounded-full transition-colors cursor-pointer"
                                >
                                  <Flag className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Administrative Moderation Controls */}
                              {isPrivileged && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => toggleHideMessage(msg._id)}
                                    title={msg.isHidden ? 'إظهار الرسالة' : 'إخفاء الرسالة'}
                                    className="p-1 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-full transition-colors cursor-pointer"
                                  >
                                    <EyeOff className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm('هل أنت متأكد من حذف هذه الرسالة نهائياً؟')) {
                                        deleteMessage(msg._id);
                                      }
                                    }}
                                    title="حذف الرسالة نهائياً"
                                    className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-full transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          )}

                          {/* Message Bubble Card */}
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-xs sm:text-[13px] leading-relaxed transition-all relative break-words shadow-xs ${
                              isOwnMessage
                                ? 'bg-gradient-to-br from-[#7B1E3A] via-[#701A33] to-[#5C1327] text-white rounded-br-xs shadow-md shadow-[#7B1E3A]/15'
                                : 'bg-white border border-[#E8DACB] text-[#2B2022] rounded-bl-xs shadow-2xs'
                            }`}
                          >
                            {/* In group chat, show sender name & role badge */}
                            {chatMode === 'group' && !isOwnMessage && (
                              <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-[#C9A24D]/20">
                                <span className="font-serif font-black text-[#7B1E3A] text-xs">
                                  {msg.sender?.firstName} {msg.sender?.lastName}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 bg-[#F3E9DC] text-[#7B1E3A] font-semibold rounded-full border border-[#C9A24D]/30">
                                  {roleLabels[msg.sender?.role] || msg.sender?.role}
                                </span>
                              </div>
                            )}

                            {/* Quoted Message / Reply Preview */}
                            {msg.replyTo && (
                              <div
                                className={`mb-2 p-2 rounded-xl border text-[11px] leading-snug ${
                                  isOwnMessage
                                    ? 'bg-black/20 border-white/20 text-white/90'
                                    : 'bg-[#F3E9DC]/60 border-[#C9A24D]/35 text-[#2B2022]'
                                }`}
                              >
                                <div className="font-bold flex items-center gap-1 text-[10px] mb-0.5">
                                  <CornerDownLeft className="w-3 h-3 rotate-180 opacity-70" />
                                  <span>
                                    {msg.replyTo.sender?.firstName || 'مستخدم'}
                                  </span>
                                </div>
                                <p className="truncate opacity-80">
                                  {msg.replyTo.content || 'مرفق وسائط'}
                                </p>
                              </div>
                            )}

                            {/* Message Content */}
                            {msg.isDeleted ? (
                              <span className="italic opacity-60 text-xs">
                                تم حذف هذه الرسالة
                              </span>
                            ) : msg.isHidden ? (
                              <span className="italic text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
                                [تم إخفاء الرسالة بواسطة الإدارة]
                              </span>
                            ) : (
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            )}

                            {/* Media Attachment Rendering */}
                            {msg.attachmentUrl && !msg.isDeleted && (
                              <div className="mt-2.5">
                                {msg.mediaType === 'image' || isImageUrl(msg.attachmentUrl) ? (
                                  <a
                                    href={msg.attachmentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block rounded-xl overflow-hidden border border-black/10 max-w-sm group"
                                  >
                                    <img
                                      src={msg.attachmentUrl}
                                      alt="مرفق"
                                      className="w-full max-h-60 object-cover group-hover:scale-102 transition-transform duration-300"
                                    />
                                  </a>
                                ) : msg.mediaType === 'video' || isVideoUrl(msg.attachmentUrl) ? (
                                  <video
                                    src={msg.attachmentUrl}
                                    controls
                                    className="w-full rounded-xl max-h-60 bg-black mt-1"
                                  />
                                ) : msg.mediaType === 'pdf' || (msg.attachmentName && msg.attachmentName.endsWith('.pdf')) ? (
                                  <a
                                    href={msg.attachmentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-3 p-2.5 border rounded-xl text-xs transition-all w-fit ${
                                      isOwnMessage
                                        ? 'bg-black/25 border-white/25 text-white hover:bg-black/35'
                                        : 'bg-[#F3E9DC] border-[#C9A24D]/35 text-[#7B1E3A] hover:bg-[#ebdcc7]'
                                    }`}
                                  >
                                    <FileText className="w-5 h-5 text-rose-500 shrink-0" />
                                    <div className="truncate max-w-[180px]">
                                      <span className="font-bold block truncate">
                                        {msg.attachmentName || 'وثيقة رسمية.pdf'}
                                      </span>
                                      <span className="text-[9px] opacity-75 font-mono">
                                        وثيقة PDF رسمية
                                      </span>
                                    </div>
                                    <Download className="w-3.5 h-3.5 text-[#C9A24D] shrink-0" />
                                  </a>
                                ) : (
                                  <a
                                    href={msg.attachmentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 p-2 border rounded-xl text-xs transition-all w-fit ${
                                      isOwnMessage
                                        ? 'bg-black/25 border-white/25 text-white hover:bg-black/35'
                                        : 'bg-[#F3E9DC] border-[#C9A24D]/35 text-[#7B1E3A] hover:bg-[#ebdcc7]'
                                    }`}
                                  >
                                    <Paperclip className="w-3.5 h-3.5 text-[#C9A24D]" />
                                    <span className="truncate max-w-[180px] font-medium font-mono">
                                      {msg.attachmentName || 'ملف مرفق 📎'}
                                    </span>
                                  </a>
                                )}
                              </div>
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

                            {/* Timestamp & Seen Receipt Indicator */}
                            <div
                              className={`flex items-center justify-between gap-3 mt-1.5 pt-1 text-[10px] ${
                                isOwnMessage ? 'text-white/80' : 'text-[#2B2022]/50'
                              }`}
                            >
                              <span className="font-mono text-[10px]">
                                {new Date(msg.createdAt).toLocaleTimeString('ar-DZ', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>

                              {isOwnMessage && (
                                <div className="flex items-center gap-1">
                                  {msg.seenBy && msg.seenBy.length > 0 ? (
                                    <span
                                      className="text-[#E6C687] flex items-center gap-1 font-bold cursor-help"
                                      title={`شوهد في ${new Date(
                                        msg.seenBy[msg.seenBy.length - 1].seenAt
                                      ).toLocaleTimeString('ar-DZ', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}`}
                                    >
                                      <CheckCheck className="w-3.5 h-3.5" />
                                      <span className="text-[9px]">شوهد</span>
                                    </span>
                                  ) : msg.status === 'delivered' ? (
                                    <span className="text-white/80 flex items-center gap-0.5 text-[10px]">
                                      <CheckCheck className="w-3.5 h-3.5" />
                                    </span>
                                  ) : (
                                    <span className="text-white/60 flex items-center gap-0.5 text-[10px]">
                                      <Check className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Inline Emoji Selector Popup */}
                          {showEmojiBar && (
                            <div className="flex items-center gap-1.5 p-1.5 bg-white border border-[#C9A24D]/40 rounded-2xl shadow-lg mt-1 z-30 animate-in fade-in zoom-in-95">
                              {['👍', '❤️', '😂', '😮', '😢', '🙏', '👏'].map((emoji) => (
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
                {/* Bottom Scroll Anchor so last message is never clipped */}
                <div ref={messagesEndRef} className="h-4" />
              </div>

              {/* Replying Banner */}
              {replyingTo && (
                <div className="px-4 py-2 border-t border-[#C9A24D]/25 bg-[#F3E9DC]/75 flex items-center justify-between text-xs animate-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <CornerDownLeft className="w-4 h-4 text-[#7B1E3A] rotate-180 shrink-0" />
                    <span className="text-[#2B2022] truncate">
                      الرد على{' '}
                      <strong className="text-[#7B1E3A]">
                        {replyingTo.sender?.firstName || 'مستخدم'}
                      </strong>
                      :{' '}
                      {replyingTo.content
                        ? replyingTo.content.substring(0, 50) + '...'
                        : 'مرفق وسائط'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="p-1 text-[#2B2022]/50 hover:text-[#7B1E3A] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Attachment Preview Bar */}
              {selectedFile && (
                <div className="px-4 py-2 border-t border-[#C9A24D]/25 bg-[#F3E9DC]/45 flex items-center gap-3">
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
                        {fileType === 'pdf'
                          ? 'مستند PDF'
                          : fileType === 'video'
                          ? 'فيديو'
                          : fileType === 'image'
                          ? 'صورة'
                          : 'ملف'}
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

              {/* Modern Bottom Input Dock */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 sm:p-4 border-t border-[#C9A24D]/25 bg-white/95 backdrop-blur-md flex items-center gap-2 sm:gap-3"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx"
                  className="hidden"
                />

                {/* Attachment Picker */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="إرفاق ملف، صورة، أو مستند"
                  className="p-2.5 sm:p-3 bg-[#FAF6F0] hover:bg-[#F3E9DC] active:scale-95 border border-[#C9A24D]/35 rounded-2xl text-[#7B1E3A] transition-all shrink-0 cursor-pointer shadow-xs"
                >
                  <Paperclip className="w-5 h-5 text-[#C9A24D] hover:text-[#7B1E3A] transition-colors" />
                </button>

                {/* Message Input with Subtle Inner Glow */}
                <div className="flex-1 flex items-center bg-[#FAF6F0] border border-[#C9A24D]/35 rounded-2xl px-4 py-1 focus-within:border-[#7B1E3A] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#7B1E3A]/10 transition-all shadow-inner">
                  <input
                    type="text"
                    placeholder={
                      chatMode === 'group'
                        ? `اكتب رسالة إلى ${activeGroup?.title || 'المجموعة'}...`
                        : `اكتب رسالتك إلى ${activeChatPartner?.firstName || 'الطرف الآخر'}...`
                    }
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="w-full bg-transparent border-none py-2 text-xs sm:text-sm text-[#2B2022] placeholder-[#2B2022]/40 focus:outline-none"
                  />
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={isUploading || (!messageText.trim() && !selectedFile)}
                  title="إرسال الرسالة"
                  className="p-2.5 sm:p-3 bg-gradient-to-br from-[#7B1E3A] to-[#60142A] hover:from-[#8E2344] hover:to-[#701A33] disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl text-white transition-all shrink-0 shadow-md shadow-[#7B1E3A]/25 active:scale-95 cursor-pointer border border-[#C9A24D]/35 flex items-center justify-center min-w-[44px] min-h-[44px]"
                >
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4.5 h-4.5" />
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[#2B2022]/50 p-6 text-center bg-[#FDFBF7]">
              <div className="w-16 h-16 rounded-3xl bg-[#F3E9DC]/60 flex items-center justify-center border border-[#C9A24D]/35 mb-4 shadow-sm">
                <UserIcon className="w-8 h-8 text-[#7B1E3A]" />
              </div>
              <h4 className="text-[#7B1E3A] text-lg font-serif font-black mb-1">
                منصة المراسلات المدرسية الآمنة
              </h4>
              <p className="text-xs text-[#2B2022]/65 max-w-sm leading-relaxed">
                اختر محادثة مباشرة أو فوجاً مدرسياً من القائمة الجانبية لبدء التواصل الآمن والمحمي.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ================================================================ */}
      {/* MODAL: Administrative Audit Modal (Art. 18-19)                   */}
      {/* ================================================================ */}
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
              <button
                onClick={() => setAuditModalOpen(false)}
                className="text-[#2B2022]/60 hover:text-[#7B1E3A] cursor-pointer"
              >
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

      {/* ================================================================ */}
      {/* MODAL: Message Reporting Modal                                   */}
      {/* ================================================================ */}
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
                <label className="block text-xs font-bold text-[#7B1E3A] mb-1.5 font-sans">
                  سبب البلاغ:
                </label>
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
                <label className="block text-xs font-bold text-[#7B1E3A] mb-1.5 font-sans">
                  تفاصيل إضافية (اختياري):
                </label>
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
      {/* ================================================================ */}
      {/* MODAL: Group Channel Create / Edit (Administration)              */}
      {/* ================================================================ */}
      {groupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-3xl p-6 shadow-2xl text-right"
          >
            <div className="flex items-center justify-between mb-4 border-b border-[#C9A24D]/25 pb-3">
              <div className="flex items-center gap-2 text-[#7B1E3A] font-serif font-black">
                {groupModalMode === 'create' ? (
                  <Plus className="w-5 h-5 text-[#7B1E3A]" />
                ) : (
                  <Edit3 className="w-5 h-5 text-amber-700" />
                )}
                <span className="text-base">
                  {groupModalMode === 'create' ? 'إضافة مجموعة / قناة رسمية جديدة' : 'تعديل بيانات المجموعة'}
                </span>
              </div>
              <button
                onClick={() => setGroupModalOpen(false)}
                className="text-[#2B2022]/60 hover:text-[#7B1E3A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitGroup} className="space-y-4 font-sans">
              <div>
                <label className="block text-xs font-bold text-[#2B2022]/80 mb-1.5">
                  نوع المجموعة / القناة
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'custom', label: 'مجموعة مخصصة' },
                    { id: 'class', label: 'قسم كامل' },
                    { id: 'class_group', label: 'فوج قسم' },
                    { id: 'class_parents', label: 'أولياء قسم' },
                  ].map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => {
                        setGroupFormType(t.id);
                        if (t.id === 'class_parents') setGroupFormAudience(['all']);
                      }}
                      className={`text-xs py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                        groupFormType === t.id
                          ? 'bg-[#7B1E3A] text-white border-[#7B1E3A] shadow-xs'
                          : 'bg-white text-[#2B2022]/70 border-[#C9A24D]/30 hover:bg-[#F3E9DC]/30'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {groupFormType !== 'custom' && (
                <div>
                  <label className="block text-xs font-bold text-[#2B2022]/80 mb-1">
                    القسم المعني *
                  </label>
                  <select
                    value={groupFormClassId}
                    onChange={(e) => handleClassSelect(e.target.value)}
                    required
                    className="w-full py-2.5 px-3.5 bg-white border border-[#C9A24D]/30 focus:border-[#7B1E3A] rounded-xl text-xs text-[#2B2022] outline-none transition-all shadow-inner"
                  >
                    <option value="">-- اختر القسم الدراسي --</option>
                    {availableClasses.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name} {cls.division ? `(${cls.division})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {groupFormType === 'class_group' && (
                <div>
                  <label className="block text-xs font-bold text-[#2B2022]/80 mb-1">
                    الفوج المعني *
                  </label>
                  <select
                    value={groupFormGroupId}
                    onChange={(e) => handleGroupSelect(e.target.value)}
                    required
                    className="w-full py-2.5 px-3.5 bg-white border border-[#C9A24D]/30 focus:border-[#7B1E3A] rounded-xl text-xs text-[#2B2022] outline-none transition-all shadow-inner"
                  >
                    <option value="">-- اختر الفوج الدراسي --</option>
                    {availableClassGroups
                      .filter((g) => !groupFormClassId || String(g.class?._id || g.class) === String(groupFormClassId))
                      .map((grp) => (
                        <option key={grp._id} value={grp._id}>
                          {grp.name} {grp.class?.name ? `(${grp.class.name})` : ''}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#2B2022]/80 mb-1">
                  اسم المجموعة / القناة *
                </label>
                <input
                  type="text"
                  required
                  value={groupFormTitle}
                  onChange={(e) => setGroupFormTitle(e.target.value)}
                  placeholder="مثال: إعلانات الإدارة والأساتذة"
                  className="w-full py-2.5 px-3.5 bg-white border border-[#C9A24D]/30 focus:border-[#7B1E3A] rounded-xl text-xs text-[#2B2022] outline-none transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B2022]/80 mb-1">
                  وصف المجموعة (اختياري)
                </label>
                <textarea
                  rows={3}
                  value={groupFormDesc}
                  onChange={(e) => setGroupFormDesc(e.target.value)}
                  placeholder="اكتب نبذة عن دور هذه المجموعة والمنشورات المسموحة..."
                  className="w-full py-2.5 px-3.5 bg-white border border-[#C9A24D]/30 focus:border-[#7B1E3A] rounded-xl text-xs text-[#2B2022] outline-none transition-all shadow-inner resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B2022]/80 mb-1.5">
                  الجمهور المستهدف
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'all', label: 'الجميع (عام)' },
                    { id: 'teachers', label: 'الأساتذة' },
                    { id: 'students', label: 'الطلاب' },
                    { id: 'parents', label: 'أولياء الأمور' },
                    { id: 'supervisors', label: 'المشرفين والإدارة' },
                  ].map((aud) => {
                    const isSelected = groupFormAudience.includes(aud.id);
                    return (
                      <button
                        type="button"
                        key={aud.id}
                        onClick={() => toggleAudienceTag(aud.id)}
                        className={`text-xs py-1.5 px-3 rounded-full border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#7B1E3A] text-white border-[#7B1E3A] font-bold shadow-xs'
                            : 'bg-white text-[#2B2022]/70 border-[#C9A24D]/30 hover:bg-[#F3E9DC]/30'
                        }`}
                      >
                        {aud.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-[#C9A24D]/25">
                <button
                  type="submit"
                  disabled={!groupFormTitle.trim() || isSubmittingGroup}
                  className="flex-1 py-2.5 px-4 bg-[#7B1E3A] hover:bg-[#60172D] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingGroup
                    ? 'جاري الحفظ...'
                    : groupModalMode === 'create'
                    ? 'إنشاء المجموعة'
                    : 'حفظ التعديلات'}
                </button>
                <button
                  type="button"
                  onClick={() => setGroupModalOpen(false)}
                  className="py-2.5 px-4 bg-white hover:bg-[#F3E9DC]/40 border border-[#C9A24D]/30 text-[#2B2022]/70 rounded-xl text-xs font-bold transition-all cursor-pointer"
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
