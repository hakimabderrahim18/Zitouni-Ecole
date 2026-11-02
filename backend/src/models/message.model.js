const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    conversationType: {
      type: String,
      enum: ['direct', 'group'],
      default: 'direct',
    },
    // For direct 1-to-1 conversations
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: function () {
        return this.conversationType === 'direct';
      },
    },
    // For school group / class discussions (Art. 18)
    groupChannelId: {
      type: String,
      default: '', // e.g. "group_class_1AM1", "group_teachers", "group_parents_1AM1"
      required: function () {
        return this.conversationType === 'group';
      },
    },
    groupType: {
      type: String,
      enum: ['class', 'class_parents', 'teachers', 'supervisors', 'administration', 'other'],
      default: 'class',
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
    },
    groupTitle: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      required: function () {
        return !this.attachmentUrl;
      },
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
      default: Date.now,
    },
    readAt: {
      type: Date,
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
    attachmentUrl: {
      type: String,
      default: '',
    },
    attachmentName: {
      type: String,
      default: '',
    },
    mediaType: {
      type: String,
      enum: ['none', 'image', 'video', 'pdf', 'audio', 'file'],
      default: 'none',
    },
    // Quote / Reply to a specific previous message
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    // Emoji Reactions (Art. 18: التفاعل بالرموز التعبيرية)
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        emoji: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Read / Seen tracking with exact timestamp (Art. 18: نظام المشاهدة والاطلاع)
    seenBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        seenAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Moderation: Hide or Delete by Admin / Platform Responsible
    isHidden: {
      type: Boolean,
      default: false,
    },
    hiddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    hiddenAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    // Reporting system (Art. 19: التبليغ عن الرسائل المخالفة)
    isReported: {
      type: Boolean,
      default: false,
    },
    reports: [
      {
        reporter: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        reason: {
          type: String,
          required: true,
        },
        details: {
          type: String,
          default: '',
        },
        status: {
          type: String,
          enum: ['pending', 'reviewed', 'action_taken', 'dismissed'],
          default: 'pending',
        },
        reportedAt: {
          type: Date,
          default: Date.now,
        },
        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          default: null,
        },
        reviewedAt: {
          type: Date,
          default: null,
        },
      },
    ],
    // Privacy & Administrative Audit Trail (Art. 18-19)
    auditLogs: [
      {
        auditedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        auditedAt: {
          type: Date,
          default: Date.now,
        },
        reason: {
          type: String,
          default: 'Vérification administrative autorisée',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ groupChannelId: 1, createdAt: -1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
