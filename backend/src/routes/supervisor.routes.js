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
  approveExitPass,
  rejectExitPass,
  getExitPasses,
  getCanteenRecipes,
  createCanteenRecipe,
  toggleDeliverCanteenRecipe,
  updateCanteenRecipe,
  deleteCanteenRecipe,
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

// Canteen Reservations & Recipes Delivery Management
router.post('/canteen', createCanteenReservation);
router.get('/canteen/recipes', authorize('general_supervisor', 'pedagogical_supervisor', 'admin', 'school'), getCanteenRecipes);
router.post('/canteen/recipes', authorize('general_supervisor', 'pedagogical_supervisor', 'admin', 'school'), createCanteenRecipe);
router.put('/canteen/recipes/:id/deliver', authorize('general_supervisor', 'pedagogical_supervisor', 'admin', 'school'), toggleDeliverCanteenRecipe);
router.put('/canteen/recipes/:id', authorize('general_supervisor', 'pedagogical_supervisor', 'admin', 'school'), updateCanteenRecipe);
router.delete('/canteen/recipes/:id', authorize('general_supervisor', 'pedagogical_supervisor', 'admin', 'school'), deleteCanteenRecipe);

// Class assignment to Pedagogical Supervisor
router.post('/assign-classes', authorize('general_supervisor', 'admin', 'school'), assignClassesToSupervisor);

// Student Exit Pass issuance and management (Autorisations de sortie)
router.get('/exit-passes', authorize('general_supervisor', 'pedagogical_supervisor', 'admin', 'school'), getExitPasses);
router.post('/exit-pass', authorize('pedagogical_supervisor', 'general_supervisor', 'admin', 'school'), createExitPass);
router.put('/exit-pass/:id/approve', authorize('general_supervisor', 'pedagogical_supervisor', 'admin', 'school'), approveExitPass);
router.put('/exit-pass/:id/reject', authorize('general_supervisor', 'pedagogical_supervisor', 'admin', 'school'), rejectExitPass);

module.exports = router;
