const mongoose = require('mongoose');

const staffAttendanceSchema = new mongoose.Schema(
  {
    staffUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['teacher', 'general_supervisor', 'pedagogical_supervisor', 'receptionist', 'admin', 'school'],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Excused', 'ExitDuringWork', 'Leave', 'Holiday'],
      required: true,
    },
    remarks: {
      type: String,
      default: '',
    },
    // Article 27: Substitute teacher when teacher is absent (البدائل عند غياب الأستاذ)
    substituteTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    substituteRemarks: {
      type: String,
      default: '',
    },
    exitTime: {
      type: String,
      default: '',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Track if automated financial deduction was generated
    deductionApplied: {
      type: Boolean,
      default: false,
    },
    deductionAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index to ensure one attendance record per staff per date
staffAttendanceSchema.index({ staffUser: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('StaffAttendance', staffAttendanceSchema);
