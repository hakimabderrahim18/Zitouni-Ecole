const express = require('express');
const router = express.Router();
const {
  getSupervisorDashboardStats,
  recordStaffAttendance,
  recordMaterialDamage,
  updateMaterialDamage,
  createCanteenReservation,
  assignClassesToSupervisor,
  createExitPass,
} = require('../controllers/supervisor.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

router.use(protect);

// Dashboard info
router.get('/dashboard', authorize('general_supervisor', 'pedagogical_supervisor', 'admin', 'school'), getSupervisorDashboardStats);

// Staff Attendance & Automated Deduction
router.post('/staff-attendance', authorize('general_supervisor', 'pedagogical_supervisor', 'admin', 'school'), recordStaffAttendance);

// Material Damage Reports
router.post('/damage', authorize('pedagogical_supervisor', 'general_supervisor', 'teacher', 'admin', 'school'), recordMaterialDamage);
router.put('/damage/:id', authorize('general_supervisor', 'admin', 'school'), updateMaterialDamage);

// Canteen Reservations
router.post('/canteen', createCanteenReservation);

// Class assignment to Pedagogical Supervisor
router.post('/assign-classes', authorize('general_supervisor', 'admin', 'school'), assignClassesToSupervisor);

// Student Exit Pass issuance
router.post('/exit-pass', authorize('pedagogical_supervisor', 'general_supervisor', 'admin', 'school'), createExitPass);

module.exports = router;
