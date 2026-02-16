/**
 * Lighting presets for gem scenes V3.
 *
 * One preset per theme (ivory/velvet/crystal/noir/aurora) + preview.
 * Each preset defines a 5-light rig (ambient + key + fill + rim + accent)
 * plus scene background color and glow multiplier.
 *
 * Tuned for direct expo-gl + Three.js (no R3F, no postprocessing).
 * Higher intensities than typical — gem MUST be visible and luminous.
 */

import { ThemeKey } from '../theme/themes';

export interface LightPreset {
  ambient: { color: string; intensity: number };
  key: { color: string; intensity: number; position: [number, number, number] };
  fill: { color: string; intensity: number; position: [number, number, number] };
  rim: { color: string; intensity: number; position: [number, number, number] };
  accent: { color: string; intensity: number; position: [number, number, number] };
  /** Scene background color */
  bgColor: string;
  /** Bloom/glow intensity multiplier */
  glowMultiplier: number;
}

// ─── Presets ──────────────────────────────────────────────────────────────────

/** Ivory Gallery — warm museum track lighting, golden key */
export const IVORY_LIGHTS: LightPreset = {
  ambient: { color: '#FFF8F0', intensity: 0.4 },
  key:     { color: '#FFF0D8', intensity: 2.2,  position: [2.5, 4.0, 2.0] },
  fill:    { color: '#E0E8FF', intensity: 0.7,  position: [-2.5, 1.5, 1.5] },
  rim:     { color: '#FFF0C0', intensity: 1.2,  position: [0, 3.5, -3.5] },
  accent:  { color: '#FFE8D0', intensity: 0.5,  position: [0.5, -1.0, 3.0] },
  bgColor: '#0E0C08',
  glowMultiplier: 1.1,
};

/** Velvet Hall — warm regal, purple/gold, dramatic */
export const VELVET_LIGHTS: LightPreset = {
  ambient: { color: '#1A0830', intensity: 0.15 },
  key:     { color: '#FFD0A0', intensity: 2.0,  position: [2.5, 4.0, 2.0] },
  fill:    { color: '#6030A0', intensity: 0.5,  position: [-3.0, 1.0, 0.5] },
  rim:     { color: '#D4A0FF', intensity: 1.4,  position: [0, 3.0, -4.0] },
  accent:  { color: '#8040C0', intensity: 0.5,  position: [0.5, -1.5, 2.5] },
  bgColor: '#0D0518',
  glowMultiplier: 1.7,
};

/** Crystal Vault — cool white glassy, bright reflections */
export const CRYSTAL_LIGHTS: LightPreset = {
  ambient: { color: '#D0E0F0', intensity: 0.3 },
  key:     { color: '#F0F8FF', intensity: 2.4,  position: [2.0, 3.5, 2.0] },
  fill:    { color: '#A0C0E0', intensity: 0.65, position: [-2.5, 1.5, 1.0] },
  rim:     { color: '#E0F0FF', intensity: 1.3,  position: [0, 3.5, -3.5] },
  accent:  { color: '#80B0D0', intensity: 0.5,  position: [0.5, -1.0, 3.0] },
  bgColor: '#080C14',
  glowMultiplier: 1.3,
};

/** Noir Chamber — dark, dramatic, single strong key + rim */
export const NOIR_LIGHTS: LightPreset = {
  ambient: { color: '#201818', intensity: 0.25 },
  key:     { color: '#FFE8D0', intensity: 3.0,  position: [2.5, 5.0, 2.5] },
  fill:    { color: '#6070B0', intensity: 0.6,  position: [-3.0, 1.0, 0.5] },
  rim:     { color: '#FFD080', intensity: 2.2,  position: [0, 3.0, -4.0] },
  accent:  { color: '#FFFFFF', intensity: 1.0,  position: [0, -0.5, 3.5] },
  bgColor: '#060606',
  glowMultiplier: 2.0,
};

/** Aurora Room — teal/blue gradient, dreamy, cosmic */
export const AURORA_LIGHTS: LightPreset = {
  ambient: { color: '#0A2020', intensity: 0.18 },
  key:     { color: '#E0FFF0', intensity: 2.0,  position: [2.5, 3.5, 2.0] },
  fill:    { color: '#206060', intensity: 0.5,  position: [-3.0, 1.0, 1.0] },
  rim:     { color: '#60D0B0', intensity: 1.3,  position: [0, 3.0, -4.0] },
  accent:  { color: '#40A090', intensity: 0.5,  position: [0.5, -1.5, 2.5] },
  bgColor: '#050E14',
  glowMultiplier: 1.5,
};

/** Minimal lighting for small previews (fewer lights, cheaper) */
export const PREVIEW_LIGHTS: LightPreset = {
  ambient: { color: '#FFF8F0', intensity: 0.5 },
  key:     { color: '#FFF0E0', intensity: 1.8,  position: [2.0, 3.0, 2.0] },
  fill:    { color: '#E0E8FF', intensity: 0.5,  position: [-2.0, 1.0, 1.0] },
  rim:     { color: '#FFF0D0', intensity: 0.8,  position: [0, 2.5, -2.5] },
  accent:  { color: '#FFFFFF', intensity: 0.3,  position: [0.5, -0.5, 2.0] },
  bgColor: '#0A0A08',
  glowMultiplier: 0.8,
};

// ─── Resolver ─────────────────────────────────────────────────────────────────

export type ThemeLighting = ThemeKey | 'preview';

export function getLightPreset(theme: ThemeLighting): LightPreset {
  switch (theme) {
    case 'ivory':   return IVORY_LIGHTS;
    case 'velvet':  return VELVET_LIGHTS;
    case 'crystal': return CRYSTAL_LIGHTS;
    case 'noir':    return NOIR_LIGHTS;
    case 'aurora':  return AURORA_LIGHTS;
    case 'preview': return PREVIEW_LIGHTS;
  }
}
