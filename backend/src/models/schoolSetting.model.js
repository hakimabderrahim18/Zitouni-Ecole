const mongoose = require('mongoose');

const schoolSettingSchema = new mongoose.Schema(
  {
    schoolNameArabic: {
      type: String,
      default: 'مدرسة حبر',
      trim: true,
    },
    schoolNameFrench: {
      type: String,
      default: 'Groupe scolaire Encre & Pastel',
      trim: true,
    },
    slogan: {
      type: String,
      default: 'يا نشء أنت رجاؤنا',
      trim: true,
    },
    institutionName: {
      type: String,
      default: 'مؤسسة التربية والتعليم حبر وألوان الخاصة',
      trim: true,
    },
    location: {
      type: String,
      default: 'أولاد فايت - الجزائر غرب',
      trim: true,
    },
    contactPhone: {
      type: String,
      default: '0554075701',
      trim: true,
    },
    logoUrl: {
      type: String,
      default: '',
    },
    headerBannerUrl: {
      type: String,
      default: '',
    },
    carouselImages: [
      {
        url: { type: String, required: true },
        title: { type: String, default: '' },
        subtitle: { type: String, default: '' },
      },
    ],
    primaryColor: {
      type: String,
      default: '#7B1E3A', // Bordeaux Prestige Académique
    },
    secondaryColor: {
      type: String,
      default: '#F3E9DC', // Beige crème
    },
    accentColor: {
      type: String,
      default: '#C9A24D', // Or
    },
    textColor: {
      type: String,
      default: '#2B2022', // Texte chaud
    },
    titleFont: {
      type: String,
      default: 'Cormorant Garamond',
    },
    bodyFont: {
      type: String,
      default: 'Lato',
    },
    academicYear: {
      type: String,
      default: '2026-2027',
    },
    sessionTimeoutMinutes: {
      type: Number,
      default: 30,
    },
    maxFailedLoginAttempts: {
      type: Number,
      default: 4,
    },
  },
  {
    timestamps: true,
  }
);

// Helper static method to get or create settings singleton
schoolSettingSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('SchoolSetting', schoolSettingSchema);
