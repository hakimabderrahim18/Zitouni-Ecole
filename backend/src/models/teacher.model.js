const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    subjects: [
      {
        type: String,
        required: true,
      },
    ],
    classes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
      },
    ],
    groups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
      },
    ],
    bio: {
      type: String,
      default: '',
    },
    // Room (salle) assignments: which module is taught in which room
    assignments: [
      {
        module: { type: String, trim: true },
        room: { type: String, trim: true },
      },
    ],
    // Article 23: Staff and Teacher Professional Dossier Fields (المادة 23: الملف المهني)
    specialization: {
      type: String,
      trim: true,
      default: '',
    },
    cycle: {
      type: String,
      enum: ['primary', 'middle', 'secondary', 'all', 'ابتدائي', 'متوسط', 'ثانوي', 'الكل', ''],
      default: '',
    },
    hiringDate: {
      type: Date,
      default: null,
    },
    contractType: {
      type: String,
      default: 'CDI',
      trim: true,
    },
    contractDuration: {
      type: String,
      default: '1 سنة',
      trim: true,
    },
    contractStartDate: {
      type: Date,
      default: null,
    },
    contractEndDate: {
      type: Date,
      default: null,
    },
    baseSalary: {
      type: Number,
      default: 0,
    },
    assignedHours: {
      type: Number,
      default: 18,
    },
    assignedTasks: {
      type: String,
      default: 'تدريس، تنسيق بيداغوجي، متابعة الفروض والامتحانات',
    },
    professionalStatus: {
      type: String,
      enum: ['active', 'suspended', 'resigned', 'terminated'],
      default: 'active',
    },
    documents: [
      {
        title: { type: String, required: true },
        docType: {
          type: String,
          enum: [
            'cv',
            'diploma',
            'medicalCertificate',
            'idPhotos',
            'criminalRecord',
            'workContract',
            'experienceCert',
            'other',
          ],
          default: 'other',
        },
        fileUrl: { type: String, required: true },
        fileName: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now },
        verified: { type: Boolean, default: false },
        notes: { type: String, default: '' },
      },
    ],
    checklist: {
      cv: { type: Boolean, default: false },
      diploma: { type: Boolean, default: false },
      medicalCertificate: { type: Boolean, default: false },
      idPhotos: { type: Boolean, default: false },
      criminalRecord: { type: Boolean, default: false },
      workContract: { type: Boolean, default: false },
      experienceCert: { type: Boolean, default: false },
    },
    auditTrail: [
      {
        action: { type: String, required: true },
        details: { type: String, default: '' },
        performedBy: { type: String, default: 'الإدارة' },
        performedByRole: { type: String, default: 'admin' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Teacher', teacherSchema);
