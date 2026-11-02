const BackupLog = require('../models/backupLog.model');
const AuditLog = require('../models/auditLog.model');
const { createEncryptedBackup, verifyAndTestRestore } = require('../services/backup.service');
const fs = require('fs');

// List all backups with stats
const getBackups = async (req, res, next) => {
  try {
    const backups = await BackupLog.find()
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    const totalBackups = backups.length;
    const verifiedBackups = backups.filter((b) => b.restoreVerified).length;
    const lastBackup = backups[0] || null;

    res.status(200).json({
      backups,
      stats: {
        totalBackups,
        verifiedBackups,
        lastBackupAt: lastBackup ? lastBackup.createdAt : null,
        encryptionAlgorithm: 'AES-256-CBC (حماية وتشفير متقدم)',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create an immediate encrypted backup (Manual trigger)
const triggerBackup = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const backup = await createEncryptedBackup('Manual', userId);

    // Audit log
    await AuditLog.create({
      user: userId,
      action: 'BACKUP_CREATE',
      targetType: 'Backup',
      targetId: backup._id.toString(),
      reason: 'Création manuelle de sauvegarde chiffrée de la base de données',
      ipAddress: req.ip || '',
    });

    res.status(201).json({
      message: 'Sauvegarde chiffrée créée avec succès',
      backup,
    });
  } catch (error) {
    next(error);
  }
};

// Test restore and verify backup integrity (Art. 65)
const testRestoreBackup = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await verifyAndTestRestore(id);

    // Audit log
    await AuditLog.create({
      user: userId,
      action: 'BACKUP_RESTORE_TEST',
      targetType: 'Backup',
      targetId: id,
      reason: 'Test de conformité et de restauration de la sauvegarde (Art. 65)',
      ipAddress: req.ip || '',
      metadata: result.testResult,
    });

    res.status(200).json({
      message: 'Test de restauration et vérification d\'intégrité réussis avec succès',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// Download encrypted backup file
const downloadBackup = async (req, res, next) => {
  const { id } = req.params;

  try {
    const backup = await BackupLog.findById(id);
    if (!backup || !fs.existsSync(backup.filePath)) {
      return res.status(404).json({ message: 'Fichier de sauvegarde introuvable' });
    }

    res.download(backup.filePath, backup.filename);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBackups,
  triggerBackup,
  testRestoreBackup,
  downloadBackup,
};
