import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, Download, CheckCircle, AlertTriangle, X, RefreshCw, Users, BookOpen } from 'lucide-react';

export default function StudentExcelImportModal({ isOpen, onClose, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreviewData(null);
      setImportResult(null);
      setErrorMsg('');
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setErrorMsg('يرجى اختيار ملف إكسل أولاً');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('previewOnly', 'true');

      const token = localStorage.getItem('zitouni_access_token');
      const res = await axios.post('/api/import/students-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setPreviewData(res.data?.summary || null);
      setLoading(false);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'حدث خطأ أثناء فحص ملف الإكسل');
      setLoading(false);
    }
  };

  const handleFinalImport = async () => {
    if (!file) return;

    try {
      setLoading(true);
      setErrorMsg('');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('previewOnly', 'false');

      const token = localStorage.getItem('zitouni_access_token');
      const res = await axios.post('/api/import/students-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setImportResult(res.data?.summary || null);
      setLoading(false);
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'حدث خطأ أثناء استيراد البيانات');
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.open('/api/import/students-template', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-slate-900 border border-luxury-border rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl relative max-h-[90vh] flex flex-col font-cairo"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-luxury-border/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-500 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">استيراد التلاميذ عبر Excel (School Story)</h3>
              <p className="text-xs text-slate-400">
                إنشاء تلقائي للتلاميذ والأقسام وحسابات الأولياء وفق نموذج الرقمنة الرسمي
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6">
          {/* Download Official Template Callout */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-luxury-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-right">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">تحميل النموذج المعتمد للمؤسسة</p>
                <p className="text-[11px] text-slate-400">
                  ملف « ملف استيراد الطلاب (School Story) » المكون من ورقتي: قائمة التلاميذ و Classes
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap border border-white/10"
            >
              <Download className="w-4 h-4 text-brand-500" />
              <span>تحميل النموذج (.xls)</span>
            </button>
          </div>

          {/* Upload Area */}
          <div className="p-6 border-2 border-dashed border-luxury-border rounded-2xl text-center bg-slate-950/30 hover:border-brand-500/40 transition-colors">
            <Upload className="w-10 h-10 text-brand-500 mx-auto mb-3 opacity-80" />
            <p className="text-sm font-bold text-white mb-1">اختر ملف الإكسل المكتمل أو اسحبه هنا</p>
            <p className="text-xs text-slate-400 mb-4">الصيغ المدعومة: .xls أو .xlsx (حد أقصى 50 ميغابايت)</p>

            <label className="cursor-pointer py-2.5 px-6 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-extrabold text-xs transition-all shadow-md inline-block">
              <span>تصفح الملفات من جهازك</span>
              <input type="file" accept=".xls,.xlsx" onChange={handleFileChange} className="hidden" />
            </label>

            {file && (
              <div className="mt-4 p-3 rounded-xl bg-slate-800/80 border border-luxury-border inline-flex items-center gap-3 text-xs text-white">
                <FileSpreadsheet className="w-4 h-4 text-green-400" />
                <span className="font-bold">{file.name}</span>
                <span className="text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview Results Table */}
          {previewData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-950/70 border border-luxury-border rounded-xl">
                  <span className="text-slate-400 text-[10px] block font-bold">إجمالي السطور</span>
                  <span className="text-lg font-black text-white">{previewData.totalRows}</span>
                </div>
                <div className="p-3 bg-slate-950/70 border border-luxury-border rounded-xl">
                  <span className="text-slate-400 text-[10px] block font-bold">تلاميذ مؤهلين</span>
                  <span className="text-lg font-black text-green-400">{previewData.preview?.length || 0}</span>
                </div>
                <div className="p-3 bg-slate-950/70 border border-luxury-border rounded-xl">
                  <span className="text-slate-400 text-[10px] block font-bold">أقسام جديدة</span>
                  <span className="text-lg font-black text-blue-400">{previewData.classesCreatedCount || 0}</span>
                </div>
                <div className="p-3 bg-slate-950/70 border border-luxury-border rounded-xl">
                  <span className="text-slate-400 text-[10px] block font-bold">أخطاء في السطور</span>
                  <span className="text-lg font-black text-red-400">{previewData.errorsCount || 0}</span>
                </div>
              </div>

              {/* Preview Rows Table */}
              {previewData.preview && previewData.preview.length > 0 && (
                <div className="border border-luxury-border rounded-2xl overflow-hidden bg-slate-950/50">
                  <div className="p-3 bg-slate-800/60 border-b border-luxury-border flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-brand-500" />
                      <span>عينة من قائمة التلاميذ المفحوصة ({previewData.preview.length})</span>
                    </span>
                    <span className="text-[11px] text-brand-400">جاهز للتنفيذ</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-900/80 text-slate-400 text-[11px] sticky top-0">
                        <tr>
                          <th className="p-2.5">السطر</th>
                          <th className="p-2.5">رقم الرقمنة</th>
                          <th className="p-2.5">الاسم واللقب (عربي)</th>
                          <th className="p-2.5">القسم</th>
                          <th className="p-2.5">تاريخ الميلاد</th>
                          <th className="p-2.5">هاتف الولي</th>
                          <th className="p-2.5">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-luxury-border/30 text-slate-200">
                        {previewData.preview.slice(0, 50).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30">
                            <td className="p-2.5 text-slate-400">{row.row}</td>
                            <td className="p-2.5 font-mono text-brand-400">{row.nationalId}</td>
                            <td className="p-2.5 font-bold">{row.fullNameAr || row.fullNameFr}</td>
                            <td className="p-2.5">{row.className}</td>
                            <td className="p-2.5 text-slate-400">{row.dob}</td>
                            <td className="p-2.5 font-mono text-slate-300">{row.fatherPhone || row.motherPhone || '—'}</td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] border border-blue-500/20">
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Errors List if any */}
              {previewData.errors && previewData.errors.length > 0 && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl space-y-1">
                  <p className="text-xs font-bold text-red-400">ملاحظات وأخطاء تتطلب الانتباه :</p>
                  <ul className="text-[11px] text-red-300 list-disc list-inside space-y-0.5 max-h-32 overflow-y-auto">
                    {previewData.errors.map((err, i) => (
                      <li key={i}>
                        السطر {err.row} ({err.name || err.nationalId}) : {err.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Final Success Result Message */}
          {importResult && (
            <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20 text-right space-y-4">
              <div className="flex items-center gap-3 text-green-400 font-bold">
                <CheckCircle className="w-6 h-6" />
                <span className="text-base">تمت عملية الاستيراد والإنشاء بنجاح تام!</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-slate-900 rounded-xl border border-luxury-border">
                  <span className="text-slate-400 block mb-1">تلاميذ تم إنشاؤهم</span>
                  <span className="text-xl font-black text-green-400">{importResult.importedCount}</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-luxury-border">
                  <span className="text-slate-400 block mb-1">تلاميذ تم تحديثهم</span>
                  <span className="text-xl font-black text-blue-400">{importResult.updatedCount}</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-luxury-border">
                  <span className="text-slate-400 block mb-1">أقسام ومجموعات أُنشئت</span>
                  <span className="text-xl font-black text-amber-400">{importResult.classesCreatedCount}</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                * تم تلقائياً إنشاء حسابات الدخول للأولياء (كلمة المرور = رقم الهاتف) والتلاميذ (كلمة المرور = تاريخ الميلاد) وربط الأبناء بملفات أوليائهم بدقة.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-luxury-border/40 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
          >
            إغلاق
          </button>

          <div className="flex items-center gap-3">
            {!previewData && !importResult && (
              <button
                type="button"
                onClick={handlePreview}
                disabled={!file || loading}
                className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-md"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                <span>فحص ومعاينة السطور أولاً</span>
              </button>
            )}

            {previewData && !importResult && (
              <button
                type="button"
                onClick={handleFinalImport}
                disabled={loading}
                className="py-2.5 px-8 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-950 text-xs font-black transition-colors flex items-center gap-2 shadow-lg shadow-brand-500/20"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>اعتماد واستيراد البيانات نهائياً</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
