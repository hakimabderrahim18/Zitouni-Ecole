import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, Users, User, BookOpen, Printer,
  RefreshCw, CheckCircle, AlertCircle, FileSpreadsheet,
  Plus, Edit2, Trash2, X, Save
} from 'lucide-react';
import { useSchoolStore } from '../store/useSchoolStore';
import { useAuthStore } from '../store/useAuthStore';
import TimetableExcelImportModal from './TimetableExcelImportModal';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getToken = () => {
  return useAuthStore.getState().accessToken || localStorage.getItem('zitouni_access_token') || localStorage.getItem('token') || '';
};

const KNOWN_SUBJECTS = [
  { code: 'MATHS', name: 'الرياضيات' },
  { code: 'ARAB', name: 'اللغة العربية' },
  { code: 'HISGE', name: 'التاريخ والجغرافيا' },
  { code: 'PHYS', name: 'العلوم الفيزيائية' },
  { code: 'FRAN', name: 'اللغة الفرنسية' },
  { code: 'ANG', name: 'اللغة الإنجليزية' },
  { code: 'SCIEN', name: 'علوم الطبيعة والحياة' },
  { code: 'ISLAM', name: 'التربية الإسلامية' },
  { code: 'PHILO', name: 'الفلسفة' },
  { code: 'INFO', name: 'الإعلام الآلي' },
  { code: 'SPORT', name: 'التربية البدنية والرياضية' },
  { code: 'GEST', name: 'تسيير واقتصاد' },
  { code: 'COMPT', name: 'محاسبة ومالية' },
  { code: 'DROIT', name: 'القانون' },
  { code: 'GMECA', name: 'هندسة ميكانيكية' },
  { code: 'GCIVL', name: 'هندسة مدنية' },
  { code: 'DESIN', name: 'الرسم والتربية التشكيلية' },
  { code: 'ITA', name: 'اللغة الإيطالية' },
  { code: 'ESP', name: 'اللغة الإسبانية' },
];

// Prestige Académique subtle color palette for school subjects
const SUBJECT_COLORS = {
  'MATHS': 'bg-[#7B1E3A]/10 text-[#7B1E3A] border-[#7B1E3A]/30',
  'ARAB': 'bg-emerald-50 text-emerald-900 border-emerald-300',
  'HISGE': 'bg-[#C9A24D]/15 text-[#7B1E3A] border-[#C9A24D]/40',
  'PHYS': 'bg-indigo-50 text-indigo-900 border-indigo-200',
  'FRAN': 'bg-blue-50 text-blue-900 border-blue-200',
  'ANG': 'bg-sky-50 text-sky-900 border-sky-200',
  'SCIEN': 'bg-teal-50 text-teal-900 border-teal-200',
  'ISLAM': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'PHILO': 'bg-purple-50 text-purple-900 border-purple-200',
  'INFO': 'bg-cyan-50 text-cyan-900 border-cyan-200',
  'SPORT': 'bg-orange-50 text-orange-900 border-orange-200',
  'GEST': 'bg-[#F3E9DC] text-[#7B1E3A] border-[#C9A24D]/40',
  'COMPT': 'bg-amber-50 text-amber-900 border-amber-300',
  'DROIT': 'bg-violet-50 text-violet-900 border-violet-200',
  'GMECA': 'bg-rose-50 text-rose-900 border-rose-200',
  'GCIVL': 'bg-stone-100 text-stone-900 border-stone-300',
  'DESIN': 'bg-pink-50 text-pink-900 border-pink-200',
  'ITA': 'bg-emerald-50 text-emerald-900 border-emerald-200',
  'ESP': 'bg-amber-50 text-amber-900 border-amber-200',
};

const DEFAULT_DAYS = [
  { code: 'Dimanche', nameArabic: 'الأحد' },
  { code: 'Lundi', nameArabic: 'الإثنين' },
  { code: 'Mardi', nameArabic: 'الثلاثاء' },
  { code: 'Mercredi', nameArabic: 'الأربعاء' },
  { code: 'Jeudi', nameArabic: 'الخميس' },
];

const DEFAULT_HOURS = [
  { code: '8H30', timeSlot: '08:30 - 09:30' },
  { code: '9H30', timeSlot: '09:30 - 10:30' },
  { code: '10H30', timeSlot: '10:30 - 11:30' },
  { code: '11H30', timeSlot: '11:30 - 12:30' },
  { code: '13H30', timeSlot: '13:30 - 14:30' },
  { code: '14H30', timeSlot: '14:30 - 15:30' },
  { code: '15H30', timeSlot: '15:30 - 16:30' },
];

