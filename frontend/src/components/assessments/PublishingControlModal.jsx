import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Lock,
  Calendar,
  CheckCircle2,
  Users,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  Send,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function PublishingControlModal({ assessment, isOpen, onClose, onUpdated }) {
  const [publishMode, setPublishMode] = useState(
    assessment?.publishScope && assessment?.publishScope !== 'none' ? assessment.publishScope : 'general'
  );
  const [selectedStudentIds, setSelectedStudentIds] = useState(
    (assessment?.records || []).filter((r) => r.isPublished).map((r) => r.student?._id || r.student)
  );
  const [scheduledDate, setScheduledDate] = useState(
    assessment?.scheduledPublishAt ? new Date(assessment.scheduledPublishAt).toISOString().slice(0, 16) : ''
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen || !assessment) return null;

  const records = assessment.records || [];

  const handleToggleStudent = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSelectAllStudents = () => {
    const allIds = records.map((r) => r.student?._id || r.student);
    setSelectedStudentIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedStudentIds([]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        publishMode,
        studentIds: publishMode === 'individual' ? selectedStudentIds : [],
        scheduledPublishAt: publishMode === 'scheduled' ? new Date(scheduledDate).toISOString() : null,
      };

      const res = await axios.put(`/api/assessments/admin/${assessment._id}/publish`, payload);
      alert(res.data.message || 'تم تحديث حالة نشر النتائج بنجاح.');
      if (onUpdated) onUpdated(res.data.assessment);
      onClose();
    } catch (err) {
      console.error('Error controlling publishing:', err);
      setErrorMsg(err.response?.data?.message || 'حدث خطأ أثناء تنفيذ عملية النشر.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FCFAF7] border border-[#E8DFD0] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#7B1E3A] via-[#681830] to-[#541225] border-b border-[#C9A24D]/30 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 text-[#F5E6BE] shadow-xs">
              <Globe className="w-5 h-5 text-[#F5E6BE]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white tracking-wide">
                التحكم في اعتماد ونشر النتائج للأولياء والتلاميذ
              </h3>
              <p className="text-xs text-[#F2DFBA] font-medium mt-0.5">
                {assessment.assessmentType} • {assessment.subject} ({assessment.class?.name || 'قسم'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-[#FCFAF7] text-xs">
          {/* Important Rule Banner (Art. 7) */}
          <div className="bg-[#FFF9F0] border border-[#EEDDAF] rounded-2xl p-3.5 text-xs text-[#8E6E27] leading-relaxed flex items-start gap-3 shadow-2xs">
            <AlertTriangle className="w-5 h-5 text-[#C9A24D] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#8E6E27] block mb-1 font-black">
                مبدأ عزل النشر (المادة 7 من البطاقة التقنية):
              </strong>
              إرسال الأستاذ للنقاط أو اعتماد الإدارة للكشف <strong>لا يؤدي تلقائياً إلى ظهوره</strong> في فضاء الأولياء والتلاميذ. يظل النشر قراراً إدارياً حصرياً ومستقلاً.
            </div>
          </div>

          {errorMsg && (
            <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl p-3 text-xs text-[#991B1B] font-bold">
              {errorMsg}
            </div>
          )}

          {/* Current Publishing Status */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-[#E8DFD0] text-xs shadow-2xs">
            <span className="text-[#766065] font-bold">حالة النشر الحالية:</span>
            <span
              className={`font-bold px-3 py-1 rounded-full text-[11px] border ${
                assessment.isPublished
                  ? 'bg-[#FAF2F4] text-[#7B1E3A] border-[#E7C1CB]'
                  : assessment.scheduledPublishAt
                  ? 'bg-[#FFF9F0] text-[#8E6E27] border-[#EEDDAF]'
                  : 'bg-[#FAF7F2] text-[#766065] border-[#E8DFD0]'
              }`}
            >
              {assessment.isPublished
                ? `منشور (${assessment.publishScope === 'individual' ? 'نشر فردي' : 'نشر عام'})`
                : assessment.scheduledPublishAt
                ? `مجدول للنشر الآلي`
                : 'غير منشور (محجوب عن الأولياء والتلاميذ)'}
            </span>
          </div>

          {/* Mode Selector */}
          <div>
            <label className="text-xs font-black text-[#2B2022] block mb-3">اختر خيار النشر المطلوب:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: General Publish */}
              <label
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  publishMode === 'general'
                    ? 'bg-[#FAF2F4] border-[#7B1E3A] text-[#7B1E3A] shadow-xs'
                    : 'bg-white border-[#E8DFD0] text-[#4A3A3D] hover:bg-[#FAF6F0]'
                }`}
              >
                <input
                  type="radio"
                  name="publishMode"
                  value="general"
                  checked={publishMode === 'general'}
                  onChange={() => setPublishMode('general')}
                  className="mt-1 accent-[#7B1E3A]"
                />
                <div>
                  <span className="font-black text-xs block text-[#2B2022]">نشر عام (لجميع تلاميذ القسم)</span>
                  <span className="text-[11px] text-[#766065] font-medium">
                    ظهور النتيجة فوراً في حسابات جميع أولياء وتلاميذ هذا القسم.
                  </span>
                </div>
              </label>

              {/* Option 2: Individual Publish */}
              <label
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  publishMode === 'individual'
                    ? 'bg-[#FAF2F4] border-[#7B1E3A] text-[#7B1E3A] shadow-xs'
                    : 'bg-white border-[#E8DFD0] text-[#4A3A3D] hover:bg-[#FAF6F0]'
                }`}
              >
                <input
                  type="radio"
                  name="publishMode"
                  value="individual"
                  checked={publishMode === 'individual'}
                  onChange={() => setPublishMode('individual')}
                  className="mt-1 accent-[#7B1E3A]"
                />
                <div>
                  <span className="font-black text-xs block text-[#2B2022]">نشر فردي (تلاميذ محددين)</span>
                  <span className="text-[11px] text-[#766065] font-medium">
                    نشر نتائج تلاميذ تختارهم فقط، دون إظهار نتائج بقية القسم.
                  </span>
                </div>
              </label>

              {/* Option 3: Scheduled Publish */}
              <label
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  publishMode === 'scheduled'
                    ? 'bg-[#FFF9F0] border-[#C9A24D] text-[#8E6E27] shadow-xs'
                    : 'bg-white border-[#E8DFD0] text-[#4A3A3D] hover:bg-[#FAF6F0]'
                }`}
              >
                <input
                  type="radio"
                  name="publishMode"
                  value="scheduled"
                  checked={publishMode === 'scheduled'}
                  onChange={() => setPublishMode('scheduled')}
                  className="mt-1 accent-[#C9A24D]"
                />
                <div>
                  <span className="font-black text-xs block text-[#2B2022]">نشر آلي مجدول</span>
                  <span className="text-[11px] text-[#766065] font-medium">
                    تحديد تاريخ وساعة مستقبلية للنشر التلقائي للنتائج.
                  </span>
                </div>
              </label>

              {/* Option 4: Unpublish / Hide */}
              <label
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  publishMode === 'unpublish'
                    ? 'bg-[#FEF2F2] border-[#EF4444] text-[#991B1B] shadow-xs'
                    : 'bg-white border-[#E8DFD0] text-[#4A3A3D] hover:bg-[#FAF6F0]'
                }`}
              >
                <input
                  type="radio"
                  name="publishMode"
                  value="unpublish"
                  checked={publishMode === 'unpublish'}
                  onChange={() => setPublishMode('unpublish')}
                  className="mt-1 accent-[#EF4444]"
                />
                <div>
                  <span className="font-black text-xs block text-[#2B2022]">إخفاء النتائج (سحب النشر)</span>
                  <span className="text-[11px] text-[#766065] font-medium">
                    حجب النتائج مجدداً عن الأولياء والتلاميذ مع الاحتفاظ بالسجل.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Conditional Detail: Scheduled Date Picker */}
          {publishMode === 'scheduled' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-white p-4 rounded-2xl border border-[#E8DFD0] space-y-2 shadow-2xs"
            >
              <label className="text-xs font-black text-[#2B2022] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#C9A24D]" />
                تاريخ ووقت النشر التلقائي المبرمج:
              </label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full bg-[#FDFBF7] border border-[#E8DFD0] rounded-xl px-3 py-2 text-xs text-[#2B2022] focus:outline-none focus:border-[#7B1E3A] focus:ring-1 focus:ring-[#7B1E3A]"
              />
              <span className="text-[11px] text-[#766065] block font-medium">
                سيقوم النظام بنشر النتائج وإرسال الإشعارات للأولياء فور حلول هذا التوقيت تلقائياً.
              </span>
            </motion.div>
          )}

          {/* Conditional Detail: Individual Student Selection Roster */}
          {publishMode === 'individual' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-white p-4 rounded-2xl border border-[#E8DFD0] space-y-3 shadow-2xs"
            >
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-[#2B2022] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#7B1E3A]" />
                  حدد التلاميذ المراد نشر نتائجهم: ({selectedStudentIds.length} / {records.length})
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAllStudents}
                    className="text-[11px] text-[#7B1E3A] hover:underline font-bold"
                  >
                    تحديد الكل
                  </button>
                  <span className="text-[#E8DFD0]">|</span>
                  <button
                    onClick={handleDeselectAll}
                    className="text-[11px] text-[#766065] hover:underline font-medium"
                  >
                    إلغاء التحديد
                  </button>
                </div>
              </div>

              <div className="max-h-52 overflow-y-auto divide-y divide-[#F4EFEA] border border-[#E8DFD0] rounded-xl bg-white">
                {records.map((r, i) => {
                  const sId = r.student?._id || r.student;
                  const isChecked = selectedStudentIds.includes(sId);
                  const st = r.student || {};
                  const u = st.user || {};
                  const name =
                    `${u.firstNameArabic || u.firstName || ''} ${u.lastNameArabic || u.lastName || ''}`.trim() ||
                    `تلميذ ${i + 1}`;

                  return (
                    <label
                      key={sId}
                      className="p-2.5 px-3 flex items-center justify-between text-xs hover:bg-[#FDFBF7] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleStudent(sId)}
                          className="rounded border-[#E8DFD0] text-[#7B1E3A] focus:ring-0 w-4 h-4 accent-[#7B1E3A]"
                        />
                        <span className="font-bold text-[#2B2022]">{name}</span>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-[#7B1E3A]">
                        {r.isAbsent ? 'غائب' : `${r.grade != null ? r.grade : '--'} / 20`}
                      </span>
                    </label>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#F7F2EA] border-t border-[#E8DFD0] flex justify-end items-center gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white border border-[#D5C9B8] hover:bg-[#EFE8DC] text-[#4A3A3D] text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-[#7B1E3A] to-[#60142B] hover:from-[#60142B] hover:to-[#480E20] text-white text-xs font-black transition-all shadow-md shadow-[#7B1E3A]/25 border border-[#C9A24D]/40 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <Sparkles className="w-4 h-4 animate-spin" />
            ) : publishMode === 'unpublish' ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            تأكيد قرار النشر
          </button>
        </div>
      </div>
    </div>
  );
}
