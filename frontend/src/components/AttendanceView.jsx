import React, { useMemo, useState } from 'react';
import { Calendar, CheckCircle2, XCircle, Clock, ShieldCheck, Search } from 'lucide-react';

/*
 * A complete, detailed attendance record component (سجل الحضور والغيابات).
 * Shows a statistics summary and a filterable, detailed table.
 * Shared between the student and parent spaces.
 * Styled in high-contrast Prestige Académique palette with elegant typography.
 */

const STATUS_META = {
  Present: {
    label: 'حاضر',
    cls: 'text-emerald-950 bg-emerald-100/90 border border-emerald-300 font-extrabold shadow-2xs',
  },
  'غائب': {
    label: 'غائب',
    cls: 'text-rose-950 bg-rose-100/90 border border-rose-300 font-extrabold shadow-2xs',
  },
  Absent: {
    label: 'غائب',
    cls: 'text-rose-950 bg-rose-100/90 border border-rose-300 font-extrabold shadow-2xs',
  },
  Late: {
    label: 'متأخر',
    cls: 'text-amber-950 bg-amber-200 border border-amber-400 font-extrabold shadow-2xs',
  },
  Excused: {
    label: 'غياب مبرر',
    cls: 'text-sky-950 bg-sky-100/90 border border-sky-300 font-extrabold shadow-2xs',
  },
};

const statusMeta = (status) =>
  STATUS_META[status] || {
    label: status || '—',
    cls: 'text-[#2B2022] bg-[#F3E9DC] border border-[#C9A24D]/40 font-bold',
  };

