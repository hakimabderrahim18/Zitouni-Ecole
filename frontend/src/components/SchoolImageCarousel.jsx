import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Sparkles, Image as ImageIcon, Plus, Trash2, Edit3, X, Check, Upload, ExternalLink } from 'lucide-react';
import { useSchoolStore } from '../store/useSchoolStore';
import { useAuthStore } from '../store/useAuthStore';
import SchoolLogo from './SchoolLogo';

// High-definition curated default educational photographs
export const DEFAULT_CAROUSEL_SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1400&q=85',
    title: 'فضاءات تعليمية عصرية ومحفزة',
    subtitle: 'قاعات تدريس مجهزة بأحدث السبورات الذكية والوسائط التفاعلية للأطوار الثلاثة',
    badge: 'بيئة بيداغوجية متطورة',
  },
  {
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1400&q=85',
    title: 'مخابر علمية وتجريبية متقدمة',
    subtitle: 'تجارب تطبيقية في الفيزياء والكيمياء والعلوم الطبيعية لتحضير متميز للبكالوريا',
    badge: 'تجريب وبحث علمي',
  },
  {
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1400&q=85',
    title: 'فضاء المطالعة ومصادر المعرفة',
    subtitle: 'مكتبة شاملة وقاعات مذاكرة هادئة لتنمية حب القراءة والتعلم الذاتي',
    badge: 'ثقافة ومطالعة',
  },
  {
    url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1400&q=85',
    title: 'نوادي الروبوتيك والذكاء الاصطناعي',
    subtitle: 'ورشات أسبوعية لاكتشاف البرمجة والعلوم التكنولوجية ومسابقات الابتكار',
    badge: 'تكنولوجيا المستقبل',
  },
  {
    url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=85',
    title: 'يا نشء أنت رجاؤنا',
    subtitle: 'مؤسسة التربية والتعليم حبر وألوان الخاصة — رعاية متكاملة تصنع التفوق',
    badge: 'مدرسة حبر • أولاد فايت',
  },
];

