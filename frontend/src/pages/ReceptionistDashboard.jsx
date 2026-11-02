import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import DigitalExitPassModal from '../components/DigitalExitPassModal';
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
  UserCheck,
  Printer,
  RefreshCw,
} from 'lucide-react';

export default function ReceptionistDashboard() {
  const [activeTab, setActiveTab] = useState('visitors');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    receptionist: null,
    visitorsToday: [],
    exitPassesToday: [],
  });
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Search filter for visitors
  const [visitorSearch, setVisitorSearch] = useState('');

  // Print pass modal state
  const [selectedPassForPrint, setSelectedPassForPrint] = useState(null);

  // New Visitor Form State
  const [visitorForm, setVisitorForm] = useState({
    visitorName: '',
    visitorPhone: '',
    visitorIdCard: '',
    visitType: 'Parent / ولي أمر',
    purpose: '',
    personToVisit: 'الإدارة العامة (Direction Générale)',
    customPersonToVisit: '',
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
    if (!visitorForm.visitorName.trim() || !visitorForm.visitorPhone.trim() || !visitorForm.purpose.trim()) {
      setError('يرجى ملء اسم الزائر، رقم الهاتف، وسبب الزيارة.');
      return;
    }

    const finalPerson = visitorForm.personToVisit === 'أخرى'
      ? (visitorForm.customPersonToVisit.trim() || 'الإدارة العامة')
      : visitorForm.personToVisit;

    try {
      await axios.post('/api/receptionist/visitors', {
        visitorName: visitorForm.visitorName.trim(),
        visitorPhone: visitorForm.visitorPhone.trim(),
        visitorIdCard: visitorForm.visitorIdCard.trim(),
        visitType: visitorForm.visitType,
        purpose: visitorForm.purpose.trim(),
        personToVisit: finalPerson,
      });

      setSuccessMsg('تم تسجيل دخول الزائر إلى المؤسسة بنجاح في سجل اليوم.');
      setVisitorForm({
        visitorName: '',
        visitorPhone: '',
        visitorIdCard: '',
        visitType: 'Parent / ولي أمر',
        purpose: '',
        personToVisit: 'الإدارة العامة (Direction Générale)',
        customPersonToVisit: '',
      });
      fetchDashboardData();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'خطأ أثناء تسجيل الزائر.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleCheckOutVisitor = async (visitorId) => {
    if (!window.confirm('هل أنت متأكد من تسجيل مغادرة هذا الزائر للمدرسة الآن؟')) return;
    try {
      await axios.put(`/api/receptionist/visitors/${visitorId}/checkout`);
      setSuccessMsg('تم تسجيل خروج ومغادرة الزائر للمؤسسة.');
      fetchDashboardData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError('خطأ أثناء تسجيل خروج الزائر.');
    }
  };

  const handleVerifyExitPass = async (passId) => {
    if (!window.confirm('هل تود المصادقة على بطاقة ترخيص الخروج والسماح للتلميذ بمغادرة البوابة الآن؟')) return;
    try {
      await axios.put(`/api/receptionist/exit-pass/${passId}/verify`);
      setSuccessMsg('تمت المصادقة على خروج التلميذ بنجاح وتوثيق المغادرة عبر البوابة الرئيسية.');
      fetchDashboardData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError('خطأ أثناء التحقق من بطاقة الخروج.');
    }
  };

  const filteredVisitors = (dashboardData.visitorsToday || []).filter((v) => {
    if (!visitorSearch.trim()) return true;
    const q = visitorSearch.toLowerCase();
    const name = (v.visitorName || '').toLowerCase();
    const phone = (v.visitorPhone || '').toLowerCase();
    const cni = (v.visitorIdCard || '').toLowerCase();
    const purpose = (v.purpose || '').toLowerCase();
    const person = (v.personToVisit || '').toLowerCase();
    return name.includes(q) || phone.includes(q) || cni.includes(q) || purpose.includes(q) || person.includes(q);
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 font-cairo text-right" dir="rtl">
        {/* Printable Exit Pass Voucher Modal */}
        {selectedPassForPrint && (
          <DigitalExitPassModal
            isOpen={true}
            onClose={() => setSelectedPassForPrint(null)}
            pass={selectedPassForPrint}
            student={selectedPassForPrint.student}
          />
        )}

        {/* Header Banner - Prestige Académique */}
        <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-l from-[#7B1E3A] via-[#5F1329] to-[#3B0715] text-white border-2 border-[#C9A24D]/50 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A24D]/20 border border-[#C9A24D]/40 text-[#F5DEB3] text-xs font-bold font-serif">
              <ShieldCheck className="w-4 h-4 text-[#C9A24D]" />
              <span>مكتب الاستقبال وبوابة المؤسسة الرسمية</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-black tracking-tight text-white">
              موظف الاستقبال (Le Réceptionniste)
            </h1>
            <p className="text-white/80 text-xs md:text-sm max-w-2xl leading-relaxed">
              ضبط سجل الزوار اليومي بالمؤسسة (الإحداثيات، رقم بطاقة الهوية، سبب الزيارة وموعد الدخول والخروج)، والمصادقة الميدانية على بطاقات ترخيص خروج التلاميذ الصادرة والمعتمدة عن الإدارة التربوية عند البوابة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="px-5 py-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-[#C9A24D]/40 text-center shadow-xs">
              <span className="text-[11px] text-white/80 block font-bold">زوار اليوم داخل المؤسسة</span>
              <span className="text-xl font-black text-[#50e3c2] font-mono mt-0.5 block">
                {dashboardData.visitorsToday.filter((v) => v.status === 'In School').length}
              </span>
            </div>
            <div className="px-5 py-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-[#C9A24D]/40 text-center shadow-xs">
              <span className="text-[11px] text-white/80 block font-bold">تراخيص خروج التلاميذ المعتمدة</span>
              <span className="text-xl font-black text-[#C9A24D] font-mono mt-0.5 block">
                {dashboardData.exitPassesToday.filter((p) => p.status !== 'Used').length} مرخصة
              </span>
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
              className="p-4 rounded-2xl bg-red-50 border-2 border-red-300 text-red-900 flex items-center justify-between text-xs font-bold shadow-xs"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
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
              className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 flex items-center justify-between text-xs font-bold shadow-xs"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg(null)}><X className="w-4 h-4" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-[#FDFBF7] border-2 border-[#C9A24D]/35">
          <button
            onClick={() => setActiveTab('visitors')}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs md:text-sm transition-all cursor-pointer ${
              activeTab === 'visitors'
                ? 'bg-[#7B1E3A] text-white shadow-md border border-[#C9A24D]'
                : 'text-[#7B1E3A] hover:bg-[#F3E9DC]'
            }`}
          >
            <Users className="w-4 h-4 shrink-0 text-[#C9A24D]" />
            <span>سجل زوار المدرسة اليومي (Check-In & Check-Out)</span>
          </button>

          <button
            onClick={() => setActiveTab('exit_passes')}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs md:text-sm transition-all cursor-pointer ${
              activeTab === 'exit_passes'
                ? 'bg-[#7B1E3A] text-white shadow-md border border-[#C9A24D]'
                : 'text-[#7B1E3A] hover:bg-[#F3E9DC]'
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0 text-[#C9A24D]" />
            <span>
              المصادقة على بطاقات ترخيص خروج التلاميذ ({dashboardData.exitPassesToday.filter((p) => p.status !== 'Used').length})
            </span>
          </button>
        </div>

        {/* TAB 1: VISITOR LOG */}
        {activeTab === 'visitors' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* New Visitor Form Card */}
            <div className="p-6 rounded-3xl bg-white border-2 border-[#C9A24D]/40 space-y-4 shadow-sm h-fit">
              <div className="flex items-center gap-2 text-[#7B1E3A] border-b border-[#C9A24D]/25 pb-3">
                <UserPlus className="w-5 h-5 text-[#C9A24D]" />
                <h3 className="font-serif font-black text-base">تسجيل زائر جديد عند الاستقبال</h3>
              </div>
              <p className="text-xs text-[#2B2022]/70 leading-relaxed font-medium">
                يرجى طلب بطاقة الهوية الوطنية (C.N.I) وتدوين رقم الهاتف وسبب الزيارة والجهة المقصودة بدقة.
              </p>

              <form onSubmit={handleCheckInVisitor} className="space-y-3.5 text-xs font-medium">
                <div className="space-y-1">
                  <label className="text-[#7B1E3A] font-bold block">الاسم الكامل للزائر *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: السيد بن ناصر رشيد"
                    value={visitorForm.visitorName}
                    onChange={(e) => setVisitorForm({ ...visitorForm, visitorName: e.target.value })}
                    className="w-full p-3 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-semibold focus:outline-none focus:border-[#7B1E3A] shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[#7B1E3A] font-bold block">رقم الهاتف *</label>
                    <input
                      type="tel"
                      required
                      placeholder="0550123456"
                      value={visitorForm.visitorPhone}
                      onChange={(e) => setVisitorForm({ ...visitorForm, visitorPhone: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-mono font-bold focus:outline-none focus:border-[#7B1E3A] shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#7B1E3A] font-bold block">رقم بطاقة الهوية (C.N.I)</label>
                    <input
                      type="text"
                      placeholder="1122334455"
                      value={visitorForm.visitorIdCard}
                      onChange={(e) => setVisitorForm({ ...visitorForm, visitorIdCard: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-mono font-bold focus:outline-none focus:border-[#7B1E3A] shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[#7B1E3A] font-bold block">صفة / نوع الزائر *</label>
                    <select
                      value={visitorForm.visitType}
                      onChange={(e) => setVisitorForm({ ...visitorForm, visitType: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-bold focus:outline-none focus:border-[#7B1E3A] shadow-2xs cursor-pointer"
                    >
                      <option value="Parent / ولي أمر">ولي أمر (Parent)</option>
                      <option value="Inspector / مفتش">مفتش تربوي (Inspecteur)</option>
                      <option value="Supplier / مورد">مورد / صيانة (Fournisseur)</option>
                      <option value="Candidate / مترشح">مترشح لوظيفة (Candidat)</option>
                      <option value="Inscription / تسجيل">تسجيل جديد (Inscription)</option>
                      <option value="Other / زائر عام">أخرى (Autre)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#7B1E3A] font-bold block">الجهة المقصودة *</label>
                    <select
                      value={visitorForm.personToVisit}
                      onChange={(e) => setVisitorForm({ ...visitorForm, personToVisit: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-bold focus:outline-none focus:border-[#7B1E3A] shadow-2xs cursor-pointer"
                    >
                      <option value="الإدارة العامة (Direction Générale)">الإدارة العامة (Direction)</option>
                      <option value="أمانة وسكرتارية المؤسسة (Secrétariat)">الأمانة وسكرتارية المؤسسة</option>
                      <option value="المراقب العام والتربوي (Surveillance)">المراقب العام والتربوي</option>
                      <option value="قاعة الأساتذة (Salle des Professeurs)">قاعة الأساتذة</option>
                      <option value="المصالح المالية والمحاسبة (Intendance)">المصالح المالية والمحاسبة</option>
                      <option value="مكتب الإرشاد المدرسي (Orientation)">مكتب التوجيه والإرشاد</option>
                      <option value="أخرى">جهة أخرى (مخصصة)</option>
                    </select>
                  </div>
                </div>

                {visitorForm.personToVisit === 'أخرى' && (
                  <div className="space-y-1">
                    <label className="text-[#7B1E3A] font-bold block">اكتب اسم الجهة أو الموظف المقصود *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: السيد الأستاذ بلقاسم..."
                      value={visitorForm.customPersonToVisit}
                      onChange={(e) => setVisitorForm({ ...visitorForm, customPersonToVisit: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-semibold focus:outline-none focus:border-[#7B1E3A]"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[#7B1E3A] font-bold block">موضوع / سبب الزيارة *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: استفسار عن نتائج الابن / تسليم ملف إداري..."
                    value={visitorForm.purpose}
                    onChange={(e) => setVisitorForm({ ...visitorForm, purpose: e.target.value })}
                    className="w-full p-3 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-semibold focus:outline-none focus:border-[#7B1E3A] shadow-2xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#7B1E3A] hover:bg-[#5E142A] text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-[#C9A24D]/40"
                >
                  <CheckCircle className="w-4 h-4 text-[#C9A24D]" />
                  <span>تسجيل دخول الزائر وتوثيقه في السجل</span>
                </button>
              </form>
            </div>

            {/* Today's Visitors Table */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-white border-2 border-[#C9A24D]/40 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C9A24D]/25 pb-3">
                <div>
                  <h3 className="font-serif font-black text-base text-[#7B1E3A]">
                    سجل الزوار المسجلين اليوم ({dashboardData.visitorsToday.length})
                  </h3>
                  <p className="text-xs text-[#2B2022]/70 font-medium">
                    يتم تدوين ساعة الدخول وساعة الخروج تلقائياً عند المغادرة
                  </p>
                </div>

                <div className="relative min-w-[200px]">
                  <Search className="w-4 h-4 text-[#C9A24D] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="ابحث بالاسم أو الهاتف أو CNI..."
                    value={visitorSearch}
                    onChange={(e) => setVisitorSearch(e.target.value)}
                    className="w-full pr-9 pl-3 py-2 bg-[#FDFBF7] border border-[#C9A24D]/40 rounded-xl text-xs text-[#2B2022] font-semibold placeholder-[#2B2022]/40 focus:outline-none focus:border-[#7B1E3A]"
                  />
                </div>
              </div>

              {filteredVisitors.length === 0 ? (
                <div className="py-14 text-center text-[#2B2022]/60 text-xs italic bg-[#FDFBF7] rounded-2xl border border-dashed border-[#C9A24D]/30 space-y-2">
                  <Users className="w-10 h-10 text-[#C9A24D]/40 mx-auto" />
                  <p className="font-bold text-sm text-[#7B1E3A]">لم يتم تسجيل أي زائر يطابق هذا البحث اليوم.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-[#C9A24D]/30 shadow-2xs">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="bg-[#F3E9DC] text-[#7B1E3A] font-serif font-bold border-b border-[#C9A24D]/30">
                        <th className="py-3 px-4">اسم الزائر وصفته</th>
                        <th className="py-3 px-4">معلومات الاتصال والهوية</th>
                        <th className="py-3 px-4">سبب الزيارة والجهة</th>
                        <th className="py-3 px-4">ساعة الدخول والخروج</th>
                        <th className="py-3 px-4 text-center">الحالة والإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#C9A24D]/15 bg-white">
                      {filteredVisitors.map((v) => (
                        <tr key={v._id} className="hover:bg-[#FDFBF7] transition-colors">
                          <td className="py-3.5 px-4 font-bold text-[#2B2022]">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-[#7B1E3A] flex items-center justify-center text-[#C9A24D] font-bold text-xs shrink-0">
                                {v.visitorName?.[0] || 'V'}
                              </div>
                              <div>
                                <div className="text-[#7B1E3A] font-bold">{v.visitorName}</div>
                                <span className="text-[10px] text-[#C9A24D] font-bold block">{v.visitType}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-[#2B2022]">
                            <div className="flex items-center gap-1 font-bold">
                              <Phone className="w-3 h-3 text-[#7B1E3A] inline" /> {v.visitorPhone}
                            </div>
                            {v.visitorIdCard && (
                              <div className="text-[#2B2022]/70 text-[10px] flex items-center gap-1 mt-0.5">
                                <CreditCard className="w-3 h-3 text-[#C9A24D] inline" /> CNI: {v.visitorIdCard}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#2B2022]">{v.purpose}</div>
                            <span className="text-[#7B1E3A] text-[11px] block font-medium">المقصود: {v.personToVisit}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-[#2B2022]">
                            <div>دخول: {new Date(v.checkInTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                            {v.checkOutTime && (
                              <div className="text-slate-500 font-semibold">خروج: {new Date(v.checkOutTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {v.status === 'In School' ? (
                              <button
                                onClick={() => handleCheckOutVisitor(v._id)}
                                className="px-3.5 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-white border border-red-800 text-xs font-black transition-all shadow-xs cursor-pointer"
                              >
                                تسجيل مغادرة الزائر
                              </button>
                            ) : (
                              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300">
                                غادر المدرسة (Sorti)
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
          <div className="p-6 md:p-8 rounded-3xl bg-white border-2 border-[#C9A24D]/40 space-y-5 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 border-b border-[#C9A24D]/25 pb-4">
              <div>
                <h3 className="text-lg font-serif font-black text-[#7B1E3A]">
                  بطاقات ترخيص خروج التلاميذ المعتمدة لليوم ({dashboardData.exitPassesToday.length})
                </h3>
                <p className="text-xs text-[#2B2022]/70 font-medium mt-1">
                  تظهر هنا التراخيص المعتمدة رسمياً من إدارة المؤسسة. يقوم موظف الاستقبال بالمصادقة على خروج التلميذ وتوثيق المغادرة عبر البوابة الرئيسية.
                </p>
              </div>

              <button
                onClick={fetchDashboardData}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FDFBF7] hover:bg-[#F3E9DC] text-[#7B1E3A] border border-[#C9A24D]/35 rounded-xl text-xs font-bold transition-all cursor-pointer self-start md:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>تحديث القائمة</span>
              </button>
            </div>

            {dashboardData.exitPassesToday.length === 0 ? (
              <div className="py-14 text-center text-[#2B2022]/60 text-xs italic bg-[#FDFBF7] rounded-2xl border border-dashed border-[#C9A24D]/30 space-y-2">
                <LogOut className="w-12 h-12 text-[#C9A24D]/40 mx-auto" />
                <p className="font-bold text-sm text-[#7B1E3A]">لا توجد بطاقات ترخيص خروج معتمدة للتلاميذ اليوم.</p>
                <p>تظهر البطاقات تلقائياً فور مصادقة الإدارة والمراقب العام على طلبات الخروج.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboardData.exitPassesToday.map((pass) => {
                  const isUsed = pass.status === 'Used' || pass.status === 'Verified';
                  const studentName = pass.student?.user?.firstName
                    ? `${pass.student.user.firstName} ${pass.student.user.lastName}`
                    : pass.student?.firstName
                    ? `${pass.student.firstName} ${pass.student.lastName}`
                    : 'التلميذ';

                  return (
                    <div
                      key={pass._id}
                      className={`p-5 rounded-2xl border-2 transition-all space-y-4 relative flex flex-col justify-between ${
                        isUsed
                          ? 'bg-[#FDFBF7] border-slate-300 opacity-80'
                          : 'bg-white border-emerald-300 shadow-md'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-[#7B1E3A] border border-[#C9A24D]/40 flex items-center justify-center text-[#C9A24D] font-black text-sm shrink-0">
                              {studentName[0] || 'T'}
                            </div>
                            <div>
                              <h4 className="font-bold text-base text-[#7B1E3A]">{studentName}</h4>
                              <span className="text-xs text-[#C9A24D] font-bold block font-mono">
                                القسم: {pass.class?.name || '—'}
                              </span>
                            </div>
                          </div>

                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            isUsed
                              ? 'bg-slate-100 text-slate-700 border-slate-300'
                              : 'bg-emerald-100 text-emerald-900 border-emerald-400 animate-pulse'
                          }`}>
                            {isUsed ? 'تم توثيق الخروج (Sorti)' : 'معتمد - بانتظار البوابة'}
                          </span>
                        </div>

                        <div className="space-y-2 py-3 border-y border-[#C9A24D]/25 bg-[#FDFBF7] p-3 rounded-xl text-xs">
                          <div className="flex justify-between text-[#2B2022]">
                            <span className="text-[#2B2022]/60 font-medium">ساعة الخروج المرخصة:</span>
                            <span className="font-mono font-bold text-base text-[#7B1E3A] bg-white px-2 py-0.5 rounded border border-[#C9A24D]/30" dir="ltr">
                              {pass.exitTime}
                            </span>
                          </div>
                          <div className="flex justify-between text-[#2B2022]">
                            <span className="text-[#2B2022]/60 font-medium">المرافق المعتمد:</span>
                            <span className="font-bold text-[#7B1E3A]">{pass.accompaniedBy || 'ولي الأمر'}</span>
                          </div>
                          <div className="text-[#2B2022] pt-1 border-t border-[#C9A24D]/15">
                            <span className="text-[#2B2022]/60 font-medium block text-[11px]">السبب أو المبرر:</span>
                            <p className="font-semibold text-xs text-[#2B2022] mt-0.5">{pass.reason}</p>
                          </div>
                          <div className="flex justify-between text-[11px] text-[#2B2022]/70 pt-1 border-t border-[#C9A24D]/15">
                            <span>صدر / اعتمد بواسطة:</span>
                            <span className="font-bold text-[#7B1E3A]">
                              {pass.approvedBy?.firstName || pass.issuedBy?.firstName} {pass.approvedBy?.lastName || pass.issuedBy?.lastName || 'إدارة المدرسة'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1">
                        {!isUsed && (
                          <button
                            onClick={() => handleVerifyExitPass(pass._id)}
                            className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-emerald-500/40"
                          >
                            <ShieldCheck className="w-4 h-4 text-emerald-200" />
                            <span>المصادقة والسماح بالخروج من البوابة الآن</span>
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedPassForPrint(pass)}
                          className="w-full py-2 bg-[#F3E9DC] hover:bg-[#ebdcc7] text-[#7B1E3A] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-[#C9A24D]/35"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#C9A24D]" />
                          <span>معاينة وطباعة بطاقة الترخيص (Voucher)</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
