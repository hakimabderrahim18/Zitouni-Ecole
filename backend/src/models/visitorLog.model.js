const mongoose = require('mongoose');

const visitorLogSchema = new mongoose.Schema(
  {
    visitorName: {
      type: String,
      required: true,
      trim: true,
    },
    visitorPhone: {
      type: String,
      required: true,
      trim: true,
    },
    visitorIdCard: {
      type: String,
      trim: true,
      default: '',
    },
    visitType: {
      type: String,
      enum: ['Parent', 'Inspection Pédagogique', 'Livraison / Matériel', 'Inscription', 'Autre'],
      default: 'Parent',
    },
    purpose: {
      type: String,
      required: true,
    },
    personToVisit: {
      type: String,
      default: 'Administration',
    },
    checkInTime: {
      type: Date,
      default: Date.now,
    },
    checkOutTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['In School', 'Departed'],
      default: 'In School',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

visitorLogSchema.index({ date: -1 });
visitorLogSchema.index({ status: 1 });

module.exports = mongoose.model('VisitorLog', visitorLogSchema);
