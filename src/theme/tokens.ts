/**
 * Design Tokens — single source of truth for the entire visual system.
 * Apple-grade luxury: warm ivory, champagne gold accents, minimal.
 */

// ── Palette ────────────────────────────────────────────────────

export const palette = {
  // Ivory foundation
  ivory50: '#FDFCFA',
  ivory100: '#FAF8F5',
  ivory200: '#F5F0EA',
  ivory300: '#EDE7DD',
  ivory400: '#E0D8CC',

  // Warm grays
  warmGray50: '#F7F5F2',
  warmGray100: '#EDEBE8',
  warmGray200: '#D9D5D0',
  warmGray300: '#B5B0A8',
  warmGray400: '#8E8880',
  warmGray500: '#6B665E',
  warmGray600: '#4A4640',
  warmGray700: '#333028',
  warmGray800: '#1F1D18',
  warmGray900: '#121110',

  // Champagne gold accent
  gold50: '#FBF6ED',
  gold100: '#F3E8D0',
  gold200: '#E6D1A3',
  gold300: '#D4B574',
  gold400: '#C9A96E',
  gold500: '#B8944D',
  gold600: '#9A7A3C',
  gold700: '#7A6030',

  // Charcoal text
  charcoal: '#1A1917',
  charcoalSoft: '#2E2D28',

  // Pure
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Semantic
  success: '#4A8C6F',
  error: '#C45C5C',
  warning: '#C4983C',
  info: '#5C8AC4',
} as const;

// ── Spacing ────────────────────────────────────────────────────

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
  '7xl': 80,
  '8xl': 96,
} as const;

// ── Radii ──────────────────────────────────────────────────────

export const radii = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

// ── Shadows (extremely soft, barely visible) ───────────────────

export const shadows = {
  none: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: palette.warmGray700,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: palette.warmGray700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: palette.warmGray700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  glow: (color: string, intensity: number = 0.3) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: intensity,
    shadowRadius: 20,
    elevation: 0,
  }),
} as const;

// ── Borders ────────────────────────────────────────────────────

export const borders = {
  hairline: 0.5,
  thin: 1,
  medium: 1.5,
  thick: 2,
} as const;

// ── Opacity ────────────────────────────────────────────────────

export const opacity = {
  disabled: 0.35,
  muted: 0.5,
  subtle: 0.7,
  full: 1.0,
} as const;

// ── Hit Slop ───────────────────────────────────────────────────

export const hitSlop = {
  sm: { top: 8, bottom: 8, left: 8, right: 8 },
  md: { top: 12, bottom: 12, left: 12, right: 12 },
  lg: { top: 16, bottom: 16, left: 16, right: 16 },
} as const;
