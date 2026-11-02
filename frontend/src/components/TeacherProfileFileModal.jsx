import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Printer,
  Download,
  X,
  User,
  Users,
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  FileText,
  Clock,
  CreditCard,
  Briefcase,
  BookOpen,
  Layers,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileCheck,
  History,
  Lock,
  Edit2,
  Save,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import SchoolLogo from './SchoolLogo';
import TeacherWorkCertificateModal from './TeacherWorkCertificateModal';
import TeacherContractTemplateModal from './TeacherContractTemplateModal';
import TeacherResignationModal from './TeacherResignationModal';
import { useSchoolStore } from '../store/useSchoolStore';
import { useAuthStore } from '../store/useAuthStore';

export default function TeacherProfileFileModal({ teacherId, onClose, onUpdated }) {
  const printRef = useRef(null);
  const { settings } = useSchoolStore();
  const { user: currentUser } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dossier, setDossier] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [uploadDocType, setUploadDocType] = useState('cv');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Article 24 Modals State (Certificates, Contract Templates, Resignations)
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [resignationModalOpen, setResignationModalOpen] = useState(false);

  const isAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'school';

  const formatDateInput = (val) => {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const safeDate = (val, fallback = '—') => {
    if (!val) return fallback;
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return fallback;
      return d.toLocaleDateString('ar-DZ');
    } catch (e) {
      return fallback;
    }
  };

  const safeDateTime = (val, fallback = '—') => {
    if (!val) return fallback;
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return fallback;
      return d.toLocaleString('ar-DZ');
    } catch (e) {
      return fallback;
    }
  };

  useEffect(() => {
    if (teacherId) {
      fetchDossier();
    }
  }, [teacherId]);

  const fetchDossier = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/teachers/${teacherId}/dossier`);
      const data = res.data?.dossier;
      setDossier(data);
      setAttendanceStats(res.data?.attendanceStats);

      // Populate edit form
      const u = data?.user || {};
      setEditForm({
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        firstNameArabic: u.firstNameArabic || '',
        lastNameArabic: u.lastNameArabic || '',
        phoneNumber: u.phoneNumber || '',
        email: u.email || '',
        specialization: data?.specialization || data?.subjects?.[0] || '',
        cycle: data?.cycle || 'primary',
        hiringDate: formatDateInput(data?.hiringDate || u.hiringDate),
        contractType: data?.contractType || u.contractType || 'CDI',
        contractDuration: data?.contractDuration || u.contractDuration || '1 سنة',
        contractStartDate: formatDateInput(data?.contractStartDate),
        contractEndDate: formatDateInput(data?.contractEndDate),
        baseSalary: data?.baseSalary || u.baseSalary || 0,
        assignedHours: data?.assignedHours || 18,
        assignedTasks: data?.assignedTasks || 'تدريس، تنسيق بيداغوجي، متابعة الفروض والامتحانات',
        professionalStatus: data?.professionalStatus || 'active',
      });
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch dossier', err);
      setStatusMessage({ type: 'error', text: 'فشل تحميل الملف المهني للأستاذ' });
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveHtml = () => {
    if (!printRef.current || !dossier) return;
    const content = printRef.current.innerHTML;
    const teacherName = `${dossier.user?.firstName || 'أستاذ'}_${dossier.user?.lastName || ''}`.replace(/\s+/g, '_');
    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>الملف المهني - ${teacherName} - المادة 23</title>
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
    link.download = `الملف_المهني_${teacherName}_المادة23.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      setStatusMessage({ type: '', text: '' });
      const res = await axios.put(`/api/admin/teachers/${teacherId}/dossier`, editForm);
      setDossier(res.data?.dossier);
      setIsEditing(false);
      setSaving(false);
      setStatusMessage({ type: 'success', text: 'تم حفظ وتحديث بيانات الملف المهني بنجاح وتسجيلها في سجل التدقيق.' });
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error('Failed to update dossier', err);
      setStatusMessage({ type: 'error', text: err.response?.data?.message || 'فشل حفظ التعديلات' });
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await axios.put(`/api/admin/teachers/${teacherId}/dossier`, {
        professionalStatus: newStatus,
      });
      setDossier(res.data?.dossier);
      setEditForm((prev) => ({ ...prev, professionalStatus: newStatus }));
      setStatusMessage({ type: 'success', text: `تم تغيير الوضعية المهنية إلى: ${statusLabels[newStatus]}` });
      if (onUpdated) onUpdated();
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'فشل تغيير الوضعية المهنية' });
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setStatusMessage({ type: 'error', text: 'يرجى اختيار وثيقة لرفعها' });
      return;
    }

    try {
      setUploading(true);
      setStatusMessage({ type: '', text: '' });
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('docType', uploadDocType);
      formData.append('title', uploadTitle || uploadFile.name);

      await axios.post(`/api/admin/teachers/${teacherId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadFile(null);
      setUploadTitle('');
      setUploading(false);
      setStatusMessage({ type: 'success', text: 'تم إيداع الوثيقة بنجاح وتحديث قائمة التحقق وسجل التدقيق.' });
      fetchDossier();
      if (onUpdated) onUpdated();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.response?.data?.message || 'فشل رفع الوثيقة' });
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الوثيقة من الملف المهني؟')) return;
    try {
      await axios.delete(`/api/admin/teachers/${teacherId}/documents/${docId}`);
      setStatusMessage({ type: 'success', text: 'تم حذف الوثيقة بنجاح.' });
      fetchDossier();
      if (onUpdated) onUpdated();
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'فشل حذف الوثيقة' });
    }
  };

  const statusLabels = {
    active: 'نشط (Actif)',
    suspended: 'موقوف مؤقتاً (Suspendu)',
    resigned: 'مستقيل (Démissionnaire)',
    terminated: 'منتهية العلاقة المهنية (Fin de relation)',
  };

  const statusBadgeColors = {
    active: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    suspended: 'bg-amber-100 text-amber-800 border-amber-300',
    resigned: 'bg-slate-200 text-slate-800 border-slate-300',
    terminated: 'bg-red-100 text-red-800 border-red-300',
  };

  const docTypeLabels = {
    cv: 'السيرة الذاتية (CV)',
    diploma: 'الشهادات والمؤهلات العلمية (Diplômes & Qualifications)',
    medicalCertificate: 'الشهادة الطبية (Certificat Médical)',
    idPhotos: 'الصور الشمسية (Photos d\'identité - ص ش)',
    criminalRecord: 'شهادة السوابق العدلية (Casier Judiciaire - ش رز)',
    workContract: 'عقد العمل الموقع (Contrat de travail)',
    experienceCert: 'شهادة العمل السابقة / شهادات الخبرة',
    other: 'وثيقة أخرى',
  };

  if (!teacherId) return null;

  const u = dossier?.user || {};
  const currentStatus = dossier?.professionalStatus || 'active';
  const contractEndDateVal = dossier?.contractEndDate || u.contractEndDate;
  const contractDaysLeft = contractEndDateVal
    ? Math.ceil((new Date(contractEndDateVal).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #teacher-dossier-print, #teacher-dossier-print * {
            visibility: visible !important;
          }
          #teacher-dossier-print {
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
        className="bg-white border border-[#C9A24D]/40 rounded-3xl w-full max-w-5xl shadow-2xl relative my-auto overflow-hidden font-sans max-h-[94vh] flex flex-col text-right"
      >
        {/* Top Actions Toolbar */}
        <div className="no-print p-4 sm:px-6 bg-[#F3E9DC] border-b border-[#C9A24D]/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <Briefcase className="w-5 h-5 text-[#7B1E3A]" />
            <div>
              <span className="font-serif font-black text-sm text-[#7B1E3A] block">
                الملف المهني للأستاذ والموظف - الفصل التاسع (المادة 23)
              </span>
              <span className="text-[10px] text-slate-600 block">
                العناصر القانونية الـ 15 | الربط الآلي بالأقسام والأفواج | سرية البيانات المالية
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthorized && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border ${
                  isEditing
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-white hover:bg-slate-50 text-[#7B1E3A] border-[#C9A24D]/40'
                }`}
              >
                <Edit2 className="w-3.5 h-3.5 text-[#C9A24D]" />
                <span>{isEditing ? 'معاينة الملف الرسمي' : 'تعديل البيانات'}</span>
              </button>
            )}

            {/* Article 24: Work Certificate */}
            <button
              type="button"
              onClick={() => setCertModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-[#7B1E3A] border border-[#C9A24D]/40 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="إصدار وطباعة شهادة عمل رسمية (المادة 24)"
            >
              <FileCheck className="w-3.5 h-3.5 text-[#C9A24D]" />
              <span>شهادة عمل</span>
            </button>

            {/* Article 24: Contract Template */}
            <button
              type="button"
              onClick={() => setContractModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-[#7B1E3A] border border-[#C9A24D]/40 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="معاينة وطباعة نموذج عقد العمل الرسمي (المادة 24)"
            >
              <FileText className="w-3.5 h-3.5 text-[#C9A24D]" />
              <span>نموذج العقد</span>
            </button>

            {/* Article 24: Resignation & Notice Period */}
            <button
              type="button"
              onClick={() => setResignationModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="تسجيل ومتابعة طلب الاستقالة ومدة الإشعار (المادة 24)"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>طلب استقالة</span>
            </button>

            {/* Save / Download HTML */}
            <button
              onClick={handleSaveHtml}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-[#7B1E3A] border border-[#C9A24D]/40 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="حفظ الملف كاملاً على الجهاز"
            >
              <Download className="w-4 h-4 text-[#C9A24D]" />
              <span>حفظ الملف</span>
            </button>

            {/* Print / Save to PDF */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#7B1E3A] hover:bg-[#60162c] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              title="طباعة الملف مباشرة أو حفظ كـ PDF"
            >
              <Printer className="w-4 h-4 text-[#C9A24D]" />
              <span>طباعة (PDF)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer border border-[#C9A24D]/30"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status notification banner */}
        {statusMessage.text && (
          <div
            className={`no-print px-6 py-2.5 text-xs font-bold flex items-center justify-between border-b ${
              statusMessage.type === 'error'
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage({ type: '', text: '' })} className="cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Article 24: Contract Expiry Warning Banner */}
        {contractDaysLeft !== null && contractDaysLeft <= 60 && (
          <div
            className={`no-print px-6 py-2.5 text-xs font-bold flex items-center justify-between border-b ${
              contractDaysLeft <= 15
                ? 'bg-red-100 text-red-900 border-red-300'
                : 'bg-amber-100 text-amber-900 border-amber-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                تنبيه المادة 24 (متابعة نهاية العقد): عقد هذا الأستاذ يوشك على الانتهاء خلال{' '}
                {contractDaysLeft > 0 ? `${contractDaysLeft} يوماً` : 'الفترة الحالية'}{' '}
                (تاريخ الانتهاء: {safeDate(contractEndDateVal)}). يرجى اتخاذ الإجراء الإداري لتجديد العقد أو إنهاء المهام.
              </span>
            </div>
            <span className="text-[10px] bg-white/90 px-2 py-0.5 rounded font-mono font-bold">
              {contractDaysLeft <= 30 ? 'إجراء عاجل' : 'متابعة إدارية'}
            </span>
          </div>
        )}

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#7B1E3A] animate-spin" />
            <span className="text-xs text-slate-500 font-semibold">جاري تحميل وثائق وبيانات الملف المهني...</span>
          </div>
        ) : !dossier ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-4 text-center">
            <AlertCircle className="w-12 h-12 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-800">تعذر تحميل بيانات الملف المهني</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              {statusMessage.text || 'لم يتم العثور على سجل الأستاذ أو حدث خطأ أثناء الاتصال بالخادم.'}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={fetchDossier}
                className="px-4 py-2 bg-[#7B1E3A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة المحاولة</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                <span>إغلاق</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 p-6 sm:p-10 space-y-6 text-[#2B2022] bg-[#FDFBF7]">
            {/* Printable official dossier container */}
            <div ref={printRef} id="teacher-dossier-print" className="space-y-6">
              {/* Header of Republic & School */}
              <div className="border-b-2 border-[#C9A24D] pb-5 space-y-3">
                <div className="flex items-center justify-between text-center text-xs font-serif text-[#2B2022]">
                  <div className="text-right space-y-0.5">
                    <p className="font-bold">الجمهورية الجزائرية الديمقراطية الشعبية</p>
                    <p className="font-bold">وزارة التربية الوطنية</p>
                    <p className="text-[11px] text-slate-600 font-sans">مديرية التربية والتعليم الخاصة</p>
                  </div>

                  <div className="flex flex-col items-center">
                    <SchoolLogo size={55} />
                    <h1 className="font-serif font-black text-sm text-[#7B1E3A] mt-1">
                      {settings?.institutionName || 'مؤسسة التربية والتعليم حبر وألوان الخاصة'}
                    </h1>
                    <span className="text-[10px] text-slate-500 font-sans tracking-wide">
                      {settings?.schoolNameFrench || 'Groupe scolaire Encre & Pastel'}
                    </span>
                  </div>

                  <div className="text-left space-y-0.5 font-mono text-[11px]">
                    <p className="font-bold">السنة الدراسية: 2026-2027</p>
                    <p className="text-[#7B1E3A] font-bold">ملف مهني: {dossier?.user?.email || 'PROF-001'}</p>
                    <p className="text-slate-500">الفصل التاسع - المادة 23</p>
                  </div>
                </div>

                {/* Ribbon Title */}
                <div className="text-center py-2.5 bg-[#7B1E3A] text-white rounded-xl shadow-xs mt-3">
                  <h2 className="text-base sm:text-lg font-serif font-black tracking-wide">
                    الملف المهني الإلكتروني للأستاذ والموظف (المادة 23)
                  </h2>
                  <span className="text-[10px] font-sans text-amber-200 block">
                    DOSSIER PROFESSIONNEL DE L'ENSEIGNANT ET DU PERSONNEL - STATUT OFFICIEL
                  </span>
                </div>
              </div>

              {/* Status Switcher & Badge (no-print interactive controls) */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white border border-[#C9A24D]/30 rounded-2xl shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">الوضعية الحالية (البند 14):</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      statusBadgeColors[currentStatus] || statusBadgeColors.active
                    }`}
                  >
                    {statusLabels[currentStatus] || statusLabels.active}
                  </span>
                </div>

                <div className="no-print flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 text-[11px]">تغيير الوضعية:</span>
                  {['active', 'suspended', 'resigned', 'terminated'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={currentStatus === st}
                      onClick={() => handleStatusChange(st)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        currentStatus === st
                          ? 'bg-[#7B1E3A] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {statusLabels[st].split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 15 Elements Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                {/* Photo & Identity Summary */}
                <div className="col-span-1 flex flex-col items-center justify-center p-4 bg-white border border-[#C9A24D]/35 rounded-2xl shadow-xs text-center space-y-3">
                  <div className="w-28 h-36 rounded-xl bg-slate-100 border-2 border-dashed border-[#C9A24D] overflow-hidden flex items-center justify-center relative">
                    {u.profilePic ? (
                      <img src={u.profilePic} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <User className="w-12 h-12 text-[#C9A24D]" />
                        <span className="text-[9px] mt-1 font-bold">صورة الأستاذ (ص ش)</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#7B1E3A]">
                      {u.firstNameArabic || u.firstName} {u.lastNameArabic || u.lastName}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-sans" dir="ltr">
                      {u.firstNameFrench || u.firstName} {u.lastNameFrench || u.lastName}
                    </p>
                  </div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#7B1E3A]/10 text-[#7B1E3A] border border-[#C9A24D]/30">
                    {u.role === 'teacher' ? 'هيئة التدريس' : 'طاقم الإدارة والتأطير'}
                  </span>
                </div>

                {/* Identity & Contact Details (Elements 1, 2, 4, 5) */}
                <div className="col-span-3 bg-white border border-[#C9A24D]/35 rounded-2xl p-5 shadow-xs space-y-4">
                  <h4 className="font-serif font-black text-[#7B1E3A] text-sm flex items-center gap-2 pb-2 border-b border-[#C9A24D]/25">
                    <User className="w-4 h-4 text-[#C9A24D]" />
                    <span>البيانات الشخصية والمهنية الأساسية (البنود 1، 2، 4، 5)</span>
                  </h4>

                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">الاسم الأول (بالفرنسية/اللاتينية):</label>
                        <input
                          type="text"
                          value={editForm.firstName}
                          onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                          className="w-full border rounded-lg p-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">اللقب (بالفرنسية/اللاتينية):</label>
                        <input
                          type="text"
                          value={editForm.lastName}
                          onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                          className="w-full border rounded-lg p-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">الاسم بالعربية:</label>
                        <input
                          type="text"
                          value={editForm.firstNameArabic}
                          onChange={(e) => setEditForm({ ...editForm, firstNameArabic: e.target.value })}
                          className="w-full border rounded-lg p-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">اللقب بالعربية:</label>
                        <input
                          type="text"
                          value={editForm.lastNameArabic}
                          onChange={(e) => setEditForm({ ...editForm, lastNameArabic: e.target.value })}
                          className="w-full border rounded-lg p-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">رقم الهاتف:</label>
                        <input
                          type="text"
                          value={editForm.phoneNumber}
                          onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                          className="w-full border rounded-lg p-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">البريد الإلكتروني:</label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full border rounded-lg p-2 text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">1. الاسم واللقب الكامل:</span>
                        <span className="font-bold text-sm text-[#2B2022]">
                          {u.firstNameArabic || u.firstName} {u.lastNameArabic || u.lastName}
                        </span>
                        <span className="text-slate-500 text-[11px] block" dir="ltr">
                          {u.firstNameFrench || u.firstName} {u.lastNameFrench || u.lastName}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">2. الوظيفة المسندة:</span>
                        <span className="font-bold text-sm text-[#7B1E3A]">
                          {u.jobTitle || (u.role === 'teacher' ? 'أستاذ مادة' : u.role)}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">4. رقم الهاتف:</span>
                        <span className="font-bold text-sm text-[#2B2022] font-mono" dir="ltr">
                          {u.phoneNumber || '—'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">5. البريد الإلكتروني المهني:</span>
                        <span className="font-semibold text-xs text-slate-700 font-mono" dir="ltr">
                          {u.email || '—'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Elements 3 & 11: Pedagogical Cycle, Specialization, Classes, Groups, Hours & Tasks */}
              <div className="bg-white border border-[#C9A24D]/35 rounded-2xl p-5 shadow-xs space-y-4">
                <h4 className="font-serif font-black text-[#7B1E3A] text-sm flex items-center justify-between pb-2 border-b border-[#C9A24D]/25">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#C9A24D]" />
                    <span>3. التخصص والطور والأقسام المسندة (اعتماد في الطور والقسم) | 11. الساعات والمهام</span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold">
                    ربط آلي معتمد
                  </span>
                </h4>

                {isEditing ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">التخصص / المادة الرئيسية:</label>
                      <input
                        type="text"
                        value={editForm.specialization}
                        onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                        className="w-full border rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">الطور التعليمي:</label>
                      <select
                        value={editForm.cycle}
                        onChange={(e) => setEditForm({ ...editForm, cycle: e.target.value })}
                        className="w-full border rounded-lg p-2 text-xs"
                      >
                        <option value="primary">ابتدائي (Primaire)</option>
                        <option value="middle">متوسط (Moyen)</option>
                        <option value="secondary">ثانوي (Secondaire)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">ساعات العمل الأسبوعية:</label>
                      <input
                        type="number"
                        value={editForm.assignedHours}
                        onChange={(e) => setEditForm({ ...editForm, assignedHours: Number(e.target.value) })}
                        className="w-full border rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">المهام المسندة:</label>
                      <input
                        type="text"
                        value={editForm.assignedTasks}
                        onChange={(e) => setEditForm({ ...editForm, assignedTasks: e.target.value })}
                        className="w-full border rounded-lg p-2 text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">التخصص / المادة:</span>
                      <span className="font-bold text-sm text-[#7B1E3A]">
                        {dossier?.specialization || dossier?.subjects?.join(', ') || 'غير محدد'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">الطور المعتمد:</span>
                      <span className="font-bold text-sm text-slate-800">
                        {dossier?.cycle === 'middle' ? 'التعليم المتوسط' : dossier?.cycle === 'secondary' ? 'التعليم الثانوي' : 'التعليم الابتدائي'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">11. الساعات المسندة:</span>
                      <span className="font-bold text-sm text-emerald-800 font-mono">
                        {dossier?.assignedHours || 18} ساعة أسبوعياً
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">المهام البيداغوجية:</span>
                      <span className="font-semibold text-xs text-slate-700">
                        {dossier?.assignedTasks || 'تدريس ومتابعة بيداغوجية'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Auto-linked Classes & Groups */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#C9A24D]" />
                        <span>الأقسام المسندة (كلاسته - ربط تلقائي):</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white border font-bold text-[#7B1E3A]">
                        {dossier?.classes?.length || 0} قسم
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.isArray(dossier?.classes) && dossier.classes.filter(Boolean).length > 0 ? (
                        dossier.classes.filter(Boolean).map((cls) => (
                          <span
                            key={cls._id || cls.name || Math.random()}
                            className="px-2.5 py-1 bg-white border border-[#C9A24D]/40 rounded-lg text-xs font-bold text-[#7B1E3A] shadow-2xs"
                          >
                            {cls.name || 'قسم مسند'}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs italic">لا توجد أقسام مسندة حالياً</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#C9A24D]" />
                        <span>الأفواج المسندة (أفواجه - ربط تلقائي):</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white border font-bold text-emerald-700">
                        {dossier?.groups?.length || 0} فوج
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.isArray(dossier?.groups) && dossier.groups.filter(Boolean).length > 0 ? (
                        dossier.groups.filter(Boolean).map((grp) => (
                          <span
                            key={grp._id || grp.name || Math.random()}
                            className="px-2.5 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800 shadow-2xs"
                          >
                            {grp.name || 'فوج مسند'}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs italic">لا توجد أفواج مسندة حالياً</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Elements 6, 7, 8, 9, 10: Contractual and Financial Dossier */}
              <div className="bg-white border border-[#C9A24D]/35 rounded-2xl p-5 shadow-xs space-y-4">
                <h4 className="font-serif font-black text-[#7B1E3A] text-sm flex items-center justify-between pb-2 border-b border-[#C9A24D]/25">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#C9A24D]" />
                    <span>البيانات التعاقدية والمالية (البنود 6، 7، 8، 9، 10)</span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#C9A24D]" />
                    <span>مقيدة بالصلاحيات (سرية إدارية)</span>
                  </span>
                </h4>

                {isEditing ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">6. تاريخ التوظيف:</label>
                      <input
                        type="date"
                        value={editForm.hiringDate}
                        onChange={(e) => setEditForm({ ...editForm, hiringDate: e.target.value })}
                        className="w-full border rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">7. نوع العقد:</label>
                      <select
                        value={editForm.contractType}
                        onChange={(e) => setEditForm({ ...editForm, contractType: e.target.value })}
                        className="w-full border rounded-lg p-2 text-xs"
                      >
                        <option value="CDI">عقد غير محدد المدة (CDI)</option>
                        <option value="CDD">عقد محدد المدة (CDD)</option>
                        <option value="مستخلف">عقد استخلاف مؤقت</option>
                        <option value="ساعاتي">تعاقد بالساعة (Vacataire)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">8. مدة العقد:</label>
                      <input
                        type="text"
                        value={editForm.contractDuration}
                        onChange={(e) => setEditForm({ ...editForm, contractDuration: e.target.value })}
                        className="w-full border rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">10. الراتب الأساسي (دج):</label>
                      <input
                        type="number"
                        value={editForm.baseSalary}
                        onChange={(e) => setEditForm({ ...editForm, baseSalary: Number(e.target.value) })}
                        className="w-full border rounded-lg p-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">9. بداية العقد:</label>
                      <input
                        type="date"
                        value={editForm.contractStartDate}
                        onChange={(e) => setEditForm({ ...editForm, contractStartDate: e.target.value })}
                        className="w-full border rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">9. نهاية العقد:</label>
                      <input
                        type="date"
                        value={editForm.contractEndDate}
                        onChange={(e) => setEditForm({ ...editForm, contractEndDate: e.target.value })}
                        className="w-full border rounded-lg p-2 text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">6. تاريخ التوظيف:</span>
                      <span className="font-bold text-xs text-[#2B2022] font-mono">
                        {safeDate(dossier?.hiringDate || u.hiringDate, 'غير محدد')}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">7. نوع العقد:</span>
                      <span className="font-bold text-xs text-[#7B1E3A]">
                        {dossier?.contractType || u.contractType || 'CDI'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">8. مدة العقد:</span>
                      <span className="font-bold text-xs text-slate-800">
                        {dossier?.contractDuration || u.contractDuration || '1 سنة'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">9. فترة سريان العقد:</span>
                      <span className="font-semibold text-[11px] text-slate-700 font-mono">
                        {safeDate(dossier?.contractStartDate, '—')} إلى {safeDate(dossier?.contractEndDate, 'مفتوح')}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                      <span className="text-amber-800 block text-[10px] font-bold">10. الراتب الأساسي:</span>
                      <span className="font-bold text-sm text-[#7B1E3A] font-mono">
                        {Number(dossier?.baseSalary || u.baseSalary || 0).toLocaleString()} دج
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Element 12: Absences and Lates Tracking */}
              <div className="bg-white border border-[#C9A24D]/35 rounded-2xl p-5 shadow-xs space-y-4">
                <h4 className="font-serif font-black text-[#7B1E3A] text-sm flex items-center justify-between pb-2 border-b border-[#C9A24D]/25">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#C9A24D]" />
                    <span>12. سجل الغيابات والتأخيرات (مربوط بنظام الانضباط الإداري)</span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border font-mono">
                    إجمالي السجلات: {attendanceStats?.totalRecords || 0}
                  </span>
                </h4>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs">
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                    <span className="text-red-700 block text-[10px] font-semibold">إجمالي الغيابات</span>
                    <span className="font-bold text-lg text-red-900 font-mono">
                      {attendanceStats?.totalAbsences || 0}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                    <span className="text-blue-700 block text-[10px] font-semibold">غيابات مبررة</span>
                    <span className="font-bold text-lg text-blue-900 font-mono">
                      {attendanceStats?.totalExcused || 0}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-amber-700 block text-[10px] font-semibold">حالات التأخر</span>
                    <span className="font-bold text-lg text-amber-900 font-mono">
                      {attendanceStats?.totalLates || 0}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                    <span className="text-purple-700 block text-[10px] font-semibold">الخصومات المطبقة</span>
                    <span className="font-bold text-lg text-purple-900 font-mono">
                      {Number(attendanceStats?.totalDeductions || 0).toLocaleString()} دج
                    </span>
                  </div>
                </div>

                {attendanceStats?.recent && attendanceStats.recent.length > 0 && (
                  <div className="border rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-right">
                      <thead className="bg-slate-100 text-slate-600 font-semibold">
                        <tr>
                          <th className="p-2">التاريخ</th>
                          <th className="p-2">الحالة</th>
                          <th className="p-2">ملاحظات الإدارة</th>
                          <th className="p-2">الخصم المالي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(attendanceStats.recent || []).filter(Boolean).slice(0, 5).map((rec, i) => (
                          <tr key={rec._id || i} className="hover:bg-slate-50">
                            <td className="p-2 font-mono text-[11px]">
                              {safeDate(rec.date)}
                            </td>
                            <td className="p-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  rec.status === 'Absent'
                                    ? 'bg-red-100 text-red-800'
                                    : rec.status === 'Late'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {rec.status}
                              </span>
                            </td>
                            <td className="p-2 text-slate-600 text-[11px]">{rec.remarks || '—'}</td>
                            <td className="p-2 font-mono text-[11px] text-red-700">
                              {rec.deductionAmount ? `${rec.deductionAmount} دج` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Element 13: Professional Documents Checklist & Repository */}
              <div className="bg-white border border-[#C9A24D]/35 rounded-2xl p-5 shadow-xs space-y-4">
                <h4 className="font-serif font-black text-[#7B1E3A] text-sm flex items-center justify-between pb-2 border-b border-[#C9A24D]/25">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#C9A24D]" />
                    <span>13. الوثائق المهنية وقائمة التدقيق (Checklist - المادة 23)</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    مكتمل: {dossier?.documents?.length || 0} وثيقة مودعة
                  </span>
                </h4>

                {/* Checklist Badges */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                  {Object.entries(docTypeLabels).map(([key, label]) => {
                    if (key === 'other') return null;
                    const isUploaded =
                      dossier?.checklist?.[key] ||
                      (dossier?.documents && dossier.documents.some((d) => d.docType === key));
                    return (
                      <div
                        key={key}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                          isUploaded
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <span className="text-[11px] leading-tight">{label}</span>
                        {isUploaded ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Uploaded Documents List */}
                {Array.isArray(dossier?.documents) && dossier.documents.filter(Boolean).length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-slate-600 block">الملفات المودعة إلكترونياً:</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {dossier.documents.filter(Boolean).map((doc) => (
                        <div
                          key={doc._id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#C9A24D]/40 transition-all text-xs"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="w-4 h-4 text-[#7B1E3A] shrink-0" />
                            <div className="truncate">
                              <p className="font-bold text-slate-800 truncate">{doc.title}</p>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {docTypeLabels[doc.docType] || doc.docType} |{' '}
                                {safeDate(doc.uploadedAt)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-white border hover:bg-slate-100 text-slate-700 transition-colors"
                              title="معاينة الملف"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-[#C9A24D]" />
                            </a>
                            {isAuthorized && (
                              <button
                                type="button"
                                onClick={() => handleDeleteDocument(doc._id)}
                                className="p-1.5 rounded-lg bg-white border border-red-200 hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                                title="حذف الوثيقة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload New Document Form (no-print) */}
                {isAuthorized && (
                  <form
                    onSubmit={handleUploadDocument}
                    className="no-print p-4 rounded-xl bg-slate-50 border border-dashed border-[#C9A24D]/50 space-y-3 pt-3"
                  >
                    <span className="text-xs font-bold text-[#7B1E3A] flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-[#C9A24D]" />
                      <span>إيداع وثيقة مهنية جديدة في الملف:</span>
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">نوع الوثيقة:</label>
                        <select
                          value={uploadDocType}
                          onChange={(e) => setUploadDocType(e.target.value)}
                          className="w-full bg-white border rounded-lg p-2 text-xs"
                        >
                          {Object.entries(docTypeLabels).map(([k, lbl]) => (
                            <option key={k} value={k}>
                              {lbl}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">عنوان أو وصف الوثيقة:</label>
                        <input
                          type="text"
                          placeholder="مثال: شهادة ليسانس رياضيات 2020"
                          value={uploadTitle}
                          onChange={(e) => setUploadTitle(e.target.value)}
                          className="w-full bg-white border rounded-lg p-2 text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">اختر الملف (PDF / صورة):</label>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => setUploadFile(e.target.files[0])}
                          className="w-full bg-white border rounded-lg p-1.5 text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:bg-[#7B1E3A] file:text-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={uploading || !uploadFile}
                        className="px-4 py-1.5 bg-[#7B1E3A] hover:bg-[#60162c] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        {uploading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>جاري الرفع...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5 text-[#C9A24D]" />
                            <span>تأكيد إيداع الوثيقة بالملف</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Element 15: Administrative Audit Trail */}
              <div className="bg-white border border-[#C9A24D]/35 rounded-2xl p-5 shadow-xs space-y-3">
                <h4 className="font-serif font-black text-[#7B1E3A] text-sm flex items-center justify-between pb-2 border-b border-[#C9A24D]/25">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#C9A24D]" />
                    <span>15. سجل التعديلات الإدارية (Audit Trail - البند 15)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    تسجيل زمني دقيق لكل حركة إدارية
                  </span>
                </h4>

                <div className="max-h-48 overflow-y-auto space-y-2 text-xs">
                  {Array.isArray(dossier?.auditTrail) && dossier.auditTrail.filter(Boolean).length > 0 ? (
                    dossier.auditTrail
                      .filter(Boolean)
                      .slice()
                      .reverse()
                      .map((entry, idx) => (
                        <div
                          key={entry._id || idx}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3"
                        >
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-800 text-[11px]">{entry.action}</p>
                            <p className="text-slate-600 text-[11px]">{entry.details}</p>
                            <span className="text-[10px] text-slate-400 block">
                              بواسطة: {entry.performedBy} ({entry.performedByRole})
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0 bg-white px-2 py-0.5 rounded border">
                            {safeDateTime(entry.timestamp)}
                          </span>
                        </div>
                      ))
                  ) : (
                    <div className="text-slate-400 text-xs italic text-center py-2">
                      لا توجد تعديلات مسجلة بعد في سجل التدقيق.
                    </div>
                  )}
                </div>
              </div>

              {/* Official Signature and Stamping Section */}
              <div className="grid grid-cols-2 gap-8 pt-4 border-t-2 border-slate-200 text-xs text-center font-serif">
                <div className="p-4 bg-white border rounded-xl space-y-8">
                  <span className="font-bold block text-slate-700">توقيع المعني بالأمر (الأستاذ/الموظف):</span>
                  <div className="h-10"></div>
                </div>
                <div className="p-4 bg-white border rounded-xl space-y-8">
                  <span className="font-bold block text-[#7B1E3A]">خاتم وتأشيرة مدير المؤسسة:</span>
                  <div className="h-10"></div>
                </div>
              </div>
            </div>

            {/* Bottom edit submit button (if in editing mode) */}
            {isEditing && (
              <div className="no-print flex items-center justify-end gap-3 pt-4 border-t border-luxury-border">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  إلغاء التعديل
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="px-6 py-2 bg-[#7B1E3A] hover:bg-[#60162c] text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#C9A24D]" />
                      <span>جاري حفظ الملف المهني...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-[#C9A24D]" />
                      <span>حفظ التعديلات وتسجيلها في سجل التدقيق</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Article 24: Work Certificate Modal */}
      <TeacherWorkCertificateModal
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
        dossier={dossier}
      />

      {/* Article 24: Contract Template Modal */}
      <TeacherContractTemplateModal
        isOpen={contractModalOpen}
        onClose={() => setContractModalOpen(false)}
        dossier={dossier}
      />

      {/* Article 24: Resignation & Notice Period Modal */}
      <TeacherResignationModal
        isOpen={resignationModalOpen}
        onClose={() => setResignationModalOpen(false)}
        teacherId={teacherId}
        teacherName={`${u.firstNameArabic || u.firstName} ${u.lastNameArabic || u.lastName}`}
        onResignationSaved={fetchDossier}
      />
    </div>
  );
}
