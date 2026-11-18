import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { BookOpen, Download, Calendar, Bus, Soup, FileText, GraduationCap, Sparkles, RefreshCw } from 'lucide-react';
import ScheduleCard from '../components/ScheduleCard';
import SchedulesView from '../components/SchedulesView';
import AttendanceView from '../components/AttendanceView';
import TimetableGrid from '../components/TimetableGrid';
import LessonNotebook from '../components/LessonNotebook';
import StudentReEnrollmentView from '../components/StudentReEnrollmentView';
import StudentGradesView from '../components/assessments/StudentGradesView';
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
    if (path.endsWith('/grades')) return 'grades';
    if (path.endsWith('/re-enrollment')) return 're-enrollment';
    if (path.endsWith('/schedules')) return 'schedules';
    if (path.endsWith('/timetable')) return 'timetable';
    if (path.endsWith('/attendance')) return 'attendance';
    if (path.endsWith('/lessons')) return 'lessons';
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
        {activeTab === 'grades' && <StudentGradesView />}
        {activeTab === 're-enrollment' && <StudentReEnrollmentView />}
        {activeTab === 'lessons' && <LessonNotebook />}
        {activeTab === 'timetable' && <TimetableGrid canImport={false} isStudentView={true} />}

        {activeTab === 'courses' && (
          <div className="max-w-5xl space-y-6">
            {/* Re-enrollment Notification Banner */}
            <div className="p-5 rounded-2xl border border-[#C9A24D]/35 bg-gradient-to-r from-[#F3E9DC]/70 via-white to-[#F3E9DC]/40 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#7B1E3A] flex items-center justify-center text-white shrink-0 shadow-sm shadow-[#7B1E3A]/25">
                  <RefreshCw className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#2B2022]">فترة إعادة التسجيل للموسم الدراسي الجديد مفتوحة</h4>
                  <p className="text-xs text-[#2B2022]/70 font-medium mt-0.5">يمكنك تأكيد رغبتك في إعادة التسجيل، اختيار القسم، وتوليد استمارة التسجيل وعقد التمدرس الرسمي.</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/dashboard/student/re-enrollment')}
                className="px-5 py-2.5 rounded-xl bg-[#7B1E3A] hover:bg-[#62162d] text-white font-bold text-xs shadow-md shadow-[#7B1E3A]/20 transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                إعادة التسجيل الآن
              </button>
            </div>

            <div className="glass-panel p-6 md:p-8 rounded-3xl border border-gray-200 space-y-7 relative overflow-hidden bg-white shadow-sm">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#7B1E3A] flex items-center justify-center shadow-md shadow-[#7B1E3A]/20 shrink-0">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">المواد والدعائم الدراسية</h3>
                    <p className="text-xs text-gray-600 font-semibold mt-0.5">دروسك وملفاتك التعليمية متاحة للتحميل في أي وقت</p>
                  </div>
                </div>
                {!loading && courses.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F3E9DC] border border-[#C9A24D]/50 text-[#7B1E3A] text-xs font-black w-fit shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-[#C9A24D]" />
                    <span className="text-[#7B1E3A] font-black">{courses.length} ملف متاح</span>
                  </span>
                )}
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-28 rounded-2xl bg-gray-100 border border-gray-200 animate-pulse" />
                  ))}
                </div>
              ) : courses.length === 0 ? (
                <div className="relative z-10 flex flex-col items-center justify-center text-center py-14 rounded-2xl border border-dashed border-gray-300 bg-gray-50/50">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mb-4 shadow-xs">
                    <FileText className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="text-gray-900 font-bold text-sm">لا توجد دروس أو مواد متاحة حالياً</p>
                  <p className="text-gray-500 text-xs mt-1">سيتم عرض الملفات هنا فور نشرها من طرف الأساتذة.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                  {courses.map((c) => {
                    const accent = getSubjectAccent(c.subject);
                    const teacherName = `${c.teacher?.user?.firstName || ''} ${c.teacher?.user?.lastName || ''}`.trim();
                    return (
                      <div
                        key={c._id}
                        className="group relative p-5 rounded-2xl bg-white border border-gray-200 hover:border-[#C9A24D]/60 hover:shadow-lg transition-all duration-300 overflow-hidden shadow-xs"
                      >
                        {/* Top accent bar */}
                        <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${accent}`} />

                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shrink-0 shadow-md`}>
                            <BookOpen className="w-6 h-6 text-white" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-black text-gray-900 text-base truncate group-hover:text-[#7B1E3A] transition-colors">{c.title}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200 text-xs font-bold text-gray-800">
                                {c.subject}
                              </span>
                              {teacherName && (
                                <span className="inline-flex items-center gap-1.5 text-xs text-gray-700 font-semibold">
                                  <span className="w-5 h-5 rounded-full bg-[#7B1E3A]/10 border border-[#7B1E3A]/30 flex items-center justify-center text-[10px] font-extrabold text-[#7B1E3A] uppercase">
                                    {c.teacher?.user?.firstName?.[0]}{c.teacher?.user?.lastName?.[0]}
                                  </span>
                                  {teacherName}
                                </span>
                              )}
                            </div>
                            {c.description && (
                              <p className="text-xs text-gray-600 mt-2.5 leading-relaxed line-clamp-2 font-medium">{c.description}</p>
                            )}
                          </div>
                        </div>

                        {c.fileUrl ? (
                          <a
                            href={c.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 w-full py-2.5 rounded-xl bg-[#7B1E3A] hover:bg-[#62162d] border border-[#7B1E3A] text-white font-bold text-xs transition-all duration-200 flex items-center justify-center gap-2 shadow-sm shadow-[#7B1E3A]/20 cursor-pointer"
                          >
                            <Download className="w-4 h-4 text-[#C9A24D]" />
                            <span className="text-white font-bold">تحميل الملف المرفق</span>
                          </a>
                        ) : (
                          <div className="mt-4 w-full py-2 rounded-xl bg-[#F3E9DC]/70 border border-[#C9A24D]/35 text-[#7B1E3A] text-xs text-center font-bold">
                            درس نصي وتوجيهي (بدون ملف)
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'schedules' && (
          <div className="space-y-8">
            <TimetableGrid canImport={false} isStudentView={true} />
            <div className="border-t border-luxury-border/50 pt-8">
              <h3 className="text-base font-extrabold text-gray-900 mb-4">البرامج والمخططات المدرسية الإضافية</h3>
              <SchedulesView
                schedules={schedules}
                loading={loading}
                emptyLabel="لا يوجد مخططات إضافية مسجلة حالياً."
              />
            </div>
          </div>
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
