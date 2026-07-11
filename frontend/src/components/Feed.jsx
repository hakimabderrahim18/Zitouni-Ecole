import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import {
  Heart,
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
  Image as ImageIcon,
  Film,
  X,
} from 'lucide-react';
import axios from 'axios';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

// Arabic relative time ("منذ 5 دقائق")
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
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Deterministic gradient avatar based on a name
const avatarGradient = (seed = '') => {
  const palettes = [
    'from-amber-500 to-orange-600',
    'from-sky-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-fuchsia-500 to-purple-600',
    'from-rose-500 to-pink-600',
    'from-cyan-500 to-blue-600',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return palettes[Math.abs(hash) % palettes.length];
};

const roleLabels = {
  admin: 'الإدارة',
  school: 'المدرسة',
  teacher: 'أستاذ',
  general_supervisor: 'مراقب عام',
  pedagogical_supervisor: 'مراقب تربوي',
  receptionist: 'موظف الاستقبال',
  student: 'طالب',
  parent: 'ولي أمر',
};

const roleBadgeStyles = {
  admin: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  school: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  teacher: 'bg-brand-500/10 text-brand-300 border-brand-500/25',
  general_supervisor: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  pedagogical_supervisor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25',
  receptionist: 'bg-teal-500/10 text-teal-300 border-teal-500/25',
  student: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  parent: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
};

function Avatar({ firstName = '', lastName = '', src, size = 'md' }) {
  const sizes = {
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-11 h-11 text-sm',
    lg: 'w-12 h-12 text-base',
  };
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '؟';
  if (src) {
    return (
      <img
        src={src}
        alt={`${firstName} ${lastName}`}
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-luxury-border shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${sizes[size]} rounded-full shrink-0 flex items-center justify-center font-bold text-white bg-gradient-to-br ${avatarGradient(
        firstName + lastName
      )} ring-2 ring-white/10 shadow-inner`}
    >
      {initials}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton loader                                                    */
/* ------------------------------------------------------------------ */

function PostSkeleton() {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-luxury-border space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-slate-800/60" />
        <div className="space-y-2">
          <div className="h-3 w-32 bg-slate-800/60 rounded-full" />
          <div className="h-2.5 w-20 bg-slate-800/40 rounded-full" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-3/4 bg-slate-800/60 rounded-full" />
        <div className="h-3 w-full bg-slate-800/40 rounded-full" />
        <div className="h-3 w-5/6 bg-slate-800/40 rounded-full" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function Feed() {
  const { user, profile } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [commentInputs, setCommentInputs] = useState({}); // postId -> text
  const [openComments, setOpenComments] = useState({}); // postId -> bool
  const [openViewers, setOpenViewers] = useState({}); // postId -> bool
  const [loading, setLoading] = useState(true);

  // Post Announcement States
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [isGlobal, setIsGlobal] = useState(true);
  const [targetClass, setTargetClass] = useState('');
  const [targetGroup, setTargetGroup] = useState('');
  const [allClasses, setAllClasses] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [formError, setFormError] = useState('');
  const [composerOpen, setComposerOpen] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaKind, setMediaKind] = useState(''); // 'image' | 'video'
  const mediaInputRef = React.useRef(null);

  const canPublish = user && ['admin', 'school', 'teacher'].includes(user.role);

  useEffect(() => {
    fetchPosts();
    if (user && ['admin', 'school'].includes(user.role)) {
      fetchClassesAndGroups();
    } else if (user && user.role === 'teacher') {
      setIsGlobal(false);
      if (profile?.classes?.length > 0) {
        setTargetClass(profile.classes[0]._id);
        const defaultGroup = profile.groups?.find(g => g.class === profile.classes[0]._id || g.class?._id === profile.classes[0]._id)?._id || '';
        setTargetGroup(defaultGroup);
      }
    }
  }, [user, profile]);

  const fetchClassesAndGroups = async () => {
    try {
      const [classRes, groupRes] = await Promise.all([
        axios.get('/api/admin/classes'),
        axios.get('/api/admin/groups'),
      ]);
      setAllClasses(classRes.data);
      setAllGroups(groupRes.data);
      if (classRes.data.length > 0) {
        setTargetClass(classRes.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch classes/groups', err);
    }
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setFormError('حجم الملف كبير جداً (الحد الأقصى 50 ميغابايت).');
      return;
    }
    const kind = file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : '';
    if (!kind) {
      setFormError('يُسمح فقط بالصور أو الفيديو.');
      return;
    }
    setMediaFile(file);
    setMediaKind(kind);
    setMediaPreview(URL.createObjectURL(file));
    setFormError('');
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaKind('');
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  const handlePublishAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      setFormError('العنوان والمحتوى مطلوبان.');
      return;
    }

    setPublishing(true);
    setFormError('');

    try {
      let attachmentUrl = '';
      let mediaType = '';

      // Upload the media file first (if any)
      if (mediaFile) {
        const formData = new FormData();
        formData.append('file', mediaFile);
        const uploadRes = await axios.post('/api/posts/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        attachmentUrl = uploadRes.data.url;
        mediaType = uploadRes.data.mediaType;
      }

      const payload = {
        title: announcementTitle,
        content: announcementContent,
        isGlobal: user.role === 'teacher' ? false : isGlobal,
        targetClass: (user.role === 'teacher' || !isGlobal) ? targetClass : null,
        targetGroup: (user.role === 'teacher' || !isGlobal) ? targetGroup : null,
        attachmentUrl,
        mediaType,
      };

      const res = await axios.post('/api/posts', payload);

      // Prepend the new post directly in feed state
      setPosts(prev => [res.data.post, ...prev]);

      // Reset form
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setComposerOpen(false);
      clearMedia();
      if (user.role === 'teacher') {
        if (profile?.classes?.length > 0) {
          setTargetClass(profile.classes[0]._id);
          const defaultGroup = profile.groups?.find(g => g.class === profile.classes[0]._id || g.class?._id === profile.classes[0]._id)?._id || '';
          setTargetGroup(defaultGroup);
        }
      } else {
        setIsGlobal(true);
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Erreur lors de la publication.');
    } finally {
      setPublishing(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await axios.get('/api/posts');
      setPosts(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await axios.post(`/api/posts/${postId}/like`);
      // Update locally
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? { ...post, likes: res.data.likes }
            : post
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault();
    const commentText = commentInputs[postId];
    if (!commentText || !commentText.trim()) return;

    try {
      const res = await axios.post(`/api/posts/${postId}/comment`, { content: commentText });
      
      // Update locally
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? { ...post, comments: res.data.comments }
            : post
        )
      );
      
      // Clear input
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentChange = (postId, value) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: value }));
  };

  const toggleComments = (postId) => {
    setOpenComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const toggleViewers = (postId) => {
    setOpenViewers((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const myInitials = useMemo(
    () => ({
      first: profile?.firstName || user?.firstName,
      last: profile?.lastName || user?.lastName,
    }),
    [profile, user]
  );

  /* ----------------------------- Render ---------------------------- */

  return (
    <div className="space-y-5" dir="rtl">
      {/* Section heading */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-700/10 border border-brand-500/20 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">فضاء الأخبار والإعلانات</h3>
            <p className="text-[11px] text-slate-450">آخر المستجدات والإعلانات الأكاديمية</p>
          </div>
        </div>
        <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-450 bg-slate-900/40 border border-luxury-border px-3 py-1.5 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          {posts.length} منشور
        </span>
      </div>

      {/* ---------------------- Composer ---------------------- */}
      {canPublish && (
        <div className="glass-panel rounded-2xl border border-luxury-border shadow-lg overflow-hidden">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <Avatar
                firstName={myInitials.first}
                lastName={myInitials.last}
                src={profile?.profilePic}
              />
              <button
                onClick={() => setComposerOpen((v) => !v)}
                className="flex-1 text-right bg-slate-900/60 hover:bg-slate-900 border border-luxury-border rounded-full px-5 py-2.5 text-sm text-slate-450 transition-colors"
              >
                شارك إعلاناً أو خبراً جديداً...
              </button>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {composerOpen && (
              <motion.form
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                onSubmit={handlePublishAnnouncement}
                className="overflow-hidden border-t border-luxury-border/50"
              >
                <div className="p-4 space-y-3">
                  {formError && (
                    <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-xl text-xs text-red-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      {formError}
                    </div>
                  )}

                  <input
                    type="text"
                    required
                    placeholder="عنوان الإعلان"
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm font-semibold text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none transition-colors"
                  />
                  <textarea
                    required
                    placeholder="اكتب محتوى الإعلان هنا..."
                    value={announcementContent}
                    onChange={(e) => setAnnouncementContent(e.target.value)}
                    className="w-full h-28 bg-slate-900 border border-luxury-border rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none transition-colors resize-none"
                  />

                  {/* Audience selector */}
                  <div className="bg-slate-900/40 border border-luxury-border rounded-xl p-3 space-y-3">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-350">
                      <Users className="w-3.5 h-3.5 text-brand-400" />
                      <span>الجمهور المستهدف</span>
                    </div>

                    {user.role !== 'teacher' && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsGlobal(true)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium border transition-colors ${
                            isGlobal
                              ? 'bg-brand-500/15 border-brand-500/40 text-brand-300'
                              : 'bg-slate-900 border-luxury-border text-slate-450 hover:text-white'
                          }`}
                        >
                          <Globe className="w-3.5 h-3.5" /> الجميع
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsGlobal(false)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium border transition-colors ${
                            !isGlobal
                              ? 'bg-brand-500/15 border-brand-500/40 text-brand-300'
                              : 'bg-slate-900 border-luxury-border text-slate-450 hover:text-white'
                          }`}
                        >
                          <GraduationCap className="w-3.5 h-3.5" /> أقسام محددة
                        </button>
                      </div>
                    )}

                    {(user.role === 'teacher' || !isGlobal) && (
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={targetClass}
                          required
                          onChange={(e) => {
                            setTargetClass(e.target.value);
                            setTargetGroup('');
                          }}
                          className="flex-1 min-w-[140px] bg-slate-900 border border-luxury-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 transition-colors"
                        >
                          <option value="">اختر القسم الدراسي</option>
                          {(user.role === 'teacher' ? profile?.classes : allClasses)?.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.name}
                            </option>
                          ))}
                        </select>

                        <select
                          value={targetGroup}
                          onChange={(e) => setTargetGroup(e.target.value)}
                          className="flex-1 min-w-[140px] bg-slate-900 border border-luxury-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 transition-colors"
                        >
                          <option value="">جميع الأفواج</option>
                          {(user.role === 'teacher' ? profile?.groups : allGroups)
                            ?.filter((g) => g.class === targetClass || g.class?._id === targetClass)
                            .map((g) => (
                              <option key={g._id} value={g._id}>
                                {g.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Media attachment (photo / video) */}
                  <div className="bg-slate-900/40 border border-luxury-border rounded-xl p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-350">
                        <ImageIcon className="w-3.5 h-3.5 text-brand-400" />
                        <span>صورة أو فيديو (اختياري)</span>
                      </div>
                      <input
                        type="file"
                        ref={mediaInputRef}
                        onChange={handleMediaChange}
                        accept="image/*,video/*"
                        className="hidden"
                      />
                      {!mediaFile && (
                        <button
                          type="button"
                          onClick={() => mediaInputRef.current?.click()}
                          className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-300 bg-brand-500/10 border border-brand-500/25 hover:bg-brand-500/20 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <ImageIcon className="w-3.5 h-3.5" /> إضافة وسائط
                        </button>
                      )}
                    </div>
                    {mediaPreview && (
                      <div className="relative rounded-xl overflow-hidden border border-luxury-border">
                        {mediaKind === 'video' ? (
                          <video src={mediaPreview} controls className="w-full max-h-64 object-contain bg-black" />
                        ) : (
                          <img src={mediaPreview} alt="preview" className="w-full max-h-64 object-contain bg-black" />
                        )}
                        <button
                          type="button"
                          onClick={clearMedia}
                          className="absolute top-2 left-2 p-1.5 bg-slate-950/80 hover:bg-red-600 text-white rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <span className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] font-semibold text-white bg-slate-950/70 px-2 py-1 rounded-lg">
                          {mediaKind === 'video' ? <Film className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                          {mediaKind === 'video' ? 'فيديو' : 'صورة'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setComposerOpen(false)}
                      className="py-2.5 px-5 text-slate-450 hover:text-white font-medium rounded-xl text-xs transition-colors"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={publishing}
                      className="py-2.5 px-6 bg-brand-500 hover:bg-brand-400 disabled:bg-slate-800 disabled:text-slate-550 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-brand-500/20"
                    >
                      <span>{publishing ? 'جاري النشر...' : 'نشر الآن'}</span>
                      <Send className="w-3.5 h-3.5 rtl-flip" />
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ---------------------- Feed list ---------------------- */}
      {loading ? (
        <div className="space-y-5">
          <PostSkeleton />
          <PostSkeleton />
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-panel p-10 text-center border border-dashed border-luxury-border rounded-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-900/60 border border-luxury-border flex items-center justify-center mb-4">
            <Megaphone className="w-6 h-6 text-slate-550" />
          </div>
          <p className="text-slate-300 font-semibold text-sm">لا توجد منشورات حالياً</p>
          <p className="text-slate-550 text-xs mt-1">
            ستظهر هنا آخر الإعلانات والأخبار الخاصة بك.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map((post, idx) => {
            const isLikedByMe = post.likes?.includes(user?.id);
            const likeCount = post.likes?.length || 0;
            const commentCount = post.comments?.length || 0;
            const commentsVisible = openComments[post._id];
            const viewersVisible = openViewers[post._id];
            const isOwner = post.publisher?._id === user?.id;
            const isPrivileged = ['admin', 'school'].includes(user?.role);
            const canSeeViewers = isOwner || isPrivileged;
            const viewsCount = post.viewsCount ?? 0;
            return (
              <motion.article
                key={post._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.3) }}
                className="glass-panel rounded-2xl border border-luxury-border shadow-lg overflow-hidden hover:border-brand-500/20 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between p-5 pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      firstName={post.publisher?.firstName}
                      lastName={post.publisher?.lastName}
                      src={post.publisher?.profilePic}
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-white text-sm leading-tight">
                          {post.publisher?.firstName} {post.publisher?.lastName}
                        </h4>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            roleBadgeStyles[post.publisherRole] || roleBadgeStyles.student
                          }`}
                        >
                          {(post.publisherRole === 'admin' || post.publisherRole === 'school') && (
                            <ShieldCheck className="w-2.5 h-2.5" />
                          )}
                          {roleLabels[post.publisherRole] || post.publisherRole}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-450">
                        <span>{timeAgo(post.createdAt)}</span>
                        <span className="text-slate-700">•</span>
                        <span className="inline-flex items-center gap-1">
                          {post.isGlobal ? (
                            <>
                              <Globe className="w-3 h-3" /> عام
                            </>
                          ) : (
                            <>
                              <Users className="w-3 h-3" /> مستهدف
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="px-5 pb-4 space-y-2">
                  <h3 className="font-bold text-base text-brand-300 leading-snug">{post.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                  {post.attachmentUrl && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-luxury-border">
                      {post.mediaType === 'video' ? (
                        <video src={post.attachmentUrl} controls className="w-full max-h-[420px] bg-black object-contain" />
                      ) : (
                        <img
                          src={post.attachmentUrl}
                          alt={post.title}
                          className="w-full max-h-[420px] bg-black object-contain cursor-pointer"
                          onClick={() => window.open(post.attachmentUrl, '_blank')}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Stats row */}
                {(likeCount > 0 || commentCount > 0 || canSeeViewers) && (
                  <div className="px-5 pb-2 flex items-center justify-between text-[11px] text-slate-450">
                    <span className="inline-flex items-center gap-3">
                      {likeCount > 0 && (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center">
                            <Heart className="w-2.5 h-2.5 text-red-400 fill-current" />
                          </span>
                          {likeCount}
                        </span>
                      )}
                      {canSeeViewers && (
                        <button
                          onClick={() => toggleViewers(post._id)}
                          className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                          title="مشاهدات المنشور"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{viewsCount} مشاهدة</span>
                        </button>
                      )}
                    </span>
                    {commentCount > 0 && (
                      <button
                        onClick={() => toggleComments(post._id)}
                        className="hover:text-white transition-colors"
                      >
                        {commentCount} تعليقات
                      </button>
                    )}
                  </div>
                )}

                {/* Action bar */}
                <div className="px-3 py-1.5 border-t border-luxury-border/50 grid grid-cols-2 gap-1">
                  <button
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-colors hover:bg-slate-900/60 ${
                      isLikedByMe ? 'text-red-400' : 'text-slate-450'
                    }`}
                  >
                    <motion.span
                      whileTap={{ scale: 1.4 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                    >
                      <Heart className={`w-4 h-4 ${isLikedByMe ? 'fill-current' : ''}`} />
                    </motion.span>
                    إعجاب
                  </button>
                  <button
                    onClick={() => toggleComments(post._id)}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-slate-450 hover:bg-slate-900/60 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    تعليق
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${
                        commentsVisible ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Comments */}
                <AnimatePresence initial={false}>
                  {commentsVisible && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden border-t border-luxury-border/50 bg-slate-950/30"
                    >
                      <div className="p-4 space-y-3">
                        {commentCount > 0 && (
                          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                            {post.comments.map((comment, cidx) => {
                              const [cf = '', cl = ''] = (comment.userName || '').split(' ');
                              return (
                                <div key={comment._id || cidx} className="flex gap-2.5">
                                  <Avatar firstName={cf} lastName={cl} size="sm" />
                                  <div className="flex-1 min-w-0">
                                    <div className="bg-slate-900/60 border border-luxury-border rounded-2xl rounded-tr-sm px-3.5 py-2">
                                      <p className="text-[11px] font-bold text-slate-200">
                                        {comment.userName}
                                      </p>
                                      <p className="text-xs text-slate-300 leading-relaxed mt-0.5 whitespace-pre-wrap break-words">
                                        {comment.content}
                                      </p>
                                    </div>
                                    <span className="text-[10px] text-slate-550 px-2 mt-1 inline-block">
                                      {timeAgo(comment.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* New comment form */}
                        <form
                          onSubmit={(e) => handleCommentSubmit(e, post._id)}
                          className="flex items-center gap-2"
                        >
                          <Avatar
                            firstName={myInitials.first}
                            lastName={myInitials.last}
                            src={profile?.profilePic}
                            size="sm"
                          />
                          <div className="flex-1 flex items-center gap-2 bg-slate-900 border border-luxury-border rounded-full px-2 py-1 focus-within:border-brand-500 transition-colors">
                            <input
                              type="text"
                              required
                              placeholder="اكتب تعليقاً..."
                              value={commentInputs[post._id] || ''}
                              onChange={(e) => handleCommentChange(post._id, e.target.value)}
                              className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white focus:outline-none placeholder-slate-550"
                            />
                            <button
                              type="submit"
                              className="p-2 bg-brand-500 hover:bg-brand-400 rounded-full text-white transition-colors shrink-0"
                            >
                              <Send className="w-3.5 h-3.5 rtl-flip" />
                            </button>
                          </div>
                        </form>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Viewers list (owner / admin only) */}
                <AnimatePresence initial={false}>
                  {canSeeViewers && viewersVisible && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden border-t border-luxury-border/50 bg-slate-950/30"
                    >
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-350">
                          <Eye className="w-3.5 h-3.5 text-brand-400" />
                          <span>الأشخاص الذين شاهدوا هذا المنشور ({post.viewers?.length || 0})</span>
                        </div>
                        {post.viewers && post.viewers.length > 0 ? (
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {post.viewers.map((v, vidx) => (
                              <div key={v._id || vidx} className="flex items-center gap-2.5">
                                <Avatar firstName={v.firstName} lastName={v.lastName} src={v.profilePic} size="sm" />
                                <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-slate-200">
                                      {v.firstName} {v.lastName}
                                    </span>
                                    <span
                                      className={`inline-flex items-center text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${
                                        roleBadgeStyles[v.role] || roleBadgeStyles.student
                                      }`}
                                    >
                                      {roleLabels[v.role] || v.role}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-550 shrink-0">{timeAgo(v.viewedAt)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-550 italic">لا توجد مشاهدات بعد.</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}
