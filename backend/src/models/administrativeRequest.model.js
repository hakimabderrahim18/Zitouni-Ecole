const mongoose = require('mongoose');

const administrativeRequestSchema = new mongoose.Schema(
  {
    trackingNumber: {
      type: String,
      unique: true,
      required: true, // e.g. "REQ-2026-0042"
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    applicantName: {
      type: String,
      default: '',
    },
    applicantRole: {
      type: String,
      enum: ['parent', 'teacher', 'student'],
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student', // Linked child if request is made by a parent
    },
    studentName: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: [
        'school_certificate', // شهادة مدرسية
        'appointment', // طلب موعد مقابلة
        'complaint', // شكوى أو تظلم
        'grade_transcript', // كشف نقاط
        'other', // طلب إداري آخر
      ],
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Nouveau', 'En cours', 'Répondu', 'Clôturé'],
      default: 'Nouveau',
    },
    preferredDate: {
      type: Date, // For appointments
    },
    responseMessage: {
      type: String,
      default: '',
    },
    responseAttachmentUrl: {
      type: String,
      default: '', // Official generated PDF certificate or response document
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

administrativeRequestSchema.index({ applicant: 1, createdAt: -1 });
administrativeRequestSchema.index({ status: 1 });

module.exports = mongoose.model('AdministrativeRequest', administrativeRequestSchema);
