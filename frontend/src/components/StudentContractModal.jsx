import React from 'react';
import { Printer, Download, X, FileCheck, ShieldCheck, User, Calendar, Phone, Award } from 'lucide-react';
import SchoolLogo from './SchoolLogo';
import { useSchoolStore } from '../store/useSchoolStore';

export default function StudentContractModal({ student, onClose }) {
  const { settings } = useSchoolStore();

  if (!student) return null;

  const schoolName = settings?.institutionName || 'مؤسسة التربية والتعليم حبر وألوان الخاصة';
  const academicYear = student.academicYear || '2026-2027';
  const contractNumber = `CTR-${academicYear.split('-')[0]}-${String(student.registrationNumber || student._id).slice(-4)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleSaveHtml = () => {
    const printArea = document.getElementById('student-contract-print-area');
    if (!printArea) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>عقد_التسجيل_المدرسي_${student.lastNameArabic || student.user?.lastName}_${student.firstNameArabic || student.user?.firstName}</title>
  <style>
    body { font-family: 'Amiri', 'Times New Roman', serif; background: #fff; color: #2B2022; padding: 25px; line-height: 1.6; }
    .header { text-align: center; border-bottom: 2px solid #7B1E3A; padding-bottom: 15px; margin-bottom: 20px; }
    .box { border: 1px solid #C9A24D; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
    .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .table th, .table td { border: 1px solid #C9A24D; padding: 8px; text-align: right; }
    .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
  </style>
</head>
<body>
  ${printArea.innerHTML}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `عقد_التسجيل_المدرسي_${student.lastNameArabic || student.user?.lastName}_${student.firstNameArabic || student.user?.firstName}.html`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      {/* Print isolation stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #student-contract-print-area, #student-contract-print-area * {
            visibility: visible !important;
          }
          #student-contract-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
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
            <div className="w-8 h-8 rounded-xl bg-[#7B1E3A] flex items-center justify-center shadow-xs">
              <FileCheck className="w-4 h-4 text-[#F3E9DC]" />
            </div>
            <div>
              <span className="font-serif font-black text-sm text-[#7B1E3A] block">
                عقد ووثيقة التسجيل والتعهد المدرسي الرسمي (Contrat de Scolarisation)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">رقم العقد: {contractNumber}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveHtml}
              className="px-3.5 py-1.5 bg-white border border-[#C9A24D]/40 hover:bg-[#FDFBF7] text-[#7B1E3A] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-[#C9A24D]" />
              <span>حفظ العقد</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-[#7B1E3A] hover:bg-[#60162c] text-[#F3E9DC] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4 text-[#C9A24D]" />
              <span>طباعة العقد (PDF)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Contract Body */}
        <div id="student-contract-print-area" className="p-6 sm:p-10 overflow-y-auto space-y-6 text-[#2B2022] bg-white">
          {/* Header */}
          <div className="text-center space-y-1.5 border-b-2 border-[#7B1E3A] pb-4">
            <p className="text-xs font-bold text-slate-600">الجمهورية الجزائرية الديمقراطية الشعبية</p>
            <p className="text-xs font-bold text-slate-600">وزارة التربية الوطنية — مديرية التربية للجزائر</p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <SchoolLogo size={42} />
              <div className="text-right">
                <h1 className="text-xl font-serif font-black text-[#7B1E3A]">{schoolName}</h1>
                <p className="text-[11px] text-[#C9A24D] font-bold">لجميع الأطوار التعليمية: ابتدائي — متوسط — ثانوي</p>
              </div>
            </div>
          </div>

          {/* Title Badge */}
          <div className="text-center py-2">
            <span className="inline-block px-5 py-1.5 rounded-full bg-[#7B1E3A]/10 border-2 border-[#7B1E3A]/30 text-[#7B1E3A] font-serif font-black text-base shadow-xs">
              عقـد ووثيقـة التسجيـل والتعهـد المـدرسـي الرسمـي ({academicYear})
            </span>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">المرجع الإداري: {contractNumber} • الرقم الوطني: {student.nationalIdDigitization || 'NAT-09-000000'}</p>
          </div>

          {/* Contract Parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#C9A24D]/35 space-y-1.5">
              <span className="font-bold text-[#7B1E3A] block text-xs border-b border-[#C9A24D]/20 pb-1">
                الطرف الأول: إدارة المؤسسة
              </span>
              <p className="font-bold">{schoolName}</p>
              <p className="text-slate-600">العنوان: الجزائر العاصمة، الجزائر</p>
              <p className="text-slate-600">الهاتف: 0550 00 00 00 / واتساب: +213 554 07 57 01</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#C9A24D]/35 space-y-1.5">
              <span className="font-bold text-[#7B1E3A] block text-xs border-b border-[#C9A24D]/20 pb-1">
                الطرف الثاني: الولي أو الوصي الشرعي
              </span>
              <p className="font-bold">
                السيد(ة): {student.parent?.user?.firstName || 'أحمد'} {student.parent?.user?.lastName || student.lastNameArabic || 'مزيان'}
              </p>
              <p className="text-slate-600">الصفة: ولي أمر التلميذ (الأب / الأم / الوصي)</p>
              <p className="text-slate-600">رقم الهاتف: {student.parent?.user?.phoneNumber || '0550110022'}</p>
              <p className="text-slate-600">العنوان: {student.parent?.address || student.address || 'الجزائر العاصمة'}</p>
            </div>
          </div>

          {/* Student Profile Overview */}
          <div className="p-4 rounded-2xl bg-[#F3E9DC]/40 border border-[#C9A24D]/35 space-y-2 text-xs">
            <span className="font-serif font-black text-[#7B1E3A] block text-sm">
              معلومات التلميذ(ة) المستفيد(ة) من التمدرس:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">الاسم واللقب بالعربية:</span>
                <span className="font-bold text-[#7B1E3A] text-sm">
                  {student.firstNameArabic || student.user?.firstName} {student.lastNameArabic || student.user?.lastName}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">الاسم باللاتينية:</span>
                <span className="font-bold font-mono">
                  {student.firstNameFrench || student.user?.firstName} {student.lastNameFrench || student.user?.lastName}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">تاريخ الازدياد:</span>
                <span className="font-bold font-mono">
                  {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('ar-DZ') : '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">رقم التسجيل المدرسي:</span>
                <span className="font-bold font-mono text-[#7B1E3A]">{student.registrationNumber || 'REG-2026-0000'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-[#C9A24D]/25">
              <div>
                <span className="text-slate-500 block text-[10px]">القسم الموجه إليه:</span>
                <span className="font-bold text-[#7B1E3A]">{student.class?.name || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">نوع التسجيل:</span>
                <span className="font-bold">
                  {student.enrollmentType === 're-enrollment' ? 'إعادة تسجيل تلميذ قديم' : 'تسجيل تلميذ جديد'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">النظام المعتمد:</span>
                <span className="font-bold">{student.regime || 'نصف داخلي'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">المبلغ المستحق للدفع:</span>
                <span className="font-bold text-emerald-800 font-mono">
                  {(student.tuitionAmount || 15000).toLocaleString('fr-DZ')} دج
                  {student.discountPercentage > 0 && ` (تخفيض ${student.discountPercentage}%)`}
                </span>
              </div>
            </div>
          </div>

          {/* Contract Terms */}
          <div className="space-y-3 text-xs leading-relaxed">
            <span className="font-serif font-black text-[#7B1E3A] text-sm block">
              بنـود وشـروط الاتفـاق والتعهـد المـدرسـي:
            </span>

            <div className="space-y-2 p-4 rounded-2xl bg-white border border-[#C9A24D]/25 text-[11.5px] leading-relaxed">
              <p>
                <strong>البند الأول (الالتزام البيداغوجي):</strong> تلتزم إدارة المؤسسة بتقديم برامج ومناهج وزارة التربية الوطنية وتوفير خيرة الأساتذة والمرافق التعليمية لضمان نجاح التلميذ.
              </p>
              <p>
                <strong>البند الثاني (الانضباط والمواظبة):</strong> يتعهد ولي الأمر بحرص التلميذ على الحضور اليومي في المواعيد المحددة وارتداء المئزر المدرسي وتبرير أي غياب أو تأخر فور حدوثه.
              </p>
              <p>
                <strong>البند الثالث (الرسوم والالتزامات المالية):</strong> يتعهد ولي الأمر بسداد الأقساط المدرسية في الآجال المحددة، وفي حال وجود تخفيض (إخوة أو طاقم)، يظل سارياً طوال التزام التلميذ بالانضباط.
              </p>
              <p>
                <strong>البند الرابع (الحفاظ على الممتلكات والتجهيزات):</strong> يتحمل ولي الأمر كامل المسؤولية المادية عن أي إتلاف أو ضرر متعمد لتجهيزات المؤسسة وفق تقرير المراقب العام ومسؤول الصيانة.
              </p>
              <p>
                <strong>البند الخامس (المتابعة الرقمية):</strong> يوافق الطرفان على اعتماد المنصة الرقمية للتواصل الفوري ومتابعة كراس الدروس، الغيابات، النتائج الفصلية، والإعلانات الإدارية الرسمية.
              </p>
            </div>
          </div>

          {/* Signatures and Stamp */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-[#C9A24D]/40 text-center text-xs">
            <div className="space-y-12">
              <div>
                <span className="font-bold text-[#7B1E3A] block">توقيع ولي الأمر أو الوصي الشرعي</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">(قرئ وصودق عليه مع الالتزام التام)</span>
              </div>
              <div className="h-10 border-b border-dashed border-slate-400 w-3/4 mx-auto" />
            </div>

            <div className="space-y-4">
              <div>
                <span className="font-bold text-[#7B1E3A] block">إدارة المؤسسة والختم الرسمي</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">حرر بالجزائر العاصمة بتاريخ: {new Date().toLocaleDateString('ar-DZ')}</span>
              </div>
              <div className="w-24 h-24 mx-auto rounded-full border-2 border-dashed border-[#7B1E3A]/40 flex items-center justify-center text-[10px] text-[#7B1E3A] font-bold">
                الختم وتوقيع المدير
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
