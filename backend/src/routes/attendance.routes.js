const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

router.use(protect);

// 1. Mark attendance (Supports /mark and /record-bulk)
router.post(
  '/mark',
  authorize('admin', 'school', 'teacher', 'general_supervisor', 'pedagogical_supervisor'),
  attendanceController.markAttendance
);
router.post(
  '/record-bulk',
  authorize('admin', 'school', 'teacher', 'general_supervisor', 'pedagogical_supervisor'),
  attendanceController.markAttendance
);

// 2. Class attendance
router.get(
  '/class/:classId',
  authorize('admin', 'school', 'teacher', 'general_supervisor', 'pedagogical_supervisor'),
  attendanceController.getClassAttendance
);

// 3. Student history
router.get(
  '/student/:studentId',
  authorize('admin', 'school', 'teacher', 'general_supervisor', 'pedagogical_supervisor', 'parent', 'student'),
  attendanceController.getStudentAttendanceHistory
);

// 4. Submit justification
router.post(
  '/:attendanceId/justify',
  authorize('admin', 'school', 'general_supervisor', 'pedagogical_supervisor', 'parent', 'student'),
  attendanceController.submitJustification
);

// 5. Review justification (Supervisor or Admin)
router.put(
  '/:attendanceId/review-justification',
  authorize('admin', 'school', 'general_supervisor', 'pedagogical_supervisor'),
  attendanceController.reviewJustification
);

// 6. Warnings list
router.get(
  '/warnings',
  authorize('admin', 'school', 'general_supervisor', 'pedagogical_supervisor', 'teacher'),
  attendanceController.getAbsenceWarnings
);

// 7. Resolve warning
router.put(
  '/warnings/:warningId/resolve',
  authorize('admin', 'school', 'general_supervisor', 'pedagogical_supervisor'),
  attendanceController.resolveAbsenceWarning
);

// 8. Today's stats
router.get(
  '/stats/today',
  authorize('admin', 'school', 'general_supervisor', 'pedagogical_supervisor', 'teacher'),
  attendanceController.getAttendanceTodayStats
);

// 9. Log WhatsApp Notification (Article 26)
router.post(
  '/:attendanceId/whatsapp-log',
  authorize('admin', 'school', 'general_supervisor', 'pedagogical_supervisor', 'teacher'),
  attendanceController.logWhatsAppNotification
);

// 10. Log Warning WhatsApp Notification (Article 26)
router.post(
  '/warning/:warningId/whatsapp-log',
  authorize('admin', 'school', 'general_supervisor', 'pedagogical_supervisor', 'teacher'),
  attendanceController.logWarningWhatsApp
);

// 11. Export Weekly/Monthly Attendance & Absence Report (Article 26)
router.get(
  '/export-report',
  authorize('admin', 'school', 'general_supervisor', 'pedagogical_supervisor', 'teacher'),
  attendanceController.exportAttendanceReport
);

module.exports = router;
