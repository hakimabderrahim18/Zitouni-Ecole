const mongoose = require('mongoose');

// Administrative documents managed by the school administration and made
// available for download to a specific audience (teachers / parents / students / public).
const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: function () {
        if (this.type === 'teacher_contract') return 'عقد العمل (للأساتذة)';
        if (this.type === 'parent_regulations') return 'القانون الداخلي (للأولياء)';
        return this.originalName || 'مستند إداري';
      },
    },
    titleFrench: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    // Category / Target audience
    category: {
      type: String,
      enum: ['teachers', 'parents', 'students', 'all', 'administrative', 'other'],
      default: function () {
        if (this.type === 'teacher_contract') return 'teachers';
        if (this.type === 'parent_regulations') return 'parents';
        return 'all';
      },
    },
    // Optional system type slug for core documents ('teacher_contract', 'parent_regulations', or custom)
    type: {
      type: String,
      trim: true,
      default: function () {
        return `doc_${Date.now()}`;
      },
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      default: '',
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Document', documentSchema);
