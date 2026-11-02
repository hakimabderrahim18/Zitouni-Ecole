import React from 'react';
import { Printer, Download, X, Users, BookOpen, School, CheckCircle2 } from 'lucide-react';
import SchoolLogo from './SchoolLogo';
import { useSchoolStore } from '../store/useSchoolStore';

export default function ClassRosterPrintModal({ selectedClass, students, academicYear = '2026-2027', onClose }) {
  const { settings } = useSchoolStore();

  if (!selectedClass) return null;

  const schoolName = settings?.institutionName || 'مؤسسة التربية والتعليم حبر وألوان الخاصة';
  const className = selectedClass.name || 'القسم';

  // Sort students alphabetically by Arabic last name then first name
  const sortedStudents = [...students].sort((a, b) => {
    const nameA = `${a.lastNameArabic || a.user?.lastName || ''} ${a.firstNameArabic || a.user?.firstName || ''}`;
    const nameB = `${b.lastNameArabic || b.user?.lastName || ''} ${b.firstNameArabic || b.user?.firstName || ''}`;
    return nameA.localeCompare(nameB, 'ar');
  });

  const males = sortedStudents.filter((s) => s.gender === 'ذكر' || s.gender === 'male' || s.gender === 'M').length;
  const females = sortedStudents.length - males;
  const demiPension = sortedStudents.filter((s) => s.regime === 'demi-pension' || s.regime === 'نصف داخلي').length;
  const externes = sortedStudents.length - demiPension;
  const waitlisted = sortedStudents.filter((s) => s.isWaitlisted || s.registrationStatus === 'waitlist').length;

  const handlePrint = () => {
    window.print();
  };

  const handleSaveHtml = () => {
    const area = document.getElementById('class-roster-print-area');
    if (!area) return;

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>قائمة_المسجلين_قسم_${className}_${academicYear}</title>
  <style>
    body { font-family: 'Amiri', 'Times New Roman', serif; padding: 20px; background: white; color: #000; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
    th, td { border: 1px solid #333; padding: 6px; text-align: center; }
    th { background: #f2f2f2; font-weight: bold; }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #7B1E3A; padding-bottom: 10px; }
  </style>
</head>
<body>
  ${area.innerHTML}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `قائمة_تلاميذ_${className}_${academicYear}.html`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #class-roster-print-area, #class-roster-print-area * {
            visibility: visible !important;
          }
          #class-roster-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 15px !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        dir="rtl"
        className="bg-white border border-[#C9A24D]/40 rounded-3xl w-full max-w-4xl shadow-2xl relative my-auto overflow-hidden font-sans flex flex-col max-h-[92vh]"
      >
        {/* Toolbar */}
        <div className="no-print p-4 bg-[#F3E9DC] border-b border-[#C9A24D]/35 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#7B1E3A] flex items-center justify-center text-white shadow-xs">
              <Users className="w-4 h-4 text-[#C9A24D]" />
            </div>
            <div>
              <span className="font-serif font-black text-sm text-[#7B1E3A] block">
                قائمة التلاميذ المسجلين — {className} ({academicYear})
              </span>
              <span className="text-[10px] text-slate-500">
                إجمالي التلاميذ: {sortedStudents.length} • نصف داخلي: {demiPension} • قائمة الانتظار: {waitlisted}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveHtml}
              className="px-3.5 py-1.5 bg-white border border-[#C9A24D]/40 text-[#7B1E3A] rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-[#FDFBF7] cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-[#C9A24D]" />
              <span>تنزيل HTML</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-[#7B1E3A] text-[#F3E9DC] rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-[#60162c] cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4 text-[#C9A24D]" />
              <span>طباعة القائمة الرسمية (PDF)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Roster Sheet */}
        <div id="class-roster-print-area" className="p-6 sm:p-8 overflow-y-auto space-y-4 bg-white text-[#2B2022]">
          {/* Official Ministry & School Header */}
          <div className="text-center space-y-1 border-b-2 border-[#7B1E3A] pb-3">
            <p className="text-[11px] font-bold text-slate-600">الجمهورية الجزائرية الديمقراطية الشعبية</p>
            <p className="text-[11px] font-bold text-slate-600">وزارة التربية الوطنية — مديرية التربية</p>
            <div className="flex items-center justify-between px-6 pt-1">
              <div className="text-right">
                <h2 className="text-lg font-serif font-black text-[#7B1E3A]">{schoolName}</h2>
                <p className="text-[10px] text-slate-500">الموسم الدراسي: {academicYear}</p>
              </div>
              <SchoolLogo size={42} />
              <div className="text-left font-mono text-[10px] text-slate-500">
                <p>تاريخ الاستخراج: {new Date().toLocaleDateString('ar-DZ')}</p>
                <p>القسم: {className}</p>
              </div>
            </div>
          </div>

          {/* Title Banner */}
          <div className="text-center py-1">
            <h3 className="inline-block px-6 py-1 rounded-full bg-[#7B1E3A]/10 border border-[#7B1E3A]/30 font-serif font-black text-sm text-[#7B1E3A]">
              القائمـة الاسميـة الرسميـة لتلاميـذ قسـم: {className}
            </h3>
          </div>

          {/* Table of Students */}
          <table className="w-full text-right text-[11px] border border-[#C9A24D]/50 border-collapse">
            <thead>
              <tr className="bg-[#F3E9DC] text-[#7B1E3A] font-bold border-b border-[#C9A24D]/50">
                <th className="p-2 border border-[#C9A24D]/40 text-center w-8">#</th>
                <th className="p-2 border border-[#C9A24D]/40">رقم التسجيل</th>
                <th className="p-2 border border-[#C9A24D]/40">اللقب والاسم بالعربية</th>
                <th className="p-2 border border-[#C9A24D]/40" dir="ltr">Nom & Prénom</th>
                <th className="p-2 border border-[#C9A24D]/40 text-center">تاريخ الميلاد</th>
                <th className="p-2 border border-[#C9A24D]/40 text-center">الجنس</th>
                <th className="p-2 border border-[#C9A24D]/40 text-center">نوع التسجيل</th>
                <th className="p-2 border border-[#C9A24D]/40 text-center">النظام</th>
                <th className="p-2 border border-[#C9A24D]/40 text-center">حالة الملف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedStudents.map((s, idx) => (
                <tr key={s._id} className="hover:bg-slate-50">
                  <td className="p-2 border border-[#C9A24D]/25 text-center font-bold text-slate-600">{idx + 1}</td>
                  <td className="p-2 border border-[#C9A24D]/25 font-mono text-[10px] text-[#7B1E3A] font-bold">
                    {s.registrationNumber || 'REG-2026-0000'}
                  </td>
                  <td className="p-2 border border-[#C9A24D]/25 font-bold">
                    {s.lastNameArabic || s.user?.lastName} {s.firstNameArabic || s.user?.firstName}
                  </td>
                  <td className="p-2 border border-[#C9A24D]/25 font-mono text-[10px]" dir="ltr">
                    {s.lastNameFrench || s.user?.lastName} {s.firstNameFrench || s.user?.firstName}
                  </td>
                  <td className="p-2 border border-[#C9A24D]/25 text-center font-mono text-[10px]">
                    {s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString('ar-DZ') : '—'}
                  </td>
                  <td className="p-2 border border-[#C9A24D]/25 text-center font-bold">
                    {s.gender === 'female' || s.gender === 'أنثى' ? 'أنثى' : 'ذكر'}
                  </td>
                  <td className="p-2 border border-[#C9A24D]/25 text-center">
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-100 text-slate-700">
                      {s.enrollmentType === 're-enrollment' ? 'إعادة تسجيل' : 'جديد'}
                    </span>
                  </td>
                  <td className="p-2 border border-[#C9A24D]/25 text-center font-medium">
                    {s.regime || 'نصف داخلي'}
                  </td>
                  <td className="p-2 border border-[#C9A24D]/25 text-center">
                    {s.isWaitlisted || s.registrationStatus === 'waitlist' ? (
                      <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        انتظار #{s.waitlistRank || 1}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        مقبول
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Statistical Summary Box */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-2xl text-[11px] text-center">
            <div>
              <span className="text-slate-500 block text-[10px]">إجمالي التلاميذ:</span>
              <span className="font-bold font-mono text-[#7B1E3A] text-sm">{sortedStudents.length}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">الذكور:</span>
              <span className="font-bold font-mono text-slate-800">{males}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">الإناث:</span>
              <span className="font-bold font-mono text-slate-800">{females}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">نصف داخلي:</span>
              <span className="font-bold font-mono text-emerald-800">{demiPension}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">قائمة الانتظار:</span>
              <span className="font-bold font-mono text-amber-700">{waitlisted}</span>
            </div>
          </div>

          {/* Signature Block */}
          <div className="flex items-center justify-between pt-6 border-t border-[#C9A24D]/30 text-xs px-6">
            <div className="text-center">
              <span className="font-bold text-slate-600 block">المراقب العام / ناظر الدروس</span>
              <div className="h-10 mt-2" />
            </div>
            <div className="text-center">
              <span className="font-bold text-[#7B1E3A] block">السيد مدير المؤسسة (الختم الرسمي)</span>
              <div className="w-20 h-20 mx-auto mt-2 rounded-full border border-dashed border-[#7B1E3A]/40 flex items-center justify-center text-[9px] text-[#7B1E3A]">
                ختم الإدارة
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
