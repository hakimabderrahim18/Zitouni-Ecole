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
  const [refreshing, setRefreshing] = useState(false);

  // Success & Error feedback
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modals
  const [receiptModalStudent, setReceiptModalStudent] = useState<any | null>(null);
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
    regime: 'نصف داخلي (مع وجبة الغداء بالكانتين)',
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
  /*  TAB 3: REGISTERED LIST FILTERS                                      */
  /* ==================================================================== */
  const [listSearch, setListSearch] = useState('');
  const [listClassFilter, setListClassFilter] = useState('ALL');
  const [listStatusFilter, setListStatusFilter] = useState('ALL');

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
      setRefreshing(false);
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
  /*  FILTERED STUDENTS FOR REGISTERED LIST                               */
  /* ==================================================================== */
  const filteredRegisteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (listClassFilter !== 'ALL') {
        const clsId = s.class?._id || s.class;
        if (String(clsId) !== String(listClassFilter)) return false;
      }
      if (listStatusFilter !== 'ALL') {
        const status = s.registrationStatus || (s.isWaitlisted ? 'waitlist' : 'accepted');
        if (status !== listStatusFilter) return false;
      }
      if (listSearch.trim()) {
        const q = listSearch.trim().toLowerCase();
        const name = `${s.firstNameArabic || s.user?.firstName || ''} ${s.lastNameArabic || s.user?.lastName || ''}`.toLowerCase();
        const reg = (s.registrationNumber || '').toLowerCase();
        const phone = (s.parent?.user?.phoneNumber || '').toLowerCase();
        return name.includes(q) || reg.includes(q) || phone.includes(q);
      }
      return true;
    });
  }, [students, listClassFilter, listStatusFilter, listSearch]);

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
                      onPress={() => setFormData((p) => ({ ...p, regime: r.label }))}
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
      {/* TAB 3: REGISTERED STUDENTS LIST (قوائم المسجلين)                 */}
      {/* ================================================================ */}
      {activeTab === 'list' && (
        <View style={styles.tabContent}>
          {/* Search & Filters */}
          <View style={styles.stepBox}>
            <View style={styles.searchInputWrapper}>
              <TextInput
                value={listSearch}
                onChangeText={setListSearch}
                placeholder="بحث بالاسم، رقم التسجيل، الهاتف..."
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
              />
              <Search size={16} color="#7B1E3A" style={styles.searchIcon} />
            </View>

            <View style={styles.filterBarRow}>
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

              <View style={styles.chipsRowSmall}>
                {['ALL', 'accepted', 'under_review'].map((st) => {
                  const label = st === 'ALL' ? 'الكل' : st === 'accepted' ? 'مقبول' : 'قيد المراجعة';
                  const isSel = listStatusFilter === st;
                  return (
                    <TouchableOpacity
                      key={st}
                      style={[styles.miniChip, isSel && styles.miniChipActive]}
                      onPress={() => setListStatusFilter(st)}
                    >
                      <Text style={[styles.miniChipText, isSel && styles.miniChipTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* List of registered students */}
          <View style={styles.studentsList}>
            {filteredRegisteredStudents.map((s) => {
              const fName = s.firstNameArabic || s.user?.firstName || '';
              const lName = s.lastNameArabic || s.user?.lastName || '';
              const fullName = `${lName} ${fName}`.trim() || 'تلميذ مسجل';
              const clsName = s.class?.name || 'غير محدد';
              const regNum = s.registrationNumber || 'REG-26-000';
              const recNum = s.receiptNumber || 'REC-2026-000';

              return (
                <View key={s._id} style={styles.studentCard}>
                  <View style={styles.studentCardHeader}>
                    <View style={styles.statusBadgeSmall}>
                      <Text style={styles.statusBadgeSmallText}>
                        {s.registrationStatus === 'accepted' ? 'مقبول ومكتمل ✓' : 'قيد المراجعة ⏳'}
                      </Text>
                    </View>
                    <View style={styles.studentCardTitleBox}>
                      <Text style={styles.studentCardName}>{fullName}</Text>
                      <Text style={styles.studentCardSub}>
                        وصل رقم: {recNum} • قسم: {clsName} • تسجيل: {regNum}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.studentCardActions}>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => setReceiptModalStudent(s)}
                    >
                      <Printer size={13} color="#7B1E3A" />
                      <Text style={styles.cardActionBtnText}>عرض الوصل</Text>
                    </TouchableOpacity>

                    {onSelectStudentDossier && (
                      <TouchableOpacity
                        style={[styles.cardActionBtn, styles.cardActionBtnSecondary]}
                        onPress={() => onSelectStudentDossier(s)}
                      >
                        <FileText size={13} color="#C9A24D" />
                        <Text style={[styles.cardActionBtnText, { color: '#7B1E3A' }]}>الملف الإداري</Text>
                      </TouchableOpacity>
                    )}
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
      {/* MODAL 1: CLASS PICKER MODAL                                      */}
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

      {/* ================================================================ */}
      {/* MODAL 2: OFFICIAL REGISTRATION RECEIPT (وصل التسجيل الرسمي)        */}
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

  /* Registered List */
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
    gap: 10,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.25)',
    padding: 12,
    gap: 10,
  },
  studentCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  studentCardTitleBox: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  studentCardName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7B1E3A',
    textAlign: 'right',
  },
  studentCardSub: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'right',
  },
  statusBadgeSmall: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeSmallText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#065F46',
  },
  studentCardActions: {
    flexDirection: 'row-reverse',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3E9DC',
    paddingTop: 8,
  },
  cardActionBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E9DC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cardActionBtnSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.4)',
  },
  cardActionBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7B1E3A',
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

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
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

  /* Receipt Modal */
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
});
