import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  GraduationCap,
  Download,
  Calendar,
  BookOpen,
  Award,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function StudentGradesView() {
  const [resultsData, setResultsData] = useState({ studentName: '', className: '', results: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/assessments/student/my-results');
      setResultsData(res.data);
    } catch (err) {
      console.error('Error fetching student results:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = (assessmentId) => {
    window.open(`/api/assessments/${assessmentId}/export/pdf?type=individual`, '_blank');
  };

  const { studentName, className, results = [] } = resultsData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 flex-wrap">
            <span>كشف النقاط والنتائج المدرسية</span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
              {className || 'قسمي'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            العلامات والملاحظات المعتمدة والمنشورة من طرف الإدارة لمختلف الفروض والتقييمات.
          </p>
        </div>

        <button
          onClick={fetchResults}
          className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-brand-700 text-xs font-bold border border-slate-200 flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          تحديث كشف النقاط
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">
          <Sparkles className="w-6 h-6 animate-spin mx-auto text-brand-500 mb-2" />
          جاري تحميل النتائج...
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 shadow-xs">
          <GraduationCap className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">لا توجد نتائج منشورة بعد</h3>
          <p className="text-xs text-slate-500 mt-1">
            سيتم إشعارك فور اعتماد ونشر نقاط أي فرض أو اختبار من طرف الإدارة.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((resItem, i) => {
            const isPass = !resItem.isAbsent && resItem.grade != null && resItem.grade >= 10;

            return (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between hover:border-brand-300 hover:shadow-md transition-all shadow-xs space-y-4"
              >
                <div className="space-y-3.5">
                  <div className="flex justify-between items-start gap-2">
                    <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-brand-50 text-brand-700 border border-brand-200">
                      {resItem.subject}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                      {resItem.assessmentDate ? new Date(resItem.assessmentDate).toLocaleDateString('ar-DZ') : ''}
                    </span>
                  </div>

                  <h4 className="text-base font-black text-slate-900">{resItem.assessmentType}</h4>

                  {/* Score Box */}
                  <div
                    className={`p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white shadow-md ${
                      resItem.isAbsent
                        ? 'bg-gradient-to-br from-rose-600 to-red-700 shadow-rose-600/20'
                        : isPass
                        ? 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-emerald-600/20'
                        : 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20'
                    }`}
                  >
                    <div>
                      <span className="text-[11px] text-white/80 block font-medium">علامتي في هذا التقييم:</span>
                      <div className="text-3xl font-black mt-0.5 tracking-tight">
                        {resItem.isAbsent ? 'غائب / Absent' : `${resItem.grade != null ? resItem.grade : '--'} / ${resItem.maxGrade || 20}`}
                      </div>
                    </div>

                    <div className="text-right sm:text-left text-[11px] font-mono space-y-1 bg-black/15 backdrop-blur-xs p-2.5 rounded-xl border border-white/10 w-full sm:w-auto">
                      <div className="flex sm:block justify-between gap-3">
                        <span className="opacity-80">معدل القسم:</span> <strong className="font-bold">{resItem.classAverage}</strong>
                      </div>
                      <div className="flex sm:block justify-between gap-3">
                        <span className="opacity-80">أعلى علامة:</span> <strong className="font-bold">{resItem.classMax}</strong>
                      </div>
                      <div className="flex sm:block justify-between gap-3">
                        <span className="opacity-80">أدنى علامة:</span> <strong className="font-bold">{resItem.classMin}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Individual Remark */}
                  {resItem.individualRemark && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs">
                      <strong className="text-brand-700 block mb-1 font-bold">ملاحظة وتوجيه الأستاذ:</strong>
                      <p className="text-slate-800 leading-relaxed font-medium">{resItem.individualRemark}</p>
                    </div>
                  )}

                  {/* Class Remark */}
                  {resItem.classRemark && (
                    <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 text-xs">
                      <strong className="text-slate-600 block mb-1 font-bold">الملاحظة العامة للقسم:</strong>
                      <p className="text-slate-700 leading-relaxed">{resItem.classRemark}</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                  <span className="text-slate-500 text-[11px] font-medium">الأستاذ: <strong className="text-slate-700">{resItem.teacherName || 'الأستاذ'}</strong></span>
                  <button
                    onClick={() => handleDownloadPDF(resItem.assessmentId)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold border border-brand-200 flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    كشف النقاط (PDF)
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
