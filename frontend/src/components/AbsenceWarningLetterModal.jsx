import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, X, AlertTriangle, MessageSquare, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { useSchoolStore } from '../store/useSchoolStore';

export default function AbsenceWarningLetterModal({ isOpen, onClose, warning, student }) {
  const { settings } = useSchoolStore();
  const printRef = useRef(null);

  if (!isOpen || (!warning && !student)) return null;

  const studentName = student?.firstNameArabic && student?.lastNameArabic
    ? `${student.firstNameArabic} ${student.lastNameArabic}`
    : `${student?.user?.firstName || ''} ${student?.user?.lastName || ''}`.trim() || 'التلميذ';

  const className = student?.class?.name || warning?.class?.name || 'القسم';
  const issueDateFormatted = warning?.issueDate
    ? new Date(warning.issueDate).toLocaleDateString('ar-DZ')
    : new Date().toLocaleDateString('ar-DZ');

  const absenceDates = warning?.absenceDates || [];

  const [whatsappSent, setWhatsappSent] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = async () => {
    const rawPhone = student?.parent?.phoneNumber || student?.user?.phoneNumber || '';
    if (!rawPhone) {
      alert('رقم هاتف ولي الأمر غير متوفر في ملف التلميذ.');
      return;
    }

    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '213' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('213')) {
      cleanPhone = '213' + cleanPhone;
    }

    const messageText = `السلام عليكم ورحمة الله، ولي أمر التلميذ(ة) *${studentName}* (القسم: ${className}).\n\nنحيطكم علماً بصدور *استدعاء رسمي وإنذار بالغياب (رقم ${warning?.warningLevel || 1})* لتجاوز التلميذ ثلاث (03) غيابات غير مبررة بمؤسسة حبر وألوان الخاصة.\n\nيرجى التقرب من مصلحة الاستشارة التربوية بالمؤسسة لتسوية الوضعية وتفادي الإجراءات التأديبية المنصوص عليها في المادة 26 من النظام الداخلي.\n\nإدارة مؤسسة حبر وألوان`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, '_blank');

    if (warning?._id) {
      try {
        await axios.post(`/api/attendance/warning/${warning._id}/whatsapp-log`);
        setWhatsappSent(true);
      } catch (e) {
        // Log fail silently
      }
    } else {
      setWhatsappSent(true);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header controls (Screen only) - Prestige Académique */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#C9A24D]/25 bg-[#F3E9DC]/70 print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7B1E3A]/10 border border-[#7B1E3A]/25 flex items-center justify-center text-[#7B1E3A]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-[#7B1E3A] text-base">استدعاء ولي الأمر / إنذار رسمي بالغياب</h3>
                <p className="text-xs text-[#2B2022]/70">نموذج رسمي قابل للطباعة بموجب المادة 26 من دفتر الشروط</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer border border-emerald-500"
                title="إرسال إشعار فوري لولي الأمر عبر واتساب (المادة 26)"
              >
                {whatsappSent ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>تم فتح واتساب</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 text-emerald-200" />
                    <span>إرسال عبر واتساب</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-[#7B1E3A] hover:bg-[#62162d] text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-[#7B1E3A]/20 cursor-pointer border border-[#C9A24D]/30"
              >
                <Printer className="w-4 h-4 text-[#C9A24D]" />
                <span>طباعة الاستدعاء</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-[#2B2022]/70 hover:text-[#7B1E3A] hover:bg-white/80 rounded-xl transition-colors cursor-pointer border border-[#C9A24D]/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Document Body */}
          <div className="overflow-y-auto p-6 md:p-8 bg-white text-[#2B2022] font-sans print:p-0 print:m-0 print:overflow-visible">
            <div ref={printRef} className="max-w-2xl mx-auto border-2 border-[#7B1E3A]/40 p-8 rounded-lg shadow-sm print:border-none print:shadow-none print:p-2 bg-[#FDFBF7]">
              {/* Official Header */}
              <div className="text-center border-b-2 border-[#7B1E3A]/30 pb-4 mb-6">
                <p className="text-xs font-semibold text-[#2B2022]/70 font-serif">الجمهورية الجزائرية الديمقراطية الشعبية</p>
                <p className="text-xs font-semibold text-[#2B2022]/70 font-serif">وزارة التربية الوطنية</p>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="text-right">
                    <p className="font-serif font-black text-sm text-[#7B1E3A]">{settings?.institutionName || 'مؤسسة التربية والتعليم حبر وألوان الخاصة'}</p>
                    <p className="text-xs text-[#2B2022]/70">{settings?.schoolNameFrench || 'Groupe scolaire Encre & Pastel'}</p>
                    <p className="text-xs text-[#2B2022]/50">{settings?.location || 'أولاد فايت - الجزائر غرب'}</p>
                  </div>

                  {settings?.logoUrl ? (
                    <img src={settings.logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
                  ) : (
                    <div className="w-14 h-14 rounded-full border-2 border-[#C9A24D] bg-[#7B1E3A]/5 flex items-center justify-center font-serif font-bold text-[#7B1E3A] text-lg">
                      حبر
                    </div>
                  )}

                  <div className="text-left text-xs text-[#2B2022]/70 font-mono">
                    <p><span className="font-bold">التاريخ:</span> {issueDateFormatted}</p>
                    <p><span className="font-bold">الرقم:</span> {warning?._id ? warning._id.toString().slice(-6).toUpperCase() : '001/2026'}</p>
                  </div>
                </div>

                <p className="mt-2 text-xs italic text-[#C9A24D] font-serif">« {settings?.slogan || 'يا نشء أنت رجاؤنا'} »</p>
              </div>

              {/* Title Badge */}
              <div className="text-center my-6">
                <div className="inline-block px-6 py-2 bg-[#F3E9DC] border-2 border-[#C9A24D]/50 rounded-lg">
                  <h1 className="text-lg font-serif font-black text-[#7B1E3A]">
                    استدعاء رسمي لولي الأمر / إنذار بالغياب (رقم {warning?.warningLevel || 1})
                  </h1>
                </div>
              </div>

              {/* Addressee Info */}
              <div className="bg-[#F3E9DC]/40 border border-[#C9A24D]/30 rounded-lg p-4 mb-6 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="font-bold text-[#7B1E3A]">إلى السيد(ة) ولي أمر التلميذ(ة): </span>
                    <span className="font-bold text-[#2B2022]">{studentName}</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#7B1E3A]">القسم: </span>
                    <span className="font-bold text-[#2B2022]">{className}</span>
                  </div>
                  {student?.nationalIdDigitization && (
                    <div>
                      <span className="font-bold text-[#7B1E3A]">رقم التعريف الوطني (الرقمنة): </span>
                      <span className="font-mono text-[#2B2022]">{student.nationalIdDigitization}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-[#7B1E3A]">رقم هاتف الولي: </span>
                    <span className="font-mono text-[#2B2022]">{student?.parent?.fatherPhone || student?.parent?.phoneNumber || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Formal Text */}
              <div className="space-y-4 text-justify leading-relaxed text-sm text-[#2B2022]">
                <p className="font-medium">
                  تحية طيبة وبعد،
                </p>
                <p>
                  نحيطكم علماً وبأسف شديد بأن ابنكم/ابنتكم المذكور(ة) أعلاه قد استنفد(ت) <strong className="text-rose-700 font-bold">{warning?.absenceCount || 3} غيابات متكررة غير مبررة</strong> عن مقاعد الدراسة، وذلك خلال التواريخ التالية:
                </p>

                {/* Absence Dates Table */}
                <div className="border border-[#C9A24D]/30 rounded-md overflow-hidden my-3">
                  <table className="w-full text-center text-xs">
                    <thead className="bg-[#F3E9DC] text-[#7B1E3A] font-serif font-bold">
                      <tr>
                        <th className="py-2 px-3 border-l border-[#C9A24D]/25">الرقم</th>
                        <th className="py-2 px-3 border-l border-[#C9A24D]/25">تاريخ الغياب المسجل</th>
                        <th className="py-2 px-3">طبيعة الغياب</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#C9A24D]/15">
                      {absenceDates.length > 0 ? (
                        absenceDates.map((date, idx) => (
                          <tr key={idx} className="hover:bg-[#F3E9DC]/20">
                            <td className="py-1.5 px-3 border-l border-[#C9A24D]/25 font-bold font-mono">{idx + 1}</td>
                            <td className="py-1.5 px-3 border-l border-[#C9A24D]/25 font-mono">{new Date(date).toLocaleDateString('ar-DZ')}</td>
                            <td className="py-1.5 px-3 text-rose-700 font-bold">غياب غير مبرر</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="py-2 text-[#2B2022]/60">تم تسجيل 3 غيابات متكررة غير مبررة</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <p>
                  ونظراً لما يترتب عن هذا التمادي في الغياب من أثر سلبي مباشر على التحصيل الدراسي للتلميذ(ة)، وتطبيقاً للقانون الداخلي للمؤسسة والمادة 26 من النظام المدرسي المعتمد، <strong>نطلب منكم الحضور شخصياً وبشكل عاجل إلى مكتب الإدارة التربوية</strong> لتسوية الوضعية وتقديم المبررات القانونية اللازمة، وذلك في أقرب الآجال.
                </p>
                <p className="font-serif font-bold text-[#7B1E3A]">
                  ملاحظة هامة: في حال عدم الحضور أو عدم تقديم تبرير معتمد خلال 48 ساعة من تاريخ هذا الاستدعاء، ستضطر الإدارة إلى اتخاذ الإجراءات التأديبية المنصوص عليها.
                </p>
              </div>

              {/* Signatures */}
              <div className="mt-12 pt-6 border-t border-[#C9A24D]/30 flex justify-between items-end text-xs font-serif font-bold text-[#2B2022]">
                <div className="text-center">
                  <p>توقيع ولي الأمر بالعلم</p>
                  <div className="w-36 h-16 border-b border-dashed border-[#C9A24D] mt-2"></div>
                </div>
                <div className="text-center">
                  <p>المشرف التربوي / ناظر الدروس</p>
                  <div className="w-36 h-16 border-b border-dashed border-[#C9A24D] mt-2"></div>
                </div>
                <div className="text-center">
                  <p>ختم وإمضاء الإدارة العامة</p>
                  <div className="w-36 h-16 border-b border-dashed border-[#C9A24D] mt-2 flex items-center justify-center text-[#2B2022]/40 font-normal">
                    (الختم الرسمي)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
