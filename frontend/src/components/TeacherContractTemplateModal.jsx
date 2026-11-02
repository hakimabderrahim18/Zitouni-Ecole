import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, X, FileText, CheckCircle2, Edit2 } from 'lucide-react';
import SchoolLogo from './SchoolLogo';
import { useSchoolStore } from '../store/useSchoolStore';

export default function TeacherContractTemplateModal({ isOpen, onClose, teacher, dossier }) {
  const { settings } = useSchoolStore();
  const printRef = useRef(null);

  const u = dossier?.user || teacher?.user || {};
  const teacherNameArabic = `${u.firstNameArabic || u.firstName || ''} ${u.lastNameArabic || u.lastName || ''}`.trim() || 'الأستاذ';
  const teacherNameFrench = `${u.firstNameFrench || u.firstName || ''} ${u.lastNameFrench || u.lastName || ''}`.trim();
  const specialization = dossier?.specialization || (dossier?.subjects || []).join('، ') || 'التعليم العام';
  const cycle = dossier?.cycle === 'middle' ? 'التعليم المتوسط' : dossier?.cycle === 'secondary' ? 'التعليم الثانوي' : 'التعليم الابتدائي';

  const [contractType, setContractType] = useState(dossier?.contractType || 'CDI');
  const [duration, setDuration] = useState(dossier?.contractDuration || '1 سنة قابلة للتجديد');
  const [salary, setSalary] = useState(dossier?.baseSalary || 65000);
  const [hours, setHours] = useState(dossier?.assignedHours || 18);
  const [probationMonths, setProbationMonths] = useState(3);

  if (!isOpen || (!teacher && !dossier)) return null;

  const startDateFormatted = dossier?.contractStartDate
    ? new Date(dossier.contractStartDate).toLocaleDateString('ar-DZ')
    : new Date().toLocaleDateString('ar-DZ');

  const endDateFormatted = dossier?.contractEndDate
    ? new Date(dossier.contractEndDate).toLocaleDateString('ar-DZ')
    : contractType === 'CDI' ? 'غير محدد المدة' : 'نهاية الموسم الدراسي';

  const contractRef = `CTR-${contractType}-${new Date().getFullYear()}-${(u._id || '001').toString().slice(-4).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-3xl bg-white border border-[#C9A24D]/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] text-right font-sans"
          dir="rtl"
        >
          {/* Header Controls */}
          <div className="flex flex-wrap items-center justify-between p-4 bg-[#F3E9DC] border-b border-[#C9A24D]/30 gap-3 print:hidden shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#7B1E3A]/10 border border-[#7B1E3A]/25 flex items-center justify-center text-[#7B1E3A]">
                <FileText className="w-5 h-5 text-[#C9A24D]" />
              </div>
              <div>
                <h3 className="font-serif font-black text-[#7B1E3A] text-sm">
                  نموذج عقد العمل الرسمي المعتمد (المادة 24)
                </h3>
                <p className="text-[10px] text-slate-600">
                  صيغة تعاقدية قانونية متوافقة مع تشريع العمل ونظام المدارس الخاصة
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#7B1E3A] hover:bg-[#60162c] text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer border border-[#C9A24D]/30"
              >
                <Printer className="w-4 h-4 text-[#C9A24D]" />
                <span>طباعة العقد (PDF)</span>
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

          {/* Quick Edit Bar (Screen only) */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs print:hidden">
            <div>
              <label className="text-[10px] text-slate-500 block mb-0.5">نوع العقد:</label>
              <select
                value={contractType}
                onChange={e => setContractType(e.target.value)}
                className="w-full bg-white border rounded-lg p-1.5 text-xs font-bold"
              >
                <option value="CDI">غير محدد المدة (CDI)</option>
                <option value="CDD">محدد المدة (CDD)</option>
                <option value="مستخلف">عقد استخلاف مؤقت</option>
                <option value="ساعاتي">تعاقد بالساعة (Vacataire)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block mb-0.5">الراتب الأساسي (دج):</label>
              <input
                type="number"
                value={salary}
                onChange={e => setSalary(Number(e.target.value))}
                className="w-full bg-white border rounded-lg p-1.5 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block mb-0.5">الساعات الأسبوعية:</label>
              <input
                type="number"
                value={hours}
                onChange={e => setHours(Number(e.target.value))}
                className="w-full bg-white border rounded-lg p-1.5 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block mb-0.5">فترة التجربة (أشهر):</label>
              <input
                type="number"
                value={probationMonths}
                onChange={e => setProbationMonths(Number(e.target.value))}
                className="w-full bg-white border rounded-lg p-1.5 text-xs font-mono"
              />
            </div>
          </div>

          {/* Printable Contract Body */}
          <div className="overflow-y-auto flex-1 p-6 md:p-10 bg-[#FDFBF7] text-[#2B2022] print:p-0 print:m-0 print:overflow-visible">
            <div
              ref={printRef}
              className="max-w-2xl mx-auto border-2 border-[#7B1E3A] p-8 rounded-2xl shadow-sm print:border-none print:shadow-none bg-white space-y-6 font-serif text-xs leading-relaxed"
            >
              {/* Official Header */}
              <div className="border-b-2 border-[#C9A24D] pb-4">
                <div className="flex items-center justify-between text-center">
                  <div className="text-right space-y-0.5">
                    <p className="font-bold">الجمهورية الجزائرية الديمقراطية الشعبية</p>
                    <p className="font-bold">وزارة التربية الوطنية</p>
                    <p className="text-[10px] text-slate-600 font-sans">مديرية التربية والتعليم الخاصة</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <SchoolLogo size={50} />
                    <h2 className="font-black text-xs text-[#7B1E3A] mt-1">
                      {settings?.institutionName || 'مؤسسة التربية والتعليم حبر وألوان الخاصة'}
                    </h2>
                  </div>
                  <div className="text-left space-y-0.5 font-mono text-[10px]">
                    <p className="font-bold">المرجع: {contractRef}</p>
                    <p className="text-slate-500 font-sans">السنة: {new Date().getFullYear()}</p>
                  </div>
                </div>

                <div className="text-center py-2 bg-[#7B1E3A] text-white rounded-xl shadow-xs mt-3">
                  <h1 className="text-base font-black tracking-wide">
                    عـقــــد عـمــــل وتــوظـيـــــف ({contractType})
                  </h1>
                  <span className="text-[10px] text-amber-200 font-sans">
                    CONTRAT DE TRAVAIL ET D'ENGAGEMENT PÉDAGOGIQUE
                  </span>
                </div>
              </div>

              {/* Parties */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p>
                  <strong>بين الطرفين الموقعين أدناه:</strong>
                </p>
                <p>
                  <strong>الطرف الأول (المستخدم):</strong> مؤسسة التربية والتعليم الخاصة <strong>«{settings?.institutionName || 'حبر وألوان'}»</strong>، يمثلها مدير المؤسسة القانوني.
                </p>
                <p>
                  <strong>الطرف الثاني (الموظف / الأستاذ):</strong> السيد(ة) <strong>{teacherNameArabic}</strong> ({teacherNameFrench})، الحامل لرقم الهاتف: <span className="font-mono">{u.phoneNumber || '—'}</span>، والبريد: <span className="font-mono">{u.email || '—'}</span>.
                </p>
              </div>

              {/* Articles */}
              <div className="space-y-4 pr-1">
                <div>
                  <h4 className="font-bold text-[#7B1E3A]">المادة 01: موضوع العقد والمهام</h4>
                  <p className="text-slate-700">
                    يلتزم الطرف الثاني بالعمل لدى الطرف الأول بصفة أستاذ مادة <strong>{specialization}</strong> في طور <strong>{cycle}</strong>، مع الالتزام بكافة الواجبات التربوية والبيداغوجية، وتحضير الدروس، وإجراء ومراقبة الفروض والامتحانات، والمشاركة في مجالس الأقسام والتأطير.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#7B1E3A]">المادة 02: مدة العقد وسريانه</h4>
                  <p className="text-slate-700">
                    أُبرم هذا العقد بصيغة <strong>{contractType}</strong> لمدة <strong>{duration}</strong>، يسري ابتداءً من تاريخ: <span className="font-mono font-bold">{startDateFormatted}</span> إلى غاية: <span className="font-mono font-bold">{endDateFormatted}</span>.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#7B1E3A]">المادة 03: فترة التجربة</h4>
                  <p className="text-slate-700">
                    يخضع الطرف الثاني لفترة تجربة مدتها <strong>{probationMonths} أشهر</strong>، يمكن خلالها لأي من الطرفين فسخ العقد وفق الإجراءات القانونية المعمول بها.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#7B1E3A]">المادة 04: ساعات العمل والحجم الساعي</h4>
                  <p className="text-slate-700">
                    حُدد الحجم الساعي الأسبوعي بـ <strong>{hours} ساعة تدريس وتنسيق بيداغوجي</strong>، توزع حسب جدول الحصص الرسمي المعتمد من طرف إدارة المؤسسة.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#7B1E3A]">المادة 05: الراتب والأجر الأساسي</h4>
                  <p className="text-slate-700">
                    يتقاضى الطرف الثاني راتباً شهرياً أساسياً قدره: <strong className="text-[#7B1E3A] font-mono">{salary.toLocaleString()} دج</strong>، مع مراعاة الاقتطاعات القانونية للضمان الاجتماعي والضرائب ونظام الانضباط الداخلي (المادة 27).
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#7B1E3A]">المادة 06: الانضباط والسر المهني</h4>
                  <p className="text-slate-700">
                    يلتزم الأستاذ بالانضباط وحسن السلوك مع التلاميذ وأوليائهم، واحترام مواقيت العمل، والمحافظة على السر المهني وسمعة المؤسسة التعليمية.
                  </p>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-2 gap-8 text-center">
                <div className="p-3 bg-slate-50 rounded-xl space-y-8">
                  <p className="font-bold text-slate-700">توقيع المعني بالأمر (قرئ وصودق عليه):</p>
                  <div className="h-8"></div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-8">
                  <p className="font-bold text-[#7B1E3A]">توقيع وخاتم مدير المؤسسة:</p>
                  <div className="h-8"></div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
