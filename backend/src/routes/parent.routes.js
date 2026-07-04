const express = require('express');
const {
  getChildren,
  getChildAttendance,
  getChildSchedules,
  getPayments,
  payBill,
  downloadReceipt,
  downloadRegulations,
} = require('../controllers/parent.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

// protect session
router.use(protect);

router.get('/children', authorize('parent'), getChildren);
router.get('/children/:studentId/attendance', authorize('parent'), getChildAttendance);
router.get('/children/:studentId/schedules', authorize('parent'), getChildSchedules);
router.get('/payments', authorize('parent'), getPayments);
router.post('/payments/pay', authorize('parent'), payBill);

// Internal regulations document download (القانون الداخلي)
router.get('/document/regulations', authorize('parent'), downloadRegulations);

// Receipt download can be triggered from client with token authentication
router.get('/payments/receipts/:paymentId', downloadReceipt);

module.exports = router;
