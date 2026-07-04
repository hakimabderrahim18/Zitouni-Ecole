const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parent',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'DZD',
    },
    type: {
      type: String,
      enum: ['Tuition', 'Transport', 'Food', 'Activity'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed'],
      default: 'Pending',
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Online', 'Cheque', 'Card', 'Bank Transfer', 'Mock'],
      default: 'Mock',
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    paidAt: {
      type: Date,
    },
    receiptUrl: {
      type: String, // Path to generated PDF file or Cloudinary link
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ parent: 1 });
paymentSchema.index({ student: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
