const mongoose = require('mongoose');

const absenceWarningSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parent',
      default: null,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    warningLevel: {
      type: Number,
      default: 1, // 1 for 3 absences, 2 for 6 absences, etc.
    },
    absenceCount: {
      type: Number,
      required: true,
      default: 3,
    },
    absenceDates: [
      {
        type: Date,
      },
    ],
    issueDate: {
      type: Date,
      default: Date.now,
    },
    appointmentDate: {
      type: Date,
      default: null, // Optional appointment date for parent to attend
    },
    status: {
      type: String,
      enum: ['Pending', 'Delivered', 'Resolved', 'Dismissed'],
      default: 'Pending',
    },
    whatsappSentAt: {
      type: Date,
      default: null,
    },
    whatsappStatus: {
      type: String,
      enum: ['None', 'Sent', 'Delivered', 'Read'],
      default: 'None',
    },
    messageArabic: {
      type: String,
      default: 'نحيطكم علماً بأن التلميذ قد استنفد ثلاث (03) غيابات غير مبررة، وعليه يرجى التقرب من الإدارة التربوية في أقرب وقت لتسوية الوضعية.',
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

absenceWarningSchema.index({ student: 1, status: 1 });
absenceWarningSchema.index({ class: 1, issueDate: -1 });

module.exports = mongoose.model('AbsenceWarning', absenceWarningSchema);