export default function TimetableGrid({ canImport = true, fixedDivision = null, fixedTeacher = null, fixedGroup = null }) {
  const { settings } = useSchoolStore();
  const [viewMode, setViewMode] = useState(fixedTeacher ? 'teacher' : 'division'); // 'division' | 'teacher'
  const [metadata, setMetadata] = useState(null);
  const [selectedDivision, setSelectedDivision] = useState(fixedDivision || '1AM1');
  const [selectedTeacher, setSelectedTeacher] = useState(fixedTeacher || '');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedDayFilter, setSelectedDayFilter] = useState('all');

  useEffect(() => {
    if (fixedDivision) setSelectedDivision(fixedDivision);
  }, [fixedDivision]);

  // Fetch metadata on mount
  useEffect(() => {
    fetchMetadata();
  }, []);

  // Fetch entries when viewMode, division or teacher changes
  useEffect(() => {
    if (viewMode === 'division' && selectedDivision) {
      fetchDivisionTimetable(selectedDivision);
    } else if (viewMode === 'teacher' && selectedTeacher) {
      fetchTeacherTimetable(selectedTeacher);
    }
  }, [viewMode, selectedDivision, selectedTeacher]);

  const fetchMetadata = async () => {
    try {
      const token = getToken();
      const user = useAuthStore.getState().user;
      if (user?.role === 'student' && !fixedDivision) {
        try {
          const myRes = await axios.get(`${API_URL}/timetable/my`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (myRes.data?.division) {
            setSelectedDivision(myRes.data.division);
            if (myRes.data.group) setSelectedGroupFilter(myRes.data.group);
            setEntries(myRes.data.entries || []);
          }
        } catch (_) {}
      }

      const res = await axios.get(`${API_URL}/timetable/metadata`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMetadata(res.data);
      if (res.data.divisions && res.data.divisions.length > 0 && !fixedDivision && (!user || user.role !== 'student')) {
        if (!selectedDivision || !res.data.divisions.some(d => d.code === selectedDivision)) {
          setSelectedDivision(res.data.divisions[0].code);
        }
      }
      if (res.data.teachers && res.data.teachers.length > 0 && !fixedTeacher) {
        if (!selectedTeacher || !res.data.teachers.includes(selectedTeacher)) {
          setSelectedTeacher(res.data.teachers[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching timetable metadata:', err);
    }
  };

  const fetchDivisionTimetable = async (divCode) => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await axios.get(`${API_URL}/timetable/division/${divCode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEntries(res.data.entries || []);
    } catch (err) {
      console.error('Error loading division timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherTimetable = async (teacherName) => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await axios.get(`${API_URL}/timetable/teacher/${teacherName}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEntries(res.data.entries || []);
    } catch (err) {
      console.error('Error loading teacher timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  // CRUD Entry State
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [entryForm, setEntryForm] = useState({
    day: 'Dimanche',
    hour: '8H30',
    division: '',
    subjectCode: 'MATHS',
    subjectName: 'الرياضيات',
    teacherName: '',
    room: '',
    group: '',
    modality: 'CG',
    regr: '',
    remarks: '',
  });
  const [submittingEntry, setSubmittingEntry] = useState(false);
  const [entryError, setEntryError] = useState('');

  // Open Add Entry Modal
  const openAddEntryModal = (prefillDay = null, prefillHour = null) => {
    setEditingEntryId(null);
    setEntryError('');
    setEntryForm({
      day: prefillDay || (allDays[0]?.code || 'Dimanche'),
      hour: prefillHour || (hours[0]?.code || '8H30'),
      division: selectedDivision || (metadata?.divisions?.[0]?.code || '1AM1'),
      subjectCode: 'MATHS',
      subjectName: 'الرياضيات',
      teacherName: (viewMode === 'teacher' ? selectedTeacher : (metadata?.teachers?.[0] || '')),
      room: '',
      group: '',
      modality: 'CG',
      regr: '',
      remarks: '',
    });
    setIsEntryModalOpen(true);
  };

  // Open Edit Entry Modal
  const openEditEntryModal = (entry) => {
    setEditingEntryId(entry._id);
    setEntryError('');
    setEntryForm({
      day: entry.day || 'Dimanche',
      hour: entry.hour || '8H30',
      division: entry.division || selectedDivision,
      subjectCode: entry.subjectCode || 'MATHS',
      subjectName: entry.subjectName || '',
      teacherName: entry.teacherName || '',
      room: entry.room || '',
      group: entry.group || '',
      modality: entry.modality || 'CG',
      regr: entry.regr || '',
      remarks: entry.remarks || '',
    });
    setIsEntryModalOpen(true);
  };

  // Delete Entry
  const handleDeleteEntry = async (id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه الحصة الدراسية؟')) {
      return;
    }
    try {
      const token = getToken();
      await axios.delete(`${API_URL}/timetable/entries/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEntries(prev => prev.filter(e => e._id !== id));
      fetchMetadata();
    } catch (err) {
      alert(err.response?.data?.message || 'تعذر حذف الحصة الدراسية');
    }
  };

  // Save Entry (Create or Update)
  const handleSaveEntry = async (e) => {
    e.preventDefault();
    setEntryError('');
    setSubmittingEntry(true);
    try {
      const token = getToken();
      if (editingEntryId) {
        const res = await axios.put(`${API_URL}/timetable/entries/${editingEntryId}`, entryForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const updated = res.data.entry;
        setEntries(prev => prev.map(e => e._id === editingEntryId ? updated : e));
      } else {
        const res = await axios.post(`${API_URL}/timetable/entries`, entryForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const created = res.data.entry;
        if (viewMode === 'division' && created.division === selectedDivision) {
          setEntries(prev => [...prev.filter(e => !(e.day === created.day && e.hour === created.hour)), created]);
        } else if (viewMode === 'teacher' && created.teacherName?.toLowerCase() === selectedTeacher?.toLowerCase()) {
          setEntries(prev => [...prev.filter(e => !(e.day === created.day && e.hour === created.hour)), created]);
        }
      }
      setIsEntryModalOpen(false);
      fetchMetadata();
    } catch (err) {
      setEntryError(err.response?.data?.message || 'حدث خطأ أثناء حفظ الحصة الدراسية');
    } finally {
      setSubmittingEntry(false);
    }
  };

  // Find slots matching day and hour
  const getSlotEntries = (dayCode, hourCode) => {
    const matched = entries.filter(e => e.day === dayCode && e.hour === hourCode);
    if (fixedGroup) {
      const filtered = matched.filter(
        e => !e.group || e.group === fixedGroup || e.group === 'الكل' || e.group === 'CG'
      );
      if (filtered.length > 0) return filtered;
    }
    return matched;
  };

  const handlePrint = () => {
    window.print();
  };

  const allDays = metadata?.days || DEFAULT_DAYS;
  const visibleDays = selectedDayFilter === 'all'
    ? allDays
    : allDays.filter(d => d.code === selectedDayFilter || d.nameArabic === selectedDayFilter);
  const hours = metadata?.hours || DEFAULT_HOURS;

  const currentTitle = viewMode === 'division'
    ? `جدول توقيت القسم: ${metadata?.divisions?.find(d => d.code === selectedDivision)?.nameArabic || selectedDivision}`
    : `جدول توقيت الأستاذ(ة): ${selectedTeacher}`;

  return (
    <div className="space-y-6">
      {/* Controls & Switcher (Screen Only) - Prestige Académique */}
      <div className="bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-2xl p-4 sm:p-5 shadow-sm backdrop-blur-md print:hidden space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
          {/* Mode Switcher */}
          {!fixedDivision && !fixedTeacher && (
            <div className="flex items-center gap-1.5 bg-[#F3E9DC]/60 p-1.5 rounded-xl border border-[#C9A24D]/25 w-full sm:w-auto">
              <button
                onClick={() => setViewMode('division')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'division'
                    ? 'bg-[#7B1E3A] text-white shadow-md shadow-[#7B1E3A]/20'
                    : 'text-[#2B2022]/70 hover:text-[#7B1E3A]'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>حسب القسم</span>
              </button>
              <button
                onClick={() => setViewMode('teacher')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'teacher'
                    ? 'bg-[#7B1E3A] text-white shadow-md shadow-[#7B1E3A]/20'
                    : 'text-[#2B2022]/70 hover:text-[#7B1E3A]'
                }`}
              >
                <User className="w-4 h-4" />
                <span>حسب الأستاذ</span>
              </button>
            </div>
          )}

          {/* Selector Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1 min-w-0">
            {viewMode === 'division' && !fixedDivision && (
              <div className="flex items-center gap-2 bg-white border border-[#C9A24D]/35 rounded-xl px-3 py-2 shadow-sm flex-1 min-w-0">
                <Users className="w-4 h-4 text-[#7B1E3A] shrink-0" />
                <select
                  value={selectedDivision}
                  onChange={e => setSelectedDivision(e.target.value)}
                  className="bg-transparent text-[#2B2022] text-xs font-bold focus:outline-none cursor-pointer w-full truncate"
                >
                  {(metadata?.divisions || []).map(d => (
                    <option key={d.code} value={d.code} className="bg-white text-[#2B2022]">
                      {d.code} — {d.nameArabic}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {viewMode === 'teacher' && !fixedTeacher && (
              <div className="flex items-center gap-2 bg-white border border-[#C9A24D]/35 rounded-xl px-3 py-2 shadow-sm flex-1 min-w-0">
                <User className="w-4 h-4 text-[#7B1E3A] shrink-0" />
                <select
                  value={selectedTeacher}
                  onChange={e => setSelectedTeacher(e.target.value)}
                  className="bg-transparent text-[#2B2022] text-xs font-bold focus:outline-none cursor-pointer w-full truncate"
                >
                  {(metadata?.teachers || []).map(t => (
                    <option key={t} value={t} className="bg-white text-[#2B2022]">
                      الأستاذ(ة): {t}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => {
                if (viewMode === 'division') fetchDivisionTimetable(selectedDivision);
                else fetchTeacherTimetable(selectedTeacher);
              }}
              className="p-2.5 text-[#2B2022]/70 hover:text-[#7B1E3A] bg-white hover:bg-[#F3E9DC]/40 border border-[#C9A24D]/25 rounded-xl transition-colors cursor-pointer shadow-sm shrink-0"
              title="تحديث"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            {canImport && (
              <>
                <button
                  type="button"
                  onClick={() => openAddEntryModal()}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-[#7B1E3A] hover:bg-[#62162d] text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-[#7B1E3A]/20 cursor-pointer border border-[#C9A24D]/35 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 text-[#C9A24D]" />
                  <span>إضافة حصة دراسية</span>
                </button>

                <button
                  onClick={() => setImportModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-[#F3E9DC]/40 border border-[#C9A24D]/35 text-[#7B1E3A] font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm w-full sm:w-auto"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#C9A24D]" />
                  <span>استيراد ملف RAN09.DBF</span>
                </button>
              </>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-[#F3E9DC]/40 border border-[#C9A24D]/30 text-[#2B2022] font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer w-full sm:w-auto"
            >
              <Printer className="w-4 h-4 text-[#7B1E3A]" />
              <span>طباعة جدول الحصص</span>
            </button>
          </div>
        </div>

        {/* Day Filter Pills Toolbar (User Request - Optimized for Phone swipe) */}
        <div className="pt-3 border-t border-[#C9A24D]/25 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7B1E3A] font-serif flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#C9A24D]" />
              <span>تصفية أيام الأسبوع:</span>
            </span>
            {selectedDayFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedDayFilter('all')}
                className="text-[11px] text-[#7B1E3A] hover:underline font-bold"
              >
                عرض الأسبوع كاملاً
              </button>
            )}
          </div>

          {/* Horizontal scrollable pills on phone viewport */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none -mx-1 px-1 flex-nowrap">
            <button
              type="button"
              onClick={() => setSelectedDayFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs whitespace-nowrap ${
                selectedDayFilter === 'all'
                  ? 'bg-[#7B1E3A] text-white shadow-xs'
                  : 'bg-white hover:bg-[#F3E9DC] text-[#2B2022] border border-[#C9A24D]/35'
              }`}
            >
              جميع الأيام (5 أيام)
            </button>
            {allDays.map((d) => (
              <button
                key={d.code}
                type="button"
                onClick={() => setSelectedDayFilter(d.code)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs whitespace-nowrap ${
                  selectedDayFilter === d.code
                    ? 'bg-[#7B1E3A] text-white shadow-xs'
                    : 'bg-white hover:bg-[#F3E9DC] text-[#2B2022] border border-[#C9A24D]/35'
                }`}
              >
                {d.nameArabic} ({d.code})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Printable Schedule Card - Prestige Académique (Phone Mode Optimized) */}
      <div className="bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-2xl p-3.5 sm:p-6 shadow-sm backdrop-blur-md print:bg-white print:text-black print:border-none print:shadow-none print:p-2">
        {/* Printable Official Header */}
        <div className="border-b border-[#C9A24D]/25 pb-4 mb-4 sm:mb-6 print:border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-right">
            {/* Institution info */}
            <div className="text-center md:text-right space-y-0.5">
              <h2 className="text-base sm:text-lg font-serif font-black text-[#7B1E3A] print:text-slate-900 leading-snug">
                {settings?.institutionName || 'مؤسسة التربية والتعليم حبر وألوان الخاصة'}
              </h2>
              <p className="text-xs text-[#2B2022]/70 print:text-slate-600">
                {settings?.schoolNameArabic || 'مدرسة حبر'} — {settings?.schoolNameFrench || 'Groupe scolaire Encre & Pastel'}
              </p>
              <p className="text-[11px] text-[#C9A24D] print:text-slate-500 italic font-serif">
                « {settings?.slogan || 'يا نشء أنت رجاؤنا'} »
              </p>
            </div>

            {/* Title & Academic Year */}
            <div className="text-center space-y-1">
              <div className="inline-block px-4 py-1.5 bg-[#F3E9DC] border border-[#C9A24D]/40 rounded-xl print:bg-slate-100 print:border-slate-400 shadow-2xs">
                <h3 className="font-serif font-black text-[#7B1E3A] print:text-slate-900 text-sm sm:text-base leading-snug">{currentTitle}</h3>
              </div>
              <p className="text-[11px] sm:text-xs text-[#2B2022]/70 print:text-slate-600 font-mono">السنة الدراسية: 2025 - 2026</p>
            </div>

            {/* Location & Load */}
            <div className="text-center md:text-left text-xs text-[#2B2022]/70">
              <p className="font-medium">{settings?.location || 'أولاد فايت - الجزائر غرب'}</p>
              <p className="font-mono mt-1 text-[#7B1E3A] font-bold bg-[#7B1E3A]/10 px-2.5 py-0.5 rounded-full inline-block border border-[#7B1E3A]/20">
                {entries.length} حصة أسبوعية
              </p>
            </div>
          </div>
        </div>

        {/* Timetable Grid Table */}
        {loading ? (
          <div className="flex items-center justify-center p-16 text-[#2B2022]/60 gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#7B1E3A]" />
            <span className="font-serif font-bold">جاري تحميل جدول التوقيت...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-16 text-center text-[#2B2022]/50 border border-dashed border-[#C9A24D]/30 rounded-2xl bg-white/40">
            <Calendar className="w-12 h-12 mx-auto text-[#C9A24D]/50 mb-3" />
            <p className="font-serif font-bold text-[#7B1E3A] text-base">لا توجد حصص مسجلة لهذا الجدول حالياً.</p>
            <p className="text-xs text-[#2B2022]/60 mt-1">يمكنك استيراد ملف RAN09.DBF.xlsx لملء الجداول آلياً بضغطة واحدة.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Mobile swipe hint when showing full week */}
            {visibleDays.length > 1 && (
              <div className="block sm:hidden text-center text-[11px] text-[#7B1E3A] font-bold bg-[#F3E9DC]/60 py-1.5 px-2 rounded-xl border border-[#C9A24D]/25">
                👉 اسحب الجدول أفقياً للاطلاع على جميع أيام الأسبوع
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-[#C9A24D]/25 shadow-2xs">
              <table className={`w-full border-collapse text-center text-xs ${visibleDays.length > 1 ? 'min-w-[620px] sm:min-w-0' : 'w-full'}`}>
                <thead>
                  <tr className="bg-[#F3E9DC] text-[#7B1E3A] border-b border-[#C9A24D]/30 font-serif">
                    <th className="py-2.5 sm:py-3 px-1.5 sm:px-2 border-l border-[#C9A24D]/25 w-20 sm:w-28 font-bold text-[10px] sm:text-xs">
                      التوقيت / اليوم
                    </th>
                    {visibleDays.map(d => (
                      <th key={d.code} className="py-2.5 sm:py-3 px-2 sm:px-3 border-l border-[#C9A24D]/25 font-black text-xs sm:text-sm text-[#7B1E3A]">
                        {d.nameArabic}
                        <span className="block text-[10px] font-normal text-[#2B2022]/60 font-sans">{d.code}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hours.map((h, hIdx) => {
                    const isBreakSlot = h.code === '11H30';
                    return (
                      <React.Fragment key={h.code}>
                        <tr className="border-b border-[#C9A24D]/20 hover:bg-[#F3E9DC]/20 transition-colors">
                          {/* Time slot header */}
                          <td className="py-2 sm:py-3 px-1 sm:px-2 border-l border-[#C9A24D]/25 bg-[#F3E9DC]/40 font-mono font-bold text-[#2B2022] text-[10px] sm:text-[11px] whitespace-nowrap">
                            {h.timeSlot}
                          </td>

                          {/* Days slots */}
                          {visibleDays.map(d => {
                            const slots = getSlotEntries(d.code, h.code);
                            if (!slots || slots.length === 0) {
                              return (
                                <td
                                  key={`${d.code}_${h.code}`}
                                  onClick={() => canImport && openAddEntryModal(d.code, h.code)}
                                  className={`border-l border-[#C9A24D]/15 p-1.5 sm:p-2 bg-white/40 transition-all ${
                                    canImport
                                      ? 'cursor-pointer hover:bg-[#F3E9DC]/60 group hover:border-[#C9A24D]/40'
                                      : ''
                                  }`}
                                  title={canImport ? `انقر لإضافة حصة يوم ${d.nameArabic} في توقيت ${h.timeSlot}` : ''}
                                >
                                  {canImport ? (
                                    <div className="flex items-center justify-center py-2 transition-colors">
                                      <span className="text-[#2B2022]/20 text-[10px] group-hover:hidden">—</span>
                                      <span className="hidden group-hover:inline-flex items-center gap-1 text-[10px] font-bold text-[#7B1E3A] bg-white/90 px-2 py-0.5 rounded-md border border-[#C9A24D]/35 shadow-2xs">
                                        <Plus className="w-3 h-3 text-[#C9A24D]" />
                                        <span>إضافة</span>
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[#2B2022]/20 text-[10px]">—</span>
                                  )}
                                </td>
                              );
                            }

                            return (
                              <td
                                key={`${d.code}_${h.code}`}
                                className="border-l border-[#C9A24D]/25 p-1 sm:p-1.5 align-middle bg-white/60 relative group"
                              >
                                <div className="space-y-1.5">
                                  {slots.map(slot => {
                                    const colorClass = SUBJECT_COLORS[slot.subjectCode] || 'bg-white border-[#C9A24D]/30 text-[#2B2022]';
                                    return (
                                      <div
                                        key={slot._id || `${slot.day}_${slot.hour}_${slot.group || ''}_${slot.subjectCode}`}
                                        className={`p-2 sm:p-2.5 rounded-xl border text-center transition-all ${colorClass} shadow-xs relative`}
                                      >
                                        {/* Quick Action Buttons (Edit / Delete) for Admin */}
                                        {canImport && (
                                          <div className="absolute top-1 left-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur-xs p-1 rounded-lg border border-[#C9A24D]/40 shadow-sm print:hidden z-10">
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openEditEntryModal(slot);
                                              }}
                                              className="p-1 hover:bg-[#F3E9DC] text-[#7B1E3A] rounded transition-colors cursor-pointer"
                                              title="تعديل الحصة الدراسية"
                                            >
                                              <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteEntry(slot._id);
                                              }}
                                              className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors cursor-pointer"
                                              title="حذف الحصة الدراسية"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        )}

                                        <p className="font-serif font-black text-xs sm:text-sm leading-snug">
                                          {slot.subjectName || slot.subjectCode}
                                        </p>
                                        
                                        {viewMode === 'division' ? (
                                          <p className="text-[10px] sm:text-[11px] font-medium text-[#2B2022]/80 mt-0.5 truncate">
                                            الأستاذ: {slot.teacherName}
                                          </p>
                                        ) : (
                                          <p className="text-[10px] sm:text-[11px] font-medium text-[#2B2022]/80 mt-0.5 truncate">
                                            القسم: {slot.divisionArabic || slot.division}
                                          </p>
                                        )}

                                        <div className="flex items-center justify-center gap-1 mt-1 text-[9px] flex-wrap">
                                          {slot.modality && (
                                            <span className="px-1.5 py-0.5 bg-[#F3E9DC] rounded text-[#7B1E3A] font-bold border border-[#C9A24D]/30">
                                              {slot.modality}
                                            </span>
                                          )}
                                          {slot.group && (
                                            <span className="px-1.5 py-0.5 bg-blue-50 rounded text-blue-900 font-bold border border-blue-200">
                                              {slot.group}
                                            </span>
                                          )}
                                          {slot.room && (
                                            <span className="px-1.5 py-0.5 bg-[#2B2022]/5 rounded text-[#2B2022] font-mono">
                                              {slot.room}
                                            </span>
                                          )}
                                          {slot.regr && (
                                            <span className="px-1 py-0.5 bg-purple-50 rounded text-purple-900 text-[8px] border border-purple-200" title="فوج مشترك">
                                              {slot.regr}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </td>
                            );
                          })}
                        </tr>

                        {/* Lunch Break separator after 11H30 (Fixed dynamic colSpan) */}
                        {isBreakSlot && (
                          <tr className="bg-[#F3E9DC] border-y-2 border-[#C9A24D]/35 text-center text-xs font-serif font-bold text-[#7B1E3A]">
                            <td colSpan={visibleDays.length + 1} className="py-1.5">
                              <span>فترة استراحة الغداء (12:30 - 13:30)</span>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Official Footer for Printable */}
        <div className="hidden print:flex justify-between items-end mt-12 pt-6 border-t border-slate-400 text-xs font-bold text-slate-800">
          <div className="text-center">
            <p>مصلحة التنظيم التربوي</p>
            <div className="w-36 h-12 border-b border-dashed border-slate-400 mt-2"></div>
          </div>
          <div className="text-center">
            <p>ناظر الدروس</p>
            <div className="w-36 h-12 border-b border-dashed border-slate-400 mt-2"></div>
          </div>
          <div className="text-center">
            <p>ختم وإمضاء الإدارة العامة</p>
            <div className="w-36 h-12 border-b border-dashed border-slate-400 mt-2"></div>
          </div>
        </div>
      </div>

      {/* Add / Edit Timetable Entry Modal */}
      {isEntryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto"
          dir="rtl"
          onClick={() => setIsEntryModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#FDFBF7] border border-[#C9A24D]/40 rounded-2xl p-6 space-y-4 text-right shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-[#C9A24D]/30 pb-3">
              <h3 className="text-base font-serif font-black text-[#7B1E3A] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#C9A24D]" />
                <span>{editingEntryId ? 'تعديل الحصة الدراسية' : 'إضافة حصة دراسية جديدة'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEntryModalOpen(false)}
                className="text-[#2B2022]/60 hover:text-[#7B1E3A] p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {entryError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{entryError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEntry} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Day */}
                <div>
                  <label className="text-xs font-bold text-[#2B2022] block mb-1">اليوم *</label>
                  <select
                    value={entryForm.day}
                    onChange={(e) => setEntryForm({ ...entryForm, day: e.target.value })}
                    required
                    className="w-full bg-white border border-[#C9A24D]/40 rounded-xl px-3 py-2 text-xs font-bold text-[#2B2022] focus:outline-none focus:border-[#7B1E3A]"
                  >
                    {allDays.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.nameArabic} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time slot */}
                <div>
                  <label className="text-xs font-bold text-[#2B2022] block mb-1">التوقيت (الحصة) *</label>
                  <select
                    value={entryForm.hour}
                    onChange={(e) => setEntryForm({ ...entryForm, hour: e.target.value })}
                    required
                    className="w-full bg-white border border-[#C9A24D]/40 rounded-xl px-3 py-2 text-xs font-bold text-[#2B2022] focus:outline-none focus:border-[#7B1E3A]"
                  >
                    {hours.map((h) => (
                      <option key={h.code} value={h.code}>
                        {h.timeSlot} ({h.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Division / Class */}
              <div>
                <label className="text-xs font-bold text-[#2B2022] block mb-1">القسم الدراسي (Division) *</label>
                <div className="flex gap-2">
                  <select
                    value={entryForm.division}
                    onChange={(e) => setEntryForm({ ...entryForm, division: e.target.value })}
                    className="w-full bg-white border border-[#C9A24D]/40 rounded-xl px-3 py-2 text-xs font-bold text-[#2B2022] focus:outline-none focus:border-[#7B1E3A]"
                  >
                    <option value="">اختر القسم من القائمة</option>
                    {(metadata?.divisions || []).map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.code} — {d.nameArabic}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="أو اكتب رمز القسم (مثال: 1AM1)"
                    value={entryForm.division}
                    onChange={(e) => setEntryForm({ ...entryForm, division: e.target.value })}
                    required
                    className="w-1/2 bg-white border border-[#C9A24D]/40 rounded-xl px-3 py-2 text-xs font-bold text-[#2B2022] focus:outline-none focus:border-[#7B1E3A]"
                  />
                </div>
              </div>

              {/* Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#2B2022] block mb-1">المادة المقررة *</label>
                  <select
                    value={entryForm.subjectCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      const found = KNOWN_SUBJECTS.find((s) => s.code === code);
                      setEntryForm({
                        ...entryForm,
                        subjectCode: code,
                        subjectName: found ? found.name : entryForm.subjectName,
                      });
                    }}
                    required
                    className="w-full bg-white border border-[#C9A24D]/40 rounded-xl px-3 py-2 text-xs font-bold text-[#2B2022] focus:outline-none focus:border-[#7B1E3A]"
                  >
                    {KNOWN_SUBJECTS.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2B2022] block mb-1">تسمية المادة بالعربية</label>
                  <input
                    type="text"
                    placeholder="اسم المادة بالعربية"
                    value={entryForm.subjectName}
                    onChange={(e) => setEntryForm({ ...entryForm, subjectName: e.target.value })}
                    className="w-full bg-white border border-[#C9A24D]/40 rounded-xl px-3 py-2 text-xs font-bold text-[#2B2022] focus:outline-none focus:border-[#7B1E3A]"
                  />
                </div>
              </div>

              {/* Teacher */}
              <div>
                <label className="text-xs font-bold text-[#2B2022] block mb-1">الأستاذ(ة) المكلف(ة) *</label>
                <div className="flex gap-2">
                  <select
                    value={entryForm.teacherName}
                    onChange={(e) => setEntryForm({ ...entryForm, teacherName: e.target.value })}
                    className="w-full bg-white border border-[#C9A24D]/40 rounded-xl px-3 py-2 text-xs font-bold text-[#2B2022] focus:outline-none focus:border-[#7B1E3A]"
                  >
                    <option value="">اختر الأستاذ من القائمة</option>
                    {(metadata?.teachers || []).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="أو اكتب اسم الأستاذ(ة)"
                    value={entryForm.teacherName}
                    onChange={(e) => setEntryForm({ ...entryForm, teacherName: e.target.value })}
                    required
                    className="w-1/2 bg-white border border-[#C9A24D]/40 rounded-xl px-3 py-2 text-xs font-bold text-[#2B2022] focus:outline-none focus:border-[#7B1E3A]"
                  />
                </div>
              </div>

              {/* Room & Modality & Group */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#2B2022] block mb-1">القاعة (Room)</label>
                  <input
                    type="text"
                    placeholder="مثال: S01, LAB1"
                    value={entryForm.room}
                    onChange={(e) => setEntryForm({ ...entryForm, room: e.target.value })}
                    className="w-full bg-white border border-[#C9A24D]/40 rounded-xl px-3 py-2 text-xs font-bold text-[#2B2022] focus:outline-none focus:border-[#7B1E3A]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2B2022] block mb-1">النمط (Modality)</label>
                  <select
                    value={entryForm.modality}
                    onChange={(e) => setEntryForm({ ...entryForm, modality: e.target.value })}
                    className="w-full bg-white border border-[#C9A24D]/40 rounded-xl px-3 py-2 text-xs font-bold text-[#2B2022] focus:outline-none focus:border-[#7B1E3A]"
                  >
                    <option value="CG">CG (حصة عامة)</option>
                    <option value="TP">TP (أعمال تطبيقية)</option>
                    <option value="TD">TD (أعمال موجهة)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2B2022] block mb-1">الفوج (Group)</label>
                  <input
                    type="text"
                    placeholder="G1, G2 أو فارغ للكل"
                    value={entryForm.group}
                    onChange={(e) => setEntryForm({ ...entryForm, group: e.target.value })}
                    className="w-full bg-white border border-[#C9A24D]/40 rounded-xl px-3 py-2 text-xs font-bold text-[#2B2022] focus:outline-none focus:border-[#7B1E3A]"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="text-xs font-bold text-[#2B2022] block mb-1">ملاحظات إضافية (اختياري)</label>
                <input
                  type="text"
                  placeholder="ملاحظات..."
                  value={entryForm.remarks}
                  onChange={(e) => setEntryForm({ ...entryForm, remarks: e.target.value })}
                  className="w-full bg-white border border-[#C9A24D]/40 rounded-xl px-3 py-2 text-xs font-medium text-[#2B2022] focus:outline-none focus:border-[#7B1E3A]"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#C9A24D]/30">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white hover:bg-[#F3E9DC] text-[#2B2022] font-bold text-xs transition-colors cursor-pointer border border-[#C9A24D]/35"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submittingEntry}
                  className="flex-1 py-2.5 rounded-xl bg-[#7B1E3A] hover:bg-[#62162d] text-white font-bold text-xs transition-colors cursor-pointer border border-[#C9A24D]/35 shadow-md shadow-[#7B1E3A]/20 flex items-center justify-center gap-1.5"
                >
                  {submittingEntry ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-[#C9A24D]" />
                      <span>{editingEntryId ? 'حفظ التعديلات' : 'إضافة الحصة'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Timetable Import Modal */}
      <TimetableExcelImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={() => {
          fetchMetadata();
          if (viewMode === 'division') fetchDivisionTimetable(selectedDivision);
          else fetchTeacherTimetable(selectedTeacher);
        }}
      />
    </div>
  );
}
