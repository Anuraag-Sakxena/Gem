/**
 * Theme System V3 — Noir-only. Dead themes removed.
 *
 * The app uses a single noir theme. Ivory/velvet/crystal/aurora were removed
 * as theme switching was disabled. AppTheme type is kept for backward compat.
 */

import { palette } from './tokens';

export interface AppTheme {
  key: string;
  name: string;
  subtitle: string;
  backgroundColors: readonly [string, string, string];
  surfaceColor: string;
  surfaceAlpha: number;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  wallColor: string;
  wallShadowOpacity: number;
  ambientLightColor: string;
  ambientLightIntensity: number;
  statusBarStyle: 'light' | 'dark';
  cardBackground: string;
  cardBorder: string;
  buttonBackground: string;
  buttonText: string;
  stageGlow: string;
}

export const NOIR_THEME: AppTheme = {
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
};

// Backward-compat: THEMES record and ThemeKey kept for any residual imports
export type ThemeKey = 'noir';
export const THEMES: Record<string, AppTheme> = { noir: NOIR_THEME };
