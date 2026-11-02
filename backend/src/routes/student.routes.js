const express = require('express');
const {
  getCourses,
  getAnnouncements,
  getSchedules,
  getAttendance,
  getStudentEnrollmentInfo,
  submitStudentReEnrollment,
} = require('../controllers/student.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

router.use(protect);
router.use(authorize('student'));

router.get('/courses', getCourses);
router.get('/announcements', getAnnouncements);
router.get('/schedules', getSchedules);
router.get('/attendance', getAttendance);
router.get('/enrollment-info', getStudentEnrollmentInfo);
router.post('/re-enrollment', submitStudentReEnrollment);

module.exports = router;
