import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, X, FileText, CheckCircle2 } from 'lucide-react';
import SchoolLogo from './SchoolLogo';
import { useSchoolStore } from '../store/useSchoolStore';

export default function TeacherWorkCertificateModal({ isOpen, onClose, teacher, dossier }) {
  const { settings } = useSchoolStore();
  const printRef = useRef(null);

  if (!isOpen || (!teacher && !dossier)) return null;

  const u = dossier?.user || teacher?.user || {};
  const teacherNameArabic = `${u.firstNameArabic || u.firstName || ''} ${u.lastNameArabic || u.lastName || ''}`.trim() || 'الأستاذ';
  const teacherNameFrench = `${u.firstNameFrench || u.firstName || ''} ${u.lastNameFrench || u.lastName || ''}`.trim();
  const jobTitle = u.jobTitle || (u.role === 'teacher' ? 'أستاذ(ة) تعليم' : u.role);
  const specialization = dossier?.specialization || (dossier?.subjects || []).join('، ') || 'التعليم العام';
  const cycle = dossier?.cycle === 'middle' ? 'التعليم المتوسط' : dossier?.cycle === 'secondary' ? 'التعليم الثانوي' : 'التعليم الابتدائي';
  const contractType = dossier?.contractType || u.contractType || 'غير محدد المدة (CDI)';

  const hiringDateFormatted = dossier?.hiringDate
    ? new Date(dossier.hiringDate).toLocaleDateString('ar-DZ')
    : u.hiringDate
    ? new Date(u.hiringDate).toLocaleDateString('ar-DZ')
    : 'بداية الموسم الدراسي';

  const issueDateFormatted = new Date().toLocaleDateString('ar-DZ');
  const certNumber = `CERT-TR-${new Date().getFullYear()}-${(u._id || '001').toString().slice(-4).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-white border border-[#C9A24D]/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-right font-sans"
          dir="rtl"
        >
          {/* Header Controls */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#C9A24D]/25 bg-[#F3E9DC] print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7B1E3A]/10 border border-[#7B1E3A]/25 flex items-center justify-center text-[#7B1E3A]">
                <FileText className="w-5 h-5 text-[#C9A24D]" />
              </div>
              <div>
                <h3 className="font-serif font-black text-[#7B1E3A] text-sm">
                  شهادة عمل رسمية (المادة 24)
                </h3>
                <p className="text-[11px] text-slate-600">
                  وثيقة إدارية رسمية تثبت ممارسة المهنة وتحمل هوية المؤسسة
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-[#7B1E3A] hover:bg-[#60162c] text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer border border-[#C9A24D]/30"
              >
                <Printer className="w-4 h-4 text-[#C9A24D]" />
                <span>طباعة الشهادة</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl transition-colors cursor-pointer border border-[#C9A24D]/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Body */}
          <div className="overflow-y-auto p-6 md:p-10 bg-[#FDFBF7] text-[#2B2022] print:p-0 print:m-0 print:overflow-visible">
            <div
              ref={printRef}
              className="max-w-xl mx-auto border-2 border-[#7B1E3A] p-8 rounded-2xl shadow-sm print:border-none print:shadow-none bg-white space-y-8 font-serif"
            >
              {/* Header */}
              <div className="border-b-2 border-[#C9A24D] pb-5">
                <div className="flex items-center justify-between text-center text-xs">
                  <div className="text-right space-y-0.5">
                    <p className="font-bold">الجمهورية الجزائرية الديمقراطية الشعبية</p>
                    <p className="font-bold">وزارة التربية الوطنية</p>
                    <p className="text-[10px] text-slate-600 font-sans">مديرية التربية والتعليم الخاصة</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <SchoolLogo size={55} />
                    <h2 className="font-black text-xs text-[#7B1E3A] mt-1">
                      {settings?.institutionName || 'مؤسسة التربية والتعليم حبر وألوان الخاصة'}
                    </h2>
                  </div>
                  <div className="text-left space-y-0.5 font-mono text-[11px]">
                    <p className="font-bold">الرقم: {certNumber}</p>
                    <p className="text-slate-500 font-sans">التاريخ: {issueDateFormatted}</p>
                  </div>
                </div>

                <div className="text-center py-2.5 bg-[#7B1E3A] text-white rounded-xl shadow-xs mt-4">
                  <h1 className="text-lg font-black tracking-wider">
                    شـهـــادة عـمـــــل
                  </h1>
                  <span className="text-[10px] text-amber-200 font-sans">
                    ATTESTATION DE TRAVAIL OFFICIELLE
                  </span>
                </div>
              </div>

              {/* Certificate Text */}
              <div className="space-y-6 text-sm leading-relaxed text-[#2B2022] pt-2">
                <p>
                  يشهد مدير مؤسسة التربية والتعليم الخاصة <strong>«{settings?.institutionName || 'حبر وألوان'}»</strong> المعتمدة من طرف وزارة التربية الوطنية، بأن السيد(ة):
                </p>

                <div className="p-4 bg-slate-50 border rounded-xl space-y-1 text-center font-sans">
                  <h3 className="text-base font-black text-[#7B1E3A]">
                    {teacherNameArabic}
                  </h3>
                  {teacherNameFrench && (
                    <p className="text-xs text-slate-600" dir="ltr">
                      {teacherNameFrench}
                    </p>
                  )}
                </div>

                <div className="space-y-3 pr-2">
                  <p>
                    يعمل / تعمل لدى مؤسستنا بصفة: <strong className="text-[#7B1E3A]">{jobTitle}</strong>.
                  </p>
                  <p>
                    مادة التخصص: <strong>{specialization}</strong> ({cycle}).
                  </p>
                  <p>
                    وذلك ابتداءً من تاريخ: <strong className="font-mono">{hiringDateFormatted}</strong> إلى غاية يومنا هذا، بموجب عقد عمل من نوع: <strong>{contractType}</strong>.
                  </p>
                  <p className="text-xs text-slate-600 italic pt-2">
                    سُلمت له / لها هذه الشهادة بناءً على طلبه(ا) للإدلاء بها واستعمالها في حدود ما يسمح به القانون والتشريع المعمول به.
                  </p>
                </div>
              </div>

              {/* Stamping */}
              <div className="pt-8 border-t-2 border-slate-200 flex justify-between items-end text-xs">
                <div className="space-y-1 font-sans text-slate-500 text-[10px]">
                  <p>• وثيقة صادرة عن النظام الإلكتروني الرسمي (المادة 24)</p>
                  <p>• الرقم التسلسلي: {certNumber}</p>
                </div>

                <div className="text-center space-y-6 pl-4">
                  <p className="font-bold text-[#7B1E3A]">خاتم وتوقيع مدير المؤسسة:</p>
                  <div className="h-12"></div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
