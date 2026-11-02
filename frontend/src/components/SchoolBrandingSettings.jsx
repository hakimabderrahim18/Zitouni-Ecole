import React, { useState, useEffect, useRef } from 'react';
import { useSchoolStore } from '../store/useSchoolStore';
import { Palette, Image as ImageIcon, Save, RefreshCw, CheckCircle, Upload, Sparkles, Building, Phone, MapPin, Trash2, Plus, Sliders } from 'lucide-react';
import { motion } from 'framer-motion';
import { DEFAULT_CAROUSEL_SLIDES } from './SchoolImageCarousel';

export default function SchoolBrandingSettings() {
  const { settings, fetchSettings, updateSettings, uploadAsset, isLoading } = useSchoolStore();

  const [formData, setFormData] = useState({
    schoolNameArabic: '',
    schoolNameFrench: '',
    slogan: '',
    institutionName: '',
    location: '',
    contactPhone: '',
    primaryColor: '#F4B400',
    secondaryColor: '#1E293B',
    academicYear: '2026-2027',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [carouselSlides, setCarouselSlides] = useState([]);
  const [newSlideUrl, setNewSlideUrl] = useState('');
  const [newSlideTitle, setNewSlideTitle] = useState('');
  const [newSlideSubtitle, setNewSlideSubtitle] = useState('');
  const [carouselUploadLoading, setCarouselUploadLoading] = useState(false);
  const carouselFileInputRef = useRef(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setFormData({
        schoolNameArabic: settings.schoolNameArabic || 'مدرسة حبر',
        schoolNameFrench: settings.schoolNameFrench || 'Groupe scolaire Encre & Pastel',
        slogan: settings.slogan || 'يا نشء أنت رجاؤنا',
        institutionName: settings.institutionName || 'مؤسسة التربية والتعليم حبر وألوان الخاصة',
        location: settings.location || 'أولاد فايت - الجزائر غرب',
        contactPhone: settings.contactPhone || '0554075701',
        primaryColor: settings.primaryColor || '#F4B400',
        secondaryColor: settings.secondaryColor || '#1E293B',
        academicYear: settings.academicYear || '2026-2027',
      });
      if (settings.logoUrl) setLogoPreview(settings.logoUrl);
      if (settings.headerBannerUrl) setBannerPreview(settings.headerBannerUrl);
      setCarouselSlides(
        settings.carouselImages && settings.carouselImages.length > 0
          ? settings.carouselImages
          : DEFAULT_CAROUSEL_SLIDES
      );
    }
  }, [settings]);

  const handleLogoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    try {
      // 1. Upload logo if changed
      if (logoFile) {
        await uploadAsset(logoFile, 'logo');
        setLogoFile(null);
      }

      // 2. Upload banner if changed
      if (bannerFile) {
        await uploadAsset(bannerFile, 'banner');
        setBannerFile(null);
      }

      // 3. Update settings text, colors, and carousel images
      await updateSettings({ ...formData, carouselImages: carouselSlides });
      setSuccessMsg('تم حفظ وتطبيق الهوية البصرية وصور المعرض بنجاح!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ الهوية البصرية');
    }
  };

  const handleAddCarouselSlide = () => {
    if (!newSlideUrl.trim()) return;
    setCarouselSlides([
      ...carouselSlides,
      {
        url: newSlideUrl.trim(),
        title: newSlideTitle.trim() || 'صورة من مرافق المؤسسة',
        subtitle: newSlideSubtitle.trim() || 'مؤسسة التربية والتعليم حبر وألوان الخاصة',
        badge: 'مدرسة حبر',
      },
    ]);
    setNewSlideUrl('');
    setNewSlideTitle('');
    setNewSlideSubtitle('');
  };

  const handleUploadCarouselFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setCarouselUploadLoading(true);
      const url = await uploadAsset(file, 'carousel');
      if (url) {
        setCarouselSlides([
          ...carouselSlides,
          {
            url,
            title: newSlideTitle.trim() || file.name.replace(/\.[^/.]+$/, ''),
            subtitle: newSlideSubtitle.trim() || 'صورة جديدة أضيفت للمعرض',
            badge: 'مدرسة حبر',
          },
        ]);
        setNewSlideTitle('');
        setNewSlideSubtitle('');
      }
    } catch (err) {
      alert('فشل في رفع الصورة: ' + err.message);
    } finally {
      setCarouselUploadLoading(false);
    }
  };

  const handleRemoveCarouselSlide = (idx) => {
    if (carouselSlides.length <= 1) {
      alert('يجب الإبقاء على صورة واحدة على الأقل بالمعرض.');
      return;
    }
    setCarouselSlides(carouselSlides.filter((_, i) => i !== idx));
  };

  const handleResetCarouselToDefaults = () => {
    if (window.confirm('هل تريد استرجاع باقة الصور الافتراضية عالية الدقة للمؤسسة؟')) {
      setCarouselSlides(DEFAULT_CAROUSEL_SLIDES);
    }
  };

  const quickColorPresets = ['#F4B400', '#2563EB', '#10B981', '#8B5CF6', '#EC4899', '#D97706'];

  return (
    <div className="space-y-8 font-cairo" dir="rtl">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 glass-panel rounded-2xl border border-luxury-border">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg"
            style={{
              backgroundColor: `${formData.primaryColor}15`,
              borderColor: `${formData.primaryColor}30`,
              color: formData.primaryColor,
            }}
          >
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">إدارة الهوية البصرية والرموز الرسمية</h2>
            <p className="text-xs text-slate-400">
              تغيير اسم البرنامج والشعار الرسمي واللوغو والألوان مباشرة من لوحة الإدارة دون إعادة برمجة
            </p>
          </div>
        </div>

        {/* Live Badge */}
        <div
          className="px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 self-stretch sm:self-auto justify-center"
          style={{
            borderColor: `${formData.primaryColor}40`,
            backgroundColor: `${formData.primaryColor}10`,
            color: formData.primaryColor,
          }}
        >
          <Sparkles className="w-4 h-4" />
          <span>{formData.schoolNameArabic || 'مدرسة حبر'} — نشطة</span>
        </div>
      </div>

      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold flex items-center gap-2"
        >
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </motion.div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Official Identifiers */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-luxury-border space-y-6">
          <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-luxury-border/30 pb-3">
            <Building className="w-4 h-4 text-brand-500" />
            <span>بيانات التسمية الرسمية (المادة 3 من دفتر الشروط)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                اسم البرنامج بالعربية (اسم المنصة)
              </label>
              <input
                type="text"
                required
                value={formData.schoolNameArabic}
                onChange={(e) => setFormData({ ...formData, schoolNameArabic: e.target.value })}
                placeholder="مثال: مدرسة حبر"
                className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-500 font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                اسم المؤسسة بالعربية
              </label>
              <input
                type="text"
                required
                value={formData.institutionName}
                onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                placeholder="مثال: مؤسسة التربية والتعليم حبر وألوان الخاصة"
                className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                الشعار الرسمي المعتمد للمؤسسة
              </label>
              <input
                type="text"
                required
                value={formData.slogan}
                onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                placeholder="مثال: يا نشء أنت رجاؤنا"
                className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-3 text-xs text-brand-400 focus:outline-none focus:border-brand-500 font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                التسمية باللغة الفرنسية (Nom Français)
              </label>
              <input
                type="text"
                required
                value={formData.schoolNameFrench}
                onChange={(e) => setFormData({ ...formData, schoolNameFrench: e.target.value })}
                placeholder="Groupe scolaire Encre & Pastel"
                dir="ltr"
                className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-500 font-outfit"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                الموقع الجغرافي للمؤسسة
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="أولاد فايت - الجزائر غرب"
                className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                هاتف أمانة وسكرتارية المؤسسة (للدعم واسترجاع الحسابات)
              </label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="0554075701"
                dir="ltr"
                className="w-full bg-slate-900 border border-luxury-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Colors and Palette */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-luxury-border space-y-6">
          <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-luxury-border/30 pb-3">
            <Palette className="w-4 h-4 text-brand-500" />
            <span>الألوان الرسمية للمنصة</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Color */}
            <div className="p-4 bg-slate-950/50 rounded-2xl border border-luxury-border space-y-4">
              <label className="text-xs font-bold text-slate-300 block">اللون الأساسي المميز (Primary Accent)</label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-14 h-14 rounded-2xl cursor-pointer bg-transparent border-0 p-1"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="bg-slate-900 border border-luxury-border rounded-xl px-4 py-2 text-xs font-mono text-white focus:outline-none uppercase w-28 text-center"
                />
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 block font-semibold">ألوان سريعة مقترحة :</span>
                <div className="flex items-center gap-2">
                  {quickColorPresets.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setFormData({ ...formData, primaryColor: c })}
                      className="w-7 h-7 rounded-xl border border-white/20 transition-transform hover:scale-110"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="p-4 bg-slate-950/50 rounded-2xl border border-luxury-border flex flex-col justify-center items-center text-center space-y-2">
              <span className="text-[10px] text-slate-400 font-bold block mb-2">معاينة حية لشارة المؤسسة</span>
              <div
                className="px-5 py-2.5 rounded-2xl border shadow-lg flex items-center gap-3 transition-colors"
                style={{
                  backgroundColor: `${formData.primaryColor}15`,
                  borderColor: `${formData.primaryColor}40`,
                }}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: formData.primaryColor }}
                />
                <span className="text-sm font-black text-white">{formData.schoolNameArabic || 'مدرسة حبر'}</span>
                <span className="text-xs font-bold" style={{ color: formData.primaryColor }}>
                  « {formData.slogan || 'يا نشء أنت رجاؤنا'} »
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Logo and Header Banners */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-luxury-border space-y-6">
          <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-luxury-border/30 pb-3">
            <ImageIcon className="w-4 h-4 text-brand-500" />
            <span>لوغو المؤسسة وصور الواجهة</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Upload */}
            <div className="p-4 bg-slate-950/50 rounded-2xl border border-luxury-border space-y-4 text-center">
              <span className="text-xs font-bold text-slate-300 block text-right">لوغو المؤسسة الرسمي</span>
              <div className="w-28 h-28 mx-auto rounded-2xl border border-luxury-border bg-slate-900 flex items-center justify-center overflow-hidden p-2">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain" />
                ) : (
                  <Building className="w-10 h-10 text-slate-600" />
                )}
              </div>
              <label className="cursor-pointer py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-2 border border-luxury-border">
                <Upload className="w-4 h-4 text-brand-500" />
                <span>رفع لوغو جديد</span>
                <input type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
              </label>
            </div>

            {/* Banner Upload */}
            <div className="p-4 bg-slate-950/50 rounded-2xl border border-luxury-border space-y-4 text-center">
              <span className="text-xs font-bold text-slate-300 block text-right">صورة خلفية الواجهة (Banner)</span>
              <div className="w-full h-28 rounded-2xl border border-luxury-border bg-slate-900 flex items-center justify-center overflow-hidden">
                {bannerPreview ? (
                  <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-600 text-xs">لا توجد صورة بنر مخصصة</span>
                )}
              </div>
              <label className="cursor-pointer py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-2 border border-luxury-border">
                <Upload className="w-4 h-4 text-brand-500" />
                <span>رفع صورة بنر جديدة</span>
                <input type="file" accept="image/*" onChange={handleBannerSelect} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* Section 4: Image Carousel Gallery */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-luxury-border space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-luxury-border/30 pb-3">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brand-500" />
              <span>معرض صور واجهة المؤسسة (Carrousel d'images)</span>
            </h3>
            <button
              type="button"
              onClick={handleResetCarouselToDefaults}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold underline"
            >
              استرجاع الصور الافتراضية
            </button>
          </div>

          <p className="text-xs text-slate-400">
            يمكنك إضافة وحذف وتعديل الصور المعروضة في شريط الصور المتحرك بالصفحة الرئيسية وصفحة تسجيل الدخول، لتعكس مرافق وأنشطة مدرسة حبر.
          </p>

          {/* Add Slide Panel */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-luxury-border space-y-4">
            <p className="text-xs font-bold text-brand-400 flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>إضافة صورة جديدة إلى المعرض</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  عنوان الصورة (Titre)
                </label>
                <input
                  type="text"
                  value={newSlideTitle}
                  onChange={(e) => setNewSlideTitle(e.target.value)}
                  placeholder="مثال: فضاءات التعليم ومخابر العلوم"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-luxury-border rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  الوصف المختصر (Sous-titre)
                </label>
                <input
                  type="text"
                  value={newSlideSubtitle}
                  onChange={(e) => setNewSlideSubtitle(e.target.value)}
                  placeholder="مثال: بيئة بيداغوجية ملهمة ومجهزة"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-luxury-border rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400">
                رابط الصورة عبر الإنترنت (URL) أو رفع ملف صورة من جهازك
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={newSlideUrl}
                  onChange={(e) => setNewSlideUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="flex-1 px-3 py-2.5 bg-slate-900 border border-luxury-border rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddCarouselSlide}
                    disabled={!newSlideUrl.trim()}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-slate-950 rounded-xl text-xs font-bold transition-all shrink-0"
                  >
                    إضافة بالرابط
                  </button>

                  <button
                    type="button"
                    onClick={() => carouselFileInputRef.current?.click()}
                    disabled={carouselUploadLoading}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-luxury-border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5 text-brand-500" />
                    <span>{carouselUploadLoading ? 'جاري الرفع...' : 'رفع من الجهاز'}</span>
                  </button>
                  <input
                    ref={carouselFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadCarouselFile}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Current Carousel Slides List */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-300 block">
              الصور المعروضة حالياً ({carouselSlides.length} صور) :
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {carouselSlides.map((slide, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-950/60 border border-luxury-border flex items-center gap-3 relative group/item hover:border-brand-500/30 transition-all"
                >
                  <img
                    src={slide.url}
                    alt={slide.title}
                    className="w-20 h-16 object-cover rounded-xl shrink-0 border border-luxury-border bg-slate-900"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs font-bold text-white truncate">{slide.title}</p>
                    <p className="text-[10px] text-slate-400 truncate">{slide.subtitle}</p>
                    <span className="text-[9px] font-mono text-brand-400 block">شريحة #{idx + 1}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCarouselSlide(idx)}
                    className="p-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    title="حذف هذه الصورة من المعرض"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="py-3.5 px-8 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-950 font-black text-xs transition-all flex items-center gap-2 shadow-lg shadow-brand-500/20"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>حفظ وتطبيق التغييرات فوراً</span>
          </button>
        </div>
      </form>
    </div>
  );
}
