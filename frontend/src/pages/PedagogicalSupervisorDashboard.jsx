import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  FileText,
  ShieldAlert,
  Plus,
  Clock,
  Briefcase,
  Utensils,
  LogOut,
  X,
  Check,
  BookOpen
} from 'lucide-react';

export default function PedagogicalSupervisorDashboard() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    supervisor: null,
    staffAttendanceToday: [],
    damagesToday: [],
    canteenToday: [],
    exitPassesToday: [],
    allTeachers: [],
    allClasses: [],
    students: []
  });
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Attendance form state
  const [attendanceForm, setAttendanceForm] = useState({ staffUserId: '', status: 'Present', remarks: '' });

  // Exit Pass form state
  const [exitPassForm, setExitPassForm] = useState({
    studentId: '',
    reason: 'سبب طبي / موعد مستعجل',
    exitTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    accompaniedBy: 'ولي الأمر (Parent/Tuteur)'
  });

  // Damage form state
  const [damageForm, setDamageForm] = useState({ location: '', description: '', estimatedCost: '' });

  // Canteen form state
  const [canteenForm, setCanteenForm] = useState({ mealType: 'Lunch', isPaid: true, notes: '' });

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/supervisors/dashboard');
      setDashboardData(response.data);
    } catch (err) {
      console.error('Error loading pedagogical supervisor dashboard:', err);
      setError('تعذر تحميل بيانات لوحة المراقب التربوي. يرجى التحقق من الاتصال.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRecordStaffAttendance = async (e) => {
    e.preventDefault();
    if (!attendanceForm.staffUserId) {
      setError('يرجى اختيار الأستاذ أو الموظف.');
      return;
    }
    try {
      await axios.post('/api/supervisors/staff-attendance', {
        staffUserId: attendanceForm.staffUserId,
        status: attendanceForm.status,
        remarks: attendanceForm.remarks
      });
      setSuccessMsg(
        attendanceForm.status === 'Absent'
          ? 'تم تسجيل غياب الأستاذ بنجاح، وتم تفعيل الخصم المالي التلقائي من راتبه.'
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

  const handleCreateExitPass = async (e) => {
    e.preventDefault();
    if (!exitPassForm.studentId) {
      setError('يرجى تحديد التلميذ.');
      return;
    }
    try {
      await axios.post('/api/supervisors/exit-pass', exitPassForm);
      setSuccessMsg('تم إصدار بطاقة ترخيص الخروج بنجاح. سيتمكن موظف الاستقبال من التحقق منها والمصادقة عليها عند البوابة.');
      setExitPassForm({
        studentId: '',
        reason: 'سبب طبي / موعد مستعجل',
        exitTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        accompaniedBy: 'ولي الأمر (Parent/Tuteur)'
      });
      fetchDashboardData();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'خطأ أثناء إصدار بطاقة الخروج.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleReportDamage = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/supervisors/damage', damageForm);
      setSuccessMsg('تم إرسال تقرير الإتلاف للمراقب العام والإدارة المالية بنجاح.');
      setDamageForm({ location: '', description: '', estimatedCost: '' });
      fetchDashboardData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'خطأ أثناء تسجيل الإتلاف.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleCreateCanteenReservation = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/supervisors/canteen', canteenForm);
      setSuccessMsg('تم تسجيل حجز المطعم اليومي بنجاح.');
      setCanteenForm({ mealType: 'Lunch', isPaid: true, notes: '' });
      fetchDashboardData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'خطأ أثناء تسجيل حجز المطعم.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const assignedClasses = dashboardData.supervisor?.assignedClasses || [];

  return (
    <DashboardLayout>
      <div className="space-y-8 font-cairo text-right" dir="rtl">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-slate-900 via-indigo-950/50 to-slate-900 border border-luxury-border/60 p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="absolute top-0 left-0 w-80 h-80 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-bold">
                <BookOpen className="w-4 h-4" />
                <span>لوحة الرقابة التربوية ومتابعة الأقسام الموكلة</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                المراقب التربوي (Superviseur Pédagogique)
              </h1>
              <p className="text-slate-400 text-sm max-w-2xl leading-relaxed font-medium">
                ضبط حضور وغياب الأساتذة والطاقم وتفعيل الخصم التلقائي، إصدار بطاقات ترخيص خروج التلاميذ الرسمية للمصادقة عند موظف الاستقبال، والتبليغ عن أي إتلاف أو خسائر في الأقسام الموكلة.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="px-4 py-3 rounded-2xl bg-slate-950/80 border border-luxury-border text-center">
                <span className="text-[10px] text-slate-400 block font-bold">الأقسام الموكلة</span>
                <span className="text-sm font-black text-indigo-400">
                  {assignedClasses.length} أقسم/أفواج
                </span>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-slate-950/80 border border-luxury-border text-center">
                <span className="text-[10px] text-slate-400 block font-bold">تاريخ اليوم</span>
                <span className="text-sm font-black text-brand-400 font-mono">
                  {new Date().toLocaleDateString('ar-DZ')}
                </span>
              </div>
            </div>
          </div>

          {/* Assigned classes pills */}
          {assignedClasses.length > 0 && (
            <div className="mt-6 pt-4 border-t border-luxury-border/30 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-bold">الأقسام الموكلة لمراقبتها:</span>
              {assignedClasses.map((cls) => (
                <span key={cls._id} className="px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
                  {cls.name} <span className="text-[10px] text-slate-400">({cls.level})</span>
                </span>
              ))}
            </div>
          )}
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
            { id: 'attendance', label: 'تفقد حضور الأساتذة والخصم التلقائي', icon: Users },
            { id: 'exit_pass', label: 'إصدار بطاقة ترخيص خروج تلميذ', icon: LogOut },
            { id: 'damages', label: 'التبليغ عن إتلاف التجهيزات بالقسم', icon: ShieldAlert },
            { id: 'canteen', label: 'حجز المطعم المدرسي اليومي', icon: Utensils }
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

        {/* TAB 1: TEACHER / STAFF ATTENDANCE */}
        {activeTab === 'attendance' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-luxury-border/50 space-y-5 h-fit">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-400" />
                <span>تسجيل حضور / غياب أستاذ أو موظف</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                عند تسجيل <span className="text-red-400 font-bold">غياب (Absent)</span> الأستاذ أو الموظف، يتم إرسال الخصم التلقائي لكشف راتبه الشهري عند الإدارة المالية.
              </p>

              <form onSubmit={handleRecordStaffAttendance} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">اختيار الأستاذ</label>
                  <select
                    value={attendanceForm.staffUserId}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, staffUserId: e.target.value })}
                    required
                    className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- اختر الأستاذ / الموظف --</option>
                    {dashboardData.allTeachers?.map((t) => (
                      <option key={t.user?._id} value={t.user?._id}>
                        {t.user?.firstName} {t.user?.lastName} — (أستاذ)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">الحالة</label>
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
                  <label className="text-slate-400 font-bold">ملاحظات / القسم</label>
                  <input
                    type="text"
                    placeholder="مثال: غائب عن حصة 8:00 في القسم 1م..."
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
                  <span>تسجيل الحضور في النظام</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-luxury-border/50 space-y-4">
              <h3 className="font-bold text-white text-base">سجل تفقد الطاقم اليومي ({dashboardData.staffAttendanceToday?.length || 0})</h3>
              {(!dashboardData.staffAttendanceToday || dashboardData.staffAttendanceToday.length === 0) ? (
                <div className="py-12 text-center text-slate-500 text-xs italic">
                  لم يتم تسجيل تفقد للأساتذة اليوم بعد.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right border-collapse">
                    <thead>
                      <tr className="border-b border-luxury-border/40 text-slate-400 text-xs font-bold">
                        <th className="py-3 px-4">الأستاذ / الموظف</th>
                        <th className="py-3 px-4">الحالة</th>
                        <th className="py-3 px-4">أثر الراتب</th>
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
                                - خصم تلقائي نشط
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
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

        {/* TAB 2: STUDENT EXIT PASS ISSUANCE */}
        {activeTab === 'exit_pass' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-luxury-border/50 space-y-5 h-fit">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <LogOut className="w-5 h-5 text-indigo-400" />
                <span>إصدار بطاقة ترخيص خروج تلميذ</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                عند إصدار هذه البطاقة للتلميذ، ستظهر فوراً في لوحة <strong className="text-white">موظف الاستقبال (Le Réceptionniste)</strong> ليقوم بالتحقق منها عند مغادرة التلميذ للبوابة الرسمية.
              </p>

              <form onSubmit={handleCreateExitPass} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">اختيار التلميذ</label>
                  <select
                    value={exitPassForm.studentId}
                    onChange={(e) => setExitPassForm({ ...exitPassForm, studentId: e.target.value })}
                    required
                    className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- اختر التلميذ --</option>
                    {dashboardData.students?.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.user?.firstName || s.firstName} {s.user?.lastName || s.lastName} — (القسم: {s.class?.name || '—'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">سبب / مبرر المغادرة</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: موعد طبي عاجل / ظرف عائلي / مراجعة إدارية"
                    value={exitPassForm.reason}
                    onChange={(e) => setExitPassForm({ ...exitPassForm, reason: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">ساعة الخروج المرخصة</label>
                  <input
                    type="text"
                    required
                    placeholder="10:30"
                    value={exitPassForm.exitTime}
                    onChange={(e) => setExitPassForm({ ...exitPassForm, exitTime: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">المرافق المعتمد لاستلام التلميذ</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: ولي الأمر (السيد مزيان) / السائق المعتمد"
                    value={exitPassForm.accompaniedBy}
                    onChange={(e) => setExitPassForm({ ...exitPassForm, accompaniedBy: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-extrabold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>إصدار بطاقة ترخيص الخروج الرسمية</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-luxury-border/50 space-y-4">
              <h3 className="font-bold text-white text-base flex justify-between items-center">
                <span>بطاقات الخروج الصادرة اليوم ({dashboardData.exitPassesToday?.length || 0})</span>
                <span className="text-xs text-indigo-400 font-mono">تنتظر مصادقة الاستقبال</span>
              </h3>

              {(!dashboardData.exitPassesToday || dashboardData.exitPassesToday.length === 0) ? (
                <div className="py-12 text-center text-slate-500 text-xs italic">
                  لم يتم إصدار أي بطاقة خروج للتلاميذ اليوم.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dashboardData.exitPassesToday.map((pass) => (
                    <div
                      key={pass._id}
                      className="p-5 rounded-2xl bg-slate-950/80 border border-luxury-border/40 space-y-3 relative group hover:border-indigo-500/40 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-white text-sm">
                            {pass.student?.user?.firstName || pass.student?.firstName} {pass.student?.user?.lastName || pass.student?.lastName}
                          </h4>
                          <span className="text-xs text-brand-400 font-bold block">
                            القسم: {pass.class?.name || '—'}
                          </span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          pass.status === 'Verified'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 animate-pulse'
                        }`}>
                          {pass.status === 'Verified' ? 'تم تأكيد خروجه بالبوابة' : 'مرخص (ينتظر البوابة)'}
                        </span>
                      </div>

                      <div className="space-y-1 pt-2 border-t border-luxury-border/20 text-xs text-slate-300">
                        <div><strong className="text-slate-500">السبب:</strong> {pass.reason}</div>
                        <div><strong className="text-slate-500">ساعة الخروج:</strong> <span className="font-mono text-white">{pass.exitTime}</span></div>
                        <div><strong className="text-slate-500">المرافق:</strong> {pass.accompaniedBy}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: DAMAGE REPORTING */}
        {activeTab === 'damages' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-luxury-border/50 space-y-5 h-fit">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <span>التبليغ الفوري عن إتلاف في قاعة/قسم</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                إرسال تقرير إتلاف للمراقب العام ولمصلحة الصيانة والتعويضات المالية.
              </p>

              <form onSubmit={handleReportDamage} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">اسم القسم / القاعة</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: القاعة 4 (قسم 1 متوسط أ)"
                    value={damageForm.location}
                    onChange={(e) => setDamageForm({ ...damageForm, location: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">وصف الضرر والتلف</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="مثال: كسر مقبض الباب وطاولتين..."
                    value={damageForm.description}
                    onChange={(e) => setDamageForm({ ...damageForm, description: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">التكلفة التقديرية للتعويض (د.ج)</label>
                  <input
                    type="number"
                    placeholder="مثال: 2000"
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
                  <span>إرسال تقرير الإتلاف</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-luxury-border/50 space-y-4">
              <h3 className="font-bold text-white text-base">تقارير التجهيزات المسجلة لليوم ({dashboardData.damagesToday?.length || 0})</h3>
              {(!dashboardData.damagesToday || dashboardData.damagesToday.length === 0) ? (
                <div className="py-12 text-center text-slate-500 text-xs italic">
                  لم يتم التبليغ عن أي أضرار اليوم.
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData.damagesToday.map((dmg) => (
                    <div
                      key={dmg._id}
                      className="p-4 rounded-2xl bg-slate-950/80 border border-luxury-border/40 flex justify-between items-center gap-4"
                    >
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold text-xs border border-amber-500/20">
                          {dmg.location}
                        </span>
                        <p className="text-sm text-white font-bold">{dmg.description}</p>
                        {dmg.estimatedCost && (
                          <span className="text-xs text-emerald-400 font-mono block">
                            التكلفة المقدرة: {dmg.estimatedCost.toLocaleString('fr-FR')} د.ج
                          </span>
                        )}
                      </div>

                      <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-900 border border-luxury-border/50 text-slate-300">
                        {dmg.status === 'Resolved' ? 'تمت الصيانة' : dmg.status === 'In_Progress' ? 'قيد الصيانة' : 'تم التبليغ'}
                      </span>
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
                تسجيل حجز وجبة غداء لتلاميذ الأقسام الموكلة أو للكادر.
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
                    placeholder="مثال: تلميذ في القسم 2م / نشاط..."
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
              <h3 className="font-bold text-white text-base">سجل حجوزات المطعم لليوم ({dashboardData.canteenToday?.length || 0})</h3>
              {(!dashboardData.canteenToday || dashboardData.canteenToday.length === 0) ? (
                <div className="py-12 text-center text-slate-500 text-xs italic">
                  لم يتم تسجيل أي حجوزات اليوم بعد.
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
      </div>
    </DashboardLayout>
  );
}
