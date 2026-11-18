const mongoose = require('mongoose');

const studentAssessmentRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  studentUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  grade: {
    type: Number,
    min: 0,
    max: 20,
    default: null,
  },
  isAbsent: {
    type: Boolean,
    default: false,
  },
  individualRemark: {
    type: String,
    trim: true,
    default: '',
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  publishedAt: {
    type: Date,
    default: null,
  },
});

const assessmentAuditSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true, // 'create_draft', 'auto_save', 'submit_to_admin', 'under_review', 'approve', 'return', 'publish', 'unpublish', 'edit'
  },
  by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  byName: {
    type: String,
    default: '',
  },
  at: {
    type: Date,
    default: Date.now,
  },
  details: {
    type: String,
    default: '',
  },
});

const assessmentSchema = new mongoose.Schema(
  {
    academicYear: {
      type: String,
      default: '2026-2027',
      trim: true,
    },
    cycle: {
      type: String,
      enum: ['primary', 'middle', 'secondary', 'ابتدائي', 'متوسط', 'ثانوي'],
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    teacherUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assessmentType: {
      type: String,
      required: true,
      trim: true, // 'الفرض الأول', 'الفرض الثاني', 'التقويم المستمر', 'اختبار الثلاثي الأول', etc.
    },
    assessmentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    maxGrade: {
      type: Number,
      default: 20,
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'under_review', 'approved', 'returned'],
      default: 'draft',
    },
    returnReason: {
      type: String,
      default: '',
      trim: true,
    },
    classRemark: {
      type: String,
      default: '',
      trim: true,
    },
    records: [studentAssessmentRecordSchema],
    // Independent Publishing Decision
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    publishScope: {
      type: String,
      enum: ['none', 'general', 'partial', 'individual'],
      default: 'none',
    },
    scheduledPublishAt: {
      type: Date,
      default: null,
    },
    isAutoPublishExecuted: {
      type: Boolean,
      default: false,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    history: [assessmentAuditSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes for fast querying & duplicate checking
assessmentSchema.index({ class: 1, subject: 1, assessmentType: 1, assessmentDate: 1 });
assessmentSchema.index({ teacher: 1, status: 1 });
assessmentSchema.index({ status: 1, isPublished: 1 });

module.exports = mongoose.model('Assessment', assessmentSchema);
