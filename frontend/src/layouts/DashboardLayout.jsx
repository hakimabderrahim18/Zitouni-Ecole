import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useSchoolStore } from '../store/useSchoolStore';
import SchoolLogo from '../components/SchoolLogo';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Menu, Bell, MessageSquare, BookOpen, CreditCard, Calendar, Users, X, Globe, ChevronLeft, ChevronRight, FileText, Palette, CheckSquare, Database, ShieldCheck, ShieldAlert, RefreshCw, Layers, AlertTriangle, Utensils, Camera, Trash2, Edit3, Save, Key, Phone, Check, AlertCircle, GraduationCap, Printer, TrendingUp, Megaphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '../store/useNotificationStore';
import { motion } from 'framer-motion';
import axios from 'axios';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'message':
      return {
        icon: <MessageSquare className="w-4 h-4 text-indigo-700 dark:text-indigo-300" />,
        bg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800'
      };
    case 'course':
      return {
        icon: <BookOpen className="w-4 h-4 text-[#7B1E3A] dark:text-[#E7C1CB]" />,
        bg: 'bg-[#FAF2F4] dark:bg-[#3A0F1D]/60 border-[#E7C1CB] dark:border-[#7B1E3A]/60'
      };
    case 'schedule':
      return {
        icon: <Calendar className="w-4 h-4 text-[#B28B36] dark:text-[#F3D78E]" />,
        bg: 'bg-[#FFFBEB] dark:bg-[#3D2C0C]/60 border-[#FDE68A] dark:border-[#C9A24D]/60'
      };
    case 'post':
      return {
        icon: <Globe className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />,
        bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
      };
    case 'attendance':
      return {
        icon: <CheckSquare className="w-4 h-4 text-amber-700 dark:text-amber-300" />,
        bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
      };
    case 'warning':
      return {
        icon: <AlertTriangle className="w-4 h-4 text-rose-700 dark:text-rose-300" />,
        bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800'
      };
    case 'assessment':
      return {
        icon: <GraduationCap className="w-4 h-4 text-[#7B1E3A] dark:text-[#E7C1CB]" />,
        bg: 'bg-[#FAF2F4] dark:bg-[#3A0F1D]/60 border-[#E7C1CB] dark:border-[#7B1E3A]/60'
      };
    case 'parent_notice':
      return {
        icon: <Megaphone className="w-4 h-4 text-amber-700 dark:text-amber-300" />,
        bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
      };
    default:
      return {
        icon: <Bell className="w-4 h-4 text-[#7B1E3A] dark:text-[#C9A24D]" />,
        bg: 'bg-[#FAF2F4] dark:bg-[#3A0F1D]/60 border-[#E7C1CB] dark:border-[#C9A24D]/40'
      };
  }
};

