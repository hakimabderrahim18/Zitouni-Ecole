import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import DigitalExitPassModal from '../components/DigitalExitPassModal';
import AttendanceManager from '../components/AttendanceManager';
import TimetableGrid from '../components/TimetableGrid';
import LessonNotebook from '../components/LessonNotebook';
import LoginAuditView from '../components/LoginAuditView';
import EnrollmentManager from '../components/EnrollmentManager';
import ReportedMessagesManager from '../components/ReportedMessagesManager';
import StudentSearchInput from '../components/StudentSearchInput';
import {
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  FileText,
  CreditCard,
  ShieldAlert,
  Search,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  UserCheck,
  UserX,
  Clock,
  Briefcase,
  Layers,
  Utensils,
  LogOut,
  Printer,
  ShieldCheck,
  ChefHat,
  Flame,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export default function GeneralSupervisorDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.endsWith('/student-attendance')) return 'student_attendance';
    if (path.endsWith('/inscriptions')) return 'inscriptions';
    if (path.endsWith('/login-audit')) return 'login_audit';
    if (path.endsWith('/reported-messages')) return 'reported_messages';
    if (path.endsWith('/timetable')) return 'timetable';
    if (path.endsWith('/lessons')) return 'lessons';
    if (path.endsWith('/attendance')) return 'attendance';
    if (path.endsWith('/assignment') || path.endsWith('/classes-assignment')) return 'assignment';
    if (path.endsWith('/damages')) return 'damages';
    if (path.endsWith('/canteen')) return 'canteen';
    if (path.endsWith('/exit-passes') || path.endsWith('/exit-pass')) return 'exit_passes';
    return 'attendance';
  };

  const activeTab = getActiveTab();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    supervisor: null,
    staffAttendanceToday: [],
    damagesToday: [],
    canteenToday: [],
    canteenRecipes: [],
    exitPassesToday: [],
    allTeachers: [],
    allPedagogicalSupervisors: [],
    allClasses: []
  });
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Attendance recording state
  const [attendanceForm, setAttendanceForm] = useState({ staffUserId: '', status: 'Present', remarks: '' });

  // Damage reporting state
  const [damageForm, setDamageForm] = useState({ location: '', description: '', estimatedCost: '' });

  // Canteen state
  const [canteenSubTab, setCanteenSubTab] = useState('recipes'); // 'recipes' | 'reservations'
  const [canteenForm, setCanteenForm] = useState({ mealType: 'Lunch', isPaid: true, notes: '' });
  const [isAddRecipeOpen, setIsAddRecipeOpen] = useState(false);
  const [selectedRecipeDay, setSelectedRecipeDay] = useState('All');
  const [selectedRecipeCategory, setSelectedRecipeCategory] = useState('All');
  const [recipeSubmitting, setRecipeSubmitting] = useState(false);
  const [recipeForm, setRecipeForm] = useState({
    name: '',
    category: 'lunch',
    dayOfWeek: 'Sunday',
    description: '',
    ingredients: '',
    calories: 480,
    allergens: '',
    isDelivered: true,
    mealCount: 60,
    price: 250,
  });

  // Assign classes state
  const [assignForm, setAssignForm] = useState({ supervisorId: '', classIds: [] });

  // Exit pass state
  const [exitPassFilter, setExitPassFilter] = useState('all');
  const [selectedPassForPrint, setSelectedPassForPrint] = useState(null);
  const [exitPassForm, setExitPassForm] = useState({
    studentId: '',
    reason: 'موعد طبي طارئ',
    exitTime: '11:30',
    accompaniedBy: 'ولي الأمر / Parent',
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/supervisors/dashboard');
      setDashboardData(response.data);
    } catch (err) {
      console.error('Error loading supervisor dashboard:', err);
      setError('تعذر تحميل بيانات لوحة المراقب العام. يرجى التحقق من الاتصال والصلاحيات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRecordStaffAttendance = async (e, staffId, statusVal) => {
    if (e) e.preventDefault();
    const targetId = staffId || attendanceForm.staffUserId;
    const targetStatus = statusVal || attendanceForm.status;

    if (!targetId) {
      setError('يرجى تحديد الأستاذ أو الموظف أولاً.');
      return;
    }

    try {
      await axios.post('/api/supervisors/staff-attendance', {
        staffUserId: targetId,
        status: targetStatus,
        remarks: attendanceForm.remarks
      });
      setSuccessMsg(
        targetStatus === 'Absent'
          ? 'تم تسجيل غياب الموظف بنجاح، وتم تفعيل الخصم التلقائي من راتبه الشهري.'
          : 'تم تسجيل الحضور اليومي بنجاح.'
      );
      setAttendanceForm({ staffUserId: '', status: 'Present', remarks: '' });
      fetchDashboardData();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'خطأ أثناء تسجيل الحضور والغياب.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleReportDamage = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/supervisors/damage', damageForm);
      setSuccessMsg('تم التبليغ عن الإتلاف/الضرر وإرساله لسجل الصيانة والمحاسبة.');
      setDamageForm({ location: '', description: '', estimatedCost: '' });
      fetchDashboardData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'خطأ أثناء تسجيل الإتلاف.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleUpdateDamageStatus = async (damageId, newStatus) => {
    try {
      await axios.put(`/api/supervisors/damage/${damageId}`, { status: newStatus });
      setSuccessMsg('تم تحديث حالة الصيانة والإتلاف.');
      fetchDashboardData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError('خطأ أثناء تحديث تقرير الإتلاف.');
    }
  };

  const handleCreateCanteenReservation = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/supervisors/canteen', canteenForm);
      setSuccessMsg('تم تسجيل حجز المطعم اليومي (الكانتين) بنجاح.');
      setCanteenForm({ mealType: 'Lunch', isPaid: true, notes: '' });
      fetchDashboardData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'خطأ أثناء تسجيل حجز المطعم.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleCreateRecipe = async (e) => {
    e.preventDefault();
    if (!recipeForm.name.trim()) {
      setError('يرجى إدخال اسم الوجبة الغذائية.');
      return;
    }
    setRecipeSubmitting(true);
    try {
      await axios.post('/api/supervisors/canteen/recipes', recipeForm);
      setSuccessMsg('تمت إضافة الوجبة إلى قائمة طعام الكانتين بنجاح!');
      setIsAddRecipeOpen(false);
      setRecipeForm({
        name: '',
        category: 'lunch',
        dayOfWeek: 'Sunday',
        description: '',
        ingredients: '',
        calories: 480,
        allergens: '',
        isDelivered: true,
        mealCount: 60,
        price: 250,
      });
      fetchDashboardData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'خطأ أثناء حفظ الوجبة.');
      setTimeout(() => setError(null), 4000);
    } finally {
      setRecipeSubmitting(false);
    }
  };

  const handleToggleDeliverRecipe = async (recipeId, currentDelivered) => {
    try {
      const res = await axios.put(`/api/supervisors/canteen/recipes/${recipeId}/deliver`, {
        isDelivered: !currentDelivered,
      });
      setSuccessMsg(res.data?.message || 'تم تحديث حالة تسليم الوجبة بنجاح!');
      fetchDashboardData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تحديث حالة تسليم الوجبة.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleDeleteRecipe = async (recipeId, recipeName) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف وجبة "${recipeName}" من قائمة طعام الكانتين؟`)) return;
    try {
      await axios.delete(`/api/supervisors/canteen/recipes/${recipeId}`);
      setSuccessMsg('تم حذف الوجبة بنجاح.');
      fetchDashboardData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'فشل حذف الوجبة.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleAssignClasses = async (e) => {
    e.preventDefault();
    if (!assignForm.supervisorId || assignForm.classIds.length === 0) {
      setError('يرجى اختيار المراقب التربوي وتحديد الأقسام الموكلة إليه.');
      return;
    }
    try {
      await axios.post('/api/supervisors/assign-classes', {
        supervisorId: assignForm.supervisorId,
        classIds: assignForm.classIds
      });
      setSuccessMsg('تم توزيع الأقسام على المراقب التربوي بنجاح.');
      setAssignForm({ supervisorId: '', classIds: [] });
      fetchDashboardData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'خطأ أثناء توزيع الأقسام.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleApproveExitPass = async (passId) => {
    try {
      await axios.put(`/api/supervisors/exit-pass/${passId}/approve`);
      setSuccessMsg('تمت الموافقة والمصادقة على ترخيص الخروج بنجاح. أصبحت البطاقة مفعلة لدى موظف الاستقبال.');
      fetchDashboardData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'خطأ أثناء المصادقة على ترخيص الخروج.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleRejectExitPass = async (passId) => {
    const reason = window.prompt('يرجى تدوين سبب رفض ترخيص الخروج:');
    if (reason === null) return;
    try {
      await axios.put(`/api/supervisors/exit-pass/${passId}/reject`, { rejectionReason: reason });
      setSuccessMsg('تم رفض طلب ترخيص الخروج.');
      fetchDashboardData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'خطأ أثناء رفض ترخيص الخروج.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleCreateExitPass = async (e) => {
    e.preventDefault();
    if (!exitPassForm.studentId || !exitPassForm.reason || !exitPassForm.exitTime) {
      setError('يرجى تحديد التلميذ وسبب وساعة الخروج.');
      return;
    }
    try {
      await axios.post('/api/supervisors/exit-pass', exitPassForm);
      setSuccessMsg('تم إصدار واعتماد بطاقة ترخيص الخروج بنجاح وتوجيهها لموظف الاستقبال عند البوابة.');
      setExitPassForm({
        studentId: '',
        reason: 'موعد طبي طارئ',
        exitTime: '11:30',
        accompaniedBy: 'ولي الأمر / Parent',
      });
      fetchDashboardData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'خطأ أثناء إصدار ترخيص الخروج.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const roleLabels = {
    teacher: 'أستاذ',
    general_supervisor: 'مراقب عام',
    pedagogical_supervisor: 'مراقب تربوي',
    receptionist: 'موظف الاستقبال'
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 font-cairo text-right" dir="rtl">
        {/* Subroutes triggered from the Sidebar */}
        {activeTab === 'student_attendance' && <AttendanceManager />}
        {activeTab === 'inscriptions' && <EnrollmentManager />}
        {activeTab === 'login_audit' && <LoginAuditView />}
        {activeTab === 'reported_messages' && <ReportedMessagesManager />}
        {activeTab === 'timetable' && <TimetableGrid canImport={false} />}
        {activeTab === 'lessons' && <LessonNotebook />}

        {/* General Supervisor Dedicated Management Views */}
        {!['student_attendance', 'inscriptions', 'login_audit', 'reported_messages', 'timetable', 'lessons'].includes(activeTab) && (
          <>
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-slate-900 via-brand-950/40 to-slate-900 border border-luxury-border/60 p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-400 text-xs font-bold">
                    <Briefcase className="w-4 h-4" />
                    <span>لوحة الرقابة العامة والمتابعة اليومية</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    المراقب العام (Superviseur Général)
                  </h1>
                  <p className="text-slate-400 text-sm max-w-2xl leading-relaxed font-medium">
                    التفقد اليومي لحضور الأساتذة والطاقم وتفعيل الخصم التلقائي للغيابات، متابعة إتلافات التجهيزات اليومية، الإشراف على حجوزات المطعم، وتوزيع الأقسام على المراقبين التربويين.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="px-4 py-3 rounded-2xl bg-slate-950/80 border border-luxury-border text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">تاريخ اليوم</span>
                    <span className="text-sm font-black text-brand-400 font-mono">
                      {new Date().toLocaleDateString('ar-DZ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Alerts */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 flex items-center justify-between text-sm font-bold"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                  <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
                </motion.div>
              )}
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-between text-sm font-bold"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                  <button onClick={() => setSuccessMsg(null)}><X className="w-4 h-4" /></button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Tabs - Prestige Académique Palette (Image 5 Enhanced) */}
            <div className="bg-[#FCF8F2] border-2 border-[#C9A24D]/40 rounded-2xl p-2.5 shadow-sm flex flex-wrap gap-2.5 items-center">
              {[
                {
                  id: 'attendance',
                  label: 'حضور الأساتذة والموظفين والخصم التلقائي',
                  icon: Users,
                  to: '/dashboard/general-supervisor/attendance',
                  count: dashboardData.staffAttendanceToday?.length || 0,
                  accentBg: 'bg-emerald-500/15',
                  accentText: 'text-emerald-700',
                },
                {
                  id: 'assignment',
                  label: 'توزيع المراقبين التربويين على الأقسام',
                  icon: Layers,
                  to: '/dashboard/general-supervisor/classes-assignment',
                  count: dashboardData.allPedagogicalSupervisors?.length || 0,
                  accentBg: 'bg-indigo-500/15',
                  accentText: 'text-indigo-700',
                },
                {
                  id: 'damages',
                  label: 'رقابة التجهيزات وسجل الإتلافات اليومي',
                  icon: ShieldAlert,
                  to: '/dashboard/general-supervisor/damages',
                  count: dashboardData.damagesToday?.length || 0,
                  accentBg: 'bg-amber-500/15',
                  accentText: 'text-amber-700',
                },
                {
                  id: 'canteen',
                  label: 'حجوزات ومأكولات المطعم المدرسي (الكانتين)',
                  icon: Utensils,
                  to: '/dashboard/general-supervisor/canteen',
                  count: (dashboardData.canteenRecipes || []).filter((r) => r.isDelivered).length || dashboardData.canteenToday?.length || 0,
                  accentBg: 'bg-[#7B1E3A]/15',
                  accentText: 'text-[#7B1E3A]',
                },
                {
                  id: 'exit_passes',
                  label: 'تراخيص خروج التلاميذ ومصادقة الإدارة',
                  icon: LogOut,
                  to: '/dashboard/general-supervisor/exit-passes',
                  count: dashboardData.exitPassesToday?.length || 0,
                  accentBg: 'bg-rose-500/15',
                  accentText: 'text-rose-700',
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const isTabSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => navigate(tab.to)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-extrabold text-xs md:text-sm transition-all duration-200 cursor-pointer border-2 ${
                      isTabSelected
                        ? 'bg-[#7B1E3A] text-white border-[#C9A24D] shadow-md shadow-[#7B1E3A]/30 scale-[1.01]'
                        : 'bg-white hover:bg-[#FAF4EB] text-[#2B2022] hover:text-[#7B1E3A] border-[#DFD3C2] hover:border-[#C9A24D]/60 shadow-xs'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isTabSelected ? 'bg-[#C9A24D]/25 text-[#C9A24D]' : `${tab.accentBg} ${tab.accentText}`
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{tab.label}</span>
                    {typeof tab.count === 'number' && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                          isTabSelected
                            ? 'bg-[#C9A24D] text-[#7B1E3A]'
                            : 'bg-[#FAF4EB] text-[#7B1E3A] border border-[#DFD3C2]'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

        {/* TAB 1: STAFF ATTENDANCE & AUTOMATED DEDUCTIONS */}
        {activeTab === 'attendance' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Record Panel */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-luxury-border/50 space-y-5 h-fit">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-400" />
                <span>تسجيل حضور / غياب سريع</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ملاحظة: عند اختيار الحالة <span className="text-red-400 font-bold">«غائب (Absent)»</span> لأي أستاذ أو موظف، يقوم النظام فوراً بتفعيل الخصم المالي التلقائي من راتبه الشهري.
              </p>

              <form onSubmit={(e) => handleRecordStaffAttendance(e)} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">اختيار الأستاذ أو الموظف</label>
                  <select
                    value={attendanceForm.staffUserId}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, staffUserId: e.target.value })}
                    required
                    className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- اختر من القائمة --</option>
                    {dashboardData.allTeachers.map((t) => (
                      <option key={t.user?._id} value={t.user?._id}>
                        {t.user?.firstName} {t.user?.lastName} — (أستاذ)
                      </option>
                    ))}
                    {dashboardData.allPedagogicalSupervisors.map((s) => (
                      <option key={s.user?._id} value={s.user?._id}>
                        {s.user?.firstName} {s.user?.lastName} — (مراقب تربوي)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">حالة الحضور</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 'Present', label: 'حاضر', color: 'emerald' },
                      { val: 'Late', label: 'متأخر', color: 'amber' },
                      { val: 'Absent', label: 'غائب', color: 'red' }
                    ].map((st) => (
                      <button
                        key={st.val}
                        type="button"
                        onClick={() => setAttendanceForm({ ...attendanceForm, status: st.val })}
                        className={`py-2 px-3 rounded-xl font-bold border text-center transition-all ${
                          attendanceForm.status === st.val
                            ? `bg-${st.color}-500/20 border-${st.color}-500 text-${st.color}-400`
                            : 'bg-slate-950 border-luxury-border text-slate-400'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">ملاحظات / سبب (اختياري)</label>
                  <input
                    type="text"
                    placeholder="مثال: تأخر بـ 15 دقيقة / غياب غير مبرر"
                    value={attendanceForm.remarks}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, remarks: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-extrabold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>تأكيد وحفظ في السجل اليومي</span>
                </button>
              </form>
            </div>

            {/* Today's Staff Attendance List */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-luxury-border/50 space-y-4">
              <h3 className="font-bold text-white text-base flex items-center justify-between">
                <span>سجل الحضور والغيابات المسجل لليوم ({dashboardData.staffAttendanceToday.length})</span>
                <span className="text-xs text-brand-400 font-mono">الخصم التلقائي نشط</span>
              </h3>

              {dashboardData.staffAttendanceToday.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs italic">
                  لم يتم تسجيل أي حضور أو غياب للموظفين اليوم بعد.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right border-collapse">
                    <thead>
                      <tr className="border-b border-luxury-border/40 text-slate-400 text-xs font-bold">
                        <th className="py-3 px-4">الأستاذ / الموظف</th>
                        <th className="py-3 px-4">الوظيفة</th>
                        <th className="py-3 px-4">الحالة المسجلة</th>
                        <th className="py-3 px-4">الخصم المالي</th>
                        <th className="py-3 px-4">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-luxury-border/20">
                      {dashboardData.staffAttendanceToday.map((item) => (
                        <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-brand-400 font-bold text-xs shrink-0">
                              {item.staffUser?.firstName?.[0]}
                            </div>
                            <span>{item.staffUser?.firstName} {item.staffUser?.lastName}</span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-400">
                            {roleLabels[item.staffUser?.role] || item.staffUser?.role}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                              item.status === 'Present'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : item.status === 'Late'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-red-500/15 text-red-400 border border-red-500/30'
                            }`}>
                              {item.status === 'Present' ? 'حاضر' : item.status === 'Late' ? 'متأخر' : 'غائب'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-xs">
                            {item.status === 'Absent' ? (
                              <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                                - تم الخصم تلقائياً
                              </span>
                            ) : (
                              <span className="text-slate-500">لا يوجد خصم</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-400">
                            {item.remarks || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ASSIGN PEDAGOGICAL SUPERVISORS TO CLASSES */}
        {activeTab === 'assignment' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-luxury-border/50 space-y-5 h-fit">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-400" />
                <span>توزيع وتكليف المراقبين بالأقسام</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                لكل مراقب تربوي (Superviseur Pédagogique) مجموعة أقسام وأفواج خاصة به يتفقد حضور تلاميذها ويتسلم تقارير أستاذتها.
              </p>

              <form onSubmit={handleAssignClasses} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">المراقب التربوي</label>
                  <select
                    value={assignForm.supervisorId}
                    onChange={(e) => setAssignForm({ ...assignForm, supervisorId: e.target.value })}
                    required
                    className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- اختر المراقب التربوي --</option>
                    {dashboardData.allPedagogicalSupervisors.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.user?.firstName} {s.user?.lastName} — (@{s.user?.username || s.user?.phoneNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-400 font-bold block">الأقسام الموكلة (اختر قسماً أو أكثر)</label>
                  <div className="max-h-52 overflow-y-auto space-y-1.5 bg-slate-950 p-3 rounded-xl border border-luxury-border/50">
                    {dashboardData.allClasses.map((cls) => {
                      const isSelected = assignForm.classIds.includes(cls._id);
                      return (
                        <div
                          key={cls._id}
                          onClick={() => {
                            const newIds = isSelected
                              ? assignForm.classIds.filter((id) => id !== cls._id)
                              : [...assignForm.classIds, cls._id];
                            setAssignForm({ ...assignForm, classIds: newIds });
                          }}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-all flex justify-between items-center ${
                            isSelected
                              ? 'bg-brand-500/20 border-brand-500 text-brand-400 font-bold'
                              : 'bg-slate-900 border-luxury-border/30 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span>{cls.name} <span className="text-[10px] text-slate-500">({cls.level})</span></span>
                          {isSelected && <Check className="w-4 h-4 text-brand-400" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-extrabold transition-all shadow-md"
                >
                  حفظ وتعيين الأقسام للمراقب
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-luxury-border/50 space-y-4">
              <h3 className="font-bold text-white text-base">قائمة المراقبين التربويين والأقسام الموكلة إليهم</h3>
              {dashboardData.allPedagogicalSupervisors.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs italic">
                  لا يوجد مراقبون تربويون مسجلون في النظام حالياً.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dashboardData.allPedagogicalSupervisors.map((sup) => (
                    <div
                      key={sup._id}
                      className="p-5 rounded-2xl bg-slate-950/80 border border-luxury-border/40 space-y-3 hover:border-brand-500/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                          {sup.user?.firstName?.[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{sup.user?.firstName} {sup.user?.lastName}</h4>
                          <span className="text-[11px] text-slate-400 font-mono">@{sup.user?.username || sup.user?.phoneNumber}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-luxury-border/20 space-y-1.5">
                        <span className="text-xs text-slate-400 font-bold block">الأقسام المسندة للمراقبة:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {sup.assignedClasses && sup.assignedClasses.length > 0 ? (
                            sup.assignedClasses.map((c) => (
                              <span key={c._id} className="px-2.5 py-1 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 font-bold text-xs">
                                {c.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500 italic">لم يتم إسناد أي قسم بعد.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MATERIAL DAMAGES & MAINTENANCE */}
        {activeTab === 'damages' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-luxury-border/50 space-y-5 h-fit">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <span>التبليغ عن إتلاف أو ضرر تجهيزات</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                تسجيل أي إتلاف يومي في الطاولات، السبورات أو التجهيزات مع تحديد التكلفة التقديرية للصيانة والتعويض.
              </p>

              <form onSubmit={handleReportDamage} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">مكان / قاعة الضرر</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: القاعة 12 / مخبر العلوم / المطعم"
                    value={damageForm.location}
                    onChange={(e) => setDamageForm({ ...damageForm, location: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">وصف الإتلاف أو التلف</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="مثال: كسر طاولة دراسية وزجاج نافذة..."
                    value={damageForm.description}
                    onChange={(e) => setDamageForm({ ...damageForm, description: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">التكلفة التقديرية (د.ج)</label>
                  <input
                    type="number"
                    placeholder="مثال: 3500"
                    value={damageForm.estimatedCost}
                    onChange={(e) => setDamageForm({ ...damageForm, estimatedCost: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-extrabold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>تسجيل وإرسال تقرير الإتلاف</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-luxury-border/50 space-y-4">
              <h3 className="font-bold text-white text-base">سجل الإتلافات والأضرار اليومية المسجلة</h3>
              {dashboardData.damagesToday.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs italic">
                  لم يتم التبليغ عن أي إتلاف أو خسائر في التجهيزات اليوم.
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData.damagesToday.map((dmg) => (
                    <div
                      key={dmg._id}
                      className="p-4 rounded-2xl bg-slate-950/80 border border-luxury-border/40 flex flex-col md:flex-row justify-between md:items-center gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold text-xs border border-amber-500/20">
                            {dmg.location}
                          </span>
                          <span className="text-xs text-slate-400">
                            المُبلغ: {dmg.reportedBy?.firstName} {dmg.reportedBy?.lastName}
                          </span>
                        </div>
                        <p className="text-sm text-white font-bold">{dmg.description}</p>
                        {dmg.estimatedCost && (
                          <span className="text-xs text-emerald-400 font-mono block">
                            التكلفة المقدرة: {dmg.estimatedCost.toLocaleString('fr-FR')} د.ج
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={dmg.status}
                          onChange={(e) => handleUpdateDamageStatus(dmg._id, e.target.value)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-900 border ${
                            dmg.status === 'Resolved'
                              ? 'text-emerald-400 border-emerald-500/30'
                              : dmg.status === 'In_Progress'
                              ? 'text-indigo-400 border-indigo-500/30'
                              : 'text-amber-400 border-amber-500/30'
                          }`}
                        >
                          <option value="Reported">تم التبليغ (Reported)</option>
                          <option value="In_Progress">قيد الصيانة (In Progress)</option>
                          <option value="Resolved">تمت المعالجة/التعويض (Resolved)</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CANTEEN RESERVATIONS & RECIPES DELIVERY (المطعم المدرسي والوجبات المعتمدة) */}
        {activeTab === 'canteen' && (
          <div className="space-y-6">
            {/* Top Sub-navigation & Header Banner */}
            <div className="p-6 rounded-3xl bg-[#FCF8F2] border-2 border-[#C9A24D]/40 space-y-4 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#C9A24D]/25 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7B1E3A]/10 border border-[#7B1E3A]/25 text-[#7B1E3A] text-xs font-extrabold">
                    <ChefHat className="w-4 h-4 text-[#C9A24D]" />
                    <span>مطبخ ومطعم المؤسسة المدرسي (الكانتين)</span>
                  </div>
                  <h3 className="font-serif font-black text-xl text-[#2B2022]">
                    إدارة وجبات الكانتين واختيار الوجبات الموزعة اليوم
                  </h3>
                  <p className="text-xs text-[#2B2022]/70 leading-relaxed font-medium max-w-2xl">
                    يمكن للمشرف العام وإدارة المؤسسة تحديد واختيار أيّ الوجبات والوصفات الغذائية التي يتم تسليمها وتوزيعها اليوم في الكانتين، مع إضافة وصفات طعام جديدة ومتابعة حجوزات واشتراكات التلاميذ والطاقم.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsAddRecipeOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#7B1E3A] hover:bg-[#60162c] text-white border-2 border-[#C9A24D] rounded-xl text-xs font-bold transition-all shadow-md shadow-[#7B1E3A]/25 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#C9A24D]" />
                    <span>+ إضافة وجبة / وصفة جديدة</span>
                  </button>
                </div>
              </div>

              {/* Sub-tabs Selection */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 p-1 rounded-xl bg-white border border-[#DFD3C2]">
                  <button
                    type="button"
                    onClick={() => setCanteenSubTab('recipes')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      canteenSubTab === 'recipes'
                        ? 'bg-[#7B1E3A] text-white shadow-xs'
                        : 'text-[#2B2022] hover:text-[#7B1E3A] hover:bg-[#FAF4EB]'
                    }`}
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    <span>قائمة وجبات ووصفات الكانتين ({(dashboardData.canteenRecipes || []).length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCanteenSubTab('reservations')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      canteenSubTab === 'reservations'
                        ? 'bg-[#7B1E3A] text-white shadow-xs'
                        : 'text-[#2B2022] hover:text-[#7B1E3A] hover:bg-[#FAF4EB]'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>حجوزات واشتراكات اليوم ({dashboardData.canteenToday?.length || 0})</span>
                  </button>
                </div>

                {/* Delivered Badge Counter */}
                <div className="flex items-center gap-2 text-xs font-bold bg-white px-3.5 py-1.5 rounded-xl border border-[#C9A24D]/35 text-[#7B1E3A]">
                  <Sparkles className="w-4 h-4 text-[#C9A24D]" />
                  <span>
                    الوجبات المعتمدة للتسليم اليوم: <strong>{(dashboardData.canteenRecipes || []).filter((r) => r.isDelivered).length}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* SUB-TAB 1: RECIPES & DELIVERY MANAGEMENT */}
            {canteenSubTab === 'recipes' && (
              <div className="space-y-5">
                {/* Filters Row: Day of week & Category */}
                <div className="p-4 rounded-2xl bg-white border-2 border-[#C9A24D]/35 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
                  {/* Days Filter */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-extrabold text-[#7B1E3A] ml-2">اليوم المقرر:</span>
                    {[
                      { id: 'All', label: 'كل الأيام' },
                      { id: 'Sunday', label: 'الأحد' },
                      { id: 'Monday', label: 'الإثنين' },
                      { id: 'Tuesday', label: 'الثلاثاء' },
                      { id: 'Wednesday', label: 'الأربعاء' },
                      { id: 'Thursday', label: 'الخميس' },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setSelectedRecipeDay(d.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          selectedRecipeDay === d.id
                            ? 'bg-[#7B1E3A] text-white border-[#7B1E3A]'
                            : 'bg-[#FAF4EB] text-[#574549] border-[#DFD3C2] hover:border-[#C9A24D]'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>

                  {/* Meal Category Filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-[#7B1E3A] ml-2">نوع الوجبة:</span>
                    {[
                      { id: 'All', label: 'الكل' },
                      { id: 'lunch', label: 'غداء (Déjeuner)' },
                      { id: 'breakfast', label: 'فطور' },
                      { id: 'snack', label: 'لمجة' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedRecipeCategory(cat.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          selectedRecipeCategory === cat.id
                            ? 'bg-[#C9A24D] text-[#7B1E3A] border-[#C9A24D]'
                            : 'bg-[#FAF4EB] text-[#574549] border-[#DFD3C2] hover:border-[#C9A24D]'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recipes Cards Grid */}
                {(() => {
                  const filtered = (dashboardData.canteenRecipes || []).filter((r) => {
                    if (selectedRecipeDay !== 'All' && r.dayOfWeek !== selectedRecipeDay && r.dayOfWeek !== 'All') return false;
                    if (selectedRecipeCategory !== 'All' && r.category !== selectedRecipeCategory) return false;
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="p-12 text-center rounded-3xl bg-white border-2 border-dashed border-[#C9A24D]/40 text-[#2B2022]/60 space-y-3">
                        <ChefHat className="w-12 h-12 text-[#C9A24D] mx-auto opacity-60" />
                        <p className="font-serif font-black text-[#7B1E3A] text-base">لا توجد وجبات مسجلة مطابقة للتصفية.</p>
                        <p className="text-xs text-[#2B2022]/60">انقر على زر "+ إضافة وجبة / وصفة جديدة" لإدخال أول وجبة في قائمة طعام الكانتين.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filtered.map((recipe) => {
                        const dayNames = {
                          Sunday: 'الأحد',
                          Monday: 'الإثنين',
                          Tuesday: 'الثلاثاء',
                          Wednesday: 'الأربعاء',
                          Thursday: 'الخميس',
                          All: 'طيلة الأسبوع',
                        };
                        const catLabels = {
                          lunch: 'وجبة الغداء',
                          breakfast: 'فطور الصباح',
                          snack: 'لمجة المساء',
                          dessert: 'تحلية',
                        };

                        return (
                          <div
                            key={recipe._id}
                            className={`p-5 rounded-3xl bg-white border-2 transition-all flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md ${
                              recipe.isDelivered
                                ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                                : 'border-[#C9A24D]/35 hover:border-[#C9A24D]'
                            }`}
                          >
                            {/* Card Header */}
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2 border-b border-[#C9A24D]/20 pb-2.5">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                    recipe.isDelivered ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-[#7B1E3A]/10 text-[#7B1E3A] border border-[#7B1E3A]/20'
                                  }`}>
                                    <ChefHat className="w-4 h-4 text-[#C9A24D]" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="font-serif font-black text-sm text-[#2B2022] truncate">
                                      {recipe.name}
                                    </h4>
                                    <span className="text-[10px] text-[#7B1E3A] font-extrabold block">
                                      {catLabels[recipe.category] || recipe.category} &bull; {dayNames[recipe.dayOfWeek] || recipe.dayOfWeek}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteRecipe(recipe._id, recipe.name)}
                                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="حذف هذه الوجبة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Description */}
                              {recipe.description && (
                                <p className="text-xs text-[#2B2022]/70 leading-relaxed font-medium">
                                  {recipe.description}
                                </p>
                              )}

                              {/* Ingredients list */}
                              {recipe.ingredients && recipe.ingredients.length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-[10px] font-extrabold text-[#7B1E3A] block">المكونات:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {recipe.ingredients.map((ing, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-0.5 rounded-md bg-[#FAF4EB] border border-[#DFD3C2] text-[#2B2022] text-[10px] font-bold"
                                      >
                                        {ing}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Calories & Allergens */}
                              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                                {recipe.calories > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-extrabold">
                                    <Flame className="w-3 h-3 text-amber-600" />
                                    <span>{recipe.calories} سعرة</span>
                                  </span>
                                )}
                                {recipe.allergens && recipe.allergens.length > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-extrabold">
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                    <span>حساسية: {recipe.allergens.join('، ')}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Delivery Action Button - Exactly what the user requested! */}
                            <div className="pt-3 border-t border-[#C9A24D]/20">
                              <button
                                type="button"
                                onClick={() => handleToggleDeliverRecipe(recipe._id, recipe.isDelivered)}
                                className={`w-full py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs border-2 ${
                                  recipe.isDelivered
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-400'
                                    : 'bg-[#7B1E3A] hover:bg-[#60162c] text-white border-[#C9A24D]'
                                }`}
                              >
                                {recipe.isDelivered ? (
                                  <>
                                    <Check className="w-4 h-4 text-[#C9A24D] stroke-[3]" />
                                    <span>✓ معتمد للتسليم في الكانتين اليوم (انقر للإلغاء)</span>
                                  </>
                                ) : (
                                  <>
                                    <Utensils className="w-4 h-4 text-[#C9A24D]" />
                                    <span>+ اعتماد وتسليم هذه الوجبة في الكانتين اليوم</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* SUB-TAB 2: RESERVATIONS TODAY */}
            {canteenSubTab === 'reservations' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Booking Form */}
                <div className="p-6 rounded-3xl bg-white border-2 border-[#C9A24D]/40 space-y-4 shadow-sm h-fit">
                  <h3 className="font-serif font-black text-[#7B1E3A] text-base flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-[#C9A24D]" />
                    <span>تسجيل حجز وجبة كانتين</span>
                  </h3>
                  <p className="text-xs text-[#2B2022]/70 leading-relaxed font-medium">
                    تسجيل وتأكيد حجز وجبة غداء أو فطور للتلاميذ أو الكادر والتحقق من حالة الاشتراك والدفع.
                  </p>

                  <form onSubmit={handleCreateCanteenReservation} className="space-y-4 text-xs font-medium">
                    <div className="space-y-1">
                      <label className="text-[#7B1E3A] font-bold block">نوع الوجبة</label>
                      <select
                        value={canteenForm.mealType}
                        onChange={(e) => setCanteenForm({ ...canteenForm, mealType: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-bold focus:outline-none focus:border-[#7B1E3A]"
                      >
                        <option value="Lunch">وجبة الغداء (Lunch)</option>
                        <option value="Breakfast">فطور الصباح (Breakfast)</option>
                        <option value="Snack">لمجة المساء (Snack)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[#7B1E3A] font-bold block">حالة الدفع</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setCanteenForm({ ...canteenForm, isPaid: true })}
                          className={`py-2 px-3 rounded-xl font-bold border-2 transition-all cursor-pointer ${
                            canteenForm.isPaid
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                              : 'bg-white border-[#DFD3C2] text-[#2B2022]/60'
                          }`}
                        >
                          مدفوع / مشترك
                        </button>
                        <button
                          type="button"
                          onClick={() => setCanteenForm({ ...canteenForm, isPaid: false })}
                          className={`py-2 px-3 rounded-xl font-bold border-2 transition-all cursor-pointer ${
                            !canteenForm.isPaid
                              ? 'bg-rose-50 border-rose-400 text-rose-800'
                              : 'bg-white border-[#DFD3C2] text-[#2B2022]/60'
                          }`}
                        >
                          غير مدفوع (ذمة)
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[#7B1E3A] font-bold block">ملاحظات الحجز (اختياري)</label>
                      <input
                        type="text"
                        placeholder="مثال: تلميذ في القسم 2م / خاص بالنشاط..."
                        value={canteenForm.notes}
                        onChange={(e) => setCanteenForm({ ...canteenForm, notes: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-bold focus:outline-none focus:border-[#7B1E3A]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-[#7B1E3A] hover:bg-[#60162c] text-white font-extrabold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-[#C9A24D]/40"
                    >
                      <CheckCircle className="w-4 h-4 text-[#C9A24D]" />
                      <span>تأكيد الحجز اليومي</span>
                    </button>
                  </form>
                </div>

                {/* Today's Reservations List */}
                <div className="lg:col-span-2 p-6 rounded-3xl bg-white border-2 border-[#C9A24D]/40 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#C9A24D]/20 pb-3">
                    <h3 className="font-serif font-black text-[#7B1E3A] text-base">
                      سجل حجوزات المطعم لليوم ({dashboardData.canteenToday?.length || 0})
                    </h3>
                  </div>

                  {(!dashboardData.canteenToday || dashboardData.canteenToday.length === 0) ? (
                    <div className="py-12 text-center text-[#2B2022]/50 text-xs italic">
                      لم يتم تسجيل أي حجوزات في المطعم المدرسي اليوم بعد.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {dashboardData.canteenToday.map((res) => (
                        <div
                          key={res._id}
                          className="p-4 rounded-2xl bg-[#FCF8F2] border border-[#DFD3C2] flex justify-between items-center"
                        >
                          <div className="space-y-1">
                            <span className="font-bold text-[#2B2022] text-sm block">
                              {res.user?.firstName || 'حجز'} {res.user?.lastName || 'مستفيد'}
                            </span>
                            <span className="text-xs text-[#2B2022]/70 block">
                              نوع الوجبة: <strong className="text-[#7B1E3A]">{res.mealType}</strong>
                            </span>
                            {res.notes && <span className="text-[11px] text-[#2B2022]/50 block">{res.notes}</span>}
                          </div>

                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            res.isPaid
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}>
                            {res.isPaid ? 'مدفوع' : 'غير مدفوع'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MODAL: CREATE CANTEEN RECIPE (Connected directly to DB) */}
            {isAddRecipeOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" dir="rtl">
                <div className="w-full max-w-xl bg-white border-2 border-[#C9A24D] rounded-3xl p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-[#C9A24D]/30 pb-3">
                    <div className="flex items-center gap-2.5 text-[#7B1E3A]">
                      <ChefHat className="w-5 h-5 text-[#C9A24D]" />
                      <h3 className="font-serif font-black text-lg">إضافة وجبة / وصفة جديدة لمطعم الكانتين</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddRecipeOpen(false)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateRecipe} className="space-y-3.5 text-xs font-medium">
                    <div className="space-y-1">
                      <label className="text-[#7B1E3A] font-bold block">اسم الوجبة الغذائية *</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: طاجين دجاج بالزيتون والأرز البسمتي"
                        value={recipeForm.name}
                        onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-bold focus:outline-none focus:border-[#7B1E3A]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[#7B1E3A] font-bold block">نوع الوجبة *</label>
                        <select
                          value={recipeForm.category}
                          onChange={(e) => setRecipeForm({ ...recipeForm, category: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-bold focus:outline-none focus:border-[#7B1E3A]"
                        >
                          <option value="lunch">وجبة الغداء (Lunch)</option>
                          <option value="breakfast">فطور الصباح (Breakfast)</option>
                          <option value="snack">لمجة المساء (Snack)</option>
                          <option value="dessert">تحلية وفواكه</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[#7B1E3A] font-bold block">يوم التقديم المعتاد *</label>
                        <select
                          value={recipeForm.dayOfWeek}
                          onChange={(e) => setRecipeForm({ ...recipeForm, dayOfWeek: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-bold focus:outline-none focus:border-[#7B1E3A]"
                        >
                          <option value="Sunday">الأحد</option>
                          <option value="Monday">الإثنين</option>
                          <option value="Tuesday">الثلاثاء</option>
                          <option value="Wednesday">الأربعاء</option>
                          <option value="Thursday">الخميس</option>
                          <option value="All">طيلة أيام الأسبوع</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[#7B1E3A] font-bold block">السعرات الحرارية المقدرة</label>
                        <input
                          type="number"
                          placeholder="480"
                          value={recipeForm.calories}
                          onChange={(e) => setRecipeForm({ ...recipeForm, calories: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-mono font-bold focus:outline-none focus:border-[#7B1E3A]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[#7B1E3A] font-bold block">عدد الحصص المقدر</label>
                        <input
                          type="number"
                          placeholder="60"
                          value={recipeForm.mealCount}
                          onChange={(e) => setRecipeForm({ ...recipeForm, mealCount: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-mono font-bold focus:outline-none focus:border-[#7B1E3A]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[#7B1E3A] font-bold block">المكونات الأساسية (مفصولة بفواصل)</label>
                      <input
                        type="text"
                        placeholder="مثال: صدر دجاج، أرز، زيتون، بصل، جزر، بهارات طبيعية"
                        value={recipeForm.ingredients}
                        onChange={(e) => setRecipeForm({ ...recipeForm, ingredients: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-bold focus:outline-none focus:border-[#7B1E3A]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[#7B1E3A] font-bold block">مسببات الحساسية (اختياري)</label>
                      <input
                        type="text"
                        placeholder="مثال: غلوتين، حليب ومشتقاته، بيض..."
                        value={recipeForm.allergens}
                        onChange={(e) => setRecipeForm({ ...recipeForm, allergens: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-bold focus:outline-none focus:border-[#7B1E3A]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[#7B1E3A] font-bold block">الوصف وطريقة التقديم</label>
                      <textarea
                        rows={2}
                        placeholder="مثال: وجبة مغذية تقدم مع سلطة خضراء منعشة وفاكهة الموسم..."
                        value={recipeForm.description}
                        onChange={(e) => setRecipeForm({ ...recipeForm, description: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-medium focus:outline-none focus:border-[#7B1E3A]"
                      />
                    </div>

                    {/* Delivery toggle right in creation! */}
                    <div className="p-3 rounded-xl bg-[#FAF4EB] border border-[#DFD3C2] flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-[#7B1E3A] text-xs block">
                          اعتماد وتسليم الوجبة في الكانتين اليوم
                        </span>
                        <span className="text-[10px] text-[#2B2022]/60 block">
                          تحديد هذه الوجبة كوجبة معتمدة للتوزيع فوراً في المطعم المدرسي
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={recipeForm.isDelivered}
                        onChange={(e) => setRecipeForm({ ...recipeForm, isDelivered: e.target.checked })}
                        className="w-5 h-5 rounded text-[#7B1E3A] border-[#C9A24D] focus:ring-0 cursor-pointer"
                      />
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-[#C9A24D]/30">
                      <button
                        type="button"
                        onClick={() => setIsAddRecipeOpen(false)}
                        className="flex-1 py-2.5 rounded-xl bg-white border border-[#DFD3C2] text-[#2B2022] font-bold text-xs hover:bg-stone-50 cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        disabled={recipeSubmitting}
                        className="flex-1 py-2.5 rounded-xl bg-[#7B1E3A] hover:bg-[#60162c] text-white font-extrabold text-xs transition-colors cursor-pointer border border-[#C9A24D] shadow-md flex items-center justify-center gap-1.5"
                      >
                        {recipeSubmitting ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-[#C9A24D]" />
                        ) : (
                          <Plus className="w-4 h-4 text-[#C9A24D]" />
                        )}
                        <span>حفظ وإضافة الوجبة</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: STUDENT EXIT PASSES (TRAVAUX & SORTIES - ARTICLE 28) */}
        {activeTab === 'exit_passes' && (
          <div className="space-y-6">
            {/* Modal for Printing Digital Exit Pass Voucher */}
            {selectedPassForPrint && (
              <DigitalExitPassModal
                isOpen={true}
                onClose={() => setSelectedPassForPrint(null)}
                pass={selectedPassForPrint}
                student={selectedPassForPrint.student}
              />
            )}

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white border-2 border-[#C9A24D]/40 text-center shadow-xs">
                <span className="text-xs font-bold text-[#7B1E3A] block">إجمالي تراخيص اليوم</span>
                <span className="text-2xl font-black text-[#2B2022] font-mono mt-1 block">
                  {dashboardData.exitPassesToday.length}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-center shadow-xs">
                <span className="text-xs font-bold text-amber-900 block">بانتظار مصادقة الإدارة</span>
                <span className="text-2xl font-black text-amber-800 font-mono mt-1 block">
                  {dashboardData.exitPassesToday.filter((p) => p.status === 'Pending').length}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-center shadow-xs">
                <span className="text-xs font-bold text-emerald-900 block">معتمدة ومفعلة لدى الاستقبال</span>
                <span className="text-2xl font-black text-emerald-800 font-mono mt-1 block">
                  {dashboardData.exitPassesToday.filter((p) => p.status === 'Approved').length}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-300 text-center shadow-xs">
                <span className="text-xs font-bold text-slate-700 block">غادروا المدرسة عبر البوابة</span>
                <span className="text-2xl font-black text-slate-800 font-mono mt-1 block">
                  {dashboardData.exitPassesToday.filter((p) => p.status === 'Used').length}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Issuance Form */}
              <div className="p-6 rounded-3xl bg-white border-2 border-[#C9A24D]/40 space-y-4 shadow-sm h-fit">
                <div className="flex items-center gap-2 text-[#7B1E3A] border-b border-[#C9A24D]/25 pb-3">
                  <Plus className="w-5 h-5 text-[#C9A24D]" />
                  <h3 className="font-serif font-black text-base">إصدار ترخيص خروج استثنائي مباشر</h3>
                </div>
                <p className="text-xs text-[#2B2022]/70 leading-relaxed font-medium">
                  إصدار بطاقة خروج مباشرة لتلميذ داخل المؤسسة، يتم اعتمادها فوراً وتفعيلها لدى موظف الاستقبال عند البوابة.
                </p>

                <form onSubmit={handleCreateExitPass} className="space-y-4 text-xs font-medium">
                  <StudentSearchInput
                    students={dashboardData.students || []}
                    selectedStudentId={exitPassForm.studentId}
                    onSelectStudent={(id) => setExitPassForm((prev) => ({ ...prev, studentId: id }))}
                    label="التلميذ المعني بالخروج *"
                    required
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[#7B1E3A] font-bold block">ساعة الخروج المرخصة *</label>
                      <input
                        type="time"
                        required
                        value={exitPassForm.exitTime}
                        onChange={(e) => setExitPassForm({ ...exitPassForm, exitTime: e.target.value })}
                        className="w-full p-3 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-mono font-bold focus:outline-none focus:border-[#7B1E3A]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[#7B1E3A] font-bold block">المرافق المعتمد *</label>
                      <input
                        type="text"
                        required
                        placeholder="ولي الأمر / شخص مفوض"
                        value={exitPassForm.accompaniedBy}
                        onChange={(e) => setExitPassForm({ ...exitPassForm, accompaniedBy: e.target.value })}
                        className="w-full p-3 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-bold focus:outline-none focus:border-[#7B1E3A]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#7B1E3A] font-bold block">سبب أو مبرر الخروج *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: موعد طبي طارئ / استدعاء عائلي..."
                      value={exitPassForm.reason}
                      onChange={(e) => setExitPassForm({ ...exitPassForm, reason: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-semibold focus:outline-none focus:border-[#7B1E3A]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-[#7B1E3A] hover:bg-[#5E142A] text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-[#C9A24D]/40"
                  >
                    <CheckCircle className="w-4 h-4 text-[#C9A24D]" />
                    <span>إصدار واعتماد ترخيص الخروج فوراً</span>
                  </button>
                </form>
              </div>

              {/* Passes List & Parent Requests */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-white border-2 border-[#C9A24D]/40 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C9A24D]/25 pb-3">
                  <div>
                    <h3 className="font-serif font-black text-base text-[#7B1E3A]">
                      طلبات وبطاقات تراخيص الخروج لليوم ({dashboardData.exitPassesToday.length})
                    </h3>
                    <p className="text-xs text-[#2B2022]/70 font-medium">
                      المصادقة على طلبات أولياء الأمور وتوثيق التراخيص المفعلة لموظف الاستقبال
                    </p>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#FDFBF7] border border-[#C9A24D]/30 text-xs">
                    <button
                      onClick={() => setExitPassFilter('all')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        exitPassFilter === 'all'
                          ? 'bg-[#7B1E3A] text-white'
                          : 'text-[#2B2022]/70 hover:text-[#7B1E3A]'
                      }`}
                    >
                      الكل ({dashboardData.exitPassesToday.length})
                    </button>
                    <button
                      onClick={() => setExitPassFilter('Pending')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        exitPassFilter === 'Pending'
                          ? 'bg-amber-600 text-white'
                          : 'text-amber-800 hover:text-amber-900'
                      }`}
                    >
                      بانتظار المصادقة ({dashboardData.exitPassesToday.filter((p) => p.status === 'Pending').length})
                    </button>
                    <button
                      onClick={() => setExitPassFilter('Approved')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        exitPassFilter === 'Approved'
                          ? 'bg-emerald-600 text-white'
                          : 'text-emerald-800 hover:text-emerald-900'
                      }`}
                    >
                      معتمدة ({dashboardData.exitPassesToday.filter((p) => p.status === 'Approved').length})
                    </button>
                    <button
                      onClick={() => setExitPassFilter('Used')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        exitPassFilter === 'Used'
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      غادروا ({dashboardData.exitPassesToday.filter((p) => p.status === 'Used').length})
                    </button>
                  </div>
                </div>

                {dashboardData.exitPassesToday.filter((p) => exitPassFilter === 'all' || p.status === exitPassFilter).length === 0 ? (
                  <div className="py-14 text-center text-[#2B2022]/60 text-xs italic bg-[#FDFBF7] rounded-2xl border border-dashed border-[#C9A24D]/30 space-y-2">
                    <LogOut className="w-10 h-10 text-[#C9A24D]/40 mx-auto" />
                    <p className="font-bold text-sm text-[#7B1E3A]">لا توجد بطاقات خروج تطابق هذا الفلتر حالياً.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dashboardData.exitPassesToday
                      .filter((p) => exitPassFilter === 'all' || p.status === exitPassFilter)
                      .map((pass) => {
                        const studentName = pass.student?.user?.firstName
                          ? `${pass.student.user.firstName} ${pass.student.user.lastName}`
                          : pass.student?.firstName
                          ? `${pass.student.firstName} ${pass.student.lastName}`
                          : 'التلميذ';

                        const isPending = pass.status === 'Pending';
                        const isApproved = pass.status === 'Approved';
                        const isUsed = pass.status === 'Used';

                        return (
                          <div
                            key={pass._id}
                            className={`p-4 rounded-2xl border-2 transition-all space-y-3.5 flex flex-col justify-between ${
                              isPending
                                ? 'bg-amber-50/60 border-amber-300 shadow-xs'
                                : isApproved
                                ? 'bg-white border-emerald-300 shadow-xs'
                                : 'bg-[#FDFBF7] border-slate-300 opacity-80'
                            }`}
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-xl bg-[#7B1E3A] flex items-center justify-center text-[#C9A24D] font-bold text-xs shrink-0">
                                    {studentName[0] || 'T'}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-sm text-[#7B1E3A]">{studentName}</h4>
                                    <span className="text-[11px] font-bold text-[#C9A24D] block font-mono">
                                      القسم: {pass.class?.name || '—'}
                                    </span>
                                  </div>
                                </div>

                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isPending
                                    ? 'bg-amber-100 text-amber-900 border-amber-400 animate-pulse'
                                    : isApproved
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                                    : isUsed
                                    ? 'bg-slate-100 text-slate-800 border-slate-300'
                                    : 'bg-red-100 text-red-800 border-red-300'
                                }`}>
                                  {isPending ? 'طلب ولي أمر (ينتظر المصادقة)' : isApproved ? 'معتمد (بانتظار البوابة)' : isUsed ? 'تم الخروج' : 'مرفوض'}
                                </span>
                              </div>

                              <div className="space-y-1.5 text-xs bg-white/80 p-2.5 rounded-xl border border-[#C9A24D]/25">
                                <div className="flex justify-between items-center text-[#2B2022]">
                                  <span className="text-[#2B2022]/60 font-medium">ساعة الخروج:</span>
                                  <span className="font-mono font-bold text-sm text-[#7B1E3A] bg-[#FDFBF7] px-2 py-0.5 rounded border border-[#C9A24D]/30" dir="ltr">
                                    {pass.exitTime}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-[#2B2022]">
                                  <span className="text-[#2B2022]/60 font-medium">المرافق:</span>
                                  <span className="font-bold text-[#7B1E3A]">{pass.accompaniedBy || 'ولي الأمر'}</span>
                                </div>
                                <div className="text-[#2B2022] pt-1 border-t border-slate-100">
                                  <span className="text-[#2B2022]/60 font-medium block text-[11px]">السبب:</span>
                                  <p className="font-semibold text-xs text-[#2B2022] mt-0.5">{pass.reason}</p>
                                </div>

                                {pass.student?.parent?.user && (
                                  <div className="text-[10px] text-[#2B2022]/70 pt-1 border-t border-slate-100 flex justify-between">
                                    <span>الولي: {pass.student.parent.user.firstName} {pass.student.parent.user.lastName}</span>
                                    <span className="font-mono">{pass.student.parent.user.phoneNumber}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#C9A24D]/20">
                              {isPending && (
                                <>
                                  <button
                                    onClick={() => handleApproveExitPass(pass._id)}
                                    className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>قبول ومصادقة الإدارة</span>
                                  </button>
                                  <button
                                    onClick={() => handleRejectExitPass(pass._id)}
                                    className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                  >
                                    رفض
                                  </button>
                                </>
                              )}

                              {(isApproved || isUsed) && (
                                <button
                                  onClick={() => setSelectedPassForPrint(pass)}
                                  className="w-full py-2 bg-[#7B1E3A] hover:bg-[#5E142A] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer border border-[#C9A24D]/30"
                                >
                                  <Printer className="w-3.5 h-3.5 text-[#C9A24D]" />
                                  <span>طباعة بطاقة الترخيص الرسمية</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
