// Exact 1:1 Color Tokens matching frontend/src/index.css (Prestige Académique)
import { Platform } from 'react-native';

export const theme = {
  colors: {
    brand: {
      50: '#FAF2F4',
      100: '#F4E2E7',
      200: '#E7C1CB',
      300: '#D399A8',
      400: '#B35870',
      500: '#7B1E3A', // Bordeaux Principal
      600: '#68172F', // Bordeaux Profond (hover)
      700: '#551125',
      800: '#420A1B',
      900: '#300612',
      950: '#1F030B',
    },
    // Beige Crème Palette de fond et surfaces chaudes (#F3E9DC)
    surface: {
      background: '#F3E9DC', // Fond de page principal (Beige Crème exact)
      canvas: '#F3E9DC',     // Alias canvas
      card: '#FCF8F2',       // Cartes et panneaux (exact #FCF8F2)
      input: '#FAF4EB',      // Surfaces intérieures et inputs (exact #FAF4EB)
      elevated: '#EAE0D1',   // Élévation douce / hover (#EAE0D1)
      border: '#DFD3C2',     // Bordures et séparateurs (#DFD3C2)
      borderGold: 'rgba(201, 162, 77, 0.4)', // Liseré Or Prestige
    },
    // Accent Or (#C9A24D)
    gold: {
      50: '#FBF7ED',
      100: '#F7EFD8',
      200: '#EEDDAF',
      300: '#E4CA85',
      400: '#D7B65E',
      500: '#C9A24D', // Or Prestige Principal
      600: '#B28B36',
      700: '#8E6E27',
      800: '#6A511C',
    },
    // Texte (#2B2022) Encre d'imprimerie chaude et contrastée
    text: {
      primary: '#2B2022',    // Texte courant et titres (exact #2B2022)
      secondary: '#574549',  // Sous-titres (#574549)
      muted: '#766065',      // Labels secondaires (#766065)
      subtle: '#9C8288',     // Dates et placeholders (#9C8288)
      white: '#FFFFFF',      // Boutons primaires bordeaux
      gold: '#C9A24D',
    },
    status: {
      success: '#10B981',
      successBg: 'rgba(16, 185, 129, 0.12)',
      warning: '#F59E0B',
      warningBg: 'rgba(245, 158, 11, 0.12)',
      danger: '#EF4444',
      dangerBg: 'rgba(239, 68, 68, 0.12)',
      info: '#3B82F6',
      infoBg: 'rgba(59, 130, 246, 0.12)',
    }
  },
  typography: {
    fontFamily: {
      serif: Platform.select({
        ios: 'Georgia',
        android: 'serif',
        default: 'serif',
      }),
      sans: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'sans-serif',
      }),
      mono: Platform.select({
        ios: 'Menlo',
        android: 'monospace',
        default: 'monospace',
      }),
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radii: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
    pill: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#2B2022',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#2B2022',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: '#2B2022',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 5,
    },
    card: {
      shadowColor: '#2B2022',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    header: {
      shadowColor: '#2B2022',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    }
  }
} as const;
