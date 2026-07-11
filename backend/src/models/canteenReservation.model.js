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
      enum: ['Déjeuner (Glaçé/Normal)', 'Snack / Goûter', 'Menu Régime Spécial'],
      default: 'Déjeuner (Glaçé/Normal)',
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Reserved', 'Served', 'Cancelled'],
      default: 'Reserved',
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

canteenReservationSchema.index({ date: 1, status: 1 });
canteenReservationSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('CanteenReservation', canteenReservationSchema);
