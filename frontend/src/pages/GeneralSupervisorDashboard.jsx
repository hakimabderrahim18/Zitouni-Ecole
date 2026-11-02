import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import DigitalExitPassModal from '../components/DigitalExitPassModal';
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
} from 'lucide-react';

export default function GeneralSupervisorDashboard() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('attendance');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    supervisor: null,
    staffAttendanceToday: [],
    damagesToday: [],
    canteenToday: [],
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

  // Canteen reservation state
  const [canteenForm, setCanteenForm] = useState({ mealType: 'Lunch', isPaid: true, notes: '' });

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

  useEffect(() => {
    if (location.pathname.endsWith('/attendance')) setActiveTab('attendance');
    else if (location.pathname.endsWith('/assignment') || location.pathname.endsWith('/classes-assignment')) setActiveTab('assignment');
    else if (location.pathname.endsWith('/damages')) setActiveTab('damages');
    else if (location.pathname.endsWith('/canteen')) setActiveTab('canteen');
    else if (location.pathname.endsWith('/exit-passes') || location.pathname.endsWith('/exit-pass')) setActiveTab('exit_passes');
  }, [location.pathname]);

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

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-900 border border-luxury-border/50">
          {[
            { id: 'attendance', label: 'حضور الأساتذة والموظفين والخصم التلقائي', icon: Users },
            { id: 'assignment', label: 'توزيع المراقبين التربويين على الأقسام', icon: Layers },
            { id: 'damages', label: 'رقابة التجهيزات وسجل الإتلافات اليومي', icon: ShieldAlert },
            { id: 'canteen', label: 'حجوزات المطعم المدرسي (الكانتين)', icon: Utensils }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-xs md:text-sm transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-slate-950 shadow-[0_5px_15px_rgba(244,180,0,0.25)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
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

        {/* TAB 4: CANTEEN RESERVATIONS */}
        {activeTab === 'canteen' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-luxury-border/50 space-y-5 h-fit">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Utensils className="w-5 h-5 text-brand-400" />
                <span>حجز وجبة مطعم (الكانتين)</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                تسجيل حجز وجبة غداء أو فطور للتلاميذ أو الكادر والتحقق من حالة الدفع اليومية.
              </p>

              <form onSubmit={handleCreateCanteenReservation} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">نوع الوجبة</label>
                  <select
                    value={canteenForm.mealType}
                    onChange={(e) => setCanteenForm({ ...canteenForm, mealType: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="Lunch">وجبة الغداء (Lunch)</option>
                    <option value="Breakfast">فطور الصباح (Breakfast)</option>
                    <option value="Snack">لمجة المساء (Snack)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">حالة الدفع</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCanteenForm({ ...canteenForm, isPaid: true })}
                      className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                        canteenForm.isPaid
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'bg-slate-950 border-luxury-border text-slate-400'
                      }`}
                    >
                      مدفوع / مشترك
                    </button>
                    <button
                      type="button"
                      onClick={() => setCanteenForm({ ...canteenForm, isPaid: false })}
                      className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                        !canteenForm.isPaid
                          ? 'bg-red-500/20 border-red-500 text-red-400'
                          : 'bg-slate-950 border-luxury-border text-slate-400'
                      }`}
                    >
                      غير مدفوع (ذمة)
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">ملاحظات حجز (اختياري)</label>
                  <input
                    type="text"
                    placeholder="مثال: تلميذ في القسم 2م / خاص بالنشاط..."
                    value={canteenForm.notes}
                    onChange={(e) => setCanteenForm({ ...canteenForm, notes: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-extrabold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>تأكيد الحجز اليومي</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-luxury-border/50 space-y-4">
              <h3 className="font-bold text-white text-base">سجل حجوزات المطعم لليوم ({dashboardData.canteenToday.length})</h3>
              {dashboardData.canteenToday.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs italic">
                  لم يتم تسجيل أي حجوزات في المطعم المدرسي اليوم بعد.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dashboardData.canteenToday.map((res) => (
                    <div
                      key={res._id}
                      className="p-4 rounded-2xl bg-slate-950/80 border border-luxury-border/40 flex justify-between items-center"
                    >
                      <div className="space-y-1">
                        <span className="font-bold text-white text-sm block">
                          {res.user?.firstName || 'حجز'} {res.user?.lastName || 'مستفيد'}
                        </span>
                        <span className="text-xs text-slate-400 block">
                          نوع الوجبة: <strong className="text-brand-400">{res.mealType}</strong>
                        </span>
                        {res.notes && <span className="text-[11px] text-slate-500 block">{res.notes}</span>}
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        res.isPaid
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/15 text-red-400 border border-red-500/30'
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
                  <div className="space-y-1">
                    <label className="text-[#7B1E3A] font-bold block">التلميذ المعني بالخروج *</label>
                    <select
                      required
                      value={exitPassForm.studentId}
                      onChange={(e) => setExitPassForm({ ...exitPassForm, studentId: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-bold focus:outline-none focus:border-[#7B1E3A]"
                    >
                      <option value="">-- اختر التلميذ --</option>
                      {(dashboardData.students || []).map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.user?.firstName} {s.user?.lastName} ({s.class?.name || 'بدون قسم'})
                        </option>
                      ))}
                    </select>
                  </div>

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
      </div>
    </DashboardLayout>
  );
}
