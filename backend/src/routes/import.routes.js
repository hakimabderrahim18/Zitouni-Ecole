const express = require('express');
const router = express.Router();
const { importStudentsExcel, downloadStudentTemplate } = require('../controllers/import.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload.middleware');

// Routes for Excel Import
router.post('/students-excel', protect, authorize('admin', 'school'), upload.single('file'), importStudentsExcel);
router.get('/students-template', protect, authorize('admin', 'school'), downloadStudentTemplate);

module.exports = router;
