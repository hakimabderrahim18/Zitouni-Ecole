const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    subject: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true, // URL from Cloudinary
    },
    fileName: {
      type: String,
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group', // Can be null if published globally to the whole Class
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

courseSchema.index({ class: 1, group: 1 });
courseSchema.index({ teacher: 1 });

module.exports = mongoose.model('Course', courseSchema);
