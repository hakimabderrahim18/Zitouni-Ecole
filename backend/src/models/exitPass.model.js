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
      default: 'Pending',
    },
    requestedByParent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // pedagogical_supervisor or general_supervisor or admin
      required: false,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
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
exitPassSchema.index({ student: 1, date: -1 });
exitPassSchema.index({ requestedByParent: 1 });

module.exports = mongoose.model('ExitPass', exitPassSchema);

