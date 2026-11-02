import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import {
  Heart,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
  Globe,
  Users,
  GraduationCap,
  Megaphone,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Film,
  X,
  Pin,
  Lock,
  Unlock,
  Trash2,
  Paperclip,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Clock,
  Plus,
  CornerDownLeft,
  MoreVertical,
  Download,
  Edit3,
  UserX,
} from 'lucide-react';
import axios from 'axios';
import PostViewersAnalyticsModal from './PostViewersAnalyticsModal';
import CreatePostModal from './CreatePostModal';
import EditPostModal from './EditPostModal';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getToken = () => {
  return (
    useAuthStore.getState().accessToken ||
    localStorage.getItem('zitouni_access_token') ||
    localStorage.getItem('token') ||
    ''
  );
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const timeAgo = (date) => {
  if (!date) return '';
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'الآن';
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `منذ ${days} يوم`;
  return new Date(date).toLocaleDateString('ar-DZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatPostTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dateFormatted = d.toLocaleDateString('ar-DZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const ago = timeAgo(dateStr);
  return `${dateFormatted} في تمام ${time} (${ago})`;
};

const formatShortTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const ago = timeAgo(dateStr);
  return `${ago} • ${time}`;
};

const roleLabels = {
  admin: 'مدير النظام',
  school: 'الإدارة العامة',
  teacher: 'أستاذ(ة)',
  student: 'تلميذ(ة)',
  parent: 'ولي أمر',
  general_supervisor: 'مشرف عام',
  pedagogical_supervisor: 'مشرف تربوي',
  receptionist: 'موظف استقبال',
};

const audienceLabels = {
  all: 'كامل المؤسسة',
  admin_only: 'الإدارة العامة فقط',
  teachers: 'الأساتذة فقط',
  parents: 'أولياء الأمور فقط',
  students: 'التلاميذ فقط',
  supervisors: 'المشرفون والمراقبون',
  level: 'طور تعليمي',
  class: 'قسم دراسي محدد',
  group: 'فوج محدد',
};

const roleBadgeStyles = {
  admin: 'bg-[#7B1E3A]/10 text-[#7B1E3A] border-[#7B1E3A]/30',
  school: 'bg-[#7B1E3A]/10 text-[#7B1E3A] border-[#7B1E3A]/30',
  teacher: 'bg-emerald-600/10 text-emerald-800 border-emerald-600/30',
  general_supervisor: 'bg-[#C9A24D]/15 text-[#7B1E3A] border-[#C9A24D]/40',
  pedagogical_supervisor: 'bg-[#C9A24D]/15 text-[#7B1E3A] border-[#C9A24D]/40',
  receptionist: 'bg-cyan-600/10 text-cyan-800 border-cyan-600/30',
  parent: 'bg-blue-600/10 text-blue-800 border-blue-600/30',
  student: 'bg-[#F3E9DC] text-[#2B2022] border-[#C9A24D]/30',
};

function Avatar({ firstName = '', lastName = '', src, size = 'md' }) {
  const initials = `${firstName.charAt(0) || ''}${lastName.charAt(0) || ''}`.trim() || '؟';
  const sizeClasses = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-11 h-11 text-sm';

  return (
    <div
      className={`${sizeClasses} rounded-full bg-[#F3E9DC] border border-[#C9A24D]/40 flex items-center justify-center font-bold text-[#7B1E3A] overflow-hidden shrink-0 shadow-sm`}
    >
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Feed Component                                                */
/* ------------------------------------------------------------------ */

export default function Feed() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Comments state
  const [commentInputs, setCommentInputs] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [activeReplyCommentId, setActiveReplyCommentId] = useState(null);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [selectedPostForAnalytics, setSelectedPostForAnalytics] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPostForEdit, setSelectedPostForEdit] = useState(null);

  // Action menus state: postId -> bool
  const [openMenuId, setOpenMenuId] = useState(null);

  const canPublish = user && ['admin', 'school', 'teacher', 'general_supervisor', 'pedagogical_supervisor'].includes(user.role);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await axios.get(`${API_URL}/posts`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setPosts(res.data || []);
    } catch (err) {
      console.error('Failed to fetch posts', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReact = async (postId, reactionType) => {
    try {
      const token = getToken();
      const res = await axios.post(`${API_URL}/posts/${postId}/react`, { reactionType }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setPosts(prev =>
        prev.map(p => {
          if (p._id === postId) {
            return {
              ...p,
              reactionCounts: res.data.reactionCounts,
              userReaction: res.data.userReaction,
            };
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Error reacting to post', err);
    }
  };

  const handleLike = (postId) => handleReact(postId, 'like');

  const handleToggleHidePost = async (postId) => {
    try {
      const token = getToken();
      const res = await axios.patch(`${API_URL}/posts/${postId}/hide`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setPosts(prev =>
        prev.map(p => (p._id === postId ? { ...p, isHidden: res.data.isHidden } : p))
      );
      setOpenMenuId(null);
    } catch (err) {
      console.error('Error toggling hide post', err);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التعليق نهائياً؟')) return;
    try {
      const token = getToken();
      const res = await axios.delete(`${API_URL}/posts/${postId}/comments/${commentId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setPosts(prev =>
        prev.map(p => (p._id === postId ? { ...p, comments: res.data.comments } : p))
      );
    } catch (err) {
      console.error('Error deleting comment', err);
    }
  };

  const handleToggleHideComment = async (postId, commentId) => {
    try {
      const token = getToken();
      const res = await axios.patch(`${API_URL}/posts/${postId}/comments/${commentId}/hide`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setPosts(prev =>
        prev.map(p => (p._id === postId ? { ...p, comments: res.data.comments } : p))
      );
    } catch (err) {
      console.error('Error toggling hide comment', err);
    }
  };

  const handleBanUserFromComments = async (postId, targetUserId, userName) => {
    if (!window.confirm(`هل أنت متأكد من حظر المستخدم (${userName || ''}) من التعليق على هذا المنشور؟`)) return;
    try {
      const token = getToken();
      const res = await axios.post(`${API_URL}/posts/${postId}/ban-user`, { targetUserId }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      alert(res.data.message || 'تم حظر المستخدم من التعليق على هذا المنشور بنجاح.');
    } catch (err) {
      console.error('Error banning user', err);
      alert(err.response?.data?.message || 'تعذر حظر المستخدم من التعليقات.');
    }
  };

  const handleConfirmRead = async (postId) => {
    try {
      const token = getToken();
      const res = await axios.post(`${API_URL}/posts/${postId}/confirm-read`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setPosts(prev =>
        prev.map(p => {
          if (p._id === postId) {
            return {
              ...p,
              userConfirmed: true,
              confirmationsCount: res.data.confirmationsCount,
            };
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Error confirming read', err);
    }
  };

  const handleAddComment = async (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    try {
      const token = getToken();
      const res = await axios.post(`${API_URL}/posts/${postId}/comment`, { content: text }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setPosts(prev =>
        prev.map(p => {
          if (p._id === postId) {
            return { ...p, comments: res.data.comments };
          }
          return p;
        })
      );
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error('Error adding comment', err);
    }
  };

  const handleAddReply = async (postId, commentId) => {
    const text = replyInputs[commentId];
    if (!text || !text.trim()) return;

    try {
      const token = getToken();
      const res = await axios.post(`${API_URL}/posts/${postId}/comments/${commentId}/reply`, { content: text }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setPosts(prev =>
        prev.map(p => {
          if (p._id === postId) {
            return { ...p, comments: res.data.comments };
          }
          return p;
        })
      );
      setReplyInputs(prev => ({ ...prev, [commentId]: '' }));
      setActiveReplyCommentId(null);
    } catch (err) {
      console.error('Error adding reply', err);
    }
  };

  const handleTogglePin = async (postId) => {
    try {
      const token = getToken();
      const res = await axios.put(`${API_URL}/posts/${postId}/pin`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setPosts(prev =>
        prev.map(p => (p._id === postId ? { ...p, isPinned: res.data.isPinned } : p))
      );
      setOpenMenuId(null);
    } catch (err) {
      console.error('Error toggling pin', err);
    }
  };

  const handleToggleLock = async (postId) => {
    try {
      const token = getToken();
      const res = await axios.put(`${API_URL}/posts/${postId}/lock-comments`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setPosts(prev =>
        prev.map(p => (p._id === postId ? { ...p, commentsLocked: res.data.commentsLocked } : p))
      );
      setOpenMenuId(null);
    } catch (err) {
      console.error('Error toggling comments lock', err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنشور نهائياً من الشبكة المدرسية؟')) return;
    try {
      const token = getToken();
      await axios.delete(`${API_URL}/posts/${postId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setPosts(prev => prev.filter(p => p._id !== postId));
      setOpenMenuId(null);
    } catch (err) {
      console.error('Error deleting post', err);
    }
  };

  const handleOpenAnalytics = (post) => {
    setSelectedPostForAnalytics(post);
    setAnalyticsModalOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" dir="rtl">
      {/* Top Banner and Composer Trigger */}
      <div className="bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-3xl p-6 shadow-sm backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#7B1E3A]/10 border border-[#7B1E3A]/20 flex items-center justify-center text-[#7B1E3A] shadow-sm">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#7B1E3A] font-serif">الشبكة الاجتماعية المدرسية (« مدرسة حبر »)</h2>
              <p className="text-xs text-[#2B2022]/70 font-sans">فضاء داخلي آمن ومغلق للتواصل التربوي والإداري (المواد 10 - 17)</p>
            </div>
          </div>

          {canPublish && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#7B1E3A] hover:bg-[#60162c] text-[#F3E9DC] font-bold rounded-2xl text-sm transition-all shadow-md shadow-[#7B1E3A]/20 cursor-pointer border border-[#C9A24D]/40 font-sans"
            >
              <Plus className="w-5 h-5 text-[#C9A24D]" />
              <span>إنشاء منشور جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Feed List */}
      {loading ? (
        <div className="p-16 text-center text-[#2B2022]/70 space-y-3 bg-[#FDFBF7] border border-[#C9A24D]/25 rounded-3xl">
          <div className="w-8 h-8 mx-auto border-2 border-[#7B1E3A] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-[#7B1E3A] font-sans">جاري تحميل منشورات الشبكة المدرسية...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="p-16 text-center bg-[#FDFBF7] border border-dashed border-[#C9A24D]/40 rounded-3xl shadow-sm">
          <Globe className="w-12 h-12 mx-auto text-[#C9A24D] mb-3 opacity-60" />
          <p className="text-base font-bold text-[#7B1E3A] font-serif">لا توجد منشورات متاحة حالياً.</p>
          <p className="text-xs text-[#2B2022]/70 mt-1 font-sans">ستظهر المنشورات والإعلانات الرسمية الموجهة إليك هنا فور نشرها.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => {
            const reactionCounts = post.reactionCounts || {
              like: post.likes?.length || 0,
              love: 0,
              dislike: 0,
              total: post.likes?.length || 0,
            };
            const likeCount = reactionCounts.like || 0;
            const loveCount = reactionCounts.love || 0;
            const dislikeCount = reactionCounts.dislike || 0;
            const isLiked = post.userReaction === 'like' || (!post.userReaction && post.likes?.includes(user?.id));
            const isLoved = post.userReaction === 'love';
            const isDisliked = post.userReaction === 'dislike';
            const commentCount = post.comments?.length || 0;
            const commentsOpen = openComments[post._id];
            const isOwner = post.publisher?._id === user?.id;
            const isPrivileged = ['admin', 'school', 'general_supervisor', 'pedagogical_supervisor'].includes(user?.role);
            const canModerate = isOwner || isPrivileged;

            return (
              <motion.article
                key={post._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-3xl border shadow-sm overflow-hidden transition-all bg-[#FDFBF7] ${
                  post.isPinned
                    ? 'border-[#C9A24D] shadow-[#C9A24D]/15 ring-1 ring-[#C9A24D]/40'
                    : post.isImportant
                    ? 'border-[#7B1E3A]/45 shadow-[#7B1E3A]/10'
                    : 'border-[#C9A24D]/25 hover:border-[#C9A24D]/50'
                }`}
              >
                {/* Pinned Post Badge */}
                {post.isPinned && (
                  <div className="bg-[#C9A24D]/15 border-b border-[#C9A24D]/30 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-2 text-xs text-[#7B1E3A] font-bold">
                    <span className="flex items-center gap-1.5 font-sans">
                      <Pin className="w-3.5 h-3.5 text-[#C9A24D] rotate-45 shrink-0" />
                      <span>منشور مثبت في أعلى الصفحة</span>
                    </span>
                    <span className="text-[10px] text-[#7B1E3A] font-bold bg-[#7B1E3A]/10 border border-[#7B1E3A]/20 px-2.5 py-0.5 rounded-full font-sans shrink-0">
                      إعلان رئيسي
                    </span>
                  </div>
                )}

                {/* Post Hidden Badge for Admins & Author */}
                {post.isHidden && (
                  <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 sm:px-6 py-2 flex items-center justify-between gap-2 text-xs text-amber-900 font-bold">
                    <span className="flex items-center gap-2 font-sans">
                      <EyeOff className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>هذا المنشور مخفي حالياً عن المستخدمين (مرئي فقط للإدارة وصاحب المنشور).</span>
                    </span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full shrink-0">مخفي</span>
                  </div>
                )}

                {/* Important Announcement Notification Bar (Art. 16) */}
                {post.isImportant && (
                  <div className="bg-[#7B1E3A]/10 border-b border-[#7B1E3A]/25 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-2 text-[#7B1E3A] font-bold font-sans">
                      <AlertTriangle className="w-4 h-4 text-[#7B1E3A] shrink-0" />
                      <span>إعلان رسمي هام يتطلب تأكيد الاطلاع بموجب المادة 16</span>
                    </span>

                    {/* Interactive "اطلعت على الإعلان" button */}
                    {post.userConfirmed ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600/15 text-emerald-800 border border-emerald-600/30 rounded-xl text-xs font-bold font-sans">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>تم تأكيد الاطلاع</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleConfirmRead(post._id)}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-[#7B1E3A] hover:bg-[#60162c] text-[#F3E9DC] font-bold rounded-xl text-xs transition-all shadow-sm shadow-[#7B1E3A]/20 cursor-pointer border border-[#C9A24D]/40 font-sans"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A24D]" />
                        <span>اطلعت على هذا الإعلان</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Post Header */}
                <div className="p-4 sm:p-6 pb-3 sm:pb-4 flex items-start justify-between gap-2.5 sm:gap-4 relative">
                  <div className="flex items-start gap-2.5 sm:gap-3.5 flex-1 min-w-0">
                    <div className="shrink-0 mt-0.5">
                      <Avatar
                        firstName={post.publisher?.firstName}
                        lastName={post.publisher?.lastName}
                        src={post.publisher?.profilePic}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <h4 className="font-bold text-[#7B1E3A] text-sm font-serif truncate max-w-[190px] sm:max-w-none">
                          {post.publisher?.firstName} {post.publisher?.lastName}
                        </h4>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 sm:px-2.5 py-0.5 rounded-full border font-sans shrink-0 ${
                            roleBadgeStyles[post.publisherRole] || roleBadgeStyles.student
                          }`}
                        >
                          {roleLabels[post.publisherRole] || post.publisherRole}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2 mt-1 text-[11px] sm:text-xs text-[#2B2022]/70 font-sans flex-wrap">
                        <span className="inline-flex items-center gap-1 font-medium bg-white/80 px-2 py-0.5 rounded-md border border-[#C9A24D]/25 max-w-full">
                          <Clock className="w-3.5 h-3.5 text-[#C9A24D] shrink-0" />
                          <span className="truncate">{formatPostTime(post.createdAt)}</span>
                        </span>
                        <span className="text-[#C9A24D]/60 hidden xs:inline">•</span>
                        {/* Target Audience Chip */}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F3E9DC] rounded-md text-[10px] text-[#7B1E3A] font-bold border border-[#C9A24D]/30 shrink-0">
                          <Users className="w-2.5 h-2.5 text-[#C9A24D] shrink-0" />
                          <span>{audienceLabels[post.targetAudience] || 'مستهدف'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Dropdown Menu - Optimized for Phone & Desktop */}
                  {canModerate && (
                    <div className="relative shrink-0 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === post._id ? null : post._id);
                        }}
                        aria-label="خيارات وتعديل المنشور"
                        title="خيارات وتعديل المنشور"
                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer border ${
                          openMenuId === post._id
                            ? 'bg-[#7B1E3A] text-[#F3E9DC] border-[#7B1E3A] shadow-md shadow-[#7B1E3A]/20'
                            : 'bg-[#F3E9DC]/70 hover:bg-[#F3E9DC] text-[#7B1E3A] hover:text-[#60162c] border-[#C9A24D]/35 hover:border-[#C9A24D]/60 shadow-xs'
                        } active:scale-95`}
                      >
                        <MoreVertical className="w-4 h-4 stroke-[2.2]" />
                      </button>

                      {openMenuId === post._id && (
                        <>
                          {/* Dismiss Backdrop for Touch/Click */}
                          <div
                            className="fixed inset-0 z-30 bg-black/5 sm:bg-transparent"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                            }}
                          />

                          {/* Dropdown Box */}
                          <div className="absolute left-0 rtl:left-0 rtl:right-auto mt-1.5 w-56 max-w-[calc(100vw-2.5rem)] bg-[#FDFBF7] border border-[#C9A24D]/40 rounded-2xl shadow-2xl p-1.5 z-40 space-y-1 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
                            <button
                              onClick={() => {
                                setSelectedPostForEdit(post);
                                setEditModalOpen(true);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-right text-xs font-bold text-[#7B1E3A] hover:bg-[#F3E9DC] rounded-xl transition-colors cursor-pointer font-sans"
                            >
                              <Edit3 className="w-4 h-4 text-[#C9A24D] shrink-0" />
                              <span>تعديل المنشور</span>
                            </button>
                            <button
                              onClick={() => {
                                handleToggleHidePost(post._id);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-right text-xs font-medium text-[#2B2022] hover:text-[#7B1E3A] hover:bg-[#F3E9DC] rounded-xl transition-colors cursor-pointer font-sans"
                            >
                              <EyeOff className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>{post.isHidden ? 'إلغاء الإخفاء (إظهار للجميع)' : 'إخفاء المنشور عن المستخدمين'}</span>
                            </button>
                            <button
                              onClick={() => {
                                handleTogglePin(post._id);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-right text-xs font-medium text-[#2B2022] hover:text-[#7B1E3A] hover:bg-[#F3E9DC] rounded-xl transition-colors cursor-pointer font-sans"
                            >
                              <Pin className="w-4 h-4 text-[#C9A24D] shrink-0" />
                              <span>{post.isPinned ? 'إلغاء التثبيت' : 'تثبيت في المقدمة'}</span>
                            </button>
                            <button
                              onClick={() => {
                                handleToggleLock(post._id);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-right text-xs font-medium text-[#2B2022] hover:text-[#7B1E3A] hover:bg-[#F3E9DC] rounded-xl transition-colors cursor-pointer font-sans"
                            >
                              {post.commentsLocked ? <Unlock className="w-4 h-4 text-emerald-600 shrink-0" /> : <Lock className="w-4 h-4 text-rose-600 shrink-0" />}
                              <span>{post.commentsLocked ? 'فتح التعليقات' : 'إغلاق وحظر التعليقات'}</span>
                            </button>

                            <div className="h-px bg-[#C9A24D]/20 my-1" />

                            <button
                              onClick={() => {
                                handleDeletePost(post._id);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-right text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer font-sans"
                            >
                              <Trash2 className="w-4 h-4 shrink-0" />
                              <span>حذف المنشور نهائياً</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Post Content */}
                <div className="px-4 sm:px-6 pb-4 space-y-3">
                  <h3 className="font-bold text-lg text-[#7B1E3A] font-serif leading-snug">{post.title}</h3>
                  <p className="text-sm text-[#2B2022] font-sans leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>

                  {/* Multi-Attachments Grid (Art. 11) */}
                  {post.attachments && post.attachments.length > 0 && (
                    <div className="pt-2 space-y-3">
                      {/* Image gallery */}
                      {post.attachments.filter(a => a.fileType === 'image').length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-2xl overflow-hidden">
                          {post.attachments.filter(a => a.fileType === 'image').map((img, i) => (
                            <img
                              key={i}
                              src={img.url}
                              alt=""
                              onClick={() => window.open(img.url, '_blank')}
                              className="w-full max-h-72 object-cover bg-black/5 rounded-xl border border-[#C9A24D]/25 cursor-pointer hover:opacity-90 transition-opacity"
                            />
                          ))}
                        </div>
                      )}

                      {/* Videos */}
                      {post.attachments.filter(a => a.fileType === 'video').map((vid, i) => (
                        <video
                          key={i}
                          src={vid.url}
                          controls
                          className="w-full max-h-80 bg-black rounded-2xl border border-[#C9A24D]/25"
                        />
                      ))}

                      {/* Documents / PDFs */}
                      {post.attachments.filter(a => ['pdf', 'document', 'file'].includes(a.fileType)).map((doc, i) => (
                        <a
                          key={i}
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-3.5 bg-[#F3E9DC]/60 hover:bg-[#F3E9DC] border border-[#C9A24D]/35 rounded-2xl transition-all group shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#7B1E3A]/10 border border-[#7B1E3A]/25 flex items-center justify-center text-[#7B1E3A] group-hover:scale-105 transition-transform">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#7B1E3A] group-hover:text-[#60162c] transition-colors font-sans">
                                {doc.name || 'مستند مرفق'}
                              </p>
                              <p className="text-[10px] text-[#2B2022]/60 uppercase font-sans">{doc.fileType}</p>
                            </div>
                          </div>
                          <Download className="w-4 h-4 text-[#C9A24D] group-hover:text-[#7B1E3A] transition-colors" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Backward-compatible single attachment */}
                  {!post.attachments?.length && post.attachmentUrl && (
                    <div className="rounded-2xl overflow-hidden border border-[#C9A24D]/25">
                      {post.mediaType === 'video' ? (
                        <video src={post.attachmentUrl} controls className="w-full max-h-80 bg-black" />
                      ) : (
                        <img
                          src={post.attachmentUrl}
                          alt=""
                          onClick={() => window.open(post.attachmentUrl, '_blank')}
                          className="w-full max-h-80 object-cover bg-black cursor-pointer"
                        />
                      )}
                    </div>
                  )}

                  {/* Pedagogical Links */}
                  {post.pedagogicalLinks && post.pedagogicalLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {post.pedagogicalLinks.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F3E9DC] hover:bg-[#ebdcc8] border border-[#C9A24D]/35 rounded-xl text-xs text-[#7B1E3A] transition-colors font-medium font-sans"
                        >
                          <ExternalLink className="w-3 h-3 text-[#C9A24D]" />
                          <span>{link.title || link.url}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stats & Analytics Row */}
                <div className="px-4 sm:px-6 py-2.5 border-t border-[#C9A24D]/20 flex items-center justify-between text-xs text-[#2B2022]/70 font-sans gap-2 flex-wrap">
                  <div className="flex items-center gap-3">
                    {(likeCount > 0 || loveCount > 0 || dislikeCount > 0) && (
                      <div className="flex items-center gap-2.5 bg-[#F3E9DC]/60 px-3 py-1 rounded-xl border border-[#C9A24D]/20">
                        {likeCount > 0 && (
                          <span className="flex items-center gap-1 font-bold text-blue-700">
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>{likeCount}</span>
                          </span>
                        )}
                        {loveCount > 0 && (
                          <span className="flex items-center gap-1 font-bold text-rose-600">
                            <Heart className="w-3.5 h-3.5 fill-current" />
                            <span>{loveCount}</span>
                          </span>
                        )}
                        {dislikeCount > 0 && (
                          <span className="flex items-center gap-1 font-bold text-slate-700">
                            <ThumbsDown className="w-3.5 h-3.5" />
                            <span>{dislikeCount}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {commentCount > 0 && (
                      <button
                        onClick={() => setOpenComments(prev => ({ ...prev, [post._id]: !prev[post._id] }))}
                        className="hover:text-[#7B1E3A] transition-colors cursor-pointer font-bold"
                      >
                        <span className="text-[#7B1E3A]">{commentCount}</span> تعليقات
                      </button>
                    )}
                  </div>

                  {/* "من شاهد المنشور؟" Button (Art. 15) */}
                  {post.canViewAnalytics && (
                    <button
                      onClick={() => handleOpenAnalytics(post)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-[#F3E9DC] hover:bg-[#ebdcc8] border border-[#C9A24D]/35 rounded-xl text-xs font-bold text-[#7B1E3A] transition-all cursor-pointer shadow-xs font-sans"
                      title="عرض إحصائيات المشاهدة والاطلاع"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#C9A24D]" />
                      <span>من شاهد المنشور؟ ({post.viewsCount || 0})</span>
                    </button>
                  )}
                </div>

                {/* Interaction Action Bar (3 Reactions + Comments) */}
                <div className="px-3 py-2 border-t border-[#C9A24D]/20 grid grid-cols-4 gap-1.5 bg-[#FDFBF7]">
                  {/* 1. J'aime (Like) */}
                  <button
                    onClick={() => handleReact(post._id, 'like')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans ${
                      isLiked
                        ? 'text-blue-700 bg-blue-50 border border-blue-200'
                        : 'text-[#2B2022]/70 hover:text-blue-700 hover:bg-[#F3E9DC]'
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    <span>أعجبني</span>
                    {likeCount > 0 && <span className="text-[10px] opacity-80">({likeCount})</span>}
                  </button>

                  {/* 2. J'adore (Love) */}
                  <button
                    onClick={() => handleReact(post._id, 'love')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans ${
                      isLoved
                        ? 'text-rose-600 bg-rose-50 border border-rose-200'
                        : 'text-[#2B2022]/70 hover:text-rose-600 hover:bg-[#F3E9DC]'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLoved ? 'fill-current' : ''}`} />
                    <span>أحببته</span>
                    {loveCount > 0 && <span className="text-[10px] opacity-80">({loveCount})</span>}
                  </button>

                  {/* 3. Je n'aime pas (Dislike) */}
                  <button
                    onClick={() => handleReact(post._id, 'dislike')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans ${
                      isDisliked
                        ? 'text-slate-900 bg-slate-200 border border-slate-300'
                        : 'text-[#2B2022]/70 hover:text-slate-900 hover:bg-[#F3E9DC]'
                    }`}
                  >
                    <ThumbsDown className={`w-4 h-4 ${isDisliked ? 'fill-current' : ''}`} />
                    <span>لم يعجبني</span>
                    {dislikeCount > 0 && <span className="text-[10px] opacity-80">({dislikeCount})</span>}
                  </button>

                  {/* 4. Comments Toggle */}
                  <button
                    onClick={() => setOpenComments(prev => ({ ...prev, [post._id]: !prev[post._id] }))}
                    className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold text-[#2B2022]/70 hover:text-[#7B1E3A] hover:bg-[#F3E9DC] transition-all cursor-pointer font-sans"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>التعليقات</span>
                    {commentCount > 0 && <span className="text-[10px] opacity-80">({commentCount})</span>}
                  </button>
                </div>

                {/* Threaded Comments Section (Art. 14) */}
                {commentsOpen && (
                  <div className="p-4 sm:p-6 border-t border-[#C9A24D]/25 bg-[#F3E9DC]/30 space-y-4">
                    {/* Comments Locked Notice */}
                    {post.commentsLocked && (
                      <div className="flex items-center gap-2 p-3 bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl text-xs text-[#2B2022]/80 font-bold font-sans">
                        <Lock className="w-3.5 h-3.5 text-[#C9A24D]" />
                        <span>التعليقات مغلقة على هذا المنشور من طرف الإدارة.</span>
                      </div>
                    )}

                    {/* Banned User Notice */}
                    {post.isUserBannedFromComments && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-rose-800 font-bold font-sans">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>لقد تم حظرك من التعليق على هذا المنشور بموجب تدابير إدارة المنصة.</span>
                      </div>
                    )}

                    {/* New Comment Input */}
                    {!post.commentsLocked && !post.isUserBannedFromComments && (
                      <div className="flex items-center gap-2">
                        <Avatar firstName={user?.firstName} lastName={user?.lastName} src={user?.profilePic} size="sm" />
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="اكتب تعليقاً..."
                            value={commentInputs[post._id] || ''}
                            onChange={e => setCommentInputs({ ...commentInputs, [post._id]: e.target.value })}
                            onKeyDown={e => e.key === 'Enter' && handleAddComment(post._id)}
                            className="w-full bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl pl-10 pr-4 py-2 text-xs text-[#2B2022] placeholder-[#2B2022]/50 focus:outline-none focus:border-[#7B1E3A] font-sans"
                          />
                          <button
                            onClick={() => handleAddComment(post._id)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 text-[#7B1E3A] hover:text-[#60162c] transition-colors cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Comments List */}
                    <div className="space-y-3 pt-2">
                      {post.comments && post.comments.map(c => (
                        <div key={c._id} className="space-y-2">
                          <div className={`flex items-start gap-3 bg-[#FDFBF7] border ${c.isHidden ? 'border-amber-300 bg-amber-50/40' : 'border-[#C9A24D]/25'} p-3 rounded-2xl shadow-xs`}>
                            <Avatar firstName={c.userName} size="sm" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[#7B1E3A] text-xs font-serif">{c.userName}</span>
                                  {c.isHidden && (
                                    <span className="px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-900 text-[9px] font-bold">
                                      مخفي
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-[#2B2022]/70 font-sans inline-flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5 text-[#C9A24D]" />
                                    <span>{formatShortTime(c.createdAt)}</span>
                                  </span>
                                  
                                  {/* Comment Moderation Actions */}
                                  {canModerate && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleToggleHideComment(post._id, c._id)}
                                        className="p-1 text-slate-400 hover:text-amber-700 rounded-md hover:bg-slate-100 transition-colors"
                                        title={c.isHidden ? "إلغاء إخفاء التعليق" : "إخفاء التعليق"}
                                      >
                                        <EyeOff className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteComment(post._id, c._id)}
                                        className="p-1 text-slate-400 hover:text-rose-700 rounded-md hover:bg-slate-100 transition-colors"
                                        title="حذف التعليق"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                      {['admin', 'school', 'general_supervisor'].includes(user?.role) && (
                                        <button
                                          onClick={() => handleBanUserFromComments(post._id, c.user?._id || c.user, c.userName)}
                                          className="p-1 text-slate-400 hover:text-rose-900 rounded-md hover:bg-slate-100 transition-colors"
                                          title="حظر المستخدم من التعليق على المنشور"
                                        >
                                          <UserX className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-[#2B2022] mt-1 leading-relaxed font-sans">{c.content}</p>

                              {/* Reply button */}
                              {!post.commentsLocked && !post.isUserBannedFromComments && (
                                <button
                                  onClick={() => setActiveReplyCommentId(activeReplyCommentId === c._id ? null : c._id)}
                                  className="text-[11px] text-[#7B1E3A] hover:text-[#60162c] font-bold mt-1.5 flex items-center gap-1 cursor-pointer font-sans"
                                >
                                  <CornerDownLeft className="w-3 h-3 text-[#C9A24D]" />
                                  <span>رد</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Nested Replies (Art. 14: الرد على الردود) */}
                          {c.replies && c.replies.length > 0 && (
                            <div className="mr-8 space-y-2 border-r-2 border-[#C9A24D]/35 pr-3">
                              {c.replies.map(r => (
                                <div key={r._id} className="bg-[#FDFBF7] p-2.5 rounded-xl border border-[#C9A24D]/20 shadow-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-[#7B1E3A] text-[11px] font-serif">{r.userName}</span>
                                    <span className="text-[9px] text-[#2B2022]/70 font-sans inline-flex items-center gap-1">
                                      <Clock className="w-2 h-2 text-[#C9A24D]" />
                                      <span>{formatShortTime(r.createdAt)}</span>
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#2B2022] mt-0.5 font-sans">{r.content}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Inline Reply Input */}
                          {activeReplyCommentId === c._id && !post.commentsLocked && !post.isUserBannedFromComments && (
                            <div className="mr-8 flex items-center gap-2">
                              <input
                                type="text"
                                placeholder={`رد على ${c.userName}...`}
                                value={replyInputs[c._id] || ''}
                                onChange={e => setReplyInputs({ ...replyInputs, [c._id]: e.target.value })}
                                onKeyDown={e => e.key === 'Enter' && handleAddReply(post._id, c._id)}
                                className="flex-1 bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl px-3 py-1.5 text-xs text-[#2B2022] focus:outline-none focus:border-[#7B1E3A] font-sans"
                              />
                              <button
                                onClick={() => handleAddReply(post._id, c._id)}
                                className="px-3 py-1.5 bg-[#7B1E3A] hover:bg-[#60162c] text-[#F3E9DC] font-bold rounded-xl text-xs transition-colors cursor-pointer font-sans"
                              >
                                إرسال
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.article>
            );
          })}
        </div>
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onPostCreated={newPost => {
          setPosts(prev => [newPost, ...prev]);
        }}
      />

      {/* Edit Post Modal */}
      <EditPostModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedPostForEdit(null);
        }}
        post={selectedPostForEdit}
        onPostUpdated={updatedPost => {
          setPosts(prev =>
            prev.map(p => (p._id === updatedPost._id ? { ...p, ...updatedPost } : p))
          );
        }}
      />

      {/* Who Viewed Post Analytics Modal (Art. 15) */}
      <PostViewersAnalyticsModal
        isOpen={analyticsModalOpen}
        onClose={() => setAnalyticsModalOpen(false)}
        postId={selectedPostForAnalytics?._id}
        postTitle={selectedPostForAnalytics?.title}
      />
    </div>
  );
}
