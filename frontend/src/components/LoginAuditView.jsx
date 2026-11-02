import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Search,
  RefreshCw,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Clock,
  UserCheck,
  Users,
  Filter,
  Calendar,
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const roleLabels = {
  admin: 'المدير العام',
  school: 'الإدارة المدرسية',
  general_supervisor: 'المراقب العام',
  pedagogical_supervisor: 'المراقب التربوي',
  teacher: 'أستاذ',
  student: 'تلميذ',
  parent: 'ولي أمر',
  receptionist: 'موظف الاستقبال',
  unknown: 'غير محدد',
};

const roleBadges = {
  admin: 'bg-[#7B1E3A]/10 text-[#7B1E3A] border-[#7B1E3A]/30',
  school: 'bg-[#7B1E3A]/10 text-[#7B1E3A] border-[#7B1E3A]/30',
  general_supervisor: 'bg-[#C9A24D]/15 text-[#7B1E3A] border-[#C9A24D]/40',
  pedagogical_supervisor: 'bg-[#C9A24D]/15 text-[#7B1E3A] border-[#C9A24D]/40',
  teacher: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  receptionist: 'bg-cyan-50 text-cyan-800 border-cyan-300',
  parent: 'bg-blue-50 text-blue-800 border-blue-300',
  student: 'bg-[#F3E9DC] text-[#2B2022] border-[#C9A24D]/35',
  unknown: 'bg-slate-100 text-slate-700 border-slate-300',
};

