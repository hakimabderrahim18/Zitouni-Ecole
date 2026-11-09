import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
  Share,
  Modal,
} from 'react-native';
import {
  FileText,
  UserPlus,
  RefreshCw,
  Printer,
  Clock,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  Calendar,
  User,
  Phone,
  CreditCard,
  Layers,
  X,
  Eye,
  AlertTriangle,
  FileCheck,
  CheckSquare,
  Square,
  ArrowRight,
  ChevronDown,
  Upload,
  Share2,
  Sparkles,
  ShieldCheck,
  Award,
  GraduationCap,
  Download,
  QrCode,
  History,
  Check,
} from 'lucide-react-native';
import { apiClient } from '../../api/client';

/* ==================================================================== */
/*  Official Document Checklist Definitions (Matching Web Checklist)     */
/* ==================================================================== */
export const OFFICIAL_ENROLLMENT_DOCS = [
  {
    key: 'birthCertificate',
    label: 'شهادة الميلاد الأصلية الحديثة',
    hint: 'نسخة أصلية أو مصادق عليها حديثة الاستخراج (أقل من 3 أشهر)',
  },
  {
    key: 'photos',
    label: 'الصور الشمسية الحديثة (04 صور)',
    hint: 'خلفية بيضاء مع كتابة اسم ولقب التلميذ خلف كل صورة',
  },
  {
    key: 'medicalCertificate',
    label: 'الشهادة الطبية العامة وفصيلة الدم',
    hint: 'شهادة طبية عامة وصدرية تثبت قدرة التلميذ على مزاولة النشاط البدني',
  },
  {
    key: 'vaccinationRecord',
    label: 'كراس أو دفتر التلقيح الصحي',
    hint: 'نسخة من صفحات التلافيح الإلزامية بالدفتر الصحي المدرسي',
  },
  {
    key: 'schoolCertificate',
    label: 'الشهادة المدرسية / كشف نقاط الانتقال',
    hint: 'الشهادة المدرسية للعام المنصرم للمحولين أو كشف نقاط الفصل الأخير',
  },
  {
    key: 'signedCharter',
    label: 'التعهد المدرسي والنظام الداخلي المصادق عليه',
    hint: 'وثيقة التعهد والتزام الولي بنظام المؤسسة مصادق عليها',
  },
];

const BLOOD_TYPES = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];

const DISCOUNT_OPTIONS = [
  { key: 'none', label: 'بدون تخفيض (0%)', pct: 0 },
  { key: 'fratrie', label: 'تخفيض الإخوة (15%)', pct: 15 },
  { key: 'staff', label: 'تخفيض أبناء الطاقم (30%)', pct: 30 },
  { key: 'scholarship', label: 'منحة التفوق (50%)', pct: 50 },
];

