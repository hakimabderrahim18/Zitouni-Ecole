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
  Baby,
  Percent,
  Sparkles,
  History,
  FolderOpen,
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { useSchoolStore } from '../store/useSchoolStore';
import StudentContractModal from './StudentContractModal';
import StudentRegistrationFormModal from './StudentRegistrationFormModal';
import StudentProfileFileModal from './StudentProfileFileModal';
import StudentAuditHistoryModal from './StudentAuditHistoryModal';
import InteractiveDocumentChecklist from './InteractiveDocumentChecklist';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function ParentReEnrollmentView() {
  const { accessToken } = useAuthStore();
  const { settings } = useSchoolStore();

  const [children, setChildren] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [hasFratrieDiscount, setHasFratrieDiscount] = useState(false);
  const [fratrieDiscountRate, setFratrieDiscountRate] = useState(15);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form State for currently selected child
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

  // Document Modals
  const [modalStudent, setModalStudent] = useState(null);
  const [showContract, setShowContract] = useState(false);
  const [showRegForm, setShowRegForm] = useState(false);
  const [showDossier, setShowDossier] = useState(false);
  const [showAuditHistory, setShowAuditHistory] = useState(false);

  const fetchReEnrollmentData = async () => {
    setLoading(true);
    try {
      const token = accessToken || localStorage.getItem('zitouni_access_token') || localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/parents/re-enrollment-info`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const loadedChildren = res.data.children || [];
      setChildren(loadedChildren);
      setAllClasses(res.data.allClasses || []);
      setHasFratrieDiscount(res.data.hasFratrieDiscount || loadedChildren.length > 1);
      setFratrieDiscountRate(res.data.fratrieDiscountRate || 15);

      if (loadedChildren.length > 0) {
        const first = loadedChildren[0];
        setSelectedChild(first);
        setDocumentsSubmitted(first.documentsSubmitted || {
          birthCertificate: true,
          photos: true,
          medicalCertificate: true,
          vaccinationRecord: true,
          schoolCertificate: true,
          signedCharter: true,
        });
      }

      if (res.data.allClasses?.length > 0 && !targetClassId) {
        setTargetClassId(res.data.allClasses[0]._id);
      }
    } catch (err) {
      console.error('Failed to load parent re-enrollment info', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReEnrollmentData();
  }, []);

  const handleSelectChild = (child) => {
    setSelectedChild(child);
    setSuccessMsg('');
    setErrorMsg('');
    if (child.documentsSubmitted) {
      setDocumentsSubmitted(child.documentsSubmitted);
    }
    setDocumentFiles(child.documentFiles || {});
    setDocumentReferences(child.documentReferences || {});
    if (child.regime) {
      setRegime(child.regime);
    }
  };

  const toggleDocument = (key) => {
    setDocumentsSubmitted((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmitReEnrollment = async (e) => {
    e.preventDefault();
    if (!selectedChild) return;
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const token = accessToken || localStorage.getItem('zitouni_access_token') || localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/parents/re-enrollment`,
        {
          studentId: selectedChild._id,
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
      if (res.data.student) {
        setSelectedChild(res.data.student);
        setChildren((prev) =>
          prev.map((c) => (c._id === res.data.student._id ? res.data.student : c))
        );
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'حدث خطأ أثناء تقديم طلب إعادة التسجيل.');
    } finally {
      setSubmitting(false);
    }
  };

  const openModalForChild = (child, modalType) => {
    setModalStudent(child);
    if (modalType === 'contract') setShowContract(true);
    if (modalType === 'form') setShowRegForm(true);
    if (modalType === 'dossier') setShowDossier(true);
    if (modalType === 'audit') setShowAuditHistory(true);
  };

  const getStatusBadge = (status, isWaitlisted) => {
    if (isWaitlisted || status === 'waitlist') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/60 text-amber-300 border border-amber-800/40">
          <Clock className="w-3.5 h-3.5" />
          في قائمة الانتظار
        </span>
      );
    }
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
            مقبول نهائياً
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-950/60 text-sky-300 border border-sky-800/40">
            <Clock className="w-3.5 h-3.5" />
            قيد المراجعة الإدارية
          </span>
        );
      case 'incomplete':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-950/60 text-orange-300 border border-orange-800/40">
            <AlertTriangle className="w-3.5 h-3.5" />
            الملف ناقص وثائق
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-950/60 text-rose-300 border border-rose-800/40">
            <AlertTriangle className="w-3.5 h-3.5" />
            مرفوض
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-slate-400 border border-luxury-border">
            <Layers className="w-3.5 h-3.5" />
            جاهز لإعادة التسجيل
          </span>
        );
    }
  };

  const selectedTargetClass = allClasses.find((c) => c._id === targetClassId);
  const baseTuition = selectedChild?.tuitionBaseAmount || 15000;
  const discountRate = hasFratrieDiscount ? 15 : 0;
  const discountVal = Math.round((baseTuition * discountRate) / 100);
  const finalTuition = baseTuition - discountVal;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <RefreshCw className="w-8 h-8 text-brand-400 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">جاري تحميل بيانات إعادة تسجيل الأبناء...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-right" dir="rtl">
      {/* Header Banner */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-brand-500/30 bg-gradient-to-r from-brand-950/50 via-brand-900/30 to-slate-900/50 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start md:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-[0_8px_25px_rgba(123,30,58,0.35)] shrink-0">
              <RefreshCw className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-white tracking-wide">
                  إعادة تسجيل الأبناء للموسم الدراسي الجديد
                </h2>
                <span className="px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-bold">
                  2026-2027
                </span>
              </div>
              <p className="text-xs text-slate-350 mt-1 max-w-2xl leading-relaxed">
                وفقاً للمادتين 14 و 15 من دفتر الشروط: تأكيد إعادة التسجيل، تدقيق قائمة الوثائق، الاستفادة من تخفيض الإخوة التلقائي، واستخراج الوثائق والعقود الرسمية.
              </p>
            </div>
          </div>

          {/* Fratrie Discount Banner */}
          {hasFratrieDiscount && (
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-3.5 flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-200 block">تخفيض الإخوة مفعّل تلقائياً</span>
                <span className="text-[11px] text-amber-400 font-medium">خصم 15% على الرسوم لكل تلميذ</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Children Selector Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
          <Baby className="w-4 h-4 text-brand-400" />
          <span>اختر التلميذ لمتابعة أو تقديم ملف إعادة التسجيل:</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {children.map((child) => {
            const isSelected = selectedChild?._id === child._id;
            return (
              <div
                key={child._id}
                onClick={() => handleSelectChild(child)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'bg-white border-2 border-[#7B1E3A] shadow-md shadow-[#7B1E3A]/15 ring-2 ring-[#7B1E3A]/15'
                    : 'bg-[#FDFBF7] border border-[#C9A24D]/35 hover:border-[#C9A24D]/70 hover:bg-white shadow-xs'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base shadow shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-[#7B1E3A] text-white shadow-xs'
                        : 'bg-[#F3E9DC] text-[#7B1E3A] border border-[#C9A24D]/30'
                    }`}
                  >
                    {child.user?.firstName?.[0]}{child.user?.lastName?.[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4
                      className={`font-bold text-sm truncate transition-colors ${
                        isSelected ? 'text-[#7B1E3A]' : 'text-[#2B2022]'
                      }`}
                    >
                      {child.user?.firstName} {child.user?.lastName}
                    </h4>
                    <span
                      className={`text-[11px] font-mono block ${
                        isSelected ? 'text-[#7B1E3A]/70' : 'text-[#2B2022]/60'
                      }`}
                    >
                      رقم التسجيل: {child.registrationNumber || '---'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs border-t border-[#C9A24D]/25 pt-2.5">
                  <div className="flex justify-between">
                    <span className={isSelected ? 'text-[#7B1E3A]/70' : 'text-[#2B2022]/60'}>القسم الحالي:</span>
                    <span className={`font-bold ${isSelected ? 'text-[#7B1E3A]' : 'text-[#2B2022]'}`}>{child.class?.name || 'غير محدد'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isSelected ? 'text-[#7B1E3A]/70' : 'text-[#2B2022]/60'}>السنة الحالية:</span>
                    <span className={`font-mono font-medium ${isSelected ? 'text-[#7B1E3A]/80' : 'text-[#2B2022]/70'}`}>{child.academicYear || '2025-2026'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {getStatusBadge(child.registrationStatus, child.isWaitlisted)}
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      isSelected
                        ? 'bg-[#7B1E3A] text-white shadow-xs'
                        : 'bg-[#F3E9DC] text-[#7B1E3A] border border-[#C9A24D]/30'
                    }`}
                  >
                    {isSelected ? '● محدد' : 'اختيار'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedChild && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Action Form / Current File Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status & Actions Box */}
            <div className="glass-panel p-6 rounded-3xl border border-luxury-border space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-luxury-border/50 pb-4">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <School className="w-5 h-5 text-brand-400" />
                    <span>ملف إعادة تسجيل: {selectedChild.user?.firstName} {selectedChild.user?.lastName}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    رقم الوصل: {selectedChild.receiptNumber || 'سيتم إصداره فور تأكيد الطلب'}
                  </p>
                </div>
                <div>{getStatusBadge(selectedChild.registrationStatus, selectedChild.isWaitlisted)}</div>
              </div>

              {/* Status alert message */}
              {selectedChild.isWaitlisted && (
                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs leading-relaxed flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-sm">التلميذ مسجل حالياً في قائمة الانتظار (الرتبة {selectedChild.waitlistRank})</span>
                    قسم {selectedChild.class?.name || 'المطلوب'} بلغ طاقته الاستيعابية القصوى (30 تلميذاً). ستتم الترقية تلقائياً بمجرد شغور مقعد.
                  </div>
                </div>
              )}

              {selectedChild.registrationStatus === 'accepted' && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs leading-relaxed flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-sm">تم قبول ملف إعادة التسجيل رسمياً من طرف الإدارة!</span>
                    يمكنك الآن طباعة وصل التسجيل الرسمي، عقد التمدرس، واستمارة التسجيل المعتمدة أدناه.
                  </div>
                </div>
              )}

              {/* Official Printable Documents Toolbar */}
              <div className="space-y-3 bg-slate-950/40 border border-luxury-border/60 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-brand-400" />
                  <span>الوثائق والمستندات الرسمية المتاحة للطباعة (المادة 14):</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => openModalForChild(selectedChild, 'contract')}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-brand-900/30 border border-luxury-border hover:border-brand-500/40 text-slate-200 font-bold text-xs flex flex-col items-center gap-2 transition-all group"
                  >
                    <FileCheck className="w-5 h-5 text-brand-400 group-hover:scale-110 transition-transform" />
                    <span>عقد التمدرس والتعهد</span>
                  </button>

                  <button
                    onClick={() => openModalForChild(selectedChild, 'form')}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-brand-900/30 border border-luxury-border hover:border-brand-500/40 text-slate-200 font-bold text-xs flex flex-col items-center gap-2 transition-all group"
                  >
                    <FileText className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
                    <span>استمارة التسجيل</span>
                  </button>

                  <button
                    onClick={() => openModalForChild(selectedChild, 'dossier')}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-brand-900/30 border border-luxury-border hover:border-brand-500/40 text-slate-200 font-bold text-xs flex flex-col items-center gap-2 transition-all group"
                  >
                    <FolderOpen className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span>الملف المدرسي الكامل</span>
                  </button>

                  <button
                    onClick={() => openModalForChild(selectedChild, 'audit')}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-brand-900/30 border border-luxury-border hover:border-brand-500/40 text-slate-200 font-bold text-xs flex flex-col items-center gap-2 transition-all group"
                  >
                    <History className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                    <span>سجل التعديلات (Audit)</span>
                  </button>
                </div>
              </div>

              {/* Success / Error Messages */}
              {successMsg && (
                <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold">
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-bold">
                  {errorMsg}
                </div>
              )}

              {/* Re-enrollment Submission Form */}
              <form onSubmit={handleSubmitReEnrollment} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Target Class */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      القسم المراد التسجيل فيه للموسم القادم *
                    </label>
                    <select
                      value={targetClassId}
                      onChange={(e) => setTargetClassId(e.target.value)}
                      required
                      className="w-full bg-slate-950/60 border border-luxury-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                    >
                      <option value="">-- اختر القسم --</option>
                      {allClasses.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {cls.name} (المستوى: {cls.level})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Regime */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      النظام المدرسي *
                    </label>
                    <select
                      value={regime}
                      onChange={(e) => setRegime(e.target.value)}
                      className="w-full bg-slate-950/60 border border-luxury-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                    >
                      <option value="نصف داخلي">نصف داخلي (مع وجبة الغداء)</option>
                      <option value="خارجي">خارجي (دراسة فقط)</option>
                      <option value="داخلي">داخلي كامل</option>
                    </select>
                  </div>
                </div>

                {/* Interactive Documents Checklist with Uploads (Page 14) */}
                <div className="bg-slate-950/40 border border-luxury-border/60 rounded-2xl p-4">
                  <InteractiveDocumentChecklist
                    documentsSubmitted={documentsSubmitted}
                    documentFiles={documentFiles}
                    documentReferences={documentReferences}
                    onChange={(newSubmitted, newFiles, newRefs) => {
                      setDocumentsSubmitted(newSubmitted);
                      setDocumentFiles(newFiles);
                      setDocumentReferences(newRefs);
                    }}
                    isDark={true}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    ملاحظات أو طلبات خاصة للإدارة (اختياري)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="أي توضيحات أو ملاحظات صحية / بيداغوجية..."
                    className="w-full bg-slate-950/60 border border-luxury-border rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-extrabold text-sm shadow-[0_4px_20px_rgba(123,30,58,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
                  <span>{submitting ? 'جاري إرسال الطلب...' : 'تأكيد وإرسال طلب إعادة التسجيل للموسم الجديد'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Summary Sidebar: Financial Calculation & School Rules */}
          <div className="space-y-6">
            {/* Financial Details Box */}
            <div className="glass-panel p-6 rounded-3xl border border-luxury-border space-y-5">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-luxury-border/50 pb-3">
                <CreditCard className="w-4 h-4 text-brand-400" />
                <span>حساب الرسوم والمستحقات (المادة 14)</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>المبلغ الأساسي للتمدرس:</span>
                  <span className="font-mono text-white font-bold">{baseTuition.toLocaleString()} DZD</span>
                </div>

                {hasFratrieDiscount && (
                  <div className="flex justify-between text-amber-300 bg-amber-950/30 p-2.5 rounded-xl border border-amber-800/40">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Percent className="w-3.5 h-3.5" />
                      تخفيض الإخوة (15%):
                    </span>
                    <span className="font-mono font-bold">- {discountVal.toLocaleString()} DZD</span>
                  </div>
                )}

                <div className="border-t border-luxury-border/50 pt-3 flex justify-between items-center text-sm">
                  <span className="font-black text-white">المبلغ النهائي المستحق:</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    {finalTuition.toLocaleString()} DZD
                  </span>
                </div>
              </div>
            </div>

            {/* Capacity & Waitlist Rules (Page 15) */}
            <div className="glass-panel p-5 rounded-2xl border border-luxury-border space-y-3 text-xs text-slate-350">
              <h4 className="font-bold text-slate-200 flex items-center gap-2">
                <School className="w-4 h-4 text-brand-400" />
                <span>قواعد السعة وقائمة الانتظار (المادة 15)</span>
              </h4>
              <p className="leading-relaxed text-slate-400 text-[11px]">
                تحدد الطاقة الاستيعابية القصوى لكل فوج تربوي بـ 30 تلميذاً. في حال اكتمال العدد، يدرج التلميذ تلقائياً في قائمة الانتظار حسب تاريخ وساعة إيداع الطلب.
              </p>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-luxury-border/50 text-[11px] space-y-1">
                <div className="text-slate-400">عدد الأبناء المرتبطين: <span className="text-white font-bold">{children.length}</span></div>
                <div className="text-slate-400">حق الأولوية: <span className="text-emerald-400 font-bold">ممنوح لتلاميذ المؤسسة القدامى</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Render Official Modals */}
      {showContract && modalStudent && (
        <StudentContractModal
          student={modalStudent}
          onClose={() => setShowContract(false)}
        />
      )}

      {showRegForm && modalStudent && (
        <StudentRegistrationFormModal
          student={modalStudent}
          onClose={() => setShowRegForm(false)}
        />
      )}

      {showDossier && modalStudent && (
        <StudentProfileFileModal
          student={modalStudent}
          onClose={() => setShowDossier(false)}
        />
      )}

      {showAuditHistory && modalStudent && (
        <StudentAuditHistoryModal
          student={modalStudent}
          studentId={modalStudent._id}
          studentName={`${modalStudent.user?.firstName || ''} ${modalStudent.user?.lastName || ''}`}
          onClose={() => setShowAuditHistory(false)}
        />
      )}
    </div>
  );
}
