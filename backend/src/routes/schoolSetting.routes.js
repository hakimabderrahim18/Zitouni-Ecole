const express = require('express');
const router = express.Router();
const {
  getSchoolSettings,
  updateSchoolSettings,
  uploadBrandingAsset,
} = require('../controllers/schoolSetting.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload.middleware');

// Public route to read current branding settings
router.get('/', getSchoolSettings);

// Protected routes to modify settings
router.put('/', protect, authorize('admin', 'school'), updateSchoolSettings);
router.post('/upload-asset', protect, authorize('admin', 'school'), upload.single('file'), uploadBrandingAsset);

module.exports = router;
