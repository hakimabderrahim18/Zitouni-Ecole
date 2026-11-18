const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const {
  createNotice,
  getAllNotices,
  getNoticeById,
  resendNotice,
  cancelNotice,
  deleteNotice,
  getParentNotices,
  markNoticeRead,
} = require('../controllers/parentNotice.controller');

// Admin endpoints
router.post(
  '/',
  protect,
  authorize('admin', 'school', 'general_supervisor'),
  createNotice
);
router.get(
  '/admin/all',
  protect,
  authorize('admin', 'school', 'general_supervisor'),
  getAllNotices
);
router.post(
  '/:id/resend',
  protect,
  authorize('admin', 'school', 'general_supervisor'),
  resendNotice
);
router.put(
  '/:id/cancel',
  protect,
  authorize('admin', 'school'),
  cancelNotice
);
router.delete(
  '/:id',
  protect,
  authorize('admin', 'school'),
  deleteNotice
);

// Parent endpoints
router.get(
  '/parent/my-notices',
  protect,
  authorize('parent'),
  getParentNotices
);
router.put(
  '/:id/read',
  protect,
  authorize('parent'),
  markNoticeRead
);

// Details by ID
router.get(
  '/:id',
  protect,
  getNoticeById
);

module.exports = router;
