import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, CheckCircle2, XCircle, Clock, AlertTriangle, ShieldCheck,
  FileText, Calendar, Save, Check, RefreshCw, Printer, AlertOctagon, CheckSquare,
  MessageSquare, Download, ExternalLink, FileSpreadsheet, Send, Search, X
} from 'lucide-react';
import AbsenceWarningLetterModal from './AbsenceWarningLetterModal';
import DigitalExitPassModal from './DigitalExitPassModal';
import AttendanceJustificationModal from './AttendanceJustificationModal';
import AttendanceReportModal from './AttendanceReportModal';
import { useAuthStore } from '../store/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getToken = () => {
  return useAuthStore.getState().accessToken || localStorage.getItem('zitouni_access_token') || localStorage.getItem('token') || '';
};

const STATUS_CONFIG = {
  Present: {
    labelArabic: 'حاضر',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100',
    activeColor: 'bg-emerald-700 text-white font-bold border-emerald-800 shadow-sm',
    icon: CheckCircle2,
  },
  Absent: {
    labelArabic: 'غائب',
    color: 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100',
    activeColor: 'bg-rose-700 text-white font-bold border-rose-800 shadow-sm',
    icon: XCircle,
  },
  Late: {
    labelArabic: 'متأخر',
    color: 'bg-[#C9A24D]/15 text-[#7B1E3A] border-[#C9A24D]/40 hover:bg-[#C9A24D]/25',
    activeColor: 'bg-[#C9A24D] text-[#2B2022] font-bold border-[#b08b3c] shadow-sm',
    icon: Clock,
  },
  Excused: {
    labelArabic: 'مبرر',
    color: 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100',
    activeColor: 'bg-blue-700 text-white font-bold border-blue-800 shadow-sm',
    icon: ShieldCheck,
  },
  Unexcused: {
    labelArabic: 'غير مبرر',
    color: 'bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100',
    activeColor: 'bg-purple-700 text-white font-bold border-purple-800 shadow-sm',
    icon: AlertOctagon,
  },
  ExitPass: {
    labelArabic: 'إذن خروج',
    color: 'bg-teal-50 text-teal-800 border-teal-300 hover:bg-teal-100',
    activeColor: 'bg-teal-700 text-white font-bold border-teal-800 shadow-sm',
    icon: FileText,
  },
};

const SESSIONS = [
  { id: 'Daily', label: 'كامل اليوم (حضور عام)' },
  { id: '08:30 - 09:30', label: '08:30 - 09:30' },
  { id: '09:30 - 10:30', label: '09:30 - 10:30' },
  { id: '10:30 - 11:30', label: '10:30 - 11:30' },
  { id: '11:30 - 12:30', label: '11:30 - 12:30' },
  { id: '13:30 - 14:30', label: '13:30 - 14:30' },
  { id: '14:30 - 15:30', label: '14:30 - 15:30' },
  { id: '15:30 - 16:30', label: '15:30 - 16:30' },
];

