import React from 'react';
import { Trash2 } from 'lucide-react';
import ScheduleCard from './ScheduleCard';

/*
 * A standalone panel that renders all the instances of a SINGLE schedule type
 * (e.g. only timetables, or only bus/transport plans). Used to build the
 * "دليل الجداول والمخططات الحالية" as a set of separate, dedicated components —
 * one component per schedule type.
 */
export default function ScheduleTypePanel({ type, label, icon: Icon, schedules = [], onDelete }) {
  const items = schedules.filter((s) => s.type === type);

  return (
    <div className="glass-panel p-5 rounded-2xl border border-luxury-border space-y-4">
      <div className="flex items-center justify-between border-b border-luxury-border/30 pb-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          {Icon && (
            <span className="w-9 h-9 rounded-xl bg-slate-950/60 border border-luxury-border flex items-center justify-center">
              <Icon className="w-5 h-5 text-brand-400" />
            </span>
          )}
          <span>{label}</span>
        </h3>
        <span className="text-[11px] text-slate-450 bg-slate-950/50 border border-luxury-border px-2.5 py-1 rounded-full">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="text-slate-550 text-xs italic py-6 text-center bg-slate-950/20 rounded-xl border border-dashed border-luxury-border/30">
          لا يوجد أي {label} مسجّل حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {items.map((s) => (
            <div key={s._id} className="relative">
              {onDelete && (
                <button
                  onClick={() => onDelete(s._id)}
                  className="absolute top-3 left-3 z-10 p-1.5 bg-red-950/40 hover:bg-red-950/70 text-red-400 rounded-lg transition-all"
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <ScheduleCard schedule={s} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
