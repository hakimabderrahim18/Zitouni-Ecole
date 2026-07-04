const express = require('express');
const { login, refreshToken, updateProfile } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const router = express.Router();

router.post('/login', login);
router.post('/refresh', refreshToken);
router.put('/profile', protect, updateProfile);

module.exports = router;
