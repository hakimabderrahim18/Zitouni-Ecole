const SchoolSetting = require('../models/schoolSetting.model');
const fs = require('fs');
const path = require('path');

// GET /api/school-settings (Public)
const getSchoolSettings = async (req, res, next) => {
  try {
    const settings = await SchoolSetting.getSettings();
    res.status(200).json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

// PUT /api/school-settings (Protected: admin, school)
const updateSchoolSettings = async (req, res, next) => {
  try {
    let settings = await SchoolSetting.getSettings();

    const allowedFields = [
      'schoolNameArabic',
      'schoolNameFrench',
      'slogan',
      'institutionName',
      'location',
      'contactPhone',
      'primaryColor',
      'secondaryColor',
      'accentColor',
      'textColor',
      'titleFont',
      'bodyFont',
      'academicYear',
      'sessionTimeoutMinutes',
      'maxFailedLoginAttempts',
      'logoUrl',
      'headerBannerUrl',
      'carouselImages',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Paramètres et identité visuelle mis à jour avec succès',
      settings,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/school-settings/upload-asset (Protected: admin, school)
const uploadBrandingAsset = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Seules les images sont acceptées' });
    }

    const uploadsDir = path.join(__dirname, '../../uploads/branding');
    fs.mkdirSync(uploadsDir, { recursive: true });

    const safeName = `brand-${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    fs.writeFileSync(path.join(uploadsDir, safeName), req.file.buffer);

    const assetUrl = `/uploads/branding/${safeName}`;

    // Optionally assign directly if type specified
    const assetType = req.body.type; // 'logo', 'banner', or 'carousel'
    if (assetType === 'logo' || assetType === 'banner' || assetType === 'carousel') {
      const settings = await SchoolSetting.getSettings();
      if (assetType === 'logo') settings.logoUrl = assetUrl;
      if (assetType === 'banner') settings.headerBannerUrl = assetUrl;
      if (assetType === 'carousel') {
        settings.carouselImages.push({
          url: assetUrl,
          title: req.body.title || 'صورة من مرافق المؤسسة',
          subtitle: req.body.subtitle || '',
        });
      }
      await settings.save();
    }

    res.status(200).json({
      success: true,
      url: assetUrl,
      message: 'Fichier téléchargé avec succès',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSchoolSettings,
  updateSchoolSettings,
  uploadBrandingAsset,
};
