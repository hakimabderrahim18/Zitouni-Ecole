const mongoose = require('mongoose');

// Reply schema for threaded discussion (Art. 14: الرد على الردود)
const replySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userRole: {
    type: String,
    default: '',
  },
  content: {
    type: String,
    required: true,
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  hiddenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Comment schema (Art. 14: التعليقات والردود)
const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userRole: {
    type: String,
    default: '',
  },
  content: {
    type: String,
    required: true,
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  hiddenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  replies: [replySchema],
});

// Attachment schema (Art. 11: عدة مرفقات - صور، فيديوهات، PDF، وثائق)
const attachmentSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    default: '',
  },
  fileType: {
    type: String,
    enum: ['image', 'video', 'pdf', 'document', 'audio', 'file'],
    default: 'file',
  },
  size: {
    type: Number,
    default: 0,
  },
});

// View tracking schema (Art. 15: « من شاهد المنشور؟ » - أول وآخر مشاهدة)
const viewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  firstViewedAt: {
    type: Date,
    default: Date.now,
  },
  lastViewedAt: {
    type: Date,
    default: Date.now,
  },
  viewCount: {
    type: Number,
    default: 1,
  },
});

// Read confirmation schema (Art. 16: تأكيد الاطلاع « اطلعت على الإعلان »)
const confirmationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  confirmedAt: {
    type: Date,
    default: Date.now,
  },
});

const announcementSchema = new mongoose.Schema(
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
    publisher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    publisherRole: {
      type: String,
      enum: ['admin', 'school', 'teacher', 'general_supervisor', 'pedagogical_supervisor'],
      required: true,
    },
    // Target Audience (Art. 12: تحديد الجمهور بدقة)
    targetAudience: {
      type: String,
      enum: ['all', 'admin_only', 'teachers', 'parents', 'students', 'supervisors', 'level', 'class', 'group'],
      default: 'all',
    },
    // Level targeting (ابتدائي / متوسط / ثانوي)
    targetLevel: {
      type: String,
      enum: ['', 'primary', 'middle', 'secondary'],
      default: '',
    },
    // Backwards compatibility
    isGlobal: {
      type: Boolean,
      default: true,
    },
    targetClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
    },
    targetGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },
    // Multi-attachments (Art. 11)
    attachments: [attachmentSchema],
    // Pedagogical links
    pedagogicalLinks: [
      {
        title: { type: String, default: '' },
        url: { type: String, required: true },
      },
    ],
    // Backwards compatibility for single media
    attachmentUrl: {
      type: String,
      default: '',
    },
    mediaType: {
      type: String,
      enum: ['', 'image', 'video', 'file', 'pdf'],
      default: '',
    },
    // Features (Art. 13)
    isPinned: {
      type: Boolean,
      default: false,
    },
    commentsLocked: {
      type: Boolean,
      default: false,
    },
    scheduledPublishAt: {
      type: Date,
      default: null,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    // Important Announcements (Art. 16: إعلان هام يتطلب تأكيد الاطلاع)
    isImportant: {
      type: Boolean,
      default: false,
    },
    confirmations: [confirmationSchema],
    // Post visibility moderation (Art. 14)
    isHidden: {
      type: Boolean,
      default: false,
    },
    hiddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    hiddenAt: {
      type: Date,
    },
    // Users banned from commenting on this post
    bannedUsersFromComments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Legacy single like support
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Rich Reactions (Art. 14: أعجبني / أحببته / لم يعجبني)
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        type: {
          type: String,
          enum: ['like', 'love', 'dislike'],
          default: 'like',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Views analytics (Art. 15: من شاهد المنشور)
    views: [viewSchema],
    comments: [commentSchema],
  },
  {
    timestamps: true,
  }
);

announcementSchema.index({ targetAudience: 1, targetClass: 1, targetGroup: 1 });
announcementSchema.index({ isPinned: -1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
