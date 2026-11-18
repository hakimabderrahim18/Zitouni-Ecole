import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Printer,
  Download,
  FileSpreadsheet,
  Search,
  Filter,
  Users,
  BookOpen,
  Calendar,
  GraduationCap,
  Eye,
  CheckCircle,
  Clock,
  Sparkles,
  School,
  FileText,
} from 'lucide-react';
import SchoolLogo from '../SchoolLogo';
import { useSchoolStore } from '../../store/useSchoolStore';

export default function ReportCardExtractor() {
  const { settings } = useSchoolStore();
  const [assessments, setAssessments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCycle, setSelectedCycle] = useState('all');
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('all'); // 'all' or student ID

  // Active Assessment for Preview
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assessRes, classesRes] = await Promise.all([
        axios.get('/api/assessments/admin/all'),
        axios.get('/api/admin/classes').catch(() => ({ data: [] })),
      ]);

      const allAssess = assessRes.data.assessments || [];
      setAssessments(allAssess);
      setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);

      if (allAssess.length > 0) {
        setSelectedAssessmentId(allAssess[0]._id);
        loadAssessmentDetails(allAssess[0]._id);
      }
    } catch (err) {
      console.error('Error fetching data for report cards:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAssessmentDetails = async (id) => {
    if (!id) return;
    try {
      setLoadingDetails(true);
      const res = await axios.get(`/api/assessments/${id}`);
      setActiveAssessment(res.data);
      setSelectedStudentId('all');
    } catch (err) {
      console.error('Error loading assessment details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAssessmentSelect = (id) => {
    setSelectedAssessmentId(id);
    loadAssessmentDetails(id);
  };

  // Direct Browser Print
  const handleDirectPrint = () => {
    window.print();
  };

  // Download Individual PDF
  const handleDownloadIndividualPDF = (studentId) => {
    if (!activeAssessment) return;
    window.open(`/api/assessments/${activeAssessment._id}/export/pdf?type=individual&studentId=${studentId}`, '_blank');
  };

  // Download Collective PDF
  const handleDownloadCollectivePDF = () => {
    if (!activeAssessment) return;
    window.open(`/api/assessments/${activeAssessment._id}/export/pdf?type=collective`, '_blank');
  };

  // Export Excel
  const handleExportExcel = () => {
    if (!activeAssessment) return;
    window.open(`/api/assessments/${activeAssessment._id}/export/excel`, '_blank');
  };

  // Filtered Assessments List
  const filteredAssessments = assessments.filter((a) => {
    if (selectedCycle !== 'all' && a.cycle !== selectedCycle) return false;
    if (selectedClassId !== 'all' && a.class?._id !== selectedClassId && a.class !== selectedClassId) return false;
    if (selectedSubject !== 'all' && a.subject !== selectedSubject) return false;
    return true;
  });

  const records = activeAssessment?.records || [];
  const displayedRecords =
    selectedStudentId === 'all'
      ? records
      : records.filter((r) => (r.student?._id || r.student)?.toString() === selectedStudentId);

  // Present & Calculations
  const presentRecords = records.filter((r) => !r.isAbsent && r.grade != null);
  const grades = presentRecords.map((r) => r.grade);
  const avg = presentRecords.length > 0 ? (grades.reduce((a, b) => a + b, 0) / presentRecords.length).toFixed(2) : '--';
  const maxScore = presentRecords.length > 0 ? Math.max(...grades).toFixed(2) : '--';
  const minScore = presentRecords.length > 0 ? Math.min(...grades).toFixed(2) : '--';
  const passCount = presentRecords.filter((g) => g >= 10).length;

  return (
    <div className="space-y-6">
      {/* Header and Print Actions (hidden on window.print) */}
      <div className="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-50 border border-brand-200 text-brand-700">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                استخراج وطباعة كشوف النقاط
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  كشوف فردية وجماعية
                </span>
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                معاينة الكشف على الشاشة، التصفية المتقدمة، واستخراج ملفات PDF قابلة للطباعة المباشرة.
              </p>
            </div>
          </div>
        </div>

        {/* Global Export Action Buttons */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleDirectPrint}
            disabled={!activeAssessment}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            طباعة مباشرة
          </button>

          <button
            onClick={handleDownloadCollectivePDF}
            disabled={!activeAssessment}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold border border-gray-300 shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-brand-600" />
            تحميل جماعي PDF
          </button>

          <button
            onClick={handleExportExcel}
            disabled={!activeAssessment}
            className="col-span-2 sm:col-span-1 px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            تصدير Excel
          </button>
        </div>
      </div>

      {/* Filter Bar (hidden on print) */}
      <div className="print:hidden bg-white p-4 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. Cycle Filter */}
        <div>
          <label className="text-xs font-bold text-gray-700 mb-1 block">الطور الدراسي:</label>
          <select
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-brand-500"
          >
            <option value="all">جميع الأطوار</option>
            <option value="primary">الطور الابتدائي</option>
            <option value="middle">الطور المتوسط</option>
            <option value="secondary">الطور الثانوي</option>
          </select>
        </div>

        {/* 2. Class Filter */}
        <div>
          <label className="text-xs font-bold text-gray-700 mb-1 block">القسم:</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-brand-500"
          >
            <option value="all">جميع الأقسام</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Subject Filter */}
        <div>
          <label className="text-xs font-bold text-gray-700 mb-1 block">المادة:</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-brand-500"
          >
            <option value="all">جميع المواد</option>
            {Array.from(new Set(assessments.map((a) => a.subject))).map((sub, idx) => (
              <option key={idx} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Assessment Picker */}
        <div>
          <label className="text-xs font-bold text-brand-700 mb-1 block">اختر التقييم / الفرض:</label>
          <select
            value={selectedAssessmentId}
            onChange={(e) => handleAssessmentSelect(e.target.value)}
            className="w-full bg-brand-50/50 border border-brand-200 rounded-xl px-3 py-2 text-xs text-brand-950 font-bold focus:outline-none focus:border-brand-500"
          >
            {filteredAssessments.map((a) => (
              <option key={a._id} value={a._id}>
                {a.assessmentType} - {a.subject} ({a.class?.name})
              </option>
            ))}
          </select>
        </div>

        {/* 5. Student Filter (Specific or All) */}
        <div>
          <label className="text-xs font-bold text-gray-700 mb-1 block">التلميذ المستهدف:</label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-brand-500"
          >
            <option value="all">جميع تلاميذ القسم (كشف جماعي)</option>
            {records.map((r, i) => {
              const sId = (r.student?._id || r.student)?.toString();
              const st = r.student || {};
              const u = st.user || {};
              const name =
                `${u.firstNameArabic || u.firstName || ''} ${u.lastNameArabic || u.lastName || ''}`.trim() ||
                `تلميذ ${i + 1}`;
              return (
                <option key={sId} value={sId}>
                  {name}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Main Printable Document Sheet (On-Screen Preview & Print Target) */}
      {activeAssessment ? (
        <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200 print:border-none print:shadow-none print:p-0 print:m-0 max-w-4xl mx-auto font-sans">
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-300 pb-5 mb-6">
            <div className="flex justify-between items-center gap-4">
              <div className="text-right space-y-1">
                <h3 className="font-bold text-sm text-slate-800">الجمهورية الجزائرية الديمقراطية الشعبية</h3>
                <h4 className="font-bold text-xs text-slate-700">وزارة التربية الوطنية</h4>
                <p className="font-extrabold text-base text-[#7B1E3A]">
                  {settings?.institutionName || 'مؤسسة التربية والتعليم حبر وألوان الخاصة'}
                </p>
                <p className="text-xs text-slate-600">
                  {settings?.schoolNameArabic || 'مدرسة حبر'} | {settings?.schoolNameFrench || 'Groupe scolaire Encre & Pastel'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {settings?.location || 'أولاد فايت - الجزائر غرب'} | هاتف: {settings?.contactPhone || '0554075701'}
                </p>
              </div>

              <div className="flex flex-col items-center">
                <SchoolLogo size={70} />
                <span className="text-[10px] font-mono font-bold text-[#7B1E3A] mt-1">
                  السنة الدراسية: {activeAssessment.academicYear || '2026-2027'}
                </span>
              </div>
            </div>
          </div>

          {/* Document Title Banner */}
          <div className="bg-slate-100 border border-slate-300 rounded-xl py-2 px-4 text-center mb-6">
            <h2 className="text-lg font-black text-slate-900">
              {selectedStudentId === 'all'
                ? `محضر وكشف نقاط جماعي - ${activeAssessment.assessmentType}`
                : `كشف نقاط تقييم فردي - ${activeAssessment.assessmentType}`}
            </h2>
            <p className="text-xs text-slate-600">RELEVÉ OFFICIEL DES NOTES D'ÉVALUATION</p>
          </div>

          {/* Assessment Meta Table */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs mb-6">
            <div>
              <span className="text-slate-500 block">القسم:</span>
              <strong className="text-slate-900">{activeAssessment.class?.name || 'قسم'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">المادة:</span>
              <strong className="text-slate-900">{activeAssessment.subject}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">الأستاذ(ة):</span>
              <strong className="text-slate-900">
                {activeAssessment.teacherUser
                  ? `${activeAssessment.teacherUser.firstName || ''} ${activeAssessment.teacherUser.lastName || ''}`.trim()
                  : 'الأستاذ'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">تاريخ الإجراء:</span>
              <strong className="text-slate-900">
                {activeAssessment.assessmentDate
                  ? new Date(activeAssessment.assessmentDate).toLocaleDateString('fr-DZ')
                  : '-'}
              </strong>
            </div>
          </div>

          {/* Individual Report Card Presentation (When 1 student is selected) */}
          {selectedStudentId !== 'all' && displayedRecords.length > 0 && (
            <div className="space-y-6">
              {displayedRecords.map((rec) => {
                const st = rec.student || {};
                const u = st.user || {};
                const sName = `${u.firstNameArabic || u.firstName || ''} ${u.lastNameArabic || u.lastName || ''}`.trim();
                const regNo = st.registrationNumber || st.nationalIdDigitization || '-';

                return (
                  <div key={rec.student} className="space-y-4">
                    {/* Student Identity Card */}
                    <div className="p-4 rounded-xl border border-slate-300 bg-white flex justify-between items-center">
                      <div>
                        <span className="text-xs text-slate-500 block">اسم ولقب التلميذ:</span>
                        <h3 className="text-base font-black text-slate-900">{sName}</h3>
                        <span className="text-xs text-slate-500">
                          الاسم بالفرنسية: {u.firstNameFrench || ''} {u.lastNameFrench || ''}
                        </span>
                      </div>
                      <div className="text-left font-mono">
                        <span className="text-xs text-slate-500 block">رقم التسجيل:</span>
                        <strong className="text-sm text-slate-900">{regNo}</strong>
                      </div>
                    </div>

                    {/* Score Box */}
                    <div className="p-5 rounded-2xl border-2 border-[#7B1E3A]/40 bg-[#7B1E3A]/5 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-slate-600 uppercase block">العلامة المحصل عليها</span>
                        <div className="text-3xl font-black text-[#7B1E3A] mt-1">
                          {rec.isAbsent ? 'غائب / Absent' : `${rec.grade != null ? rec.grade : '--'} / 20`}
                        </div>
                      </div>

                      <div className="text-left">
                        <button
                          onClick={() => handleDownloadIndividualPDF(st._id)}
                          className="print:hidden px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <Download className="w-3.5 h-3.5 text-brand-400" />
                          تحميل PDF فردي
                        </button>
                      </div>
                    </div>

                    {/* Remarks Grid */}
                    <div className="border border-slate-300 rounded-xl p-4 space-y-3">
                      <div>
                        <strong className="text-xs text-[#7B1E3A] block mb-1">الملاحظة الفردية للتلميذ:</strong>
                        <p className="text-xs text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          {rec.individualRemark || 'لا توجد ملاحظة مدونة.'}
                        </p>
                      </div>

                      <div>
                        <strong className="text-xs text-[#7B1E3A] block mb-1">الملاحظة العامة للقسم:</strong>
                        <p className="text-xs text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          {activeAssessment.classRemark || 'لا توجد ملاحظة عامة مدونة.'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Collective Class Table Presentation (When all class is selected) */}
          {selectedStudentId === 'all' && (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-300 rounded-xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">الرقم</th>
                      <th className="py-2.5 px-3">اسم ولقب التلميذ</th>
                      <th className="py-2.5 px-3 w-28">رقم التسجيل</th>
                      <th className="py-2.5 px-3 w-28 text-center">العلامة / 20</th>
                      <th className="py-2.5 px-3">الملاحظة الفردية</th>
                      <th className="py-2.5 px-3 w-20 text-center print:hidden">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {displayedRecords.map((rec, idx) => {
                      const st = rec.student || {};
                      const u = st.user || {};
                      const sName =
                        `${u.firstNameArabic || u.firstName || ''} ${u.lastNameArabic || u.lastName || ''}`.trim() ||
                        `تلميذ ${idx + 1}`;
                      const regNo = st.registrationNumber || st.nationalIdDigitization || '-';

                      return (
                        <tr key={rec.student} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="py-2 px-3 text-center font-mono text-slate-500">
                            {String(idx + 1).padStart(2, '0')}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900">{sName}</td>
                          <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">{regNo}</td>
                          <td className="py-2 px-3 text-center font-bold">
                            {rec.isAbsent ? (
                              <span className="text-rose-600 font-bold">غائب</span>
                            ) : (
                              <span className={rec.grade >= 10 ? 'text-emerald-700' : 'text-amber-700'}>
                                {rec.grade != null ? Number(rec.grade).toFixed(2) : '--'}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-700">{rec.individualRemark || '-'}</td>
                          <td className="py-2 px-3 text-center print:hidden">
                            <button
                              onClick={() => handleDownloadIndividualPDF(st._id)}
                              className="p-1 hover:bg-slate-200 rounded text-slate-600"
                              title="كشف فردي PDF"
                            >
                              <Download className="w-3.5 h-3.5 text-brand-600" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Class General Remark Box */}
              {activeAssessment.classRemark && (
                <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 text-xs">
                  <strong className="text-[#7B1E3A] block mb-1">الملاحظة العامة للقسم:</strong>
                  <p className="text-slate-800 leading-relaxed">{activeAssessment.classRemark}</p>
                </div>
              )}

              {/* Class Summary Statistics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 p-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800">
                <div>معدل القسم: {avg} / 20</div>
                <div>أعلى نقطة: {maxScore}</div>
                <div>أدنى نقطة: {minScore}</div>
                <div>
                  نسبة تحقيق المعدل: {passCount} / {presentRecords.length}
                </div>
              </div>
            </div>
          )}

          {/* Signatures & Seal Area */}
          <div className="mt-8 pt-6 border-t-2 border-slate-300 flex justify-between items-start text-xs font-bold text-slate-800">
            <div className="text-center w-48">
              <span>توقيع الأستاذ(ة):</span>
              <div className="h-16 mt-2 border border-dashed border-slate-300 rounded-lg"></div>
            </div>
            <div className="text-center w-48">
              <span>ختم وتأشيرة إدارة المؤسسة:</span>
              <div className="h-16 mt-2 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                الختم الرسمي
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center text-slate-500 bg-slate-900/30 rounded-3xl border border-luxury-border/30">
          يرجى اختيار تقييم لمعاينة واستخراج كشف النقاط.
        </div>
      )}
    </div>
  );
}
