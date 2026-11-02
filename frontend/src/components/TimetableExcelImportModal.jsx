import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSpreadsheet, Upload, X, CheckCircle, AlertTriangle,
  RefreshCw, Check, AlertCircle, Layers
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getToken = () => {
  return useAuthStore.getState().accessToken || localStorage.getItem('zitouni_access_token') || localStorage.getItem('token') || '';
};

export default function TimetableExcelImportModal({ isOpen, onClose, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreviewData(null);
      setImportResult(null);
      setErrorMessage('');
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setErrorMessage('يرجى اختيار ملف Excel الخاص بجدول التوقيت (RAN09.DBF.xlsx).');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      const token = getToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('academicYear', academicYear);

      const res = await axios.post(`${API_URL}/timetable/import-excel?previewOnly=true`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setPreviewData(res.data);
    } catch (err) {
      console.error('Error previewing timetable:', err);
      setErrorMessage(err.response?.data?.message || 'فشل في تحليل ملف جدول التوقيت.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const token = getToken();
      const formData = new FormData();
      if (file) formData.append('file', file);
      formData.append('academicYear', academicYear);
      formData.append('replaceExisting', replaceExisting);

      const res = await axios.post(`${API_URL}/timetable/import-excel`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setImportResult(res.data);
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      console.error('Error importing timetable:', err);
      setErrorMessage(err.response?.data?.message || 'فشل في استيراد جدول التوقيت إلى قاعدة البيانات.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header - Prestige Académique */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#C9A24D]/25 bg-[#F3E9DC]/70">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#7B1E3A]/10 border border-[#7B1E3A]/25 flex items-center justify-center text-[#7B1E3A]">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-[#7B1E3A] text-lg">استيراد جدول التوقيت (RAN09.DBF / Excel)</h3>
                <p className="text-xs text-[#2B2022]/70">معالجة آلية متقدمة لجداول الحصص، ترجمة المواد والأقسام، وكشف التعارضات</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#2B2022]/70 hover:text-[#7B1E3A] hover:bg-white/80 rounded-xl transition-colors cursor-pointer border border-[#C9A24D]/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto p-6 space-y-6">
            {/* File Selector and Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#7B1E3A] mb-2 font-serif">
                  ملف جدول التوقيت (RAN09.DBF.xlsx أو Excel مماثل)
                </label>
                <div className="relative border-2 border-dashed border-[#C9A24D]/40 hover:border-[#7B1E3A] rounded-2xl p-6 text-center transition-all bg-white/70">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.dbf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 mx-auto text-[#C9A24D] mb-2" />
                  <p className="text-sm font-bold text-[#2B2022]">
                    {file ? file.name : 'اسحب الملف هنا أو انقر للاختيار'}
                  </p>
                  <p className="text-xs text-[#2B2022]/50 mt-1">يدعم صيغ XLSX, XLS, DBF (النموذج الرسمي RAN09_DBF)</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#7B1E3A] mb-1.5 font-serif">السنة الدراسية</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={e => setAcademicYear(e.target.value)}
                    className="w-full bg-white border border-[#C9A24D]/35 rounded-xl px-3 py-2 text-sm text-[#2B2022] font-mono focus:outline-none focus:border-[#7B1E3A]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="replaceExisting"
                    checked={replaceExisting}
                    onChange={e => setReplaceExisting(e.target.checked)}
                    className="rounded text-[#7B1E3A] focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="replaceExisting" className="text-xs text-[#2B2022]/80 cursor-pointer">
                    استبدال الجداول الحالية لهذه السنة الدراسية
                  </label>
                </div>

                <button
                  onClick={handlePreview}
                  disabled={loading || !file}
                  className="w-full py-2.5 px-4 bg-white hover:bg-[#F3E9DC]/40 text-[#7B1E3A] font-bold rounded-xl text-xs transition-all border border-[#C9A24D]/35 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  {loading && !previewData ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                  <span>معاينة وتحليل الملف</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 text-xs">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Preview Analysis Results */}
            {previewData && (
              <div className="space-y-4 pt-2 border-t border-[#C9A24D]/25">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white border border-[#C9A24D]/30 rounded-xl p-3 text-center shadow-xs">
                    <p className="text-[11px] text-[#2B2022]/70">عدد الحصص الصالحة</p>
                    <p className="text-xl font-serif font-black text-[#7B1E3A] mt-1">{previewData.validSlots}</p>
                  </div>
                  <div className="bg-white border border-[#C9A24D]/30 rounded-xl p-3 text-center shadow-xs">
                    <p className="text-[11px] text-[#2B2022]/70">الأقسام المكتشفة</p>
                    <p className="text-xl font-serif font-black text-[#C9A24D] mt-1">{previewData.divisionsCount}</p>
                  </div>
                  <div className="bg-white border border-[#C9A24D]/30 rounded-xl p-3 text-center shadow-xs">
                    <p className="text-[11px] text-[#2B2022]/70">الأساتذة المكتشفون</p>
                    <p className="text-xl font-serif font-black text-emerald-700 mt-1">{previewData.teachersCount}</p>
                  </div>
                  <div className="bg-white border border-[#C9A24D]/30 rounded-xl p-3 text-center shadow-xs">
                    <p className="text-[11px] text-[#2B2022]/70">التعارضات</p>
                    <p className={`text-xl font-serif font-black mt-1 ${previewData.conflictsCount > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {previewData.conflictsCount}
                    </p>
                  </div>
                </div>

                {/* Conflict Warnings if any */}
                {previewData.conflictsCount > 0 && (
                  <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl">
                    <div className="flex items-center gap-2 text-rose-800 font-bold text-xs mb-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>تنبيه: تم رصد {previewData.conflictsCount} تعارض في التوقيت!</span>
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto text-xs text-rose-800">
                      {previewData.conflicts.map((c, i) => (
                        <p key={i}>• {c.message}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sample parsed entries preview */}
                <div className="border border-[#C9A24D]/25 rounded-xl overflow-hidden bg-white shadow-xs">
                  <div className="bg-[#F3E9DC] px-4 py-2 border-b border-[#C9A24D]/25 text-xs font-serif font-bold text-[#7B1E3A]">
                    نموذج من الحصص المستخرجة
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-[#F3E9DC]/60 text-[#7B1E3A]">
                        <tr>
                          <th className="py-2 px-3">اليوم</th>
                          <th className="py-2 px-3">الحصة</th>
                          <th className="py-2 px-3">القسم</th>
                          <th className="py-2 px-3">المادة</th>
                          <th className="py-2 px-3">الأستاذ</th>
                          <th className="py-2 px-3">الصيغة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#C9A24D]/15 text-[#2B2022]">
                        {previewData.sampleEntries.map((e, idx) => (
                          <tr key={idx} className="hover:bg-[#F3E9DC]/20">
                            <td className="py-1.5 px-3">{e.dayArabic} ({e.day})</td>
                            <td className="py-1.5 px-3 font-mono">{e.hour}</td>
                            <td className="py-1.5 px-3 font-bold text-[#7B1E3A]">{e.divisionArabic || e.division}</td>
                            <td className="py-1.5 px-3">{e.subjectName}</td>
                            <td className="py-1.5 px-3">{e.teacherName}</td>
                            <td className="py-1.5 px-3 font-mono">{e.modality}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Import Success Result */}
            {importResult && (
              <div className="p-5 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-sm shadow-xs">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold">{importResult.message}</p>
                    <p className="text-xs text-emerald-700/80 mt-1">
                      تم تحديث الجداول بنجاح. أصبحت متاحة للأساتذة والتلاميذ وأولياء الأمور والإدارة.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#C9A24D]/25 bg-[#F3E9DC]/70">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[#2B2022]/70 hover:text-[#7B1E3A] text-xs font-bold transition-colors cursor-pointer"
            >
              إغلاق
            </button>

            {previewData && !importResult && (
              <button
                onClick={handleImport}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#7B1E3A] hover:bg-[#62162d] text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-[#7B1E3A]/20 disabled:opacity-50 cursor-pointer border border-[#C9A24D]/30"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>تأكيد الاستيراد والحفظ في قاعدة البيانات</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
