import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  GraduationCap,
  Download,
  Calendar,
  BookOpen,
  Award,
  CheckCircle2,
  FileText,
  RotateCcw,
  Sparkles,
  Users,
} from 'lucide-react';
import { openAuthorizedUrl } from '../../utils/fileDownload';

export default function ParentGradesView() {
  const [childrenResults, setChildrenResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/assessments/parent/children-results');
      setChildrenResults(res.data.childrenResults || []);
    } catch (err) {
      console.error('Error fetching parent children results:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReportCard = (assessmentId, studentId) => {
    openAuthorizedUrl(`/api/assessments/${assessmentId}/export/pdf?type=individual&studentId=${studentId}`);
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-400">
        <Sparkles className="w-6 h-6 animate-spin mx-auto text-brand-400 mb-2" />
        جاري تحميل كشوف نقاط الأبناء...
      </div>
    );
  }

  if (childrenResults.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-luxury-border/40 rounded-2xl p-8 text-center text-slate-400">
        <GraduationCap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-200">لا توجد نتائج منشورة حالياً</h3>
        <p className="text-xs text-slate-500 mt-1">
          ستظهر نتائج الفروض والتقييمات هنا فور اعتمادها ونشرها رسمياً من طرف إدارة المؤسسة.
        </p>
      </div>
    );
  }

  const activeChild = childrenResults[selectedChildIndex] || childrenResults[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2 flex-wrap">
            <span>كشوف النقاط والنتائج المدرسية</span>
            <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 shadow-2xs">
              فضاء الأولياء
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">
            الاطلاع الحصري على النتائج المعتمدة والمنشورة رسمياً من طرف الإدارة لأبنائكم فقط.
          </p>
        </div>

        <button
          onClick={fetchResults}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>تحديث النتائج</span>
        </button>
      </div>

      {/* Children Tabs (if more than 1 child) */}
      {childrenResults.length > 1 && (
        <div className="flex gap-2.5 border-b border-gray-200 pb-3 overflow-x-auto scrollbar-none">
          {childrenResults.map((child, idx) => (
            <button
              key={child.childId}
              onClick={() => setSelectedChildIndex(idx)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 shrink-0 cursor-pointer ${
                selectedChildIndex === idx
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25 ring-2 ring-brand-600/20'
                  : 'bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50 border border-gray-300 shadow-2xs'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{child.childName}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                selectedChildIndex === idx
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {child.className}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Results for Active Child */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <span className="font-black text-gray-900 text-sm sm:text-base">
            التلميذ: {activeChild.childName} — القسم: {activeChild.className}
          </span>
          <span className="font-extrabold bg-brand-50 text-brand-700 border border-brand-200 px-3 py-1 rounded-full text-xs self-start sm:self-auto shadow-2xs">
            {activeChild.assessments?.length || 0} تقييم منشور
          </span>
        </div>

        {activeChild.assessments?.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-600 shadow-sm font-medium text-sm">
            لم يتم نشر أية نتائج لهذا التلميذ حتى الآن.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeChild.assessments.map((a, i) => {
              const isPass = !a.isAbsent && a.grade != null && a.grade >= 10;

              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 flex flex-col justify-between hover:border-brand-300 hover:shadow-lg transition-all shadow-sm space-y-4"
                >
                  <div className="space-y-3.5">
                    {/* Top Badges */}
                    <div className="flex justify-between items-center gap-2">
                      <span className="px-3.5 py-1 rounded-full text-xs font-black bg-brand-50 text-brand-700 border border-brand-200 shadow-2xs">
                        {a.subject}
                      </span>
                      <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        {a.assessmentDate ? new Date(a.assessmentDate).toLocaleDateString('ar-DZ') : ''}
                      </span>
                    </div>

                    {/* Assessment Title */}
                    <h4 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                      {a.assessmentType}
                    </h4>

                    {/* Premium High-Contrast Score Box */}
                    <div
                      className={`p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white shadow-md ${
                        a.isAbsent
                          ? 'bg-gradient-to-br from-rose-600 to-red-700 shadow-rose-600/20'
                          : isPass
                          ? 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-emerald-600/20'
                          : 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20'
                      }`}
                    >
                      <div>
                        <span className="text-xs text-white/90 block font-semibold">العلامة المحصل عليها:</span>
                        <div className="text-3xl sm:text-4xl font-black mt-1 tracking-tight text-white drop-shadow-xs">
                          {a.isAbsent ? 'غائب / Absent' : `${a.grade != null ? a.grade : '--'} / ${a.maxGrade || 20}`}
                        </div>
                      </div>

                      <div className="text-right sm:text-left text-xs font-mono space-y-1.5 bg-black/20 backdrop-blur-md p-3 rounded-xl border border-white/20 w-full sm:w-auto">
                        <div className="flex sm:block justify-between gap-4">
                          <span className="text-white/80">معدل القسم:</span> <strong className="font-extrabold text-white text-sm">{a.classAverage}</strong>
                        </div>
                        <div className="flex sm:block justify-between gap-4">
                          <span className="text-white/80">أعلى علامة:</span> <strong className="font-extrabold text-emerald-200 text-sm">{a.classMax}</strong>
                        </div>
                        <div className="flex sm:block justify-between gap-4">
                          <span className="text-white/80">أدنى علامة:</span> <strong className="font-extrabold text-rose-200 text-sm">{a.classMin}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Individual Remark (High contrast, warm brand styling) */}
                    {a.individualRemark && (
                      <div className="p-3.5 rounded-xl bg-brand-50/70 border border-brand-200 text-xs">
                        <strong className="text-brand-800 block mb-1 font-extrabold flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-brand-600" />
                          ملاحظة الأستاذ الفردية:
                        </strong>
                        <p className="text-gray-800 leading-relaxed font-semibold">{a.individualRemark}</p>
                      </div>
                    )}

                    {/* Class General Remark (High contrast, clean gray styling) */}
                    {a.classRemark && (
                      <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                        <strong className="text-gray-700 block mb-1 font-bold flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-gray-500" />
                          الملاحظة العامة للقسم:
                        </strong>
                        <p className="text-gray-700 leading-relaxed font-medium">{a.classRemark}</p>
                      </div>
                    )}
                  </div>

                  {/* Footer: Teacher Name & PDF Download Button */}
                  <div className="pt-3.5 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                    <span className="text-gray-600 text-xs font-medium">
                      الأستاذ(ة): <strong className="text-gray-900 font-bold">{a.teacherName || 'الأستاذ'}</strong>
                    </span>
                    <button
                      onClick={() => handleDownloadReportCard(a.assessmentId, activeChild.childId)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#7B1E3A] hover:bg-[#62162d] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm shadow-[#7B1E3A]/20 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-[#C9A24D]" />
                      <span className="text-white font-bold">تحميل كشف النقاط (PDF)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
