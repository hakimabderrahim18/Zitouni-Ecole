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
  const [staffSearch, setStaffSearch] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState('all');
  
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
        <div className="w-12 h-12 border-4 border-[#C9A24D]/30 border-t-[#7B1E3A] rounded-full animate-spin" />
        <p className="text-[#7B1E3A] font-serif font-black text-sm">جاري تحميل النظام المالي والرواتب والخصومات التلقائية...</p>
      </div>
    );
  }

  const roleNamesAr = {
    teacher: 'أستاذ',
    general_supervisor: 'مراقب عام',
    pedagogical_supervisor: 'مراقب تربوي',
    receptionist: 'موظف الاستقبال'
  };

  const roleBadges = {
    teacher: 'bg-amber-50 text-amber-900 border-amber-300 font-bold',
    general_supervisor: 'bg-purple-50 text-purple-900 border-purple-200 font-bold',
    pedagogical_supervisor: 'bg-indigo-50 text-indigo-900 border-indigo-200 font-bold',
    receptionist: 'bg-sky-50 text-sky-900 border-sky-200 font-bold'
  };

  return (
    <div className="space-y-6 font-cairo text-right" dir="rtl">
      {/* Header Banner - Prestige Académique (Second Image Redesign) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-[#7B1E3A] via-[#63142c] to-[#450d1e] border-2 border-[#C9A24D]/40 p-6 md:p-8 shadow-xl text-white">
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-[#C9A24D]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-[#F3E9DC]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C9A24D]/20 border border-[#C9A24D]/40 text-[#F3E9DC] text-xs font-bold shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-[#C9A24D]" />
              <span>صلاحية حصرية للمسؤول الأول عن المنصة والمدرسة</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-black tracking-tight flex items-center gap-3 text-white">
              <CreditCard className="w-8 h-8 text-[#C9A24D] shrink-0" />
              <span>نظام التسيير المالي والرواتب والخصم التلقائي</span>
            </h2>
            <p className="text-[#F3E9DC]/90 text-xs md:text-sm max-w-2xl leading-relaxed font-sans font-medium">
              يسمح هذا النظام بالتحكم الكامل في الخزينة، تحديد رواتب الأساتذة والمراقبين، وربط غيابات وتأخرات الكادر بالخصم المالي التلقائي من الراتب الشهري وفقاً لتقارير المراقبين.
            </p>
          </div>
          <button
            onClick={fetchFinanceOverview}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-[#C9A24D]/50 text-white transition-all text-xs font-bold shrink-0 shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-[#C9A24D]" />
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
            className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 flex items-center justify-between text-xs font-bold shadow-xs"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
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
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center justify-between text-xs font-bold shadow-xs"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)}><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Summary Cards - Prestige Académique (Second Image Redesign) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Incomes */}
        <div className="p-6 rounded-3xl bg-white border border-[#C9A24D]/35 space-y-3 relative overflow-hidden shadow-xs hover:shadow-md transition-all">
          <div className="flex justify-between items-center">
            <span className="text-xs font-serif font-black text-[#7B1E3A] uppercase tracking-wider">إجمالي المداخيل والرسوم</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-700 font-mono">
            {overview.totalIncome.toLocaleString('fr-FR')} <span className="text-sm text-[#2B2022] font-sans font-bold">د.ج</span>
          </div>
          <p className="text-xs text-[#2B2022]/70 leading-relaxed font-medium">تشمل أقساط التمدرس، حقوق التسجيل والخدمات.</p>
        </div>

        {/* Total Expenses */}
        <div className="p-6 rounded-3xl bg-white border border-[#C9A24D]/35 space-y-3 relative overflow-hidden shadow-xs hover:shadow-md transition-all">
          <div className="flex justify-between items-center">
            <span className="text-xs font-serif font-black text-[#7B1E3A] uppercase tracking-wider">إجمالي النفقات والرواتب المصروفة</span>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 shadow-2xs">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-700 font-mono">
            {overview.totalExpense.toLocaleString('fr-FR')} <span className="text-sm text-[#2B2022] font-sans font-bold">د.ج</span>
          </div>
          <p className="text-xs text-[#2B2022]/70 leading-relaxed font-medium">تشمل رواتب الطاقم، الصيانة والمصاريف التشغيلية.</p>
        </div>

        {/* Net Treasury Balance */}
        <div className="p-6 rounded-3xl bg-white border border-[#C9A24D]/35 space-y-3 relative overflow-hidden shadow-xs hover:shadow-md transition-all">
          <div className="flex justify-between items-center">
            <span className="text-xs font-serif font-black text-[#7B1E3A] uppercase tracking-wider">الرصيد الصافي للخزينة</span>
            <div className="w-10 h-10 rounded-2xl bg-[#7B1E3A]/10 border border-[#7B1E3A]/25 flex items-center justify-center text-[#7B1E3A] shadow-2xs">
              <DollarSign className="w-5 h-5 text-[#C9A24D]" />
            </div>
          </div>
          <div className={`text-3xl font-black font-mono ${overview.netBalance >= 0 ? 'text-[#7B1E3A]' : 'text-rose-700'}`}>
            {overview.netBalance.toLocaleString('fr-FR')} <span className="text-sm font-sans font-bold text-[#2B2022]">د.ج</span>
          </div>
          <p className="text-xs text-[#2B2022]/70 leading-relaxed font-medium">الميزانية الحالية المتاحة في حساب المؤسسة.</p>
        </div>
      </div>

      {/* Sub-Tabs Navigation - Prestige Académique (Second Image Redesign) */}
      <div className="flex flex-wrap gap-2 p-2 rounded-2xl bg-[#FDFBF7] border border-[#C9A24D]/35 shadow-xs">
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
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-[#7B1E3A] text-white shadow-md shadow-[#7B1E3A]/20 border border-[#C9A24D]/40'
                  : 'bg-white hover:bg-[#F3E9DC]/60 text-[#7B1E3A] border border-[#C9A24D]/25'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0 text-[#C9A24D]" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: STAFF SALARY & DEDUCTIONS CONFIGURATION (Third Image Redesign) */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="p-6 md:p-8 rounded-3xl bg-white border border-[#C9A24D]/35 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#C9A24D]/25">
              <div>
                <h3 className="text-xl font-serif font-black text-[#7B1E3A]">ضبط رواتب وقيم الخصم التلقائي للطاقم التربوي والإداري</h3>
                <p className="text-xs text-[#2B2022]/70 mt-1 leading-relaxed">
                  عند قيام المراقب العام أو المراقب التربوي بتسجيل غياب أو تأخر موظف أو أستاذ في سجل الغيابات اليومي، يقوم النظام تلقائياً بخصم المبلغ المحدد أدناه من راتب الشهر الحالي دون تدخل يدوي.
                </p>
              </div>
            </div>

            {/* Search & Filter Bar for Staff & Teachers Payroll */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FDFBF7] p-3.5 rounded-2xl border border-[#C9A24D]/35">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#7B1E3A] absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="البحث عن أستاذ أو موظف بالاسم، رقم الهاتف أو الحساب..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 bg-white border border-[#C9A24D]/35 rounded-xl text-xs font-bold text-[#2B2022] focus:outline-none focus:border-[#7B1E3A] placeholder:text-[#2B2022]/40"
                />
                {staffSearch && (
                  <button
                    type="button"
                    onClick={() => setStaffSearch('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#7B1E3A]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="w-full sm:w-52">
                <select
                  value={staffRoleFilter}
                  onChange={(e) => setStaffRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#C9A24D]/35 rounded-xl text-xs font-bold text-[#2B2022] focus:outline-none focus:border-[#7B1E3A] cursor-pointer"
                >
                  <option value="all">جميع الوظائف</option>
                  <option value="teacher">الأساتذة (Enseignants)</option>
                  <option value="pedagogical_supervisor">المراقبون التربويون</option>
                  <option value="general_supervisor">المراقب العام</option>
                  <option value="receptionist">موظف الاستقبال</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#C9A24D]/25 shadow-2xs">
              <table className="w-full text-sm text-right border-collapse">
                <thead>
                  <tr className="bg-[#FDFBF7] border-b border-[#C9A24D]/30 text-[#7B1E3A] text-xs font-serif font-black">
                    <th className="py-3.5 px-4">الموظف / الأستاذ</th>
                    <th className="py-3.5 px-4">المنصب والوظيفة</th>
                    <th className="py-3.5 px-4">الراتب الأساسي (د.ج)</th>
                    <th className="py-3.5 px-4">الخصم التلقائي عن كل غياب (د.ج)</th>
                    <th className="py-3.5 px-4 text-center">تعديل الإعدادات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C9A24D]/15 bg-white">
                  {overview.staffMembers.filter((staff) => {
                    if (staffRoleFilter !== 'all' && staff.role !== staffRoleFilter) return false;
                    if (!staffSearch.trim()) return true;
                    const q = staffSearch.trim().toLowerCase();
                    const name = `${staff.firstName || ''} ${staff.lastName || ''}`.toLowerCase();
                    const phone = (staff.phoneNumber || staff.username || '').toLowerCase();
                    const email = (staff.email || '').toLowerCase();
                    return name.includes(q) || phone.includes(q) || email.includes(q);
                  }).map((staff) => {
                    // Pure login without @ and without .com (User Request: pure ment pas d à pas de .com)
                    const pureLogin = staff.phoneNumber
                      ? staff.phoneNumber.replace(/[\s\-_().]/g, '')
                      : staff.username
                      ? staff.username.replace(/@.*$/, '').replace(/\.com.*$/, '')
                      : staff.email
                      ? staff.email.split('@')[0]
                      : '0797060052';

                    return (
                      <tr key={staff._id} className="hover:bg-[#FDFBF7]/70 transition-colors">
                        <td className="py-4 px-4 font-bold flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#7B1E3A] border border-[#C9A24D]/40 flex items-center justify-center text-[#C9A24D] font-serif font-black text-sm shrink-0 shadow-2xs">
                            {staff.firstName?.[0] || 'م'}
                          </div>
                          <div>
                            <div className="text-[#7B1E3A] font-serif font-bold text-sm">{staff.firstName} {staff.lastName}</div>
                            {/* Pure login display: No @ and No .com */}
                            <div className="text-[11px] text-[#2B2022]/60 font-mono font-semibold" dir="ltr">
                              {pureLogin}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full border text-xs font-bold ${roleBadges[staff.role] || 'bg-stone-50 text-stone-800 border-stone-200'}`}>
                            {roleNamesAr[staff.role] || staff.role}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono font-black text-emerald-700 text-sm">
                          {staff.baseSalary ? `${staff.baseSalary.toLocaleString('fr-FR')} د.ج` : '0 د.ج'}
                        </td>
                        <td className="py-4 px-4 font-mono font-black text-rose-700 text-sm">
                          {staff.salaryDeductionPerAbsence ? `${staff.salaryDeductionPerAbsence.toLocaleString('fr-FR')} د.ج` : '0 د.ج'}
                        </td>
                        <td className="py-4 px-4 text-center">
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
                                className="w-24 px-2.5 py-1.5 rounded-xl bg-white border border-[#C9A24D]/40 text-xs text-[#2B2022] font-bold focus:outline-none focus:border-[#7B1E3A]"
                              />
                              <input
                                type="number"
                                required
                                placeholder="الخصم"
                                value={staffConfigForm.salaryDeductionPerAbsence}
                                onChange={(e) => setStaffConfigForm({ ...staffConfigForm, salaryDeductionPerAbsence: e.target.value })}
                                className="w-24 px-2.5 py-1.5 rounded-xl bg-white border border-[#C9A24D]/40 text-xs text-[#2B2022] font-bold focus:outline-none focus:border-[#7B1E3A]"
                              />
                              <button
                                type="submit"
                                className="p-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
                                title="حفظ"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingStaffId(null)}
                                className="p-2 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
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
                              className="px-3.5 py-1.5 rounded-xl bg-[#7B1E3A] hover:bg-[#62162d] text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border border-[#C9A24D]/35"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#C9A24D]" />
                              <span className="text-white">تحديد الراتب والخصم</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MONTHLY PAYROLL & DEDUCTIONS LOG */}
      {activeSubTab === 'payrolls' && (
        <div className="space-y-6">
          <div className="p-6 md:p-8 rounded-3xl bg-white border border-[#C9A24D]/35 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#C9A24D]/25 pb-4">
              <div>
                <h3 className="text-xl font-serif font-black text-[#7B1E3A]">كشوف رواتب الطاقم لشهر ({overview.currentMonth})</h3>
                <p className="text-xs text-[#2B2022]/70 mt-1 leading-relaxed">
                  توضح هذه القائمة الراتب الأساسي، عدد الغيابات المسجلة من المراقبين، إجمالي الخصومات التلقائية، والراتب الصافي المستحق للدفع.
                </p>
              </div>
            </div>

            {overview.currentPayrolls.length === 0 ? (
              <div className="py-12 text-center text-[#2B2022]/60 text-sm font-serif">
                لم يتم توليد كشوف رواتب لهذا الشهر بعد أو لا يوجد موظفون مهيؤون برواتب أساسية.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overview.currentPayrolls.map((pay) => (
                  <div
                    key={pay._id}
                    className="p-5 rounded-2xl bg-[#FDFBF7] border border-[#C9A24D]/30 space-y-4 hover:border-[#7B1E3A]/40 transition-all shadow-2xs"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#7B1E3A] border border-[#C9A24D]/35 flex items-center justify-center text-[#C9A24D] font-serif font-black">
                          {pay.user?.firstName?.[0] || 'م'}
                        </div>
                        <div>
                          <h4 className="font-serif font-black text-[#7B1E3A] text-sm">{pay.user?.firstName} {pay.user?.lastName}</h4>
                          <span className="text-xs text-[#2B2022]/70 font-bold">{roleNamesAr[pay.user?.role] || pay.user?.role}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        pay.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}>
                        {pay.status === 'PAID' ? 'تم صرف الراتب' : 'قيد الانتظار'}
                      </span>
                    </div>

                    <div className="space-y-2 py-3 border-y border-[#C9A24D]/20 text-xs">
                      <div className="flex justify-between text-[#2B2022]/70">
                        <span>الراتب الأساسي:</span>
                        <span className="font-mono font-bold text-[#2B2022]">{pay.baseSalary?.toLocaleString('fr-FR')} د.ج</span>
                      </div>
                      <div className="flex justify-between text-[#2B2022]/70">
                        <span>عدد غيابات الشهر:</span>
                        <span className="font-mono font-bold text-rose-700">{pay.deductionsList?.length || 0} غياب/تأخر</span>
                      </div>
                      <div className="flex justify-between text-[#2B2022]/70">
                        <span>إجمالي الخصم التلقائي:</span>
                        <span className="font-mono font-bold text-rose-700">-{pay.totalDeductions?.toLocaleString('fr-FR')} د.ج</span>
                      </div>
                      <div className="flex justify-between text-[#7B1E3A] font-serif font-black text-sm pt-2 border-t border-[#C9A24D]/20">
                        <span>الراتب الصافي المستحق:</span>
                        <span className="font-mono text-emerald-700 font-black">{pay.netSalary?.toLocaleString('fr-FR')} د.ج</span>
                      </div>
                    </div>

                    {pay.status !== 'PAID' && (
                      <button
                        onClick={() => handlePaySalary(pay._id)}
                        className="w-full py-2.5 rounded-xl bg-[#7B1E3A] hover:bg-[#62162d] text-white font-bold text-xs transition-all shadow-md shadow-[#7B1E3A]/20 flex items-center justify-center gap-2 cursor-pointer border border-[#C9A24D]/35"
                      >
                        <CheckCircle className="w-4 h-4 text-[#C9A24D]" />
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
          <div className="p-6 md:p-8 rounded-3xl bg-white border border-[#C9A24D]/35 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#C9A24D]/25 pb-4">
              <div>
                <h3 className="text-xl font-serif font-black text-[#7B1E3A]">الرسوم المدرسية والمنتجات والخدمات</h3>
                <p className="text-xs text-[#2B2022]/70 mt-1 leading-relaxed">تحديد أسعار التمدرس السنوية، بطاقات المطعم، اشتراكات النقل وأقساط النوادي</p>
              </div>
              <button
                onClick={() => setShowAddProductModal(true)}
                className="px-4 py-2.5 rounded-xl bg-[#7B1E3A] hover:bg-[#62162d] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[#7B1E3A]/20 transition-all border border-[#C9A24D]/35 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-[#C9A24D]" />
                <span>إضافة رسم / منتج جديد</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {overview.products.map((prod) => (
                <div
                  key={prod._id}
                  className="p-5 rounded-2xl bg-[#FDFBF7] border border-[#C9A24D]/30 space-y-3 relative group hover:border-[#7B1E3A]/40 transition-all shadow-2xs"
                >
                  <div className="flex justify-between items-start">
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-[#C9A24D]/25 text-[11px] font-bold text-[#7B1E3A]">
                      {prod.category}
                    </span>
                    <button
                      onClick={() => handleDeleteProduct(prod._id)}
                      className="p-1 rounded-lg text-[#2B2022]/40 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="text-base font-serif font-black text-[#7B1E3A]">{prod.name}</h4>
                  <p className="text-xs text-[#2B2022]/70 line-clamp-2 leading-relaxed">{prod.description || 'لا يوجد وصف.'}</p>
                  <div className="pt-2 border-t border-[#C9A24D]/20 flex justify-between items-center">
                    <span className="text-xs text-[#2B2022]/70 font-semibold">التسعيرة الرسمية:</span>
                    <span className="text-base font-black text-emerald-700 font-mono">{prod.price.toLocaleString('fr-FR')} د.ج</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: TRANSACTIONS HISTORY */}
      {activeSubTab === 'transactions' && (
        <div className="space-y-6">
          <div className="p-6 md:p-8 rounded-3xl bg-white border border-[#C9A24D]/35 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#C9A24D]/25 pb-4">
              <div>
                <h3 className="text-xl font-serif font-black text-[#7B1E3A]">سجل المعاملات المالية للخزينة (مداخيل ونفقات)</h3>
                <p className="text-xs text-[#2B2022]/70 mt-1 leading-relaxed">توثيق جميع العمليات المالية والمصاريف التشغيلية للمدرسة</p>
              </div>
              <button
                onClick={() => setShowAddTransactionModal(true)}
                className="px-4 py-2.5 rounded-xl bg-[#7B1E3A] hover:bg-[#62162d] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[#7B1E3A]/20 transition-all border border-[#C9A24D]/35 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-[#C9A24D]" />
                <span>تسجيل معاملة يدوية</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#C9A24D]/25 shadow-2xs">
              <table className="w-full text-sm text-right border-collapse">
                <thead>
                  <tr className="bg-[#FDFBF7] border-b border-[#C9A24D]/30 text-[#7B1E3A] text-xs font-serif font-black">
                    <th className="py-3.5 px-4">عنوان المعاملة</th>
                    <th className="py-3.5 px-4">النوع</th>
                    <th className="py-3.5 px-4">التصنيف</th>
                    <th className="py-3.5 px-4">المبلغ</th>
                    <th className="py-3.5 px-4">التاريخ</th>
                    <th className="py-3.5 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C9A24D]/15 bg-white">
                  {overview.recentTransactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-[#FDFBF7]/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#2B2022]">{tx.title}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          tx.type === 'INCOME'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}>
                          {tx.type === 'INCOME' ? 'مدخول (+)' : 'نفقة (-)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#2B2022]/70 text-xs font-semibold">{tx.category}</td>
                      <td className={`py-3.5 px-4 font-mono font-black ${
                        tx.type === 'INCOME' ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {tx.type === 'INCOME' ? '+' : '-'}{tx.amount.toLocaleString('fr-FR')} د.ج
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#2B2022]/60 font-mono" dir="ltr">
                        {new Date(tx.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDeleteTransaction(tx._id)}
                          className="p-1.5 rounded-lg text-[#2B2022]/40 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
        </div>
      )}

      {/* MODAL: ADD PRODUCT */}
      <AnimatePresence>
        {showAddProductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 shadow-2xl text-right"
            >
              <div className="flex justify-between items-center border-b border-[#C9A24D]/25 pb-4">
                <h3 className="font-serif font-black text-[#7B1E3A] text-lg">إضافة رسم أو خدمة مدرسية</h3>
                <button onClick={() => setShowAddProductModal(false)} className="text-[#2B2022]/50 hover:text-[#7B1E3A] p-1"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[#7B1E3A] font-serif font-bold">اسم الخدمة / الرسم *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: القسط الدراسي الأول / اشتراك النقل"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#C9A24D]/35 text-[#2B2022] font-semibold focus:outline-none focus:border-[#7B1E3A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#7B1E3A] font-serif font-bold">السعر المقدر (د.ج) *</label>
                  <input
                    type="number"
                    required
                    placeholder="مثال: 45000"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#C9A24D]/35 text-[#2B2022] font-mono font-bold focus:outline-none focus:border-[#7B1E3A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#7B1E3A] font-serif font-bold">التصنيف *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#C9A24D]/35 text-[#2B2022] font-bold focus:outline-none focus:border-[#7B1E3A] cursor-pointer"
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
                  <label className="text-[#7B1E3A] font-serif font-bold">الوصف (اختياري)</label>
                  <textarea
                    rows={2}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#C9A24D]/35 text-[#2B2022] focus:outline-none focus:border-[#7B1E3A]"
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t border-[#C9A24D]/25">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#7B1E3A] hover:bg-[#62162d] text-white font-bold transition-all shadow-md shadow-[#7B1E3A]/20 cursor-pointer"
                  >
                    إضافة الرسم
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddProductModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#F3E9DC]/40 border border-[#C9A24D]/35 text-[#7B1E3A] font-bold transition-all cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 shadow-2xl text-right"
            >
              <div className="flex justify-between items-center border-b border-[#C9A24D]/25 pb-4">
                <h3 className="font-serif font-black text-[#7B1E3A] text-lg">تسجيل عملية في الخزينة</h3>
                <button onClick={() => setShowAddTransactionModal(false)} className="text-[#2B2022]/50 hover:text-[#7B1E3A] p-1"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleCreateTransaction} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTransactionForm({ ...transactionForm, type: 'INCOME' })}
                    className={`p-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      transactionForm.type === 'INCOME'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                        : 'bg-white border-[#C9A24D]/30 text-[#2B2022]/60'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    <span>مدخول / تحصيل (+)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionForm({ ...transactionForm, type: 'EXPENSE' })}
                    className={`p-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      transactionForm.type === 'EXPENSE'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-2xs'
                        : 'bg-white border-[#C9A24D]/30 text-[#2B2022]/60'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4 text-rose-600" />
                    <span>نفقة / مصروف (-)</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[#7B1E3A] font-serif font-bold">البيان / عنوان العملية *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: شراء تجهيزات حاسوبية / تحصيل رسوم"
                    value={transactionForm.title}
                    onChange={(e) => setTransactionForm({ ...transactionForm, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#C9A24D]/35 text-[#2B2022] font-semibold focus:outline-none focus:border-[#7B1E3A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#7B1E3A] font-serif font-bold">المبلـغ (د.ج) *</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={transactionForm.amount}
                    onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#C9A24D]/35 text-[#2B2022] font-mono font-bold focus:outline-none focus:border-[#7B1E3A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#7B1E3A] font-serif font-bold">التصنيف المحاسبي *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: Equipment / Maintenance / Tuition"
                    value={transactionForm.category}
                    onChange={(e) => setTransactionForm({ ...transactionForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#C9A24D]/35 text-[#2B2022] focus:outline-none focus:border-[#7B1E3A]"
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t border-[#C9A24D]/25">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#7B1E3A] hover:bg-[#62162d] text-white font-bold transition-all shadow-md shadow-[#7B1E3A]/20 cursor-pointer"
                  >
                    حفظ العملية
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddTransactionModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#F3E9DC]/40 border border-[#C9A24D]/35 text-[#7B1E3A] font-bold transition-all cursor-pointer"
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
