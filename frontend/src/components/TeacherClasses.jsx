import React, { useState } from 'react';
import { BookOpen, Users, GraduationCap, ChevronDown, Layers, Mail, Phone, Hash } from 'lucide-react';
import axios from 'axios';

const levelLabels = {
  primary: 'ابتدائي',
  middle: 'متوسط',
  secondary: 'ثانوي',
};

/*
 * Detailed view of the classes and groups a teacher is assigned to.
 * Lets the teacher expand a group to load and inspect its student roster.
 */
export default function TeacherClasses({ profile }) {
  const classes = profile?.classes || [];
  const groups = profile?.groups || [];
  const subjects = profile?.subjects || [];

  const [openGroup, setOpenGroup] = useState(null); // groupId
  const [rosters, setRosters] = useState({}); // groupId -> students[]
  const [loadingGroup, setLoadingGroup] = useState(null);

  const groupsForClass = (classId) =>
    groups.filter((g) => g.class === classId || g.class?._id === classId);

  const toggleGroup = async (classId, group) => {
    const gid = group._id;
    if (openGroup === gid) {
      setOpenGroup(null);
      return;
    }
    setOpenGroup(gid);
    if (!rosters[gid]) {
      setLoadingGroup(gid);
      try {
        const res = await axios.get(`/api/teachers/classes/${classId}/groups/${gid}/students`);
        setRosters((prev) => ({ ...prev, [gid]: res.data }));
      } catch (err) {
        console.error('Failed to load roster', err);
        setRosters((prev) => ({ ...prev, [gid]: [] }));
      } finally {
        setLoadingGroup(null);
      }
    }
  };

  if (classes.length === 0) {
    return (
      <div className="glass-panel p-10 rounded-2xl border border-dashed border-luxury-border text-center text-slate-500">
        <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-700" />
        <p className="text-sm">لم يتم إسنادك إلى أي قسم بعد. يرجى مراجعة الإدارة.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-luxury-border flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-white leading-none">{classes.length}</p>
            <p className="text-[11px] text-slate-450 mt-1">الأقسام المسندة</p>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-2xl border border-luxury-border flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center">
            <Layers className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-white leading-none">{groups.length}</p>
            <p className="text-[11px] text-slate-450 mt-1">الأفواج</p>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-2xl border border-luxury-border flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{subjects.join('، ') || '—'}</p>
            <p className="text-[11px] text-slate-450 mt-1">المواد التي أدرّسها</p>
          </div>
        </div>
      </div>

      {/* Classes list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {classes.map((cls) => {
          const clsGroups = groupsForClass(cls._id);
          return (
            <div key={cls._id} className="glass-panel rounded-2xl border border-luxury-border overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-luxury-border/50 bg-slate-900/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950/60 border border-luxury-border flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{cls.name}</h4>
                    <span className="text-[10px] text-brand-300 uppercase tracking-wide font-semibold">
                      {levelLabels[cls.level] || cls.level}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-450 bg-slate-950/50 border border-luxury-border px-2.5 py-1 rounded-full">
                  {clsGroups.length} أفواج
                </span>
              </div>

              <div className="p-4 space-y-2.5">
                {clsGroups.length === 0 ? (
                  <p className="text-xs text-slate-550 italic text-center py-3">لا توجد أفواج لهذا القسم.</p>
                ) : (
                  clsGroups.map((g) => {
                    const isOpen = openGroup === g._id;
                    const roster = rosters[g._id] || [];
                    return (
                      <div key={g._id} className="bg-slate-950/40 border border-luxury-border/50 rounded-xl overflow-hidden">
                        <button
                          onClick={() => toggleGroup(cls._id, g)}
                          className="w-full flex items-center justify-between p-3 hover:bg-slate-900/40 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <Users className="w-4 h-4 text-sky-400" />
                            <span className="text-sm font-semibold text-white">{g.name}</span>
                            <span className="text-[10px] text-slate-500">السعة: {g.capacity || 30}</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isOpen && (
                          <div className="border-t border-luxury-border/40 p-3">
                            {loadingGroup === g._id ? (
                              <p className="text-xs text-slate-450 text-center py-3">جاري تحميل قائمة التلاميذ...</p>
                            ) : roster.length === 0 ? (
                              <p className="text-xs text-slate-550 italic text-center py-3">لا يوجد تلاميذ مسجلون في هذا الفوج.</p>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-[10px] text-slate-450 px-1">
                                  <span>قائمة التلاميذ</span>
                                  <span className="font-bold text-slate-300">{roster.length} تلميذ</span>
                                </div>
                                {roster.map((s) => (
                                  <div key={s._id} className="flex items-center gap-3 bg-slate-900/50 border border-luxury-border/40 rounded-lg p-2.5">
                                    <div className="w-8 h-8 rounded-full bg-brand-900/50 flex items-center justify-center font-bold text-brand-300 text-[11px] shrink-0">
                                      {s.user?.firstName?.[0]}{s.user?.lastName?.[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-semibold text-white truncate">
                                        {s.user?.firstName} {s.user?.lastName}
                                      </p>
                                      <div className="flex items-center gap-3 text-[9px] text-slate-500 mt-0.5">
                                        {s.registrationNumber && (
                                          <span className="flex items-center gap-1"><Hash className="w-2.5 h-2.5" />{s.registrationNumber}</span>
                                        )}
                                        {s.user?.email && (
                                          <span className="flex items-center gap-1 truncate"><Mail className="w-2.5 h-2.5" />{s.user.email}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
