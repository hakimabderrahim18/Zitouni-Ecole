import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertTriangle,
  X,
  RefreshCw,
  Users,
  BookOpen,
  Layers,
  ShieldCheck,
  FileText,
} from 'lucide-react';

export default function TeacherExcelImportModal({ isOpen, onClose, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [role, setRole] = useState('teacher');
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setImportResult(null);
      setErrorMsg('');
    }
  };

  const handleImport = async () => {
    if (!file) {
      setErrorMsg('يرجى اختيار ملف Excel أولاً');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('role', role);

      const token = localStorage.getItem('token') || localStorage.getItem('zitouni_access_token');
      const res = await axios.post('/api/admin/users/bulk-import/teachers', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      setImportResult(res.data);
      setLoading(false);
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'حدث خطأ أثناء معالجة ملف الإكسل');
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.open('/api/admin/teachers/template', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-slate-900 border border-luxury-border rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl relative max-h-[92vh] flex flex-col font-cairo text-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-luxury-border/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#7B1E3A]/20 border border-[#C9A24D]/40 text-[#C9A24D] flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <span>استيراد الأساتذة والموظفين عبر Excel</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#7B1E3A] text-amber-200 border border-[#C9A24D]/40 font-mono">
                  المادة 23
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                الفصل التاسع: ملفات الأساتذة والموظفين - ربط آلي بالأقسام والأفواج مع التحكم اليدوي بالصلاحيات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="overflow-y-auto py-5 space-y-5 flex-1 pr-1 pl-1">
          {/* Statutory directive note */}
          <div className="p-4 rounded-2xl bg-[#7B1E3A]/15 border border-[#C9A24D]/30 space-y-2 text-xs text-amber-100">
            <div className="flex items-center gap-2 font-bold text-amber-200">
              <ShieldCheck className="w-4 h-4 text-[#C9A24D]" />
              <span>تعليمات المادة 23 المعتمدة:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-300">
              <li>
                <strong className="text-amber-200">الربط الآلي:</strong> عند رفع الملف يتم ربط كل أستاذ تلقائياً بأقسامه (كلاسته) وأفواجه المسندة.
              </li>
              <li>
                <strong className="text-amber-200">إضافة الأدوار يدوياً:</strong> الأدوار والصلاحيات يتم تحديدها وتأكيدها من طرف الإدارة لضمان الحماية.
              </li>
              <li>
                <strong className="text-amber-200">السرية:</strong> البيانات التعاقدية والمالية (الراتب) مقيدة حصراً بصلاحيات الإدارة.
              </li>
            </ul>
          </div>

          {/* Role selector ("الأدوار تضاف يدويا") */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-brand-400" />
              <span>تحديد الدور الوظيفي للملف المرفوع (الأدوار تضاف يدوياً):</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-950 border border-luxury-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#C9A24D] focus:outline-none"
            >
              <option value="teacher">أستاذ / معلم (Teacher)</option>
              <option value="general_supervisor">مشرف عام (General Supervisor)</option>
              <option value="pedagogical_supervisor">مشرف تربوي (Pedagogical Supervisor)</option>
              <option value="receptionist">موظف استقبال (Receptionist)</option>
            </select>
          </div>

          {/* Upload Dropzone */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-[#C9A24D]" />
                <span>ملف Excel (.xlsx / .xls):</span>
              </label>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-xs text-[#C9A24D] hover:underline flex items-center gap-1 font-bold"
              >
                <Download className="w-3.5 h-3.5" />
                تحميل النموذج المعتمد (Template Excel)
              </button>
            </div>

            <div className="border-2 border-dashed border-luxury-border hover:border-[#C9A24D]/60 rounded-2xl p-6 text-center transition-all bg-slate-950/40 relative">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#7B1E3A]/20 text-[#C9A24D] flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                {file ? (
                  <div>
                    <p className="text-sm font-bold text-emerald-400">{file.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-slate-300">
                      اسحب الملف إلى هنا أو <span className="text-[#C9A24D] underline">تصفح جهازك</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      يدعم أعمدة: الاسم، اللقب، البريد، الهاتف، المادة، الطور، الأقسام، الأفواج، العقد، الراتب
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Result Feedback */}
          {importResult && (
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>{importResult.message}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-800/40">
                  <span className="text-slate-400 block text-[10px]">الأساتذة المعالجون</span>
                  <span className="font-bold text-lg text-white font-mono">{importResult.count || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-800/40">
                  <span className="text-slate-400 block text-[10px]">الأقسام المربوطة</span>
                  <span className="font-bold text-lg text-emerald-400 font-mono">
                    {importResult.linkedClassesTotal || 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-800/40">
                  <span className="text-slate-400 block text-[10px]">الأفواج المربوطة</span>
                  <span className="font-bold text-lg text-amber-300 font-mono">
                    {importResult.linkedGroupsTotal || 0}
                  </span>
                </div>
              </div>

              {importResult.teachers && importResult.teachers.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1 text-xs border-t border-emerald-900/40 pt-2">
                  {importResult.teachers.map((t, idx) => (
                    <div
                      key={t._id || idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 text-slate-300"
                    >
                      <span className="font-semibold text-white">{t.name}</span>
                      <span className="text-[11px] text-slate-400">{t.email}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 font-mono">
                        {t.classesCount} أقسام / {t.groupsCount} أفواج
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-luxury-border/40">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
          >
            {importResult ? 'إغلاق' : 'إلغاء'}
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={loading || !file}
            className="px-6 py-2.5 rounded-xl bg-[#7B1E3A] hover:bg-[#60162c] text-white text-sm font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#C9A24D]" />
                <span>جاري المعالجة والربط الآلي...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 text-[#C9A24D]" />
                <span>بدء الاستيراد والربط بالأقسام والأفواج</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
