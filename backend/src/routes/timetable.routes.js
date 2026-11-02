const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetable.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload.middleware');

router.use(protect);

// 1. Import Timetable from Excel / DBF
router.post(
  '/import-excel',
  authorize('admin', 'school'),
  upload.single('file'),
  timetableController.importTimetableExcel
);

// 2. Metadata / Filters (available divisions, teachers, subjects, hours)
router.get('/metadata', timetableController.getTimetableMetadata);

// 3. User's own timetable (Student or Teacher)
router.get('/my-timetable', timetableController.getMyTimetable);

// 4. Timetable by Division (Class)
router.get('/division/:division', timetableController.getTimetableByDivision);

// 5. Timetable by Teacher
router.get('/teacher/:teacherName', timetableController.getTimetableByTeacher);

// 6. Timetable by Room
router.get('/room/:room', timetableController.getTimetableByRoom);

// 7. Child timetable (for Parent)
router.get('/child/:studentId', authorize('admin', 'school', 'parent'), timetableController.getChildTimetable);

// 8. Administrative Clear
router.delete('/clear', authorize('admin', 'school'), timetableController.clearTimetable);

// 9. Manual Entry CRUD (Add, Edit, Delete)
router.post('/entries', authorize('admin', 'school'), timetableController.createTimetableEntry);
router.put('/entries/:id', authorize('admin', 'school'), timetableController.updateTimetableEntry);
router.delete('/entries/:id', authorize('admin', 'school'), timetableController.deleteTimetableEntry);

module.exports = router;
