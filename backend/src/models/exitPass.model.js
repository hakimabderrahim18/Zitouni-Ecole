const mongoose = require('mongoose');

const exitPassSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
    },
    reason: {
      type: String,
      required: true,
    },
    exitTime: {
      type: String,
      required: true,
    },
    accompaniedBy: {
      type: String,
      default: 'Parent / Tuteur',
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Used', 'Rejected'],
      default: 'Approved',
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // pedagogical_supervisor or admin
      required: true,
    },
    verifiedByReceptionist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
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

exitPassSchema.index({ date: -1, status: 1 });
exitPassSchema.index({ student: 1 });

module.exports = mongoose.model('ExitPass', exitPassSchema);
