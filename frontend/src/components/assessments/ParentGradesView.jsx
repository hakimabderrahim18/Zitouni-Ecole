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
    window.open(`/api/assessments/${assessmentId}/export/pdf?type=individual&studentId=${studentId}`, '_blank');
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 flex-wrap">
            <span>كشوف النقاط والنتائج المدرسية</span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
              فضاء الأولياء
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            الاطلاع الحصري على النتائج المعتمدة والمنشورة رسمياً من طرف الإدارة لأبنائكم فقط.
          </p>
        </div>

        <button
          onClick={fetchResults}
          className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-brand-700 text-xs font-bold border border-slate-200 flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          تحديث النتائج
        </button>
      </div>

      {/* Children Tabs (if more than 1 child) */}
      {childrenResults.length > 1 && (
        <div className="flex gap-2 border-b border-slate-200 pb-2.5 overflow-x-auto scrollbar-none">
          {childrenResults.map((child, idx) => (
            <button
              key={child.childId}
              onClick={() => setSelectedChildIndex(idx)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                selectedChildIndex === idx
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-2xs'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{child.childName}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${selectedChildIndex === idx ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {child.className}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Results for Active Child */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-500 px-1">
          <span className="font-bold text-slate-800 text-sm">
            التلميذ: {activeChild.childName} — القسم: {activeChild.className}
          </span>
          <span className="font-medium bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px] self-start sm:self-auto">
            {activeChild.assessments?.length || 0} تقييم منشور
          </span>
        </div>

        {activeChild.assessments?.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 shadow-xs">
            لم يتم نشر أية نتائج لهذا التلميذ حتى الآن.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeChild.assessments.map((a, i) => {
              const isPass = !a.isAbsent && a.grade != null && a.grade >= 10;

              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between hover:border-brand-300 hover:shadow-md transition-all shadow-xs space-y-4"
                >
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-start gap-2">
                      <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-brand-50 text-brand-700 border border-brand-200">
                        {a.subject}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                        {a.assessmentDate ? new Date(a.assessmentDate).toLocaleDateString('ar-DZ') : ''}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-900">{a.assessmentType}</h4>

                    {/* Premium High-Contrast Score Box */}
                    <div
                      className={`p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white shadow-md ${
                        a.isAbsent
                          ? 'bg-gradient-to-br from-rose-600 to-red-700 shadow-rose-600/20'
                          : isPass
                          ? 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-emerald-600/20'
                          : 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20'
                      }`}
                    >
                      <div>
                        <span className="text-[11px] text-white/80 block font-medium">العلامة المحصل عليها:</span>
                        <div className="text-3xl font-black mt-0.5 tracking-tight">
                          {a.isAbsent ? 'غائب / Absent' : `${a.grade != null ? a.grade : '--'} / ${a.maxGrade || 20}`}
                        </div>
                      </div>

                      <div className="text-right sm:text-left text-[11px] font-mono space-y-1 bg-black/15 backdrop-blur-xs p-2.5 rounded-xl border border-white/10 w-full sm:w-auto">
                        <div className="flex sm:block justify-between gap-3">
                          <span className="opacity-80">معدل القسم:</span> <strong className="font-bold">{a.classAverage}</strong>
                        </div>
                        <div className="flex sm:block justify-between gap-3">
                          <span className="opacity-80">أعلى علامة:</span> <strong className="font-bold">{a.classMax}</strong>
                        </div>
                        <div className="flex sm:block justify-between gap-3">
                          <span className="opacity-80">أدنى علامة:</span> <strong className="font-bold">{a.classMin}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Individual Remark */}
                    {a.individualRemark && (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs">
                        <strong className="text-brand-700 block mb-1 font-bold">ملاحظة الأستاذ الفردية:</strong>
                        <p className="text-slate-800 leading-relaxed font-medium">{a.individualRemark}</p>
                      </div>
                    )}

                    {/* Class General Remark */}
                    {a.classRemark && (
                      <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 text-xs">
                        <strong className="text-slate-600 block mb-1 font-bold">الملاحظة العامة للقسم:</strong>
                        <p className="text-slate-700 leading-relaxed">{a.classRemark}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                    <span className="text-slate-500 text-[11px] font-medium">الأستاذ: <strong className="text-slate-700">{a.teacherName || 'الأستاذ'}</strong></span>
                    <button
                      onClick={() => handleDownloadReportCard(a.assessmentId, activeChild.childId)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold border border-brand-200 flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      تحميل كشف النقاط (PDF)
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