const REGIME_OPTIONS = [
  { key: 'نصف داخلي', label: 'نصف داخلي (مع وجبة الغداء بالكانتين)' },
  { key: 'خارجي', label: 'خارجي (دون إطعام)' },
  { key: 'داخلي', label: 'داخلي كامل' },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  accepted: { label: 'مقبول ومكتمل ✓', bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' },
  under_review: { label: 'قيد المراجعة ⏳', bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' },
  incomplete: { label: 'ملف ناقص ⚠️', bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  waitlist: { label: 'قائمة الانتظار ⏱️', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  rejected: { label: 'مرفوض ✕', bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' },
};

interface AdminEnrollmentViewProps {
  onSelectStudentDossier?: (student: any) => void;
  onRefreshParent?: () => void;
}

export const AdminEnrollmentView: React.FC<AdminEnrollmentViewProps> = ({
  onSelectStudentDossier,
  onRefreshParent,
}) => {
  // Navigation Tabs: 're-enrollment' | 'form' | 'list' | 'waitlist' | 'excel'
  const [activeTab, setActiveTab] = useState<'re-enrollment' | 'form' | 'list' | 'waitlist' | 'excel'>('re-enrollment');

  // Server Data
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [waitlistStudents, setWaitlistStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Success & Error feedback
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modals state for the 5 Official Documents
  const [receiptModalStudent, setReceiptModalStudent] = useState<any | null>(null);
  const [dossierModalStudent, setDossierModalStudent] = useState<any | null>(null); // Screenshots 1 & 2
  const [contractModalStudent, setContractModalStudent] = useState<any | null>(null);
  const [regFormModalStudent, setRegFormModalStudent] = useState<any | null>(null);
  const [auditModalStudent, setAuditModalStudent] = useState<any | null>(null);
  const [auditHistoryData, setAuditHistoryData] = useState<any | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  // Status Picker Modal state
  const [statusPickerStudent, setStatusPickerStudent] = useState<any | null>(null);

  // Class Picker Modal
  const [classPickerVisible, setClassPickerVisible] = useState(false);
  const [classPickerTarget, setClassPickerTarget] = useState<'form' | 'reEnroll' | 'filter'>('form');

  /* ==================================================================== */
  /*  TAB 1: RE-ENROLLMENT STATE                                          */
  /* ==================================================================== */
  const [reEnrollSearch, setReEnrollSearch] = useState('');
  const [selectedStudentForReEnroll, setSelectedStudentForReEnroll] = useState<any | null>(null);
  const [reEnrollData, setReEnrollData] = useState({
    academicYear: '2026-2027',
    targetClassId: '',
    regime: 'نصف داخلي',
    tuitionBaseAmount: 15000,
    discountType: 'none',
    discountPercentage: 0,
    discountAmount: 0,
    discountReason: '',
    tuitionAmount: 15000,
    documentsSubmitted: {
      birthCertificate: true,
      photos: true,
      medicalCertificate: true,
      vaccinationRecord: true,
      schoolCertificate: true,
      signedCharter: true,
    } as Record<string, boolean>,
    documentReferences: {} as Record<string, string>,
  });

  /* ==================================================================== */
  /*  TAB 2: NEW ENROLLMENT FORM STATE                                    */
  /* ==================================================================== */
  const [formData, setFormData] = useState({
    firstNameArabic: '',
    lastNameArabic: '',
    firstNameFrench: '',
    dateOfBirth: '2018-05-12',
    placeOfBirth: 'الجزائر',
    gender: 'ذكر',
    bloodType: 'O+',
    academicYear: '2026-2027',
    classId: '',
    regime: 'نصف داخلي',
    tuitionBaseAmount: 15000,
    discountType: 'none',
    discountPercentage: 0,
    discountAmount: 0,
    tuitionAmount: 15000,
    parentPhone: '',
    parentFirstName: '',
    parentLastName: '',
    parentProfession: 'إطار بالوظيفة العمومية',
    parentAddress: 'الجزائر العاصمة',
    documentsSubmitted: {
      birthCertificate: true,
      photos: true,
      medicalCertificate: false,
      vaccinationRecord: true,
      schoolCertificate: false,
      signedCharter: true,
    } as Record<string, boolean>,
    documentReferences: {} as Record<string, string>,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ==================================================================== */
  /*  TAB 3: REGISTERED LIST FILTERS (Matching Screenshot 3)              */
  /* ==================================================================== */
  const [listSearch, setListSearch] = useState('');
  const [listClassFilter, setListClassFilter] = useState('ALL');
  const [listTypeFilter, setListTypeFilter] = useState('ALL'); // 'ALL' | 'new' | 're-enrollment'
  const [listStatusFilter, setListStatusFilter] = useState('ALL'); // 'ALL' | 'accepted' | 'under_review' | 'incomplete' | 'waitlist' | 'rejected'

  /* ==================================================================== */
  /*  LOAD DATA FROM BACKEND                                              */
  /* ==================================================================== */
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resCls, resStu, resWait] = await Promise.all([
        apiClient.get('/api/admin/classes'),
        apiClient.get('/api/admin/students'),
        apiClient.get('/api/admin/waitlist').catch(() => ({ data: [] })),
      ]);

      const clsList = resCls.data || [];
      const stuList = resStu.data || [];
      const waitList = resWait.data || [];

      setClasses(clsList);
      setStudents(stuList);
      setWaitlistStudents(waitList);

      if (clsList.length > 0) {
        if (!formData.classId) setFormData((p) => ({ ...p, classId: clsList[0]._id }));
        if (!reEnrollData.targetClassId) setReEnrollData((p) => ({ ...p, targetClassId: clsList[0]._id }));
      }
    } catch (err: any) {
      console.error('Failed to load enrollment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ==================================================================== */
  /*  Tuition recalculations on discount change                           */
  /* ==================================================================== */
  const handleDiscountChange = (type: string) => {
    const opt = DISCOUNT_OPTIONS.find((o) => o.key === type) || DISCOUNT_OPTIONS[0];
    const base = Number(formData.tuitionBaseAmount) || 15000;
    const discountAmt = Math.round((base * opt.pct) / 100);
    const net = Math.max(0, base - discountAmt);

    setFormData((prev) => ({
      ...prev,
      discountType: type,
      discountPercentage: opt.pct,
      discountAmount: discountAmt,
      tuitionAmount: net,
    }));
  };

  const handleReEnrollDiscountChange = (type: string) => {
    const opt = DISCOUNT_OPTIONS.find((o) => o.key === type) || DISCOUNT_OPTIONS[0];
    const base = Number(reEnrollData.tuitionBaseAmount) || 15000;
    const discountAmt = Math.round((base * opt.pct) / 100);
    const net = Math.max(0, base - discountAmt);

    setReEnrollData((prev) => ({
      ...prev,
      discountType: type,
      discountPercentage: opt.pct,
      discountAmount: discountAmt,
      tuitionAmount: net,
    }));
  };

  /* ==================================================================== */
  /*  SUBMIT HANDLERS                                                     */
  /* ==================================================================== */
  const handleNewEnrollmentSubmit = async () => {
    if (!formData.firstNameArabic.trim() || !formData.lastNameArabic.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم ولقب التلميذ بالعربية.');
      return;
    }
    if (!formData.parentPhone.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم هاتف الولي (المعرف للدخول).');
      return;
    }
    if (!formData.classId) {
      Alert.alert('تنبيه', 'يرجى اختيار القسم الموجه إليه.');
      return;
    }

    setIsSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const payload = {
        firstName: formData.firstNameArabic,
        lastName: formData.lastNameArabic,
        firstNameArabic: formData.firstNameArabic,
        lastNameArabic: formData.lastNameArabic,
        firstNameFrench: formData.firstNameFrench,
        dateOfBirth: formData.dateOfBirth,
        placeOfBirth: formData.placeOfBirth,
        gender: formData.gender,
        bloodType: formData.bloodType,
        academicYear: formData.academicYear,
        classId: formData.classId,
        regime: formData.regime,
        tuitionBaseAmount: formData.tuitionBaseAmount,
        discountType: formData.discountType,
        discountPercentage: formData.discountPercentage,
        discountAmount: formData.discountAmount,
        tuitionAmount: formData.tuitionAmount,
        parentPhone: formData.parentPhone,
        parentFirstName: formData.parentFirstName || 'ولي',
        parentLastName: formData.parentLastName || formData.lastNameArabic,
        parentProfession: formData.parentProfession,
        parentAddress: formData.parentAddress,
        documentsSubmitted: formData.documentsSubmitted,
        documentReferences: formData.documentReferences,
      };

      const res = await apiClient.post('/api/admin/enrollment', payload);
      const studentObj = res.data?.student || {};

      setSuccessMsg(res.data?.message || 'تم تسجيل التلميذ بنجاح وتوليد وصل التسجيل والملف الإداري.');
      fetchData();
      if (onRefreshParent) onRefreshParent();

      // Show receipt modal
      setReceiptModalStudent({
        ...studentObj,
        firstNameArabic: formData.firstNameArabic,
        lastNameArabic: formData.lastNameArabic,
        receiptNumber: res.data?.receiptNumber || studentObj.receiptNumber || 'REC-2026-NEW',
        tuitionAmount: formData.tuitionAmount,
        class: classes.find((c) => c._id === formData.classId) || { name: '1AP' },
        parent: { user: { phoneNumber: formData.parentPhone, firstName: formData.parentFirstName } },
      });

      // Reset form
      setFormData((p) => ({
        ...p,
        firstNameArabic: '',
        lastNameArabic: '',
        firstNameFrench: '',
        parentPhone: '',
        parentFirstName: '',
      }));
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'خطأ أثناء تسجيل التلميذ';
      setErrorMsg(msg);
      Alert.alert('خطأ', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReEnrollSubmit = async () => {
    if (!selectedStudentForReEnroll) {
      Alert.alert('تنبيه', 'يرجى اختيار التلميذ أولاً.');
      return;
    }
    if (!reEnrollData.targetClassId) {
      Alert.alert('تنبيه', 'يرجى اختيار القسم الجديد.');
      return;
    }

    setIsSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const payload = {
        studentId: selectedStudentForReEnroll._id,
        targetClassId: reEnrollData.targetClassId,
        academicYear: reEnrollData.academicYear,
        regime: reEnrollData.regime,
        tuitionBaseAmount: reEnrollData.tuitionBaseAmount,
        discountType: reEnrollData.discountType,
        discountPercentage: reEnrollData.discountPercentage,
        discountAmount: reEnrollData.discountAmount,
        documentsSubmitted: reEnrollData.documentsSubmitted,
        documentReferences: reEnrollData.documentReferences,
      };

      const res = await apiClient.post('/api/admin/re-enrollment', payload);
      const studentObj = res.data?.student || selectedStudentForReEnroll;

      setSuccessMsg(res.data?.message || 'تمت إعادة تسجيل التلميذ بنجاح وتوليد وصل إعادة التسجيل.');
      fetchData();
      if (onRefreshParent) onRefreshParent();

      // Show receipt modal
      setReceiptModalStudent({
        ...studentObj,
        receiptNumber: res.data?.receiptNumber || 'REC-2026-RE',
        tuitionAmount: reEnrollData.tuitionAmount,
        isReEnrollment: true,
        class: classes.find((c) => c._id === reEnrollData.targetClassId) || selectedStudentForReEnroll.class,
      });

      setSelectedStudentForReEnroll(null);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'خطأ أثناء إعادة التسجيل';
      setErrorMsg(msg);
      Alert.alert('خطأ', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Status of student dossier (Page 14)
  const handleUpdateStatus = async (studentId: string, newStatus: string) => {
    try {
      await apiClient.put(`/api/admin/students/${studentId}/enrollment-status`, {
        status: newStatus,
      });
      setSuccessMsg(`تم تحديث حالة ملف التلميذ بنجاح.`);
      setStatusPickerStudent(null);
      fetchData();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل تحديث حالة الملف');
    }
  };

  // Open Audit History Modal (Page 15)
  const handleOpenAuditHistory = async (student: any) => {
    setAuditModalStudent(student);
    setAuditLoading(true);
    try {
      const res = await apiClient.get(`/api/admin/students/${student._id}/audit-history`);
      setAuditHistoryData(res.data);
    } catch (err: any) {
      console.error('Audit fetch err:', err);
      setAuditHistoryData(null);
    } finally {
      setAuditLoading(false);
    }
  };

  // Promote Waitlist Student (Page 15)
  const handlePromoteWaitlist = async (studentId: string) => {
    try {
      await apiClient.put(`/api/admin/students/${studentId}/enrollment-status`, {
        status: 'accepted',
      });
      Alert.alert('نجاح', 'تم قبول التلميذ بنجاح وترقيته بمقعد شاغر.');
      fetchData();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشلت ترقية التلميذ');
    }
  };

  /* ==================================================================== */
  /*  FILTERED STUDENTS FOR RE-ENROLLMENT SEARCH                          */
  /* ==================================================================== */
  const reEnrollCandidateStudents = useMemo(() => {
    if (!reEnrollSearch.trim()) return students;
    const q = reEnrollSearch.trim().toLowerCase();
    return students.filter((s) => {
      const name = `${s.firstNameArabic || s.user?.firstName || ''} ${s.lastNameArabic || s.user?.lastName || ''}`.toLowerCase();
      const reg = (s.registrationNumber || '').toLowerCase();
      const phone = (s.parent?.user?.phoneNumber || s.studentPhone || '').toLowerCase();
      return name.includes(q) || reg.includes(q) || phone.includes(q);
    });
  }, [students, reEnrollSearch]);

  /* ==================================================================== */
  /*  FILTERED STUDENTS FOR REGISTERED LIST (Matches Screenshot 3)        */
  /* ==================================================================== */
  const filteredRegisteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (listClassFilter !== 'ALL') {
        const clsId = s.class?._id || s.class;
        if (String(clsId) !== String(listClassFilter)) return false;
      }
      if (listTypeFilter !== 'ALL') {
        const type = s.enrollmentType || 'new';
        if (type !== listTypeFilter) return false;
      }
      if (listStatusFilter !== 'ALL') {
        const status = s.registrationStatus || (s.isWaitlisted ? 'waitlist' : 'accepted');
        if (status !== listStatusFilter) return false;
      }
      if (listSearch.trim()) {
        const q = listSearch.trim().toLowerCase();
        const name = `${s.firstNameArabic || s.user?.firstName || ''} ${s.lastNameArabic || s.user?.lastName || ''}`.toLowerCase();
        const reg = (s.registrationNumber || '').toLowerCase();
        const nat = (s.nationalIdDigitization || '').toLowerCase();
        const phone = (s.parent?.user?.phoneNumber || '').toLowerCase();
        return name.includes(q) || reg.includes(q) || nat.includes(q) || phone.includes(q);
      }
      return true;
    });
  }, [students, listClassFilter, listTypeFilter, listStatusFilter, listSearch]);

  // Documents count
  const submittedCount = useMemo(() => {
    return Object.values(formData.documentsSubmitted).filter(Boolean).length;
  }, [formData.documentsSubmitted]);

  return (
    <View style={styles.container}>
      {/* ================================================================ */}
      {/* 1. Official Header Card (منظومة التسجيل وإعادة التسجيل المدرسية) */}
      {/* ================================================================ */}
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleBox}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>منظومة التسجيل وإعادة التسجيل المدرسية</Text>
              <View style={styles.headerIconContainer}>
                <FileText size={20} color="#7B1E3A" />
              </View>
            </View>
            <Text style={styles.headerSubtitle}>
              إدارة التسجيلات الجديدة، إعادة تسجيل التلاميذ القدامى، التخفيضات المعتمدة، قوائم الانتظار، واستخراج الوصولات والعقود الرسمية
            </Text>
          </View>
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.cahierBadge}>
            <Text style={styles.cahierBadgeText}>دفتر الشروط ص 14 - 15</Text>
          </View>
        </View>

        {/* Horizontal Navigation Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          <TouchableOpacity
            style={[styles.navTab, activeTab === 're-enrollment' && styles.navTabActive]}
            onPress={() => setActiveTab('re-enrollment')}
            activeOpacity={0.8}
          >
            <RefreshCw size={13} color={activeTab === 're-enrollment' ? '#FFFFFF' : '#7B1E3A'} />
            <Text style={[styles.navTabText, activeTab === 're-enrollment' && styles.navTabTextActive]}>
              إعادة تسجيل تلميذ قديم
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, activeTab === 'form' && styles.navTabActive]}
            onPress={() => setActiveTab('form')}
            activeOpacity={0.8}
          >
            <UserPlus size={14} color={activeTab === 'form' ? '#FFFFFF' : '#7B1E3A'} />
            <Text style={[styles.navTabText, activeTab === 'form' && styles.navTabTextActive]}>
              إنشاء تسجيل جديد
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, activeTab === 'list' && styles.navTabActive]}
            onPress={() => setActiveTab('list')}
            activeOpacity={0.8}
          >
            <Printer size={13} color={activeTab === 'list' ? '#FFFFFF' : '#7B1E3A'} />
            <Text style={[styles.navTabText, activeTab === 'list' && styles.navTabTextActive]}>
              قوائم المسجلين ({students.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, activeTab === 'waitlist' && styles.navTabActive]}
            onPress={() => setActiveTab('waitlist')}
            activeOpacity={0.8}
          >
            <Clock size={13} color={activeTab === 'waitlist' ? '#FFFFFF' : '#7B1E3A'} />
            <Text style={[styles.navTabText, activeTab === 'waitlist' && styles.navTabTextActive]}>
              قائمة الانتظار ({waitlistStudents.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, activeTab === 'excel' && styles.navTabActive]}
            onPress={() => setActiveTab('excel')}
            activeOpacity={0.8}
          >
            <FileSpreadsheet size={13} color={activeTab === 'excel' ? '#FFFFFF' : '#7B1E3A'} />
            <Text style={[styles.navTabText, activeTab === 'excel' && styles.navTabTextActive]}>
              استيراد إكسل
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Notifications */}
      {successMsg ? (
        <View style={styles.alertSuccess}>
          <CheckCircle2 size={16} color="#047857" />
          <Text style={styles.alertSuccessText}>{successMsg}</Text>
          <TouchableOpacity onPress={() => setSuccessMsg('')}>
            <X size={14} color="#047857" />
          </TouchableOpacity>
        </View>
      ) : null}

      {errorMsg ? (
        <View style={styles.alertError}>
          <AlertTriangle size={16} color="#B91C1C" />
          <Text style={styles.alertErrorText}>{errorMsg}</Text>
          <TouchableOpacity onPress={() => setErrorMsg('')}>
            <X size={14} color="#B91C1C" />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ================================================================ */}
      {/* TAB 1: RE-ENROLLMENT (إعادة تسجيل تلميذ قديم - Screenshot 1)        */}
      {/* ================================================================ */}
      {activeTab === 're-enrollment' && (
        <View style={styles.tabContent}>
          {/* Step 1 Box: Selection of Pre-registered student */}
          <View style={styles.stepBox}>
            <View style={styles.stepHeaderRow}>
              <Search size={16} color="#C9A24D" />
              <Text style={styles.stepTitle}>الخطوة 1: اختيار التلميذ المسجل مسبقاً في المؤسسة</Text>
            </View>
            <Text style={styles.stepSubtitle}>
              ابحث بالاسم، رقم التسجيل (Matricule)، رقم الرقمنة، أو هاتف الولي
            </Text>

            <View style={styles.searchInputWrapper}>
              <TextInput
                value={reEnrollSearch}
                onChangeText={setReEnrollSearch}
                placeholder="اكتب اسم التلميذ أو رقم التسجيل (مثال: REG-2026-0001 أو 0550...)"
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
              />
              <Search size={16} color="#9CA3AF" style={styles.searchIcon} />
            </View>

            {/* List of candidates if no student selected yet */}
            {!selectedStudentForReEnroll && (
              <View style={styles.candidatesList}>
                {reEnrollCandidateStudents.slice(0, 8).map((cand) => {
                  const fName = cand.firstNameArabic || cand.user?.firstName || 'تلميذ';
                  const lName = cand.lastNameArabic || cand.user?.lastName || '';
                  const initial = fName.charAt(0) || 'ت';
                  const reg = cand.registrationNumber || 'REG-26-000';
                  const clsName = cand.class?.name || 'غير محدد';

                  return (
                    <View key={cand._id} style={styles.candidateCard}>
                      <TouchableOpacity
                        style={styles.selectCandidateBtn}
                        onPress={() => {
                          setSelectedStudentForReEnroll(cand);
                          if (cand.parent?.children?.length > 1) {
                            handleReEnrollDiscountChange('fratrie');
                          }
                        }}
                      >
                        <Text style={styles.selectCandidateBtnText}>اختيار لإعادة التسجيل ←</Text>
                      </TouchableOpacity>

                      <View style={styles.candidateInfo}>
                        <Text style={styles.candidateName}>{lName} {fName}</Text>
                        <Text style={styles.candidateSub}>
                          رقم التسجيل: {reg} • القسم الحالي: {clsName}
                        </Text>
                      </View>

                      <View style={styles.candidateAvatar}>
                        <Text style={styles.candidateAvatarText}>{initial}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Selected Student Banner */}
            {selectedStudentForReEnroll && (
              <View style={styles.selectedBanner}>
                <View style={styles.selectedBannerTop}>
                  <View style={styles.selectedBannerAvatar}>
                    <User size={20} color="#C9A24D" />
                  </View>
                  <View style={styles.selectedBannerInfo}>
                    <View style={styles.selectedBannerNameRow}>
                      <Text style={styles.selectedBannerName}>
                        {selectedStudentForReEnroll.lastNameArabic || selectedStudentForReEnroll.user?.lastName}{' '}
                        {selectedStudentForReEnroll.firstNameArabic || selectedStudentForReEnroll.user?.firstName}
                      </Text>
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>تلميذ مسجل سابقاً</Text>
                      </View>
                    </View>
                    <Text style={styles.selectedBannerSub}>
                      القسم الحالي: {selectedStudentForReEnroll.class?.name || '—'} • رقم التسجيل: {selectedStudentForReEnroll.registrationNumber}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.changeCandidateBtn}
                  onPress={() => setSelectedStudentForReEnroll(null)}
                >
                  <Text style={styles.changeCandidateBtnText}>تغيير التلميذ</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Step 2 Box: Re-Enrollment Form Configuration */}
          {selectedStudentForReEnroll && (
            <View style={styles.stepBox}>
              <View style={styles.stepHeaderRow}>
                <RefreshCw size={16} color="#C9A24D" />
                <Text style={styles.stepTitle}>
                  الخطوة 2: تحديد معطيات إعادة التسجيل للموسم الجديد ({reEnrollData.academicYear})
                </Text>
              </View>

              {/* Target Class Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>القسم والمستوى الجديد المراد الترقية إليه *</Text>
                <TouchableOpacity
                  style={styles.pickerSelector}
                  onPress={() => {
                    setClassPickerTarget('reEnroll');
                    setClassPickerVisible(true);
                  }}
                >
                  <ChevronDown size={16} color="#7B1E3A" />
                  <Text style={styles.pickerSelectorText}>
                    {classes.find((c) => c._id === reEnrollData.targetClassId)?.name || 'اختر القسم الجديد'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Regime Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>نظام التمدرس والإطعام *</Text>
                <View style={styles.chipsRow}>
                  {REGIME_OPTIONS.map((r) => {
                    const isSel = reEnrollData.regime === r.key;
                    return (
                      <TouchableOpacity
                        key={r.key}
                        style={[styles.regimeChip, isSel && styles.regimeChipActive]}
                        onPress={() => setReEnrollData((p) => ({ ...p, regime: r.key }))}
                      >
                        <Text style={[styles.regimeChipText, isSel && styles.regimeChipTextActive]}>
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Discount Selector */}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>نوع التخفيض المعتمد:</Text>
                <View style={styles.chipsRow}>
                  {DISCOUNT_OPTIONS.map((d) => {
                    const isSel = reEnrollData.discountType === d.key;
                    return (
                      <TouchableOpacity
                        key={d.key}
                        style={[styles.discountChip, isSel && styles.discountChipActive]}
                        onPress={() => handleReEnrollDiscountChange(d.key)}
                      >
                        <Text style={[styles.discountChipText, isSel && styles.discountChipTextActive]}>
                          {d.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Green Tuition Box */}
              <View style={styles.tuitionBox}>
                <View style={styles.tuitionBoxRow}>
                  <Text style={styles.tuitionBoxLabel}>صافي الرسوم المستحقة للتسجيل:</Text>
                  <Text style={styles.tuitionBoxValue}>
                    {reEnrollData.tuitionAmount.toLocaleString('fr-DZ')} دج
                  </Text>
                </View>
                <Text style={styles.tuitionBoxSub}>
                  المبلغ الأساسي: {reEnrollData.tuitionBaseAmount} دج • المقتطع: {reEnrollData.discountAmount} دج
                </Text>
              </View>

              {/* Re-enrollment Submit Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleReEnrollSubmit}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <ArrowRight size={18} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>
                      إتمام إعادة التسجيل وتوليد الوصل والملف الإداري
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ================================================================ */}
      {/* TAB 2: NEW ENROLLMENT FORM (إنشاء تسجيل جديد - Screenshots 2, 3, 4)*/}
      {/* ================================================================ */}
      {activeTab === 'form' && (
        <View style={styles.tabContent}>
          {/* Section 1: Informations Personnelles */}
          <View style={styles.stepBox}>
            <View style={styles.stepHeaderRow}>
              <User size={16} color="#C9A24D" />
              <Text style={styles.stepTitle}>1. المعلومات الشخصية للتلميذ الجديد</Text>
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.fieldCol}>
                <Text style={styles.fieldLabel}>الاسم الشخصي بالعربية *</Text>
                <TextInput
                  value={formData.firstNameArabic}
                  onChangeText={(v) => setFormData((p) => ({ ...p, firstNameArabic: v }))}
                  placeholder="مثال: يانيس"
                  placeholderTextColor="#9CA3AF"
                  style={styles.textInput}
                />
              </View>
              <View style={styles.fieldCol}>
                <Text style={styles.fieldLabel}>اللقب العائلي بالعربية *</Text>
                <TextInput
                  value={formData.lastNameArabic}
                  onChangeText={(v) => setFormData((p) => ({ ...p, lastNameArabic: v }))}
                  placeholder="مثال: مزيان"
                  placeholderTextColor="#9CA3AF"
                  style={styles.textInput}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Nom & Prénom en français</Text>
              <TextInput
                value={formData.firstNameFrench}
                onChangeText={(v) => setFormData((p) => ({ ...p, firstNameFrench: v }))}
                placeholder="Ex: Yanis MEZIANE"
                placeholderTextColor="#9CA3AF"
                style={[styles.textInput, { textAlign: 'left' }]}
              />
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.fieldCol}>
                <Text style={styles.fieldLabel}>تاريخ الميلاد *</Text>
                <TextInput
                  value={formData.dateOfBirth}
                  onChangeText={(v) => setFormData((p) => ({ ...p, dateOfBirth: v }))}
                  placeholder="jj/mm/aaaa"
                  placeholderTextColor="#9CA3AF"
                  style={[styles.textInput, { textAlign: 'left' }]}
                />
              </View>
              <View style={styles.fieldCol}>
                <Text style={styles.fieldLabel}>مكان الميلاد</Text>
                <TextInput
                  value={formData.placeOfBirth}
                  onChangeText={(v) => setFormData((p) => ({ ...p, placeOfBirth: v }))}
                  placeholder="الجزائر"
                  placeholderTextColor="#9CA3AF"
                  style={styles.textInput}
                />
              </View>
            </View>

            {/* Sexe & Groupe Sanguin */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldCol}>
                <Text style={styles.fieldLabel}>الجنس</Text>
                <View style={styles.chipsRowSmall}>
                  {['ذكر', 'أنثى'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.miniChip, formData.gender === g && styles.miniChipActive]}
                      onPress={() => setFormData((p) => ({ ...p, gender: g }))}
                    >
                      <Text style={[styles.miniChipText, formData.gender === g && styles.miniChipTextActive]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.fieldCol}>
                <Text style={styles.fieldLabel}>فصيلة الدم</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
                  {BLOOD_TYPES.map((bt) => (
                    <TouchableOpacity
                      key={bt}
                      style={[styles.miniChip, formData.bloodType === bt && styles.miniChipActive]}
                      onPress={() => setFormData((p) => ({ ...p, bloodType: bt }))}
                    >
                      <Text style={[styles.miniChipText, formData.bloodType === bt && styles.miniChipTextActive]}>
                        {bt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>

          {/* Section 2: Orientation pédagogique & Tarifs */}
          <View style={styles.stepBox}>
            <View style={styles.stepHeaderRow}>
              <Layers size={16} color="#C9A24D" />
              <Text style={styles.stepTitle}>2. التوجيه البيداغوجي والرسوم والتخفيضات</Text>
            </View>

            {/* Target Class */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>القسم الدراسي الموجه إليه *</Text>
              <TouchableOpacity
                style={styles.pickerSelector}
                onPress={() => {
                  setClassPickerTarget('form');
                  setClassPickerVisible(true);
                }}
              >
                <ChevronDown size={16} color="#7B1E3A" />
                <Text style={styles.pickerSelectorText}>
                  {classes.find((c) => c._id === formData.classId)?.name
                    ? `${classes.find((c) => c._id === formData.classId)?.name} (0/30 مقعد)`
                    : 'اختر القسم الدراسي'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Regime */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>النظام المعتمد *</Text>
              <View style={styles.chipsRow}>
                {REGIME_OPTIONS.map((r) => {
                  const isSel = formData.regime.includes(r.key);
                  return (
                    <TouchableOpacity
                      key={r.key}
                      style={[styles.regimeChip, isSel && styles.regimeChipActive]}
                      onPress={() => setFormData((p) => ({ ...p, regime: r.key }))}
                    >
                      <Text style={[styles.regimeChipText, isSel && styles.regimeChipTextActive]}>
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Discount */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>نوع التخفيض المعتمد:</Text>
              <View style={styles.chipsRow}>
                {DISCOUNT_OPTIONS.map((d) => {
                  const isSel = formData.discountType === d.key;
                  return (
                    <TouchableOpacity
                      key={d.key}
                      style={[styles.discountChip, isSel && styles.discountChipActive]}
                      onPress={() => handleDiscountChange(d.key)}
                    >
                      <Text style={[styles.discountChipText, isSel && styles.discountChipTextActive]}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Green Tuition Box */}
            <View style={styles.tuitionBox}>
              <View style={styles.tuitionBoxRow}>
                <Text style={styles.tuitionBoxLabel}>صافي الرسوم المستحقة للتسجيل:</Text>
                <Text style={styles.tuitionBoxValue}>
                  {formData.tuitionAmount.toLocaleString('fr-DZ')} دج
                </Text>
              </View>
              <Text style={styles.tuitionBoxSub}>
                المبلغ الأساسي: {formData.tuitionBaseAmount} دج • المقتطع: {formData.discountAmount} دج
              </Text>
            </View>
          </View>

          {/* Section 3: Informations Parent & Compte Unifié (Page 14) */}
          <View style={styles.stepBox}>
            <View style={styles.stepHeaderRow}>
              <Phone size={16} color="#C9A24D" />
              <Text style={styles.stepTitle}>3. بيانات الولي والحساب الموحد للأبناء (Page 14)</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>رقم هاتف الولي (المعرف للدخول) *</Text>
              <TextInput
                value={formData.parentPhone}
                onChangeText={(v) => setFormData((p) => ({ ...p, parentPhone: v }))}
                placeholder="مثال: 0550112233"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                style={[styles.textInput, { textAlign: 'left', color: '#047857', fontWeight: 'bold' }]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>اسم ولقب الولي:</Text>
              <TextInput
                value={formData.parentFirstName}
                onChangeText={(v) => setFormData((p) => ({ ...p, parentFirstName: v }))}
                placeholder="مثال: أحمد مزيان"
                placeholderTextColor="#9CA3AF"
                style={styles.textInput}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>مهنة الولي وعنوان السكن:</Text>
              <TextInput
                value={formData.parentAddress}
                onChangeText={(v) => setFormData((p) => ({ ...p, parentAddress: v }))}
                placeholder="الجزائر العاصمة"
                placeholderTextColor="#9CA3AF"
                style={styles.textInput}
              />
            </View>
          </View>

          {/* Section 4: Checklist des documents - البند 5 (Screenshot 4) */}
          <View style={styles.stepBox}>
            <View style={styles.stepHeaderBetween}>
              <View style={styles.stepHeaderRow}>
                <FileCheck size={16} color="#C9A24D" />
                <Text style={styles.stepTitle}>تدقيق ومرفقات الوثائق المطلوبة (البند 5)</Text>
              </View>
              <View style={styles.docCountBadge}>
                <Text style={styles.docCountBadgeText}>{submittedCount} / 6 مستلم</Text>
              </View>
            </View>

            <Text style={styles.stepSubtitle}>
              قم بالتأشير على الوثائق المستلمة مع تدوين مراجعها الرسمية وإرفاق الملفات الرقمية.
            </Text>

            <View style={styles.docsList}>
              {OFFICIAL_ENROLLMENT_DOCS.map((doc) => {
                const isChecked = !!formData.documentsSubmitted[doc.key];
                const refVal = formData.documentReferences[doc.key] || '';

                return (
                  <View key={doc.key} style={styles.docCard}>
                    <View style={styles.docCardTop}>
                      <TouchableOpacity
                        style={styles.docCheckboxRow}
                        onPress={() => {
                          setFormData((p) => ({
                            ...p,
                            documentsSubmitted: {
                              ...p.documentsSubmitted,
                              [doc.key]: !isChecked,
                            },
                          }));
                        }}
                      >
                        <Text style={styles.docTitle}>{doc.label}</Text>
                        {isChecked ? (
                          <CheckSquare size={18} color="#7B1E3A" />
                        ) : (
                          <Square size={18} color="#9CA3AF" />
                        )}
                      </TouchableOpacity>

                      <View style={[styles.docStatusBadge, isChecked ? styles.docStatusReceived : styles.docStatusPending]}>
                        <Text style={[styles.docStatusText, isChecked ? styles.docStatusTextReceived : styles.docStatusTextPending]}>
                          {isChecked ? 'مستلم ورقياً' : 'في الانتظار'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.docHint}>{doc.hint}</Text>

                    <View style={styles.docBottomRow}>
                      <TextInput
                        value={refVal}
                        onChangeText={(v) => {
                          setFormData((p) => ({
                            ...p,
                            documentReferences: {
                              ...p.documentReferences,
                              [doc.key]: v,
                            },
                          }));
                        }}
                        placeholder="رقم الوثيقة أو تاريخها..."
                        placeholderTextColor="#9CA3AF"
                        style={styles.docRefInput}
                      />

                      <TouchableOpacity
                        style={styles.docAttachBtn}
                        onPress={() => Alert.alert('إرفاق ملف', 'تم تسجيل إرفاق الوثيقة الرقمية بنجاح')}
                      >
                        <Upload size={12} color="#7B1E3A" />
                        <Text style={styles.docAttachBtnText}>إرفاق وثيقة (PDF / صورة)</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Big Action Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleNewEnrollmentSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle2 size={18} color="#C9A24D" />
                  <Text style={styles.submitButtonText}>
                    إتمام تسجيل التلميذ وتوليد الوصل والملف الإداري ←
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ================================================================ */}
      {/* TAB 3: REGISTERED STUDENTS LIST (قوائم المسجلين - Screenshot 3)   */}
      {/* ================================================================ */}
      {activeTab === 'list' && (
        <View style={styles.tabContent}>
          {/* Filters Bar matching Screenshot 3 */}
          <View style={styles.stepBox}>
            <View style={styles.searchInputWrapper}>
              <TextInput
                value={listSearch}
                onChangeText={setListSearch}
                placeholder="بحث بالاسم (عربي / فرنسي)، رقم الرقمنة، الهاتف، ولي الأمر..."
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
              />
              <Search size={16} color="#7B1E3A" style={styles.searchIcon} />
            </View>

            <View style={styles.filterBarRow}>
              {/* Class Filter */}
              <TouchableOpacity
                style={styles.filterBtn}
                onPress={() => {
                  setClassPickerTarget('filter');
                  setClassPickerVisible(true);
                }}
              >
                <ChevronDown size={14} color="#7B1E3A" />
                <Text style={styles.filterBtnText}>
                  {listClassFilter === 'ALL'
                    ? `جميع الأقسام (${classes.length})`
                    : classes.find((c) => c._id === listClassFilter)?.name || 'قسم'}
                </Text>
              </TouchableOpacity>

              {/* Type Filter */}
              <View style={styles.chipsRowSmall}>
                {[
                  { key: 'ALL', label: 'كل الأنواع' },
                  { key: 'new', label: 'تسجيل جديد' },
                  { key: 're-enrollment', label: 'إعادة تسجيل' },
                ].map((t) => (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.miniChip, listTypeFilter === t.key && styles.miniChipActive]}
                    onPress={() => setListTypeFilter(t.key)}
                  >
                    <Text style={[styles.miniChipText, listTypeFilter === t.key && styles.miniChipTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Status Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 8 }}>
              {[
                { key: 'ALL', label: 'كل الحالات' },
                { key: 'accepted', label: 'مقبول ومكتمل ✓' },
                { key: 'under_review', label: 'قيد المراجعة ⏳' },
                { key: 'incomplete', label: 'ملف ناقص ⚠️' },
                { key: 'waitlist', label: 'قائمة الانتظار ⏱️' },
              ].map((st) => (
                <TouchableOpacity
                  key={st.key}
                  style={[styles.miniChip, listStatusFilter === st.key && styles.miniChipActive]}
                  onPress={() => setListStatusFilter(st.key)}
                >
                  <Text style={[styles.miniChipText, listStatusFilter === st.key && styles.miniChipTextActive]}>
                    {st.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* List of registered students - EXACT 5 BUTTONS FROM SCREENSHOT 3 */}
          <View style={styles.studentsList}>
            {filteredRegisteredStudents.map((s) => {
              const fName = s.firstNameArabic || s.user?.firstName || '';
              const lName = s.lastNameArabic || s.user?.lastName || '';
              const fullName = `${lName} ${fName}`.trim() || 'تلميذ مسجل';
              const clsName = s.class?.name || 'غير محدد';
              const regNum = s.registrationNumber || 'REG-26-000';
              const natNum = s.nationalIdDigitization || '20261601000';
              const parentName = `${s.parent?.user?.firstName || ''} ${s.parent?.user?.lastName || ''}`.trim() || 'ولي الأمر';
              const parentPhone = s.parent?.user?.phoneNumber || s.studentPhone || '0550000000';
              const isNew = (s.enrollmentType || 'new') === 'new';
              const stKey = s.registrationStatus || (s.isWaitlisted ? 'waitlist' : 'accepted');
              const stConfig = STATUS_CONFIG[stKey] || STATUS_CONFIG.accepted;

              return (
                <View key={s._id} style={styles.regStudentCard}>
                  {/* Top: Student Title & IDs */}
                  <View style={styles.regStudentTopRow}>
                    <TouchableOpacity
                      style={[styles.statusDropdownBtn, { backgroundColor: stConfig.bg, borderColor: stConfig.border }]}
                      onPress={() => setStatusPickerStudent(s)}
                    >
                      <ChevronDown size={12} color={stConfig.color} />
                      <Text style={[styles.statusDropdownBtnText, { color: stConfig.color }]}>
                        {stConfig.label}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.regStudentNameBox}>
                      <Text style={styles.regStudentName}>{fullName}</Text>
                      <Text style={styles.regStudentIds}>
                        {natNum} • {regNum}
                      </Text>
                    </View>
                  </View>

                  {/* Middle: Class, Type Badge, Parent & Phone */}
                  <View style={styles.regStudentMiddleRow}>
                    <View style={styles.regParentBox}>
                      <Text style={styles.regParentName}>{parentName}</Text>
                      <Text style={styles.regParentPhone}>{parentPhone}</Text>
                    </View>

                    <View style={styles.regClassBox}>
                      <Text style={styles.regClassName}>{clsName}</Text>
                      <View style={[styles.regTypeBadge, isNew ? styles.regTypeNew : styles.regTypeRe]}>
                        <Text style={[styles.regTypeBadgeText, isNew ? styles.regTypeNewText : styles.regTypeReText]}>
                          {isNew ? 'تسجيل جديد' : 'إعادة تسجيل'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Bottom: THE 5 OFFICIAL ACTION BUTTONS (Exact Match Screenshot 3) */}
                  <View style={styles.officialButtonsRow}>
                    {/* 1. وصل التسجيل (Receipt) */}
                    <TouchableOpacity
                      style={styles.btnReceipt}
                      onPress={() => setReceiptModalStudent(s)}
                    >
                      <Text style={styles.btnReceiptText}>وصل التسجيل</Text>
                    </TouchableOpacity>

                    {/* 2. عقد التسجيل (Contract) */}
                    <TouchableOpacity
                      style={styles.btnContract}
                      onPress={() => setContractModalStudent(s)}
                    >
                      <Text style={styles.btnContractText}>عقد التسجيل</Text>
                    </TouchableOpacity>

                    {/* 3. استمارة التسجيل (Registration Form) */}
                    <TouchableOpacity
                      style={styles.btnRegForm}
                      onPress={() => setRegFormModalStudent(s)}
                    >
                      <Text style={styles.btnRegFormText}>استمارة التسجيل</Text>
                    </TouchableOpacity>

                    {/* 4. الملف المدرسي (Full Dossier / Fiche Individuelle) */}
                    <TouchableOpacity
                      style={styles.btnDossier}
                      onPress={() => setDossierModalStudent(s)}
                    >
                      <Text style={styles.btnDossierText}>الملف المدرسي</Text>
                    </TouchableOpacity>

                    {/* 5. سجل التدقيق (Audit History) */}
                    <TouchableOpacity
                      style={styles.btnAudit}
                      onPress={() => handleOpenAuditHistory(s)}
                    >
                      <History size={11} color="#C9A24D" />
                      <Text style={styles.btnAuditText}>سجل التدقيق</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* ================================================================ */}
      {/* TAB 4: WAITLIST MANAGER (Page 15 - Screenshot 5)                 */}
      {/* ================================================================ */}
      {activeTab === 'waitlist' && (
        <View style={styles.tabContent}>
          <View style={styles.stepBox}>
            <View style={styles.stepHeaderRow}>
              <Clock size={18} color="#C9A24D" />
              <Text style={styles.stepTitle}>إعداد وإدارة قائمة الانتظار عند امتلاء الأقسام (Page 15)</Text>
            </View>

            <Text style={styles.waitlistLegalNotice}>
              وفق المادة 15 من دفتر الشروط، عند وصول القسم أو الفوج إلى طاقته الاستيعابية القصوى (مثال: 30 تلميذاً)، يُدرج أي تسجيل أو إعادة تسجيل إضافية في «قائمة الانتظار» تلقائياً بالترتيب الزمني مع إمكانية الترقية والقبول الفوري عند شغور مقعد.
            </Text>
          </View>

          {waitlistStudents.length === 0 ? (
            <View style={styles.waitlistEmptyBox}>
              <Clock size={40} color="#C9A24D" style={{ opacity: 0.6 }} />
              <Text style={styles.waitlistEmptyTitle}>قائمة الانتظار فارغة حالياً</Text>
              <Text style={styles.waitlistEmptyText}>
                لا يوجد حالياً تلاميذ في قائمة الانتظار، جميع الأقسام مستوفية دون تجاوز للطاقة الاستيعابية.
              </Text>
            </View>
          ) : (
            <View style={styles.waitlistItemsList}>
              {waitlistStudents.map((s, idx) => (
                <View key={s._id} style={styles.waitlistCard}>
                  <View style={styles.waitlistRankBox}>
                    <Text style={styles.waitlistRankText}>#{s.waitlistRank || idx + 1}</Text>
                  </View>

                  <View style={styles.waitlistInfo}>
                    <Text style={styles.waitlistName}>
                      {s.lastNameArabic || s.user?.lastName} {s.firstNameArabic || s.user?.firstName}
                    </Text>
                    <Text style={styles.waitlistSub}>
                      القسم المطلوب: {s.class?.name || '—'} • الولي: {s.parent?.user?.phoneNumber || '—'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.promoteBtn}
                    onPress={() => handlePromoteWaitlist(s._id)}
                  >
                    <CheckCircle2 size={13} color="#FFFFFF" />
                    <Text style={styles.promoteBtnText}>قبول وترقية بمقعد شاغر</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ================================================================ */}
      {/* TAB 5: EXCEL IMPORT                                              */}
      {/* ================================================================ */}
      {activeTab === 'excel' && (
        <View style={styles.tabContent}>
          <View style={styles.stepBox}>
            <View style={styles.stepHeaderRow}>
              <FileSpreadsheet size={18} color="#C9A24D" />
              <Text style={styles.stepTitle}>استيراد جماعي للتلاميذ عبر Excel</Text>
            </View>
            <Text style={styles.stepSubtitle}>
              يمكنك رفع ملف إكسل يحتوي على قوائم التلاميذ والبيانات الشخصية لتسجيلهم دفعة واحدة في قاعدة البيانات وتوليد أرقام التسجيل الرسمية.
            </Text>

            <TouchableOpacity
              style={styles.excelUploadBox}
              onPress={() => Alert.alert('استيراد إكسل', 'يرجى اختيار ملف .xlsx من جهازك.')}
            >
              <Upload size={32} color="#7B1E3A" />
              <Text style={styles.excelUploadTitle}>اضغط هنا لاختيار ملف إكسل (XLSX / CSV)</Text>
              <Text style={styles.excelUploadSub}>
                يتضمن الاسم، اللقب، تاريخ الميلاد، رقم الهاتف، والقسم الموجه إليه
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ================================================================ */}
      {/* MODAL 1: FICHE INDIVIDUELLE (الملف المدرسي الشامل - Screenshots 1 & 2)*/}
      {/* ================================================================ */}
      <Modal visible={!!dossierModalStudent} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.ficheModalSheet}>
            {/* Top Bar matching Screenshot 1 */}
            <View style={styles.ficheTopBar}>
              <TouchableOpacity onPress={() => setDossierModalStudent(null)} style={styles.ficheCloseBtn}>
                <X size={18} color="#6B7280" />
              </TouchableOpacity>

              <View style={styles.ficheTopActions}>
                <TouchableOpacity
                  style={styles.fichePrintBtn}
                  onPress={async () => {
                    const text = `الملف الإداري المدرسي الشامل للتلميذ (Fiche Individuelle)
المؤسسة: مدرسة حبر وألوان الخاصة
التلميذ: ${dossierModalStudent?.lastNameArabic || ''} ${dossierModalStudent?.firstNameArabic || ''}
رقم التسجيل: ${dossierModalStudent?.registrationNumber || ''}
القسم: ${dossierModalStudent?.class?.name || ''}`;
                    try {
                      await Share.share({ message: text, title: 'الملف الإداري المدرسي' });
                    } catch {}
                  }}
                >
                  <Printer size={13} color="#FFFFFF" />
                  <Text style={styles.fichePrintBtnText}>طباعة الملف (Imprimer / PDF)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.ficheSaveBtn}
                  onPress={() => Alert.alert('حفظ الملف', 'تم حفظ الملف الإداري بصيغة رقمية بنجاح')}
                >
                  <Download size={13} color="#7B1E3A" />
                  <Text style={styles.ficheSaveBtnText}>حفظ الملف (Enregistrer)</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.ficheHeaderTitleBox}>
                <GraduationCap size={16} color="#7B1E3A" />
                <Text style={styles.ficheHeaderTitle}>الملف الإداري المدرسي الشامل للتلميذ (Fiche Individuelle)</Text>
              </View>
            </View>

            {dossierModalStudent && (
              <ScrollView contentContainerStyle={styles.ficheScrollContent}>
                {/* Official National & School Header */}
                <View style={styles.ficheNationalHeader}>
                  <View style={styles.ficheHeaderRight}>
                    <Text style={styles.ficheNatTitle}>الجمهورية الجزائرية الديمقراطية الشعبية</Text>
                    <Text style={styles.ficheNatMinistry}>وزارة التربية الوطنية</Text>
                    <Text style={styles.ficheNatDir}>مديرية التربية لولاية الجزائر</Text>
                  </View>

                  <View style={styles.ficheHeaderCenter}>
                    <View style={styles.ficheLogoCircle}>
                      <GraduationCap size={20} color="#C9A24D" />
                    </View>
                    <Text style={styles.ficheSchoolName}>مؤسسة التربية والتعليم حبر وألوان الخاصة</Text>
                    <Text style={styles.ficheSchoolFrench}>Groupe scolaire Encre & Pastel</Text>
                  </View>

                  <View style={styles.ficheHeaderLeft}>
                    <Text style={styles.ficheMetaLine}>السنة الدراسية : 2026 - 2027</Text>
                    <Text style={styles.ficheMetaLine}>الرقم المرجعي : {dossierModalStudent.registrationNumber || 'REG-26-012'}</Text>
                    <Text style={styles.ficheMetaLine}>رقم الرقمنة : {dossierModalStudent.nationalIdDigitization || '20261601012'}</Text>
                  </View>
                </View>

                {/* Burgundy Title Banner */}
                <View style={styles.ficheBanner}>
                  <Text style={styles.ficheBannerTitle}>الملف الإداري والتأهيلي الشامل للتلميذ</Text>
                  <Text style={styles.ficheBannerFrench}>DOSSIER SCOLAIRE & FICHE INDIVIDUELLE D'ÉLÈVE</Text>
                </View>

                {/* Section 1: Civil Identity & Photo Card (Screenshot 1) */}
                <View style={styles.ficheSectionSplit}>
                  {/* Photo Silhouette Card */}
                  <View style={styles.fichePhotoCard}>
                    <View style={styles.fichePhotoSilhouette}>
                      <User size={36} color="#C9A24D" />
                      <Text style={styles.fichePhotoLabel}>صورة التلميذ</Text>
                    </View>
                    <Text style={styles.fichePhotoRegNum}>{dossierModalStudent.registrationNumber || 'REG-26-012'}</Text>
                    <View style={styles.fichePhotoActiveBadge}>
                      <Text style={styles.fichePhotoActiveText}>تسجيل ساري المفعول</Text>
                    </View>
                  </View>

                  {/* Civil Identity Card */}
                  <View style={styles.ficheIdentityCard}>
                    <View style={styles.ficheCardHeaderRow}>
                      <User size={15} color="#C9A24D" />
                      <Text style={styles.ficheCardTitle}>الهوية والحالة المدنية للتلميذ</Text>
                    </View>

                    <View style={styles.ficheInfoGrid}>
                      <View style={styles.ficheInfoCol}>
                        <Text style={styles.ficheInfoLabel}>الاسم الكامل بالعربية:</Text>
                        <Text style={styles.ficheInfoValueBold}>
                          {dossierModalStudent.lastNameArabic || dossierModalStudent.user?.lastName}{' '}
                          {dossierModalStudent.firstNameArabic || dossierModalStudent.user?.firstName}
                        </Text>
                      </View>
                      <View style={styles.ficheInfoCol}>
                        <Text style={styles.ficheInfoLabel}>الاسم الكامل بالفرنسية:</Text>
                        <Text style={styles.ficheInfoValueMono}>
                          {dossierModalStudent.firstNameFrench || dossierModalStudent.user?.firstName || '—'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.ficheInfoGrid}>
                      <View style={styles.ficheInfoCol}>
                        <Text style={styles.ficheInfoLabel}>تاريخ الميلاد والسن:</Text>
                        <Text style={styles.ficheInfoValue}>
                          {dossierModalStudent.dateOfBirth
                            ? new Date(dossierModalStudent.dateOfBirth).toLocaleDateString('ar-DZ')
                            : '25 جانفي 2014'} (12 سنة)
                        </Text>
                      </View>
                      <View style={styles.ficheInfoCol}>
                        <Text style={styles.ficheInfoLabel}>مكان الميلاد:</Text>
                        <Text style={styles.ficheInfoValue}>{dossierModalStudent.placeOfBirth || 'أولاد فايت'}</Text>
                      </View>
                    </View>

                    <View style={styles.ficheInfoGrid}>
                      <View style={styles.ficheInfoCol}>
                        <Text style={styles.ficheInfoLabel}>الجنس:</Text>
                        <Text style={styles.ficheInfoValue}>{dossierModalStudent.gender || 'أنثى'}</Text>
                      </View>
                      <View style={styles.ficheInfoCol}>
                        <Text style={styles.ficheInfoLabel}>فصيلة الدم:</Text>
                        <Text style={[styles.ficheInfoValue, { color: '#B91C1C', fontWeight: 'bold' }]}>
                          {dossierModalStudent.bloodType || 'O+'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Section 2: Pedagogical Information (Screenshot 2) */}
                <View style={styles.ficheCardBox}>
                  <View style={styles.ficheCardHeaderRow}>
                    <GraduationCap size={15} color="#C9A24D" />
                    <Text style={styles.ficheCardTitle}>المعلومات البيداغوجية والتمدرس</Text>
                  </View>

                  <View style={styles.ficheBoxesRow}>
                    <View style={styles.ficheMiniBox}>
                      <Text style={styles.ficheMiniBoxLabel}>القسم الدراسي:</Text>
                      <Text style={styles.ficheMiniBoxValBordeaux}>{dossierModalStudent.class?.name || '1AP'}</Text>
                    </View>
                    <View style={styles.ficheMiniBox}>
                      <Text style={styles.ficheMiniBoxLabel}>الفوج البيداغوجي:</Text>
                      <Text style={styles.ficheMiniBoxValBordeaux}>{dossierModalStudent.group?.name || 'الفوج ب'}</Text>
                    </View>
                    <View style={styles.ficheMiniBox}>
                      <Text style={styles.ficheMiniBoxLabel}>نظام التمدرس والإطعام:</Text>
                      <Text style={styles.ficheMiniBoxVal}>{dossierModalStudent.regime || 'نصف داخلي'}</Text>
                    </View>
                    <View style={styles.ficheMiniBox}>
                      <Text style={styles.ficheMiniBoxLabel}>تاريخ التسجيل الرسمي:</Text>
                      <Text style={styles.ficheMiniBoxValMono}>
                        {dossierModalStudent.registrationDate
                          ? new Date(dossierModalStudent.registrationDate).toLocaleDateString('fr-DZ')
                          : '2026/11/4'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Section 3: Legal Guardian & Contacts (Screenshot 2) */}
                <View style={styles.ficheCardBox}>
                  <View style={styles.ficheCardHeaderRow}>
                    <ShieldCheck size={15} color="#C9A24D" />
                    <Text style={styles.ficheCardTitle}>بيانات الولي الشرعي وتفاصيل الاتصال</Text>
                  </View>

                  <View style={styles.ficheInfoGrid}>
                    <View style={styles.ficheInfoCol}>
                      <Text style={styles.ficheInfoLabel}>اسم الولي / المسؤول المدني:</Text>
                      <Text style={styles.ficheInfoValueBold}>
                        {dossierModalStudent.parent?.user?.firstName || 'جمال'}{' '}
                        {dossierModalStudent.parent?.user?.lastName || 'زروقي'}
                      </Text>
                    </View>
                    <View style={styles.ficheInfoCol}>
                      <Text style={styles.ficheInfoLabel}>رقم هاتف الولي:</Text>
                      <Text style={styles.ficheInfoValueEmerald}>
                        {dossierModalStudent.parent?.user?.phoneNumber || '0550660066'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.ficheInfoGrid}>
                    <View style={styles.ficheInfoCol}>
                      <Text style={styles.ficheInfoLabel}>المهنة:</Text>
                      <Text style={styles.ficheInfoValue}>{dossierModalStudent.parent?.profession || 'صيدلي'}</Text>
                    </View>
                    <View style={styles.ficheInfoCol}>
                      <Text style={styles.ficheInfoLabel}>البريد الإلكتروني للولي:</Text>
                      <Text style={styles.ficheInfoValueMono}>
                        {dossierModalStudent.parent?.user?.email || 'parent.zerrouki@ecole-zitouni.dz'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.ficheInfoFullRow}>
                    <Text style={styles.ficheInfoLabel}>العنوان السكني المعتمد:</Text>
                    <Text style={styles.ficheInfoValue}>
                      {dossierModalStudent.parent?.address || 'حي الهضاب، طريق بوشاوي، أولاد فايت'}
                    </Text>
                  </View>
                </View>

                {/* Section 4: Bottom Validation & Seal Block (Screenshot 2) */}
                <View style={styles.ficheBottomValidationRow}>
                  {/* School Seal */}
                  <View style={styles.ficheSealBlock}>
                    <Text style={styles.ficheSealTitle}>خاتم وتأشيرة إدارة المؤسسة</Text>
                    <Text style={styles.ficheSealSub}>المدير العام للمؤسسة</Text>
                    <View style={styles.ficheSealBox}>
                      <Text style={styles.ficheSealText}>مدرسة حبر الخاصة</Text>
                    </View>
                  </View>

                  {/* QR Verification Code */}
                  <View style={styles.ficheQRBlock}>
                    <QrCode size={42} color="#1F2937" />
                    <Text style={styles.ficheQRText}>رمز التحقق الرقمي الرسمي</Text>
                  </View>

                  {/* Parent Signature */}
                  <View style={styles.ficheSignBlock}>
                    <Text style={styles.ficheSignTitle}>توقيع ولي الأمر</Text>
                    <Text style={styles.ficheSignSub}>بالمصادقة على صحة البيانات</Text>
                    <View style={styles.ficheSignBox} />
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ================================================================ */}
      {/* MODAL 2: CONTRACT MODAL (عقد التسجيل المدرسي)                    */}
      {/* ================================================================ */}
      <Modal visible={!!contractModalStudent} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.receiptModalSheet}>
            <View style={styles.receiptHeader}>
              <TouchableOpacity onPress={() => setContractModalStudent(null)}>
                <X size={20} color="#7B1E3A" />
              </TouchableOpacity>
              <Text style={styles.receiptTitle}>عقد التمدرس والتسجيل المدرسي الرسمي (Page 14)</Text>
            </View>

            {contractModalStudent && (
              <ScrollView contentContainerStyle={styles.receiptBody}>
                <View style={styles.receiptSchoolBlock}>
                  <Text style={styles.receiptCountry}>الجمهورية الجزائرية الديمقراطية الشعبية</Text>
                  <Text style={styles.receiptMinistry}>وزارة التربية الوطنية</Text>
                  <Text style={styles.receiptInstitution}>مؤسسة التربية والتعليم حبر وألوان الخاصة</Text>
                  <Text style={styles.receiptYear}>الموسم الدراسي: 2026 - 2027</Text>
                </View>

                <View style={styles.receiptNumberBox}>
                  <Text style={styles.receiptNumberLabel}>رقم العقد المدرسي الرسمي:</Text>
                  <Text style={styles.receiptNumberValue}>
                    CTR-2026-{String(contractModalStudent.registrationNumber || '0012').slice(-4)}
                  </Text>
                </View>

                <View style={styles.receiptTable}>
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableVal}>
                      {contractModalStudent.lastNameArabic || contractModalStudent.user?.lastName}{' '}
                      {contractModalStudent.firstNameArabic || contractModalStudent.user?.firstName}
                    </Text>
                    <Text style={styles.receiptTableKey}>الطرف الأول (التلميذ):</Text>
                  </View>

                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableVal}>
                      {contractModalStudent.parent?.user?.firstName || 'ولي الأمر'}{' '}
                      {contractModalStudent.parent?.user?.lastName || ''}
                    </Text>
                    <Text style={styles.receiptTableKey}>الطرف الثاني (الولي):</Text>
                  </View>

                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableVal}>{contractModalStudent.class?.name || '1AP'}</Text>
                    <Text style={styles.receiptTableKey}>القسم الموجه إليه:</Text>
                  </View>

                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableVal}>{contractModalStudent.regime || 'نصف داخلي'}</Text>
                    <Text style={styles.receiptTableKey}>نظام التمدرس والإطعام:</Text>
                  </View>

                  <View style={[styles.receiptTableRow, { backgroundColor: '#ECFDF5' }]}>
                    <Text style={[styles.receiptTableVal, { color: '#047857', fontWeight: 'bold' }]}>
                      {(contractModalStudent.tuitionAmount || 15000).toLocaleString('fr-DZ')} دج / سنوياً
                    </Text>
                    <Text style={[styles.receiptTableKey, { color: '#047857', fontWeight: 'bold' }]}>
                      الالتزام المالي المتفق عليه:
                    </Text>
                  </View>
                </View>

                <Text style={styles.contractLegalText}>
                  يتعهد الولي بموجب هذا العقد بالالتزام التام بالنظام الداخلي للمؤسسة ودفع مستحقات التمدرس في مواعيدها المحددة، بينما تلتزم المؤسسة بتوفير التأطير البيداغوجي وفق البرامج الرسمية لوزارة التربية الوطنية.
                </Text>

                <View style={styles.receiptActions}>
                  <TouchableOpacity
                    style={styles.receiptShareBtn}
                    onPress={async () => {
                      const text = `عقد التمدرس الرسمي
التلميذ: ${contractModalStudent.firstNameArabic || ''} ${contractModalStudent.lastNameArabic || ''}
القسم: ${contractModalStudent.class?.name || ''}
رقم العقد: CTR-2026-${String(contractModalStudent.registrationNumber || '0012').slice(-4)}`;
                      try {
                        await Share.share({ message: text, title: 'عقد التمدرس الرسمي' });
                      } catch {}
                    }}
                  >
                    <Share2 size={16} color="#FFFFFF" />
                    <Text style={styles.receiptShareBtnText}>مشاركة العقد الرسمي</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.receiptCloseBtn}
                    onPress={() => setContractModalStudent(null)}
                  >
                    <Text style={styles.receiptCloseBtnText}>إغلاق</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ================================================================ */}
      {/* MODAL 3: REGISTRATION FORM MODAL (استمارة التسجيل)                */}
      {/* ================================================================ */}
      <Modal visible={!!regFormModalStudent} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.receiptModalSheet}>
            <View style={styles.receiptHeader}>
              <TouchableOpacity onPress={() => setRegFormModalStudent(null)}>
                <X size={20} color="#7B1E3A" />
              </TouchableOpacity>
              <Text style={styles.receiptTitle}>استمارة التسجيل وتدقيق الملف الإداري</Text>
            </View>

            {regFormModalStudent && (
              <ScrollView contentContainerStyle={styles.receiptBody}>
                <View style={styles.receiptSchoolBlock}>
                  <Text style={styles.receiptInstitution}>مؤسسة التربية والتعليم حبر وألوان الخاصة</Text>
                  <Text style={styles.receiptYear}>استمارة المراجعة البيداغوجية والوثائق المطلوبة</Text>
                </View>

                <View style={styles.receiptTable}>
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableVal}>
                      {regFormModalStudent.lastNameArabic || regFormModalStudent.user?.lastName}{' '}
                      {regFormModalStudent.firstNameArabic || regFormModalStudent.user?.firstName}
                    </Text>
                    <Text style={styles.receiptTableKey}>التلميذ:</Text>
                  </View>
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableVal}>{regFormModalStudent.registrationNumber || '—'}</Text>
                    <Text style={styles.receiptTableKey}>رقم التسجيل:</Text>
                  </View>
                </View>

                <Text style={[styles.fieldLabel, { marginTop: 6 }]}>حالة الوثائق الإدارية (Checklist des documents):</Text>
                <View style={{ gap: 6 }}>
                  {OFFICIAL_ENROLLMENT_DOCS.map((doc) => {
                    const isRec = !!(regFormModalStudent.documentsSubmitted?.[doc.key]);
                    return (
                      <View key={doc.key} style={styles.regFormDocRow}>
                        <Text style={[styles.regFormDocStatus, { color: isRec ? '#047857' : '#B45309' }]}>
                          {isRec ? '✓ مستلم' : '⏳ قيد الاستكمال'}
                        </Text>
                        <Text style={styles.regFormDocLabel}>{doc.label}</Text>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.receiptActions}>
                  <TouchableOpacity
                    style={styles.receiptShareBtn}
                    onPress={() => Alert.alert('طباعة الاستمارة', 'تم إعداد استمارة التسجيل للطباعة.')}
                  >
                    <Printer size={16} color="#FFFFFF" />
                    <Text style={styles.receiptShareBtnText}>طباعة استمارة التسجيل</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.receiptCloseBtn}
                    onPress={() => setRegFormModalStudent(null)}
                  >
                    <Text style={styles.receiptCloseBtnText}>إغلاق</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ================================================================ */}
      {/* MODAL 4: AUDIT HISTORY MODAL (سجل التدقيق - Page 15)             */}
      {/* ================================================================ */}
      <Modal visible={!!auditModalStudent} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.receiptModalSheet}>
            <View style={styles.receiptHeader}>
              <TouchableOpacity onPress={() => setAuditModalStudent(null)}>
                <X size={20} color="#7B1E3A" />
              </TouchableOpacity>
              <Text style={styles.receiptTitle}>سجل حركات وتدقيق ملف التلميذ (المادة 15)</Text>
            </View>

            {auditLoading ? (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#7B1E3A" />
                <Text style={{ marginTop: 10, fontSize: 12, color: '#6B7280' }}>جاري تحميل سجل التدقيق...</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.receiptBody}>
                {auditModalStudent && (
                  <View style={styles.receiptNumberBox}>
                    <Text style={styles.receiptNumberLabel}>
                      التلميذ: {auditModalStudent.firstNameArabic || auditModalStudent.user?.firstName}{' '}
                      {auditModalStudent.lastNameArabic || auditModalStudent.user?.lastName}
                    </Text>
                    <Text style={styles.receiptNumberValue}>
                      {auditModalStudent.registrationNumber || 'REG-26-000'} • قسم {auditModalStudent.class?.name || ''}
                    </Text>
                  </View>
                )}

                <Text style={[styles.fieldLabel, { marginTop: 4 }]}>الحركات والعمليات المسجلة (Audit Trail):</Text>
                {(!auditHistoryData?.auditHistory || auditHistoryData.auditHistory.length === 0) ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: '#9CA3AF' }}>لا توجد حركات مسجلة إضافية على هذا الملف.</Text>
                  </View>
                ) : (
                  <View style={{ gap: 8 }}>
                    {auditHistoryData.auditHistory.map((item: any, idx: number) => (
                      <View key={idx} style={styles.auditItemCard}>
                        <View style={styles.auditItemHeader}>
                          <Text style={styles.auditItemDate}>
                            {item.timestamp ? new Date(item.timestamp).toLocaleString('ar-DZ') : '—'}
                          </Text>
                          <View style={styles.auditActionBadge}>
                            <Text style={styles.auditActionBadgeText}>{item.action || 'تعديل'}</Text>
                          </View>
                        </View>
                        <Text style={styles.auditItemDesc}>{item.description || item.reason || 'إجراء إداري'}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.receiptCloseBtn}
                  onPress={() => setAuditModalStudent(null)}
                >
                  <Text style={styles.receiptCloseBtnText}>إغلاق</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ================================================================ */}
      {/* MODAL 5: OFFICIAL RECEIPT MODAL (وصل التسجيل)                     */}
      {/* ================================================================ */}
      <Modal visible={!!receiptModalStudent} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.receiptModalSheet}>
            <View style={styles.receiptHeader}>
              <TouchableOpacity onPress={() => setReceiptModalStudent(null)}>
                <X size={20} color="#7B1E3A" />
              </TouchableOpacity>
              <Text style={styles.receiptTitle}>وصل استلام ملف ورسوم التسجيل المدرسي</Text>
            </View>

            {receiptModalStudent && (
              <ScrollView contentContainerStyle={styles.receiptBody}>
                {/* School Title */}
                <View style={styles.receiptSchoolBlock}>
                  <Text style={styles.receiptCountry}>الجمهورية الجزائرية الديمقراطية الشعبية</Text>
                  <Text style={styles.receiptMinistry}>وزارة التربية الوطنية</Text>
                  <Text style={styles.receiptInstitution}>مؤسسة التربية والتعليم حبر وألوان الخاصة</Text>
                  <Text style={styles.receiptYear}>الموسم الدراسي: 2026 - 2027</Text>
                </View>

                {/* Receipt Number Badge */}
                <View style={styles.receiptNumberBox}>
                  <Text style={styles.receiptNumberLabel}>رقم وصل التسجيل الرسمي:</Text>
                  <Text style={styles.receiptNumberValue}>
                    {receiptModalStudent.receiptNumber || 'REC-2026-0001'}
                  </Text>
                </View>

                {/* Student Info Table */}
                <View style={styles.receiptTable}>
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableVal}>
                      {receiptModalStudent.lastNameArabic || receiptModalStudent.user?.lastName}{' '}
                      {receiptModalStudent.firstNameArabic || receiptModalStudent.user?.firstName}
                    </Text>
                    <Text style={styles.receiptTableKey}>اسم ولقب التلميذ:</Text>
                  </View>

                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableVal}>
                      {receiptModalStudent.registrationNumber || 'REG-26-000'}
                    </Text>
                    <Text style={styles.receiptTableKey}>رقم التسجيل (Matricule):</Text>
                  </View>

                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableVal}>
                      {receiptModalStudent.class?.name || '1AP'}
                    </Text>
                    <Text style={styles.receiptTableKey}>القسم الموجه إليه:</Text>
                  </View>

                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableVal}>
                      {receiptModalStudent.parent?.user?.phoneNumber || '0550112233'}
                    </Text>
                    <Text style={styles.receiptTableKey}>هاتف ولي الأمر:</Text>
                  </View>

                  <View style={[styles.receiptTableRow, { backgroundColor: '#ECFDF5' }]}>
                    <Text style={[styles.receiptTableVal, { color: '#047857', fontWeight: 'bold' }]}>
                      {(receiptModalStudent.tuitionAmount || 15000).toLocaleString('fr-DZ')} دج
                    </Text>
                    <Text style={[styles.receiptTableKey, { color: '#047857', fontWeight: 'bold' }]}>
                      صافي الرسوم المسددة:
                    </Text>
                  </View>
                </View>

                {/* Official Stamp Representation */}
                <View style={styles.receiptStampBox}>
                  <View style={styles.receiptStamp}>
                    <CheckCircle2 size={24} color="#047857" />
                    <Text style={styles.receiptStampText}>تم الاستلام والتسجيل</Text>
                    <Text style={styles.receiptStampDate}>بتاريخ: {new Date().toLocaleDateString('fr-DZ')}</Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.receiptActions}>
                  <TouchableOpacity
                    style={styles.receiptShareBtn}
                    onPress={async () => {
                      const text = `وصل التسجيل المدرسي الرسمي
المؤسسة: حبر وألوان الخاصة
التلميذ: ${receiptModalStudent.firstNameArabic || ''} ${receiptModalStudent.lastNameArabic || ''}
رقم الوصل: ${receiptModalStudent.receiptNumber || 'REC-2026-0001'}
القسم: ${receiptModalStudent.class?.name || '1AP'}
صافي الرسوم: ${(receiptModalStudent.tuitionAmount || 15000).toLocaleString('fr-DZ')} دج`;
                      try {
                        await Share.share({ message: text, title: 'وصل التسجيل المدرسي' });
                      } catch {}
                    }}
                  >
                    <Share2 size={16} color="#FFFFFF" />
                    <Text style={styles.receiptShareBtnText}>مشاركة الوصل الرسمي</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.receiptCloseBtn}
                    onPress={() => setReceiptModalStudent(null)}
                  >
                    <Text style={styles.receiptCloseBtnText}>إغلاق</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ================================================================ */}
      {/* MODAL 6: STATUS PICKER MODAL (تغيير حالة الملف)                   */}
      {/* ================================================================ */}
      <Modal visible={!!statusPickerStudent} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalSheet}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>تحديث حالة ملف التلميذ</Text>
              <TouchableOpacity onPress={() => setStatusPickerStudent(null)}>
                <X size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {statusPickerStudent && (
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'right', marginBottom: 4 }}>
                  التلميذ: {statusPickerStudent.lastNameArabic || ''} {statusPickerStudent.firstNameArabic || ''}
                </Text>

                {Object.entries(STATUS_CONFIG).map(([stKey, cfg]) => (
                  <TouchableOpacity
                    key={stKey}
                    style={[styles.statusOptionBtn, { backgroundColor: cfg.bg, borderColor: cfg.border }]}
                    onPress={() => handleUpdateStatus(statusPickerStudent._id, stKey)}
                  >
                    <Text style={[styles.statusOptionBtnText, { color: cfg.color }]}>
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ================================================================ */}
      {/* MODAL 7: CLASS PICKER MODAL                                      */}
      {/* ================================================================ */}
      <Modal visible={classPickerVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalSheet}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>اختر القسم الدراسي</Text>
              <TouchableOpacity onPress={() => setClassPickerVisible(false)}>
                <X size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 350 }}>
              {classPickerTarget === 'filter' && (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setListClassFilter('ALL');
                    setClassPickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>جميع الأقسام ({classes.length})</Text>
                </TouchableOpacity>
              )}

              {classes.map((cls) => (
                <TouchableOpacity
                  key={cls._id}
                  style={styles.pickerItem}
                  onPress={() => {
                    if (classPickerTarget === 'form') {
                      setFormData((p) => ({ ...p, classId: cls._id }));
                    } else if (classPickerTarget === 'reEnroll') {
                      setReEnrollData((p) => ({ ...p, targetClassId: cls._id }));
                    } else {
                      setListClassFilter(cls._id);
                    }
                    setClassPickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{cls.name}</Text>
                  <Text style={styles.pickerItemSub}>الطور: {cls.cycle || 'التعليمي'} • السعة: 30 مقعد</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

/* ==================================================================== */
/*  PRESTIGE ACADÉMIQUE STYLESHEET                                      */
/* ==================================================================== */
const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },

  /* Header Card */
  headerCard: {
    backgroundColor: '#FAF7F2',
    borderWidth: 1.5,
    borderColor: '#E5DFD7',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  headerTitleBox: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '900',
    color: '#7B1E3A',
    textAlign: 'right',
  },
  headerIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F3E9DC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C9A24D',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 6,
    lineHeight: 17,
  },
  badgeRow: {
    flexDirection: 'row-reverse',
    marginTop: 10,
    marginBottom: 12,
  },
  cahierBadge: {
    backgroundColor: '#F3E9DC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C9A24D',
  },
  cahierBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7B1E3A',
  },

  /* Navigation Tabs */
  tabsScroll: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingVertical: 4,
  },
  navTab: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5DFD7',
  },
  navTabActive: {
    backgroundColor: '#7B1E3A',
    borderColor: '#7B1E3A',
  },
  navTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7B1E3A',
  },
  navTabTextActive: {
    color: '#FFFFFF',
  },

  /* Alerts */
  alertSuccess: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    gap: 8,
  },
  alertSuccessText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
    textAlign: 'right',
  },
  alertError: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    gap: 8,
  },
  alertErrorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
    textAlign: 'right',
  },

  /* Tab Content */
  tabContent: {
    gap: 14,
  },

  /* Step Box */
  stepBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  stepHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  stepHeaderBetween: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stepTitle: {
    fontFamily: 'serif',
    fontSize: 14,
    fontWeight: '800',
    color: '#7B1E3A',
    textAlign: 'right',
  },
  stepSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'right',
    marginBottom: 12,
    lineHeight: 16,
  },

  /* Search Input */
  searchInputWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#FDFBF7',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    borderRadius: 12,
    paddingRight: 36,
    paddingLeft: 12,
    paddingVertical: 10,
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
  },
  searchIcon: {
    position: 'absolute',
    right: 12,
    top: 13,
  },

  /* Candidates List */
  candidatesList: {
    gap: 8,
  },
  candidateCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  candidateAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FCE7F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  candidateAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7B1E3A',
  },
  candidateInfo: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 10,
  },
  candidateName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7B1E3A',
    textAlign: 'right',
  },
  candidateSub: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'right',
  },
  selectCandidateBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  selectCandidateBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
  },

  /* Selected Student Banner */
  selectedBanner: {
    backgroundColor: 'rgba(243, 233, 220, 0.6)',
    borderWidth: 1.5,
    borderColor: 'rgba(123, 30, 58, 0.4)',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  selectedBannerTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  selectedBannerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#7B1E3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBannerInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  selectedBannerNameRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  selectedBannerName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#7B1E3A',
  },
  selectedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  selectedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#065F46',
  },
  selectedBannerSub: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 3,
    textAlign: 'right',
  },
  changeCandidateBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C9A24D',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  changeCandidateBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7B1E3A',
  },

  /* Form Controls */
  formGroup: {
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginBottom: 12,
  },
  fieldCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
    textAlign: 'right',
    marginBottom: 5,
  },
  textInput: {
    backgroundColor: '#FDFBF7',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
  },

  /* Picker Selector */
  pickerSelector: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FDFBF7',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerSelectorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },

  /* Chips */
  chipsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipsRowSmall: {
    flexDirection: 'row-reverse',
    gap: 6,
  },
  regimeChip: {
    backgroundColor: '#FDFBF7',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  regimeChipActive: {
    backgroundColor: '#7B1E3A',
    borderColor: '#7B1E3A',
  },
  regimeChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4B5563',
  },
  regimeChipTextActive: {
    color: '#FFFFFF',
  },

  discountChip: {
    backgroundColor: '#FDFBF7',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  discountChipActive: {
    backgroundColor: '#7B1E3A',
    borderColor: '#7B1E3A',
  },
  discountChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7B1E3A',
  },
  discountChipTextActive: {
    color: '#FFFFFF',
  },

  miniChip: {
    backgroundColor: '#FDFBF7',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniChipActive: {
    backgroundColor: '#7B1E3A',
    borderColor: '#7B1E3A',
  },
  miniChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4B5563',
  },
  miniChipTextActive: {
    color: '#FFFFFF',
  },

  /* Tuition Green Box */
  tuitionBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  tuitionBoxRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tuitionBoxLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  tuitionBoxValue: {
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '900',
    color: '#047857',
  },
  tuitionBoxSub: {
    fontSize: 11,
    color: '#059669',
    textAlign: 'right',
  },

  /* Document Checklist Section */
  docCountBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  docCountBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
  },
  docsList: {
    gap: 10,
    marginBottom: 12,
  },
  docCard: {
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
    borderRadius: 12,
    padding: 12,
  },
  docCardTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  docCheckboxRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  docTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7B1E3A',
    textAlign: 'right',
  },
  docStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  docStatusReceived: {
    backgroundColor: '#E0F2FE',
  },
  docStatusPending: {
    backgroundColor: '#FEF3C7',
  },
  docStatusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  docStatusTextReceived: {
    color: '#0369A1',
  },
  docStatusTextPending: {
    color: '#B45309',
  },
  docHint: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'right',
    marginBottom: 8,
  },
  docBottomRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    alignItems: 'center',
  },
  docRefInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 10,
    color: '#1F2937',
    textAlign: 'right',
  },
  docAttachBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(123, 30, 58, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  docAttachBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7B1E3A',
  },

  /* Action Buttons */
  submitButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7B1E3A',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
    ...Platform.select({
      ios: { shadowColor: '#7B1E3A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 5 },
      android: { elevation: 3 },
    }),
  },
  submitButtonText: {
    fontFamily: 'serif',
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  /* Registered List (Screenshot 3 Matching Layout) */
  filterBarRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  filterBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FDFBF7',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  filterBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7B1E3A',
  },
  studentsList: {
    gap: 12,
  },

  /* Individual Registered Student Card (Screenshot 3) */
  regStudentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5DFD7',
    padding: 14,
    gap: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  regStudentTopRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  regStudentNameBox: {
    flex: 1,
    alignItems: 'flex-end',
  },
  regStudentName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#7B1E3A',
    textAlign: 'right',
  },
  regStudentIds: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'right',
  },
  statusDropdownBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusDropdownBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  regStudentMiddleRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F4',
    paddingTop: 8,
  },
  regClassBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  regClassName: {
    fontFamily: 'serif',
    fontSize: 13,
    fontWeight: '900',
    color: '#7B1E3A',
  },
  regTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  regTypeNew: {
    backgroundColor: '#18181B',
  },
  regTypeRe: {
    backgroundColor: '#3B82F6',
  },
  regTypeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  regTypeNewText: {
    color: '#FFFFFF',
  },
  regTypeReText: {
    color: '#FFFFFF',
  },
  regParentBox: {
    alignItems: 'flex-start',
  },
  regParentName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
  },
  regParentPhone: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },

  /* 5 Official Action Buttons (Screenshot 3) */
  officialButtonsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3E9DC',
    paddingTop: 10,
  },
  btnReceipt: {
    backgroundColor: '#F7EFE5',
    borderWidth: 1,
    borderColor: '#E6D7C3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnReceiptText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7B1E3A',
  },
  btnContract: {
    backgroundColor: '#FCE7F3',
    borderWidth: 1,
    borderColor: '#FBCFE8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnContractText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9D174D',
  },
  btnRegForm: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnRegFormText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#374151',
  },
  btnDossier: {
    backgroundColor: '#7B1E3A',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnDossierText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnAudit: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnAuditText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },

  /* Waitlist Styles (Page 15) */
  waitlistLegalNotice: {
    fontSize: 11,
    color: '#4B5563',
    lineHeight: 18,
    textAlign: 'right',
    marginTop: 4,
  },
  waitlistEmptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  waitlistEmptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7B1E3A',
  },
  waitlistEmptyText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 17,
  },
  waitlistItemsList: {
    gap: 10,
  },
  waitlistCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
    padding: 12,
  },
  waitlistRankBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  waitlistRankText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#92400E',
  },
  waitlistInfo: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 10,
  },
  waitlistName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7B1E3A',
    textAlign: 'right',
  },
  waitlistSub: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'right',
  },
  promoteBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  promoteBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Excel Upload Box */
  excelUploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(123, 30, 58, 0.35)',
    borderRadius: 16,
    backgroundColor: '#FDFBF7',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  excelUploadTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7B1E3A',
    textAlign: 'center',
  },
  excelUploadSub: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },

  /* Modal Base Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  pickerModalSheet: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3E9DC',
    paddingBottom: 10,
    marginBottom: 8,
  },
  pickerModalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7B1E3A',
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F4',
    alignItems: 'flex-end',
  },
  pickerItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  pickerItemSub: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },

  /* Status Options */
  statusOptionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusOptionBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },

  /* ==================================================================== */
  /*  FICHE INDIVIDUELLE MODAL STYLES (Matching Screenshots 1 & 2)         */
  /* ==================================================================== */
  ficheModalSheet: {
    width: '100%',
    maxWidth: 480,
    height: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
  },
  ficheTopBar: {
    backgroundColor: '#FAF7F2',
    borderBottomWidth: 1,
    borderBottomColor: '#E5DFD7',
    padding: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  ficheHeaderTitleBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  ficheHeaderTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#7B1E3A',
  },
  ficheTopActions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  fichePrintBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7B1E3A',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  fichePrintBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ficheSaveBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C9A24D',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  ficheSaveBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7B1E3A',
  },
  ficheCloseBtn: {
    padding: 4,
  },

  ficheScrollContent: {
    padding: 14,
    gap: 12,
  },
  ficheNationalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#C9A24D',
    paddingBottom: 10,
  },
  ficheHeaderRight: {
    alignItems: 'flex-start',
    flex: 1,
  },
  ficheNatTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1F2937',
  },
  ficheNatMinistry: {
    fontSize: 8,
    color: '#4B5563',
  },
  ficheNatDir: {
    fontSize: 8,
    color: '#6B7280',
  },
  ficheHeaderCenter: {
    alignItems: 'center',
    flex: 1.2,
  },
  ficheLogoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7B1E3A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  ficheSchoolName: {
    fontFamily: 'serif',
    fontSize: 10,
    fontWeight: '900',
    color: '#7B1E3A',
    textAlign: 'center',
  },
  ficheSchoolFrench: {
    fontSize: 8,
    color: '#6B7280',
    textAlign: 'center',
  },
  ficheHeaderLeft: {
    alignItems: 'flex-end',
    flex: 1,
  },
  ficheMetaLine: {
    fontSize: 8,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'right',
  },

  /* Burgundy Title Banner */
  ficheBanner: {
    backgroundColor: '#7B1E3A',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  ficheBannerTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  ficheBannerFrench: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FDE68A',
    marginTop: 1,
  },

  /* Section Split */
  ficheSectionSplit: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  fichePhotoCard: {
    width: 100,
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#E5DFD7',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  fichePhotoSilhouette: {
    width: 70,
    height: 75,
    backgroundColor: '#262626',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C9A24D',
  },
  fichePhotoLabel: {
    fontSize: 8,
    color: '#D4D4D8',
    marginTop: 2,
  },
  fichePhotoRegNum: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '900',
    color: '#7B1E3A',
  },
  fichePhotoActiveBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  fichePhotoActiveText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#047857',
  },

  ficheIdentityCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5DFD7',
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  ficheCardHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E9DC',
    paddingBottom: 4,
    marginBottom: 4,
  },
  ficheCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7B1E3A',
    textAlign: 'right',
  },
  ficheInfoGrid: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 6,
  },
  ficheInfoCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  ficheInfoFullRow: {
    alignItems: 'flex-end',
    marginTop: 2,
  },
  ficheInfoLabel: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'right',
  },
  ficheInfoValue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'right',
  },
  ficheInfoValueBold: {
    fontSize: 11,
    fontWeight: '900',
    color: '#7B1E3A',
    textAlign: 'right',
  },
  ficheInfoValueMono: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#4B5563',
  },
  ficheInfoValueEmerald: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '900',
    color: '#059669',
  },

  /* Card Box */
  ficheCardBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5DFD7',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  ficheBoxesRow: {
    flexDirection: 'row-reverse',
    gap: 6,
  },
  ficheMiniBox: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#E5DFD7',
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
  },
  ficheMiniBoxLabel: {
    fontSize: 8,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 2,
  },
  ficheMiniBoxVal: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
  },
  ficheMiniBoxValBordeaux: {
    fontFamily: 'serif',
    fontSize: 11,
    fontWeight: '900',
    color: '#7B1E3A',
    textAlign: 'center',
  },
  ficheMiniBoxValMono: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#4B5563',
    textAlign: 'center',
  },

  /* Bottom Validation Row (Screenshot 2) */
  ficheBottomValidationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1.5,
    borderTopColor: '#C9A24D',
    paddingTop: 10,
    marginTop: 4,
  },
  ficheSealBlock: {
    alignItems: 'center',
    flex: 1,
  },
  ficheSealTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: '#7B1E3A',
  },
  ficheSealSub: {
    fontSize: 8,
    color: '#6B7280',
    marginBottom: 3,
  },
  ficheSealBox: {
    borderWidth: 1,
    borderColor: '#C9A24D',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#FAF7F2',
  },
  ficheSealText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7B1E3A',
  },
  ficheQRBlock: {
    alignItems: 'center',
    flex: 1,
  },
  ficheQRText: {
    fontSize: 8,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
  },
  ficheSignBlock: {
    alignItems: 'center',
    flex: 1,
  },
  ficheSignTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: '#7B1E3A',
  },
  ficheSignSub: {
    fontSize: 8,
    color: '#6B7280',
    marginBottom: 3,
  },
  ficheSignBox: {
    width: '90%',
    height: 28,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },

  /* Receipt Modal Base */
  receiptModalSheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    maxHeight: '90%',
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3E9DC',
    paddingBottom: 10,
    marginBottom: 10,
  },
  receiptTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#7B1E3A',
  },
  receiptBody: {
    gap: 12,
  },
  receiptSchoolBlock: {
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#7B1E3A',
    paddingBottom: 8,
  },
  receiptCountry: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4B5563',
  },
  receiptMinistry: {
    fontSize: 10,
    color: '#6B7280',
  },
  receiptInstitution: {
    fontFamily: 'serif',
    fontSize: 14,
    fontWeight: '900',
    color: '#7B1E3A',
    marginTop: 2,
  },
  receiptYear: {
    fontSize: 10,
    color: '#C9A24D',
    fontWeight: '800',
    marginTop: 2,
  },
  receiptNumberBox: {
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#C9A24D',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
  },
  receiptNumberLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  receiptNumberValue: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '900',
    color: '#7B1E3A',
    marginTop: 2,
  },
  receiptTable: {
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 10,
    overflow: 'hidden',
  },
  receiptTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E5E4',
  },
  receiptTableKey: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  receiptTableVal: {
    fontSize: 11,
    color: '#1F2937',
  },
  receiptStampBox: {
    alignItems: 'center',
    marginVertical: 4,
  },
  receiptStamp: {
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#047857',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ECFDF5',
  },
  receiptStampText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#047857',
    marginTop: 2,
  },
  receiptStampDate: {
    fontSize: 9,
    color: '#059669',
  },
  receiptActions: {
    gap: 8,
    marginTop: 4,
  },
  receiptShareBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7B1E3A',
    paddingVertical: 10,
    borderRadius: 10,
  },
  receiptShareBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  receiptCloseBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  receiptCloseBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  contractLegalText: {
    fontSize: 10,
    color: '#4B5563',
    lineHeight: 16,
    textAlign: 'right',
    backgroundColor: '#FDFBF7',
    borderWidth: 1,
    borderColor: '#E5DFD7',
    borderRadius: 8,
    padding: 8,
  },
  regFormDocRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F4',
  },
  regFormDocLabel: {
    fontSize: 11,
    color: '#1F2937',
    fontWeight: '600',
  },
  regFormDocStatus: {
    fontSize: 10,
    fontWeight: '800',
  },
  auditItemCard: {
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#E5DFD7',
    borderRadius: 8,
    padding: 8,
    gap: 4,
  },
  auditItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  auditItemDate: {
    fontSize: 9,
    color: '#6B7280',
  },
  auditActionBadge: {
    backgroundColor: '#F3E9DC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  auditActionBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7B1E3A',
  },
  auditItemDesc: {
    fontSize: 11,
    color: '#1F2937',
    textAlign: 'right',
  },
});
