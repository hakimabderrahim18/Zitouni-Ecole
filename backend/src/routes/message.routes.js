const express = require('express');
const {
  getConversations,
  getMessageHistory,
  auditAllConversations,
  auditConversationWithReason,
  sendMessage,
  uploadAttachment,
  getContacts,
  getGroupChannels,
  getGroupMessages,
  sendGroupMessage,
  reactToMessage,
  markMessageSeen,
  toggleHideMessage,
  deleteMessage,
  reportMessage,
  getReportedMessages,
  resolveReport,
} = require('../controllers/message.controller');
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

// Message Reactions & Seen Status with exact time (Art. 18)
router.post('/:messageId/react', reactToMessage);
router.post('/:messageId/seen', markMessageSeen);

// Message Moderation: Hide or Delete (Sender or Admin / General Supervisor)
router.patch('/:messageId/hide', authorize('admin', 'school', 'general_supervisor'), toggleHideMessage);
router.delete('/:messageId', deleteMessage);

// Message Reporting System (Art. 19)
router.post('/:messageId/report', reportMessage);
router.get('/reported', authorize('admin', 'school', 'general_supervisor'), getReportedMessages);
router.patch('/:messageId/reports/:reportId', authorize('admin', 'school', 'general_supervisor'), resolveReport);

// School group channels (Art. 18-19)
router.get('/groups', getGroupChannels);
router.get('/groups/:channelId', getGroupMessages);
router.post('/groups/:channelId', sendGroupMessage);

// Administrative Audits with Traceability
router.post('/audit/inspect', authorize('admin', 'school'), auditConversationWithReason);
router.get('/audit', authorize('admin', 'school'), auditAllConversations);

module.exports = router;
