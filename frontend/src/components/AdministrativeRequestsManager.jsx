import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  Paperclip,
  Download,
  Search,
  Filter,
  X,
  User,
  Calendar,
  Building,
  Tag,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const typeLabels = {
  school_certificate: 'شهادة مدرسية (Certificat de scolarité)',
  appointment: 'طلب موعد مقابلة (Demande de RDV)',
  complaint: 'شكوى أو اقتراح (Réclamation)',
  grade_transcript: 'كشف نقاط (Relevé de notes)',
  other: 'طلب إداري آخر (Autre demande)',
};

const statusBadges = {
  Nouveau: 'bg-amber-50 text-amber-900 border-amber-300 font-bold',
  'En cours': 'bg-sky-50 text-sky-900 border-sky-300 font-bold',
  Répondu: 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold',
  Clôturé: 'bg-stone-100 text-stone-800 border-stone-300 font-bold',
};

const statusLabelsArabic = {
  Nouveau: 'جديد (Nouveau)',
  'En cours': 'قيد المعالجة (En cours)',
  Répondu: 'تمت الإجابة (Répondu)',
  Clôturé: 'مغلق (Clôturé)',
};

export default function AdministrativeRequestsManager() {
  const { user } = useAuthStore();
  const isAdmin = ['admin', 'school'].includes(user?.role);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownloadAttachment = async (rawUrl, trackingNumber, title) => {
    if (!rawUrl) return;
    setDownloadingId(trackingNumber);
    try {
      let cleanUrl = rawUrl.trim();
      if (!cleanUrl.startsWith('http') && !cleanUrl.startsWith('/')) {
        cleanUrl = '/' + cleanUrl;
      }
      const response = await axios.get(cleanUrl, { responseType: 'blob' });
      const contentType = response.headers['content-type'] || '';
      let extension = cleanUrl.split('.').pop() || 'pdf';
      if (contentType.includes('image/png')) extension = 'png';
      else if (contentType.includes('image/jpeg')) extension = 'jpg';
      else if (contentType.includes('pdf')) extension = 'pdf';

      const fileName = `${trackingNumber || 'document'}_${(title || 'officiel').replace(/[^a-zA-Z0-9_\-\u0600-\u06FF]/g, '_')}.${extension}`;
      const blob = new Blob([response.data], { type: contentType || 'application/octet-stream' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download error:', err);
      window.open(rawUrl, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // New Request Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'school_certificate',
    subject: '',
    description: '',
    preferredDate: '',
  });

  // Admin Response Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyStatus, setReplyStatus] = useState('Répondu');
  const [replyAttachmentUrl, setReplyAttachmentUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await axios.get('/api/administrative-requests', { params });
      setRequests(res.data || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.description.trim()) {
      alert('يرجى ملء موضوع وتفاصيل الطلب.');
      return;
    }

    try {
      await axios.post('/api/administrative-requests', formData);
      alert('تم إرسال طلبك الإداري بنجاح وتوليد رقم التتبع الرسمي.');
      setIsCreateOpen(false);
      setFormData({
        type: 'school_certificate',
        subject: '',
        description: '',
        preferredDate: '',
      });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل إرسال الطلب.');
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedRequest) return;
    try {
      await axios.put(`/api/administrative-requests/${selectedRequest._id}`, {
        status: replyStatus,
        responseMessage: replyMessage,
        responseAttachmentUrl: replyAttachmentUrl,
      });
      alert('تم تحديث الطلب وإرسال الإشعار للمعني بنجاح.');
      setSelectedRequest(null);
      setReplyMessage('');
      setReplyAttachmentUrl('');
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل التحديث.');
    }
  };

  const handleUploadAttachment = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const data = new FormData();
    data.append('file', file);

    try {
      const res = await axios.post('/api/administrative-requests/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReplyAttachmentUrl(res.data.url);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur d\'upload');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredRequests = (requests || []).filter((r) => {
    if (!r) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const tracking = (r.trackingNumber || '').toLowerCase();
    const subj = (r.subject || '').toLowerCase();
    const applicant = (r.applicantName || '').toLowerCase();
    return tracking.includes(q) || subj.includes(q) || applicant.includes(q);
  });

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header - Prestige Académique */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-[#C9A24D]/35 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#7B1E3A] flex items-center justify-center text-[#C9A24D] shadow-sm">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-serif font-black text-[#7B1E3A] flex items-center gap-2">
              <span>الطلبات الإدارية والشهادات المدرسية (Article 38)</span>
              <span className="text-[11px] font-sans font-bold px-2.5 py-0.5 rounded-full bg-[#7B1E3A]/10 text-[#7B1E3A] border border-[#7B1E3A]/20">
                الصفحة 21 - أمانة المؤسسة
              </span>
            </h2>
            <p className="text-xs text-[#2B2022]/70">
              استخراج الشهادات المدرسية، طلب المواعيد، التظلمات، ومتابعة الحالات برقم التتبع الرسمي
            </p>
          </div>
        </div>

        {/* New Request button for Parents, Teachers, Students */}
        {!isAdmin && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#7B1E3A] hover:bg-[#62162d] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#7B1E3A]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تقديم طلب إداري جديد</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#C9A24D]/30 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-[#C9A24D] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="ابحث برقم التتبع أو الموضوع أو اسم مقدم الطلب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#C9A24D]/35 rounded-xl pr-9 pl-3 py-2 text-xs text-[#2B2022] font-medium placeholder-[#2B2022]/40 focus:outline-none focus:border-[#7B1E3A] shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#7B1E3A] font-serif">الحالة :</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-[#C9A24D]/35 rounded-xl px-3 py-1.5 text-xs text-[#2B2022] font-bold focus:outline-none focus:border-[#7B1E3A] cursor-pointer shadow-2xs"
          >
            <option value="">جميع الحالات</option>
            <option value="Nouveau">جديد (Nouveau)</option>
            <option value="En cours">قيد المعالجة (En cours)</option>
            <option value="Répondu">تمت الإجابة (Répondu)</option>
            <option value="Clôturé">مغلق (Clôturé)</option>
          </select>
        </div>

        <div className="mr-auto text-xs font-bold text-[#7B1E3A]">
          إجمالي الطلبات : <span className="font-mono bg-[#7B1E3A]/10 px-2 py-0.5 rounded-lg border border-[#7B1E3A]/20">{filteredRequests.length}</span>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="p-12 text-center bg-white border border-[#C9A24D]/30 rounded-3xl shadow-xs">
          <RefreshCw className="w-8 h-8 text-[#7B1E3A] animate-spin mx-auto mb-3" />
          <p className="text-xs font-serif font-bold text-[#7B1E3A]">جارِ تحميل الطلبات الإدارية...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#C9A24D]/30 rounded-3xl shadow-xs text-[#2B2022]/70 space-y-2">
          <FileText className="w-12 h-12 text-[#C9A24D]/60 mx-auto mb-1" />
          <p className="text-sm font-serif font-black text-[#7B1E3A]">لا توجد طلبات إدارية مطابقة</p>
          <p className="text-xs text-[#2B2022]/60">يمكنك تقديم طلب جديد أو تغيير معايير البحث.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <motion.div
              key={req._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 sm:p-6 bg-white border border-[#C9A24D]/35 rounded-3xl shadow-xs hover:border-[#7B1E3A]/50 transition-all space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#C9A24D]/20">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs font-black text-[#7B1E3A] px-2.5 py-1 rounded-lg bg-[#7B1E3A]/10 border border-[#7B1E3A]/25" dir="ltr">
                    {req.trackingNumber}
                  </span>
                  <span className="text-xs font-bold text-[#2B2022]">
                    {typeLabels[req.type] || req.type}
                  </span>
                  <span className="text-[#C9A24D]">•</span>
                  <span className="text-xs text-[#2B2022]/60 font-mono" dir="ltr">
                    {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      statusBadges[req.status] || statusBadges.Nouveau
                    }`}
                  >
                    {statusLabelsArabic[req.status] || req.status}
                  </span>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setSelectedRequest(req);
                        setReplyStatus(req.status === 'Nouveau' ? 'En cours' : req.status);
                        setReplyMessage(req.responseMessage || '');
                        setReplyAttachmentUrl(req.responseAttachmentUrl || '');
                      }}
                      className="px-3.5 py-1.5 bg-[#7B1E3A] hover:bg-[#62162d] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border border-[#C9A24D]/30"
                    >
                      معالجة الطلب / رد الإدارة
                    </button>
                  )}
                </div>
              </div>

              {/* Subject and Description */}
              <div className="space-y-1.5">
                <h4 className="text-sm font-serif font-black text-[#7B1E3A]">{req.subject}</h4>
                <div className="text-xs text-[#2B2022] leading-relaxed bg-[#FDFBF7] p-3.5 rounded-2xl border border-[#C9A24D]/25 whitespace-pre-line shadow-2xs">
                  {req.description}
                </div>
              </div>

              {/* Applicant Info */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-[#2B2022]/70 gap-2 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">مقدم الطلب :</span>
                  <strong className="text-[#7B1E3A]">{req.applicantName}</strong>
                  {req.applicantRole && (
                    <span className="px-2 py-0.5 rounded-md bg-[#F3E9DC] text-[#7B1E3A] font-bold text-[10px]">
                      {req.applicantRole === 'parent' ? 'ولي أمر' : req.applicantRole === 'teacher' ? 'أستاذ' : req.applicantRole === 'student' ? 'تلميذ' : req.applicantRole}
                    </span>
                  )}
                  {req.studentName && (
                    <span className="text-[#2B2022]/70">
                      (خاص بالتلميذ: <strong className="text-emerald-700">{req.studentName}</strong>)
                    </span>
                  )}
                </div>

                {req.preferredDate && (
                  <div className="flex items-center gap-1 font-mono text-[#7B1E3A] bg-[#FDFBF7] px-2.5 py-1 rounded-lg border border-[#C9A24D]/25 text-[11px]" dir="ltr">
                    <Calendar className="w-3.5 h-3.5 text-[#C9A24D]" />
                    <span>RDV souhaité : {new Date(req.preferredDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </div>

              {/* Official Response Box (If responded) */}
              {(req.responseMessage || req.responseAttachmentUrl) && (
                <div className="mt-3 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-300 space-y-2">
                  <div className="flex items-center justify-between text-xs text-emerald-900 font-bold">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>رد أمانة وسكرتارية المؤسسة :</span>
                    </span>
                    {req.respondedAt && (
                      <span className="font-mono text-[10px] text-emerald-800" dir="ltr">
                        {new Date(req.respondedAt).toLocaleString('fr-FR')}
                      </span>
                    )}
                  </div>

                  {req.responseMessage && (
                    <p className="text-xs text-stone-800 leading-relaxed bg-white/80 p-3 rounded-xl border border-emerald-200">
                      {req.responseMessage}
                    </p>
                  )}

                  {req.responseAttachmentUrl && (
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadAttachment(req.responseAttachmentUrl, req.trackingNumber, req.subject)}
                        disabled={downloadingId === req.trackingNumber}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                      >
                        {downloadingId === req.trackingNumber ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>تحميل الوثيقة الإدارية المرفقة (PDF)</span>
                      </button>
                      <a
                        href={req.responseAttachmentUrl.startsWith('http') ? req.responseAttachmentUrl : req.responseAttachmentUrl.startsWith('/') ? req.responseAttachmentUrl : `/${req.responseAttachmentUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold transition-all shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                        <span>معاينة في نافذة جديدة</span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* New Request Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-3xl p-6 shadow-2xl text-right"
          >
            <div className="flex items-center justify-between mb-4 border-b border-[#C9A24D]/25 pb-3">
              <div className="flex items-center gap-2 text-[#7B1E3A] font-serif font-black">
                <FileText className="w-5 h-5 text-[#C9A24D]" />
                <span className="text-base">تقديم طلب إداري رسمي إلى أمانة المؤسسة</span>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="text-[#2B2022]/60 hover:text-[#7B1E3A] p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#7B1E3A] mb-1 font-serif">نوع الطلب *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-white border border-[#C9A24D]/35 rounded-xl p-2.5 text-[#2B2022] font-bold focus:outline-none focus:border-[#7B1E3A] cursor-pointer"
                >
                  <option value="school_certificate">شهادة مدرسية (Certificat de scolarité)</option>
                  <option value="appointment">طلب موعد مقابلة مع الإدارة (Rendez-vous)</option>
                  <option value="complaint">شكوى أو اقتراح تحسين (Réclamation)</option>
                  <option value="grade_transcript">طلب كشف نقاط رسمي (Relevé de notes)</option>
                  <option value="other">طلب إداري آخر</option>
                </select>
              </div>

              {formData.type === 'appointment' && (
                <div>
                  <label className="block font-bold text-[#7B1E3A] mb-1 font-serif">الموعد المفضل</label>
                  <input
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    className="w-full bg-white border border-[#C9A24D]/35 rounded-xl p-2.5 text-[#2B2022] font-bold focus:outline-none focus:border-[#7B1E3A]"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-[#7B1E3A] mb-1 font-serif">موضوع الطلب *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="مثال: طلب شهادة مدرسية لملف الضمان الاجتماعي"
                  className="w-full bg-white border border-[#C9A24D]/35 rounded-xl p-2.5 text-[#2B2022] font-medium placeholder-[#2B2022]/40 focus:outline-none focus:border-[#7B1E3A]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#7B1E3A] mb-1 font-serif">تفاصيل ومبرر الطلب *</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="اكتب تفاصيل طلبك مع ذكر أي معلومات هامة..."
                  className="w-full bg-white border border-[#C9A24D]/35 rounded-xl p-2.5 text-[#2B2022] font-medium placeholder-[#2B2022]/40 focus:outline-none focus:border-[#7B1E3A]"
                  required
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-[#C9A24D]/25">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-[#7B1E3A] hover:bg-[#62162d] text-white rounded-xl font-bold transition-all shadow-md shadow-[#7B1E3A]/20 cursor-pointer"
                >
                  إرسال الطلب رسمياً
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="py-2.5 px-4 bg-white hover:bg-[#F3E9DC]/40 border border-[#C9A24D]/35 text-[#7B1E3A] rounded-xl font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Admin Processing Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-3xl p-6 shadow-2xl text-right"
          >
            <div className="flex items-center justify-between mb-4 border-b border-[#C9A24D]/25 pb-3">
              <div className="flex items-center gap-2 text-[#7B1E3A] font-serif font-black">
                <ShieldCheck className="w-5 h-5 text-[#C9A24D]" />
                <span className="text-base">معالجة الطلب الإداري رقم: {selectedRequest.trackingNumber}</span>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="text-[#2B2022]/60 hover:text-[#7B1E3A] p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#7B1E3A] mb-1 font-serif">تحديث الحالة الرسمية *</label>
                <select
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value)}
                  className="w-full bg-white border border-[#C9A24D]/35 rounded-xl p-2.5 text-[#2B2022] font-bold focus:outline-none focus:border-[#7B1E3A] cursor-pointer"
                >
                  <option value="En cours">قيد المعالجة (En cours)</option>
                  <option value="Répondu">تمت الإجابة (Répondu)</option>
                  <option value="Clôturé">مغلق (Clôturé)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#7B1E3A] mb-1 font-serif">رد الأمانة / الإدارة</label>
                <textarea
                  rows={4}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="اكتب رد المؤسسة الرسمي أو تأكيد موعد المقابلة..."
                  className="w-full bg-white border border-[#C9A24D]/35 rounded-xl p-2.5 text-[#2B2022] font-medium placeholder-[#2B2022]/40 focus:outline-none focus:border-[#7B1E3A]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#7B1E3A] mb-1 font-serif">
                  إرفاق وثيقة رسمية (شهادة مدرسية موقعة ومختومة PDF)
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F3E9DC]/40 border border-[#C9A24D]/35 rounded-xl text-[#7B1E3A] font-bold cursor-pointer transition-all">
                    <Paperclip className="w-4 h-4 text-[#C9A24D]" />
                    <span>{isUploading ? 'جارِ الرفع...' : 'رفع وثيقة PDF / صورة'}</span>
                    <input
                      type="file"
                      onChange={handleUploadAttachment}
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg"
                      disabled={isUploading}
                    />
                  </label>
                  {replyAttachmentUrl && (
                    <span className="text-[11px] text-emerald-700 font-mono truncate max-w-[200px]" dir="ltr">
                      ✓ {replyAttachmentUrl.split('/').pop()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-[#C9A24D]/25">
                <button
                  type="button"
                  onClick={handleUpdateStatus}
                  disabled={isUploading}
                  className="flex-1 py-2.5 px-4 bg-[#7B1E3A] hover:bg-[#62162d] disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-md shadow-[#7B1E3A]/20 cursor-pointer"
                >
                  حفظ الرد وإشعار المعني
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="py-2.5 px-4 bg-white hover:bg-[#F3E9DC]/40 border border-[#C9A24D]/35 text-[#7B1E3A] rounded-xl font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
