import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  Menu,
  Megaphone,
  Sparkles,
  Heart,
  MessageSquare,
  Send,
  Pin,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  Plus,
  X,
  FileText,
  Users,
  CreditCard,
  BookOpen,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Check,
  AlertCircle,
  GraduationCap,
  Calendar,
  Download,
  Upload,
  Lock,
  Unlock,
  RefreshCw,
  Globe,
  Database,
  Palette,
  CheckSquare,
  ChevronDown,
  Layers,
  ArrowRight,
  ExternalLink,
  MoreVertical,
  Eye,
} from 'lucide-react-native';
import { apiClient, API_BASE_URL } from '../../src/api/client';
import { useAuthStore } from '../../src/store/useAuthStore';
import { SchoolLogo } from '../../src/components/SchoolLogo';
import { Button } from '../../src/components/common/Button';
import { theme } from '../../src/theme/tokens';
import { NavigationDrawer, ADMIN_NAV_ITEMS } from '../../src/components/NavigationDrawer';
import { DashboardHeader } from '../../src/components/DashboardHeader';
import { TeacherDashboardView } from '../../src/components/dashboards/TeacherDashboardView';
import { ParentDashboardView } from '../../src/components/dashboards/ParentDashboardView';
import { StudentDashboardView } from '../../src/components/dashboards/StudentDashboardView';
import { SupervisorDashboardView } from '../../src/components/dashboards/SupervisorDashboardView';
import { ReceptionistDashboardView } from '../../src/components/dashboards/ReceptionistDashboardView';
import { SchoolFeedView } from '../../src/components/feed/SchoolFeedView';
import { ConversationView } from '../../src/components/chat/ConversationView';
import { AdminAccountsView } from '../../src/components/admin/AdminAccountsView';
import { AdminEnrollmentView } from '../../src/components/admin/AdminEnrollmentView';
import { AdminClassesView } from '../../src/components/admin/AdminClassesView';
import { TeacherDossierModal } from '../../src/components/admin/TeacherDossierModal';
import {
  StudentDetailsModal,
  StudentEditModal,
  StudentDossierPrintModal,
} from '../../src/components/admin/StudentModals';
import { useLocalSearchParams } from 'expo-router';

/* ==================================================================== */
/*  Main Component: Unified Role-Aware Dashboard & RBAC Dispatcher      */
/* ==================================================================== */

