const mongoose = require('mongoose');

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
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
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
      enum: ['school', 'teacher', 'admin'],
      required: true,
    },
    isGlobal: {
      type: Boolean,
      default: false,
    },
    targetClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
    },
    targetGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
    },
    attachmentUrl: {
      type: String,
      default: '',
    },
    mediaType: {
      type: String,
      enum: ['', 'image', 'video', 'file'],
      default: '',
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    views: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    comments: [commentSchema],
  },
  {
    timestamps: true,
  }
);

announcementSchema.index({ targetClass: 1, targetGroup: 1 });
announcementSchema.index({ isGlobal: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);
