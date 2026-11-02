const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    fatherNameArabic: {
      type: String,
      trim: true,
      default: '',
    },
    fatherNameFrench: {
      type: String,
      trim: true,
      default: '',
    },
    fatherPhone: {
      type: String,
      trim: true,
      default: '',
    },
    motherNameArabic: {
      type: String,
      trim: true,
      default: '',
    },
    motherNameFrench: {
      type: String,
      trim: true,
      default: '',
    },
    motherPhone: {
      type: String,
      trim: true,
      default: '',
    },
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    profession: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Parent', parentSchema);
