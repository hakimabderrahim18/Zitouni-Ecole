const express = require('express');
const {
  uploadCourse,
  deleteCourse,
  markAttendance,
  postAnnouncement,
  getAssignedStudents,
  getCourses,
  getAttendanceHistory,
  getAttendanceRecords,
  importAttendanceExcel,
  downloadContract,
} = require('../controllers/teacher.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

router.use(protect);
router.use(authorize('teacher'));

router.post('/courses', upload.single('file'), uploadCourse);
router.get('/courses', getCourses);
router.delete('/courses/:courseId', deleteCourse);
router.post('/attendance', markAttendance);
router.post('/attendance/import', upload.single('file'), importAttendanceExcel);
router.get('/attendance/history', getAttendanceHistory);
router.get('/attendance/records', getAttendanceRecords);
router.post('/announcements', postAnnouncement);
router.get('/classes/:classId/groups/:groupId/students', getAssignedStudents);
router.get('/document/contract', downloadContract);

module.exports = router;