export default function SchoolImageCarousel({ className = '', height = 'h-[440px] md:h-[540px]' }) {
  const { settings, updateSettings, uploadAsset } = useSchoolStore();
  const { user } = useAuthStore();
  const primaryColor = settings?.primaryColor || '#7B1E3A';

  // Determine slides: custom from settings or fallback defaults
  const customSlides = settings?.carouselImages && settings.carouselImages.length > 0 ? settings.carouselImages : null;
  const slides = customSlides || DEFAULT_CAROUSEL_SLIDES;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  // Manage modal local state
  const [editableSlides, setEditableSlides] = useState([]);
  const [newSlideUrl, setNewSlideUrl] = useState('');
  const [newSlideTitle, setNewSlideTitle] = useState('');
  const [newSlideSubtitle, setNewSlideSubtitle] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const fileInputRef = useRef(null);

  // Auto-advance slides every 5.5 seconds unless paused
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5500);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, slides.length]);

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleSelectSlide = (idx) => {
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
  };

  // Open manage modal
  const handleOpenManageModal = () => {
    setEditableSlides(slides.map((s) => ({ ...s })));
    setSaveStatus('');
    setIsManageModalOpen(true);
  };

  // Save updated slides to school settings in backend
  const handleSaveSlides = async () => {
    try {
      setSaveStatus('saving');
      await updateSettings({ carouselImages: editableSlides });
      setSaveStatus('success');
      setTimeout(() => {
        setIsManageModalOpen(false);
        setSaveStatus('');
      }, 900);
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const handleRemoveSlide = (idx) => {
    if (editableSlides.length <= 1) {
      alert('يجب الإبقاء على صورة واحدة على الأقل في المعرض.');
      return;
    }
    setEditableSlides(editableSlides.filter((_, i) => i !== idx));
  };

  const handleAddSlide = () => {
    if (!newSlideUrl.trim()) return;
    setEditableSlides([
      ...editableSlides,
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

  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadLoading(true);
      const url = await uploadAsset(file, 'carousel');
      if (url) {
        setEditableSlides([
          ...editableSlides,
          {
            url,
            title: newSlideTitle.trim() || file.name.replace(/\.[^/.]+$/, ''),
            subtitle: newSlideSubtitle.trim() || 'صورة جديدة تمت إضافتها إلى المعرض',
            badge: 'مدرسة حبر',
          },
        ]);
        setNewSlideTitle('');
        setNewSlideSubtitle('');
      }
    } catch (err) {
      alert('فشل في تحميل الصورة: ' + err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (window.confirm('هل تريد استعادة باقة الصور الافتراضية عالية الجودة للمؤسسة؟')) {
      try {
        setSaveStatus('saving');
        await updateSettings({ carouselImages: DEFAULT_CAROUSEL_SLIDES });
        setEditableSlides(DEFAULT_CAROUSEL_SLIDES);
        setSaveStatus('success');
        setTimeout(() => {
          setIsManageModalOpen(false);
          setSaveStatus('');
        }, 800);
      } catch (err) {
        setSaveStatus('error');
      }
    }
  };

  const currentSlide = slides[currentIndex] || slides[0];
  const canManage = user && (user.role === 'admin' || user.role === 'school');

  return (
    <div
      dir="rtl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative w-full ${height} rounded-3xl overflow-hidden shadow-2xl border border-luxury-border/60 bg-slate-900 group select-none ${className}`}
      style={{
        boxShadow: `0 15px 40px -10px ${primaryColor}20, 0 0 20px rgba(0,0,0,0.5)`,
      }}
    >
      {/* Background Ambient Glow */}
      <div
        className="absolute -top-12 -right-12 w-64 h-64 rounded-full blur-[100px] opacity-25 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: primaryColor }}
      />
      <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full blur-[100px] bg-blue-600/15 pointer-events-none" />

      {/* Slide Image with Smooth Crossfade */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-0 w-full h-full"
        >
          <img
            src={currentSlide.url}
            alt={currentSlide.title || 'School Facility'}
            className="w-full h-full object-cover object-center transform transition-transform duration-10000 ease-linear scale-100 group-hover:scale-105"
            loading="lazy"
          />

          {/* Gradients to make typography pop */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-95" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-transparent to-slate-950/30" />
        </motion.div>
      </AnimatePresence>

      {/* Top Floating Header & Badges */}
      <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20 pointer-events-none">
        {/* School Branding Badge */}
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/10 shadow-lg pointer-events-auto">
          <SchoolLogo size={22} />
          <span className="text-white text-xs font-bold tracking-tight">
            {settings?.schoolNameArabic || 'مدرسة حبر'}
          </span>
          <span
            className="w-1.5 h-1.5 rounded-full animate-ping"
            style={{ backgroundColor: primaryColor }}
          />
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Admin Change Carousel Button */}
          {canManage && (
            <button
              type="button"
              onClick={handleOpenManageModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/85 hover:bg-slate-850 text-white text-xs font-bold backdrop-blur-md border border-white/20 hover:border-brand-400 transition-all shadow-md group/btn"
              title="تعديل صور المعرض"
            >
              <Edit3 className="w-3.5 h-3.5 text-brand-400 group-hover/btn:rotate-12 transition-transform" />
              <span className="hidden sm:inline">تعديل صور المعرض</span>
            </button>
          )}

          {/* Slide Counter Badge */}
          <div className="px-3 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/10 text-white text-xs font-mono font-bold tracking-wider">
            <span style={{ color: primaryColor }}>{String(currentIndex + 1).padStart(2, '0')}</span>
            <span className="text-slate-400 mx-1">/</span>
            <span className="text-slate-400">{String(slides.length).padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      {/* Slide Text Content & Captions */}
      <div className="absolute bottom-6 inset-x-6 z-20 flex flex-col justify-end text-right">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-2 max-w-2xl"
          >
            {/* Category / Facility Tag */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-extrabold border"
              style={{
                borderColor: `${primaryColor}40`,
                backgroundColor: `${primaryColor}20`,
                color: primaryColor,
              }}
            >
              <Sparkles className="w-3 h-3" />
              <span>{currentSlide.badge || 'فضاءات المؤسسة'}</span>
            </div>

            {/* Slide Title */}
            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight tracking-wide drop-shadow-md">
              {currentSlide.title}
            </h3>

            {/* Slide Subtitle / Description */}
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-medium line-clamp-2 max-w-xl drop-shadow">
              {currentSlide.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Bottom Bar: Dots & Navigation Arrows */}
        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
          {/* Pagination Pill Dots */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'w-7 shadow-md'
                    : 'w-2 bg-white/30 hover:bg-white/60'
                }`}
                style={{
                  backgroundColor: idx === currentIndex ? primaryColor : undefined,
                }}
                aria-label={`الانتقال إلى الشريحة ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="w-8 h-8 rounded-full bg-slate-950/60 hover:bg-slate-900 border border-white/15 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-md"
              aria-label="الصورة السابقة"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="w-8 h-8 rounded-full bg-slate-950/60 hover:bg-slate-900 border border-white/15 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-md"
              aria-label="الصورة التالية"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ===== ADMIN CAROUSEL MANAGER MODAL ===== */}
      <AnimatePresence>
        {isManageModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-luxury-border rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl relative text-right max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-white">إدارة وتغيير صور المعرض</h3>
                    <p className="text-slate-400 text-xs">تخصيص صور الواجهة الرئيسية لمؤسسة حبر وألوان</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManageModalOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="flex-1 overflow-y-auto py-4 space-y-5 px-1 sidebar-scroll">
                {/* Add new slide panel */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-3">
                  <p className="text-xs font-bold text-brand-400 flex items-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    <span>إضافة صورة جديدة إلى المعرض</span>
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        عنوان الصورة
                      </label>
                      <input
                        type="text"
                        value={newSlideTitle}
                        onChange={(e) => setNewSlideTitle(e.target.value)}
                        placeholder="مثال: فضاءات التعليم التحضيري"
                        className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        الوصف المختصر
                      </label>
                      <input
                        type="text"
                        value={newSlideSubtitle}
                        onChange={(e) => setNewSlideSubtitle(e.target.value)}
                        placeholder="مثال: بيئة تربوية ملهمة"
                        className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  {/* Upload File or enter URL */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-slate-400">
                      رابط الصورة (URL) أو رفع ملف من جهازك
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={newSlideUrl}
                        onChange={(e) => setNewSlideUrl(e.target.value)}
                        placeholder="https://example.com/school-image.jpg"
                        className="flex-1 px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddSlide}
                        disabled={!newSlideUrl.trim()}
                        className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
                      >
                        إضافة بالرابط
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadLoading}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/15 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                      >
                        <Upload className="w-3.5 h-3.5 text-brand-400" />
                        <span>{uploadLoading ? 'جاري الرفع...' : 'رفع ملف'}</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadImage}
                      />
                    </div>
                  </div>
                </div>

                {/* Current Slides List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-300">
                      الصور الحالية بالمعرض ({editableSlides.length})
                    </p>
                    <button
                      type="button"
                      onClick={handleResetToDefaults}
                      className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium"
                    >
                      استعادة الصور الافتراضية
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {editableSlides.map((slide, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/50 border border-white/10 hover:border-white/20 transition-all"
                      >
                        <img
                          src={slide.url}
                          alt={slide.title}
                          className="w-16 h-12 object-cover rounded-lg shrink-0 border border-white/10"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{slide.title}</p>
                          <p className="text-[10px] text-slate-400 truncate">{slide.subtitle}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSlide(idx)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                          title="حذف الصورة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setIsManageModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  إلغاء
                </button>
                <div className="flex items-center gap-2">
                  {saveStatus === 'success' && (
                    <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> تم الحفظ بنجاح
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="text-rose-400 text-xs font-bold">حدث خطأ أثناء الحفظ</span>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveSlides}
                    disabled={saveStatus === 'saving'}
                    className="px-6 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-brand-500/25 flex items-center gap-1.5"
                  >
                    <span>{saveStatus === 'saving' ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
