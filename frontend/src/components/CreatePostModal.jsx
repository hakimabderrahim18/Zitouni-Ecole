import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Upload, Plus, Paperclip, Image, Film, FileText, Link as LinkIcon,
  Pin, Lock, AlertTriangle, Calendar, Clock, Send, RefreshCw, CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getToken = () => {
  return useAuthStore.getState().accessToken || localStorage.getItem('zitouni_access_token') || localStorage.getItem('token') || '';
};

const AUDIENCE_OPTIONS = [
  { id: 'all', label: 'كامل المؤسسة (الجميع)', desc: 'تلاميذ، أولياء، أساتذة، إدارة' },
  { id: 'teachers', label: 'الأساتذة فقط', desc: 'كل الطاقم التربوي والتعليمي' },
  { id: 'parents', label: 'أولياء الأمور فقط', desc: 'كل أولياء التلاميذ المسجلين' },
  { id: 'students', label: 'التلاميذ فقط', desc: 'كل التلاميذ في المؤسسة' },
  { id: 'supervisors', label: 'المشرفون والمراقبون', desc: 'المشرف العام والمشرفون التربويون' },
  { id: 'admin_only', label: 'الإدارة العامة فقط', desc: 'الإدارة والمشرفين' },
  { id: 'level', label: 'طور تعليمي محدد', desc: 'ابتدائي، متوسط، أو ثانوي' },
  { id: 'class', label: 'قسم دراسي محدد', desc: 'قسم محدد وأولياؤه وتلاميذه' },
];

