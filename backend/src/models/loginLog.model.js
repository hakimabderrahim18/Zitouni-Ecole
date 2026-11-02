const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    identifier: {
      type: String,
      required: true,
      trim: true,
    },
    userName: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      default: 'unknown',
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'LOCKED_5MIN', 'PERMANENTLY_LOCKED'],
      required: true,
    },
    failureReason: {
      type: String,
      default: '',
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    device: {
      type: String,
      default: 'Desktop',
    },
    browser: {
      type: String,
      default: 'Unknown',
    },
    os: {
      type: String,
      default: 'Unknown',
    },
  },
  {
    timestamps: true,
  }
);

loginLogSchema.index({ createdAt: -1 });
loginLogSchema.index({ user: 1, createdAt: -1 });
loginLogSchema.index({ status: 1 });
loginLogSchema.index({ role: 1 });

module.exports = mongoose.model('LoginLog', loginLogSchema);