export default function LoginAuditView() {
  const { accessToken } = useAuthStore();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalToday: 0,
    successToday: 0,
    failedToday: 0,
    lockedToday: 0,
    successRate: 100,
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = accessToken || localStorage.getItem('zitouni_access_token') || localStorage.getItem('token');
      const params = {
        page,
        limit: 20,
        status: statusFilter,
        role: roleFilter,
        search,
      };
      const res = await axios.get(`${API_URL}/admin/login-logs`, {
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setLogs(res.data.logs || []);
      setStats(res.data.stats || {});
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch login logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, statusFilter, roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleUnlockUser = async (userId, userName) => {
    if (!userId) return;
    try {
      const token = accessToken || localStorage.getItem('zitouni_access_token') || localStorage.getItem('token');
      await axios.post(
        `${API_URL}/admin/users/${userId}/unlock`,
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      setActionSuccess(`تم رفع الحظر بنجاح عن حساب ${userName}`);
      setTimeout(() => setActionSuccess(''), 4000);
      fetchLogs();
    } catch (err) {
      alert('فشل في رفع الحظر: ' + (err.response?.data?.message || err.message));
    }
  };

  const renderDeviceIcon = (device = '') => {
    if (device.toLowerCase().includes('mobile')) return <Smartphone className="w-4 h-4 text-emerald-600" />;
    if (device.toLowerCase().includes('tablet')) return <Tablet className="w-4 h-4 text-cyan-600" />;
    return <Monitor className="w-4 h-4 text-slate-600" />;
  };

  return (
    <div dir="rtl" className="space-y-6 font-sans">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border border-[#C9A24D]/30 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-10 h-10 rounded-2xl bg-[#7B1E3A]/10 text-[#7B1E3A] border border-[#7B1E3A]/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#7B1E3A]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-[#7B1E3A]">
                سجل تسجيل الدخول والجلسات الرقمية
              </h2>
              <p className="text-xs text-[#2B2022]/70 font-medium">
                مراقبة حية لمحاولات الدخول، الأجهزة المتصلة، وعمليات التجميد التلقائي (المادتان 5 و20)
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#C9A24D]/40 bg-[#F3E9DC] hover:bg-[#ebdcc7] text-[#7B1E3A] font-bold text-xs transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث السجل</span>
        </button>
      </div>

      {/* Success Notification Alert */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Today */}
        <div className="p-4 rounded-2xl bg-white border border-[#C9A24D]/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#2B2022]/70">
            <span>تسجيلات اليوم</span>
            <Users className="w-4 h-4 text-[#7B1E3A]" />
          </div>
          <div className="text-2xl font-black font-serif text-[#7B1E3A]">
            {stats.totalToday}
          </div>
          <span className="text-[10px] text-emerald-700 font-bold block">
            نسبة النجاح: {stats.successRate}%
          </span>
        </div>

        {/* Success Today */}
        <div className="p-4 rounded-2xl bg-white border border-[#C9A24D]/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#2B2022]/70">
            <span>الدخول الناجح</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-serif text-emerald-700">
            {stats.successToday}
          </div>
          <span className="text-[10px] text-slate-500 block">جلسات نشطة ومصادق عليها</span>
        </div>

        {/* Failed Today */}
        <div className="p-4 rounded-2xl bg-white border border-[#C9A24D]/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#2B2022]/70">
            <span>محاولات خاطئة</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black font-serif text-rose-700">
            {stats.failedToday}
          </div>
          <span className="text-[10px] text-slate-500 block">كلمات مرور أو معرفات غير صحيحة</span>
        </div>

        {/* Locked Accounts */}
        <div className="p-4 rounded-2xl bg-white border border-[#C9A24D]/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#2B2022]/70">
            <span>الحظر المؤقت (5 دقائق)</span>
            <Lock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black font-serif text-amber-600">
            {stats.lockedToday}
          </div>
          <span className="text-[10px] text-amber-800 font-medium block">تجاوز 4 محاولات خاطئة</span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 bg-white border border-[#C9A24D]/30 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم، رقم الهاتف، IP..."
            className="w-full pr-9 pl-3 py-2 text-xs bg-[#FDFBF7] border border-[#C9A24D]/30 rounded-xl focus:outline-none focus:border-[#7B1E3A] text-[#2B2022]"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-[#FDFBF7] border border-[#C9A24D]/30 rounded-xl text-[#2B2022] font-semibold focus:outline-none"
            >
              <option value="ALL">كل الحالات</option>
              <option value="SUCCESS">ناجح (SUCCESS)</option>
              <option value="FAILED">فاشل (FAILED)</option>
              <option value="LOCKED_5MIN">محظور 5 دقائق (LOCKED)</option>
            </select>
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-[#FDFBF7] border border-[#C9A24D]/30 rounded-xl text-[#2B2022] font-semibold focus:outline-none"
          >
            <option value="ALL">جميع الرتب والأدوار</option>
            <option value="admin">مدير النظام</option>
            <option value="general_supervisor">مراقب عام</option>
            <option value="pedagogical_supervisor">مراقب تربوي</option>
            <option value="teacher">أستاذ</option>
            <option value="student">تلميذ</option>
            <option value="parent">ولي أمر</option>
            <option value="receptionist">استقبال</option>
          </select>
        </div>
      </div>

      {/* Main Logs Table */}
      <div className="bg-white border border-[#C9A24D]/30 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#F3E9DC]/60 border-b border-[#C9A24D]/30 text-[#7B1E3A] font-bold">
                <th className="p-3.5 sm:px-4">المستخدم والمعرف</th>
                <th className="p-3.5 sm:px-4">الدور / الرتبة</th>
                <th className="p-3.5 sm:px-4">حالة المحاولة</th>
                <th className="p-3.5 sm:px-4">الجهاز والمتصفح</th>
                <th className="p-3.5 sm:px-4">عنوان IP</th>
                <th className="p-3.5 sm:px-4">التوقيت والتاريخ</th>
                <th className="p-3.5 sm:px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C9A24D]/20 text-[#2B2022]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#7B1E3A]" />
                    <span>جاري تحميل السجلات...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-[#C9A24D]/40" />
                    <span>لا توجد سجلات تسجيل دخول مطابقة للمحددات الحالية.</span>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isSuccess = log.status === 'SUCCESS';
                  const isLocked = log.status === 'LOCKED_5MIN' || log.status === 'PERMANENTLY_LOCKED';
                  const isFailed = log.status === 'FAILED';

                  return (
                    <tr key={log._id} className="hover:bg-[#FDFBF7] transition-colors">
                      <td className="p-3.5 sm:px-4">
                        <div className="font-bold text-[#2B2022]">
                          {log.userName || log.identifier}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono block">
                          {log.identifier}
                        </span>
                      </td>

                      <td className="p-3.5 sm:px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            roleBadges[log.role] || roleBadges.unknown
                          }`}
                        >
                          {roleLabels[log.role] || log.role}
                        </span>
                      </td>

                      <td className="p-3.5 sm:px-4">
                        {isSuccess && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>دخول ناجح</span>
                          </span>
                        )}
                        {isLocked && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                            <Lock className="w-3.5 h-3.5 text-amber-600" />
                            <span>حظر 5 دقائق</span>
                          </span>
                        )}
                        {isFailed && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-300">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>محاولة فاشلة</span>
                          </span>
                        )}
                        {log.failureReason && (
                          <p className="text-[10px] text-rose-700/80 mt-1 max-w-[180px] truncate" title={log.failureReason}>
                            {log.failureReason}
                          </p>
                        )}
                      </td>

                      <td className="p-3.5 sm:px-4">
                        <div className="flex items-center gap-2">
                          {renderDeviceIcon(log.device)}
                          <div>
                            <span className="font-semibold block">{log.device || 'Desktop'}</span>
                            <span className="text-[10px] text-slate-500">
                              {log.browser} • {log.os}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 sm:px-4 font-mono text-[11px] text-slate-600">
                        {log.ipAddress || '127.0.0.1'}
                      </td>

                      <td className="p-3.5 sm:px-4">
                        <div className="text-[11px] font-medium text-slate-700">
                          {new Date(log.createdAt).toLocaleDateString('ar-DZ', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 block" dir="ltr">
                          {new Date(log.createdAt).toLocaleTimeString('ar-DZ', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </td>

                      <td className="p-3.5 sm:px-4 text-center">
                        {isLocked && (log.user || log.identifier) ? (
                          <button
                            type="button"
                            onClick={() => handleUnlockUser(log.user || log.identifier, log.userName || log.identifier)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[10px] transition-all shadow-xs cursor-pointer"
                            title="رفع الحظر الفوري عن هذا الحساب"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>فك الحظر الآن</span>
                          </button>
                        ) : (
                          <span className="text-slate-300 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#C9A24D]/30 bg-[#F3E9DC]/30 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              الصفحة {page} من {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-[#C9A24D]/30 bg-white hover:bg-slate-50 disabled:opacity-40 font-bold cursor-pointer"
              >
                السابق
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-[#C9A24D]/30 bg-white hover:bg-slate-50 disabled:opacity-40 font-bold cursor-pointer"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
