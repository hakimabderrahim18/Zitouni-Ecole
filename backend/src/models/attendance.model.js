const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },
    date: {
      type: Date,
      required: true,
    },
    session: {
      type: String,
      default: 'Daily', // 'Daily', '08:30-09:30', '09:30-10:30', etc.
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Excused', 'Unexcused', 'ExitPass'],
      default: 'Present',
      required: true,
    },
    // Minutes late if status is 'Late'
    lateMinutes: {
      type: Number,
      default: 0,
    },
    // Justification details (Articles 25, 26)
    justificationReason: {
      type: String,
      default: '',
    },
    justificationAttachmentUrl: {
      type: String,
      default: '',
    },
    justificationStatus: {
      type: String,
      enum: ['None', 'Pending', 'Approved', 'Rejected'],
      default: 'None',
    },
    justifiedAt: {
      type: Date,
      default: null,
    },
    justifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    remarks: {
      type: String,
      default: '',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Threshold & Notification tracking (Article 26: WhatsApp & Parent Notification)
    warningThresholdTriggered: {
      type: Boolean,
      default: false,
    },
    warningLetterGenerated: {
      type: Boolean,
      default: false,
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
    notificationChannel: {
      type: String,
      enum: ['None', 'WhatsApp', 'App', 'Both'],
      default: 'None',
    },
    notificationStatus: {
      type: String,
      enum: ['Pending', 'Sent', 'Delivered', 'Read'],
      default: 'Pending',
    },
    whatsappSentAt: {
      type: Date,
      default: null,
    },
    // Automatic Exit Pass link (Article 28)
    exitPassRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExitPass',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast querying
attendanceSchema.index({ student: 1, date: 1, session: 1 }, { unique: true });
attendanceSchema.index({ class: 1, date: 1 });
attendanceSchema.index({ student: 1, status: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
