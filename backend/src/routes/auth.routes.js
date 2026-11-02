const express = require('express');
const {
  login,
  refreshToken,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  deleteAccount,
} = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const { ensureCoreAccounts } = require('../autoSeed');
const { seedDatabase } = require('../seed');
const mongoose = require('mongoose');
const router = express.Router();

router.post('/login', login);
router.post('/refresh', refreshToken);
router.put('/profile', protect, updateProfile);
router.post('/profile/avatar', protect, upload.single('avatar'), uploadAvatar);
router.delete('/profile/avatar', protect, deleteAvatar);
router.delete('/account', protect, deleteAccount);

router.get('/seed', async (req, res) => {
  await ensureCoreAccounts();
  res.status(200).json({ message: 'Core accounts verified/seeded successfully.' });
});
router.post('/seed', async (req, res) => {
  await ensureCoreAccounts();
  res.status(200).json({ message: 'Core accounts verified/seeded successfully.' });
});

router.get('/seed-full', async (req, res) => {
  try {
    const result = await seedDatabase(false);
    res.status(200).json({ message: 'Full database seeded successfully.', ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/seed-full', async (req, res) => {
  try {
    const result = await seedDatabase(false);
    res.status(200).json({ message: 'Full database seeded successfully.', ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/db-status', async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const counts = {};
    for (const c of collections.sort((a, b) => a.name.localeCompare(b.name))) {
      counts[c.name] = await mongoose.connection.db.collection(c.name).countDocuments();
    }
    res.status(200).json({
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      counts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/version', (req, res) => {
  res.status(200).json({ version: '2.1.0-atlas-seed', time: new Date().toISOString() });
});

module.exports = router;
