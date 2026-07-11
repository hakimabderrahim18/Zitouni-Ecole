const mongoose = require('mongoose');

const materialDamageSchema = new mongoose.Schema(
  {
    itemDescription: {
      type: String,
      required: true,
    },
    location: {
      type: String, // Class or room where damage occurred
      required: true,
    },
    estimatedCost: {
      type: Number,
      default: 0,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // pedagogical_supervisor or teacher
      required: true,
    },
    status: {
      type: String,
      enum: ['Reported', 'Reviewed by General Supervisor', 'Repaired', 'Archived'],
      default: 'Reported',
    },
    generalSupervisorRemarks: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

materialDamageSchema.index({ date: -1, status: 1 });

module.exports = mongoose.model('MaterialDamage', materialDamageSchema);
