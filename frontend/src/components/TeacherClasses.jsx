import React, { useState, useEffect } from 'react';
import { BookOpen, Users, GraduationCap, ChevronDown, Layers, Mail, Phone, Hash, Search, PlusCircle, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const levelLabels = {
  primary: 'ابتدائي',
  middle: 'متوسط',
  secondary: 'ثانوي',
};

/*
 * Detailed view of the classes and groups a teacher is assigned to.
 * Lets the teacher inspect assigned classes and student rosters.
 */
export default function TeacherClasses({ profile, onSelectClassForCourse, onSelectClassForAttendance }) {
  const navigate = useNavigate();
  const [classesList, setClassesList] = useState(profile?.classes || []);
  const [groupsList, setGroupsList] = useState(profile?.groups || []);
  const subjects = profile?.subjects || [];

  const [openClass, setOpenClass] = useState(null); // classId
  const [openGroup, setOpenGroup] = useState(null); // groupId
  const [rosters, setRosters] = useState({}); // key (classId or groupId) -> students[]
  const [loadingKeys, setLoadingKeys] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Fallback / sync from backend if profile classes are missing or outdated
  useEffect(() => {
    const fetchLatestClasses = async () => {
      try {
        const res = await axios.get('/api/teachers/classes');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setClassesList(res.data);
        }
      } catch (err) {
        // Fallback to /api/admin/classes
        try {
          const resAdmin = await axios.get('/api/admin/classes');
          if (Array.isArray(resAdmin.data) && resAdmin.data.length > 0) {
            setClassesList(resAdmin.data);
          }
        } catch (e) {
          // ignore
        }
      }
    };

    if (!profile?.classes || profile.classes.length === 0) {
      fetchLatestClasses();
    } else {
      setClassesList(profile.classes);
      setGroupsList(profile.groups || []);
    }
  }, [profile]);

  const groupsForClass = (classId) =>
    groupsList.filter((g) => g.class === classId || g.class?._id === classId);

  // Toggle roster for entire class
  const toggleClassRoster = async (classId) => {
    const key = `class_${classId}`;
    if (openClass === classId) {
      setOpenClass(null);
      return;
    }
    setOpenClass(classId);
    if (!rosters[key]) {
      setLoadingKeys((prev) => ({ ...prev, [key]: true }));
      try {
        const res = await axios.get(`/api/teachers/classes/${classId}/students`);
        setRosters((prev) => ({ ...prev, [key]: res.data }));
      } catch (err) {
        console.error('Failed to load class roster', err);
        setRosters((prev) => ({ ...prev, [key]: [] }));
      } finally {
        setLoadingKeys((prev) => ({ ...prev, [key]: false }));
      }
    }
  };

  // Toggle roster for a specific group
  const toggleGroup = async (classId, group) => {
    const gid = group._id;
    const key = `group_${gid}`;
    if (openGroup === gid) {
      setOpenGroup(null);
      return;
    }
    setOpenGroup(gid);
    if (!rosters[key]) {
      setLoadingKeys((prev) => ({ ...prev, [key]: true }));
      try {
        const res = await axios.get(`/api/teachers/classes/${classId}/groups/${gid}/students`);
        setRosters((prev) => ({ ...prev, [key]: res.data }));
      } catch (err) {
        console.error('Failed to load group roster', err);
        setRosters((prev) => ({ ...prev, [key]: [] }));
      } finally {
        setLoadingKeys((prev) => ({ ...prev, [key]: false }));
      }
    }
  };

  const renderStudentList = (studentList = []) => {
    const filtered = studentList.filter((s) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      const fn = (s.firstNameArabic || s.user?.firstName || '').toLowerCase();
      const ln = (s.lastNameArabic || s.user?.lastName || '').toLowerCase();
      const reg = (s.registrationNumber || '').toLowerCase();
      const em = (s.user?.email || '').toLowerCase();
      return fn.includes(q) || ln.includes(q) || reg.includes(q) || em.includes(q);
    });

    if (filtered.length === 0) {
      return (
        <p className="text-xs text-slate-500 italic text-center py-3">
          {searchQuery ? 'لا توجد نتائج مطابقة للبحث.' : 'لا يوجد تلاميذ مسجلون في هذا القسم بعد.'}
        </p>
      );
    }

    return (
      <div className="space-y-2 mt-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>قائمة التلاميذ المعتمدة</span>
          <span className="font-bold text-slate-300">{filtered.length} تلميذ</span>
        </div>
        {filtered.map((s) => (
          <div key={s._id} className="flex items-center gap-3 bg-slate-900/60 border border-luxury-border/40 rounded-xl p-3 hover:border-brand-500/30 transition-all">
            <div className="w-9 h-9 rounded-full bg-brand-900/50 border border-brand-500/20 flex items-center justify-center font-bold text-brand-300 text-xs shrink-0">
              {(s.firstNameArabic?.[0] || s.user?.firstName?.[0] || 'ت')}
              {(s.lastNameArabic?.[0] || s.user?.lastName?.[0] || '')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-white truncate">
                  {s.firstNameArabic || s.user?.firstName} {s.lastNameArabic || s.user?.lastName}
                </p>
                {s.group?.name && (
                  <span className="text-[10px] bg-slate-800 text-sky-300 border border-slate-700 px-2 py-0.5 rounded-full shrink-0">
                    {s.group.name}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-450 mt-1">
                {s.registrationNumber && (
                  <span className="flex items-center gap-1 font-mono">
                    <Hash className="w-2.5 h-2.5 text-brand-400" />
                    {s.registrationNumber}
                  </span>
                )}
                {s.user?.email && (
                  <span className="flex items-center gap-1 truncate">
                    <Mail className="w-2.5 h-2.5 text-slate-500" />
                    {s.user.email}
                  </span>
                )}
                {s.parent?.user?.phoneNumber && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <Phone className="w-2.5 h-2.5 text-emerald-400" />
                    هاتف الولي: {s.parent.user.phoneNumber}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (classesList.length === 0) {
    return (
      <div className="glass-panel p-10 rounded-2xl border border-dashed border-luxury-border text-center text-slate-500" dir="rtl">
        <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-600" />
        <h3 className="text-base font-bold text-white mb-1">لا توجد أقسام مسندة إليك حالياً</h3>
        <p className="text-xs text-slate-450 max-w-md mx-auto">
          لم يتم إسناد أي قسم لك بعد من قِبل إدارة المدرسة. تواصل مع مدير المنصة أو الناظر لإسناد أقسامك وفصولك التعليمية.
        </p>
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
            <p className="text-xl font-extrabold text-white leading-none">{classesList.length}</p>
            <p className="text-[11px] text-slate-450 mt-1">الأقسام المسندة لي</p>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-2xl border border-luxury-border flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center">
            <Layers className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-white leading-none">{groupsList.length}</p>
            <p className="text-[11px] text-slate-450 mt-1">الأفواج المسندة</p>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-2xl border border-luxury-border flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{subjects.join('، ') || 'المواد المسندة'}</p>
            <p className="text-[11px] text-slate-450 mt-1">المواد التي أدرّسها</p>
          </div>
        </div>
      </div>

      {/* Roster Search Bar */}
      <div className="glass-panel p-3 rounded-xl border border-luxury-border flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-500 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث عن تلميذ بالاسم، رقم التسجيل، أو البريد الإلكتروني..."
          className="w-full bg-transparent text-sm text-white focus:outline-none placeholder-slate-550"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-500 hover:text-white px-2 py-0.5 rounded"
          >
            مسح
          </button>
        )}
      </div>

      {/* Classes list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {classesList.map((cls) => {
          const clsGroups = groupsForClass(cls._id);
          const classKey = `class_${cls._id}`;
          const isClassRosterOpen = openClass === cls._id;
          const classRoster = rosters[classKey] || [];
          const isClassLoading = !!loadingKeys[classKey];

          return (
            <div key={cls._id} className="glass-panel rounded-2xl border border-luxury-border overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-luxury-border/50 bg-slate-900/40">
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
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-450 bg-slate-950/60 border border-luxury-border px-2.5 py-1 rounded-full">
                    {clsGroups.length > 0 ? `${clsGroups.length} أفواج` : 'قسم موحد'}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Add course or Mark attendance */}
              <div className="p-3 bg-slate-950/20 border-b border-luxury-border/30 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    if (onSelectClassForCourse) onSelectClassForCourse(cls._id);
                    else navigate('/dashboard/teacher');
                  }}
                  className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>إضافة درس لهذا القسم</span>
                </button>
                <button
                  onClick={() => {
                    if (onSelectClassForAttendance) onSelectClassForAttendance(cls._id);
                    else navigate('/dashboard/teacher/attendance');
                  }}
                  className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>تسجيل الحضور</span>
                </button>
              </div>

              <div className="p-4 space-y-3">
                {/* Button to view all students of this class */}
                <button
                  onClick={() => toggleClassRoster(cls._id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isClassRosterOpen
                      ? 'bg-brand-950/30 border-brand-500/40 text-brand-300'
                      : 'bg-slate-950/40 border-luxury-border/50 text-slate-300 hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-brand-400" />
                    <span className="text-xs font-bold">تلاميذ قسم {cls.name} (كامل القسم)</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isClassRosterOpen ? 'rotate-180' : ''}`} />
                </button>

                {isClassRosterOpen && (
                  <div className="border border-luxury-border/40 bg-slate-950/60 p-3 rounded-xl">
                    {isClassLoading ? (
                      <p className="text-xs text-slate-450 text-center py-3">جاري تحميل قائمة تلاميذ القسم...</p>
                    ) : (
                      renderStudentList(classRoster)
                    )}
                  </div>
                )}

                {/* Sub-groups if available */}
                {clsGroups.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] font-bold text-slate-450 px-1">الأفواج المسندة:</p>
                    {clsGroups.map((g) => {
                      const gid = g._id;
                      const groupKey = `group_${gid}`;
                      const isGroupOpen = openGroup === gid;
                      const groupRoster = rosters[groupKey] || [];
                      const isGroupLoading = !!loadingKeys[groupKey];

                      return (
                        <div key={gid} className="bg-slate-950/30 border border-luxury-border/50 rounded-xl overflow-hidden">
                          <button
                            onClick={() => toggleGroup(cls._id, g)}
                            className="w-full flex items-center justify-between p-3 hover:bg-slate-900/40 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <Layers className="w-4 h-4 text-sky-400" />
                              <span className="text-xs font-semibold text-white">{g.name}</span>
                              <span className="text-[10px] text-slate-500">السعة: {g.capacity || 30}</span>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isGroupOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {isGroupOpen && (
                            <div className="border-t border-luxury-border/40 p-3 bg-slate-950/50">
                              {isGroupLoading ? (
                                <p className="text-xs text-slate-450 text-center py-3">جاري تحميل قائمة الفوج...</p>
                              ) : (
                                renderStudentList(groupRoster)
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}