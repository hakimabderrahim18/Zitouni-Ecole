import React, { useMemo, useState } from 'react';
import { Calendar, CheckCircle2, XCircle, Clock, ShieldCheck, Search } from 'lucide-react';

/*
 * A complete, detailed attendance record component (سجل الحضور والغيابات).
 * Shows a statistics summary and a filterable, detailed table.
 * Shared between the student and parent spaces.
 */

const STATUS_META = {
  Present: { label: 'حاضر', cls: 'text-emerald-400 bg-emerald-950/40 border-emerald-900/50' },
  'غائب': { label: 'غائب', cls: 'text-red-400 bg-red-950/40 border-red-900/50' },
  Absent: { label: 'غائب', cls: 'text-red-400 bg-red-950/40 border-red-900/50' },
  Late: { label: 'متأخر', cls: 'text-yellow-400 bg-yellow-950/40 border-yellow-900/50' },
  Excused: { label: 'غياب مبرر', cls: 'text-blue-400 bg-blue-950/40 border-blue-900/50' },
};

const statusMeta = (status) => STATUS_META[status] || { label: status || '—', cls: 'text-slate-400 bg-slate-900 border-luxury-border' };

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
    <div className="glass-panel p-6 rounded-2xl border border-luxury-border space-y-6" dir="rtl">
      <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-brand-400" />
        <span>{title}</span>
      </h3>

      {loading ? (
        <div className="text-slate-450 text-sm py-8 text-center">جاري التحميل...</div>
      ) : (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-brand-950/20 border border-brand-500/20 rounded-2xl p-4 text-center">
              <ShieldCheck className="w-4 h-4 text-brand-400 mx-auto mb-1" />
              <span className="block text-[10px] text-slate-400 mb-0.5">نسبة الالتزام</span>
              <span className="text-xl font-extrabold text-brand-400">{stats.rate}%</span>
            </div>
            <div className="bg-emerald-950/15 border border-emerald-900/30 rounded-2xl p-4 text-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <span className="block text-[10px] text-slate-400 mb-0.5">حضور</span>
              <span className="text-lg font-extrabold text-emerald-400">{stats.present}</span>
            </div>
            <div className="bg-red-950/15 border border-red-900/30 rounded-2xl p-4 text-center">
              <XCircle className="w-4 h-4 text-red-400 mx-auto mb-1" />
              <span className="block text-[10px] text-slate-400 mb-0.5">غياب</span>
              <span className="text-lg font-extrabold text-red-400">{stats.absent}</span>
            </div>
            <div className="bg-yellow-950/15 border border-yellow-900/30 rounded-2xl p-4 text-center">
              <Clock className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
              <span className="block text-[10px] text-slate-400 mb-0.5">تأخر</span>
              <span className="text-lg font-extrabold text-yellow-400">{stats.late}</span>
            </div>
            <div className="bg-blue-950/15 border border-blue-900/30 rounded-2xl p-4 text-center">
              <ShieldCheck className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <span className="block text-[10px] text-slate-400 mb-0.5">غياب مبرر</span>
              <span className="text-lg font-extrabold text-blue-400">{stats.excused}</span>
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    filter === f.v ? 'bg-brand-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white border border-luxury-border'
                  }`}
                >
                  {f.l}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث في الملاحظات..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-900 border border-luxury-border rounded-xl pr-9 pl-4 py-2 text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="text-slate-550 text-sm py-8 text-center italic bg-slate-950/20 rounded-xl border border-luxury-border/30">
              لا توجد سجلات مطابقة.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-luxury-border">
              <table className="w-full text-right text-sm text-slate-350">
                <thead className="bg-slate-900/60 text-slate-450 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">التاريخ / اليوم</th>
                    <th className="p-4">الحالة</th>
                    <th className="p-4">القسم / الفوج</th>
                    <th className="p-4">سجّلها</th>
                    <th className="p-4">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-luxury-border/30">
                  {filtered.map((record) => {
                    const dateObj = new Date(record.date);
                    const formatted = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
                    const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1);
                    const meta = statusMeta(record.status);
                    const recorderName = record.recordedBy ? `${record.recordedBy.firstName} ${record.recordedBy.lastName}` : '—';
                    const recorderRole = record.recordedBy?.role === 'teacher' ? 'الأستاذ' : 'الإدارة';
                    return (
                      <tr key={record._id} className="hover:bg-slate-900/10">
                        <td className="p-4 font-mono text-xs text-white">{capitalized}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${meta.cls}`}>{meta.label}</span>
                        </td>
                        <td className="p-4 text-xs">
                          <span className="block font-medium text-slate-200">{record.class?.name || '—'}</span>
                          <span className="text-[10px] font-mono text-slate-500">{record.group?.name || '—'}</span>
                        </td>
                        <td className="p-4 text-xs">
                          <span className="block font-medium text-slate-200">{recorderName}</span>
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider">{recorderRole}</span>
                        </td>
                        <td className="p-4 text-xs text-slate-400 italic">{record.remarks ? `"${record.remarks}"` : '—'}</td>
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
