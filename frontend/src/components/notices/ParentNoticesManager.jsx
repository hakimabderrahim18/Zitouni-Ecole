import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Megaphone,
  Plus,
  Send,
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  Filter,
  RotateCcw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Copy,
  X,
  FileText,
  Mail,
  Bell,
  Eye,
} from 'lucide-react';

const NOTICE_TYPES = [
  { value: 'announcement', label: 'إعلان رسمي', color: 'sky' },
  { value: 'reception', label: 'موعد استقبال الأولياء', color: 'brand' },
  { value: 'summons', label: 'استدعاء ولي أمر', color: 'rose' },
  { value: 'reminder', label: 'تذكير بموعد', color: 'amber' },
  { value: 'warning', label: 'تنبيه تربوي', color: 'orange' },
  { value: 'general', label: 'رسالة عامة', color: 'slate' },
];

export default function ParentNoticesManager() {
  const [notices, setNotices] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, sent: 0, scheduled: 0 });
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    noticeType: 'announcement',
    targetAudience: 'all', // 'all' | 'cycle' | 'class' | 'specific_parents'
    targetCycle: '',
    targetClass: '',
    sendType: 'immediate', // 'immediate' | 'scheduled'
    scheduledDate: '',
    appointmentDate: '',
    appointmentEndTime: '',
    appointmentLocation: 'مقر المؤسسة - قاعة الاستقبال الكبرى',
  });

  // Notice Details View
  const [selectedNoticeDetails, setSelectedNoticeDetails] = useState(null);

  useEffect(() => {
    fetchNotices();
    fetchClasses();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/parent-notices/admin/all');
      setNotices(res.data.notices || []);
      if (res.data.metrics) setMetrics(res.data.metrics);
    } catch (err) {
      console.error('Error fetching parent notices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await axios.get('/api/admin/classes');
      setClasses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  // Pre-fill Official Reception Day Template (Section 8.2)
  const applyReceptionDayTemplate = () => {
    const today = new Date();
    const nextSaturday = new Date(today.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7 || 7)));
    const dateStr = nextSaturday.toLocaleDateString('ar-DZ', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    setFormData((prev) => ({
      ...prev,
      title: 'برمجة يوم استقبال أولياء التلاميذ',
      noticeType: 'reception',
      targetAudience: 'all',
      content: `تعلم إدارة مؤسسة حبر وألوان أولياء التلاميذ الكرام أنه سيتم استقبالهم يوم ${dateStr}، من الساعة 09:00 إلى 13:00، وذلك من أجل متابعة الوضعية الدراسية والتربوية الشاملة لأبنائهم. مرحباً بجميع الأولياء الكرام.`,
      appointmentDate: nextSaturday.toISOString().slice(0, 10),
      appointmentEndTime: '13:00',
      appointmentLocation: 'مقر المؤسسة - قاعة الاستقبال الكبرى',
    }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('يرجى كتابة عنوان الرسالة ونصها بالتفصيل.');
      return;
    }

    if (formData.sendType === 'scheduled' && !formData.scheduledDate) {
      alert('يرجى تحديد تاريخ ووقت الإرسال المجدول.');
      return;
    }

    setCreating(true);
    try {
      await axios.post('/api/parent-notices', formData);
      alert(formData.sendType === 'scheduled' ? 'تمت جدولة إرسال الرسالة بنجاح.' : 'تم إرسال الرسالة للأولياء بنجاح.');
      setShowCreateModal(false);
      resetForm();
      fetchNotices();
    } catch (err) {
      alert(err.response?.data?.message || 'حدث خطأ أثناء إرسال الرسالة.');
    } finally {
      setCreating(false);
    }
  };

  const handleResend = async (id) => {
    if (!window.confirm('هل ترغب في إعادة إرسال هذه الرسالة للأولياء فوراً؟')) return;
    try {
      await axios.post(`/api/parent-notices/${id}/resend`);
      alert('تمت إعادة إرسال الرسالة بنجاح.');
      fetchNotices();
    } catch (err) {
      alert(err.response?.data?.message || 'فشلت إعادة الإرسال.');
    }
  };

  const handleCancelScheduled = async (id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء هذه الرسالة المجدولة؟')) return;
    try {
      await axios.put(`/api/parent-notices/${id}/cancel`);
      fetchNotices();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل إلغاء الرسالة.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الرسالة من السجل؟')) return;
    try {
      await axios.delete(`/api/parent-notices/${id}`);
      fetchNotices();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل حذف الرسالة.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      noticeType: 'announcement',
      targetAudience: 'all',
      targetCycle: '',
      targetClass: '',
      sendType: 'immediate',
      scheduledDate: '',
      appointmentDate: '',
      appointmentEndTime: '',
      appointmentLocation: 'مقر المؤسسة - قاعة الاستقبال الكبرى',
    });
  };

  const filteredNotices = notices.filter((n) => {
    if (filterType !== 'all' && n.noticeType !== filterType) return false;
    if (filterStatus !== 'all' && n.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!n.title?.toLowerCase().includes(q) && !n.content?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & KPI Metrics */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-50 border border-brand-200 text-brand-700">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                مراسلات الإدارة وإشعارات الأولياء
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  وحدة التواصل الرسمي
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                إرسال الاستدعاءات، مواعيد الاستقبال، والرسائل المنظمة للأولياء مع خاصية الجدولة الآلية.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-md shadow-brand-600/20 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          إنشاء رسالة أو إعلان رسمي
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 font-bold block">إجمالي المراسلات الصادرة</span>
          <span className="text-2xl font-black text-slate-800 mt-1 block">{metrics.total}</span>
        </div>

        <div className="bg-white border border-emerald-200 p-4 rounded-2xl shadow-sm bg-gradient-to-br from-white to-emerald-50/30">
          <span className="text-xs text-emerald-700 font-bold block">الرسائل المرسلة بنجاح</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{metrics.sent}</span>
        </div>

        <div className="bg-white border border-amber-200 p-4 rounded-2xl shadow-sm bg-gradient-to-br from-white to-amber-50/30">
          <span className="text-xs text-amber-700 font-bold block">الرسائل المجدولة مستقبلاً</span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">{metrics.scheduled}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث في الرسائل والإعلانات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl ps-9 pe-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-brand-500"
            >
              <option value="all">جميع الأنواع</option>
              {NOTICE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-brand-500"
            >
              <option value="all">جميع الحالات</option>
              <option value="sent">مرسلة</option>
              <option value="scheduled">مجدولة</option>
              <option value="cancelled">ملغاة</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchNotices}
          className="text-xs text-brand-700 hover:text-brand-800 font-bold flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          تحديث
        </button>
      </div>

      {/* Notices Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotices.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-sm">
            لا توجد مراسلات مطابقة للبحث حالياً.
          </div>
        ) : (
          filteredNotices.map((notice) => {
            const typeConfig = NOTICE_TYPES.find((t) => t.value === notice.noticeType) || NOTICE_TYPES[0];

            return (
              <div
                key={notice._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:border-brand-300 hover:shadow-md transition-all shadow-sm group"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        typeConfig.value === 'reception'
                          ? 'bg-brand-50 text-brand-700 border-brand-200'
                          : typeConfig.value === 'summons'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : typeConfig.value === 'reminder'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-sky-50 text-sky-700 border-sky-200'
                      }`}
                    >
                      {typeConfig.label}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        notice.status === 'sent'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : notice.status === 'scheduled'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {notice.status === 'sent' && 'أُرسلت'}
                      {notice.status === 'scheduled' && 'مجدولة'}
                      {notice.status === 'cancelled' && 'ملغاة'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{notice.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{notice.content}</p>

                  {/* Appointment Card if exists */}
                  {notice.appointmentDate && (
                    <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 text-[11px] space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-amber-700" />
                        موعد اللقاء: {new Date(notice.appointmentDate).toLocaleDateString('ar-DZ')}
                        {notice.appointmentEndTime && ` (حتى ${notice.appointmentEndTime})`}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {notice.appointmentLocation || 'مقر المؤسسة'}
                      </div>
                    </div>
                  )}

                  {/* Metadata info */}
                  <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                    <div>
                      الفئة المستهدفة:{' '}
                      <span className="text-slate-800 font-semibold">
                        {notice.targetAudience === 'all'
                          ? 'جميع الأولياء'
                          : notice.targetAudience === 'cycle'
                          ? `طور ${notice.targetCycle}`
                          : notice.targetAudience === 'class'
                          ? `قسم ${notice.targetClass?.name || ''}`
                          : 'أولياء محددين'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span>تاريخ الإرسال: {new Date(notice.sentAt || notice.createdAt).toLocaleDateString('ar-DZ')}</span>
                      <span className="text-brand-700 font-bold">
                        {notice.recipientCount || 0} ولي مستلم
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleResend(notice._id)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs border border-slate-200 transition-colors"
                      title="إعادة إرسال للجميع"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-brand-700" />
                    </button>

                    {notice.status === 'scheduled' && (
                      <button
                        onClick={() => handleCancelScheduled(notice._id)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold transition-colors"
                        title="إلغاء الإرسال المجدول"
                      >
                        إلغاء الموعد
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(notice._id)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
                      title="حذف من السجل"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedNoticeDetails(notice)}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold border border-brand-200 flex items-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    تفاصيل
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Notice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand-50 border border-brand-200 text-brand-700">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    إنشاء مراسلة / إشعار رسمي لأولياء التلاميذ
                  </h3>
                  <p className="text-xs text-slate-500">
                    مواصفات المادة 8 - تحديد المستلمين، نوع الإشعار، وجدولة الموعد
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Template Quick Button */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3.5 bg-brand-50/70 border border-brand-200/80 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-600 shrink-0" />
                  <span className="text-xs font-bold text-brand-900">
                    نموذج يوم استقبال أولياء التلاميذ (المادة 8.2)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={applyReceptionDayTemplate}
                  className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-[11px] transition-all shadow-sm shadow-brand-600/20"
                >
                  استخدام النموذج الرسمي
                </button>
              </div>

              {/* Title & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">عنوان الرسالة أو الإعلان:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: برمجة يوم استقبال أولياء التلاميذ"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">نوع الرسالة / الإشعار:</label>
                  <select
                    value={formData.noticeType}
                    onChange={(e) => setFormData({ ...formData, noticeType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-500 focus:bg-white"
                  >
                    {NOTICE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Detailed Message Body */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">نص الرسالة بالتفصيل:</label>
                <textarea
                  rows={4}
                  required
                  placeholder="اكتب نص الإعلان أو الرسالة بالتفصيل..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white leading-relaxed transition-all"
                />
              </div>

              {/* Target Audience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">الفئة المستهدفة:</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-500"
                  >
                    <option value="all">جميع الأولياء المسجلين</option>
                    <option value="cycle">طور محدد (ابتدائي / متوسط / ثانوي)</option>
                    <option value="class">قسم محدد فقط</option>
                  </select>
                </div>

                {formData.targetAudience === 'cycle' && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">اختر الطور:</label>
                    <select
                      value={formData.targetCycle}
                      onChange={(e) => setFormData({ ...formData, targetCycle: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-500"
                    >
                      <option value="">-- اختر الطور --</option>
                      <option value="primary">الطور الابتدائي</option>
                      <option value="middle">الطور المتوسط</option>
                      <option value="secondary">الطور الثانوي</option>
                    </select>
                  </div>
                )}

                {formData.targetAudience === 'class' && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">اختر القسم:</label>
                    <select
                      value={formData.targetClass}
                      onChange={(e) => setFormData({ ...formData, targetClass: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-500"
                    >
                      <option value="">-- اختر القسم --</option>
                      {classes.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {cls.name} ({cls.level})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Appointment details (if applicable) */}
              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3">
                <span className="font-bold text-amber-900 block">
                  بيانات الموعد واللقاء (في حال تضمنت الرسالة موعداً):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-amber-800 font-semibold block mb-1">تاريخ الموعد:</label>
                    <input
                      type="date"
                      value={formData.appointmentDate}
                      onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                      className="w-full bg-white border border-amber-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-amber-800 font-semibold block mb-1">وقت النهاية:</label>
                    <input
                      type="time"
                      value={formData.appointmentEndTime}
                      onChange={(e) => setFormData({ ...formData, appointmentEndTime: e.target.value })}
                      className="w-full bg-white border border-amber-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-amber-800 font-semibold block mb-1">مكان الاستقبال / الاجتماع:</label>
                    <input
                      type="text"
                      value={formData.appointmentLocation}
                      onChange={(e) => setFormData({ ...formData, appointmentLocation: e.target.value })}
                      className="w-full bg-white border border-amber-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Immediate vs Scheduled */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">توقيت الإرسال:</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                      <input
                        type="radio"
                        name="sendType"
                        value="immediate"
                        checked={formData.sendType === 'immediate'}
                        onChange={() => setFormData({ ...formData, sendType: 'immediate' })}
                        className="text-brand-600 accent-brand-600"
                      />
                      <span>إرسال فوري الآن</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                      <input
                        type="radio"
                        name="sendType"
                        value="scheduled"
                        checked={formData.sendType === 'scheduled'}
                        onChange={() => setFormData({ ...formData, sendType: 'scheduled' })}
                        className="text-brand-600 accent-brand-600"
                      />
                      <span>إرسال مجدول</span>
                    </label>
                  </div>
                </div>

                {formData.sendType === 'scheduled' && (
                  <div>
                    <label className="font-bold text-brand-700 block mb-1">موعد الإرسال المجدول:</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-brand-500 focus:bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-md shadow-brand-600/20 flex items-center gap-2 transition-all"
                >
                  <Send className="w-4 h-4" />
                  {creating ? 'جاري الإرسال...' : formData.sendType === 'scheduled' ? 'جدولة الإرسال' : 'إرسال فوري للأولياء'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedNoticeDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="text-base font-black text-slate-800">{selectedNoticeDetails.title}</h3>
              <button
                onClick={() => setSelectedNoticeDetails(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-wrap">
              {selectedNoticeDetails.content}
            </p>

            {selectedNoticeDetails.appointmentDate && (
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs space-y-1.5 text-amber-950">
                <div>
                  <strong>تاريخ ووقت الموعد: </strong>
                  {new Date(selectedNoticeDetails.appointmentDate).toLocaleDateString('ar-DZ')}
                  {selectedNoticeDetails.appointmentEndTime && ` (حتى ${selectedNoticeDetails.appointmentEndTime})`}
                </div>
                <div>
                  <strong>مكان الاستقبال: </strong>
                  {selectedNoticeDetails.appointmentLocation}
                </div>
              </div>
            )}

            <div className="text-[11px] text-slate-500 space-y-1 pt-1">
              <div>
                المرسل: <span className="text-slate-800 font-semibold">{selectedNoticeDetails.senderName}</span>
              </div>
              <div>
                تاريخ الإنشاء: {new Date(selectedNoticeDetails.createdAt).toLocaleString('ar-DZ')}
              </div>
              <div>
                عدد القراءات المسجلة: <span className="text-brand-700 font-bold">{selectedNoticeDetails.readBy?.length || 0}</span> ولي
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedNoticeDetails(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
