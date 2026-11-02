const mongoose = require('mongoose');

const canteenReservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mealType: {
      type: String,
      default: 'Lunch',
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Reserved', 'Served', 'Cancelled'],
      default: 'Reserved',
    },
    isPaid: {
      type: Boolean,
      default: true,
    },
    remarks: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

canteenReservationSchema.index({ date: 1, status: 1 });
canteenReservationSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('CanteenReservation', canteenReservationSchema);
