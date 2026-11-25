import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Save,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  FileText,
  Calendar,
  BookOpen,
  Users,
  Search,
  Check,
  ChevronDown,
  Lock,
  Printer,
  Sparkles,
} from 'lucide-react';
import { openAuthorizedUrl } from '../../utils/fileDownload';

const SUGGESTED_REMARKS = [
  'ممتاز، استيعاب عميق ومشاركة مميزة.',
  'جيد جداً، واصل على هذا النسق.',
  'عمل جيد، نتائج مشجعة ومستوى في تطور.',
  'مستوى متوسط، يحتاج للمزيد من التركيز.',
  'يحتاج إلى تحسين في حل التمارين المنهجية.',
  'يحتاج إلى متابعة منزلية دورية ومراجعة الدروس.',
  'نتائج دون المستوى، يستوجب تداركاً عاجلاً.',
];

const ASSESSMENT_TYPES = [
  'الفرض الأول',
  'الفرض الثاني',
  'التقويم المستمر',
  'اختبار الثلاثي الأول',
  'اختبار الثلاثي الثاني',
  'اختبار الثلاثي الثالث',
  'فرض تجريبي',
];

export default function TeacherGradebook() {
  const [activeSubTab, setActiveSubTab] = useState('entry'); // 'entry' | 'history'
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [assignedData, setAssignedData] = useState({ classes: [], subjects: [] });

  // Selected filters
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [assessmentType, setAssessmentType] = useState('الفرض الأول');
  const [customType, setCustomType] = useState('');
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [maxGrade, setMaxGrade] = useState(20);

  // Active Assessment State
  const [currentAssessmentId, setCurrentAssessmentId] = useState(null);
  const [assessmentStatus, setAssessmentStatus] = useState('draft'); // 'draft' | 'submitted' | 'under_review' | 'approved' | 'returned'
  const [returnReason, setReturnReason] = useState('');
  const [classRemark, setClassRemark] = useState('');
  const [studentRecords, setStudentRecords] = useState([]); // array of { student, fullName, registrationNumber, grade, isAbsent, individualRemark }

  // Auto-save & Submission Status
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [savingManual, setSavingManual] = useState(false);
  const [submittingAdmin, setSubmittingAdmin] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  // Teacher Assessments History
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilterStatus, setHistoryFilterStatus] = useState('all');

  // Auto-save debounce timer
  const autoSaveTimerRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  // 1. Load Teacher Assigned Classes & Subjects
  useEffect(() => {
    const fetchAssigned = async () => {
      try {
        setLoadingInitial(true);
        const res = await axios.get('/api/assessments/teacher/assigned');
        setAssignedData(res.data);

        if (res.data.classes?.length > 0) {
          const firstClass = res.data.classes[0];
          setSelectedClassId(firstClass._id);
          if (res.data.subjects?.length > 0) {
            setSelectedSubject(res.data.subjects[0]);
          }
          initRosterForClass(firstClass);
        }
      } catch (err) {
        console.error('Failed to load assigned classes:', err);
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchAssigned();
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await axios.get('/api/assessments/teacher/my-assessments');
      setHistoryList(res.data);
    } catch (err) {
      console.error('Failed to load assessments history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Helper to initialize student records for a selected class
  const initRosterForClass = (classObj) => {
    if (!classObj || !classObj.students) return;
    const initialRecords = classObj.students.map((st, index) => {
      const name =
        st.fullName ||
        `${st.firstNameArabic || st.firstName || ''} ${st.lastNameArabic || st.lastName || ''}`.trim() ||
        `تلميذ ${index + 1}`;
      return {
        student: st._id,
        fullName: name,
        registrationNumber: st.registrationNumber || '',
        grade: '',
        isAbsent: false,
        individualRemark: '',
      };
    });
    setStudentRecords(initialRecords);
    setCurrentAssessmentId(null);
    setAssessmentStatus('draft');
    setReturnReason('');
    setClassRemark('');
  };

  // Handle changing class
  const handleClassChange = (classId) => {
    setSelectedClassId(classId);
    const foundClass = assignedData.classes.find((c) => c._id?.toString() === classId?.toString());
    if (foundClass) {
      initRosterForClass(foundClass);
    }
  };

  // Load existing assessment into editor
  const handleEditAssessment = (assessment) => {
    setCurrentAssessmentId(assessment._id);
    setSelectedClassId(assessment.class?._id || assessment.class);
    setSelectedSubject(assessment.subject);
    if (ASSESSMENT_TYPES.includes(assessment.assessmentType)) {
      setAssessmentType(assessment.assessmentType);
      setCustomType('');
    } else {
      setAssessmentType('أخرى');
      setCustomType(assessment.assessmentType);
    }
    setAssessmentDate(
      assessment.assessmentDate ? new Date(assessment.assessmentDate).toISOString().split('T')[0] : ''
    );
    setMaxGrade(assessment.maxGrade || 20);
    setAssessmentStatus(assessment.status);
    setReturnReason(assessment.returnReason || '');
    setClassRemark(assessment.classRemark || '');

    // Match with current class roster
    const classIdStr = (assessment.class?._id || assessment.class)?.toString();
    const foundClass = assignedData.classes.find((c) => c._id?.toString() === classIdStr);
    const allStudents = foundClass?.students || [];

    const populatedRecords = allStudents.length > 0 ? allStudents.map((st, index) => {
      const existingRec = (assessment.records || []).find(
        (r) => (r.student?._id || r.student)?.toString() === st._id?.toString()
      );
      const name =
        st.fullName ||
        `${st.firstNameArabic || st.firstName || ''} ${st.lastNameArabic || st.lastName || ''}`.trim() ||
        `تلميذ ${index + 1}`;
      return {
        student: st._id,
        fullName: name,
        registrationNumber: st.registrationNumber || existingRec?.registrationNumber || '',
        grade: existingRec && existingRec.grade != null ? existingRec.grade : '',
        isAbsent: existingRec ? Boolean(existingRec.isAbsent) : false,
        individualRemark: existingRec ? existingRec.individualRemark || '' : '',
      };
    }) : (assessment.records || []).map((r, i) => {
      const st = r.student && typeof r.student === 'object' ? r.student : {};
      const u = st.user || r.studentUser || {};
      const name =
        `${u.firstNameArabic || u.firstName || st.firstNameArabic || st.firstName || ''} ${u.lastNameArabic || u.lastName || st.lastNameArabic || st.lastName || ''}`.trim() ||
        `تلميذ ${i + 1}`;
      return {
        student: st._id || r.student,
        fullName: name,
        registrationNumber: st.registrationNumber || r.registrationNumber || '',
        grade: r.grade != null ? r.grade : '',
        isAbsent: Boolean(r.isAbsent),
        individualRemark: r.individualRemark || '',
      };
    });

    setStudentRecords(populatedRecords);
    setActiveSubTab('entry');
  };

  // Handle grade change
  const handleGradeChange = (studentId, val) => {
    if (assessmentStatus === 'submitted' || assessmentStatus === 'approved') return;
    setStudentRecords((prev) =>
      prev.map((r) => {
        if (r.student === studentId) {
          if (val === '') return { ...r, grade: '', isAbsent: false };
          const num = parseFloat(val);
          if (isNaN(num)) return r;
          if (num < 0 || num > maxGrade) return r;
          return { ...r, grade: num, isAbsent: false };
        }
        return r;
      })
    );
    triggerAutoSave();
  };

  // Handle absence toggle
  const handleAbsenceToggle = (studentId) => {
    if (assessmentStatus === 'submitted' || assessmentStatus === 'approved') return;
    setStudentRecords((prev) =>
      prev.map((r) => {
        if (r.student === studentId) {
          const nextAbsent = !r.isAbsent;
          return {
            ...r,
            isAbsent: nextAbsent,
            grade: nextAbsent ? '' : r.grade,
          };
        }
        return r;
      })
    );
    triggerAutoSave();
  };

  // Handle remark change
  const handleRemarkChange = (studentId, remarkText) => {
    if (assessmentStatus === 'submitted' || assessmentStatus === 'approved') return;
    setStudentRecords((prev) =>
      prev.map((r) => (r.student === studentId ? { ...r, individualRemark: remarkText } : r))
    );
    triggerAutoSave();
  };

  // Trigger Debounced Auto-Save
  const triggerAutoSave = () => {
    if (assessmentStatus === 'submitted' || assessmentStatus === 'approved') return;
    setAutoSaveStatus('saving');
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(() => {
      executeSave(false, true); // silent auto-save
    }, 2000);
  };

  // Execute Save (Draft or Submit)
  const executeSave = async (submitToAdmin = false, isAutoSave = false, forceDuplicate = false) => {
    if (!selectedClassId || !selectedSubject) return;

    const actualType = assessmentType === 'أخرى' ? customType.trim() : assessmentType;
    if (!actualType) {
      if (!isAutoSave) alert('يرجى تحديد نوع التقييم أو كتابة تسميته.');
      return;
    }

    if (submitToAdmin) setSubmittingAdmin(true);
    else if (!isAutoSave) setSavingManual(true);

    try {
      const payload = {
        assessmentId: currentAssessmentId,
        classId: selectedClassId,
        subject: selectedSubject,
        assessmentType: actualType,
        assessmentDate,
        maxGrade,
        classRemark,
        records: studentRecords.map((r) => ({
          student: r.student,
          grade: r.grade === '' ? null : Number(r.grade),
          isAbsent: r.isAbsent,
          individualRemark: r.individualRemark,
        })),
        submitToAdmin,
        forceDuplicate,
      };

      const res = await axios.post('/api/assessments/save', payload);
      const savedDoc = res.data.assessment;

      setCurrentAssessmentId(savedDoc._id);
      setAssessmentStatus(savedDoc.status);
      setAutoSaveStatus('saved');
      setLastSavedTime(new Date().toLocaleTimeString('ar-DZ'));
      setDuplicateWarning(null);

      if (submitToAdmin) {
        alert('تم إرسال كشف النقاط بنجاح إلى الإدارة وهو الآن قيد المراجعة والاعتماد.');
        loadHistory();
      } else if (!isAutoSave) {
        alert('تم حفظ مسودة الكشف بنجاح.');
        loadHistory();
      }
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.isDuplicateWarning) {
        setDuplicateWarning(err.response.data.message);
      } else {
        setAutoSaveStatus('error');
        if (!isAutoSave) {
          alert(err.response?.data?.message || 'حدث خطأ أثناء حفظ الكشف.');
        }
      }
    } finally {
      setSavingManual(false);
      setSubmittingAdmin(false);
    }
  };

  const isLocked = assessmentStatus === 'submitted' || assessmentStatus === 'approved';

  const filteredHistory = historyList.filter((item) => {
    if (historyFilterStatus === 'all') return true;
    return item.status === historyFilterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-brand-50 border border-brand-200 text-brand-700">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2 flex-wrap">
                <span>إدخال نقاط الفروض والتقييمات</span>
                <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 shadow-2xs">
                  فضاء الأستاذ
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">
                تسيير علامات التلاميذ وملاحظاتهم الفردية والعامة مع ميزة الحفظ التلقائي والإرسال للإدارة.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto bg-gray-100 p-1.5 rounded-xl border border-gray-200">
          <button
            onClick={() => setActiveSubTab('entry')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === 'entry'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                : 'text-gray-700 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>استمارة إدخال النقاط</span>
          </button>
          <button
            onClick={() => {
              setActiveSubTab('history');
              loadHistory();
            }}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                : 'text-gray-700 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>سجل كشوفاتي ({historyList.length})</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'entry' && (
        <div className="space-y-6 pb-20 sm:pb-0">
          {/* Status Alert Banner if Returned or Submitted */}
          {assessmentStatus === 'returned' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start gap-3.5 text-amber-900 shadow-xs"
            >
              <RotateCcw className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <span className="font-bold text-amber-900 block text-base mb-1">
                  تنبيه: الكشف معاد للتصحيح من طرف الإدارة
                </span>
                <p className="leading-relaxed text-amber-800">
                  <strong className="text-amber-950 font-bold">سبب الإرجاع وملاحظات الإدارة: </strong>
                  {returnReason || 'يرجى مراجعة وتدقيق النقاط والمالحظات المسجلة ثم إعادة الإرسال.'}
                </p>
                <span className="text-xs text-amber-700 mt-1 block font-medium">
                  يمكنك الآن تصحيح العلامات والبيانات أدناه ثم الضغط على "إرسال إلى الإدارة" مجدداً.
                </span>
              </div>
            </motion.div>
          )}

          {assessmentStatus === 'submitted' && (
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-center gap-3 text-sky-900 text-sm shadow-xs">
              <Lock className="w-5 h-5 text-sky-600 shrink-0" />
              <div>
                <span className="font-bold block">الكشف مرسل إلى الإدارة وقيد المراجعة</span>
                <span className="text-sky-700 text-xs">البيانات مقفلة حالياً لمنع التعديل أثناء دراسة الكشف من طرف الإدارة.</span>
              </div>
            </div>
          )}

          {assessmentStatus === 'approved' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-900 text-sm shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold block">تم اعتماد هذا الكشف نهائياً من طرف الإدارة</span>
                <span className="text-emerald-700 text-xs">الكشف معتمد رسمياً ومحفوظ في السجل العام.</span>
              </div>
            </div>
          )}

          {/* Duplicate Warning Dialog */}
          {duplicateWarning && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 text-rose-900 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
                <span className="font-medium">{duplicateWarning}</span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setDuplicateWarning(null)}
                  className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs hover:bg-slate-200 font-bold"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => executeSave(false, false, true)}
                  className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-xs"
                >
                  متابعة الحفظ
                </button>
              </div>
            </div>
          )}

          {/* Section 3.1: Selection of Assessment Parameters */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* 1. Class */}
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-brand-600" />
                القسم المسند:
              </label>
              <select
                disabled={isLocked}
                value={selectedClassId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 font-semibold focus:outline-none focus:border-brand-600 focus:bg-white disabled:opacity-60 transition-colors"
              >
                {assignedData.classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name} ({cls.level === 'primary' ? 'ابتدائي' : cls.level === 'middle' ? 'متوسط' : 'ثانوي'})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Subject */}
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-brand-600" />
                المادة المسندة:
              </label>
              <select
                disabled={isLocked}
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 font-semibold focus:outline-none focus:border-brand-600 focus:bg-white disabled:opacity-60 transition-colors"
              >
                {assignedData.subjects.map((sub, idx) => (
                  <option key={idx} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Assessment Type */}
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-brand-600" />
                نوع التقييم:
              </label>
              <select
                disabled={isLocked}
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 font-semibold focus:outline-none focus:border-brand-600 focus:bg-white disabled:opacity-60 transition-colors"
              >
                {ASSESSMENT_TYPES.map((type, idx) => (
                  <option key={idx} value={type}>
                    {type}
                  </option>
                ))}
                <option value="أخرى">تقييم مخصص / تسمية أخرى...</option>
              </select>
              {assessmentType === 'أخرى' && (
                <input
                  type="text"
                  placeholder="اكتب تسمية التقييم..."
                  disabled={isLocked}
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  className="mt-2 w-full bg-gray-50 border border-brand-500/50 rounded-xl px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:bg-white"
                />
              )}
            </div>

            {/* 4. Assessment Date */}
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-600" />
                تاريخ الإجراء:
              </label>
              <input
                type="date"
                disabled={isLocked}
                value={assessmentDate}
                onChange={(e) => setAssessmentDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 font-semibold focus:outline-none focus:border-brand-600 focus:bg-white disabled:opacity-60 transition-colors"
              />
            </div>

            {/* 5. Max Grade */}
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                السلم المعتمد (/):
              </label>
              <input
                type="number"
                disabled={isLocked}
                value={maxGrade}
                onChange={(e) => setMaxGrade(Number(e.target.value) || 20)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-brand-600 focus:bg-white disabled:opacity-60 transition-colors font-mono font-bold"
              />
            </div>
          </div>

          {/* Section 3.2: Students Roster & Marks Entry */}
          <div className="bg-white rounded-2xl border border-[#E8DFD0] overflow-hidden shadow-xs">
            {/* Roster Header */}
            <div className="p-4 bg-[#FAF7F2] border-b border-[#E8DFD0] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#2B2022] flex items-center gap-2 flex-wrap">
                  <span>قائمة تلاميذ القسم ({studentRecords.length} تلميذ)</span>
                  {autoSaveStatus === 'saving' && (
                    <span className="text-[11px] text-brand-700 flex items-center gap-1 font-bold animate-pulse">
                      <Sparkles className="w-3 h-3 text-brand-600" />
                      جاري الحفظ التلقائي...
                    </span>
                  )}
                  {autoSaveStatus === 'saved' && (
                    <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-bold">
                      <Check className="w-3 h-3 text-emerald-600" />
                      تم الحفظ التلقائي ({lastSavedTime})
                    </span>
                  )}
                </h3>
              </div>

              {/* Action Buttons Top */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => executeSave(false, false)}
                  disabled={isLocked || savingManual}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold border border-gray-300 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  <Save className="w-3.5 h-3.5 text-brand-600" />
                  حفظ كمسودة
                </button>

                <button
                  onClick={() => {
                    if (window.confirm('هل أنت متأكد من اكتمال إدخال النقاط والرغبة في إرسال الكشف للإدارة للمراجعة؟')) {
                      executeSave(true, false);
                    }
                  }}
                  disabled={isLocked || submittingAdmin}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  إرسال إلى الإدارة
                </button>
              </div>
            </div>

            {/* Mobile Student Card View (Visible on < md screens) */}
            <div className="md:hidden divide-y divide-gray-100 p-3 space-y-3">
              {studentRecords.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-xs">
                  لا يوجد تلاميذ مسجلين في هذا القسم.
                </div>
              ) : (
                studentRecords.map((record, index) => (
                  <div
                    key={record.student}
                    className={`p-3.5 rounded-2xl border-2 transition-all space-y-3 shadow-2xs ${
                      record.isAbsent
                        ? 'bg-[#FEF2F2]/60 border-[#FCA5A5]'
                        : record.grade !== '' && record.grade >= 10
                        ? 'bg-[#FAF2F4]/50 border-[#E7C1CB]'
                        : record.grade !== '' && record.grade < 10
                        ? 'bg-[#FFF9F0]/60 border-[#EEDDAF]'
                        : 'bg-white border-[#E8DFD0]'
                    }`}
                  >
                    {/* Student Info Header */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-full bg-[#FAF2F4] text-[#7B1E3A] border border-[#E7C1CB] text-xs font-mono font-black flex items-center justify-center shadow-2xs">
                          {index + 1}
                        </span>
                        <div>
                          <span className="font-black text-[#2B2022] text-sm block leading-tight">
                            {record.fullName || `تلميذ ${index + 1}`}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-[#8E6E27] bg-[#FBF7ED] border border-[#EEDDAF] px-2.5 py-1 rounded-lg shadow-2xs">
                        {record.registrationNumber || '-'}
                      </span>
                    </div>

                    {/* Grade & Absent Controls */}
                    <div className="flex items-center justify-between gap-3 bg-[#FCFAF7] p-3 rounded-2xl border border-[#E8DFD0] shadow-2xs">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-black text-[#4A3A3D]">النقطة /{maxGrade}:</label>
                        <input
                          type="number"
                          min="0"
                          max={maxGrade}
                          step="0.25"
                          placeholder="0 - 20"
                          disabled={isLocked || record.isAbsent}
                          value={record.isAbsent ? '' : record.grade}
                          onChange={(e) => handleGradeChange(record.student, e.target.value)}
                          className={`w-28 h-11 text-center rounded-xl text-base font-black transition-all ${
                            record.isAbsent
                              ? 'bg-[#F5F2ED] text-[#A8989B] border border-[#E8DFD0] cursor-not-allowed opacity-50'
                              : record.grade !== '' && record.grade >= 10
                              ? 'border-2 border-[#7B1E3A] bg-[#FDF2F4] text-[#7B1E3A]'
                              : record.grade !== '' && record.grade < 10
                              ? 'border-2 border-[#C9A24D] bg-[#FFF9F0] text-[#8E6E27]'
                              : 'bg-white border-2 border-[#E8DFD0] text-[#2B2022] focus:border-[#7B1E3A] focus:ring-1 focus:ring-[#7B1E3A]'
                          }`}
                        />
                      </div>

                      <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-3.5 py-2.5 rounded-xl border border-[#E8DFD0] hover:bg-[#FAF6F0] shadow-2xs transition-colors">
                        <input
                          type="checkbox"
                          disabled={isLocked}
                          checked={record.isAbsent}
                          onChange={() => handleAbsenceToggle(record.student)}
                          className="rounded border-[#E8DFD0] text-[#7B1E3A] focus:ring-0 w-4 h-4 cursor-pointer accent-[#7B1E3A]"
                        />
                        <span className={`text-xs font-black ${record.isAbsent ? 'text-[#991B1B]' : 'text-[#574549]'}`}>
                          غائب
                        </span>
                      </label>
                    </div>

                    {/* Individual Remark */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          disabled={isLocked}
                          placeholder="ملاحظة خاصة بالتلميذ..."
                          value={record.individualRemark}
                          onChange={(e) => handleRemarkChange(record.student, e.target.value)}
                          className="flex-1 bg-white border border-[#E8DFD0] rounded-xl px-3.5 py-2.5 text-xs text-[#2B2022] placeholder-[#A8989B] focus:outline-none focus:border-[#7B1E3A] focus:ring-1 focus:ring-[#7B1E3A] disabled:opacity-60 shadow-2xs"
                        />
                        {!isLocked && (
                          <select
                            onChange={(e) => {
                              if (e.target.value) handleRemarkChange(record.student, e.target.value);
                            }}
                            defaultValue=""
                            className="bg-[#FBF7ED] hover:bg-[#F7EFD8] border border-[#EEDDAF] text-[#8E6E27] text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#C9A24D] cursor-pointer shadow-2xs transition-colors"
                          >
                            <option value="" disabled className="bg-white text-[#766065] font-bold">اقتراحات</option>
                            {SUGGESTED_REMARKS.map((sug, i) => (
                              <option key={i} value={sug} className="bg-white text-[#2B2022] font-semibold py-1">
                                {sug}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table (Visible on md: and up) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-[#FAF7F2] text-[#574549] text-xs uppercase border-b border-[#E8DFD0] font-bold">
                    <th className="py-3 px-4 w-12 text-center">الرقم</th>
                    <th className="py-3 px-4">اسم ولقب التلميذ</th>
                    <th className="py-3 px-4 w-32">رقم التسجيل</th>
                    <th className="py-3 px-4 w-40 text-center">النقطة / {maxGrade}</th>
                    <th className="py-3 px-4 w-28 text-center">غياب</th>
                    <th className="py-3 px-4">الملاحظة الفردية للتلميذ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {studentRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        لا يوجد تلاميذ مسجلين في هذا القسم.
                      </td>
                    </tr>
                  ) : (
                    studentRecords.map((record, index) => (
                      <tr
                        key={record.student}
                        className={`hover:bg-[#FCFAF7] transition-colors ${
                          record.isAbsent ? 'bg-[#FEF2F2]/40' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center font-mono font-bold text-[#766065]">
                          {String(index + 1).padStart(2, '0')}
                        </td>
                        <td className="py-3 px-4 font-black text-[#2B2022] text-sm">
                          {record.fullName || `تلميذ ${index + 1}`}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#8E6E27] font-bold text-[11px]">
                          {record.registrationNumber || '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            max={maxGrade}
                            step="0.25"
                            placeholder="0 - 20"
                            disabled={isLocked || record.isAbsent}
                            value={record.isAbsent ? '' : record.grade}
                            onChange={(e) => handleGradeChange(record.student, e.target.value)}
                            className={`w-24 text-center rounded-xl py-1.5 px-2 text-sm font-black transition-all ${
                              record.isAbsent
                                ? 'bg-[#F5F2ED] border border-[#E8DFD0] text-[#A8989B] cursor-not-allowed opacity-50'
                                : record.grade !== '' && record.grade >= 10
                                ? 'border-2 border-[#7B1E3A] bg-[#FDF2F4] text-[#7B1E3A]'
                                : record.grade !== '' && record.grade < 10
                                ? 'border-2 border-[#C9A24D] bg-[#FFF9F0] text-[#8E6E27]'
                                : 'bg-white border-2 border-[#E8DFD0] text-[#2B2022] focus:border-[#7B1E3A]'
                            }`}
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <label className="inline-flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              disabled={isLocked}
                              checked={record.isAbsent}
                              onChange={() => handleAbsenceToggle(record.student)}
                              className="rounded border-[#E8DFD0] text-[#7B1E3A] focus:ring-0 w-4 h-4 cursor-pointer accent-[#7B1E3A]"
                            />
                            <span className="text-[11px] text-[#574549] font-bold">غائب</span>
                          </label>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              disabled={isLocked}
                              placeholder="أدخل ملاحظة خاصة بالتلميذ..."
                              value={record.individualRemark}
                              onChange={(e) => handleRemarkChange(record.student, e.target.value)}
                              className="flex-1 bg-white border border-[#E8DFD0] rounded-xl px-3 py-1.5 text-xs text-[#2B2022] placeholder-[#A8989B] focus:outline-none focus:border-[#7B1E3A] disabled:opacity-60"
                            />
                            {!isLocked && (
                              <select
                                onChange={(e) => {
                                  if (e.target.value) handleRemarkChange(record.student, e.target.value);
                                }}
                                defaultValue=""
                                className="bg-[#FBF7ED] hover:bg-[#F7EFD8] border border-[#EEDDAF] text-[#8E6E27] text-[11px] font-bold rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
                              >
                                <option value="" disabled className="bg-white text-[#766065]">اقتراحات...</option>
                                {SUGGESTED_REMARKS.map((sug, i) => (
                                  <option key={i} value={sug} className="bg-white text-[#2B2022] py-1 font-semibold">
                                    {sug}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Section 3.3: Class General Remark */}
            <div className="p-4 bg-[#FFFBF5] border-t border-[#E8DFD0]">
              <label className="block text-xs font-bold text-[#7B1E3A] mb-1.5 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#7B1E3A]" />
                <span>الملاحظة العامة للقسم (بخصوص هذا الفرض أو التقييم):</span>
              </label>
              <textarea
                disabled={isLocked}
                rows={2}
                value={classRemark}
                onChange={(e) => {
                  setClassRemark(e.target.value);
                  triggerAutoSave();
                }}
                placeholder="اكتب ملاحظة تشمل القسم بأكمله (مثل: ضرورة مراجعة الدروس، تحسن المستوى العام، أو ضعف النتائج في الجزء الثاني...)"
                className="w-full bg-white border border-[#E8DFD0] rounded-xl p-3 text-xs text-[#2B2022] placeholder-[#A8989B] focus:outline-none focus:border-[#7B1E3A] disabled:opacity-60 leading-relaxed transition-colors shadow-2xs"
              />
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="hidden sm:flex flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-[#E8DFD0] shadow-xs">
            <div className="text-xs text-[#766065]">
              <span className="font-bold">حالة الكشف الحالية: </span>
              <span
                className={`font-bold px-2.5 py-1 rounded-full text-[11px] border ${
                  assessmentStatus === 'approved'
                    ? 'bg-[#F4F9F4] text-[#2D6A4F] border-[#C6E7C8]'
                    : assessmentStatus === 'submitted'
                    ? 'bg-[#FAF2F4] text-[#7B1E3A] border-[#E7C1CB]'
                    : assessmentStatus === 'returned'
                    ? 'bg-[#FFF9F0] text-[#8E6E27] border-[#EEDDAF]'
                    : 'bg-[#FAF7F2] text-[#766065] border-[#E8DFD0]'
                }`}
              >
                {assessmentStatus === 'draft' && 'مسودة'}
                {assessmentStatus === 'submitted' && 'مرسل للإدارة (قيد المراجعة)'}
                {assessmentStatus === 'under_review' && 'قيد التدقيق'}
                {assessmentStatus === 'approved' && 'معتمد نهائياً'}
                {assessmentStatus === 'returned' && 'مُعاد للتصحيح'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => executeSave(false, false)}
                disabled={isLocked || savingManual}
                className="px-5 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#4A3A3D] text-xs font-bold border border-[#D5C9B8] transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                <Save className="w-4 h-4 text-[#7B1E3A]" />
                حفظ كمسودة
              </button>

              <button
                onClick={() => {
                  if (window.confirm('هل أنت متأكد من مراجعة كافة النقاط والرغبة في إرسال الكشف إلى الإدارة؟')) {
                    executeSave(true, false);
                  }
                }}
                disabled={isLocked || submittingAdmin}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7B1E3A] to-[#60142B] hover:from-[#60142B] hover:to-[#480E20] text-white text-xs font-black transition-all shadow-md shadow-[#7B1E3A]/25 border border-[#C9A24D]/40 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                إرسال إلى الإدارة
              </button>
            </div>
          </div>

          {/* Sticky Mobile Floating Action Bar */}
          <div className="sm:hidden fixed bottom-3 inset-x-3 z-40 bg-white/95 backdrop-blur-md p-2.5 rounded-2xl border border-[#E8DFD0] shadow-2xl flex items-center gap-2">
            <button
              onClick={() => executeSave(false, false)}
              disabled={isLocked || savingManual}
              className="flex-1 py-3 rounded-xl bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#4A3A3D] text-xs font-black border border-[#D5C9B8] flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4 text-[#7B1E3A]" />
              حفظ مسودة
            </button>
            <button
              onClick={() => {
                if (window.confirm('هل أنت متأكد من اكتمال إدخال النقاط والرغبة في إرسال الكشف للإدارة؟')) {
                  executeSave(true, false);
                }
              }}
              disabled={isLocked || submittingAdmin}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#7B1E3A] to-[#60142B] hover:from-[#60142B] hover:to-[#480E20] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-[#7B1E3A]/25 border border-[#C9A24D]/40 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              إرسال للإدارة
            </button>
          </div>
        </div>
      )}

      {/* History Sub-Tab */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          {/* Filters for History */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E8DFD0] shadow-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-[#766065] font-bold me-1">تصفية:</span>
              {['all', 'draft', 'submitted', 'approved', 'returned'].map((st) => (
                <button
                  key={st}
                  onClick={() => setHistoryFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    historyFilterStatus === st
                      ? 'bg-[#7B1E3A] text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-[#574549] hover:bg-[#F0EAE1] border border-[#E8DFD0]'
                  }`}
                >
                  {st === 'all' && 'الكل'}
                  {st === 'draft' && 'مسودات'}
                  {st === 'submitted' && 'مرسلة للإدارة'}
                  {st === 'approved' && 'معتمدة'}
                  {st === 'returned' && 'معادة للتصحيح'}
                </button>
              ))}
            </div>

            <button
              onClick={loadHistory}
              className="px-3.5 py-2 rounded-xl bg-[#FAF2F4] hover:bg-[#FCE7EC] text-[#7B1E3A] text-xs font-bold border border-[#E7C1CB] flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              تحديث السجل
            </button>
          </div>

          {/* History Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHistory.length === 0 ? (
              <div className="col-span-full py-12 text-center text-[#766065] bg-white rounded-2xl border border-[#E8DFD0] shadow-xs">
                لا توجد كشوفات مسجلة بهذه التصفية.
              </div>
            ) : (
              filteredHistory.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl border border-[#E8DFD0] p-4 sm:p-5 flex flex-col justify-between hover:border-[#C9A24D] hover:shadow-md transition-all shadow-xs space-y-3 group"
                >
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF2F4] text-[#7B1E3A] border border-[#E7C1CB]">
                        {item.class?.name || 'قسم'}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.status === 'approved'
                            ? 'bg-[#F4F9F4] text-[#2D6A4F] border-[#C6E7C8]'
                            : item.status === 'submitted'
                            ? 'bg-[#FAF2F4] text-[#7B1E3A] border-[#E7C1CB]'
                            : item.status === 'returned'
                            ? 'bg-[#FFF9F0] text-[#8E6E27] border-[#EEDDAF]'
                            : 'bg-[#FAF7F2] text-[#766065] border-[#E8DFD0]'
                        }`}
                      >
                        {item.status === 'draft' && 'مسودة'}
                        {item.status === 'submitted' && 'مرسل للإدارة'}
                        {item.status === 'approved' && 'معتمد'}
                        {item.status === 'returned' && 'معاد للتصحيح'}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-[#2B2022]">{item.assessmentType}</h4>
                    <p className="text-xs text-[#766065]">
                      المادة: <strong className="text-[#7B1E3A] font-bold">{item.subject}</strong>
                    </p>
                    <p className="text-xs text-[#766065]">
                      تاريخ الإجراء:{' '}
                      <span className="text-[#2B2022] font-mono font-bold">
                        {item.assessmentDate ? new Date(item.assessmentDate).toLocaleDateString('ar-DZ') : '-'}
                      </span>
                    </p>
                    <p className="text-xs text-[#766065]">
                      عدد التلاميذ المسجلين: <strong className="text-[#2B2022] font-mono">{item.records?.length || 0}</strong>
                    </p>

                    {item.status === 'returned' && item.returnReason && (
                      <div className="bg-[#FFF9F0] border border-[#EEDDAF] rounded-xl p-2.5 text-[11px] text-[#8E6E27]">
                        <strong className="block text-[#8E6E27] font-black mb-0.5">ملاحظات الإدارة:</strong>
                        {item.returnReason}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#F0EAE1] flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleEditAssessment(item)}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#FAF2F4] hover:bg-[#FCE7EC] text-[#7B1E3A] text-xs font-bold border border-[#E7C1CB] transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      {item.status === 'returned' ? 'تصحيح الكشف' : item.status === 'draft' ? 'استكمال الإدخال' : 'معاينة الكشف'}
                    </button>

                    {item.status === 'approved' && (
                      <button
                        type="button"
                        onClick={() => openAuthorizedUrl(`/api/assessments/${item._id}/export/pdf?type=collective`)}
                        className="p-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#4A3A3D] border border-[#E8DFD0] transition-all shadow-2xs cursor-pointer"
                        title="استخراج PDF"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#7B1E3A]" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
