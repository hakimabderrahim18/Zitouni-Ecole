import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { BookOpen, Download, Calendar, Bus, Soup, FileText, GraduationCap, Sparkles } from 'lucide-react';
import ScheduleCard from '../components/ScheduleCard';
import SchedulesView from '../components/SchedulesView';
import AttendanceView from '../components/AttendanceView';
import axios from 'axios';

// Palette of gradient accents assigned deterministically per subject
const SUBJECT_ACCENTS = [
  'from-amber-500 to-orange-600',
  'from-sky-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
];

const getSubjectAccent = (subject = '') => {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  return SUBJECT_ACCENTS[Math.abs(hash) % SUBJECT_ACCENTS.length];
};

export default function StudentDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.endsWith('/schedules')) return 'schedules';
    if (path.endsWith('/attendance')) return 'attendance';
    return 'courses'; // default tab (covers /dashboard/student and /dashboard/student/courses)
  };

  const activeTab = getActiveTab();
  const [courses, setCourses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const [coursesRes, announcementsRes, schedulesRes, attendanceRes] = await Promise.all([
        axios.get('/api/students/courses'),
        axios.get('/api/students/announcements'),
        axios.get('/api/students/schedules'),
        axios.get('/api/students/attendance'),
      ]);
      setCourses(coursesRes.data);
      setAnnouncements(announcementsRes.data);
      setSchedules(schedulesRes.data);
      setAttendance(attendanceRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 text-right"
      >

        {activeTab === 'courses' && (
          <div className="max-w-5xl">
            <div className="glass-panel p-6 md:p-8 rounded-3xl border border-luxury-border space-y-7 relative overflow-hidden">
              {/* Decorative ambient glow */}
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-500/10 rounded-full blur-[90px] pointer-events-none" />

              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-[0_8px_25px_rgba(197,106,61,0.3)] shrink-0">
                    <BookOpen className="w-6 h-6 text-[#050505]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-100">المواد والدعائم الدراسية</h3>
                    <p className="text-xs text-slate-450 font-medium mt-0.5">دروسك وملفاتك التعليمية متاحة للتحميل في أي وقت</p>
                  </div>
                </div>
                {!loading && courses.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold w-fit">
                    <Sparkles className="w-3.5 h-3.5" />
                    {courses.length} ملف متاح
                  </span>
                )}
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-28 rounded-2xl bg-slate-900/40 border border-luxury-border animate-pulse" />
                  ))}
                </div>
              ) : courses.length === 0 ? (
                <div className="relative z-10 flex flex-col items-center justify-center text-center py-14 rounded-2xl border border-dashed border-luxury-border bg-slate-900/20">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900/60 border border-luxury-border flex items-center justify-center mb-4">
                    <FileText className="w-7 h-7 text-slate-600" />
                  </div>
                  <p className="text-slate-300 font-bold text-sm">لا توجد دروس أو مواد متاحة حالياً</p>
                  <p className="text-slate-550 text-xs mt-1">سيتم عرض الملفات هنا فور نشرها من طرف الأساتذة.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                  {courses.map((c) => {
                    const accent = getSubjectAccent(c.subject);
                    const teacherName = `${c.teacher?.user?.firstName || ''} ${c.teacher?.user?.lastName || ''}`.trim();
                    return (
                      <div
                        key={c._id}
                        className="group relative p-5 rounded-2xl bg-slate-900/40 border border-luxury-border hover:border-brand-500/40 hover:bg-slate-900/60 transition-all duration-300 overflow-hidden"
                      >
                        {/* Top accent bar */}
                        <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${accent} opacity-80`} />

                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shrink-0 shadow-lg`}>
                            <BookOpen className="w-6 h-6 text-white" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-100 truncate group-hover:text-white transition-colors">{c.title}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-950/60 border border-luxury-border text-[11px] font-bold text-slate-300">
                                {c.subject}
                              </span>
                              {teacherName && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-450 font-medium">
                                  <span className="w-5 h-5 rounded-full bg-brand-900/40 border border-brand-800/40 flex items-center justify-center text-[9px] font-bold text-brand-400 uppercase">
                                    {c.teacher?.user?.firstName?.[0]}{c.teacher?.user?.lastName?.[0]}
                                  </span>
                                  {teacherName}
                                </span>
                              )}
                            </div>
                            {c.description && (
                              <p className="text-xs text-slate-500 mt-3 leading-relaxed line-clamp-2">{c.description}</p>
                            )}
                          </div>
                        </div>

                        <a
                          href={c.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 w-full py-2.5 rounded-xl bg-brand-500/10 hover:bg-brand-500 border border-brand-500/30 hover:border-brand-500 text-brand-400 hover:text-[#050505] font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>تحميل الملف</span>
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'schedules' && (
          <SchedulesView
            schedules={schedules}
            loading={loading}
            emptyLabel="لا يوجد جدول حصص أو برنامج مسجل لقسمك الدراسي حالياً."
          />
        )}

        {activeTab === 'attendance' && (
          <div className="max-w-5xl">
            <AttendanceView
              attendance={attendance}
              loading={loading}
              title="سجل الحضور والغياب والتأخر / تفاصيل الحضور"
            />
          </div>
        )}

      </motion.div>
    </DashboardLayout>
  );
}
