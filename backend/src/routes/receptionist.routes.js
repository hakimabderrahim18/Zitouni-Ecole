const express = require('express');
const router = express.Router();
const {
  getReceptionistDashboardStats,
  recordVisitorCheckIn,
  recordVisitorCheckOut,
  verifyExitPass,
} = require('../controllers/receptionist.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

router.use(protect);
router.use(authorize('receptionist', 'admin', 'school'));

router.get('/dashboard', getReceptionistDashboardStats);
router.post('/visitors', recordVisitorCheckIn);
router.put('/visitors/:id/checkout', recordVisitorCheckOut);
router.put('/exit-pass/:id/verify', verifyExitPass);

module.exports = router;
