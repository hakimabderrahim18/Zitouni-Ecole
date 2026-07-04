const express = require('express');
const { getFeed, likePost, commentPost, createPost, uploadPostMedia } = require('../controllers/post.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

router.get('/', protect, getFeed);
router.post('/', protect, authorize('admin', 'school', 'teacher'), createPost);
router.post('/upload', protect, authorize('admin', 'school', 'teacher'), upload.single('file'), uploadPostMedia);
router.post('/:id/like', protect, likePost);
router.post('/:id/comment', protect, commentPost);

module.exports = router;
