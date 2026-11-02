const express = require('express');
const {
  createRequest,
  getRequests,
  getRequestByTrackingNumber,
  updateRequestStatus,
  uploadAttachment,
} = require('../controllers/administrativeRequest.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

router.use(protect);

router.post('/', createRequest);
router.get('/', getRequests);
router.get('/track/:trackingNumber', getRequestByTrackingNumber);
router.put('/:id', authorize('admin', 'school'), updateRequestStatus);
router.post('/upload', authorize('admin', 'school'), upload.single('file'), uploadAttachment);

module.exports = router;
