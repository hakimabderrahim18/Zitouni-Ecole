import React, { useRef } from 'react';
import {
  Printer,
  Download,
  X,
  GraduationCap,
  User,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  FileText,
  HeartPulse,
  Award,
} from 'lucide-react';
import SchoolLogo from './SchoolLogo';
import { useSchoolStore } from '../store/useSchoolStore';

export default function StudentProfileFileModal({ student, onClose }) {
  const printRef = useRef(null);
  const { settings } = useSchoolStore();

  if (!student) return null;

  const u = student.user || {};
  const parentUser = student.parent?.user || {};
  const className = student.class?.name || 'غير محدد';
  const groupName = student.group?.name || 'فوج 1';

  const handlePrint = () => {
    window.print();
  };

  const handleSaveFile = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const studentName = `${student.firstNameArabic || u.firstName || 'تلميذ'}_${student.lastNameArabic || u.lastName || ''}`.replace(/\s+/g, '_');
    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>الملف الإداري للتلميذ - ${studentName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #fff; color: #2B2022; }
  </style>
</head>
<body class="p-8">
  ${content}
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `الملف_الإداري_${studentName}_${student.registrationNumber || '2026'}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Compute age from date of birth
  let age = '—';
  let formattedDob = '—';
  if (student.dateOfBirth) {
    const dob = new Date(student.dateOfBirth);
    formattedDob = dob.toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const diff = Date.now() - dob.getTime();
    age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)) + ' سنة';
  }

  const primaryColor = settings?.primaryColor || '#7B1E3A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #student-dossier-print, #student-dossier-print * {
            visibility: visible !important;
          }
          #student-dossier-print {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: auto !important;
            margin: 0 !important;
            padding: 10mm 15mm !important;
            background: white !important;
            overflow: visible !important;
            z-index: 99999 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div
        dir="rtl"
        className="bg-white border border-[#C9A24D]/40 rounded-3xl w-full max-w-4xl shadow-2xl relative my-auto overflow-hidden font-sans max-h-[92vh] flex flex-col"
      >
        {/* Modal Toolbar (hidden when printing) */}
        <div className="no-print p-4 sm:px-6 bg-[#F3E9DC] border-b border-[#C9A24D]/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#7B1E3A]" />
            <span className="font-serif font-black text-sm text-[#7B1E3A]">
              الملف الإداري المدرسي الشامل للتلميذ (Fiche Individuelle)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Save / Download as HTML */}
            <button
              onClick={handleSaveFile}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-[#7B1E3A] border border-[#C9A24D]/40 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="حفظ الملف كاملاً على الجهاز"
            >
              <Download className="w-4 h-4 text-[#C9A24D]" />
              <span>حفظ الملف (Enregistrer)</span>
            </button>

            {/* Print / Save to PDF */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#7B1E3A] hover:bg-[#60162c] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              title="طباعة الملف مباشرة أو حفظ كـ PDF"
            >
              <Printer className="w-4 h-4 text-[#C9A24D]" />
              <span>طباعة الملف (Imprimer / PDF)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer border border-[#C9A24D]/30"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Sheet Area */}
        <div
          ref={printRef}
          id="student-dossier-print"
          className="p-8 sm:p-12 overflow-y-auto space-y-6 text-[#2B2022] bg-[#FDFBF7]"
        >
          {/* Header of Republic & Ministry */}
          <div className="border-b-2 border-[#C9A24D] pb-6 space-y-3">
            <div className="flex items-center justify-between text-center text-xs text-[#2B2022] font-serif">
              <div className="text-right space-y-0.5">
                <p className="font-bold">الجمهورية الجزائرية الديمقراطية الشعبية</p>
                <p className="font-bold">وزارة التربية الوطنية</p>
                <p className="text-[11px] text-slate-600 font-sans">مديرية التربية لولاية الجزائر</p>
              </div>

              <div className="flex flex-col items-center">
                <SchoolLogo size={60} />
                <h1 className="font-serif font-black text-base text-[#7B1E3A] mt-1">
                  {settings?.institutionName || 'مؤسسة التربية والتعليم حبر وألوان الخاصة'}
                </h1>
                <span className="text-[10px] text-slate-500 font-sans tracking-wide">
                  {settings?.schoolNameFrench || 'Groupe scolaire Encre & Pastel'}
                </span>
              </div>

              <div className="text-left space-y-0.5 font-mono text-[11px]">
                <p className="font-bold">السنة الدراسية: {student.academicYear || '2026-2027'}</p>
                <p className="text-[#7B1E3A] font-bold">الرقم المرجعي: {student.registrationNumber || 'STU-001'}</p>
                <p className="text-slate-500">رقم الرقمنة: {student.nationalIdDigitization || 'NAT-09-001'}</p>
              </div>
            </div>

            {/* Document Title Ribbon */}
            <div className="text-center py-2.5 bg-[#7B1E3A] text-white rounded-xl shadow-xs mt-3">
              <h2 className="text-lg font-serif font-black tracking-wide">
                الملف الإداري والتأهيلي الشامل للتلميذ
              </h2>
              <span className="text-[10px] font-sans text-amber-200 block">
                DOSSIER SCOLAIRE & FICHE INDIVIDUELLE D'ÉLÈVE
              </span>
            </div>
          </div>

          {/* Student Profile Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
            {/* Student Photo Card */}
            <div className="col-span-1 flex flex-col items-center justify-center p-4 bg-white border border-[#C9A24D]/35 rounded-2xl shadow-xs text-center space-y-2">
              <div className="w-28 h-36 rounded-xl bg-slate-100 border-2 border-dashed border-[#C9A24D] overflow-hidden flex items-center justify-center relative">
                {u.profilePic ? (
                  <img src={u.profilePic} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-slate-400">
                    <User className="w-12 h-12 text-[#C9A24D]" />
                    <span className="text-[9px] mt-1 font-bold">صورة التلميذ</span>
                  </div>
                )}
              </div>
              <span className="text-xs font-bold text-[#7B1E3A] font-mono">
                {student.registrationNumber}
              </span>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                تسجيل ساري المفعول
              </span>
            </div>

            {/* General Identity Details */}
            <div className="col-span-3 bg-white border border-[#C9A24D]/35 rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="font-serif font-black text-[#7B1E3A] text-sm flex items-center gap-2 pb-2 border-b border-[#C9A24D]/25">
                <User className="w-4 h-4 text-[#C9A24D]" />
                <span>الهوية والحالة المدنية للتلميذ</span>
              </h3>

              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">الاسم الكامل بالعربية:</span>
                  <span className="font-bold text-sm text-[#2B2022]">
                    {student.firstNameArabic || u.firstName} {student.lastNameArabic || u.lastName}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">الاسم الكامل بالفرنسية:</span>
                  <span className="font-semibold text-xs text-slate-700 font-sans" dir="ltr">
                    {student.firstNameFrench || u.firstName} {student.lastNameFrench || u.lastName}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">تاريخ الميلاد والسن:</span>
                  <span className="font-bold text-[#2B2022]">{formattedDob} ({age})</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">مكان الميلاد:</span>
                  <span className="font-bold text-[#2B2022]">{student.placeOfBirth || 'الجزائر'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">الجنس:</span>
                  <span className="font-bold text-[#2B2022]">{student.gender || 'غير محدد'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">فصيلة الدم:</span>
                  <span className="font-bold text-rose-700 font-mono">{student.bloodType || 'O+'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Placement Details */}
          <div className="bg-white border border-[#C9A24D]/35 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="font-serif font-black text-[#7B1E3A] text-sm flex items-center gap-2 pb-2 border-b border-[#C9A24D]/25">
              <GraduationCap className="w-4 h-4 text-[#C9A24D]" />
              <span>المعلومات البيداغوجية والتمدرس</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-[#FDFBF7] rounded-xl border border-[#C9A24D]/25">
                <span className="text-slate-400 block text-[10px]">القسم الدراسي:</span>
                <span className="font-bold text-base text-[#7B1E3A] font-serif">{className}</span>
              </div>

              <div className="p-3 bg-[#FDFBF7] rounded-xl border border-[#C9A24D]/25">
                <span className="text-slate-400 block text-[10px]">الفوج البيداغوجي:</span>
                <span className="font-bold text-base text-[#7B1E3A] font-serif">{groupName}</span>
              </div>

              <div className="p-3 bg-[#FDFBF7] rounded-xl border border-[#C9A24D]/25">
                <span className="text-slate-400 block text-[10px]">نظام التمدرس والإطعام:</span>
                <span className="font-bold text-sm text-[#2B2022]">{student.regime || 'نصف داخلي (Demi-pension)'}</span>
              </div>

              <div className="p-3 bg-[#FDFBF7] rounded-xl border border-[#C9A24D]/25">
                <span className="text-slate-400 block text-[10px]">تاريخ التسجيل الرسمي:</span>
                <span className="font-bold text-sm text-[#2B2022] font-mono">
                  {new Date(student.registrationDate || student.createdAt || Date.now()).toLocaleDateString('ar-DZ')}
                </span>
              </div>
            </div>
          </div>

          {/* Guardian / Parent Information */}
          <div className="bg-white border border-[#C9A24D]/35 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="font-serif font-black text-[#7B1E3A] text-sm flex items-center gap-2 pb-2 border-b border-[#C9A24D]/25">
              <ShieldCheck className="w-4 h-4 text-[#C9A24D]" />
              <span>بيانات الولي الشرعي وتفاصيل الاتصال</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-6 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">اسم الولي / المسؤول المدني:</span>
                <span className="font-bold text-[#2B2022]">
                  {parentUser.firstName || student.parent?.firstName || 'مزيان'} {parentUser.lastName || student.parent?.lastName || 'أحمد'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">رقم هاتف الولي:</span>
                <span className="font-bold text-emerald-800 font-mono text-sm" dir="ltr">
                  {parentUser.phoneNumber || student.parent?.phoneNumber || '0550110011'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">المهنة:</span>
                <span className="font-bold text-[#2B2022]">{student.parent?.profession || 'موظف'}</span>
              </div>

              <div className="col-span-2">
                <span className="text-slate-400 block text-[11px]">العنوان السكني المعتمد:</span>
                <span className="font-medium text-[#2B2022]">{student.address || student.parent?.address || 'الجزائر العاصمة'}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">البريد الإلكتروني للولي:</span>
                <span className="font-mono text-slate-700" dir="ltr">{parentUser.email || 'parent@ecole-zitouni.dz'}</span>
              </div>
            </div>
          </div>

          {/* Official Administrative Stamp & Visa Box */}
          <div className="pt-4 border-t-2 border-[#C9A24D] grid grid-cols-3 gap-4 items-end text-xs">
            <div className="space-y-1 text-center">
              <p className="font-bold text-[#7B1E3A]">توقيع ولي الأمر</p>
              <p className="text-[10px] text-slate-400">بالمصادقة على صحة البيانات</p>
              <div className="h-16 border border-dashed border-[#C9A24D]/40 rounded-xl" />
            </div>

            <div className="flex flex-col items-center justify-center text-center space-y-1">
              <div className="w-16 h-16 border border-slate-300 rounded-xl flex items-center justify-center p-1 bg-white">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=ZITOUNI_STUDENT_${student.registrationNumber}`}
                  alt="QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[9px] text-slate-400 font-mono">رمز التحقق الرقمي الرسمي</span>
            </div>

            <div className="space-y-1 text-center">
              <p className="font-bold text-[#7B1E3A]">خاتم وتأشيرة إدارة المؤسسة</p>
              <p className="text-[10px] text-slate-400">المدير العام للمؤسسة</p>
              <div className="h-16 border border-dashed border-[#C9A24D]/40 rounded-xl flex items-center justify-center text-[#7B1E3A] font-serif font-black text-xs">
                مدرسة حبر الخاصة
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
