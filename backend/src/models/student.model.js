const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // National digitization identification number (رقم التعريف - الرقمنة)
    nationalIdDigitization: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    registrationNumber: {
      type: String,
      trim: true,
    },
    firstNameArabic: {
      type: String,
      trim: true,
      default: '',
    },
    lastNameArabic: {
      type: String,
      trim: true,
      default: '',
    },
    firstNameFrench: {
      type: String,
      trim: true,
      default: '',
    },
    lastNameFrench: {
      type: String,
      trim: true,
      default: '',
    },
    gender: {
      type: String,
      enum: ['ذكر', 'أنثى', 'male', 'female', 'M', 'F', ''],
      default: '',
    },
    dateOfBirth: {
      type: Date,
    },
    placeOfBirth: {
      type: String,
      default: '',
      trim: true,
    },
    academicYear: {
      type: String,
      default: '2026-2027',
      trim: true,
    },
    enrollmentType: {
      type: String,
      enum: ['new', 're-enrollment'],
      default: 'new',
    },
    previousClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
    },
    previousAcademicYear: {
      type: String,
      default: '',
      trim: true,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    registrationStatus: {
      type: String,
      enum: ['new', 'incomplete', 'under_review', 'accepted', 'rejected', 'waitlist'],
      default: 'accepted',
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
    },
    missingDocumentsNotes: {
      type: String,
      default: '',
      trim: true,
    },
    isWaitlisted: {
      type: Boolean,
      default: false,
    },
    waitlistRank: {
      type: Number,
      default: 0,
    },
    documentsSubmitted: {
      birthCertificate: { type: Boolean, default: false },
      photos: { type: Boolean, default: false },
      medicalCertificate: { type: Boolean, default: false },
      vaccinationRecord: { type: Boolean, default: false },
      schoolCertificate: { type: Boolean, default: false },
      signedCharter: { type: Boolean, default: false },
    },
    documentFiles: {
      birthCertificate: { type: String, default: '' },
      photos: { type: String, default: '' },
      medicalCertificate: { type: String, default: '' },
      vaccinationRecord: { type: String, default: '' },
      schoolCertificate: { type: String, default: '' },
      signedCharter: { type: String, default: '' },
    },
    documentReferences: {
      birthCertificate: { type: String, default: '' },
      photos: { type: String, default: '' },
      medicalCertificate: { type: String, default: '' },
      vaccinationRecord: { type: String, default: '' },
      schoolCertificate: { type: String, default: '' },
      signedCharter: { type: String, default: '' },
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parent',
    },
    studentPhone: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    bloodType: {
      type: String,
      default: '',
    },
    regime: {
      type: String,
      enum: ['externe', 'demi-pension', 'interne', 'خارجي', 'نصف داخلي', 'داخلي'],
      default: 'نصف داخلي',
    },
    tuitionPaid: {
      type: Boolean,
      default: true,
    },
    tuitionBaseAmount: {
      type: Number,
      default: 15000,
    },
    discountType: {
      type: String,
      enum: ['none', 'fratrie', 'staff', 'scholarship', 'custom'],
      default: 'none',
    },
    discountPercentage: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    discountReason: {
      type: String,
      default: '',
    },
    tuitionAmount: {
      type: Number,
      default: 15000,
    },
    receiptNumber: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    // Audit History log of every modification to the registration file (Page 15)
    auditHistory: [
      {
        action: { type: String, required: true },
        modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        modifiedByName: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
        details: { type: String, default: '' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index for academic querying
studentSchema.index({ class: 1, group: 1 });

module.exports = mongoose.model('Student', studentSchema);
