import React from 'react';
import { Calendar, Bus, Soup, Clock, MapPin, User, BookOpen, GraduationCap, Utensils } from 'lucide-react';

/*
 * A rich, detailed schedule renderer shared across all roles.
 * Handles the four schedule types produced by the administration:
 *   - Timetable : { "Lundi": ["08:00 - Maths", ...], ... }
 *   - Food      : { "Lundi": "menu text", ... }
 *   - Transport : { "Ligne": "...", "Chauffeur": "...", "Arrêts": [...] }
 *   - Exam      : [ { "Matière": "...", "Date": "...", "Heure": "...", "Salle": "..." } ]
 */

const TYPE_META = {
  Timetable: { icon: Calendar, label: 'جدول التوقيت', color: 'text-brand-400', badge: 'bg-brand-500/10 text-brand-300 border-brand-500/25' },
  Food: { icon: Soup, label: 'برنامج الإطعام', color: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25' },
  Transport: { icon: Bus, label: 'النقل المدرسي', color: 'text-sky-400', badge: 'bg-sky-500/10 text-sky-300 border-sky-500/25' },
  Exam: { icon: GraduationCap, label: 'رزنامة الامتحانات', color: 'text-rose-400', badge: 'bg-rose-500/10 text-rose-300 border-rose-500/25' },
};

const dayLabelsAr = {
  Lundi: 'الإثنين',
  Mardi: 'الثلاثاء',
  Mercredi: 'الأربعاء',
  Jeudi: 'الخميس',
  Vendredi: 'الجمعة',
  Samedi: 'السبت',
  Dimanche: 'الأحد',
};

function parseSession(text = '') {
  // "08:00 - Mathématiques" -> { time: "08:00", subject: "Mathématiques" }
  const m = String(text).match(/^\s*([\d:hH\s-]+?)\s*[-–]\s*(.+)$/);
  if (m) return { time: m[1].trim(), subject: m[2].trim() };
  return { time: '', subject: String(text) };
}

function TimetableView({ data }) {
  const days = Object.entries(data || {});
  if (days.length === 0) return <EmptyDetail />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {days.map(([day, sessions]) => {
        const list = Array.isArray(sessions) ? sessions : [];
        return (
          <div key={day} className="bg-slate-950/40 border border-luxury-border/50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-luxury-border/30">
              <span className="text-xs font-bold text-white">{dayLabelsAr[day] || day}</span>
              <span className="text-[9px] text-slate-500">{list.length} حصص</span>
            </div>
            {list.length === 0 ? (
              <p className="text-[10px] text-slate-600 italic py-2 text-center">لا توجد حصص</p>
            ) : (
              <div className="space-y-1.5">
                {list.map((s, i) => {
                  const { time, subject } = parseSession(s);
                  return (
                    <div key={i} className="flex items-center gap-2 bg-slate-900/60 rounded-lg px-2.5 py-1.5">
                      {time && (
                        <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-brand-300 shrink-0">
                          <Clock className="w-3 h-3" /> {time}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-200 truncate">{subject}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FoodView({ data }) {
  const days = Object.entries(data || {});
  if (days.length === 0) return <EmptyDetail />;
  return (
    <div className="space-y-2">
      {days.map(([day, menu]) => (
        <div key={day} className="flex items-start gap-3 bg-slate-950/40 border border-luxury-border/50 rounded-xl p-3">
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 min-w-[90px] shrink-0">
            <Utensils className="w-3.5 h-3.5" /> {dayLabelsAr[day] || day}
          </span>
          <span className="text-[11px] text-slate-200 leading-relaxed">{String(menu) || '—'}</span>
        </div>
      ))}
    </div>
  );
}

function TransportView({ data }) {
  const entries = Object.entries(data || {});
  if (entries.length === 0) return <EmptyDetail />;
  return (
    <div className="space-y-2">
      {entries.map(([key, val]) => (
        <div key={key} className="bg-slate-950/40 border border-luxury-border/50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-sky-300 uppercase tracking-wide mb-1.5">
            {key === 'Chauffeur' ? <User className="w-3 h-3" /> : key === 'Arrêts' ? <MapPin className="w-3 h-3" /> : <Bus className="w-3 h-3" />}
            {key}
          </div>
          {Array.isArray(val) ? (
            <div className="space-y-1">
              {val.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          ) : (
            <span className="text-[12px] text-white font-medium">{String(val)}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function ExamView({ data }) {
  const rows = Array.isArray(data) ? data : [];
  if (rows.length === 0) return <EmptyDetail />;
  return (
    <div className="overflow-x-auto rounded-xl border border-luxury-border/40">
      <table className="w-full text-right text-xs">
        <thead className="bg-slate-950/60 text-slate-450 uppercase text-[9px] tracking-wider">
          <tr>
            <th className="p-2.5 font-semibold">المادة</th>
            <th className="p-2.5 font-semibold">التاريخ</th>
            <th className="p-2.5 font-semibold">التوقيت</th>
            <th className="p-2.5 font-semibold">القاعة</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-luxury-border/10">
          {rows.map((exam, i) => (
            <tr key={i} className="hover:bg-slate-900/30">
              <td className="p-2.5 text-white font-semibold">{exam.المادة || exam.subject || exam['Matière'] || '—'}</td>
              <td className="p-2.5 text-slate-350">{exam.التاريخ || exam.date || exam['Date'] || '—'}</td>
              <td className="p-2.5 text-slate-350">{exam.التوقيت || exam.time || exam['Heure'] || '—'}</td>
              <td className="p-2.5 text-slate-350">{exam.القاعة || exam.room || exam['Salle'] || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyDetail() {
  return <span className="text-xs text-slate-550 italic block py-3 text-center">لا توجد معلومات تفصيلية.</span>;
}

export default function ScheduleCard({ schedule }) {
  const meta = TYPE_META[schedule.type] || TYPE_META.Timetable;
  const Icon = meta.icon;
  const data = schedule.data;

  return (
    <div className="glass-panel rounded-2xl border border-luxury-border overflow-hidden flex flex-col" dir="rtl">
      <div className="flex items-center gap-3 p-4 border-b border-luxury-border/50 bg-slate-900/20">
        <div className="w-10 h-10 rounded-xl bg-slate-950/60 border border-luxury-border flex items-center justify-center shrink-0">
          <Icon className={`w-5 h-5 ${meta.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-white truncate">{schedule.title}</h4>
          {(schedule.class?.name || schedule.group?.name) && (
            <p className="text-[10px] text-slate-450 flex items-center gap-1 mt-0.5">
              <BookOpen className="w-3 h-3" />
              {schedule.class?.name}{schedule.group?.name ? ` — ${schedule.group.name}` : ''}
            </p>
          )}
        </div>
        <span className={`text-[9px] font-semibold px-2 py-1 rounded-full border ${meta.badge} shrink-0`}>
          {meta.label}
        </span>
      </div>

      <div className="p-4">
        {schedule.type === 'Timetable' && <TimetableView data={data} />}
        {schedule.type === 'Food' && <FoodView data={data} />}
        {schedule.type === 'Transport' && <TransportView data={data} />}
        {schedule.type === 'Exam' && <ExamView data={data} />}
      </div>
    </div>
  );
}
