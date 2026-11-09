import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  useWindowDimensions,
  KeyboardAvoidingView,
} from 'react-native';
import {
  Plus,
  Upload,
  ShieldAlert,
  FileSpreadsheet,
  FileText,
  Search,
  Check,
  Lock,
  Trash2,
  Edit2,
  X,
  ChevronDown,
  Calendar,
  UserCheck,
  Phone,
  Mail,
  Briefcase,
  MapPin,
  Clock,
  Layers,
  GraduationCap,
  Users,
  Shield,
  User,
  Info,
  RefreshCw,
  Award,
  CreditCard,
  FileCheck2,
  CheckCircle2,
  Circle,
  FilePlus,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { theme } from '../../theme/tokens';
import { apiClient } from '../../api/client';

export interface AdminAccountsViewProps {
  systemUsers: any[];
  classesList: any[];
  groupsList: any[];
  modulesList: any[];
  studentsList: any[];
  teachersList: any[];
  onRefreshData: () => Promise<void>;
  onOpenTeacherDossier?: (teacher: any) => void;
  onOpenStudentDossier?: (student: any) => void;
}

const ROLE_OPTIONS = [
  { value: 'student', label: 'تلميذ (Student)', icon: GraduationCap },
  { value: 'teacher', label: 'أستاذ وموظف (المادة 23)', icon: Briefcase },
  { value: 'parent', label: 'ولي أمر (Parent)', icon: Users },
  { value: 'general_supervisor', label: 'مشرف عام (Superviseur Général)', icon: Shield },
  { value: 'pedagogical_supervisor', label: 'مشرف تربوي (Superviseur Pédagogique)', icon: ShieldAlert },
  { value: 'receptionist', label: 'موظف الاستقبال (Réceptionniste)', icon: Clock },
  { value: 'school', label: 'إدارة المدرسة (School)', icon: Layers },
  { value: 'admin', label: 'مدير النظام (Admin)', icon: UserCheck },
];

const TEACHER_JOB_TITLES = [
  'أستاذ التعليم الابتدائي (Professeur Ens. Primaire)',
  'أستاذ التعليم المتوسط (Professeur Ens. Moyen)',
  'أستاذ التعليم الثانوي (Professeur Ens. Secondaire)',
  'أستاذ رئيسي (Professeur Principal)',
  'أستاذ مكوّن (Professeur Formateur)',
  'منسق مادة (Coordinateur de matière)',
  'مساعد تربوي (Assistant pédagogique)',
];

const TEACHER_CYCLES = [
  { id: 'primary', label: 'التعليم الابتدائي' },
  { id: 'middle', label: 'التعليم المتوسط' },
  { id: 'secondary', label: 'التعليم الثانوي' },
  { id: 'all', label: 'جميع الأطوار' },
];

const CONTRACT_TYPES = [
  { id: 'CDI', label: 'عقد غير محدد المدة (CDI)' },
  { id: 'CDD', label: 'عقد محدد المدة (CDD)' },
  { id: 'مؤقت', label: 'مؤقت / استخلاف' },
  { id: 'تربص', label: 'فترة تربص / تجربة' },
];

const PROFESSIONAL_STATUSES = [
  { id: 'active', label: 'نشط (Actif)', color: '#059669', bg: 'rgba(16, 185, 129, 0.12)' },
  { id: 'suspended', label: 'موقوف (Suspendu)', color: '#D97706', bg: 'rgba(245, 158, 11, 0.12)' },
  { id: 'resigned', label: 'مستقيل (Démissionnaire)', color: '#DC2626', bg: 'rgba(239, 68, 68, 0.12)' },
  { id: 'terminated', label: 'منتهية (Terminé)', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.12)' },
];

export const AdminAccountsView: React.FC<AdminAccountsViewProps> = ({
  systemUsers,
  classesList,
  groupsList,
  modulesList,
  studentsList,
  teachersList,
  onRefreshData,
  onOpenTeacherDossier,
  onOpenStudentDossier,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 680;

  // Top navigation / segmented view within Accounts
  const [activeSegment, setActiveSegment] = useState<'all' | 'register' | 'accounts' | 'excel'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ==========================================
  // Form State: Create New Account
  // ==========================================
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstNameArabic, setFirstNameArabic] = useState('');
  const [lastNameArabic, setLastNameArabic] = useState('');
  const [role, setRole] = useState('student');
  const [isRolePickerOpen, setIsRolePickerOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ------------------------------------------
  // Article 23 Teacher Specific States (البنود الـ 15)
  // ------------------------------------------
  const [teacherJobTitle, setTeacherJobTitle] = useState('أستاذ التعليم الابتدائي (Professeur Ens. Primaire)');
  const [isJobTitlePickerOpen, setIsJobTitlePickerOpen] = useState(false);
  const [teacherProfessionalStatus, setTeacherProfessionalStatus] = useState('active');
  const [teacherSpecialization, setTeacherSpecialization] = useState('رياضيات');
  const [teacherCycle, setTeacherCycle] = useState('primary');
  const [teacherAssignedHours, setTeacherAssignedHours] = useState('18');
  const [teacherAssignedTasks, setTeacherAssignedTasks] = useState('تدريس، تنسيق بيداغوجي، متابعة الفروض والامتحانات');
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>(['رياضيات']);
  const [teacherClasses, setTeacherClasses] = useState<string[]>([]);
  const [teacherGroups, setTeacherGroups] = useState<string[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<Array<{ module: string; room: string }>>([
    { module: 'رياضيات', room: 'قاعة 101' },
  ]);

  // Contractual & Financial Data (البنود 6، 7، 8، 9، 10)
  const [teacherHiringDate, setTeacherHiringDate] = useState('2026-09-01');
  const [teacherContractType, setTeacherContractType] = useState('CDI');
  const [teacherContractDuration, setTeacherContractDuration] = useState('1 سنة');
  const [teacherContractStartDate, setTeacherContractStartDate] = useState('2026-09-01');
  const [teacherContractEndDate, setTeacherContractEndDate] = useState('');
  const [teacherBaseSalary, setTeacherBaseSalary] = useState('64000');

  // Checklist of 7 legal documents (البند 13 للمادة 23)
  const [teacherChecklist, setTeacherChecklist] = useState({
    cv: false,
    diploma: true,
    medicalCertificate: false,
    idPhotos: true,
    criminalRecord: false,
    workContract: false,
    experienceCert: false,
  });

  // ------------------------------------------
  // Student Specific States
  // ------------------------------------------
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [isClassPickerOpen, setIsClassPickerOpen] = useState(false);
  const [isGroupPickerOpen, setIsGroupPickerOpen] = useState(false);
  const [isParentPickerOpen, setIsParentPickerOpen] = useState(false);
  const [parentModalSearch, setParentModalSearch] = useState('');

  // ------------------------------------------
  // Parent Specific States
  // ------------------------------------------
  const [parentProfession, setParentProfession] = useState('');
  const [parentAddress, setParentAddress] = useState('');
  const [parentChildren, setParentChildren] = useState<string[]>([]);
  const [studentLinkSearch, setStudentLinkSearch] = useState('');

  // ------------------------------------------
  // Supervisor Specific States
  // ------------------------------------------
  const [officeLocation, setOfficeLocation] = useState('Bureau principal - الطابق الأول');

  // ------------------------------------------
  // Receptionist Specific States
  // ------------------------------------------
  const [deskNumber, setDeskNumber] = useState('Accueil Principal');
  const [workShift, setWorkShift] = useState('07:30 - 16:30');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  // Excel Import State
  // ==========================================
  const [excelFile, setExcelFile] = useState<any>(null);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [excelImportType, setExcelImportType] = useState<'general' | 'teachers'>('general');
  const [showExcelGuide, setShowExcelGuide] = useState(false);

  // ==========================================
  // System Accounts List & Filters
  // ==========================================
  const [accountSearch, setAccountSearch] = useState('');
  const [accountRoleFilter, setAccountRoleFilter] = useState('all');
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // ==========================================
  // Edit User Modal State
  // ==========================================
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editFirstNameArabic, setEditFirstNameArabic] = useState('');
  const [editLastNameArabic, setEditLastNameArabic] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editBaseSalary, setEditBaseSalary] = useState('');
  const [editContractType, setEditContractType] = useState('CDI');
  const [editProfessionalStatus, setEditProfessionalStatus] = useState('active');
  const [editOfficeLocation, setEditOfficeLocation] = useState('');
  const [editDeskNumber, setEditDeskNumber] = useState('');
  const [editWorkShift, setEditWorkShift] = useState('');
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  // Parents List derived from systemUsers
  const parentsList = useMemo(() => {
    return systemUsers.filter((u) => u.role === 'parent');
  }, [systemUsers]);

  // Filtered groups for selected student class
  const availableGroups = useMemo(() => {
    if (!selectedClassId) return groupsList;
    return groupsList.filter((g) => {
      const cId = g.class?._id || g.class;
      return cId === selectedClassId;
    });
  }, [groupsList, selectedClassId]);

  // Filtered accounts list
  const filteredUsers = useMemo(() => {
    return systemUsers.filter((u) => {
      if (accountRoleFilter !== 'all' && u.role !== accountRoleFilter) return false;
      if (!accountSearch.trim()) return true;
      const q = accountSearch.toLowerCase().trim();
      const fullName = `${u.firstName || ''} ${u.lastName || ''} ${u.firstNameArabic || ''} ${u.lastNameArabic || ''}`.toLowerCase();
      const emailMatch = (u.email || '').toLowerCase().includes(q);
      const phoneMatch = (u.phoneNumber || '').toLowerCase().includes(q);
      const roleMatch = (u.role || '').toLowerCase().includes(q);
      return fullName.includes(q) || emailMatch || phoneMatch || roleMatch;
    });
  }, [systemUsers, accountRoleFilter, accountSearch]);

  // Count deposited documents in teacher checklist
  const depositedChecklistCount = useMemo(() => {
    return Object.values(teacherChecklist).filter(Boolean).length;
  }, [teacherChecklist]);

  // Helper: Role Labels & Colors
  const getRoleBadgeConfig = (r: string) => {
    switch (r) {
      case 'student':
        return { label: 'تلميذ', bg: 'rgba(59, 130, 246, 0.12)', text: '#1D4ED8', border: 'rgba(59, 130, 246, 0.25)' };
      case 'teacher':
        return { label: 'أستاذ (المادة 23)', bg: 'rgba(16, 185, 129, 0.12)', text: '#047857', border: 'rgba(16, 185, 129, 0.25)' };
      case 'parent':
        return { label: 'ولي أمر', bg: 'rgba(139, 92, 246, 0.12)', text: '#6D28D9', border: 'rgba(139, 92, 246, 0.25)' };
      case 'general_supervisor':
        return { label: 'مشرف عام', bg: 'rgba(245, 158, 11, 0.12)', text: '#B45309', border: 'rgba(245, 158, 11, 0.25)' };
      case 'pedagogical_supervisor':
        return { label: 'مشرف تربوي', bg: 'rgba(249, 115, 22, 0.12)', text: '#C2410C', border: 'rgba(249, 115, 22, 0.25)' };
      case 'receptionist':
        return { label: 'استقبال', bg: 'rgba(6, 182, 212, 0.12)', text: '#0E7490', border: 'rgba(6, 182, 212, 0.25)' };
      case 'school':
        return { label: 'إدارة المدرسة', bg: 'rgba(123, 30, 58, 0.12)', text: '#7B1E3A', border: 'rgba(123, 30, 58, 0.25)' };
      case 'admin':
        return { label: 'مدير المنصة', bg: 'rgba(123, 30, 58, 0.18)', text: '#7B1E3A', border: 'rgba(123, 30, 58, 0.4)' };
      default:
        return { label: r, bg: 'rgba(118, 96, 101, 0.12)', text: '#766065', border: 'rgba(118, 96, 101, 0.25)' };
    }
  };

  // Handler: Manual Refresh
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handler: Pick Excel File
  const handlePickExcel = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          '*/*',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setExcelFile(result.assets[0]);
      }
    } catch (err: any) {
      Alert.alert('خطأ', 'تعذر فتح مستعرض الملفات.');
    }
  };

  // Handler: Upload Excel
  const handleUploadExcel = async () => {
    if (!excelFile) {
      Alert.alert('تنبيه', 'يرجى تحديد ملف Excel أولاً.');
      return;
    }

    setIsImportingExcel(true);
    try {
      const formData = new FormData();
      const fileObj = {
        uri: excelFile.uri,
        name: excelFile.name || 'import.xlsx',
        type: excelFile.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      } as any;
      formData.append('file', fileObj);

      const endpoint =
        excelImportType === 'teachers'
          ? '/api/admin/users/bulk-import/teachers'
          : '/api/admin/users/bulk-import';

      const res = await apiClient.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('نجاح', res.data.message || 'تم استيراد الملف بنجاح!');
      setExcelFile(null);
      await onRefreshData();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل استيراد ملف Excel.');
    } finally {
      setIsImportingExcel(false);
    }
  };

  // Handler: Create User
  const handleCreateUser = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال الاسم الأول واللقب.');
      return;
    }

    const cleanPhone = phoneNumber.trim().replace(/[\s\-_().]/g, '');
    if (role !== 'student' && !cleanPhone) {
      Alert.alert('تنبيه', 'رقم الهاتف إلزامي لمعظم الحسابات لتسجيل الدخول.');
      return;
    }

    if (role === 'student' && !dateOfBirth.trim()) {
      Alert.alert('تنبيه', 'تاريخ الميلاد إلزامي لحساب التلميذ ككلمة مرور رسمية.');
      return;
    }

    setIsSubmitting(true);
    try {
      const details: any = {};

      if (role === 'student') {
        details.registrationNumber = `REG-${Date.now().toString().slice(-6)}`;
        details.classId = selectedClassId;
        details.groupId = selectedGroupId;
        details.parentId = selectedParentId;
        details.dateOfBirth = dateOfBirth;
      } else if (role === 'teacher') {
        // Full Article 23 Legal Dataset (البنود الـ 15)
        details.firstNameArabic = firstNameArabic.trim() || firstName.trim();
        details.lastNameArabic = lastNameArabic.trim() || lastName.trim();
        details.jobTitle = teacherJobTitle;
        details.specialization = teacherSpecialization.trim() || teacherSubjects[0] || 'تعليم عام';
        details.cycle = teacherCycle;
        details.assignedHours = Number(teacherAssignedHours) || 18;
        details.assignedTasks = teacherAssignedTasks;
        details.professionalStatus = teacherProfessionalStatus;
        details.hiringDate = teacherHiringDate || null;
        details.contractType = teacherContractType;
        details.contractDuration = teacherContractDuration;
        details.contractStartDate = teacherContractStartDate || null;
        details.contractEndDate = teacherContractEndDate || null;
        details.baseSalary = Number(teacherBaseSalary) || 0;
        details.subjects = teacherSubjects;
        details.classes = teacherClasses;
        details.groups = teacherGroups;
        details.assignments = teacherAssignments.filter((a) => a.module);
        details.checklist = teacherChecklist;
      } else if (role === 'parent') {
        details.profession = parentProfession;
        details.address = parentAddress;
        details.children = parentChildren;
      } else if (role === 'general_supervisor' || role === 'pedagogical_supervisor') {
        details.officeLocation = officeLocation;
      } else if (role === 'receptionist') {
        details.deskNumber = deskNumber;
        details.workShift = workShift;
      }

      const username = cleanPhone || (email ? email.split('@')[0] : `user_${Date.now()}`);
      const finalEmail = email.includes('@')
        ? email.trim()
        : `${cleanPhone || username}@ecole-zitouni.dz`;

      let finalPassword = password;
      if (
        role === 'parent' ||
        role === 'general_supervisor' ||
        role === 'pedagogical_supervisor' ||
        role === 'receptionist'
      ) {
        finalPassword = password || cleanPhone;
      } else if (role === 'student') {
        finalPassword = dateOfBirth;
      }

      await apiClient.post('/api/admin/users', {
        username,
        email: finalEmail,
        password: finalPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
        phoneNumber: cleanPhone,
        details,
      });

      Alert.alert(
        'تم بنجاح',
        `تم إنشاء الحساب بنجاح!\nاسم الدخول (Login): ${cleanPhone || username}\nكلمة المرور: ${
          role === 'student' ? dateOfBirth : cleanPhone || 'تلقائية'
        }${role === 'teacher' ? '\nتم توثيق الملف المهني (المادة 23) بنجاح.' : ''}`
      );

      // Reset form
      setFirstName('');
      setLastName('');
      setFirstNameArabic('');
      setLastNameArabic('');
      setPhoneNumber('');
      setEmail('');
      setPassword('');
      setDateOfBirth('');
      setSelectedClassId('');
      setSelectedGroupId('');
      setSelectedParentId('');
      setParentProfession('');
      setParentAddress('');
      setParentChildren([]);

      await onRefreshData();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل إنشاء الحساب.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Toggle Account Status
  const handleToggleStatus = async (user: any) => {
    setTogglingUserId(user._id);
    try {
      const res = await apiClient.put(`/api/admin/users/${user._id}/toggle`);
      const newStatus = res.data?.isActive ?? !user.isActive;
      Alert.alert('نجاح', newStatus ? 'تم تنشيط الحساب بنجاح' : 'تم تعطيل الحساب بنجاح');
      await onRefreshData();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل تحديث حالة الحساب.');
    } finally {
      setTogglingUserId(null);
    }
  };

  // Handler: Delete Account
  const handleDeleteUser = (user: any) => {
    const confirmDelete = async () => {
      setDeletingUserId(user._id);
      try {
        await apiClient.delete(`/api/admin/users/${user._id}`);
        Alert.alert('نجاح', 'تم حذف الحساب نهائياً.');
        await onRefreshData();
      } catch (err: any) {
        Alert.alert('خطأ', err.response?.data?.message || 'فشل حذف الحساب.');
      } finally {
        setDeletingUserId(null);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`هل أنت متأكد من رغبتك في حذف حساب "${user.firstName} ${user.lastName}" نهائياً؟`)) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'حذف الحساب',
        `هل أنت متأكد من رغبتك في حذف حساب "${user.firstName} ${user.lastName}"؟ لا يمكن التراجع عن هذا الإجراء.`,
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'حذف', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  // Handler: Open Edit Modal
  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setEditFirstName(user.firstName || '');
    setEditLastName(user.lastName || '');
    setEditFirstNameArabic(user.firstNameArabic || '');
    setEditLastNameArabic(user.lastNameArabic || '');
    setEditEmail(user.email || '');
    setEditPhoneNumber(user.phoneNumber || '');
    setEditJobTitle(user.jobTitle || 'أستاذ');
    setEditBaseSalary(String(user.baseSalary || 64000));
    setEditContractType(user.contractType || 'CDI');
    setEditProfessionalStatus(user.professionalStatus || (user.isActive ? 'active' : 'suspended'));
    setEditOfficeLocation(user.details?.officeLocation || 'Bureau principal');
    setEditDeskNumber(user.details?.deskNumber || 'Accueil Principal');
    setEditWorkShift(user.details?.workShift || '07:30 - 16:30');
  };

  // Handler: Submit Edit
  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setIsUpdatingUser(true);
    try {
      const payload: any = {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        email: editEmail.trim(),
        phoneNumber: editPhoneNumber.trim().replace(/[\s\-_().]/g, ''),
        details: {},
      };

      if (editingUser.role === 'teacher') {
        payload.details = {
          firstNameArabic: editFirstNameArabic,
          lastNameArabic: editLastNameArabic,
          jobTitle: editJobTitle,
          baseSalary: Number(editBaseSalary) || 0,
          contractType: editContractType,
          professionalStatus: editProfessionalStatus,
        };
      } else if (['general_supervisor', 'pedagogical_supervisor'].includes(editingUser.role)) {
        payload.details.officeLocation = editOfficeLocation;
      } else if (editingUser.role === 'receptionist') {
        payload.details.deskNumber = editDeskNumber;
        payload.details.workShift = editWorkShift;
      }

      await apiClient.put(`/api/admin/users/${editingUser._id}`, payload);
      Alert.alert('نجاح', 'تم تحديث بيانات الحساب بنجاح.');
      setEditingUser(null);
      await onRefreshData();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل تحديث الحساب.');
    } finally {
      setIsUpdatingUser(false);
    }
  };

  // Responsive layout class for form rows
  const rowStyle = isMobile ? styles.formColStack : styles.formRow;

  return (
    <View style={styles.container}>
      {/* ========================================================================= */}
      {/* Top Segment Controller & Quick Stats                                      */}
      {/* ========================================================================= */}
      <View style={styles.segmentContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segmentScroll}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeSegment === 'all' && styles.segmentBtnActive]}
            onPress={() => setActiveSegment('all')}
            activeOpacity={0.8}
          >
            <Layers size={14} color={activeSegment === 'all' ? '#FFF' : theme.colors.brand[500]} />
            <Text style={[styles.segmentBtnText, activeSegment === 'all' && styles.segmentBtnTextActive]}>
              الكل
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeSegment === 'register' && styles.segmentBtnActive]}
            onPress={() => setActiveSegment('register')}
            activeOpacity={0.8}
          >
            <Plus size={14} color={activeSegment === 'register' ? '#FFF' : theme.colors.brand[500]} />
            <Text style={[styles.segmentBtnText, activeSegment === 'register' && styles.segmentBtnTextActive]}>
              + إنشاء حساب
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeSegment === 'accounts' && styles.segmentBtnActive]}
            onPress={() => setActiveSegment('accounts')}
            activeOpacity={0.8}
          >
            <ShieldAlert size={14} color={activeSegment === 'accounts' ? '#FFF' : theme.colors.brand[500]} />
            <Text style={[styles.segmentBtnText, activeSegment === 'accounts' && styles.segmentBtnTextActive]}>
              تعديل الحسابات ({systemUsers.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeSegment === 'excel' && styles.segmentBtnActive]}
            onPress={() => setActiveSegment('excel')}
            activeOpacity={0.8}
          >
            <Upload size={14} color={activeSegment === 'excel' ? '#FFF' : theme.colors.brand[500]} />
            <Text style={[styles.segmentBtnText, activeSegment === 'excel' && styles.segmentBtnTextActive]}>
              استيراد Excel
            </Text>
          </TouchableOpacity>

          {/* Refresh Button */}
          <TouchableOpacity
            style={styles.refreshIconBtn}
            onPress={handleManualRefresh}
            disabled={isRefreshing}
            activeOpacity={0.7}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={theme.colors.brand[500]} />
            ) : (
              <RefreshCw size={15} color={theme.colors.brand[500]} />
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ========================================================================= */}
        {/* CARD 1: + إنشاء حساب جديد (CONTAINING ARTICLE 23 DOSSIER DATA FOR TEACHER) */}
        {/* ========================================================================= */}
        {(activeSegment === 'all' || activeSegment === 'register') && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Plus size={20} color={theme.colors.brand[500]} />
              <Text style={styles.cardTitle}>إنشاء حساب جديد</Text>
            </View>

            {/* Row 1: First Name & Last Name (Fr / En) */}
            <View style={rowStyle}>
              <View style={styles.formCol}>
                <Text style={styles.fieldLabel}>الاسم الأول (بالحروف اللاتينية)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="مثال: Mohamed"
                  placeholderTextColor={theme.colors.text.subtle}
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={styles.formCol}>
                <Text style={styles.fieldLabel}>اللقب (بالحروف اللاتينية)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="مثال: Zitouni"
                  placeholderTextColor={theme.colors.text.subtle}
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            {/* If Teacher: Row for Arabic Names */}
            {role === 'teacher' && (
              <View style={rowStyle}>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>الاسم الأول (باللغة العربية) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="مثال: محمد"
                    placeholderTextColor={theme.colors.text.subtle}
                    value={firstNameArabic}
                    onChangeText={setFirstNameArabic}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>اللقب (باللغة العربية) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="مثال: زيتوني"
                    placeholderTextColor={theme.colors.text.subtle}
                    value={lastNameArabic}
                    onChangeText={setLastNameArabic}
                  />
                </View>
              </View>
            )}

            {/* Row 2: Account Type & Phone Login */}
            <View style={rowStyle}>
              <View style={styles.formCol}>
                <Text style={styles.fieldLabel}>نوع الحساب *</Text>
                <TouchableOpacity
                  style={styles.pickerSelector}
                  onPress={() => setIsRolePickerOpen(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.pickerSelectorText}>
                    {ROLE_OPTIONS.find((r) => r.value === role)?.label || role}
                  </Text>
                  <ChevronDown size={16} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.formCol}>
                <View style={styles.labelWithBadgeRow}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.brand[500], fontWeight: 'bold' }]}>
                    رقم الهاتف (معرف الدخول الرسمي / Login) *
                  </Text>
                  <View style={styles.greenBadge}>
                    <Text style={styles.greenBadgeText}>أرقام نقية فقط (Login)</Text>
                  </View>
                </View>
                <View style={styles.inputWithIcon}>
                  <Phone size={16} color={theme.colors.brand[500]} />
                  <TextInput
                    style={[styles.inputInsideIcon, styles.phoneInput]}
                    placeholder="0797060052 : مـثـال"
                    placeholderTextColor={theme.colors.text.subtle}
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                  />
                </View>
                <Text style={styles.helperText}>
                  يُعتمد مباشرة كمعرف رسمي لتسجيل الدخول (أرقام مثل 0797060052 دون @ أو com.).
                </Text>
              </View>
            </View>

            {/* Row 3: Email (Optional) */}
            <View style={styles.formGroup}>
              <View style={styles.labelWithBadgeRow}>
                <Text style={styles.fieldLabel}>البريد الإلكتروني (اختياري)</Text>
                <Text style={styles.optionalHint}>يُنشأ تلقائياً برقم الهاتف إن تُرك فارغاً</Text>
              </View>
              <View style={styles.inputWithIcon}>
                <Mail size={16} color={theme.colors.text.muted} />
                <TextInput
                  style={styles.inputInsideIcon}
                  placeholder="اختياري (يمكن تركه فارغاً)"
                  placeholderTextColor={theme.colors.text.subtle}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Password Section */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>كلمة المرور</Text>
              {role === 'teacher' || role === 'admin' || role === 'school' ? (
                <View style={styles.inputWithIcon}>
                  <Lock size={16} color={theme.colors.text.muted} />
                  <TextInput
                    style={styles.inputInsideIcon}
                    placeholder="كلمة المرور (أو تُحدد تلقائياً كرقم الهاتف)"
                    placeholderTextColor={theme.colors.text.subtle}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
              ) : role === 'student' ? (
                <View style={styles.passwordNoticeBox}>
                  <View style={styles.passwordNoticeHeader}>
                    <Lock size={14} color={theme.colors.brand[500]} />
                    <Text style={styles.passwordNoticeTitle}>
                      كلمة المرور تُحدّد تلقائياً = تاريخ ميلاد التلميذ
                    </Text>
                  </View>
                  <Text style={styles.passwordNoticeValue}>
                    {dateOfBirth ? dateOfBirth : '— أدخل تاريخ الميلاد —'}
                  </Text>
                </View>
              ) : (
                <View style={styles.passwordNoticeBox}>
                  <View style={styles.passwordNoticeHeader}>
                    <Lock size={14} color={theme.colors.brand[500]} />
                    <Text style={styles.passwordNoticeTitle}>
                      كلمة المرور تُحدَّد تلقائياً = رقم الهاتف نفسه
                    </Text>
                  </View>
                  <Text style={styles.passwordNoticeValue}>
                    {phoneNumber ? phoneNumber : '— أدخل رقم الهاتف أعلاه —'}
                  </Text>
                </View>
              )}
            </View>

            {/* ========================================================================= */}
            {/* DYNAMIC ROLE SUB-SECTION: TEACHER & STAFF ARTICLE 23 (ALL 15 LEGAL ITEMS) */}
            {/* ========================================================================= */}
            {role === 'teacher' && (
              <View style={styles.article23Container}>
                {/* Official Article 23 Banner Header */}
                <View style={styles.officialDossierBanner}>
                  <View style={styles.bannerIconCluster}>
                    <Award size={20} color={theme.colors.gold[500]} />
                    <Text style={styles.bannerMainTitle}>
                      الملف المهني الإلكتروني للأستاذ والموظف (المادة 23)
                    </Text>
                  </View>
                  <Text style={styles.bannerSubTitle}>
                    العناصر القانونية الـ 15 | الربط الآلي بالأقسام والأفواج | سرية البيانات
                  </Text>
                </View>

                {/* 1. الوضعية الحالية (البند 14) */}
                <View style={styles.subCard}>
                  <View style={styles.subCardHeader}>
                    <Shield size={16} color={theme.colors.brand[500]} />
                    <Text style={styles.subCardTitle}>الوضعية الحالية للأستاذ (البند 14)</Text>
                    <View style={styles.statusBadgePill}>
                      <Text style={styles.statusBadgePillText}>
                        {PROFESSIONAL_STATUSES.find((s) => s.id === teacherProfessionalStatus)?.label}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.chipGrid}>
                    {PROFESSIONAL_STATUSES.map((st) => {
                      const isSel = teacherProfessionalStatus === st.id;
                      return (
                        <TouchableOpacity
                          key={st.id}
                          style={[
                            styles.statusSelectChip,
                            isSel && { backgroundColor: st.color, borderColor: st.color },
                          ]}
                          onPress={() => setTeacherProfessionalStatus(st.id)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.statusSelectChipText, isSel && { color: '#FFF' }]}>
                            {st.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 2. الوظيفة المسندة (البند 2) */}
                <View style={styles.subCard}>
                  <View style={styles.subCardHeader}>
                    <Briefcase size={16} color={theme.colors.brand[500]} />
                    <Text style={styles.subCardTitle}>2. الوظيفة والصفة البيداغوجية المسندة (البند 2)</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.pickerSelector}
                    onPress={() => setIsJobTitlePickerOpen(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.pickerSelectorText}>{teacherJobTitle}</Text>
                    <ChevronDown size={16} color={theme.colors.text.secondary} />
                  </TouchableOpacity>
                </View>

                {/* 3. التخصص والطور والساعات والمهام (البند 3 والبند 11) */}
                <View style={styles.subCard}>
                  <View style={styles.subCardHeader}>
                    <GraduationCap size={16} color={theme.colors.brand[500]} />
                    <Text style={styles.subCardTitle}>3. التخصص والطور والساعات المسندة | 11. المهام</Text>
                    <View style={styles.greenBadge}>
                      <Text style={styles.greenBadgeText}>ربط آلي معتمد</Text>
                    </View>
                  </View>

                  <View style={rowStyle}>
                    <View style={styles.formCol}>
                      <Text style={styles.fieldLabel}>التخصص / المادة</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="مثال: رياضيات، لغة عربية، فيزياء"
                        placeholderTextColor={theme.colors.text.subtle}
                        value={teacherSpecialization}
                        onChangeText={setTeacherSpecialization}
                      />
                    </View>

                    <View style={styles.formCol}>
                      <Text style={styles.fieldLabel}>11. الساعات المسندة أسبوعياً</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="مثال: 18"
                        keyboardType="numeric"
                        placeholderTextColor={theme.colors.text.subtle}
                        value={teacherAssignedHours}
                        onChangeText={setTeacherAssignedHours}
                      />
                    </View>
                  </View>

                  {/* الطور المعتمد */}
                  <View style={styles.formGroup}>
                    <Text style={styles.fieldLabel}>الطور المعتمد</Text>
                    <View style={styles.chipGrid}>
                      {TEACHER_CYCLES.map((cyc) => {
                        const isSel = teacherCycle === cyc.id;
                        return (
                          <TouchableOpacity
                            key={cyc.id}
                            style={[styles.chipItem, isSel && styles.chipItemSelected]}
                            onPress={() => setTeacherCycle(cyc.id)}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.chipText, isSel && styles.chipTextSelected]}>
                              {cyc.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* المهام البيداغوجية */}
                  <View style={styles.formGroup}>
                    <Text style={styles.fieldLabel}>المهام البيداغوجية</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="تدريس، تنسيق بيداغوجي، متابعة الفروض والامتحانات"
                      placeholderTextColor={theme.colors.text.subtle}
                      value={teacherAssignedTasks}
                      onChangeText={setTeacherAssignedTasks}
                    />
                  </View>

                  {/* Modules Checklist */}
                  <View style={styles.formGroup}>
                    <Text style={styles.fieldLabel}>المواد المدرَّسة (المعتمدة)</Text>
                    <View style={styles.chipGrid}>
                      {modulesList.map((m) => {
                        const isSelected = teacherSubjects.includes(m.name);
                        return (
                          <TouchableOpacity
                            key={m._id}
                            style={[styles.chipItem, isSelected && styles.chipItemSelected]}
                            onPress={() => {
                              if (isSelected) {
                                setTeacherSubjects((prev) => prev.filter((s) => s !== m.name));
                              } else {
                                setTeacherSubjects((prev) => [...prev, m.name]);
                              }
                            }}
                          >
                            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                              {m.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Classes & Groups */}
                  <View style={rowStyle}>
                    <View style={styles.formCol}>
                      <View style={styles.labelWithBadgeRow}>
                        <Text style={styles.fieldLabel}>الأقسام المسندة (كلاسته - ربط تلقائي)</Text>
                        <View style={styles.miniBadge}>
                          <Text style={styles.miniBadgeText}>{teacherClasses.length} قسم</Text>
                        </View>
                      </View>
                      <View style={styles.chipGrid}>
                        {classesList.map((c) => {
                          const isSelected = teacherClasses.includes(c._id);
                          return (
                            <TouchableOpacity
                              key={c._id}
                              style={[styles.chipItem, isSelected && styles.chipItemSelected]}
                              onPress={() => {
                                if (isSelected) {
                                  setTeacherClasses((prev) => prev.filter((cid) => cid !== c._id));
                                } else {
                                  setTeacherClasses((prev) => [...prev, c._id]);
                                }
                              }}
                            >
                              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                                {c.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    <View style={styles.formCol}>
                      <View style={styles.labelWithBadgeRow}>
                        <Text style={styles.fieldLabel}>الأفواج المسندة (أفواجه - ربط تلقائي)</Text>
                        <View style={styles.miniBadge}>
                          <Text style={styles.miniBadgeText}>{teacherGroups.length} فوج</Text>
                        </View>
                      </View>
                      <View style={styles.chipGrid}>
                        {groupsList
                          .filter((g) => teacherClasses.includes(g.class?._id || g.class))
                          .map((g) => {
                            const isSelected = teacherGroups.includes(g._id);
                            return (
                              <TouchableOpacity
                                key={g._id}
                                style={[styles.chipItem, isSelected && styles.chipItemSelected]}
                                onPress={() => {
                                  if (isSelected) {
                                    setTeacherGroups((prev) => prev.filter((gid) => gid !== g._id));
                                  } else {
                                    setTeacherGroups((prev) => [...prev, g._id]);
                                  }
                                }}
                              >
                                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                                  {g.name}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        {teacherClasses.length === 0 && (
                          <Text style={styles.emptyNote}>اختر قسماً أولاً لعرض أفواجه.</Text>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Module and Room Assignments */}
                  <View style={styles.formGroup}>
                    <View style={styles.labelWithBadgeRow}>
                      <Text style={styles.fieldLabel}>إسناد المادة والقاعة (Salle)</Text>
                      <TouchableOpacity
                        style={styles.miniAddBtn}
                        onPress={() =>
                          setTeacherAssignments((prev) => [...prev, { module: '', room: '' }])
                        }
                      >
                        <Text style={styles.miniAddBtnText}>+ إضافة</Text>
                      </TouchableOpacity>
                    </View>
                    {teacherAssignments.map((a, idx) => (
                      <View key={idx} style={styles.assignmentRow}>
                        <TextInput
                          style={[styles.textInput, { flex: 2 }]}
                          placeholder="المادة"
                          placeholderTextColor={theme.colors.text.subtle}
                          value={a.module}
                          onChangeText={(t) => {
                            const copy = [...teacherAssignments];
                            copy[idx].module = t;
                            setTeacherAssignments(copy);
                          }}
                        />
                        <TextInput
                          style={[styles.textInput, { flex: 1 }]}
                          placeholder="القاعة"
                          placeholderTextColor={theme.colors.text.subtle}
                          value={a.room}
                          onChangeText={(t) => {
                            const copy = [...teacherAssignments];
                            copy[idx].room = t;
                            setTeacherAssignments(copy);
                          }}
                        />
                        <TouchableOpacity
                          style={styles.assignmentRemoveBtn}
                          onPress={() =>
                            setTeacherAssignments((prev) => prev.filter((_, i) => i !== idx))
                          }
                        >
                          <X size={16} color="#BE123C" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>

                {/* 4. البيانات التعاقدية والمالية (البنود 6، 7، 8، 9، 10 - مقيدة بالصلاحيات) */}
                <View style={styles.subCard}>
                  <View style={styles.subCardHeader}>
                    <CreditCard size={16} color={theme.colors.brand[500]} />
                    <Text style={styles.subCardTitle}>
                      البيانات التعاقدية والمالية (البنود 6، 7، 8، 9، 10)
                    </Text>
                    <View style={styles.confidentialBadge}>
                      <Lock size={12} color="#B45309" />
                      <Text style={styles.confidentialBadgeText}>سرية إدارية</Text>
                    </View>
                  </View>

                  <View style={rowStyle}>
                    <View style={styles.formCol}>
                      <Text style={styles.fieldLabel}>6. تاريخ التوظيف</Text>
                      <View style={styles.inputWithIcon}>
                        <Calendar size={16} color={theme.colors.text.muted} />
                        <TextInput
                          style={styles.inputInsideIcon}
                          placeholder="YYYY-MM-DD (مثال: 2026-09-01)"
                          placeholderTextColor={theme.colors.text.subtle}
                          value={teacherHiringDate}
                          onChangeText={setTeacherHiringDate}
                        />
                      </View>
                    </View>

                    <View style={styles.formCol}>
                      <Text style={styles.fieldLabel}>8. مدة العقد</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="مثال: 1 سنة أو مفتوح"
                        placeholderTextColor={theme.colors.text.subtle}
                        value={teacherContractDuration}
                        onChangeText={setTeacherContractDuration}
                      />
                    </View>
                  </View>

                  {/* نوع العقد */}
                  <View style={styles.formGroup}>
                    <Text style={styles.fieldLabel}>7. نوع العقد</Text>
                    <View style={styles.chipGrid}>
                      {CONTRACT_TYPES.map((ct) => {
                        const isSel = teacherContractType === ct.id;
                        return (
                          <TouchableOpacity
                            key={ct.id}
                            style={[styles.chipItem, isSel && styles.chipItemSelected]}
                            onPress={() => setTeacherContractType(ct.id)}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.chipText, isSel && styles.chipTextSelected]}>
                              {ct.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* فترة سريان العقد */}
                  <View style={rowStyle}>
                    <View style={styles.formCol}>
                      <Text style={styles.fieldLabel}>9. بداية سريان العقد</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={theme.colors.text.subtle}
                        value={teacherContractStartDate}
                        onChangeText={setTeacherContractStartDate}
                      />
                    </View>
                    <View style={styles.formCol}>
                      <Text style={styles.fieldLabel}>9. نهاية سريان العقد</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="YYYY-MM-DD (أو فارغ لعقد مفتوح)"
                        placeholderTextColor={theme.colors.text.subtle}
                        value={teacherContractEndDate}
                        onChangeText={setTeacherContractEndDate}
                      />
                    </View>
                  </View>

                  {/* 10. الراتب الأساسي (Luxury Gold Highlight matching Screenshot 3) */}
                  <View style={styles.salaryHighlightBox}>
                    <Text style={styles.salaryHighlightLabel}>10. الراتب الأساسي الشهري (دج):</Text>
                    <TextInput
                      style={styles.salaryHighlightInput}
                      keyboardType="numeric"
                      placeholder="64000"
                      placeholderTextColor={theme.colors.text.subtle}
                      value={teacherBaseSalary}
                      onChangeText={setTeacherBaseSalary}
                    />
                    <Text style={styles.salaryHighlightCurrency}>دج / شهرياً</Text>
                  </View>
                </View>

                {/* 5. الوثائق المهنية وقائمة التدقيق (Checklist - البند 13 للمادة 23) */}
                <View style={styles.subCard}>
                  <View style={styles.subCardHeader}>
                    <FileCheck2 size={16} color={theme.colors.brand[500]} />
                    <Text style={styles.subCardTitle}>
                      13. الوثائق المهنية وقائمة التدقيق (Checklist - المادة 23)
                    </Text>
                    <View style={styles.bordeauxBadge}>
                      <Text style={styles.bordeauxBadgeText}>مكتمل: {depositedChecklistCount} من 7</Text>
                    </View>
                  </View>

                  <View style={styles.checklistGrid}>
                    {[
                      { key: 'cv', label: 'السيرة الذاتية (CV)' },
                      { key: 'diploma', label: 'الشهادات والمؤهلات العلمية (Diplômes & Qualifications)' },
                      { key: 'medicalCertificate', label: 'الشهادة الطبية (Certificat Médical)' },
                      { key: 'idPhotos', label: "الصور الشمسية (Photos d'identité - ص ش)" },
                      { key: 'criminalRecord', label: 'شهادة السوابق العدلية (Casier Judiciaire - ش س 2)' },
                      { key: 'workContract', label: 'عقد العمل الموقع (Contrat de travail)' },
                      { key: 'experienceCert', label: 'شهادة العمل السابقة / شهادات الخبرة' },
                    ].map((doc) => {
                      const isChecked = (teacherChecklist as any)[doc.key];
                      return (
                        <TouchableOpacity
                          key={doc.key}
                          style={[styles.checklistItemRow, isChecked && styles.checklistItemRowChecked]}
                          onPress={() =>
                            setTeacherChecklist((prev) => ({
                              ...prev,
                              [doc.key]: !isChecked,
                            }))
                          }
                          activeOpacity={0.8}
                        >
                          <View style={[styles.checkboxBox, isChecked && styles.checkboxBoxSelected]}>
                            {isChecked && <Check size={12} color="#FFF" />}
                          </View>
                          <Text style={[styles.checklistDocText, isChecked && styles.checklistDocTextChecked]}>
                            {doc.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            {/* ========================================== */}
            {/* Dynamic Role Sub-section: Student          */}
            {/* ========================================== */}
            {role === 'student' && (
              <View style={styles.subCard}>
                <View style={styles.subCardHeader}>
                  <GraduationCap size={16} color={theme.colors.brand[500]} />
                  <Text style={styles.subCardTitle}>الربط المدرسي والتفاصيل</Text>
                </View>

                {/* Date of Birth input with helper formatting */}
                <View style={styles.formGroup}>
                  <View style={styles.labelWithBadgeRow}>
                    <Text style={styles.fieldLabel}>تاريخ الميلاد (كلمة المرور)</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const d = new Date();
                        const pad = (n: number) => (n < 10 ? '0' + n : n);
                        setDateOfBirth(`${d.getFullYear() - 10}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
                      }}
                    >
                      <Text style={styles.quickPresetText}>+ مثال افتراضي</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inputWithIcon}>
                    <Calendar size={18} color={theme.colors.text.muted} />
                    <TextInput
                      style={styles.inputInsideIcon}
                      placeholder="YYYY-MM-DD (مثال: 2012-05-18)"
                      placeholderTextColor={theme.colors.text.subtle}
                      value={dateOfBirth}
                      onChangeText={setDateOfBirth}
                    />
                  </View>
                </View>

                {/* 3 Selectors: Class, Group, Guardian Parent */}
                <View style={rowStyle}>
                  {/* Class */}
                  <View style={styles.formCol}>
                    <Text style={styles.fieldLabel}>القسم</Text>
                    <TouchableOpacity
                      style={styles.pickerSelector}
                      onPress={() => setIsClassPickerOpen(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.pickerSelectorText} numberOfLines={1}>
                        {classesList.find((c) => c._id === selectedClassId)?.name || 'اختر القسم'}
                      </Text>
                      <ChevronDown size={16} color={theme.colors.text.secondary} />
                    </TouchableOpacity>
                  </View>

                  {/* Group */}
                  <View style={styles.formCol}>
                    <Text style={styles.fieldLabel}>الفوج</Text>
                    <TouchableOpacity
                      style={styles.pickerSelector}
                      onPress={() => setIsGroupPickerOpen(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.pickerSelectorText} numberOfLines={1}>
                        {availableGroups.find((g) => g._id === selectedGroupId)?.name || 'اختر الفوج'}
                      </Text>
                      <ChevronDown size={16} color={theme.colors.text.secondary} />
                    </TouchableOpacity>
                  </View>

                  {/* Guardian Parent */}
                  <View style={styles.formCol}>
                    <Text style={styles.fieldLabel}>ولي الأمر الكفيل</Text>
                    <TouchableOpacity
                      style={styles.pickerSelector}
                      onPress={() => setIsParentPickerOpen(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.pickerSelectorText} numberOfLines={1}>
                        {(() => {
                          const p = parentsList.find((par) => par._id === selectedParentId);
                          return p ? `${p.firstName} ${p.lastName}` : 'اختر ولي الأمر';
                        })()}
                      </Text>
                      <ChevronDown size={16} color={theme.colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* ========================================== */}
            {/* Dynamic Role Sub-section: Parent           */}
            {/* ========================================== */}
            {role === 'parent' && (
              <View style={styles.subCard}>
                <View style={styles.subCardHeader}>
                  <Users size={16} color={theme.colors.brand[500]} />
                  <Text style={styles.subCardTitle}>تفاصيل ولي الأمر</Text>
                </View>

                <View style={rowStyle}>
                  <View style={styles.formCol}>
                    <Text style={styles.fieldLabel}>المهنة</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="مثال: طبيب، مهندس"
                      placeholderTextColor={theme.colors.text.subtle}
                      value={parentProfession}
                      onChangeText={setParentProfession}
                    />
                  </View>
                  <View style={styles.formCol}>
                    <Text style={styles.fieldLabel}>العنوان</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="مثال: الجزائر العاصمة"
                      placeholderTextColor={theme.colors.text.subtle}
                      value={parentAddress}
                      onChangeText={setParentAddress}
                    />
                  </View>
                </View>

                {/* Student linking with live search */}
                <View style={styles.formGroup}>
                  <View style={styles.labelWithBadgeRow}>
                    <Text style={[styles.fieldLabel, { color: theme.colors.gold[500], fontWeight: 'bold' }]}>
                      ربط التلاميذ بالأب / ولي الأمر (الأبناء)
                    </Text>
                    <View style={styles.bordeauxBadge}>
                      <Text style={styles.bordeauxBadgeText}>{parentChildren.length} تلميذ محدد</Text>
                    </View>
                  </View>
                  <Text style={styles.helperText}>
                    حدد التلميذ أو التلاميذ التابعين لهذا الولي لمزامنة حساباتهم فورياً:
                  </Text>

                  <View style={styles.inputWithIcon}>
                    <Search size={18} color={theme.colors.gold[500]} />
                    <TextInput
                      style={styles.inputInsideIcon}
                      placeholder="ابحث عن التلميذ بالاسم، اللقب، القسم أو رقم التسجيل..."
                      placeholderTextColor={theme.colors.text.subtle}
                      value={studentLinkSearch}
                      onChangeText={setStudentLinkSearch}
                    />
                  </View>

                  <ScrollView style={styles.studentLinkBox} nestedScrollEnabled>
                    {studentsList
                      .filter((stu) => {
                        if (!studentLinkSearch.trim()) return true;
                        const q = studentLinkSearch.toLowerCase().trim();
                        const nameAr = `${stu.firstNameArabic || ''} ${stu.lastNameArabic || ''}`.toLowerCase();
                        const nameFr = `${stu.user?.firstName || ''} ${stu.user?.lastName || ''}`.toLowerCase();
                        const clsName = (stu.class?.name || '').toLowerCase();
                        const reg = (stu.registrationNumber || '').toLowerCase();
                        return nameAr.includes(q) || nameFr.includes(q) || clsName.includes(q) || reg.includes(q);
                      })
                      .map((stu) => {
                        const isSelected = parentChildren.includes(stu._id);
                        const stuName = stu.firstNameArabic && stu.lastNameArabic
                          ? `${stu.firstNameArabic} ${stu.lastNameArabic}`
                          : `${stu.user?.firstName || ''} ${stu.user?.lastName || ''}`.trim() || 'تلميذ';

                        return (
                          <TouchableOpacity
                            key={stu._id}
                            style={[styles.studentLinkRow, isSelected && styles.studentLinkRowSelected]}
                            onPress={() => {
                              if (isSelected) {
                                setParentChildren((prev) => prev.filter((id) => id !== stu._id));
                              } else {
                                setParentChildren((prev) => [...prev, stu._id]);
                              }
                            }}
                          >
                            <View style={styles.studentLinkRight}>
                              <View style={[styles.checkboxBox, isSelected && styles.checkboxBoxSelected]}>
                                {isSelected && <Check size={12} color="#FFF" />}
                              </View>
                              <Text style={styles.studentLinkName}>{stuName}</Text>
                            </View>
                            <View style={styles.studentLinkLeft}>
                              {stu.class?.name && (
                                <View style={styles.classBadge}>
                                  <Text style={styles.classBadgeText}>{stu.class.name}</Text>
                                </View>
                              )}
                              <Text style={styles.studentRegText}>
                                {stu.nationalIdDigitization || stu.registrationNumber || ''}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                  </ScrollView>
                </View>
              </View>
            )}

            {/* ======================================================== */}
            {/* Dynamic Role Sub-section: Supervisor (General / Pedag)   */}
            {/* ======================================================== */}
            {['general_supervisor', 'pedagogical_supervisor'].includes(role) && (
              <View style={styles.subCard}>
                <View style={styles.subCardHeader}>
                  <Shield size={16} color={theme.colors.brand[500]} />
                  <Text style={styles.subCardTitle}>تفاصيل المشرف والمكتب</Text>
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>مكتب العمل / الموقع</Text>
                  <View style={styles.inputWithIcon}>
                    <MapPin size={16} color={theme.colors.text.muted} />
                    <TextInput
                      style={styles.inputInsideIcon}
                      placeholder="مثال: Bureau principal - الطابق الأول"
                      placeholderTextColor={theme.colors.text.subtle}
                      value={officeLocation}
                      onChangeText={setOfficeLocation}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* ========================================== */}
            {/* Dynamic Role Sub-section: Receptionist     */}
            {/* ========================================== */}
            {role === 'receptionist' && (
              <View style={styles.subCard}>
                <View style={styles.subCardHeader}>
                  <Clock size={16} color={theme.colors.brand[500]} />
                  <Text style={styles.subCardTitle}>تفاصيل الاستقبال وساعات العمل</Text>
                </View>
                <View style={rowStyle}>
                  <View style={styles.formCol}>
                    <Text style={styles.fieldLabel}>رقم مكتب الاستقبال</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="مثال: Accueil Principal"
                      placeholderTextColor={theme.colors.text.subtle}
                      value={deskNumber}
                      onChangeText={setDeskNumber}
                    />
                  </View>
                  <View style={styles.formCol}>
                    <Text style={styles.fieldLabel}>ساعات الدوام (الوردية)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="مثال: 07:30 - 16:30"
                      placeholderTextColor={theme.colors.text.subtle}
                      value={workShift}
                      onChangeText={setWorkShift}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleCreateUser}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>إنشاء الحساب الجديد</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================================= */}
        {/* CARD 2: استيراد جماعي عبر Excel (MATCHING TOP LEFT CARD IN SCREENSHOTS)   */}
        {/* ========================================================================= */}
        {(activeSegment === 'all' || activeSegment === 'excel') && (
          <View style={styles.card}>
            <View style={styles.cardHeaderBetween}>
              <View style={styles.headerLeftCluster}>
                <Upload size={20} color={theme.colors.brand[500]} />
                <Text style={styles.cardTitle}>استيراد جماعي عبر Excel</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.article23Btn,
                  excelImportType === 'teachers' && styles.article23BtnActive,
                ]}
                onPress={() =>
                  setExcelImportType((prev) => (prev === 'teachers' ? 'general' : 'teachers'))
                }
                activeOpacity={0.8}
              >
                <FileSpreadsheet size={14} color={theme.colors.gold[500]} />
                <Text style={styles.article23BtnText}>
                  {excelImportType === 'teachers'
                    ? 'وضع: أساتذة وموظفين (المادة 23) ✓'
                    : 'استيراد أساتذة وموظفين (المادة 23)'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Guide toggle button */}
            <TouchableOpacity
              style={styles.guideToggleRow}
              onPress={() => setShowExcelGuide((p) => !p)}
            >
              <Info size={14} color={theme.colors.brand[500]} />
              <Text style={styles.guideToggleText}>
                {showExcelGuide ? 'إخفاء دليل أعمدة Excel' : 'عرض دليل أعمدة ملف Excel المطابقة'}
              </Text>
            </TouchableOpacity>

            {showExcelGuide && (
              <View style={styles.guideBox}>
                <Text style={styles.guideBoxTitle}>
                  {excelImportType === 'teachers'
                    ? 'الأعمدة المتوقعة لاستيراد الأساتذة (المادة 23):'
                    : 'الأعمدة المتوقعة لاستيراد الحسابات العامة:'}
                </Text>
                <Text style={styles.guideBoxBody}>
                  {excelImportType === 'teachers'
                    ? '• email, firstName, lastName, phoneNumber, subjects, cycle, classes, groups, hiringDate, baseSalary'
                    : '• email, firstName, lastName, phoneNumber, role (student/teacher/parent), dateOfBirth, class'}
                </Text>
              </View>
            )}

            {/* Dropzone / File Picker */}
            <TouchableOpacity
              style={[styles.dropzone, excelFile && styles.dropzoneActive]}
              onPress={handlePickExcel}
              activeOpacity={0.8}
            >
              <FileSpreadsheet size={36} color={excelFile ? theme.colors.brand[500] : theme.colors.text.muted} />
              <Text style={styles.dropzoneText}>
                {excelFile ? `الملف المحدد: ${excelFile.name}` : 'انقر أو اسحب ملف Excel هنا لتحديده'}
              </Text>
              {excelFile ? (
                <View style={styles.fileSelectedRow}>
                  <Text style={styles.dropzoneSubText}>
                    الحجم: {((excelFile.size || 0) / 1024).toFixed(1)} ك.ب
                  </Text>
                  <TouchableOpacity
                    style={styles.removeFileBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      setExcelFile(null);
                    }}
                  >
                    <Text style={styles.removeFileBtnText}>إلغاء التحديد</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.dropzoneSubText}>يدعم صيغ .xlsx و .xls المطابقة لمعايير الوزارة</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, !excelFile && styles.submitBtnDisabled]}
              onPress={handleUploadExcel}
              disabled={!excelFile || isImportingExcel}
              activeOpacity={0.85}
            >
              {isImportingExcel ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>تحميل القائمة بالكامل</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================================= */}
        {/* CARD 3: تنشيط وتعديل حسابات النظام (MATCHING BOTTOM LEFT CARD IN SCREENSHOTS) */}
        {/* ========================================================================= */}
        {(activeSegment === 'all' || activeSegment === 'accounts') && (
          <View style={styles.card}>
            <View style={styles.cardHeaderBetween}>
              <View style={styles.headerLeftCluster}>
                <ShieldAlert size={20} color={theme.colors.brand[500]} />
                <Text style={styles.cardTitle}>تنشيط وتعديل حسابات النظام</Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{filteredUsers.length} من {systemUsers.length}</Text>
              </View>
            </View>

            {/* Search and Role Filter */}
            <View style={styles.filterSection}>
              <View style={styles.inputWithIcon}>
                <Search size={18} color={theme.colors.text.muted} />
                <TextInput
                  style={styles.inputInsideIcon}
                  placeholder="بحث بالاسم، البريد أو رقم الهاتف..."
                  placeholderTextColor={theme.colors.text.subtle}
                  value={accountSearch}
                  onChangeText={setAccountSearch}
                />
                {accountSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setAccountSearch('')}>
                    <X size={16} color={theme.colors.text.muted} />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleChipsRow}>
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'student', label: 'التلاميذ' },
                  { id: 'teacher', label: 'الأساتذة' },
                  { id: 'parent', label: 'الأولياء' },
                  { id: 'general_supervisor', label: 'مشرف عام' },
                  { id: 'pedagogical_supervisor', label: 'مشرف تربوي' },
                  { id: 'receptionist', label: 'استقبال' },
                  { id: 'admin', label: 'إدارة' },
                ].map((chip) => (
                  <TouchableOpacity
                    key={chip.id}
                    style={[styles.filterChip, accountRoleFilter === chip.id && styles.filterChipActive]}
                    onPress={() => setAccountRoleFilter(chip.id)}
                  >
                    <Text style={[styles.filterChipText, accountRoleFilter === chip.id && styles.filterChipTextActive]}>
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Users List */}
            <View style={styles.usersListContainer}>
              {filteredUsers.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Users size={32} color={theme.colors.text.subtle} />
                  <Text style={styles.emptyNote}>لا يوجد مستخدمون مطابقون لمعايير البحث.</Text>
                </View>
              ) : (
                filteredUsers.map((u) => {
                  const isTeacherOrStaff = ['teacher', 'general_supervisor', 'pedagogical_supervisor', 'receptionist'].includes(u.role);
                  const isStudent = u.role === 'student';
                  const badgeCfg = getRoleBadgeConfig(u.role);

                  return (
                    <View key={u._id} style={styles.userCard}>
                      {/* Top Header of User Card: Name + Role Badge */}
                      <View style={styles.userCardTopRow}>
                        <View style={styles.userNameBlock}>
                          <Text style={styles.userNameText}>
                            {u.firstName} {u.lastName}
                            {u.firstNameArabic ? ` (${u.firstNameArabic} ${u.lastNameArabic})` : ''}
                          </Text>
                          <Text style={styles.userSubText}>
                            {u.email || u.phoneNumber} {u.jobTitle ? `• ${u.jobTitle}` : ''}
                          </Text>
                        </View>
                        <View style={[styles.roleBadgePill, { backgroundColor: badgeCfg.bg, borderColor: badgeCfg.border }]}>
                          <Text style={[styles.roleBadgePillText, { color: badgeCfg.text }]}>
                            {badgeCfg.label}
                          </Text>
                        </View>
                      </View>

                      {/* Bottom Action Buttons Bar */}
                      <View style={styles.userCardActionsBar}>
                        <View style={styles.userActionsRow}>
                          {/* Dossier Button: Article 23 (Teacher/Staff) or School Dossier (Student) */}
                          {isTeacherOrStaff && onOpenTeacherDossier && (
                            <TouchableOpacity
                              style={styles.dossierBtn}
                              onPress={() => {
                                const tObj = teachersList.find((t) => t.user?._id === u._id) || { user: u };
                                onOpenTeacherDossier(tObj);
                              }}
                              activeOpacity={0.8}
                            >
                              <FileText size={13} color={theme.colors.gold[500]} />
                              <Text style={styles.dossierBtnText}>الملف المهني (المادة 23)</Text>
                            </TouchableOpacity>
                          )}

                          {isStudent && onOpenStudentDossier && (
                            <TouchableOpacity
                              style={styles.studentDossierBtn}
                              onPress={() => {
                                const sObj = studentsList.find((s) => s.user?._id === u._id) || { user: u };
                                onOpenStudentDossier(sObj);
                              }}
                              activeOpacity={0.8}
                            >
                              <FileText size={13} color="#FDE047" />
                              <Text style={styles.studentDossierBtnText}>الملف المدرسي</Text>
                            </TouchableOpacity>
                          )}

                          {/* Status Toggle Button */}
                          <TouchableOpacity
                            style={[
                              styles.statusBtn,
                              u.isActive ? styles.statusBtnActive : styles.statusBtnInactive,
                            ]}
                            onPress={() => handleToggleStatus(u)}
                            disabled={togglingUserId === u._id}
                            activeOpacity={0.7}
                          >
                            {togglingUserId === u._id ? (
                              <ActivityIndicator size="small" color={u.isActive ? '#7B1E3A' : '#065F46'} />
                            ) : (
                              <Text
                                style={[
                                  styles.statusBtnText,
                                  u.isActive ? styles.statusBtnTextActive : styles.statusBtnTextInactive,
                                ]}
                              >
                                {u.isActive ? 'تعطيل الحساب' : 'تنشيط الحساب'}
                              </Text>
                            )}
                          </TouchableOpacity>

                          {/* Edit Button */}
                          <TouchableOpacity
                            style={styles.iconActionBtnNeutral}
                            onPress={() => handleOpenEdit(u)}
                            activeOpacity={0.7}
                          >
                            <Edit2 size={14} color={theme.colors.text.secondary} />
                          </TouchableOpacity>

                          {/* Delete Button */}
                          <TouchableOpacity
                            style={styles.iconActionBtnDanger}
                            onPress={() => handleDeleteUser(u)}
                            disabled={deletingUserId === u._id}
                            activeOpacity={0.7}
                          >
                            {deletingUserId === u._id ? (
                              <ActivityIndicator size="small" color="#BE123C" />
                            ) : (
                              <Trash2 size={14} color="#BE123C" />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ========================================================================= */}
      {/* MODAL 1: Role Picker                                                      */}
      {/* ========================================================================= */}
      <Modal visible={isRolePickerOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalDialog}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>اختر نوع الحساب</Text>
              <TouchableOpacity onPress={() => setIsRolePickerOpen(false)}>
                <X size={20} color={theme.colors.text.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 380 }}>
              {ROLE_OPTIONS.map((item) => {
                const IconComp = item.icon;
                const isSelected = role === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                    onPress={() => {
                      setRole(item.value);
                      setIsRolePickerOpen(false);
                    }}
                  >
                    <View style={styles.pickerItemLeft}>
                      <IconComp size={18} color={isSelected ? theme.colors.brand[500] : theme.colors.text.muted} />
                      <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                        {item.label}
                      </Text>
                    </View>
                    {isSelected && <Check size={16} color={theme.colors.brand[500]} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: Job Title Picker (الوظيفة المسندة)                               */}
      {/* ========================================================================= */}
      <Modal visible={isJobTitlePickerOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalDialog}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>اختر الوظيفة والصفة البيداغوجية</Text>
              <TouchableOpacity onPress={() => setIsJobTitlePickerOpen(false)}>
                <X size={20} color={theme.colors.text.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 380 }}>
              {TEACHER_JOB_TITLES.map((title) => {
                const isSel = teacherJobTitle === title;
                return (
                  <TouchableOpacity
                    key={title}
                    style={[styles.pickerItem, isSel && styles.pickerItemSelected]}
                    onPress={() => {
                      setTeacherJobTitle(title);
                      setIsJobTitlePickerOpen(false);
                    }}
                  >
                    <Text style={[styles.pickerItemText, isSel && styles.pickerItemTextSelected]}>
                      {title}
                    </Text>
                    {isSel && <Check size={16} color={theme.colors.brand[500]} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: Class Picker                                                     */}
      {/* ========================================================================= */}
      <Modal visible={isClassPickerOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalDialog}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>اختر القسم الدراسي</Text>
              <TouchableOpacity onPress={() => setIsClassPickerOpen(false)}>
                <X size={20} color={theme.colors.text.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 380 }}>
              {classesList.map((c) => (
                <TouchableOpacity
                  key={c._id}
                  style={[styles.pickerItem, selectedClassId === c._id && styles.pickerItemSelected]}
                  onPress={() => {
                    setSelectedClassId(c._id);
                    setSelectedGroupId('');
                    setIsClassPickerOpen(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, selectedClassId === c._id && styles.pickerItemTextSelected]}>
                    {c.name}
                  </Text>
                  {selectedClassId === c._id && <Check size={16} color={theme.colors.brand[500]} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: Group Picker                                                     */}
      {/* ========================================================================= */}
      <Modal visible={isGroupPickerOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalDialog}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>اختر الفوج</Text>
              <TouchableOpacity onPress={() => setIsGroupPickerOpen(false)}>
                <X size={20} color={theme.colors.text.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 380 }}>
              {availableGroups.map((g) => (
                <TouchableOpacity
                  key={g._id}
                  style={[styles.pickerItem, selectedGroupId === g._id && styles.pickerItemSelected]}
                  onPress={() => {
                    setSelectedGroupId(g._id);
                    setIsGroupPickerOpen(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, selectedGroupId === g._id && styles.pickerItemTextSelected]}>
                    {g.name}
                  </Text>
                  {selectedGroupId === g._id && <Check size={16} color={theme.colors.brand[500]} />}
                </TouchableOpacity>
              ))}
              {availableGroups.length === 0 && (
                <View style={{ padding: 16 }}>
                  <Text style={styles.emptyNote}>لا توجد أفواج مسجلة لهذا القسم.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: Parent Picker with Live Search                                   */}
      {/* ========================================================================= */}
      <Modal visible={isParentPickerOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalDialog}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>اختر ولي الأمر الكفيل</Text>
              <TouchableOpacity onPress={() => setIsParentPickerOpen(false)}>
                <X size={20} color={theme.colors.text.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputWithIcon}>
              <Search size={16} color={theme.colors.text.muted} />
              <TextInput
                style={styles.inputInsideIcon}
                placeholder="ابحث بالاسم أو رقم الهاتف..."
                placeholderTextColor={theme.colors.text.subtle}
                value={parentModalSearch}
                onChangeText={setParentModalSearch}
              />
            </View>

            <ScrollView style={{ maxHeight: 350 }}>
              {parentsList
                .filter((p) => {
                  if (!parentModalSearch.trim()) return true;
                  const q = parentModalSearch.toLowerCase().trim();
                  const name = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
                  const phone = (p.phoneNumber || '').toLowerCase();
                  return name.includes(q) || phone.includes(q);
                })
                .map((p) => (
                  <TouchableOpacity
                    key={p._id}
                    style={[styles.pickerItem, selectedParentId === p._id && styles.pickerItemSelected]}
                    onPress={() => {
                      setSelectedParentId(p._id);
                      setIsParentPickerOpen(false);
                      setParentModalSearch('');
                    }}
                  >
                    <View>
                      <Text style={[styles.pickerItemText, selectedParentId === p._id && styles.pickerItemTextSelected]}>
                        {p.firstName} {p.lastName}
                      </Text>
                      <Text style={styles.pickerSubItemText}>{p.phoneNumber || p.email}</Text>
                    </View>
                    {selectedParentId === p._id && <Check size={16} color={theme.colors.brand[500]} />}
                  </TouchableOpacity>
                ))}
              {parentsList.length === 0 && (
                <View style={{ padding: 16 }}>
                  <Text style={styles.emptyNote}>لا يوجد أولياء مسجلين حالياً.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 6: Edit User Modal (Supporting Article 23 fields for teachers)       */}
      {/* ========================================================================= */}
      <Modal visible={!!editingUser} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalDialog}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleCluster}>
                <Edit2 size={16} color={theme.colors.brand[500]} />
                <Text style={styles.modalTitle}>
                  تعديل حساب: {editingUser?.firstName} {editingUser?.lastName}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditingUser(null)}>
                <X size={20} color={theme.colors.text.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              <View style={rowStyle}>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>الاسم الأول (لاتيني)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editFirstName}
                    onChangeText={setEditFirstName}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>اللقب (لاتيني)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editLastName}
                    onChangeText={setEditLastName}
                  />
                </View>
              </View>

              {editingUser?.role === 'teacher' && (
                <View style={rowStyle}>
                  <View style={styles.formCol}>
                    <Text style={styles.fieldLabel}>الاسم بالعربية</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editFirstNameArabic}
                      onChangeText={setEditFirstNameArabic}
                    />
                  </View>
                  <View style={styles.formCol}>
                    <Text style={styles.fieldLabel}>اللقب بالعربية</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editLastNameArabic}
                      onChangeText={setEditLastNameArabic}
                    />
                  </View>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>رقم الهاتف</Text>
                <View style={styles.inputWithIcon}>
                  <Phone size={16} color={theme.colors.brand[500]} />
                  <TextInput
                    style={styles.inputInsideIcon}
                    keyboardType="phone-pad"
                    value={editPhoneNumber}
                    onChangeText={setEditPhoneNumber}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>البريد الإلكتروني</Text>
                <View style={styles.inputWithIcon}>
                  <Mail size={16} color={theme.colors.text.muted} />
                  <TextInput
                    style={styles.inputInsideIcon}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={editEmail}
                    onChangeText={setEditEmail}
                  />
                </View>
              </View>

              {editingUser?.role === 'teacher' && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.fieldLabel}>الوظيفة والصفة المسندة</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editJobTitle}
                      onChangeText={setEditJobTitle}
                    />
                  </View>

                  <View style={rowStyle}>
                    <View style={styles.formCol}>
                      <Text style={styles.fieldLabel}>الراتب الأساسي (دج)</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={editBaseSalary}
                        onChangeText={setEditBaseSalary}
                      />
                    </View>
                    <View style={styles.formCol}>
                      <Text style={styles.fieldLabel}>الوضعية الحالية</Text>
                      <TextInput
                        style={styles.textInput}
                        value={editProfessionalStatus}
                        onChangeText={setEditProfessionalStatus}
                      />
                    </View>
                  </View>
                </>
              )}

              {['general_supervisor', 'pedagogical_supervisor'].includes(editingUser?.role) && (
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>مكتب العمل / الموقع</Text>
                  <View style={styles.inputWithIcon}>
                    <MapPin size={16} color={theme.colors.text.muted} />
                    <TextInput
                      style={styles.inputInsideIcon}
                      value={editOfficeLocation}
                      onChangeText={setEditOfficeLocation}
                    />
                  </View>
                </View>
              )}

              {editingUser?.role === 'receptionist' && (
                <View style={rowStyle}>
                  <View style={styles.formCol}>
                    <Text style={styles.fieldLabel}>رقم المكتب</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editDeskNumber}
                      onChangeText={setEditDeskNumber}
                    />
                  </View>
                  <View style={styles.formCol}>
                    <Text style={styles.fieldLabel}>ساعات الدوام</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editWorkShift}
                      onChangeText={setEditWorkShift}
                    />
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSaveEdit}
                disabled={isUpdatingUser}
                activeOpacity={0.85}
              >
                {isUpdatingUser ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>حفظ التعديلات</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3E9DC',
  },
  segmentContainer: {
    backgroundColor: '#FAF4EB',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201, 162, 77, 0.25)',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  segmentScroll: {
    flexDirection: 'row-reverse',
    gap: 8,
    alignItems: 'center',
  },
  segmentBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    shadowColor: '#2B2022',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentBtnActive: {
    backgroundColor: '#7B1E3A',
    borderColor: '#7B1E3A',
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2B2022',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
  },
  refreshIconBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    gap: 16,
    paddingBottom: 48,
  },

  /* Card Container */
  card: {
    backgroundColor: '#FCF8F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    padding: 16,
    shadowColor: '#2B2022',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201, 162, 77, 0.2)',
    paddingBottom: 10,
  },
  cardHeaderBetween: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201, 162, 77, 0.2)',
    paddingBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  headerLeftCluster: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2B2022',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  countBadge: {
    backgroundColor: 'rgba(123, 30, 58, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(123, 30, 58, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7B1E3A',
  },

  /* Article 23 Full Dossier Banner */
  article23Container: {
    gap: 12,
  },
  officialDossierBanner: {
    backgroundColor: '#7B1E3A',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#C9A24D',
    shadowColor: '#7B1E3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  bannerIconCluster: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  bannerMainTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  bannerSubTitle: {
    color: '#F7EED8',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },

  /* Article 23 Button */
  article23Btn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7B1E3A',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.4)',
  },
  article23BtnActive: {
    backgroundColor: '#551125',
    borderColor: '#C9A24D',
  },
  article23BtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Form Elements */
  formRow: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  formColStack: {
    flexDirection: 'column',
    gap: 12,
  },
  formCol: {
    flex: 1,
    gap: 6,
  },
  formGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A3E3D',
    textAlign: 'right',
  },
  labelWithBadgeRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greenBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  greenBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  bordeauxBadge: {
    backgroundColor: '#7B1E3A',
    borderColor: 'rgba(201, 162, 77, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  bordeauxBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  confidentialBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  confidentialBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  miniBadge: {
    backgroundColor: 'rgba(123, 30, 58, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(123, 30, 58, 0.25)',
  },
  miniBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7B1E3A',
  },
  statusBadgePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusBadgePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  statusSelectChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FAF4EB',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.35)',
  },
  statusSelectChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4A3E3D',
  },
  optionalHint: {
    fontSize: 10,
    color: '#766065',
  },
  quickPresetText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7B1E3A',
  },
  textInput: {
    backgroundColor: '#FAF4EB',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#2B2022',
    textAlign: 'right',
  },
  phoneInput: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontWeight: '700',
    color: '#7B1E3A',
  },
  helperText: {
    fontSize: 10,
    color: '#766065',
    textAlign: 'right',
    lineHeight: 14,
    marginTop: 2,
  },
  pickerSelector: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF4EB',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  pickerSelectorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2B2022',
    textAlign: 'right',
    flex: 1,
  },

  /* Password Notice Box */
  passwordNoticeBox: {
    backgroundColor: 'rgba(201, 162, 77, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'flex-end',
    gap: 4,
  },
  passwordNoticeHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  passwordNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7B1E3A',
    textAlign: 'right',
  },
  passwordNoticeValue: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontWeight: '700',
    color: '#4A3E3D',
    textAlign: 'right',
  },

  /* Sub Card (Dynamic Role Details) */
  subCard: {
    backgroundColor: 'rgba(243, 233, 220, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  subCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201, 162, 77, 0.2)',
    paddingBottom: 6,
  },
  subCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2B2022',
    textAlign: 'right',
    flex: 1,
    marginRight: 6,
  },
  inputWithIcon: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FAF4EB',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  inputInsideIcon: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 13,
    color: '#2B2022',
    textAlign: 'right',
  },

  /* Salary Highlight Box matching Screenshot 3 */
  salaryHighlightBox: {
    backgroundColor: '#FFFDF9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(201, 162, 77, 0.5)',
    padding: 14,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#C9A24D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 2,
  },
  salaryHighlightLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7B1E3A',
  },
  salaryHighlightInput: {
    fontSize: 26,
    fontWeight: '900',
    color: '#7B1E3A',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    textAlign: 'center',
    width: '100%',
    paddingVertical: 4,
  },
  salaryHighlightCurrency: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },

  /* Checklist Grid */
  checklistGrid: {
    gap: 6,
  },
  checklistItemRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFDF9',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.2)',
  },
  checklistItemRowChecked: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#7B1E3A',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  checkboxBoxSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  checklistDocText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A3E3D',
    flex: 1,
    textAlign: 'right',
  },
  checklistDocTextChecked: {
    color: '#047857',
    fontWeight: '700',
  },

  /* Chips and Selectables */
  chipGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    maxHeight: 140,
  },
  chipItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FAF4EB',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
  },
  chipItemSelected: {
    backgroundColor: '#7B1E3A',
    borderColor: '#7B1E3A',
  },
  chipText: {
    fontSize: 11,
    color: '#4A3E3D',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyNote: {
    fontSize: 11,
    color: '#766065',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 6,
  },

  /* Assignments */
  assignmentRow: {
    flexDirection: 'row-reverse',
    gap: 6,
    alignItems: 'center',
  },
  miniAddBtn: {
    backgroundColor: 'rgba(123, 30, 58, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(123, 30, 58, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  miniAddBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7B1E3A',
  },
  assignmentRemoveBtn: {
    padding: 8,
    backgroundColor: 'rgba(190, 18, 60, 0.1)',
    borderRadius: 8,
  },

  /* Student Linking */
  studentLinkBox: {
    maxHeight: 180,
    backgroundColor: '#FAF4EB',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
    borderRadius: 10,
    padding: 6,
  },
  studentLinkRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFDF9',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.15)',
  },
  studentLinkRowSelected: {
    backgroundColor: 'rgba(123, 30, 58, 0.15)',
    borderColor: '#7B1E3A',
  },
  studentLinkRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  studentLinkName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2B2022',
  },
  studentLinkLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  classBadge: {
    backgroundColor: '#FAF4EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
  },
  classBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4A3E3D',
  },
  studentRegText: {
    fontSize: 10,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontWeight: '700',
    color: '#C9A24D',
  },

  /* Submit Button */
  submitBtn: {
    backgroundColor: '#7B1E3A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7B1E3A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
    marginTop: 6,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  /* Guide toggle */
  guideToggleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  guideToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7B1E3A',
    textDecorationLine: 'underline',
  },
  guideBox: {
    backgroundColor: 'rgba(201, 162, 77, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  guideBoxTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2B2022',
    textAlign: 'right',
  },
  guideBoxBody: {
    fontSize: 10,
    color: '#574549',
    textAlign: 'right',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    lineHeight: 14,
  },

  /* Dropzone */
  dropzone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(201, 162, 77, 0.6)',
    borderRadius: 12,
    backgroundColor: 'rgba(250, 244, 235, 0.8)',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dropzoneActive: {
    borderColor: '#7B1E3A',
    backgroundColor: 'rgba(123, 30, 58, 0.05)',
  },
  dropzoneText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2B2022',
    textAlign: 'center',
  },
  dropzoneSubText: {
    fontSize: 11,
    color: '#766065',
    textAlign: 'center',
  },
  fileSelectedRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  removeFileBtn: {
    backgroundColor: 'rgba(190, 18, 60, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  removeFileBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#BE123C',
  },

  /* Filter Section */
  filterSection: {
    gap: 10,
  },
  roleChipsRow: {
    flexDirection: 'row-reverse',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FAF4EB',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
  },
  filterChipActive: {
    backgroundColor: '#7B1E3A',
    borderColor: '#7B1E3A',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4A3E3D',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* Users List */
  usersListContainer: {
    gap: 10,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  userCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.25)',
    borderLeftWidth: 4,
    borderLeftColor: '#C9A24D', // Gold accent line matching screenshot
    shadowColor: '#2B2022',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    gap: 10,
  },
  userCardTopRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  userNameBlock: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  userNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2B2022',
    textAlign: 'right',
  },
  userSubText: {
    fontSize: 11,
    color: '#766065',
    textAlign: 'right',
  },
  roleBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleBadgePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  userCardActionsBar: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(201, 162, 77, 0.15)',
    paddingTop: 8,
  },
  userActionsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  iconActionBtnDanger: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(190, 18, 60, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(190, 18, 60, 0.2)',
  },
  iconActionBtnNeutral: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: '#FAF4EB',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
  },
  statusBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBtnActive: {
    backgroundColor: 'rgba(123, 30, 58, 0.15)',
    borderColor: 'rgba(123, 30, 58, 0.35)',
  },
  statusBtnInactive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBtnTextActive: {
    color: '#7B1E3A',
  },
  statusBtnTextInactive: {
    color: '#065F46',
  },
  dossierBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7B1E3A',
    borderColor: 'rgba(201, 162, 77, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dossierBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  studentDossierBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#551125',
    borderColor: 'rgba(201, 162, 77, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  studentDossierBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(43, 32, 34, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalDialog: {
    backgroundColor: '#FCF8F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.4)',
    width: '100%',
    maxWidth: 480,
    padding: 16,
    gap: 12,
    shadowColor: '#2B2022',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201, 162, 77, 0.25)',
    paddingBottom: 10,
  },
  modalTitleCluster: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2B2022',
    textAlign: 'right',
  },
  pickerItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201, 162, 77, 0.15)',
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(123, 30, 58, 0.08)',
  },
  pickerItemLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  pickerItemText: {
    fontSize: 13,
    color: '#2B2022',
    fontWeight: '600',
    textAlign: 'right',
  },
  pickerItemTextSelected: {
    color: '#7B1E3A',
    fontWeight: '800',
  },
  pickerSubItemText: {
    fontSize: 11,
    color: '#766065',
    textAlign: 'right',
    marginTop: 2,
  },
});
