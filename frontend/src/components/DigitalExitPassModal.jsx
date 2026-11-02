import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, X, ShieldCheck, Clock, User, CheckCircle2, FileText, QrCode } from 'lucide-react';
import SchoolLogo from './SchoolLogo';
import { useSchoolStore } from '../store/useSchoolStore';

export default function DigitalExitPassModal({ isOpen, onClose, pass, student }) {
  const { settings } = useSchoolStore();
  const printRef = useRef(null);

  if (!isOpen || (!pass && !student)) return null;

  const studentName = student?.firstNameArabic && student?.lastNameArabic
    ? `${student.firstNameArabic} ${student.lastNameArabic}`
    : `${student?.user?.firstName || ''} ${student?.user?.lastName || ''}`.trim() || 'التلميذ';

  const className = student?.class?.name || pass?.class?.name || 'القسم';
  const issueDateFormatted = pass?.date
    ? new Date(pass.date).toLocaleDateString('ar-DZ')
    : new Date().toLocaleDateString('ar-DZ');

  const exitTime = pass?.exitTime || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const reason = pass?.reason || 'تصريح خروج مرخص بطلب من الإدارة أو الولي';
  const accompaniedBy = pass?.accompaniedBy || student?.parent?.fatherNameArabic || student?.parent?.phoneNumber || 'ولي الأمر / مرخص له';
  const passId = pass?._id ? pass._id.toString().slice(-6).toUpperCase() : `EXT-${Math.floor(1000 + Math.random() * 9000)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-white border border-[#C9A24D]/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-right font-sans"
          dir="rtl"
        >
          {/* Header Controls (Screen only) */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#C9A24D]/25 bg-[#F3E9DC] print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7B1E3A]/10 border border-[#7B1E3A]/25 flex items-center justify-center text-[#7B1E3A]">
                <ShieldCheck className="w-5 h-5 text-[#C9A24D]" />
              </div>
              <div>
                <h3 className="font-serif font-black text-[#7B1E3A] text-sm">
                  تصريح خروج رقمي مرخص (المادة 28)
                </h3>
                <p className="text-[11px] text-slate-600">
                  إذن خروج استثنائي رسمي للتلميذ مؤشر من الإدارة التربوية
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
                <span>طباعة التصريح</span>
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

          {/* Printable Voucher Body */}
          <div className="overflow-y-auto p-6 md:p-8 bg-[#FDFBF7] text-[#2B2022] print:p-0 print:m-0 print:overflow-visible">
            <div
              ref={printRef}
              className="max-w-xl mx-auto border-2 border-[#7B1E3A] p-6 rounded-2xl shadow-sm print:border-2 print:border-black bg-white space-y-5"
            >
              {/* Official Header */}
              <div className="border-b-2 border-[#C9A24D] pb-4">
                <div className="flex items-center justify-between text-center text-xs font-serif">
                  <div className="text-right space-y-0.5">
                    <p className="font-bold">الجمهورية الجزائرية الديمقراطية الشعبية</p>
                    <p className="font-bold">وزارة التربية الوطنية</p>
                    <p className="text-[10px] text-slate-600">مديرية التربية والتعليم الخاصة</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <SchoolLogo size={50} />
                    <h2 className="font-serif font-black text-xs text-[#7B1E3A] mt-1">
                      {settings?.institutionName || 'مؤسسة التربية والتعليم حبر وألوان الخاصة'}
                    </h2>
                  </div>
                  <div className="text-left space-y-0.5 font-mono text-[11px]">
                    <p className="font-bold">التاريخ: {issueDateFormatted}</p>
                    <p className="text-[#7B1E3A] font-bold">رقم التصريح: {passId}</p>
                    <p className="text-slate-500">المادة 28 - نظام داخلي</p>
                  </div>
                </div>

                <div className="text-center py-2 bg-[#7B1E3A] text-white rounded-xl shadow-xs mt-3">
                  <h1 className="text-base font-serif font-black tracking-wide">
                    بطاقة تصريح خروج مرخص للتلميذ
                  </h1>
                  <span className="text-[10px] text-amber-200">
                    AUTORISATION DE SORTIE EXCEPTIONNELLE NUMÉRIQUE
                  </span>
                </div>
              </div>

              {/* Student and Exit Information */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-400 block text-[10px]">اسم ولقب التلميذ:</span>
                  <span className="font-bold text-sm text-[#7B1E3A]">{studentName}</span>
                  <span className="text-slate-500 text-[11px] block font-mono">
                    القسم: <strong>{className}</strong>
                  </span>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                  <span className="text-amber-800 block text-[10px] font-bold">توقيت الخروج المرخص:</span>
                  <span className="font-bold text-sm text-[#7B1E3A] font-mono flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#C9A24D]" />
                    <span>الساعة: {exitTime}</span>
                  </span>
                  <span className="text-slate-600 text-[10px] block">بتأشيرة المستشار التربوي</span>
                </div>

                <div className="col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-400 block text-[10px]">سبب الخروج:</span>
                  <span className="font-semibold text-xs text-slate-800">{reason}</span>
                </div>

                <div className="col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-400 block text-[10px]">المرافق المصرح به عند المغادرة:</span>
                  <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#C9A24D]" />
                    <span>{accompaniedBy}</span>
                  </span>
                </div>
              </div>

              {/* Status and Verification Box */}
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="font-bold text-emerald-900 block">مرخص ومسجل بالنظام الرقمي للمؤسسة</span>
                    <span className="text-[10px] text-emerald-700">تلقائي وفق أحكام المادة 28</span>
                  </div>
                </div>
                <span className="px-3 py-1 bg-white font-mono text-[11px] font-bold text-emerald-800 border border-emerald-300 rounded-lg">
                  معتمد ومؤكد
                </span>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t-2 border-slate-200 text-xs text-center font-serif">
                <div className="p-3 bg-white border rounded-xl space-y-6">
                  <span className="font-bold block text-slate-700">تأشيرة المستشار / المشرف التربوي:</span>
                  <div className="h-6"></div>
                </div>
                <div className="p-3 bg-white border rounded-xl space-y-6">
                  <span className="font-bold block text-[#7B1E3A]">مراقبة عون الاستقبال / الأمن عند البوابة:</span>
                  <div className="h-6"></div>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 font-mono pt-1">
                يسلم هذا التصريح لعون الأمن عند باب المؤسسة قبل الخروج الفعلي
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
