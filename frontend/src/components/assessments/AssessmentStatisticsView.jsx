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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-50 border border-brand-200 text-brand-700">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                التقارير والإحصائيات التربوية
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  لوحة القيادة
                </span>
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                معدلات الأقسام، نسب النجاح والتحقيق، ومتابعة نسبة استكمال إدخال النقاط للأساتذة.
              </p>
            </div>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-gray-100 p-1.5 rounded-xl border border-gray-200 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('classes')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'classes' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            إحصائيات الفروض والأقسام
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'teachers' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            متابعة إنجاز الأساتذة
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-gray-600 font-bold block">إجمالي التقييمات المحسوبة</span>
          <span className="text-2xl font-black text-gray-900 mt-1 block">{totalAssessments}</span>
          <span className="text-[11px] text-gray-500 mt-0.5 block">فروض وتقويمات مدرجة</span>
        </div>

        <div className="bg-white border border-brand-200 p-4 rounded-2xl shadow-sm bg-gradient-to-br from-white to-brand-50/30">
          <span className="text-xs text-brand-700 font-bold block">المعدل العام للمؤسسة</span>
          <span className="text-2xl font-black text-brand-700 mt-1 block">{overallAvg} / 20</span>
          <span className="text-[11px] text-gray-500 mt-0.5 block">متوسط كافة المواد</span>
        </div>

        <div className="bg-white border border-emerald-200 p-4 rounded-2xl shadow-sm bg-gradient-to-br from-white to-emerald-50/30">
          <span className="text-xs text-emerald-700 font-bold block">
            نسبة المحققين للمعايير ({threshold}/20)
          </span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{overallPassRate}%</span>
          <span className="text-[11px] text-gray-500 mt-0.5 block">
            {totalPassedStudents} من أصل {totalEvaluatedStudents} تلميذ
          </span>
        </div>

        <div className="bg-white border border-sky-200 p-4 rounded-2xl shadow-sm bg-gradient-to-br from-white to-sky-50/30">
          <span className="text-xs text-sky-700 font-bold block">عدد الأساتذة المتابعين</span>
          <span className="text-2xl font-black text-sky-600 mt-1 block">{teacherProgress.length}</span>
          <span className="text-[11px] text-gray-500 mt-0.5 block">طاقم التدريس المسند</span>
        </div>
      </div>

      {/* Controls & Threshold Filter */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <form onSubmit={handleApplyThreshold} className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-xs font-bold text-gray-800">معيار النجاح القابل للضبط (عتبة المعدل):</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="20"
              step="0.5"
              value={thresholdInput}
              onChange={(e) => setThresholdInput(e.target.value)}
              className="w-16 sm:w-20 bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs text-gray-900 text-center font-bold focus:outline-none focus:border-brand-500 focus:bg-white"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-sm"
            >
              تطبيق
            </button>
          </div>
        </form>

        <div className="flex items-center gap-2">
          <select
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            className="flex-1 sm:flex-none bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-brand-500"
          >
            <option value="">جميع الأطوار</option>
            <option value="primary">الطور الابتدائي</option>
            <option value="middle">الطور المتوسط</option>
            <option value="secondary">الطور الثانوي</option>
          </select>

          <button
            onClick={fetchStats}
            className="text-xs text-brand-700 hover:text-brand-800 font-bold flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            تحديث
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
                <div key={item._id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-bold text-sm text-gray-900 block">{item.className}</span>
                      <span className="text-xs text-brand-700 font-bold">{item.subject}</span>
                      <span className="text-[11px] text-gray-500 block">{item.assessmentType} • {item.teacherName || '-'}</span>
                    </div>
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
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-xl text-center border border-gray-100">
                    <div>
                      <span className="text-[10px] text-gray-500 block">المعدل</span>
                      <span className="text-sm font-black text-gray-900 font-mono">{item.average.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">أعلى علامة</span>
                      <span className="text-sm font-black text-emerald-600 font-mono">{item.maxScore.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">أدنى علامة</span>
                      <span className="text-sm font-black text-rose-600 font-mono">{item.minScore.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 font-medium">نسبة النجاح ({threshold}/20):</span>
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
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
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
                <div key={t.teacherId} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3">
                  <div>
                    <span className="font-bold text-sm text-gray-900 block">{t.teacherName}</span>
                    <span className="text-xs text-brand-700 font-semibold">{t.subjects.join('، ') || '-'}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 bg-gray-50 p-2.5 rounded-xl text-center border border-gray-100">
                    <div>
                      <span className="text-[10px] text-gray-500 block">الأقسام</span>
                      <span className="text-xs font-bold text-gray-900">{t.assignedClassesCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 block">معتمدة</span>
                      <span className="text-xs font-bold text-emerald-700">{t.approvedCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-sky-600 block">مراجعة</span>
                      <span className="text-xs font-bold text-sky-700">{t.submittedCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">مسودات</span>
                      <span className="text-xs font-bold text-gray-600">{t.draftCount}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 font-medium">نسبة الاستكمال:</span>
                      <span className="font-bold text-brand-700">{t.completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-600"
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