export default function AttendanceView({ attendance = [], loading = false, title = 'سجل الحضور والغيابات' }) {
  const [filter, setFilter] = useState('all'); // all | present | absent | late | excused
  const [search, setSearch] = useState('');

  const stats = useMemo(() => {
    const total = attendance.length;
    const present = attendance.filter((r) => r.status === 'Present').length;
    const absent = attendance.filter((r) => r.status === 'غائب' || r.status === 'Absent').length;
    const late = attendance.filter((r) => r.status === 'Late').length;
    const excused = attendance.filter((r) => r.status === 'Excused').length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 100;
    return { total, present, absent, late, excused, rate };
  }, [attendance]);

  const filtered = useMemo(() => {
    return attendance.filter((r) => {
      if (filter === 'present' && r.status !== 'Present') return false;
      if (filter === 'absent' && !(r.status === 'غائب' || r.status === 'Absent')) return false;
      if (filter === 'late' && r.status !== 'Late') return false;
      if (filter === 'excused' && r.status !== 'Excused') return false;
      if (search.trim()) {
        const hay = `${r.remarks || ''} ${r.class?.name || ''} ${r.group?.name || ''}`.toLowerCase();
        if (!hay.includes(search.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [attendance, filter, search]);

  return (
    <div className="bg-[#FDFBF7] p-5 sm:p-6 rounded-2xl border border-[#C9A24D]/35 shadow-sm space-y-6" dir="rtl">
      <h3 className="text-lg sm:text-xl font-serif font-black text-[#7B1E3A] flex items-center gap-2">
        <Calendar className="w-5 h-5 text-[#C9A24D]" />
        <span>{title}</span>
      </h3>

      {loading ? (
        <div className="text-[#7B1E3A] font-bold text-sm py-12 text-center animate-pulse">جاري التحميل...</div>
      ) : (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white border border-[#C9A24D]/40 rounded-2xl p-4 text-center shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-[#7B1E3A] mx-auto mb-1.5" />
              <span className="block text-[11px] text-[#2B2022]/80 font-bold mb-0.5">نسبة الالتزام</span>
              <span className="text-2xl font-black text-[#7B1E3A]">{stats.rate}%</span>
            </div>
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-center shadow-2xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 mx-auto mb-1.5" />
              <span className="block text-[11px] text-emerald-950 font-bold mb-0.5">حضور</span>
              <span className="text-2xl font-black text-emerald-800">{stats.present}</span>
            </div>
            <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 text-center shadow-2xs">
              <XCircle className="w-5 h-5 text-rose-700 mx-auto mb-1.5" />
              <span className="block text-[11px] text-rose-950 font-bold mb-0.5">غياب</span>
              <span className="text-2xl font-black text-rose-800">{stats.absent}</span>
            </div>
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-center shadow-2xs">
              <Clock className="w-5 h-5 text-amber-700 mx-auto mb-1.5" />
              <span className="block text-[11px] text-amber-950 font-bold mb-0.5">تأخر</span>
              <span className="text-2xl font-black text-amber-900">{stats.late}</span>
            </div>
            <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-4 text-center shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-sky-700 mx-auto mb-1.5" />
              <span className="block text-[11px] text-sky-950 font-bold mb-0.5">غياب مبرر</span>
              <span className="text-2xl font-black text-sky-900">{stats.excused}</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex flex-wrap gap-1.5">
              {[
                { v: 'all', l: 'الكل' },
                { v: 'present', l: 'حاضر' },
                { v: 'absent', l: 'غائب' },
                { v: 'late', l: 'متأخر' },
                { v: 'excused', l: 'مبرر' },
              ].map((f) => (
                <button
                  key={f.v}
                  onClick={() => setFilter(f.v)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filter === f.v
                      ? 'bg-[#7B1E3A] text-white shadow-sm border border-[#7B1E3A]'
                      : 'bg-white text-[#2B2022] hover:bg-[#F3E9DC]/60 hover:text-[#7B1E3A] border border-[#C9A24D]/35'
                  }`}
                >
                  {f.l}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-[#C9A24D] absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث في الملاحظات..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white border border-[#C9A24D]/35 rounded-xl pr-9 pl-4 py-2 text-xs sm:text-sm text-[#2B2022] placeholder:text-[#2B2022]/45 focus:border-[#7B1E3A] focus:outline-none shadow-2xs w-full sm:w-64 font-medium"
              />
            </div>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="text-[#2B2022]/70 text-sm py-12 text-center italic bg-[#F3E9DC]/30 rounded-2xl border border-[#C9A24D]/30 font-medium">
              لا توجد سجلات مطابقة.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#C9A24D]/30 shadow-2xs bg-white">
              <table className="w-full text-right text-sm">
                <thead className="bg-[#F3E9DC] text-[#7B1E3A] font-serif border-b border-[#C9A24D]/30">
                  <tr>
                    <th className="p-3.5 sm:p-4 font-black text-[#7B1E3A] text-xs sm:text-sm">التاريخ / اليوم</th>
                    <th className="p-3.5 sm:p-4 font-black text-[#7B1E3A] text-xs sm:text-sm">الحالة</th>
                    <th className="p-3.5 sm:p-4 font-black text-[#7B1E3A] text-xs sm:text-sm">القسم / الفوج</th>
                    <th className="p-3.5 sm:p-4 font-black text-[#7B1E3A] text-xs sm:text-sm">سجّلها</th>
                    <th className="p-3.5 sm:p-4 font-black text-[#7B1E3A] text-xs sm:text-sm">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C9A24D]/20">
                  {filtered.map((record) => {
                    const dateObj = new Date(record.date);
                    const formatted = dateObj.toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    });
                    const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1);
                    const meta = statusMeta(record.status);

                    const recorderName =
                      record.recordedBy && typeof record.recordedBy === 'object' && record.recordedBy.firstName
                        ? `${record.recordedBy.firstName} ${record.recordedBy.lastName || ''}`.trim()
                        : (record.recordedByName || 'إدارة المؤسسة');

                    const recorderRole =
                      record.recordedBy?.role === 'teacher'
                        ? 'الأستاذ(ة)'
                        : record.recordedBy?.role === 'general_supervisor'
                        ? 'المشرف العام'
                        : record.recordedBy?.role === 'pedagogical_supervisor'
                        ? 'المشرف التربوي'
                        : 'إدارة المؤسسة';

                    return (
                      <tr key={record._id} className="hover:bg-[#F3E9DC]/30 transition-colors">
                        <td className="p-3.5 sm:p-4 font-mono text-xs font-bold text-[#2B2022] whitespace-nowrap">
                          {capitalized}
                        </td>
                        <td className="p-3.5 sm:p-4 whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs ${meta.cls}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-xs whitespace-nowrap">
                          <span className="block font-bold text-[#2B2022]">{record.class?.name || '—'}</span>
                          <span className="text-[11px] font-bold text-[#7B1E3A]">{record.group?.name || '—'}</span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-xs whitespace-nowrap">
                          <span className="block font-bold text-[#2B2022]">{recorderName}</span>
                          <span className="text-[10px] font-bold text-[#7B1E3A]/85 uppercase tracking-wider">{recorderRole}</span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-xs text-[#2B2022]/90 italic font-medium">
                          {record.remarks ? `"${record.remarks}"` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
