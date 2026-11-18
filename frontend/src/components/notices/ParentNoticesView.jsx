import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Megaphone,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Bell,
  Mail,
  AlertTriangle,
  User,
} from 'lucide-react';

export default function ParentNoticesView() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/parent-notices/parent/my-notices');
      setNotices(res.data.notices || []);
    } catch (err) {
      console.error('Error fetching parent notices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`/api/parent-notices/${id}/read`);
      setNotices((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Error marking notice read:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2 flex-wrap">
            <span>مراسلات الإدارة ومواعيد الاستقبال</span>
            <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 shadow-2xs">
              صندوق الرسائل الرسمية
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">
            الاستدعاءات، مواعيد أيام استقبال الأولياء، والإعلانات الإدارية الموجهة إليكم.
          </p>
        </div>

        <button
          onClick={fetchNotices}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>تحديث الرسائل</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500 font-medium">
          <Sparkles className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
          جاري تحميل المراسلات...
        </div>
      ) : notices.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-600 shadow-sm font-medium">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">لا توجد رسائل أو استدعاءات جديدة</h3>
          <p className="text-xs text-gray-500 mt-1">
            سيتم إشعاركم فور إصدار الإدارة لأي موعد استقبال أو استدعاء أو إعلان رسمي.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => {
            const isUnread = !notice.isRead;

            return (
              <div
                key={notice._id}
                className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-sm space-y-4 ${
                  isUnread
                    ? 'bg-white border-s-4 border-s-brand-600 border-gray-200 shadow-md shadow-brand-500/5'
                    : 'bg-white border-gray-200 opacity-95'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black border ${
                        notice.noticeType === 'reception'
                          ? 'bg-brand-50 text-brand-700 border-brand-200 shadow-2xs'
                          : notice.noticeType === 'summons'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-2xs'
                          : notice.noticeType === 'reminder'
                          ? 'bg-amber-50 text-amber-800 border-amber-200 shadow-2xs'
                          : 'bg-sky-50 text-sky-700 border-sky-200 shadow-2xs'
                      }`}
                    >
                      {notice.noticeType === 'reception' && 'موعد استقبال أولياء'}
                      {notice.noticeType === 'summons' && 'استدعاء رسمي'}
                      {notice.noticeType === 'announcement' && 'إعلان إداري'}
                      {notice.noticeType === 'reminder' && 'تذكير'}
                      {notice.noticeType === 'warning' && 'تنبيه تربوي'}
                      {notice.noticeType === 'general' && 'رسالة عامة'}
                    </span>

                    {isUnread && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-brand-600 text-white animate-pulse">
                        جديد
                      </span>
                    )}

                    <h3 className="text-sm sm:text-base font-black text-gray-900">{notice.title}</h3>
                  </div>

                  <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200 self-start sm:self-auto flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    {new Date(notice.sentAt).toLocaleDateString('ar-DZ', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                {/* Message Body (Crystal clear text on light background) */}
                <p className="text-xs sm:text-sm text-gray-800 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-200 whitespace-pre-wrap font-sans font-medium">
                  {notice.content}
                </p>

                {/* Appointment Box (If applicable) */}
                {notice.appointmentDate && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 font-black text-amber-950 text-xs sm:text-sm">
                        <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>موعد الحضور والاستقبال: {new Date(notice.appointmentDate).toLocaleDateString('ar-DZ')}</span>
                        {notice.appointmentEndTime && <span className="text-amber-800 font-mono font-bold">(إلى غاية {notice.appointmentEndTime})</span>}
                      </div>
                      <div className="flex items-center gap-2 text-amber-900">
                        <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>مكان اللقاء: <strong className="font-bold">{notice.appointmentLocation || 'مقر المؤسسة'}</strong></span>
                      </div>
                    </div>

                    <span className="text-[11px] text-amber-950 font-bold bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-300 w-full sm:w-auto text-center">
                      يرجى الالتزام بالموعد المحدد
                    </span>
                  </div>
                )}

                {/* Footer and Mark Read */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs pt-3 border-t border-gray-100">
                  <span className="text-gray-600 text-xs">المرسل: <strong className="text-gray-900 font-bold">{notice.senderName || 'إدارة المدرسة'}</strong></span>

                  {isUnread && (
                    <button
                      onClick={() => handleMarkAsRead(notice._id)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      تأكيد الاطلاع
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
