/**
 * ThemeEngine — Single source of truth mapping ThemeKey → 3D scene configuration.
 *
 * Bridges the app's theme system (ivory/velvet/crystal/noir/aurora) with
 * the Three.js renderer. Every visual parameter the scene needs is derived here.
 *
 * Theme controls: lighting, colors, aura, fog, glow, background.
 * Environment toggle (space/wall) controls which 3D objects appear.
 * Both are independent inputs to GemView.
 */

import { ThemeKey } from '../theme/themes';

export interface SceneConfig {
  /** Background color for renderer.setClearColor */
  bgColor: string;
  /** Glow intensity multiplier (affects all glow layers) */
  glowMultiplier: number;
  /** GLSL aura primary color */
  auraColor: string;
  /** GLSL aura secondary color (outer ring) */
  auraColorSecondary: string;
  /** Aura intensity (0–1) */
  auraIntensity: number;
  /** Light streak color */
  streakColor: string;
  /** Light streak intensity (0–1) */
  streakIntensity: number;
  /** Fog/haze color (blended into background plane) */
  fogColor: string;
  /** Fog density (0 = none, 0.5 = max) */
  fogDensity: number;
  /** Dust particle color */
  dustColor: string;
  /** Dust particle brightness (0–1) */
  dustBrightness: number;
  /** Tint applied to environment objects (starfield, nebula, wall) */
  envTint: string;
  /** Wall/floor surface color (hex) when in wall mode */
  wallSurfaceColor: string;
  /** Wall-mode ground reflection multiplier */
  wallReflectionStrength: number;
  /** Nebula color for space mode */
  nebulaColor: string;
}

const SCENE_CONFIGS: Record<ThemeKey, SceneConfig> = {
  /** Ivory Gallery — warm museum, golden glow, soft haze */
  ivory: {
    bgColor: '#0E0C08',
    glowMultiplier: 1.1,
    auraColor: '#FFE8C8',
    auraColorSecondary: '#C8A060',
    auraIntensity: 0.35,
    streakColor: '#FFD890',
    streakIntensity: 0.2,
    fogColor: '#201810',
    fogDensity: 0.12,
    dustColor: '#FFE0B0',
    dustBrightness: 0.35,
    envTint: '#FFF0D8',
    wallSurfaceColor: '#141008',
    wallReflectionStrength: 0.12,
    nebulaColor: '#1A1408',
  },

  /** Velvet Hall — regal purple/gold, strong glow, dramatic */
  velvet: {
    bgColor: '#0D0518',
    glowMultiplier: 1.7,
    auraColor: '#D4A0FF',
    auraColorSecondary: '#8040C0',
    auraIntensity: 0.55,
    streakColor: '#C080FF',
    streakIntensity: 0.35,
    fogColor: '#180830',
    fogDensity: 0.22,
    dustColor: '#D0A0FF',
    dustBrightness: 0.45,
    envTint: '#A060E0',
    wallSurfaceColor: '#100820',
    wallReflectionStrength: 0.18,
    nebulaColor: '#1A0830',
  },

  /** Crystal Vault — cool white/blue, glassy, bright reflections */
  crystal: {
    bgColor: '#080C14',
    glowMultiplier: 1.3,
    auraColor: '#B0D8F0',
    auraColorSecondary: '#6090C0',
    auraIntensity: 0.4,
    streakColor: '#A0C8E8',
    streakIntensity: 0.25,
    fogColor: '#0C1420',
    fogDensity: 0.1,
    dustColor: '#C0E0FF',
    dustBrightness: 0.5,
    envTint: '#80B0D0',
    wallSurfaceColor: '#0A1018',
    wallReflectionStrength: 0.15,
    nebulaColor: '#081018',
  },

  /** Noir Chamber — near-black, dramatic rim, intense glow */
  noir: {
    bgColor: '#060606',
    glowMultiplier: 2.0,
    auraColor: '#FFD080',
    auraColorSecondary: '#FF8030',
    auraIntensity: 0.65,
    streakColor: '#FFB060',
    streakIntensity: 0.4,
    fogColor: '#0A0808',
    fogDensity: 0.28,
    dustColor: '#FFD0A0',
    dustBrightness: 0.25,
    envTint: '#FFE0B0',
    wallSurfaceColor: '#0A0808',
    wallReflectionStrength: 0.2,
    nebulaColor: '#0A0808',
  },

  /** Aurora Room — teal/blue dreamscape, cosmic haze */
  aurora: {
    bgColor: '#050E14',
    glowMultiplier: 1.5,
    auraColor: '#60D0B0',
    auraColorSecondary: '#2080A0',
    auraIntensity: 0.5,
    streakColor: '#50C0A0',
    streakIntensity: 0.3,
    fogColor: '#081418',
    fogDensity: 0.18,
    dustColor: '#80E0C0',
    dustBrightness: 0.5,
    envTint: '#40B0A0',
    wallSurfaceColor: '#060E12',
    wallReflectionStrength: 0.14,
    nebulaColor: '#081820',
  },
};

export function getSceneConfig(themeKey: ThemeKey): SceneConfig {
  return SCENE_CONFIGS[themeKey];
}
