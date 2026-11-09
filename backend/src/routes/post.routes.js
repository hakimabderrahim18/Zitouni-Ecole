const express = require('express');
const {
  getFeed,
  getPostViewersAnalytics,
  confirmAnnouncementRead,
  createPost,
  likePost,
  reactToPost,
  editPost,
  toggleHidePost,
  commentPost,
  replyToComment,
  deleteComment,
  toggleHideComment,
  banUserFromComments,
  togglePinPost,
  toggleCommentsLock,
  deletePost,
  uploadPostMedia,
} = require('../controllers/post.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

router.use(protect);

// 1. Feed
router.get('/', getFeed);

// 2. Create Post
router.post(
  '/',
  authorize('admin', 'school', 'teacher', 'general_supervisor', 'pedagogical_supervisor'),
  createPost
);

// 3. Upload Multi-media (photos, videos, PDFs, docs)
router.post(
  '/upload',
  authorize('admin', 'school', 'teacher', 'general_supervisor', 'pedagogical_supervisor'),
  upload.any(),
  uploadPostMedia
);

// 4. Who Viewed Post Analytics (Art. 15 & 16)
router.get('/:id/analytics', getPostViewersAnalytics);

// 5. Read Confirmation ("اطلعت على الإعلان" - Art. 16)
router.post('/:id/confirm-read', confirmAnnouncementRead);

// 6. Like & Rich Reactions (Art. 14: أعجبني / أحببته / لم يعجبني)
router.post('/:id/like', likePost);
router.post('/:id/react', reactToPost);

// 7. Comments & Replies
router.post('/:id/comment', commentPost);
router.post('/:id/comments/:commentId/reply', replyToComment);
router.delete('/:id/comments/:commentId', deleteComment);
router.patch('/:id/comments/:commentId/hide', toggleHideComment);

// 8. Post Moderation (Edit, Hide, Pin, Lock Comments, Delete, Ban User)
router.put('/:id', editPost);
router.patch('/:id/hide', toggleHidePost);
router.post('/:id/ban-user', authorize('admin', 'school', 'general_supervisor', 'pedagogical_supervisor', 'teacher'), banUserFromComments);
router.put(
  '/:id/pin',
  authorize('admin', 'school', 'teacher', 'general_supervisor', 'pedagogical_supervisor'),
  togglePinPost
);
router.put(
  '/:id/lock-comments',
  authorize('admin', 'school', 'teacher', 'general_supervisor', 'pedagogical_supervisor'),
  toggleCommentsLock
);
router.delete(
  '/:id',
  authorize('admin', 'school', 'teacher', 'general_supervisor', 'pedagogical_supervisor'),
  deletePost
);

module.exports = router;
