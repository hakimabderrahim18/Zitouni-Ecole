import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Crown, Check, Palette, ChevronDown } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState('blue-roi');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const themes = [
    {
      id: 'blue-roi',
      name: 'أزرق ملكي وأبيض (Bleu Roi)',
      shortName: 'أزرق ملكي',
      icon: Crown,
      color: 'text-blue-400',
      bg: 'bg-blue-500/15',
      border: 'border-blue-500/30'
    },
    {
      id: 'default',
      name: 'داكن ذهبي وترابكوتة',
      shortName: 'داكن ذهبي',
      icon: Moon,
      color: 'text-amber-400',
      bg: 'bg-amber-500/15',
      border: 'border-amber-500/30'
    },
    {
      id: 'sand',
      name: 'مظهر فاتح (رمالي وأبيض)',
      shortName: 'مظهر فاتح',
      icon: Sun,
      color: 'text-orange-400',
      bg: 'bg-orange-500/15',
      border: 'border-orange-500/30'
    }
  ];

  useEffect(() => {
    let savedTheme = localStorage.getItem('theme');
    // Upgrade old theme values or default to the new Bleu Roi dark mode
    if (savedTheme === 'dark' || !savedTheme || (savedTheme !== 'default' && savedTheme !== 'sand' && savedTheme !== 'blue-roi')) {
      savedTheme = 'blue-roi';
    } else if (savedTheme === 'light') {
      savedTheme = 'sand';
    }

    setTheme(savedTheme);
    applyTheme(savedTheme);

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const applyTheme = (selectedTheme) => {
    document.documentElement.classList.remove('theme-sand', 'theme-default', 'theme-blue-roi', 'dark');
    if (selectedTheme === 'blue-roi') {
      document.documentElement.classList.add('theme-blue-roi', 'dark');
    } else if (selectedTheme === 'sand') {
      document.documentElement.classList.add('theme-sand');
    } else {
      document.documentElement.classList.add('theme-default', 'dark');
    }
  };

  const handleSelect = (id) => {
    setTheme(id);
    localStorage.setItem('theme', id);
    applyTheme(id);
    setIsOpen(false);
  };

  const activeThemeObj = themes.find((t) => t.id === theme) || themes[0];
  const ActiveIcon = activeThemeObj.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="px-3.5 py-2 rounded-xl border border-luxury-border bg-slate-900/80 text-brand-500 hover:text-brand-400 hover:bg-slate-900 transition-all flex items-center gap-2 shadow-sm text-xs font-bold"
        title="تغيير مظهر المنصة"
      >
        <ActiveIcon className="w-4 h-4 text-brand-500 shrink-0" />
        <span className="hidden sm:inline">{activeThemeObj.shortName}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 w-60 rounded-2xl bg-slate-900 border border-luxury-border shadow-[0_15px_40px_rgba(0,0,0,0.6)] z-50 p-2 space-y-1 text-right backdrop-blur-2xl"
          >
            <div className="px-3 py-1.5 border-b border-luxury-border/30 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>تخصيص المظهر</span>
              <Palette className="w-3.5 h-3.5 text-brand-500" />
            </div>
            {themes.map((tObj) => {
              const Icon = tObj.icon;
              const isSelected = theme === tObj.id;
              return (
                <button
                  key={tObj.id}
                  type="button"
                  onClick={() => handleSelect(tObj.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${tObj.bg} ${tObj.color} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{tObj.name}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-brand-500 shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
