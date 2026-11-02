const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true, // e.g. 'CONVERSATION_AUDIT', 'BACKUP_CREATE', 'BACKUP_RESTORE_TEST', 'STUDENT_RECORD_ACCESS', 'ABSENCE_WARNING_ISSUED'
    },
    targetType: {
      type: String,
      required: true, // e.g. 'Conversation', 'Backup', 'Student', 'Settings'
    },
    targetId: {
      type: String,
      default: '',
    },
    reason: {
      type: String,
      default: '',
    },
    ipAddress: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ user: 1, action: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
