import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit3, Save, CheckCircle2, AlertTriangle, Plus, Trash2, Link as LinkIcon } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getToken = () => {
  return useAuthStore.getState().accessToken || localStorage.getItem('zitouni_access_token') || localStorage.getItem('token') || '';
};

export default function EditPostModal({ isOpen, onClose, post, onPostUpdated }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pedagogicalLinks, setPedagogicalLinks] = useState([]);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setContent(post.content || '');
      setPedagogicalLinks(post.pedagogicalLinks || []);
      setErrorMsg('');
    }
  }, [post, isOpen]);

  if (!isOpen || !post) return null;

  const handleAddLink = () => {
    if (!newLinkUrl.trim()) return;
    setPedagogicalLinks(prev => [
      ...prev,
      { title: newLinkTitle.trim() || newLinkUrl.trim(), url: newLinkUrl.trim() }
    ]);
    setNewLinkTitle('');
    setNewLinkUrl('');
  };

  const handleRemoveLink = (idx) => {
    setPedagogicalLinks(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMsg('يرجى ملء عنوان المنشور ومحتواه.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const token = getToken();
      const res = await axios.put(
        `${API_URL}/posts/${post._id}`,
        {
          title: title.trim(),
          content: content.trim(),
          pedagogicalLinks,
          attachments: post.attachments || []
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      if (onPostUpdated) {
        onPostUpdated(res.data.post || { ...post, title, content, pedagogicalLinks });
      }
      onClose();
    } catch (err) {
      console.error('Error editing post', err);
      setErrorMsg(err.response?.data?.message || 'تعذر حفظ تعديلات المنشور.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-xl bg-[#FDFBF7] border border-[#C9A24D]/40 rounded-3xl shadow-2xl p-6 md:p-8 space-y-6 text-right"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#C9A24D]/25 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#7B1E3A]/10 border border-[#7B1E3A]/25 flex items-center justify-center text-[#7B1E3A]">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#7B1E3A] font-serif">تعديل المنشور المدرسي</h3>
                <p className="text-xs text-[#2B2022]/70 font-sans">تحديث محتوى المنشور والروابط التربوية المرفقة</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#7B1E3A] mb-1.5 font-sans">عنوان المنشور</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="w-full p-3 rounded-2xl bg-white border border-[#C9A24D]/35 text-[#2B2022] text-sm font-sans focus:outline-none focus:border-[#7B1E3A] shadow-xs"
                placeholder="عنوان المنشور أو الإعلان..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7B1E3A] mb-1.5 font-sans">نص ومحتوى المنشور</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                required
                rows={5}
                className="w-full p-3 rounded-2xl bg-white border border-[#C9A24D]/35 text-[#2B2022] text-sm font-sans focus:outline-none focus:border-[#7B1E3A] shadow-xs resize-y"
                placeholder="اكتب المحتوى بالتفصيل..."
              />
            </div>

            {/* Pedagogical Links */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-[#7B1E3A] font-sans">الروابط التربوية والمصادر الخارجية</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="عنوان الرابط (مثال: منصة فضاء الأولياء)"
                  value={newLinkTitle}
                  onChange={e => setNewLinkTitle(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl bg-white border border-[#C9A24D]/30 text-xs font-sans"
                />
                <input
                  type="url"
                  placeholder="https://..."
                  value={newLinkUrl}
                  onChange={e => setNewLinkUrl(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl bg-white border border-[#C9A24D]/30 text-xs font-sans"
                />
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="px-4 py-2 bg-[#F3E9DC] hover:bg-[#ebdcc8] text-[#7B1E3A] font-bold rounded-xl text-xs transition-colors border border-[#C9A24D]/40 shrink-0 font-sans cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {pedagogicalLinks.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {pedagogicalLinks.map((link, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-[#F3E9DC]/50 rounded-xl border border-[#C9A24D]/25 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate text-slate-700">
                        <LinkIcon className="w-3.5 h-3.5 text-[#C9A24D] shrink-0" />
                        <span className="font-bold text-[#7B1E3A] font-sans">{link.title}</span>
                        <span className="text-[11px] text-slate-500 truncate font-mono">({link.url})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(idx)}
                        className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#C9A24D]/25">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors font-sans cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-[#7B1E3A] hover:bg-[#60162c] text-[#F3E9DC] font-bold text-xs transition-all shadow-md shadow-[#7B1E3A]/20 flex items-center gap-2 font-sans cursor-pointer"
              >
                <Save className="w-4 h-4 text-[#C9A24D]" />
                <span>{submitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
