const express = require('express');
const {
  getLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  toggleHomeworkStatus,
  signAdministrativeVisa,
  uploadAttachment,
} = require('../controllers/lessonNotebook.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

router.use(protect);

router.get('/', getLessons);
router.post(
  '/',
  authorize('teacher'),
  createLesson
);
router.put(
  '/:id',
  authorize('teacher', 'admin', 'school'),
  updateLesson
);
router.delete(
  '/:id',
  authorize('teacher', 'admin', 'school'),
  deleteLesson
);

// Student marks homework as done
router.post('/:id/homework-toggle', authorize('student'), toggleHomeworkStatus);

// Official Inspection Visa (Page 20)
router.post(
  '/:id/visa',
  authorize('admin', 'school', 'general_supervisor', 'pedagogical_supervisor'),
  signAdministrativeVisa
);

// File attachment upload
router.post('/upload', upload.single('file'), uploadAttachment);

module.exports = router;
