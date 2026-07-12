import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuthStore } from '../store/useAuthStore';
import { Users, CreditCard, BookOpen, Upload, Plus, FileText, Calendar, ShieldAlert, Check, X, Edit2, Trash2, MessageSquare, Search, Eye, Download, Bus, Utensils, GraduationCap } from 'lucide-react';
import ScheduleCard from '../components/ScheduleCard';
import ScheduleTypePanel from '../components/ScheduleTypePanel';
import SchedulesGuide from '../components/SchedulesGuide';
import FinanceModule from '../components/FinanceModule';
import axios from 'axios';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab dynamically from pathname
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.endsWith('/users')) return 'users';
    if (path.endsWith('/finance')) return 'finance';
    if (path.endsWith('/accounts')) return 'accounts';
    if (path.endsWith('/students')) return 'students';
    if (path.endsWith('/teachers')) return 'teachers';
    if (path.endsWith('/classes-create')) return 'create';
    if (path.endsWith('/classes')) return 'classes';
    if (path.endsWith('/modules')) return 'modules';
    if (path.endsWith('/documents')) return 'documents';
    if (path.endsWith('/schedules-guide')) return 'guide';
    if (path.endsWith('/schedules')) return 'schedules';
    if (path.endsWith('/audit')) return 'audit';
    return 'overview';
  };

  const activeTab = getActiveTab();
  const [stats, setStats] = useState(null);
  const [systemUsers, setSystemUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [modules, setModules] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Module & document management state
  const [newModule, setNewModule] = useState({ name: '', description: '' });
  const [editingModule, setEditingModule] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState('');

  // System accounts management (activate / edit)
  const [accountSearch, setAccountSearch] = useState('');
  const [accountRoleFilter, setAccountRoleFilter] = useState('all');

  // Edit / Billing state controls
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isStudentDetailsOpen, setIsStudentDetailsOpen] = useState(false);
  const [editingDetails, setEditingDetails] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    subjects: '',
    classId: '',
    groupId: '',
    parentId: '',
    profession: '',
    address: '',
    classes: [],
    groups: [],
  });

  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [billingForm, setBillingForm] = useState({
    studentId: '',
    amount: 15000,
    type: 'Tuition',
    status: 'Pending',
  });

  // Forms state
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'student',
    phoneNumber: '',
    dateOfBirth: '',
    classId: '',
    groupId: '',
    parentId: '',
    subjects: [],
    classes: [],
    groups: [],
    assignments: [],
    profession: '',
    address: '',
  });
  const [newClass, setNewClass] = useState({ name: '', description: '', level: 'primary', teacherIds: [], modules: [] });
  const [newGroup, setNewGroup] = useState({ name: '', classId: '', capacity: 30, teacherIds: [], modules: [] });
  const [newSchedule, setNewSchedule] = useState({ type: 'Timetable', title: '', classId: '', groupId: '', data: '' });
  const [editorMode, setEditorMode] = useState('visual'); // 'visual' or 'expert'
  const [visualData, setVisualData] = useState({
    "Lundi": [],
    "Mardi": [],
    "Mercredi": [],
    "Jeudi": [],
    "Vendredi": []
  });
  const [excelFile, setExcelFile] = useState(null);
  const [showExcelUpload, setShowExcelUpload] = useState(false);

  // Student directory state controls
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('');

  // Conversation audit state controls
  const [auditMessages, setAuditMessages] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [senderRoleFilter, setSenderRoleFilter] = useState('all');
  const [receiverRoleFilter, setReceiverRoleFilter] = useState('all');
  const [auditSortOrder, setAuditSortOrder] = useState('desc');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin' && ['students', 'teachers', 'classes', 'schedules', 'accounts', 'guide', 'create', 'modules', 'documents'].includes(activeTab)) {
        navigate('/dashboard/admin', { replace: true });
      } else if (user.role === 'school' && ['users', 'audit'].includes(activeTab)) {
        navigate('/dashboard/admin', { replace: true });
      }
    }
  }, [activeTab, user, navigate]);

  useEffect(() => {
    if (activeTab === 'audit' && user?.role === 'admin') {
      fetchAuditMessages();
    }
  }, [activeTab, user]);

  const fetchAuditMessages = async () => {
    setAuditLoading(true);
    try {
      const res = await axios.get('/api/messages/audit');
      setAuditMessages(res.data);
    } catch (err) {
      console.error('Failed to fetch audit messages', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (user.role === 'admin') {
        const [statsRes, usersRes, classesRes, groupsRes, parentsRes, modulesRes] = await Promise.all([
          axios.get('/api/admin/dashboard/stats'),
          axios.get('/api/admin/users'),
          axios.get('/api/admin/classes'),
          axios.get('/api/admin/groups'),
          axios.get('/api/admin/parents'),
          axios.get('/api/admin/modules'),
        ]);
        setStats(statsRes.data);
        setSystemUsers(usersRes.data);
        setClasses(classesRes.data);
        setGroups(groupsRes.data);
        setParents(parentsRes.data);
        setModules(modulesRes.data);
      } else if (user.role === 'school') {
        const [statsRes, classesRes, groupsRes, parentsRes, studentsRes, teachersRes, schedulesRes, modulesRes, documentsRes, usersRes] = await Promise.all([
          axios.get('/api/admin/dashboard/stats'),
          axios.get('/api/admin/classes'),
          axios.get('/api/admin/groups'),
          axios.get('/api/admin/parents'),
          axios.get('/api/admin/students'),
          axios.get('/api/admin/teachers'),
          axios.get('/api/admin/schedules'),
          axios.get('/api/admin/modules'),
          axios.get('/api/admin/documents'),
          axios.get('/api/admin/users'),
        ]);
        setStats(statsRes.data);
        setClasses(classesRes.data);
        setGroups(groupsRes.data);
        setParents(parentsRes.data);
        setStudents(studentsRes.data);
        setTeachers(teachersRes.data);
        setSchedules(schedulesRes.data);
        setModules(modulesRes.data);
        setDocuments(documentsRes.data);
        setSystemUsers(usersRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Export a dataset to an Excel file and trigger a browser download
  const [exporting, setExporting] = useState('');
  const handleExport = async (resource, fileName) => {
    setExporting(resource);
    try {
      const res = await axios.get(`/api/admin/export/${resource}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
      alert('فشل تصدير الملف. حاول مرة أخرى.');
    } finally {
      setExporting('');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const details = {};
      if (newUser.role === 'student') {
        details.registrationNumber = `REG-${Date.now().toString().slice(-6)}`;
        details.classId = newUser.classId;
        details.groupId = newUser.groupId;
        details.parentId = newUser.parentId;
        details.dateOfBirth = newUser.dateOfBirth;
      } else if (newUser.role === 'teacher') {
        details.subjects = Array.isArray(newUser.subjects)
          ? newUser.subjects
          : String(newUser.subjects || '').split(',').map(s => s.trim()).filter(Boolean);
        details.classes = newUser.classes;
        details.groups = newUser.groups;
        details.assignments = (newUser.assignments || []).filter((a) => a.module);
      } else if (newUser.role === 'parent') {
        details.profession = newUser.profession;
        details.address = newUser.address;
      }

      // Enforced password rules: parent = phone number, student = date of birth.
      let password = newUser.password;
      if (newUser.role === 'parent') password = newUser.phoneNumber;
      else if (newUser.role === 'student') password = newUser.dateOfBirth;

      await axios.post('/api/admin/users', {
        email: newUser.email,
        password,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        phoneNumber: newUser.phoneNumber,
        details
      });
      alert('Utilisateur créé avec succès !');
      setNewUser({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'student',
        phoneNumber: '',
        dateOfBirth: '',
        classId: '',
        groupId: '',
        parentId: '',
        subjects: [],
        classes: [],
        groups: [],
        assignments: [],
        profession: '',
        address: '',
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating user');
    }
  };

  const handleExcelUpload = async (e) => {
    e.preventDefault();
    if (!excelFile) return;
    const formData = new FormData();
    formData.append('file', excelFile);
    try {
      await axios.post('/api/admin/users/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Importation Excel réussie !');
      setExcelFile(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Excel Import failed');
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const res = await axios.put(`/api/admin/users/${userId}/toggle`);
      alert(res.data.message);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/admin/classes', newClass);
      alert('Classe créée avec succès !');
      setClasses([...classes, res.data]);
      setNewClass({ name: '', description: '', level: 'primary', teacherIds: [], modules: [] });
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating class');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/admin/groups', newGroup);
      alert('Groupe créé avec succès !');
      setGroups([...groups, res.data]);
      setNewGroup({ name: '', classId: '', capacity: 30, teacherIds: [], modules: [] });
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating group');
    }
  };

  // ===== Class edit / delete =====
  const handleUpdateClass = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/admin/classes/${editingClass._id}`, {
        name: editingClass.name,
        description: editingClass.description,
        level: editingClass.level,
      });
      alert('تم تحديث القسم بنجاح!');
      setEditingClass(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur de mise à jour');
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا القسم؟')) return;
    try {
      await axios.delete(`/api/admin/classes/${classId}`);
      alert('تم حذف القسم بنجاح!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur de suppression');
    }
  };

  // ===== Group edit / delete =====
  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/admin/groups/${editingGroup._id}`, {
        name: editingGroup.name,
        classId: editingGroup.classId,
        capacity: editingGroup.capacity,
      });
      alert('تم تحديث الفوج بنجاح!');
      setEditingGroup(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur de mise à jour');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الفوج؟')) return;
    try {
      await axios.delete(`/api/admin/groups/${groupId}`);
      alert('تم حذف الفوج بنجاح!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur de suppression');
    }
  };

  // ===== Modules CRUD =====
  const handleCreateModule = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/modules', newModule);
      alert('تمت إضافة المادة بنجاح!');
      setNewModule({ name: '', description: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur de création du module');
    }
  };

  const handleUpdateModule = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/admin/modules/${editingModule._id}`, {
        name: editingModule.name,
        description: editingModule.description,
      });
      alert('تم تحديث المادة بنجاح!');
      setEditingModule(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur de mise à jour du module');
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المادة؟')) return;
    try {
      await axios.delete(`/api/admin/modules/${moduleId}`);
      alert('تم حذف المادة بنجاح!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur de suppression du module');
    }
  };

  // ===== Administrative document upload =====
  const handleUploadDocument = async (type, file) => {
    if (!file) return;
    setUploadingDoc(type);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      await axios.post('/api/admin/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('تم رفع المستند بنجاح!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل رفع المستند');
    } finally {
      setUploadingDoc('');
    }
  };

  const initializeDefaultVisualData = (type) => {
    let defaultObj = {};
    if (type === 'Timetable') {
      defaultObj = {
        "Lundi": [],
        "Mardi": [],
        "Mercredi": [],
        "Jeudi": [],
        "Vendredi": []
      };
    } else if (type === 'Food') {
      defaultObj = {
        "Lundi": "",
        "Mardi": "",
        "Mercredi": "",
        "Jeudi": "",
        "Vendredi": ""
      };
    } else if (type === 'Transport') {
      defaultObj = {
        "Ligne": "",
        "Chauffeur": "",
        "Arrêts": [""]
      };
    } else if (type === 'Exam') {
      defaultObj = [
        { "Matière": "", "Date": "", "Heure": "", "Salle": "" }
      ];
    }
    setVisualData(defaultObj);
    setNewSchedule(prev => ({ ...prev, type, data: JSON.stringify(defaultObj, null, 2) }));
  };

  const updateVisualDataAndSync = (newData) => {
    setVisualData(newData);
    setNewSchedule(prev => ({ ...prev, data: JSON.stringify(newData, null, 2) }));
  };

  const handleJsonDataChange = (val) => {
    setNewSchedule(prev => ({ ...prev, data: val }));
    try {
      const parsed = JSON.parse(val);
      setVisualData(parsed);
    } catch (e) {
      // Invalid JSON, wait for typing to finish
    }
  };

  const handleTypeChange = (type) => {
    setNewSchedule(prev => ({ ...prev, type, classId: '', groupId: '' }));
    initializeDefaultVisualData(type);
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    try {
      let finalData = {};
      if (editorMode === 'visual') {
        finalData = visualData;
      } else {
        finalData = JSON.parse(newSchedule.data || '{}');
      }
      await axios.post('/api/admin/schedules', {
        type: newSchedule.type,
        title: newSchedule.title,
        classId: newSchedule.classId || null,
        groupId: newSchedule.groupId || null,
        data: finalData,
      });
      alert('Emploi du temps enregistré avec succès !');
      setNewSchedule({ type: 'Timetable', title: '', classId: '', groupId: '', data: '' });
      initializeDefaultVisualData('Timetable');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating schedule (Check JSON format)');
    }
  };

  const loadScheduleTemplate = (type) => {
    let templateObj = {};
    if (type === 'Timetable') {
      templateObj = {
        "Lundi": ["08:00 - Mathématiques", "10:00 - Physique", "14:00 - Sciences"],
        "Mardi": ["08:00 - Philosophie", "10:00 - Anglais", "14:00 - Mathématiques"],
        "Mercredi": ["08:00 - Physique", "10:00 - Arabe"],
        "Jeudi": ["08:00 - Sciences", "10:00 - Histoire-Géo", "14:00 - Français"],
        "Vendredi": []
      };
    } else if (type === 'Food') {
      templateObj = {
        "Lundi": "Lentilles, Escalope de dinde, Salade, Orange",
        "Mardi": "Couscous aux légumes et poulet, Dessert, Lben",
        "Mercredi": "Purée de pommes de terre, Steak haché, Yaourt",
        "Jeudi": "Riz au safran, Poisson sauce citron, Pomme",
        "Vendredi": "Non assuré"
      };
    } else if (type === 'Transport') {
      templateObj = {
        "Ligne": "Ligne 3 - Ouled Fayet Centre",
        "Chauffeur": "Ammi Ahmed (0555-12-34-56)",
        "Arrêts": [
          "07:15 - Cité 1200 Logements (Départ)",
          "07:30 - Cité 800 Logements (Entrée)",
          "07:45 - Ouled Fayet Centre (Poste)",
          "08:00 - École Zitouni (Arrivée)"
        ]
      };
    } else if (type === 'Exam') {
      templateObj = [
        { "Matière": "Mathématiques", "Date": "2026-06-15", "Heure": "08:30 - 11:30", "Salle": "Salle de Conférence A" },
        { "Matière": "Physique", "Date": "2026-06-16", "Heure": "09:00 - 12:00", "Salle": "Salle d'Examen 4" }
      ];
    }
    setVisualData(templateObj);
    setNewSchedule(prev => ({ ...prev, type, data: JSON.stringify(templateObj, null, 2) }));
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet emploi du temps ? Cette action est irréversible.")) {
      return;
    }
    try {
      await axios.delete(`/api/admin/schedules/${scheduleId}`);
      alert("Emploi du temps supprimé !");
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Erreur de suppression");
    }
  };

  // Delete User
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur et son profil ? Cette action est irréversible.")) {
      return;
    }
    try {
      await axios.delete(`/api/admin/users/${userId}`);
      alert("Utilisateur supprimé avec succès !");
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Erreur de suppression");
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (u) => {
    setEditingUser(u);
    
    let details = {};
    if (u.role === 'teacher') {
      const teacherProfile = teachers.find(t => t.user?._id === u._id);
      details = {
        subjects: teacherProfile?.subjects || [],
        classes: teacherProfile?.classes?.map(c => c._id) || [],
        groups: teacherProfile?.groups?.map(g => g._id) || [],
        assignments: teacherProfile?.assignments?.map((a) => ({ module: a.module || '', room: a.room || '' })) || [],
      };
    } else if (u.role === 'student') {
      const studentProfile = students.find(s => s.user?._id === u._id);
      details = {
        registrationNumber: studentProfile?.registrationNumber || '',
        classId: studentProfile?.class?._id || '',
        groupId: studentProfile?.group?._id || '',
        parentId: studentProfile?.parent?.user?._id || '',
        dateOfBirth: studentProfile?.dateOfBirth ? studentProfile.dateOfBirth.split('T')[0] : '',
      };
    } else if (u.role === 'parent') {
      const parentProfile = parents.find(p => p.user === u._id || p.user?._id === u._id);
      details = {
        profession: parentProfile?.profession || '',
        address: parentProfile?.address || '',
      };
    } else if (u.role === 'general_supervisor' || u.role === 'pedagogical_supervisor') {
      details = { officeLocation: u.details?.officeLocation || 'Bureau principal' };
    } else if (u.role === 'receptionist') {
      details = { deskNumber: u.details?.deskNumber || 'Accueil Principal', workShift: u.details?.workShift || '07:30 - 16:30' };
    }

    setEditingDetails({
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phoneNumber: u.phoneNumber || '',
      ...details
    });
    setIsEditModalOpen(true);
  };

  // Submit Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        email: editingDetails.email,
        firstName: editingDetails.firstName,
        lastName: editingDetails.lastName,
        phoneNumber: editingDetails.phoneNumber,
        details: {}
      };

      if (editingUser.role === 'teacher') {
        payload.details = {
          subjects: Array.isArray(editingDetails.subjects)
            ? editingDetails.subjects
            : String(editingDetails.subjects || '').split(',').map(s => s.trim()).filter(Boolean),
          classes: editingDetails.classes || [],
          groups: editingDetails.groups || [],
          assignments: (editingDetails.assignments || []).filter((a) => a.module),
        };
      } else if (editingUser.role === 'student') {
        payload.details = {
          registrationNumber: editingDetails.registrationNumber,
          classId: editingDetails.classId,
          groupId: editingDetails.groupId,
          parentId: editingDetails.parentId,
          dateOfBirth: editingDetails.dateOfBirth,
        };
      } else if (editingUser.role === 'parent') {
        payload.details = {
          profession: editingDetails.profession,
          address: editingDetails.address,
        };
      } else if (editingUser.role === 'general_supervisor' || editingUser.role === 'pedagogical_supervisor') {
        payload.details = { officeLocation: editingDetails.officeLocation };
      } else if (editingUser.role === 'receptionist') {
        payload.details = { deskNumber: editingDetails.deskNumber, workShift: editingDetails.workShift };
      }

      await axios.put(`/api/admin/users/${editingUser._id}`, payload);
      alert("Utilisateur mis à jour !");
      setIsEditModalOpen(false);
      setEditingUser(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Erreur de mise à jour");
    }
  };

  // Create manual payment/invoice
  const handleCreateBilling = async (e) => {
    e.preventDefault();
    if (!billingForm.studentId) {
      alert("Veuillez sélectionner un élève.");
      return;
    }
    try {
      await axios.post('/api/admin/payments', billingForm);
      alert("Facturation créée avec succès !");
      setBillingForm({ studentId: '', amount: 15000, type: 'Tuition', status: 'Pending' });
      setIsBillingModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de la création de la facture");
    }
  };

  const renderScheduleData = (s) => {
    let data = s.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        return <pre className="text-[10px] text-red-400 overflow-x-auto whitespace-pre-wrap">{s.data}</pre>;
      }
    }

    if (!data) return <span className="text-xs text-slate-500 italic">لا يوجد donnée</span>;

    switch (s.type) {
      case 'Timetable':
        return (
          <div className="space-y-2 text-xs">
            {Object.entries(data).map(([day, slots]) => (
              <div key={day} className="flex border-b border-luxury-border/10 py-1.5 last:border-0">
                <span className="w-20 font-bold text-slate-350">{day}</span>
                <div className="flex-1 flex flex-wrap gap-1">
                  {Array.isArray(slots) && slots.length > 0 ? (
                    slots.map((slot, idx) => (
                      <span key={idx} className="bg-brand-950/40 border border-brand-900/30 text-brand-300 px-2 py-0.5 rounded text-[10px]">
                        {slot}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-600 italic text-[10px]">لا يوجد حصص</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        );

      case 'Food':
        return (
          <div className="space-y-2 text-xs">
            {Object.entries(data).map(([day, meal]) => (
              <div key={day} className="flex border-b border-luxury-border/10 py-1.5 last:border-0">
                <span className="w-20 font-bold text-slate-350">{day}</span>
                <span className="flex-1 text-slate-300 text-[11px]">{meal}</span>
              </div>
            ))}
          </div>
        );

      case 'Transport':
        return (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2 p-2 bg-slate-950/40 border border-luxury-border/30 rounded-lg">
              <div>
                <span className="text-[9px] text-slate-500 uppercase block">Ligne</span>
                <span className="text-white font-medium text-[11px]">{data.Ligne || data.line || '—'}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase block">Chauffeur</span>
                <span className="text-white font-medium text-[11px]">{data.Chauffeur || data.driver || '—'}</span>
              </div>
            </div>
            <div className="relative border-l border-brand-500/30 pl-4 space-y-3 ml-2 mt-2">
              {Array.isArray(data.Arrêts || data.stops) && (data.Arrêts || data.stops).map((stop, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-brand-500 border border-slate-950"></div>
                  <span className="text-slate-300 text-[11px]">{stop}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'Exam':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border border-luxury-border/20 rounded-lg overflow-hidden">
              <thead className="bg-slate-950/60 text-slate-450 uppercase text-[9px] tracking-wider">
                <tr>
                  <th className="p-2 font-semibold text-slate-400">Matière</th>
                  <th className="p-2 font-semibold text-slate-400">Date</th>
                  <th className="p-2 font-semibold text-slate-400">Heure</th>
                  <th className="p-2 font-semibold text-slate-400">Salle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-border/10">
                {Array.isArray(data) ? (
                  data.map((exam, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/30">
                      <td className="p-2 text-white font-medium">{exam.Matière || exam.subject || '—'}</td>
                      <td className="p-2 text-slate-300">{exam.Date || exam.date || '—'}</td>
                      <td className="p-2 text-slate-300">{exam.Heure || exam.time || '—'}</td>
                      <td className="p-2 text-slate-300">{exam.Salle || exam.room || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-2 text-center text-slate-500 italic">Format de tableau invalide</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );

      default:
        return <pre className="text-[10px] text-slate-400 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {activeTab === 'finance' && <FinanceModule />}

        {activeTab === 'overview' && (
          <div className="space-y-8 text-right">
            {/* Metric Cards Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, staggerChildren: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6"
            >
              <motion.div 
                whileHover={{ y: -5, boxShadow: "0 8px 30px rgba(0,0,0,0.03)" }}
                className="glass-panel p-6 rounded-2xl border border-luxury-border flex items-center justify-between bg-white/70"
              >
                <div>
                  <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wide block">إجمالي التلاميذ</span>
                  <span className="text-3xl font-extrabold text-slate-100 mt-1 block font-mono">{stats?.students || 0}</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200/30 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-brand-600" />
                </div>
              </motion.div>
              <motion.div 
                whileHover={{ y: -5, boxShadow: "0 8px 30px rgba(0,0,0,0.03)" }}
                className="glass-panel p-6 rounded-2xl border border-luxury-border flex items-center justify-between bg-white/70"
              >
                <div>
                  <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wide block">إجمالي الأساتذة</span>
                  <span className="text-3xl font-extrabold text-slate-100 mt-1 block font-mono">{stats?.teachers || 0}</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200/30 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-brand-600" />
                </div>
              </motion.div>
              <motion.div 
                whileHover={{ y: -5, boxShadow: "0 8px 30px rgba(0,0,0,0.03)" }}
                className="glass-panel p-6 rounded-2xl border border-luxury-border flex items-center justify-between bg-white/70"
              >
                <div>
                  <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wide block">الأقسام الدراسية</span>
                  <span className="text-3xl font-extrabold text-slate-100 mt-1 block font-mono">{stats?.classes || 0}</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200/30 flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-brand-600" />
                </div>
              </motion.div>
              <motion.div 
                whileHover={{ y: -5, boxShadow: "0 8px 30px rgba(0,0,0,0.03)" }}
                className="glass-panel p-6 rounded-2xl border border-luxury-border flex items-center justify-between bg-white/70"
              >
                <div>
                  <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wide block">مجموع المداخيل</span>
                  <span className="text-3xl font-extrabold text-emerald-600 mt-1 block font-mono">
                    {stats?.totalRevenue ? `${stats.totalRevenue.toLocaleString()} دج` : '0 دج'}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200/30 flex items-center justify-center shrink-0">
                  <CreditCard className="w-6 h-6 text-emerald-600" />
                </div>
              </motion.div>
            </motion.div>

            {/* Recent Payments table */}
            <div className="glass-panel p-6 rounded-2xl border border-luxury-border space-y-4 bg-white/70">
              <div className="flex justify-between items-center pb-2 border-b border-luxury-border/30 mb-2">
                <h3 className="text-base font-extrabold text-slate-100">آخر المعاملات المالية المنجزة</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleExport('payments', 'payments.xlsx')}
                    disabled={exporting === 'payments'}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{exporting === 'payments' ? 'جاري التصدير...' : 'تصدير Excel'}</span>
                  </button>
                  <button
                    onClick={() => setIsBillingModalOpen(true)}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-[0_2px_10px_rgba(197,106,61,0.15)]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إنشاء فاتورة جديدة</span>
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs md:text-sm text-slate-350">
                  <thead className="bg-slate-900/40 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                    <tr>
                      <th className="p-4 rounded-r-xl">رقم العملية</th>
                      <th className="p-4">التلميذ المستفيد</th>
                      <th className="p-4">المبلغ المستحق</th>
                      <th className="p-4">الخدمة المسددة</th>
                      <th className="p-4 rounded-l-xl">حالة الدفع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-luxury-border/20">
                    {stats?.recentPayments?.map((pay) => (
                      <tr key={pay._id} className="hover:bg-slate-900/5 transition-colors">
                        <td className="p-4 text-xs font-mono text-slate-400">{pay._id}</td>
                        <td className="p-4 font-semibold">{pay.student?.user?.firstName} {pay.student?.user?.lastName}</td>
                        <td className="p-4 font-mono font-semibold">{pay.amount} دج</td>
                        <td className="p-4 font-semibold">
                          {pay.type === 'Tuition' ? 'رسوم التمدرس' : pay.type === 'Transport' ? 'النقل المدرسي' : pay.type === 'Lunch' ? 'الإطعام المدرسي' : pay.type}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            pay.status === 'Paid' 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-250/20' 
                              : 'bg-amber-50 text-amber-600 border border-amber-250/20'
                          }`}>
                            {pay.status === 'Paid' ? 'مسددة' : 'قيد الانتظار'}
                          </span>
                        </td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-slate-550 italic">لا توجد معاملات مالية مسجلة.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-right"
          >
            {/* Create User manual Form */}
            <div className="glass-panel p-6 md:p-8 rounded-2xl border border-luxury-border space-y-6">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-luxury-border/30 pb-3">
                <Plus className="w-5 h-5 text-brand-500" />
                <span>إنشاء حساب جديد</span>
              </h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-450 font-bold block">الاسم الأول</label>
                    <input
                      type="text"
                      required
                      placeholder="الاسم الأول"
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                      className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-450 font-bold block">اللقب</label>
                    <input
                      type="text"
                      required
                      placeholder="اللقب"
                      value={newUser.lastName}
                      onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                      className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs text-slate-455 font-bold block">البريد الإلكتروني</label>
                  <input
                    type="email"
                    required
                    placeholder="البريد الإلكتروني"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-brand-500 focus:outline-none text-right"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs text-slate-455 font-bold block">كلمة المرور</label>
                  {newUser.role === 'teacher' || newUser.role === 'admin' || newUser.role === 'school' ? (
                    <input
                      type="password"
                      placeholder="كلمة المرور (أو تُحدد تلقائياً)"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-brand-500 focus:outline-none text-right"
                    />
                  ) : newUser.role === 'parent' || newUser.role === 'general_supervisor' || newUser.role === 'pedagogical_supervisor' || newUser.role === 'receptionist' ? (
                    <div className="w-full bg-slate-950/60 border border-brand-500/20 rounded-xl px-4 py-2.5 text-xs text-brand-300 text-right">
                      كلمة المرور تُحدَّد تلقائياً = رقم الهاتف (أو أدخلها في خانة الهاتف)
                      <span className="block text-slate-500 font-mono mt-1">{newUser.phoneNumber || '— أدخل رقم الهاتف —'}</span>
                    </div>
                  ) : (
                    <div className="w-full bg-slate-950/60 border border-brand-500/20 rounded-xl px-4 py-2.5 text-xs text-brand-300 text-right">
                      كلمة المرور تُحدَّد تلقائياً = تاريخ ميلاد التلميذ
                      <span className="block text-slate-500 font-mono mt-1">{newUser.dateOfBirth || '— أدخل تاريخ الميلاد —'}</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-455 font-bold block">نوع الحساب</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none text-slate-100 font-semibold"
                    >
                      <option value="student">تلميذ</option>
                      <option value="teacher">أستاذ</option>
                      <option value="parent">ولي أمر</option>
                      <option value="general_supervisor">مشرف عام</option>
                      <option value="pedagogical_supervisor">مشرف تربوي</option>
                      <option value="receptionist">موظف الاستقبال</option>
                      <option value="school">إدارة المدرسة (School)</option>
                      <option value="admin">مدير النظام (Admin)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-455 font-bold block">الهاتف</label>
                    <input
                      type="text"
                      placeholder="رقم الهاتف"
                      value={newUser.phoneNumber}
                      onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                      className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-brand-500 focus:outline-none text-right font-mono"
                    />
                  </div>
                </div>

                {/* Conditional fields based on Student registration */}
                {newUser.role === 'student' && (
                  <div className="space-y-3 p-4 bg-slate-950/40 border border-luxury-border rounded-xl">
                    <span className="text-xs font-semibold text-slate-450 block">الربط المدرسي والتفاصيل</span>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase text-slate-450 font-semibold">تاريخ الميلاد (كلمة المرور)</label>
                      <input
                        type="date"
                        required
                        value={newUser.dateOfBirth}
                        onChange={(e) => setNewUser({ ...newUser, dateOfBirth: e.target.value })}
                        className="bg-slate-900 border border-luxury-border rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase text-slate-450 font-semibold">القسم</label>
                        <select
                          value={newUser.classId}
                          required
                          onChange={(e) => setNewUser({ ...newUser, classId: e.target.value, groupId: '' })}
                          className="bg-slate-900 border border-luxury-border rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
                        >
                          <option value="">اختر القسم</option>
                          {classes.map((c) => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase text-slate-455 font-semibold">الفوج</label>
                        <select
                          value={newUser.groupId}
                          required
                          onChange={(e) => setNewUser({ ...newUser, groupId: e.target.value })}
                          className="bg-slate-900 border border-luxury-border rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
                        >
                          <option value="">اختر الفوج</option>
                          {groups.filter(g => g.class === newUser.classId || g.class?._id === newUser.classId).map((g) => (
                            <option key={g._id} value={g._id}>{g.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase text-slate-455 font-semibold">ولي الأمر الكفيل</label>
                        <select
                          value={newUser.parentId}
                          required
                          onChange={(e) => setNewUser({ ...newUser, parentId: e.target.value })}
                          className="bg-slate-900 border border-luxury-border rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
                        >
                          <option value="">اختر ولي الأمر</option>
                          {parents.map((p) => (
                            <option key={p._id} value={p._id}>{p.firstName} {p.lastName} ({p.email})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conditional fields based on Teacher registration */}
                {newUser.role === 'teacher' && (
                  <div className="space-y-4 p-4 bg-slate-950/40 border border-luxury-border rounded-xl">
                    <span className="text-xs font-semibold text-slate-450 block">تفاصيل الأستاذ والمهام</span>
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase text-slate-455 font-semibold">المواد المدرَّسة (اختر من القائمة)</label>
                        <div className="bg-slate-900 border border-luxury-border rounded-xl p-3 max-h-36 overflow-y-auto grid grid-cols-2 gap-1.5 text-right">
                          {modules.length === 0 ? (
                            <span className="text-[10px] text-slate-500 italic col-span-2">لا توجد مواد. أضِف المواد من قسم الأقسام.</span>
                          ) : (
                            modules.map((m) => (
                              <label key={m._id} className="flex items-center gap-2 cursor-pointer text-xs text-slate-350 hover:text-white">
                                <input
                                  type="checkbox"
                                  checked={newUser.subjects.includes(m.name)}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setNewUser({
                                      ...newUser,
                                      subjects: checked
                                        ? [...newUser.subjects, m.name]
                                        : newUser.subjects.filter((s) => s !== m.name),
                                    });
                                  }}
                                  className="rounded border-luxury-border bg-slate-950 text-brand-600 focus:ring-0"
                                />
                                <span className="truncate">{m.name}</span>
                              </label>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-slate-455 font-semibold block">الأقسام المرتبطة</label>
                          <div className="bg-slate-900 border border-luxury-border rounded-xl p-3 max-h-36 overflow-y-auto space-y-2 text-right">
                            {classes.map(c => (
                              <label key={c._id} className="flex items-center gap-2 cursor-pointer text-xs text-slate-350 hover:text-white">
                                <input
                                  type="checkbox"
                                  checked={newUser.classes.includes(c._id)}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    let updatedClasses = [];
                                    if (checked) {
                                      updatedClasses = [...newUser.classes, c._id];
                                    } else {
                                      updatedClasses = newUser.classes.filter(cid => cid !== c._id);
                                    }
                                    const updatedGroups = newUser.groups.filter(gid => {
                                      const groupObj = groups.find(g => g._id === gid);
                                      const groupClassId = groupObj?.class?._id || groupObj?.class;
                                      return updatedClasses.includes(groupClassId);
                                    });
                                    setNewUser({ ...newUser, classes: updatedClasses, groups: updatedGroups });
                                  }}
                                  className="rounded border-luxury-border bg-slate-950 text-brand-600 focus:ring-0"
                                />
                                <span>{c.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-slate-455 font-semibold block">الأفواج المرتبطة</label>
                          <div className="bg-slate-900 border border-luxury-border rounded-xl p-3 max-h-36 overflow-y-auto space-y-2 text-right">
                            {groups
                              .filter(g => newUser.classes.includes(g.class?._id || g.class))
                              .map(g => (
                                <label key={g._id} className="flex items-center gap-2 cursor-pointer text-xs text-slate-350 hover:text-white">
                                  <input
                                    type="checkbox"
                                    checked={newUser.groups.includes(g._id)}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      if (checked) {
                                        setNewUser({ ...newUser, groups: [...newUser.groups, g._id] });
                                      } else {
                                        setNewUser({ ...newUser, groups: newUser.groups.filter(gid => gid !== g._id) });
                                      }
                                    }}
                                    className="rounded border-luxury-border bg-slate-950 text-brand-600 focus:ring-0"
                                  />
                                  <span>{g.name} ({g.class?.name || classes.find(c => c._id === g.class)?.name})</span>
                                </label>
                              ))}
                            {groups.filter(g => newUser.classes.includes(g.class?._id || g.class)).length === 0 && (
                              <span className="text-[10px] text-slate-500 italic">اختر قسماً أولاً.</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Room / module assignments (اختيار المادة والقاعة) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] uppercase text-slate-455 font-semibold">إسناد المادة والقاعة (Salle)</label>
                          <button
                            type="button"
                            onClick={() => setNewUser({ ...newUser, assignments: [...newUser.assignments, { module: '', room: '' }] })}
                            className="text-[10px] font-bold text-brand-300 bg-brand-500/10 border border-brand-500/25 hover:bg-brand-500/20 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            + إضافة
                          </button>
                        </div>
                        {newUser.assignments.length === 0 ? (
                          <p className="text-[10px] text-slate-500 italic">لم يُسند أي مادة/قاعة بعد.</p>
                        ) : (
                          <div className="space-y-2">
                            {newUser.assignments.map((a, idx) => (
                              <div key={idx} className="flex gap-2 items-center">
                                <select
                                  value={a.module}
                                  onChange={(e) => {
                                    const next = [...newUser.assignments];
                                    next[idx] = { ...next[idx], module: e.target.value };
                                    setNewUser({ ...newUser, assignments: next });
                                  }}
                                  className="flex-1 bg-slate-900 border border-luxury-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                                >
                                  <option value="">المادة</option>
                                  {modules.map((m) => (
                                    <option key={m._id} value={m.name}>{m.name}</option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  placeholder="القاعة (Salle)"
                                  value={a.room}
                                  onChange={(e) => {
                                    const next = [...newUser.assignments];
                                    next[idx] = { ...next[idx], room: e.target.value };
                                    setNewUser({ ...newUser, assignments: next });
                                  }}
                                  className="w-28 bg-slate-900 border border-luxury-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => setNewUser({ ...newUser, assignments: newUser.assignments.filter((_, i) => i !== idx) })}
                                  className="p-1.5 bg-red-950/20 hover:bg-red-950/50 text-red-400 rounded-lg"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Conditional fields based on Parent registration */}
                {newUser.role === 'parent' && (
                  <div className="space-y-3 p-4 bg-slate-950/40 border border-luxury-border rounded-xl">
                    <span className="text-xs font-semibold text-slate-450 block">تفاصيل ولي الأمر</span>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase text-slate-455 font-semibold">المهنة</label>
                        <input
                          type="text"
                          placeholder="مثال: طبيب، مهندس"
                          value={newUser.profession}
                          onChange={(e) => setNewUser({ ...newUser, profession: e.target.value })}
                          className="bg-slate-900 border border-luxury-border rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase text-slate-455 font-semibold">العنوان</label>
                        <input
                          type="text"
                          placeholder="مثال: الجزائر العاصمة"
                          value={newUser.address}
                          onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                          className="bg-slate-900 border border-luxury-border rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Conditional fields based on Supervisor registration */}
                {(newUser.role === 'general_supervisor' || newUser.role === 'pedagogical_supervisor') && (
                  <div className="space-y-3 p-4 bg-slate-950/40 border border-luxury-border rounded-xl">
                    <span className="text-xs font-semibold text-slate-450 block">تفاصيل المشرف والمكتب</span>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase text-slate-455 font-semibold">مكتب العمل / الموقع</label>
                        <input
                          type="text"
                          placeholder="مثال: Bureau principal - الطابق الأول"
                          value={newUser.officeLocation || ''}
                          onChange={(e) => setNewUser({ ...newUser, officeLocation: e.target.value })}
                          className="bg-slate-900 border border-luxury-border rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Conditional fields based on Receptionist registration */}
                {newUser.role === 'receptionist' && (
                  <div className="space-y-3 p-4 bg-slate-950/40 border border-luxury-border rounded-xl">
                    <span className="text-xs font-semibold text-slate-450 block">تفاصيل الاستقبال وساعات العمل</span>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase text-slate-455 font-semibold">رقم مكتب الاستقبال</label>
                        <input
                          type="text"
                          placeholder="مثال: Accueil Principal"
                          value={newUser.deskNumber || ''}
                          onChange={(e) => setNewUser({ ...newUser, deskNumber: e.target.value })}
                          className="bg-slate-900 border border-luxury-border rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase text-slate-455 font-semibold">ساعات الدوام (الوردية)</label>
                        <input
                          type="text"
                          placeholder="مثال: 07:30 - 16:30"
                          value={newUser.workShift || ''}
                          onChange={(e) => setNewUser({ ...newUser, workShift: e.target.value })}
                          className="bg-slate-900 border border-luxury-border rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button type="submit" className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-md shadow-brand-500/10 transition-all">
                  إنشاء الحساب الجديد
                </button>
              </form>
            </div>

            {/* Excel uploader and User Toggle Grid */}
            <div className="space-y-6">
              <div className="glass-panel p-6 md:p-8 rounded-2xl border border-luxury-border space-y-4">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-luxury-border/30 pb-3">
                  <Upload className="w-5 h-5 text-brand-500" />
                  <span>استيراد جماعي عبر Excel</span>
                </h3>
                <form onSubmit={handleExcelUpload} className="space-y-4">
                  <div className="border border-dashed border-luxury-border rounded-xl p-6 text-center relative cursor-pointer hover:bg-slate-900/20 transition-all">
                    <input
                      type="file"
                      required
                      accept=".xlsx, .xls"
                      onChange={(e) => setExcelFile(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <span className="text-xs text-slate-450 block">{excelFile ? excelFile.name : 'انقر أو اسحب ملف Excel هنا لتحديده'}</span>
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-sm transition-all">
                    تحميل القائمة بالكامل
                  </button>
                </form>
              </div>

              {/* Activation / Deactivation List */}
              <div className="glass-panel p-6 md:p-8 rounded-2xl border border-luxury-border space-y-4">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-luxury-border/30 pb-3">
                  <ShieldAlert className="w-5 h-5 text-brand-500" />
                  <span>تنشيط وتعديل حسابات النظام</span>
                </h3>
                
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                  {systemUsers.length === 0 ? (
                    <div className="text-xs text-slate-500 italic text-center py-4">لا يوجد مستخدمون حالياً.</div>
                  ) : (
                    systemUsers.map((u) => (
                      <div key={u._id} className="p-3 bg-slate-900/40 border border-luxury-border rounded-xl flex justify-between items-center text-sm gap-2 hover:border-brand-500/10 transition-all">
                        <div>
                          <span className="font-semibold block text-slate-100">{u.firstName} {u.lastName}</span>
                          <span className="text-xs text-slate-450">{u.role === 'student' ? 'تلميذ' : u.role === 'teacher' ? 'أستاذ' : u.role === 'parent' ? 'ولي أمر' : u.role} &bull; {u.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(u._id)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                              u.isActive
                                ? 'bg-red-950/40 border border-red-900/50 text-red-400 hover:bg-red-900/40'
                                : 'bg-emerald-950/40 border border-emerald-900/50 text-emerald-450 hover:bg-emerald-900/40'
                            }`}
                          >
                            {u.isActive ? 'تعطيل الحساب' : 'تنشيط الحساب'}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                            title="تعديل"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="p-2 bg-red-950/20 hover:bg-red-950/50 text-red-400 rounded-lg transition-all"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </motion.div>
        )}


        {activeTab === 'accounts' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 text-right"
          >
            <div className="glass-panel p-6 rounded-2xl border border-luxury-border space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-luxury-border/30 pb-4">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-brand-500" />
                  <span>تنشيط وتعديل حسابات النظام</span>
                </h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="بحث بالاسم أو البريد..."
                      value={accountSearch}
                      onChange={(e) => setAccountSearch(e.target.value)}
                      className="bg-slate-900 border border-luxury-border rounded-xl pr-9 pl-4 py-2 text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                  <select
                    value={accountRoleFilter}
                    onChange={(e) => setAccountRoleFilter(e.target.value)}
                    className="bg-slate-900 border border-luxury-border rounded-xl px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                  >
                    <option value="all">كل الأدوار</option>
                    <option value="teacher">الأساتذة</option>
                    <option value="student">التلاميذ</option>
                    <option value="parent">الأولياء</option>
                  </select>
                </div>
              </div>

              {(() => {
                const q = accountSearch.trim().toLowerCase();
                const filtered = systemUsers.filter((u) => {
                  if (['admin', 'school'].includes(u.role)) return false;
                  if (accountRoleFilter !== 'all' && u.role !== accountRoleFilter) return false;
                  if (!q) return true;
                  const name = `${u.firstName || ''} ${u.lastName || ''} ${u.email || ''}`.toLowerCase();
                  return name.includes(q);
                });

                if (filtered.length === 0) {
                  return <div className="text-sm text-slate-500 italic text-center py-8">لا يوجد مستخدمون مطابقون.</div>;
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filtered.map((u) => (
                      <div key={u._id} className="p-4 bg-slate-900/40 border border-luxury-border rounded-xl flex justify-between items-center gap-3 hover:border-brand-500/20 transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-brand-900/50 flex items-center justify-center font-bold text-brand-300 text-xs shrink-0">
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold block text-slate-100 truncate">{u.firstName} {u.lastName}</span>
                            <span className="text-[11px] text-slate-450 truncate block">
                              {u.role === 'student' ? 'تلميذ' : u.role === 'teacher' ? 'أستاذ' : u.role === 'parent' ? 'ولي أمر' : u.role} • {u.email}
                            </span>
                            <span className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${u.isActive ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' : 'bg-red-950/40 text-red-400 border border-red-900/50'}`}>
                              {u.isActive ? 'نشط' : 'معطّل'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleToggleStatus(u._id)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                              u.isActive
                                ? 'bg-red-950/40 border border-red-900/50 text-red-400 hover:bg-red-900/40'
                                : 'bg-emerald-950/40 border border-emerald-900/50 text-emerald-450 hover:bg-emerald-900/40'
                            }`}
                          >
                            {u.isActive ? 'تعطيل' : 'تنشيط'}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                            title="تعديل"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="p-2 bg-red-950/20 hover:bg-red-950/50 text-red-400 rounded-lg transition-all"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}


        {activeTab === 'students' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 text-right"
          >
            {/* Header section with Import Excel button */}
            <div className="glass-panel p-6 md:p-8 rounded-2xl border border-luxury-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-brand-400" />
                <span>دليل التلاميذ والطلاب</span>
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleExport('students', 'students.xlsx')}
                  disabled={exporting === 'students'}
                  className="px-5 py-2.5 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 hover:border-emerald-600 text-emerald-400 font-semibold rounded-xl text-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{exporting === 'students' ? 'جاري التصدير...' : 'تصدير Excel'}</span>
                </button>
                <button
                  onClick={() => setShowExcelUpload(!showExcelUpload)}
                  className="px-5 py-2.5 bg-brand-950 hover:bg-brand-900 border border-brand-850 hover:border-brand-700 text-brand-400 font-semibold rounded-xl text-sm transition-all flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{showExcelUpload ? "إخفاء استيراد Excel" : "استيراد جماعي عبر Excel"}</span>
                </button>
              </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="glass-panel p-6 rounded-2xl border border-luxury-border flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="w-full md:flex-1 relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                <input
                  type="text"
                  placeholder="البحث عن تلميذ بالاسم، رقم التسجيل، البريد الإلكتروني أو ولي الأمر..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-luxury-border rounded-xl pl-11 pr-4 py-3 text-sm focus:border-brand-500 focus:outline-none placeholder-slate-500 text-white"
                />
              </div>

              <div className="w-full md:w-64">
                <select
                  value={studentClassFilter}
                  onChange={(e) => setStudentClassFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500 font-semibold"
                >
                  <option value="">جميع الأقسام الدراسية</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Collapsible Excel Upload Card */}
            {showExcelUpload && (
              <div className="glass-panel p-6 md:p-8 rounded-2xl border border-luxury-border max-w-xl">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                  <Upload className="w-5 h-5 text-brand-400" />
                  <span>استيراد جماعي عبر ملف Excel</span>
                </h3>
                <form onSubmit={handleExcelUpload} className="space-y-4">
                  <div className="border border-dashed border-luxury-border rounded-xl p-6 text-center relative cursor-pointer hover:bg-slate-900/20 transition-all">
                    <input
                      type="file"
                      required
                      accept=".xlsx, .xls"
                      onChange={(e) => setExcelFile(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <FileText className="w-8 h-8 text-slate-550 mx-auto mb-2" />
                    <span className="text-xs text-slate-450 block">{excelFile ? excelFile.name : 'انقر أو اسحب ملف Excel هنا لتحديده'}</span>
                  </div>
                  <button type="submit" className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-xl text-sm transition-all">
                    تحميل القائمة بالكامل
                  </button>
                </form>
              </div>
            )}

            <div className="glass-panel p-6 md:p-8 rounded-2xl border border-luxury-border space-y-6">

            {students.length === 0 ? (
              <div className="text-slate-500 text-sm text-center py-6">لا يوجد تلاميذ مسجلين حالياً.</div>
            ) : students.filter((student) => {
              const firstName = student.user?.firstName || '';
              const lastName = student.user?.lastName || '';
              const name = `${firstName} ${lastName}`.toLowerCase();
              const email = (student.user?.email || '').toLowerCase();
              const regNum = (student.registrationNumber || '').toLowerCase();
              const parentName = student.parent && student.parent.user
                ? `${student.parent.user.firstName} ${student.parent.user.lastName}`.toLowerCase()
                : '';
              const parentEmail = student.parent && student.parent.user
                ? (student.parent.user.email || '').toLowerCase()
                : '';
              const search = studentSearch.toLowerCase();
              
              const matchesSearch =
                name.includes(search) ||
                email.includes(search) ||
                regNum.includes(search) ||
                parentName.includes(search) ||
                parentEmail.includes(search);

              const matchesClass =
                !studentClassFilter ||
                student.class?._id === studentClassFilter ||
                student.class === studentClassFilter;

              return matchesSearch && matchesClass;
            }).length === 0 ? (
              <div className="text-slate-500 text-sm italic text-center py-10 bg-slate-950/20 rounded-xl border border-luxury-border/30">
                لا يوجد تلاميذ يطابقون معايير البحث المحددة.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students
                  .filter((student) => {
                    const firstName = student.user?.firstName || '';
                    const lastName = student.user?.lastName || '';
                    const name = `${firstName} ${lastName}`.toLowerCase();
                    const email = (student.user?.email || '').toLowerCase();
                    const regNum = (student.registrationNumber || '').toLowerCase();
                    const parentName = student.parent && student.parent.user
                      ? `${student.parent.user.firstName} ${student.parent.user.lastName}`.toLowerCase()
                      : '';
                    const parentEmail = student.parent && student.parent.user
                      ? (student.parent.user.email || '').toLowerCase()
                      : '';
                    const search = studentSearch.toLowerCase();
                    
                    const matchesSearch =
                      name.includes(search) ||
                      email.includes(search) ||
                      regNum.includes(search) ||
                      parentName.includes(search) ||
                      parentEmail.includes(search);

                    const matchesClass =
                      !studentClassFilter ||
                      student.class?._id === studentClassFilter ||
                      student.class === studentClassFilter;

                    return matchesSearch && matchesClass;
                  })
                  .map((student) => {
                    const studentTeachers = teachers.filter((t) => 
                      t.classes?.some((c) => c._id === student.class?._id || c === student.class?._id) && 
                      t.groups?.some((g) => g._id === student.group?._id || g === student.group?._id)
                    );
                    return (
                      <div key={student._id} className="p-5 bg-slate-900/30 border border-luxury-border rounded-2xl flex flex-col justify-between space-y-4 hover:border-brand-500/20 transition-all shadow-sm">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand-900/40 flex items-center justify-center font-bold text-brand-450 uppercase border border-brand-850/40 shrink-0">
                              {student.user?.firstName?.[0]}{student.user?.lastName?.[0]}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-white text-sm truncate" title={`${student.user?.firstName} ${student.user?.lastName}`}>
                                {student.user?.firstName} {student.user?.lastName}
                              </h4>
                              <span className="text-[10px] text-slate-500 font-mono block">
                                رقم التسجيل: {student.registrationNumber || student._id}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2 text-xs text-slate-450 border-t border-luxury-border/30 pt-3">
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-slate-500 text-[10px] uppercase font-semibold">القسم والفوج:</span>
                              <span className="text-white font-medium truncate max-w-[150px]">
                                {student.class?.name || '—'} &bull; {student.group?.name || '—'}
                              </span>
                            </div>

                            <div className="flex justify-between items-center gap-2">
                              <span className="text-slate-500 text-[10px] uppercase font-semibold">بريد التلميذ:</span>
                              <span className="text-slate-300 font-mono text-[10px] truncate max-w-[160px] select-all" title={student.user?.email}>
                                {student.user?.email}
                              </span>
                            </div>

                            {student.user?.phoneNumber && (
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-slate-500 text-[10px] uppercase font-semibold">هاتف التلميذ:</span>
                                <span className="text-slate-300 font-mono text-[10px] select-all">
                                  {student.user.phoneNumber}
                                </span>
                              </div>
                            )}

                            {student.parent && (
                              <div className="bg-slate-950/35 border border-luxury-border/30 rounded-xl p-2.5 space-y-1.5 mt-2">
                                <span className="text-slate-550 text-[9px] uppercase font-bold block">ولي الأمر الكفيل</span>
                                <div className="flex justify-between items-center text-[10px] gap-2">
                                  <span className="text-slate-400">الاسم:</span>
                                  <span className="text-white font-medium">
                                    {student.parent.user?.firstName} {student.parent.user?.lastName}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] gap-2">
                                  <span className="text-slate-400">البريد الإلكتروني:</span>
                                  <span className="text-slate-350 truncate max-w-[120px] select-all" title={student.parent.user?.email}>
                                    {student.parent.user?.email}
                                  </span>
                                </div>
                                {student.parent.user?.phoneNumber && (
                                  <div className="flex justify-between items-center text-[10px] gap-2">
                                    <span className="text-slate-400">الهاتف:</span>
                                    <span className="text-white font-mono select-all">
                                      {student.parent.user.phoneNumber}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="pt-1">
                              <span className="text-slate-550 text-[9px] uppercase font-bold block mb-1">الأساتذة المرتبطون:</span>
                              <div className="flex flex-wrap gap-1">
                                {studentTeachers.length > 0 ? (
                                  studentTeachers.map((t) => (
                                    <span key={t._id} className="bg-indigo-950/40 border border-indigo-900/30 text-indigo-300 px-1.5 py-0.25 rounded text-[9px]">
                                      {t.user?.firstName} {t.user?.lastName}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-650 italic text-[9px]">لا يوجد أساتذة مرتبطون</span>
                                )}
                              </div>
                            </div>

                            {student.dateOfBirth && (
                              <div className="flex justify-between items-center pt-1 text-[10px] gap-2">
                                <span className="text-slate-550 uppercase font-semibold">تاريخ الميلاد:</span>
                                <span className="text-slate-400">{new Date(student.dateOfBirth).toLocaleDateString('fr-FR')}</span>
                              </div>
                            )}

                            <div className="flex justify-between items-center text-[10px] gap-2">
                              <span className="text-slate-555 uppercase font-semibold font-sans">حالة الحساب:</span>
                              <span className={student.user?.isActive ? 'text-emerald-450 font-bold' : 'text-red-400 font-bold'}>
                                {student.user?.isActive ? 'نشط' : 'غير نشط'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2.5 border-t border-luxury-border/20">
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setIsStudentDetailsOpen(true);
                            }}
                            className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-750 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            عرض التفاصيل
                          </button>
                          <button
                            onClick={() => handleOpenEdit(student.user)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            تعديل
                          </button>
                          <button
                            onClick={() => handleDeleteUser(student.user?._id)}
                            className="px-3 py-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            حذف
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </motion.div>
      )}

        {activeTab === 'teachers' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 md:p-8 rounded-2xl border border-luxury-border space-y-6 text-right"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-brand-400" />
                <span>دليل الأساتذة والمعلمين</span>
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleExport('teachers', 'teachers.xlsx')}
                  disabled={exporting === 'teachers'}
                  className="px-5 py-2.5 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 hover:border-emerald-600 text-emerald-400 font-semibold rounded-xl text-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{exporting === 'teachers' ? 'جاري التصدير...' : 'تصدير Excel'}</span>
                </button>
                <button
                  onClick={() => handleExport('parents', 'parents.xlsx')}
                  disabled={exporting === 'parents'}
                  className="px-5 py-2.5 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 hover:border-emerald-600 text-emerald-400 font-semibold rounded-xl text-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{exporting === 'parents' ? 'جاري التصدير...' : 'تصدير أولياء الأمور'}</span>
                </button>
              </div>
            </div>

            {teachers.length === 0 ? (
              <div className="text-slate-500 text-sm">لا يوجد أساتذة مسجلون حالياً.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teachers.map((teacher) => (
                  <div key={teacher._id} className="p-5 bg-slate-900/30 border border-luxury-border rounded-2xl flex flex-col justify-between space-y-4 hover:border-brand-500/20 transition-all">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-900/40 flex items-center justify-center font-bold text-brand-450 uppercase">
                          {teacher.user?.firstName?.[0]}{teacher.user?.lastName?.[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">
                            {teacher.user?.firstName} {teacher.user?.lastName}
                          </h4>
                          <span className="text-[10px] text-slate-550 truncate block max-w-[150px]">
                            {teacher.user?.email}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-400 border-t border-luxury-border/30 pt-2.5">
                        <p>المواد: <span className="text-white font-medium">{teacher.subjects?.join(', ') || 'غير محدد'}</span></p>
                        <p>الأقسام: <span className="text-white font-medium">{teacher.classes?.map(c => c.name).join(', ') || 'لا يوجد'}</span></p>
                        <p>الأفواج: <span className="text-white font-medium">{teacher.groups?.map(g => g.name).join(', ') || 'لا يوجد'}</span></p>
                        <p>الهاتف: <span className="text-white font-medium">{teacher.user?.phoneNumber || '—'}</span></p>
                        <p>حالة الحساب: <span className={teacher.user?.isActive ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>{teacher.user?.isActive ? 'نشط' : 'غير نشط'}</span></p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-luxury-border/20">
                      <button
                        onClick={() => handleOpenEdit(teacher.user)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDeleteUser(teacher.user?._id)}
                        className="px-3 py-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'create' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-right"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Create Class Form */}
              <div className="glass-panel p-6 md:p-8 rounded-2xl border border-luxury-border space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-brand-400" />
                  <span>إنشاء قسم دراسي جديد</span>
                </h3>
                <form onSubmit={handleCreateClass} className="space-y-4">
                  <input
                    type="text"
                    required
                    placeholder="اسم القسم (مثال: السنة الثالثة ابتدائي)"
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                    className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="الوصف (اختياري)"
                    value={newClass.description}
                    onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                    className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                  />
                  <select
                    value={newClass.level}
                    onChange={(e) => setNewClass({ ...newClass, level: e.target.value })}
                    className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none text-white font-semibold"
                  >
                    <option value="primary">ابتدائي</option>
                    <option value="middle">متوسط</option>
                    <option value="secondary">ثانوي</option>
                  </select>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-400 font-semibold block">المواد المقررة لهذا القسم</label>
                    <div className="bg-slate-900 border border-luxury-border rounded-xl p-3 max-h-36 overflow-y-auto grid grid-cols-2 gap-1.5 text-right">
                      {modules.length === 0 ? (
                        <span className="text-[10px] text-slate-500 italic col-span-2">لا توجد مواد مسجلة.</span>
                      ) : (
                        modules.map((m) => (
                          <label key={m._id} className="flex items-center gap-2 cursor-pointer text-xs text-slate-350 hover:text-white">
                            <input
                              type="checkbox"
                              checked={newClass.modules.includes(m.name)}
                              onChange={(e) => setNewClass({
                                ...newClass,
                                modules: e.target.checked
                                  ? [...newClass.modules, m.name]
                                  : newClass.modules.filter((s) => s !== m.name),
                              })}
                              className="rounded border-luxury-border bg-slate-950 text-brand-600 focus:ring-0"
                            />
                            <span className="truncate">{m.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-400 font-semibold block">تعيين الأساتذة (اختياري)</label>
                    <div className="bg-slate-900 border border-luxury-border rounded-xl p-3 max-h-36 overflow-y-auto space-y-2">
                      {teachers.map(t => (
                        <label key={t._id} className="flex items-center gap-2 cursor-pointer text-xs text-slate-350 hover:text-white">
                          <input
                            type="checkbox"
                            checked={newClass.teacherIds.includes(t._id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              if (checked) {
                                setNewClass({ ...newClass, teacherIds: [...newClass.teacherIds, t._id] });
                              } else {
                                setNewClass({ ...newClass, teacherIds: newClass.teacherIds.filter(tid => tid !== t._id) });
                              }
                            }}
                            className="rounded border-luxury-border bg-slate-950 text-brand-600 focus:ring-0"
                          />
                          <span>{t.user?.firstName} {t.user?.lastName} ({t.subjects?.join(', ')})</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-all">
                    حفظ القسم الدراسي
                  </button>
                </form>
              </div>

              {/* Create Group under Class */}
              <div className="glass-panel p-6 md:p-8 rounded-2xl border border-luxury-border space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-brand-400" />
                  <span>إنشاء فوج جديد</span>
                </h3>
                <form onSubmit={handleCreateGroup} className="space-y-4">
                  <input
                    type="text"
                    required
                    placeholder="اسم الفوج (مثال: الفوج أ)"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                  />
                  <select
                    value={newGroup.classId}
                    required
                    onChange={(e) => setNewGroup({ ...newGroup, classId: e.target.value })}
                    className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="">اختر القسم الدراسي المرتبط</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="الطاقة الاستيعابية (الافتراضي 30)"
                    value={newGroup.capacity}
                    onChange={(e) => setNewGroup({ ...newGroup, capacity: e.target.value })}
                    className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                  />

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-400 font-semibold block">المواد المقررة لهذا الفوج</label>
                    <div className="bg-slate-900 border border-luxury-border rounded-xl p-3 max-h-36 overflow-y-auto grid grid-cols-2 gap-1.5 text-right">
                      {modules.length === 0 ? (
                        <span className="text-[10px] text-slate-500 italic col-span-2">لا توجد مواد مسجلة.</span>
                      ) : (
                        modules.map((m) => (
                          <label key={m._id} className="flex items-center gap-2 cursor-pointer text-xs text-slate-350 hover:text-white">
                            <input
                              type="checkbox"
                              checked={newGroup.modules.includes(m.name)}
                              onChange={(e) => setNewGroup({
                                ...newGroup,
                                modules: e.target.checked
                                  ? [...newGroup.modules, m.name]
                                  : newGroup.modules.filter((s) => s !== m.name),
                              })}
                              className="rounded border-luxury-border bg-slate-950 text-brand-600 focus:ring-0"
                            />
                            <span className="truncate">{m.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-400 font-semibold block">تعيين الأساتذة (اختياري)</label>
                    <div className="bg-slate-900 border border-luxury-border rounded-xl p-3 max-h-36 overflow-y-auto space-y-2">
                      {teachers.map(t => (
                        <label key={t._id} className="flex items-center gap-2 cursor-pointer text-xs text-slate-350 hover:text-white">
                          <input
                            type="checkbox"
                            checked={newGroup.teacherIds.includes(t._id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              if (checked) {
                                setNewGroup({ ...newGroup, teacherIds: [...newGroup.teacherIds, t._id] });
                              } else {
                                setNewGroup({ ...newGroup, teacherIds: newGroup.teacherIds.filter(tid => tid !== t._id) });
                              }
                            }}
                            className="rounded border-luxury-border bg-slate-950 text-brand-600 focus:ring-0"
                          />
                          <span>{t.user?.firstName} {t.user?.lastName} ({t.subjects?.join(', ')})</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all">
                    حفظ الفوج الجديد
                  </button>
                </form>
              </div>

            </div>
          </motion.div>
        )}

        {activeTab === 'classes' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-right"
          >
            {/* Display list of classes & groups */}
            <div className="glass-panel p-6 rounded-2xl border border-luxury-border space-y-4 shadow-lg bg-slate-950/20">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-luxury-border/30 pb-3">
                <BookOpen className="w-5 h-5 text-brand-400" />
                <span>قائمة الأقسام والأفواج الدراسية</span>
              </h3>
              {classes.length === 0 ? (
                <div className="text-slate-500 text-sm">لا يوجد classe disponible.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {classes.map((cls) => {
                    const classGroups = groups.filter((g) => g.class === cls._id || g.class?._id === cls._id);
                    const classStudents = students.filter((s) => s.class?._id === cls._id || s.class === cls._id);
                    const classTeachers = teachers.filter((t) => t.classes?.some((c) => c._id === cls._id || c === cls._id));
                    return (
                      <div key={cls._id} className="p-5 bg-slate-900/40 border border-luxury-border rounded-xl space-y-4 shadow-sm">
                        <div className="flex justify-between items-start border-b border-luxury-border/30 pb-2">
                          <div>
                            <h4 className="font-bold text-white text-sm">{cls.name}</h4>
                            <span className="text-[10px] text-brand-400 uppercase tracking-wider font-semibold">{cls.level}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => setEditingClass({ _id: cls._id, name: cls.name, description: cls.description || '', level: cls.level })}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all"
                              title="تعديل القسم"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClass(cls._id)}
                              className="p-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 rounded-lg transition-all"
                              title="حذف القسم"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{cls.description || 'لا يوجد وصف.'}</p>
                        
                        <div className="flex flex-wrap gap-6 text-[10px] text-slate-400 bg-slate-950/35 p-3 rounded-xl border border-luxury-border/30">
                          <div>
                            <span className="text-slate-500 uppercase font-bold tracking-wide block">التلاميذ المسجلون</span>
                            <span className="text-white font-extrabold text-sm block mt-0.5">{classStudents.length}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-slate-500 uppercase font-bold tracking-wide block mb-1">الأساتذة</span>
                            <div className="flex flex-wrap gap-1">
                              {classTeachers.length > 0 ? (
                                classTeachers.map((t) => (
                                  <span key={t._id} className="bg-brand-950/40 border border-brand-900/40 text-brand-300 px-2 py-0.5 rounded-lg text-[9px] font-medium">
                                    {t.user?.firstName} {t.user?.lastName}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-600 italic">لا يوجد enseignant</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 pt-1">
                          <span className="text-[10px] font-bold text-slate-350 block uppercase tracking-wide">الأفواج / الأفواج الفرعية:</span>
                          {classGroups.length === 0 ? (
                            <span className="text-xs text-slate-500 italic block pl-1">لا يوجد groupe rattaché.</span>
                          ) : (
                            <div className="grid grid-cols-1 gap-3">
                              {classGroups.map((g) => {
                                const groupStudents = students.filter((s) => s.group?._id === g._id || s.group === g._id);
                                const groupTeachersList = g.teachers || [];
                                return (
                                  <div key={g._id} className="p-3 bg-slate-950/45 border border-luxury-border/30 rounded-xl text-[10px] flex flex-col justify-between space-y-2.5">
                                    <div className="flex justify-between items-center">
                                      <span className="font-semibold text-white text-xs">{g.name}</span>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-slate-400">
                                          {groupStudents.length} / {g.capacity || 30} تلميذ
                                        </span>
                                        <button
                                          onClick={() => setEditingGroup({ _id: g._id, name: g.name, classId: g.class?._id || g.class, capacity: g.capacity || 30 })}
                                          className="p-1 bg-slate-800 hover:bg-slate-700 text-white rounded-md transition-all"
                                          title="تعديل الفوج"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteGroup(g._id)}
                                          className="p-1 bg-red-950/20 hover:bg-red-950/40 text-red-400 rounded-md transition-all"
                                          title="حذف الفوج"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                    
                                    <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden border border-luxury-border/10">
                                      <div
                                        className={`h-full rounded-full ${
                                          groupStudents.length >= (g.capacity || 30) ? 'bg-red-500 animate-pulse' : 'bg-brand-500'
                                        }`}
                                        style={{ width: `${Math.min(100, (groupStudents.length / (g.capacity || 30)) * 100)}%` }}
                                      ></div>
                                    </div>

                                    <div className="pt-0.5">
                                      <span className="text-slate-500 text-[9px] uppercase font-bold block mb-1">الأساتذة المرتبطون:</span>
                                      <div className="flex flex-wrap gap-1">
                                        {groupTeachersList.length > 0 ? (
                                          groupTeachersList.map((t) => {
                                            const name = t.user ? `${t.user.firstName} ${t.user.lastName}` : 'Enseignant';
                                            return (
                                              <span key={t._id} className="bg-indigo-950/40 border border-indigo-900/35 text-indigo-300 px-2 py-0.5 rounded-lg text-[9px]" title={t.user?.email}>
                                                {name}
                                              </span>
                                            );
                                          })
                                        ) : (
                                          <span className="text-slate-650 italic text-[9px]">لا يوجد أساتذة مرتبطون</span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="pt-2 border-t border-luxury-border/10 mt-1.5 space-y-1.5">
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">التلاميذ المسجلون بالفوج</span>
                                        <span className="text-[9px] font-bold text-slate-350 bg-slate-900 border border-luxury-border/30 px-2 py-0.5 rounded-full">
                                          {groupStudents.length} {groupStudents.length > 1 ? 'تلميذ' : 'élève'}
                                        </span>
                                      </div>
                                      
                                      <div className="flex flex-wrap gap-1">
                                        {groupStudents.length > 0 ? (
                                          groupStudents.map((s) => {
                                            const name = s.user ? `${s.user.firstName} ${s.user.lastName}` : 'Élève';
                                            return (
                                              <span
                                                key={s._id}
                                                onClick={() => {
                                                  setSelectedStudent(s);
                                                  setIsStudentDetailsOpen(true);
                                                }}
                                                className="inline-flex items-center gap-1.5 bg-slate-900/80 hover:bg-brand-950/20 border border-luxury-border/40 hover:border-brand-500/30 text-slate-300 hover:text-white px-2 py-0.75 rounded-lg text-[9px] font-medium transition-all duration-155 cursor-pointer hover:scale-[1.03]"
                                                title={`انقر لعرض تفاصيل ${name} (${s.user?.email || 'Pas d\'email'})`}
                                              >
                                                <span className="w-1 h-1 rounded-full bg-brand-400 shrink-0"></span>
                                                <span className="truncate max-w-[120px]">{name}</span>
                                              </span>
                                            );
                                          })
                                        ) : (
                                          <span className="text-slate-500 italic text-[9px] pl-0.5">لا يوجد élève rattaché</span>
                                        )}
                                      </div>
                                    </div>
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
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'modules' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-right"
          >
            {/* ===== School Modules Management ===== */}
            <div className="glass-panel p-6 rounded-2xl border border-luxury-border space-y-5 shadow-lg bg-slate-950/20">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-luxury-border/30 pb-3">
                <BookOpen className="w-5 h-5 text-brand-400" />
                <span>المواد الدراسية (Modules)</span>
              </h3>

              <form onSubmit={handleCreateModule} className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  required
                  placeholder="اسم المادة (مثال: رياضيات)"
                  value={newModule.name}
                  onChange={(e) => setNewModule({ ...newModule, name: e.target.value })}
                  className="flex-1 bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-brand-500 focus:outline-none text-right"
                />
                <input
                  type="text"
                  placeholder="وصف (اختياري)"
                  value={newModule.description}
                  onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                  className="flex-1 bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-brand-500 focus:outline-none text-right"
                />
                <button type="submit" className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-sm transition-all whitespace-nowrap">
                  إضافة مادة
                </button>
              </form>

              {modules.length === 0 ? (
                <div className="text-slate-500 text-sm">لا توجد مواد مسجلة.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {modules.map((m) => (
                    <div key={m._id} className="p-3 bg-slate-900/40 border border-luxury-border rounded-xl flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{m.name}</p>
                        {m.description && <p className="text-[10px] text-slate-450 mt-0.5 truncate">{m.description}</p>}
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => setEditingModule({ _id: m._id, name: m.name, description: m.description || '' })}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all"
                          title="تعديل"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteModule(m._id)}
                          className="p-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 rounded-lg transition-all"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'documents' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-right"
          >
            {/* ===== Administrative Documents ===== */}
            <div className="glass-panel p-6 rounded-2xl border border-luxury-border space-y-5 shadow-lg bg-slate-950/20">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-luxury-border/30 pb-3">
                <FileText className="w-5 h-5 text-brand-400" />
                <span>المستندات الإدارية (PDF)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { type: 'teacher_contract', label: 'عقد العمل (للأساتذة)' },
                  { type: 'parent_regulations', label: 'القانون الداخلي (للأولياء)' },
                ].map((docType) => {
                  const existing = documents.find((d) => d.type === docType.type);
                  return (
                    <div key={docType.type} className="p-4 bg-slate-900/40 border border-luxury-border rounded-xl space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white">{docType.label}</span>
                        {existing ? (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> منشور
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">غير منشور</span>
                        )}
                      </div>
                      {existing && (
                        <p className="text-[10px] text-slate-450 truncate">
                          {existing.originalName} — {new Date(existing.updatedAt).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                      <label className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-all cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingDoc === docType.type ? 'جاري الرفع...' : existing ? 'استبدال الملف' : 'رفع ملف PDF'}</span>
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          disabled={uploadingDoc === docType.type}
                          onChange={(e) => {
                            handleUploadDocument(docType.type, e.target.files[0]);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'schedules' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-right"
          >

            {/* Create Schedule Form */}
            <div className="glass-panel p-6 rounded-2xl border border-luxury-border space-y-6 h-fit">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-400" />
                <span>إنشاء أو تعديل جدول حصص / مخطط</span>
              </h3>
              
              <form onSubmit={handleCreateSchedule} className="space-y-5">
                <div>
                  <label className="text-xs uppercase text-slate-455 font-semibold mb-1.5 block">نوع الجدول</label>
                  <select
                    value={newSchedule.type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="Timetable">جدول التوقيت الدراسي</option>
                    <option value="Exam">برنامج الامتحانات</option>
                    <option value="Transport">خط النقل المدرسي</option>
                    <option value="Food">برنامج الإطعام / الوجبات</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs uppercase text-slate-455 font-semibold mb-1.5 block">العنوان / اسم المخطط</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: خط النقل 3 - أولاد فايت"
                    value={newSchedule.title}
                    onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                    className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none placeholder-slate-650"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase text-slate-455 font-semibold mb-1.5 block">القسم (اختياري)</label>
                    <select
                      value={newSchedule.classId}
                      onChange={(e) => setNewSchedule({ ...newSchedule, classId: e.target.value, groupId: '' })}
                      className="w-full bg-slate-900 border border-luxury-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                    >
                      <option value="">اختر القسم</option>
                      {classes.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs uppercase text-slate-455 font-semibold mb-1.5 block">الفوج (اختياري)</label>
                    <select
                      value={newSchedule.groupId}
                      onChange={(e) => setNewSchedule({ ...newSchedule, groupId: e.target.value })}
                      disabled={!newSchedule.classId}
                      className="w-full bg-slate-900 border border-luxury-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">اختر الفوج</option>
                      {groups
                        .filter((g) => g.class && (g.class._id === newSchedule.classId || g.class === newSchedule.classId))
                        .map((g) => (
                          <option key={g._id} value={g._id}>{g.name}</option>
                        ))
                      }
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex border-b border-luxury-border/30 pb-2 mb-2 justify-between items-center">
                    <label className="text-xs uppercase text-slate-455 font-semibold block">
                      التفاصيل والبيانات
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => loadScheduleTemplate(newSchedule.type)}
                        className="text-[9px] bg-slate-950/40 hover:bg-slate-900 text-brand-400 border border-brand-500/20 px-2 py-1.5 rounded-md transition-all flex items-center gap-1 font-bold uppercase"
                        title="ملء النموذج تلقائياً"
                      >
                        <FileText className="w-3 h-3" />
                        النموذج الافتراضي
                      </button>
                      <div className="flex bg-slate-950/50 p-0.5 rounded-lg border border-luxury-border/30">
                        <button
                          type="button"
                          onClick={() => setEditorMode('visual')}
                          className={`px-2 py-1 text-[9px] font-bold rounded transition-all ${
                            editorMode === 'visual'
                              ? 'bg-brand-600 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          واجهة مرئية
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditorMode('expert')}
                          className={`px-2 py-1 text-[9px] font-bold rounded transition-all ${
                            editorMode === 'expert'
                              ? 'bg-brand-600 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          JSON
                        </button>
                      </div>
                    </div>
                  </div>

                  {editorMode === 'visual' ? (
                    <div className="space-y-4">
                      {newSchedule.type === 'Timetable' && (
                        <div className="space-y-4">
                          <span className="text-[10px] uppercase text-slate-500 font-bold block">مخطط الحصص اليومي</span>
                          {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].map((day) => {
                            const slots = Array.isArray(visualData?.[day]) ? visualData[day] : [];
                            return (
                              <div key={day} className="p-3 bg-slate-950/30 border border-luxury-border/20 rounded-xl space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-white">{day}</span>
                                  <span className="text-[10px] text-slate-500">{slots.length} حصص</span>
                                </div>
                                
                                {slots.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 py-1">
                                    {slots.map((slot, idx) => (
                                      <span key={idx} className="bg-brand-950/50 border border-brand-900/40 text-brand-300 px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1.5">
                                        <span>{slot}</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updatedSlots = slots.filter((_, i) => i !== idx);
                                            updateVisualDataAndSync({ ...visualData, [day]: updatedSlots });
                                          }}
                                          className="hover:text-red-400 font-bold"
                                        >
                                          &times;
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                )}
                                
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="مثال: 08:00 - رياضيات"
                                    id={`new-slot-${day}`}
                                    className="flex-1 bg-slate-900 border border-luxury-border/40 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const val = e.target.value.trim();
                                        if (val) {
                                          updateVisualDataAndSync({ ...visualData, [day]: [...slots, val] });
                                          e.target.value = '';
                                        }
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const input = document.getElementById(`new-slot-${day}`);
                                      const val = input.value.trim();
                                      if (val) {
                                        updateVisualDataAndSync({ ...visualData, [day]: [...slots, val] });
                                        input.value = '';
                                      }
                                    }}
                                    className="px-3 py-1 bg-brand-650/30 hover:bg-brand-600 text-brand-300 hover:text-white rounded-lg text-xs font-bold transition-all border border-brand-550/20"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {newSchedule.type === 'Food' && (
                        <div className="space-y-2.5">
                          <span className="text-[10px] uppercase text-slate-500 font-bold block">القائمة اليومية للوجبات (الأطباق والتحلية)</span>
                          {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].map((day) => (
                            <div key={day} className="flex items-center gap-2 bg-slate-950/20 border border-luxury-border/20 rounded-xl p-2">
                              <span className="w-16 text-xs font-bold text-slate-350">{day}</span>
                              <input
                                type="text"
                                placeholder="مثال: كسكس بالخضار، لبن، فواكه"
                                value={visualData?.[day] || ''}
                                onChange={(e) => {
                                  updateVisualDataAndSync({ ...visualData, [day]: e.target.value });
                                }}
                                className="flex-1 bg-slate-900 border border-luxury-border/45 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-brand-500"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {newSchedule.type === 'Transport' && (
                        <div className="space-y-4">
                          <span className="text-[10px] uppercase text-slate-500 font-bold block">تفاصيل خط النقل ومحطات التوقف</span>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] text-slate-455 uppercase block mb-1">اسم خط النقل</label>
                              <input
                                type="text"
                                placeholder="مثال: الخط 3"
                                value={visualData?.Ligne || visualData?.line || ''}
                                onChange={(e) => {
                                  updateVisualDataAndSync({ ...visualData, Ligne: e.target.value });
                                }}
                                className="w-full bg-slate-900 border border-luxury-border/45 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-655 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-455 uppercase block mb-1">السائق ورقم الاتصال</label>
                              <input
                                type="text"
                                placeholder="مثال: عمي أحمد (0555...)"
                                value={visualData?.Chauffeur || visualData?.driver || ''}
                                onChange={(e) => {
                                  updateVisualDataAndSync({ ...visualData, Chauffeur: e.target.value });
                                }}
                                className="w-full bg-slate-900 border border-luxury-border/45 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-655 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] text-slate-450 uppercase block font-semibold">قائمة محطات التوقف</label>
                              <button
                                type="button"
                                onClick={() => {
                                  const stops = Array.isArray(visualData?.Arrêts || visualData?.stops) ? [...(visualData.Arrêts || visualData.stops)] : [];
                                  updateVisualDataAndSync({ ...visualData, Arrêts: [...stops, ""] });
                                }}
                                className="text-[9px] bg-slate-950/60 text-brand-400 hover:text-white px-2 py-1 rounded border border-brand-500/20 font-bold uppercase"
                              >
                                + Ajouter
                              </button>
                            </div>
                            
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {(Array.isArray(visualData?.Arrêts || visualData?.stops) ? (visualData.Arrêts || visualData.stops) : [""]).map((stop, idx, arr) => (
                                <div key={idx} className="flex gap-2 items-center">
                                  <span className="text-[10px] text-slate-500 font-mono w-4">#{idx + 1}</span>
                                  <input
                                    type="text"
                                    placeholder="مثال: 07:15 - حي 1200 مسكن"
                                    value={stop}
                                    onChange={(e) => {
                                      const stops = [...arr];
                                      stops[idx] = e.target.value;
                                      updateVisualDataAndSync({ ...visualData, Arrêts: stops });
                                    }}
                                    className="flex-1 bg-slate-900 border border-luxury-border/45 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-655 focus:outline-none focus:border-brand-500"
                                  />
                                  <button
                                    type="button"
                                    disabled={arr.length <= 1}
                                    onClick={() => {
                                      const stops = arr.filter((_, i) => i !== idx);
                                      updateVisualDataAndSync({ ...visualData, Arrêts: stops });
                                    }}
                                    className="p-1.5 bg-red-950/20 text-red-405 rounded-lg hover:bg-red-950/50 disabled:opacity-35 disabled:cursor-not-allowed transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {newSchedule.type === 'Exam' && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase text-slate-500 font-bold block">جلسات وحصص الامتحانات</span>
                            <button
                              type="button"
                              onClick={() => {
                                const list = Array.isArray(visualData) ? [...visualData] : [];
                                updateVisualDataAndSync([...list, { "Matière": "", "Date": "", "Heure": "", "Salle": "" }]);
                              }}
                              className="text-[9px] bg-slate-950/60 text-brand-400 hover:text-white px-2 py-1 rounded border border-brand-500/20 font-bold uppercase"
                            >
                              + Ajouter
                            </button>
                          </div>

                          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                            {(Array.isArray(visualData) ? visualData : []).map((exam, idx, arr) => (
                              <div key={idx} className="p-3 bg-slate-950/30 border border-luxury-border/20 rounded-xl space-y-2 relative">
                                <div className="flex justify-between items-center border-b border-luxury-border/10 pb-1.5 mb-1">
                                  <span className="text-[10px] font-bold text-slate-450 uppercase">امتحان رقم {idx + 1}</span>
                                  <button
                                    type="button"
                                    disabled={arr.length <= 1}
                                    onClick={() => {
                                      const list = arr.filter((_, i) => i !== idx);
                                      updateVisualDataAndSync(list);
                                    }}
                                    className="p-1 text-red-405 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[9px] text-slate-500 block mb-0.5">Matière</label>
                                    <input
                                      type="text"
                                      placeholder="ex: Mathématiques"
                                      value={exam.Matière || exam.subject || ''}
                                      onChange={(e) => {
                                        const list = [...arr];
                                        list[idx] = { ...list[idx], Matière: e.target.value };
                                        updateVisualDataAndSync(list);
                                      }}
                                      className="w-full bg-slate-900 border border-luxury-border/45 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-655 focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-slate-500 block mb-0.5">Salle</label>
                                    <input
                                      type="text"
                                      placeholder="ex: Salle 12"
                                      value={exam.Salle || exam.room || ''}
                                      onChange={(e) => {
                                        const list = [...arr];
                                        list[idx] = { ...list[idx], Salle: e.target.value };
                                        updateVisualDataAndSync(list);
                                      }}
                                      className="w-full bg-slate-900 border border-luxury-border/45 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-655 focus:outline-none"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[9px] text-slate-500 block mb-0.5">Date</label>
                                    <input
                                      type="text"
                                      placeholder="ex: 2026-06-15"
                                      value={exam.Date || exam.date || ''}
                                      onChange={(e) => {
                                        const list = [...arr];
                                        list[idx] = { ...list[idx], Date: e.target.value };
                                        updateVisualDataAndSync(list);
                                      }}
                                      className="w-full bg-slate-900 border border-luxury-border/45 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-655 focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-slate-500 block mb-0.5">Heure (المدة)</label>
                                    <input
                                      type="text"
                                      placeholder="ex: 08:30 - 11:30"
                                      value={exam.Heure || exam.time || ''}
                                      onChange={(e) => {
                                        const list = [...arr];
                                        list[idx] = { ...list[idx], Heure: e.target.value };
                                        updateVisualDataAndSync(list);
                                      }}
                                      className="w-full bg-slate-900 border border-luxury-border/45 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-655 focus:outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <textarea
                      required
                      placeholder='ex: { "stops": ["08:00 - Ouled Fayet Centre", "08:15 - Ecole"], "meals": ["Couscous", "Fruit"] }'
                      value={newSchedule.data}
                      onChange={(e) => handleJsonDataChange(e.target.value)}
                      className="w-full h-44 bg-slate-900 border border-luxury-border rounded-xl p-4 text-xs font-mono text-white focus:border-brand-500 focus:outline-none"
                    />
                  )}
                </div>

                <button type="submit" className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-brand-550/20">
                  حفظ الجدول والمخطط
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {activeTab === 'guide' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-right"
          >
            <SchedulesGuide schedules={schedules} onDelete={handleDeleteSchedule} />
          </motion.div>
        )}

        {activeTab === 'audit' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 text-right"
          >
            {/* Warning Banner */}
            <div className="p-4 bg-amber-955/20 border border-amber-900/50 rounded-2xl flex items-start gap-3 text-amber-300">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">لوحة التدقيق والرقابة الأمنية للرسائل</h4>
                <p className="text-xs text-amber-400/80 mt-1">
                  En tant qu'administrateur, vous disposez d'un droit d'accès aux échanges du système pour assurer la sécurité des تلميذ et la conformité de l'établissement. Veillez à utiliser ces informations dans le respect de la vie privée et de la déontologie.
                </p>
              </div>
            </div>

            {/* Filters & Search Control Bar */}
            <div className="glass-panel p-6 rounded-2xl border border-luxury-border space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Search field */}
                <div className="w-full md:flex-1 relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    placeholder="البحث بالمرسل، المستلم، البريد أو محتوى الرسالة..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-luxury-border rounded-xl pl-11 pr-4 py-3 text-sm focus:border-brand-500 focus:outline-none placeholder-slate-500 text-white"
                  />
                </div>

                {/* Sort Order */}
                <div className="flex gap-2 w-full md:w-auto">
                  <select
                    value={auditSortOrder}
                    onChange={(e) => setAuditSortOrder(e.target.value)}
                    className="bg-slate-900 border border-luxury-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500 font-semibold w-full md:w-auto"
                  >
                    <option value="desc">الأحدث أولاً</option>
                    <option value="asc">الأقدم أولاً</option>
                  </select>

                  <button
                    onClick={fetchAuditMessages}
                    className="px-4 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-sm transition-all whitespace-nowrap"
                  >
                    تحديث
                  </button>
                </div>
              </div>

              {/* Role Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase text-slate-400 font-semibold">نوع حساب المرسل</label>
                  <select
                    value={senderRoleFilter}
                    onChange={(e) => setSenderRoleFilter(e.target.value)}
                    className="bg-slate-900 border border-luxury-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="all">الجميع</option>
                    <option value="admin">مدير النظام</option>
                    <option value="school">إدارة المدرسة</option>
                    <option value="teacher">الأستاذ</option>
                    <option value="parent">ولي الأمر</option>
                    <option value="student">التلميذ</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase text-slate-400 font-semibold">نوع حساب المستلم</label>
                  <select
                    value={receiverRoleFilter}
                    onChange={(e) => setReceiverRoleFilter(e.target.value)}
                    className="bg-slate-900 border border-luxury-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="all">الجميع</option>
                    <option value="admin">مدير النظام</option>
                    <option value="school">إدارة المدرسة</option>
                    <option value="teacher">الأستاذ</option>
                    <option value="parent">ولي الأمر</option>
                    <option value="student">التلميذ</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Messages Display */}
            <div className="glass-panel p-6 rounded-2xl border border-luxury-border space-y-4">
              <div className="flex justify-between items-center border-b border-luxury-border/30 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-brand-400" />
                  <span>مراقبة وتدفق رسائل النظام</span>
                </h3>
                <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-luxury-border/50">
                  {auditMessages
                    .filter((msg) => {
                      const sender = msg.sender || {};
                      const receiver = msg.receiver || {};
                      const content = msg.content || '';
                      const emailSender = sender.email || '';
                      const emailReceiver = receiver.email || '';
                      const nameSender = `${sender.firstName || ''} ${sender.lastName || ''}`.toLowerCase();
                      const nameReceiver = `${receiver.firstName || ''} ${receiver.lastName || ''}`.toLowerCase();
                      const search = auditSearch.toLowerCase();

                      const matchesSearch = 
                        nameSender.includes(search) || 
                        nameReceiver.includes(search) || 
                        emailSender.toLowerCase().includes(search) || 
                        emailReceiver.toLowerCase().includes(search) || 
                        content.toLowerCase().includes(search);

                      const matchesSenderRole = senderRoleFilter === 'all' || sender.role === senderRoleFilter;
                      const matchesReceiverRole = receiverRoleFilter === 'all' || receiver.role === receiverRoleFilter;

                      return matchesSearch && matchesSenderRole && matchesReceiverRole;
                    }).length
                  } رسائل تم العثور عليها
                </span>
              </div>

              {auditLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                  <span className="text-xs text-slate-400">جاري تحميل الرسائل...</span>
                </div>
              ) : auditMessages.length === 0 ? (
                <div className="text-center py-20 bg-slate-950/20 rounded-2xl border border-luxury-border/30 text-slate-500 text-sm italic">
                  لا يوجد message enregistré.
                </div>
              ) : auditMessages
                .filter((msg) => {
                  const sender = msg.sender || {};
                  const receiver = msg.receiver || {};
                  const content = msg.content || '';
                  const emailSender = sender.email || '';
                  const emailReceiver = receiver.email || '';
                  const nameSender = `${sender.firstName || ''} ${sender.lastName || ''}`.toLowerCase();
                  const nameReceiver = `${receiver.firstName || ''} ${receiver.lastName || ''}`.toLowerCase();
                  const search = auditSearch.toLowerCase();

                  const matchesSearch = 
                    nameSender.includes(search) || 
                    nameReceiver.includes(search) || 
                    emailSender.toLowerCase().includes(search) || 
                    emailReceiver.toLowerCase().includes(search) || 
                    content.toLowerCase().includes(search);

                  const matchesSenderRole = senderRoleFilter === 'all' || sender.role === senderRoleFilter;
                  const matchesReceiverRole = receiverRoleFilter === 'all' || receiver.role === receiverRoleFilter;

                  return matchesSearch && matchesSenderRole && matchesReceiverRole;
                }).length === 0 ? (
                <div className="text-center py-20 bg-slate-950/20 rounded-2xl border border-luxury-border/30 text-slate-500 text-sm italic">
                  لا يوجد message ne correspond aux critères de recherche.
                </div>
              ) : (
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  {auditMessages
                    .filter((msg) => {
                      const sender = msg.sender || {};
                      const receiver = msg.receiver || {};
                      const content = msg.content || '';
                      const emailSender = sender.email || '';
                      const emailReceiver = receiver.email || '';
                      const nameSender = `${sender.firstName || ''} ${sender.lastName || ''}`.toLowerCase();
                      const nameReceiver = `${receiver.firstName || ''} ${receiver.lastName || ''}`.toLowerCase();
                      const search = auditSearch.toLowerCase();

                      const matchesSearch = 
                        nameSender.includes(search) || 
                        nameReceiver.includes(search) || 
                        emailSender.toLowerCase().includes(search) || 
                        emailReceiver.toLowerCase().includes(search) || 
                        content.toLowerCase().includes(search);

                      const matchesSenderRole = senderRoleFilter === 'all' || sender.role === senderRoleFilter;
                      const matchesReceiverRole = receiverRoleFilter === 'all' || receiver.role === receiverRoleFilter;

                      return matchesSearch && matchesSenderRole && matchesReceiverRole;
                    })
                    .sort((a, b) => {
                      const dateA = new Date(a.createdAt);
                      const dateB = new Date(b.createdAt);
                      return auditSortOrder === 'desc' ? dateB - dateA : dateA - dateB;
                    })
                    .map((msg) => {
                      const sender = msg.sender || {};
                      const receiver = msg.receiver || {};
                      
                      const getRoleBadge = (role) => {
                        switch (role) {
                          case 'admin':
                          case 'school':
                            return <span className="px-2 py-0.5 rounded bg-red-955/20 border border-red-900/50 text-red-400 text-[9px] font-bold uppercase">Admin</span>;
                          case 'teacher':
                            return <span className="px-2 py-0.5 rounded bg-indigo-955/20 border border-indigo-900/50 text-indigo-400 text-[9px] font-bold uppercase">Enseignant</span>;
                          case 'parent':
                            return <span className="px-2 py-0.5 rounded bg-emerald-955/20 border border-emerald-900/50 text-emerald-450 text-[9px] font-bold uppercase">Parent</span>;
                          case 'student':
                            return <span className="px-2 py-0.5 rounded bg-amber-955/20 border border-amber-900/50 text-amber-400 text-[9px] font-bold uppercase">Élève</span>;
                          default:
                            return <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 text-[9px] font-bold uppercase">{role || 'Inconnu'}</span>;
                        }
                      };

                      const isImageFile = (url) => /\.(jpeg|jpg|gif|png|webp)$/i.test(url);

                      return (
                        <div key={msg._id} className="p-4 bg-slate-900/20 border border-luxury-border/40 hover:border-brand-500/20 rounded-2xl space-y-3 transition-all">
                          {/* Sender & Receiver Info */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-luxury-border/10 pb-2.5">
                            {/* Sender */}
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-slate-850 border border-luxury-border/60 flex items-center justify-center text-xs font-bold text-slate-350 uppercase">
                                {(sender.firstName?.[0] || '') + (sender.lastName?.[0] || '') || '?'}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 font-medium">
                                  <span className="text-xs font-bold text-white">
                                    {sender.firstName && sender.lastName ? `${sender.firstName} ${sender.lastName}` : 'Utilisateur Supprimé'}
                                  </span>
                                  {getRoleBadge(sender.role)}
                                </div>
                                <span className="text-[10px] text-slate-500 block">{sender.email || '—'}</span>
                              </div>
                            </div>

                            {/* Arrow Indicator */}
                            <div className="hidden sm:flex items-center justify-center">
                              <span className="text-xs font-bold text-brand-500">&rarr;</span>
                            </div>
                            <div className="sm:hidden flex items-center gap-1">
                              <span className="text-[9px] text-slate-550 uppercase font-semibold">Envoyé à :</span>
                            </div>

                            {/* Receiver */}
                            <div className="flex items-center gap-2 sm:text-right sm:flex-row-reverse">
                              <div className="w-8 h-8 rounded-full bg-slate-850 border border-luxury-border/60 flex items-center justify-center text-xs font-bold text-slate-350 uppercase">
                                {(receiver.firstName?.[0] || '') + (receiver.lastName?.[0] || '') || '?'}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 sm:flex-row-reverse">
                                  <span className="text-xs font-bold text-white">
                                    {receiver.firstName && receiver.lastName ? `${receiver.firstName} ${receiver.lastName}` : 'Utilisateur Supprimé'}
                                  </span>
                                  {getRoleBadge(receiver.role)}
                                </div>
                                <span className="text-[10px] text-slate-500 block">{receiver.email || '—'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Content & Attachment */}
                          <div className="pl-2 pr-2">
                            {msg.content && (
                              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                                {msg.content}
                              </p>
                            )}

                            {msg.attachmentUrl && (
                              <div className="mt-2.5 p-3 bg-slate-950/40 border border-luxury-border/30 rounded-xl max-w-sm">
                                {isImageFile(msg.attachmentUrl) ? (
                                  <div className="space-y-2">
                                    <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-luxury-border/50 hover:border-brand-500/30 transition-all">
                                      <img
                                        src={msg.attachmentUrl}
                                        alt={msg.attachmentName || "Attachment"}
                                        className="max-h-40 w-full object-cover"
                                      />
                                    </a>
                                    <div className="flex justify-between items-center text-[10px]">
                                      <span className="text-slate-400 truncate max-w-[200px]">{msg.attachmentName || "image.png"}</span>
                                      <a href={msg.attachmentUrl} download target="_blank" rel="noreferrer" className="text-brand-450 hover:underline font-bold">
                                        Télécharger
                                      </a>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between text-xs gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <FileText className="w-4 h-4 text-brand-400 flex-shrink-0" />
                                      <span className="text-slate-300 truncate font-medium">{msg.attachmentName || "file.bin"}</span>
                                    </div>
                                    <a href={msg.attachmentUrl} download target="_blank" rel="noreferrer" className="text-brand-450 hover:underline font-bold flex-shrink-0">
                                      Télécharger
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Timestamp */}
                          <div className="flex justify-end pr-2 text-[10px] text-slate-500">
                            {new Date(msg.createdAt).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </motion.div>
        )}

      </div>

      {/* User Edit Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel-heavy p-6 md:p-8 rounded-2xl border border-luxury-border max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl relative">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingUser(null);
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white border-b border-luxury-border/30 pb-3">
              تعديل le compte ({editingUser.role})
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-400 font-semibold">Prénom</label>
                  <input
                    type="text"
                    required
                    value={editingDetails.firstName}
                    onChange={(e) => setEditingDetails({ ...editingDetails, firstName: e.target.value })}
                    className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-400 font-semibold">Nom</label>
                  <input
                    type="text"
                    required
                    value={editingDetails.lastName}
                    onChange={(e) => setEditingDetails({ ...editingDetails, lastName: e.target.value })}
                    className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-slate-400 font-semibold">Email</label>
                <input
                  type="email"
                  required
                  value={editingDetails.email}
                  onChange={(e) => setEditingDetails({ ...editingDetails, email: e.target.value })}
                  className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-slate-400 font-semibold">Téléphone</label>
                <input
                  type="text"
                  value={editingDetails.phoneNumber}
                  onChange={(e) => setEditingDetails({ ...editingDetails, phoneNumber: e.target.value })}
                  className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Role-Specific fields */}
              {editingUser.role === 'teacher' && (
                <div className="space-y-4 pt-3 border-t border-luxury-border/20">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-400 font-semibold block">المواد المدرَّسة (اختر من القائمة)</label>
                    <div className="bg-slate-900 border border-luxury-border rounded-xl p-3 max-h-36 overflow-y-auto grid grid-cols-2 gap-1.5 text-right">
                      {modules.length === 0 ? (
                        <span className="text-[10px] text-slate-500 italic col-span-2">لا توجد مواد مسجلة.</span>
                      ) : (
                        modules.map((m) => {
                          const selected = Array.isArray(editingDetails.subjects) && editingDetails.subjects.includes(m.name);
                          return (
                            <label key={m._id} className="flex items-center gap-2 cursor-pointer text-xs text-slate-350 hover:text-white">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={(e) => {
                                  const current = Array.isArray(editingDetails.subjects) ? editingDetails.subjects : [];
                                  setEditingDetails({
                                    ...editingDetails,
                                    subjects: e.target.checked
                                      ? [...current, m.name]
                                      : current.filter((s) => s !== m.name),
                                  });
                                }}
                                className="rounded border-luxury-border bg-slate-950 text-brand-600 focus:ring-0"
                              />
                              <span className="truncate">{m.name}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-slate-400 font-semibold block">Classes rattachées</label>
                      <div className="bg-slate-900 border border-luxury-border rounded-xl p-3 max-h-36 overflow-y-auto space-y-2">
                        {classes.map(c => (
                          <label key={c._id} className="flex items-center gap-2 cursor-pointer text-xs text-slate-350 hover:text-white">
                            <input
                              type="checkbox"
                              checked={editingDetails.classes.includes(c._id)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                let updatedClasses = [];
                                if (checked) {
                                  updatedClasses = [...editingDetails.classes, c._id];
                                } else {
                                  updatedClasses = editingDetails.classes.filter(cid => cid !== c._id);
                                }
                                // Also filter groups that belong to unchecked classes
                                const updatedGroups = editingDetails.groups.filter(gid => {
                                  const groupObj = groups.find(g => g._id === gid);
                                  const groupClassId = groupObj?.class?._id || groupObj?.class;
                                  return updatedClasses.includes(groupClassId);
                                });
                                setEditingDetails({ ...editingDetails, classes: updatedClasses, groups: updatedGroups });
                              }}
                              className="rounded border-luxury-border bg-slate-950 text-brand-600 focus:ring-0"
                            />
                            <span>{c.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-slate-400 font-semibold block">Groupes rattachés</label>
                      <div className="bg-slate-900 border border-luxury-border rounded-xl p-3 max-h-36 overflow-y-auto space-y-2">
                        {groups
                          .filter(g => editingDetails.classes.includes(g.class?._id || g.class))
                          .map(g => (
                            <label key={g._id} className="flex items-center gap-2 cursor-pointer text-xs text-slate-355 hover:text-white">
                              <input
                                type="checkbox"
                                checked={editingDetails.groups.includes(g._id)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  if (checked) {
                                    setEditingDetails({ ...editingDetails, groups: [...editingDetails.groups, g._id] });
                                  } else {
                                    setEditingDetails({ ...editingDetails, groups: editingDetails.groups.filter(gid => gid !== g._id) });
                                  }
                                }}
                                className="rounded border-luxury-border bg-slate-950 text-brand-600 focus:ring-0"
                              />
                              <span>{g.name} ({g.class?.name || classes.find(c => c._id === g.class)?.name})</span>
                            </label>
                          ))}
                        {groups.filter(g => editingDetails.classes.includes(g.class?._id || g.class)).length === 0 && (
                          <span className="text-[10px] text-slate-550 italic">Sélectionnez d'abord une classe.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Room / module assignments */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase text-slate-400 font-semibold">إسناد المادة والقاعة (Salle)</label>
                      <button
                        type="button"
                        onClick={() => setEditingDetails({ ...editingDetails, assignments: [...(editingDetails.assignments || []), { module: '', room: '' }] })}
                        className="text-[10px] font-bold text-brand-300 bg-brand-500/10 border border-brand-500/25 hover:bg-brand-500/20 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        + إضافة
                      </button>
                    </div>
                    {(!editingDetails.assignments || editingDetails.assignments.length === 0) ? (
                      <p className="text-[10px] text-slate-500 italic">لم يُسند أي مادة/قاعة بعد.</p>
                    ) : (
                      <div className="space-y-2">
                        {editingDetails.assignments.map((a, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <select
                              value={a.module}
                              onChange={(e) => {
                                const next = [...editingDetails.assignments];
                                next[idx] = { ...next[idx], module: e.target.value };
                                setEditingDetails({ ...editingDetails, assignments: next });
                              }}
                              className="flex-1 bg-slate-900 border border-luxury-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                            >
                              <option value="">المادة</option>
                              {modules.map((m) => (
                                <option key={m._id} value={m.name}>{m.name}</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder="القاعة (Salle)"
                              value={a.room}
                              onChange={(e) => {
                                const next = [...editingDetails.assignments];
                                next[idx] = { ...next[idx], room: e.target.value };
                                setEditingDetails({ ...editingDetails, assignments: next });
                              }}
                              className="w-28 bg-slate-900 border border-luxury-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                            />
                            <button
                              type="button"
                              onClick={() => setEditingDetails({ ...editingDetails, assignments: editingDetails.assignments.filter((_, i) => i !== idx) })}
                              className="p-1.5 bg-red-950/20 hover:bg-red-950/50 text-red-400 rounded-lg"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {editingUser.role === 'student' && (
                <div className="space-y-4 pt-3 border-t border-luxury-border/20">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-slate-400 font-semibold">Classe</label>
                      <select
                        value={editingDetails.classId}
                        required
                        onChange={(e) => setEditingDetails({ ...editingDetails, classId: e.target.value, groupId: '' })}
                        className="w-full bg-slate-900 border border-luxury-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="">Sélectionner</option>
                        {classes.map(c => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-slate-400 font-semibold">Groupe</label>
                      <select
                        value={editingDetails.groupId}
                        required
                        onChange={(e) => setEditingDetails({ ...editingDetails, groupId: e.target.value })}
                        className="w-full bg-slate-900 border border-luxury-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="">Sélectionner</option>
                        {groups.filter(g => g.class === editingDetails.classId || g.class?._id === editingDetails.classId).map(g => (
                          <option key={g._id} value={g._id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-slate-400 font-semibold">N° Inscription</label>
                      <input
                        type="text"
                        required
                        value={editingDetails.registrationNumber}
                        onChange={(e) => setEditingDetails({ ...editingDetails, registrationNumber: e.target.value })}
                        className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-slate-400 font-semibold">Date de naissance</label>
                      <input
                        type="date"
                        required
                        value={editingDetails.dateOfBirth}
                        onChange={(e) => setEditingDetails({ ...editingDetails, dateOfBirth: e.target.value })}
                        className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-400 font-semibold">Parent Rattaché</label>
                    <select
                      value={editingDetails.parentId}
                      required
                      onChange={(e) => setEditingDetails({ ...editingDetails, parentId: e.target.value })}
                      className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="">Sélectionner le Parent</option>
                      {parents.map(p => (
                        <option key={p._id} value={p._id}>{p.firstName} {p.lastName} ({p.email})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {editingUser.role === 'parent' && (
                <div className="space-y-4 pt-3 border-t border-luxury-border/20">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-400 font-semibold">Profession</label>
                    <input
                      type="text"
                      value={editingDetails.profession}
                      onChange={(e) => setEditingDetails({ ...editingDetails, profession: e.target.value })}
                      className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-400 font-semibold">Adresse Résidence</label>
                    <input
                      type="text"
                      value={editingDetails.address}
                      onChange={(e) => setEditingDetails({ ...editingDetails, address: e.target.value })}
                      className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {(editingUser.role === 'general_supervisor' || editingUser.role === 'pedagogical_supervisor') && (
                <div className="space-y-4 pt-3 border-t border-luxury-border/20">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-400 font-semibold">مكتب العمل / الموقع</label>
                    <input
                      type="text"
                      value={editingDetails.officeLocation || ''}
                      onChange={(e) => setEditingDetails({ ...editingDetails, officeLocation: e.target.value })}
                      className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {editingUser.role === 'receptionist' && (
                <div className="space-y-4 pt-3 border-t border-luxury-border/20">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-400 font-semibold">رقم مكتب الاستقبال</label>
                    <input
                      type="text"
                      value={editingDetails.deskNumber || ''}
                      onChange={(e) => setEditingDetails({ ...editingDetails, deskNumber: e.target.value })}
                      className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-400 font-semibold">ساعات الدوام</label>
                    <input
                      type="text"
                      value={editingDetails.workShift || ''}
                      onChange={(e) => setEditingDetails({ ...editingDetails, workShift: e.target.value })}
                      className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-all text-xs"
              >
                Enregistrer les Modifications
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Billing Invoice Creator Modal */}
      {isBillingModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel-heavy p-6 md:p-8 rounded-2xl border border-luxury-border max-w-md w-full space-y-6 shadow-2xl relative">
            <button
              onClick={() => setIsBillingModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white border-b border-luxury-border/30 pb-3">
              Ajouter une Facturation / New Invoice
            </h3>

            <form onSubmit={handleCreateBilling} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-slate-400 font-semibold">Sélectionner l'Élève</label>
                <select
                  value={billingForm.studentId}
                  required
                  onChange={(e) => setBillingForm({ ...billingForm, studentId: e.target.value })}
                  className="w-full bg-slate-900 border border-luxury-border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                >
                  <option value="">Choisir l'élève...</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>{s.user?.firstName} {s.user?.lastName} (Classe: {s.class?.name})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-slate-400 font-semibold">Montant (DZD)</label>
                <input
                  type="number"
                  required
                  value={billingForm.amount}
                  onChange={(e) => setBillingForm({ ...billingForm, amount: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-400 font-semibold">Service Type</label>
                  <select
                    value={billingForm.type}
                    onChange={(e) => setBillingForm({ ...billingForm, type: e.target.value })}
                    className="w-full bg-slate-900 border border-luxury-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Tuition">Scolarité / Tuition</option>
                    <option value="Transport">Bus / Transport</option>
                    <option value="Food">Cantine / Food</option>
                    <option value="Activity">Activité / Activity</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-400 font-semibold">Statut initial</label>
                  <select
                    value={billingForm.status}
                    onChange={(e) => setBillingForm({ ...billingForm, status: e.target.value })}
                    className="w-full bg-slate-900 border border-luxury-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Pending">En attente / Pending</option>
                    <option value="Paid">Déjà Payé / Paid</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-all text-xs"
              >
                Créer la Facturation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {isStudentDetailsOpen && selectedStudent && (() => {
        const studentTeachers = teachers.filter((t) => 
          t.classes?.some((c) => c._id === selectedStudent.class?._id || c === selectedStudent.class?._id) && 
          t.groups?.some((g) => g._id === selectedStudent.group?._id || g === selectedStudent.group?._id)
        );
        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-panel-heavy p-6 md:p-8 rounded-2xl border border-luxury-border max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl relative animate-fade-in">
              <button
                onClick={() => {
                  setIsStudentDetailsOpen(false);
                  setSelectedStudent(null);
                }}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header Profile Section */}
              <div className="flex items-center gap-4 border-b border-luxury-border/30 pb-4">
                <div className="w-14 h-14 rounded-full bg-brand-900/40 border border-brand-500/30 flex items-center justify-center font-extrabold text-lg text-brand-300 uppercase shrink-0 shadow-lg">
                  {selectedStudent.user?.firstName?.[0]}{selectedStudent.user?.lastName?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-bold text-white leading-tight">
                    {selectedStudent.user?.firstName} {selectedStudent.user?.lastName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-500 font-mono">
                      N° Ins: {selectedStudent.registrationNumber || selectedStudent._id}
                    </span>
                    <span className="text-slate-600">&bull;</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      selectedStudent.user?.isActive ? 'bg-emerald-950/60 border border-emerald-900 text-emerald-400' : 'bg-red-950/60 border border-red-900/50 text-red-400'
                    }`}>
                      {selectedStudent.user?.isActive ? 'Compte Actif' : 'Compte Inactif'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* School Details */}
                <div className="space-y-3 p-4 bg-slate-900/20 border border-luxury-border/30 rounded-xl">
                  <h4 className="text-xs uppercase font-extrabold text-brand-400 tracking-wider">Parحصص Scolaire</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-luxury-border/10">
                      <span className="text-slate-500">Classe</span>
                      <span className="text-white font-medium">{selectedStudent.class?.name || '—'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-luxury-border/10">
                      <span className="text-slate-500">Niveau</span>
                      <span className="text-slate-350 capitalize font-medium">{selectedStudent.class?.level || '—'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Groupe / Section</span>
                      <span className="text-brand-300 font-bold">{selectedStudent.group?.name || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="space-y-3 p-4 bg-slate-900/20 border border-luxury-border/30 rounded-xl">
                  <h4 className="text-xs uppercase font-extrabold text-brand-400 tracking-wider">Informations Élève</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-luxury-border/10">
                      <span className="text-slate-500">Email</span>
                      <span className="text-slate-300 font-mono select-all truncate max-w-[150px]" title={selectedStudent.user?.email}>
                        {selectedStudent.user?.email || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-luxury-border/10">
                      <span className="text-slate-500">Téléphone</span>
                      <span className="text-slate-300 font-mono select-all">{selectedStudent.user?.phoneNumber || '—'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Date de naissance</span>
                      <span className="text-slate-300 font-medium">
                        {selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString('fr-FR') : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parent Details Card */}
              {selectedStudent.parent ? (
                <div className="p-4 bg-slate-950/40 border border-luxury-border/30 rounded-xl space-y-3">
                  <h4 className="text-xs uppercase font-extrabold text-indigo-400 tracking-wider">Parent / Tuteur</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2">
                      <div className="flex justify-between py-1 border-b border-luxury-border/10">
                        <span className="text-slate-500">Nom Complet</span>
                        <span className="text-white font-medium">
                          {selectedStudent.parent.user?.firstName} {selectedStudent.parent.user?.lastName}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-luxury-border/10">
                        <span className="text-slate-500">Profession</span>
                        <span className="text-slate-300 font-medium">{selectedStudent.parent.profession || '—'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between py-1 border-b border-luxury-border/10">
                        <span className="text-slate-500">Email</span>
                        <span className="text-slate-300 font-mono select-all truncate max-w-[140px]" title={selectedStudent.parent.user?.email}>
                          {selectedStudent.parent.user?.email || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-luxury-border/10">
                        <span className="text-slate-500">Téléphone</span>
                        <span className="text-white font-mono select-all">{selectedStudent.parent.user?.phoneNumber || '—'}</span>
                      </div>
                    </div>
                  </div>
                  {selectedStudent.parent.address && (
                    <div className="pt-2 text-xs border-t border-luxury-border/10 flex justify-between">
                      <span className="text-slate-500 shrink-0 mr-4">Adresse</span>
                      <span className="text-slate-300 font-medium text-right leading-tight max-w-sm">{selectedStudent.parent.address}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-950/40 border border-luxury-border/30 rounded-xl text-center text-xs text-slate-500 italic">
                  لا يوجد information parentale disponible.
                </div>
              )}

              {/* Teachers List section */}
              <div className="p-4 bg-slate-950/40 border border-luxury-border/30 rounded-xl space-y-3">
                <h4 className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider">الأساتذة Rattachés</h4>
                <div className="flex flex-wrap gap-1.5">
                  {studentTeachers.length > 0 ? (
                    studentTeachers.map((t) => (
                      <span key={t._id} className="bg-brand-950/40 border border-brand-900/40 text-brand-300 px-3 py-1 rounded-lg text-xs font-semibold" title={t.user?.email}>
                        {t.user?.firstName} {t.user?.lastName} ({t.subjects?.join(', ')})
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-550 italic pl-0.5">لا يوجد أساتذة مرتبطون à cette section.</span>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-3 pt-3 border-t border-luxury-border/20">
                <button
                  onClick={() => {
                    setIsStudentDetailsOpen(false);
                    handleOpenEdit(selectedStudent.user);
                  }}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Edit2 className="w-4 h-4" />
                  تعديل le profil
                </button>
                <button
                  onClick={() => {
                    setIsStudentDetailsOpen(false);
                    setSelectedStudent(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Fermer
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Edit Class Modal */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4" dir="rtl" onClick={() => setEditingClass(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md glass-panel border border-luxury-border rounded-2xl p-6 space-y-4 text-right">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-luxury-border/40 pb-3">
              <Edit2 className="w-5 h-5 text-brand-400" /> تعديل القسم
            </h3>
            <form onSubmit={handleUpdateClass} className="space-y-3">
              <input
                type="text"
                required
                placeholder="اسم القسم"
                value={editingClass.name}
                onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-brand-500 focus:outline-none text-right"
              />
              <input
                type="text"
                placeholder="الوصف"
                value={editingClass.description}
                onChange={(e) => setEditingClass({ ...editingClass, description: e.target.value })}
                className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-brand-500 focus:outline-none text-right"
              />
              <select
                value={editingClass.level}
                onChange={(e) => setEditingClass({ ...editingClass, level: e.target.value })}
                className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
              >
                <option value="primary">ابتدائي</option>
                <option value="middle">متوسط</option>
                <option value="secondary">ثانوي</option>
              </select>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditingClass(null)} className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-luxury-border text-slate-300 hover:text-white font-bold text-xs transition-colors">إلغاء</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-colors">حفظ التعديلات</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4" dir="rtl" onClick={() => setEditingGroup(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md glass-panel border border-luxury-border rounded-2xl p-6 space-y-4 text-right">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-luxury-border/40 pb-3">
              <Edit2 className="w-5 h-5 text-brand-400" /> تعديل الفوج
            </h3>
            <form onSubmit={handleUpdateGroup} className="space-y-3">
              <input
                type="text"
                required
                placeholder="اسم الفوج"
                value={editingGroup.name}
                onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-brand-500 focus:outline-none text-right"
              />
              <select
                value={editingGroup.classId}
                onChange={(e) => setEditingGroup({ ...editingGroup, classId: e.target.value })}
                className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
              >
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="الطاقة الاستيعابية"
                value={editingGroup.capacity}
                onChange={(e) => setEditingGroup({ ...editingGroup, capacity: e.target.value })}
                className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-brand-500 focus:outline-none text-right"
              />
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditingGroup(null)} className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-luxury-border text-slate-300 hover:text-white font-bold text-xs transition-colors">إلغاء</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-colors">حفظ التعديلات</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Module Modal */}
      {editingModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4" dir="rtl" onClick={() => setEditingModule(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md glass-panel border border-luxury-border rounded-2xl p-6 space-y-4 text-right">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-luxury-border/40 pb-3">
              <Edit2 className="w-5 h-5 text-brand-400" /> تعديل المادة
            </h3>
            <form onSubmit={handleUpdateModule} className="space-y-3">
              <input
                type="text"
                required
                placeholder="اسم المادة"
                value={editingModule.name}
                onChange={(e) => setEditingModule({ ...editingModule, name: e.target.value })}
                className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-brand-500 focus:outline-none text-right"
              />
              <input
                type="text"
                placeholder="الوصف"
                value={editingModule.description}
                onChange={(e) => setEditingModule({ ...editingModule, description: e.target.value })}
                className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-brand-500 focus:outline-none text-right"
              />
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditingModule(null)} className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-luxury-border text-slate-300 hover:text-white font-bold text-xs transition-colors">إلغاء</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-colors">حفظ التعديلات</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
