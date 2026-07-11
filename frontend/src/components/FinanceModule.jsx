import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  Search,
  FileText,
  Calendar,
  Settings,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Check
} from 'lucide-react';

export default function FinanceModule() {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
    recentTransactions: [],
    products: [],
    staffMembers: [],
    currentPayrolls: [],
    currentMonth: new Date().toISOString().slice(0, 7)
  });
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Forms state
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [staffConfigForm, setStaffConfigForm] = useState({ baseSalary: '', salaryDeductionPerAbsence: '' });
  
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [productForm, setProductForm] = useState({ name: '', price: '', category: 'Tuition', description: '' });

  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    title: '',
    amount: '',
    type: 'INCOME',
    category: 'Tuition',
    description: ''
  });

  const fetchFinanceOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/finance/overview');
      setOverview(response.data);
    } catch (err) {
      console.error('Error loading finance data:', err);
      setError('تعذر تحميل البيانات المالية. يرجى التأكد من صلاحيات حسابك كمسؤول عن المنصة.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceOverview();
  }, []);

  const handleUpdateStaffConfig = async (e, userId) => {
    e.preventDefault();
    try {
      await axios.put('/api/finance/salary-config', {
        userId,
        baseSalary: Number(staffConfigForm.baseSalary),
        salaryDeductionPerAbsence: Number(staffConfigForm.salaryDeductionPerAbsence)
      });
      setSuccessMsg('تم تحديث الراتب وقيمة الخصم التلقائي للموظف بنجاح.');
      setEditingStaffId(null);
      fetchFinanceOverview();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'خطأ أثناء تحديث بيانات الراتب.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handlePaySalary = async (payrollId) => {
    if (!window.confirm('هل أنت متأكد من صرف الراتب لهذا الموظف واصدار قسيمة الدفع؟')) return;
    try {
      await axios.put(`/api/finance/payroll/${payrollId}/pay`, {
        paymentMethod: 'Virement Bancaire',
        notes: 'صرف الراتب الشهري الصافي بعد الخصم التلقائي للغيابات'
      });
      setSuccessMsg('تم صرف الراتب وتسجيل المعاملة بنجاح في سجل الرواتب.');
      fetchFinanceOverview();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'خطأ أثناء صرف الراتب.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/finance/products', productForm);
      setSuccessMsg('تم إضافة المنتج/الرسم المدرسي بنجاح.');
      setShowAddProductModal(false);
      setProductForm({ name: '', price: '', category: 'Tuition', description: '' });
      fetchFinanceOverview();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'خطأ أثناء إضافة المنتج.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('هل تريد حذف هذا الرسم/المنتج المالي؟')) return;
    try {
      await axios.delete(`/api/finance/products/${id}`);
      setSuccessMsg('تم حذف المنتج بنجاح.');
      fetchFinanceOverview();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError('خطأ أثناء حذف المنتج.');
    }
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/finance/transactions', transactionForm);
      setSuccessMsg('تم تسجيل المعاملة المالية في الخزينة بنجاح.');
      setShowAddTransactionModal(false);
      setTransactionForm({ title: '', amount: '', type: 'INCOME', category: 'Tuition', description: '' });
      fetchFinanceOverview();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'خطأ أثناء تسجيل المعاملة.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المعاملة المالية؟')) return;
    try {
      await axios.delete(`/api/finance/transactions/${id}`);
      setSuccessMsg('تم حذف المعاملة بنجاح.');
      fetchFinanceOverview();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError('خطأ أثناء حذف المعاملة.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-slate-400 font-bold text-sm">جاري تحميل النظام المالي والرواتب والخصومات التلقائية...</p>
      </div>
    );
  }

  const roleNamesAr = {
    teacher: 'أستاذ',
    general_supervisor: 'مراقب عام',
    pedagogical_supervisor: 'مراقب تربوي',
    receptionist: 'موظف الاستقبال'
  };

  return (
    <div className="space-y-8 font-cairo text-right" dir="rtl">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-slate-900 via-indigo-950/60 to-slate-900 border border-luxury-border/60 p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 left-0 w-80 h-80 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-400 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>صلاحية حصرية للمسؤول الأول عن المنصة والمدرسة</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-brand-400 shrink-0" />
              <span>نظام التسيير المالي والرواتب والخصم التلقائي</span>
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed font-medium">
              يسمح هذا النظام بالتحكم الكامل في الخزينة، تحديد رواتب الأساتذة والمراقبين، وربط غيابات وتأخرات الكادر بالخصم المالي التلقائي من الراتب الشهري وفقاً لتقارير المراقبين.
            </p>
          </div>
          <button
            onClick={fetchFinanceOverview}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-luxury-border/50 text-slate-300 hover:text-white transition-all text-xs font-bold shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span>تحديث البيانات</span>
          </button>
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

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-luxury-border/50 space-y-3 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px]" />
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">إجمالي المداخيل والرسوم</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {overview.totalIncome.toLocaleString('fr-FR')} <span className="text-sm text-emerald-400 font-sans">د.ج</span>
          </div>
          <p className="text-xs text-slate-450">تشمل أقساط التمدرس، حقوق التسجيل والخدمات.</p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/80 border border-luxury-border/50 space-y-3 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-32 h-32 bg-red-500/10 rounded-full blur-[40px]" />
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">إجمالي النفقات والرواتب المصروفة</span>
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {overview.totalExpense.toLocaleString('fr-FR')} <span className="text-sm text-red-400 font-sans">د.ج</span>
          </div>
          <p className="text-xs text-slate-450">تشمل رواتب الطاقم، الصيانة والمصاريف التشغيلية.</p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/80 border border-luxury-border/50 space-y-3 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-32 h-32 bg-brand-500/10 rounded-full blur-[40px]" />
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">الرصيد الصافي للخزينة</span>
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-3xl font-black font-mono ${overview.netBalance >= 0 ? 'text-brand-400' : 'text-red-400'}`}>
            {overview.netBalance.toLocaleString('fr-FR')} <span className="text-sm font-sans">د.ج</span>
          </div>
          <p className="text-xs text-slate-450">الميزانية الحالية المتاحة في حساب المؤسسة.</p>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-900 border border-luxury-border/50">
        {[
          { id: 'overview', label: 'الرواتب وإعدادات الخصم التلقائي', icon: Settings },
          { id: 'payrolls', label: 'كشوف رواتب الشهر الحالي والغيابات', icon: FileText },
          { id: 'products', label: 'الرسوم المدرسية والمنتجات', icon: CreditCard },
          { id: 'transactions', label: 'سجل المعاملات المالية (الخزينة)', icon: Calendar }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
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

      {/* SUB-TAB 1: STAFF SALARY & DEDUCTIONS CONFIGURATION */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-luxury-border/50 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">ضبط رواتب وقيم الخصم التلقائي للطاقم التربوي والإداري</h3>
                <p className="text-xs text-slate-400 mt-1">
                  عند قيام المراقب العام أو المراقب التربوي بتسجيل غياب أو تأخر موظف أو أستاذ في سجل الغيابات اليومي، يقوم النظام تلقائياً بخصم المبلغ المحدد أدناه من راتب الشهر الحالي دون تدخل يدوي.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right border-collapse">
                <thead>
                  <tr className="border-b border-luxury-border/40 text-slate-400 text-xs font-bold">
                    <th className="py-3 px-4">الموظف / الأستاذ</th>
                    <th className="py-3 px-4">المنصب والوظيفة</th>
                    <th className="py-3 px-4">الراتب الأساسي (د.ج)</th>
                    <th className="py-3 px-4">الخصم التلقائي عن كل غياب (د.ج)</th>
                    <th className="py-3 px-4 text-center">تعديل الإعدادات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-luxury-border/20">
                  {overview.staffMembers.map((staff) => (
                    <tr key={staff._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-luxury-border/40 flex items-center justify-center text-brand-400 font-bold text-xs shrink-0">
                          {staff.firstName?.[0]}
                        </div>
                        <div>
                          <div className="text-white font-bold">{staff.firstName} {staff.lastName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">@{staff.username || staff.email}</div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-xs">
                          {roleNamesAr[staff.role] || staff.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        {staff.baseSalary ? `${staff.baseSalary.toLocaleString('fr-FR')} د.ج` : 'غير محدد (0)'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-red-400">
                        {staff.salaryDeductionPerAbsence ? `${staff.salaryDeductionPerAbsence.toLocaleString('fr-FR')} د.ج` : 'غير محدد (0)'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {editingStaffId === staff._id ? (
                          <form
                            onSubmit={(e) => handleUpdateStaffConfig(e, staff._id)}
                            className="flex items-center justify-center gap-2"
                          >
                            <input
                              type="number"
                              required
                              placeholder="الراتب"
                              value={staffConfigForm.baseSalary}
                              onChange={(e) => setStaffConfigForm({ ...staffConfigForm, baseSalary: e.target.value })}
                              className="w-24 px-2 py-1.5 rounded-lg bg-slate-950 border border-luxury-border text-xs text-white focus:outline-none focus:border-brand-500"
                            />
                            <input
                              type="number"
                              required
                              placeholder="الخصم/غياب"
                              value={staffConfigForm.salaryDeductionPerAbsence}
                              onChange={(e) => setStaffConfigForm({ ...staffConfigForm, salaryDeductionPerAbsence: e.target.value })}
                              className="w-24 px-2 py-1.5 rounded-lg bg-slate-950 border border-luxury-border text-xs text-white focus:outline-none focus:border-brand-500"
                            />
                            <button
                              type="submit"
                              className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors"
                              title="حفظ"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStaffId(null)}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                              title="إلغاء"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </form>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingStaffId(staff._id);
                              setStaffConfigForm({
                                baseSalary: staff.baseSalary || 0,
                                salaryDeductionPerAbsence: staff.salaryDeductionPerAbsence || 0
                              });
                            }}
                            className="px-3 py-1.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs font-bold inline-flex items-center gap-1.5 transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>تحديد الراتب والخصم</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MONTHLY PAYROLL & DEDUCTIONS LOG */}
      {activeSubTab === 'payrolls' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-luxury-border/50 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-luxury-border/30 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">كشوف رواتب الطاقم لشهر ({overview.currentMonth})</h3>
                <p className="text-xs text-slate-400 mt-1">
                  توضح هذه القائمة الراتب الأساسي، عدد الغيابات المسجلة من المراقبين، إجمالي الخصومات التلقائية، والراتب الصافي المستحق للدفع.
                </p>
              </div>
            </div>

            {overview.currentPayrolls.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm italic">
                لم يتم توليد كشوف رواتب لهذا الشهر بعد أو لا يوجد موظفون مهيؤون برواتب أساسية.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overview.currentPayrolls.map((pay) => (
                  <div
                    key={pay._id}
                    className="p-5 rounded-2xl bg-slate-950/80 border border-luxury-border/40 space-y-4 hover:border-brand-500/30 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold">
                          {pay.user?.firstName?.[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{pay.user?.firstName} {pay.user?.lastName}</h4>
                          <span className="text-xs text-indigo-400 font-bold">{roleNamesAr[pay.user?.role] || pay.user?.role}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        pay.status === 'PAID'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {pay.status === 'PAID' ? 'تم صرف الراتب' : 'قيد الانتظار'}
                      </span>
                    </div>

                    <div className="space-y-2 py-3 border-y border-luxury-border/20 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>الراتب الأساسي:</span>
                        <span className="font-mono font-bold text-white">{pay.baseSalary?.toLocaleString('fr-FR')} د.ج</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>عدد غيابات الشهر:</span>
                        <span className="font-mono font-bold text-red-400">{pay.deductionsList?.length || 0} غياب/تأخر</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>إجمالي الخصم التلقائي:</span>
                        <span className="font-mono font-bold text-red-400">-{pay.totalDeductions?.toLocaleString('fr-FR')} د.ج</span>
                      </div>
                      <div className="flex justify-between text-slate-200 font-bold text-sm pt-2 border-t border-luxury-border/20">
                        <span>الراتب الصافي المستحق:</span>
                        <span className="font-mono text-brand-400">{pay.netSalary?.toLocaleString('fr-FR')} د.ج</span>
                      </div>
                    </div>

                    {pay.status !== 'PAID' && (
                      <button
                        onClick={() => handlePaySalary(pay._id)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>دفع الراتب وإصدار القسيمة</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: FINANCIAL PRODUCTS & SCHOOL FEES */}
      {activeSubTab === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white">الرسوم المدرسية والمنتجات والخدمات</h3>
              <p className="text-xs text-slate-400 mt-1">تحديد أسعار التمدرس السنوية، بطاقات المطعم، اشتراكات النقل وأقساط النوادي</p>
            </div>
            <button
              onClick={() => setShowAddProductModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة رسم / منتج جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overview.products.map((prod) => (
              <div
                key={prod._id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-luxury-border/50 space-y-3 relative group hover:border-brand-500/40 transition-all"
              >
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-luxury-border/40 text-[11px] font-bold text-brand-400">
                    {prod.category}
                  </span>
                  <button
                    onClick={() => handleDeleteProduct(prod._id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h4 className="text-base font-bold text-white">{prod.name}</h4>
                <p className="text-xs text-slate-400 line-clamp-2">{prod.description || 'لا يوجد وصف.'}</p>
                <div className="pt-2 border-t border-luxury-border/20 flex justify-between items-center">
                  <span className="text-xs text-slate-400">التسعيرة الرسمية:</span>
                  <span className="text-base font-black text-brand-400 font-mono">{prod.price.toLocaleString('fr-FR')} د.ج</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: TRANSACTIONS HISTORY */}
      {activeSubTab === 'transactions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white">سجل المعاملات المالية للخزينة (مداخيل ونفقات)</h3>
              <p className="text-xs text-slate-400 mt-1">توثيق جميع العمليات المالية والمصاريف التشغيلية للمدرسة</p>
            </div>
            <button
              onClick={() => setShowAddTransactionModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل معاملة يدوية</span>
            </button>
          </div>

          <div className="overflow-x-auto p-6 rounded-3xl bg-slate-900/60 border border-luxury-border/50">
            <table className="w-full text-sm text-right border-collapse">
              <thead>
                <tr className="border-b border-luxury-border/40 text-slate-400 text-xs font-bold">
                  <th className="py-3 px-4">عنوان المعاملة</th>
                  <th className="py-3 px-4">النوع</th>
                  <th className="py-3 px-4">التصنيف</th>
                  <th className="py-3 px-4">المبلغ</th>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-border/20">
                {overview.recentTransactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{tx.title}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        tx.type === 'INCOME'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/15 text-red-400 border border-red-500/30'
                      }`}>
                        {tx.type === 'INCOME' ? 'مدخول (+)' : 'نفقة (-)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 text-xs">{tx.category}</td>
                    <td className={`py-3.5 px-4 font-mono font-black ${
                      tx.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{tx.amount.toLocaleString('fr-FR')} د.ج
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                      {new Date(tx.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDeleteTransaction(tx._id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD PRODUCT */}
      <AnimatePresence>
        {showAddProductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-luxury-border rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-luxury-border/40 pb-4">
                <h3 className="font-bold text-white text-lg">إضافة رسم أو خدمة مدرسية</h3>
                <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">اسم الخدمة/الرسم</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: القسط الدراسي الأول / اشتراك النقل"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">السعر المقدر (د.ج)</label>
                  <input
                    type="number"
                    required
                    placeholder="مثال: 45000"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">التصنيف</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="Tuition">رسوم تمدرس (Tuition)</option>
                    <option value="Canteen">المطعم المدرسي (Canteen)</option>
                    <option value="Transport">النقل المدرسي (Transport)</option>
                    <option value="Clubs">الأنشطة والنوادي (Clubs)</option>
                    <option value="Books">الكتب واللوازم (Books)</option>
                    <option value="Other">أخرى (Other)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">الوصف (اختياري)</label>
                  <textarea
                    rows={2}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-bold transition-all shadow-md"
                  >
                    إضافة الرسم
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddProductModal(false)}
                    className="px-6 py-3 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ADD TRANSACTION */}
      <AnimatePresence>
        {showAddTransactionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-luxury-border rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-luxury-border/40 pb-4">
                <h3 className="font-bold text-white text-lg">تسجيل عملية في الخزينة</h3>
                <button onClick={() => setShowAddTransactionModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleCreateTransaction} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTransactionForm({ ...transactionForm, type: 'INCOME' })}
                    className={`p-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-2 ${
                      transactionForm.type === 'INCOME'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-slate-950 border-luxury-border text-slate-400'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>مدخول / تحصيل (+)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionForm({ ...transactionForm, type: 'EXPENSE' })}
                    className={`p-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-2 ${
                      transactionForm.type === 'EXPENSE'
                        ? 'bg-red-500/20 border-red-500 text-red-400'
                        : 'bg-slate-950 border-luxury-border text-slate-400'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>نفقة / مصروف (-)</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">البيان / عنوان العملية</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: شراء تجهيزات حاسوبية / تحصيل رسوم"
                    value={transactionForm.title}
                    onChange={(e) => setTransactionForm({ ...transactionForm, title: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">المبلـغ (د.ج)</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={transactionForm.amount}
                    onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">التصنيف المحاسبي</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: Equipment / Maintenance / Tuition"
                    value={transactionForm.category}
                    onChange={(e) => setTransactionForm({ ...transactionForm, category: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-luxury-border text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-bold transition-all shadow-md"
                  >
                    حفظ العملية
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddTransactionModal(false)}
                    className="px-6 py-3 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
