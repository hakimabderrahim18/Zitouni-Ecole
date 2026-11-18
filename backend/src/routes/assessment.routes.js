const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const {
  getMyAssignedClassesAndSubjects,
  getTeacherAssessments,
  getAssessmentById,
  saveAssessment,
  submitAssessmentToAdmin,
  getAllAssessments,
  reviewAssessment,
  controlPublishing,
  getAssessmentStatistics,
  exportReportCardPDF,
  exportReportCardExcel,
  getParentChildrenResults,
  getMyResults,
  deleteAssessment,
} = require('../controllers/assessment.controller');

// Teacher routes
router.get(
  '/teacher/assigned',
  protect,
  authorize('teacher', 'admin', 'school'),
  getMyAssignedClassesAndSubjects
);
router.get(
  '/teacher/my-assessments',
  protect,
  authorize('teacher'),
  getTeacherAssessments
);
router.post(
  '/save',
  protect,
  authorize('teacher', 'admin', 'school'),
  saveAssessment
);
router.put(
  '/:id/submit',
  protect,
  authorize('teacher'),
  submitAssessmentToAdmin
);

// Admin & Manager routes
router.get(
  '/admin/all',
  protect,
  authorize('admin', 'school', 'general_supervisor'),
  getAllAssessments
);
router.put(
  '/admin/:id/review',
  protect,
  authorize('admin', 'school'),
  reviewAssessment
);
router.put(
  '/admin/:id/publish',
  protect,
  authorize('admin', 'school'),
  controlPublishing
);
router.get(
  '/admin/statistics',
  protect,
  authorize('admin', 'school', 'general_supervisor', 'pedagogical_supervisor'),
  getAssessmentStatistics
);
router.delete(
  '/:id',
  protect,
  authorize('admin', 'school'),
  deleteAssessment
);

// Export & Print routes
router.get(
  '/:id/export/pdf',
  protect,
  exportReportCardPDF
);
router.get(
  '/:id/export/excel',
  protect,
  authorize('admin', 'school', 'teacher', 'general_supervisor'),
  exportReportCardExcel
);

// Parent & Student Access routes
router.get(
  '/parent/children-results',
  protect,
  authorize('parent'),
  getParentChildrenResults
);
router.get(
  '/student/my-results',
  protect,
  authorize('student'),
  getMyResults
);

// Details by ID (teacher, admin, supervisor)
router.get(
  '/:id',
  protect,
  getAssessmentById
);

module.exports = router;
