const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    teachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
      },
    ],
    capacity: {
      type: Number,
      default: 30,
    },
    // Fixed modules (subjects) taught in this group
    modules: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Ensure unique group names within the same Class
groupSchema.index({ name: 1, class: 1 }, { unique: true });

module.exports = mongoose.model('Group', groupSchema);
