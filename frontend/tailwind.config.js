/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'var(--brand-50)',
          100: 'var(--brand-100)',
          200: 'var(--brand-200)',
          300: 'var(--brand-300)',
          400: 'var(--brand-400)',
          450: 'var(--brand-400)',
          500: 'var(--brand-500)',
          550: 'var(--brand-500)',
          600: 'var(--brand-600)',
          650: 'var(--brand-600)',
          700: 'var(--brand-700)',
          800: 'var(--brand-800)',
          850: 'var(--brand-800)',
          900: 'var(--brand-900)',
          950: 'var(--brand-950)',
        },
        slate: {
          50: 'var(--text-50)',
          100: 'var(--text-100)',
          200: 'var(--text-200)',
          300: 'var(--text-300)',
          330: 'var(--text-330)',
          350: 'var(--text-350)',
          400: 'var(--text-400)',
          450: 'var(--text-450)',
          455: 'var(--text-455)',
          500: 'var(--text-500)',
          550: 'var(--border-550)',
          600: 'var(--border-600)',
          650: 'var(--border-650)',
          700: 'var(--border-700)',
          800: 'var(--bg-800)',
          850: 'var(--bg-850)',
          900: 'var(--bg-900)',
          905: 'var(--bg-905)',
          950: 'var(--bg-950)',
        },
        luxury: {
          dark: 'var(--text-100)',
          slate: 'var(--text-400)',
          card: 'var(--luxury-card)',
          border: 'var(--luxury-border)',
        },
        gold: {
          50: '#FBF7ED',
          100: '#F7EFD8',
          200: '#EEDDAF',
          300: '#E4CA85',
          400: '#D7B65E',
          500: '#C9A24D',
          600: '#B28B36',
          700: '#8E6E27',
          800: '#6A511C',
          900: '#473512',
        }
      },
      fontFamily: {
        sans: ['Lato', 'Tajawal', 'Cairo', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Amiri', 'serif'],
        display: ['"Cormorant Garamond"', 'Amiri', 'serif'],
        heading: ['"Cormorant Garamond"', 'Amiri', 'serif'],
        cairo: ['Lato', 'Tajawal', 'Cairo', 'sans-serif'],
        lato: ['Lato', 'sans-serif'],
        cormorant: ['"Cormorant Garamond"', 'Amiri', 'serif'],
      },
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
