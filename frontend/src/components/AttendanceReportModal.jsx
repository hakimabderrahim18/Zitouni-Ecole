import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, Download, X, Calendar, FileSpreadsheet, RefreshCw, Users, AlertTriangle } from 'lucide-react';
import SchoolLogo from './SchoolLogo';
import { useSchoolStore } from '../store/useSchoolStore';

export default function AttendanceReportModal({ isOpen, onClose, defaultClassId, classes = [] }) {
  const { settings } = useSchoolStore();
  const printRef = useRef(null);

  const [classId, setClassId] = useState(defaultClassId || 'all');
  const [periodType, setPeriodType] = useState('week'); // 'week' | 'month'
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchReport();
    }
  }, [isOpen, classId, periodType]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const days = periodType === 'week' ? 7 : 30;
      const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = new Date().toISOString().split('T')[0];

      const res = await axios.get('/api/attendance/export-report', {
        params: {
          classId: classId === 'all' ? undefined : classId,
          periodType,
          startDate: start,
          endDate: end,
        },
      });

      setReportData(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch attendance report', err);
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!reportData || !reportData.studentsSummary) return;

    const headers = ['التلميذ', 'القسم', 'رقم الهاتف', 'إجمالي الحصص', 'حاضر', 'غياب غير مبرر', 'غياب مبرر', 'متأخر', 'إذن خروج'];
    const rows = reportData.studentsSummary.map(s => [
      `"${s.name}"`,
      `"${s.className}"`,
      `"${s.parentPhone}"`,
      s.total,
      s.present,
      s.unexcused,
      s.excused,
      s.late,
      s.exitPass,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_الغيابات_${periodType === 'week' ? 'الأسبوعي' : 'الشهري'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const periodLabel = periodType === 'week' ? 'الأسبوعي (آخر 7 أيام)' : 'الشهري (آخر 30 يوماً)';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl bg-white border border-[#C9A24D]/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-right font-sans"
          dir="rtl"
        >
          {/* Top Bar Controls */}
          <div className="flex flex-wrap items-center justify-between p-4 bg-[#F3E9DC] border-b border-[#C9A24D]/30 gap-3 print:hidden shrink-0">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#7B1E3A]" />
              <div>
                <h3 className="font-serif font-black text-sm text-[#7B1E3A]">
                  استخراج تقرير الغيابات الدوري (المادة 26)
                </h3>
                <span className="text-[10px] text-slate-600 block">
                  تقرير بيداغوجي أسبوعي وشهري لإحصاء الغيابات والتأخيرات وتوجيه الإنذارات
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Period Switcher */}
              <div className="flex items-center bg-white border border-[#C9A24D]/30 rounded-xl p-0.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPeriodType('week')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    periodType === 'week' ? 'bg-[#7B1E3A] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  أسبوعي (7 أيام)
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodType('month')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    periodType === 'month' ? 'bg-[#7B1E3A] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  شهري (30 يوماً)
                </button>
              </div>

              {/* Class Filter */}
              <select
                value={classId}
                onChange={e => setClassId(e.target.value)}
                className="bg-white border border-[#C9A24D]/40 rounded-xl px-2.5 py-1 text-xs text-[#2B2022] font-bold focus:outline-none cursor-pointer"
              >
                <option value="all">جميع الأقسام</option>
                {classes.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* CSV Export */}
              <button
                type="button"
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="تصدير جدول Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>تصدير Excel</span>
              </button>

              {/* Print PDF */}
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-1 bg-[#7B1E3A] hover:bg-[#60162c] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[#C9A24D]" />
                <span>طباعة (PDF)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-xl bg-white hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer border border-[#C9A24D]/30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Report Body */}
          <div className="overflow-y-auto flex-1 p-6 bg-[#FDFBF7]">
            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-[#7B1E3A] animate-spin" />
                <span className="text-xs text-slate-500 font-semibold">جاري تجميع إحصائيات التقرير...</span>
              </div>
            ) : !reportData || !reportData.studentsSummary || reportData.studentsSummary.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Users className="w-10 h-10 mx-auto text-[#C9A24D]/40" />
                <p className="font-bold text-slate-700 text-sm">لا توجد سجلات غياب مسجلة خلال هذه الفترة.</p>
              </div>
            ) : (
              <div ref={printRef} className="space-y-5 bg-white p-6 border rounded-2xl shadow-xs">
                {/* Official Printable Header */}
                <div className="border-b-2 border-[#C9A24D] pb-4">
                  <div className="flex items-center justify-between text-center text-xs font-serif">
                    <div className="text-right space-y-0.5">
                      <p className="font-bold">الجمهورية الجزائرية الديمقراطية الشعبية</p>
                      <p className="font-bold">وزارة التربية الوطنية</p>
                      <p className="text-[10px] text-slate-600">مديرية التربية والتعليم الخاصة</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <SchoolLogo size={45} />
                      <h2 className="font-serif font-black text-xs text-[#7B1E3A] mt-1">
                        {settings?.institutionName || 'مؤسسة التربية والتعليم حبر وألوان الخاصة'}
                      </h2>
                    </div>
                    <div className="text-left space-y-0.5 font-mono text-[10px]">
                      <p className="font-bold">التاريخ: {new Date().toLocaleDateString('ar-DZ')}</p>
                      <p className="text-[#7B1E3A] font-bold">تقرير دوري - المادة 26</p>
                    </div>
                  </div>

                  <div className="text-center py-2 bg-[#7B1E3A] text-white rounded-xl shadow-xs mt-2">
                    <h1 className="text-sm sm:text-base font-serif font-black">
                      تقرير متابعة الغيابات والتأخيرات {periodLabel}
                    </h1>
                    <span className="text-[10px] text-amber-200">
                      RAPPORT PÉRIODIQUE D'ASSIDUITÉ ET D'ABSENTÉISME SCOLAIRE
                    </span>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#F3E9DC] text-[#7B1E3A] font-bold">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">التلميذ</th>
                        <th className="p-2.5">القسم</th>
                        <th className="p-2.5">هاتف الولي</th>
                        <th className="p-2.5 text-center">حاضر</th>
                        <th className="p-2.5 text-center text-red-700">غير مبرر</th>
                        <th className="p-2.5 text-center text-blue-700">مبرر</th>
                        <th className="p-2.5 text-center text-amber-700">تأخر</th>
                        <th className="p-2.5 text-center text-teal-700">إذن خروج</th>
                        <th className="p-2.5 text-center">الوضعية والإنذار</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.studentsSummary.map((item, idx) => {
                        const isSevere = item.unexcused >= 3;
                        return (
                          <tr key={item.studentId} className={isSevere ? 'bg-red-50/50' : 'hover:bg-slate-50'}>
                            <td className="p-2 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                            <td className="p-2 font-bold text-slate-800">{item.name}</td>
                            <td className="p-2 font-semibold text-slate-600">{item.className}</td>
                            <td className="p-2 font-mono text-slate-600 text-[11px]">{item.parentPhone}</td>
                            <td className="p-2 text-center font-bold text-emerald-700">{item.present}</td>
                            <td className="p-2 text-center font-bold text-red-700">{item.unexcused}</td>
                            <td className="p-2 text-center font-bold text-blue-700">{item.excused}</td>
                            <td className="p-2 text-center font-bold text-amber-700">{item.late}</td>
                            <td className="p-2 text-center font-bold text-teal-700">{item.exitPass}</td>
                            <td className="p-2 text-center">
                              {isSevere ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px] border border-red-300">
                                  <AlertTriangle className="w-3 h-3 text-red-600" />
                                  <span>مستحق إنذار (3+)</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">منتظم</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Stamping */}
                <div className="grid grid-cols-2 gap-8 pt-4 border-t text-xs text-center font-serif">
                  <div className="p-3 bg-slate-50 rounded-xl space-y-6">
                    <span className="font-bold text-slate-700 block">إعداد المستشار التربوي:</span>
                    <div className="h-6"></div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl space-y-6">
                    <span className="font-bold text-[#7B1E3A] block">تأشيرة وخاتم مدير المؤسسة:</span>
                    <div className="h-6"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
