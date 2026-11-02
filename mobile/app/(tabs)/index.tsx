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
} from 'lucide-react-native';
import { apiClient } from '../../src/api/client';
import { useAuthStore } from '../../src/store/useAuthStore';
import { SchoolLogo } from '../../src/components/SchoolLogo';
import { Button } from '../../src/components/common/Button';
import { theme } from '../../src/theme/tokens';
import { NavigationDrawer, ADMIN_NAV_ITEMS } from '../../src/components/NavigationDrawer';
import { DashboardHeader } from '../../src/components/DashboardHeader';

/* ==================================================================== */
/*  Main Component: Unified Admin Dashboard & All 21 Modules            */
/* ==================================================================== */

export default function AdminScreen() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'school';

  // Navigation Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<string>('overview');

  // Loading & Refreshing
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core Data States
  const [stats, setStats] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [modulesList, setModulesList] = useState<any[]>([]);
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
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (postsRes.data) setPosts(postsRes.data.posts || postsRes.data || []);
      if (usersRes.data) setSystemUsers(usersRes.data.users || usersRes.data || []);
      if (classesRes.data) setClassesList(classesRes.data.classes || classesRes.data || []);
      if (teachersRes.data) setTeachersList(teachersRes.data.teachers || teachersRes.data || []);
      if (studentsRes.data) setStudentsList(studentsRes.data.students || studentsRes.data || []);
      if (modulesRes.data) setModulesList(modulesRes.data.modules || modulesRes.data || []);
      if (docsRes.data) setDocumentsList(docsRes.data.documents || docsRes.data || []);
      if (schedulesRes.data) setSchedulesList(schedulesRes.data.schedules || schedulesRes.data || []);
      if (backupsRes.data) setBackupsList(backupsRes.data.backups || []);
      if (requestsRes.data) setAdminRequestsList(requestsRes.data.requests || requestsRes.data || []);
      if (reportedRes.data) setReportedMessagesList(Array.isArray(reportedRes.data) ? reportedRes.data : []);
      if (auditRes.data) setLoginAuditList(Array.isArray(auditRes.data) ? auditRes.data : []);
      if (lessonsRes.data) setLessonsList(lessonsRes.data.lessons || lessonsRes.data || []);
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
      const name = `${s.firstNameArabic || s.user?.firstName || ''} ${s.lastNameArabic || s.user?.lastName || ''}`;
      return (
        !studentSearch.trim() ||
        name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.registrationNumber || '').includes(studentSearch)
      );
    });
  }, [studentsList, studentSearch]);

  const filteredTeachers = useMemo(() => {
    return teachersList.filter((t) => {
      const name = `${t.user?.firstName || ''} ${t.user?.lastName || ''}`;
      return !teacherSearch.trim() || name.toLowerCase().includes(teacherSearch.toLowerCase());
    });
  }, [teachersList, teacherSearch]);

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
      ) : (
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.brand[500]]}
            />
          }
        >
          {/* ============================================================ */}
          {/* ROUTE 1: FEED (آخر الأخبار والمستجدات)                       */}
          {/* ============================================================ */}
          {currentRoute === 'feed' && (
            <View style={styles.feedContainer}>
              <View style={styles.bannerCard}>
                <View style={styles.bannerContent}>
                  <View style={styles.bannerIcon}>
                    <Megaphone size={24} color="#F3E9DC" />
                  </View>
                  <View style={styles.bannerTextGroup}>
                    <Text style={styles.bannerTitle}>فضاء التواصل الأكاديمي</Text>
                    <Text style={styles.bannerSubtitle}>
                      تابع الإعلانات والأخبار وتفاعل مع مجتمعك التعليمي
                    </Text>
                  </View>
                  <View style={styles.liveBadge}>
                    <Sparkles size={12} color={theme.colors.gold[500]} />
                    <Text style={styles.liveBadgeText}>مباشر</Text>
                  </View>
                </View>
              </View>

              {/* Publish Box */}
              <View style={styles.publishCard}>
                <Text style={styles.publishHeader}>إدارة ونشر الإعلانات الرسمية</Text>
                <Text style={styles.publishDesc}>
                  بصفتك إدارة المؤسسة، يمكنك نشر البيانات والمذكرات الرسمية لجميع المستخدمين.
                </Text>
                <Button
                  label="نشر إعلان رسمي جديد"
                  onPress={() => setShowCreatePostModal(true)}
                  style={styles.publishActionBtn}
                />
              </View>

              <Text style={styles.feedHeaderTitle}>جميع المنشورات والإعلانات الرسمية</Text>

              {posts.map((item) => {
                const authorName = item.publisher
                  ? `${item.publisher.firstName} ${item.publisher.lastName}`
                  : 'الإدارة العامة';
                const authorRole = getRoleLabel(item.publisher?.role);
                const likesCount = item.reactionCounts?.total ?? (item.likes?.length || 0);
                const hasLiked =
                  (item.likes || []).includes(user?.id || '') || item.userReaction === 'like';
                const commentsCount = item.comments?.length || 0;
                const isCommentsOpen = !!expandedComments[item._id];

                return (
                  <View key={item._id} style={styles.postCard}>
                    {item.isPinned && (
                      <View style={styles.pinnedBanner}>
                        <Pin size={13} color={theme.colors.gold[600]} />
                        <Text style={styles.pinnedBannerText}>إعلان رسمي مثبت في الواجهة</Text>
                      </View>
                    )}

                    <View style={styles.authorHeader}>
                      <View style={styles.avatarCrest}>
                        <Text style={styles.avatarCrestText}>{authorName[0] || 'إ'}</Text>
                      </View>
                      <View style={styles.authorTextGroup}>
                        <View style={styles.authorNameRow}>
                          <Text style={styles.authorName}>{authorName}</Text>
                          <CheckCircle2 size={13} color={theme.colors.gold[500]} />
                        </View>
                        <Text style={styles.authorRole}>{authorRole}</Text>
                      </View>
                      <View style={styles.timeTag}>
                        <Clock size={11} color={theme.colors.text.subtle} />
                        <Text style={styles.timeTagText}>{timeAgo(item.createdAt)}</Text>
                      </View>
                    </View>

                    <Text style={styles.postTitle}>{item.title}</Text>
                    <Text style={styles.postBody}>{item.content}</Text>

                    <View style={styles.postFooter}>
                      <View style={styles.interactionRow}>
                        <TouchableOpacity
                          style={[styles.actionBtn, hasLiked && styles.actionBtnActive]}
                          onPress={() => handleToggleLike(item._id)}
                        >
                          <Heart
                            size={16}
                            color={hasLiked ? theme.colors.brand[500] : theme.colors.text.muted}
                            fill={hasLiked ? theme.colors.brand[500] : 'transparent'}
                          />
                          <Text
                            style={[styles.actionBtnText, hasLiked && styles.actionBtnTextActive]}
                          >
                            {likesCount} إعجاب
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() =>
                            setExpandedComments((prev) => ({
                              ...prev,
                              [item._id]: !prev[item._id],
                            }))
                          }
                        >
                          <MessageSquare size={16} color={theme.colors.text.muted} />
                          <Text style={styles.actionBtnText}>{commentsCount} تعليق</Text>
                        </TouchableOpacity>
                      </View>

                      {isAdmin && (
                        <View style={styles.adminControlsRow}>
                          <TouchableOpacity
                            style={styles.adminIconBtn}
                            onPress={() => handleTogglePin(item._id)}
                          >
                            <Pin
                              size={15}
                              color={
                                item.isPinned ? theme.colors.gold[600] : theme.colors.text.muted
                              }
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.adminIconBtn}
                            onPress={() => {
                              setEditingPost(item);
                              setEditTitle(item.title);
                              setEditContent(item.content);
                            }}
                          >
                            <Edit3 size={15} color={theme.colors.text.muted} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.adminIconBtn}
                            onPress={() => handleDeletePost(item._id)}
                          >
                            <Trash2 size={15} color="#E11D48" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>

                    {isCommentsOpen && (
                      <View style={styles.commentsContainer}>
                        <View style={styles.commentInputRow}>
                          <TextInput
                            style={styles.commentInput}
                            placeholder="اكتب تعليقاً..."
                            placeholderTextColor={theme.colors.text.subtle}
                            value={commentInputs[item._id] || ''}
                            onChangeText={(t) =>
                              setCommentInputs((prev) => ({ ...prev, [item._id]: t }))
                            }
                          />
                          <TouchableOpacity
                            style={styles.sendCommentBtn}
                            onPress={() => handleAddComment(item._id)}
                          >
                            <Send size={14} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>

                        {item.comments && item.comments.length > 0 ? (
                          item.comments.map((c: any) => (
                            <View key={c._id} style={styles.commentBubble}>
                              <View style={styles.commentHeader}>
                                <Text style={styles.commentAuthor}>{c.userName || 'مستخدم'}</Text>
                                <Text style={styles.commentTime}>{timeAgo(c.createdAt)}</Text>
                              </View>
                              <Text style={styles.commentText}>{c.content}</Text>
                            </View>
                          ))
                        ) : (
                          <Text style={styles.noCommentsText}>لا توجد تعليقات بعد.</Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* ============================================================ */}
          {/* ROUTE 2: OVERVIEW (لوحة القيادة والمؤشرات)                    */}
          {/* ============================================================ */}
          {currentRoute === 'overview' && (
            <View style={styles.overviewContainer}>
              {/* 3 Quick Action Banners */}
              <View style={styles.quickBannersGroup}>
                <TouchableOpacity
                  style={styles.quickBannerCard}
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
                    متابعة سجلات تسجيل الدخول، رصد المحاولات الفاشلة، الأجهزة، وإلغاء حظر الحسابات.
                  </Text>
                  <View style={styles.quickBannerFooter}>
                    <Text style={styles.quickBannerLinkText}>فتح السجل والمتابعة</Text>
                    <Text style={styles.quickBannerArrow}>←</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickBannerCard}
                  onPress={() => setCurrentRoute('inscriptions')}
                  activeOpacity={0.85}
                >
                  <View style={styles.quickBannerTop}>
                    <View style={[styles.quickBannerIconBg, { backgroundColor: theme.colors.gold[500] }]}>
                      <FileText size={22} color="#FFFFFF" />
                    </View>
                    <View style={[styles.quickBannerPill, { backgroundColor: 'rgba(201,162,77,0.15)' }]}>
                      <Text style={[styles.quickBannerPillText, { color: theme.colors.brand[500] }]}>تسجيلات رسمية</Text>
                    </View>
                  </View>
                  <Text style={styles.quickBannerTitle}>التسجيلات واستخراج الوصولات</Text>
                  <Text style={styles.quickBannerDesc}>
                    تسجيل التلاميذ باستمارة أو Excel، استخراج وصل التسجيل الفوري، وتوليد وحفظ الملف المدرسي.
                  </Text>
                  <View style={styles.quickBannerFooter}>
                    <Text style={styles.quickBannerLinkText}>إدارة التسجيلات والوصولات</Text>
                    <Text style={styles.quickBannerArrow}>←</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickBannerCard}
                  onPress={() => setCurrentRoute('reported-messages')}
                  activeOpacity={0.85}
                >
                  <View style={styles.quickBannerTop}>
                    <View style={[styles.quickBannerIconBg, { backgroundColor: '#E11D48' }]}>
                      <ShieldAlert size={22} color="#FFFFFF" />
                    </View>
                    <View style={[styles.quickBannerPill, { backgroundColor: '#FFE4E6' }]}>
                      <Text style={[styles.quickBannerPillText, { color: '#BE123C' }]}>بلاغات وانضباط</Text>
                    </View>
                  </View>
                  <Text style={styles.quickBannerTitle}>الرسائل والمحادثات المبلغ عنها</Text>
                  <Text style={styles.quickBannerDesc}>
                    مراجعة البلاغات الواردة من المستخدمين حول الرسائل والمحادثات المخالفة واتخاذ إجراء.
                  </Text>
                  <View style={styles.quickBannerFooter}>
                    <Text style={styles.quickBannerLinkText}>معالجة البلاغات الإدارية</Text>
                    <Text style={styles.quickBannerArrow}>←</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* 5 Daily Operational KPIs */}
              <Text style={styles.sectionTitle}>مؤشرات الأداء والتشغيل اليومي</Text>
              <View style={styles.kpiRow}>
                <View style={styles.kpiCard}>
                  <View style={styles.kpiHeader}>
                    <Text style={[styles.kpiLabel, { color: '#BE123C' }]}>الغيابات اليومية</Text>
                    <ShieldAlert size={16} color="#E11D48" />
                  </View>
                  <Text style={[styles.kpiValue, { color: '#BE123C' }]}>
                    {stats?.todayAbsences ?? 0}
                  </Text>
                  <Text style={styles.kpiSub}>غيابات مسجلة اليوم</Text>
                </View>

                <View style={styles.kpiCard}>
                  <View style={styles.kpiHeader}>
                    <Text style={[styles.kpiLabel, { color: '#B45309' }]}>التأخرات المسجلة</Text>
                    <Calendar size={16} color="#D97706" />
                  </View>
                  <Text style={[styles.kpiValue, { color: '#B45309' }]}>
                    {stats?.todayLates ?? 0}
                  </Text>
                  <Text style={styles.kpiSub}>تأخرات بحاجة لتبرير</Text>
                </View>

                <View style={styles.kpiCard}>
                  <View style={styles.kpiHeader}>
                    <Text style={[styles.kpiLabel, { color: '#047857' }]}>التسجيلات الجديدة</Text>
                    <GraduationCap size={16} color="#059669" />
                  </View>
                  <Text style={[styles.kpiValue, { color: '#047857' }]}>
                    {stats?.newRegistrations ?? stats?.students ?? 0}
                  </Text>
                  <Text style={styles.kpiSub}>ملفات مكتملة</Text>
                </View>

                <View style={styles.kpiCard}>
                  <View style={styles.kpiHeader}>
                    <Text style={[styles.kpiLabel, { color: theme.colors.brand[500] }]}>رسائل غير مقروءة</Text>
                    <MessageSquare size={16} color={theme.colors.brand[500]} />
                  </View>
                  <Text style={[styles.kpiValue, { color: theme.colors.brand[500] }]}>
                    {stats?.unreadAdminMessages ?? 0}
                  </Text>
                  <Text style={styles.kpiSub}>مرسلة للإدارة</Text>
                </View>

                <View style={styles.kpiCard}>
                  <View style={styles.kpiHeader}>
                    <Text style={[styles.kpiLabel, { color: '#1D4ED8' }]}>الطلبات الإدارية</Text>
                    <FileText size={16} color="#2563EB" />
                  </View>
                  <Text style={[styles.kpiValue, { color: '#1D4ED8' }]}>
                    {stats?.receivedRequests ?? 0}
                  </Text>
                  <Text style={styles.kpiSub}>شهادات ومبررات</Text>
                </View>
              </View>

              {/* 4 Global Counts */}
              <Text style={styles.sectionTitle}>الإحصائيات العامة للمؤسسة</Text>
              <View style={styles.globalCountsRow}>
                <View style={styles.countCard}>
                  <View style={styles.countTextGroup}>
                    <Text style={styles.countLabel}>إجمالي التلاميذ</Text>
                    <Text style={styles.countValue}>{stats?.students ?? 0}</Text>
                  </View>
                  <View style={styles.countIconBg}>
                    <Users size={22} color={theme.colors.brand[500]} />
                  </View>
                </View>

                <View style={styles.countCard}>
                  <View style={styles.countTextGroup}>
                    <Text style={styles.countLabel}>إجمالي الأساتذة</Text>
                    <Text style={styles.countValue}>{stats?.teachers ?? 0}</Text>
                  </View>
                  <View style={styles.countIconBg}>
                    <Users size={22} color={theme.colors.brand[500]} />
                  </View>
                </View>

                <View style={styles.countCard}>
                  <View style={styles.countTextGroup}>
                    <Text style={styles.countLabel}>الأقسام الدراسية</Text>
                    <Text style={styles.countValue}>{stats?.classes ?? 0}</Text>
                  </View>
                  <View style={styles.countIconBg}>
                    <BookOpen size={22} color={theme.colors.brand[500]} />
                  </View>
                </View>

                <View style={styles.countCard}>
                  <View style={styles.countTextGroup}>
                    <Text style={styles.countLabel}>مجموع المداخيل</Text>
                    <Text style={[styles.countValue, { color: '#059669' }]}>
                      {stats?.totalRevenue ? `${stats.totalRevenue.toLocaleString()} دج` : '0 دج'}
                    </Text>
                  </View>
                  <View style={[styles.countIconBg, { backgroundColor: '#ECFDF5' }]}>
                    <CreditCard size={22} color="#059669" />
                  </View>
                </View>
              </View>

              {/* Financial Transactions Hub */}
              <View style={styles.financeHubCard}>
                <View style={styles.financeHubHeader}>
                  <View>
                    <Text style={styles.financeHubTitle}>آخر المعاملات المالية المنجزة</Text>
                    <Text style={styles.financeHubSub}>إيصالات المصاريف والخدمات المسددة</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addInvoiceBtn}
                    onPress={() => setShowCreatePaymentModal(true)}
                  >
                    <Plus size={14} color="#FFFFFF" />
                    <Text style={styles.addInvoiceBtnText}>إنشاء فاتورة</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.transactionsList}>
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
                          : pay.type === 'Food' || pay.type === 'Lunch'
                          ? 'الإطعام المدرسي'
                          : pay.type === 'Activity'
                          ? 'النشاطات'
                          : pay.type;

                      return (
                        <View key={pay._id} style={styles.transactionRow}>
                          <View style={styles.transactionRight}>
                            <View style={styles.transactionIconBg}>
                              <CreditCard size={16} color={isPaid ? '#059669' : '#D97706'} />
                            </View>
                            <View>
                              <Text style={styles.transactionStudent}>{studentName}</Text>
                              <Text style={styles.transactionType}>{typeLabel}</Text>
                            </View>
                          </View>
                          <View style={styles.transactionLeft}>
                            <Text style={styles.transactionAmount}>
                              {pay.amount.toLocaleString()} دج
                            </Text>
                            <View
                              style={[
                                styles.statusBadge,
                                isPaid ? styles.statusPaid : styles.statusPending,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusBadgeText,
                                  isPaid ? styles.statusPaidText : styles.statusPendingText,
                                ]}
                              >
                                {isPaid ? 'مسدد' : 'معلق'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <Text style={styles.noDataText}>لا توجد معاملات مالية مسجلة حالياً</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* ROUTE 3: USERS & ACCOUNTS (المستخدمين والصلاحيات)              */}
          {/* ============================================================ */}
          {currentRoute === 'users' && (
            <View style={styles.usersContainer}>
              <View style={styles.usersHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>المستخدمين والصلاحيات</Text>
                  <Text style={styles.sectionSubtitle}>
                    إدارة {systemUsers.length} حساباً: الأساتذة، الأولياء، التلاميذ والموظفين
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.addUserButton}
                  onPress={() => setShowCreateUserModal(true)}
                >
                  <Plus size={15} color="#FFFFFF" />
                  <Text style={styles.addUserButtonText}>إضافة مستخدم</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.searchBar}>
                <Search size={18} color={theme.colors.text.muted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="البحث بالاسم، البريد أو رقم الهاتف..."
                  placeholderTextColor={theme.colors.text.subtle}
                  value={userSearch}
                  onChangeText={setUserSearch}
                />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.roleChipsScroll}
              >
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'teacher', label: 'أساتذة' },
                  { id: 'student', label: 'تلاميذ' },
                  { id: 'parent', label: 'أولياء' },
                  { id: 'pedagogical_supervisor', label: 'مراقب تربوي' },
                  { id: 'general_supervisor', label: 'مراقب عام' },
                  { id: 'receptionist', label: 'استقبال' },
                  { id: 'admin', label: 'إدارة' },
                ].map((chip) => (
                  <TouchableOpacity
                    key={chip.id}
                    style={[styles.roleChip, userRoleFilter === chip.id && styles.roleChipActive]}
                    onPress={() => setUserRoleFilter(chip.id)}
                  >
                    <Text
                      style={[
                        styles.roleChipText,
                        userRoleFilter === chip.id && styles.roleChipTextActive,
                      ]}
                    >
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.usersList}>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <View key={u._id} style={styles.userCard}>
                      <View style={styles.userCardRight}>
                        <View style={styles.userAvatar}>
                          <Text style={styles.userAvatarText}>{u.firstName[0] || 'م'}</Text>
                        </View>
                        <View style={styles.userInfo}>
                          <View style={styles.userNameRow}>
                            <Text style={styles.userName}>
                              {u.firstName} {u.lastName}
                            </Text>
                            <View style={styles.roleTag}>
                              <Text style={styles.roleTagText}>{getRoleLabel(u.role)}</Text>
                            </View>
                          </View>
                          <Text style={styles.userContact}>{u.phoneNumber || u.email}</Text>
                        </View>
                      </View>

                      <View style={styles.userActions}>
                        <TouchableOpacity
                          style={[
                            styles.statusToggleBtn,
                            u.isActive ? styles.statusActive : styles.statusFrozen,
                          ]}
                          onPress={() => handleToggleUserActive(u)}
                        >
                          {u.isActive ? (
                            <>
                              <Check size={12} color="#059669" />
                              <Text style={styles.statusActiveText}>مفعل</Text>
                            </>
                          ) : (
                            <>
                              <Lock size={12} color="#BE123C" />
                              <Text style={styles.statusFrozenText}>مجمد</Text>
                            </>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.deleteUserBtn}
                          onPress={() => handleDeleteUser(u._id, `${u.firstName} ${u.lastName}`)}
                        >
                          <Trash2 size={14} color="#BE123C" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noDataText}>لا توجد حسابات مطابقة لمعايير البحث</Text>
                )}
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* ROUTE 4: TEACHERS (قائمة الأساتذة - المادة 23)               */}
          {/* ============================================================ */}
          {currentRoute === 'teachers' && (
            <View style={styles.usersContainer}>
              <Text style={styles.sectionTitle}>قائمة الأساتذة وهيئة التدريس (المادة 23)</Text>
              <Text style={styles.sectionSubtitle}>
                متابعة عقود العمل، الساعات الأسبوعية، والملف المهني لـ {teachersList.length} أستاذ(ة)
              </Text>

              <View style={styles.searchBar}>
                <Search size={18} color={theme.colors.text.muted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="ابحث عن أستاذ..."
                  placeholderTextColor={theme.colors.text.subtle}
                  value={teacherSearch}
                  onChangeText={setTeacherSearch}
                />
              </View>

              <View style={styles.usersList}>
                {filteredTeachers.map((t) => {
                  const name = `${t.user?.firstName || ''} ${t.user?.lastName || ''}`;
                  const phone = t.user?.phoneNumber || 'غير مسجل';
                  const subjects = (t.subjects || []).join(', ') || 'تعليم عام';
                  const classes = (t.classes || []).map((c: any) => c.name).join(', ') || 'غير معين';

                  return (
                    <View key={t._id} style={styles.userCard}>
                      <View style={styles.userCardRight}>
                        <View style={[styles.userAvatar, { backgroundColor: theme.colors.brand[600] }]}>
                          <Text style={styles.userAvatarText}>{name[0] || 'أ'}</Text>
                        </View>
                        <View style={styles.userInfo}>
                          <Text style={styles.userName}>{name}</Text>
                          <Text style={styles.userSubDetails}>المادة: {subjects} • الأقسام: {classes}</Text>
                          <Text style={styles.userContact}>الهاتف: {phone} • عقد: {t.contractType || 'CDI'}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* ROUTE 5: STUDENTS (قائمة التلاميذ)                            */}
          {/* ============================================================ */}
          {currentRoute === 'students' && (
            <View style={styles.usersContainer}>
              <Text style={styles.sectionTitle}>دليل التلاميذ المقيدين بالمؤسسة</Text>
              <Text style={styles.sectionSubtitle}>
                إجمالي التلاميذ المسجلين في قاعدة البيانات: {studentsList.length} تلميذ
              </Text>

              <View style={styles.searchBar}>
                <Search size={18} color={theme.colors.text.muted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="البحث بالاسم، اللقب أو رقم التسجيل..."
                  placeholderTextColor={theme.colors.text.subtle}
                  value={studentSearch}
                  onChangeText={setStudentSearch}
                />
              </View>

              <View style={styles.usersList}>
                {filteredStudents.slice(0, 50).map((s) => {
                  const studentName = `${s.firstNameArabic || s.user?.firstName || ''} ${s.lastNameArabic || s.user?.lastName || ''}`;
                  const className = s.class?.name || 'بدون قسم';
                  const isPaid = s.tuitionPaid;

                  return (
                    <View key={s._id} style={styles.userCard}>
                      <View style={styles.userCardRight}>
                        <View style={styles.userAvatar}>
                          <Text style={styles.userAvatarText}>{studentName[0] || 'ت'}</Text>
                        </View>
                        <View style={styles.userInfo}>
                          <Text style={styles.userName}>{studentName}</Text>
                          <Text style={styles.userSubDetails}>
                            القسم: {className} • رقم القيد: {s.registrationNumber || 'REG-000'}
                          </Text>
                          <Text style={styles.userContact}>
                            النظام: {s.regime || 'عادي'} • تصريح خروج: {s.isExitAuthorized ? 'مصرّح' : 'محظور'}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          isPaid ? styles.statusPaid : styles.statusPending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            isPaid ? styles.statusPaidText : styles.statusPendingText,
                          ]}
                        >
                          {isPaid ? 'المصاريف مسددة' : 'غير مسدد'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* ROUTE 6: INSCRIPTIONS (التسجيلات والملفات المدرسية)            */}
          {/* ============================================================ */}
          {currentRoute === 'inscriptions' && (
            <View style={styles.usersContainer}>
              <View style={styles.usersHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>التسجيلات والملفات المدرسية</Text>
                  <Text style={styles.sectionSubtitle}>
                    متابعة طلبات التسجيل، استخراج الوصولات، والملفات المكتملة
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.addUserButton}
                  onPress={() => setShowCreateEnrollmentModal(true)}
                >
                  <Plus size={15} color="#FFFFFF" />
                  <Text style={styles.addUserButtonText}>تسجيل تلميذ جديد</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.kpiRow}>
                <View style={styles.kpiCard}>
                  <Text style={[styles.kpiLabel, { color: '#047857' }]}>الملفات المقبولة</Text>
                  <Text style={[styles.kpiValue, { color: '#047857' }]}>
                    {studentsList.filter((s) => s.registrationStatus === 'accepted').length || studentsList.length}
                  </Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={[styles.kpiLabel, { color: '#B45309' }]}>ملفات قيد المعالجة</Text>
                  <Text style={[styles.kpiValue, { color: '#B45309' }]}>0</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={[styles.kpiLabel, { color: theme.colors.brand[500] }]}>قائمة الانتظار</Text>
                  <Text style={[styles.kpiValue, { color: theme.colors.brand[500] }]}>0</Text>
                </View>
              </View>

              <View style={styles.usersList}>
                {studentsList.slice(0, 15).map((s) => (
                  <View key={s._id} style={styles.userCard}>
                    <View style={styles.userCardRight}>
                      <View style={styles.userAvatar}>
                        <FileText size={18} color="#FFFFFF" />
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>
                          {s.firstNameArabic || s.user?.firstName} {s.lastNameArabic || s.user?.lastName}
                        </Text>
                        <Text style={styles.userSubDetails}>
                          وصل رقم: {s.receiptNumber || 'REC-2026-000'} • قسم: {s.class?.name || 'غير محدد'}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, styles.statusPaid]}>
                      <Text style={[styles.statusBadgeText, styles.statusPaidText]}>ملف مكتمل</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* ROUTE 7: CLASSES & GROUPS (الأقسام والأفواج)                 */}
          {/* ============================================================ */}
          {currentRoute === 'classes' && (
            <View style={styles.classesContainer}>
              <View style={styles.usersHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>الأقسام والأفواج الدراسية</Text>
                  <Text style={styles.sectionSubtitle}>
                    إدارة {classesList.length} قسماً دراسياً
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.addUserButton}
                  onPress={() => setShowCreateClassModal(true)}
                >
                  <Plus size={15} color="#FFFFFF" />
                  <Text style={styles.addUserButtonText}>إنشاء قسم جديد</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.classesGrid}>
                {classesList.map((c) => (
                  <View key={c._id} style={styles.classCard}>
                    <View style={styles.classCardHeader}>
                      <View style={styles.classIconBg}>
                        <GraduationCap size={18} color={theme.colors.brand[500]} />
                      </View>
                      <Text style={styles.className}>{c.name}</Text>
                    </View>
                    <View style={styles.classBadge}>
                      <Text style={styles.classBadgeText}>{c.level || 'طور التعليم'}</Text>
                    </View>
                    <Text style={styles.classDetails}>
                      عدد الأفواج: {c.groups?.length || 1} • السنة: 2026-2027
                    </Text>
                  </View>
                ))}
              </View>
            </View>
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

          {/* ============================================================ */}
          {/* ROUTE 21: CHAT (الرسائل والمحادثة)                           */}
          {/* ============================================================ */}
          {currentRoute === 'chat' && (
            <View style={styles.overviewContainer}>
              <Text style={styles.sectionTitle}>الرسائل والمحادثات المباشرة</Text>
              <Text style={styles.sectionSubtitle}>
                يمكنك التوجه إلى قسم المحادثات من التبويب السفلي للتواصل الفوري.
              </Text>
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
      {/* MODAL: Create Payment Invoice                                    */}
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
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>المبلغ (دج)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="15000"
                keyboardType="numeric"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
              />
              <Text style={styles.inputLabel}>نوع الخدمة</Text>
              <View style={styles.audienceRow}>
                {['Tuition', 'Transport', 'Food', 'Activity'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.audienceChip, paymentType === t && styles.audienceChipActive]}
                    onPress={() => setPaymentType(t)}
                  >
                    <Text style={[styles.audienceChipText, paymentType === t && styles.audienceChipTextActive]}>
                      {t}
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
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================================================================ */}
      {/* MODAL: Create User                                               */}
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
              <Text style={styles.inputLabel}>الاسم</Text>
              <TextInput style={styles.modalInput} value={newUserFirstName} onChangeText={setNewUserFirstName} />
              <Text style={styles.inputLabel}>اللقب</Text>
              <TextInput style={styles.modalInput} value={newUserLastName} onChangeText={setNewUserLastName} />
              <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
              <TextInput style={styles.modalInput} keyboardType="email-address" value={newUserEmail} onChangeText={setNewUserEmail} />
              <Text style={styles.inputLabel}>رقم الهاتف</Text>
              <TextInput style={styles.modalInput} keyboardType="phone-pad" value={newUserPhone} onChangeText={setNewUserPhone} />
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
      {/* MODAL: Create Class                                              */}
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
              <Text style={styles.inputLabel}>اسم القسم</Text>
              <TextInput style={styles.modalInput} placeholder="مثل: 3AS" value={newClassName} onChangeText={setNewClassName} />
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
      {/* MODAL: Create Module                                             */}
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
              <Text style={styles.inputLabel}>اسم المادة</Text>
              <TextInput style={styles.modalInput} value={newModuleName} onChangeText={setNewModuleName} />
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
    </View>
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
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(201,162,77,0.35)',
    ...theme.shadows.sm,
  },
  quickBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickBannerIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickBannerPill: {
    backgroundColor: 'rgba(123,30,58,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  quickBannerPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.brand[500],
  },
  quickBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.brand[500],
    fontFamily: theme.typography.fontFamily.serif,
    marginTop: 10,
  },
  quickBannerDesc: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 18,
    marginTop: 4,
  },
  quickBannerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(201,162,77,0.2)',
    paddingTop: 10,
    marginTop: 12,
  },
  quickBannerLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.brand[500],
  },
  quickBannerArrow: {
    fontSize: 14,
    color: theme.colors.brand[500],
    fontWeight: 'bold',
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,162,77,0.3)',
    ...theme.shadows.sm,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: theme.typography.fontFamily.serif,
  },
  kpiSub: {
    fontSize: 9,
    color: theme.colors.text.subtle,
    marginTop: 2,
  },

  globalCountsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  countCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.radii.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  countTextGroup: {
    flex: 1,
  },
  countLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.muted,
  },
  countValue: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.brand[500],
    marginTop: 2,
  },
  countIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(123,30,58,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Finance Hub */
  financeHubCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    ...theme.shadows.sm,
    marginBottom: 16,
  },
  financeHubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.border,
    paddingBottom: 12,
    marginBottom: 12,
  },
  financeHubTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  financeHubSub: {
    fontSize: 10,
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  addInvoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.brand[500],
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radii.sm,
  },
  addInvoiceBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
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
});
