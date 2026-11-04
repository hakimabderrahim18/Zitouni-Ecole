import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useSchoolStore } from '../store/useSchoolStore';
import SchoolLogo from '../components/SchoolLogo';
import {
  Lock,
  User as UserIcon,
  AlertTriangle,
  Sparkles,
  GraduationCap,
  Eye,
  EyeOff,
  Phone,
  X,
  ShieldAlert,
  ArrowLeft,
  Clock,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SchoolImageCarousel from '../components/SchoolImageCarousel';

export default function Login() {
  const { user, login, isLoading, error } = useAuthStore();
  const { settings, fetchSettings } = useSchoolStore();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isLockedAccount, setIsLockedAccount] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // If already authenticated, redirect to the news feed (fil d'actualité)
  useEffect(() => {
    if (user) {
      navigate('/feed', { replace: true });
    }
  }, [user, navigate]);

  // 5-minute lockout countdown timer (Security Rule: Stop 5 min after 4 attempts)
  useEffect(() => {
    if (lockCountdown <= 0) return;
    const interval = setInterval(() => {
      setLockCountdown((prev) => {
        if (prev <= 1) {
          setIsLockedAccount(false);
          setLocalError('انتهت فترة الحظر المؤقت (5 دقائق). يمكنك الآن إعادة المحاولة.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockCountdown]);

  const primaryColor = settings?.primaryColor || '#7B1E3A';

  const handleOpenWhatsApp = (customMsg = '') => {
    const schoolPhone = '213554075701';
    const textMsg =
      customMsg ||
      `السلام عليكم إدارة مؤسسة حبر وألوان، أود استرجاع كلمة المرور الخاصة بحسابي على المنصة.\nالمعرف / رقم الهاتف: ${identifier || 'غير محدد'}`;
    const url = `https://wa.me/${schoolPhone}?text=${encodeURIComponent(textMsg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockCountdown > 0) return;

    setLocalError('');
    setIsLockedAccount(false);

    try {
      const result = await login(identifier, password);
      // Requirement: First page after login is News Feed (fil d'actualité) in all roles
      navigate('/feed', { replace: true });
    } catch (err) {
      const errMsg = err.message || 'فشل تسجيل الدخول. يرجى التأكد من البيانات المدخلة.';
      setLocalError(errMsg);

      // Handle 5-minute lockout rule: Triggered ONLY after 4 failed attempts (HTTP 429 or isLocked5Min)
      if (err.isLocked5Min || err.response?.status === 429) {
        setIsLockedAccount(true);
        const seconds = err.secondsLeft || 300;
        setLockCountdown(seconds);
      } else {
        setIsLockedAccount(false);
        setLockCountdown(0);
      }
    }
  };

  return (
    <div dir="rtl" className="theme-prestige min-h-screen bg-slate-950 flex flex-col font-sans overflow-x-hidden w-full max-w-full">
      {/* ===== HEADER ===== */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="sticky top-0 z-40 flex items-center justify-between px-3.5 sm:px-6 md:px-10 lg:px-14 py-3 sm:py-4 border-b border-luxury-border/30 bg-slate-900/80 backdrop-blur-2xl max-w-full overflow-hidden"
      >
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0">
          <SchoolLogo size={36} className="shadow-lg border-luxury-border shrink-0" />
          <div className="leading-tight min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <p className="text-white font-black text-sm sm:text-base tracking-tight truncate">
                {settings?.schoolNameArabic || 'مدرسة حبر'}
              </p>
              <span
                className="hidden sm:inline-block px-2 py-0.5 rounded-md border text-[10px] font-extrabold shrink-0"
                style={{
                  borderColor: `${primaryColor}40`,
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor,
                }}
              >
                {settings?.academicYear || '2026-2027'}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wide text-slate-400 truncate">
              {settings?.slogan || 'يا نشء أنت رجاؤنا'}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Link
            to="/"
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-luxury-border/40 text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-xs font-bold flex items-center gap-1.5 sm:gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>الرئيسية</span>
          </Link>
        </div>
      </motion.header>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col-reverse md:flex-row overflow-hidden relative max-w-full">
        {/* Left Side: Login Form (Pure Two-Field Authentication) */}
        <div className="w-full md:w-[48%] lg:w-[42%] flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-16 py-8 sm:py-10 relative z-10 border-l border-luxury-border/30 bg-slate-900/80 backdrop-blur-3xl shadow-[20px_0_50px_rgba(0,0,0,0.5)] overflow-hidden max-w-full">
          
          {/* Decorative Backlight — strictly clipped */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute top-1/4 -right-20 w-64 h-64 rounded-full blur-[90px] opacity-15"
              style={{ backgroundColor: primaryColor }}
            />
          </div>

          <div className="max-w-md w-full mx-auto space-y-8 relative z-10">
            {/* Header Titles */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="space-y-3"
            >
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold w-fit shadow-sm"
                style={{
                  borderColor: `${primaryColor}30`,
                  backgroundColor: `${primaryColor}10`,
                  color: primaryColor,
                }}
              >
                <Sparkles className="w-4 h-4" />
                <span>{settings?.institutionName || 'مؤسسة التربية والتعليم حبر وألوان الخاصة'}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-[#2B2022] tracking-tight font-display">
                تسجيل الدخول
              </h2>
              <p className="text-[#2B2022]/70 text-xs sm:text-sm font-medium leading-relaxed">
                أدخل اسم المستخدم أو رقم الهاتف، وكلمة المرور الخاصة بحسابك للولوج إلى فضائك المخصص.
              </p>
            </motion.div>

            {/* Error Message & 5-Min Lockout Alert */}
            {(localError || error || lockCountdown > 0) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-2xl flex items-start gap-3.5 text-xs sm:text-sm font-semibold border shadow-sm transition-all ${
                  lockCountdown > 0 || isLockedAccount
                    ? 'bg-[#7B1E3A]/10 border-[#7B1E3A]/30 text-[#2B2022]'
                    : 'bg-[#7B1E3A]/10 border-[#7B1E3A]/25 text-[#7B1E3A]'
                }`}
              >
                {lockCountdown > 0 ? (
                  <div className="w-8 h-8 rounded-xl bg-[#7B1E3A] flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Clock className="w-4 h-4 text-[#C9A24D] animate-pulse" />
                  </div>
                ) : isLockedAccount ? (
                  <div className="w-8 h-8 rounded-xl bg-[#7B1E3A] flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <ShieldAlert className="w-4 h-4 text-[#C9A24D]" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-[#7B1E3A]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4 text-[#7B1E3A]" />
                  </div>
                )}
                <div className="leading-relaxed flex-1">
                  {lockCountdown > 0 ? (
                    <div className="space-y-1.5">
                      <p className="font-bold text-[#7B1E3A] text-sm">
                        تم تجميد إمكانية تسجيل الدخول مؤقتاً لمدة 5 دقائق بعد تجاوز 4 محاولات خاطئة.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-[#2B2022] font-semibold">
                        <span>الوقت المتبقي لفتح الدخول:</span>
                        <span className="px-2.5 py-0.5 rounded-md bg-[#7B1E3A] text-[#F3E9DC] font-bold font-mono text-xs tracking-wider border border-[#C9A24D]/40">
                          {Math.floor(lockCountdown / 60)}:
                          {String(lockCountdown % 60).padStart(2, '0')} دقيقة
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="font-bold text-[#7B1E3A]">{localError || error}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="mt-2.5 text-xs font-bold text-[#7B1E3A] hover:text-[#551125] underline flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>مراسلة واتساب المدرسة لاسترجاع الحساب أو رفع القفل ←</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Pure Two-Field Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Field 1: Identifier */}
              <div className="space-y-2">
                <label className="text-xs font-black text-[#2B2022] block ps-1">
                  اسم المستخدم أو رقم الهاتف أو البريد الإلكتروني أو رقم الرقمنة
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                    <UserIcon className="w-5 h-5 text-[#C9A24D] group-focus-within:text-[#7B1E3A] transition-colors duration-300" />
                  </div>
                  <input
                    type="text"
                    required
                    disabled={lockCountdown > 0}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="مثال: 0550112233 أو username أو البريد"
                    className="w-full ps-12 pe-4 py-3.5 bg-white border-2 border-[#C9A24D]/40 hover:border-[#C9A24D] focus:border-[#7B1E3A] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#7B1E3A]/15 shadow-sm hover:shadow transition-all duration-300 text-[#2B2022] placeholder-[#2B2022]/40 text-start text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Field 2: Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center ps-1">
                  <label className="text-xs font-black text-[#2B2022] block">
                    كلمة المرور
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] font-black transition-colors hover:underline flex items-center gap-1 text-[#7B1E3A] hover:text-[#551125] cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>نسيت كلمة المرور؟ (واتساب)</span>
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                    <Lock className="w-5 h-5 text-[#C9A24D] group-focus-within:text-[#7B1E3A] transition-colors duration-300" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={lockCountdown > 0}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full ps-12 pe-12 py-3.5 bg-white border-2 border-[#C9A24D]/40 hover:border-[#C9A24D] focus:border-[#7B1E3A] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#7B1E3A]/15 shadow-sm hover:shadow transition-all duration-300 text-[#2B2022] placeholder-[#2B2022]/40 text-start text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 end-0 flex items-center pe-4 text-[#C9A24D] hover:text-[#7B1E3A] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading || lockCountdown > 0}
                whileHover={{ scale: lockCountdown > 0 ? 1 : 1.01, translateY: lockCountdown > 0 ? 0 : -1 }}
                whileTap={{ scale: lockCountdown > 0 ? 1 : 0.98 }}
                className="w-full py-4 mt-2 rounded-2xl !text-white text-white font-extrabold transition-all duration-300 disabled:opacity-50 text-sm flex items-center justify-center gap-3 relative overflow-hidden shadow-lg shadow-[#7B1E3A]/25 hover:shadow-xl hover:shadow-[#7B1E3A]/35 cursor-pointer disabled:cursor-not-allowed border border-[#C9A24D]/40"
                style={{
                  color: '#FFFFFF',
                  background:
                    lockCountdown > 0
                      ? '#475569'
                      : `linear-gradient(135deg, ${primaryColor || '#7B1E3A'}, #551125)`,
                }}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="!text-white text-white font-bold">جاري التحقق من الحساب...</span>
                  </>
                ) : lockCountdown > 0 ? (
                  <span className="flex items-center gap-2 !text-white text-white font-bold">
                    <Clock className="w-4 h-4 text-[#F3E9DC] animate-spin" />
                    <span className="!text-white text-white font-bold">
                      مجمّد مؤقتاً ({Math.floor(lockCountdown / 60)}:
                      {String(lockCountdown % 60).padStart(2, '0')})
                    </span>
                  </span>
                ) : (
                  <span className="tracking-wide text-[16px] font-black !text-white text-white drop-shadow-xs">تسجيل الدخول</span>
                )}
              </motion.button>

              {/* Quick Login Helper for Testing All 8 Roles */}
              <div className="pt-4 border-t border-[#C9A24D]/25 text-right">
                <span className="text-[11px] font-black text-[#2B2022] block mb-2">
                  حسابات التجربة السريعة للأدوار الثمانية (انقر للملء الفوري):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
                  {[
                    { label: 'المدير العام', id: 'admin', p: 'Admin123!', role: 'admin' },
                    { label: 'المدرسة', id: 'school', p: 'School123!', role: 'school' },
                    { label: 'مراقب عام', id: 'superviseur.gen', p: '0550112233', role: 'general_supervisor' },
                    { label: 'مراقب تربوي', id: 'superviseur.ped', p: '0550445566', role: 'pedagogical_supervisor' },
                    { label: 'استقبال', id: 'receptionniste', p: '0550778899', role: 'receptionist' },
                    { label: 'أستاذ', id: 'teacher.math', p: '0550111111', role: 'teacher' },
                    { label: 'ولي أمر', id: 'parent.meziane', p: '0550110011', role: 'parent' },
                    { label: 'تلميذ', id: 'student.yanis', p: '2014-03-20', role: 'student' },
                  ].map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        setIdentifier(acc.id);
                        setPassword(acc.p);
                        setLocalError('');
                      }}
                      className="p-2 rounded-xl bg-white hover:bg-[#F3E9DC] border border-[#C9A24D]/40 hover:border-[#C9A24D] text-[#2B2022] hover:text-[#7B1E3A] font-bold transition-all text-center truncate shadow-2xs cursor-pointer active:scale-95"
                      title={`${acc.id} | ${acc.p}`}
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.form>
          </div>
        </div>

        {/* Right Side: School Facility Image Carousel */}
        <div className="hidden md:block md:w-[50%] lg:w-[56%] h-full min-h-[580px] relative overflow-hidden bg-slate-950 p-6 lg:p-8 flex items-center justify-center">
          <div className="w-full h-full max-h-[620px] rounded-3xl overflow-hidden shadow-2xl border border-luxury-border/60">
            <SchoolImageCarousel height="h-full min-h-[540px]" className="rounded-none border-none shadow-none" />
          </div>
        </div>
      </div>

      {/* ===== FORGOT PASSWORD ASSISTANCE MODAL ===== */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-luxury-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-right"
            >
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="absolute top-5 left-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center border"
                  style={{
                    backgroundColor: `${primaryColor}15`,
                    borderColor: `${primaryColor}30`,
                    color: primaryColor,
                  }}
                >
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">استرجاع كلمة المرور</h3>
                  <p className="text-xs text-slate-400">إجراءات الأمان الإدارية المعتمدة</p>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-luxury-border/30 pt-4">
                <p>
                  وفقاً لنظام الأمان المدرسي، يتم إرسال طلب استرجاع كلمة المرور مباشرة إلى الرقم الرسمي لأمانة وإدارة المؤسسة عبر تطبيق واتساب (WhatsApp):
                </p>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-luxury-border space-y-2">
                  <span className="text-slate-400 text-xs block">رقم واتساب المؤسسة المعتمد:</span>
                  <p className="font-bold text-emerald-400 text-base flex items-center gap-2" dir="ltr">
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span>+213 554 07 57 01</span>
                  </p>
                  <span className="text-[11px] text-slate-500 block">
                    أمانة وسكرتارية {settings?.institutionName || 'مؤسسة التربية والتعليم حبر وألوان الخاصة'}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#2B2022] dark:text-slate-300 block">المعرف أو رقم الهاتف الخاص بحسابك:</label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="مثال: 0550112233 أو username أو رقم الرقمنة"
                    className="w-full px-4 py-3 bg-white border-2 border-[#C9A24D]/40 hover:border-[#C9A24D] rounded-xl text-[#2B2022] placeholder-[#2B2022]/40 text-xs font-bold focus:outline-none focus:border-[#7B1E3A] focus:ring-4 focus:ring-[#7B1E3A]/15 shadow-xs transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 mt-6">
                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp()}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>إرسال طلب كلمة المرور إلى واتساب المدرسة</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== FOOTER ===== */}
      <footer className="relative z-30 flex flex-col sm:flex-row items-center justify-between gap-3 px-6 md:px-10 lg:px-14 py-4 border-t border-luxury-border/30 bg-slate-900/70 backdrop-blur-2xl text-center text-xs">
        <p className="text-slate-500 font-medium">
          © {new Date().getFullYear()} {settings?.institutionName || 'مؤسسة التربية والتعليم حبر وألوان الخاصة'}. جميع الحقوق محفوظة.
        </p>
        <p className="text-slate-400 font-semibold font-outfit" dir="ltr">
          {settings?.schoolNameFrench || 'Groupe scolaire Encre & Pastel'}
        </p>
      </footer>
    </div>
  );
}
