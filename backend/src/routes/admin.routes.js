const express = require('express');
const {
  createUser,
  bulkImportStudents,
  bulkImportTeachers,
  bulkImportParents,
  toggleUserStatus,
  createClass,
  createGroup,
  createOrUpdateSchedule,
  getDashboardStats,
  getClasses,
  getGroups,
  getParents,
  getUsers,
  getStudents,
  getTeachers,
  updateUser,
  deleteUser,
  createPayment,
  getSchedules,
  deleteSchedule,
  exportStudents,
  exportTeachers,
  exportParents,
  exportPayments,
  updateClass,
  deleteClass,
  updateGroup,
  deleteGroup,
  getModules,
  createModule,
  updateModule,
  deleteModule,
  uploadDocument,
  updateDocument,
  deleteDocument,
  getDocuments,
  createEnrollment,
  reEnrollStudent,
  updateEnrollmentStatus,
  getWaitlist,
  getStudentAuditHistory,
  uploadStudentDocument,
  getTeacherDossier,
  updateTeacherDossier,
  uploadTeacherDocument,
  deleteTeacherDocument,
  getTeachersTemplate,
  getWorkCertificate,
  getContractTemplate,
  recordTeacherResignation,
  getExpiringContracts,
} = require('../controllers/admin.controller');
const { getLoginLogs, unlockUserAccount } = require('../controllers/loginAudit.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

router.use(protect);

router.get('/classes', getClasses);
router.get('/groups', getGroups);
router.get('/modules', getModules);
router.get('/students', authorize('admin', 'school', 'general_supervisor', 'pedagogical_supervisor', 'receptionist', 'teacher'), getStudents);
router.get('/teachers', authorize('admin', 'school', 'general_supervisor', 'pedagogical_supervisor', 'receptionist', 'teacher'), getTeachers);
router.get('/parents', authorize('admin', 'school', 'general_supervisor', 'pedagogical_supervisor', 'receptionist', 'teacher'), getParents);

// Enrollment & Re-enrollment API (Form, Re-enrollment, Status, Waitlist, Doc Upload & History)
router.post('/enrollment', authorize('admin', 'school', 'general_supervisor', 'receptionist'), createEnrollment);
router.post('/re-enrollment', authorize('admin', 'school', 'general_supervisor', 'receptionist'), reEnrollStudent);
router.post('/students/upload-doc', authorize('admin', 'school', 'general_supervisor', 'receptionist', 'parent', 'student'), upload.single('file'), uploadStudentDocument);
router.put('/students/:id/enrollment-status', authorize('admin', 'school', 'general_supervisor', 'receptionist'), updateEnrollmentStatus);
router.get('/waitlist', authorize('admin', 'school', 'general_supervisor', 'receptionist'), getWaitlist);
router.get('/students/:id/audit-history', authorize('admin', 'school', 'general_supervisor', 'receptionist', 'parent', 'student'), getStudentAuditHistory);

// Login Audit Logs and Unlock Account (Accessible to Admin, School and General Supervisor)
router.get('/login-logs', authorize('admin', 'school', 'general_supervisor'), getLoginLogs);
router.get('/login-audit', authorize('admin', 'school', 'general_supervisor'), getLoginLogs);
router.post('/users/:userId/unlock', authorize('admin', 'school', 'general_supervisor'), unlockUserAccount);

router.get('/dashboard/stats', authorize('admin', 'school', 'general_supervisor'), getDashboardStats);

router.use(authorize('admin', 'school'));

// Article 23 & 24: Teacher & Staff Professional Dossiers, Contracts & Certificates
router.get('/teachers/template', getTeachersTemplate);
router.get('/teachers/expiring-contracts', getExpiringContracts);
router.get('/teachers/:id/dossier', getTeacherDossier);
router.put('/teachers/:id/dossier', updateTeacherDossier);
router.get('/teachers/:id/work-certificate', getWorkCertificate);
router.get('/teachers/:id/contract-template', getContractTemplate);
router.post('/teachers/:id/resignation', recordTeacherResignation);
router.post('/teachers/:id/documents', upload.single('file'), uploadTeacherDocument);
router.delete('/teachers/:id/documents/:docId', deleteTeacherDocument);

router.post('/users', createUser);
router.post('/users/bulk-import', upload.single('file'), bulkImportStudents);
router.post('/users/bulk-import/teachers', upload.single('file'), bulkImportTeachers);
router.post('/users/bulk-import/parents', upload.single('file'), bulkImportParents);
router.put('/users/:userId/toggle', toggleUserStatus);
router.get('/users', getUsers);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);
router.post('/payments', createPayment);

// Excel exports
router.get('/export/students', exportStudents);
router.get('/export/teachers', exportTeachers);
router.get('/export/parents', exportParents);
router.get('/export/payments', exportPayments);

router.post('/classes', createClass);
router.put('/classes/:classId', updateClass);
router.delete('/classes/:classId', deleteClass);
router.post('/groups', createGroup);
router.put('/groups/:groupId', updateGroup);
router.delete('/groups/:groupId', deleteGroup);

// Modules (school subjects)
router.post('/modules', createModule);
router.put('/modules/:moduleId', updateModule);
router.delete('/modules/:moduleId', deleteModule);

// Administrative documents (teacher contract / parent regulations / general administrative PDFs)
router.get('/documents', getDocuments);
router.post('/documents', upload.single('file'), uploadDocument);
router.put('/documents/:id', upload.single('file'), updateDocument);
router.delete('/documents/:id', deleteDocument);

router.post('/schedules', createOrUpdateSchedule);
router.get('/schedules', getSchedules);
router.delete('/schedules/:scheduleId', deleteSchedule);

module.exports = router;
