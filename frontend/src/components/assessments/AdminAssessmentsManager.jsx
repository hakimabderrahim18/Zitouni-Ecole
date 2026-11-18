import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  GraduationCap,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  RotateCcw,
  Eye,
  FileText,
  Printer,
  Globe,
  Lock,
  Unlock,
  AlertTriangle,
  X,
  Send,
  Trash2,
  Download,
  Users,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import PublishingControlModal from './PublishingControlModal';

export default function AdminAssessmentsManager() {
  const [assessments, setAssessments] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, draft: 0, submitted: 0, approved: 0, returned: 0, published: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [cycleFilter, setCycleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Review Modal State
  const [reviewingAssessment, setReviewingAssessment] = useState(null);
  const [reviewAction, setReviewAction] = useState('approve'); // 'approve' | 'return'
  const [returnReason, setReturnReason] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Publishing Control Modal State
  const [publishingAssessment, setPublishingAssessment] = useState(null);

  // Audit History View Modal State
  const [historyAssessment, setHistoryAssessment] = useState(null);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/assessments/admin/all');
      setAssessments(res.data.assessments || []);
      if (res.data.metrics) setMetrics(res.data.metrics);
    } catch (err) {
      console.error('Error fetching admin assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (assessment) => {
    setReviewingAssessment(assessment);
    setReviewAction('approve');
    setReturnReason('');
  };

  const handleExecuteReview = async () => {
    if (!reviewingAssessment) return;
    if (reviewAction === 'return' && !returnReason.trim()) {
      alert('يجب كتابة سبب إرجاع الكشف للتصحيح للأستاذ.');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await axios.put(`/api/assessments/admin/${reviewingAssessment._id}/review`, {
        action: reviewAction,
        returnReason: returnReason.trim(),
      });

      alert(res.data.message || 'تم تحديث حالة الكشف بنجاح.');
      setReviewingAssessment(null);
      fetchAssessments();
    } catch (err) {
      alert(err.response?.data?.message || 'حدث خطأ أثناء معالجة القرار.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteAssessment = async (id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الكشف نهائياً؟')) return;
    try {
      await axios.delete(`/api/assessments/${id}`);
      fetchAssessments();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل حذف الكشف.');
    }
  };

  const filteredAssessments = assessments.filter((a) => {
    if (cycleFilter !== 'all' && a.cycle !== cycleFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const cName = a.class?.name?.toLowerCase() || '';
      const sub = a.subject?.toLowerCase() || '';
      const tName = `${a.teacherUser?.firstName || ''} ${a.teacherUser?.lastName || ''}`.toLowerCase();
      if (!cName.includes(q) && !sub.includes(q) && !tName.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        <div className="bg-white border border-[#E8DFD0] p-3.5 sm:p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-[#766065] uppercase tracking-wider block">إجمالي الكشوفات</span>
          <span className="text-xl sm:text-2xl font-black text-[#2B2022] mt-1 block">{metrics.total}</span>
        </div>

        <div className="bg-[#FAF2F4] border border-[#E7C1CB] p-3.5 sm:p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-[#7B1E3A] uppercase tracking-wider block">مرسلة للمراجعة</span>
          <span className="text-xl sm:text-2xl font-black text-[#7B1E3A] mt-1 block">{metrics.submitted}</span>
        </div>

        <div className="bg-[#F4F9F4] border border-[#C6E7C8] p-3.5 sm:p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-[#2D6A4F] uppercase tracking-wider block">معتمدة رسمياً</span>
          <span className="text-xl sm:text-2xl font-black text-[#1B4332] mt-1 block">{metrics.approved}</span>
        </div>

        <div className="bg-[#FFF9F0] border border-[#EEDDAF] p-3.5 sm:p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-[#8E6E27] uppercase tracking-wider block">معادة للتصحيح</span>
          <span className="text-xl sm:text-2xl font-black text-[#8E6E27] mt-1 block">{metrics.returned}</span>
        </div>

        <div className="bg-[#FAF2F4] border border-[#E7C1CB] p-3.5 sm:p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-[#7B1E3A] uppercase tracking-wider block">منشورة للأولياء</span>
          <span className="text-xl sm:text-2xl font-black text-[#7B1E3A] mt-1 block">{metrics.published}</span>
        </div>

        <div className="bg-[#FAF7F2] border border-[#E8DFD0] p-3.5 sm:p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-[#766065] uppercase tracking-wider block">مسودات قيد الإنجاز</span>
          <span className="text-xl sm:text-2xl font-black text-[#2B2022] mt-1 block">{metrics.draft}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8DFD0] shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#A8989B] absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث بالقسم، المادة، أو الأستاذ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FDFBF7] border border-[#E8DFD0] rounded-xl ps-9 pe-3 py-2 text-xs text-[#2B2022] placeholder-[#A8989B] focus:outline-none focus:border-[#7B1E3A] focus:bg-white transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <select
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value)}
              className="bg-[#FDFBF7] border border-[#E8DFD0] rounded-xl px-3 py-2 text-xs text-[#2B2022] focus:outline-none focus:border-[#7B1E3A] focus:bg-white transition-colors"
            >
              <option value="all">جميع الأطوار</option>
              <option value="primary">ابتدائي</option>
              <option value="middle">متوسط</option>
              <option value="secondary">ثانوي</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#FDFBF7] border border-[#E8DFD0] rounded-xl px-3 py-2 text-xs text-[#2B2022] focus:outline-none focus:border-[#7B1E3A] focus:bg-white transition-colors"
            >
              <option value="all">جميع الحالات</option>
              <option value="submitted">مرسل للإدارة</option>
              <option value="approved">معتمد</option>
              <option value="returned">معاد للتصحيح</option>
              <option value="draft">مسودة</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchAssessments}
          className="px-3.5 py-2 rounded-xl bg-[#FDF2F4] hover:bg-[#FCE7EC] text-[#7B1E3A] text-xs font-bold border border-[#E7C1CB] flex items-center justify-center gap-1.5 transition-all shadow-2xs self-end md:self-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>تحديث القائمة</span>
        </button>
      </div>

      {/* Mobile Card View (visible on < md) */}
      <div className="md:hidden space-y-3">
        {filteredAssessments.length === 0 ? (
          <div className="bg-white border border-[#E8DFD0] rounded-2xl p-8 text-center text-[#766065] shadow-xs">
            لا توجد كشوفات تقييم مطابقة للبحث.
          </div>
        ) : (
          filteredAssessments.map((a) => (
            <div key={a._id} className="bg-white rounded-2xl border border-[#E8DFD0] p-4 shadow-xs space-y-3.5">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-[#2B2022] text-base">{a.class?.name || 'قسم'}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#766065] border border-[#E8DFD0]">
                      {a.cycle === 'primary' ? 'ابتدائي' : a.cycle === 'middle' ? 'متوسط' : 'ثانوي'}
                    </span>
                  </div>
                  <strong className="text-[#7B1E3A] text-sm block mt-0.5">{a.subject}</strong>
                  <span className="text-[11px] text-[#766065]">{a.assessmentType}</span>
                </div>

                <span className="text-[10px] font-mono text-[#8E6E27] bg-[#FBF7ED] px-2 py-0.5 rounded-lg border border-[#EEDDAF]">
                  {a.assessmentDate ? new Date(a.assessmentDate).toLocaleDateString('ar-DZ') : '-'}
                </span>
              </div>

              <div className="text-xs text-[#574549] flex justify-between items-center py-2 px-3 bg-[#FDFBF7] rounded-xl border border-[#F0EAE1]">
                <span>الأستاذ: <strong className="text-[#2B2022]">{a.teacherUser ? `${a.teacherUser.firstName || ''} ${a.teacherUser.lastName || ''}`.trim() : 'الأستاذ'}</strong></span>
                <span className="font-mono text-[#766065] text-[11px]">{a.records?.length || 0} تلميذ</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    a.status === 'approved'
                      ? 'bg-[#F4F9F4] text-[#2D6A4F] border-[#C6E7C8]'
                      : a.status === 'submitted'
                      ? 'bg-[#FAF2F4] text-[#7B1E3A] border-[#E7C1CB]'
                      : a.status === 'returned'
                      ? 'bg-[#FFF9F0] text-[#8E6E27] border-[#EEDDAF]'
                      : 'bg-[#FAF7F2] text-[#766065] border-[#E8DFD0]'
                  }`}
                >
                  {a.status === 'approved' && 'معتمد نهائياً'}
                  {a.status === 'submitted' && 'مرسل للمراجعة'}
                  {a.status === 'returned' && 'مُعاد للتصحيح'}
                  {a.status === 'draft' && 'مسودة'}
                </span>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    a.isPublished
                      ? 'bg-[#FAF2F4] text-[#7B1E3A] border-[#E7C1CB]'
                      : a.scheduledPublishAt
                      ? 'bg-[#FFF9F0] text-[#8E6E27] border-[#EEDDAF]'
                      : 'bg-[#FAF7F2] text-[#766065] border-[#E8DFD0]'
                  }`}
                >
                  {a.isPublished ? 'منشور للأولياء' : a.scheduledPublishAt ? 'مجدول آلياً' : 'غير منشور'}
                </span>
              </div>

              {/* Action Buttons Row on Mobile */}
              <div className="pt-2 border-t border-[#F0EAE1] grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleOpenReview(a)}
                  className="py-2 px-3 rounded-xl bg-[#FAF2F4] hover:bg-[#F4E2E7] text-[#7B1E3A] border border-[#E7C1CB] text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  مراجعة
                </button>

                <button
                  onClick={() => setPublishingAssessment(a)}
                  className="py-2 px-3 rounded-xl bg-[#FFF9F0] hover:bg-[#FFF3DF] text-[#8E6E27] border border-[#EEDDAF] text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  <Globe className="w-3.5 h-3.5" />
                  النشر
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                <a
                  href={`/api/assessments/${a._id}/export/pdf?type=collective`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-1.5 px-2 rounded-lg bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#4A3A3D] border border-[#E8DFD0] flex items-center justify-center gap-1 text-[11px] font-medium"
                >
                  <Printer className="w-3 h-3 text-[#7B1E3A]" />
                  كشف PDF
                </a>

                <button
                  onClick={() => setHistoryAssessment(a)}
                  className="py-1.5 px-3 rounded-lg bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#4A3A3D] border border-[#E8DFD0] flex items-center justify-center gap-1 text-[11px]"
                  title="سجل التدقيق"
                >
                  <Clock className="w-3 h-3" />
                  السجل
                </button>

                <button
                  onClick={() => handleDeleteAssessment(a._id)}
                  className="py-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center gap-1 text-[11px]"
                  title="حذف"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Assessments Master Table (hidden on mobile, visible md:) */}
      <div className="hidden md:block bg-white rounded-2xl border border-[#E8DFD0] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#FAF7F2] text-[#574549] text-xs uppercase border-b border-[#E8DFD0] font-bold">
                <th className="py-3 px-4">القسم والطور</th>
                <th className="py-3 px-4">المادة ونوع التقييم</th>
                <th className="py-3 px-4">الأستاذ المكلّف</th>
                <th className="py-3 px-4">تاريخ الإجراء</th>
                <th className="py-3 px-4 text-center">حالة الاعتماد</th>
                <th className="py-3 px-4 text-center">النشر للأولياء</th>
                <th className="py-3 px-4 text-center">الإجراءات والقرارات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAE1] text-xs">
              {filteredAssessments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#766065]">
                    لا توجد كشوفات تقييم مطابقة للبحث.
                  </td>
                </tr>
              ) : (
                filteredAssessments.map((a) => (
                  <tr key={a._id} className="hover:bg-[#FDFBF7] transition-colors">
                    {/* Class & Cycle */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#2B2022] block">{a.class?.name || 'قسم'}</span>
                      <span className="text-[10px] text-[#766065] font-medium">
                        {a.cycle === 'primary' ? 'ابتدائي' : a.cycle === 'middle' ? 'متوسط' : 'ثانوي'}
                      </span>
                    </td>

                    {/* Subject & Type */}
                    <td className="py-3 px-4">
                      <strong className="text-[#7B1E3A] block font-bold">{a.subject}</strong>
                      <span className="text-[11px] text-[#766065]">{a.assessmentType}</span>
                    </td>

                    {/* Teacher */}
                    <td className="py-3 px-4">
                      <span className="text-[#2B2022] block font-semibold">
                        {a.teacherUser
                          ? `${a.teacherUser.firstName || ''} ${a.teacherUser.lastName || ''}`.trim()
                          : 'الأستاذ'}
                      </span>
                      <span className="text-[10px] text-[#766065] font-mono">
                        {a.records?.length || 0} تلميذ مدوّن
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 font-mono text-[#766065] text-[11px]">
                      {a.assessmentDate ? new Date(a.assessmentDate).toLocaleDateString('ar-DZ') : '-'}
                    </td>

                    {/* Status Pill */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          a.status === 'approved'
                            ? 'bg-[#F4F9F4] text-[#2D6A4F] border-[#C6E7C8]'
                            : a.status === 'submitted'
                            ? 'bg-[#FAF2F4] text-[#7B1E3A] border-[#E7C1CB]'
                            : a.status === 'returned'
                            ? 'bg-[#FFF9F0] text-[#8E6E27] border-[#EEDDAF]'
                            : 'bg-[#FAF7F2] text-[#766065] border-[#E8DFD0]'
                        }`}
                      >
                        {a.status === 'approved' && 'معتمد نهائياً'}
                        {a.status === 'submitted' && 'مرسل للمراجعة'}
                        {a.status === 'returned' && 'مُعاد للتصحيح'}
                        {a.status === 'draft' && 'مسودة'}
                      </span>
                    </td>

                    {/* Publishing Status */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          a.isPublished
                            ? 'bg-[#FAF2F4] text-[#7B1E3A] border-[#E7C1CB]'
                            : a.scheduledPublishAt
                            ? 'bg-[#FFF9F0] text-[#8E6E27] border-[#EEDDAF]'
                            : 'bg-[#FAF7F2] text-[#766065] border-[#E8DFD0]'
                        }`}
                      >
                        {a.isPublished ? 'منشور للأولياء' : a.scheduledPublishAt ? 'مجدول آلياً' : 'غير منشور'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Review / Decision button */}
                        <button
                          onClick={() => handleOpenReview(a)}
                          className="px-2.5 py-1 rounded-lg bg-[#FAF2F4] hover:bg-[#F4E2E7] text-[#7B1E3A] border border-[#E7C1CB] text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="مراجعة وتدقيق واعتماد"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          مراجعة
                        </button>

                        {/* Publishing Control Button */}
                        <button
                          onClick={() => setPublishingAssessment(a)}
                          className="px-2.5 py-1 rounded-lg bg-[#FFF9F0] hover:bg-[#FFF3DF] text-[#8E6E27] border border-[#EEDDAF] text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="التحكم في نشر النتائج"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          النشر
                        </button>

                        {/* Export PDF Button */}
                        <a
                          href={`/api/assessments/${a._id}/export/pdf?type=collective`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#4A3A3D] border border-[#E8DFD0]"
                          title="استخراج كشف PDF"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#7B1E3A]" />
                        </a>

                        {/* Audit Log Button */}
                        <button
                          onClick={() => setHistoryAssessment(a)}
                          className="p-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#4A3A3D] hover:text-[#2B2022] border border-[#E8DFD0] cursor-pointer"
                          title="سجل التدقيق والعمليات"
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteAssessment(a._id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer"
                          title="حذف الكشف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Approval Modal */}
      {reviewingAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FCFAF7] border border-[#E8DFD0] rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#7B1E3A] via-[#681830] to-[#541225] border-b border-[#C9A24D]/30 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 text-[#F5E6BE] shadow-xs">
                  <CheckCircle2 className="w-5 h-5 text-[#F5E6BE]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white tracking-wide">
                    مراجعة وتدقيق كشف النقاط — قرار الإدارة
                  </h3>
                  <p className="text-xs text-[#F2DFBA] font-medium mt-0.5">
                    {reviewingAssessment.assessmentType} • {reviewingAssessment.subject} ({reviewingAssessment.class?.name || 'قسم'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReviewingAssessment(null)}
                className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs bg-[#FCFAF7]">
              {/* Class General Remark */}
              {reviewingAssessment.classRemark && (
                <div className="p-4 bg-[#FFFBF5] border border-[#E8DFD0] rounded-2xl shadow-xs">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#C9A24D]" />
                    <strong className="text-[#7B1E3A] font-bold text-xs">الملاحظة العامة للأستاذ حول القسم:</strong>
                  </div>
                  <p className="text-[#2B2022] leading-relaxed text-xs pe-2 font-medium">{reviewingAssessment.classRemark}</p>
                </div>
              )}

              {/* Roster Preview */}
              <div>
                <h4 className="font-black text-[#2B2022] mb-2 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#7B1E3A]" />
                    <span>معاينة علامات وتوجيهات التلاميذ:</span>
                  </span>
                  <span className="text-[11px] font-bold text-[#8E6E27] bg-[#FBF7ED] border border-[#EEDDAF] px-2.5 py-0.5 rounded-full">
                    {reviewingAssessment.records?.length || 0} تلميذ
                  </span>
                </h4>
                <div className="max-h-60 overflow-y-auto border border-[#E8DFD0] rounded-2xl bg-white divide-y divide-[#F4EFEA] shadow-xs">
                  {(reviewingAssessment.records || []).map((r, i) => {
                    const st = r.student || {};
                    const u = st.user || {};
                    const name =
                      `${u.firstNameArabic || u.firstName || ''} ${u.lastNameArabic || u.lastName || ''}`.trim() ||
                      `تلميذ ${i + 1}`;
                    return (
                      <div key={i} className="p-3 px-4 flex items-center justify-between hover:bg-[#FDFBF7] transition-colors">
                        <div>
                          <span className="font-bold text-[#2B2022] text-xs block">{name}</span>
                          {r.individualRemark && (
                            <span className="text-[11px] text-[#766065] block mt-0.5 font-medium">
                              ملاحظة: {r.individualRemark}
                            </span>
                          )}
                        </div>
                        <div className="text-left font-mono font-bold">
                          {r.isAbsent ? (
                            <span className="text-[#991B1B] bg-[#FEF2F2] border border-[#FCA5A5] px-2.5 py-0.5 rounded-lg text-xs font-semibold">غائب</span>
                          ) : (
                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                              r.grade >= 10
                                ? 'text-[#7B1E3A] bg-[#FAF2F4] border-[#E7C1CB]'
                                : 'text-[#8E6E27] bg-[#FFF9F0] border-[#EEDDAF]'
                            }`}>
                              {r.grade != null ? r.grade : '--'} / 20
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Decision Selector */}
              <div className="space-y-3 pt-4 border-t border-[#E8DFD0]">
                <label className="font-black text-[#2B2022] text-xs block">
                  حدد قرار الإدارة بخصوص هذا الكشف:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                      reviewAction === 'approve'
                        ? 'bg-[#FAF2F4] border-[#7B1E3A] text-[#7B1E3A] shadow-xs'
                        : 'bg-white border-[#E8DFD0] text-[#4A3A3D] hover:bg-[#FAF6F0]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reviewDecision"
                      value="approve"
                      checked={reviewAction === 'approve'}
                      onChange={() => setReviewAction('approve')}
                      className="accent-[#7B1E3A] w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span className="font-black text-xs block">اعتماد الكشف نهائياً</span>
                      <span className="text-[11px] text-[#766065] font-medium">الموافقة على العلامات ونقل الكشف لحالة الاعتماد</span>
                    </div>
                  </label>

                  <label
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                      reviewAction === 'return'
                        ? 'bg-[#FFF9F0] border-[#C9A24D] text-[#8E6E27] shadow-xs'
                        : 'bg-white border-[#E8DFD0] text-[#4A3A3D] hover:bg-[#FAF6F0]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reviewDecision"
                      value="return"
                      checked={reviewAction === 'return'}
                      onChange={() => setReviewAction('return')}
                      className="accent-[#C9A24D] w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span className="font-black text-xs block">إرجاع للأستاذ للتصحيح</span>
                      <span className="text-[11px] text-[#766065] font-medium">إعادة فتح التعديل للأستاذ مع إرفاق التوجيهات</span>
                    </div>
                  </label>
                </div>

                {reviewAction === 'return' && (
                  <div className="space-y-1.5 pt-2">
                    <label className="text-[#8E6E27] font-bold text-xs block">
                      سبب الإرجاع وملاحظات التصحيح (إلزامي):
                    </label>
                    <textarea
                      rows={3}
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      placeholder="وضح للأستاذ بدقة النقاط أو الأخطاء المطلوب تعديلها..."
                      className="w-full bg-white border-2 border-[#C9A24D]/40 rounded-xl p-3 text-xs text-[#2B2022] placeholder-[#A8989B] focus:outline-none focus:border-[#7B1E3A] focus:ring-1 focus:ring-[#7B1E3A] transition-all"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-[#F7F2EA] border-t border-[#E8DFD0] flex justify-end items-center gap-3">
              <button
                onClick={() => setReviewingAssessment(null)}
                className="px-5 py-2.5 rounded-xl bg-white border border-[#D5C9B8] hover:bg-[#EFE8DC] text-[#4A3A3D] text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleExecuteReview}
                disabled={submittingReview}
                className={`px-7 py-2.5 rounded-xl text-white text-xs font-black transition-all cursor-pointer shadow-md flex items-center gap-2 ${
                  reviewAction === 'approve'
                    ? 'bg-gradient-to-r from-[#7B1E3A] to-[#60142B] hover:from-[#60142B] hover:to-[#480E20] shadow-[#7B1E3A]/25 border border-[#C9A24D]/40'
                    : 'bg-gradient-to-r from-[#B28B36] to-[#8E6E27] hover:from-[#8E6E27] hover:to-[#6A511C] shadow-[#B28B36]/25 border border-[#EEDDAF]'
                }`}
              >
                {submittingReview ? 'جاري المعالجة...' : 'تأكيد القرار'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publishing Control Modal */}
      {publishingAssessment && (
        <PublishingControlModal
          assessment={publishingAssessment}
          isOpen={Boolean(publishingAssessment)}
          onClose={() => setPublishingAssessment(null)}
          onUpdated={() => {
            fetchAssessments();
          }}
        />
      )}

      {/* Audit Log Modal */}
      {historyAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FCFAF7] border border-[#E8DFD0] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#7B1E3A] via-[#681830] to-[#541225] border-b border-[#C9A24D]/30 flex justify-between items-center text-white">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F5E6BE]" />
                سجل التدقيق وتاريخ الإجراءات للكشف
              </h3>
              <button
                onClick={() => setHistoryAssessment(null)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/15 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 text-xs bg-[#FCFAF7]">
              {(historyAssessment.history || []).length === 0 ? (
                <p className="text-[#766065] text-center py-6 font-medium">لا توجد سجلات مسجلة.</p>
              ) : (
                historyAssessment.history.map((h, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-white border border-[#E8DFD0] space-y-1 shadow-2xs">
                    <div className="flex justify-between items-center text-[#766065] text-[11px]">
                      <span className="font-bold text-[#7B1E3A]">{h.byName || 'مستخدم النظام'}</span>
                      <span className="font-mono">{new Date(h.at).toLocaleString('ar-DZ')}</span>
                    </div>
                    <p className="text-[#2B2022] font-medium">{h.details || h.action}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
