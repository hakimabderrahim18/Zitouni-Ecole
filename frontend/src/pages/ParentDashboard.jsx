import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import ScheduleCard from '../components/ScheduleCard';
import SchedulesView from '../components/SchedulesView';
import AttendanceView from '../components/AttendanceView';
import { Users, CreditCard, Calendar, Download, CheckCircle, Clock, Baby, Bus, Soup, Banknote, Globe, FileText, X, Receipt } from 'lucide-react';
import axios from 'axios';

export default function ParentDashboard() {
  const location = useLocation();
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.endsWith('/payments')) return 'payments';
    if (path.endsWith('/schedules')) return 'schedules';
    if (path.endsWith('/attendance')) return 'attendance';
    return 'overview';
  };
  const activeTab = getActiveTab();

  const [children, setChildren] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [parentTab, setParentTab] = useState('attendance'); // 'attendance' or 'schedules'
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Payment modal state
  const [payModalPayment, setPayModalPayment] = useState(null);
  const [payMethod, setPayMethod] = useState('Cash');
  const [processingPay, setProcessingPay] = useState(false);

  // Available payment methods (cash, online, cheque)
  const paymentMethods = [
    { value: 'Cash', label: 'نقداً', icon: Banknote },
    { value: 'Online', label: 'عبر الإنترنت', icon: Globe },
    { value: 'Cheque', label: 'شيك', icon: FileText },
  ];

  useEffect(() => {
    fetchParentData();
  }, []);

  const fetchParentData = async () => {
    try {
      const [childRes, payRes] = await Promise.all([
        axios.get('/api/parents/children'),
        axios.get('/api/parents/payments'),
      ]);
      setChildren(childRes.data);
      setPayments(payRes.data);
      if (childRes.data.length > 0) {
        setSelectedChild(childRes.data[0]);
        fetchChildDetails(childRes.data[0]._id);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchChildDetails = async (childId) => {
    setLoadingDetails(true);
    try {
      const [attendanceRes, schedulesRes] = await Promise.all([
        axios.get(`/api/parents/children/${childId}/attendance`),
        axios.get(`/api/parents/children/${childId}/schedules`),
      ]);
      setAttendance(attendanceRes.data);
      setSchedules(schedulesRes.data);
    } catch (err) {
      console.error('Failed to load child details', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePayBill = async (paymentId) => {
    try {
      await axios.post('/api/parents/payments/pay', { paymentId, paymentMethod: 'Card' });
      alert('Paiement réussi ! Recu généré. / Payment successful!');
      fetchParentData();
    } catch (err) {
      alert(err.response?.data?.message || 'Payment failed');
    }
  };

  const handleSelectChild = (child) => {
    setSelectedChild(child);
    fetchChildDetails(child._id);
  };

  const openPayModal = (payment) => {
    setPayModalPayment(payment);
    setPayMethod('Cash');
  };

  const handleConfirmPayment = async () => {
    if (!payModalPayment) return;
    setProcessingPay(true);
    try {
      await axios.post('/api/parents/payments/pay', {
        paymentId: payModalPayment._id,
        paymentMethod: payMethod,
      });
      setPayModalPayment(null);
      alert('تم تسجيل عملية الدفع بنجاح! تم إصدار الوصل.');
      fetchParentData();
    } catch (err) {
      alert(err.response?.data?.message || 'Payment failed');
    } finally {
      setProcessingPay(false);
    }
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 text-right"
      >

        {/* Child selector — shared across per-child sections */}
        {children.length > 0 && (activeTab === 'overview' || activeTab === 'schedules' || activeTab === 'attendance') && (
          <div className="glass-panel p-4 rounded-2xl border border-luxury-border space-y-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Baby className="w-4.5 h-4.5 text-brand-400" />
              <span>اختر الابن</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {children.map((child) => {
                const isSelected = selectedChild?._id === child._id;
                return (
                  <button
                    key={child._id}
                    onClick={() => handleSelectChild(child)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-brand-950/40 border-brand-500 text-white shadow-[0_0_15px_rgba(197,106,61,0.15)]'
                        : 'bg-slate-900/40 border-luxury-border text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="w-8 h-8 rounded-full bg-brand-900/50 flex items-center justify-center font-bold text-brand-300 text-xs shrink-0">
                      {child.user?.firstName?.[0]}{child.user?.lastName?.[0]}
                    </span>
                    <span className="text-right leading-tight">
                      <span className="block text-xs font-semibold">{child.user?.firstName} {child.user?.lastName}</span>
                      <span className="block text-[10px] text-slate-500">{child.class?.name} • {child.group?.name}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== OVERVIEW ===== */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Baby className="w-5.5 h-5.5 text-brand-400" />
              <span>حسابات أبنائي / قائمة الأبناء</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {children.map((child) => {
                const isSelected = selectedChild?._id === child._id;
                return (
                  <div
                    key={child._id}
                    onClick={() => handleSelectChild(child)}
                    className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                      isSelected
                        ? 'bg-brand-950/40 border-brand-500 shadow-[0_0_20px_rgba(14,143,227,0.2)]'
                        : 'glass-panel border-luxury-border hover:border-luxury-border/80 hover:bg-slate-900/10'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-brand-900/50 flex items-center justify-center font-bold text-brand-400 uppercase text-lg">
                        {child.user?.firstName?.[0]}{child.user?.lastName?.[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base">
                          {child.user?.firstName} {child.user?.lastName}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono tracking-wide">
                          رقم التسجيل: {child.registrationNumber}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-400">
                      <p>القسم: <span className="text-white font-medium">{child.class?.name}</span></p>
                      <p>الفوج: <span className="text-white font-medium">{child.group?.name}</span></p>
                      {child.dateOfBirth && (
                        <p>تاريخ الميلاد: <span className="text-white font-medium">{new Date(child.dateOfBirth).toLocaleDateString('fr-FR')}</span></p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                        isSelected ? 'bg-brand-600 text-white' : 'bg-slate-900 text-slate-400'
                      }`}>
                        {isSelected ? 'محدد حالياً' : 'تحديد'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== SCHEDULES ===== */}
        {activeTab === 'schedules' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-400" />
              <span>الجداول والمخططات — {selectedChild?.user?.firstName || 'الابن'}</span>
            </h3>
            <SchedulesView
              schedules={schedules}
              loading={loadingDetails}
              emptyLabel="لا يوجد جدول حصص أو برنامج مسجل لقسم الابن حالياً."
            />
          </div>
        )}

        {/* ===== ATTENDANCE ===== */}
        {activeTab === 'attendance' && (
          <AttendanceView
            attendance={attendance}
            loading={loadingDetails}
            title={`سجل الحضور والغيابات — ${selectedChild?.user?.firstName || 'الابن'}`}
          />
        )}

        {/* ===== PAYMENTS ===== */}
        {activeTab === 'payments' && (
          <div className="glass-panel p-6 rounded-2xl border border-luxury-border space-y-6">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-luxury-border/40 pb-4">
              <CreditCard className="w-5 h-5 text-brand-400" />
              <span>الفواتير والمدفوعات</span>
            </h3>

            {(() => {
              const paid = payments.filter((p) => p.status === 'Paid');
              const pending = payments.filter((p) => p.status !== 'Paid');
              const totalDue = pending.reduce((sum, p) => sum + (p.amount || 0), 0);
              const totalPaid = paid.reduce((sum, p) => sum + (p.amount || 0), 0);
              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-900/40 border border-luxury-border rounded-xl p-4 text-center">
                    <span className="block text-[10px] text-slate-400 mb-1">إجمالي المستحقات</span>
                    <span className="text-lg font-extrabold text-yellow-400">{totalDue.toLocaleString()} DZD</span>
                  </div>
                  <div className="bg-slate-900/40 border border-luxury-border rounded-xl p-4 text-center">
                    <span className="block text-[10px] text-slate-400 mb-1">إجمالي المدفوع</span>
                    <span className="text-lg font-extrabold text-emerald-400">{totalPaid.toLocaleString()} DZD</span>
                  </div>
                  <div className="bg-slate-900/40 border border-luxury-border rounded-xl p-4 text-center">
                    <span className="block text-[10px] text-slate-400 mb-1">عدد الفواتير</span>
                    <span className="text-lg font-extrabold text-brand-300">{payments.length}</span>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {payments.length === 0 ? (
                <div className="text-slate-550 text-sm col-span-2 text-center py-6">لا توجد كشوفات مستحقات مالية حالياً.</div>
              ) : (
                payments.map((pay) => (
                  <div key={pay._id} className="p-4 rounded-xl bg-slate-900/40 border border-luxury-border space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs text-slate-400 block">{pay.type}</span>
                        <span className="font-bold text-slate-100 text-sm">{pay.amount.toLocaleString()} DZD</span>
                        {pay.student?.user && (
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            {pay.student.user.firstName} {pay.student.user.lastName}
                          </span>
                        )}
                      </div>
                      {pay.status === 'Paid' ? (
                        <span className="flex flex-col items-end gap-1">
                          <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>مسددة بالكامل</span>
                          </span>
                          {pay.paymentMethod && (
                            <span className="text-[9px] text-slate-500">
                              {pay.paymentMethod === 'Cash' ? 'نقداً' : pay.paymentMethod === 'Online' ? 'عبر الإنترنت' : pay.paymentMethod === 'Cheque' ? 'شيك' : pay.paymentMethod}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-yellow-400 font-semibold animate-pulse">
                          <Clock className="w-3.5 h-3.5" />
                          <span>قيد الانتظار</span>
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {pay.status !== 'Paid' ? (
                        <button
                          onClick={() => openPayModal(pay)}
                          className="flex-1 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-colors"
                        >
                          الدفع الآن
                        </button>
                      ) : (
                        <a
                          href={`/api/parents/payments/receipts/${pay._id}`}
                          className="flex-1 py-2 bg-slate-900 hover:bg-slate-850 border border-luxury-border rounded-lg text-slate-300 hover:text-white flex items-center justify-center gap-1.5 text-xs transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>تحميل وصل الدفع</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </motion.div>

      {/* Payment method modal (invoice + amount + method) */}
      {payModalPayment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
          onClick={() => !processingPay && setPayModalPayment(null)}
          dir="rtl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md glass-panel border border-luxury-border rounded-2xl p-6 space-y-5 text-right"
          >
            <div className="flex items-center justify-between border-b border-luxury-border/40 pb-3">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-brand-400" />
                <span>تسديد الفاتورة</span>
              </h3>
              <button
                onClick={() => !processingPay && setPayModalPayment(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Invoice summary */}
            <div className="space-y-2 bg-slate-950/40 border border-luxury-border/40 rounded-xl p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-450">نوع الفاتورة:</span>
                <span className="text-white font-semibold">{payModalPayment.type}</span>
              </div>
              {payModalPayment.student?.user && (
                <div className="flex justify-between">
                  <span className="text-slate-450">الابن:</span>
                  <span className="text-white font-semibold">
                    {payModalPayment.student.user.firstName} {payModalPayment.student.user.lastName}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-luxury-border/30 pt-2 mt-2">
                <span className="text-slate-450">المبلغ الإجمالي:</span>
                <span className="text-brand-300 font-bold text-base">
                  {payModalPayment.amount.toLocaleString()} DZD
                </span>
              </div>
            </div>

            {/* Payment method selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 block">اختر طريقة الدفع</label>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map((m) => {
                  const Icon = m.icon;
                  const active = payMethod === m.value;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPayMethod(m.value)}
                      className={`flex flex-col items-center gap-2 py-3 rounded-xl border text-xs font-semibold transition-all ${
                        active
                          ? 'bg-brand-500/15 border-brand-500/50 text-brand-300 shadow-[0_0_15px_rgba(197,106,61,0.15)]'
                          : 'bg-slate-900/40 border-luxury-border text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setPayModalPayment(null)}
                disabled={processingPay}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-luxury-border text-slate-300 hover:text-white font-bold text-xs transition-colors disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={processingPay}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processingPay ? 'جاري المعالجة...' : 'تأكيد الدفع'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
