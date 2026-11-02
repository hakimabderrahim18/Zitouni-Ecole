import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  Clock,
  Plus,
  FileText,
  Paperclip,
  CheckCircle2,
  Circle,
  ExternalLink,
  ShieldCheck,
  Printer,
  AlertCircle,
  Download,
  Trash2,
  Edit2,
  X,
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

export default function LessonNotebook({ defaultClassId = null }) {
  const { user } = useAuthStore();
  const [lessons, setLessons] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(defaultClassId || '');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [homeworkOnly, setHomeworkOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  // New Lesson Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [isVisaModalOpen, setIsVisaModalOpen] = useState(false);
  const [selectedLessonForVisa, setSelectedLessonForVisa] = useState(null);
  const [visaRemarks, setVisaRemarks] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    classId: defaultClassId || '',
    date: new Date().toISOString().split('T')[0],
    period: '08:30 - 09:30',
    summary: '',
    hasHomework: false,
    homeworkTitle: '',
    homeworkDescription: '',
    homeworkDueDate: '',
    attachments: [],
    pedagogicalLinks: [],
  });

  const [linkInput, setLinkInput] = useState({ title: '', url: '' });
  const [isUploading, setIsUploading] = useState(false);

  const isTeacher = user?.role === 'teacher';
  const isAdminOrSupervisor = ['admin', 'school', 'general_supervisor', 'pedagogical_supervisor'].includes(user?.role);
  const isStudent = user?.role === 'student';
  const isParent = user?.role === 'parent';

  useEffect(() => {
    fetchClasses();
  }, [defaultClassId]);

  useEffect(() => {
    if (defaultClassId) {
      setSelectedClassId(defaultClassId);
    }
  }, [defaultClassId]);

  useEffect(() => {
    if (selectedClassId || isStudent || isParent) {
      fetchLessons();
    }
  }, [selectedClassId, selectedSubject, homeworkOnly]);

  const fetchClasses = async () => {
    try {
      if (isParent) {
        let classesData = [];
        try {
          const res = await axios.get('/api/parents/classes');
          classesData = res.data || [];
        } catch (e) {
          // Fallback to /api/parents/children extracting children classes
          const res = await axios.get('/api/parents/children');
          const childrenList = res.data || [];
          const parentClassesMap = new Map();

          childrenList.forEach((child) => {
            const cls = child.class;
            if (cls && (cls._id || typeof cls === 'string')) {
              const clsId = (cls._id || cls).toString();
              const childName = child.firstNameArabic || child.user?.firstName || 'الابن';
              if (!parentClassesMap.has(clsId)) {
                parentClassesMap.set(clsId, {
                  _id: clsId,
                  name: cls.name || 'قسم الابن',
                  description: cls.description || '',
                  childNames: [childName],
                });
              } else {
                parentClassesMap.get(clsId).childNames.push(childName);
              }
            }
          });
          classesData = Array.from(parentClassesMap.values());
        }

        setClasses(classesData);
        if (classesData.length > 0) {
          const targetId = defaultClassId && classesData.some((c) => c._id === defaultClassId)
            ? defaultClassId
            : classesData[0]._id;
          setSelectedClassId(targetId);
        } else {
          setSelectedClassId('');
        }
      } else {
        const res = await axios.get('/api/admin/classes');
        const data = res.data || [];
        setClasses(data);
        if (!selectedClassId && data.length > 0 && !isStudent) {
          const targetId = defaultClassId && data.some((c) => c._id === defaultClassId)
            ? defaultClassId
            : data[0]._id;
          setSelectedClassId(targetId);
          setFormData((prev) => ({ ...prev, classId: targetId }));
        }
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedClassId) params.classId = selectedClassId;
      if (selectedSubject) params.subject = selectedSubject;
      if (homeworkOnly) params.hasHomework = 'true';

      const res = await axios.get('/api/lessons', { params });
      setLessons(res.data || []);
    } catch (err) {
      console.error('Error fetching lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const data = new FormData();
    data.append('file', file);

    try {
      const res = await axios.post('/api/lessons/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, res.data],
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors du téléchargement du fichier.');
    } finally {
      setIsUploading(false);
    }
  };

  const addLink = () => {
    if (!linkInput.url.trim()) return;
    setFormData((prev) => ({
      ...prev,
      pedagogicalLinks: [...prev.pedagogicalLinks, { ...linkInput }],
    }));
    setLinkInput({ title: '', url: '' });
  };

  const removeAttachment = (index) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const removeLink = (index) => {
    setFormData((prev) => ({
      ...prev,
      pedagogicalLinks: prev.pedagogicalLinks.filter((_, i) => i !== index),
    }));
  };

  const handleOpenEditLesson = (lesson) => {
    setEditingLessonId(lesson._id);
    setFormData({
      title: lesson.title || '',
      subject: lesson.subject || '',
      classId: lesson.class?._id || lesson.class || selectedClassId || '',
      date: lesson.date ? new Date(lesson.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      period: lesson.period || '08:30 - 09:30',
      summary: lesson.summary || '',
      hasHomework: lesson.homework?.hasHomework || false,
      homeworkTitle: lesson.homework?.title || '',
      homeworkDescription: lesson.homework?.description || '',
      homeworkDueDate: lesson.homework?.dueDate ? new Date(lesson.homework.dueDate).toISOString().split('T')[0] : '',
      attachments: lesson.attachments || [],
      pedagogicalLinks: lesson.pedagogicalLinks || [],
    });
    setIsModalOpen(true);
  };

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.subject.trim() || !formData.classId || !formData.summary.trim()) {
      alert('يرجى ملء جميع الحقول الإلزامية (العنوان، المادة، القسم، ملخص الدرس).');
      return;
    }

    try {
      const payload = {
        title: formData.title,
        subject: formData.subject,
        classId: formData.classId,
        date: formData.date,
        period: formData.period,
        summary: formData.summary,
        homework: {
          hasHomework: formData.hasHomework,
          title: formData.homeworkTitle,
          description: formData.homeworkDescription,
          dueDate: formData.homeworkDueDate ? new Date(formData.homeworkDueDate) : undefined,
        },
        attachments: formData.attachments,
        pedagogicalLinks: formData.pedagogicalLinks,
      };

      if (editingLessonId) {
        await axios.put(`/api/lessons/${editingLessonId}`, payload);
        alert('تم تعديل الدرس في كراس النصوص بنجاح.');
      } else {
        await axios.post('/api/lessons', payload);
        alert('تم نشر الدرس والواجب بنجاح وإشعار التلاميذ والأولياء.');
      }
      setIsModalOpen(false);
      resetForm();
      fetchLessons();
    } catch (err) {
      alert(err.response?.data?.message || (editingLessonId ? 'فشل تعديل الدرس.' : 'فشل نشر الدرس.'));
    }
  };

  const resetForm = () => {
    setEditingLessonId(null);
    setFormData({
      title: '',
      subject: '',
      classId: selectedClassId || '',
      date: new Date().toISOString().split('T')[0],
      period: '08:30 - 09:30',
      summary: '',
      hasHomework: false,
      homeworkTitle: '',
      homeworkDescription: '',
      homeworkDueDate: '',
      attachments: [],
      pedagogicalLinks: [],
    });
  };

  const handleToggleHomework = async (lessonId) => {
    try {
      await axios.post(`/api/lessons/${lessonId}/homework-toggle`);
      fetchLessons();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const handleSignVisa = async () => {
    if (!selectedLessonForVisa) return;
    try {
      await axios.post(`/api/lessons/${selectedLessonForVisa._id}/visa`, {
        remarks: visaRemarks.trim() || 'تمت المعاينة والتأشير من طرف الإدارة / المفتش التربوي',
      });
      setIsVisaModalOpen(false);
      setSelectedLessonForVisa(null);
      setVisaRemarks('');
      fetchLessons();
      alert('تم التأشير الإداري على دفتر النصوص بنجاح.');
    } catch (err) {
      alert(err.response?.data?.message || 'فشل التأشير.');
    }
  };

  const handleDeleteLesson = async (id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الدرس من كراس النصوص؟')) return;
    try {
      await axios.delete(`/api/lessons/${id}`);
      fetchLessons();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل حذف الدرس.');
    }
  };

  const isHomeworkCompletedByMe = (lesson) => {
    if (!lesson.homework?.completedBy) return false;
    return lesson.homework.completedBy.some(
      (c) => c.student?._id === user?.id || c.student === user?.id
    );
  };

  const getDueBadge = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-300">انتهى الأجل</span>;
    } else if (diffDays === 0) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A24D]/20 text-[#7B1E3A] border border-[#C9A24D]/40 animate-pulse">التسليم اليوم</span>;
    } else {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">متبقي {diffDays} يوم</span>;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Bar - Prestige Académique */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-[#C9A24D]/35 bg-[#FDFBF7] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#7B1E3A]/10 border border-[#7B1E3A]/25 flex items-center justify-center text-[#7B1E3A] shadow-xs">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-serif font-black text-[#7B1E3A] flex items-center gap-2">
              <span>كراس الدروس والواجبات المنزلية (Cahier de Texte)</span>
              <span className="text-[11px] font-normal px-2.5 py-0.5 rounded-full bg-[#F3E9DC] text-[#7B1E3A] border border-[#C9A24D]/35 font-sans">
                الصفحة 20 من دفتر الشروط
              </span>
            </h2>
            <p className="text-xs text-[#2B2022]/70 font-sans">
              توثيق محاور الدروس، نشر الواجبات المنزلية وتأشيرات المتابعة والتفتيش الإداري
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Print button */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#F3E9DC]/40 border border-[#C9A24D]/35 rounded-xl text-xs font-bold text-[#7B1E3A] transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#C9A24D]" />
            <span>طباعة دفتر النصوص</span>
          </button>

          {/* New Lesson button strictly for teachers (User Request: just teachers can do this) */}
          {isTeacher && (
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#7B1E3A] hover:bg-[#62162d] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#7B1E3A]/20 cursor-pointer border border-[#C9A24D]/30"
            >
              <Plus className="w-4 h-4" />
              <span>إدراج درس / واجب جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Switcher bar - Prestige Académique */}
      <div className="p-4 rounded-xl border border-[#C9A24D]/30 bg-[#FDFBF7] shadow-xs flex flex-wrap items-center gap-3">
        {/* Class Selector */}
        {!isStudent && classes.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#7B1E3A] font-serif">
              {isParent ? 'قسم الابن :' : 'القسم :'}
            </span>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setFormData((prev) => ({ ...prev, classId: e.target.value }));
              }}
              className="bg-white border border-[#C9A24D]/35 rounded-xl px-3 py-1.5 text-xs text-[#2B2022] font-bold focus:outline-none focus:border-[#7B1E3A] cursor-pointer"
            >
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name} {cls.description ? `(${cls.description})` : ''}
                  {cls.childNames && cls.childNames.length > 0 ? ` — (${cls.childNames.join('، ')})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Subject Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#7B1E3A] font-serif">المادة :</span>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-white border border-[#C9A24D]/35 rounded-xl px-3 py-1.5 text-xs text-[#2B2022] font-medium focus:outline-none focus:border-[#7B1E3A] cursor-pointer"
          >
            <option value="">جميع المواد</option>
            <option value="الرياضيات">الرياضيات</option>
            <option value="اللغة العربية">اللغة العربية</option>
            <option value="العلوم الفيزيائية">العلوم الفيزيائية</option>
            <option value="علوم الطبيعة والحياة">علوم الطبيعة والحياة</option>
            <option value="اللغة الفرنسية">اللغة الفرنسية</option>
            <option value="اللغة الإنجليزية">اللغة الإنجليزية</option>
            <option value="التاريخ والجغرافيا">التاريخ والجغرافيا</option>
            <option value="التربية الإسلامية">التربية الإسلامية</option>
            <option value="الفلسفة">الفلسفة</option>
            <option value="الإعلام الآلي">الإعلام الآلي</option>
          </select>
        </div>

        {/* Homework only toggle */}
        <button
          onClick={() => setHomeworkOnly(!homeworkOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            homeworkOnly
              ? 'bg-[#7B1E3A] text-white shadow-sm'
              : 'bg-white text-[#2B2022]/70 border border-[#C9A24D]/25 hover:text-[#7B1E3A]'
          }`}
        >
          <AlertCircle className={`w-3.5 h-3.5 ${homeworkOnly ? 'text-white' : 'text-[#C9A24D]'}`} />
          <span>الواجبات المنزلية فقط</span>
        </button>

        <div className="mr-auto text-xs text-[#2B2022]/70">
          إجمالي الحصص المسجلة : <strong className="text-[#7B1E3A] font-serif font-bold text-sm">{lessons.length}</strong>
        </div>
      </div>

      {/* Lessons Feed / List */}
      {loading ? (
        <div className="p-12 text-center text-[#2B2022]/60">
          <div className="w-8 h-8 border-2 border-[#7B1E3A]/30 border-t-[#7B1E3A] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-serif font-bold">جارِ تحميل كراس الدروس...</p>
        </div>
      ) : lessons.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-[#C9A24D]/35 bg-[#FDFBF7] text-[#2B2022]/60">
          <BookOpen className="w-12 h-12 text-[#C9A24D]/50 mx-auto mb-3" />
          <h4 className="text-sm font-serif font-bold text-[#7B1E3A] mb-1">لا توجد دروس أو واجبات مسجلة</h4>
          <p className="text-xs text-[#2B2022]/60 max-w-sm mx-auto">
            لم يقم الأستاذ بتدوين دروس في هذا القسم بعد. سيتم إشعاركم فور إضافة أي درس أو واجب منزلي جديد.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson) => {
            const hasHomework = lesson.homework && lesson.homework.hasHomework;
            const completed = isHomeworkCompletedByMe(lesson);

            return (
              <motion.div
                key={lesson._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl border border-[#C9A24D]/30 bg-[#FDFBF7] hover:border-[#7B1E3A]/40 transition-all shadow-xs"
              >
                {/* Top Info Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#C9A24D]/20">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#F3E9DC] text-[#7B1E3A] border border-[#C9A24D]/35">
                      {lesson.subject}
                    </span>
                    <span className="text-xs font-bold text-[#2B2022]">
                      {lesson.class?.name}
                    </span>
                    <span className="text-[#C9A24D]">•</span>
                    <span className="flex items-center gap-1 text-xs text-[#2B2022]/70 font-mono" dir="ltr">
                      <Calendar className="w-3.5 h-3.5 text-[#C9A24D]" />
                      {new Date(lesson.date).toLocaleDateString('ar-DZ')}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[#2B2022]/70 font-mono" dir="ltr">
                      <Clock className="w-3.5 h-3.5 text-[#C9A24D]" />
                      {lesson.period}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Official Visa Badge */}
                    {lesson.administrativeVisa?.isVisaed ? (
                      <span
                        title={`أُشِّر من طرف: ${lesson.administrativeVisa.visaedByName || 'الإدارة'} (${lesson.administrativeVisa.remarks})`}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 cursor-help"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>مؤشر إدارياً ✓</span>
                      </span>
                    ) : isAdminOrSupervisor ? (
                      <button
                        onClick={() => {
                          setSelectedLessonForVisa(lesson);
                          setIsVisaModalOpen(true);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#7B1E3A]/10 text-[#7B1E3A] border border-[#7B1E3A]/25 hover:bg-[#7B1E3A]/20 transition-all cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#7B1E3A]" />
                        <span>تأشير المعاينة والتفتيش</span>
                      </button>
                    ) : null}

                    {/* Teacher / Author actions: edit and delete permissions strictly for teachers */}
                    {isTeacher && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditLesson(lesson)}
                          title="تعديل الحصة أو التمارين"
                          className="p-1.5 text-[#2B2022]/70 hover:text-[#7B1E3A] hover:bg-[#F3E9DC]/60 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLesson(lesson._id)}
                          title="حذف الحصة والواجب"
                          className="p-1.5 text-[#2B2022]/50 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lesson Title & Summary */}
                <div className="mb-4">
                  <h3 className="text-base font-serif font-black text-[#7B1E3A] mb-2">{lesson.title}</h3>
                  <div className="p-3.5 rounded-xl bg-white border border-[#C9A24D]/25 text-xs text-[#2B2022] leading-relaxed whitespace-pre-line shadow-2xs">
                    {lesson.summary}
                  </div>
                </div>

                {/* Homework Section (If present) */}
                {hasHomework && (
                  <div className="p-4 rounded-xl bg-[#C9A24D]/10 border border-[#C9A24D]/35 mb-4 shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-[#7B1E3A]" />
                        <span className="text-xs font-bold text-[#7B1E3A] font-serif">
                          الواجب المنزلي (Devoir à domicile) : {lesson.homework.title || 'تمارين تطبيقية'}
                        </span>
                      </div>
                      {getDueBadge(lesson.homework.dueDate)}
                    </div>

                    <p className="text-xs text-[#2B2022] leading-relaxed mb-3">
                      {lesson.homework.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-[#C9A24D]/25 text-xs">
                      <span className="text-[#2B2022]/70">
                        آخر أجل للتسليم :{' '}
                        <strong className="text-[#7B1E3A] font-mono" dir="ltr">
                          {lesson.homework.dueDate
                            ? new Date(lesson.homework.dueDate).toLocaleDateString('ar-DZ')
                            : 'غير محدد'}
                        </strong>
                      </span>

                      {/* Student Completion Checkbox */}
                      {isStudent && (
                        <button
                          onClick={() => handleToggleHomework(lesson._id)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            completed
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-white border border-[#C9A24D]/30 text-[#2B2022]/70 hover:text-[#7B1E3A]'
                          }`}
                        >
                          {completed ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-white" />
                              <span>أنجزت هذا الواجب ✓</span>
                            </>
                          ) : (
                            <>
                              <Circle className="w-4 h-4 text-[#2B2022]/40" />
                              <span>تحديد كمنجز</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Parent or Teacher completion count */}
                      {!isStudent && (
                        <span className="text-[#2B2022]/70">
                          عدد التلاميذ الذين أنجزوا الواجب :{' '}
                          <strong className="text-[#7B1E3A] font-mono">
                            {lesson.homework.completedBy ? lesson.homework.completedBy.length : 0}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Attachments & Links */}
                {(lesson.attachments?.length > 0 || lesson.pedagogicalLinks?.length > 0) && (
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {lesson.attachments.map((att, i) => (
                      <a
                        key={i}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F3E9DC]/40 border border-[#C9A24D]/30 text-xs text-[#7B1E3A] font-medium transition-all shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#C9A24D]" />
                        <span className="truncate max-w-[160px] font-mono">{att.name}</span>
                        <Download className="w-3 h-3 text-[#2B2022]/40" />
                      </a>
                    ))}

                    {lesson.pedagogicalLinks.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F3E9DC]/40 border border-[#C9A24D]/30 text-xs text-[#7B1E3A] font-medium transition-all shadow-2xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#C9A24D]" />
                        <span>{link.title || 'رابط المورد التربوي'}</span>
                      </a>
                    ))}
                  </div>
                )}

                {/* Teacher signature footnote */}
                <div className="mt-3 pt-2 flex items-center justify-between text-[11px] text-[#2B2022]/50 border-t border-[#C9A24D]/15">
                  <span>الأستاذ(ة) : {lesson.teacherName || `${lesson.teacherUser?.firstName} ${lesson.teacherUser?.lastName}`}</span>
                  <span>تاريخ التدوين : {new Date(lesson.createdAt).toLocaleDateString('ar-DZ')}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* New Lesson / Homework Composer Modal strictly for Teachers */}
      {isModalOpen && isTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-3xl p-6 shadow-2xl text-right"
          >
            <div className="flex items-center justify-between mb-4 border-b border-[#C9A24D]/25 pb-3">
              <div className="flex items-center gap-2 text-[#7B1E3A] font-serif font-black">
                <BookOpen className="w-5 h-5 text-[#C9A24D]" />
                <span className="text-base">
                  {editingLessonId ? 'تعديل الدرس المنشور في كراس النصوص' : 'إدراج حصة جديدة في كراس الدروس والواجبات'}
                </span>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-[#2B2022]/60 hover:text-[#7B1E3A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLesson} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7B1E3A] mb-1 font-serif">القسم المستهدف *</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full bg-white border border-[#C9A24D]/35 rounded-xl p-2.5 text-xs text-[#2B2022] font-bold focus:outline-none focus:border-[#7B1E3A]"
                    required
                  >
                    <option value="">اختر القسم...</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.description ? `(${c.description})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7B1E3A] mb-1 font-serif">المادة الدراسية *</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-white border border-[#C9A24D]/35 rounded-xl p-2.5 text-xs text-[#2B2022] font-medium focus:outline-none focus:border-[#7B1E3A]"
                    required
                  >
                    <option value="">اختر المادة...</option>
                    <option value="الرياضيات">الرياضيات</option>
                    <option value="اللغة العربية">اللغة العربية</option>
                    <option value="العلوم الفيزيائية">العلوم الفيزيائية</option>
                    <option value="علوم الطبيعة والحياة">علوم الطبيعة والحياة</option>
                    <option value="اللغة الفرنسية">اللغة الفرنسية</option>
                    <option value="اللغة الإنجليزية">اللغة الإنجليزية</option>
                    <option value="التاريخ والجغرافيا">التاريخ والجغرافيا</option>
                    <option value="التربية الإسلامية">التربية الإسلامية</option>
                    <option value="الفلسفة">الفلسفة</option>
                    <option value="الإعلام الآلي">الإعلام الآلي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7B1E3A] mb-1 font-serif">عنوان الدرس أو المحور التعليمي *</label>
                <input
                  type="text"
                  placeholder="مثال: الدوال العددية وتطبيقاتها في المسائل الفيزيائية..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white border border-[#C9A24D]/35 rounded-xl p-2.5 text-xs text-[#2B2022] focus:outline-none focus:border-[#7B1E3A]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7B1E3A] mb-1 font-serif">تاريخ الحصة *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-white border border-[#C9A24D]/35 rounded-xl p-2.5 text-xs text-[#2B2022] font-mono focus:outline-none focus:border-[#7B1E3A]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7B1E3A] mb-1 font-serif">التوقيت الزمني</label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className="w-full bg-white border border-[#C9A24D]/35 rounded-xl p-2.5 text-xs text-[#2B2022] font-mono focus:outline-none focus:border-[#7B1E3A]"
                  >
                    <option value="08:30 - 09:30">08:30 - 09:30</option>
                    <option value="09:30 - 10:30">09:30 - 10:30</option>
                    <option value="10:30 - 11:30">10:30 - 11:30</option>
                    <option value="11:30 - 12:30">11:30 - 12:30</option>
                    <option value="13:30 - 14:30">13:30 - 14:30</option>
                    <option value="14:30 - 15:30">14:30 - 15:30</option>
                    <option value="15:30 - 16:30">15:30 - 16:30</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7B1E3A] mb-1 font-serif">
                  ملخص الدرس والمفاهيم المتناولة في القسم *
                </label>
                <textarea
                  rows="3"
                  placeholder="اكتب هنا موجز الحصة، الكفاءات المستهدفة، والأنشطة المنجزة في القسم..."
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full bg-white border border-[#C9A24D]/35 rounded-xl p-2.5 text-xs text-[#2B2022] focus:outline-none focus:border-[#7B1E3A]"
                  required
                />
              </div>

              {/* Homework & Exercises Section (الواجب المنزلي والتمارين) */}
              <div className="p-4 rounded-2xl border-2 border-[#C9A24D]/35 bg-white shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hasHomework"
                    checked={formData.hasHomework}
                    onChange={(e) => setFormData({ ...formData, hasHomework: e.target.checked })}
                    className="rounded text-[#7B1E3A] focus:ring-0 w-4.5 h-4.5 cursor-pointer accent-[#7B1E3A]"
                  />
                  <label htmlFor="hasHomework" className="text-xs font-serif font-black text-[#7B1E3A] cursor-pointer flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-[#C9A24D]" />
                    <span>تضمين تمارين وواجب منزلي (الواجب المنزلي / Exercices à domicile)</span>
                  </label>
                </div>

                {formData.hasHomework && (
                  <div className="space-y-3 pt-2 border-t border-[#C9A24D]/20">
                    <div>
                      <label className="block text-[11px] font-bold text-[#7B1E3A] mb-1">
                        عنوان الواجب أو التمارين * (مثال: حل التمارين 12، 13 و 15 ص 48)
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: تمارين الهندسة المستوية ص 48 أو واجب منزلي في مادة الرياضيات..."
                        value={formData.homeworkTitle}
                        onChange={(e) => setFormData({ ...formData, homeworkTitle: e.target.value })}
                        className="w-full bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl p-2.5 text-xs text-[#2B2022] font-semibold focus:outline-none focus:border-[#7B1E3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#7B1E3A] mb-1">
                        نص الواجب المنزلي، أرقام التمارين، وتوجيهات الإنجاز بالتفصيل
                      </label>
                      <textarea
                        rows="3"
                        placeholder="اكتب هنا التمارين المطلوبة، الأسئلة التوجيهية، أو طريقة الإنجاز على كراس المحاولات..."
                        value={formData.homeworkDescription}
                        onChange={(e) => setFormData({ ...formData, homeworkDescription: e.target.value })}
                        className="w-full bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl p-2.5 text-xs text-[#2B2022] leading-relaxed focus:outline-none focus:border-[#7B1E3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#7B1E3A] mb-1">
                        آخر أجل لتسليم الواجب وحل التمارين في القسم
                      </label>
                      <input
                        type="date"
                        value={formData.homeworkDueDate}
                        onChange={(e) => setFormData({ ...formData, homeworkDueDate: e.target.value })}
                        className="w-full bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-xl p-2.5 text-xs text-[#2B2022] font-mono font-bold focus:outline-none focus:border-[#7B1E3A]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Uploads and External Links */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#7B1E3A] font-serif">المرفقات والموارد البيداغوجية</label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F3E9DC]/40 border border-[#C9A24D]/35 rounded-xl text-xs font-bold text-[#7B1E3A] cursor-pointer transition-all shadow-2xs">
                    <Paperclip className="w-4 h-4 text-[#C9A24D]" />
                    <span>{isUploading ? 'جارِ التحميل...' : 'إرفاق ملف (PDF / صورة)'}</span>
                    <input type="file" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
                  </label>
                </div>

                {formData.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.attachments.map((att, i) => (
                      <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-white border border-[#C9A24D]/30 rounded-lg text-xs text-[#2B2022]">
                        <FileText className="w-3.5 h-3.5 text-[#C9A24D]" />
                        <span className="truncate max-w-[120px] font-mono">{att.name}</span>
                        <button type="button" onClick={() => removeAttachment(i)} className="text-[#2B2022]/40 hover:text-rose-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#C9A24D]/25">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-white hover:bg-[#F3E9DC]/40 border border-[#C9A24D]/30 text-[#2B2022]/70 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#7B1E3A] hover:bg-[#62162d] text-white text-xs font-bold rounded-xl shadow-md shadow-[#7B1E3A]/20 transition-all cursor-pointer border border-[#C9A24D]/30"
                >
                  {editingLessonId ? 'حفظ تعديلات الدرس' : 'نشر الدرس في الكراس'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Official Inspection Visa Modal */}
      {isVisaModalOpen && selectedLessonForVisa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-[#FDFBF7] border border-[#C9A24D]/35 rounded-3xl p-6 shadow-2xl text-right"
          >
            <div className="flex items-center justify-between mb-4 border-b border-[#C9A24D]/25 pb-3">
              <div className="flex items-center gap-2 text-[#7B1E3A] font-serif font-black">
                <ShieldCheck className="w-5 h-5 text-[#C9A24D]" />
                <span className="text-base">تأشيرة المعاينة والتفتيش الإداري</span>
              </div>
              <button onClick={() => setIsVisaModalOpen(false)} className="text-[#2B2022]/60 hover:text-[#7B1E3A] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-white border border-[#C9A24D]/25 text-xs text-[#2B2022] space-y-1 shadow-2xs">
                <p><strong>الدرس :</strong> {selectedLessonForVisa.title}</p>
                <p><strong>المادة :</strong> {selectedLessonForVisa.subject} ({selectedLessonForVisa.class?.name})</p>
                <p><strong>الأستاذ :</strong> {selectedLessonForVisa.teacherName}</p>
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-[#7B1E3A] mb-1">
                  ملاحظات وتوجيهات المفتش / المراقب التربوي
                </label>
                <textarea
                  rows="3"
                  placeholder="مثال: تم الاطلاع والمعاينة، المحتوى مطابق للبرنامج الرسمي والواجبات موزعة بانتظام..."
                  value={visaRemarks}
                  onChange={(e) => setVisaRemarks(e.target.value)}
                  className="w-full bg-white border border-[#C9A24D]/35 rounded-xl p-2.5 text-xs text-[#2B2022] focus:outline-none focus:border-[#7B1E3A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#C9A24D]/25">
                <button
                  type="button"
                  onClick={() => setIsVisaModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-[#F3E9DC]/40 border border-[#C9A24D]/30 text-[#2B2022]/70 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSignVisa}
                  className="px-5 py-2 bg-[#7B1E3A] hover:bg-[#62162d] text-white text-xs font-bold rounded-xl shadow-md shadow-[#7B1E3A]/20 transition-all cursor-pointer border border-[#C9A24D]/30"
                >
                  تأكيد التوقيع والتأشير
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
