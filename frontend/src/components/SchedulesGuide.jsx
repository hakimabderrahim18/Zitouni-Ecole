import React, { useMemo, useState } from 'react';
import { Calendar, Bus, Utensils, GraduationCap, ClipboardList, Filter } from 'lucide-react';
import ScheduleTypePanel from './ScheduleTypePanel';

/*
 * دليل الجداول والمخططات الحالية — a complete, standalone directory of every
 * schedule/plan currently published by the administration. Each schedule type
 * is rendered as its own separate, detailed panel (timetable, transport, food,
 * exams), with a summary header showing the counts per type.
 */

const TYPES = [
  { type: 'Timetable', label: 'جداول الحصص الدراسية', icon: Calendar },
  { type: 'Transport', label: 'النقل المدرسي (الحافلات)', icon: Bus },
  { type: 'Food', label: 'برنامج الإطعام والوجبات', icon: Utensils },
  { type: 'Exam', label: 'رزنامة الامتحانات', icon: GraduationCap },
];

export default function SchedulesGuide({ schedules = [], onDelete }) {
  const [filter, setFilter] = useState('all'); // 'all' | Timetable | Transport | Food | Exam

  const counts = useMemo(() => {
    const c = {};
    TYPES.forEach(({ type }) => {
      c[type] = schedules.filter((s) => s.type === type).length;
    });
    return c;
  }, [schedules]);

  const visibleTypes = filter === 'all' ? TYPES : TYPES.filter((t) => t.type === filter);

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header + summary */}
      <div className="glass-panel p-5 rounded-2xl border border-luxury-border">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-10 h-10 rounded-xl bg-slate-950/60 border border-luxury-border flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-brand-400" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">دليل الجداول والمخططات الحالية</h3>
            <p className="text-[11px] text-slate-450">جميع الجداول والمخططات المنشورة، مصنّفة حسب النوع</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TYPES.map(({ type, label, icon: Icon }) => (
            <div key={type} className="bg-slate-900/40 border border-luxury-border rounded-xl p-3 flex items-center gap-3">
              <Icon className="w-5 h-5 text-brand-400 shrink-0" />
              <div className="min-w-0">
                <span className="block text-lg font-extrabold text-white leading-none">{counts[type]}</span>
                <span className="block text-[10px] text-slate-450 truncate mt-0.5">{label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-luxury-border/30">
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
          {TYPES.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === type ? 'bg-brand-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white border border-luxury-border'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {schedules.length === 0 ? (
        <div className="glass-panel p-8 rounded-2xl border border-dashed border-luxury-border text-center text-slate-500 text-sm italic">
          لا يوجد أي جدول أو مخطط مسجّل حالياً.
        </div>
      ) : (
        <div className="space-y-5">
          {visibleTypes.map(({ type, label, icon }) => (
            <ScheduleTypePanel
              key={type}
              type={type}
              label={label}
              icon={icon}
              schedules={schedules}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
