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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2 flex-wrap">
            <span>كشف النقاط والنتائج المدرسية</span>
            <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 shadow-2xs">
              {className || 'قسمي'}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">
            العلامات والملاحظات المعتمدة والمنشورة من طرف الإدارة لمختلف الفروض والتقييمات.
          </p>
        </div>

        <button
          onClick={fetchResults}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>تحديث كشف النقاط</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500 font-medium">
          <Sparkles className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
          جاري تحميل النتائج...
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-600 shadow-sm font-medium">
          <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">لا توجد نتائج منشورة بعد</h3>
          <p className="text-xs text-gray-500 mt-1">
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
                className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 flex flex-col justify-between hover:border-brand-300 hover:shadow-lg transition-all shadow-sm space-y-4"
              >
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center gap-2">
                    <span className="px-3.5 py-1 rounded-full text-xs font-black bg-brand-50 text-brand-700 border border-brand-200 shadow-2xs">
                      {resItem.subject}
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      {resItem.assessmentDate ? new Date(resItem.assessmentDate).toLocaleDateString('ar-DZ') : ''}
                    </span>
                  </div>

                  <h4 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                    {resItem.assessmentType}
                  </h4>

                  {/* Premium High-Contrast Score Box */}
                  <div
                    className={`p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white shadow-md ${
                      resItem.isAbsent
                        ? 'bg-gradient-to-br from-rose-600 to-red-700 shadow-rose-600/20'
                        : isPass
                        ? 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-emerald-600/20'
                        : 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20'
                    }`}
                  >
                    <div>
                      <span className="text-xs text-white/90 block font-semibold">علامتي في هذا التقييم:</span>
                      <div className="text-3xl sm:text-4xl font-black mt-1 tracking-tight text-white drop-shadow-xs">
                        {resItem.isAbsent ? 'غائب / Absent' : `${resItem.grade != null ? resItem.grade : '--'} / ${resItem.maxGrade || 20}`}
                      </div>
                    </div>

                    <div className="text-right sm:text-left text-xs font-mono space-y-1.5 bg-black/20 backdrop-blur-md p-3 rounded-xl border border-white/20 w-full sm:w-auto">
                      <div className="flex sm:block justify-between gap-4">
                        <span className="text-white/80">معدل القسم:</span> <strong className="font-extrabold text-white text-sm">{resItem.classAverage}</strong>
                      </div>
                      <div className="flex sm:block justify-between gap-4">
                        <span className="text-white/80">أعلى علامة:</span> <strong className="font-extrabold text-emerald-200 text-sm">{resItem.classMax}</strong>
                      </div>
                      <div className="flex sm:block justify-between gap-4">
                        <span className="text-white/80">أدنى علامة:</span> <strong className="font-extrabold text-rose-200 text-sm">{resItem.classMin}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Individual Remark (High contrast, warm brand styling) */}
                  {resItem.individualRemark && (
                    <div className="p-3.5 rounded-xl bg-brand-50/70 border border-brand-200 text-xs">
                      <strong className="text-brand-800 block mb-1 font-extrabold flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-brand-600" />
                        ملاحظة وتوجيه الأستاذ:
                      </strong>
                      <p className="text-gray-800 leading-relaxed font-semibold">{resItem.individualRemark}</p>
                    </div>
                  )}

                  {/* Class Remark (High contrast, clean gray styling) */}
                  {resItem.classRemark && (
                    <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                      <strong className="text-gray-700 block mb-1 font-bold flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-gray-500" />
                        الملاحظة العامة للقسم:
                      </strong>
                      <p className="text-gray-700 leading-relaxed font-medium">{resItem.classRemark}</p>
                    </div>
                  )}
                </div>

                {/* Footer: Teacher Name & PDF Download Button */}
                <div className="pt-3.5 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                  <span className="text-gray-600 text-xs font-medium">
                    الأستاذ(ة): <strong className="text-gray-900 font-bold">{resItem.teacherName || 'الأستاذ'}</strong>
                  </span>
                  <button
                    onClick={() => handleDownloadPDF(resItem.assessmentId)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-brand-50 hover:bg-brand-600 text-brand-700 hover:text-white border border-brand-200 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer group"
                  >
                    <Download className="w-4 h-4 text-brand-600 group-hover:text-white transition-colors" />
                    <span>كشف النقاط (PDF)</span>
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
