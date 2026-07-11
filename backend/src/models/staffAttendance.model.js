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
      enum: ['Present', 'Absent', 'Late', 'Excused'],
      required: true,
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
