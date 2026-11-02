const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const mongoose = require('mongoose');
const BackupLog = require('../models/backupLog.model');

const BACKUP_DIR = path.join(__dirname, '../../backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Derive a secure 32-byte key
const getEncryptionKey = () => {
  const secret = process.env.BACKUP_SECRET || process.env.JWT_SECRET || 'zitouni_encre_pastel_master_key_2026';
  return crypto.createHash('sha256').update(secret).digest();
};

/**
 * Perform a full encrypted database backup
 */
const createEncryptedBackup = async (triggerType = 'Manual', userId = null) => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database connection is not ready for backup');
  }

  const db = mongoose.connection.db;
  const collections = await db.collections();
  const backupData = {
    metadata: {
      institution: 'مؤسسة التربية والتعليم حبر وألوان الخاصة (Groupe scolaire Encre & Pastel)',
      app: 'مدرسة حبر',
      exportedAt: new Date().toISOString(),
      version: '1.0',
    },
    collections: {},
  };

  let totalDocs = 0;
  let collectionsCount = 0;

  for (const col of collections) {
    const colName = col.collectionName;
    // Skip system and temporary collections
    if (colName.startsWith('system.')) continue;

    const docs = await col.find({}).toArray();
    backupData.collections[colName] = docs;
    totalDocs += docs.length;
    collectionsCount++;
  }

  const rawJson = JSON.stringify(backupData);
  const checksum = crypto.createHash('sha256').update(rawJson).digest('hex');

  // Compress with gzip
  const compressed = zlib.gzipSync(Buffer.from(rawJson, 'utf-8'));

  // Encrypt with AES-256-CBC
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encryptedPayload = Buffer.concat([iv, cipher.update(compressed), cipher.final()]);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-zitouni-${timestamp}.enc`;
  const filePath = path.join(BACKUP_DIR, filename);

  fs.writeFileSync(filePath, encryptedPayload);
  const sizeBytes = fs.statSync(filePath).size;

  const backupLog = await BackupLog.create({
    filename,
    filePath,
    sizeBytes,
    checksum,
    isEncrypted: true,
    encryptionAlgorithm: 'aes-256-cbc',
    collectionsCount,
    totalDocuments: totalDocs,
    status: 'Success',
    triggerType,
    createdBy: userId || undefined,
  });

  return backupLog;
};

/**
 * Verify and test restoration of a backup file (Art. 65)
 */
const verifyAndTestRestore = async (backupId) => {
  const backup = await BackupLog.findById(backupId);
  if (!backup) {
    throw new Error('Fiche de sauvegarde introuvable');
  }

  if (!fs.existsSync(backup.filePath)) {
    throw new Error(`Le fichier physique est introuvable sur le disque : ${backup.filename}`);
  }

  const encryptedBuffer = fs.readFileSync(backup.filePath);
  if (encryptedBuffer.length < 17) {
    throw new Error('Fichier de sauvegarde corrompu (taille invalide)');
  }

  // Extract IV and ciphertext
  const iv = encryptedBuffer.subarray(0, 16);
  const ciphertext = encryptedBuffer.subarray(16);

  // Decrypt
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const decryptedGzip = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  // Decompress
  const decompressedBuffer = zlib.gunzipSync(decryptedGzip);
  const rawJson = decompressedBuffer.toString('utf-8');

  // Verify SHA-256 Checksum
  const computedChecksum = crypto.createHash('sha256').update(rawJson).digest('hex');
  const checksumMatch = computedChecksum === backup.checksum;

  if (!checksumMatch) {
    throw new Error('Échec du test de restauration : La somme de contrôle SHA-256 ne correspond pas.');
  }

  // Validate JSON Structure & Collection counts
  const parsedData = JSON.parse(rawJson);
  const verifiedCollections = Object.keys(parsedData.collections || {});

  let sampleDocsTested = 0;
  for (const colName of verifiedCollections) {
    const docs = parsedData.collections[colName];
    if (Array.isArray(docs)) {
      sampleDocsTested += docs.length;
    }
  }

  const testResult = {
    valid: true,
    checksumMatch: true,
    computedChecksum,
    totalCollectionsVerified: verifiedCollections.length,
    totalDocumentsVerified: sampleDocsTested,
    collections: verifiedCollections,
    institution: parsedData.metadata?.institution,
    timestamp: new Date().toISOString(),
  };

  backup.restoreVerified = true;
  backup.restoreVerifiedAt = new Date();
  backup.restoreTestResult = testResult;
  await backup.save();

  return {
    success: true,
    backup,
    testResult,
  };
};

/**
 * Initialize automated daily backup cron / interval
 */
const initAutomatedBackups = () => {
  // Check once an hour if a daily backup is needed
  const ONE_HOUR = 60 * 60 * 1000;
  setInterval(async () => {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentBackup = await BackupLog.findOne({
        triggerType: 'Automated',
        createdAt: { $gte: oneDayAgo },
      });

      if (!recentBackup) {
        console.log('[BACKUP] Starting automated daily encrypted database backup...');
        const newBackup = await createEncryptedBackup('Automated');
        console.log(`[BACKUP] Automated backup created successfully: ${newBackup.filename} (${newBackup.sizeBytes} bytes)`);
        // Automatically verify restoration integrity
        await verifyAndTestRestore(newBackup._id);
        console.log(`[BACKUP] Automated restore verification completed for: ${newBackup.filename}`);
      }
    } catch (err) {
      console.error('[BACKUP] Automated backup error:', err.message);
    }
  }, ONE_HOUR);
};

module.exports = {
  createEncryptedBackup,
  verifyAndTestRestore,
  initAutomatedBackups,
  BACKUP_DIR,
};
