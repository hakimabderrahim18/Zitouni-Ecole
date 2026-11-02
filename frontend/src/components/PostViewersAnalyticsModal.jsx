import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, X, Users, CheckCircle, Search,
  Phone, UserCheck, UserX, RefreshCw
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getToken = () => {
  return localStorage.getItem('zitouni_access_token') || localStorage.getItem('token') || '';
};

const roleLabels = {
  admin: 'مدير النظام',
  school: 'الإدارة العامة',
  teacher: 'أستاذ(ة)',
  parent: 'ولي أمر',
  student: 'تلميذ(ة)',
  general_supervisor: 'مشرف عام',
  pedagogical_supervisor: 'مشرف تربوي',
  receptionist: 'موظف استقبال',
};

export default function PostViewersAnalyticsModal({ isOpen, onClose, postId, postTitle }) {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('viewed'); // 'viewed' | 'notViewed'
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && postId) {
      fetchAnalytics();
    }
  }, [isOpen, postId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await axios.get(`${API_URL}/posts/${postId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalytics(res.data);
    } catch (err) {
      console.error('Error fetching post analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const stats = analytics?.stats || {
    targetCount: 0,
    viewedCount: 0,
    notViewedCount: 0,
    viewRate: 0,
    confirmedCount: 0,
    confirmationRate: 0,
  };

  const rawList = activeTab === 'viewed' ? (analytics?.viewersList || []) : (analytics?.notViewedList || []);

  const filteredList = rawList.filter(item => {
    const user = item.user;
    if (!user) return false;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const username = (user.username || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = fullName.includes(query) || username.includes(query);
    return matchesRole && matchesSearch;
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#C9A24D]/25 bg-[#F3E9DC]/70">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#7B1E3A]/10 border border-[#7B1E3A]/25 flex items-center justify-center text-[#7B1E3A]">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-[#7B1E3A] text-lg">إحصائيات المشاهدة والاطلاع (« من شاهد المنشور؟ »)</h3>
                <p className="text-xs text-[#2B2022]/70 truncate max-w-lg">
                  {postTitle || analytics?.post?.title || 'تقرير شفاف وموثق بموجب المادة 15 من دفتر الشروط'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchAnalytics}
                className="p-2 text-[#2B2022]/70 hover:text-[#7B1E3A] hover:bg-white/80 rounded-xl transition-colors cursor-pointer border border-[#C9A24D]/20"
                title="تحديث الإحصائيات"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-[#2B2022]/70 hover:text-[#7B1E3A] hover:bg-white/80 rounded-xl transition-colors cursor-pointer border border-[#C9A24D]/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto p-6 space-y-6">
            {/* Stat Cards (Art. 15 & 16) */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-[#F3E9DC]/50 border border-[#C9A24D]/30 rounded-2xl p-4 text-center">
                <p className="text-xs text-[#2B2022]/70 font-medium">الحسابات المستهدفة</p>
                <p className="text-2xl font-black text-[#7B1E3A] mt-1 font-serif">{stats.targetCount}</p>
                <p className="text-[10px] text-[#2B2022]/50 mt-0.5">إجمالي الجمهور</p>
              </div>

              <div className="bg-emerald-50/80 border border-emerald-300 rounded-2xl p-4 text-center">
                <p className="text-xs text-emerald-800 font-bold">شاهدوا المنشور</p>
                <p className="text-2xl font-black text-emerald-700 mt-1 font-serif">{stats.viewedCount}</p>
                <p className="text-[10px] text-emerald-700/80 mt-0.5 font-medium">{stats.viewRate}% من الجمهور</p>
              </div>

              <div className="bg-rose-50/80 border border-rose-300 rounded-2xl p-4 text-center">
                <p className="text-xs text-rose-800 font-bold">لم يشاهدوا بعد</p>
                <p className="text-2xl font-black text-rose-700 mt-1 font-serif">{stats.notViewedCount}</p>
                <p className="text-[10px] text-rose-700/80 mt-0.5 font-medium">{100 - stats.viewRate}% لم يفتحوا</p>
              </div>

              <div className="bg-[#C9A24D]/10 border border-[#C9A24D]/35 rounded-2xl p-4 text-center col-span-2 md:col-span-2">
                <p className="text-xs text-[#7B1E3A] font-bold">تأكيد الاطلاع (« اطلعت عليه »)</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <p className="text-2xl font-black text-[#7B1E3A] font-serif">{stats.confirmedCount}</p>
                  <span className="text-xs text-[#C9A24D] font-bold font-mono">({stats.confirmationRate}%)</span>
                </div>
                <p className="text-[10px] text-[#2B2022]/60 mt-0.5">
                  {analytics?.post?.isImportant ? 'إعلان يتطلب تأكيد رسمي' : 'تأكيدات اختيارية'}
                </p>
              </div>
            </div>

            {/* Tabs and Filters */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#F3E9DC]/40 p-3 rounded-2xl border border-[#C9A24D]/25">
              {/* Tab Switcher */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => setActiveTab('viewed')}
                  className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'viewed'
                      ? 'bg-[#7B1E3A] text-white shadow-md shadow-[#7B1E3A]/20'
                      : 'text-[#2B2022]/70 hover:text-[#7B1E3A] bg-white border border-[#C9A24D]/20'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>الذين شاهدوا المنشور ({stats.viewedCount})</span>
                </button>
                <button
                  onClick={() => setActiveTab('notViewed')}
                  className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'notViewed'
                      ? 'bg-rose-700 text-white shadow-md shadow-rose-700/20'
                      : 'text-[#2B2022]/70 hover:text-[#7B1E3A] bg-white border border-[#C9A24D]/20'
                  }`}
                >
                  <UserX className="w-4 h-4" />
                  <span>الذين لم يشاهدوا بعد ({stats.notViewedCount})</span>
                </button>
              </div>

              {/* Filters & Search */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                {/* Search */}
                <div className="relative flex-1 md:w-48">
                  <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#2B2022]/40" />
                  <input
                    type="text"
                    placeholder="بحث بالاسم..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-[#C9A24D]/30 rounded-xl pr-8 pl-3 py-1.5 text-xs text-[#2B2022] placeholder-[#2B2022]/40 focus:outline-none focus:border-[#7B1E3A]"
                  />
                </div>

                {/* Role filter */}
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="bg-white border border-[#C9A24D]/30 text-[#2B2022] text-xs rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
                >
                  <option value="all">كل الأدوار</option>
                  <option value="teacher">الأساتذة</option>
                  <option value="parent">أولياء الأمور</option>
                  <option value="student">التلاميذ</option>
                  <option value="general_supervisor">المشرف العام</option>
                  <option value="pedagogical_supervisor">المشرف التربوي</option>
                </select>
              </div>
            </div>

            {/* List Table */}
            {loading ? (
              <div className="flex items-center justify-center p-12 text-[#2B2022]/60 gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-[#7B1E3A]" />
                <span className="font-medium text-sm">جاري تحميل بيانات المشاهدين...</span>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="p-10 text-center text-[#2B2022]/50 border border-dashed border-[#C9A24D]/30 rounded-2xl bg-white/40">
                <Users className="w-10 h-10 mx-auto text-[#C9A24D]/50 mb-2" />
                <p className="text-sm">لا توجد حسابات تطابق خيارات التصفية الحالية.</p>
              </div>
            ) : (
              <div className="border border-[#C9A24D]/25 rounded-2xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#F3E9DC] text-[#7B1E3A] border-b border-[#C9A24D]/25 font-serif">
                    <tr>
                      <th className="py-3 px-4 font-bold">#</th>
                      <th className="py-3 px-4 font-bold">المستخدم</th>
                      <th className="py-3 px-4 font-bold">الدور</th>
                      {activeTab === 'viewed' ? (
                        <>
                          <th className="py-3 px-4 font-bold">أول مشاهدة</th>
                          <th className="py-3 px-4 font-bold">آخر مشاهدة</th>
                          <th className="py-3 px-4 font-bold text-center">مرات المشاهدة</th>
                          <th className="py-3 px-4 font-bold text-center">تأكيد الاطلاع</th>
                        </>
                      ) : (
                        <>
                          <th className="py-3 px-4 font-bold">الهاتف</th>
                          <th className="py-3 px-4 font-bold text-center">الحالة</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C9A24D]/15 text-[#2B2022]">
                    {filteredList.map((item, index) => {
                      const u = item.user;
                      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || 'مستخدم';
                      return (
                        <tr key={u._id || index} className="hover:bg-[#F3E9DC]/30 transition-colors">
                          <td className="py-2.5 px-4 font-mono text-[#2B2022]/50">{index + 1}</td>
                          
                          {/* User info */}
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-[#7B1E3A]/10 border border-[#C9A24D]/40 flex items-center justify-center font-bold text-[10px] text-[#7B1E3A] overflow-hidden">
                                {u.profilePic ? (
                                  <img src={u.profilePic} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  fullName.charAt(0)
                                )}
                              </div>
                              <span className="font-bold text-[#2B2022] text-xs">{fullName}</span>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F3E9DC] text-[#7B1E3A] border border-[#C9A24D]/30">
                              {roleLabels[u.role] || u.role}
                            </span>
                          </td>

                          {activeTab === 'viewed' ? (
                            <>
                              <td className="py-2.5 px-4 font-mono text-[11px] text-[#2B2022]/70">
                                {item.firstViewedAt ? new Date(item.firstViewedAt).toLocaleString('ar-DZ') : '—'}
                              </td>
                              <td className="py-2.5 px-4 font-mono text-[11px] text-[#2B2022]/70">
                                {item.lastViewedAt ? new Date(item.lastViewedAt).toLocaleString('ar-DZ') : '—'}
                              </td>
                              <td className="py-2.5 px-4 text-center font-mono font-bold text-[#7B1E3A]">
                                {item.viewCount || 1}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                {item.hasConfirmed ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-bold">
                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                    <span>اطلع عليه</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-[#2B2022]/40">—</span>
                                )}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-2.5 px-4 font-mono text-[#2B2022]/70">
                                {u.phoneNumber ? (
                                  <span className="flex items-center gap-1 text-[#2B2022]">
                                    <Phone className="w-3 h-3 text-[#C9A24D]" />
                                    <span>{u.phoneNumber}</span>
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <span className="inline-block px-2.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 rounded-full text-[10px] font-bold">
                                  لم يطّلع بعد
                                </span>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#C9A24D]/25 bg-[#F3E9DC]/70">
            <p className="text-xs text-[#2B2022]/60">
              ملاحظة: تظهر هذه القائمة حصرياً للجهة الناشرة وإدارة المؤسسة حمايةً للخصوصية (المادة 15).
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#7B1E3A] hover:bg-[#62162d] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
