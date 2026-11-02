const mongoose = require('mongoose');

const timetableEntrySchema = new mongoose.Schema(
  {
    academicYear: {
      type: String,
      default: '2025-2026',
      trim: true,
    },
    // Raw French day from RAN09.DBF: 'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi'
    day: {
      type: String,
      enum: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi'],
      required: true,
    },
    // Arabic translation: 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'
    dayArabic: {
      type: String,
      default: '',
    },
    // Raw Hour from RAN09: '8H30', '9H30', '10H30', '11H30', '13H30', '14H30', '15H30'
    hour: {
      type: String,
      required: true,
    },
    // Normalized time interval: '08:30 - 09:30', '09:30 - 10:30', etc.
    timeSlot: {
      type: String,
      default: '',
    },
    // Division code from RAN09: '1AM1', '2SE', '3M', etc.
    division: {
      type: String,
      required: true,
      trim: true,
    },
    // Arabic name for Division: '1 متوسط 1', '2 ثانوي علوم تجريبية', etc.
    divisionArabic: {
      type: String,
      default: '',
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
    },
    // Subject code from RAN09: 'MATHS', 'ARAB', 'PHYS', etc.
    subjectCode: {
      type: String,
      required: true,
      trim: true,
    },
    // Translated Arabic Subject: 'الرياضيات', 'اللغة العربية', etc.
    subjectName: {
      type: String,
      default: '',
    },
    // Teacher surname from RAN09: 'MAAROUF', 'AZIRA', etc.
    teacherName: {
      type: String,
      required: true,
      trim: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },
    room: {
      type: String,
      default: '',
      trim: true,
    },
    group: {
      type: String,
      default: '', // 'G1', 'G2', etc.
      trim: true,
    },
    modality: {
      type: String,
      default: 'CG', // 'CG' (Cours Général), 'TP', 'TD'
      trim: true,
    },
    regr: {
      type: String,
      default: '', // Regroupement code, e.g. '2ARAB-E'
      trim: true,
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

timetableEntrySchema.index({ academicYear: 1, day: 1, hour: 1, division: 1 });
timetableEntrySchema.index({ teacherName: 1, day: 1, hour: 1 });
timetableEntrySchema.index({ division: 1 });

module.exports = mongoose.model('TimetableEntry', timetableEntrySchema);