export default function AttendanceManager() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSession, setSelectedSession] = useState('Daily');
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // 3-Absence Warning Letter Modal State (Article 26)
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [selectedWarning, setSelectedWarning] = useState(null);
  const [selectedStudentForLetter, setSelectedStudentForLetter] = useState(null);

  // Digital Exit Pass Modal State (Article 28)
  const [exitPassModalOpen, setExitPassModalOpen] = useState(false);
  const [selectedPassForModal, setSelectedPassForModal] = useState(null);
  const [selectedStudentForPass, setSelectedStudentForPass] = useState(null);

  // Justification Review Modal State (Article 26)
  const [justificationModalOpen, setJustificationModalOpen] = useState(false);
  const [selectedAttendanceForReview, setSelectedAttendanceForReview] = useState(null);
  const [selectedStudentForJustification, setSelectedStudentForJustification] = useState(null);

  // Periodical Report Modal State (Article 26)
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Stats today
  const [todayStats, setTodayStats] = useState(null);
  const [attendanceStudentSearch, setAttendanceStudentSearch] = useState('');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'

  // Fetch classes on mount
  useEffect(() => {
    fetchClasses();
    fetchTodayStats();
  }, []);

  // Fetch attendance sheet when class, date or session changes
  useEffect(() => {
    if (selectedClassId) {
      fetchClassAttendance();
    }
  }, [selectedClassId, selectedDate, selectedSession]);

  const fetchClasses = async () => {
    try {
      const token = getToken();
      const res = await axios.get(`${API_URL}/admin/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data || [];
      // Sort classes: primary, middle, secondary
      setClasses(data);
      if (data.length > 0 && !selectedClassId) {
        // Prefer 1AM1 or 1AP if available, otherwise first
        const pref = data.find(c => c.name === '1AM1') || data.find(c => c.name === '1AP') || data[0];
        setSelectedClassId(pref._id);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const fetchTodayStats = async () => {
    try {
      const token = getToken();
      const res = await axios.get(`${API_URL}/attendance/stats/today`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTodayStats(res.data);
    } catch (err) {
      console.error('Error fetching today stats:', err);
    }
  };

  const fetchClassAttendance = async () => {
    setLoading(true);
    try {
      const token = getToken();
      // 1. Fetch class students
      const studentsRes = await axios.get(`${API_URL}/admin/students`, {
        params: { classId: selectedClassId },
        headers: { Authorization: `Bearer ${token}` },
      });

      // Filter by selected class if API returns all
      const classStudents = (studentsRes.data || []).filter(
        s => (s.class?._id || s.class) === selectedClassId
      );
      setStudents(classStudents);

      // 2. Fetch existing attendance records for this class & date & session
      const attRes = await axios.get(`${API_URL}/attendance/class/${selectedClassId}`, {
        params: { date: selectedDate, session: selectedSession },
        headers: { Authorization: `Bearer ${token}` },
      });

      const existingRecords = attRes.data || [];
      const newMap = {};

      // Seed map with existing records or default to 'Present'
      classStudents.forEach(stu => {
        const found = existingRecords.find(r => (r.student?._id || r.student) === stu._id);
        if (found) {
          newMap[stu._id] = {
            recordId: found._id,
            status: found.status,
            lateMinutes: found.lateMinutes || 15,
            remarks: found.remarks || '',
            warning: found.activeWarning || null,
            justificationStatus: found.justificationStatus || 'None',
            justificationReason: found.justificationReason || '',
            justificationAttachmentUrl: found.justificationAttachmentUrl || '',
            recordedBy: found.recordedBy || null,
            createdAt: found.createdAt || null,
            exitPassRef: found.exitPassRef || null,
            notificationStatus: found.notificationStatus || 'Pending',
            whatsappSentAt: found.whatsappSentAt || null,
          };
        } else {
          newMap[stu._id] = {
            recordId: null,
            status: 'Present',
            lateMinutes: 15,
            remarks: '',
            warning: null,
            justificationStatus: 'None',
            justificationReason: '',
            justificationAttachmentUrl: '',
            recordedBy: null,
            createdAt: null,
            exitPassRef: null,
            notificationStatus: 'Pending',
            whatsappSentAt: null,
          };
        }
      });

      setAttendanceMap(newMap);
    } catch (err) {
      console.error('Error loading attendance sheet:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsAppForStudent = async (student) => {
    const state = attendanceMap[student._id] || {};
    const rawPhone = student.parent?.phoneNumber || student.user?.phoneNumber || '';
    if (!rawPhone) {
      alert('رقم هاتف ولي الأمر غير مسجل في ملف هذا التلميذ.');
      return;
    }

    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '213' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('213')) {
      cleanPhone = '213' + cleanPhone;
    }

    const studentName = student.firstNameArabic && student.lastNameArabic
      ? `${student.firstNameArabic} ${student.lastNameArabic}`
      : `${student.user?.firstName || ''} ${student.user?.lastName || ''}`.trim() || 'التلميذ';

    const currentClass = classes.find(c => c._id === selectedClassId);
    const className = currentClass?.name || 'القسم';
    const dateFormatted = new Date(selectedDate).toLocaleDateString('ar-DZ');

    let msg = '';
    if (state.status === 'Absent' || state.status === 'Unexcused') {
      msg = `السلام عليكم ورحمة الله، ولي أمر التلميذ(ة) *${studentName}* (القسم: ${className}).\n\nنحيطكم علماً بأنه تم تسجيل غياب التلميذ(ة) اليوم بتاريخ ${dateFormatted} عن حصة: *${selectedSession}* بمؤسسة حبر وألوان الخاصة.\n\nيرجى موافاة الإدارة التربوية بالتبرير في أقرب وقت لتفادي الخصم التأديبي (المادة 26).\n\nالمستشار التربوي - مؤسسة حبر وألوان`;
    } else if (state.status === 'Late') {
      msg = `السلام عليكم ورحمة الله، ولي أمر التلميذ(ة) *${studentName}* (القسم: ${className}).\n\nنحيطكم علماً بأنه تم تسجيل تأخر التلميذ(ة) اليوم بتاريخ ${dateFormatted} بـ *${state.lateMinutes || 15} دقيقة* بمؤسسة حبر وألوان الخاصة.\n\nالمستشار التربوي - مؤسسة حبر وألوان`;
    } else if (state.status === 'ExitPass') {
      msg = `السلام عليكم ورحمة الله، ولي أمر التلميذ(ة) *${studentName}* (القسم: ${className}).\n\nنحيطكم علماً بإصدار تصريح خروج مرخص ومؤشر رقمياً للتلميذ(ة) بتاريخ ${dateFormatted} (المادة 28).\n\nالمستشار التربوي - مؤسسة حبر وألوان`;
    } else {
      msg = `السلام عليكم ورحمة الله، إشعار رسمي من مؤسسة حبر وألوان الخاصة بخصوص حضور التلميذ(ة) *${studentName}*.`;
    }

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');

    if (state.recordId) {
      try {
        const token = getToken();
        await axios.post(`${API_URL}/attendance/${state.recordId}/whatsapp-log`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAttendanceMap(prev => ({
          ...prev,
          [student._id]: {
            ...prev[student._id],
            whatsappSentAt: new Date(),
            notificationStatus: 'Sent',
          }
        }));
      } catch (e) {
        // Log fail silently
      }
    }
  };

  const handleStatusChange = (studentId, newStatus) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        status: newStatus,
      },
    }));
  };

  const handleLateMinutesChange = (studentId, minutes) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        lateMinutes: parseInt(minutes, 10) || 15,
      },
    }));
  };

  const handleMarkAllPresent = () => {
    setAttendanceMap(prev => {
      const updated = { ...prev };
      students.forEach(stu => {
        updated[stu._id] = {
          ...(updated[stu._id] || {}),
          status: 'Present',
        };
      });
      return updated;
    });
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId || students.length === 0) return;
    setSaving(true);
    setSaveMessage('');
    try {
      const token = getToken();
      const records = students.map(stu => ({
        studentId: stu._id,
        status: attendanceMap[stu._id]?.status || 'Present',
        lateMinutes: attendanceMap[stu._id]?.lateMinutes || 0,
        remarks: attendanceMap[stu._id]?.remarks || '',
      }));

      const res = await axios.post(
        `${API_URL}/attendance/record-bulk`,
        {
          classId: selectedClassId,
          date: selectedDate,
          session: selectedSession,
          records,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSaveSuccess(true);
      setSaveMessage(res.data.message || 'تم حفظ سجل الحضور بنجاح!');
      if (res.data.triggeredWarningsCount > 0) {
        setSaveMessage(prev => `${prev} ⚠️ تم إصدار ${res.data.triggeredWarningsCount} استدعاء/إنذار لتلاميذ استنفدوا 3 غيابات.`);
      }

      fetchClassAttendance();
      fetchTodayStats();

      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err) {
      console.error('Error saving attendance:', err);
      setSaveMessage('حدث خطأ أثناء حفظ السجل.');
    } finally {
      setSaving(false);
    }
  };

  // Open Letter Modal for a student with warning
  const handleOpenWarningLetter = (student, warning) => {
    setSelectedStudentForLetter(student);
    setSelectedWarning(warning);
    setWarningModalOpen(true);
  };

  // Count current states
  const counts = {
    total: students.length,
    present: Object.values(attendanceMap).filter(v => v.status === 'Present').length,
    absent: Object.values(attendanceMap).filter(v => ['Absent', 'Unexcused'].includes(v.status)).length,
    late: Object.values(attendanceMap).filter(v => v.status === 'Late').length,
    excused: Object.values(attendanceMap).filter(v => v.status === 'Excused').length,
    exitPass: Object.values(attendanceMap).filter(v => v.status === 'ExitPass').length,
  };

  // Filtered students list based on search and status filter
  const filteredStudents = students.filter(stu => {
    const state = attendanceMap[stu._id] || { status: 'Present' };
    if (attendanceStatusFilter !== 'all') {
      if (attendanceStatusFilter === 'absent_any') {
        if (!['Absent', 'Unexcused'].includes(state.status)) return false;
      } else if (attendanceStatusFilter === 'warning') {
        if (!state.warning) return false;
      } else if (attendanceStatusFilter === 'justification') {
        if (state.justificationStatus !== 'Pending') return false;
      } else if (state.status !== attendanceStatusFilter) {
        return false;
      }
    }
    if (!attendanceStudentSearch.trim()) return true;
    const q = attendanceStudentSearch.trim().toLowerCase();
    const name = `${stu.firstNameArabic || ''} ${stu.lastNameArabic || ''} ${stu.user?.firstName || ''} ${stu.user?.lastName || ''}`.toLowerCase();
    const reg = `${stu.registrationNumber || ''} ${stu.nationalIdDigitization || ''}`.toLowerCase();
    return name.includes(q) || reg.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Today Stats Banner - Prestige Académique - Interactive Filter Cards */}
      {todayStats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <button
            type="button"
            onClick={() => setAttendanceStatusFilter('all')}
            className={`p-4 text-center rounded-2xl transition-all cursor-pointer shadow-xs border text-right ${
              attendanceStatusFilter === 'all'
                ? 'bg-[#7B1E3A] text-white border-[#7B1E3A] ring-2 ring-[#C9A24D]'
                : 'bg-[#FDFBF7] border-[#C9A24D]/35 hover:border-[#7B1E3A]'
            }`}
          >
            <p className={`text-xs font-bold ${attendanceStatusFilter === 'all' ? 'text-amber-200' : 'text-[#2B2022]/70'}`}>سجلات اليوم المسجلة</p>
            <p className={`text-2xl font-serif font-black mt-1 ${attendanceStatusFilter === 'all' ? 'text-white' : 'text-[#7B1E3A]'}`}>{todayStats.totalMarked || 0}</p>
          </button>

          <button
            type="button"
            onClick={() => setAttendanceStatusFilter(attendanceStatusFilter === 'Present' ? 'all' : 'Present')}
            className={`p-4 text-center rounded-2xl transition-all cursor-pointer shadow-xs border ${
              attendanceStatusFilter === 'Present'
                ? 'bg-emerald-700 text-white border-emerald-800 ring-2 ring-emerald-400'
                : 'bg-emerald-50/90 border-emerald-300 hover:bg-emerald-100 text-emerald-800'
            }`}
          >
            <p className="text-xs font-bold">حاضرون اليوم</p>
            <p className={`text-2xl font-serif font-black mt-1 ${attendanceStatusFilter === 'Present' ? 'text-white' : 'text-emerald-700'}`}>{todayStats.present || 0}</p>
          </button>

          <button
            type="button"
            onClick={() => setAttendanceStatusFilter(attendanceStatusFilter === 'absent_any' ? 'all' : 'absent_any')}
            className={`p-4 text-center rounded-2xl transition-all cursor-pointer shadow-xs border ${
              attendanceStatusFilter === 'absent_any'
                ? 'bg-rose-700 text-white border-rose-800 ring-2 ring-rose-400'
                : 'bg-rose-50/90 border-rose-300 hover:bg-rose-100 text-rose-800'
            }`}
          >
            <p className="text-xs font-bold">غائبون اليوم</p>
            <p className={`text-2xl font-serif font-black mt-1 ${attendanceStatusFilter === 'absent_any' ? 'text-white' : 'text-rose-700'}`}>{todayStats.absent || 0}</p>
          </button>

          <button
            type="button"
            onClick={() => setAttendanceStatusFilter(attendanceStatusFilter === 'Late' ? 'all' : 'Late')}
            className={`p-4 text-center rounded-2xl transition-all cursor-pointer shadow-xs border ${
              attendanceStatusFilter === 'Late'
                ? 'bg-[#C9A24D] text-[#2B2022] border-[#b08b3c] ring-2 ring-[#7B1E3A]'
                : 'bg-[#C9A24D]/15 border-[#C9A24D]/40 hover:bg-[#C9A24D]/25 text-[#7B1E3A]'
            }`}
          >
            <p className="text-xs font-bold">متأخرون اليوم</p>
            <p className="text-2xl font-serif font-black mt-1 text-[#7B1E3A]">{todayStats.late || 0}</p>
          </button>

          <button
            type="button"
            onClick={() => setAttendanceStatusFilter(attendanceStatusFilter === 'warning' ? 'all' : 'warning')}
            className={`p-4 text-center rounded-2xl transition-all cursor-pointer shadow-xs border ${
              attendanceStatusFilter === 'warning'
                ? 'bg-purple-700 text-white border-purple-800 ring-2 ring-purple-400'
                : 'bg-purple-50/90 border-purple-300 hover:bg-purple-100 text-purple-800'
            }`}
          >
            <p className="text-xs font-bold">إنذارات (3 غيابات)</p>
            <p className={`text-2xl font-serif font-black mt-1 ${attendanceStatusFilter === 'warning' ? 'text-white' : 'text-purple-700'}`}>{todayStats.pendingWarnings || 0}</p>
          </button>

          <button
            type="button"
            onClick={() => setAttendanceStatusFilter(attendanceStatusFilter === 'justification' ? 'all' : 'justification')}
            className={`p-4 text-center rounded-2xl transition-all cursor-pointer shadow-xs border ${
              attendanceStatusFilter === 'justification'
                ? 'bg-blue-700 text-white border-blue-800 ring-2 ring-blue-400'
                : 'bg-blue-50/90 border-blue-300 hover:bg-blue-100 text-blue-800'
            }`}
          >
            <p className="text-xs font-bold">تبريرات في الانتظار</p>
            <p className={`text-2xl font-serif font-black mt-1 ${attendanceStatusFilter === 'justification' ? 'text-white' : 'text-blue-700'}`}>{todayStats.pendingJustifications || 0}</p>
          </button>
        </div>
      )}

      {/* Filter and Control Bar - Prestige Académique */}
      <div className="bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-2xl p-5 shadow-sm backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Class Selector */}
            <div className="flex items-center gap-2.5 bg-white border-2 border-[#C9A24D]/45 hover:border-[#C9A24D] focus-within:border-[#7B1E3A] focus-within:ring-2 focus-within:ring-[#7B1E3A]/20 rounded-xl px-3.5 py-2 shadow-xs transition-all min-w-[200px]">
              <Users className="w-4 h-4 text-[#7B1E3A] shrink-0" />
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="bg-transparent text-[#2B2022] text-xs font-bold focus:outline-none cursor-pointer w-full"
              >
                {classes.map(cls => (
                  <option key={cls._id} value={cls._id} className="bg-white text-[#2B2022]">
                    {cls.name} {cls.description ? `(${cls.description})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div className="flex items-center gap-2.5 bg-white border-2 border-[#C9A24D]/45 hover:border-[#C9A24D] focus-within:border-[#7B1E3A] focus-within:ring-2 focus-within:ring-[#7B1E3A]/20 rounded-xl px-3.5 py-2 shadow-xs transition-all">
              <Calendar className="w-4 h-4 text-[#7B1E3A] shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-transparent text-[#2B2022] text-xs font-bold font-mono focus:outline-none cursor-pointer"
              />
            </div>

            {/* Session Selector */}
            <div className="flex items-center gap-2.5 bg-white border-2 border-[#C9A24D]/45 hover:border-[#C9A24D] focus-within:border-[#7B1E3A] focus-within:ring-2 focus-within:ring-[#7B1E3A]/20 rounded-xl px-3.5 py-2 shadow-xs transition-all">
              <Clock className="w-4 h-4 text-[#7B1E3A] shrink-0" />
              <select
                value={selectedSession}
                onChange={e => setSelectedSession(e.target.value)}
                className="bg-transparent text-[#2B2022] text-xs font-bold focus:outline-none cursor-pointer"
              >
                {SESSIONS.map(s => (
                  <option key={s.id} value={s.id} className="bg-white text-[#2B2022]">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Student Search Bar */}
            <div className="flex items-center gap-2 bg-white border-2 border-[#C9A24D]/45 hover:border-[#C9A24D] focus-within:border-[#7B1E3A] focus-within:ring-2 focus-within:ring-[#7B1E3A]/20 rounded-xl px-3 py-2 shadow-xs transition-all min-w-[200px]">
              <Search className="w-4 h-4 text-[#7B1E3A] shrink-0" />
              <input
                type="text"
                placeholder="بحث باسم التلميذ أو رقم التسجيل..."
                value={attendanceStudentSearch}
                onChange={e => setAttendanceStudentSearch(e.target.value)}
                className="bg-transparent text-[#2B2022] text-xs font-bold focus:outline-none w-full placeholder:text-[#2B2022]/40"
              />
              {attendanceStudentSearch && (
                <button
                  type="button"
                  onClick={() => setAttendanceStudentSearch('')}
                  className="text-stone-400 hover:text-[#7B1E3A]"
                  title="مسح البحث"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-white border-2 border-[#C9A24D]/40 rounded-xl p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'table' ? 'bg-[#7B1E3A] text-white shadow-xs' : 'text-[#2B2022]/70 hover:text-[#7B1E3A]'
                }`}
              >
                جدول
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'cards' ? 'bg-[#7B1E3A] text-white shadow-xs' : 'text-[#2B2022]/70 hover:text-[#7B1E3A]'
                }`}
              >
                بطاقات
              </button>
            </div>

            <button
              onClick={fetchClassAttendance}
              className="p-2 text-[#7B1E3A] hover:text-white bg-white hover:bg-[#7B1E3A] border-2 border-[#C9A24D]/40 rounded-xl transition-all cursor-pointer shadow-xs"
              title="تحديث القائمة"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {/* Periodical Absence Report Button (Article 26) */}
            <button
              type="button"
              onClick={() => setReportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-[#7B1E3A] border border-[#C9A24D]/40 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="استخراج تقرير أسبوعي أو شهري لحضور وغياب التلاميذ (المادة 26)"
            >
              <Calendar className="w-4 h-4 text-[#C9A24D]" />
              <span>تقرير الغيابات الدوري</span>
            </button>

            <button
              onClick={handleMarkAllPresent}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <span>تحديد الكل حاضر</span>
            </button>

            <button
              onClick={handleSaveAttendance}
              disabled={saving || students.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#7B1E3A] hover:bg-[#62162d] text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-[#7B1E3A]/20 disabled:opacity-50 cursor-pointer border border-[#C9A24D]/30"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>حفظ ورقة الحضور</span>
            </button>
          </div>
        </div>

        {/* Live Counters & Status Filter Pills */}
        <div className="mt-4 pt-4 border-t border-[#C9A24D]/20 flex flex-wrap items-center justify-between text-xs text-[#2B2022]/70 gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-[#2B2022]">تصفية سريعة:</span>
            <button
              type="button"
              onClick={() => setAttendanceStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-all ${
                attendanceStatusFilter === 'all'
                  ? 'bg-[#7B1E3A] text-white border-[#7B1E3A]'
                  : 'bg-white text-[#2B2022]/80 border-stone-200 hover:border-[#7B1E3A]'
              }`}
            >
              الكل ({counts.total})
            </button>
            <button
              type="button"
              onClick={() => setAttendanceStatusFilter('Present')}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-all ${
                attendanceStatusFilter === 'Present'
                  ? 'bg-emerald-700 text-white border-emerald-800'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              حاضر ({counts.present})
            </button>
            <button
              type="button"
              onClick={() => setAttendanceStatusFilter('absent_any')}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-all ${
                attendanceStatusFilter === 'absent_any'
                  ? 'bg-rose-700 text-white border-rose-800'
                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
              }`}
            >
              غائب ({counts.absent})
            </button>
            <button
              type="button"
              onClick={() => setAttendanceStatusFilter('Late')}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-all ${
                attendanceStatusFilter === 'Late'
                  ? 'bg-[#C9A24D] text-[#2B2022] border-[#b08b3c]'
                  : 'bg-[#C9A24D]/15 text-[#7B1E3A] border-[#C9A24D]/40 hover:bg-[#C9A24D]/25'
              }`}
            >
              متأخر ({counts.late})
            </button>
            <button
              type="button"
              onClick={() => setAttendanceStatusFilter('Excused')}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-all ${
                attendanceStatusFilter === 'Excused'
                  ? 'bg-blue-700 text-white border-blue-800'
                  : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
              }`}
            >
              مبرر ({counts.excused})
            </button>
            <button
              type="button"
              onClick={() => setAttendanceStatusFilter('ExitPass')}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-all ${
                attendanceStatusFilter === 'ExitPass'
                  ? 'bg-teal-700 text-white border-teal-800'
                  : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
              }`}
            >
              إذن خروج ({counts.exitPass})
            </button>
          </div>

          {saveMessage && (
            <div className={`px-3 py-1 rounded-lg text-xs font-bold ${saveSuccess ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}`}>
              {saveMessage}
            </div>
          )}
        </div>
      </div>

      {/* Attendance Sheet Container (Table or Cards) - Prestige Académique */}
      <div className="bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-2xl shadow-sm overflow-hidden backdrop-blur-md">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-[#2B2022]/60 gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#7B1E3A]" />
            <span className="font-serif font-bold">جاري تحميل قائمة تلاميذ القسم...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-[#2B2022]/50 border border-dashed border-[#C9A24D]/30 rounded-2xl m-6 bg-white/40">
            <Users className="w-12 h-12 mx-auto text-[#C9A24D]/50 mb-3" />
            <p className="font-serif font-bold text-[#7B1E3A] text-base">لا توجد نتائج مطابقة لبحثك أو تصفية الحضور.</p>
            <p className="text-xs text-[#2B2022]/60 mt-1">تأكد من اختيار القسم المطلوب أو مسح حقول التصفية.</p>
          </div>
        ) : viewMode === 'table' ? (
          /* =================== TABLE VIEW =================== */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1020px] text-right text-sm">
              <thead className="bg-[#F3E9DC] text-[#7B1E3A] text-xs border-b border-[#C9A24D]/25 font-serif font-bold">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4 min-w-[220px]">التلميذ</th>
                  <th className="py-3.5 px-4 min-w-[120px]">رقم الرقمنة</th>
                  <th className="py-3.5 px-4 text-center min-w-[460px]">حالة الحضور والغياب (6 حالات)</th>
                  <th className="py-3.5 px-4 text-center min-w-[170px]">التنبيهات والمبررات</th>
                  <th className="py-3.5 px-4 min-w-[160px]">ملاحظة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C9A24D]/15 text-[#2B2022]">
                {filteredStudents.map((stu, index) => {
                  const state = attendanceMap[stu._id] || { status: 'Present', lateMinutes: 15, remarks: '' };
                  const studentName = stu.firstNameArabic && stu.lastNameArabic
                    ? `${stu.firstNameArabic} ${stu.lastNameArabic}`
                    : `${stu.user?.firstName || ''} ${stu.user?.lastName || ''}`.trim() || 'تلميذ';

                  const hasWarning = state.warning || null;

                  return (
                    <tr key={stu._id} className="hover:bg-[#F3E9DC]/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[#2B2022]/50 text-xs text-center">{index + 1}</td>
                      
                      {/* Student info */}
                      <td className="py-3.5 px-4 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#7B1E3A]/10 border border-[#C9A24D]/40 flex items-center justify-center font-bold text-[#7B1E3A] text-xs overflow-hidden shrink-0">
                            {stu.user?.profilePic ? (
                              <img src={stu.user.profilePic} alt="" className="w-full h-full object-cover" />
                            ) : (
                              studentName.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[#2B2022] text-sm truncate">{studentName}</p>
                            <p className="text-xs text-[#2B2022]/60 truncate">
                              ولي الأمر: {stu.parent?.fatherNameArabic || stu.parent?.phoneNumber || '—'}
                            </p>
                            {state.recordedBy && (
                              <span className="text-[10px] text-slate-400 block font-sans truncate">
                                سجل: {state.recordedBy?.firstName} {state.recordedBy?.lastName}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Digitization ID */}
                      <td className="py-3.5 px-4 font-mono text-xs text-[#7B1E3A] font-bold min-w-[120px]">
                        {stu.nationalIdDigitization || stu.registrationNumber || '—'}
                      </td>

                      {/* 6 States Action Badges - Segmented Grouping */}
                      <td className="py-3.5 px-4 min-w-[460px] text-center">
                        <div className="inline-flex items-center justify-center gap-1 p-1 bg-stone-100/90 rounded-xl border border-stone-200 shadow-2xs flex-nowrap">
                          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                            const isActive = state.status === key;
                            const Icon = cfg.icon;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => handleStatusChange(stu._id, key)}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                                  isActive ? cfg.activeColor : `${cfg.color} border-transparent`
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5 shrink-0" />
                                <span>{cfg.labelArabic}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Inline late minutes selector */}
                        {state.status === 'Late' && (
                          <div className="inline-flex items-center gap-1.5 bg-white border-2 border-[#C9A24D]/50 rounded-xl px-2.5 py-1 mr-2 shadow-2xs align-middle">
                            <span className="text-[10px] text-[#7B1E3A] font-extrabold whitespace-nowrap">الدقائق:</span>
                            <input
                              type="number"
                              min="5"
                              max="120"
                              step="5"
                              value={state.lateMinutes || 15}
                              onChange={e => handleLateMinutesChange(stu._id, e.target.value)}
                              className="w-12 bg-transparent text-[#7B1E3A] font-mono text-xs text-center focus:outline-none font-bold"
                            />
                          </div>
                        )}
                      </td>

                      {/* Warning, WhatsApp, Exit Pass and Justification Badges (Articles 25, 26, 28) */}
                      <td className="py-3.5 px-4 text-center min-w-[170px]">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* 3-Absence Warning Trigger Button (Article 26) */}
                          {hasWarning ? (
                            <button
                              type="button"
                              onClick={() => handleOpenWarningLetter(stu, hasWarning)}
                              className="flex items-center gap-1 px-2 py-1 bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-800 font-bold rounded-lg text-[11px] animate-pulse transition-all shadow-xs cursor-pointer"
                              title="طباعة وإرسال استدعاء رسمي لولي الأمر بموجب 3 غيابات (المادة 26)"
                            >
                              <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                              <span>استدعاء</span>
                              <Printer className="w-3 h-3 ml-0.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenWarningLetter(stu, null)}
                              className="text-[#2B2022]/60 hover:text-[#7B1E3A] text-xs flex items-center gap-1 transition-colors cursor-pointer px-1.5 py-0.5 rounded border border-transparent hover:border-slate-200"
                              title="إنشاء استدعاء رسمي يدوي"
                            >
                              <FileText className="w-3 h-3" />
                              <span>استدعاء</span>
                            </button>
                          )}

                          {/* Direct WhatsApp Instant Notice Button */}
                          {['Absent', 'Unexcused', 'Late', 'ExitPass'].includes(state.status) && (
                            <button
                              type="button"
                              onClick={() => handleSendWhatsAppForStudent(stu)}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all shadow-xs cursor-pointer border ${
                                state.whatsappSentAt
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
                              }`}
                              title="إرسال إشعار فوري لولي الأمر عبر واتساب وفق المادة 26"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>{state.whatsappSentAt ? 'واتساب ✓' : 'واتساب'}</span>
                            </button>
                          )}

                          {/* Digital Exit Pass Button */}
                          {state.status === 'ExitPass' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStudentForPass(stu);
                                setSelectedPassForModal(state.exitPassRef || { student: stu._id, class: selectedClassId, date: selectedDate });
                                setExitPassModalOpen(true);
                              }}
                              className="flex items-center gap-1 px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                              title="معاينة وطباعة بطاقة تصريح الخروج الرقمي (المادة 28)"
                            >
                              <ShieldCheck className="w-3 h-3 text-teal-600" />
                              <span>تصريح</span>
                            </button>
                          )}

                          {/* Justification Review Button */}
                          {state.justificationStatus === 'Pending' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStudentForJustification(stu);
                                setSelectedAttendanceForReview({
                                  _id: state.recordId,
                                  date: selectedDate,
                                  session: selectedSession,
                                  justificationReason: state.justificationReason,
                                  justificationAttachmentUrl: state.justificationAttachmentUrl,
                                });
                                setJustificationModalOpen(true);
                              }}
                              className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer animate-pulse"
                              title="معاينة وقبول أو رفض التبرير المقدم"
                            >
                              تبرير معلق
                            </button>
                          ) : state.justificationStatus === 'Approved' ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold">
                              مبرر رسمياً
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Remarks Input */}
                      <td className="py-3.5 px-4 min-w-[160px]">
                        <input
                          type="text"
                          placeholder="ملاحظة..."
                          value={state.remarks || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setAttendanceMap(prev => ({
                              ...prev,
                              [stu._id]: { ...prev[stu._id], remarks: val },
                            }));
                          }}
                          className="w-full bg-white border-2 border-[#C9A24D]/35 hover:border-[#C9A24D] focus:border-[#7B1E3A] focus:ring-2 focus:ring-[#7B1E3A]/20 rounded-xl px-3 py-1.5 text-xs text-[#2B2022] font-semibold placeholder-[#2B2022]/40 shadow-2xs focus:outline-none transition-all"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* =================== CARDS VIEW (Responsive & Mobile Friendly) =================== */
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((stu, index) => {
              const state = attendanceMap[stu._id] || { status: 'Present', lateMinutes: 15, remarks: '' };
              const studentName = stu.firstNameArabic && stu.lastNameArabic
                ? `${stu.firstNameArabic} ${stu.lastNameArabic}`
                : `${stu.user?.firstName || ''} ${stu.user?.lastName || ''}`.trim() || 'تلميذ';

              const hasWarning = state.warning || null;

              return (
                <div
                  key={stu._id}
                  className="bg-white border-2 border-[#C9A24D]/35 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3"
                >
                  {/* Top: Student Header */}
                  <div className="flex items-start justify-between gap-2.5 pb-2 border-b border-[#C9A24D]/20">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#7B1E3A]/10 border border-[#C9A24D]/40 flex items-center justify-center font-bold text-[#7B1E3A] text-sm overflow-hidden shrink-0">
                        {stu.user?.profilePic ? (
                          <img src={stu.user.profilePic} alt="" className="w-full h-full object-cover" />
                        ) : (
                          studentName.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[#2B2022] text-sm truncate">{studentName}</p>
                        <p className="text-xs text-[#7B1E3A] font-mono font-bold truncate">
                          رقم: {stu.nationalIdDigitization || stu.registrationNumber || '—'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded-lg shrink-0">
                      #{index + 1}
                    </span>
                  </div>

                  {/* 6 Status Button Grid (3 columns x 2 rows) */}
                  <div>
                    <p className="text-[11px] font-bold text-[#2B2022]/60 mb-1.5">تحديد حالة الحضور:</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                        const isActive = state.status === key;
                        const Icon = cfg.icon;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleStatusChange(stu._id, key)}
                            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isActive
                                ? `${cfg.activeColor} ring-2 ring-[#7B1E3A]/30 scale-[1.02]`
                                : `${cfg.color} border-stone-200`
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-[11px]">{cfg.labelArabic}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Inline late minutes selector if late */}
                    {state.status === 'Late' && (
                      <div className="flex items-center justify-between bg-amber-50 border border-amber-300 rounded-xl px-3 py-1.5 mt-2 shadow-2xs">
                        <span className="text-xs text-[#7B1E3A] font-extrabold">دقائق التأخر:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="5"
                            max="120"
                            step="5"
                            value={state.lateMinutes || 15}
                            onChange={e => handleLateMinutesChange(stu._id, e.target.value)}
                            className="w-16 bg-white border border-amber-300 rounded-lg text-[#7B1E3A] font-mono text-xs text-center py-1 focus:outline-none font-bold"
                          />
                          <span className="text-xs text-slate-500 font-bold">دقيقة</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Action Badges */}
                  <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-stone-100 flex-wrap">
                    {hasWarning && (
                      <button
                        type="button"
                        onClick={() => handleOpenWarningLetter(stu, hasWarning)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-800 font-bold rounded-lg text-xs animate-pulse transition-all cursor-pointer"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>استدعاء (3 غيابات)</span>
                      </button>
                    )}

                    {['Absent', 'Unexcused', 'Late', 'ExitPass'].includes(state.status) && (
                      <button
                        type="button"
                        onClick={() => handleSendWhatsAppForStudent(stu)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                          state.whatsappSentAt
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{state.whatsappSentAt ? 'واتساب ✓' : 'إشعار واتساب'}</span>
                      </button>
                    )}

                    {state.status === 'ExitPass' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudentForPass(stu);
                          setSelectedPassForModal(state.exitPassRef || { student: stu._id, class: selectedClassId, date: selectedDate });
                          setExitPassModalOpen(true);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                        <span>تصريح خروج</span>
                      </button>
                    )}
                  </div>

                  {/* Remarks input */}
                  <input
                    type="text"
                    placeholder="ملاحظة حول التلميذ..."
                    value={state.remarks || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setAttendanceMap(prev => ({
                        ...prev,
                        [stu._id]: { ...prev[stu._id], remarks: val },
                      }));
                    }}
                    className="w-full bg-[#FAF7F2] border border-[#C9A24D]/30 focus:border-[#7B1E3A] focus:ring-1 focus:ring-[#7B1E3A]/20 rounded-xl px-3 py-1.5 text-xs text-[#2B2022] font-semibold placeholder-[#2B2022]/40 focus:outline-none transition-all"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3-Absence Warning Letter Modal (Article 26) */}
      <AbsenceWarningLetterModal
        isOpen={warningModalOpen}
        onClose={() => setWarningModalOpen(false)}
        warning={selectedWarning}
        student={selectedStudentForLetter}
      />

      {/* Digital Exit Pass Modal (Article 28) */}
      <DigitalExitPassModal
        isOpen={exitPassModalOpen}
        onClose={() => setExitPassModalOpen(false)}
        pass={selectedPassForModal}
        student={selectedStudentForPass}
      />

      {/* Justification Review Modal (Article 26) */}
      <AttendanceJustificationModal
        isOpen={justificationModalOpen}
        onClose={() => setJustificationModalOpen(false)}
        attendanceRecord={selectedAttendanceForReview}
        student={selectedStudentForJustification}
        onReviewed={fetchClassAttendance}
      />

      {/* Periodical Attendance Report Modal (Article 26) */}
      <AttendanceReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        defaultClassId={selectedClassId}
        classes={classes}
      />
    </div>
  );
}
