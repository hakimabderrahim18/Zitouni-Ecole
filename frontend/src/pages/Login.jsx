import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from 'react-i18next';
import { Lock, Mail, AlertTriangle, Sparkles, GraduationCap, Globe, Phone, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import ThreeDScene from '../components/ThreeDScene';
import ThemeToggle from '../components/ThemeToggle';

export default function Login() {
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const prefilledAccounts = {
    admin: { email: 'admin@ecole-zitouni.dz', password: 'Admin123!' },
    school: { email: 'school@ecole-zitouni.dz', password: 'School123!' },
    teacher: { email: 'teacher.math@ecole-zitouni.dz', password: 'Teacher123!' },
    student: { email: 'student.yanis@ecole-zitouni.dz', password: '2014-03-20' },
    parent: { email: 'parent.meziane@ecole-zitouni.dz', password: '0550110011' },
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setEmail(prefilledAccounts[role].email);
    setPassword(prefilledAccounts[role].password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Every role lands on the news feed first after logging in
      navigate('/feed');
    } catch (err) {
      console.error(err);
    }
  };

  const roleLabels = {
    admin: 'مدير المنصة',
    school: 'الإدارة',
    teacher: 'أستاذ',
    student: 'تلميذ',
    parent: 'ولي أمر',
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 flex flex-col font-cairo">
      {/* ===== HEADER ===== */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 lg:px-14 py-4 border-b border-luxury-border/30 bg-slate-900/80 backdrop-blur-2xl"
      >
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-[0_8px_25px_rgba(244,180,0,0.3)] transition-transform duration-300 group-hover:scale-105">
            <GraduationCap className="w-6 h-6 text-slate-950" />
            <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <p className="text-white font-black text-base tracking-tight group-hover:text-brand-400 transition-colors">مدرسة الزيتوني</p>
              <span className="px-2 py-0.5 rounded-md bg-brand-500/10 border border-brand-500/20 text-brand-500 font-extrabold text-[10px]">2025/2026</span>
            </div>
            <p className="text-brand-500 text-[11px] font-bold tracking-wide">المنصة التعليمية الذكية</p>
          </div>
        </Link>

        <div className="flex items-center gap-3 md:gap-4">
          <ThemeToggle />
          <Link
            to="/"
            className="px-5 py-2 rounded-full border border-luxury-border/30 text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-xs md:text-sm font-bold flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </Link>
        </div>
      </motion.header>

      {/* ===== MAIN ===== */}
      <div className="flex-1 flex flex-col-reverse md:flex-row overflow-hidden relative">
        {/* Left Side - Login Form (Ultra-Premium Glassmorphism layout) */}
        <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col justify-center px-6 md:px-12 lg:px-16 py-12 relative z-10 border-l border-luxury-border/30 bg-slate-900/80 backdrop-blur-3xl shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
          
          {/* Subtle decorative glow behind form */}
          <div className="absolute top-1/4 -right-20 w-64 h-64 bg-brand-500/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-1/4 -left-20 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />

          <div className="max-w-md w-full mx-auto space-y-10 relative z-10">
            
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 text-xs font-bold w-fit shadow-[0_0_15px_rgba(244,180,0,0.1)]">
                <Sparkles className="w-4 h-4" />
                <span>مدرسة الزيتوني الخاصة</span>
              </div>
              
              <h2 className="text-4xl font-black text-white tracking-tight">
                مرحباً بعودتك
              </h2>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                يرجى تسجيل الدخول للوصول إلى لوحة التحكم الخاصة بك وتجربة المنصة.
              </p>
            </motion.div>

            {/* Role Quick Switcher Grid (Segmented Control Style) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
              className="space-y-3"
            >
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                تحديد الحساب للتجربة السريعة
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(prefilledAccounts).map((role) => (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    key={role}
                    type="button"
                    onClick={() => handleRoleSelect(role)}
                    className={`py-2 px-4 rounded-xl text-xs font-bold transition-all duration-300 flex-grow text-center ${
                      selectedRole === role
                        ? 'bg-brand-500/15 border border-brand-500/50 text-brand-400 shadow-[0_0_15px_rgba(244,180,0,0.15)]'
                        : 'bg-white/[0.03] border border-white/5 text-slate-400 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    {roleLabels[role]}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-semibold backdrop-blur-sm"
              >
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              onSubmit={handleSubmit} 
              className="space-y-5"
            >
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 block ps-1">
                  البريد الإلكتروني
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-500 group-focus-within:text-brand-500 transition-colors duration-300" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@ecole-zitouni.dz"
                    className="w-full ps-12 pe-4 py-3.5 bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-brand-500/50 focus:bg-white/[0.05] rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all duration-300 text-white placeholder-slate-600 text-start text-sm font-medium shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ps-1">
                  <label className="text-xs font-bold text-slate-400 block">
                    كلمة المرور
                  </label>
                  <a href="#" className="text-[11px] font-bold text-brand-500 hover:text-brand-400 transition-colors">
                    نسيت كلمة المرور؟
                  </a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-500 group-focus-within:text-brand-500 transition-colors duration-300" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full ps-12 pe-4 py-3.5 bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-brand-500/50 focus:bg-white/[0.05] rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all duration-300 text-white placeholder-slate-600 text-start text-sm font-medium shadow-inner"
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.01, translateY: -1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 mt-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold transition-all duration-300 shadow-[0_8px_25px_rgba(244,180,0,0.25)] hover:shadow-[0_12px_35px_rgba(244,180,0,0.35)] disabled:opacity-50 text-sm flex items-center justify-center gap-3 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
                    <span className="relative z-10">جاري تسجيل الدخول...</span>
                  </>
                ) : (
                  <span className="relative z-10 tracking-wide text-[15px]">تسجيل الدخول</span>
                )}
              </motion.button>
            </motion.form>
          </div>
        </div>

        {/* Right Side - Interactive 3D Canvas Scene (FULL in section!) */}
        <div className="hidden md:block md:w-[55%] lg:w-[60%] h-full min-h-[600px] relative overflow-hidden bg-slate-950">
          {/* Cinematic Lighting overlays */}
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-transparent to-transparent z-10 pointer-events-none opacity-80" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-500/10 via-transparent to-transparent z-10 pointer-events-none opacity-60 mix-blend-screen" />
          
          {/* R3F canvas wrapper */}
          <div className="w-full h-full absolute inset-0 z-0">
            <ThreeDScene type="login" />
          </div>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="relative z-30 flex flex-col sm:flex-row items-center justify-between gap-3 px-6 md:px-10 lg:px-14 py-4 border-t border-luxury-border/30 bg-slate-900/70 backdrop-blur-2xl text-center"
      >
        <p className="text-slate-500 text-xs font-medium">
          © {new Date().getFullYear()} مدرسة الزيتوني الخاصة. جميع الحقوق محفوظة.
        </p>
        <div className="flex items-center gap-5 text-xs font-bold text-slate-400">
          <a href="#" className="hover:text-brand-500 transition-colors">سياسة الخصوصية</a>
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <a href="#" className="hover:text-brand-500 transition-colors">شروط الاستخدام</a>
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <a href="#" className="hover:text-brand-500 transition-colors">الدعم الفني</a>
        </div>
      </motion.footer>
    </div>
  );
}