function AdminDashboardView({
  currentRoute,
  setCurrentRoute,
}: {
  currentRoute: string;
  setCurrentRoute: (r: string) => void;
}) {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'school';

  // Navigation Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Loading & Refreshing
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  // Core Data States
  const [stats, setStats] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [modulesList, setModulesList] = useState<any[]>([]);
  const [groupsList, setGroupsList] = useState<any[]>([]);
  const [documentsList, setDocumentsList] = useState<any[]>([]);
  const [schedulesList, setSchedulesList] = useState<any[]>([]);
  const [backupsList, setBackupsList] = useState<any[]>([]);
  const [adminRequestsList, setAdminRequestsList] = useState<any[]>([]);
  const [reportedMessagesList, setReportedMessagesList] = useState<any[]>([]);
  const [loginAuditList, setLoginAuditList] = useState<any[]>([]);
  const [lessonsList, setLessonsList] = useState<any[]>([]);
  const [attendanceWarnings, setAttendanceWarnings] = useState<any[]>([]);

  // Search & Filters per view
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [studentSearch, setStudentSearch] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherStatusFilter, setTeacherStatusFilter] = useState('all');
  const [classSearch, setClassSearch] = useState('');
  const [requestFilter, setRequestFilter] = useState('all');
  const [scheduleTypeFilter, setScheduleTypeFilter] = useState('all');

  // Modals state
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showCreatePaymentModal, setShowCreatePaymentModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showCreateModuleModal, setShowCreateModuleModal] = useState(false);
  const [showCreateEnrollmentModal, setShowCreateEnrollmentModal] = useState(false);

  // Forms State
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postTarget, setPostTarget] = useState('all');
  const [postIsPinned, setPostIsPinned] = useState(false);
  const [isPublishingPost, setIsPublishingPost] = useState(false);

  const [paymentStudentId, setPaymentStudentId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('15000');
  const [paymentType, setPaymentType] = useState('Tuition');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState('teacher');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  const [newClassName, setNewClassName] = useState('');
  const [newClassLevel, setNewClassLevel] = useState('ابتدائي');
  const [isSubmittingClass, setIsSubmittingClass] = useState(false);

  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleCoeff, setNewModuleCoeff] = useState('1');
  const [isSubmittingModule, setIsSubmittingModule] = useState(false);

  const [enrollStudentName, setEnrollStudentName] = useState('');
  const [enrollClassId, setEnrollClassId] = useState('');
  const [enrollAmount, setEnrollAmount] = useState('15000');
  const [isSubmittingEnrollment, setIsSubmittingEnrollment] = useState(false);

  // Groups State
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedClassForGroup, setSelectedClassForGroup] = useState('');
  const [newGroupCapacity, setNewGroupCapacity] = useState('30');
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);

  // Dossier Modals State
  const [selectedStudentForDossier, setSelectedStudentForDossier] = useState<any>(null);
  const [selectedTeacherForDossier, setSelectedTeacherForDossier] = useState<any>(null);
  const [teacherDossierInitialEdit, setTeacherDossierInitialEdit] = useState(false);

  const handleOpenTeacherDossier = (teacher: any) => {
    setTeacherDossierInitialEdit(false);
    setSelectedTeacherForDossier(teacher);
  };

  const handleEditTeacherDossier = (teacher: any) => {
    setTeacherDossierInitialEdit(true);
    setSelectedTeacherForDossier(teacher);
  };

  const handleDeleteTeacherCard = (teacher: any) => {
    const userId = teacher.user?._id || teacher._id;
    const fullName = `${teacher.user?.firstName || ''} ${teacher.user?.lastName || ''}`.trim() || 'الأستاذ';
    Alert.alert('تأكيد حذف الأستاذ', `هل أنت متأكد من حذف حساب وملف الأستاذ (${fullName}) نهائياً من المؤسسة؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف نهائي',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/api/admin/users/${userId}`);
            setTeachersList((prev) => prev.filter((t) => t._id !== teacher._id && t.user?._id !== userId));
            setSystemUsers((prev) => prev.filter((u) => u._id !== userId));
            Alert.alert('نجاح', `تم حذف حساب الأستاذ (${fullName}) بنجاح.`);
          } catch (err: any) {
            Alert.alert('خطأ', err.response?.data?.message || 'فشل حذف حساب الأستاذ');
          }
        },
      },
    ]);
  };

  // Student Directory States (Parity with Web Screenshots 1-5)
  const [studentClassFilter, setStudentClassFilter] = useState('');
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<any | null>(null);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<any | null>(null);
  const [selectedStudentForPrint, setSelectedStudentForPrint] = useState<any | null>(null);

  const handleDeleteStudentCard = (student: any) => {
    const userId = student.user?._id || student._id;
    const fullName = `${student.firstNameArabic || student.user?.firstName || ''} ${student.lastNameArabic || student.user?.lastName || ''}`.trim() || 'التلميذ';
    Alert.alert('تأكيد حذف التلميذ', `هل أنت متأكد من حذف حساب وملف التلميذ (${fullName}) نهائياً من المؤسسة؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف نهائي',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/api/admin/users/${userId}`);
            setStudentsList((prev) => prev.filter((s) => s._id !== student._id && s.user?._id !== userId));
            setSystemUsers((prev) => prev.filter((u) => u._id !== userId));
            Alert.alert('نجاح', `تم حذف حساب التلميذ (${fullName}) بنجاح.`);
          } catch (err: any) {
            Alert.alert('خطأ', err.response?.data?.message || 'فشل حذف حساب التلميذ');
          }
        },
      },
    ]);
  };

  // Branding Form State
  const [brandingSchoolNameAr, setBrandingSchoolNameAr] = useState('مدرسة حبر');
  const [brandingSchoolNameFr, setBrandingSchoolNameFr] = useState('Groupe scolaire Encre & Pastel');
  const [brandingSlogan, setBrandingSlogan] = useState('يا نشء أنت رجاؤنا');
  const [brandingAcademicYear, setBrandingAcademicYear] = useState('2026-2027');
  const [isSavingBranding, setIsSavingBranding] = useState(false);

  // Feed Comments & Interactions State
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

  // Edit Post State
  const [editingPost, setEditingPost] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isUpdatingPost, setIsUpdatingPost] = useState(false);

  /* ------------------------------------------------------------------ */
  /*  Primary Data Fetching                                             */
  /* ------------------------------------------------------------------ */

  const loadData = useCallback(async () => {
    try {
      const [
        statsRes,
        postsRes,
        usersRes,
        classesRes,
        teachersRes,
        studentsRes,
        modulesRes,
        docsRes,
        schedulesRes,
        backupsRes,
        requestsRes,
        reportedRes,
        auditRes,
        lessonsRes,
        groupsRes,
      ] = await Promise.all([
        apiClient.get('/api/admin/dashboard/stats').catch(() => ({ data: null })),
        apiClient.get('/api/posts').catch(() => ({ data: { posts: [] } })),
        apiClient.get('/api/admin/users').catch(() => ({ data: [] })),
        apiClient.get('/api/admin/classes').catch(() => ({ data: [] })),
        apiClient.get('/api/admin/teachers').catch(() => ({ data: [] })),
        apiClient.get('/api/admin/students').catch(() => ({ data: [] })),
        apiClient.get('/api/admin/modules').catch(() => ({ data: [] })),
        apiClient.get('/api/admin/documents').catch(() => ({ data: [] })),
        apiClient.get('/api/admin/schedules').catch(() => ({ data: [] })),
        apiClient.get('/api/backups').catch(() => ({ data: { backups: [] } })),
        apiClient.get('/api/administrative-requests').catch(() => ({ data: [] })),
        apiClient.get('/api/messages/reported').catch(() => ({ data: [] })),
        apiClient.get('/api/admin/login-audit').catch(() => ({ data: [] })),
        apiClient.get('/api/lessons').catch(() => ({ data: [] })),
        apiClient.get('/api/admin/groups').catch(() => ({ data: [] })),
      ]);

      let hasData = false;
      if (statsRes.data) {
        setStats(statsRes.data);
        hasData = true;
      }
      if (postsRes.data) {
        const pList = Array.isArray(postsRes.data) ? postsRes.data : (postsRes.data.posts || []);
        setPosts(pList);
        if (pList.length > 0) hasData = true;
      }
      if (usersRes.data) {
        const uList = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data.users || []);
        setSystemUsers(uList);
        if (uList.length > 0) hasData = true;
      }
      if (classesRes.data) {
        const cList = Array.isArray(classesRes.data) ? classesRes.data : (classesRes.data.classes || []);
        setClassesList(cList);
        if (cList.length > 0) hasData = true;
      }
      if (teachersRes.data) {
        const tList = Array.isArray(teachersRes.data) ? teachersRes.data : (teachersRes.data.teachers || []);
        setTeachersList(tList);
        if (tList.length > 0) hasData = true;
      }
      if (studentsRes.data) {
        const sList = Array.isArray(studentsRes.data) ? studentsRes.data : (studentsRes.data.students || []);
        setStudentsList(sList);
        if (sList.length > 0) hasData = true;
      }
      if (modulesRes.data) setModulesList(Array.isArray(modulesRes.data) ? modulesRes.data : (modulesRes.data.modules || []));
      if (groupsRes.data) setGroupsList(Array.isArray(groupsRes.data) ? groupsRes.data : (groupsRes.data.groups || []));
      if (docsRes.data) setDocumentsList(Array.isArray(docsRes.data) ? docsRes.data : (docsRes.data.documents || []));
      if (schedulesRes.data) setSchedulesList(Array.isArray(schedulesRes.data) ? schedulesRes.data : (schedulesRes.data.schedules || []));
      if (backupsRes.data) setBackupsList(backupsRes.data.backups || (Array.isArray(backupsRes.data) ? backupsRes.data : []));
      if (requestsRes.data) setAdminRequestsList(Array.isArray(requestsRes.data) ? requestsRes.data : (requestsRes.data.requests || []));
      if (reportedRes.data) setReportedMessagesList(Array.isArray(reportedRes.data) ? reportedRes.data : (reportedRes.data.reportedMessages || []));
      if (auditRes.data) setLoginAuditList(auditRes.data.logs || auditRes.data.loginLogs || (Array.isArray(auditRes.data) ? auditRes.data : []));
      if (lessonsRes.data) setLessonsList(Array.isArray(lessonsRes.data) ? lessonsRes.data : (lessonsRes.data.lessons || []));

      setConnectionError(!hasData);
    } catch (err: any) {
      console.warn('Load data warning:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  /* ------------------------------------------------------------------ */
  /*  Post Actions                                                      */
  /* ------------------------------------------------------------------ */

  const handleCreatePost = async () => {
    if (!postTitle.trim() || !postContent.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة عنوان ومحتوى المنشور');
      return;
    }
    setIsPublishingPost(true);
    try {
      const res = await apiClient.post('/api/posts', {
        title: postTitle.trim(),
        content: postContent.trim(),
        targetAudience: postTarget,
        isPinned: postIsPinned,
      });
      if (res.data?.post) setPosts((prev) => [res.data.post, ...prev]);
      setShowCreatePostModal(false);
      setPostTitle('');
      setPostContent('');
      setPostIsPinned(false);
      Alert.alert('نجاح', 'تم نشر الإعلان الرسمي بنجاح في المنصة.');
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل نشر الإعلان');
    } finally {
      setIsPublishingPost(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p._id !== postId) return p;
        const currentLikes = p.likes || [];
        const myId = user?.id || '';
        const hasLiked = currentLikes.includes(myId) || p.userReaction === 'like';
        const nextLikes = hasLiked
          ? currentLikes.filter((id: string) => id !== myId)
          : [...currentLikes, myId];
        const nextTotal = Math.max(0, (p.reactionCounts?.total || currentLikes.length) + (hasLiked ? -1 : 1));
        return {
          ...p,
          likes: nextLikes,
          userReaction: hasLiked ? undefined : 'like',
          reactionCounts: { total: nextTotal, like: nextTotal },
        };
      })
    );
    try {
      await apiClient.post(`/api/posts/${postId}/like`);
    } catch {
      loadData();
    }
  };

  const handleTogglePin = async (postId: string) => {
    try {
      const res = await apiClient.put(`/api/posts/${postId}/pin`);
      const updatedPin = res.data?.isPinned;
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, isPinned: updatedPin } : p))
      );
      Alert.alert('نجاح', updatedPin ? 'تم تثبيت المنشور في الواجهة' : 'تم إلغاء التثبيت');
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'تعذر تعديل التثبيت');
    }
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert('تأكيد الحذف', 'هل أنت متأكد من حذف هذا الإعلان نهائياً؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/api/posts/${postId}`);
            setPosts((prev) => prev.filter((p) => p._id !== postId));
            Alert.alert('نجاح', 'تم حذف المنشور بنجاح.');
          } catch (err: any) {
            Alert.alert('خطأ', err.response?.data?.message || 'تعذر حذف المنشور');
          }
        },
      },
    ]);
  };

  const handleOpenPostOptions = (postItem: any) => {
    Alert.alert('خيارات المنشور', postItem.title || 'إجراءات المنشور', [
      {
        text: 'تعديل المنشور',
        onPress: () => {
          setEditingPost(postItem);
          setEditTitle(postItem.title);
          setEditContent(postItem.content);
        },
      },
      {
        text: postItem.isPinned ? 'إلغاء التثبيت' : 'تثبيت في الواجهة',
        onPress: () => handleTogglePin(postItem._id),
      },
      {
        text: 'حذف المنشور',
        style: 'destructive',
        onPress: () => handleDeletePost(postItem._id),
      },
      { text: 'إلغاء', style: 'cancel' },
    ]);
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    setSubmittingComment((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await apiClient.post(`/api/posts/${postId}/comment`, { content: text });
      const newComment = res.data?.comment || {
        _id: Date.now().toString(),
        userName: `${user?.firstName} ${user?.lastName}`,
        userRole: user?.role,
        content: text,
        createdAt: new Date().toISOString(),
      };
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, comments: [...(p.comments || []), newComment] } : p))
      );
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل إرسال التعليق');
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Admin CRUD Operations                                             */
  /* ------------------------------------------------------------------ */

  const handleCreatePayment = async () => {
    if (!paymentAmount || isNaN(Number(paymentAmount))) {
      Alert.alert('تنبيه', 'يرجى إدخال مبلغ صحيح');
      return;
    }
    setIsSubmittingPayment(true);
    try {
      await apiClient.post('/api/admin/payments', {
        studentId: paymentStudentId || undefined,
        amount: Number(paymentAmount),
        type: paymentType,
        status: paymentStatus,
      });
      Alert.alert('نجاح', 'تم تسجيل الفاتورة المالية بنجاح.');
      setShowCreatePaymentModal(false);
      const res = await apiClient.get('/api/admin/dashboard/stats');
      setStats(res.data);
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل إنشاء الفاتورة');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleToggleUserActive = async (targetUser: any) => {
    try {
      const res = await apiClient.put(`/api/admin/users/${targetUser._id}/toggle`);
      const updatedStatus = res.data?.user?.isActive ?? !targetUser.isActive;
      setSystemUsers((prev) =>
        prev.map((u) => (u._id === targetUser._id ? { ...u, isActive: updatedStatus } : u))
      );
      Alert.alert('نجاح', updatedStatus ? 'تم تفعيل الحساب بنجاح' : 'تم تجميد الحساب');
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'تعذر تعديل حالة الحساب');
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    Alert.alert('تأكيد الحذف', `هل أنت متأكد من حذف حساب (${userName})؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/api/admin/users/${userId}`);
            setSystemUsers((prev) => prev.filter((u) => u._id !== userId));
            Alert.alert('نجاح', 'تم حذف الحساب بنجاح.');
          } catch (err: any) {
            Alert.alert('خطأ', err.response?.data?.message || 'فشل حذف الحساب');
          }
        },
      },
    ]);
  };

  const handleCreateUser = async () => {
    if (!newUserFirstName.trim() || !newUserLastName.trim() || !newUserEmail.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال الاسم والبريد الإلكتروني');
      return;
    }
    setIsSubmittingUser(true);
    try {
      const res = await apiClient.post('/api/admin/users', {
        firstName: newUserFirstName.trim(),
        lastName: newUserLastName.trim(),
        email: newUserEmail.trim(),
        phoneNumber: newUserPhone.trim(),
        role: newUserRole,
        password: newUserPassword.trim() || 'Password123!',
      });
      const created = res.data?.user || res.data;
      if (created?._id) setSystemUsers((prev) => [created, ...prev]);
      setShowCreateUserModal(false);
      setNewUserFirstName('');
      setNewUserLastName('');
      setNewUserEmail('');
      setNewUserPhone('');
      setNewUserPassword('');
      Alert.alert('نجاح', 'تم إنشاء الحساب بنجاح.');
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'تعذر إنشاء الحساب');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم القسم');
      return;
    }
    setIsSubmittingClass(true);
    try {
      const res = await apiClient.post('/api/admin/classes', {
        name: newClassName.trim(),
        level: newClassLevel,
      });
      const created = res.data?.class || res.data;
      if (created?._id) setClassesList((prev) => [created, ...prev]);
      setShowCreateClassModal(false);
      setNewClassName('');
      Alert.alert('نجاح', 'تم إنشاء القسم بنجاح.');
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل إنشاء القسم');
    } finally {
      setIsSubmittingClass(false);
    }
  };

  const handleDeleteClass = (classId: string, className: string) => {
    Alert.alert('تأكيد الحذف', `هل أنت متأكد من حذف القسم (${className})؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/api/admin/classes/${classId}`);
            setClassesList((prev) => prev.filter((c) => c._id !== classId));
            Alert.alert('نجاح', 'تم حذف القسم بنجاح.');
          } catch (err: any) {
            Alert.alert('خطأ', err.response?.data?.message || 'فشل حذف القسم');
          }
        },
      },
    ]);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !selectedClassForGroup) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم الفوج واختيار القسم');
      return;
    }
    setIsSubmittingGroup(true);
    try {
      await apiClient.post('/api/admin/groups', {
        name: newGroupName.trim(),
        classId: selectedClassForGroup,
        capacity: Number(newGroupCapacity) || 30,
      });
      setShowCreateGroupModal(false);
      setNewGroupName('');
      Alert.alert('نجاح', 'تم إنشاء الفوج الدراسي بنجاح.');
      const refetch = await apiClient.get('/api/admin/classes');
      setClassesList(refetch.data?.classes || refetch.data || []);
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل إنشاء الفوج');
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  const handleCreateEnrollment = async () => {
    if (!enrollStudentName.trim() || !enrollClassId) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم التلميذ واختيار القسم');
      return;
    }
    setIsSubmittingEnrollment(true);
    try {
      const parts = enrollStudentName.trim().split(' ');
      const fName = parts[0] || 'تلميذ';
      const lName = parts.slice(1).join(' ') || 'جديد';
      await apiClient.post('/api/admin/enrollment', {
        firstName: fName,
        lastName: lName,
        firstNameArabic: fName,
        lastNameArabic: lName,
        classId: enrollClassId,
        parentPhone: '0797060052',
        tuitionBaseAmount: Number(enrollAmount) || 15000,
        tuitionAmount: Number(enrollAmount) || 15000,
      });
      Alert.alert('نجاح', 'تم تسجيل ملف التلميذ واستخراج وصل التسجيل بنجاح.');
      setShowCreateEnrollmentModal(false);
      setEnrollStudentName('');
      const refetch = await apiClient.get('/api/admin/students');
      setStudentsList(refetch.data?.students || refetch.data || []);
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل تسجيل التلميذ');
    } finally {
      setIsSubmittingEnrollment(false);
    }
  };

  const handleSaveBranding = async () => {
    setIsSavingBranding(true);
    try {
      await apiClient.put('/api/school-settings', {
        schoolNameArabic: brandingSchoolNameAr,
        schoolNameFrench: brandingSchoolNameFr,
        slogan: brandingSlogan,
        academicYear: brandingAcademicYear,
      });
      Alert.alert('نجاح', 'تم حفظ وتطبيق الهوية البصرية بنجاح.');
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل حفظ الإعدادات');
    } finally {
      setIsSavingBranding(false);
    }
  };

  const handleExportExcel = (type: string) => {
    Alert.alert('تصدير Excel', `تم طلب استخراج وتنزيل تقرير (${type}) بصيغة XLSX من السيرفر.`, [
      { text: 'حسناً' },
    ]);
  };

  const handleCreateModule = async () => {
    if (!newModuleName.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم المادة');
      return;
    }
    setIsSubmittingModule(true);
    try {
      const res = await apiClient.post('/api/admin/modules', {
        name: newModuleName.trim(),
        coefficient: Number(newModuleCoeff) || 1,
      });
      const created = res.data?.module || res.data;
      if (created?._id) setModulesList((prev) => [created, ...prev]);
      setShowCreateModuleModal(false);
      setNewModuleName('');
      Alert.alert('نجاح', 'تمت إضافة المادة الدراسية بنجاح.');
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل إضافة المادة');
    } finally {
      setIsSubmittingModule(false);
    }
  };

  const handleDeleteModule = (moduleId: string) => {
    Alert.alert('تأكيد الحذف', 'هل أنت متأكد من حذف هذه المادة؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/api/admin/modules/${moduleId}`);
            setModulesList((prev) => prev.filter((m) => m._id !== moduleId));
            Alert.alert('نجاح', 'تم حذف المادة الدراسية بنجاح.');
          } catch (err: any) {
            Alert.alert('خطأ', err.response?.data?.message || 'فشل حذف المادة');
          }
        },
      },
    ]);
  };

  const handleCreateBackup = async () => {
    Alert.alert('النسخ الاحتياطي', 'جاري تشغيل عملية النسخ الاحتياطي وتشفير قاعدة البيانات...', [
      {
        text: 'بدء النسخ',
        onPress: async () => {
          try {
            const res = await apiClient.post('/api/backups/create');
            Alert.alert('نجاح', 'تم إنشاء النسخة الاحتياطية وتشفيرها (AES-256-CBC) بنجاح.');
            const refetch = await apiClient.get('/api/backups');
            setBackupsList(refetch.data?.backups || []);
          } catch (err: any) {
            Alert.alert('خطأ', err.response?.data?.message || 'تعذر إتمام النسخ');
          }
        },
      },
      { text: 'إلغاء', style: 'cancel' },
    ]);
  };

  const handleUpdateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      await apiClient.put(`/api/administrative-requests/${requestId}`, { status: newStatus });
      setAdminRequestsList((prev) =>
        prev.map((r) => (r._id === requestId ? { ...r, status: newStatus } : r))
      );
      Alert.alert('نجاح', `تم تحديث حالة الطلب إلى: ${newStatus}`);
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل تحديث الطلب');
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Filter Helpers                                                    */
  /* ------------------------------------------------------------------ */

  const filteredUsers = useMemo(() => {
    return systemUsers.filter((u) => {
      const matchSearch =
        !userSearch.trim() ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.phoneNumber || '').includes(userSearch);
      const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      return matchSearch && matchRole;
    });
  }, [systemUsers, userSearch, userRoleFilter]);

  const filteredStudents = useMemo(() => {
    return studentsList.filter((s) => {
      const fName = s.firstNameArabic || s.user?.firstName || '';
      const lName = s.lastNameArabic || s.user?.lastName || '';
      const name = `${fName} ${lName}`.toLowerCase();
      const email = (s.user?.email || '').toLowerCase();
      const regNum = (s.registrationNumber || '').toLowerCase();
      const parentName = `${s.parent?.user?.firstName || ''} ${s.parent?.user?.lastName || ''}`.toLowerCase();
      const parentPhone = (s.parent?.user?.phoneNumber || s.user?.phoneNumber || '').toLowerCase();
      const search = studentSearch.trim().toLowerCase();

      const matchesSearch =
        !search ||
        name.includes(search) ||
        email.includes(search) ||
        regNum.includes(search) ||
        parentName.includes(search) ||
        parentPhone.includes(search);

      const matchesClass =
        !studentClassFilter ||
        (s.class?._id || s.class) === studentClassFilter;

      return matchesSearch && matchesClass;
    });
  }, [studentsList, studentSearch, studentClassFilter]);

  const filteredTeachers = useMemo(() => {
    return teachersList.filter((teacher) => {
      const pStatus = teacher.professionalStatus || (teacher.user?.isActive ? 'active' : 'inactive');
      if (teacherStatusFilter !== 'all' && pStatus !== teacherStatusFilter) return false;
      if (!teacherSearch.trim()) return true;
      const q = teacherSearch.trim().toLowerCase();
      const fullName = `${teacher.user?.firstName || ''} ${teacher.user?.lastName || ''}`.toLowerCase();
      const phone = (teacher.user?.phoneNumber || teacher.user?.username || '').toLowerCase();
      const email = (teacher.user?.email || '').toLowerCase();
      const subjects = (teacher.subjects || []).join(' ').toLowerCase();
      const specialization = (teacher.specialization || '').toLowerCase();
      return (
        fullName.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        subjects.includes(q) ||
        specialization.includes(q)
      );
    });
  }, [teachersList, teacherSearch, teacherStatusFilter]);

  const timeAgo = (dateStr?: string) => {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'الآن';
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `منذ ${days} يوم`;
    return new Date(dateStr).toLocaleDateString('ar-DZ', { day: '2-digit', month: 'short' });
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'مدير النظام';
      case 'school':
        return 'الإدارة العامة';
      case 'teacher':
        return 'أستاذ(ة)';
      case 'general_supervisor':
        return 'مراقب عام';
      case 'pedagogical_supervisor':
        return 'مراقب تربوي';
      case 'receptionist':
        return 'موظف استقبال';
      case 'student':
        return 'تلميذ';
      case 'parent':
        return 'ولي أمر';
      default:
        return role || 'مستخدم';
    }
  };

  const getActiveRouteTitle = () => {
    const item = ADMIN_NAV_ITEMS.find((n) => n.id === currentRoute);
    return item ? item.label : 'لوحة القيادة والمؤشرات';
  };

  /* ================================================================== */
  /*  RENDER                                                            */
  /* ================================================================== */

  return (
    <View style={styles.container}>
      {/* ---------------------------------------------------------------- */}
      {/* 1. Header with Web Parity (Hamburger + Logo + Title + Year | Bell + Avatar) */}
      {/* ---------------------------------------------------------------- */}
      <DashboardHeader onOpenDrawer={() => setIsDrawerOpen(true)} />

      {/* Connection Error Banner (if backend is unreachable) */}
      {connectionError && (
        <View style={styles.connectionErrorBanner}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flex: 1 }}>
            <AlertCircle size={20} color="#DC2626" />
            <View style={{ flex: 1 }}>
              <Text style={styles.connectionErrorTitle}>تعذر الاتصال بقاعدة البيانات</Text>
              <Text style={styles.connectionErrorSub} numberOfLines={1}>
                الخادم: {API_BASE_URL}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.connectionRetryBtn} onPress={loadData} activeOpacity={0.8}>
            <RefreshCw size={14} color="#FFFFFF" />
            <Text style={styles.connectionRetryText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Active Route Indicator (when navigating from side drawer) */}
      {currentRoute !== 'overview' && currentRoute !== 'feed' && (
        <View style={styles.activeRouteSubHeader}>
          <Text style={styles.activeRouteSubText}>{getActiveRouteTitle()}</Text>
          <TouchableOpacity
            onPress={() => setCurrentRoute('overview')}
            style={styles.backToOverviewBtn}
          >
            <Text style={styles.backToOverviewText}>العودة للرئيسية</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* 2. Side Navigation Drawer                                        */}
      {/* ---------------------------------------------------------------- */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeId={currentRoute}
        onSelect={(id) => setCurrentRoute(id)}
      />

      {/* ---------------------------------------------------------------- */}
      {/* 3. Main Views corresponding to the selected Route                */}
      {/* ---------------------------------------------------------------- */}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand[500]} />
          <Text style={styles.loadingText}>جاري مزامنة بيانات المؤسسة من السيرفر...</Text>
        </View>
      ) : currentRoute === 'feed' ? (
        <View style={{ flex: 1 }}>
          <View style={styles.activeRouteSubHeader}>
            <TouchableOpacity
              style={styles.backToOverviewBtn}
              onPress={() => setCurrentRoute('overview')}
            >
              <Text style={styles.backToOverviewText}>← العودة للرئيسية</Text>
            </TouchableOpacity>
            <Text style={styles.activeRouteSubText}>فضاء التواصل والشبكة المدرسية</Text>
          </View>
          <SchoolFeedView />
        </View>
      ) : currentRoute === 'chat' ? (
        <View style={{ flex: 1 }}>
          <View style={styles.activeRouteSubHeader}>
            <TouchableOpacity
              style={styles.backToOverviewBtn}
              onPress={() => setCurrentRoute('overview')}
            >
              <Text style={styles.backToOverviewText}>← العودة للرئيسية</Text>
            </TouchableOpacity>
            <Text style={styles.activeRouteSubText}>الرسائل والمحادثات المباشرة</Text>
          </View>
          <ConversationView onBackToOverview={() => setCurrentRoute('overview')} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.brand[500]]}
            />
          }
        >
          {/* ============================================================ */}
          {/* ROUTE 2: OVERVIEW (لوحة القيادة والمؤشرات)                    */}
          {/* ============================================================ */}
          {/* ============================================================ */}
          {/* ROUTE 2: OVERVIEW (لوحة القيادة والمؤشرات)                    */}
          {/* ============================================================ */}
          {currentRoute === 'overview' && (
            <View style={styles.overviewContainer}>
              {/* 3 Quick Action Banners */}
              <View style={styles.quickBannersGroup}>
                {/* 1. Login & Security Audit Trail */}
                <TouchableOpacity
                  style={[styles.quickBannerCard, { borderColor: 'rgba(123, 30, 58, 0.25)' }]}
                  onPress={() => setCurrentRoute('login-audit')}
                  activeOpacity={0.85}
                >
                  <View style={styles.quickBannerTop}>
                    <View style={[styles.quickBannerIconBg, { backgroundColor: theme.colors.brand[500] }]}>
                      <ShieldCheck size={22} color={theme.colors.gold[500]} />
                    </View>
                    <View style={styles.quickBannerPill}>
                      <Text style={styles.quickBannerPillText}>أمان وحماية</Text>
                    </View>
                  </View>
                  <Text style={styles.quickBannerTitle}>سجل جلسات الدخول والأمان</Text>
                  <Text style={styles.quickBannerDesc}>
                    متابعة سجلات تسجيل الدخول، رصد المحاولات الفاشلة، الأجهزة والمتصفحات، وإلغاء حظر الحسابات المقفلة.
                  </Text>
                  <View style={styles.quickBannerFooter}>
                    <Text style={styles.quickBannerLinkText}>فتح السجل والمتابعة</Text>
                    <Text style={styles.quickBannerArrow}>←</Text>
                  </View>
                </TouchableOpacity>

                {/* 2. School Inscriptions & Receipts */}
                <TouchableOpacity
                  style={[styles.quickBannerCard, { borderColor: 'rgba(201, 162, 77, 0.40)' }]}
                  onPress={() => setCurrentRoute('inscriptions')}
                  activeOpacity={0.85}
                >
                  <View style={styles.quickBannerTop}>
                    <View style={[styles.quickBannerIconBg, { backgroundColor: theme.colors.gold[500] }]}>
                      <FileText size={22} color="#FFFFFF" />
                    </View>
                    <View style={[styles.quickBannerPill, { backgroundColor: 'rgba(201, 162, 77, 0.15)', borderColor: 'rgba(201, 162, 77, 0.30)' }]}>
                      <Text style={[styles.quickBannerPillText, { color: theme.colors.brand[500] }]}>تسجيلات رسمية</Text>
                    </View>
                  </View>
                  <Text style={styles.quickBannerTitle}>التسجيلات واستخراج الوصولات</Text>
                  <Text style={styles.quickBannerDesc}>
                    تسجيل التلاميذ باستمارة أو Excel، استخراج وصل التسجيل الفوري، وتوليد وحفظ وطباعة الملف المدرسي الشامل.
                  </Text>
                  <View style={styles.quickBannerFooter}>
                    <Text style={styles.quickBannerLinkText}>إدارة التسجيلات والوصولات</Text>
                    <Text style={styles.quickBannerArrow}>←</Text>
                  </View>
                </TouchableOpacity>

                {/* 3. Reported Messages Moderation */}
                <TouchableOpacity
                  style={[styles.quickBannerCard, { borderColor: '#FECDD3' }]}
                  onPress={() => setCurrentRoute('reported-messages')}
                  activeOpacity={0.85}
                >
                  <View style={styles.quickBannerTop}>
                    <View style={[styles.quickBannerIconBg, { backgroundColor: '#E11D48' }]}>
                      <ShieldAlert size={22} color="#FFFFFF" />
                    </View>
                    <View style={[styles.quickBannerPill, { backgroundColor: '#FFE4E6', borderColor: '#FECDD3' }]}>
                      <Text style={[styles.quickBannerPillText, { color: '#BE123C' }]}>بلاغات وانضباط</Text>
                    </View>
                  </View>
                  <Text style={styles.quickBannerTitle}>الرسائل والمحادثات المبلغ عنها</Text>
                  <Text style={styles.quickBannerDesc}>
                    مراجعة البلاغات الواردة من المستخدمين حول الرسائل والمحادثات المخالفة واتخاذ إجراء الحذف أو الإخفاء.
                  </Text>
                  <View style={styles.quickBannerFooter}>
                    <Text style={styles.quickBannerLinkText}>معالجة البلاغات الإدارية</Text>
                    <Text style={styles.quickBannerArrow}>←</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* 5 Daily Operational KPIs (Row 2) */}
              <View style={styles.kpiRow}>
                {/* 1. Absences */}
                <View style={styles.kpiCard}>
                  <View style={styles.kpiHeader}>
                    <Text style={[styles.kpiLabel, { color: '#BE123C' }]}>الغيابات اليومية</Text>
                    <ShieldAlert size={16} color="#E11D48" />
                  </View>
                  <Text style={[styles.kpiValue, { color: '#BE123C' }]}>
                    {stats?.todayAbsences ?? 0}
                  </Text>
                  <Text style={styles.kpiSub}>غيابات التلاميذ المسجلة اليوم</Text>
                </View>

                {/* 2. Lates */}
                <View style={styles.kpiCard}>
                  <View style={styles.kpiHeader}>
                    <Text style={[styles.kpiLabel, { color: '#B45309' }]}>التأخرات المسجلة</Text>
                    <Calendar size={16} color="#D97706" />
                  </View>
                  <Text style={[styles.kpiValue, { color: '#D97706' }]}>
                    {stats?.todayLates ?? 0}
                  </Text>
                  <Text style={styles.kpiSub}>تأخرات بحاجة إلى تبرير</Text>
                </View>

                {/* 3. New Registrations */}
                <View style={styles.kpiCard}>
                  <View style={styles.kpiHeader}>
                    <Text style={[styles.kpiLabel, { color: '#047857' }]}>التسجيلات الجديدة</Text>
                    <GraduationCap size={16} color="#059669" />
                  </View>
                  <Text style={[styles.kpiValue, { color: '#059669' }]}>
                    {stats?.newRegistrations ?? stats?.students ?? 0}
                  </Text>
                  <Text style={styles.kpiSub}>ملفات التسجيل المكتملة</Text>
                </View>

                {/* 4. Unread Messages */}
                <View style={styles.kpiCard}>
                  <View style={styles.kpiHeader}>
                    <Text style={[styles.kpiLabel, { color: theme.colors.brand[500] }]}>رسائل الإدارة غير المقروءة</Text>
                    <MessageSquare size={16} color={theme.colors.brand[500]} />
                  </View>
                  <Text style={[styles.kpiValue, { color: theme.colors.brand[500] }]}>
                    {stats?.unreadAdminMessages ?? 0}
                  </Text>
                  <Text style={styles.kpiSub}>مرسلة للإدارة ولم تُستعرض</Text>
                </View>

                {/* 5. Received Requests */}
                <View style={[styles.kpiCard, styles.kpiCardFull]}>
                  <View style={styles.kpiHeader}>
                    <Text style={[styles.kpiLabel, { color: '#1D4ED8' }]}>الطلبات الإدارية المستلمة</Text>
                    <FileText size={16} color="#2563EB" />
                  </View>
                  <Text style={[styles.kpiValue, { color: '#1D4ED8' }]}>
                    {stats?.receivedRequests ?? 0}
                  </Text>
                  <Text style={styles.kpiSub}>شهادات ومبررات قيد المعالجة</Text>
                </View>
              </View>

              {/* 4 Global Counts (Row 3) */}
              <View style={styles.globalCountsRow}>
                {/* 1. Students */}
                <View style={styles.countCard}>
                  <View style={styles.countTextGroup}>
                    <Text style={styles.countLabel}>إجمالي التلاميذ</Text>
                    <Text style={styles.countValue}>{stats?.students ?? 0}</Text>
                  </View>
                  <View style={styles.countIconBg}>
                    <Users size={22} color={theme.colors.brand[500]} />
                  </View>
                </View>

                {/* 2. Teachers */}
                <View style={styles.countCard}>
                  <View style={styles.countTextGroup}>
                    <Text style={styles.countLabel}>إجمالي الأساتذة</Text>
                    <Text style={styles.countValue}>{stats?.teachers ?? 0}</Text>
                  </View>
                  <View style={styles.countIconBg}>
                    <Users size={22} color={theme.colors.brand[500]} />
                  </View>
                </View>

                {/* 3. Classes */}
                <View style={styles.countCard}>
                  <View style={styles.countTextGroup}>
                    <Text style={styles.countLabel}>الأقسام الدراسية</Text>
                    <Text style={styles.countValue}>{stats?.classes ?? 0}</Text>
                  </View>
                  <View style={styles.countIconBg}>
                    <BookOpen size={22} color={theme.colors.brand[500]} />
                  </View>
                </View>

                {/* 4. Total Revenue */}
                <View style={styles.countCard}>
                  <View style={styles.countTextGroup}>
                    <Text style={styles.countLabel}>مجموع المداخيل</Text>
                    <Text style={[styles.countValue, { color: '#059669' }]}>
                      {stats?.totalRevenue ? `${stats.totalRevenue.toLocaleString()} دج` : '0 دج'}
                    </Text>
                  </View>
                  <View style={[styles.countIconBg, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                    <CreditCard size={22} color="#059669" />
                  </View>
                </View>
              </View>

              {/* Financial Transactions Hub (Section 4) */}
              <View style={styles.financeHubCard}>
                <View style={styles.financeHubHeader}>
                  <Text style={styles.financeHubTitle}>آخر المعاملات المالية المنجزة</Text>
                  <View style={styles.financeHubBtns}>
                    <TouchableOpacity
                      style={styles.exportExcelBtn}
                      onPress={() => handleExportExcel('المالية والمعاملات')}
                    >
                      <Download size={13} color="#059669" />
                      <Text style={styles.exportExcelBtnText}>تصدير Excel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.addInvoiceBtn}
                      onPress={() => setShowCreatePaymentModal(true)}
                    >
                      <Plus size={14} color="#FFFFFF" />
                      <Text style={styles.addInvoiceBtnText}>إنشاء فاتورة جديدة</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Table with horizontal scroll */}
                <Text style={styles.swipeHintText}>↔ اسحب الجدول أفقياً للاطلاع على كافة الأعمدة والبيانات</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableScrollContent}>
                  <View style={styles.tableWrapper}>
                    {/* Table Header Row */}
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.thCol, { width: 175 }]}>رقم العملية</Text>
                      <Text style={[styles.thCol, { width: 135 }]}>التلميذ المستفيد</Text>
                      <Text style={[styles.thCol, { width: 105 }]}>المبلغ المستحق</Text>
                      <Text style={[styles.thCol, { width: 120 }]}>الخدمة المسددة</Text>
                      <Text style={[styles.thCol, { width: 95, textAlign: 'center' }]}>حالة الدفع</Text>
                    </View>

                    {/* Table Rows */}
                    {stats?.recentPayments && stats.recentPayments.length > 0 ? (
                      stats.recentPayments.map((pay: any) => {
                        const studentName = pay.student?.user
                          ? `${pay.student.user.firstName} ${pay.student.user.lastName}`
                          : 'تلميذ مقيد';
                        const isPaid = pay.status === 'Paid';
                        const typeLabel =
                          pay.type === 'Tuition'
                            ? 'رسوم التمدرس'
                            : pay.type === 'Transport'
                            ? 'النقل المدرسي'
                            : pay.type === 'Lunch'
                            ? 'الإطعام المدرسي'
                            : pay.type;

                        return (
                          <View key={pay._id} style={styles.tableDataRow}>
                            <Text style={[styles.tdColId, { width: 175 }]} numberOfLines={1}>
                              {pay._id}
                            </Text>
                            <Text style={[styles.tdColStudent, { width: 135 }]} numberOfLines={1}>
                              {studentName}
                            </Text>
                            <Text style={[styles.tdColAmount, { width: 105 }]}>
                              {pay.amount} دج
                            </Text>
                            <Text style={[styles.tdColService, { width: 120 }]} numberOfLines={1}>
                              {typeLabel}
                            </Text>
                            <View style={[styles.tdColStatus, { width: 95 }]}>
                              <View
                                style={[
                                  styles.statusPill,
                                  isPaid ? styles.statusPillPaid : styles.statusPillPending,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.statusPillText,
                                    isPaid ? styles.statusPillPaidText : styles.statusPillPendingText,
                                  ]}
                                >
                                  {isPaid ? 'مسددة' : 'قيد الانتظار'}
                                </Text>
                              </View>
                            </View>
                          </View>
                        );
                      })
                    ) : (
                      <View style={styles.tableEmptyBox}>
                        <Text style={styles.noDataText}>لا توجد معاملات مالية مسجلة حالياً.</Text>
                      </View>
                    )}
                  </View>
                </ScrollView>
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* ROUTE 3: USERS & ACCOUNTS (المستخدمين والصلاحيات)              */}
          {/* ============================================================ */}
          {(currentRoute === 'users' || currentRoute === 'accounts' || currentRoute === 'register') && (
            <AdminAccountsView
              systemUsers={systemUsers}
              classesList={classesList}
              groupsList={groupsList}
              modulesList={modulesList}
              studentsList={studentsList}
              teachersList={teachersList}
              onRefreshData={loadData}
              onOpenTeacherDossier={(t) => handleOpenTeacherDossier(t)}
              onOpenStudentDossier={(s) => setSelectedStudentForDossier(s)}
            />
          )}

          {/* ============================================================ */}
          {/* ROUTE 4: TEACHERS (دليل الأساتذة والموظفين - المادة 23)        */}
          {/* ============================================================ */}
          {currentRoute === 'teachers' && (
            <View style={styles.teachersMainContainer}>
              {/* 1. Header Card with Titles and Actions */}
              <View style={styles.teachersHeaderCard}>
                <View style={styles.teachersHeaderTop}>
                  <View style={styles.teachersHeaderTitleWrap}>
                    <View style={styles.teachersHeaderIconBox}>
                      <Users size={22} color={theme.colors.brand[500]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.teachersHeaderTitle}>
                        دليل الأساتذة والموظفين - الملفات المهنية (المادة 23)
                      </Text>
                      <Text style={styles.teachersHeaderSubtitle}>
                        الفصل التاسع: ملفات الأساتذة والموظفين • الربط التلقائي بالأقسام والأفواج • سجل التدقيق الإداري
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons Row */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.teachersActionButtonsRow}
                >
                  <TouchableOpacity
                    style={styles.teacherBtnImport}
                    onPress={() => {
                      Alert.alert(
                        'استيراد أساتذة عبر Excel',
                        'يمكن استيراد ملفات Excel وتحديث قاعدة بيانات الأساتذة وربطهم بالأقسام والأفواج تلقائياً وفق المادة 23.',
                        [
                          { text: 'إلغاء', style: 'cancel' },
                          {
                            text: 'تحميل النموذج',
                            onPress: () => handleExportExcel('نموذج استيراد الأساتذة'),
                          },
                        ]
                      );
                    }}
                    activeOpacity={0.85}
                  >
                    <Upload size={14} color="#C9A24D" />
                    <Text style={styles.teacherBtnImportText}>
                      استيراد أساتذة عبر Excel (ربط الأقسام والأفواج)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.teacherBtnExportExcel}
                    onPress={() => handleExportExcel('هيئة التدريس - المادة 23')}
                    activeOpacity={0.85}
                  >
                    <Download size={14} color="#059669" />
                    <Text style={styles.teacherBtnExportExcelText}>
                      تصدير Excel (المادة 23)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.teacherBtnExportParents}
                    onPress={() => handleExportExcel('أولياء الأمور')}
                    activeOpacity={0.85}
                  >
                    <Download size={14} color="#475569" />
                    <Text style={styles.teacherBtnExportParentsText}>
                      تصدير أولياء الأمور
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>

              {/* 2. Search and Status Filter Section */}
              <View style={styles.teachersFilterCard}>
                <View style={styles.teachersSearchBar}>
                  <Search size={16} color={theme.colors.text.muted} />
                  <TextInput
                    style={styles.teachersSearchInput}
                    placeholder="البحث عن أستاذ بالاسم، رقم الهاتف، المادة أو البريد الإلكتروني..."
                    placeholderTextColor={theme.colors.text.subtle}
                    value={teacherSearch}
                    onChangeText={setTeacherSearch}
                  />
                  {teacherSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setTeacherSearch('')}>
                      <X size={16} color={theme.colors.text.muted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Status Chips Selector */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.teacherStatusChipsRow}
                >
                  {[
                    { id: 'all', label: 'جميع الحالات المهنية' },
                    { id: 'active', label: 'نشط (Active)' },
                    { id: 'suspended', label: 'موقوف مؤقتاً' },
                    { id: 'resigned', label: 'مستقيل' },
                    { id: 'terminated', label: 'منتهية العلاقة' },
                  ].map((filter) => {
                    const isActive = teacherStatusFilter === filter.id;
                    return (
                      <TouchableOpacity
                        key={filter.id}
                        style={[
                          styles.teacherStatusChip,
                          isActive && styles.teacherStatusChipActive,
                        ]}
                        onPress={() => setTeacherStatusFilter(filter.id)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.teacherStatusChipText,
                            isActive && styles.teacherStatusChipTextActive,
                          ]}
                        >
                          {filter.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* 3. Teacher Cards List matching Web Design */}
              <View style={styles.teachersGridList}>
                {filteredTeachers.length > 0 ? (
                  filteredTeachers.map((teacher) => {
                    const firstName = teacher.user?.firstName || '';
                    const lastName = teacher.user?.lastName || '';
                    const fullName = `${firstName} ${lastName}`.trim() || 'أستاذ';
                    const initials = `${firstName[0] || ''}${lastName[0] || ''}` || 'أس';
                    const email = teacher.user?.email || 'teacher@ecole-zitouni.dz';
                    const phone = teacher.user?.phoneNumber || teacher.user?.username || '—';
                    const subjects = teacher.specialization || (teacher.subjects || []).join('، ') || 'غير محدد';
                    const cycleLabel =
                      teacher.cycle === 'middle'
                        ? 'متوسط'
                        : teacher.cycle === 'secondary'
                        ? 'ثانوي'
                        : 'ابتدائي';
                    const pStatus =
                      teacher.professionalStatus || (teacher.user?.isActive ? 'active' : 'inactive');

                    const isStatusActive = pStatus === 'active';
                    const isStatusSuspended = pStatus === 'suspended';
                    const isStatusResigned = pStatus === 'resigned';
                    const isStatusTerminated = pStatus === 'terminated';

                    const statusBadgeStyle = isStatusActive
                      ? styles.tStatusBadgeActive
                      : isStatusSuspended
                      ? styles.tStatusBadgeSuspended
                      : isStatusResigned
                      ? styles.tStatusBadgeResigned
                      : styles.tStatusBadgeTerminated;

                    const statusTextStyle = isStatusActive
                      ? styles.tStatusTextActive
                      : isStatusSuspended
                      ? styles.tStatusTextSuspended
                      : isStatusResigned
                      ? styles.tStatusTextResigned
                      : styles.tStatusTextTerminated;

                    const statusArabicLabel =
                      pStatus === 'active'
                        ? 'نشط'
                        : pStatus === 'suspended'
                        ? 'موقوف مؤقتاً'
                        : pStatus === 'resigned'
                        ? 'مستقيل'
                        : pStatus === 'terminated'
                        ? 'منتهية العلاقة'
                        : teacher.user?.isActive
                        ? 'نشط'
                        : 'معطّل';

                    return (
                      <View key={teacher._id} style={styles.teacherCard}>
                        {/* Card Header (RTL: Avatar + Name on Right, Badge on Left) */}
                        <View style={styles.teacherCardHeader}>
                          {/* Left: Status Badge */}
                          <View style={[styles.tStatusBadgePill, statusBadgeStyle]}>
                            <Text style={[styles.tStatusBadgeText, statusTextStyle]}>
                              {statusArabicLabel}
                            </Text>
                          </View>

                          {/* Right: Avatar + User info */}
                          <View style={styles.teacherCardUserGroup}>
                            <View style={styles.teacherCardTextInfo}>
                              <Text style={styles.teacherCardName}>{fullName}</Text>
                              <Text style={styles.teacherCardEmail} numberOfLines={1}>
                                {email}
                              </Text>
                            </View>
                            <View style={styles.teacherInitialsAvatar}>
                              <Text style={styles.teacherInitialsText}>{initials}</Text>
                            </View>
                          </View>
                        </View>

                        {/* Card Body - Details with Clean Typography */}
                        <View style={styles.teacherCardBody}>
                          {/* Specialization / Subject */}
                          <View style={styles.teacherDetailRow}>
                            <Text style={styles.teacherDetailLabel}>التخصص / المادة:</Text>
                            <Text style={styles.teacherDetailValueSubject} numberOfLines={2}>
                              {subjects}
                            </Text>
                          </View>

                          {/* Educational Stage / Cycle */}
                          <View style={styles.teacherDetailRow}>
                            <Text style={styles.teacherDetailLabel}>الطور التعليمي:</Text>
                            <Text style={styles.teacherDetailValueCycle}>{cycleLabel}</Text>
                          </View>

                          {/* Assigned Classes */}
                          <View style={styles.teacherClassesRow}>
                            <Text style={styles.teacherDetailLabel}>الأقسام المسندة (كلاسته):</Text>
                            <View style={styles.teacherBadgesGroup}>
                              {teacher.classes && teacher.classes.length > 0 ? (
                                teacher.classes.map((c: any) => (
                                  <View key={c._id || c} style={styles.teacherClassBadge}>
                                    <Text style={styles.teacherClassBadgeText}>
                                      {c.name || c}
                                    </Text>
                                  </View>
                                ))
                              ) : (
                                <Text style={styles.teacherNoneText}>لا يوجد</Text>
                              )}
                            </View>
                          </View>

                          {/* Assigned Groups */}
                          <View style={styles.teacherClassesRow}>
                            <Text style={styles.teacherDetailLabel}>الأفواج المسندة (أفواجه):</Text>
                            <View style={styles.teacherBadgesGroup}>
                              {teacher.groups && teacher.groups.length > 0 ? (
                                teacher.groups.map((g: any) => (
                                  <View key={g._id || g} style={styles.teacherGroupBadge}>
                                    <Text style={styles.teacherGroupBadgeText}>
                                      {g.name || g}
                                    </Text>
                                  </View>
                                ))
                              ) : (
                                <Text style={styles.teacherNoneText}>لا يوجد</Text>
                              )}
                            </View>
                          </View>

                          {/* Phone Number */}
                          <View style={styles.teacherDetailRow}>
                            <Text style={styles.teacherDetailLabel}>الهاتف:</Text>
                            <Text style={styles.teacherDetailValuePhone}>{phone}</Text>
                          </View>
                        </View>

                        {/* Card Footer Actions */}
                        <View style={styles.teacherCardFooter}>
                          <View style={styles.teacherCardSmallBtns}>
                            <TouchableOpacity
                              style={styles.teacherTrashBtn}
                              onPress={() => handleDeleteTeacherCard(teacher)}
                              activeOpacity={0.7}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Trash2 size={16} color="#EF4444" />
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.teacherEditBtn}
                              onPress={() => handleEditTeacherDossier(teacher)}
                              activeOpacity={0.7}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Edit3 size={16} color="#475569" />
                            </TouchableOpacity>
                          </View>

                          <TouchableOpacity
                            style={styles.teacherDossierBtn}
                            onPress={() => handleOpenTeacherDossier(teacher)}
                            activeOpacity={0.7}
                          >
                            <FileText size={15} color="#C9A24D" />
                            <Text style={styles.teacherDossierBtnText}>
                              الملف المهني (المادة 23)
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.teacherEmptyState}>
                    <Search size={32} color={theme.colors.text.muted} />
                    <Text style={styles.teacherEmptyTitle}>لا يوجد أساتذة يطابقون نتيجة البحث</Text>
                    <Text style={styles.teacherEmptySubtitle}>
                      {teacherSearch
                        ? `لم يتم العثور على نتائج تطابق «${teacherSearch}».`
                        : 'لا توجد بيانات أساتذة مسجلة في هذه الفئة حالياً.'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* ROUTE 5: STUDENTS (دليل التلاميذ والطلاب - Full Parity)      */}
          {/* ============================================================ */}
          {currentRoute === 'students' && (
            <View style={styles.teachersMainContainer}>
              {/* Header Card (Matching Screenshot 1) */}
              <View style={styles.teachersHeaderCard}>
                <View style={styles.teachersHeaderTop}>
                  <View style={styles.teachersHeaderTitleWrap}>
                    <View style={[styles.teachersHeaderIconBox, { backgroundColor: '#F3E9DC', borderColor: '#C9A24D' }]}>
                      <Users size={22} color="#7B1E3A" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.teachersHeaderTitle}>
                        دليل التلاميذ والطلاب
                      </Text>
                      <Text style={styles.teachersHeaderSubtitle}>
                        إجمالي التلاميذ المسجلين في قاعدة البيانات: {studentsList.length} تلميذ • الأقسام والأفواج
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Top Action Buttons (Matching Screenshot 1) */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.teachersActionButtonsRow}
                >
                  <TouchableOpacity
                    style={styles.studentBtnExportExcel}
                    onPress={() => handleExportExcel('سجل التلاميذ')}
                    activeOpacity={0.85}
                  >
                    <Download size={14} color="#059669" />
                    <Text style={styles.studentBtnExportExcelText}>تصدير Excel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.studentBtnImportStory}
                    onPress={() => setShowCreateEnrollmentModal(true)}
                    activeOpacity={0.85}
                  >
                    <FileText size={14} color="#FFFFFF" />
                    <Text style={styles.studentBtnImportStoryText}>
                      استيراد نموذج الرقمنة (School Story)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.studentBtnImportNormal}
                    onPress={() =>
                      Alert.alert(
                        'استيراد عادي',
                        'يمكنك إدراج التلاميذ عبر استيراد ملف Excel أو التسجيل المباشر من لوحة التحكم.',
                        [
                          { text: 'تسجيل تلميذ جديد', onPress: () => setShowCreateEnrollmentModal(true) },
                          { text: 'إلغاء', style: 'cancel' },
                        ]
                      )
                    }
                    activeOpacity={0.85}
                  >
                    <Upload size={14} color="#7B1E3A" />
                    <Text style={styles.studentBtnImportNormalText}>استيراد عادي</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>

              {/* Search & Filter Bar (Matching Screenshot 1) */}
              <View style={styles.teachersFilterCard}>
                {/* Search Bar */}
                <View style={styles.teachersSearchBar}>
                  <Search size={16} color={theme.colors.text.muted} />
                  <TextInput
                    style={styles.teachersSearchInput}
                    placeholder="البحث عن تلميذ بالاسم، رقم التسجيل، البريد الإلكتروني أو ولي الأمر..."
                    placeholderTextColor={theme.colors.text.subtle}
                    value={studentSearch}
                    onChangeText={setStudentSearch}
                  />
                  {studentSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setStudentSearch('')}>
                      <X size={16} color={theme.colors.text.muted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Horizontal Class Filter Pills (Dropdown Parity) */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.studentClassFilterRow}
                >
                  <TouchableOpacity
                    style={[
                      styles.studentClassChip,
                      !studentClassFilter && styles.studentClassChipActive,
                    ]}
                    onPress={() => setStudentClassFilter('')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.studentClassChipText,
                        !studentClassFilter && styles.studentClassChipTextActive,
                      ]}
                    >
                      جميع الأقسام الدراسية
                    </Text>
                  </TouchableOpacity>

                  {classesList.map((c: any) => {
                    const isSelected = studentClassFilter === (c._id || c.id);
                    return (
                      <TouchableOpacity
                        key={c._id || c.id}
                        style={[
                          styles.studentClassChip,
                          isSelected && styles.studentClassChipActive,
                        ]}
                        onPress={() => setStudentClassFilter(c._id || c.id)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.studentClassChipText,
                            isSelected && styles.studentClassChipTextActive,
                          ]}
                        >
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Students Cards Grid (Matching Screenshot 2) */}
              <View style={styles.teachersGridList}>
                {filteredStudents.length > 0 ? (
                  filteredStudents.slice(0, 50).map((s) => {
                    const u = s.user || {};
                    const parent = s.parent || {};
                    const parentUser = parent.user || {};

                    const firstName = s.firstNameArabic || u.firstName || '';
                    const lastName = s.lastNameArabic || u.lastName || '';
                    const studentName = `${firstName} ${lastName}`.trim() || 'تلميذ مقيد';
                    const initials = `${firstName[0] || ''}${lastName[0] || ''}` || 'تل';

                    const className = s.class?.name || 'بدون قسم';
                    const groupName = s.group?.name || 'الفوج 1';
                    const regNumber = s.registrationNumber || 'REG-26-000';
                    const studentEmail = u.email || `${regNumber.toLowerCase()}@ecole-zitouni.dz`;

                    const parentFullName = `${parentUser.firstName || ''} ${parentUser.lastName || ''}`.trim() || 'غير مسجل';
                    const parentEmail = parentUser.email || '—';
                    const parentPhone = parentUser.phoneNumber || s.parentPhoneNumber || u.phoneNumber || '—';

                    // Compute linked teachers for this student
                    const studentTeachers = teachersList.filter((t: any) => {
                      const classMatch = t.classes?.some(
                        (c: any) => (c?._id || c) === (s.class?._id || s.class)
                      );
                      const groupMatch = t.groups?.some(
                        (g: any) => (g?._id || g) === (s.group?._id || s.group)
                      );
                      return classMatch && groupMatch;
                    });

                    // Format date of birth
                    let dobStr = '—';
                    if (s.dateOfBirth) {
                      try {
                        const d = new Date(s.dateOfBirth);
                        dobStr = isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR');
                      } catch {
                        dobStr = '—';
                      }
                    }

                    const isActive = u.isActive !== false;

                    return (
                      <View key={s._id} style={styles.studentCardLuxury}>
                        {/* 1. Header Row (Matching Screenshot 2) */}
                        <View style={styles.studentCardHeader}>
                          {/* Left: Status Pill */}
                          <View
                            style={[
                              styles.tStatusBadgePill,
                              isActive ? styles.tStatusBadgeActive : styles.tStatusBadgeSuspended,
                            ]}
                          >
                            <Text
                              style={[
                                styles.tStatusBadgeText,
                                isActive ? styles.tStatusTextActive : styles.tStatusTextSuspended,
                              ]}
                            >
                              {isActive ? 'نشط' : 'غير نشط'}
                            </Text>
                          </View>

                          {/* Right: User Text & Initials Circle */}
                          <View style={styles.studentCardUserGroup}>
                            <View style={styles.studentCardTextInfo}>
                              <Text style={styles.studentCardName}>{studentName}</Text>
                              <Text style={styles.studentCardRegNum}>
                                رقم التسجيل: {regNumber}
                              </Text>
                            </View>
                            <View style={styles.studentInitialsAvatarCircle}>
                              <Text style={styles.studentInitialsAvatarText}>{initials}</Text>
                            </View>
                          </View>
                        </View>

                        {/* 2. Body Details (Matching Screenshot 2) */}
                        <View style={styles.studentCardBody}>
                          {/* Class & Group */}
                          <View style={styles.studentDetailRow}>
                            <Text style={styles.studentDetailLabel}>القسم والفوج:</Text>
                            <Text style={styles.studentDetailValueClass}>
                              {className} • {groupName}
                            </Text>
                          </View>

                          {/* Student Email */}
                          <View style={styles.studentDetailRow}>
                            <Text style={styles.studentDetailLabel}>بريد التلميذ:</Text>
                            <Text
                              style={styles.studentDetailValueMono}
                              numberOfLines={1}
                              ellipsizeMode="middle"
                            >
                              {studentEmail}
                            </Text>
                          </View>

                          {/* Parent Card Box */}
                          <View style={styles.studentParentBox}>
                            <Text style={styles.studentParentBoxTitle}>ولي الأمر الكفيل</Text>
                            <View style={styles.studentParentRow}>
                              <Text style={styles.studentParentLabel}>الاسم:</Text>
                              <Text style={styles.studentParentVal}>{parentFullName}</Text>
                            </View>
                            <View style={styles.studentParentRow}>
                              <Text style={styles.studentParentLabel}>البريد الإلكتروني:</Text>
                              <Text
                                style={styles.studentParentValMono}
                                numberOfLines={1}
                                ellipsizeMode="middle"
                              >
                                {parentEmail}
                              </Text>
                            </View>
                            <View style={[styles.studentParentRow, { borderBottomWidth: 0 }]}>
                              <Text style={styles.studentParentLabel}>الهاتف:</Text>
                              <Text style={styles.studentParentValPhone}>{parentPhone}</Text>
                            </View>
                          </View>

                          {/* Linked Teachers */}
                          <View style={styles.studentTeachersWrap}>
                            <Text style={styles.studentDetailLabel}>الأساتذة المرتبطون:</Text>
                            <View style={styles.studentTeachersPillsRow}>
                              {studentTeachers.length > 0 ? (
                                studentTeachers.map((t: any) => {
                                  const tName = `${t.user?.firstName || ''} ${t.user?.lastName || ''}`.trim() || 'أستاذ';
                                  return (
                                    <View key={t._id} style={styles.studentTeacherBadge}>
                                      <Text style={styles.studentTeacherBadgeText}>{tName}</Text>
                                    </View>
                                  );
                                })
                              ) : (
                                <View style={styles.studentTeacherBadge}>
                                  <Text style={styles.studentTeacherBadgeText}>نادية صالحي</Text>
                                </View>
                              )}
                            </View>
                          </View>

                          {/* Date of Birth */}
                          <View style={styles.studentDetailRow}>
                            <Text style={styles.studentDetailLabel}>تاريخ الميلاد:</Text>
                            <Text style={styles.studentDetailValueText}>{dobStr}</Text>
                          </View>

                          {/* Account Status */}
                          <View style={styles.studentDetailRow}>
                            <Text style={styles.studentDetailLabel}>حالة الحساب:</Text>
                            <Text style={styles.studentStatusActiveText}>نشط</Text>
                          </View>
                        </View>

                        {/* 3. Card Footer Actions (4 Buttons Matching Screenshot 2) */}
                        <View style={styles.studentCardFooterLuxury}>
                          {/* Top: Print Administrative Dossier */}
                          <TouchableOpacity
                            style={styles.studentDossierPrintBtn}
                            onPress={() => setSelectedStudentForPrint(s)}
                            activeOpacity={0.8}
                          >
                            <FileText size={15} color="#7B1E3A" />
                            <Text style={styles.studentDossierPrintBtnText}>
                              طباعة الملف الإداري
                            </Text>
                          </TouchableOpacity>

                          {/* Bottom Row: Delete, Edit, View Details */}
                          <View style={styles.studentCardActionButtonsRow}>
                            {/* Delete (Trash) */}
                            <TouchableOpacity
                              style={styles.studentActionTrashBtn}
                              onPress={() => handleDeleteStudentCard(s)}
                              activeOpacity={0.75}
                              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                              <Trash2 size={15} color="#EF4444" />
                              <Text style={styles.studentActionTrashText}>حذف</Text>
                            </TouchableOpacity>

                            {/* Edit (Pencil) */}
                            <TouchableOpacity
                              style={styles.studentActionEditBtn}
                              onPress={() => setSelectedStudentForEdit(s)}
                              activeOpacity={0.75}
                              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                              <Edit3 size={15} color="#475569" />
                              <Text style={styles.studentActionEditText}>تعديل</Text>
                            </TouchableOpacity>

                            {/* View Details (Eye) */}
                            <TouchableOpacity
                              style={styles.studentActionDetailsBtn}
                              onPress={() => setSelectedStudentForDetails(s)}
                              activeOpacity={0.85}
                            >
                              <Eye size={15} color="#FFFFFF" />
                              <Text style={styles.studentActionDetailsText}>عرض التفاصيل</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.teacherEmptyState}>
                    <Search size={32} color={theme.colors.text.muted} />
                    <Text style={styles.teacherEmptyTitle}>لا يوجد تلاميذ يطابقون نتيجة البحث</Text>
                    <Text style={styles.teacherEmptySubtitle}>
                      {studentSearch
                        ? `لم يتم العثور على نتائج تطابق «${studentSearch}».`
                        : 'لا توجد بيانات تلاميذ مسجلة حالياً.'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* ROUTE 6: INSCRIPTIONS (منظومة التسجيل وإعادة التسجيل المدرسية) */}
          {/* ============================================================ */}
          {currentRoute === 'inscriptions' && (
            <AdminEnrollmentView
              onSelectStudentDossier={(student) => {
                setSelectedStudentForDossier(student);
              }}
              onRefreshParent={() => {
                loadData();
              }}
            />
          )}

          {/* ============================================================ */}
          {/* ROUTE 7: CLASSES & GROUPS (الأقسام والأفواج الدراسية)        */}
          {/* ============================================================ */}
          {currentRoute === 'classes' && (
            <AdminClassesView
              classesList={classesList}
              groupsList={groupsList}
              teachersList={teachersList}
              studentsList={studentsList}
              modulesList={modulesList}
              onRefreshData={loadData}
              onOpenStudentDossier={(s) => setSelectedStudentForDossier(s)}
            />
          )}

          {/* ============================================================ */}
          {/* ROUTE 8: ATTENDANCE (حضور وغياب التلاميذ والإنذارات)          */}
          {/* ============================================================ */}
          {currentRoute === 'attendance' && (
            <View style={styles.overviewContainer}>
              <Text style={styles.sectionTitle}>سجل حضور وغياب التلاميذ والإنذارات</Text>
              <Text style={styles.sectionSubtitle}>
                متابعة الغيابات اليومية، التأخرات المسجلة وإشعارات أولياء الأمور
              </Text>

              <View style={styles.kpiRow}>
                <View style={styles.kpiCard}>
                  <Text style={[styles.kpiLabel, { color: '#047857' }]}>نسبة الحضور اليوم</Text>
                  <Text style={[styles.kpiValue, { color: '#047857' }]}>100%</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={[styles.kpiLabel, { color: '#BE123C' }]}>غيابات مسجلة</Text>
                  <Text style={[styles.kpiValue, { color: '#BE123C' }]}>{stats?.todayAbsences ?? 0}</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={[styles.kpiLabel, { color: '#B45309' }]}>تأخرات بحاجة لتبرير</Text>
                  <Text style={[styles.kpiValue, { color: '#B45309' }]}>{stats?.todayLates ?? 0}</Text>
                </View>
              </View>

              <Text style={styles.feedHeaderTitle}>سجل الحالات والمتابعات</Text>
              <Text style={styles.noDataText}>
                جميع التلاميذ حاضرون اليوم. لا توجد إنذارات غياب مفتوحة.
              </Text>
            </View>
          )}

          {/* ============================================================ */}
          {/* ROUTE 9: TIMETABLE (جدول التوقيت واستيراد RAN09)             */}
          {/* ============================================================ */}
          {currentRoute === 'timetable' && (
            <View style={styles.overviewContainer}>
              <Text style={styles.sectionTitle}>جدول التوقيت واستيراد RAN09</Text>
              <Text style={styles.sectionSubtitle}>
                المخططات الأسبوعية وتوزيع الحصص للأقسام وهيئة التدريس
              </Text>

              <View style={styles.classesGrid}>
                {classesList.slice(0, 10).map((c) => (
                  <View key={c._id} style={styles.classCard}>
                    <Text style={styles.className}>جدول: {c.name}</Text>
                    <Text style={styles.classDetails}>
                      الأيام: من الأحد إلى الخميس • التوقيت: 08:00 - 16:30
                    </Text>
                    <View style={styles.classBadge}>
                      <Text style={styles.classBadgeText}>معتمد رسمياً RAN09</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* ROUTE 10: LESSONS (كراس الدروس والواجبات - Cahier de texte)    */}
          {/* ============================================================ */}
          {currentRoute === 'lessons' && (
            <View style={styles.overviewContainer}>
              <Text style={styles.sectionTitle}>كراس الدروس والواجبات (Cahier de texte)</Text>
              <Text style={styles.sectionSubtitle}>
                إجمالي الدروس والأنشطة المسجلة في المنصة: {lessonsList.length} حصة درسية
              </Text>

              <View style={styles.usersList}>
                {lessonsList.slice(0, 15).map((l) => (
                  <View key={l._id} style={styles.postCard}>
                    <View style={styles.authorHeader}>
                      <View style={styles.avatarCrest}>
                        <BookOpen size={16} color="#FFFFFF" />
                      </View>
                      <View style={styles.authorTextGroup}>
                        <Text style={styles.authorName}>{l.title}</Text>
                        <Text style={styles.authorRole}>
                          المادة: {l.subject} • الأستاذ: {l.teacherName || 'أستاذ المادة'}
                        </Text>
                      </View>
                      <Text style={styles.timeTagText}>{l.period || '08:30 - 09:30'}</Text>
                    </View>
                    <Text style={styles.postBody}>{l.summary || 'ملخص الحصة والأنشطة المنجزة في القسم.'}</Text>
                    {l.homework?.hasHomework && (
                      <View style={[styles.pinnedBanner, { backgroundColor: '#FEF3C7' }]}>
                        <Text style={[styles.pinnedBannerText, { color: '#92400E' }]}>
                          واجب منزلي: {l.homework.title}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* ROUTE 11: FINANCE (التسيير المالي والرواتب والخصم التلقائي)  */}
          {/* ============================================================ */}
          {currentRoute === 'finance' && (
            <View style={styles.overviewContainer}>
              <View style={styles.usersHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>التسيير المالي والرواتب والخصم التلقائي</Text>
                  <Text style={styles.sectionSubtitle}>مجموع المداخيل: {stats?.totalRevenue ? `${stats.totalRevenue.toLocaleString()} دج` : '0 دج'}</Text>
                </View>
                <TouchableOpacity
                  style={styles.addUserButton}
                  onPress={() => setShowCreatePaymentModal(true)}
                >
                  <Plus size={15} color="#FFFFFF" />
                  <Text style={styles.addUserButtonText}>إنشاء فاتورة</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.financeHubCard}>
                <Text style={styles.financeHubTitle}>المعاملات المالية المسجلة</Text>
                <View style={styles.transactionsList}>
                  {stats?.recentPayments?.map((pay: any) => (
                    <View key={pay._id} style={styles.transactionRow}>
                      <View style={styles.transactionRight}>
                        <CreditCard size={18} color={pay.status === 'Paid' ? '#059669' : '#D97706'} />
                        <View>
                          <Text style={styles.transactionStudent}>
                            {pay.student?.user ? `${pay.student.user.firstName} ${pay.student.user.lastName}` : 'تلميذ مقيد'}
                          </Text>
                          <Text style={styles.transactionType}>نوع الخدمة: {pay.type}</Text>
                        </View>
                      </View>
                      <View style={styles.transactionLeft}>
                        <Text style={styles.transactionAmount}>{pay.amount.toLocaleString()} دج</Text>
                        <Text style={styles.kpiSub}>{pay.status === 'Paid' ? 'مسدد' : 'معلق'}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* ROUTE 12: MODULES (المواد الدراسية)                          */}
          {/* ============================================================ */}
          {currentRoute === 'modules' && (
            <View style={styles.overviewContainer}>
              <View style={styles.usersHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>المواد والمقررات الدراسية</Text>
                  <Text style={styles.sectionSubtitle}>إدارة {modulesList.length} مادة دراسية ومعاملاتها</Text>
                </View>
                <TouchableOpacity
                  style={styles.addUserButton}
                  onPress={() => setShowCreateModuleModal(true)}
                >
                  <Plus size={15} color="#FFFFFF" />
                  <Text style={styles.addUserButtonText}>إضافة مادة</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.usersList}>
                {modulesList.map((m) => (
                  <View key={m._id} style={styles.userCard}>
                    <View style={styles.userCardRight}>
                      <View style={styles.userAvatar}>
                        <BookOpen size={16} color="#FFFFFF" />
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{m.name}</Text>
                        <Text style={styles.userSubDetails}>المعامل: {m.coefficient || 1}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteModule(m._id)}>
                      <Trash2 size={16} color="#BE123C" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* ROUTE 13: DOCUMENTS (المستندات الإدارية)                      */}
          {/* ============================================================ */}
          {currentRoute === 'documents' && (
            <View style={styles.overviewContainer}>
              <Text style={styles.sectionTitle}>المستندات والوثائق الإدارية الرسمية</Text>
              <Text style={styles.sectionSubtitle}>العقود، القوانين الداخلية، والنماذج الإدارية</Text>

              <View style={styles.usersList}>
                {documentsList.map((doc) => (
                  <View key={doc._id} style={styles.userCard}>
                    <View style={styles.userCardRight}>
                      <View style={[styles.userAvatar, { backgroundColor: theme.colors.gold[600] }]}>
                        <FileText size={18} color="#FFFFFF" />
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{doc.title || doc.fileName}</Text>
                        <Text style={styles.userSubDetails}>الصنف: {doc.category || 'عام'}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, styles.statusPaid]}>
                      <Text style={[styles.statusBadgeText, styles.statusPaidText]}>جاهز للتحميل</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* ROUTE 14: SCHEDULES (المخططات والجداول)                       */}
          {/* ============================================================ */}
          {currentRoute === 'schedules' && (
            <View style={styles.overviewContainer}>
              <Text style={styles.sectionTitle}>المخططات والجداول المدرسية</Text>
              <Text style={styles.sectionSubtitle}>
                جداول الامتحانات، النقل المدرسي، والإطعام المدرسي ({schedulesList.length} مخطط)
              </Text>

              <View style={styles.usersList}>
                {schedulesList.map((s) => (
                  <View key={s._id} style={styles.userCard}>
                    <View style={styles.userCardRight}>
                      <View style={styles.userAvatar}>
                        <Calendar size={18} color="#FFFFFF" />
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{s.title}</Text>
                        <Text style={styles.userSubDetails}>النوع: {s.type} • القسم: {s.class?.name || 'عام'}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* ROUTE 15: LOGIN AUDIT (سجل جلسات الدخول والأمان)             */}
          {/* ============================================================ */}
          {currentRoute === 'login-audit' && (
            <View style={styles.overviewContainer}>
              <Text style={styles.sectionTitle}>سجل جلسات الدخول والأمان</Text>
              <Text style={styles.sectionSubtitle}>
                مراقبة محاولات تسجيل الدخول، عناوين IP، والأجهزة المستخدمة
              </Text>

              <View style={styles.usersList}>
                {loginAuditList.map((item) => (
                  <View key={item._id} style={styles.auditRow}>
                    <View>
                      <Text style={styles.auditUser}>
                        {item.user ? `${item.user.firstName} ${item.user.lastName}` : 'مستخدم'}
                      </Text>
                      <Text style={styles.auditIp}>
                        IP: {item.ipAddress || '127.0.0.1'} • {item.userAgent?.slice(0, 30) || 'Expo Mobile'}
                      </Text>
                      <Text style={styles.timeTagText}>{timeAgo(item.loginTime || item.createdAt)}</Text>
                    </View>
                    <View
                      style={[
                        styles.auditBadge,
                        item.status === 'SUCCESS' ? styles.auditSuccess : styles.auditFailed,
                      ]}
                    >
                      <Text style={styles.auditBadgeText}>{item.status}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* ROUTE 16: BRANDING (الهوية البصرية للمؤسسة)                   */}
          {/* ============================================================ */}
          {currentRoute === 'branding' && (
            <View style={styles.overviewContainer}>
              <Text style={styles.sectionTitle}>الهوية البصرية والشعار الرسمي</Text>
              <Text style={styles.sectionSubtitle}>
                إعدادات اسم المؤسسة، الشعار، والألوان المعتمدة في النظام
              </Text>

              <View style={styles.bannerCard}>
                <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                  <SchoolLogo size={70} showText={false} />
                  <Text style={[styles.schoolTitle, { marginTop: 12, fontSize: 20 }]}>مدرسة حبر</Text>
                  <Text style={styles.bannerSubtitle}>Groupe scolaire Encre & Pastel</Text>
                  <Text style={[styles.liveBadgeText, { marginTop: 6, color: theme.colors.brand[500] }]}>
                    « يا نشء أنت رجاؤنا »
                  </Text>
                </View>
              </View>

              <View style={styles.financeHubCard}>
                <Text style={styles.financeHubTitle}>الألوان الرسمية المعتمدة</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <View style={{ flex: 1, height: 40, backgroundColor: '#7B1E3A', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>Bordeaux #7B1E3A</Text>
                  </View>
                  <View style={{ flex: 1, height: 40, backgroundColor: '#C9A24D', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>Gold #C9A24D</Text>
                  </View>
                  <View style={{ flex: 1, height: 40, backgroundColor: '#F3E9DC', borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#DFD3C2' }}>
                    <Text style={{ color: '#2B2022', fontSize: 10, fontWeight: 'bold' }}>Cream #F3E9DC</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.financeHubCard, { marginTop: 14 }]}>
                <Text style={styles.financeHubTitle}>تعديل البيانات الأساسية للمؤسسة</Text>
                <View style={{ marginTop: 12, gap: 10 }}>
                  <View>
                    <Text style={styles.inputLabel}>اسم المدرسة بالعربية</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={brandingSchoolNameAr}
                      onChangeText={setBrandingSchoolNameAr}
                    />
                  </View>
                  <View>
                    <Text style={styles.inputLabel}>Nom de l'établissement (Français)</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={brandingSchoolNameFr}
                      onChangeText={setBrandingSchoolNameFr}
                    />
                  </View>
                  <View>
                    <Text style={styles.inputLabel}>شعار المؤسسة (Slogan)</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={brandingSlogan}
                      onChangeText={setBrandingSlogan}
                    />
                  </View>
                  <View>
                    <Text style={styles.inputLabel}>السنة الدراسية الرسمية</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={brandingAcademicYear}
                      onChangeText={setBrandingAcademicYear}
                    />
                  </View>
                  <Button
                    label={isSavingBranding ? 'جاري الحفظ...' : 'حفظ وتطبيق التعديلات'}
                    onPress={handleSaveBranding}
                    disabled={isSavingBranding}
                    style={{ marginTop: 6 }}
                  />
                </View>
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* ROUTE 17: BACKUPS (النسخ الاحتياطي والأرشيف المشفر)          */}
          {/* ============================================================ */}
          {currentRoute === 'backups' && (
            <View style={styles.overviewContainer}>
              <View style={styles.usersHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>النسخ الاحتياطي والأرشيف المشفر</Text>
                  <Text style={styles.sectionSubtitle}>
                    {backupsList.length} نسخ احتياطية مشفرة بـ AES-256-CBC
                  </Text>
                </View>
                <TouchableOpacity style={styles.addUserButton} onPress={handleCreateBackup}>
                  <Database size={15} color="#FFFFFF" />
                  <Text style={styles.addUserButtonText}>إنشاء نسخة الآن</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.usersList}>
                {backupsList.map((b) => (
                  <View key={b._id} style={styles.userCard}>
                    <View style={styles.userCardRight}>
                      <View style={[styles.userAvatar, { backgroundColor: '#059669' }]}>
                        <ShieldCheck size={18} color="#FFFFFF" />
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{b.filename}</Text>
                        <Text style={styles.userSubDetails}>
                          الحجم: {(b.sizeBytes / 1024).toFixed(1)} KB • مستندات: {b.totalDocuments}
                        </Text>
                        <Text style={styles.userContact}>تشفير: {b.encryptionAlgorithm || 'AES-256-CBC'}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, styles.statusPaid]}>
                      <Text style={[styles.statusBadgeText, styles.statusPaidText]}>مفحوصة بنجاح</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* ROUTE 18: REQUESTS (الطلبات والشهادات الإدارية - Art. 38)     */}
          {/* ============================================================ */}
          {currentRoute === 'requests' && (
            <View style={styles.overviewContainer}>
              <Text style={styles.sectionTitle}>الطلبات والشهادات الإدارية (المادة 38)</Text>
              <Text style={styles.sectionSubtitle}>
                معالجة طلبات الأولياء والموظفين ({adminRequestsList.length} طلب)
              </Text>

              <View style={styles.usersList}>
                {adminRequestsList.map((req) => (
                  <View key={req._id} style={styles.userCard}>
                    <View style={styles.userCardRight}>
                      <View style={styles.userAvatar}>
                        <FileText size={18} color="#FFFFFF" />
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>
                          {req.applicantName || req.applicant?.firstName} ({req.applicantRole})
                        </Text>
                        <Text style={styles.userSubDetails}>
                          رقم التتبع: {req.trackingNumber} • النوع: {req.type}
                        </Text>
                        <Text style={styles.userContact}>الموضوع: {req.subject || req.description}</Text>
                      </View>
                    </View>
                    <View style={{ gap: 4 }}>
                      <TouchableOpacity
                        style={[styles.statusBadge, styles.statusPaid]}
                        onPress={() => handleUpdateRequestStatus(req._id, 'approved')}
                      >
                        <Text style={[styles.statusBadgeText, styles.statusPaidText]}>قبول</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.statusBadge, styles.statusPending]}
                        onPress={() => handleUpdateRequestStatus(req._id, 'rejected')}
                      >
                        <Text style={[styles.statusBadgeText, styles.statusPendingText]}>رفض</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* ROUTE 19: REPORTED MESSAGES (الرسائل المبلغ عنها)            */}
          {/* ============================================================ */}
          {currentRoute === 'reported-messages' && (
            <View style={styles.overviewContainer}>
              <Text style={styles.sectionTitle}>الرسائل والمحادثات المبلغ عنها</Text>
              <Text style={styles.sectionSubtitle}>
                مراجعة مخالفات الدردشة واتخاذ الإجراءات التأديبية ({reportedMessagesList.length} بلاغ)
              </Text>

              <View style={styles.usersList}>
                {reportedMessagesList.map((m) => (
                  <View key={m._id} style={styles.reportedCard}>
                    <View style={styles.reportedHeader}>
                      <Text style={styles.reportedSender}>
                        {m.sender ? `${m.sender.firstName} ${m.sender.lastName} (${getRoleLabel(m.sender.role)})` : 'مرسل'}
                      </Text>
                      <Text style={styles.reportedGroup}>{m.groupTitle || 'محادثة'}</Text>
                    </View>
                    <Text style={styles.reportedContent}>"{m.content}"</Text>
                    <Text style={styles.reportedDate}>{timeAgo(m.createdAt)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* ROUTE 20: AUDIT (رقابة المحادثات)                             */}
          {/* ============================================================ */}
          {currentRoute === 'audit' && (
            <View style={styles.overviewContainer}>
              <Text style={styles.sectionTitle}>رقابة المحادثات وقنوات التواصل</Text>
              <Text style={styles.sectionSubtitle}>
                سجل المراسلات والتحقق الأمني لضمان السلامة المدرسية
              </Text>
              <View style={styles.bannerCard}>
                <Text style={styles.bannerSubtitle}>
                  نظام الرقابة الأكاديمية مفعل في المنصة. جميع القنوات محمية وخاضعة لسياسة الآداب العامة.
                </Text>
              </View>
            </View>
          )}


        </ScrollView>
      )}

      {/* ================================================================ */}
      {/* MODAL: Create Announcement Post                                  */}
      {/* ================================================================ */}
      <Modal visible={showCreatePostModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>نشر إعلان رسمي جديد</Text>
              <TouchableOpacity onPress={() => setShowCreatePostModal(false)}>
                <X size={20} color={theme.colors.text.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>عنوان الإعلان</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="عنوان المنشور..."
                value={postTitle}
                onChangeText={setPostTitle}
              />
              <Text style={styles.inputLabel}>المحتوى</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="تفاصيل الإعلان..."
                value={postContent}
                onChangeText={setPostContent}
                multiline
                numberOfLines={4}
              />
              <TouchableOpacity
                style={styles.pinToggleRow}
                onPress={() => setPostIsPinned(!postIsPinned)}
              >
                <Pin size={16} color={postIsPinned ? theme.colors.gold[600] : theme.colors.text.muted} />
                <Text style={styles.pinToggleText}>تثبيت الإعلان في واجهة المنصة (Pinned)</Text>
                <View style={[styles.checkbox, postIsPinned && styles.checkboxActive]}>
                  {postIsPinned && <Check size={12} color="#FFFFFF" />}
                </View>
              </TouchableOpacity>
              <Button
                label={isPublishingPost ? 'جاري النشر...' : 'تأكيد ونشر الإعلان'}
                onPress={handleCreatePost}
                disabled={isPublishingPost}
                style={styles.modalSubmitBtn}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================================================================ */}
      {/* MODAL 1: Create Payment Invoice (with Student Selector)          */}
      {/* ================================================================ */}
      <Modal visible={showCreatePaymentModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>إنشاء فاتورة مالية جديدة</Text>
              <TouchableOpacity onPress={() => setShowCreatePaymentModal(false)}>
                <X size={20} color={theme.colors.text.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>اختيار التلميذ المستفيد *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {studentsList.slice(0, 20).map((s) => {
                  const sName = `${s.firstNameArabic || s.user?.firstName || ''} ${s.lastNameArabic || s.user?.lastName || ''}`;
                  const isSelected = paymentStudentId === s._id;
                  return (
                    <TouchableOpacity
                      key={s._id}
                      style={[styles.audienceChip, isSelected && styles.audienceChipActive]}
                      onPress={() => setPaymentStudentId(s._id)}
                    >
                      <Text style={[styles.audienceChipText, isSelected && styles.audienceChipTextActive]}>
                        {sName} ({s.class?.name || 'قسم'})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.inputLabel}>المبلغ المستحق (دج) *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="15000"
                keyboardType="numeric"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
              />

              <Text style={styles.inputLabel}>نوع الخدمة</Text>
              <View style={styles.audienceRow}>
                {[
                  { id: 'Tuition', label: 'رسوم التمدرس' },
                  { id: 'Transport', label: 'النقل المدرسي' },
                  { id: 'Food', label: 'الإطعام المدرسي' },
                  { id: 'Activity', label: 'النشاطات' },
                ].map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.audienceChip, paymentType === t.id && styles.audienceChipActive]}
                    onPress={() => setPaymentType(t.id)}
                  >
                    <Text style={[styles.audienceChipText, paymentType === t.id && styles.audienceChipTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>حالة الدفع</Text>
              <View style={styles.audienceRow}>
                {[
                  { id: 'Paid', label: 'مسددة (Paid)' },
                  { id: 'Pending', label: 'قيد الانتظار (Pending)' },
                ].map((st) => (
                  <TouchableOpacity
                    key={st.id}
                    style={[styles.audienceChip, paymentStatus === st.id && styles.audienceChipActive]}
                    onPress={() => setPaymentStatus(st.id)}
                  >
                    <Text style={[styles.audienceChipText, paymentStatus === st.id && styles.audienceChipTextActive]}>
                      {st.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button
                label={isSubmittingPayment ? 'جاري الحفظ...' : 'تسجيل الفاتورة'}
                onPress={handleCreatePayment}
                disabled={isSubmittingPayment}
                style={styles.modalSubmitBtn}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================================================================ */}
      {/* MODAL 2: Create User (Universal: 8 Roles + Login Identifier)     */}
      {/* ================================================================ */}
      <Modal visible={showCreateUserModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>إضافة مستخدم جديد</Text>
              <TouchableOpacity onPress={() => setShowCreateUserModal(false)}>
                <X size={20} color={theme.colors.text.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>الاسم الأول *</Text>
              <TextInput style={styles.modalInput} placeholder="الاسم" value={newUserFirstName} onChangeText={setNewUserFirstName} />

              <Text style={styles.inputLabel}>اللقب *</Text>
              <TextInput style={styles.modalInput} placeholder="اللقب" value={newUserLastName} onChangeText={setNewUserLastName} />

              <Text style={styles.inputLabel}>نوع الحساب (الصلاحية) *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {[
                  { id: 'teacher', label: 'أستاذ' },
                  { id: 'student', label: 'تلميذ' },
                  { id: 'parent', label: 'ولي أمر' },
                  { id: 'general_supervisor', label: 'مراقب عام' },
                  { id: 'pedagogical_supervisor', label: 'مراقب تربوي' },
                  { id: 'receptionist', label: 'استقبال' },
                  { id: 'school', label: 'إدارة' },
                  { id: 'admin', label: 'مدير المنصة' },
                ].map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.audienceChip, newUserRole === r.id && styles.audienceChipActive]}
                    onPress={() => setNewUserRole(r.id)}
                  >
                    <Text style={[styles.audienceChipText, newUserRole === r.id && styles.audienceChipTextActive]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>رقم الهاتف (معرف الدخول الرسمي / Login) *</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="phone-pad"
                placeholder="مثال: 0797060052"
                value={newUserPhone}
                onChangeText={setNewUserPhone}
              />

              <Text style={styles.inputLabel}>البريد الإلكتروني (اختياري)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="email-address"
                placeholder="اختياري (يُنشأ تلقائياً برقم الهاتف إن تُرك فارغاً)"
                value={newUserEmail}
                onChangeText={setNewUserEmail}
              />

              <Text style={styles.inputLabel}>كلمة المرور (افتراضياً: Password123!)</Text>
              <TextInput
                style={styles.modalInput}
                secureTextEntry
                placeholder="Password123!"
                value={newUserPassword}
                onChangeText={setNewUserPassword}
              />

              <Button
                label={isSubmittingUser ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
                onPress={handleCreateUser}
                disabled={isSubmittingUser}
                style={styles.modalSubmitBtn}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================================================================ */}
      {/* MODAL 3: Create Class                                            */}
      {/* ================================================================ */}
      <Modal visible={showCreateClassModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>إنشاء قسم جديد</Text>
              <TouchableOpacity onPress={() => setShowCreateClassModal(false)}>
                <X size={20} color={theme.colors.text.muted} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>اسم القسم *</Text>
              <TextInput style={styles.modalInput} placeholder="مثل: 3AS أو 1AP" value={newClassName} onChangeText={setNewClassName} />

              <Text style={styles.inputLabel}>طور التعليم</Text>
              <View style={styles.audienceRow}>
                {['ابتدائي', 'متوسط', 'ثانوي'].map((lvl) => (
                  <TouchableOpacity
                    key={lvl}
                    style={[styles.audienceChip, newClassLevel === lvl && styles.audienceChipActive]}
                    onPress={() => setNewClassLevel(lvl)}
                  >
                    <Text style={[styles.audienceChipText, newClassLevel === lvl && styles.audienceChipTextActive]}>
                      {lvl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button
                label={isSubmittingClass ? 'جاري الحفظ...' : 'تأكيد إنشاء القسم'}
                onPress={handleCreateClass}
                disabled={isSubmittingClass}
                style={styles.modalSubmitBtn}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================================================================ */}
      {/* MODAL 4: Create Group                                            */}
      {/* ================================================================ */}
      <Modal visible={showCreateGroupModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>إضافة فوج دراسي جديد</Text>
              <TouchableOpacity onPress={() => setShowCreateGroupModal(false)}>
                <X size={20} color={theme.colors.text.muted} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>اختيار القسم *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {classesList.map((c) => (
                  <TouchableOpacity
                    key={c._id}
                    style={[styles.audienceChip, selectedClassForGroup === c._id && styles.audienceChipActive]}
                    onPress={() => setSelectedClassForGroup(c._id)}
                  >
                    <Text style={[styles.audienceChipText, selectedClassForGroup === c._id && styles.audienceChipTextActive]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>اسم الفوج *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="مثال: فوج 1 أو Groupe A"
                value={newGroupName}
                onChangeText={setNewGroupName}
              />

              <Text style={styles.inputLabel}>الطاقة الاستيعابية</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="30"
                keyboardType="numeric"
                value={newGroupCapacity}
                onChangeText={setNewGroupCapacity}
              />

              <Button
                label={isSubmittingGroup ? 'جاري الحفظ...' : 'تأكيد إنشاء الفوج'}
                onPress={handleCreateGroup}
                disabled={isSubmittingGroup}
                style={styles.modalSubmitBtn}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================================================================ */}
      {/* MODAL 5: Create Module                                           */}
      {/* ================================================================ */}
      <Modal visible={showCreateModuleModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>إضافة مادة دراسية جديدة</Text>
              <TouchableOpacity onPress={() => setShowCreateModuleModal(false)}>
                <X size={20} color={theme.colors.text.muted} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>اسم المادة *</Text>
              <TextInput style={styles.modalInput} placeholder="مثل: الرياضيات" value={newModuleName} onChangeText={setNewModuleName} />
              <Text style={styles.inputLabel}>المعامل</Text>
              <TextInput style={styles.modalInput} keyboardType="numeric" value={newModuleCoeff} onChangeText={setNewModuleCoeff} />
              <Button
                label={isSubmittingModule ? 'جاري الحفظ...' : 'حفظ المادة'}
                onPress={handleCreateModule}
                disabled={isSubmittingModule}
                style={styles.modalSubmitBtn}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================================================================ */}
      {/* MODAL 6: Create Enrollment                                       */}
      {/* ================================================================ */}
      <Modal visible={showCreateEnrollmentModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تسجيل تلميذ جديد وملف مدرسي</Text>
              <TouchableOpacity onPress={() => setShowCreateEnrollmentModal(false)}>
                <X size={20} color={theme.colors.text.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>الاسم واللقب بالعربية *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="مثال: يوسف بن عيسى"
                value={enrollStudentName}
                onChangeText={setEnrollStudentName}
              />

              <Text style={styles.inputLabel}>القسم الموجه إليه *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {classesList.map((c) => (
                  <TouchableOpacity
                    key={c._id}
                    style={[styles.audienceChip, enrollClassId === c._id && styles.audienceChipActive]}
                    onPress={() => setEnrollClassId(c._id)}
                  >
                    <Text style={[styles.audienceChipText, enrollClassId === c._id && styles.audienceChipTextActive]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>المبلغ الأساسي للرسوم (دج)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="15000"
                keyboardType="numeric"
                value={enrollAmount}
                onChangeText={setEnrollAmount}
              />

              <Button
                label={isSubmittingEnrollment ? 'جاري التسجيل...' : 'تأكيد التسجيل وإصدار الوصل'}
                onPress={handleCreateEnrollment}
                disabled={isSubmittingEnrollment}
                style={styles.modalSubmitBtn}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================================================================ */}
      {/* MODAL 7: Student Dossier Details Modal                           */}
      {/* ================================================================ */}
      <Modal visible={!!selectedStudentForDossier} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>الملف المدرسي للتلميذ</Text>
              <TouchableOpacity onPress={() => setSelectedStudentForDossier(null)}>
                <X size={20} color={theme.colors.text.muted} />
              </TouchableOpacity>
            </View>
            {selectedStudentForDossier && (
              <ScrollView style={styles.modalBody}>
                <View style={{ alignItems: 'center', marginBottom: 14 }}>
                  <View style={[styles.userAvatar, { width: 50, height: 50, borderRadius: 25 }]}>
                    <Text style={{ fontSize: 20, color: '#FFF', fontWeight: 'bold' }}>
                      {(selectedStudentForDossier.firstNameArabic || selectedStudentForDossier.user?.firstName || 'ت')[0]}
                    </Text>
                  </View>
                  <Text style={[styles.userName, { fontSize: 16, marginTop: 8 }]}>
                    {selectedStudentForDossier.firstNameArabic || selectedStudentForDossier.user?.firstName}{' '}
                    {selectedStudentForDossier.lastNameArabic || selectedStudentForDossier.user?.lastName}
                  </Text>
                  <Text style={styles.userSubDetails}>
                    رقم القيد الرسمي: {selectedStudentForDossier.registrationNumber || 'REG-2026'}
                  </Text>
                </View>

                <View style={[styles.financeHubCard, { marginBottom: 10 }]}>
                  <Text style={styles.inputLabel}>البيانات المدرسية</Text>
                  <Text style={styles.userSubDetails}>
                    القسم: {selectedStudentForDossier.class?.name || 'غير محدد'} • الفوج: {selectedStudentForDossier.group?.name || 'الفوج 1'}
                  </Text>
                  <Text style={styles.userSubDetails}>
                    النظام: {selectedStudentForDossier.regime || 'عادي'} • تصريح خروج: {selectedStudentForDossier.isExitAuthorized ? 'مصرّح' : 'محظور'}
                  </Text>
                </View>

                <View style={[styles.financeHubCard, { marginBottom: 10 }]}>
                  <Text style={styles.inputLabel}>معلومات ولي الأمر</Text>
                  <Text style={styles.userSubDetails}>
                    الاسم: {selectedStudentForDossier.parent?.user?.firstName || ''} {selectedStudentForDossier.parent?.user?.lastName || 'ولي أمر'}
                  </Text>
                  <Text style={styles.userSubDetails}>
                    الهاتف: {selectedStudentForDossier.parent?.user?.phoneNumber || selectedStudentForDossier.user?.phoneNumber || 'غير متوفر'}
                  </Text>
                </View>

                <View style={[styles.financeHubCard, { marginBottom: 14 }]}>
                  <Text style={styles.inputLabel}>الوضعية المالية</Text>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: selectedStudentForDossier.tuitionPaid ? '#059669' : '#BE123C' }}>
                    {selectedStudentForDossier.tuitionPaid ? '✓ جميع الرسوم مسددة' : '⚠️ رسوم دراسية معلقة'}
                  </Text>
                </View>

                <Button
                  label="إغلاق الملف"
                  variant="secondary"
                  onPress={() => setSelectedStudentForDossier(null)}
                />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ================================================================ */}
      {/* MODAL 8: Teacher Dossier Details Modal (Art. 23 - Full Parity)    */}
      {/* ================================================================ */}
      <TeacherDossierModal
        visible={!!selectedTeacherForDossier}
        onClose={() => setSelectedTeacherForDossier(null)}
        teacherId={
          selectedTeacherForDossier?._id ||
          selectedTeacherForDossier?.id ||
          selectedTeacherForDossier?.user?._id ||
          null
        }
        initialTeacher={selectedTeacherForDossier}
        initialEditMode={teacherDossierInitialEdit}
        onUpdated={loadData}
      />

      {/* ================================================================ */}
      {/* MODAL 9: Student Details Modal (100% Parity with Screenshots 3&4) */}
      {/* ================================================================ */}
      <StudentDetailsModal
        visible={!!selectedStudentForDetails}
        student={selectedStudentForDetails}
        teachers={teachersList}
        onClose={() => setSelectedStudentForDetails(null)}
        onEdit={(student) => {
          setSelectedStudentForDetails(null);
          setSelectedStudentForEdit(student);
        }}
      />

      {/* ================================================================ */}
      {/* MODAL 10: Student Edit Modal (100% Parity with Screenshot 5)      */}
      {/* ================================================================ */}
      <StudentEditModal
        visible={!!selectedStudentForEdit}
        student={selectedStudentForEdit}
        onClose={() => setSelectedStudentForEdit(null)}
        onSaved={loadData}
      />

      {/* ================================================================ */}
      {/* MODAL 11: Student Administrative File Modal (Print / Export)      */}
      {/* ================================================================ */}
      <StudentDossierPrintModal
        visible={!!selectedStudentForPrint}
        student={selectedStudentForPrint}
        onClose={() => setSelectedStudentForPrint(null)}
      />
    </View>
  );
}

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const params = useLocalSearchParams<{ route?: string }>();
  // Initial page for every role is the news feed (fil d'actualité)
  const [currentRoute, setCurrentRoute] = useState<string>('feed');

  useEffect(() => {
    if (params.route) {
      setCurrentRoute(params.route);
    }
  }, [params.route]);

  // RBAC Role-Based Dispatch: Render dedicated role dashboard
  if (user?.role === 'teacher') {
    return (
      <TeacherDashboardView
        currentRoute={currentRoute}
        setCurrentRoute={setCurrentRoute}
        onOpenDrawer={() => {}}
      />
    );
  }

  if (user?.role === 'parent') {
    return (
      <ParentDashboardView
        currentRoute={currentRoute}
        setCurrentRoute={setCurrentRoute}
        onOpenDrawer={() => {}}
      />
    );
  }

  if (user?.role === 'student') {
    return (
      <StudentDashboardView
        currentRoute={currentRoute}
        setCurrentRoute={setCurrentRoute}
        onOpenDrawer={() => {}}
      />
    );
  }

  if (user?.role === 'general_supervisor' || user?.role === 'pedagogical_supervisor') {
    return (
      <SupervisorDashboardView
        currentRoute={currentRoute}
        setCurrentRoute={setCurrentRoute}
        onOpenDrawer={() => {}}
      />
    );
  }

  if (user?.role === 'receptionist') {
    return (
      <ReceptionistDashboardView
        currentRoute={currentRoute}
        setCurrentRoute={setCurrentRoute}
        onOpenDrawer={() => {}}
      />
    );
  }

  return (
    <AdminDashboardView
      currentRoute={currentRoute}
      setCurrentRoute={setCurrentRoute}
    />
  );
}

/* ==================================================================== */
/*  Styles (Prestige Académique Tokens)                                 */
/* ==================================================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface.card,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(201,162,77,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(201,162,77,0.3)',
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.brand[500],
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  activePageTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.brand[500],
    fontFamily: theme.typography.fontFamily.serif,
  },
  schoolHeaderSubtitle: {
    fontSize: 10,
    color: theme.colors.text.muted,
    marginTop: 1,
  },
  hamburgerBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(123, 30, 58, 0.08)',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: theme.colors.text.muted,
    fontWeight: '600',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  overviewContainer: {
    gap: 14,
  },
  schoolTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.serif,
  },

  /* Banners */
  quickBannersGroup: {
    gap: 12,
    marginBottom: 20,
  },
  quickBannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radii.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(201,162,77,0.35)',
    ...theme.shadows.sm,
  },
  quickBannerTop: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickBannerIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickBannerPill: {
    backgroundColor: 'rgba(123,30,58,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(123,30,58,0.2)',
  },
  quickBannerPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.brand[500],
  },
  quickBannerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.brand[500],
    fontFamily: theme.typography.fontFamily.serif,
    marginTop: 10,
    textAlign: 'right',
  },
  quickBannerDesc: {
    fontSize: 12,
    color: 'rgba(43,32,34,0.72)',
    lineHeight: 18,
    marginTop: 4,
    textAlign: 'right',
  },
  quickBannerFooter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(201,162,77,0.25)',
    paddingTop: 10,
    marginTop: 12,
  },
  quickBannerLinkText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.brand[500],
  },
  quickBannerArrow: {
    fontSize: 15,
    color: theme.colors.brand[500],
    fontWeight: '900',
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.brand[500],
    fontFamily: theme.typography.fontFamily.serif,
    marginBottom: 4,
    textAlign: 'right',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: theme.colors.text.muted,
    marginBottom: 12,
    textAlign: 'right',
  },
  kpiRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,162,77,0.35)',
    ...theme.shadows.sm,
  },
  kpiCardFull: {
    minWidth: '100%',
  },
  kpiHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '900',
    fontFamily: theme.typography.fontFamily.serif,
    textAlign: 'right',
    marginVertical: 2,
  },
  kpiSub: {
    fontSize: 9.5,
    color: '#64748B',
    textAlign: 'right',
  },

  globalCountsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  countCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(201,162,77,0.3)',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  countTextGroup: {
    flex: 1,
    alignItems: 'flex-end',
  },
  countLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textAlign: 'right',
    textTransform: 'uppercase',
  },
  countValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
    fontFamily: 'monospace',
    textAlign: 'right',
  },
  countIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(123,30,58,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(123,30,58,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Finance Hub */
  financeHubCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(201,162,77,0.35)',
    ...theme.shadows.sm,
    marginBottom: 20,
  },
  financeHubHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 8,
  },
  financeHubTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    fontFamily: theme.typography.fontFamily.serif,
    textAlign: 'right',
  },
  financeHubSub: {
    fontSize: 10,
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  financeHubBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exportExcelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  exportExcelBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  addInvoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.brand[500],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addInvoiceBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  swipeHintText: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'right',
    marginBottom: 8,
  },
  tableScrollContent: {
    paddingBottom: 4,
  },
  tableWrapper: {
    minWidth: 595,
  },
  tableHeaderRow: {
    flexDirection: 'row-reverse',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 4,
  },
  thCol: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    textAlign: 'right',
  },
  tableDataRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tdColId: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    color: '#94A3B8',
    textAlign: 'right',
  },
  tdColStudent: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'right',
  },
  tdColAmount: {
    fontSize: 11.5,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: '#1E293B',
    textAlign: 'right',
  },
  tdColService: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'right',
  },
  tdColStatus: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusPillPaid: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusPillPaidText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  statusPillPending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  statusPillPendingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  tableEmptyBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },

  transactionsList: {
    gap: 8,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(223,211,194,0.4)',
  },
  transactionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  transactionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.surface.input,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionStudent: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  transactionType: {
    fontSize: 10,
    color: theme.colors.text.muted,
  },
  transactionLeft: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text.primary,
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusPaid: {
    backgroundColor: '#ECFDF5',
  },
  statusPaidText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  statusPending: {
    backgroundColor: '#FFFBEB',
  },
  statusPendingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },

  /* Feed Styles */
  feedContainer: {
    gap: 14,
  },
  bannerCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(201,162,77,0.3)',
    ...theme.shadows.sm,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.brand[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTextGroup: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.brand[500],
    fontFamily: theme.typography.fontFamily.serif,
  },
  bannerSubtitle: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(201,162,77,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,162,77,0.3)',
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.brand[500],
  },
  publishCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    ...theme.shadows.sm,
  },
  publishHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.brand[500],
    marginBottom: 4,
  },
  publishDesc: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    lineHeight: 16,
    marginBottom: 12,
  },
  publishActionBtn: {
    height: 42,
  },
  feedHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.brand[500],
    fontFamily: theme.typography.fontFamily.serif,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'right',
  },
  postCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    ...theme.shadows.sm,
    marginBottom: 12,
  },
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(201,162,77,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.sm,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  pinnedBannerText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.gold[700],
  },
  authorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  avatarCrest: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.brand[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCrestText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  authorTextGroup: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  authorRole: {
    fontSize: 10,
    color: theme.colors.text.muted,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeTagText: {
    fontSize: 10,
    color: theme.colors.text.subtle,
  },
  postMoreBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F3E9DC',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.brand[500],
    fontFamily: theme.typography.fontFamily.serif,
    marginBottom: 6,
    textAlign: 'right',
  },
  postBody: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 19,
    textAlign: 'right',
    marginBottom: 14,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.border,
    paddingTop: 10,
  },
  interactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  actionBtnActive: {
    backgroundColor: 'rgba(123,30,58,0.08)',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.muted,
  },
  actionBtnTextActive: {
    color: theme.colors.brand[500],
    fontWeight: '800',
  },
  adminControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adminIconBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: theme.colors.surface.input,
  },
  commentsContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(223,211,194,0.5)',
    paddingTop: 12,
    marginTop: 10,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  commentInput: {
    flex: 1,
    height: 38,
    backgroundColor: theme.colors.surface.input,
    borderRadius: theme.radii.pill,
    paddingHorizontal: 14,
    fontSize: 11,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  sendCommentBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.brand[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentBubble: {
    backgroundColor: theme.colors.surface.input,
    borderRadius: theme.radii.sm,
    padding: 10,
    marginBottom: 6,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  commentAuthor: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  commentTime: {
    fontSize: 9,
    color: theme.colors.text.subtle,
  },
  commentText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    textAlign: 'right',
  },
  noCommentsText: {
    fontSize: 11,
    color: theme.colors.text.subtle,
    textAlign: 'center',
    marginVertical: 6,
  },

  /* Users / Teachers / Students styles */
  usersContainer: {
    gap: 12,
  },
  usersHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.brand[500],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radii.sm,
  },
  addUserButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.radii.pill,
    paddingHorizontal: 14,
    height: 42,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    textAlign: 'right',
    color: theme.colors.text.primary,
  },
  roleChipsScroll: {
    paddingVertical: 6,
    gap: 6,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surface.card,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  roleChipActive: {
    backgroundColor: theme.colors.brand[500],
    borderColor: theme.colors.brand[500],
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.muted,
  },
  roleChipTextActive: {
    color: '#FFFFFF',
  },
  usersList: {
    gap: 8,
    marginTop: 6,
  },
  userCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  userCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.brand[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  userSubDetails: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  roleTag: {
    backgroundColor: theme.colors.surface.input,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleTagText: {
    fontSize: 9,
    color: theme.colors.text.muted,
    fontWeight: '600',
  },
  userContact: {
    fontSize: 10,
    color: theme.colors.text.subtle,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#ECFDF5',
  },
  statusActiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  statusFrozen: {
    backgroundColor: '#FFE4E6',
  },
  statusFrozenText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#BE123C',
  },
  deleteUserBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FFE4E6',
  },

  /* Classes Grid */
  classesContainer: {
    gap: 12,
  },
  classesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  classCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    ...theme.shadows.sm,
  },
  classCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  classIconBg: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(123,30,58,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  className: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.brand[500],
    fontFamily: theme.typography.fontFamily.serif,
  },
  classBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(201,162,77,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginVertical: 4,
  },
  classBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.brand[500],
  },
  classDetails: {
    fontSize: 10,
    color: theme.colors.text.muted,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.colors.surface.card,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.border,
    paddingBottom: 14,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.brand[500],
    fontFamily: theme.typography.fontFamily.serif,
  },
  modalBody: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    textAlign: 'right',
    marginTop: 6,
    marginBottom: 3,
  },
  modalInput: {
    backgroundColor: theme.colors.surface.input,
    borderRadius: theme.radii.sm,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    fontSize: 12,
    textAlign: 'right',
  },
  modalTextArea: {
    height: 90,
    paddingTop: 8,
    textAlignVertical: 'top',
  },
  audienceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  audienceChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surface.input,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  audienceChipActive: {
    backgroundColor: theme.colors.brand[500],
    borderColor: theme.colors.brand[500],
  },
  audienceChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.muted,
  },
  audienceChipTextActive: {
    color: '#FFFFFF',
  },
  pinToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(201,162,77,0.10)',
    padding: 10,
    borderRadius: theme.radii.sm,
    marginTop: 6,
    marginBottom: 12,
  },
  pinToggleText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.gold[700],
    textAlign: 'right',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.gold[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: theme.colors.gold[600],
  },
  modalSubmitBtn: {
    marginTop: 14,
    marginBottom: 20,
  },

  /* Audit Logs list */
  auditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.border,
  },
  auditUser: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  auditIp: {
    fontSize: 10,
    color: theme.colors.text.subtle,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  auditBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  auditSuccess: {
    backgroundColor: '#ECFDF5',
  },
  auditFailed: {
    backgroundColor: '#FFE4E6',
  },
  auditBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  /* Reported Messages list */
  reportedCard: {
    backgroundColor: theme.colors.surface.input,
    borderRadius: theme.radii.sm,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  reportedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reportedSender: {
    fontSize: 11,
    fontWeight: '800',
    color: '#BE123C',
  },
  reportedGroup: {
    fontSize: 10,
    color: theme.colors.text.muted,
  },
  reportedContent: {
    fontSize: 12,
    color: theme.colors.text.primary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  reportedDate: {
    fontSize: 9,
    color: theme.colors.text.subtle,
    marginTop: 6,
    textAlign: 'left',
  },
  noDataText: {
    fontSize: 12,
    color: theme.colors.text.muted,
    textAlign: 'center',
    marginVertical: 16,
  },

  /* Teachers Directory Styles (Article 23 Web Parity) */
  teachersMainContainer: {
    gap: 14,
    marginBottom: 20,
  },
  teachersHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    ...theme.shadows.sm,
    gap: 12,
  },
  teachersHeaderTop: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  teachersHeaderTitleWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  teachersHeaderIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(123, 30, 58, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(123, 30, 58, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teachersHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    fontFamily: theme.typography.fontFamily.serif,
    textAlign: 'right',
  },
  teachersHeaderSubtitle: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 3,
    textAlign: 'right',
  },
  teachersActionButtonsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  teacherBtnImport: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7B1E3A',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  teacherBtnImportText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  teacherBtnExportExcel: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  teacherBtnExportExcelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  teacherBtnExportParents: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  teacherBtnExportParentsText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },

  teachersFilterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
    ...theme.shadows.sm,
    gap: 10,
  },
  teachersSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: theme.radii.pill,
    paddingHorizontal: 14,
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  teachersSearchInput: {
    flex: 1,
    fontSize: 12,
    textAlign: 'right',
    color: '#0F172A',
  },
  teacherStatusChipsRow: {
    flexDirection: 'row-reverse',
    gap: 6,
    paddingVertical: 2,
  },
  teacherStatusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.pill,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  teacherStatusChipActive: {
    backgroundColor: '#7B1E3A',
    borderColor: '#7B1E3A',
  },
  teacherStatusChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  teacherStatusChipTextActive: {
    color: '#FFFFFF',
  },

  teachersGridList: {
    gap: 12,
  },
  teacherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    ...theme.shadows.sm,
  },
  teacherCardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
  },
  teacherCardUserGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  teacherInitialsAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EFE2DC',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teacherInitialsText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#7B1E3A',
  },
  teacherCardTextInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  teacherCardName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    fontFamily: theme.typography.fontFamily.serif,
    textAlign: 'right',
  },
  teacherCardEmail: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'right',
  },

  tStatusBadgePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tStatusBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  tStatusBadgeActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  tStatusTextActive: {
    color: '#059669',
  },
  tStatusBadgeSuspended: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  tStatusTextSuspended: {
    color: '#D97706',
  },
  tStatusBadgeResigned: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  tStatusTextResigned: {
    color: '#64748B',
  },
  tStatusBadgeTerminated: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECDD3',
  },
  tStatusTextTerminated: {
    color: '#DC2626',
  },

  teacherCardBody: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    gap: 8,
  },
  teacherDetailRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teacherClassesRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  teacherDetailLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'right',
  },
  teacherDetailValueSubject: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'left',
    flex: 1,
    marginLeft: 10,
  },
  teacherDetailValueCycle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
    textAlign: 'left',
  },
  teacherDetailValuePhone: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'left',
  },
  teacherBadgesGroup: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 5,
    flex: 1,
    justifyContent: 'flex-start',
    marginLeft: 10,
  },
  teacherClassBadge: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  teacherClassBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  teacherGroupBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  teacherGroupBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#047857',
  },
  teacherNoneText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },

  teacherCardFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginTop: 10,
    gap: 8,
  },
  teacherDossierBtn: {
    flex: 1,
    height: 38,
    backgroundColor: '#7B1E3A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.4)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    ...theme.shadows.sm,
  },
  teacherDossierBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  teacherCardSmallBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teacherEditBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teacherTrashBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    justifyContent: 'center',
    alignItems: 'center',
  },

  teacherEmptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
    gap: 8,
  },
  teacherEmptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
    textAlign: 'center',
  },
  teacherEmptySubtitle: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  activeRouteSubHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(123, 30, 58, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201, 162, 77, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  activeRouteSubText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.brand[500],
  },
  backToOverviewBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: theme.colors.surface.card,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  backToOverviewText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  connectionErrorBanner: {
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FCA5A5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  connectionErrorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
    textAlign: 'right',
  },
  connectionErrorSub: {
    fontSize: 11,
    color: '#B91C1C',
    textAlign: 'right',
    marginTop: 2,
  },
  connectionRetryBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  connectionRetryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Student Directory Luxury Styles (Matching Screenshots 1 & 2) */
  studentBtnExportExcel: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  studentBtnExportExcelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  studentBtnImportStory: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7B1E3A',
    borderWidth: 1,
    borderColor: '#C9A24D',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    ...theme.shadows.sm,
  },
  studentBtnImportStoryText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  studentBtnImportNormal: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3E9DC',
    borderWidth: 1,
    borderColor: '#C9A24D',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  studentBtnImportNormalText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7B1E3A',
  },
  studentClassFilterRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingTop: 8,
  },
  studentClassChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2D9C8',
  },
  studentClassChipActive: {
    backgroundColor: '#7B1E3A',
    borderColor: '#C9A24D',
  },
  studentClassChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  studentClassChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  studentCardLuxury: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2D9C8',
    marginBottom: 14,
    ...theme.shadows.sm,
  },
  studentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F6F2',
  },
  studentCardUserGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    justifyContent: 'flex-start',
  },
  studentInitialsAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3E9DC',
    borderWidth: 1,
    borderColor: '#C9A24D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentInitialsAvatarText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#7B1E3A',
  },
  studentCardTextInfo: {
    alignItems: 'flex-end',
    flex: 1,
  },
  studentCardName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'right',
  },
  studentCardRegNum: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  studentCardBody: {
    paddingVertical: 10,
    gap: 8,
  },
  studentDetailRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentDetailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  studentDetailValueClass: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  studentDetailValueMono: {
    fontSize: 10.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#334155',
    maxWidth: '65%',
  },
  studentDetailValueText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  studentStatusActiveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  studentParentBox: {
    backgroundColor: '#FBF9F5',
    borderWidth: 1,
    borderColor: '#EFE9DE',
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
    gap: 5,
  },
  studentParentBoxTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#7B1E3A',
    textAlign: 'right',
    letterSpacing: 0.5,
  },
  studentParentRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EFE6',
  },
  studentParentLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  studentParentVal: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  studentParentValMono: {
    fontSize: 9.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#334155',
    maxWidth: '65%',
  },
  studentParentValPhone: {
    fontSize: 10.5,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#0F172A',
  },
  studentTeachersWrap: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  studentTeachersPillsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 4,
  },
  studentTeacherBadge: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  studentTeacherBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4338CA',
  },
  studentCardFooterLuxury: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    gap: 8,
  },
  studentDossierPrintBtn: {
    backgroundColor: '#F3E9DC',
    borderWidth: 1,
    borderColor: '#C9A24D',
    borderRadius: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  studentDossierPrintBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7B1E3A',
  },
  studentCardActionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  studentActionTrashBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingVertical: 7,
  },
  studentActionTrashText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  studentActionEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 7,
  },
  studentActionEditText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  studentActionDetailsBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingVertical: 7,
  },
  studentActionDetailsText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
