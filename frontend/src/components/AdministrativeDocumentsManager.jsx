import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  Upload,
  Download,
  ExternalLink,
  Edit3,
  Trash2,
  Check,
  Eye,
  EyeOff,
  Search,
  Filter,
  AlertCircle,
  RefreshCw,
  X,
  Users,
  GraduationCap,
  Calendar,
  Sparkles,
  Info,
} from 'lucide-react';
import axios from 'axios';

const categoryLabels = {
  all: { label: 'عام (الجميع)', badge: 'bg-[#F3E9DC] text-[#7B1E3A] border-[#C9A24D]/35' },
  teachers: { label: 'للأساتذة والموظفين', badge: 'bg-[#7B1E3A]/10 text-[#7B1E3A] border-[#7B1E3A]/30' },
  parents: { label: 'لأولياء الأمور', badge: 'bg-emerald-50 text-emerald-900 border-emerald-300' },
  students: { label: 'للتلاميذ', badge: 'bg-blue-50 text-blue-900 border-blue-300' },
  administrative: { label: 'للإدارة والتسيير', badge: 'bg-amber-50 text-amber-900 border-amber-300' },
  other: { label: 'أخرى', badge: 'bg-stone-100 text-stone-800 border-stone-300' },
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '—';
  const k = 1024;
  const sizes = ['بايت', 'ك.ب', 'م.ب', 'ج.ب'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function AdministrativeDocumentsManager({ documents = [], onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all_filter');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [quickReplacingId, setQuickReplacingId] = useState(null);

  // Form state for creation
  const [createForm, setCreateForm] = useState({
    title: '',
    category: 'all',
    description: '',
    isPublished: true,
    file: null,
  });

  // Form state for editing
  const [editForm, setEditForm] = useState({
    title: '',
    category: 'all',
    description: '',
    isPublished: true,
    file: null,
  });

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const title = (doc.title || doc.fileName || '').toLowerCase();
    const orig = (doc.originalName || '').toLowerCase();
    const desc = (doc.description || '').toLowerCase();
    const q = searchQuery.toLowerCase();

    const matchesSearch = title.includes(q) || orig.includes(q) || desc.includes(q);
    const matchesCategory =
      selectedCategory === 'all_filter' ? true : (doc.category || 'all') === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Handle Quick File Replace
  const handleQuickReplace = async (docId, file) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('الملفات المسموح برفعها هي ملفات PDF فقط.');
      return;
    }

    setQuickReplacingId(docId);
    try {
      const formData = new FormData();
      formData.append('file', file);

      await axios.put(`/api/admin/documents/${docId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل استبدال الملف');
    } finally {
      setQuickReplacingId(null);
    }
  };

  // Handle Create Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim()) {
      alert('يرجى كتابة عنوان المستند');
      return;
    }
    if (!createForm.file) {
      alert('يرجى اختيار ملف PDF للرفع');
      return;
    }

    setLoadingAction(true);
    try {
      const formData = new FormData();
      formData.append('title', createForm.title.trim());
      formData.append('category', createForm.category);
      formData.append('description', createForm.description.trim());
      formData.append('isPublished', createForm.isPublished);
      formData.append('file', createForm.file);

      await axios.post('/api/admin/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setIsCreateModalOpen(false);
      setCreateForm({
        title: '',
        category: 'all',
        description: '',
        isPublished: true,
        file: null,
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل إضافة المستند');
    } finally {
      setLoadingAction(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (doc) => {
    setEditingDoc(doc);
    setEditForm({
      title: doc.title || '',
      category: doc.category || 'all',
      description: doc.description || '',
      isPublished: doc.isPublished !== undefined ? doc.isPublished : true,
      file: null,
    });
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingDoc) return;
    if (!editForm.title.trim()) {
      alert('يرجى كتابة عنوان المستند');
      return;
    }

    setLoadingAction(true);
    try {
      const formData = new FormData();
      formData.append('title', editForm.title.trim());
      formData.append('category', editForm.category);
      formData.append('description', editForm.description.trim());
      formData.append('isPublished', editForm.isPublished);
      if (editForm.file) {
        formData.append('file', editForm.file);
      }

      await axios.put(`/api/admin/documents/${editingDoc._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setEditingDoc(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل تعديل المستند');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle Delete Document
  const handleDeleteDoc = async (doc) => {
    const confirmMessage = `هل أنت متأكد من رغبتك في حذف هذا المستند نهائياً؟\n« ${doc.title || doc.fileName} »`;
    if (!window.confirm(confirmMessage)) return;

    try {
      await axios.delete(`/api/admin/documents/${doc._id}`);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل حذف المستند');
    }
  };

  // KPI counters
  const totalDocs = documents.length;
  const publishedDocs = documents.filter((d) => d.isPublished !== false).length;
  const teachersDocs = documents.filter((d) => d.category === 'teachers').length;
  const parentsDocs = documents.filter((d) => d.category === 'parents').length;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* ===== Header & Management Toolbar ===== */}
      <div className="bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-serif font-black text-[#7B1E3A] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#C9A24D]" />
              <span>المستندات والوثائق الإدارية (PDF)</span>
            </h2>
            <p className="text-xs text-[#2B2022]/70 mt-1">
              إدارة، رفع، تعديل، ونشر الوثائق والعقود واللوائح المدرسية الرسمية القابلة للتحميل.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#7B1E3A] hover:bg-[#62162d] text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-[#7B1E3A]/20 cursor-pointer border border-[#C9A24D]/30 shrink-0"
          >
            <Plus className="w-4 h-4 text-[#C9A24D]" />
            <span>إضافة مستند إداري جديد</span>
          </button>
        </div>

        {/* KPI Counter Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#C9A24D]/20">
          <div className="bg-white border border-[#C9A24D]/25 rounded-xl p-3 text-center">
            <span className="text-[11px] text-[#2B2022]/60 font-medium block">إجمالي المستندات</span>
            <span className="text-lg font-bold font-mono text-[#7B1E3A]">{totalDocs}</span>
          </div>
          <div className="bg-white border border-[#C9A24D]/25 rounded-xl p-3 text-center">
            <span className="text-[11px] text-[#2B2022]/60 font-medium block">منشورة ومتاحة</span>
            <span className="text-lg font-bold font-mono text-emerald-700">{publishedDocs}</span>
          </div>
          <div className="bg-white border border-[#C9A24D]/25 rounded-xl p-3 text-center">
            <span className="text-[11px] text-[#2B2022]/60 font-medium block">خاصة بالأساتذة</span>
            <span className="text-lg font-bold font-mono text-[#7B1E3A]">{teachersDocs}</span>
          </div>
          <div className="bg-white border border-[#C9A24D]/25 rounded-xl p-3 text-center">
            <span className="text-[11px] text-[#2B2022]/60 font-medium block">خاصة بالأولياء</span>
            <span className="text-lg font-bold font-mono text-[#C9A24D]">{parentsDocs}</span>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-nowrap">
            {[
              { id: 'all_filter', label: 'الكل' },
              { id: 'teachers', label: 'للأساتذة' },
              { id: 'parents', label: 'للأولياء' },
              { id: 'students', label: 'للتلاميذ' },
              { id: 'all', label: 'عام' },
              { id: 'administrative', label: 'إداري' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-[#7B1E3A] text-white shadow-xs'
                    : 'bg-white hover:bg-[#F3E9DC] text-[#2B2022]/70 border border-[#C9A24D]/25'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-[#2B2022]/40 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث باسم المستند أو الملف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#C9A24D]/35 rounded-xl pr-9 pl-3 py-2 text-xs text-[#2B2022] placeholder-[#2B2022]/40 focus:border-[#7B1E3A] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ===== Documents Grid ===== */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-[#FDFBF7] border border-dashed border-[#C9A24D]/30 rounded-2xl p-12 text-center text-[#2B2022]/50 space-y-3">
          <FileText className="w-12 h-12 mx-auto text-[#C9A24D]/50" />
          <p className="font-serif font-bold text-[#7B1E3A] text-base">لا توجد مستندات تطابق معايير البحث.</p>
          <p className="text-xs text-[#2B2022]/60">
            يمكنك إضافة مستند جديد أو تغيير فلترة التصنيف للبحث في مستندات أخرى.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const catInfo = categoryLabels[doc.category] || categoryLabels.all;
            const isReplacing = quickReplacingId === doc._id;

            return (
              <motion.div
                key={doc._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#FDFBF7] border border-[#C9A24D]/35 hover:border-[#C9A24D] rounded-2xl p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
              >
                {/* Top Badge & Status Row */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catInfo.badge}`}>
                      {catInfo.label}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {doc.isPublished !== false ? (
                        <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>منشور</span>
                        </span>
                      ) : (
                        <span className="text-[10px] bg-stone-100 text-stone-700 border border-stone-300 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                          <EyeOff className="w-3 h-3 text-stone-500" />
                          <span>مسودة</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Document Title & Icon */}
                  <div className="flex items-start gap-3 pt-1">
                    <div className="w-10 h-10 rounded-xl bg-[#F3E9DC] border border-[#C9A24D]/35 flex items-center justify-center shrink-0 shadow-2xs">
                      <FileText className="w-5 h-5 text-[#7B1E3A]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif font-black text-[#7B1E3A] text-sm leading-snug truncate" title={doc.title}>
                        {doc.title || doc.fileName}
                      </h3>
                      {doc.description && (
                        <p className="text-[11px] text-[#2B2022]/70 mt-1 line-clamp-2 leading-relaxed">
                          {doc.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* File Metadata */}
                  <div className="bg-white/80 border border-[#C9A24D]/20 rounded-xl p-2.5 space-y-1 text-[10px] text-[#2B2022]/70 font-mono">
                    <div className="flex items-center justify-between truncate">
                      <span className="text-[#2B2022]/50 font-sans">اسم الملف:</span>
                      <span className="truncate max-w-[170px] font-bold text-[#7B1E3A]" title={doc.originalName || doc.fileName}>
                        {doc.originalName || doc.fileName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#2B2022]/50 font-sans">تاريخ التحديث:</span>
                      <span>{new Date(doc.updatedAt || doc.createdAt).toLocaleDateString('ar-DZ')}</span>
                    </div>
                    {doc.fileSize > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#2B2022]/50 font-sans">حجم الملف:</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-2 border-t border-[#C9A24D]/20 space-y-2">
                  <div className="flex items-center gap-1.5">
                    {/* View / Download PDF */}
                    <button
                      type="button"
                      onClick={() => window.open(doc.fileUrl, '_blank')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 bg-white hover:bg-[#F3E9DC] border border-[#C9A24D]/35 text-[#7B1E3A] font-bold text-xs rounded-xl transition-all cursor-pointer shadow-2xs"
                      title="معاينة أو تحميل المستند"
                    >
                      <Download className="w-3.5 h-3.5 text-[#C9A24D]" />
                      <span>معاينة وتحميل</span>
                    </button>

                    {/* Quick Replace PDF */}
                    <label
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-[#F3E9DC] border border-[#C9A24D]/35 text-[#7B1E3A] font-bold text-xs rounded-xl transition-all cursor-pointer shadow-2xs ${
                        isReplacing ? 'opacity-50 pointer-events-none' : ''
                      }`}
                      title="استبدال ملف PDF مباشرة"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#C9A24D]" />
                      <span>{isReplacing ? 'جاري الرفع...' : 'استبدال'}</span>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        disabled={isReplacing}
                        onChange={(e) => {
                          handleQuickReplace(doc._id, e.target.files[0]);
                          e.target.value = '';
                        }}
                      />
                    </label>

                    {/* Edit Metadata Modal Trigger */}
                    <button
                      type="button"
                      onClick={() => openEditModal(doc)}
                      className="p-2 bg-white hover:bg-[#F3E9DC] border border-[#C9A24D]/35 text-[#2B2022] hover:text-[#7B1E3A] rounded-xl transition-all cursor-pointer shadow-2xs"
                      title="تعديل بيانات المستند"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Document */}
                    <button
                      type="button"
                      onClick={() => handleDeleteDoc(doc)}
                      className="p-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 hover:text-rose-800 rounded-xl transition-all cursor-pointer shadow-2xs"
                      title="حذف المستند"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ===== Create Document Modal ===== */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#FDFBF7] border border-[#C9A24D]/40 rounded-3xl p-6 shadow-2xl text-right space-y-4"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#C9A24D]/25 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#F3E9DC] border border-[#C9A24D]/35 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-[#7B1E3A]" />
                  </div>
                  <div>
                    <h3 className="font-serif font-black text-[#7B1E3A] text-base">إضافة مستند إداري رسمي جديد</h3>
                    <p className="text-[11px] text-[#2B2022]/60">رفع ملف PDF وتحديد الفئة المستهدفة للنشر</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 text-[#2B2022]/60 hover:text-[#7B1E3A] hover:bg-white rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#7B1E3A] mb-1">
                    عنوان المستند <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: استمارة التسجيل المدرسي، مخطط الطوارئ، ميثاق الانضباط..."
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    className="w-full bg-white border border-[#C9A24D]/35 rounded-xl px-3.5 py-2 text-xs text-[#2B2022] focus:border-[#7B1E3A] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#7B1E3A] mb-1">الجهة المعنية / الفئة</label>
                    <select
                      value={createForm.category}
                      onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                      className="w-full bg-white border border-[#C9A24D]/35 rounded-xl px-3 py-2 text-xs text-[#2B2022] focus:border-[#7B1E3A] focus:outline-none"
                    >
                      <option value="all">عام (متاح للجميع)</option>
                      <option value="teachers">للأساتذة والموظفين</option>
                      <option value="parents">لأولياء الأمور</option>
                      <option value="students">للتلاميذ</option>
                      <option value="administrative">للإدارة والتسيير الداخلي</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#7B1E3A] mb-1">حالة النشر</label>
                    <select
                      value={createForm.isPublished ? 'true' : 'false'}
                      onChange={(e) => setCreateForm({ ...createForm, isPublished: e.target.value === 'true' })}
                      className="w-full bg-white border border-[#C9A24D]/35 rounded-xl px-3 py-2 text-xs text-[#2B2022] focus:border-[#7B1E3A] focus:outline-none"
                    >
                      <option value="true">منشور ومتاح للتحميل فوراً</option>
                      <option value="false">مسودة (غير معروض للعامة)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7B1E3A] mb-1">وصف أو ملاحظات (اختياري)</label>
                  <textarea
                    rows={2}
                    placeholder="نبذة توضيحية حول الغرض من المستند أو تعليمات الاستعمال..."
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="w-full bg-white border border-[#C9A24D]/35 rounded-xl px-3.5 py-2 text-xs text-[#2B2022] focus:border-[#7B1E3A] focus:outline-none"
                  />
                </div>

                {/* PDF File Picker */}
                <div>
                  <label className="block text-xs font-bold text-[#7B1E3A] mb-1">
                    ملف المستند (PDF فقط) <span className="text-rose-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-[#C9A24D]/40 rounded-2xl p-4 text-center bg-white/60 hover:bg-[#F3E9DC]/30 transition-colors">
                    <input
                      type="file"
                      id="createDocFile"
                      accept="application/pdf"
                      required
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setCreateForm({
                            ...createForm,
                            file,
                            title: createForm.title || file.name.replace(/\.[^/.]+$/, ''),
                          });
                        }
                      }}
                    />
                    <label htmlFor="createDocFile" className="cursor-pointer block space-y-2">
                      <Upload className="w-8 h-8 text-[#C9A24D] mx-auto" />
                      {createForm.file ? (
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-[#7B1E3A]">{createForm.file.name}</p>
                          <p className="text-[10px] text-[#2B2022]/60 font-mono">
                            {formatFileSize(createForm.file.size)}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-[#7B1E3A]">انقر لاختيار ملف PDF من جهازك</p>
                          <p className="text-[10px] text-[#2B2022]/50">الحد الأقصى لحجم الملف: 25 ميغابايت</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#C9A24D]/20">
                  <button
                    type="submit"
                    disabled={loadingAction}
                    className="flex-1 py-2.5 px-4 bg-[#7B1E3A] hover:bg-[#62162d] disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer border border-[#C9A24D]/30"
                  >
                    {loadingAction ? 'جاري الحفظ والرفع...' : 'حفظ ونشر المستند'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="py-2.5 px-4 bg-white hover:bg-[#F3E9DC] border border-[#C9A24D]/30 text-[#2B2022]/70 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== Edit Document Modal ===== */}
      <AnimatePresence>
        {editingDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#FDFBF7] border border-[#C9A24D]/40 rounded-3xl p-6 shadow-2xl text-right space-y-4"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#C9A24D]/25 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#F3E9DC] border border-[#C9A24D]/35 flex items-center justify-center">
                    <Edit3 className="w-5 h-5 text-[#7B1E3A]" />
                  </div>
                  <div>
                    <h3 className="font-serif font-black text-[#7B1E3A] text-base">تعديل بيانات المستند الإداري</h3>
                    <p className="text-[11px] text-[#2B2022]/60">تعديل العنوان، الفئة، الوصف، أو استبدال الملف</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="p-1.5 text-[#2B2022]/60 hover:text-[#7B1E3A] hover:bg-white rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#7B1E3A] mb-1">
                    عنوان المستند <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full bg-white border border-[#C9A24D]/35 rounded-xl px-3.5 py-2 text-xs text-[#2B2022] focus:border-[#7B1E3A] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#7B1E3A] mb-1">الجهة المعنية / الفئة</label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full bg-white border border-[#C9A24D]/35 rounded-xl px-3 py-2 text-xs text-[#2B2022] focus:border-[#7B1E3A] focus:outline-none"
                    >
                      <option value="all">عام (متاح للجميع)</option>
                      <option value="teachers">للأساتذة والموظفين</option>
                      <option value="parents">لأولياء الأمور</option>
                      <option value="students">للتلاميذ</option>
                      <option value="administrative">للإدارة والتسيير الداخلي</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#7B1E3A] mb-1">حالة النشر</label>
                    <select
                      value={editForm.isPublished ? 'true' : 'false'}
                      onChange={(e) => setEditForm({ ...editForm, isPublished: e.target.value === 'true' })}
                      className="w-full bg-white border border-[#C9A24D]/35 rounded-xl px-3 py-2 text-xs text-[#2B2022] focus:border-[#7B1E3A] focus:outline-none"
                    >
                      <option value="true">منشور ومتاح للتحميل</option>
                      <option value="false">مسودة (غير معروض للعامة)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7B1E3A] mb-1">وصف أو ملاحظات</label>
                  <textarea
                    rows={2}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full bg-white border border-[#C9A24D]/35 rounded-xl px-3.5 py-2 text-xs text-[#2B2022] focus:border-[#7B1E3A] focus:outline-none"
                  />
                </div>

                {/* Optional Replacement PDF */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#7B1E3A]">استبدال ملف PDF (اختياري)</label>
                    <span className="text-[10px] text-[#2B2022]/60 font-mono">
                      الملف الحالي: {editingDoc.originalName || editingDoc.fileName}
                    </span>
                  </div>
                  <div className="border border-dashed border-[#C9A24D]/40 rounded-2xl p-3 text-center bg-white/60 hover:bg-[#F3E9DC]/30 transition-colors">
                    <input
                      type="file"
                      id="editDocFile"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) setEditForm({ ...editForm, file });
                      }}
                    />
                    <label htmlFor="editDocFile" className="cursor-pointer block space-y-1">
                      <Upload className="w-5 h-5 text-[#C9A24D] mx-auto" />
                      {editForm.file ? (
                        <p className="text-xs font-bold text-emerald-700">سيتم استبدال الملف بـ: {editForm.file.name}</p>
                      ) : (
                        <p className="text-xs text-[#2B2022]/70 font-medium">
                          انقر لاختيار ملف PDF جديد بديل (أو اتركه فارغاً للاحتفاظ بالملف الحالي)
                        </p>
                      )}
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#C9A24D]/20">
                  <button
                    type="submit"
                    disabled={loadingAction}
                    className="flex-1 py-2.5 px-4 bg-[#7B1E3A] hover:bg-[#62162d] disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer border border-[#C9A24D]/30"
                  >
                    {loadingAction ? 'جاري حفظ التعديلات...' : 'حفظ التعديلات'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingDoc(null)}
                    className="py-2.5 px-4 bg-white hover:bg-[#F3E9DC] border border-[#C9A24D]/30 text-[#2B2022]/70 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
