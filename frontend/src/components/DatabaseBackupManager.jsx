import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  ShieldCheck,
  Download,
  RefreshCw,
  Plus,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HardDrive,
  FileCode,
  Check,
  X,
} from 'lucide-react';
import axios from 'axios';

export default function DatabaseBackupManager() {
  const [backups, setBackups] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);
  const [selectedVerificationResult, setSelectedVerificationResult] = useState(null);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/backups');
      setBackups(res.data.backups || []);
      setStats(res.data.stats || null);
    } catch (err) {
      console.error('Error fetching backups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const res = await axios.post('/api/backups/create');
      alert('تم إنشاء النسخة الاحتياطية وتشفيرها بنجاح بخوارزمية AES-256-CBC.');
      fetchBackups();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل إنشاء النسخة الاحتياطية.');
    } finally {
      setCreating(false);
    }
  };

  const handleVerifyBackup = async (id) => {
    setVerifyingId(id);
    try {
      const res = await axios.post(`/api/backups/verify/${id}`);
      setSelectedVerificationResult(res.data.testResult);
      fetchBackups();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل فحص واختبار استرجاع النسخة.');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDownload = (id) => {
    window.open(`/api/backups/download/${id}`, '_blank');
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-luxury-border bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-lg">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>النسخ الاحتياطي الدوري والتشفير التلقائي للبيانات</span>
              <span className="text-[11px] font-normal px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                المادة 65 و 7 - أمان البيانات
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              تشفير عسكري AES-256-CBC، حفظ دوري يومي، واختبار تلقائي لجاهزية الاسترجاع عند الطوارئ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchBackups}
            disabled={loading}
            className="p-2.5 bg-slate-950/60 hover:bg-slate-900 border border-luxury-border rounded-xl text-slate-300 hover:text-white transition-all"
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-400' : ''}`} />
          </button>

          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
          >
            {creating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            <span>إنشاء نسخة احتياطية مشفرة الآن</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl glass-panel border border-luxury-border bg-slate-950/40">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">إجمالي النسخ الاحتياطية</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{stats?.totalBackups || 0}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">محفوظة في الأرشيف المشفر</span>
        </div>

        <div className="p-4 rounded-xl glass-panel border border-luxury-border bg-slate-950/40">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">جاهزية الاسترجاع المختبرة</span>
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">
            {stats?.verifiedBackups || 0} / {stats?.totalBackups || 0}
          </p>
          <span className="text-[10px] text-emerald-400/80 mt-1 block">سلامة 100% ومطابقة للتكامل</span>
        </div>

        <div className="p-4 rounded-xl glass-panel border border-luxury-border bg-slate-950/40">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">بروتوكول التشفير</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-sm font-bold text-white font-mono">AES-256-CBC</p>
          <span className="text-[10px] text-slate-500 mt-1 block">مع مفتاح ومصادقة SHA-256</span>
        </div>

        <div className="p-4 rounded-xl glass-panel border border-luxury-border bg-slate-950/40">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">الجدولة التلقائية</span>
            <Clock className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-sm font-bold text-emerald-400">مفعلة يومياً (24 ساعة)</p>
          <span className="text-[10px] text-slate-500 mt-1 block">
            آخر نسخة :{' '}
            {stats?.lastBackupAt
              ? new Date(stats.lastBackupAt).toLocaleDateString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'لا يوجد'}
          </span>
        </div>
      </div>

      {/* Backups Table */}
      <div className="rounded-2xl glass-panel border border-luxury-border overflow-hidden bg-slate-950/50">
        <div className="p-4 border-b border-luxury-border bg-slate-900/30 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-brand-400" />
            <span>سجل النسخ الاحتياطية المشفرة والمفحوصة (Archives)</span>
          </h3>
          <span className="text-xs text-slate-400">
            ملفات ذات امتداد <code className="text-emerald-400">.enc</code>
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">جارِ فحص أرشيف النسخ الاحتياطية...</p>
          </div>
        ) : backups.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Database className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-xs">لا توجد نسخ احتياطية مسجلة بعد. اضغط على الزر أعلاه لإنشاء أول نسخة مشفرة.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900/60 border-b border-luxury-border text-slate-400">
                <tr>
                  <th className="p-3.5 font-semibold">اسم الملف المشفر</th>
                  <th className="p-3.5 font-semibold">تاريخ الإنشاء</th>
                  <th className="p-3.5 font-semibold">الحجم</th>
                  <th className="p-3.5 font-semibold">الجداول / الوثائق</th>
                  <th className="p-3.5 font-semibold">النوع</th>
                  <th className="p-3.5 font-semibold">سلامة الاسترجاع (Art. 65)</th>
                  <th className="p-3.5 font-semibold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-border/30">
                {backups.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2 font-mono text-white text-[11px]" dir="ltr">
                        <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate max-w-[200px]" title={b.filename}>
                          {b.filename}
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5" dir="ltr" title={b.checksum}>
                        SHA256: {b.checksum ? b.checksum.substring(0, 16) + '...' : 'N/A'}
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-slate-300 text-[11px]" dir="ltr">
                      {new Date(b.createdAt).toLocaleString('fr-FR')}
                    </td>

                    <td className="p-3.5 font-mono text-white font-semibold">
                      {formatBytes(b.sizeBytes)}
                    </td>

                    <td className="p-3.5">
                      <span className="text-brand-300 font-mono font-bold">{b.collectionsCount}</span> جدول /{' '}
                      <span className="text-slate-300 font-mono">{b.totalDocuments}</span> وثيقة
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          b.triggerType === 'Automated'
                            ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/25'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {b.triggerType === 'Automated' ? 'تلقائي دوري' : 'يدوي'}
                      </span>
                    </td>

                    <td className="p-3.5">
                      {b.restoreVerified ? (
                        <button
                          onClick={() => setSelectedVerificationResult(b.restoreTestResult)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>سليم ومختبر 100% ✓</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span>في انتظار الفحص</span>
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Test Restore Button */}
                        <button
                          onClick={() => handleVerifyBackup(b._id)}
                          disabled={verifyingId === b._id}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/30 rounded-lg text-[11px] font-semibold transition-all"
                          title="اختبار فك التشفير والتكامل البنيوي للبيانات"
                        >
                          {verifyingId === b._id ? (
                            <div className="w-3.5 h-3.5 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
                          )}
                          <span>اختبار الاسترجاع</span>
                        </button>

                        {/* Download button */}
                        <button
                          onClick={() => handleDownload(b._id)}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-luxury-border rounded-lg transition-all"
                          title="تحميل الأرشيف المشفر (.enc)"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Restore Verification Details Modal */}
      {selectedVerificationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl text-right"
          >
            <div className="flex items-center justify-between mb-4 border-b border-emerald-500/20 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <ShieldCheck className="w-5 h-5" />
                <span>شهادة فحص واختبار استرجاع النسخة (Art. 65)</span>
              </div>
              <button
                onClick={() => setSelectedVerificationResult(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>نجح فحص فك التشفير والتحقق من صحة التكامل التام للبيانات بنسبة 100%.</span>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="p-2.5 bg-slate-950 rounded-lg border border-luxury-border">
                  <span className="text-[10px] text-slate-500 block">الجداول المفحوصة</span>
                  <span className="text-white font-bold">{selectedVerificationResult.totalCollectionsVerified} جدول</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-luxury-border">
                  <span className="text-[10px] text-slate-500 block">إجمالي الوثائق المتحقق منها</span>
                  <span className="text-emerald-400 font-bold">{selectedVerificationResult.totalDocumentsVerified} وثيقة</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-luxury-border font-mono text-[10px]">
                <span className="text-slate-500 block mb-1">بصمة التكامل الرقمية SHA-256 :</span>
                <span className="text-slate-300 break-all select-all">
                  {selectedVerificationResult.computedChecksum}
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-1">الجداول المتضمنة في الأرشيف :</span>
                <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-luxury-border">
                  {(selectedVerificationResult.collections || []).map((col, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-900 border border-luxury-border/50 rounded-md text-[10px] font-mono text-brand-300">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-luxury-border">
              <button
                onClick={() => setSelectedVerificationResult(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                إغلاق نافذة التقرير
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
