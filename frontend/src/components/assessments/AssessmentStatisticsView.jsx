import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart2,
  TrendingUp,
  Award,
  Users,
  BookOpen,
  Filter,
  FileSpreadsheet,
  Printer,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function AssessmentStatisticsView() {
  const [statsData, setStatsData] = useState({ assessmentStats: [], teacherProgress: [], threshold: 10 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [cycleFilter, setCycleFilter] = useState('');
  const [thresholdInput, setThresholdInput] = useState(10);
  const [activeTab, setActiveTab] = useState('classes'); // 'classes' | 'teachers'

  useEffect(() => {
    fetchStats();
  }, [cycleFilter]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `/api/assessments/admin/statistics?cycle=${cycleFilter}&minPassingGrade=${thresholdInput}`
      );
      setStatsData(res.data);
    } catch (err) {
      console.error('Error fetching assessment statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyThreshold = (e) => {
    e.preventDefault();
    fetchStats();
  };

  const { assessmentStats = [], teacherProgress = [], threshold = 10 } = statsData;

  // High-level aggregate metrics
  const totalAssessments = assessmentStats.length;
  const overallAvg =
    totalAssessments > 0
      ? (assessmentStats.reduce((acc, a) => acc + (a.average || 0), 0) / totalAssessments).toFixed(2)
      : '0.00';

  const totalEvaluatedStudents = assessmentStats.reduce((acc, a) => acc + (a.presentStudents || 0), 0);
  const totalPassedStudents = assessmentStats.reduce((acc, a) => acc + (a.passCount || 0), 0);
  const overallPassRate =
    totalEvaluatedStudents > 0 ? ((totalPassedStudents / totalEvaluatedStudents) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FAF0F3] border border-[#7B1E3A]/25 text-[#7B1E3A]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 flex-wrap">
                <span>التقارير والإحصائيات التربوية</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FAF0F3] text-[#7B1E3A] border border-[#7B1E3A]/25">
                  لوحة القيادة
                </span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                معدلات الأقسام، نسب النجاح والتحقيق، ومتابعة نسبة استكمال إدخال النقاط للأساتذة.
              </p>
            </div>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('classes')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'classes' ? 'bg-[#7B1E3A] text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            إحصائيات الفروض والأقسام
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'teachers' ? 'bg-[#7B1E3A] text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            متابعة إنجاز الأساتذة
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-600 font-bold block">إجمالي التقييمات المحسوبة</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{totalAssessments}</span>
          <span className="text-xs text-slate-500 mt-0.5 block font-medium">فروض وتقويمات مدرجة</span>
        </div>

        <div className="bg-[#FAF2F4] border border-[#E7C1CB] p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-[#7B1E3A] font-bold block">المعدل العام للمؤسسة</span>
          <span className="text-2xl font-black text-[#7B1E3A] mt-1 block" dir="ltr">{overallAvg} / 20</span>
          <span className="text-xs text-slate-600 mt-0.5 block font-medium">متوسط كافة المواد</span>
        </div>

        <div className="bg-[#F4F9F4] border border-[#C6E7C8] p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-emerald-800 font-bold block">
            نسبة المحققين للمعايير ({threshold}/20)
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{overallPassRate}%</span>
          <span className="text-xs text-slate-600 mt-0.5 block font-medium">
            {totalPassedStudents} من أصل {totalEvaluatedStudents} تلميذ
          </span>
        </div>

        <div className="bg-sky-50/70 border border-sky-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-sky-800 font-bold block">عدد الأساتذة المتابعين</span>
          <span className="text-2xl font-black text-sky-700 mt-1 block">{teacherProgress.length}</span>
          <span className="text-xs text-slate-600 mt-0.5 block font-medium">طاقم التدريس المسند</span>
        </div>
      </div>

      {/* Controls & Threshold Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <form onSubmit={handleApplyThreshold} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <span className="text-xs font-bold text-slate-800">معيار النجاح القابل للضبط (عتبة المعدل):</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="20"
              step="0.5"
              value={thresholdInput}
              onChange={(e) => setThresholdInput(e.target.value)}
              className="w-20 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 text-center font-bold focus:outline-none focus:border-[#7B1E3A] shadow-2xs"
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-[#7B1E3A] hover:bg-[#62162d] text-white text-xs font-bold shadow-sm cursor-pointer"
            >
              تطبيق
            </button>
          </div>
        </form>

        <div className="flex items-center gap-2">
          <select
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            className="flex-1 md:flex-none bg-white border border-slate-300 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#7B1E3A] font-bold shadow-2xs cursor-pointer"
          >
            <option value="">جميع الأطوار</option>
            <option value="primary">الطور الابتدائي</option>
            <option value="middle">الطور المتوسط</option>
            <option value="secondary">الطور الثانوي</option>
          </select>

          <button
            onClick={fetchStats}
            className="text-xs text-[#7B1E3A] hover:text-[#5E162C] font-bold flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Classes & Assessments Stats */}
      {activeTab === 'classes' && (
        <div className="space-y-3">
          {/* Mobile Cards (Phone View) */}
          <div className="md:hidden space-y-3">
            {assessmentStats.length === 0 ? (
              <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-200 shadow-sm">
                لا توجد بيانات تقييمات مسجلة حالياً.
              </div>
            ) : (
              assessmentStats.map((item) => (
                <div key={item._id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-bold text-sm sm:text-base text-slate-900 block">{item.className}</span>
                      <span className="text-xs text-[#7B1E3A] font-bold">{item.subject}</span>
                      <span className="text-xs text-slate-500 block mt-0.5">{item.assessmentType} • {item.teacherName || '-'}</span>
                    </div>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        item.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : item.status === 'submitted'
                          ? 'bg-sky-50 text-sky-800 border-sky-300'
                          : 'bg-slate-100 text-slate-800 border-slate-300'
                      }`}
                    >
                      {item.status === 'approved' && 'معتمد'}
                      {item.status === 'submitted' && 'مرسل'}
                      {item.status === 'draft' && 'مسودة'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-center border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-600 uppercase font-bold block">المعدل</span>
                      <span className="text-sm font-black text-slate-900 font-mono">{item.average.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700 uppercase font-bold block">أعلى علامة</span>
                      <span className="text-sm font-black text-emerald-700 font-mono">{item.maxScore.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-700 uppercase font-bold block">أدنى علامة</span>
                      <span className="text-sm font-black text-rose-700 font-mono">{item.minScore.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">نسبة النجاح ({threshold}/20):</span>
                      <span
                        className={`font-bold ${
                          item.passRate >= 70
                            ? 'text-emerald-700'
                            : item.passRate >= 50
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {item.passRate}% ({item.passCount}/{item.presentStudents})
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          item.passRate >= 70
                            ? 'bg-emerald-500'
                            : item.passRate >= 50
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, item.passRate)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-900">
                جدول إحصائيات الفروض والتقييمات لكل قسم ومادة
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 uppercase border-b border-gray-200 font-bold">
                    <th className="py-3 px-4">القسم</th>
                    <th className="py-3 px-4">المادة ونوع التقييم</th>
                    <th className="py-3 px-4">الأستاذ</th>
                    <th className="py-3 px-4 text-center">معدل القسم</th>
                    <th className="py-3 px-4 text-center">أعلى علامة</th>
                    <th className="py-3 px-4 text-center">أدنى علامة</th>
                    <th className="py-3 px-4 text-center">نسبة تحقيق المعيار ({threshold}/20)</th>
                    <th className="py-3 px-4 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {assessmentStats.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-gray-500">
                        لا توجد بيانات تقييمات مسجلة حالياً.
                      </td>
                    </tr>
                  ) : (
                    assessmentStats.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-gray-900">{item.className}</td>
                        <td className="py-3 px-4">
                          <span className="text-brand-700 font-bold block">{item.subject}</span>
                          <span className="text-[11px] text-gray-500">{item.assessmentType}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{item.teacherName || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-bold text-sm text-gray-900">
                            {item.average.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-emerald-600 font-bold">
                          {item.maxScore.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-rose-600 font-bold">
                          {item.minScore.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`font-bold ${
                                item.passRate >= 70
                                  ? 'text-emerald-600'
                                  : item.passRate >= 50
                                  ? 'text-amber-600'
                                  : 'text-rose-600'
                              }`}
                            >
                              {item.passRate}% ({item.passCount}/{item.presentStudents})
                            </span>
                            <div className="w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  item.passRate >= 70
                                    ? 'bg-emerald-500'
                                    : item.passRate >= 50
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(100, item.passRate)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              item.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : item.status === 'submitted'
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            {item.status === 'approved' && 'معتمد'}
                            {item.status === 'submitted' && 'مرسل'}
                            {item.status === 'draft' && 'مسودة'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Teachers Completion Progress Report */}
      {activeTab === 'teachers' && (
        <div className="space-y-3">
          {/* Mobile Cards (Phone View) */}
          <div className="md:hidden space-y-3">
            {teacherProgress.length === 0 ? (
              <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-200 shadow-sm">
                لا توجد بيانات إنجاز أساتذة مسجلة حالياً.
              </div>
            ) : (
              teacherProgress.map((t) => (
                <div key={t.teacherId} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                  <div>
                    <span className="font-bold text-sm sm:text-base text-slate-900 block">{t.teacherName}</span>
                    <span className="text-xs text-[#7B1E3A] font-bold">{t.subjects.join('، ') || '-'}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl text-center border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-600 font-bold block">الأقسام</span>
                      <span className="text-xs font-black text-slate-900">{t.assignedClassesCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700 font-bold block">معتمدة</span>
                      <span className="text-xs font-black text-emerald-700">{t.approvedCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-sky-700 font-bold block">مراجعة</span>
                      <span className="text-xs font-black text-sky-700">{t.submittedCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-600 font-bold block">مسودات</span>
                      <span className="text-xs font-black text-slate-700">{t.draftCount}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">نسبة الاستكمال:</span>
                      <span className="font-extrabold text-[#7B1E3A]">{t.completionRate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#7B1E3A]"
                        style={{ width: `${Math.min(100, t.completionRate)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-gray-50/70 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-900">
                تقرير متابعة إدخال النقاط ونسبة الإنجاز لطاقم التدريس
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 uppercase border-b border-gray-200 font-bold">
                    <th className="py-3 px-4">اسم الأستاذ</th>
                    <th className="py-3 px-4">المواد المسندة</th>
                    <th className="py-3 px-4 text-center">الأقسام المسندة</th>
                    <th className="py-3 px-4 text-center">الكشوفات المعتمدة</th>
                    <th className="py-3 px-4 text-center">قيد المراجعة</th>
                    <th className="py-3 px-4 text-center">المسودات</th>
                    <th className="py-3 px-4 text-center">نسبة استكمال الإدخال</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {teacherProgress.map((t) => (
                    <tr key={t.teacherId} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-900">{t.teacherName}</td>
                      <td className="py-3 px-4 text-gray-700">{t.subjects.join('، ') || '-'}</td>
                      <td className="py-3 px-4 text-center font-bold text-gray-900">{t.assignedClassesCount}</td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-bold">{t.approvedCount}</td>
                      <td className="py-3 px-4 text-center text-sky-600 font-bold">{t.submittedCount}</td>
                      <td className="py-3 px-4 text-center text-gray-500 font-bold">{t.draftCount}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-bold text-brand-700">{t.completionRate}%</span>
                          <div className="w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-600"
                              style={{ width: `${Math.min(100, t.completionRate)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
