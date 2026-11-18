const mongoose = require('mongoose');

const parentNoticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    noticeType: {
      type: String,
      enum: ['announcement', 'reminder', 'summons', 'reception', 'warning', 'general'],
      default: 'announcement', // إعلان، تذكير، استدعاء، موعد استقبال، تنبيه، رسالة عامة
    },
    targetAudience: {
      type: String,
      enum: ['all', 'cycle', 'class', 'specific_parents'],
      default: 'all',
    },
    targetCycle: {
      type: String,
      enum: ['primary', 'middle', 'secondary', ''],
      default: '',
    },
    targetClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
    },
    targetStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    targetParents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Parent',
      },
    ],
    sendType: {
      type: String,
      enum: ['immediate', 'scheduled'],
      default: 'immediate',
    },
    scheduledDate: {
      type: Date,
      default: null,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    // For appointment / meeting (موعد استقبال أو استدعاء)
    appointmentDate: {
      type: Date,
      default: null,
    },
    appointmentEndTime: {
      type: String,
      default: '',
      trim: true,
    },
    appointmentLocation: {
      type: String,
      default: 'مقر المؤسسة - قاعة الاستقبال',
      trim: true,
    },
    attachmentUrl: {
      type: String,
      default: '',
    },
    attachmentName: {
      type: String,
      default: '',
    },
    attachmentType: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sent', 'failed', 'cancelled'],
      default: 'sent',
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      default: 'إدارة مدرسة حبر',
    },
    sentAt: {
      type: Date,
      default: null,
    },
    recipientCount: {
      type: Number,
      default: 0,
    },
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

parentNoticeSchema.index({ status: 1, scheduledDate: 1 });
parentNoticeSchema.index({ targetAudience: 1, targetClass: 1 });
parentNoticeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ParentNotice', parentNoticeSchema);
