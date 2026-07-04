import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Menu, Bell, MessageSquare, BookOpen, CreditCard, Calendar, Users, X, Globe, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '../store/useNotificationStore';
import { motion } from 'framer-motion';
import axios from 'axios';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'message':
      return {
        icon: <MessageSquare className="w-4 h-4 text-indigo-400" />,
        bg: 'bg-indigo-950/50 border-indigo-900/40'
      };
    case 'course':
      return {
        icon: <BookOpen className="w-4 h-4 text-brand-400" />,
        bg: 'bg-brand-950/50 border-brand-900/40'
      };
    case 'schedule':
      return {
        icon: <Calendar className="w-4 h-4 text-amber-400" />,
        bg: 'bg-amber-950/50 border-amber-900/40'
      };
    case 'post':
      return {
        icon: <Globe className="w-4 h-4 text-emerald-400" />,
        bg: 'bg-emerald-950/50 border-emerald-900/40'
      };
    default:
      return {
        icon: <Bell className="w-4 h-4 text-slate-400" />,
        bg: 'bg-slate-800 border-slate-705'
      };
  }
};

export default function DashboardLayout({ children }) {
  const { user, profile, logout } = useAuthStore();
  const { connectSocket, disconnectSocket } = useChatStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Connect user socket
    connectSocket(user.id);
    // Fetch notifications
    fetchNotifications();
    return () => disconnectSocket();
  }, [user]);

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
      else navigate('/dashboard/admin');
    } else if (notif.type === 'schedule') {
      if (user?.role === 'student') navigate('/dashboard/student/schedules');
      else if (user?.role === 'parent') navigate('/dashboard/parent');
      else if (user?.role === 'teacher') navigate('/dashboard/teacher');
      else if (user?.role === 'school') navigate('/dashboard/admin/schedules');
      else navigate('/dashboard/admin');
    }
  };

  const getSidebarLinks = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { to: '/dashboard/admin', label: 'نظرة عامة', icon: BookOpen },
          { to: '/dashboard/admin/users', label: 'حسابات المستخدمين', icon: Users },
          { to: '/dashboard/admin/audit', label: 'رقابة الرسائل', icon: MessageSquare },
        ];
      case 'school':
        return [
          { to: '/dashboard/admin', label: 'الأموال والفوترة', icon: CreditCard },
          { to: '/dashboard/admin/accounts', label: 'تنشيط وتعديل حسابات النظام', icon: Users },
          { to: '/dashboard/admin/students', label: 'قائمة التلاميذ', icon: Users },
          { to: '/dashboard/admin/teachers', label: 'قائمة الأساتذة', icon: Users },
          { to: '/dashboard/admin/classes-create', label: 'إنشاء قسم / فوج دراسي', icon: BookOpen },
          { to: '/dashboard/admin/classes', label: 'قائمة الأقسام والأفواج الدراسية', icon: BookOpen },
          { to: '/dashboard/admin/modules', label: 'المواد الدراسية', icon: BookOpen },
          { to: '/dashboard/admin/documents', label: 'المستندات الإدارية', icon: FileText },
          { to: '/dashboard/admin/schedules', label: 'إنشاء أو تعديل جدول حصص / مخطط', icon: Calendar },
          { to: '/dashboard/admin/schedules-guide', label: 'دليل الجداول والمخططات الحالية', icon: Calendar },
        ];
      case 'teacher':
        return [
          { to: '/dashboard/teacher', label: 'لوحة التحكم', icon: BookOpen },
          { to: '/dashboard/teacher/courses', label: 'المواد والدروس', icon: BookOpen },
          { to: '/dashboard/teacher/classes', label: 'أقسامي وأفواجي', icon: Users },
          { to: '/dashboard/teacher/attendance', label: 'سجل الغيابات', icon: Calendar },
        ];
      case 'student':
        return [
          { to: '/dashboard/student', label: 'لوحة التحكم', icon: BookOpen },
          { to: '/dashboard/student/courses', label: 'الدروس والواجبات', icon: BookOpen },
          { to: '/dashboard/student/schedules', label: 'جدول الحصص', icon: Calendar },
          { to: '/dashboard/student/attendance', label: 'سجل الحضور', icon: Calendar },
        ];
      case 'parent':
        return [
          { to: '/dashboard/parent', label: 'لوحة التحكم', icon: BookOpen },
          { to: '/dashboard/parent/payments', label: 'الفواتير والمدفوعات', icon: CreditCard },
          { to: '/dashboard/parent/schedules', label: 'جدول التوقيت والبرامج', icon: Calendar },
          { to: '/dashboard/parent/attendance', label: 'سجل الحضور والغيابات', icon: Users },
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
    <div className="theme-sand flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Mobile Sidebar overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 bg-slate-900/60 border-l border-luxury-border/50 glass-panel flex flex-col justify-between p-6 transform transition-transform duration-300 md:translate-x-0 md:static ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        } ${sidebarCollapsed ? 'md:w-20 md:p-3' : 'md:w-64 md:p-6'} w-64`}
      >
        <div className="flex-1 min-h-0 flex flex-col gap-8">
          <div className="flex justify-between items-center gap-2 shrink-0">
            <Link to="/" className="text-xl font-bold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent flex items-center gap-2 overflow-hidden shrink-0">
              <span className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-brand-400/20 shrink-0">ز</span>
              {!sidebarCollapsed && <span className="truncate">مدرسة الزيتوني</span>}
            </Link>
            
            <div className="flex gap-1.5 items-center">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:flex p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 border border-luxury-border/30 hover:border-brand-500/25 transition-all"
                title={sidebarCollapsed ? "توسيع القائمة" : "طي القائمة"}
              >
                {sidebarCollapsed ? <ChevronLeft className="w-4 h-4 text-brand-500" /> : <ChevronRight className="w-4 h-4 text-brand-500" />}
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-slate-900 rounded-lg text-slate-400 md:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <nav className="space-y-2 overflow-y-auto flex-1 min-h-0 pl-1 -ml-1 sidebar-scroll">
            {/* News feed is the primary entry point for every role */}
            <Link
              to="/feed"
              className={`flex items-center gap-3 py-3 px-4 rounded-xl border border-transparent hover:border-luxury-border/40 hover:bg-slate-905/30 transition-all group text-sm text-slate-400 hover:text-brand-600 relative ${
                location.pathname === '/feed' ? 'bg-brand-500/10 border-brand-500/20 text-brand-600 font-semibold' : ''
              } ${sidebarCollapsed ? 'md:justify-center md:px-0' : ''}`}
            >
              <Globe className={`w-4.5 h-4.5 group-hover:text-brand-500 transition-colors ${location.pathname === '/feed' ? 'text-brand-500' : 'text-brand-400'}`} />
              {!sidebarCollapsed && <span className="truncate">آخر الأخبار والمستجدات</span>}
              {location.pathname === '/feed' && !sidebarCollapsed && (
                <motion.span
                  layoutId="activeBar"
                  className="absolute start-0 top-3 bottom-3 w-1.5 bg-brand-500 rounded-e-full"
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
                  className={`flex items-center gap-3 py-3 px-4 rounded-xl border border-transparent hover:border-luxury-border/40 hover:bg-slate-905/30 transition-all group text-sm text-slate-400 hover:text-brand-600 relative ${
                    isActive ? 'bg-brand-500/10 border-brand-500/20 text-brand-600 font-semibold' : ''
                  } ${sidebarCollapsed ? 'md:justify-center md:px-0' : ''}`}
                >
                  <Icon className={`w-4.5 h-4.5 group-hover:text-brand-500 transition-colors ${isActive ? 'text-brand-500' : 'text-brand-400'}`} />
                  {!sidebarCollapsed && <span className="truncate">{link.label}</span>}
                  {isActive && !sidebarCollapsed && (
                    <motion.span 
                      layoutId="activeBar"
                      className="absolute start-0 top-3 bottom-3 w-1.5 bg-brand-500 rounded-e-full"
                    />
                  )}
                </Link>
              );
            })}
            <Link
              to="/chat"
              className={`flex items-center gap-3 py-3 px-4 rounded-xl border border-transparent hover:border-luxury-border/40 hover:bg-slate-905/30 transition-all group text-sm text-slate-400 hover:text-brand-600 relative ${
                location.pathname === '/chat' ? 'bg-brand-500/10 border-brand-500/20 text-brand-600 font-semibold' : ''
              } ${sidebarCollapsed ? 'md:justify-center md:px-0' : ''}`}
            >
              <MessageSquare className={`w-4.5 h-4.5 group-hover:text-brand-500 transition-colors ${location.pathname === '/chat' ? 'text-brand-500' : 'text-brand-400'}`} />
              {!sidebarCollapsed && <span className="truncate">الرسائل والمحادثة</span>}
              {location.pathname === '/chat' && !sidebarCollapsed && (
                <motion.span 
                  layoutId="activeBar"
                  className="absolute start-0 top-3 bottom-3 w-1.5 bg-brand-500 rounded-e-full"
                />
              )}
            </Link>
            {documentButton && (
              <button
                onClick={() => handleDownloadDocument(documentButton.url, documentButton.fileName)}
                disabled={downloadingDoc}
                title={documentButton.label}
                className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl border border-transparent hover:border-luxury-border/40 hover:bg-slate-905/30 transition-all group text-sm text-slate-400 hover:text-brand-600 relative disabled:opacity-50 ${
                  sidebarCollapsed ? 'md:justify-center md:px-0' : ''
                }`}
              >
                <FileText className="w-4.5 h-4.5 text-brand-400 group-hover:text-brand-500 transition-colors" />
                {!sidebarCollapsed && (
                  <span className="truncate">{downloadingDoc ? 'جاري التحميل...' : documentButton.label}</span>
                )}
              </button>
            )}
          </nav>
        </div>

        <div className="space-y-4 pt-4 border-t border-luxury-border/20">
          <div className={`flex items-center gap-3 p-2 rounded-xl bg-slate-950/20 border border-luxury-border/30 ${sidebarCollapsed ? 'justify-center p-1' : ''}`}>
            <div className="w-9 h-9 rounded-full overflow-hidden bg-brand-900/40 flex items-center justify-center font-bold text-brand-500 uppercase text-sm border border-luxury-border/20 shrink-0 shadow-inner">
              {user?.profilePic ? (
                <img src={user.profilePic} className="w-full h-full object-cover" alt="" />
              ) : (
                <span>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <span className="block text-xs font-semibold text-white truncate">{user?.firstName} {user?.lastName}</span>
                <span className="block text-[9px] uppercase tracking-wider text-slate-500 truncate">
                  {user?.role === 'school' ? 'إدارة المدرسة' : user?.role === 'admin' ? 'مدير المنصة' : user?.role === 'teacher' ? 'أستاذ' : user?.role === 'student' ? 'تلميذ' : user?.role === 'parent' ? 'ولي أمر' : user?.role}
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
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 glass-panel border-b border-luxury-border/50 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-lg font-bold bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">
              مدرسة الزيتوني
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications toggle on mobile */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  if (!notificationsOpen) fetchNotifications();
                }}
                className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-100 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] font-extrabold text-white flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div
                    onClick={() => setNotificationsOpen(false)}
                    className="fixed inset-0 z-40"
                  />
                  <div className="absolute left-0 mt-3 w-72 rounded-2xl bg-slate-900 border border-luxury-border/80 shadow-[0_15px_50px_rgba(0,0,0,0.1)] z-50 p-4 space-y-3.5 max-h-80 overflow-y-auto text-right">
                    <div className="flex justify-between items-center border-b border-luxury-border/30 pb-2.5">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">الإشعارات</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[9px] font-semibold text-brand-500 hover:text-brand-650 transition-colors"
                        >
                          قراءة الكل
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-500 italic">
                        لا توجد إشعارات جديدة.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {notifications.map((notif) => {
                          const notifStyle = getNotificationIcon(notif.type);
                          return (
                            <div
                              key={notif._id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`py-2.5 flex gap-2.5 cursor-pointer rounded-xl px-2.5 border transition-all text-start ${
                                notif.isRead 
                                  ? 'bg-slate-950/20 border-luxury-border/10 hover:bg-slate-950/40 hover:border-luxury-border/25 text-slate-400' 
                                  : 'bg-brand-955/10 border-brand-500/20 hover:bg-brand-955/15 hover:border-brand-500/30 text-slate-100'
                              }`}
                            >
                              <div className={`w-7.5 h-7.5 rounded-lg border flex items-center justify-center shrink-0 ${notifStyle.bg}`}>
                                {notifStyle.icon}
                              </div>
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <div className="flex justify-between items-start gap-1.5">
                                  <span className={`text-[10px] font-bold group-hover:text-brand-300 transition-colors ${
                                    notif.isRead ? 'text-slate-400' : 'text-slate-100'
                                  }`}>
                                    {notif.title}
                                  </span>
                                  {!notif.isRead && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0 mt-1" />
                                  )}
                                </div>
                                <p className="text-[9px] text-slate-450 leading-relaxed font-cairo font-medium">{notif.content}</p>
                                <span className="text-[7px] text-slate-500 font-mono block text-right pt-0.5">
                                  {new Date(notif.createdAt).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
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
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-luxury-border/50 glass-panel relative z-30">
          <span className="text-sm text-slate-350 font-medium">
            مرحباً بك،{' '}
            <button
              onClick={() => setProfileOpen(true)}
              className="font-semibold text-brand-500 hover:text-brand-650 transition-colors hover:underline focus:outline-none cursor-pointer"
            >
              {user?.firstName} {user?.lastName}
            </button>{' '}
            ! أهلاً بك في فضاءك الخاص.
          </span>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  if (!notificationsOpen) fetchNotifications();
                }}
                className="p-2 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-100 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-extrabold text-white flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div
                    onClick={() => setNotificationsOpen(false)}
                    className="fixed inset-0 z-40"
                  />
                  <div className="absolute left-0 mt-3 w-80 rounded-2xl bg-slate-900 border border-luxury-border/80 shadow-[0_15px_50px_rgba(0,0,0,0.1)] z-50 p-4 space-y-3.5 max-h-96 overflow-y-auto text-right">
                    <div className="flex justify-between items-center border-b border-luxury-border/30 pb-2.5">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">الإشعارات</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[10px] font-semibold text-brand-500 hover:text-brand-650 transition-colors"
                        >
                          تعليم الكل كمقروء
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-500 italic">
                        لا توجد إشعارات جديدة.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {notifications.map((notif) => {
                          const notifStyle = getNotificationIcon(notif.type);
                          return (
                            <div
                              key={notif._id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`py-2.5 flex gap-3 cursor-pointer rounded-xl px-2.5 border transition-all text-start ${
                                notif.isRead 
                                  ? 'bg-slate-950/20 border-luxury-border/10 hover:bg-slate-950/40 hover:border-luxury-border/25 text-slate-400' 
                                  : 'bg-brand-955/10 border-brand-500/20 hover:bg-brand-955/15 hover:border-brand-500/30 text-slate-100'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${notifStyle.bg}`}>
                                {notifStyle.icon}
                              </div>
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <div className="flex justify-between items-start gap-2">
                                  <span className={`text-[11px] font-bold group-hover:text-brand-300 transition-colors ${
                                    notif.isRead ? 'text-slate-400' : 'text-slate-100'
                                  }`}>
                                    {notif.title}
                                  </span>
                                  {!notif.isRead && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0 mt-1.5" />
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-455 leading-relaxed font-cairo font-medium">{notif.content}</p>
                                <span className="text-[7.5px] text-slate-500 font-mono block text-right pt-0.5">
                                  {new Date(notif.createdAt).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="w-px h-5 bg-slate-800"></div>
            
            {/* Interactive User profile widget */}
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-3 p-1.5 hover:bg-slate-900/60 rounded-xl transition-all border border-transparent hover:border-luxury-border"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-650 flex items-center justify-center font-bold text-white uppercase text-sm border border-luxury-border/30">
                {user?.profilePic ? (
                  <img src={user.profilePic} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                )}
              </div>
              <span className="text-sm font-medium text-slate-300 hover:text-white transition-colors">{user?.firstName} {user?.lastName}</span>
            </button>
          </div>
        </header>

        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </div>

        {/* User Profile Details Modal (Unified for Desktop and Mobile) */}
        {profileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
            <div className="glass-panel w-full max-w-md border border-luxury-border rounded-2xl p-6 md:p-8 space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
              <div className="flex justify-between items-start border-b border-luxury-border/40 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-brand-650 flex items-center justify-center font-bold text-white uppercase text-xl shrink-0 border border-brand-500/20">
                    {user?.profilePic ? (
                      <img src={user.profilePic} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white truncate">{user?.firstName} {user?.lastName}</h3>
                    <span className="inline-block px-2.5 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded-full bg-brand-100 text-brand-700 border border-brand-300/40 mt-1">
                      {user?.role === 'school' ? 'إدارة المدرسة' : user?.role === 'admin' ? 'مدير المنصة' : user?.role === 'teacher' ? 'أستاذ' : user?.role === 'student' ? 'تلميذ' : user?.role === 'parent' ? 'ولي أمر' : user?.role}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  className="p-1.5 hover:bg-slate-900 rounded-lg border border-luxury-border/50 text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-sm text-slate-330 text-right">
                <div className="flex justify-between items-center bg-slate-900/20 p-2.5 rounded-xl border border-luxury-border/30">
                  <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">البريد الإلكتروني:</span>
                  <span className="text-white select-all text-xs truncate max-w-[220px]" title={user?.email}>{user?.email}</span>
                </div>
                {user?.phoneNumber && (
                  <div className="flex justify-between items-center bg-slate-900/20 p-2.5 rounded-xl border border-luxury-border/30">
                    <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold font-cairo">الهاتف:</span>
                    <span className="text-white select-all font-mono text-xs">{user?.phoneNumber}</span>
                  </div>
                )}

                {/* Role-Specific details */}
                {user?.role === 'student' && profile && (
                  <div className="bg-slate-900/20 p-3.5 rounded-xl border border-luxury-border/30 space-y-3.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold font-cairo">رقم التسجيل:</span>
                      <span className="text-white font-mono text-xs">{profile.registrationNumber || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold font-cairo">القسم:</span>
                      <span className="text-white text-xs">{profile.class?.name || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold font-cairo">الفوج:</span>
                      <span className="text-white text-xs">{profile.group?.name || '—'}</span>
                    </div>
                  </div>
                )}

                {user?.role === 'teacher' && profile && (
                  <div className="bg-slate-900/20 p-3.5 rounded-xl border border-luxury-border/30 space-y-2">
                    <span className="block text-xs text-slate-500 uppercase tracking-wide font-semibold font-cairo">المواد الموكلة:</span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {profile.subjects?.map((sub, idx) => (
                        <span key={idx} className="bg-slate-950 border border-luxury-border/50 px-2.5 py-1 rounded-lg text-xs text-brand-600 font-medium">{sub}</span>
                      )) || <span className="text-xs text-slate-550 italic">لا توجد مواد.</span>}
                    </div>
                  </div>
                )}

                {user?.role === 'parent' && profile && (
                  <div className="bg-slate-900/20 p-3.5 rounded-xl border border-luxury-border/30 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold font-cairo">المهنة:</span>
                      <span className="text-white text-xs">{profile.profession || '—'}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 pt-1 border-b border-luxury-border/10 pb-3">
                      <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold font-cairo">العنوان الشخصي:</span>
                      <span className="text-white text-xs bg-slate-950/40 p-2.5 rounded-lg border border-luxury-border/35 leading-relaxed">{profile.address || '—'}</span>
                    </div>
                    {profile.children && profile.children.length > 0 && (
                      <div className="flex flex-col gap-2 pt-1">
                        <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold font-cairo">الأبناء المتمدرسون:</span>
                        <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                          {profile.children.map((child, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-lg border border-luxury-border/25">
                              <span className="text-white font-medium text-xs">
                                {child.user?.firstName || child.firstName || '—'} {child.user?.lastName || child.lastName || '—'}
                              </span>
                              <span className="text-brand-600 text-[10px] font-semibold bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200/30">
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

              <div className="border-t border-luxury-border/40 pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-luxury-border text-slate-350 hover:text-white transition-all text-xs font-bold"
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
                  className="py-3 px-5 rounded-xl bg-red-955/20 border border-red-900/40 hover:bg-red-955/40 text-red-500 transition-all text-xs font-bold"
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
