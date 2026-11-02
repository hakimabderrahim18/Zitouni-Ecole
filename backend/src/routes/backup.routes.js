const express = require('express');
const {
  getBackups,
  triggerBackup,
  testRestoreBackup,
  downloadBackup,
} = require('../controllers/backup.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'school'));

router.get('/', getBackups);
router.post('/create', triggerBackup);
router.post('/verify/:id', testRestoreBackup);
router.get('/download/:id', downloadBackup);

module.exports = router;
