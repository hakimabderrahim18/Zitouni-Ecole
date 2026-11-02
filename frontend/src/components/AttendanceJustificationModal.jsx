import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, FileText, CheckCircle2, XCircle, ExternalLink, RefreshCw } from 'lucide-react';

export default function AttendanceJustificationModal({ isOpen, onClose, attendanceRecord, student, onReviewed }) {
  const [decision, setDecision] = useState('Approved');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !attendanceRecord) return null;

  const studentName = student?.firstNameArabic && student?.lastNameArabic
    ? `${student.firstNameArabic} ${student.lastNameArabic}`
    : `${student?.user?.firstName || ''} ${student?.user?.lastName || ''}`.trim() || 'التلميذ';

  const handleReview = async (chosenDecision) => {
    try {
      setSubmitting(true);
      setErrorMsg('');
      await axios.put(`/api/attendance/${attendanceRecord._id}/review-justification`, {
        decision: chosenDecision,
        remarks: reviewRemarks,
      });

      setSubmitting(false);
      if (onReviewed) onReviewed();
      onClose();
    } catch (err) {
      console.error('Failed to review justification', err);
      setErrorMsg(err.response?.data?.message || 'فشل معالجة التبرير');
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
              <ShieldCheck className="w-5 h-5 text-[#7B1E3A]" />
              <h3 className="font-serif font-black text-sm text-[#7B1E3A]">
                معالجة تبرير الغياب (المادة 26)
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-xl bg-white hover:bg-slate-100 text-slate-500 cursor-pointer border border-[#C9A24D]/30"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-4 text-xs text-[#2B2022]">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-50 text-red-800 border border-red-200 font-bold">
                {errorMsg}
              </div>
            )}

            <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
              <span className="text-slate-400 block text-[10px]">التلميذ المعني:</span>
              <p className="font-bold text-sm text-[#7B1E3A]">{studentName}</p>
              <span className="text-slate-500 font-mono text-[11px] block">
                تاريخ الغياب: {new Date(attendanceRecord.date).toLocaleDateString('ar-DZ')} (الحصة: {attendanceRecord.session})
              </span>
            </div>

            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
              <span className="text-blue-900 block font-bold text-[11px]">نص التبرير المقدم:</span>
              <p className="text-slate-700 bg-white p-2.5 rounded-lg border font-medium">
                {attendanceRecord.justificationReason || 'لم يتم إدراج نص توضيحي.'}
              </p>

              {attendanceRecord.justificationAttachmentUrl && (
                <div className="pt-1">
                  <a
                    href={attendanceRecord.justificationAttachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-blue-700 font-bold hover:bg-blue-50 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>معاينة الوثيقة المرفقة (شهادة طبية / مبرر خطي)</span>
                  </a>
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                ملاحظات المشرف التربوي / الإدارة:
              </label>
              <textarea
                rows={2}
                value={reviewRemarks}
                onChange={e => setReviewRemarks(e.target.value)}
                placeholder="مثال: تم قبول الشهادة الطبية وتبرير الغياب رسمياً..."
                className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#7B1E3A]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleReview('Rejected')}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-800 border border-red-300 rounded-xl font-bold cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-4 h-4 text-red-600" />
                <span>رفض التبرير (غير مبرر)</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleReview('Approved')}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                )}
                <span>قبول التبرير (غياب مبرر)</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
