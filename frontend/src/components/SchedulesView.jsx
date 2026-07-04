import React, { useState } from 'react';
import { Calendar, Filter } from 'lucide-react';
import ScheduleCard from './ScheduleCard';

/*
 * A complete schedules dashboard that groups the current schedules by type,
 * each type presented in its own dedicated section:
 *   - جدول التوقيت (Timetable)
 *   - النقل المدرسي (Transport)
 *   - برنامج الإطعام (Food)
 *   - رزنامة الامتحانات (Exam)
 * Shared between the student and parent spaces.
 */

const SECTIONS = [
  { type: 'Timetable', label: 'جدول التوقيت' },
  { type: 'Food', label: 'برنامج الإطعام' },
  { type: 'Transport', label: 'النقل المدرسي' },
  { type: 'Exam', label: 'رزنامة الامتحانات' },
];

export default function SchedulesView({ schedules = [], loading = false, emptyLabel = 'لا يوجد جدول أو برنامج مسجل حالياً.' }) {
  const [filter, setFilter] = useState('all'); // 'all' | Timetable | Food | Transport | Exam

  if (loading) {
    return <div className="text-slate-450 text-sm py-8 text-center">جاري التحميل...</div>;
  }

  if (!schedules || schedules.length === 0) {
    return (
      <div className="glass-panel p-10 rounded-2xl border border-dashed border-luxury-border text-center text-slate-500">
        <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-700" />
        <p className="text-sm">{emptyLabel}</p>
      </div>
    );
  }

  const visibleSections = filter === 'all' ? SECTIONS : SECTIONS.filter((s) => s.type === filter);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Type filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-450">
          <Filter className="w-3.5 h-3.5 text-brand-400" /> تصفية حسب النوع:
        </span>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'all' ? 'bg-brand-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white border border-luxury-border'
          }`}
        >
          الكل
        </button>
        {SECTIONS.map(({ type, label }) => {
          const count = schedules.filter((s) => s.type === type).length;
          return (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === type ? 'bg-brand-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white border border-luxury-border'
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {(() => {
        const anyVisible = visibleSections.some((s) => schedules.some((sc) => sc.type === s.type));
        if (!anyVisible) {
          return (
            <div className="glass-panel p-8 rounded-2xl border border-dashed border-luxury-border text-center text-slate-500 text-sm italic">
              لا يوجد أي عنصر من هذا النوع.
            </div>
          );
        }
        return visibleSections.map(({ type, label }) => {
          const items = schedules.filter((s) => s.type === type);
          if (items.length === 0) return null;
          return (
            <section key={type} className="space-y-3">
              <div className="flex items-center gap-2 text-base font-bold text-slate-100">
                <span className="w-1.5 h-5 bg-brand-500 rounded-full" />
                {label}
                <span className="text-[11px] text-slate-500 font-normal">({items.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {items.map((s) => (
                  <ScheduleCard key={s._id} schedule={s} />
                ))}
              </div>
            </section>
          );
        });
      })()}
    </div>
  );
}
