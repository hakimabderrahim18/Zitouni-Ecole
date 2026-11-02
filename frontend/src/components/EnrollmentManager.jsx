import React, { useState, useEffect } from 'react';
import {
  FileText,
  UserPlus,
  RefreshCw,
  FileSpreadsheet,
  Printer,
  Download,
  Upload,
  Search,
  CheckCircle2,
  Calendar,
  User,
  Phone,
  CreditCard,
  QrCode,
  Sparkles,
  Layers,
  X,
  Eye,
  Filter,
  Clock,
  AlertTriangle,
  FileCheck,
  History,
  Users,
  CheckSquare,
  Square,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { useSchoolStore } from '../store/useSchoolStore';
import SchoolLogo from './SchoolLogo';
import StudentProfileFileModal from './StudentProfileFileModal';
import StudentContractModal from './StudentContractModal';
import StudentRegistrationFormModal from './StudentRegistrationFormModal';
import StudentAuditHistoryModal from './StudentAuditHistoryModal';
import ClassRosterPrintModal from './ClassRosterPrintModal';
import InteractiveDocumentChecklist from './InteractiveDocumentChecklist';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function EnrollmentManager() {
  const { accessToken } = useAuthStore();
  const { settings } = useSchoolStore();
  const primaryColor = settings?.primaryColor || '#7B1E3A';

  // Navigation Tabs: 'form' | 're-enrollment' | 'list' | 'waitlist' | 'excel'
  const [activeTab, setActiveTab] = useState('re-enrollment');
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [waitlistStudents, setWaitlistStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Filters for Registered Students List
  const [search, setSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL'); // 'ALL' | 'new' | 're-enrollment'
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL'); // 'ALL' | 'accepted' | 'under_review' | 'incomplete' | 'waitlist' | 'rejected'

  // Modals state
  const [receiptModalStudent, setReceiptModalStudent] = useState(null);
  const [dossierModalStudent, setDossierModalStudent] = useState(null);
  const [contractModalStudent, setContractModalStudent] = useState(null);
  const [regFormModalStudent, setRegFormModalStudent] = useState(null);
  const [auditModalStudent, setAuditModalStudent] = useState(null);
  const [rosterPrintClass, setRosterPrintClass] = useState(null);

  // New Enrollment Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    firstNameArabic: '',
    lastNameArabic: '',
    firstNameFrench: '',
    lastNameFrench: '',
    dateOfBirth: '',
    placeOfBirth: 'الجزائر',
    gender: 'ذكر',
    bloodType: 'O+',
    academicYear: '2026-2027',
    classId: '',
    groupId: '',
    regime: 'نصف داخلي',
    tuitionBaseAmount: 15000,
    discountType: 'none',
    discountPercentage: 0,
    discountAmount: 0,
    discountReason: '',
    tuitionAmount: 15000,
    paymentMethod: 'نقداً',
    parentFirstName: '',
    parentLastName: '',
    parentPhone: '',
    parentProfession: '',
    parentAddress: 'الجزائر العاصمة',
    parentEmail: '',
    documentsSubmitted: {
      birthCertificate: true,
      photos: true,
      medicalCertificate: false,
      vaccinationRecord: true,
      schoolCertificate: false,
      signedCharter: true,
    },
    documentFiles: {
      birthCertificate: '',
      photos: '',
      medicalCertificate: '',
      vaccinationRecord: '',
      schoolCertificate: '',
      signedCharter: '',
    },
    documentReferences: {
      birthCertificate: '',
      photos: '',
      medicalCertificate: '',
      vaccinationRecord: '',
      schoolCertificate: '',
      signedCharter: '',
    },
    notes: '',
  });

  // Re-Enrollment Form State (Réinscription d'un ancien élève - Page 14)
  const [reEnrollSearch, setReEnrollSearch] = useState('');
  const [selectedStudentForReEnroll, setSelectedStudentForReEnroll] = useState(null);
  const [reEnrollData, setReEnrollData] = useState({
    academicYear: '2026-2027',
    targetClassId: '',
    targetGroupId: '',
    regime: 'نصف داخلي',
    tuitionBaseAmount: 15000,
    discountType: 'none',
    discountPercentage: 0,
    discountAmount: 0,
    discountReason: '',
    registrationStatus: 'accepted',
    documentsSubmitted: {
      birthCertificate: true,
      photos: true,
      medicalCertificate: true,
      vaccinationRecord: true,
      schoolCertificate: true,
      signedCharter: true,
    },
    documentFiles: {
      birthCertificate: '',
      photos: '',
      medicalCertificate: '',
      vaccinationRecord: '',
      schoolCertificate: '',
      signedCharter: '',
    },
    documentReferences: {
      birthCertificate: '',
      photos: '',
      medicalCertificate: '',
      vaccinationRecord: '',
      schoolCertificate: '',
      signedCharter: '',
    },
    notes: '',
  });

  // Excel Batch State
  const [excelFile, setExcelFile] = useState(null);
  const [excelUploading, setExcelUploading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = accessToken || localStorage.getItem('zitouni_access_token') || localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [resCls, resStu, resWait] = await Promise.all([
        axios.get(`${API_URL}/admin/classes`, { headers }),
        axios.get(`${API_URL}/admin/students`, { headers }),
        axios.get(`${API_URL}/admin/waitlist`, { headers }),
      ]);

      setClasses(resCls.data || []);
      setStudents(resStu.data || []);
      setWaitlistStudents(resWait.data || []);

      if (resCls.data?.length > 0) {
        if (!formData.classId) setFormData((p) => ({ ...p, classId: resCls.data[0]._id }));
        if (!reEnrollData.targetClassId) setReEnrollData((p) => ({ ...p, targetClassId: resCls.data[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load enrollment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update Net Tuition on Discount Change for New Enrollment
  const handleDiscountChange = (type, pct = 0, customAmt = 0) => {
    let percentage = pct;
    let reason = '';
    const base = Number(formData.tuitionBaseAmount) || 15000;

    if (type === 'none') {
      percentage = 0;
      reason = '';
    } else if (type === 'fratrie') {
      percentage = 15;
      reason = 'تخفيض الإخوة المتمدرسين (15%)';
    } else if (type === 'staff') {
      percentage = 30;
      reason = 'تخفيض أبناء الطاقم والأساتذة (30%)';
    } else if (type === 'scholarship') {
      percentage = 50;
      reason = 'منحة التميز والتفوق المدرسي (50%)';
    } else if (type === 'custom') {
      reason = 'تخفيض استثنائي بقرار من المدير';
    }

    const calculatedDiscount = type === 'custom' ? Number(customAmt) : Math.round((base * percentage) / 100);
    const net = Math.max(0, base - calculatedDiscount);

    setFormData((prev) => ({
      ...prev,
      discountType: type,
      discountPercentage: percentage,
      discountAmount: calculatedDiscount,
      discountReason: reason,
      tuitionAmount: net,
    }));
  };

  // Update Net Tuition on Discount Change for Re-enrollment
  const handleReEnrollDiscountChange = (type, pct = 0, customAmt = 0) => {
    let percentage = pct;
    let reason = '';
    const base = Number(reEnrollData.tuitionBaseAmount) || 15000;

    if (type === 'none') {
      percentage = 0;
      reason = '';
    } else if (type === 'fratrie') {
      percentage = 15;
      reason = 'تخفيض الإخوة المتمدرسين (15%)';
    } else if (type === 'staff') {
      percentage = 30;
      reason = 'تخفيض أبناء الطاقم والأساتذة (30%)';
    } else if (type === 'scholarship') {
      percentage = 50;
      reason = 'منحة التميز والتفوق المدرسي (50%)';
    } else if (type === 'custom') {
      reason = 'تخفيض استثنائي بقرار من المدير';
    }

    const calculatedDiscount = type === 'custom' ? Number(customAmt) : Math.round((base * percentage) / 100);

    setReEnrollData((prev) => ({
      ...prev,
      discountType: type,
      discountPercentage: percentage,
      discountAmount: calculatedDiscount,
      discountReason: reason,
    }));
  };

  // Submit New Enrollment Form
  const handleNewEnrollmentSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const token = accessToken || localStorage.getItem('zitouni_access_token') || localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/admin/enrollment`, formData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setSuccessMsg(res.data.message || 'تم تسجيل التلميذ بنجاح وتوليد وصل التسجيل والملف الإداري الرسمي.');
      fetchData();

      if (res.data.student) {
        setReceiptModalStudent({
          ...res.data.student,
          receiptNumber: res.data.receiptNumber || res.data.student.receiptNumber,
          tuitionAmount: formData.tuitionAmount,
          paymentMethod: formData.paymentMethod,
        });
      }

      // Reset form
      setFormData((p) => ({
        ...p,
        firstName: '',
        lastName: '',
        firstNameArabic: '',
        lastNameArabic: '',
        firstNameFrench: '',
        lastNameFrench: '',
        dateOfBirth: '',
        parentFirstName: '',
        parentLastName: '',
        parentPhone: '',
      }));
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'خطأ أثناء إتمام التسجيل.');
    }
  };

  // Submit Re-enrollment Form (Page 14)
  const handleReEnrollmentSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!selectedStudentForReEnroll) {
      setErrorMsg('يرجى اختيار التلميذ المراد إعادة تسجيله أولاً.');
      return;
    }

    try {
      const token = accessToken || localStorage.getItem('zitouni_access_token') || localStorage.getItem('token');
      const payload = {
        studentId: selectedStudentForReEnroll._id,
        targetClassId: reEnrollData.targetClassId,
        targetGroupId: reEnrollData.targetGroupId || null,
        academicYear: reEnrollData.academicYear,
        regime: reEnrollData.regime,
        tuitionBaseAmount: reEnrollData.tuitionBaseAmount,
        discountType: reEnrollData.discountType,
        discountPercentage: reEnrollData.discountPercentage,
        discountAmount: reEnrollData.discountAmount,
        discountReason: reEnrollData.discountReason,
        registrationStatus: reEnrollData.registrationStatus,
        documentsSubmitted: reEnrollData.documentsSubmitted,
        documentFiles: reEnrollData.documentFiles || {},
        documentReferences: reEnrollData.documentReferences || {},
        notes: reEnrollData.notes,
      };

      const res = await axios.post(`${API_URL}/admin/re-enrollment`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setSuccessMsg(res.data.message || 'تمت إعادة تسجيل التلميذ بنجاح وتوليد وصل إعادة التسجيل.');
      fetchData();

      if (res.data.student) {
        setReceiptModalStudent({
          ...res.data.student,
          receiptNumber: res.data.receiptNumber || res.data.student.receiptNumber,
          isReEnrollment: true,
        });
      }

      setSelectedStudentForReEnroll(null);
      setReEnrollSearch('');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'فشلت إعادة التسجيل.');
    }
  };

  // Update Status of any enrollment dossier (Page 14)
  const handleStatusChange = async (studentId, newStatus) => {
    let rejectionReason = '';
    let missingNotes = '';

    if (newStatus === 'rejected') {
      rejectionReason = window.prompt('يرجى تحديد سبب رفض ملف التسجيل:') || 'عدم استيفاء الشروط البيداغوجية';
    } else if (newStatus === 'incomplete') {
      missingNotes = window.prompt('يرجى تدوين الوثائق الناقصة في الملف:') || 'وثائق ناقصة بحاجة إلى استكمال';
    }

    try {
      const token = accessToken || localStorage.getItem('zitouni_access_token') || localStorage.getItem('token');
      await axios.put(
        `${API_URL}/admin/students/${studentId}/enrollment-status`,
        { status: newStatus, rejectionReason, missingDocumentsNotes: missingNotes },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setSuccessMsg(`تم تحديث حالة ملف التسجيل إلى: ${newStatus}`);
      fetchData();
    } catch (err) {
      alert('خطأ أثناء تحديث حالة الملف: ' + (err.response?.data?.message || err.message));
    }
  };

  // Excel Batch Upload
  const handleExcelUpload = async (e) => {
    e.preventDefault();
    if (!excelFile) return;

    setExcelUploading(true);
    try {
      const token = accessToken || localStorage.getItem('zitouni_access_token') || localStorage.getItem('token');
      const body = new FormData();
      body.append('file', excelFile);

      await axios.post(`${API_URL}/import/students-excel`, body, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      setSuccessMsg('تم استيراد قائمة التلاميذ بنجاح من ملف الإكسل.');
      setExcelFile(null);
      fetchData();
      setActiveTab('list');
    } catch (err) {
      setErrorMsg('فشل استيراد ملف الإكسل: ' + (err.response?.data?.message || err.message));
    } finally {
      setExcelUploading(false);
    }
  };

  // Filter students for list tab
  const filteredStudents = students.filter((s) => {
    if (selectedClassFilter !== 'ALL') {
      const clsId = s.class?._id || s.class;
      if (String(clsId) !== String(selectedClassFilter)) return false;
    }
    if (selectedTypeFilter !== 'ALL') {
      const type = s.enrollmentType || 'new';
      if (type !== selectedTypeFilter) return false;
    }
    if (selectedStatusFilter !== 'ALL') {
      const status = s.registrationStatus || (s.isWaitlisted ? 'waitlist' : 'accepted');
      if (status !== selectedStatusFilter) return false;
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const name = `${s.firstNameArabic || s.user?.firstName || ''} ${s.lastNameArabic || s.user?.lastName || ''}`.toLowerCase();
      const nameFr = `${s.firstNameFrench || ''} ${s.lastNameFrench || ''}`.toLowerCase();
      const parentName = `${s.parent?.user?.firstName || ''} ${s.parent?.user?.lastName || ''}`.toLowerCase();
      const reg = (s.registrationNumber || '').toLowerCase();
      const nat = (s.nationalIdDigitization || '').toLowerCase();
      const phone = (s.parent?.user?.phoneNumber || s.studentPhone || s.parentPhoneNumber || '').toLowerCase();
      const email = (s.user?.email || '').toLowerCase();
      return name.includes(q) || nameFr.includes(q) || parentName.includes(q) || reg.includes(q) || nat.includes(q) || phone.includes(q) || email.includes(q);
    }
    return true;
  });

  // Students available for re-enrollment search
  const reEnrollCandidateStudents = students.filter((s) => {
    if (!reEnrollSearch.trim()) return true;
    const q = reEnrollSearch.trim().toLowerCase();
    const name = `${s.firstNameArabic || s.user?.firstName || ''} ${s.lastNameArabic || s.user?.lastName || ''}`.toLowerCase();
    const reg = (s.registrationNumber || '').toLowerCase();
    const nat = (s.nationalIdDigitization || '').toLowerCase();
    const phone = (s.parent?.user?.phoneNumber || s.studentPhone || '').toLowerCase();
    return name.includes(q) || reg.includes(q) || nat.includes(q) || phone.includes(q);
  });

  // Target class capacity calculation
  const getTargetClassCapacity = (classId) => {
    const cls = classes.find((c) => String(c._id) === String(classId));
    if (!cls) return { count: 0, capacity: 30, isFull: false };
    const count = students.filter((s) => String(s.class?._id || s.class) === String(classId) && !s.isWaitlisted).length;
    const capacity = cls.capacity || 30;
    return { count, capacity, isFull: count >= capacity };
  };

  const currentTargetClassCap = getTargetClassCapacity(reEnrollData.targetClassId);

  return (
    <div dir="rtl" className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 bg-white border border-[#C9A24D]/35 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#7B1E3A]/10 border border-[#7B1E3A]/20 text-[#7B1E3A] flex items-center justify-center shrink-0 shadow-xs">
            <FileText className="w-6 h-6 text-[#7B1E3A]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-serif font-black text-[#7B1E3A]">
                منظومة التسجيل وإعادة التسجيل المدرسية
              </h2>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#C9A24D]/15 text-[#7B1E3A] border border-[#C9A24D]/30">
                دفتر الشروط ص 14 - 15
              </span>
            </div>
            <p className="text-xs text-[#2B2022]/70 font-medium mt-0.5">
              إدارة التسجيلات الجديدة، إعادة تسجيل التلاميذ القدامى، التخفيضات المعتمدة، قوائم الانتظار، واستخراج الوصولات والعقود الرسمية
            </p>
          </div>
        </div>

        {/* Action Tabs Selector (Page 14 Specifications) */}
        <div className="flex items-center gap-1.5 p-1.5 bg-[#F3E9DC] rounded-2xl border border-[#C9A24D]/30 flex-wrap">
          <button
            onClick={() => setActiveTab('re-enrollment')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 're-enrollment'
                ? 'bg-[#7B1E3A] text-white shadow-xs'
                : 'text-[#7B1E3A] hover:bg-[#ebdcc7]'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>إعادة تسجيل تلميذ قديم</span>
          </button>

          <button
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'form'
                ? 'bg-[#7B1E3A] text-white shadow-xs'
                : 'text-[#7B1E3A] hover:bg-[#ebdcc7]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>إنشاء تسجيل جديد</span>
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-[#7B1E3A] text-white shadow-xs'
                : 'text-[#7B1E3A] hover:bg-[#ebdcc7]'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>قوائم المسجلين ({students.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('waitlist')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'waitlist'
                ? 'bg-[#7B1E3A] text-white shadow-xs'
                : 'text-[#7B1E3A] hover:bg-[#ebdcc7]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>قائمة الانتظار ({waitlistStudents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('excel')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'excel'
                ? 'bg-[#7B1E3A] text-white shadow-xs'
                : 'text-[#7B1E3A] hover:bg-[#ebdcc7]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>استيراد إكسل</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="p-1 text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs sm:text-sm font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="p-1 text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 1: RE-ENROLLMENT OF AN EXISTING STUDENT (Bullet 2 - Page 14)     */}
      {/* =================================================================== */}
      {activeTab === 're-enrollment' && (
        <div className="space-y-6">
          {/* Step 1: Search & Select Existing Enrolled Student */}
          <div className="p-6 bg-white border border-[#C9A24D]/35 rounded-3xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#C9A24D]/25 pb-3">
              <h3 className="font-serif font-black text-[#7B1E3A] text-base flex items-center gap-2">
                <Search className="w-5 h-5 text-[#C9A24D]" />
                <span>الخطوة 1: اختيار التلميذ المسجل مسبقاً في المؤسسة</span>
              </h3>
              <span className="text-xs text-slate-500">
                ابحث بالاسم، رقم التسجيل (Matricule)، رقم الرقمنة، أو هاتف الولي
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={reEnrollSearch}
                onChange={(e) => setReEnrollSearch(e.target.value)}
                placeholder="اكتب اسم التلميذ أو رقم التسجيل (مثال: REG-2026-0001 أو 0550...)"
                className="w-full pr-10 pl-4 py-3 bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-2xl text-xs font-semibold text-[#2B2022] focus:outline-none focus:border-[#7B1E3A]"
              />
            </div>

            {/* Candidate Selector Grid */}
            {!selectedStudentForReEnroll && (
              <div className="max-h-60 overflow-y-auto space-y-2 divide-y divide-[#C9A24D]/20">
                {reEnrollCandidateStudents.slice(0, 10).map((cand) => (
                  <div
                    key={cand._id}
                    onClick={() => {
                      setSelectedStudentForReEnroll(cand);
                      // Check brother/sister discount if parent has multiple children (Page 14)
                      if (cand.parent?.children?.length > 1) {
                        handleReEnrollDiscountChange('fratrie');
                      }
                    }}
                    className="p-3 rounded-xl hover:bg-[#F3E9DC]/40 cursor-pointer flex items-center justify-between transition-colors pt-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#7B1E3A]/10 text-[#7B1E3A] font-serif font-bold flex items-center justify-center text-xs">
                        {(cand.firstNameArabic || cand.user?.firstName || 'ت')[0]}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[#7B1E3A]">
                          {cand.lastNameArabic || cand.user?.lastName} {cand.firstNameArabic || cand.user?.firstName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          رقم التسجيل: {cand.registrationNumber} • القسم الحالي: {cand.class?.name || '—'}
                        </div>
                      </div>
                    </div>

                    <div className="text-left">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                        اختيار لإعادة التسجيل ←
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Student Card */}
            {selectedStudentForReEnroll && (
              <div className="p-4 rounded-2xl bg-[#F3E9DC]/60 border-2 border-[#7B1E3A]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#7B1E3A] text-white flex items-center justify-center shadow-sm">
                    <User className="w-6 h-6 text-[#C9A24D]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-black text-[#7B1E3A] text-base">
                        {selectedStudentForReEnroll.lastNameArabic || selectedStudentForReEnroll.user?.lastName}{' '}
                        {selectedStudentForReEnroll.firstNameArabic || selectedStudentForReEnroll.user?.firstName}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                        تلميذ مسجل سابقاً
                      </span>
                    </div>
                    <p className="text-xs text-[#2B2022] mt-0.5">
                      القسم الحالي: <strong>{selectedStudentForReEnroll.class?.name || '—'}</strong> •
                      رقم الرقمنة: <span className="font-mono">{selectedStudentForReEnroll.nationalIdDigitization || 'NAT-09-000000'}</span> •
                      الولي: <strong>{selectedStudentForReEnroll.parent?.user?.firstName || '—'}</strong> ({selectedStudentForReEnroll.parent?.user?.phoneNumber || '—'})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAuditModalStudent(selectedStudentForReEnroll)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#F3E9DC] border border-[#C9A24D]/50 text-[#7B1E3A] text-xs font-bold hover:bg-[#C9A24D]/25 cursor-pointer flex items-center gap-1.5 shadow-2xs transition-colors"
                    title="سجل تاريخ كل حركة وتعديل على هذا الملف (المادة 15)"
                  >
                    <History className="w-4 h-4 text-[#7B1E3A]" />
                    <span>سجل التدقيق (Audit Trail)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStudentForReEnroll(null)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-[#C9A24D]/40 text-[#7B1E3A] text-xs font-bold hover:bg-[#FDFBF7] cursor-pointer"
                  >
                    تغيير التلميذ
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Re-Enrollment Parameters Form */}
          {selectedStudentForReEnroll && (
            <form onSubmit={handleReEnrollmentSubmit} className="space-y-6">
              <div className="p-6 bg-white border border-[#C9A24D]/35 rounded-3xl shadow-xs space-y-5">
                <h3 className="font-serif font-black text-[#7B1E3A] text-base flex items-center gap-2 border-b border-[#C9A24D]/25 pb-2">
                  <RefreshCw className="w-5 h-5 text-[#C9A24D]" />
                  <span>الخطوة 2: تحديد معطيات إعادة التسجيل للموسم الجديد ({reEnrollData.academicYear})</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  {/* Academic Year */}
                  <div>
                    <label className="text-slate-600 font-bold block mb-1">السنة الدراسية الجديدة *</label>
                    <select
                      value={reEnrollData.academicYear}
                      onChange={(e) => setReEnrollData({ ...reEnrollData, academicYear: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl font-bold text-[#7B1E3A]"
                    >
                      <option value="2026-2027">2026-2027 (الموسم القادم)</option>
                      <option value="2027-2028">2027-2028</option>
                    </select>
                  </div>

                  {/* Target Class with Capacity Check (Page 15) */}
                  <div>
                    <label className="text-slate-600 font-bold block mb-1">
                      القسم والمستوى الجديد المراد الترقية إليه *
                    </label>
                    <select
                      value={reEnrollData.targetClassId}
                      onChange={(e) => setReEnrollData({ ...reEnrollData, targetClassId: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl font-bold text-[#2B2022]"
                    >
                      {classes.map((cls) => {
                        const cap = getTargetClassCapacity(cls._id);
                        return (
                          <option key={cls._id} value={cls._id}>
                            {cls.name} ({cap.count}/{cap.capacity} مقعد {cap.isFull ? '⚠️ ممتلئ - قائمة انتظار' : ''})
                          </option>
                        );
                      })}
                    </select>
                    {currentTargetClassCap.isFull && (
                      <span className="text-[10px] text-amber-700 font-bold block mt-1">
                        ⚠️ تنبيه: القسم ممتلئ! سيتم إدراج التلميذ في «قائمة الانتظار» تلقائياً وفق المادة 15.
                      </span>
                    )}
                  </div>

                  {/* Regime */}
                  <div>
                    <label className="text-slate-600 font-bold block mb-1">نظام التمدرس والإطعام *</label>
                    <select
                      value={reEnrollData.regime}
                      onChange={(e) => setReEnrollData({ ...reEnrollData, regime: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl font-bold text-[#2B2022]"
                    >
                      <option value="نصف داخلي">نصف داخلي (مع وجبة الغداء بالكانتين)</option>
                      <option value="خارجي">خارجي (دون إطعام)</option>
                      <option value="داخلي">داخلي كامل</option>
                    </select>
                  </div>
                </div>

                {/* Financial Fees & Discounts (Bullet 7 & 8 - Page 14) */}
                <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#C9A24D]/30 space-y-3">
                  <span className="font-bold text-[#7B1E3A] text-xs block border-b border-[#C9A24D]/20 pb-1 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-[#C9A24D]" />
                    <span>تحديد الرسوم وتسجيل التخفيضات المعتمدة (Remises & Droits)</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-slate-600 font-bold block mb-1">المبلغ الأساسي (دج):</label>
                      <input
                        type="number"
                        value={reEnrollData.tuitionBaseAmount}
                        onChange={(e) => {
                          const base = Number(e.target.value);
                          setReEnrollData((p) => ({ ...p, tuitionBaseAmount: base }));
                        }}
                        className="w-full px-3 py-2 bg-white border border-[#C9A24D]/35 rounded-xl font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-slate-600 font-bold block mb-1">نوع التخفيض المعتمد:</label>
                      <select
                        value={reEnrollData.discountType}
                        onChange={(e) => handleReEnrollDiscountChange(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#C9A24D]/35 rounded-xl font-bold text-[#7B1E3A]"
                      >
                        <option value="none">بدون تخفيض (0%)</option>
                        <option value="fratrie">تخفيض الإخوة (Fratrie 15%)</option>
                        <option value="staff">تخفيض أبناء الطاقم (Staff 30%)</option>
                        <option value="scholarship">منحة تفوق (50%)</option>
                        <option value="custom">تخفيض استثنائي مخصص</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-600 font-bold block mb-1">قيمة التخفيض المقتطع (دج):</label>
                      <input
                        type="number"
                        value={reEnrollData.discountAmount}
                        onChange={(e) => handleReEnrollDiscountChange('custom', 0, e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#C9A24D]/35 rounded-xl font-mono text-emerald-800 font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-slate-600 font-bold block mb-1">صافي الرسوم المستحقة للدفع:</label>
                      <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-300 rounded-xl font-mono font-black text-emerald-900 text-sm">
                        {Math.max(0, reEnrollData.tuitionBaseAmount - reEnrollData.discountAmount).toLocaleString('fr-DZ')} دج
                      </div>
                    </div>
                  </div>

                  {reEnrollData.discountType !== 'none' && (
                    <div>
                      <label className="text-slate-600 font-bold block mb-1 text-[11px]">
                        سبب وصلاحية التخفيض (Motif de la réduction):
                      </label>
                      <input
                        type="text"
                        value={reEnrollData.discountReason}
                        onChange={(e) => setReEnrollData({ ...reEnrollData, discountReason: e.target.value })}
                        placeholder="مثال: تخفيض الإخوة المتمدرسين بموجب المادة 14"
                        className="w-full px-3 py-1.5 bg-white border border-[#C9A24D]/35 rounded-xl text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* Required Documents Checklist with Interactive Inputs (Bullet 5 - Page 14) */}
                <div className="p-5 rounded-2xl bg-white border border-[#C9A24D]/35 space-y-3">
                  <InteractiveDocumentChecklist
                    documentsSubmitted={reEnrollData.documentsSubmitted}
                    documentFiles={reEnrollData.documentFiles || {}}
                    documentReferences={reEnrollData.documentReferences || {}}
                    onChange={(newSubmitted, newFiles, newRefs) => {
                      setReEnrollData((prev) => ({
                        ...prev,
                        documentsSubmitted: newSubmitted,
                        documentFiles: newFiles,
                        documentReferences: newRefs,
                      }));
                    }}
                  />
                </div>

                {/* Status Selector (Bullet 6 - Page 14) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-slate-600 font-bold block mb-1">
                      حالة ملف إعادة التسجيل (Statut du dossier) *
                    </label>
                    <select
                      value={reEnrollData.registrationStatus}
                      onChange={(e) => setReEnrollData({ ...reEnrollData, registrationStatus: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl font-bold"
                    >
                      <option value="accepted">مقبول ومكتمل (Accepté)</option>
                      <option value="under_review">قيد المراجعة الإدارية (En cours de révision)</option>
                      <option value="incomplete">ملف ناقص وثائق (Incomplet)</option>
                      <option value="waitlist">في قائمة الانتظار لامتلاء القسم (Waitlist)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-600 font-bold block mb-1">ملاحظات إدارية:</label>
                    <input
                      type="text"
                      value={reEnrollData.notes}
                      onChange={(e) => setReEnrollData({ ...reEnrollData, notes: e.target.value })}
                      placeholder="مثال: تم إعفاؤه من رسوم النقل المدرسي..."
                      className="w-full px-3.5 py-2.5 bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl"
                    />
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-2xl bg-[#7B1E3A] hover:bg-[#60162c] text-[#F3E9DC] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer transition-all"
                  >
                    <CheckCircle2 className="w-5 h-5 text-[#C9A24D]" />
                    <span>إتمام إعادة تسجيل التلميذ وإصدار الوصل الرسمي ←</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: NEW ENROLLMENT FORM (Bullet 1 - Page 14)                    */}
      {/* =================================================================== */}
      {activeTab === 'form' && (
        <form onSubmit={handleNewEnrollmentSubmit} className="space-y-6">
          {/* Section 1: Student Information */}
          <div className="p-6 sm:p-8 bg-white border border-[#C9A24D]/35 rounded-3xl shadow-xs space-y-4">
            <h3 className="font-serif font-black text-[#7B1E3A] text-base flex items-center gap-2 pb-2 border-b border-[#C9A24D]/25">
              <User className="w-5 h-5 text-[#C9A24D]" />
              <span>1. المعلومات الشخصية للتلميذ الجديد</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-600 font-bold block mb-1">الاسم الشخصي بالعربية *</label>
                <input
                  type="text"
                  name="firstNameArabic"
                  required
                  value={formData.firstNameArabic}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((p) => ({ ...p, firstNameArabic: val, firstName: val }));
                  }}
                  placeholder="مثال: يانيس"
                  className="w-full px-3.5 py-2.5 bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">اللقب العائلي بالعربية *</label>
                <input
                  type="text"
                  name="lastNameArabic"
                  required
                  value={formData.lastNameArabic}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((p) => ({ ...p, lastNameArabic: val, lastName: val }));
                  }}
                  placeholder="مثال: مزيان"
                  className="w-full px-3.5 py-2.5 bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Nom & Prénom en français</label>
                <input
                  type="text"
                  name="firstNameFrench"
                  value={formData.firstNameFrench}
                  onChange={(e) => setFormData({ ...formData, firstNameFrench: e.target.value })}
                  placeholder="Ex: Yanis MEZIANE"
                  className="w-full px-3.5 py-2.5 bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">تاريخ الميلاد *</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  required
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">مكان الميلاد</label>
                <input
                  type="text"
                  value={formData.placeOfBirth}
                  onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl"
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">الجنس وفصيلة الدم</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl"
                  >
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                  <select
                    value={formData.bloodType}
                    onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl font-mono"
                  >
                    <option value="O+">O+</option>
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="AB+">AB+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Pedagogical Class & Financial Details */}
          <div className="p-6 sm:p-8 bg-white border border-[#C9A24D]/35 rounded-3xl shadow-xs space-y-4">
            <h3 className="font-serif font-black text-[#7B1E3A] text-base flex items-center gap-2 pb-2 border-b border-[#C9A24D]/25">
              <Layers className="w-5 h-5 text-[#C9A24D]" />
              <span>2. التوجيه البيداغوجي والرسوم والتخفيضات</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-600 font-bold block mb-1">القسم الدراسي الموجه إليه *</label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl font-bold"
                >
                  {classes.map((c) => {
                    const cap = getTargetClassCapacity(c._id);
                    return (
                      <option key={c._id} value={c._id}>
                        {c.name} ({cap.count}/{cap.capacity} مقعد {cap.isFull ? '⚠️ ممتلئ - قائمة انتظار' : ''})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">النظام المعتمد *</label>
                <select
                  value={formData.regime}
                  onChange={(e) => setFormData({ ...formData, regime: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl font-bold"
                >
                  <option value="نصف داخلي">نصف داخلي (مع وجبة الغداء بالكانتين)</option>
                  <option value="خارجي">خارجي (دون إطعام)</option>
                  <option value="داخلي">داخلي كامل</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">نوع التخفيض المعتمد:</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl font-bold text-[#7B1E3A]"
                >
                  <option value="none">بدون تخفيض (0%)</option>
                  <option value="fratrie">تخفيض الإخوة (Fratrie 15%)</option>
                  <option value="staff">تخفيض أبناء الطاقم (Staff 30%)</option>
                  <option value="scholarship">منحة تفوق (50%)</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="text-emerald-800 font-bold block">صافي الرسوم المستحقة للتسجيل:</span>
                <span className="text-xl font-black font-serif text-emerald-900">
                  {formData.tuitionAmount.toLocaleString('fr-DZ')} دج
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                المبلغ الأساسي: {formData.tuitionBaseAmount} دج • المقتطع: {formData.discountAmount} دج
              </span>
            </div>
          </div>

          {/* Section 3: Parent Account Information */}
          <div className="p-6 sm:p-8 bg-white border border-[#C9A24D]/35 rounded-3xl shadow-xs space-y-4">
            <h3 className="font-serif font-black text-[#7B1E3A] text-base flex items-center gap-2 pb-2 border-b border-[#C9A24D]/25">
              <Phone className="w-5 h-5 text-[#C9A24D]" />
              <span>3. بيانات الولي والحساب الموحد للأبناء (Page 14)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-600 font-bold block mb-1">رقم هاتف الولي (المعرف للدخول) *</label>
                <input
                  type="text"
                  required
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  placeholder="مثال: 0550112233"
                  className="w-full px-3.5 py-2.5 bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl font-mono text-emerald-800 font-bold"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">اسم ولقب الولي:</label>
                <input
                  type="text"
                  value={formData.parentFirstName}
                  onChange={(e) => setFormData({ ...formData, parentFirstName: e.target.value })}
                  placeholder="مثال: أحمد مزيان"
                  className="w-full px-3.5 py-2.5 bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl"
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">مهنة الولي وعنوان السكن:</label>
                <input
                  type="text"
                  value={formData.parentAddress}
                  onChange={(e) => setFormData({ ...formData, parentAddress: e.target.value })}
                  placeholder="الجزائر العاصمة"
                  className="w-full px-3.5 py-2.5 bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Required Documents Interactive Checklist (Bullet 5 - Page 14) */}
          <div className="p-6 sm:p-8 bg-white border border-[#C9A24D]/35 rounded-3xl shadow-xs space-y-4">
            <InteractiveDocumentChecklist
              documentsSubmitted={formData.documentsSubmitted}
              documentFiles={formData.documentFiles || {}}
              documentReferences={formData.documentReferences || {}}
              onChange={(newSubmitted, newFiles, newRefs) => {
                setFormData((prev) => ({
                  ...prev,
                  documentsSubmitted: newSubmitted,
                  documentFiles: newFiles,
                  documentReferences: newRefs,
                }));
              }}
            />

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-8 py-3.5 bg-[#7B1E3A] hover:bg-[#60162c] text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <CheckCircle2 className="w-5 h-5 text-[#C9A24D]" />
                <span>إتمام تسجيل التلميذ وتوليد الوصل والملف الإداري ←</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* =================================================================== */}
      {/* TAB 3: REGISTERED STUDENTS & ALL PRINTABLE DOCUMENTS (Page 14)      */}
      {/* =================================================================== */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Filters & Export Bar */}
          <div className="p-4 bg-white border border-[#C9A24D]/35 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 flex-wrap">
            <div className="relative w-full md:flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-[#7B1E3A] absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالاسم (عربي / فرنسي)، رقم الرقمنة، الهاتف، ولي الأمر..."
                className="w-full pr-10 pl-8 py-2.5 text-xs bg-white border border-[#C9A24D]/45 rounded-xl focus:outline-none focus:border-[#7B1E3A] focus:ring-1 focus:ring-[#7B1E3A] text-[#2B2022] font-semibold shadow-xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#7B1E3A] cursor-pointer"
                  title="مسح البحث"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Class Filter */}
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-[#FDFBF7] border border-[#C9A24D]/30 rounded-xl text-[#2B2022] font-semibold"
              >
                <option value="ALL">جميع الأقسام ({classes.length})</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Type Filter */}
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-[#FDFBF7] border border-[#C9A24D]/30 rounded-xl text-[#2B2022] font-semibold"
              >
                <option value="ALL">كل أنواع التسجيل</option>
                <option value="new">تسجيل جديد فقط</option>
                <option value="re-enrollment">إعادة تسجيل فقط</option>
              </select>

              {/* Status Filter (Page 14) */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-[#FDFBF7] border border-[#C9A24D]/30 rounded-xl text-[#2B2022] font-semibold"
              >
                <option value="ALL">كل الحالات</option>
                <option value="accepted">مقبول ومكتمل</option>
                <option value="under_review">قيد المراجعة</option>
                <option value="incomplete">ملف ناقص</option>
                <option value="waitlist">قائمة الانتظار</option>
              </select>

              {/* Print Class Roster Button (Bullet 12 - Page 14) */}
              {selectedClassFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => {
                    const cls = classes.find((c) => String(c._id) === String(selectedClassFilter));
                    setRosterPrintClass(cls);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#7B1E3A] text-[#F3E9DC] font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer hover:bg-[#60162c]"
                >
                  <Printer className="w-3.5 h-3.5 text-[#C9A24D]" />
                  <span>طباعة قائمة هذا القسم</span>
                </button>
              )}
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white border border-[#C9A24D]/35 rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-[#F3E9DC]/70 border-b border-[#C9A24D]/30 text-[#7B1E3A] font-bold">
                    <th className="p-3.5 sm:px-4">التلميذ</th>
                    <th className="p-3.5 sm:px-4">القسم والنوع</th>
                    <th className="p-3.5 sm:px-4">الولي ورقم الهاتف</th>
                    <th className="p-3.5 sm:px-4">حالة الملف (Statut)</th>
                    <th className="p-3.5 sm:px-4 text-center">الوثائق والطباعة الرسمية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C9A24D]/20 text-[#2B2022]">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        جاري تحميل قائمة المسجلين...
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        لا يوجد تلاميذ مسجلون يطابقون محددات البحث.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <tr key={s._id} className="hover:bg-[#FDFBF7] transition-colors">
                        <td className="p-3.5 sm:px-4">
                          <div className="font-bold text-[#7B1E3A] text-sm">
                            {s.lastNameArabic || s.user?.lastName} {s.firstNameArabic || s.user?.firstName}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {s.registrationNumber || '—'} • {s.nationalIdDigitization || 'NAT-09-000000'}
                          </span>
                        </td>

                        <td className="p-3.5 sm:px-4">
                          <div className="font-serif font-black text-[#7B1E3A]">{s.class?.name || 'غير محدد'}</div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {s.enrollmentType === 're-enrollment' ? 'إعادة تسجيل' : 'تسجيل جديد'}
                          </span>
                        </td>

                        <td className="p-3.5 sm:px-4">
                          <div className="font-semibold text-xs">
                            {s.parent?.user?.firstName || 'ولي الأمر'} {s.parent?.user?.lastName || ''}
                          </div>
                          <span className="text-[11px] text-emerald-800 font-mono" dir="ltr">
                            {s.parent?.user?.phoneNumber || '0550110011'}
                          </span>
                        </td>

                        {/* Status Dropdown (Bullet 6 - Page 14) */}
                        <td className="p-3.5 sm:px-4">
                          <select
                            value={s.registrationStatus || (s.isWaitlisted ? 'waitlist' : 'accepted')}
                            onChange={(e) => handleStatusChange(s._id, e.target.value)}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border focus:outline-none cursor-pointer ${
                              s.registrationStatus === 'accepted' || (!s.registrationStatus && !s.isWaitlisted)
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : s.registrationStatus === 'waitlist' || s.isWaitlisted
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : s.registrationStatus === 'incomplete'
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : s.registrationStatus === 'under_review'
                                ? 'bg-purple-50 text-purple-800 border-purple-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                          >
                            <option value="accepted">مقبول ومكتمل ✓</option>
                            <option value="under_review">قيد المراجعة ⏳</option>
                            <option value="incomplete">ملف ناقص ⚠️</option>
                            <option value="waitlist">قائمة الانتظار ⏱️</option>
                            <option value="rejected">مرفوض ✕</option>
                          </select>
                        </td>

                        {/* 5 Printable Official Documents & Actions (Page 14 & 15) */}
                        <td className="p-3.5 sm:px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {/* 1. Official Receipt (Bullet 9) */}
                            <button
                              type="button"
                              onClick={() => setReceiptModalStudent(s)}
                              className="px-2.5 py-1 rounded-lg bg-[#F3E9DC] hover:bg-[#ebdcc7] text-[#7B1E3A] font-bold text-[10px] border border-[#C9A24D]/35 cursor-pointer shadow-2xs"
                              title="إصدار وطباعة وصل التسجيل الرسمي"
                            >
                              وصل التسجيل
                            </button>

                            {/* 2. Official Contract (Bullet 10) */}
                            <button
                              type="button"
                              onClick={() => setContractModalStudent(s)}
                              className="px-2.5 py-1 rounded-lg bg-[#7B1E3A]/10 hover:bg-[#7B1E3A]/20 text-[#7B1E3A] font-bold text-[10px] border border-[#7B1E3A]/30 cursor-pointer shadow-2xs"
                              title="إصدار عقد أو وثيقة التسجيل والتعهد المدرسي"
                            >
                              عقد التسجيل
                            </button>

                            {/* 3. Official Registration Form (Bullet 11) */}
                            <button
                              type="button"
                              onClick={() => setRegFormModalStudent(s)}
                              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-[#2B2022] font-bold text-[10px] border border-slate-300 cursor-pointer shadow-2xs"
                              title="طباعة استمارة التسجيل الرسمية"
                            >
                              استمارة التسجيل
                            </button>

                            {/* 4. Full Dossier (Article 38) */}
                            <button
                              type="button"
                              onClick={() => setDossierModalStudent(s)}
                              className="px-2.5 py-1 rounded-lg bg-[#7B1E3A] hover:bg-[#60162c] text-[#F3E9DC] font-bold text-[10px] cursor-pointer shadow-xs"
                              title="عرض وطباعة الملف المدرسي الشامل"
                            >
                              الملف المدرسي
                            </button>

                            {/* 5. Audit History Log (Page 15) */}
                            <button
                              type="button"
                              onClick={() => setAuditModalStudent(s)}
                              className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] cursor-pointer shadow-xs flex items-center gap-1"
                              title="سجل تاريخ كل تعديل وحركة على هذا الملف (المادة 15)"
                            >
                              <History className="w-3.5 h-3.5 text-[#C9A24D]" />
                              <span>سجل التدقيق</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: WAITLIST MANAGER (Bullet 1 - Page 15)                        */}
      {/* =================================================================== */}
      {activeTab === 'waitlist' && (
        <div className="space-y-4">
          <div className="p-6 bg-white border border-[#C9A24D]/35 rounded-3xl shadow-xs space-y-2">
            <h3 className="font-serif font-black text-[#7B1E3A] text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#C9A24D]" />
              <span>إعداد وإدارة قائمة الانتظار عند امتلاء الأقسام (Page 15)</span>
            </h3>
            <p className="text-xs text-[#2B2022]/70 leading-relaxed">
              وفق المادة 15 من دفتر الشروط، عند وصول القسم أو الفوج إلى طاقته الاستيعابية القصوى (مثال: 30 تلميذاً)، يُدرج أي تسجيل أو إعادة تسجيل إضافية في «قائمة الانتظار» تلقائياً بالترتيب الزمني مع إمكانية الترقية والقبول الفوري عند شغور مقعد.
            </p>
          </div>

          <div className="bg-white border border-[#C9A24D]/35 rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-[#F3E9DC]/70 border-b border-[#C9A24D]/30 text-[#7B1E3A] font-bold">
                    <th className="p-3.5 sm:px-4 text-center w-16">رتبة الانتظار</th>
                    <th className="p-3.5 sm:px-4">التلميذ</th>
                    <th className="p-3.5 sm:px-4">القسم المطلوب</th>
                    <th className="p-3.5 sm:px-4">الولي ورقم الهاتف</th>
                    <th className="p-3.5 sm:px-4">تاريخ الطلب</th>
                    <th className="p-3.5 sm:px-4 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C9A24D]/20 text-[#2B2022]">
                  {waitlistStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        لا يوجد حالياً تلاميذ في قائمة الانتظار. جميع الأقسام مستوفية دون تجاوز للطاقة الاستيعابية.
                      </td>
                    </tr>
                  ) : (
                    waitlistStudents.map((s, idx) => (
                      <tr key={s._id} className="hover:bg-[#FDFBF7] transition-colors">
                        <td className="p-3.5 sm:px-4 text-center font-bold text-amber-800">
                          <span className="w-7 h-7 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto">
                            #{s.waitlistRank || idx + 1}
                          </span>
                        </td>

                        <td className="p-3.5 sm:px-4">
                          <div className="font-bold text-[#7B1E3A] text-sm">
                            {s.lastNameArabic || s.user?.lastName} {s.firstNameArabic || s.user?.firstName}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {s.registrationNumber} • {s.enrollmentType === 're-enrollment' ? 'إعادة تسجيل' : 'جديد'}
                          </span>
                        </td>

                        <td className="p-3.5 sm:px-4 font-serif font-black text-[#7B1E3A]">
                          {s.class?.name || 'غير محدد'}
                        </td>

                        <td className="p-3.5 sm:px-4">
                          <div className="font-semibold text-xs">
                            {s.parent?.user?.firstName || 'الولي'} {s.parent?.user?.lastName || ''}
                          </div>
                          <span className="text-[11px] text-emerald-800 font-mono" dir="ltr">
                            {s.parent?.user?.phoneNumber || '0550110011'}
                          </span>
                        </td>

                        <td className="p-3.5 sm:px-4 font-mono text-slate-600">
                          {s.registrationDate ? new Date(s.registrationDate).toLocaleDateString('ar-DZ') : '—'}
                        </td>

                        <td className="p-3.5 sm:px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s._id, 'accepted')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>قبول وترقية بمقعد شاغر</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setAuditModalStudent(s)}
                              className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs cursor-pointer"
                              title="سجل تاريخ حركة هذا التلميذ في قائمة الانتظار (المادة 15)"
                            >
                              <History className="w-4 h-4 text-[#C9A24D]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 5: EXCEL BATCH ENROLLMENT                                       */}
      {/* =================================================================== */}
      {activeTab === 'excel' && (
        <div className="p-6 sm:p-8 bg-white border border-[#C9A24D]/35 rounded-3xl shadow-xs space-y-6">
          <div className="border-b border-[#C9A24D]/25 pb-4 space-y-1">
            <h3 className="font-serif font-black text-[#7B1E3A] text-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#C9A24D]" />
              <span>استيراد جماعي للتلاميذ عبر ملف Excel رسمي</span>
            </h3>
            <p className="text-xs text-slate-600">
              قم بتحميل النموذج الوزاري المعتمد لمدرسة حبر، واملأ بيانات التلاميذ لتوليد حساباتهم ووصولاتهم دفعة واحدة
            </p>
          </div>

          <form onSubmit={handleExcelUpload} className="space-y-4 max-w-xl">
            <div className="p-6 border-2 border-dashed border-[#C9A24D]/40 rounded-2xl bg-[#FDFBF7] text-center space-y-3">
              <Upload className="w-8 h-8 mx-auto text-[#7B1E3A]" />
              <div>
                <label className="text-xs font-bold text-[#7B1E3A] block cursor-pointer">
                  اختر ملف الإكسل (.xlsx أو .xls)
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={(e) => setExcelFile(e.target.files[0])}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-slate-500 block mt-1">
                  {excelFile ? excelFile.name : 'لم يتم اختيار أي ملف بعد'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href="/template_eleves_zitouni.xlsx"
                download="نموذج_تسجيل_التلاميذ_مدرسة_حبر.xlsx"
                className="text-xs font-bold text-[#7B1E3A] underline flex items-center gap-1.5"
              >
                <Download className="w-4 h-4 text-[#C9A24D]" />
                <span>تحميل النموذج الرسمي الفارغ للإكسل</span>
              </a>

              <button
                type="submit"
                disabled={!excelFile || excelUploading}
                className="px-6 py-2.5 rounded-xl bg-[#7B1E3A] text-white font-bold text-xs disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {excelUploading ? 'جاري الاستيراد...' : 'بدء الاستيراد وتوليد الوصولات'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* ALL 5 OFFICIAL MODALS                                               */}
      {/* =================================================================== */}

      {/* 1. Official Receipt Modal (Bullet 9 - Page 14) */}
      {receiptModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div
            dir="rtl"
            className="bg-white border border-[#C9A24D]/40 rounded-3xl w-full max-w-xl shadow-2xl relative my-auto overflow-hidden font-sans"
          >
            <div className="no-print p-4 bg-[#F3E9DC] border-b border-[#C9A24D]/30 flex items-center justify-between">
              <span className="font-serif font-black text-sm text-[#7B1E3A]">
                {receiptModalStudent.isReEnrollment || receiptModalStudent.enrollmentType === 're-enrollment'
                  ? 'وصل إعادة التسجيل المدرسي الرسمي (Quittance de Réinscription)'
                  : 'وصل التسجيل المدرسي الرسمي (Quittance d\'Inscription)'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-[#7B1E3A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#C9A24D]" />
                  <span>طباعة الوصل</span>
                </button>
                <button
                  onClick={() => setReceiptModalStudent(null)}
                  className="p-1.5 rounded-xl bg-white text-slate-500 hover:text-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-5 bg-[#FDFBF7] text-[#2B2022]" id="receipt-print-area">
              <div className="flex items-center justify-between border-b-2 border-[#C9A24D] pb-4">
                <div className="flex items-center gap-3">
                  <SchoolLogo size={48} />
                  <div>
                    <h3 className="font-serif font-black text-sm text-[#7B1E3A]">
                      {settings?.institutionName || 'مؤسسة التربية والتعليم حبر وألوان الخاصة'}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-sans" dir="ltr">
                      {settings?.schoolNameFrench || 'Groupe scolaire Encre & Pastel'}
                    </p>
                  </div>
                </div>

                <div className="text-left font-mono text-xs">
                  <span className="font-bold text-[#7B1E3A] block">
                    وصل رقم: {receiptModalStudent.receiptNumber || 'REC-2026-0001'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    التاريخ: {new Date().toLocaleDateString('ar-DZ')}
                  </span>
                </div>
              </div>

              <div className="text-center py-2 bg-[#7B1E3A]/10 border border-[#7B1E3A]/30 rounded-xl">
                <h4 className="font-serif font-black text-[#7B1E3A] text-base">
                  {receiptModalStudent.isReEnrollment || receiptModalStudent.enrollmentType === 're-enrollment'
                    ? 'وصـل استـلام حقـوق إعـادة التسجيـل والتمـدرس'
                    : 'وصـل استـلام حقـوق التسجيـل والتمـدرس الجديـد'}
                </h4>
                <span className="text-[10px] text-slate-500 font-sans">
                  السنة الدراسية: {receiptModalStudent.academicYear || '2026-2027'}
                </span>
              </div>

              <div className="p-4 bg-white border border-[#C9A24D]/30 rounded-2xl space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-[#C9A24D]/20">
                  <div>
                    <span className="text-slate-400 block text-[10px]">اسم ولقب التلميذ:</span>
                    <span className="font-bold text-sm text-[#7B1E3A]">
                      {receiptModalStudent.lastNameArabic || receiptModalStudent.user?.lastName}{' '}
                      {receiptModalStudent.firstNameArabic || receiptModalStudent.user?.firstName}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">القسم الدراسي:</span>
                    <span className="font-bold text-sm text-[#2B2022]">
                      {receiptModalStudent.class?.name || 'غير محدد'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">رقم التسجيل:</span>
                    <span className="font-mono font-bold">{receiptModalStudent.registrationNumber}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">نوع العملية:</span>
                    <span className="font-bold text-emerald-800">
                      {receiptModalStudent.enrollmentType === 're-enrollment' || receiptModalStudent.isReEnrollment
                        ? 'إعادة تسجيل لموسم دراسي جديد'
                        : 'تسجيل جديد لأول مرة'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">المسؤول المدني / الولي:</span>
                    <span className="font-semibold text-[#2B2022]">
                      {receiptModalStudent.parent?.user?.firstName || 'ولي الأمر'}{' '}
                      {receiptModalStudent.parent?.user?.lastName || ''}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">رقم هاتف الولي:</span>
                    <span className="font-mono font-bold text-emerald-800" dir="ltr">
                      {receiptModalStudent.parent?.user?.phoneNumber || '0550110011'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-emerald-800 font-bold block">المبلغ الإجمالي المسدد:</span>
                  <span className="text-2xl font-black font-serif text-emerald-900">
                    {(receiptModalStudent.tuitionAmount || 15000).toLocaleString('fr-DZ')} دج
                  </span>
                  {receiptModalStudent.discountPercentage > 0 && (
                    <span className="text-[10px] text-emerald-700 block font-bold">
                      تم تطبيق {receiptModalStudent.discountReason || `تخفيض ${receiptModalStudent.discountPercentage}%`}
                    </span>
                  )}
                </div>
                <div className="text-left space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white block text-center">
                    تم التسديد والتوثيق ✓
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    طريقة الدفع: {receiptModalStudent.paymentMethod || 'نقداً'}
                  </span>
                </div>
              </div>

              {/* Signature and Stamp */}
              <div className="pt-3 border-t border-[#C9A24D]/30 flex items-center justify-between text-xs">
                <div className="w-14 h-14 border border-slate-300 rounded-xl p-1 bg-white">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=ZITOUNI_RECEIPT_${receiptModalStudent.receiptNumber}`}
                    alt="QR"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="text-center space-y-0.5">
                  <span className="text-[10px] text-slate-400 block">خاتم وتأشيرة أمانة المؤسسة</span>
                  <span className="font-serif font-black text-[#7B1E3A] text-xs block">
                    مؤسسة حبر وألوان الخاصة
                  </span>
                  <span className="text-[9px] text-slate-500">وصل رسمي مبرئ للذمة</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Official Contract Modal (Bullet 10 - Page 14) */}
      {contractModalStudent && (
        <StudentContractModal
          student={contractModalStudent}
          onClose={() => setContractModalStudent(null)}
        />
      )}

      {/* 3. Official Registration Form Modal (Bullet 11 - Page 14) */}
      {regFormModalStudent && (
        <StudentRegistrationFormModal
          student={regFormModalStudent}
          onClose={() => setRegFormModalStudent(null)}
        />
      )}

      {/* 4. Full Student Profile Dossier Modal */}
      {dossierModalStudent && (
        <StudentProfileFileModal
          student={dossierModalStudent}
          onClose={() => setDossierModalStudent(null)}
        />
      )}

      {/* 5. Audit History Log Modal (Bullet 2 - Page 15) */}
      {auditModalStudent && (
        <StudentAuditHistoryModal
          student={auditModalStudent}
          onClose={() => setAuditModalStudent(null)}
        />
      )}

      {/* 6. Class Roster Printable Sheet (Bullet 12 - Page 14) */}
      {rosterPrintClass && (
        <ClassRosterPrintModal
          selectedClass={rosterPrintClass}
          students={students.filter((s) => String(s.class?._id || s.class) === String(rosterPrintClass._id))}
          academicYear="2026-2027"
          onClose={() => setRosterPrintClass(null)}
        />
      )}
    </div>
  );
}
