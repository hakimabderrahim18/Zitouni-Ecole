const mongoose = require('mongoose');

// Administrative documents managed by the school administration and made
// available for download to a specific audience (teachers / parents).
const documentSchema = new mongoose.Schema(
  {
    // 'teacher_contract' => عقد عمل  |  'parent_regulations' => القانون الداخلي
    type: {
      type: String,
      enum: ['teacher_contract', 'parent_regulations'],
      required: true,
      unique: true,
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
