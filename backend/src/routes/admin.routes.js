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
  getDocuments,
} = require('../controllers/admin.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

router.use(protect);

router.get('/classes', getClasses);
router.get('/groups', getGroups);
router.get('/modules', getModules);

router.use(authorize('admin', 'school'));

router.post('/users', createUser);
router.post('/users/bulk-import', upload.single('file'), bulkImportStudents);
router.post('/users/bulk-import/teachers', upload.single('file'), bulkImportTeachers);
router.post('/users/bulk-import/parents', upload.single('file'), bulkImportParents);
router.put('/users/:userId/toggle', toggleUserStatus);
router.get('/users', getUsers);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);
router.get('/parents', getParents);
router.get('/students', getStudents);
router.get('/teachers', getTeachers);
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

// Administrative documents (teacher contract / parent regulations)
router.get('/documents', getDocuments);
router.post('/documents', upload.single('file'), uploadDocument);

router.post('/schedules', createOrUpdateSchedule);
router.get('/schedules', getSchedules);
router.delete('/schedules/:scheduleId', deleteSchedule);

router.get('/dashboard/stats', getDashboardStats);

module.exports = router;
