import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Printer,
  FileCheck,
  User,
  CreditCard,
  Layers,
  ArrowRight,
  School,
  CheckSquare,
  Square,
  History,
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { useSchoolStore } from '../store/useSchoolStore';
import StudentContractModal from './StudentContractModal';
import StudentRegistrationFormModal from './StudentRegistrationFormModal';
import StudentAuditHistoryModal from './StudentAuditHistoryModal';
import InteractiveDocumentChecklist from './InteractiveDocumentChecklist';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function StudentReEnrollmentView() {
  const { accessToken } = useAuthStore();
  const { settings } = useSchoolStore();

  const [student, setStudent] = useState(null);
  const [allClasses, setAllClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [targetClassId, setTargetClassId] = useState('');
  const [regime, setRegime] = useState('نصف داخلي');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [notes, setNotes] = useState('');
  const [documentsSubmitted, setDocumentsSubmitted] = useState({
    birthCertificate: true,
    photos: true,
    medicalCertificate: true,
    vaccinationRecord: true,
    schoolCertificate: true,
    signedCharter: true,
  });
  const [documentFiles, setDocumentFiles] = useState({});
  const [documentReferences, setDocumentReferences] = useState({});

  // Modals
  const [showContract, setShowContract] = useState(false);
  const [showRegForm, setShowRegForm] = useState(false);
  const [showAuditHistory, setShowAuditHistory] = useState(false);

  const fetchEnrollmentInfo = async () => {
    setLoading(true);
    try {
      const token = accessToken || localStorage.getItem('zitouni_access_token') || localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/students/enrollment-info`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const s = res.data.student;
      setStudent(s);
      setAllClasses(res.data.allClasses || []);

      if (s) {
        if (s.documentsSubmitted) setDocumentsSubmitted(s.documentsSubmitted);
        if (s.documentFiles) setDocumentFiles(s.documentFiles);
        if (s.documentReferences) setDocumentReferences(s.documentReferences);
        if (s.regime) setRegime(s.regime);
      }

      if (res.data.allClasses?.length > 0 && !targetClassId) {
        // Suggest next class by default
        setTargetClassId(res.data.allClasses[0]._id);
      }
    } catch (err) {
      console.error('Failed to load enrollment info', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollmentInfo();
  }, []);

  const handleSubmitReEnrollment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const token = accessToken || localStorage.getItem('zitouni_access_token') || localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/students/re-enrollment`,
        {
          targetClassId,
          regime,
          academicYear,
          notes,
          documentsSubmitted,
          documentFiles,
          documentReferences,
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      setSuccessMsg(res.data.message || 'تم تقديم طلب إعادة التسجيل بنجاح!');
      fetchEnrollmentInfo();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'فشل إرسال طلب إعادة التسجيل.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-bold text-sm">
        جاري تحميل بيانات التسجيل والملف الإداري...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8 text-center bg-white border border-[#C9A24D]/35 rounded-3xl text-slate-500">
        تعذر العثور على الملف الإداري لهذا الحساب. يرجى مراجعة إدارة المؤسسة.
      </div>
    );
  }

  const isReEnrolled = student.enrollmentType === 're-enrollment';
  const status = student.registrationStatus || (student.isWaitlisted ? 'waitlist' : 'accepted');

  return (
    <div dir="rtl" className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="p-6 bg-white border border-[#C9A24D]/35 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#7B1E3A] flex items-center justify-center shadow-sm shrink-0">
            <RefreshCw className="w-6 h-6 text-[#C9A24D]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-serif font-black text-[#7B1E3A]">
                فضاء إعادة التسجيل للموسم الدراسي الجديد ({academicYear})
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C9A24D]/15 text-[#7B1E3A] border border-[#C9A24D]/30">
                خدمة رقمية معتمدة
              </span>
            </div>
            <p className="text-xs text-[#2B2022]/70 font-medium mt-0.5">
              تأكيد الانتقال وإعادة التسجيل السنوي، اختيار القسم والنظام الغذائي، ومتابعة حالة قبول الملف
            </p>
          </div>
        </div>

        {/* Action Documents Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowContract(true)}
            className="px-3.5 py-2 rounded-xl bg-[#F3E9DC] hover:bg-[#ebdcc7] text-[#7B1E3A] font-bold text-xs flex items-center gap-1.5 border border-[#C9A24D]/35 cursor-pointer shadow-2xs"
          >
            <FileCheck className="w-4 h-4 text-[#C9A24D]" />
            <span>عقد والتزام التسجيل</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRegForm(true)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FDFBF7] text-[#7B1E3A] font-bold text-xs flex items-center gap-1.5 border border-[#C9A24D]/35 cursor-pointer shadow-2xs"
          >
            <FileText className="w-4 h-4 text-[#C9A24D]" />
            <span>استمارة التسجيل الرسمية</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAuditHistory(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center gap-1.5 border border-amber-300 cursor-pointer shadow-2xs"
            title="سجل تاريخ التعديلات والتدقيق الإداري (المادة 15)"
          >
            <History className="w-4 h-4 text-[#C9A24D]" />
            <span>سجل التدقيق (Audit)</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Status Alert Banner */}
      <div
        className={`p-5 rounded-3xl border flex items-start gap-3.5 shadow-xs ${
          status === 'accepted'
            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
            : status === 'waitlist'
            ? 'bg-amber-50/80 border-amber-300 text-amber-900'
            : status === 'incomplete'
            ? 'bg-blue-50/80 border-blue-300 text-blue-900'
            : 'bg-[#FDFBF7] border-[#C9A24D]/40 text-[#2B2022]'
        }`}
      >
        {status === 'accepted' ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
        ) : status === 'waitlist' ? (
          <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-6 h-6 text-[#C9A24D] shrink-0 mt-0.5" />
        )}

        <div className="space-y-1">
          <h4 className="font-bold text-sm">
            {status === 'accepted' && 'حالة الملف: تم قبول وتأكيد تسجيلك بنجاح للموسم الدراسي الجديد ✓'}
            {status === 'waitlist' && `حالة الملف: أنت حالياً في قائمة الانتظار (الرتبة #${student.waitlistRank || 1}) ⏱️`}
            {status === 'under_review' && 'حالة الملف: طلب إعادة التسجيل قيد المعالجة والمراجعة الإدارية ⏳'}
            {status === 'incomplete' && 'حالة الملف: ملف التسجيل ناقص وثائق إدارية بحاجة إلى استكمال ⚠️'}
            {status === 'rejected' && 'حالة الملف: تم رفض طلب إعادة التسجيل ✕'}
          </h4>
          <p className="text-xs leading-relaxed opacity-90">
            {status === 'accepted' &&
              `تم توجيهك إلى قسم ${student.class?.name || '—'} بنظام ${student.regime || 'نصف داخلي'}. يمكنك استخراج وصل إعادة التسجيل والعقد المدرسي.`}
            {status === 'waitlist' &&
              `نظراً لاكتمال الطاقة الاستيعابية للقسم المطلوب (30 تلميذاً)، تم تسجيلك تلقائياً في قائمة الانتظار، وستتم ترقيتك مباشرة بمجرد توفر مقعد شاغر.`}
            {status === 'under_review' &&
              'تقوم أمانة المؤسسة بتدقيق وثائقك ومطابقتها مع كشف النقاط السنوي، وسيصلك إشعار بالنتيجة قريباً.'}
            {status === 'incomplete' &&
              (student.missingDocumentsNotes || 'يرجى تقديم الوثائق الناقصة لدى أمانة المؤسسة في أقرب الآجال.')}
          </p>
        </div>
      </div>

      {/* Student Academic & Civil Profile Summary */}
      <div className="p-6 bg-white border border-[#C9A24D]/35 rounded-3xl shadow-xs space-y-4">
        <h3 className="font-serif font-black text-[#7B1E3A] text-base border-b border-[#C9A24D]/25 pb-2 flex items-center gap-2">
          <User className="w-5 h-5 text-[#C9A24D]" />
          <span>بيانات التلميذ وسجل التمدرس الحالي</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px]">الاسم واللقب:</span>
            <span className="font-bold text-[#7B1E3A] text-sm">
              {student.lastNameArabic || student.user?.lastName} {student.firstNameArabic || student.user?.firstName}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px]">رقم التسجيل الداخلي:</span>
            <span className="font-mono font-bold text-slate-800">{student.registrationNumber || '—'}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px]">رقم الرقمنة الوطني:</span>
            <span className="font-mono font-bold text-slate-800">{student.nationalIdDigitization || '—'}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px]">القسم الحالي:</span>
            <span className="font-bold text-[#7B1E3A]">{student.class?.name || '—'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-3 border-t border-[#C9A24D]/20">
          <div>
            <span className="text-slate-500 block text-[10px]">المسؤول المدني (الولي):</span>
            <span className="font-bold">{student.parent?.user?.firstName} {student.parent?.user?.lastName}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px]">هاتف الولي:</span>
            <span className="font-mono font-bold text-emerald-800" dir="ltr">
              {student.parent?.user?.phoneNumber || '—'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px]">نوع التمدرس:</span>
            <span className="font-bold">{student.regime || 'نصف داخلي'}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px]">الرسوم المعتمدة:</span>
            <span className="font-mono font-bold text-emerald-800">
              {(student.tuitionAmount || 15000).toLocaleString('fr-DZ')} دج
            </span>
          </div>
        </div>
      </div>

      {/* Re-enrollment Request Submission Form */}
      <form onSubmit={handleSubmitReEnrollment} className="p-6 bg-white border border-[#C9A24D]/35 rounded-3xl shadow-xs space-y-5">
        <div className="border-b border-[#C9A24D]/25 pb-3">
          <h3 className="font-serif font-black text-[#7B1E3A] text-base flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-[#C9A24D]" />
            <span>طلب إعادة التسجيل والانتقال للموسم الدراسي القادم</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            حدد القسم والمستوى الدراسي المراد الانتقال إليه مع تحديد النظام الغذائي والوثائق المرفقة
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-600 font-bold block mb-1">السنة الدراسية *</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl font-bold text-[#7B1E3A]"
            >
              <option value="2026-2027">2026-2027 (الموسم القادم)</option>
              <option value="2027-2028">2027-2028</option>
            </select>
          </div>

          <div>
            <label className="text-slate-600 font-bold block mb-1">القسم والمستوى المراد الانتقال إليه *</label>
            <select
              value={targetClassId}
              onChange={(e) => setTargetClassId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl font-bold text-[#2B2022]"
            >
              {allClasses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-600 font-bold block mb-1">نظام التمدرس والإطعام *</label>
            <select
              value={regime}
              onChange={(e) => setRegime(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl font-bold"
            >
              <option value="نصف داخلي">نصف داخلي (مع وجبة الغداء بالكانتين)</option>
              <option value="خارجي">خارجي (دون إطعام)</option>
              <option value="داخلي">داخلي كامل</option>
            </select>
          </div>
        </div>

        {/* Interactive Documents Checklist with Uploads */}
        <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-[#C9A24D]/35 space-y-3">
          <InteractiveDocumentChecklist
            documentsSubmitted={documentsSubmitted}
            documentFiles={documentFiles}
            documentReferences={documentReferences}
            onChange={(newSubmitted, newFiles, newRefs) => {
              setDocumentsSubmitted(newSubmitted);
              setDocumentFiles(newFiles);
              setDocumentReferences(newRefs);
            }}
          />
        </div>

        <div>
          <label className="text-slate-600 font-bold block mb-1 text-xs">ملاحظات إضافية للتلميذ أو الولي:</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="مثال: يرجى تسجيل التلميذ مع رفاقه في نفس الفوج..."
            className="w-full px-3.5 py-2.5 bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl text-xs"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3.5 rounded-2xl bg-[#7B1E3A] hover:bg-[#60162c] text-[#F3E9DC] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5 text-[#C9A24D]" />
            <span>{submitting ? 'جاري إرسال الطلب...' : 'إرسال طلب إعادة التسجيل الرسمي إلى الإدارة ←'}</span>
          </button>
        </div>
      </form>

      {/* Modals */}
      {showContract && (
        <StudentContractModal
          student={student}
          onClose={() => setShowContract(false)}
        />
      )}

      {showRegForm && (
        <StudentRegistrationFormModal
          student={student}
          onClose={() => setShowRegForm(false)}
        />
      )}

      {showAuditHistory && student && (
        <StudentAuditHistoryModal
          student={student}
          studentId={student._id}
          studentName={`${student.firstNameArabic || student.user?.firstName || ''} ${student.lastNameArabic || student.user?.lastName || ''}`}
          onClose={() => setShowAuditHistory(false)}
        />
      )}
    </div>
  );
}
