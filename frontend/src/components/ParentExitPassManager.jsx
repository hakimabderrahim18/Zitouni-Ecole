import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut,
  Plus,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  X,
  RefreshCw,
  Baby,
  Calendar,
  Search,
} from 'lucide-react';
import DigitalExitPassModal from './DigitalExitPassModal';

export default function ParentExitPassManager({ children = [] }) {
  const [exitPasses, setExitPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // New Request Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    reasonPreset: 'موعد طبي (Rendez-vous médical)',
    reasonDetail: '',
    exitTime: '11:30',
    accompaniedBy: 'الأب (Le Père)',
    customAccompanied: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Print voucher modal state
  const [selectedPassForPrint, setSelectedPassForPrint] = useState(null);

  const fetchExitPasses = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/parents/exit-passes');
      setExitPasses(res.data || []);
    } catch (err) {
      console.error('Error fetching parent exit passes:', err);
      setError('تعذر تحميل طلبات تراخيص الخروج.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExitPasses();
    if (children.length > 0 && !formData.studentId) {
      setFormData((prev) => ({ ...prev, studentId: children[0]._id }));
    }
  }, [children]);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!formData.studentId) {
      alert('يرجى تحديد الابن / التلميذ المراد طلب ترخيص الخروج له.');
      return;
    }

    const finalReason = formData.reasonDetail.trim()
      ? `${formData.reasonPreset} : ${formData.reasonDetail.trim()}`
      : formData.reasonPreset;

    const finalAccompanied = formData.accompaniedBy === 'أخرى'
      ? (formData.customAccompanied.trim() || 'ولي الأمر / مرخص له')
      : formData.accompaniedBy;

    setSubmitting(true);
    try {
      await axios.post('/api/parents/exit-pass-request', {
        studentId: formData.studentId,
        reason: finalReason,
        exitTime: formData.exitTime,
        accompaniedBy: finalAccompanied,
        date: formData.date,
      });

      setSuccessMsg('تم إرسال طلب ترخيص الخروج بنجاح. ستتم مراجعته ومصادقته من قبل إدارة المدرسة.');
      setIsModalOpen(false);
      setFormData({
        studentId: children[0]?._id || '',
        reasonPreset: 'موعد طبي (Rendez-vous médical)',
        reasonDetail: '',
        exitTime: '11:30',
        accompaniedBy: 'الأب (Le Père)',
        customAccompanied: '',
        date: new Date().toISOString().split('T')[0],
      });
      fetchExitPasses();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      alert(err.response?.data?.message || 'فشل إرسال طلب ترخيص الخروج.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>معتمد من الإدارة - مرخص للخروج</span>
          </span>
        );
      case 'Used':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
            <span>تم الخروج من البوابة الرئيسية (Sorti)</span>
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
            <AlertCircle className="w-3.5 h-3.5 text-red-700" />
            <span>طلب مرفوض من الإدارة</span>
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>قيد مراجعة الإدارة والمراقبة العامة</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-cairo text-right" dir="rtl">
      {/* Printable Modal */}
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
            <span>المادة 28 من النظام الداخلي - تراخيص خروج الأبناء</span>
          </div>
          <h2 className="text-2xl font-serif font-black tracking-tight text-white">
            أذونات وتراخيص الخروج الاستثنائية للأبناء
          </h2>
          <p className="text-white/80 text-xs md:text-sm max-w-2xl leading-relaxed">
            يمكن لأولياء الأمور تقديم طلب إذن خروج مسبق للابن (لموعد طبي أو ظرف عائلي). بعد مصادقة إدارة المؤسسة، يتم إشعار موظف الاستقبال عند البوابة الرئيسية للسماح بمغادرة التلميذ بصفة نظامية وآمنة.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#C9A24D] to-[#B38E3B] hover:from-[#d8b15d] hover:to-[#C9A24D] text-[#2B2022] font-black rounded-2xl text-xs md:text-sm transition-all shadow-lg hover:shadow-xl cursor-pointer shrink-0 border border-[#FFF8E7]/40"
        >
          <Plus className="w-5 h-5 text-[#2B2022]" />
          <span>طلب ترخيص خروج جديد للابن</span>
        </button>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 flex items-center justify-between text-xs font-bold shadow-xs"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)}><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Requests History List */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border-2 border-[#C9A24D]/40 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C9A24D]/25 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7B1E3A] flex items-center justify-center text-[#C9A24D] font-bold">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-black text-base text-[#7B1E3A]">
                سجل طلبات تراخيص الخروج الخاصة بأبنائي ({exitPasses.length})
              </h3>
              <p className="text-xs text-[#2B2022]/70 font-medium">
                متابعة حالة الطلبات (قيد المراجعة، موافقة الإدارة، الخروج عبر البوابة)
              </p>
            </div>
          </div>

          <button
            onClick={fetchExitPasses}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FDFBF7] hover:bg-[#F3E9DC] text-[#7B1E3A] border border-[#C9A24D]/35 rounded-xl text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث السجل</span>
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[#7B1E3A] text-xs font-bold flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#C9A24D]" />
            <span>جارِ تحميل سجل تراخيص الخروج...</span>
          </div>
        ) : exitPasses.length === 0 ? (
          <div className="py-12 text-center text-[#2B2022]/60 text-xs italic space-y-3">
            <LogOut className="w-12 h-12 text-[#C9A24D]/50 mx-auto" />
            <p className="font-bold text-sm text-[#7B1E3A]">لا توجد طلبات ترخيص خروج مسجلة حتى الآن.</p>
            <p>يمكنك الضغط على الزر الذهبي أعلاه لتقديم طلب جديد عند الحاجة.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {exitPasses.map((pass) => {
              const studentName = pass.student?.user?.firstName
                ? `${pass.student.user.firstName} ${pass.student.user.lastName}`
                : pass.student?.firstName
                ? `${pass.student.firstName} ${pass.student.lastName}`
                : 'التلميذ';

              return (
                <div
                  key={pass._id}
                  className="p-5 rounded-2xl bg-[#FDFBF7] border-2 border-[#C9A24D]/35 hover:border-[#7B1E3A]/60 transition-all shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-[#7B1E3A] flex items-center justify-center text-[#C9A24D] font-bold text-sm shrink-0">
                          {studentName[0] || 'T'}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#7B1E3A]">{studentName}</h4>
                          <span className="text-[11px] font-bold text-[#C9A24D] block font-mono">
                            القسم: {pass.class?.name || '—'}
                          </span>
                        </div>
                      </div>

                      {getStatusBadge(pass.status)}
                    </div>

                    <div className="space-y-2 text-xs border-y border-[#C9A24D]/20 py-3 bg-white p-3 rounded-xl">
                      <div className="flex justify-between items-center text-[#2B2022]">
                        <span className="text-[#2B2022]/60 font-medium">ساعة الخروج المطلوبة:</span>
                        <span className="font-mono font-bold text-base text-[#7B1E3A] bg-[#FDFBF7] px-2 py-0.5 rounded border border-[#C9A24D]/30" dir="ltr">
                          {pass.exitTime}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[#2B2022]">
                        <span className="text-[#2B2022]/60 font-medium">تاريخ الخروج:</span>
                        <span className="font-mono text-xs font-bold text-[#2B2022]" dir="ltr">
                          {new Date(pass.date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[#2B2022]">
                        <span className="text-[#2B2022]/60 font-medium">المرافق المعتمد:</span>
                        <span className="font-bold text-[#7B1E3A]">{pass.accompaniedBy || 'ولي الأمر'}</span>
                      </div>
                      <div className="space-y-1 pt-1 border-t border-slate-100">
                        <span className="text-[#2B2022]/60 font-medium block">سبب / مبرر الخروج:</span>
                        <p className="font-semibold text-xs text-[#2B2022] leading-relaxed bg-[#FDFBF7] p-2 rounded-lg border border-[#C9A24D]/20">
                          {pass.reason}
                        </p>
                      </div>

                      {pass.rejectionReason && (
                        <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-800 text-[11px] font-bold">
                          سبب رفض الإدارة: {pass.rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[10px] text-[#2B2022]/60 font-mono" dir="ltr">
                      {new Date(pass.createdAt).toLocaleDateString('fr-FR')}
                    </span>

                    {(pass.status === 'Approved' || pass.status === 'Used') && (
                      <button
                        onClick={() => setSelectedPassForPrint(pass)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#7B1E3A] hover:bg-[#5E142A] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border border-[#C9A24D]/30"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#C9A24D]" />
                        <span>طباعة الترخيص (Voucher)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: New Exit Pass Request */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" dir="rtl">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-lg bg-white border-2 border-[#C9A24D]/40 rounded-3xl p-6 md:p-8 shadow-2xl text-right space-y-5"
          >
            <div className="flex items-center justify-between border-b border-[#C9A24D]/30 pb-3">
              <div className="flex items-center gap-3 text-[#7B1E3A]">
                <div className="w-10 h-10 rounded-xl bg-[#7B1E3A] flex items-center justify-center text-[#C9A24D]">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-base">تقديم طلب ترخيص خروج تلميذ</h3>
                  <span className="text-xs text-[#2B2022]/60">يرسل مباشرة إلى إدارة المؤسسة والمراقبة العامة</span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs font-medium">
              {/* Select Child */}
              <div className="space-y-1">
                <label className="text-[#7B1E3A] font-serif font-black block">حدد التلميذ / الابن المعني بالترخيص *</label>
                <select
                  required
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full p-3 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-bold focus:outline-none focus:border-[#7B1E3A]"
                >
                  <option value="">-- اختر الابن --</option>
                  {children.map((child) => (
                    <option key={child._id} value={child._id}>
                      {child.user?.firstName} {child.user?.lastName} ({child.class?.name || 'بدون قسم'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#7B1E3A] font-serif font-black block">تاريخ الخروج *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-3 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-mono font-bold focus:outline-none focus:border-[#7B1E3A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#7B1E3A] font-serif font-black block">ساعة الخروج المرخصة *</label>
                  <input
                    type="time"
                    required
                    value={formData.exitTime}
                    onChange={(e) => setFormData({ ...formData, exitTime: e.target.value })}
                    className="w-full p-3 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-mono font-bold focus:outline-none focus:border-[#7B1E3A]"
                  />
                </div>
              </div>

              {/* Accompanied By */}
              <div className="space-y-1">
                <label className="text-[#7B1E3A] font-serif font-black block">المرافق عند استلام التلميذ *</label>
                <select
                  value={formData.accompaniedBy}
                  onChange={(e) => setFormData({ ...formData, accompaniedBy: e.target.value })}
                  className="w-full p-3 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-bold focus:outline-none focus:border-[#7B1E3A]"
                >
                  <option value="الأب (Le Père)">الأب (Le Père)</option>
                  <option value="الأم (La Mère)">الأم (La Mère)</option>
                  <option value="الولي الشرعي / الكفيل (Tuteur légal)">الولي الشرعي / الكفيل (Tuteur)</option>
                  <option value="تلميذ بمفرده (مع موافقة الولي المكتوبة)">تلميذ بمفرده (بموافقة الولي)</option>
                  <option value="أخرى">شخص آخر مفوض (يرجى التحديد)</option>
                </select>

                {formData.accompaniedBy === 'أخرى' && (
                  <input
                    type="text"
                    placeholder="اكتب اسم ورقم هوية الشخص المفوض..."
                    value={formData.customAccompanied}
                    onChange={(e) => setFormData({ ...formData, customAccompanied: e.target.value })}
                    className="w-full mt-2 p-3 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-bold focus:outline-none focus:border-[#7B1E3A]"
                  />
                )}
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <label className="text-[#7B1E3A] font-serif font-black block">سبب أو مبرر طلب الخروج *</label>
                <select
                  value={formData.reasonPreset}
                  onChange={(e) => setFormData({ ...formData, reasonPreset: e.target.value })}
                  className="w-full p-3 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-bold focus:outline-none focus:border-[#7B1E3A]"
                >
                  <option value="موعد طبي (Rendez-vous médical)">موعد طبي عاجل (Rendez-vous médical)</option>
                  <option value="ظرف عائلي قاهر (Urgence familiale)">ظرف عائلي قاهر أو طارئ (Urgence familiale)</option>
                  <option value="سفر أو التزام إداري (Voyage / Formalité)">سفر أو التزام رسمي (Formalité administrative)</option>
                  <option value="وعكة صحية طارئة (Malaise)">وعكة صحية تستوجب الراحة (Malaise / Repos)</option>
                  <option value="سبب آخر">سبب آخر</option>
                </select>

                <textarea
                  rows={2}
                  placeholder="تفاصيل إضافية عن سبب طلب الخروج (اختياري)..."
                  value={formData.reasonDetail}
                  onChange={(e) => setFormData({ ...formData, reasonDetail: e.target.value })}
                  className="w-full p-3 rounded-xl bg-white border-2 border-[#C9A24D]/45 text-[#2B2022] font-medium focus:outline-none focus:border-[#7B1E3A]"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3.5 bg-gradient-to-r from-[#7B1E3A] to-[#5F1329] hover:from-[#5F1329] hover:to-[#3B0715] text-white font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#C9A24D]/40 disabled:opacity-50"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-[#C9A24D]" />
                  )}
                  <span>إرسال طلب الترخيص إلى إدارة المؤسسة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