export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [targetLevel, setTargetLevel] = useState('');
  const [targetClass, setTargetClass] = useState('');
  const [classes, setClasses] = useState([]);

  // Post options
  const [isPinned, setIsPinned] = useState(false);
  const [commentsLocked, setCommentsLocked] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

  // Attachments
  const [attachments, setAttachments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Pedagogical Links
  const [pedagogicalLinks, setPedagogicalLinks] = useState([]);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [showAddLink, setShowAddLink] = useState(false);

  // Submitting
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchClasses();
    }
  }, [isOpen]);

  const fetchClasses = async () => {
    try {
      const token = getToken();
      const res = await axios.get(`${API_URL}/admin/classes`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setClasses(res.data || []);
      if (res.data?.length > 0 && !targetClass) {
        setTargetClass(res.data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  if (!isOpen) return null;

  // Handle multi-files upload
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    setErrorMsg('');
    try {
      const token = getToken();
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const res = await axios.post(`${API_URL}/posts/upload`, formData, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.attachments) {
        setAttachments(prev => [...prev, ...res.data.attachments]);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setErrorMsg('حدث خطأ أثناء رفع الملفات.');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleRemoveAttachment = (idx) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddLink = () => {
    if (!newLinkUrl) return;
    setPedagogicalLinks(prev => [
      ...prev,
      { title: newLinkTitle || newLinkUrl, url: newLinkUrl },
    ]);
    setNewLinkTitle('');
    setNewLinkUrl('');
    setShowAddLink(false);
  };

  const handleRemoveLink = (idx) => {
    setPedagogicalLinks(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMsg('العنوان والمحتوى مطلوبان.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const token = getToken();
      const payload = {
        title: title.trim(),
        content: content.trim(),
        targetAudience,
        targetLevel: targetAudience === 'level' ? targetLevel : '',
        targetClass: targetAudience === 'class' ? targetClass : null,
        isPinned,
        commentsLocked,
        isImportant,
        scheduledPublishAt: isScheduled && scheduledDate ? scheduledDate : null,
        attachments,
        pedagogicalLinks,
      };

      const res = await axios.post(`${API_URL}/posts`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (onPostCreated) onPostCreated(res.data.post);
      onClose();
    } catch (err) {
      console.error('Error creating post:', err);
      setErrorMsg(err.response?.data?.message || 'فشل في نشر المنشور.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-[#FDFBF7] border border-[#C9A24D]/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#C9A24D]/30 bg-[#F3E9DC]/60">
            <div>
              <h3 className="font-bold text-[#7B1E3A] text-lg font-serif">إنشاء منشور جديد في الشبكة المدرسية</h3>
              <p className="text-xs text-[#2B2022]/70 font-sans">تواصل موجه، مرفقات متعددة، وخيارات نشر متقدمة (المواد 10 - 13)</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#2B2022]/60 hover:text-[#7B1E3A] hover:bg-[#F3E9DC] rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs font-sans">
                {errorMsg}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-[#7B1E3A] mb-1.5 font-serif">عنوان المنشور *</label>
              <input
                type="text"
                placeholder="مثال: إعلان جدول الاختبارات الفصلية / نشاط تربوي..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="w-full bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl px-4 py-2.5 text-sm text-[#2B2022] placeholder-[#2B2022]/40 focus:outline-none focus:border-[#7B1E3A] font-sans"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-xs font-bold text-[#7B1E3A] mb-1.5 font-serif">نص المنشور *</label>
              <textarea
                rows={4}
                placeholder="اكتب تفاصيل الإعلان أو التوجيه هنا..."
                value={content}
                onChange={e => setContent(e.target.value)}
                required
                className="w-full bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl px-4 py-3 text-sm text-[#2B2022] placeholder-[#2B2022]/40 focus:outline-none focus:border-[#7B1E3A] leading-relaxed font-sans"
              />
            </div>

            {/* Audience Targeting (Art. 12: تحديد الجمهور بدقة) */}
            <div className="p-4 bg-[#F3E9DC]/40 border border-[#C9A24D]/30 rounded-2xl space-y-3">
              <label className="block text-xs font-bold text-[#7B1E3A] font-serif">
                تحديد الجمهور المستهدف (إلزامي بموجب المادة 12)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {AUDIENCE_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTargetAudience(opt.id)}
                    className={`p-2.5 rounded-xl text-right border transition-all cursor-pointer font-sans ${
                      targetAudience === opt.id
                        ? 'bg-[#7B1E3A]/10 border-[#7B1E3A] text-[#7B1E3A] shadow-sm font-bold'
                        : 'bg-[#FDFBF7] border-[#C9A24D]/25 text-[#2B2022]/70 hover:text-[#7B1E3A] hover:bg-[#F3E9DC]'
                    }`}
                  >
                    <p className="text-xs">{opt.label}</p>
                    <p className="text-[10px] text-[#2B2022]/60 truncate mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>

              {/* Conditional: Level selector */}
              {targetAudience === 'level' && (
                <div className="pt-2">
                  <label className="block text-xs text-[#2B2022]/70 mb-1 font-sans">اختر الطور التعليمي:</label>
                  <select
                    value={targetLevel}
                    onChange={e => setTargetLevel(e.target.value)}
                    className="w-full bg-[#FDFBF7] border border-[#C9A24D]/35 text-[#2B2022] text-xs rounded-xl px-3 py-2 font-sans focus:outline-none focus:border-[#7B1E3A]"
                  >
                    <option value="">اختر الطور</option>
                    <option value="primary">الطور الابتدائي</option>
                    <option value="middle">الطور المتوسط</option>
                    <option value="secondary">الطور الثانوي</option>
                  </select>
                </div>
              )}

              {/* Conditional: Class selector */}
              {targetAudience === 'class' && (
                <div className="pt-2">
                  <label className="block text-xs text-[#2B2022]/70 mb-1 font-sans">اختر القسم الدراسي:</label>
                  <select
                    value={targetClass}
                    onChange={e => setTargetClass(e.target.value)}
                    className="w-full bg-[#FDFBF7] border border-[#C9A24D]/35 text-[#2B2022] text-xs rounded-xl px-3 py-2 font-sans focus:outline-none focus:border-[#7B1E3A]"
                  >
                    {classes.map(c => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.description ? `(${c.description})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Multi-attachments (Art. 11) */}
            <div className="p-4 bg-[#F3E9DC]/40 border border-[#C9A24D]/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#7B1E3A] flex items-center gap-2 font-serif">
                  <Paperclip className="w-4 h-4 text-[#C9A24D]" />
                  <span>المرفقات (صور، فيديوهات، PDF، وثائق إدارية)</span>
                </label>
                <label className="px-3 py-1.5 bg-[#FDFBF7] hover:bg-[#F3E9DC] text-[#7B1E3A] border border-[#C9A24D]/35 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm font-sans">
                  <Upload className="w-3.5 h-3.5 text-[#C9A24D]" />
                  <span>إضافة ملفات</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,application/pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {uploadingFiles && (
                <div className="p-3 text-center text-xs text-[#7B1E3A] font-bold flex items-center justify-center gap-2 font-sans">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C9A24D]" />
                  <span>جاري رفع وتأمين الملفات...</span>
                </div>
              )}

              {attachments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-[#FDFBF7] border border-[#C9A24D]/30 rounded-xl shadow-sm"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {att.fileType === 'image' && <Image className="w-4 h-4 text-emerald-600 shrink-0" />}
                        {att.fileType === 'video' && <Film className="w-4 h-4 text-purple-600 shrink-0" />}
                        {['pdf', 'document', 'file'].includes(att.fileType) && <FileText className="w-4 h-4 text-[#7B1E3A] shrink-0" />}
                        <span className="text-xs text-[#2B2022] truncate font-sans">{att.name || att.url}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(idx)}
                        className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pedagogical Links */}
            <div className="p-4 bg-[#F3E9DC]/40 border border-[#C9A24D]/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#7B1E3A] flex items-center gap-2 font-serif">
                  <LinkIcon className="w-4 h-4 text-[#C9A24D]" />
                  <span>الروابط البيداغوجية والتعليمية التفاعلية</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddLink(!showAddLink)}
                  className="px-3 py-1.5 bg-[#FDFBF7] hover:bg-[#F3E9DC] text-[#7B1E3A] border border-[#C9A24D]/35 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm font-sans"
                >
                  <Plus className="w-3.5 h-3.5 text-[#C9A24D]" />
                  <span>إضافة رابط</span>
                </button>
              </div>

              {showAddLink && (
                <div className="p-3 bg-[#FDFBF7] border border-[#C9A24D]/30 rounded-xl space-y-2">
                  <input
                    type="text"
                    placeholder="عنوان الرابط (مثال: منصة المحاكاة التفاعلية PhET)..."
                    value={newLinkTitle}
                    onChange={e => setNewLinkTitle(e.target.value)}
                    className="w-full bg-[#FDFBF7] border border-[#C9A24D]/35 text-[#2B2022] text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#7B1E3A] font-sans"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="https://..."
                      value={newLinkUrl}
                      onChange={e => setNewLinkUrl(e.target.value)}
                      className="flex-1 bg-[#FDFBF7] border border-[#C9A24D]/35 text-[#2B2022] text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#7B1E3A] font-sans"
                    />
                    <button
                      type="button"
                      onClick={handleAddLink}
                      className="px-4 py-1.5 bg-[#7B1E3A] hover:bg-[#60162c] text-[#F3E9DC] text-xs font-bold rounded-lg cursor-pointer font-sans"
                    >
                      تأكيد
                    </button>
                  </div>
                </div>
              )}

              {pedagogicalLinks.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {pedagogicalLinks.map((link, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-[#FDFBF7] border border-[#C9A24D]/25 rounded-xl text-xs shadow-sm font-sans"
                    >
                      <span className="text-[#7B1E3A] truncate font-medium">{link.title} ({link.url})</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(idx)}
                        className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Options Checkboxes */}
            <div className="space-y-2.5 pt-1 font-sans">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={e => setIsPinned(e.target.checked)}
                  className="rounded text-[#7B1E3A] focus:ring-0 w-4 h-4 accent-[#7B1E3A]"
                />
                <div className="text-xs">
                  <p className="font-bold text-[#7B1E3A] flex items-center gap-1.5 font-serif">
                    <Pin className="w-3.5 h-3.5 text-[#C9A24D]" />
                    <span>تثبيت المنشور في أعلى الصفحة (منشور رئيسي)</span>
                  </p>
                  <p className="text-[10px] text-[#2B2022]/60">يبقى ظاهراً في المقدمة لكل المعنيين (المادة 13)</p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={commentsLocked}
                  onChange={e => setCommentsLocked(e.target.checked)}
                  className="rounded text-[#7B1E3A] focus:ring-0 w-4 h-4 accent-[#7B1E3A]"
                />
                <div className="text-xs">
                  <p className="font-bold text-[#2B2022] flex items-center gap-1.5 font-serif">
                    <Lock className="w-3.5 h-3.5 text-[#7B1E3A]" />
                    <span>إغلاق التعليقات والردود</span>
                  </p>
                  <p className="text-[10px] text-[#2B2022]/60">منع الردود العامة لحفظ رسمية الإعلان (المادة 14)</p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isImportant}
                  onChange={e => setIsImportant(e.target.checked)}
                  className="rounded text-[#7B1E3A] focus:ring-0 w-4 h-4 accent-[#7B1E3A]"
                />
                <div className="text-xs">
                  <p className="font-bold text-[#7B1E3A] flex items-center gap-1.5 font-serif">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#7B1E3A]" />
                    <span>إعلان هام يتطلب تأكيد الاطلاع (زر اطلعت عليه)</span>
                  </p>
                  <p className="text-[10px] text-[#2B2022]/60">يظهر زر تأكيد رسمي للمستلمين (المادة 16)</p>
                </div>
              </label>

              <div className="p-3 rounded-xl bg-[#F3E9DC]/40 border border-[#C9A24D]/30">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={e => setIsScheduled(e.target.checked)}
                    className="rounded text-[#7B1E3A] focus:ring-0 w-4 h-4 accent-[#7B1E3A]"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-[#7B1E3A] flex items-center gap-1.5 font-serif">
                      <Clock className="w-3.5 h-3.5 text-[#C9A24D]" />
                      <span>جدولة النشر لتاريخ لاحق</span>
                    </p>
                  </div>
                </label>
                {isScheduled && (
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    className="mt-2 w-full bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-lg px-2.5 py-1 text-xs text-[#2B2022] font-sans focus:outline-none focus:border-[#7B1E3A]"
                  />
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-[#C9A24D]/30">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-[#2B2022]/70 hover:text-[#7B1E3A] text-xs font-bold transition-colors cursor-pointer font-sans"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={submitting || uploadingFiles}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#7B1E3A] hover:bg-[#60162c] text-[#F3E9DC] font-bold rounded-xl text-sm transition-all shadow-md shadow-[#7B1E3A]/25 disabled:opacity-50 cursor-pointer border border-[#C9A24D]/40 font-sans"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-[#C9A24D]" />}
                <span>نشر المنشور الآن</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
