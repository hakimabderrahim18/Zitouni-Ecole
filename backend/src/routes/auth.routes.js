const express = require('express');
const { login, refreshToken, updateProfile } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const { ensureCoreAccounts } = require('../autoSeed');
const router = express.Router();

router.post('/login', login);
router.post('/refresh', refreshToken);
router.put('/profile', protect, updateProfile);

router.get('/seed', async (req, res) => {
  await ensureCoreAccounts();
  res.status(200).json({ message: 'Core accounts verified/seeded successfully.' });
});
router.post('/seed', async (req, res) => {
  await ensureCoreAccounts();
  res.status(200).json({ message: 'Core accounts verified/seeded successfully.' });
});

router.get('/version', (req, res) => {
  res.status(200).json({ version: '2.0.0-seed-fix', time: new Date().toISOString() });
});

module.exports = router;
