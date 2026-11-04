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

router.get('/update-avatars', async (req, res) => {
  try {
    const User = require('../models/user.model');
    const AVATAR_MAP = {
      admin: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80',
      school: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400&q=80',
      'superviseur.gen': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80',
      'superviseur.ped': 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=400&h=400&q=80',
      receptionniste: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80',
      'teacher.math': 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&h=400&q=80',
      'teacher.science': 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&w=400&h=400&q=80',
      'teacher.arabe': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&h=400&q=80',
      'teacher.physique': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80',
      'teacher.francais': 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&h=400&q=80',
      'teacher.histoire': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80',
      'parent.meziane': 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&h=400&q=80',
      'parent.belaid': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80',
      'parent.toumi': 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&h=400&q=80',
      'parent.amrani': 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=400&h=400&q=80',
      'parent.slimani': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&h=400&q=80',
      'parent.zerrouki': 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&h=400&q=80',
      'student.yanis': 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&h=400&q=80',
      'student.leila': 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=400&h=400&q=80',
      'student.layla': 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=400&h=400&q=80',
      'student.meriem': 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&h=400&q=80',
      'student.amin': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&h=400&q=80',
      'student.amine': 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&h=400&q=80',
      'student.samir': 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&h=400&q=80',
      'student.lynda': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80',
      'student.riad': 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&h=400&q=80',
      'student.feriel': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&h=400&q=80',
      'student.anis': 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&h=400&q=80',
      'student.kenza': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&h=400&q=80',
      'student.bilal': 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=400&h=400&q=80',
      'student.yasmine': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80',
      'student.sarah': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&h=400&q=80',
      'student.mehdi': 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=400&h=400&q=80',
      'student.ines': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80',
    };

    const ROLE_FALLBACKS = {
      admin: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80',
      school: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400&q=80',
      general_supervisor: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80',
      pedagogical_supervisor: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=400&h=400&q=80',
      receptionist: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80',
      teacher: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&h=400&q=80',
      parent: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&h=400&q=80',
      student: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&h=400&q=80',
    };

    const users = await User.find();
    let updated = 0;
    for (const u of users) {
      const targetPic = AVATAR_MAP[u.username] || ROLE_FALLBACKS[u.role] || ROLE_FALLBACKS.student;
      u.profilePic = targetPic;
      await u.save();
      updated++;
    }
    res.status(200).json({ message: `Avatars updated successfully for ${updated} users.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
