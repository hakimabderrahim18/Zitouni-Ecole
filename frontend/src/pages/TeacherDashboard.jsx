import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuthStore } from '../store/useAuthStore';
import { BookOpen, Upload, Clipboard, Send, User, Check, X, AlertCircle, Download, Trash2, FileText, Eye, Search } from 'lucide-react';
import TeacherClasses from '../components/TeacherClasses';
import axios from 'axios';

export default function TeacherDashboard() {
  const { profile } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.endsWith('/attendance')) return 'attendance';
    if (path.endsWith('/classes')) return 'classes';
    return 'courses'; // default tab
  };

  const activeTab = getActiveTab();
  
  // Courses form state
  const [course, setCourse] = useState({ title: '', description: '', subject: '', classId: '', groupId: '' });
  const [courseFile, setCourseFile] = useState(null);

  // Attendance register state
  const [attendanceFilter, setAttendanceFilter] = useState({ classId: '', groupId: '', date: new Date().toISOString().split('T')[0] });
  const [studentsList, setStudentsList] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // studentId -> status
  const [attendanceRemarks, setAttendanceRemarks] = useState({}); // studentId -> remarks
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [attendanceSubTab, setAttendanceSubTab] = useState('mark'); // 'mark' or 'history'
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [attendanceExcelFile, setAttendanceExcelFile] = useState(null);

  // History details state
  const [selectedHistoryDetails, setSelectedHistoryDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsList, setDetailsList] = useState([]);
  const [detailsSearchQuery, setDetailsSearchQuery] = useState('');

  const handleViewDetails = async (item) => {
    setSelectedHistoryDetails(item);
    setLoadingDetails(true);
    setDetailsSearchQuery('');
    try {
      const res = await axios.get(`/api/teachers/attendance/records?classId=${item.classId}&groupId=${item.groupId}&date=${item.date}`);
      setDetailsList(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Error loading details');
      setSelectedHistoryDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Published courses state
  const [coursesList, setCoursesList] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const res = await axios.get('/api/teachers/courses');
      setCoursesList(res.data);
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce cours ?')) return;
    try {
      await axios.delete(`/api/teachers/courses/${courseId}`);
      alert('Cours supprimé avec succès !');
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete course');
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Automatically select the teacher's first assigned Class & Group
  useEffect(() => {
    if (profile?.classes?.length > 0) {
      const defaultClass = profile.classes[0]._id;
      // Find group corresponding to this class or default to first group
      const defaultGroup = profile.groups?.find(g => g.class === defaultClass || g.class?._id === defaultClass)?._id || '';

      setCourse({ title: '', description: '', subject: '', classId: defaultClass, groupId: defaultGroup });
      setAttendanceFilter({ classId: defaultClass, groupId: defaultGroup, date: new Date().toISOString().split('T')[0] });
    }
  }, [profile]);

  // Fetch student roster for attendance logs
  const handleFetchRoster = async (e) => {
    if (e) e.preventDefault();
    if (!attendanceFilter.classId || !attendanceFilter.groupId) {
      alert('Veuillez sélectionner la Classe et le Groupe.');
      return;
    }
    setLoadingStudents(true);
    try {
      const [studentsRes, recordsRes] = await Promise.all([
        axios.get(`/api/teachers/classes/${attendanceFilter.classId}/groups/${attendanceFilter.groupId}/students`),
        axios.get(`/api/teachers/attendance/records?classId=${attendanceFilter.classId}&groupId=${attendanceFilter.groupId}&date=${attendanceFilter.date}`)
      ]);

      setStudentsList(studentsRes.data);
      const defaultRecords = {};
      const defaultRemarks = {};
      
      studentsRes.data.forEach((s) => {
        defaultRecords[s._id] = 'Present';
        defaultRemarks[s._id] = '';
      });

      recordsRes.data.forEach((record) => {
        if (record.student && record.student._id) {
          defaultRecords[record.student._id] = record.status;
          defaultRemarks[record.student._id] = record.remarks || '';
        }
      });

      setAttendanceRecords(defaultRecords);
      setAttendanceRemarks(defaultRemarks);
    } catch (err) {
      alert(err.response?.data?.message || 'Error loading student list');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleUpdateStatus = (studentId, status) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleUpdateRemarks = (studentId, remark) => {
    setAttendanceRemarks((prev) => ({
      ...prev,
      [studentId]: remark,
    }));
  };

  const handleSaveAttendance = async () => {
    const recordsPayload = Object.keys(attendanceRecords).map((studentId) => ({
      studentId,
      status: attendanceRecords[studentId],
      remarks: attendanceRemarks[studentId] || '',
    }));

    try {
      await axios.post('/api/teachers/attendance', {
        classId: attendanceFilter.classId,
        groupId: attendanceFilter.groupId,
        date: attendanceFilter.date,
        records: recordsPayload,
      });
      alert('Feuille de présence enregistrée !');
      fetchAttendanceHistory();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save attendance');
    }
  };

  const fetchAttendanceHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get('/api/teachers/attendance/history');
      setAttendanceHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch attendance history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleEditHistoryItem = async (item) => {
    setAttendanceFilter({
      classId: item.classId,
      groupId: item.groupId,
      date: item.date
    });
    setAttendanceSubTab('mark');
    
    setLoadingStudents(true);
    try {
      const [studentsRes, recordsRes] = await Promise.all([
        axios.get(`/api/teachers/classes/${item.classId}/groups/${item.groupId}/students`),
        axios.get(`/api/teachers/attendance/records?classId=${item.classId}&groupId=${item.groupId}&date=${item.date}`)
      ]);

      setStudentsList(studentsRes.data);

      const mappedRecords = {};
      const mappedRemarks = {};
      
      studentsRes.data.forEach((s) => {
        mappedRecords[s._id] = 'Present';
        mappedRemarks[s._id] = '';
      });

      recordsRes.data.forEach((record) => {
        if (record.student && record.student._id) {
          mappedRecords[record.student._id] = record.status;
          mappedRemarks[record.student._id] = record.remarks || '';
        }
      });

      setAttendanceRecords(mappedRecords);
      setAttendanceRemarks(mappedRemarks);
    } catch (err) {
      alert(err.response?.data?.message || 'Error loading student list');
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'attendance' && attendanceSubTab === 'history') {
      fetchAttendanceHistory();
    }
  }, [activeTab, attendanceSubTab]);

  const handleImportAttendanceExcel = async () => {
    if (!attendanceExcelFile) {
      alert('Veuillez sélectionner un fichier Excel.');
      return;
    }
    if (!attendanceFilter.classId || !attendanceFilter.groupId) {
      alert('Veuillez sélectionner la Classe et le Groupe.');
      return;
    }

    const formData = new FormData();
    formData.append('file', attendanceExcelFile);
    formData.append('classId', attendanceFilter.classId);
    formData.append('groupId', attendanceFilter.groupId);
    formData.append('date', attendanceFilter.date);

    try {
      const res = await axios.post('/api/teachers/attendance/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(res.data.message || 'Importation réussie !');
      setAttendanceExcelFile(null);
      setShowExcelImport(false);
      handleFetchRoster();
    } catch (err) {
      alert(err.response?.data?.message || 'Excel Import failed');
    }
  };


  const handleUploadCourse = async (e) => {
    e.preventDefault();
    if (!courseFile) {
      alert('Veuillez joindre un fichier support de cours.');
      return;
    }

    const formData = new FormData();
    formData.append('file', courseFile);
    formData.append('title', course.title);
    formData.append('description', course.description);
    formData.append('subject', course.subject);
    formData.append('classId', course.classId);
    formData.append('groupId', course.groupId);

    try {
      await axios.post('/api/teachers/courses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Cours mis en ligne avec succès !');
      setCourse(prev => ({ ...prev, title: '', description: '', subject: '' }));
      setCourseFile(null);
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    }
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 text-right"
      >
        {activeTab === 'classes' && <TeacherClasses profile={profile} />}

        {activeTab === 'courses' && (
          <div className="space-y-8 max-w-6xl mx-auto">
            {/* Alert prompting teacher to use main Feed for announcements */}
            <div className="glass-panel p-4 rounded-xl border border-brand-500/20 bg-brand-950/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-brand-400 shrink-0" />
                <div className="text-sm text-slate-350">
                  <span className="font-semibold text-white">الإعلانات وفضاء الأخبار:</span> يمكنك الآن نشر الإعلانات والتفاعل مع المنشورات مباشرة في فضاء الأخبار العام للمدرسة.
                </div>
              </div>
              <button
                onClick={() => navigate('/feed')}
                className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
              >
                الانتقال إلى فضاء الأخبار
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Upload Course Material Column */}
              <div className="lg:col-span-5 glass-panel p-6 md:p-8 rounded-2xl border border-luxury-border space-y-6 h-fit">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-brand-400" />
                  <span>رفع درس جديد</span>
                </h3>
                <form onSubmit={handleUploadCourse} className="space-y-4">
                  <input
                    type="text"
                    required
                    placeholder="عنوان الدرس"
                    value={course.title}
                    onChange={(e) => setCourse({ ...course, title: e.target.value })}
                    className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none placeholder-slate-650"
                  />
                  <input
                    type="text"
                    required
                    placeholder="المادة (مثال: رياضيات)"
                    value={course.subject}
                    onChange={(e) => setCourse({ ...course, subject: e.target.value })}
                    className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none placeholder-slate-650"
                  />
                  <textarea
                    placeholder="الوصف (اختياري)"
                    value={course.description}
                    onChange={(e) => setCourse({ ...course, description: e.target.value })}
                    className="w-full h-24 bg-slate-900 border border-luxury-border rounded-xl p-4 text-sm focus:border-brand-500 focus:outline-none placeholder-slate-650"
                  />
                  
                  {/* Select class and group dropdowns */}
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={course.classId}
                      required
                      onChange={(e) => setCourse({ ...course, classId: e.target.value })}
                      className="bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                    >
                      <option value="">اختر القسم</option>
                      {profile?.classes?.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>

                    <select
                      value={course.groupId}
                      onChange={(e) => setCourse({ ...course, groupId: e.target.value })}
                      className="bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                    >
                      <option value="">اختر الفوج</option>
                      {profile?.groups?.map((g) => (
                        <option key={g._id} value={g._id}>{g.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      required
                      onChange={(e) => setCourseFile(e.target.files[0])}
                      className="text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-brand-400 hover:file:bg-slate-850"
                    />
                  </div>
                  <button type="submit" className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-all">
                    نشر الدرس
                  </button>
                </form>
              </div>

              {/* Uploaded Courses Directory Column */}
              <div className="lg:col-span-7 space-y-6">
                <div className="glass-panel p-6 rounded-2xl border border-luxury-border space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-brand-400" />
                    <span>الدروس المنشورة</span>
                  </h3>

                  {loadingCourses ? (
                    <div className="text-slate-450 text-sm py-4">Chargement...</div>
                  ) : coursesList.length === 0 ? (
                    <div className="text-slate-550 text-sm py-8 text-center italic bg-slate-950/20 rounded-xl border border-luxury-border/30">
                      لم يتم نشر أي وثائق أو دروس.
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                      {coursesList.map((c) => (
                        <div key={c._id} className="p-4 bg-slate-900/30 border border-luxury-border rounded-xl flex justify-between items-center hover:border-brand-500/20 transition-all">
                          <div>
                            <h4 className="font-semibold text-white text-sm">{c.title}</h4>
                            <p className="text-xs text-slate-400 mt-1">
                              Matière: <span className="text-slate-200">{c.subject}</span> &bull; 
                              Classe: <span className="text-slate-200">{c.class?.name || 'Générale'}</span>
                              {c.group && ` (${c.group?.name})`}
                            </p>
                            {c.description && <p className="text-xs text-slate-500 mt-1.5">{c.description}</p>}
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={c.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2.5 bg-slate-800 hover:bg-slate-750 text-brand-400 border border-luxury-border rounded-xl transition-all"
                              title="Télécharger"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => handleDeleteCourse(c._id)}
                              className="p-2.5 bg-red-955/20 hover:bg-red-955/40 text-red-400 border border-red-900/40 rounded-xl transition-all"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

          {activeTab === 'attendance' && (
          <div className="glass-panel p-6 md:p-8 rounded-2xl border border-luxury-border space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clipboard className="w-5 h-5 text-brand-400" />
              <span>تسجيل حضور وغياب التلاميذ</span>
            </h3>

            {/* Attendance Sub-tabs Selection */}
            <div className="flex gap-4 border-b border-luxury-border/30 pb-3 mb-6">
              <button
                type="button"
                onClick={() => setAttendanceSubTab('mark')}
                className={`pb-2 px-1 text-sm font-semibold border-b-2 transition-all ${
                  attendanceSubTab === 'mark'
                    ? 'border-brand-500 text-white'
                    : 'border-transparent text-slate-450 hover:text-slate-200'
                }`}
              >
                تسجيل الحضور اليومي
              </button>
              <button
                type="button"
                onClick={() => setAttendanceSubTab('history')}
                className={`pb-2 px-1 text-sm font-semibold border-b-2 transition-all ${
                  attendanceSubTab === 'history'
                    ? 'border-brand-500 text-white'
                    : 'border-transparent text-slate-450 hover:text-slate-200'
                }`}
              >
                سجل الحضور التاريخي
              </button>
            </div>

            {attendanceSubTab === 'mark' && (
              <div className="space-y-6">
                {/* Attendance Filter selection */}
                <form onSubmit={handleFetchRoster} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-900/20 p-4 rounded-xl border border-luxury-border">
                  <div>
                    <label className="text-xs uppercase text-slate-400 font-semibold mb-1 block">القسم الدراسي</label>
                    <select
                      value={attendanceFilter.classId}
                      required
                      onChange={(e) => setAttendanceFilter({ ...attendanceFilter, classId: e.target.value })}
                      className="w-full bg-slate-950 border border-luxury-border rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                    >
                      <option value="">اختر القسم</option>
                      {profile?.classes?.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs uppercase text-slate-400 font-semibold mb-1 block">الفوج الدراسي</label>
                    <select
                      value={attendanceFilter.groupId}
                      required
                      onChange={(e) => setAttendanceFilter({ ...attendanceFilter, groupId: e.target.value })}
                      className="w-full bg-slate-950 border border-luxury-border rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                    >
                      <option value="">اختر الفوج</option>
                      {profile?.groups?.map((g) => (
                        <option key={g._id} value={g._id}>{g.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs uppercase text-slate-400 font-semibold mb-1 block">Date</label>
                    <input
                      type="date"
                      required
                      value={attendanceFilter.date}
                      onChange={(e) => setAttendanceFilter({ ...attendanceFilter, date: e.target.value })}
                      className="w-full bg-slate-950 border border-luxury-border rounded-xl px-4 py-2 text-sm focus:border-brand-500 focus:outline-none text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-sm transition-all">
                      تحميل القائمة
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowExcelImport(!showExcelImport)}
                      className="px-4 py-2.5 bg-brand-950 hover:bg-brand-900 border border-brand-850 hover:border-brand-700 text-brand-400 font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5"
                      title="Importer depuis Excel"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Excel</span>
                    </button>
                  </div>
                </form>

                {showExcelImport && (
                  <div className="glass-panel p-6 rounded-xl border border-luxury-border max-w-xl">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                      <Upload className="w-4 h-4 text-brand-400" />
                      <span>استيراد الحضور عبر Excel</span>
                    </h4>
                    <p className="text-xs text-slate-450 mb-4">
                      حدد ملف Excel يحتوي على الأعمدة التالية : <code className="text-brand-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono">registrationNumber</code> (ou N° Inscription), <code className="text-brand-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono">status</code> (حاضر/غائب/متأخر/غياب مبرر) et facultativement <code className="text-brand-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono">remarks</code>.
                    </p>
                    <div className="space-y-4">
                      <div className="border border-dashed border-luxury-border rounded-xl p-5 text-center relative cursor-pointer hover:bg-slate-900/20 transition-all">
                        <input
                          type="file"
                          required
                          accept=".xlsx, .xls"
                          onChange={(e) => setAttendanceExcelFile(e.target.files[0])}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <FileText className="w-8 h-8 text-slate-550 mx-auto mb-2" />
                        <span className="text-xs text-slate-400 block">
                          {attendanceExcelFile ? attendanceExcelFile.name : 'Sélectionner le fichier Excel de présence'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleImportAttendanceExcel}
                        disabled={!attendanceExcelFile}
                        className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-550 text-white font-bold rounded-xl text-sm transition-all"
                      >
                        تحميل البيانات من ملف Excel
                      </button>
                    </div>
                  </div>
                )}

                {loadingStudents ? (
                  <div className="text-slate-400 text-sm">جاري تحميل قائمة التلاميذ...</div>
                ) : studentsList.length > 0 ? (
                  <div className="space-y-6">
                    <div className="overflow-x-auto rounded-xl border border-luxury-border">
                      <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-900/60 text-slate-450 uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="p-4 rounded-l-xl">Élève / Student</th>
                            <th className="p-4">Statut / Status Selection</th>
                            <th className="p-4 rounded-r-xl">Remarques / Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-luxury-border/30">
                          {studentsList.map((student) => (
                            <tr key={student._id} className="hover:bg-slate-900/10">
                              <td className="p-4">
                                <span className="font-semibold text-white block">
                                  {student.user?.firstName} {student.user?.lastName}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">{student.registrationNumber}</span>
                              </td>
                              <td className="p-4">
                                <div className="flex gap-2">
                                  {['Present', 'غائب', 'Late', 'Excused'].map((status) => (
                                    <button
                                      key={status}
                                      type="button"
                                      onClick={() => handleUpdateStatus(student._id, status)}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                        attendanceRecords[student._id] === status
                                          ? status === 'Present'
                                            ? 'bg-emerald-600 text-white'
                                            : status === 'غائب'
                                            ? 'bg-red-600 text-white'
                                            : 'bg-yellow-600 text-slate-950'
                                          : 'bg-slate-900 text-slate-400 border border-luxury-border hover:bg-slate-800'
                                      }`}
                                    >
                                      {status === 'Present' ? 'حاضر' : status === 'غائب' ? 'غائب' : status === 'Late' ? 'متأخر' : 'غياب مبرر'}
                                    </button>
                                  ))}
                                </div>
                              </td>
                              <td className="p-4">
                                <input
                                  type="text"
                                  placeholder="إضافة ملاحظة..."
                                  value={attendanceRemarks[student._id] || ''}
                                  onChange={(e) => handleUpdateRemarks(student._id, e.target.value)}
                                  className="w-full bg-slate-950 border border-luxury-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveAttendance}
                        className="py-3 px-8 bg-emerald-650 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all"
                      >
                        تأكيد وحفظ سجل الحضور
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 text-slate-550 border border-dashed border-luxury-border rounded-xl">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm">لم يتم تحميل أي تلميذ. يرجى اختيار القسم والفوج أعلاه.</p>
                  </div>
                )}
              </div>
            )}

            {attendanceSubTab === 'history' && (
              <div className="space-y-6">
                {loadingHistory ? (
                  <div className="text-slate-400 text-sm">جاري تحميل سجل الحضور التاريخي...</div>
                ) : attendanceHistory.length === 0 ? (
                  <div className="text-center p-8 text-slate-550 border border-dashed border-luxury-border rounded-xl">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm">لم يتم العثور على أي سجل حضور تاريخي.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {attendanceHistory.map((item, idx) => (
                      <div key={idx} className="p-5 rounded-xl bg-slate-900/40 border border-luxury-border/60 hover:border-brand-500/30 transition-all flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-white text-sm">{item.className}</h4>
                            <span className="text-[10px] font-mono text-slate-400 px-2.5 py-0.5 rounded-full bg-slate-950 border border-luxury-border">
                              {item.groupName}
                            </span>
                          </div>
                          <p className="text-xs text-brand-400 font-mono mt-1">
                            Date: {new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </p>
                          
                          {/* Status counts layout */}
                          <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                            <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-2">
                              <span className="block text-[10px] text-slate-500 uppercase tracking-wider">حاضرs</span>
                              <span className="text-sm font-bold text-emerald-450">{item.presentCount}</span>
                            </div>
                            <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-2">
                              <span className="block text-[10px] text-slate-500 uppercase tracking-wider">غائبs</span>
                              <span className="text-sm font-bold text-red-450">{item.absentCount}</span>
                            </div>
                            <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-2">
                              <span className="block text-[10px] text-slate-500 uppercase tracking-wider">متأخرs</span>
                              <span className="text-sm font-bold text-yellow-450">{item.lateCount}</span>
                            </div>
                            <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-2">
                              <span className="block text-[10px] text-slate-500 uppercase tracking-wider">غياب مبررs</span>
                              <span className="text-sm font-bold text-blue-400">{item.excusedCount}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-luxury-border/20">
                          <button
                            type="button"
                            onClick={() => handleViewDetails(item)}
                            className="text-xs font-semibold px-4 py-2 bg-brand-600/10 hover:bg-brand-600/20 text-brand-400 border border-brand-500/20 rounded-lg transition-all flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            عرض التفاصيل
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditHistoryItem(item)}
                            className="text-xs font-semibold px-4 py-2 bg-brand-950 hover:bg-brand-900 text-brand-400 border border-brand-850 hover:border-brand-700 rounded-lg transition-all"
                          >
                            تعديل / تحديث
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* Modal for viewing detailed history */}
        {selectedHistoryDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
            <div className="glass-panel w-full max-w-2xl border border-luxury-border rounded-2xl p-6 md:p-8 space-y-6 max-h-[85vh] flex flex-col">
              
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b border-luxury-border/30 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Clipboard className="w-5 h-5 text-brand-400" />
                    <span>تفاصيل ورقة الحضور والغياب</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Classe : <span className="text-white font-semibold">{selectedHistoryDetails.className}</span> &bull; Groupe : <span className="text-white font-semibold">{selectedHistoryDetails.groupName}</span>
                  </p>
                  <p className="text-xs text-brand-400 font-mono mt-0.5">
                    Date : {new Date(selectedHistoryDetails.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedHistoryDetails(null)}
                  className="p-1.5 hover:bg-slate-900 rounded-lg border border-luxury-border/50 text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-550" />
                <input
                  type="text"
                  placeholder="البحث عن تلميذ..."
                  value={detailsSearchQuery}
                  onChange={(e) => setDetailsSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-luxury-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none text-white placeholder-slate-650"
                />
              </div>

              {/* Roster Details */}
              <div className="flex-1 overflow-y-auto min-h-[300px] pr-2 space-y-3">
                {loadingDetails ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    جاري تحميل التفاصيل...
                  </div>
                ) : (
                  (() => {
                    const filtered = detailsList.filter((record) => {
                      const fullName = `${record.student?.user?.firstName || ''} ${record.student?.user?.lastName || ''}`.toLowerCase();
                      const regNum = (record.student?.registrationNumber || '').toLowerCase();
                      return fullName.includes(detailsSearchQuery.toLowerCase()) || regNum.includes(detailsSearchQuery.toLowerCase());
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-12 text-slate-500 text-sm italic">
                          لم يتم العثور على أي تلميذ.
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {filtered.map((record, index) => {
                          const status = record.status;
                          const name = `${record.student?.user?.firstName || ''} ${record.student?.user?.lastName || ''}`;
                          const regNum = record.student?.registrationNumber || '';
                          const remarks = record.remarks || '';

                          return (
                            <div
                              key={index}
                              className="p-3.5 rounded-xl border border-luxury-border/40 bg-slate-900/10 hover:border-luxury-border/80 transition-all flex items-center justify-between gap-4"
                            >
                              <div className="space-y-1">
                                <span className="font-semibold text-white text-sm block">
                                  {name}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono block">
                                  N° Inscr: {regNum}
                                </span>
                                {remarks && (
                                  <span className="text-xs text-slate-450 italic block mt-1">
                                    Remarque : "{remarks}"
                                  </span>
                                )}
                              </div>
                              <div>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    status === 'Present'
                                      ? 'bg-emerald-950/40 border border-emerald-900/40 text-emerald-450'
                                      : status === 'غائب'
                                      ? 'bg-red-950/40 border border-red-900/40 text-red-450'
                                      : status === 'Late'
                                      ? 'bg-yellow-950/40 border border-yellow-900/40 text-yellow-450'
                                      : 'bg-blue-950/40 border border-blue-900/40 text-blue-400'
                                  }`}
                                >
                                  {status === 'Present'
                                    ? 'حاضر'
                                    : status === 'غائب'
                                    ? 'غائب'
                                    : status === 'Late'
                                    ? 'متأخر'
                                    : 'غياب مبرر'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end pt-4 border-t border-luxury-border/30">
                <button
                  type="button"
                  onClick={() => setSelectedHistoryDetails(null)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-350 hover:text-white border border-luxury-border rounded-xl text-sm font-semibold transition-all"
                >
                  Fermer
                </button>
              </div>

            </div>
          </div>
        )}

      </motion.div>
    </DashboardLayout>
  );
}
