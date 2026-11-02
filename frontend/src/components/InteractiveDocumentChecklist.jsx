import React, { useState } from 'react';
import {
  FileCheck,
  Upload,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  FileText,
  Image as ImageIcon,
  CheckSquare,
  Square,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const OFFICIAL_ENROLLMENT_DOCS = [
  {
    key: 'birthCertificate',
    label: 'شهادة الميلاد الأصلية الحديثة',
    french: 'Extrait de naissance original récent',
    required: true,
    hint: 'نسخة أصلية أو مصادق عليها حديثة الاستخراج (أقل من 3 أشهر)',
  },
  {
    key: 'photos',
    label: 'الصور الشمسية الحديثة (04 صور)',
    french: "Photos d'identité récentes (x4)",
    required: true,
    hint: 'خلفية بيضاء مع كتابة اسم ولقب التلميذ خلف كل صورة',
  },
  {
    key: 'medicalCertificate',
    label: 'الشهادة الطبية العامة وفصيلة الدم',
    french: 'Certificat médical & Carte de groupage',
    required: true,
    hint: 'شهادة طبية عامة وصدرية تثبت قدرة التلميذ على مزاولة النشاط البدني',
  },
  {
    key: 'vaccinationRecord',
    label: 'كراس أو دفتر التلقيح الصحي',
    french: 'Carnet de santé & vaccination',
    required: true,
    hint: 'نسخة من صفحات التلاقيح الإلزامية بالدفتر الصحي المدرسي',
  },
  {
    key: 'schoolCertificate',
    label: 'الشهادة المدرسية / كشف نقاط الانتقال',
    french: 'Certificat de scolarité / Bulletin de passage',
    required: false,
    hint: 'الشهادة المدرسية للعام المنصرم للمحولين أو كشف نقاط الفصل الأخير',
  },
  {
    key: 'signedCharter',
    label: 'التعهد المدرسي والنظام الداخلي المصادق عليه',
    french: 'Règlement intérieur & Engagement légalisé',
    required: true,
    hint: 'وثيقة التعهد والتزام الولي بنظام المؤسسة مصادق عليها',
  },
];

export default function InteractiveDocumentChecklist({
  documentsSubmitted = {},
  documentFiles = {},
  documentReferences = {},
  onChange,
  readOnly = false,
  isDark = false,
}) {
  const { accessToken } = useAuthStore();
  const [uploadingKey, setUploadingKey] = useState(null);
  const [uploadError, setUploadError] = useState('');

  const handleToggleCheck = (key) => {
    if (readOnly) return;
    const updatedSubmitted = {
      ...documentsSubmitted,
      [key]: !documentsSubmitted[key],
    };
    if (onChange) {
      onChange(updatedSubmitted, documentFiles, documentReferences);
    }
  };

  const handleReferenceChange = (key, value) => {
    if (readOnly) return;
    const updatedRefs = {
      ...documentReferences,
      [key]: value,
    };
    if (onChange) {
      onChange(documentsSubmitted, documentFiles, updatedRefs);
    }
  };

  const handleFileUpload = async (key, file) => {
    if (!file || readOnly) return;
    setUploadingKey(key);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = accessToken || localStorage.getItem('zitouni_access_token') || localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/admin/students/upload-doc`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const uploadedUrl = res.data.url;
      const updatedFiles = {
        ...documentFiles,
        [key]: uploadedUrl,
      };
      // Auto-check submitted box when file is attached
      const updatedSubmitted = {
        ...documentsSubmitted,
        [key]: true,
      };

      if (onChange) {
        onChange(updatedSubmitted, updatedFiles, documentReferences);
      }
    } catch (err) {
      console.error('File upload failed:', err);
      setUploadError(`فشل رفع الوثيقة: ${err.response?.data?.message || err.message}`);
    } finally {
      setUploadingKey(null);
    }
  };

  const handleRemoveFile = (key) => {
    if (readOnly) return;
    const updatedFiles = {
      ...documentFiles,
      [key]: '',
    };
    if (onChange) {
      onChange(documentsSubmitted, updatedFiles, documentReferences);
    }
  };

  const isPdf = (url = '') => url.toLowerCase().endsWith('.pdf');

  return (
    <div className="space-y-4 font-sans text-right" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#7B1E3A]/10 border border-[#7B1E3A]/20 flex items-center justify-center text-[#7B1E3A]">
            <FileCheck className="w-4.5 h-4.5 text-[#7B1E3A]" />
          </div>
          <div>
            <h4 className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-[#7B1E3A]'}`}>
              تدقيق ومرفقات الوثائق المطلوبة (Checklist des documents - البند 5)
            </h4>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              قم بالتأشير على الوثائق المستلمة مع إمكانية رفع الملفات الرقمية (PDF أو صور) وتدوين مراجعها الرسمية.
            </p>
          </div>
        </div>

        {/* Counter Pill */}
        <div className="flex items-center gap-2 shrink-0">
          {(() => {
            const checkedCount = OFFICIAL_ENROLLMENT_DOCS.filter((d) => documentsSubmitted[d.key]).length;
            const attachedCount = OFFICIAL_ENROLLMENT_DOCS.filter((d) => documentFiles[d.key]).length;
            return (
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                {checkedCount} / {OFFICIAL_ENROLLMENT_DOCS.length} مستلم ({attachedCount} مرفق رقمياً)
              </span>
            );
          })()}
        </div>
      </div>

      {uploadError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Grid of Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {OFFICIAL_ENROLLMENT_DOCS.map((doc) => {
          const isChecked = !!documentsSubmitted[doc.key];
          const fileUrl = documentFiles[doc.key] || '';
          const refValue = documentReferences[doc.key] || '';
          const isUploading = uploadingKey === doc.key;
          const inputId = `doc-file-input-${doc.key}`;

          return (
            <div
              key={doc.key}
              className={`p-3.5 rounded-2xl border transition-all ${
                isDark
                  ? isChecked
                    ? 'bg-slate-900/60 border-brand-500/50 shadow-xs'
                    : 'bg-slate-950/40 border-luxury-border/60'
                  : isChecked
                  ? 'bg-[#FDFBF7] border-[#C9A24D]/50 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-[#C9A24D]/30'
              }`}
            >
              {/* Header: Checkbox + Title + Status Pill */}
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleCheck(doc.key)}
                  disabled={readOnly}
                  className="flex items-center gap-2.5 text-right cursor-pointer group"
                >
                  <div className="shrink-0 mt-0.5">
                    {isChecked ? (
                      <CheckSquare className="w-4.5 h-4.5 text-[#7B1E3A]" />
                    ) : (
                      <Square className={`w-4.5 h-4.5 ${isDark ? 'text-slate-500' : 'text-slate-400'} group-hover:text-[#7B1E3A]`} />
                    )}
                  </div>
                  <div>
                    <span className={`font-bold text-xs block ${isDark ? 'text-slate-100' : 'text-[#2B2022]'}`}>
                      {doc.label}
                    </span>
                    <span className={`text-[10px] block leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {doc.hint}
                    </span>
                  </div>
                </button>

                {/* Status indicator */}
                <div className="shrink-0">
                  {fileUrl ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[9.5px]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      مرفق رقمياً
                    </span>
                  ) : isChecked ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-extrabold text-[9.5px]">
                      مستلم ورقياً
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium text-[9.5px]">
                      في الانتظار
                    </span>
                  )}
                </div>
              </div>

              {/* Action Toolbar: File Attachment & Reference Input */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                {/* File Attachment Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  {fileUrl ? (
                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-300/60 px-2.5 py-1 rounded-xl text-[11px] font-bold">
                      {isPdf(fileUrl) ? (
                        <FileText className="w-3.5 h-3.5 text-emerald-700" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                      )}
                      <span className="truncate max-w-[130px] font-mono text-[10px]" dir="ltr">
                        {fileUrl.split('/').pop()}
                      </span>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 hover:bg-emerald-200 rounded text-emerald-800 transition-colors ml-1"
                        title="معاينة الملف المرفق في نافذة جديدة"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(doc.key)}
                          className="p-1 hover:bg-rose-100 text-rose-600 rounded transition-colors cursor-pointer"
                          title="حذف هذا المرفق"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        id={inputId}
                        accept="application/pdf,image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(doc.key, e.target.files[0]);
                          }
                        }}
                        disabled={readOnly || isUploading}
                      />
                      <label
                        htmlFor={inputId}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                          isUploading
                            ? 'bg-slate-100 text-slate-400 border-slate-300'
                            : isDark
                            ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-luxury-border'
                            : 'bg-white hover:bg-[#F3E9DC]/60 text-slate-700 border-[#C9A24D]/40 shadow-2xs hover:text-[#7B1E3A]'
                        }`}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#7B1E3A]" />
                            <span>جاري الرفع...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5 text-[#C9A24D]" />
                            <span>إرفاق وثيقة (PDF / صورة)</span>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>

                {/* Optional Document Reference Input */}
                <div className="flex-1 sm:max-w-[190px]">
                  <input
                    type="text"
                    value={refValue}
                    onChange={(e) => handleReferenceChange(doc.key, e.target.value)}
                    placeholder="رقم الوثيقة أو تاريخها..."
                    disabled={readOnly}
                    className={`w-full px-2.5 py-1 text-[11px] rounded-xl border transition-colors ${
                      isDark
                        ? 'bg-slate-950/60 border-luxury-border/80 text-white placeholder-slate-600 focus:border-brand-500'
                        : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-[#7B1E3A]'
                    }`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
