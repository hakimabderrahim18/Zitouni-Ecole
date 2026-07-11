const mongoose = require('mongoose');

const receptionistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    deskNumber: {
      type: String,
      default: 'Accueil Principal - Réception',
    },
    workShift: {
      type: String,
      default: '07:30 - 16:30',
    },
  },
  {
    timestamps: true,
  }
);

receptionistSchema.index({ user: 1 });

module.exports = mongoose.model('Receptionist', receptionistSchema);
