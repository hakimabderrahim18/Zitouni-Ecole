const mongoose = require('mongoose');

const backupLogSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    sizeBytes: {
      type: Number,
      required: true,
    },
    checksum: {
      type: String,
      required: true, // SHA-256 integrity hash of decrypted contents
    },
    isEncrypted: {
      type: Boolean,
      default: true, // AES-256-CBC
    },
    encryptionAlgorithm: {
      type: String,
      default: 'aes-256-cbc',
    },
    collectionsCount: {
      type: Number,
      default: 0,
    },
    totalDocuments: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Success', 'Failed'],
      default: 'Success',
    },
    triggerType: {
      type: String,
      enum: ['Automated', 'Manual'],
      default: 'Manual',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Test of restoration (Art. 65)
    restoreVerified: {
      type: Boolean,
      default: false,
    },
    restoreVerifiedAt: {
      type: Date,
    },
    restoreTestResult: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

backupLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BackupLog', backupLogSchema);