export default function DashboardLayout({ children, noPadding = false }) {
  const { user, profile, logout, updateUser } = useAuthStore();
  const { connectSocket, disconnectSocket } = useChatStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const { settings, fetchSettings } = useSchoolStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const fileInputRef = useRef(null);
  const desktopNotifRef = useRef(null);
  const mobileNotifRef = useRef(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarDeleting, setAvatarDeleting] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    password: '',
  });

  useEffect(() => {
    if (user) {
      setEditFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
        password: '',
      });
    }
  }, [user, profileOpen]);

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setProfileMsg(null);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await axios.post('/api/auth/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.user) {
        updateUser(res.data.user);
      } else if (res.data?.profilePic) {
        updateUser({ profilePic: res.data.profilePic });
      }
      setProfileMsg({ type: 'success', text: 'تم تحديث الصورة الشخصية بنجاح' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'فشل تحميل الصورة الشخصية' });
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAvatarDelete = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف الصورة الشخصية؟')) return;
    setAvatarDeleting(true);
    setProfileMsg(null);
    try {
      const res = await axios.delete('/api/auth/profile/avatar');
      if (res.data?.user) {
        updateUser(res.data.user);
      } else {
        updateUser({ profilePic: '' });
      }
      setProfileMsg({ type: 'success', text: 'تم إزالة الصورة الشخصية' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'فشل إزالة الصورة' });
    } finally {
      setAvatarDeleting(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const payload = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        phoneNumber: editFormData.phoneNumber,
      };
      if (editFormData.password.trim()) {
        payload.password = editFormData.password.trim();
      }
      const res = await axios.put('/api/auth/profile', payload);
      if (res.data?.user) {
        updateUser(res.data.user);
      } else {
        updateUser(payload);
      }
      setIsEditingProfile(false);
      setProfileMsg({ type: 'success', text: 'تم تحديث بيانات الحساب بنجاح' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'فشل حفظ التعديلات' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await axios.delete('/api/auth/account');
      setProfileOpen(false);
      logout();
      navigate('/');
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'تعذر حذف الحساب' });
      setDeletingAccount(false);
      setShowDeleteConfirm(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Connect user socket
    connectSocket(user.id);
    // Fetch notifications
    fetchNotifications();

    // Periodic sync every 30s as robust fallback
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => {
      clearInterval(interval);
      disconnectSocket();
    };
  }, [user]);

  // Click-outside listener for notifications dropdown (no ghost clicks, works on web & mobile)
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideDesktop = !desktopNotifRef.current || !desktopNotifRef.current.contains(event.target);
      const isOutsideMobile = !mobileNotifRef.current || !mobileNotifRef.current.contains(event.target);
      if (isOutsideDesktop && isOutsideMobile) {
        setNotificationsOpen(false);
      }
    };

    if (notificationsOpen) {
      document.addEventListener('pointerdown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [notificationsOpen]);

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) markAsRead(notif._id);
    setNotificationsOpen(false);

    if (notif.type === 'message') {
      navigate('/chat');
    } else if (notif.type === 'post') {
      navigate('/feed');
    } else if (notif.type === 'course') {
      if (user?.role === 'student') navigate('/dashboard/student/courses');
      else if (user?.role === 'teacher') navigate('/dashboard/teacher/courses');
      else if (user?.role === 'parent') navigate('/dashboard/parent');
      else if (user?.role === 'school') navigate('/dashboard/admin/classes');
      else if (user?.role === 'general_supervisor') navigate('/dashboard/general-supervisor');
      else if (user?.role === 'pedagogical_supervisor') navigate('/dashboard/pedagogical-supervisor');
      else if (user?.role === 'receptionist') navigate('/dashboard/receptionist');
      else navigate('/dashboard/admin');
    } else if (notif.type === 'schedule') {
      if (user?.role === 'student') navigate('/dashboard/student/schedules');
      else if (user?.role === 'parent') navigate('/dashboard/parent');
      else if (user?.role === 'teacher') navigate('/dashboard/teacher');
      else if (user?.role === 'school') navigate('/dashboard/admin/schedules');
      else if (user?.role === 'general_supervisor') navigate('/dashboard/general-supervisor');
      else if (user?.role === 'pedagogical_supervisor') navigate('/dashboard/pedagogical-supervisor');
      else if (user?.role === 'receptionist') navigate('/dashboard/receptionist');
      else navigate('/dashboard/admin');
    } else if (notif.type === 'assessment') {
      if (user?.role === 'student') navigate('/dashboard/student/grades');
      else if (user?.role === 'parent') navigate('/dashboard/parent/grades');
      else if (user?.role === 'teacher') navigate('/dashboard/teacher/grades');
      else navigate('/dashboard/admin/grades');
    } else if (notif.type === 'parent_notice') {
      if (user?.role === 'parent') navigate('/dashboard/parent/notices');
      else navigate('/dashboard/admin/parent-notices');
    } else if (notif.type === 'attendance' || notif.type === 'warning') {
      if (user?.role === 'student') navigate('/dashboard/student/attendance');
      else if (user?.role === 'parent') navigate('/dashboard/parent/attendance');
      else if (user?.role === 'teacher') navigate('/dashboard/teacher/attendance');
      else if (user?.role === 'general_supervisor') navigate('/dashboard/general-supervisor/student-attendance');
      else if (user?.role === 'pedagogical_supervisor') navigate('/dashboard/pedagogical-supervisor/student-attendance');
      else navigate('/dashboard/admin/attendance');
    } else {
      navigate('/feed');
    }
  };

  const getSidebarLinks = () => {
    switch (user?.role) {
      case 'admin':
      case 'school':
        return [
          { to: '/dashboard/admin', label: 'لوحة القيادة والمؤشرات', icon: BookOpen },
          { to: '/dashboard/admin/grades', label: 'إدارة نقاط الفروض والتقييمات', icon: GraduationCap },
          { to: '/dashboard/admin/report-cards', label: 'استخراج وطباعة كشوف النقاط', icon: Printer },
          { to: '/dashboard/admin/academic-stats', label: 'الإحصائيات ونسب الإنجاز', icon: TrendingUp },
          { to: '/dashboard/admin/parent-notices', label: 'مراسلات وإشعارات الأولياء', icon: Megaphone },
          { to: '/dashboard/admin/users', label: 'المستخدمين والصلاحيات', icon: Users },
          { to: '/dashboard/admin/teachers', label: 'قائمة الأساتذة (المادة 23)', icon: Users },
          { to: '/dashboard/admin/students', label: 'قائمة التلاميذ', icon: Users },
          { to: '/dashboard/admin/inscriptions', label: 'التسجيلات والملفات المدرسية', icon: FileText },
          { to: '/dashboard/admin/classes', label: 'الأقسام والأفواج الدراسية', icon: BookOpen },
          { to: '/dashboard/admin/attendance', label: 'سجل حضور وغياب التلاميذ والإنذارات', icon: CheckSquare },
          { to: '/dashboard/admin/timetable-official', label: 'جدول التوقيت واستيراد RAN09', icon: Calendar },
          { to: '/dashboard/admin/lessons', label: 'كراس الدروس والواجبات (Cahier de texte)', icon: BookOpen },
          { to: '/dashboard/admin/finance', label: 'التسيير المالي والرواتب والخصم التلقائي', icon: CreditCard },
          { to: '/dashboard/admin/modules', label: 'المواد الدراسية', icon: BookOpen },
          { to: '/dashboard/admin/documents', label: 'المستندات الإدارية', icon: FileText },
          { to: '/dashboard/admin/schedules', label: 'المخططات والجداول', icon: Calendar },
          { to: '/dashboard/admin/login-audit', label: 'سجل جلسات الدخول والأمان', icon: ShieldCheck },
          { to: '/dashboard/admin/branding', label: 'الهوية البصرية للمؤسسة', icon: Palette },
          { to: '/dashboard/admin/backups', label: 'النسخ الاحتياطي والأرشيف المشفر', icon: Database },
          { to: '/dashboard/admin/requests', label: 'الطلبات والشهادات الإدارية (Art. 38)', icon: FileText },
          { to: '/dashboard/admin/reported-messages', label: 'الرسائل المبلغ عنها', icon: ShieldAlert },
          { to: '/dashboard/admin/audit', label: 'رقابة المحادثات', icon: MessageSquare },
        ];
      case 'general_supervisor':
        return [
          { to: '/dashboard/general-supervisor', label: 'لوحة المراقب العام', icon: BookOpen },
          { to: '/dashboard/general-supervisor/student-attendance', label: 'حضور وغياب التلاميذ', icon: CheckSquare },
          { to: '/dashboard/general-supervisor/inscriptions', label: 'التسجيلات والملفات المدرسية', icon: FileText },
          { to: '/dashboard/general-supervisor/login-audit', label: 'سجل جلسات الدخول والأمان', icon: ShieldCheck },
          { to: '/dashboard/general-supervisor/reported-messages', label: 'الرسائل المبلغ عنها', icon: ShieldAlert },
          { to: '/dashboard/general-supervisor/timetable', label: 'جداول توقيت الأقسام والأساتذة', icon: Calendar },
          { to: '/dashboard/general-supervisor/lessons', label: 'كراس الدروس والواجبات والتأشيرات', icon: BookOpen },
          { to: '/dashboard/general-supervisor/attendance', label: 'حضور الأساتذة والموظفين والخصم', icon: Users },
          { to: '/dashboard/general-supervisor/classes-assignment', label: 'توزيع المراقبين التربويين', icon: Layers },
          { to: '/dashboard/general-supervisor/exit-passes', label: 'تراخيص خروج التلاميذ ومصادقة الإدارة', icon: LogOut },
          { to: '/dashboard/general-supervisor/damages', label: 'رقابة التجهيزات وسجل الإتلافات', icon: AlertTriangle },
          { to: '/dashboard/general-supervisor/canteen', label: 'حجوزات المطعم المدرسي (الكانتين)', icon: Utensils },
        ];
      case 'pedagogical_supervisor':
        return [
          { to: '/dashboard/pedagogical-supervisor', label: 'لوحة المراقب التربوي', icon: BookOpen },
          { to: '/dashboard/pedagogical-supervisor/student-attendance', label: 'تسجيل حضور وغياب التلاميذ (6 حالات)', icon: CheckSquare },
          { to: '/dashboard/pedagogical-supervisor/timetable', label: 'جداول توقيت الأقسام والأساتذة', icon: Calendar },
          { to: '/dashboard/pedagogical-supervisor/lessons', label: 'تأشيرة ومراقبة كراس الدروس', icon: BookOpen },
          { to: '/dashboard/pedagogical-supervisor/attendance', label: 'تفقد حضور الموظفين والأساتذة', icon: Calendar },
          { to: '/dashboard/pedagogical-supervisor/exit-pass', label: 'إصدار بطاقة ترخيص خروج تلميذ', icon: Users },
          { to: '/dashboard/pedagogical-supervisor/damages', label: 'التبليغ عن إتلاف في التجهيزات', icon: MessageSquare },
          { to: '/dashboard/pedagogical-supervisor/canteen', label: 'حجز المطعم المدرسي اليومي', icon: CreditCard },
        ];
      case 'receptionist':
        return [
          { to: '/dashboard/receptionist', label: 'لوحة موظف الاستقبال', icon: BookOpen },
          { to: '/dashboard/receptionist/visitors', label: 'سجل الزوار اليومي (دخول وخروج)', icon: Users },
          { to: '/dashboard/receptionist/exit-passes', label: 'المصادقة على بطاقات خروج التلاميذ', icon: Calendar },
        ];
      case 'teacher':
        return [
          { to: '/dashboard/teacher', label: 'لوحة التحكم', icon: BookOpen },
          { to: '/dashboard/teacher/grades', label: 'إدخال نقاط الفروض والتقييمات', icon: GraduationCap },
          { to: '/dashboard/teacher/lessons', label: 'كراس الدروس والواجبات المنزلية', icon: BookOpen },
          { to: '/dashboard/teacher/timetable', label: 'جدول توقيتي الأسبوعي (RAN09)', icon: Calendar },
          { to: '/dashboard/teacher/courses', label: 'المواد والدروس', icon: BookOpen },
          { to: '/dashboard/teacher/classes', label: 'أقسامي وأفواجي', icon: Users },
          { to: '/dashboard/teacher/attendance', label: 'سجل الغيابات', icon: Calendar },
          { to: '/dashboard/teacher/requests', label: 'الطلبات الإدارية وسكرتارية المؤسسة', icon: FileText },
        ];
      case 'student':
        return [
          { to: '/dashboard/student', label: 'لوحة التحكم', icon: BookOpen },
          { to: '/dashboard/student/grades', label: 'كشف النقاط ونتائجي', icon: GraduationCap },
          { to: '/dashboard/student/re-enrollment', label: 'إعادة التسجيل السنوية', icon: RefreshCw },
          { to: '/dashboard/student/lessons', label: 'كراس الدروس والواجبات المنزلية', icon: BookOpen },
          { to: '/dashboard/student/timetable', label: 'جدول توقيت القسم (RAN09)', icon: Calendar },
          { to: '/dashboard/student/courses', label: 'المقررات الدراسية', icon: BookOpen },
          { to: '/dashboard/student/schedules', label: 'مخطط الحصص', icon: Calendar },
          { to: '/dashboard/student/attendance', label: 'سجل الحضور', icon: Calendar },
        ];
      case 'parent':
        return [
          { to: '/dashboard/parent', label: 'لوحة التحكم', icon: BookOpen },
          { to: '/dashboard/parent/grades', label: 'كشوف النقاط والنتائج', icon: GraduationCap },
          { to: '/dashboard/parent/notices', label: 'مراسلات ومواعيد الإدارة', icon: Megaphone },
          { to: '/dashboard/parent/re-enrollment', label: 'إعادة تسجيل الأبناء', icon: RefreshCw },
          { to: '/dashboard/parent/lessons', label: 'كراس الدروس ومتابعة الواجبات', icon: BookOpen },
          { to: '/dashboard/parent/timetable', label: 'جدول توقيت الأبناء (RAN09)', icon: Calendar },
          { to: '/dashboard/parent/payments', label: 'الفواتير والمدفوعات', icon: CreditCard },
          { to: '/dashboard/parent/schedules', label: 'مخطط البرامج', icon: Calendar },
          { to: '/dashboard/parent/attendance', label: 'سجل الحضور والغيابات', icon: Users },
          { to: '/dashboard/parent/exit-passes', label: 'تراخيص وأذونات خروج الأبناء', icon: LogOut },
          { to: '/dashboard/parent/requests', label: 'الشهادات والطلبات الإدارية (Art. 38)', icon: FileText },
        ];
      default:
        return [];
    }
  };

  const links = getSidebarLinks();

  // Download an administrative document (teacher contract / parent regulations)
  const [downloadingDoc, setDownloadingDoc] = useState(false);
  const handleDownloadDocument = async (url, fileName) => {
    setDownloadingDoc(true);
    try {
      const res = await axios.get(url, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert(err.response?.status === 404 ? 'لم يتم نشر هذا المستند بعد من طرف الإدارة.' : 'تعذّر تحميل المستند.');
    } finally {
      setDownloadingDoc(false);
    }
  };

  const documentButton =
    user?.role === 'teacher'
      ? { label: 'عقد العمل', url: '/api/teachers/document/contract', fileName: 'contrat-de-travail.pdf' }
      : user?.role === 'parent'
      ? { label: 'القانون الداخلي', url: '/api/parents/document/regulations', fileName: 'reglement-interieur.pdf' }
      : null;

  return (
    <div className="theme-prestige flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden w-full max-w-full relative">
      {/* Mobile Sidebar overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 bg-slate-900/60 border-l border-luxury-border/50 glass-panel flex flex-col justify-between transform transition-all duration-300 md:translate-x-0 md:static ${
          sidebarOpen
            ? 'translate-x-0 opacity-100 visible pointer-events-auto'
            : 'translate-x-full opacity-0 invisible pointer-events-none md:visible md:opacity-100 md:pointer-events-auto md:translate-x-0'
        } ${sidebarCollapsed ? 'md:w-20 md:p-3' : 'md:w-80 lg:w-[330px] md:p-4 lg:p-5'} w-80 max-w-[90vw] p-4 sm:p-5`}
      >
        <div className="flex-1 min-h-0 flex flex-col gap-8">
          <div className="flex justify-between items-center gap-2 shrink-0">
            <Link
              to="/"
              onClick={() => setSidebarOpen(false)}
              className="text-xl font-bold flex items-center gap-2.5 overflow-hidden shrink-0 group"
            >
              <SchoolLogo size={36} />
              {!sidebarCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="font-black text-gray-900 text-base leading-tight break-words">
                    {settings?.schoolNameArabic || 'مدرسة حبر'}
                  </span>
                  <span className="text-[11px] font-bold font-mono text-[#7B1E3A] bg-[#F3E9DC] px-2 py-0.5 rounded-md border border-[#C9A24D]/40 mt-0.5 inline-block w-fit">
                    {settings?.academicYear || '2026-2027'}
                  </span>
                </div>
              )}
            </Link>
            
            <div className="flex gap-1.5 items-center">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:flex p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 border border-gray-200 hover:border-brand-300 transition-all cursor-pointer"
                title={sidebarCollapsed ? "توسيع القائمة" : "طي القائمة"}
              >
                {sidebarCollapsed ? <ChevronLeft className="w-4 h-4 text-brand-700" /> : <ChevronRight className="w-4 h-4 text-brand-700" />}
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 md:hidden cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <nav className="space-y-1.5 overflow-y-auto flex-1 min-h-0 pl-1 -ml-1 sidebar-scroll">
            {/* News feed is the primary entry point for every role */}
            <Link
              to="/feed"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 py-2.5 px-3 rounded-xl border transition-all group text-sm relative ${
                location.pathname === '/feed'
                  ? 'bg-brand-50 border-brand-300 text-[#7B1E3A] font-bold shadow-xs'
                  : 'text-gray-700 hover:text-brand-700 border-transparent hover:border-gray-200 hover:bg-gray-100/70 font-semibold'
              } ${sidebarCollapsed ? 'md:justify-center md:px-0' : ''}`}
            >
              <Globe className={`w-4.5 h-4.5 shrink-0 transition-colors ${location.pathname === '/feed' ? 'text-[#7B1E3A]' : 'text-gray-500 group-hover:text-brand-700'}`} />
              {!sidebarCollapsed && (
                <span className={`leading-snug break-words flex-1 text-xs sm:text-sm ${location.pathname === '/feed' ? '!text-[#7B1E3A] text-[#7B1E3A] font-bold' : 'text-gray-700 font-semibold group-hover:text-brand-700'}`}>
                  آخر الأخبار والمستجدات
                </span>
              )}
              {location.pathname === '/feed' && !sidebarCollapsed && (
                <motion.span
                  layoutId="activeBar"
                  className="absolute start-0 inset-y-1.5 w-1.5 bg-[#7B1E3A] rounded-e-full"
                />
              )}
            </Link>
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 py-2.5 px-3 rounded-xl border transition-all group text-sm relative ${
                    isActive
                      ? 'bg-brand-50 border-brand-300 text-[#7B1E3A] font-bold shadow-xs'
                      : 'text-gray-700 hover:text-brand-700 border-transparent hover:border-gray-200 hover:bg-gray-100/70 font-semibold'
                  } ${sidebarCollapsed ? 'md:justify-center md:px-0' : ''}`}
                >
                  <Icon className={`w-4.5 h-4.5 shrink-0 transition-colors ${isActive ? 'text-[#7B1E3A]' : 'text-gray-500 group-hover:text-brand-700'}`} />
                  {!sidebarCollapsed && (
                    <span className={`leading-snug break-words flex-1 text-xs sm:text-sm ${isActive ? '!text-[#7B1E3A] text-[#7B1E3A] font-bold' : 'text-gray-700 font-semibold group-hover:text-brand-700'}`}>
                      {link.label}
                    </span>
                  )}
                  {isActive && !sidebarCollapsed && (
                    <motion.span 
                      layoutId="activeBar"
                      className="absolute start-0 inset-y-1.5 w-1.5 bg-[#7B1E3A] rounded-e-full"
                    />
                  )}
                </Link>
              );
            })}
            <Link
              to="/chat"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 py-2.5 px-3 rounded-xl border transition-all group text-sm relative ${
                location.pathname === '/chat'
                  ? 'bg-brand-50 border-brand-300 text-[#7B1E3A] font-bold shadow-xs'
                  : 'text-gray-700 hover:text-brand-700 border-transparent hover:border-gray-200 hover:bg-gray-100/70 font-semibold'
              } ${sidebarCollapsed ? 'md:justify-center md:px-0' : ''}`}
            >
              <MessageSquare className={`w-4.5 h-4.5 shrink-0 transition-colors ${location.pathname === '/chat' ? 'text-[#7B1E3A]' : 'text-gray-500 group-hover:text-brand-700'}`} />
              {!sidebarCollapsed && (
                <span className={`leading-snug break-words flex-1 text-xs sm:text-sm ${location.pathname === '/chat' ? '!text-[#7B1E3A] text-[#7B1E3A] font-bold' : 'text-gray-700 font-semibold group-hover:text-brand-700'}`}>
                  الرسائل والمحادثة
                </span>
              )}
              {location.pathname === '/chat' && !sidebarCollapsed && (
                <motion.span 
                  layoutId="activeBar"
                  className="absolute start-0 inset-y-1.5 w-1.5 bg-[#7B1E3A] rounded-e-full"
                />
              )}
            </Link>
            {documentButton && (
              <button
                onClick={() => handleDownloadDocument(documentButton.url, documentButton.fileName)}
                disabled={downloadingDoc}
                title={documentButton.label}
                className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-xl border border-transparent hover:border-gray-200 hover:bg-gray-100/70 transition-all group text-sm text-gray-700 hover:text-brand-700 relative disabled:opacity-50 cursor-pointer ${
                  sidebarCollapsed ? 'md:justify-center md:px-0' : ''
                }`}
              >
                <FileText className="w-4.5 h-4.5 shrink-0 text-gray-500 group-hover:text-brand-700 transition-colors" />
                {!sidebarCollapsed && (
                  <span className="leading-snug break-words flex-1 text-xs sm:text-sm font-semibold text-start">
                    {downloadingDoc ? 'جاري التحميل...' : documentButton.label}
                  </span>
                )}
              </button>
            )}
          </nav>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div className={`flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-200 ${sidebarCollapsed ? 'justify-center p-1' : ''}`}>
            <div className="w-9 h-9 rounded-full overflow-hidden bg-brand-100 flex items-center justify-center font-bold text-brand-700 uppercase text-sm border border-brand-200 shrink-0 shadow-xs">
              {user?.profilePic ? (
                <img src={user.profilePic} className="w-full h-full object-cover" alt="" />
              ) : (
                <span>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-gray-900 leading-snug break-words">{user?.firstName} {user?.lastName}</span>
                <span className="block text-[10px] font-bold tracking-wider text-brand-700 leading-tight">
                  {user?.role === 'school' ? 'إدارة المدرسة' : user?.role === 'admin' ? 'مدير المنصة' : user?.role === 'teacher' ? 'أستاذ' : user?.role === 'general_supervisor' ? 'مراقب عام' : user?.role === 'pedagogical_supervisor' ? 'مراقب تربوي' : user?.role === 'receptionist' ? 'موظف الاستقبال' : user?.role === 'student' ? 'تلميذ' : user?.role === 'parent' ? 'ولي أمر' : user?.role}
                </span>
              </div>
            )}
          </div>

          <div className={`flex ${sidebarCollapsed ? 'flex-col items-center' : ''}`}>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className={`py-2.5 px-3 flex items-center justify-center gap-2 rounded-xl bg-red-955/20 border border-red-900/40 hover:bg-red-955/40 text-red-500 transition-all text-xs font-bold ${
                sidebarCollapsed ? 'w-10 h-10 p-0 rounded-xl' : 'w-full'
              }`}
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>تسجيل الخروج</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 max-w-full overflow-hidden">
        
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-3 sm:p-4 bg-white/95 backdrop-blur-md border-b border-gray-200 z-30 max-w-full relative shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-700 shrink-0 cursor-pointer"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <SchoolLogo size={24} className="shrink-0" />
            <span className="text-sm sm:text-base font-black text-gray-900 whitespace-nowrap">
              {settings?.schoolNameArabic || 'مدرسة حبر'}
            </span>
            <span className="hidden xs:inline-block px-2 py-0.5 rounded-md bg-[#F3E9DC] border border-[#C9A24D]/40 text-[#7B1E3A] font-bold text-[10px] shrink-0">
              {settings?.academicYear || '2026-2027'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Notifications toggle on mobile */}
            <div ref={mobileNotifRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen((prev) => !prev);
                  if (!notificationsOpen) fetchNotifications();
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-brand-700 transition-colors relative cursor-pointer"
                title="الإشعارات"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] font-extrabold text-white flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  className="absolute left-0 top-full mt-2 w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-[#FCFAF7] border border-[#D4AF37]/50 shadow-[0_20px_50px_rgba(123,30,58,0.22),_0_4px_12px_rgba(0,0,0,0.06)] z-50 p-3.5 space-y-3 max-h-80 overflow-y-auto text-right"
                  dir="rtl"
                >
                  <div className="flex justify-between items-center border-b border-[#E8DFD0] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#7B1E3A] font-serif">الإشعارات والتنبيهات</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#7B1E3A] text-white shadow-xs">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="text-[10px] font-bold text-[#7B1E3A] hover:text-[#551125] hover:underline transition-colors cursor-pointer"
                        >
                          قراءة الكل
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setNotificationsOpen(false)}
                        className="w-6 h-6 rounded-full bg-[#EFE8DC]/80 hover:bg-[#7B1E3A]/15 text-[#766065] hover:text-[#7B1E3A] flex items-center justify-center transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="text-center py-6 space-y-2 bg-white/70 rounded-xl border border-dashed border-[#D4AF37]/30">
                      <div className="w-10 h-10 rounded-full bg-[#7B1E3A]/10 text-[#7B1E3A] flex items-center justify-center mx-auto">
                        <Bell className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-medium text-[#766065]">لا توجد إشعارات جديدة حالياً.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((notif) => {
                        const notifStyle = getNotificationIcon(notif.type);
                        return (
                          <div
                            key={notif._id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-2.5 flex gap-2.5 cursor-pointer rounded-xl border transition-all text-start ${
                              notif.isRead 
                                ? 'bg-[#F9F6F0]/80 hover:bg-white border-[#E5DDD2] text-[#4A3A3D]' 
                                : 'bg-white border-[#EBD0D7] border-r-4 border-r-[#7B1E3A] shadow-xs hover:shadow-md'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${notifStyle.bg}`}>
                              {notifStyle.icon}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex justify-between items-start gap-1.5">
                                <span className={`text-[11px] font-bold ${notif.isRead ? 'text-[#4A3A3D]' : 'text-[#7B1E3A]'}`}>
                                  {notif.title}
                                </span>
                                {!notif.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-[#7B1E3A] ring-2 ring-[#7B1E3A]/20 shrink-0 mt-0.5" />
                                )}
                              </div>
                              <p className={`text-[11px] leading-relaxed font-cairo font-medium ${notif.isRead ? 'text-[#5A484C]' : 'text-[#2B2022]'}`}>{notif.content}</p>
                              <span className="text-[8px] text-[#8C757B] font-mono block text-end pt-0.5">
                                {new Date(notif.createdAt).toLocaleDateString('ar-DZ', { day: 'numeric', month: 'short' })} • {new Date(notif.createdAt).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Mobile Profile Trigger Button */}
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="w-8 h-8 rounded-full overflow-hidden bg-brand-650 flex items-center justify-center font-bold text-white uppercase text-xs border border-luxury-border/40"
            >
              {user?.profilePic ? (
                <img src={user.profilePic} className="w-full h-full object-cover" alt="" />
              ) : (
                <span>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
              )}
            </button>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white/95 backdrop-blur-md relative z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700 font-medium">
              مرحباً بك،{' '}
              <button
                onClick={() => setProfileOpen(true)}
                className="font-bold text-brand-700 hover:text-brand-800 transition-colors hover:underline focus:outline-none cursor-pointer"
              >
                {user?.firstName} {user?.lastName}
              </button>{' '}
              ! أهلاً بك في فضاءك الخاص.
            </span>
            <span className="px-3 py-1 rounded-full bg-[#F3E9DC] border border-[#C9A24D]/50 text-[#7B1E3A] font-extrabold text-xs shadow-2xs">
              السنة الدراسية {settings?.academicYear || '2026-2027'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div ref={desktopNotifRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen((prev) => !prev);
                  if (!notificationsOpen) fetchNotifications();
                }}
                className="p-2 hover:bg-[#7B1E3A]/10 rounded-xl text-slate-500 hover:text-[#7B1E3A] transition-all relative cursor-pointer border border-transparent hover:border-[#C9A24D]/30"
                title="الإشعارات والتنبيهات"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#7B1E3A] rounded-full text-[9px] font-extrabold text-white flex items-center justify-center animate-pulse shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  className="absolute left-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-[#FCFAF7] border border-[#D4AF37]/50 shadow-[0_25px_60px_-12px_rgba(123,30,58,0.25),_0_8px_24px_rgba(43,32,34,0.08)] z-50 p-4 space-y-3.5 max-h-[30rem] overflow-y-auto text-right"
                  dir="rtl"
                >
                  <div className="flex justify-between items-center border-b border-[#E8DFD0] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#7B1E3A] font-serif">الإشعارات والتنبيهات</span>
                      {unreadCount > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#7B1E3A] text-white shadow-xs">
                          {unreadCount} جديدة
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="text-xs font-bold text-[#7B1E3A] hover:text-[#551125] hover:underline transition-colors cursor-pointer"
                        >
                          قراءة الكل
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setNotificationsOpen(false)}
                        className="w-7 h-7 rounded-full bg-[#EFE8DC]/80 hover:bg-[#7B1E3A]/15 text-[#766065] hover:text-[#7B1E3A] flex items-center justify-center transition-all cursor-pointer"
                        title="إغلاق"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="text-center py-9 space-y-2.5 bg-white/70 rounded-2xl border border-dashed border-[#D4AF37]/35">
                      <div className="w-12 h-12 rounded-2xl bg-[#7B1E3A]/10 text-[#7B1E3A] flex items-center justify-center mx-auto border border-[#7B1E3A]/20 shadow-xs">
                        <Bell className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-[#2B2022]">لا توجد إشعارات جديدة حالياً</p>
                      <p className="text-xs text-[#766065]">ستظهر هنا كافة الإعلانات والرسائل والتنبيهات الخاصة بك</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {notifications.map((notif) => {
                        const notifStyle = getNotificationIcon(notif.type);
                        return (
                          <div
                            key={notif._id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-3.5 flex gap-3 cursor-pointer rounded-xl border transition-all text-start ${
                              notif.isRead 
                                ? 'bg-[#F9F6F0]/80 hover:bg-white border-[#E5DDD2] text-[#4A3A3D] hover:border-[#D4AF37]/60' 
                                : 'bg-white border-[#EBD0D7] border-r-4 border-r-[#7B1E3A] shadow-xs hover:shadow-md hover:border-[#7B1E3A]/60'
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${notifStyle.bg}`}>
                              {notifStyle.icon}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex justify-between items-start gap-2">
                                <span className={`text-xs font-bold leading-snug ${notif.isRead ? 'text-[#4A3A3D]' : 'text-[#7B1E3A]'}`}>
                                  {notif.title}
                                </span>
                                {!notif.isRead && (
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#7B1E3A] ring-4 ring-[#7B1E3A]/15 shrink-0 mt-0.5" />
                                )}
                              </div>
                              <p className={`text-[11px] leading-relaxed font-cairo font-medium ${notif.isRead ? 'text-[#5A484C]' : 'text-[#2B2022]'}`}>{notif.content}</p>
                              <span className="text-[9px] text-[#8C757B] font-mono block text-end pt-0.5">
                                {new Date(notif.createdAt).toLocaleDateString('ar-DZ', { day: 'numeric', month: 'short' })} • {new Date(notif.createdAt).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="w-px h-5 bg-gray-200"></div>
            
            {/* Interactive User profile widget */}
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-3 p-1.5 hover:bg-gray-100 rounded-xl transition-all border border-transparent hover:border-gray-200 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-650 flex items-center justify-center font-bold text-white uppercase text-sm border border-brand-500/30">
                {user?.profilePic ? (
                  <img src={user.profilePic} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                )}
              </div>
              <span className="text-sm font-bold text-gray-800 hover:text-brand-700 transition-colors">{user?.firstName} {user?.lastName}</span>
            </button>
          </div>
        </header>

        <div className={`flex-1 min-w-0 max-w-full ${noPadding ? 'p-1.5 sm:p-3 overflow-hidden flex flex-col h-[calc(100vh-4rem)]' : 'p-3.5 sm:p-6 md:p-8 overflow-y-auto overflow-x-hidden'}`}>
          {children}
        </div>

        {/* User Profile Details & Management Modal */}
        {profileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg border border-gray-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-gray-200 pb-4">
                <div className="flex items-center gap-4">
                  {/* Avatar with Upload & Delete Controls */}
                  <div className="relative group w-16 h-16 rounded-full overflow-hidden bg-brand-650 flex items-center justify-center font-bold text-white uppercase text-xl shrink-0 border-2 border-brand-500/40 shadow-inner">
                    {user?.profilePic ? (
                      <img src={user.profilePic} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                    )}

                    {/* Overlay Camera Button */}
                    <button
                      type="button"
                      disabled={avatarUploading || avatarDeleting}
                      onClick={() => fileInputRef.current?.click()}
                      title="تغيير الصورة الشخصية"
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-semibold cursor-pointer"
                    >
                      <Camera className="w-5 h-5 mb-0.5 text-brand-300" />
                      <span>{avatarUploading ? 'جاري الرفع...' : 'تغيير'}</span>
                    </button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-gray-900 truncate">{user?.firstName} {user?.lastName}</h3>
                      {user?.profilePic && (
                        <button
                          type="button"
                          onClick={handleAvatarDelete}
                          disabled={avatarDeleting}
                          title="حذف الصورة والرجوع للحروف الأولى"
                          className="p-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-all text-xs cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <span className="inline-block px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-brand-50 text-brand-700 border border-brand-200 mt-1">
                      {user?.role === 'school' ? 'إدارة المدرسة' : user?.role === 'admin' ? 'مدير المنصة' : user?.role === 'teacher' ? 'أستاذ' : user?.role === 'general_supervisor' ? 'مراقب عام' : user?.role === 'pedagogical_supervisor' ? 'مراقب تربوي' : user?.role === 'receptionist' ? 'موظف الاستقبال' : user?.role === 'student' ? 'تلميذ' : user?.role === 'parent' ? 'ولي أمر' : user?.role}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    setIsEditingProfile(false);
                    setShowDeleteConfirm(false);
                    setProfileMsg(null);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Message */}
              {profileMsg && (
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                    : 'bg-red-50 border-red-200 text-red-800 font-bold'
                }`}>
                  {profileMsg.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              {/* Mode Selector Tabs */}
              <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 gap-1">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    !isEditingProfile
                      ? 'bg-white text-brand-700 border border-gray-200 shadow-xs'
                      : 'text-gray-600 hover:text-brand-700'
                  }`}
                >
                  نظرة عامة
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(true)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isEditingProfile
                      ? 'bg-white text-brand-700 border border-gray-200 shadow-xs'
                      : 'text-gray-600 hover:text-brand-700'
                  }`}
                >
                  <Edit3 className={`w-3.5 h-3.5 ${isEditingProfile ? 'text-brand-700' : 'text-gray-500'}`} />
                  <span>تعديل البيانات</span>
                </button>
              </div>

              {/* View Mode */}
              {!isEditingProfile && (
                <div className="space-y-3.5 text-sm text-gray-800 text-right">
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <span className="text-xs text-gray-500 uppercase tracking-wide font-bold">البريد الإلكتروني:</span>
                    <span className="text-gray-900 font-bold select-all text-xs truncate max-w-[220px]" title={user?.email}>{user?.email}</span>
                  </div>
                  {user?.phoneNumber && (
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <span className="text-xs text-gray-500 uppercase tracking-wide font-bold font-cairo">الهاتف:</span>
                      <span className="text-gray-900 font-bold select-all font-mono text-xs">{user?.phoneNumber}</span>
                    </div>
                  )}

                  {/* Role-Specific details */}
                  {user?.role === 'student' && profile && (
                    <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 uppercase tracking-wide font-bold font-cairo">رقم التسجيل:</span>
                        <span className="text-gray-900 font-bold font-mono text-xs">{profile.registrationNumber || '—'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 uppercase tracking-wide font-bold font-cairo">القسم:</span>
                        <span className="text-gray-900 font-bold text-xs">{profile.class?.name || '—'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 uppercase tracking-wide font-bold font-cairo">الفوج:</span>
                        <span className="text-gray-900 font-bold text-xs">{profile.group?.name || '—'}</span>
                      </div>
                    </div>
                  )}

                  {user?.role === 'teacher' && profile && (
                    <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2">
                      <span className="block text-xs text-gray-500 uppercase tracking-wide font-bold font-cairo">المواد الموكلة:</span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {profile.subjects?.map((sub, idx) => (
                          <span key={idx} className="bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-xs text-brand-700 font-bold">{sub}</span>
                        )) || <span className="text-xs text-gray-500 italic">لا توجد مواد.</span>}
                      </div>
                    </div>
                  )}

                  {user?.role === 'parent' && profile && (
                    <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 uppercase tracking-wide font-bold font-cairo">المهنة:</span>
                        <span className="text-gray-900 font-bold text-xs">{profile.profession || '—'}</span>
                      </div>
                      <div className="flex flex-col gap-1.5 pt-1 border-b border-gray-200 pb-3">
                        <span className="text-xs text-gray-500 uppercase tracking-wide font-bold font-cairo">العنوان الشخصي:</span>
                        <span className="text-gray-900 font-semibold text-xs bg-white p-2.5 rounded-lg border border-gray-200 leading-relaxed block">{profile.address || '—'}</span>
                      </div>
                      {profile.children && profile.children.length > 0 && (
                        <div className="flex flex-col gap-2 pt-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide font-bold font-cairo">الأبناء المتمدرسون:</span>
                          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                            {profile.children.map((child, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-gray-200 shadow-xs">
                                <span className="text-gray-900 font-bold text-xs">
                                  {child.user?.firstName || child.firstName || '—'} {child.user?.lastName || child.lastName || '—'}
                                </span>
                                <span className="text-brand-700 text-xs font-bold bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                                  {child.class?.name || '—'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Edit Mode */}
              {isEditingProfile && (
                <form onSubmit={handleSaveProfile} className="space-y-4 text-right">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">الاسم الأول</label>
                      <input
                        type="text"
                        value={editFormData.firstName}
                        onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 text-xs font-semibold focus:outline-none focus:border-brand-600 focus:bg-white transition-all"
                        placeholder="الاسم"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">اللقب</label>
                      <input
                        type="text"
                        value={editFormData.lastName}
                        onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 text-xs font-semibold focus:outline-none focus:border-brand-600 focus:bg-white transition-all"
                        placeholder="اللقب"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                      <span>رقم الهاتف</span>
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                    </label>
                    <input
                      type="tel"
                      value={editFormData.phoneNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 text-xs font-semibold focus:outline-none focus:border-brand-600 focus:bg-white text-left font-mono transition-all"
                      placeholder="0797060052"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                      <span>تغيير كلمة المرور (اتركها فارغة للإبقاء على الحالية)</span>
                      <Key className="w-3.5 h-3.5 text-gray-400" />
                    </label>
                    <input
                      type="password"
                      value={editFormData.password}
                      onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 text-xs font-semibold focus:outline-none focus:border-brand-600 focus:bg-white text-left transition-all"
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingProfile ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 text-xs font-bold transition-all cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              )}

              {/* Account Deletion Area (App Store Guideline 5.1.1(v) Compliant) */}
              <div className="border-t border-gray-200 pt-3">
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-[11px] text-red-600/80 hover:text-red-700 underline transition-colors block text-center w-full cursor-pointer font-medium"
                  >
                    حذف الحساب نهائياً (App Store 5.1.1(v))
                  </button>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2 text-right">
                    <p className="text-xs text-red-800 font-semibold">هل أنت متأكد من رغبتك في حذف هذا الحساب نهائياً؟ سيتم حذف جميع بياناتك ولا يمكن استرجاعها.</p>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-xs font-medium cursor-pointer"
                      >
                        تراجع
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={deletingAccount}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
                      >
                        {deletingAccount ? 'جاري الحذف...' : 'نعم، حذف الحساب'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    setIsEditingProfile(false);
                    setShowDeleteConfirm(false);
                    setProfileMsg(null);
                  }}
                  className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 transition-all text-xs font-bold cursor-pointer"
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                    navigate('/');
                  }}
                  className="py-3 px-5 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 transition-all text-xs font-bold cursor-pointer"
                >
                  تسجيل الخروج
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
