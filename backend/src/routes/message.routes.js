const express = require('express');
const { getConversations, getMessageHistory, auditAllConversations, sendMessage, uploadAttachment, getContacts } = require('../controllers/message.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

router.use(protect);

router.post('/', sendMessage);
router.post('/upload', upload.single('file'), uploadAttachment);
router.get('/conversations', getConversations);
router.get('/contacts', getContacts);
router.get('/history/:otherUserId', getMessageHistory);
router.get('/audit', authorize('admin'), auditAllConversations);

module.exports = router;
