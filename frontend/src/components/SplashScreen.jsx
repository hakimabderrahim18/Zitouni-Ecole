import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, GraduationCap } from 'lucide-react';
import { useSchoolStore } from '../store/useSchoolStore';
import SchoolLogo from './SchoolLogo';

export default function SplashScreen({ onFinish }) {
  const { settings, fetchSettings } = useSchoolStore();
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    // Load branding settings once
    fetchSettings();

    // Guaranteed dismiss timer: 1.5 seconds maximum
    const timer = setTimeout(() => {
      if (onFinishRef.current) {
        onFinishRef.current();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []); // Run ONCE on mount

  const primaryColor = settings?.primaryColor || '#F4B400';

  const handleDismiss = () => {
    if (onFinishRef.current) {
      onFinishRef.current();
    }
  };

  return (
    <div
      dir="rtl"
      onClick={handleDismiss}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 font-cairo overflow-hidden select-none cursor-pointer"
    >
      {/* Background Mesh Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full blur-[140px] opacity-20 transition-all duration-1000"
          style={{ backgroundColor: primaryColor }}
        />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg"
      >
        {/* School Logo */}
        <motion.div
          initial={{ rotate: -10, scale: 0.8 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 flex items-center justify-center"
        >
          <SchoolLogo size={100} className="shadow-2xl border-2 border-luxury-border" />
        </motion.div>

        {/* School Name */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide mb-2 flex items-center gap-2"
        >
          <span>{settings?.schoolNameArabic || 'مدرسة حبر'}</span>
        </motion.h1>

        {/* Official Slogan */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide border mb-4"
          style={{
            borderColor: `${primaryColor}40`,
            backgroundColor: `${primaryColor}15`,
            color: primaryColor,
          }}
        >
          « {settings?.slogan || 'يا نشء أنت رجاؤنا'} »
        </motion.div>

        {/* Institution full title & French name */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-slate-400 text-xs sm:text-sm font-medium mb-8 leading-relaxed max-w-sm"
        >
          {settings?.institutionName || 'مؤسسة التربية والتعليم حبر وألوان الخاصة'}
          <span className="block text-slate-500 text-[11px] mt-1">
            {settings?.schoolNameFrench || 'Groupe scolaire Encre & Pastel'} — {settings?.location || 'Ouled Fayet'}
          </span>
        </motion.p>

        {/* Animated Progress Line */}
        <div className="w-48 sm:w-60 h-1.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.4, ease: 'easeInOut' }}
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${primaryColor}, #60a5fa)`,
              boxShadow: `0 0 10px ${primaryColor}`,
            }}
          />
        </div>
      </motion.div>

      {/* Manual skip button */}
      <button
        onClick={handleDismiss}
        className="absolute bottom-6 left-6 text-xs text-slate-400 hover:text-white transition-colors py-1.5 px-3 rounded-lg bg-slate-900/60 border border-luxury-border/40"
      >
        تخطي ←
      </button>
    </div>
  );
}
