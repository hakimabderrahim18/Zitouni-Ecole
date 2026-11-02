import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, AlertTriangle, Calendar, Clock, CheckCircle2, RefreshCw } from 'lucide-react';

export default function TeacherResignationModal({ isOpen, onClose, teacherId, teacherName, onResignationSaved }) {
  const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [noticeDays, setNoticeDays] = useState(30);
  const [reason, setReason] = useState('ظروف شخصية');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const calculateEffectiveDate = () => {
    try {
      const d = new Date(submissionDate);
      d.setDate(d.getDate() + Number(noticeDays));
      return d.toLocaleDateString('ar-DZ');
    } catch (e) {
      return '—';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg('');
      const res = await axios.post(`/api/admin/teachers/${teacherId}/resignation`, {
        submissionDate,
        noticeDays: Number(noticeDays),
        reason,
        notes,
      });

      setSuccessMsg(res.data?.message || 'تم تسجيل طلب الاستقالة وبدء مدة الإشعار بنجاح.');
      setSubmitting(false);
      if (onResignationSaved) onResignationSaved();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Failed to submit resignation', err);
      setErrorMsg(err.response?.data?.message || 'فشل حفظ طلب الاستقالة');
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-white border border-[#C9A24D]/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-right font-sans"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-[#F3E9DC] border-b border-[#C9A24D]/30">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#7B1E3A]" />
              <div>
                <h3 className="font-serif font-black text-sm text-[#7B1E3A]">
                  تسجيل طلب الاستقالة ومدة الإشعار (المادة 24)
                </h3>
                <span className="text-[10px] text-slate-600 block">
                  متابعة قانونية لفترة الإخطار المسبق (Préavis) وإنهاء العلاقة المهنية
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-xl bg-white hover:bg-slate-100 text-slate-500 cursor-pointer border border-[#C9A24D]/30"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-[#2B2022]">
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 text-red-800 border border-red-300 font-bold">
                {errorMsg}
              </div>
            )}

            <div className="p-3 bg-slate-50 border rounded-xl">
              <span className="text-slate-400 block text-[10px]">الأستاذ المعني:</span>
              <p className="font-bold text-sm text-[#7B1E3A]">{teacherName || 'الأستاذ'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  تاريخ استلام طلب الاستقالة:
                </label>
                <input
                  type="date"
                  required
                  value={submissionDate}
                  onChange={e => setSubmissionDate(e.target.value)}
                  className="w-full bg-slate-50 border rounded-xl p-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  مدة الإشعار القانونية (أيام):
                </label>
                <select
                  value={noticeDays}
                  onChange={e => setNoticeDays(Number(e.target.value))}
                  className="w-full bg-slate-50 border rounded-xl p-2 text-xs font-bold"
                >
                  <option value={30}>30 يوماً (1 شهر - قياسي)</option>
                  <option value={60}>60 يوماً (شهران - إداري/تأطير)</option>
                  <option value={15}>15 يوماً (استثنائي)</option>
                  <option value={0}>إعفاء فوري من مدة الإشعار</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl space-y-1">
              <span className="text-amber-800 block text-[10px] font-bold">تاريخ السريان والنهاية الفعلية للعقد:</span>
              <span className="font-bold text-sm text-[#7B1E3A] font-mono block">
                {calculateEffectiveDate()}
              </span>
              <span className="text-[10px] text-slate-600">
                يبقى الأستاذ ملزماً بأداء حصصه ومهامه البيداغوجية طيلة فترة الإشعار وفق المادة 24.
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">سبب الاستقالة:</label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="مثال: التفرغ لدراسات عليا، تغيير مقر السكن، ظروف صحية..."
                className="w-full bg-slate-50 border rounded-xl p-2 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">ملاحظات وقرار الإدارة:</label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="ملاحظات توثق في سجل التدقيق الإداري..."
                className="w-full bg-slate-50 border rounded-xl p-2 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-[#7B1E3A] hover:bg-[#60162c] text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-[#C9A24D]" />}
                <span>تسجيل طلب الاستقالة وبدء الإشعار</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
