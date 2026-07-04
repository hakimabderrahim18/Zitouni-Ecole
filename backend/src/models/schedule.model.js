const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Timetable', 'Exam', 'Transport', 'Food'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true, // e.g. "Weekly Lunch Menu", "Line 3 Bus Schedule", "Math Final Exam"
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class', // Applicable if tied to a specific Grade
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group', // Applicable if tied to a specific Section
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true, // Structured data e.g. list of courses/hours/menus/stops
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

scheduleSchema.index({ type: 1, class: 1, group: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
