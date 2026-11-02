import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Eye,
  EyeOff,
  XCircle,
  RefreshCw,
  Search,
  MessageSquare,
  FileText,
  User,
  Clock,
  ExternalLink,
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const roleLabels = {
  admin: 'المدير العام',
  school: 'الإدارة',
  general_supervisor: 'مراقب عام',
  pedagogical_supervisor: 'مراقب تربوي',
  teacher: 'أستاذ',
  student: 'تلميذ',
  parent: 'ولي أمر',
  receptionist: 'استقبال',
};

export default function ReportedMessagesManager() {
  const { accessToken } = useAuthStore();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [resolvingKey, setResolvingKey] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = accessToken || localStorage.getItem('zitouni_access_token') || localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/messages/reported`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setReports(res.data || []);
    } catch (err) {
      console.error('Failed to fetch reported messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleResolve = async (messageId, reportId, action, status) => {
    const key = `${messageId}_${reportId}_${action}`;
    setResolvingKey(key);
    try {
      const token = accessToken || localStorage.getItem('zitouni_access_token') || localStorage.getItem('token');
      const res = await axios.patch(
        `${API_URL}/messages/${messageId}/reports/${reportId}`,
        { action, status },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      // Instant optimistic state update
      const updatedMsg = res.data?.messageData;
      if (updatedMsg) {
        setReports((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, ...updatedMsg } : m))
        );
      }

      setActionSuccess('تم تنفيذ الإجراء بنجاح وتحديث حالة الرسالة والبلاغ.');
      setTimeout(() => setActionSuccess(''), 4000);
      fetchReports();
    } catch (err) {
      alert('فشل في معالجة البلاغ: ' + (err.response?.data?.message || err.message));
    } finally {
      setResolvingKey(null);
    }
  };

  // Flatten reports with message reference
  const reportItems = [];
  reports.forEach((msg) => {
    (msg.reports || []).forEach((rep) => {
      reportItems.push({
        report: rep,
        message: msg,
      });
    });
  });

  const filteredItems = reportItems.filter((item) => {
    if (filterStatus !== 'all' && item.report.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const senderName = `${item.message.sender?.firstName || ''} ${item.message.sender?.lastName || ''}`.toLowerCase();
      const reporterName = `${item.report.reporter?.firstName || ''} ${item.report.reporter?.lastName || ''}`.toLowerCase();
      const content = (item.message.content || '').toLowerCase();
      const reason = (item.report.reason || '').toLowerCase();
      return senderName.includes(q) || reporterName.includes(q) || content.includes(q) || reason.includes(q);
    }
    return true;
  });

  const pendingCount = reportItems.filter((i) => i.report.status === 'pending').length;
  const actionTakenCount = reportItems.filter((i) => i.report.status === 'action_taken').length;
  const dismissedCount = reportItems.filter((i) => i.report.status === 'dismissed').length;

  return (
    <div dir="rtl" className="space-y-6 font-sans">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border border-[#C9A24D]/30 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-[#7B1E3A]">
              قسم الرسائل المبلغ عنها والمحتوى المخالف
            </h2>
            <p className="text-xs text-[#2B2022]/70 font-medium">
              معالجة شكاوى المستخدمين وإخفاء أو حذف الرسائل المخالفة لدفتر شروط المؤسسة (المادتان 18 و19)
            </p>
          </div>
        </div>

        <button
          onClick={fetchReports}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#C9A24D]/40 bg-[#F3E9DC] hover:bg-[#ebdcc7] text-[#7B1E3A] font-bold text-xs transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث البلاغات</span>
        </button>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-amber-300/80 shadow-xs space-y-1">
          <span className="text-xs text-amber-800 font-bold block">بلاغات قيد المعالجة (Pending)</span>
          <div className="text-3xl font-black font-serif text-amber-600">{pendingCount}</div>
          <span className="text-[10px] text-slate-500 block">تتطلب تدخلاً إدارياً فورياً</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-rose-300/80 shadow-xs space-y-1">
          <span className="text-xs text-rose-800 font-bold block">مخالفات تم اتخاذ إجراء بشأنها</span>
          <div className="text-3xl font-black font-serif text-rose-600">{actionTakenCount}</div>
          <span className="text-[10px] text-slate-500 block">تم إخفاء أو حذف محتواها</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-300 shadow-xs space-y-1">
          <span className="text-xs text-slate-700 font-bold block">بلاغات محفوظة / مرفوضة</span>
          <div className="text-3xl font-black font-serif text-slate-700">{dismissedCount}</div>
          <span className="text-[10px] text-slate-500 block">لا تتضمن مخالفة لشروط الاستخدام</span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 bg-white border border-[#C9A24D]/30 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في محتوى الرسالة، المرسل، أو المبلّغ..."
            className="w-full pr-9 pl-3 py-2 text-xs bg-[#FDFBF7] border border-[#C9A24D]/30 rounded-xl focus:outline-none focus:border-[#7B1E3A] text-[#2B2022]"
          />
        </div>

        <div className="flex items-center gap-2">
          {['all', 'pending', 'action_taken', 'dismissed'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === st
                  ? 'bg-[#7B1E3A] text-white shadow-xs'
                  : 'bg-[#F3E9DC] text-[#7B1E3A] hover:bg-[#ebdcc7]'
              }`}
            >
              {st === 'all' && 'الكل'}
              {st === 'pending' && 'قيد الانتظار'}
              {st === 'action_taken' && 'تم اتخاذ إجراء'}
              {st === 'dismissed' && 'محفوظ'}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center bg-white border border-[#C9A24D]/30 rounded-3xl">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#7B1E3A]" />
            <p className="text-xs text-slate-500">جاري تحميل تقارير البلاغات...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center bg-white border border-[#C9A24D]/30 rounded-3xl space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-[#7B1E3A] text-base">لا توجد بلاغات مطابقة</h4>
            <p className="text-xs text-slate-500">جميع المحادثات والرسائل تلتزم بقواعد وميثاق المنصة المدرسية.</p>
          </div>
        ) : (
          filteredItems.map(({ report, message }) => {
            const isPending = report.status === 'pending';
            const isActionTaken = report.status === 'action_taken';
            const isDismissed = report.status === 'dismissed';

            return (
              <div
                key={report._id}
                className="p-5 sm:p-6 bg-white border border-[#C9A24D]/35 rounded-3xl shadow-xs space-y-4"
              >
                {/* Header: Reporter vs Sender */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#C9A24D]/25">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#7B1E3A]">
                          بواسطة: {report.reporter?.firstName} {report.reporter?.lastName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 border">
                          {roleLabels[report.reporter?.role] || report.reporter?.role}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        تاريخ البلاغ: {new Date(report.reportedAt).toLocaleString('ar-DZ')}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isPending && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                        قيد المعالجة (Pending)
                      </span>
                    )}
                    {isActionTaken && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">
                        تم اتخاذ الإجراء (معاقب)
                      </span>
                    )}
                    {isDismissed && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                        تم حفظ البلاغ
                      </span>
                    )}
                  </div>
                </div>

                {/* Reason & Details */}
                <div className="p-3.5 bg-rose-50/60 border border-rose-200/80 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>سبب البلاغ: {report.reason}</span>
                  </div>
                  {report.details && (
                    <p className="text-slate-700 text-xs pr-6">{report.details}</p>
                  )}
                </div>

                {/* The Reported Message Content */}
                <div className="p-4 bg-[#FDFBF7] border border-[#C9A24D]/30 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold text-[#2B2022]">
                      محتوى الرسالة من: {message.sender?.firstName} {message.sender?.lastName} (
                      {roleLabels[message.sender?.role] || message.sender?.role})
                    </span>
                    <span className="font-mono text-[10px]" dir="ltr">
                      {new Date(message.createdAt).toLocaleString('ar-DZ')}
                    </span>
                  </div>

                  <p className="text-xs text-[#2B2022] leading-relaxed whitespace-pre-wrap font-sans">
                    {message.content}
                  </p>

                  {/* Attachment if present */}
                  {message.attachmentUrl && (
                    <div className="pt-2">
                      {message.attachmentUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                        <img
                          src={message.attachmentUrl}
                          alt=""
                          className="max-h-40 rounded-xl border border-[#C9A24D]/30 object-cover"
                        />
                      ) : message.attachmentUrl.match(/\.(mp4|webm|mov)$/i) ? (
                        <video src={message.attachmentUrl} controls className="max-h-40 rounded-xl" />
                      ) : (
                        <a
                          href={message.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#C9A24D]/40 rounded-xl text-xs font-bold text-[#7B1E3A]"
                        >
                          <FileText className="w-4 h-4" />
                          <span>عرض الملف المرفق (PDF)</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-400 border-t border-[#C9A24D]/20">
                    <span>نوع المحادثة: {message.conversationType === 'group' ? 'مجموعة / فوج' : 'مباشرة'}</span>
                    {message.isHidden && <span className="text-amber-700 font-bold">• مخفية عن الطرف الآخر</span>}
                    {message.isDeleted && <span className="text-rose-700 font-bold">• محذوفة</span>}
                  </div>
                </div>

                {/* Moderator Actions */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                  {/* Hide / Unhide Toggle */}
                  <button
                    type="button"
                    disabled={resolvingKey !== null}
                    onClick={() =>
                      handleResolve(
                        message._id,
                        report._id,
                        message.isHidden ? 'unhide' : 'hide',
                        'action_taken'
                      )
                    }
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50 ${
                      message.isHidden
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                    }`}
                  >
                    {resolvingKey === `${message._id}_${report._id}_${message.isHidden ? 'unhide' : 'hide'}` ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : message.isHidden ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                    <span>{message.isHidden ? 'إلغاء الإخفاء (إظهار)' : 'إخفاء الرسالة'}</span>
                  </button>

                  {/* Delete / Restore Toggle */}
                  <button
                    type="button"
                    disabled={resolvingKey !== null}
                    onClick={() =>
                      handleResolve(
                        message._id,
                        report._id,
                        message.isDeleted ? 'restore' : 'delete',
                        message.isDeleted ? 'pending' : 'action_taken'
                      )
                    }
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50 ${
                      message.isDeleted
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-rose-700 hover:bg-rose-800 text-white'
                    }`}
                  >
                    {resolvingKey === `${message._id}_${report._id}_${message.isDeleted ? 'restore' : 'delete'}` ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : message.isDeleted ? (
                      <RefreshCw className="w-4 h-4" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span>{message.isDeleted ? 'استرجاع الرسالة المحذوفة' : 'حذف الرسالة نهائياً'}</span>
                  </button>

                  {/* Dismiss / Reopen Toggle */}
                  <button
                    type="button"
                    disabled={resolvingKey !== null}
                    onClick={() =>
                      handleResolve(
                        message._id,
                        report._id,
                        isDismissed ? 'reopen' : 'dismiss',
                        isDismissed ? 'pending' : 'dismissed'
                      )
                    }
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {resolvingKey === `${message._id}_${report._id}_${isDismissed ? 'reopen' : 'dismiss'}` ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    <span>{isDismissed ? 'إعادة فتح البلاغ' : 'حفظ البلاغ (لا توجد مخالفة)'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
