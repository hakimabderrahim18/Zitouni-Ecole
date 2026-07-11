import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  LogOut,
  CheckCircle,
  AlertTriangle,
  Clock,
  Briefcase,
  ShieldCheck,
  Search,
  Check,
  X,
  Phone,
  CreditCard,
  Building,
  UserCheck
} from 'lucide-react';

export default function ReceptionistDashboard() {
  const [activeTab, setActiveTab] = useState('visitors');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    receptionist: null,
    visitorsToday: [],
    exitPassesToday: []
  });
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // New Visitor Form State
  const [visitorForm, setVisitorForm] = useState({
    visitorName: '',
    visitorPhone: '',
    visitorIdCard: '',
    visitType: 'Parent / ولي أمر',
    purpose: '',
    personToVisit: 'الإدارة العامة (Administration)'
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/receptionist/dashboard');
      setDashboardData(response.data);
    } catch (err) {
      console.error('Error loading receptionist dashboard:', err);
      setError('تعذر تحميل بيانات الاستقبال وبطاقات الخروج.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCheckInVisitor = async (e) => {
    e.preventDefault();
    if (!visitorForm.visitorName || !visitorForm.visitorPhone || !visitorForm.purpose) {
      setError('يرجى ملء الاسم رقم الهاتف وسبب الزيارة.');
      return;
    }
    try {
      await axios.post('/api/receptionist/visitors', visitorForm);
      setSuccessMsg('تم تسجيل دخول الزائر إلى المدرسة بنجاح في سجل اليوم.');
      setVisitorForm({
        visitorName: '',
        visitorPhone: '',
        visitorIdCard: '',
        visitType: 'Parent / ولي أمر',
        purpose: '',
        personToVisit: 'الإدارة العامة (Administration)'
      });
      fetchDashboardData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'خطأ أثناء تسجيل الزائر.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleCheckOutVisitor = async (visitorId) => {
    if (!window.confirm('هل أنت متأكد من تسجيل مغادرة هذا الزائر للمدرسة؟')) return;
    try {
      await axios.put(`/api/receptionist/visitors/${visitorId}/checkout`);
      setSuccessMsg('تم تسجيل خروج الزائر ومغادرته للمؤسسة.');
      fetchDashboardData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError('خطأ أثناء تسجيل خروج الزائر.');
    }
  };

  const handleVerifyExitPass = async (passId) => {
    if (!window.confirm('هل تود المصادقة على بطاقة ترخيص الخروج والسماح لتلميذ بمغادرة البوابة الآن؟')) return;
    try {
      await axios.put(`/api/receptionist/exit-pass/${passId}/verify`);
      setSuccessMsg('تمت المصادقة على خروج التلميذ بنجاح وتوثيق المغادرة عبر البوابة الرئيسية.');
      fetchDashboardData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError('خطأ أثناء التحقق من بطاقة الخروج.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 font-cairo text-right" dir="rtl">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-slate-900 via-slate-900 to-indigo-950/40 border border-luxury-border/60 p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="absolute top-0 left-0 w-80 h-80 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-400 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>استقبال ومتابعة الدخول والخروج في المؤسسة</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                موظف الاستقبال (Le Réceptionniste)
              </h1>
              <p className="text-slate-400 text-sm max-w-2xl leading-relaxed font-medium">
                ضبط سجل الزوار اليومي بالمؤسسة (الإحداثيات، رقم بطاقة الهوية، سبب الزيارة وموعد الدخول والخروج)، والمصادقة الميدانية على بطاقات ترخيص خروج التلاميذ الصادرة عن المراقبين التربويين عند البوابة الرسمية.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="px-4 py-3 rounded-2xl bg-slate-950/80 border border-luxury-border text-center">
                <span className="text-[10px] text-slate-400 block font-bold">زوار اليوم داخل المؤسسة</span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  {dashboardData.visitorsToday.filter((v) => v.status === 'In School').length}
                </span>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-slate-950/80 border border-luxury-border text-center">
                <span className="text-[10px] text-slate-400 block font-bold">بطاقات خروج التلاميذ</span>
                <span className="text-base font-black text-brand-400 font-mono">
                  {dashboardData.exitPassesToday.filter((p) => p.status !== 'Used').length} مرخصة
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Notifications */}
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

        {/* Tabs Navigation */}
        <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-900 border border-luxury-border/50">
          <button
            onClick={() => setActiveTab('visitors')}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs md:text-sm transition-all duration-300 ${
              activeTab === 'visitors'
                ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-slate-950 shadow-[0_5px_15px_rgba(244,180,0,0.25)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>سجل زوار المدرسة اليومي (Check-In & Check-Out)</span>
          </button>

          <button
            onClick={() => setActiveTab('exit_passes')}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs md:text-sm transition-all duration-300 ${
              activeTab === 'exit_passes'
                ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-slate-950 shadow-[0_5px_15px_rgba(244,180,0,0.25)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>المصادقة على بطاقات ترخيص خروج التلاميذ ({dashboardData.exitPassesToday.filter((p) => p.status !== 'Used').length})</span>
          </button>
        </div>

        {/* TAB 1: VISITOR LOG */}
        {activeTab === 'visitors' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* New Visitor Form */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-luxury-border/50 space-y-5 h-fit">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-400" />
                <span>تسجيل زائر جديد عند الاستقبال</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                يرجى طلب بطاقة الهوية الوطنية أو التعريف الرسمي وتدوين رقم الهاتف وسبب الزيارة بدقة.
              </p>

              <form onSubmit={handleCheckInVisitor} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">الاسم الكامل للزائر</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: السيد بن ناصر رشيد"
                    value={visitorForm.visitorName}
                    onChange={(e) => setVisitorForm({ ...visitorForm, visitorName: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">رقم الهاتف</label>
                    <input
                      type="tel"
                      required
                      placeholder="0550123456"
                      value={visitorForm.visitorPhone}
                      onChange={(e) => setVisitorForm({ ...visitorForm, visitorPhone: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white font-mono focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">رقم بطاقة الهوية (C.N.I)</label>
                    <input
                      type="text"
                      placeholder="1122334455"
                      value={visitorForm.visitorIdCard}
                      onChange={(e) => setVisitorForm({ ...visitorForm, visitorIdCard: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white font-mono focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">صفة / نوع الزائر</label>
                    <select
                      value={visitorForm.visitType}
                      onChange={(e) => setVisitorForm({ ...visitorForm, visitType: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white focus:outline-none focus:border-brand-500"
                    >
                      <option value="Parent / ولي أمر">ولي أمر (Parent)</option>
                      <option value="Inspector / مفتش">مفتش تربوي (Inspecteur)</option>
                      <option value="Supplier / مورد">مورد / صيانة (Fournisseur)</option>
                      <option value="Candidate / مترشح">مترشح لوظيفة (Candidat)</option>
                      <option value="Other / زائر عام">أخرى (Autre)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">الجهة المقصودة</label>
                    <input
                      type="text"
                      placeholder="مثال: المدير / الأستاذ..."
                      value={visitorForm.personToVisit}
                      onChange={(e) => setVisitorForm({ ...visitorForm, personToVisit: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">موضوع / سبب الزيارة</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: استفسار عن نتائج الابن / تسليم ملف..."
                    value={visitorForm.purpose}
                    onChange={(e) => setVisitorForm({ ...visitorForm, purpose: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-extrabold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>تسجيل دخول الزائر وطباعة بطاقة الدخول</span>
                </button>
              </form>
            </div>

            {/* Today's Visitors Table */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-luxury-border/50 space-y-4">
              <h3 className="font-bold text-white text-base flex justify-between items-center">
                <span>سجل الزوار المسجلين اليوم ({dashboardData.visitorsToday.length})</span>
                <span className="text-xs text-slate-400 font-normal">يتم تدوين الدخول والخروج بدقة</span>
              </h3>

              {dashboardData.visitorsToday.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs italic">
                  لم يتم تسجيل أي زائر اليوم حتى الآن.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right border-collapse">
                    <thead>
                      <tr className="border-b border-luxury-border/40 text-slate-400 text-xs font-bold">
                        <th className="py-3 px-4">اسم الزائر</th>
                        <th className="py-3 px-4">معلومات الاتصال والهوية</th>
                        <th className="py-3 px-4">سبب الزيارة والجهة</th>
                        <th className="py-3 px-4">وقت الدخول/الخروج</th>
                        <th className="py-3 px-4 text-center">الحالة والإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-luxury-border/20">
                      {dashboardData.visitorsToday.map((v) => (
                        <tr key={v._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4 font-bold text-white">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-brand-400 font-bold text-xs shrink-0">
                                {v.visitorName?.[0]}
                              </div>
                              <div>
                                <div className="text-white font-bold">{v.visitorName}</div>
                                <span className="text-[10px] text-brand-400 font-bold block">{v.visitType}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-mono">
                            <div className="text-slate-300 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500 inline" /> {v.visitorPhone}
                            </div>
                            {v.visitorIdCard && (
                              <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                                <CreditCard className="w-3 h-3 inline" /> CNI: {v.visitorIdCard}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-xs">
                            <div className="text-white font-bold">{v.purpose}</div>
                            <span className="text-slate-400 text-[11px] block">المقصود: {v.personToVisit}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                            <div>دخول: {new Date(v.checkInTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                            {v.checkOutTime && (
                              <div className="text-slate-500">خروج: {new Date(v.checkOutTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {v.status === 'In School' ? (
                              <button
                                onClick={() => handleCheckOutVisitor(v._id)}
                                className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500 text-red-400 hover:text-slate-950 border border-red-500/30 text-xs font-extrabold transition-all"
                              >
                                تسجيل مغادرة الزائر
                              </button>
                            ) : (
                              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-bold border border-luxury-border">
                                غادر المدرسة (Departed)
                              </span>
                            )}
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

        {/* TAB 2: STUDENT EXIT PASSES VERIFICATION */}
        {activeTab === 'exit_passes' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-luxury-border/50 space-y-4">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-luxury-border/30 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">بطاقات ترخيص خروج التلاميذ الممنوحة اليوم</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    تصدر هذه البطاقات عن المراقب التربوي أو المراقب العام وتظهر تلقائياً في قائمة موظف الاستقبال للتحقق والمصادقة على خروج التلميذ من البوابة.
                  </p>
                </div>
              </div>

              {dashboardData.exitPassesToday.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm italic">
                  لا توجد بطاقات ترخيص خروج للتلاميذ اليوم.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dashboardData.exitPassesToday.map((pass) => {
                    const isUsed = pass.status === 'Used' || pass.status === 'Verified';
                    return (
                      <div
                        key={pass._id}
                        className={`p-6 rounded-3xl border transition-all space-y-4 relative overflow-hidden ${
                          isUsed
                            ? 'bg-slate-950/40 border-luxury-border/30 opacity-75'
                            : 'bg-slate-900/90 border-brand-500/40 shadow-[0_10px_30px_rgba(244,180,0,0.1)]'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400 font-extrabold text-sm">
                              {pass.student?.user?.firstName?.[0] || pass.student?.firstName?.[0] || 'T'}
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-base">
                                {pass.student?.user?.firstName || pass.student?.firstName} {pass.student?.user?.lastName || pass.student?.lastName}
                              </h4>
                              <span className="text-xs text-brand-400 font-bold block">
                                القسم: {pass.class?.name || '—'}
                              </span>
                            </div>
                          </div>

                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            isUsed
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse'
                          }`}>
                            {isUsed ? 'مرخص وتم الخروج' : 'ينتظر المصادقة'}
                          </span>
                        </div>

                        <div className="space-y-2 py-3 border-y border-luxury-border/30 text-xs">
                          <div className="flex justify-between text-slate-300">
                            <span className="text-slate-400">السبب أو المبرر:</span>
                            <span className="font-bold text-white">{pass.reason}</span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span className="text-slate-400">ساعة الخروج المرخصة:</span>
                            <span className="font-mono font-bold text-brand-400 text-sm">{pass.exitTime}</span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span className="text-slate-400">المرافق المعتمد:</span>
                            <span className="font-bold text-slate-200">{pass.accompaniedBy || 'ولي الأمر'}</span>
                          </div>
                          <div className="flex justify-between text-slate-400 text-[11px] pt-1">
                            <span>صدر الترخيص بواسطة:</span>
                            <span className="text-slate-300">{pass.issuedBy?.firstName} {pass.issuedBy?.lastName}</span>
                          </div>
                        </div>

                        {!isUsed && (
                          <button
                            onClick={() => handleVerifyExitPass(pass._id)}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-black text-xs transition-all shadow-md flex items-center justify-center gap-2"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>المصادقة والسماح بالخروج من البوابة الآن</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
