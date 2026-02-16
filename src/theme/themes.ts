/**
 * Theme System V2 — refined environments with consistent token usage.
 * Default: Ivory Gallery (warm, aspirational, museum-like).
 */

import { palette } from './tokens';

export type ThemeKey = 'ivory' | 'velvet' | 'crystal' | 'noir' | 'aurora';

export interface AppTheme {
  key: ThemeKey;
  name: string;
  subtitle: string;
  // Background gradient (3 stops)
  backgroundColors: readonly [string, string, string];
  // Surface
  surfaceColor: string;
  surfaceAlpha: number;
  // Text hierarchy
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // Accent
  accent: string;
  accentSoft: string;
  // Environment
  wallColor: string;
  wallShadowOpacity: number;
  ambientLightColor: string;
  ambientLightIntensity: number;
  // Status bar
  statusBarStyle: 'light' | 'dark';
  // Card
  cardBackground: string;
  cardBorder: string;
  // Button
  buttonBackground: string;
  buttonText: string;
  // Gem stage
  stageGlow: string;
}

export const THEMES: Record<ThemeKey, AppTheme> = {
  ivory: {
    key: 'ivory',
    name: 'Ivory Gallery',
    subtitle: 'Warm, open, museum-like',
    backgroundColors: [palette.ivory50, palette.ivory100, palette.ivory200],
    surfaceColor: palette.white,
    surfaceAlpha: 0.85,
    textPrimary: palette.charcoal,
    textSecondary: palette.warmGray500,
    textMuted: palette.warmGray400,
    accent: palette.gold400,
    accentSoft: 'rgba(201,169,110,0.10)',
    wallColor: palette.ivory200,
    wallShadowOpacity: 0.06,
    ambientLightColor: palette.gold50,
    ambientLightIntensity: 0.5,
    statusBarStyle: 'dark',
    cardBackground: 'rgba(255,255,255,0.65)',
    cardBorder: 'rgba(0,0,0,0.05)',
    buttonBackground: palette.charcoal,
    buttonText: palette.white,
    stageGlow: palette.gold200,
  },
  velvet: {
    key: 'velvet',
    name: 'Velvet Hall',
    subtitle: 'Warm, dark, regal',
    backgroundColors: ['#1A0A2E', '#221540', '#1A0A2E'],
    surfaceColor: '#2A1845',
    surfaceAlpha: 0.7,
    textPrimary: '#F0E6FF',
    textSecondary: '#B39DDB',
    textMuted: '#7C5DAF',
    accent: '#D4A0FF',
    accentSoft: 'rgba(212,160,255,0.12)',
    wallColor: '#1A0A2E',
    wallShadowOpacity: 0.25,
    ambientLightColor: '#6A3D9A',
    ambientLightIntensity: 0.3,
    statusBarStyle: 'light',
    cardBackground: 'rgba(42,24,69,0.65)',
    cardBorder: 'rgba(212,160,255,0.10)',
    buttonBackground: '#D4A0FF',
    buttonText: '#1A0A2E',
    stageGlow: '#7C4DFF',
  },
  crystal: {
    key: 'crystal',
    name: 'Crystal Vault',
    subtitle: 'Cool white, glass',
    backgroundColors: ['#F2F5F8', '#E8EDF3', '#DEE5ED'],
    surfaceColor: palette.white,
    surfaceAlpha: 0.55,
    textPrimary: '#1A2A3A',
    textSecondary: '#4A6A8A',
    textMuted: '#8AAABB',
    accent: '#5BA3C9',
    accentSoft: 'rgba(91,163,201,0.10)',
    wallColor: '#E8F0F5',
    wallShadowOpacity: 0.05,
    ambientLightColor: '#D6EAF2',
    ambientLightIntensity: 0.4,
    statusBarStyle: 'dark',
    cardBackground: 'rgba(255,255,255,0.45)',
    cardBorder: 'rgba(91,163,201,0.10)',
    buttonBackground: '#3D8EB5',
    buttonText: palette.white,
    stageGlow: '#A8D8EA',
  },
  noir: {
    key: 'noir',
    name: 'Noir Chamber',
    subtitle: 'Dark, dramatic',
    backgroundColors: ['#0A0A09', '#111110', '#0A0A09'],
    surfaceColor: '#1A1A18',
    surfaceAlpha: 0.8,
    textPrimary: '#F2F0ED',
    textSecondary: '#A8A498',
    textMuted: '#6B675D',
    accent: palette.gold400,
    accentSoft: 'rgba(201,169,110,0.10)',
    wallColor: '#0A0A09',
    wallShadowOpacity: 0.5,
    ambientLightColor: '#1A1A18',
    ambientLightIntensity: 0.15,
    statusBarStyle: 'light',
    cardBackground: 'rgba(26,26,24,0.75)',
    cardBorder: 'rgba(201,169,110,0.10)',
    buttonBackground: palette.gold400,
    buttonText: '#0A0A09',
    stageGlow: palette.gold300,
  },
  aurora: {
    key: 'aurora',
    name: 'Aurora Room',
    subtitle: 'Soft gradient dreamscape',
    backgroundColors: ['#0F1F27', '#1A3040', '#253D50'],
    surfaceColor: '#1A2E3A',
    surfaceAlpha: 0.55,
    textPrimary: '#E0EDF2',
    textSecondary: '#80B8AD',
    textMuted: '#4D9488',
    accent: '#6AD4BD',
    accentSoft: 'rgba(106,212,189,0.10)',
    wallColor: '#0F1F27',
    wallShadowOpacity: 0.2,
    ambientLightColor: '#003D34',
    ambientLightIntensity: 0.3,
    statusBarStyle: 'light',
    cardBackground: 'rgba(26,46,58,0.60)',
    cardBorder: 'rgba(106,212,189,0.10)',
    buttonBackground: '#6AD4BD',
    buttonText: '#0F1F27',
    stageGlow: '#4DB6AC',
  },
};

export const THEME_ORDER: ThemeKey[] = ['ivory', 'velvet', 'crystal', 'noir', 'aurora'];
