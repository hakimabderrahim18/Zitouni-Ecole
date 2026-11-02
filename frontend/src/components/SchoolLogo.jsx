import React from 'react';
import { useSchoolStore } from '../store/useSchoolStore';

/**
 * Official School Logo component for « مدرسة حبر » (Groupe scolaire Encre & Pastel)
 * - If settings.logoUrl is uploaded by admin, displays the image.
 * - Otherwise, renders the official vector emblem: a calligraphic ink plume/nib
 *   with the letter "ح" in gold (#F4B400) on a luxury dark slate badge.
 */
export default function SchoolLogo({ size = 32, className = '', imgClassName = '' }) {
  const { settings } = useSchoolStore();
  const primaryColor = settings?.primaryColor || '#F4B400';

  if (settings?.logoUrl) {
    return (
      <img
        src={settings.logoUrl}
        alt={settings?.schoolNameArabic || 'مدرسة حبر'}
        style={{ width: size, height: size }}
        className={`object-contain rounded-xl shrink-0 ${imgClassName}`}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-xl flex items-center justify-center shrink-0 shadow-md border border-luxury-border/60 overflow-hidden select-none transition-transform duration-200 group-hover:scale-105 ${className}`}
      title={settings?.schoolNameArabic || 'مدرسة حبر'}
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="hebrBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7B1E3A" />
            <stop offset="50%" stopColor="#551125" />
            <stop offset="100%" stopColor="#300612" />
          </linearGradient>
          <linearGradient id="hebrGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F7EED8" />
            <stop offset="40%" stopColor="#C9A24D" />
            <stop offset="100%" stopColor="#9E7B2B" />
          </linearGradient>
          <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#C9A24D" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* Badge Background */}
        <rect width="40" height="40" rx="10" fill="url(#hebrBgGrad)" />
        <rect
          x="0.75"
          y="0.75"
          width="38.5"
          height="38.5"
          rx="9.25"
          stroke="url(#hebrGoldGrad)"
          strokeOpacity="0.7"
          strokeWidth="1.5"
        />

        {/* Fountain Pen Nib / Plume d'encre (ريشة حبر) */}
        <g transform="translate(4, 2.5)" filter="url(#goldGlow)">
          {/* Nib Outer Wings */}
          <path
            d="M 16 3.5 
               C 18.5 5.5, 21.5 9, 23 12 
               C 24.2 14.5, 24.5 17.5, 24.5 20.5 
               L 20.5 20.5 
               L 18 28.5 
               L 16 33.5 
               L 14 28.5 
               L 11.5 20.5 
               L 7.5 20.5 
               C 7.5 17.5, 7.8 14.5, 9 12 
               C 10.5 9, 13.5 5.5, 16 3.5 Z"
            fill="url(#hebrGoldGrad)"
          />

          {/* Breather Hole & Ink Channel */}
          <circle cx="16" cy="15" r="2.2" fill="#551125" />
          <line
            x1="16"
            y1="17.2"
            x2="16"
            y2="33.5"
            stroke="#551125"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Letter "ح" (حبر) stylized in the nib head */}
          <path
            d="M 13 8.5 C 14.8 7.2 17.2 7.2 19 8.5 C 19 10 17.8 11.2 16 11.8 C 14.2 12.3 13.5 13.5 14.2 14.5"
            stroke="#551125"
            strokeWidth="1.3"
            strokeLinecap="round"
            fill="none"
          />

          {/* Gold Ink Droplet at Nib Point */}
          <circle cx="16" cy="34.8" r="1.1" fill="url(#hebrGoldGrad)" />
        </g>
      </svg>
    </div>
  );
}
