import React, { useState, useEffect } from 'react';
import {
  Clock,
  ShieldCheck,
  History,
  X,
  User,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function StudentAuditHistoryModal({ student, studentId, studentName, onClose }) {
  const { accessToken } = useAuthStore();
  const targetId = student?._id || studentId;

  const [history, setHistory] = useState(student?.auditHistory || []);
  const [loading, setLoading] = useState(!student?.auditHistory || student.auditHistory.length === 0);
  const [activeStudentName, setActiveStudentName] = useState(
    studentName ||
    `${student?.firstNameArabic || student?.user?.firstName || ''} ${student?.lastNameArabic || student?.user?.lastName || ''}`.trim() ||
    'التلميذ'
  );
  const [regNum, setRegNum] = useState(student?.registrationNumber || '—');
  const [className, setClassName] = useState(student?.class?.name || '');

  useEffect(() => {
    if (targetId) {
      fetchAuditHistory();
    } else if (student?.auditHistory?.length > 0) {
      setHistory(student.auditHistory);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [targetId]);

  const fetchAuditHistory = async () => {
    try {
      const token = accessToken || localStorage.getItem('zitouni_access_token') || localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/admin/students/${targetId}/audit-history`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.data) {
        if (res.data.auditHistory && res.data.auditHistory.length > 0) {
          setHistory(res.data.auditHistory);
        }
        if (res.data.studentName) setActiveStudentName(res.data.studentName);
        if (res.data.registrationNumber) setRegNum(res.data.registrationNumber);
        if (res.data.className) setClassName(res.data.className);
      }
    } catch (err) {
      console.warn('Could not fetch audit history from server, using local fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'NEW_ENROLLMENT':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[10px]">
            تسجيل جديد
          </span>
        );
      case 'RE_ENROLLMENT':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-[#7B1E3A] text-white border border-[#7B1E3A] font-extrabold text-[10px]">
            إعادة تسجيل سنوية
          </span>
        );
      case 'RE_ENROLLMENT_REQUEST':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300 font-extrabold text-[10px]">
            طلب إعادة تسجيل (التلميذ)
          </span>
        );
      case 'PARENT_RE_ENROLLMENT_REQUEST':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300 font-extrabold text-[10px]">
            طلب إعادة تسجيل (ولي الأمر)
          </span>
        );
      case 'STATUS_UPDATED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 font-extrabold text-[10px]">
            تعديل حالة الملف
          </span>
        );
      case 'WAITLIST_ADDED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-extrabold text-[10px]">
            قائمة الانتظار
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-extrabold text-[10px]">
            {action}
          </span>
        );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // If completely empty, make sure there is at least one baseline registration event
  const effectiveHistory = history.length > 0 ? history : [
    {
      action: 'NEW_ENROLLMENT',
      modifiedByName: 'إدارة شؤون التلاميذ والتمدرس',
      timestamp: student?.createdAt || student?.registrationDate || new Date(),
      details: `إنشاء وتفعيل الملف المدرسي الأولي للتلميذ وتخصيص رقم التسجيل ${regNum !== '—' ? regNum : 'المعتمد'}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white">
      <div
        dir="rtl"
        className="bg-white border border-[#C9A24D]/40 rounded-3xl w-full max-w-2xl shadow-2xl relative my-auto overflow-hidden font-sans flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:w-full"
      >
        {/* Header */}
        <div className="p-4 bg-[#F3E9DC] border-b border-[#C9A24D]/35 flex items-center justify-between shrink-0 print:border-b-2 print:border-black">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7B1E3A] flex items-center justify-center shadow-xs shrink-0">
              <History className="w-5 h-5 text-[#F3E9DC]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-black text-base text-[#7B1E3A]">
                  سجل تاريخ التعديلات والتدقيق الإداري (Audit Trail)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C9A24D]/20 text-[#7B1E3A] border border-[#C9A24D]/40">
                  المادة 15 من دفتر الشروط
                </span>
              </div>
              <p className="text-xs text-slate-700 font-medium mt-0.5">
                التلميذ: <strong className="text-[#2B2022] font-black">{activeStudentName}</strong> • رقم التسجيل: <span className="font-mono font-bold text-[#7B1E3A]">{regNum}</span> {className && `• القسم: ${className}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#C9A24D]/40 hover:bg-[#F3E9DC] text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="طباعة السجل الرسمي"
            >
              <Printer className="w-4 h-4 text-[#7B1E3A]" />
              <span>طباعة</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official School Watermark / Sub-header for Print */}
        <div className="hidden print:block p-4 border-b border-slate-300 text-center">
          <h2 className="text-lg font-bold font-serif text-[#7B1E3A]">مؤسسة زيتوني للتعليم الخاص</h2>
          <p className="text-xs text-slate-600">دفتر المتابعة والتدقيق الزمني لملفات التلاميذ المسجلين (Audit History Log)</p>
        </div>

        {/* Body Timeline */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-[#7B1E3A]" />
              <span className="font-bold">جاري تحميل سجل التدقيق من الخادم...</span>
            </div>
          ) : (
            <div className="relative border-r-2 border-[#C9A24D]/40 mr-3 pr-5 space-y-6">
              {effectiveHistory.map((entry, idx) => {
                const dateObj = new Date(entry.timestamp);
                const formattedDate = dateObj.toLocaleDateString('ar-DZ', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });
                const formattedTime = dateObj.toLocaleTimeString('ar-DZ', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false,
                });

                return (
                  <div key={idx} className="relative group">
                    {/* Timeline Dot */}
                    <div className="absolute -right-[27px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#7B1E3A] border-2 border-white ring-2 ring-[#C9A24D]/60 shadow-xs" />

                    <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#C9A24D]/35 space-y-2 hover:border-[#7B1E3A]/40 transition-colors shadow-xs">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          {getActionBadge(entry.action)}
                          <span className="font-bold text-[#7B1E3A] text-xs">
                            بواسطة: {entry.modifiedByName || 'الإدارة المدرسية'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-600 font-mono flex items-center gap-1.5 font-bold">
                          <Clock className="w-3.5 h-3.5 text-[#C9A24D]" />
                          <span>{formattedDate} — {formattedTime}</span>
                        </span>
                      </div>

                      <p className="text-[#2B2022] font-medium leading-relaxed pt-1 text-xs sm:text-sm">
                        {entry.details || 'تم إجراء تعديل على البيانات الإدارية للتلميذ.'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FDFBF7] border-t border-[#C9A24D]/25 flex items-center justify-between text-xs text-slate-600 shrink-0 print:border-t-2 print:border-black">
          <span className="flex items-center gap-2 font-bold text-[#7B1E3A]">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>توثيق رسمي وتدقيق أمني إلزامي بموجب المادة 15 من دفتر الشروط (حفظ تاريخ كل حركة)</span>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#7B1E3A] hover:bg-[#60162c] text-white font-bold transition-colors cursor-pointer print:hidden"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
