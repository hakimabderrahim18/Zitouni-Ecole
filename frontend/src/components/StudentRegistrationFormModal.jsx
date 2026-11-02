import React from 'react';
import { Printer, Download, X, FileText, CheckSquare, Square, User, Calendar, Phone, Award } from 'lucide-react';
import SchoolLogo from './SchoolLogo';
import { useSchoolStore } from '../store/useSchoolStore';

export default function StudentRegistrationFormModal({ student, onClose }) {
  const { settings } = useSchoolStore();

  if (!student) return null;

  const schoolName = settings?.institutionName || 'مؤسسة التربية والتعليم حبر وألوان الخاصة';
  const academicYear = student.academicYear || '2026-2027';
  const docs = student.documentsSubmitted || {};

  const handlePrint = () => {
    window.print();
  };

  const handleSaveHtml = () => {
    const area = document.getElementById('student-reg-form-print-area');
    if (!area) return;

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>استمارة_التسجيل_${student.lastNameArabic || student.user?.lastName}_${student.firstNameArabic || student.user?.firstName}</title>
  <style>
    body { font-family: 'Amiri', 'Times New Roman', serif; padding: 20px; background: white; color: #000; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
    th, td { border: 1px solid #444; padding: 6px; text-align: right; }
    .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #7B1E3A; padding-bottom: 8px; }
  </style>
</head>
<body>
  ${area.innerHTML}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `استمارة_تسجيل_${student.lastNameArabic || student.user?.lastName}_${student.firstNameArabic || student.user?.firstName}.html`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #student-reg-form-print-area, #student-reg-form-print-area * {
            visibility: visible !important;
          }
          #student-reg-form-print-area {
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
        className="bg-white border border-[#C9A24D]/40 rounded-3xl w-full max-w-3xl shadow-2xl relative my-auto overflow-hidden font-sans flex flex-col max-h-[92vh]"
      >
        {/* Toolbar */}
        <div className="no-print p-4 bg-[#F3E9DC] border-b border-[#C9A24D]/35 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#7B1E3A] flex items-center justify-center text-white shadow-xs">
              <FileText className="w-4 h-4 text-[#C9A24D]" />
            </div>
            <div>
              <span className="font-serif font-black text-sm text-[#7B1E3A] block">
                استمارة التسجيل وإعادة التسجيل المدرسية الرسمية (Fiche d'Inscription)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                رقم التسجيل: {student.registrationNumber || '—'} • الرقم الوطني: {student.nationalIdDigitization || '—'}
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
              <span>طباعة الاستمارة (PDF)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Form */}
        <div id="student-reg-form-print-area" className="p-6 sm:p-8 overflow-y-auto space-y-4 bg-white text-[#2B2022]">
          {/* Header */}
          <div className="border-b-2 border-[#7B1E3A] pb-3 flex items-start justify-between">
            <div className="text-right space-y-0.5">
              <p className="text-[10px] font-bold text-slate-600">الجمهورية الجزائرية الديمقراطية الشعبية</p>
              <p className="text-[10px] font-bold text-slate-600">وزارة التربية الوطنية — مديرية التربية للجزائر</p>
              <h2 className="text-base font-serif font-black text-[#7B1E3A] pt-1">{schoolName}</h2>
              <p className="text-[10px] text-[#C9A24D] font-bold">الموسم الدراسي: {academicYear}</p>
            </div>

            <div className="text-center">
              <SchoolLogo size={42} />
            </div>

            {/* Photo Box */}
            <div className="w-20 h-24 border-2 border-dashed border-[#7B1E3A]/40 rounded-xl flex flex-col items-center justify-center text-center p-1 bg-[#FDFBF7]">
              <span className="text-[9px] text-slate-500 leading-tight">صورة شمسية حديثة للتلميذ</span>
            </div>
          </div>

          {/* Form Title */}
          <div className="text-center py-0.5">
            <span className="inline-block px-5 py-1 rounded-full bg-[#7B1E3A]/10 border border-[#7B1E3A]/30 text-[#7B1E3A] font-serif font-black text-sm">
              استمـارة التسجيـل وإعـادة التسجيـل المـدرسيـة الرسميـة
            </span>
          </div>

          {/* Section 1: Civil Status */}
          <div className="p-3 rounded-xl bg-[#FDFBF7] border border-[#C9A24D]/35 space-y-1.5 text-xs">
            <span className="font-bold text-[#7B1E3A] text-xs block border-b border-[#C9A24D]/25 pb-1">
              1. الحالة المدنية والمعلومات الشخصية للتلميذ:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block text-[9.5px]">اللقب والاسم بالعربية:</span>
                <span className="font-bold text-sm text-[#7B1E3A]">
                  {student.lastNameArabic || student.user?.lastName} {student.firstNameArabic || student.user?.firstName}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px]">Nom & Prénom:</span>
                <span className="font-bold font-mono">
                  {student.lastNameFrench || student.user?.lastName} {student.firstNameFrench || student.user?.firstName}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px]">تاريخ ومكان الازدياد:</span>
                <span className="font-bold">
                  {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('ar-DZ') : '—'} ({student.placeOfBirth || 'الجزائر'})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px]">الجنس وفصيلة الدم:</span>
                <span className="font-bold">{student.gender || 'ذكر'} • فصيلة: {student.bloodType || 'O+'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1.5 border-t border-[#C9A24D]/20">
              <div>
                <span className="text-slate-500 block text-[9.5px]">رقم التعريف الوطني (الرقمنة):</span>
                <span className="font-mono font-bold text-slate-800">{student.nationalIdDigitization || 'NAT-09-000000'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px]">رقم التسجيل المدرسي:</span>
                <span className="font-mono font-bold text-[#7B1E3A]">{student.registrationNumber || 'REG-2026-0000'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px]">نوع التسجيل:</span>
                <span className="font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 inline-block text-[10px]">
                  {student.enrollmentType === 're-enrollment' ? 'إعادة تسجيل تلميذ قديم' : 'تسجيل تلميذ جديد'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Pedagogical Class & Regime */}
          <div className="p-3 rounded-xl bg-[#FDFBF7] border border-[#C9A24D]/35 space-y-1.5 text-xs">
            <span className="font-bold text-[#7B1E3A] text-xs block border-b border-[#C9A24D]/25 pb-1">
              2. التوجيه البيداغوجي ونظام التمدرس:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block text-[9.5px]">القسم الموجه إليه:</span>
                <span className="font-bold text-[#7B1E3A] text-sm">{student.class?.name || 'غير محدد'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px]">الفوج التربوي:</span>
                <span className="font-bold">{student.group?.name || 'الفوج العام'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px]">نظام التمدرس:</span>
                <span className="font-bold">{student.regime || 'نصف داخلي'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px]">القسم السابق (إن وجد):</span>
                <span className="font-bold text-slate-700">{student.previousClass?.name || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Parent Information */}
          <div className="p-3 rounded-xl bg-[#FDFBF7] border border-[#C9A24D]/35 space-y-1.5 text-xs">
            <span className="font-bold text-[#7B1E3A] text-xs block border-b border-[#C9A24D]/25 pb-1">
              3. معلومات الولي أو الوصي الشرعي:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block text-[9.5px]">اسم ولقب الولي:</span>
                <span className="font-bold">
                  {student.parent?.user?.firstName || 'أحمد'} {student.parent?.user?.lastName || student.lastNameArabic || 'مزيان'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px]">مهنة الولي:</span>
                <span className="font-bold">{student.parent?.profession || 'موظف'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px]">رقم الهاتف الأساسي:</span>
                <span className="font-mono font-bold text-emerald-800" dir="ltr">
                  {student.parent?.user?.phoneNumber || student.phoneNumber || '0550110022'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px]">العنوان السكني:</span>
                <span className="font-bold">{student.parent?.address || student.address || 'الجزائر العاصمة'}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Required Documents Checklist (Page 14) */}
          <div className="p-3 rounded-xl bg-white border border-[#C9A24D]/35 space-y-1.5 text-xs">
            <span className="font-bold text-[#7B1E3A] text-xs block border-b border-[#C9A24D]/25 pb-1">
              4. الملف والوثائق الإدارية المرفقة (Checklist):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              {[
                { key: 'birthCertificate', label: 'شهادة الميلاد الأصلية' },
                { key: 'photos', label: 'الصور الشمسية الحديثة' },
                { key: 'medicalCertificate', label: 'شهادة طبية وفصيلة الدم' },
                { key: 'vaccinationRecord', label: 'دفتر التلقيح الصحي' },
                { key: 'schoolCertificate', label: 'كشف النقاط / الشهادة المدرسية' },
                { key: 'signedCharter', label: 'التعهد والنظام الداخلي ممضي' },
              ].map(({ key, label }) => {
                const isSub = !!docs[key] || !!student.documentFiles?.[key];
                const hasFile = !!student.documentFiles?.[key];
                const ref = student.documentReferences?.[key];
                return (
                  <div key={key} className="flex items-center justify-between gap-1 border border-slate-100 p-1 rounded">
                    <div className="flex items-center gap-1.5 truncate">
                      {isSub ? (
                        <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate">{label}</span>
                    </div>
                    {hasFile && (
                      <span className="text-[9px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-1 rounded shrink-0">
                        مرفق رقمياً
                      </span>
                    )}
                    {ref && (
                      <span className="text-[9px] text-slate-600 font-mono truncate max-w-[70px]">
                        {ref}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 5: Financial Fees & Receipt */}
          <div className="p-3 rounded-xl bg-[#F3E9DC]/60 border border-[#C9A24D]/35 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-600 block text-[10px]">المبلغ المالي المستحق:</span>
              <span className="font-bold text-sm text-[#7B1E3A] font-mono">
                {(student.tuitionAmount || 15000).toLocaleString('fr-DZ')} دج
                {student.discountPercentage > 0 && ` (تخفيض ${student.discountPercentage}%: ${student.discountReason || ''})`}
              </span>
            </div>
            <div className="text-left font-mono">
              <span className="text-slate-600 block text-[10px]">رقم وصل التسجيل:</span>
              <span className="font-bold text-xs text-emerald-800">{student.receiptNumber || 'REC-2026-0000'}</span>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-[#C9A24D]/30 text-center text-xs">
            <div>
              <span className="font-bold text-slate-700 block">إمضاء ومصادقة الولي</span>
              <div className="h-10 mt-1" />
            </div>
            <div>
              <span className="font-bold text-[#7B1E3A] block">توقيع السيد المدير وختم المؤسسة</span>
              <div className="h-10 mt-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
