/**
 * Tier-based material presets for 3D gems V10 — Royal Vivid.
 *
 * V9→V10: Complete vibrancy overhaul for ultra-rich, HD-quality gem appearance.
 *
 * Key changes:
 *   - ALL colors deepened and saturated for "real gem, not pastel" look
 *   - emissiveIntensity 3-5x boosted → gems glow visibly from within
 *   - envMapIntensity 1.5-2x boosted → much stronger specular reflections
 *   - clearcoat raised across all tiers → sharper facet edge definition
 *   - specularIntensity raised → more visible rainbow fire
 *   - dispersion raised → stronger chromatic fire (rainbow flashes)
 *   - safeMaterial clamps widened: clearcoat→0.95, specular→3.5
 *
 * Philosophy: Royal, rich, precious. Real gemstone physics at maximum beauty.
 * Each tier feels unmistakably different and progressively more luxurious.
 * Key rules unchanged:
 *   - opacity is ALWAYS 1.0 (transmission handles transparency internally)
 *   - attenuationDistance controls how quickly color absorbs through thickness
 *   - higher envMapIntensity = more studio reflections visible on facets
 */

import { TierKey, TIER_ORDER } from '../engine/tierProfiles';

export interface GemMaterialConfig {
  color: string;
  emissive: string;
  emissiveIntensity: number;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  opacity: number;
  envMapIntensity: number;
  transmission: number;
  ior: number;
  thickness: number;
  // Beer-Lambert absorption
  attenuationColor: string;
  attenuationDistance: number;
  specularIntensity: number;
  /** Chromatic dispersion — rainbow fire through gem body (0 = none, 0.3 = diamond) */
  dispersion: number;
  // Kept for backward compatibility (tier importance metric)
  glowIntensity: number;
  glowColor: string;
}

/**
 * Ensures material values are within safe ranges for rendering.
 * Clamps extremes so the gem NEVER renders invisible or broken.
 * V10: Widened clamps for premium tiers — clearcoat to 0.95, specular to 3.5.
 */
export function safeMaterial(mat: GemMaterialConfig): GemMaterialConfig {
  return {
    ...mat,
    emissiveIntensity: Math.max(0.08, mat.emissiveIntensity),
    metalness: Math.max(0, Math.min(0.15, mat.metalness)),
    roughness: Math.max(0, Math.min(0.15, mat.roughness)),
    opacity: 1.0, // always 1.0 — transmission handles transparency
    clearcoat: Math.max(0, Math.min(0.95, mat.clearcoat)),
    transmission: Math.max(0, Math.min(0.99, mat.transmission)),
    ior: Math.max(1.0, Math.min(2.45, mat.ior)),
    thickness: Math.max(0.1, Math.min(4.0, mat.thickness)),
    attenuationDistance: Math.max(0.5, mat.attenuationDistance),
    specularIntensity: Math.max(0.5, Math.min(3.5, mat.specularIntensity)),
    dispersion: Math.max(0, Math.min(0.5, mat.dispersion)),
    glowIntensity: Math.max(0.1, mat.glowIntensity),
  };
}

export const TIER_MATERIALS: Record<TierKey, GemMaterialConfig> = {
  // ── Seed: White Quartz Crystal ─────────────────────────────────────────
  // Clean crystal with subtle blue-white fire. The starter gem — simple but pretty.
  seed: {
    color: '#F0F0FF',
    emissive: '#282838',
    emissiveIntensity: 0.25,
    metalness: 0.0,
    roughness: 0.10,
    clearcoat: 0.35,
    clearcoatRoughness: 0.04,
    opacity: 1.0,
    envMapIntensity: 2.5,
    transmission: 0.88,
    ior: 1.48,
    thickness: 0.6,
    attenuationColor: '#E0E0F8',
    attenuationDistance: 4.5,
    specularIntensity: 1.2,
    dispersion: 0.04,
    glowIntensity: 0.25,
    glowColor: '#E8E8FF',
  },

  // ── Form: Swiss Blue Topaz ──────────────────────────────────────────────
  // Vivid blue — unmistakably colored. Clear with strong blue body.
  form: {
    color: '#40B8FF',
    emissive: '#0A2040',
    emissiveIntensity: 0.3,
    metalness: 0.0,
    roughness: 0.07,
    clearcoat: 0.40,
    clearcoatRoughness: 0.03,
    opacity: 1.0,
    envMapIntensity: 3.0,
    transmission: 0.90,
    ior: 1.54,
    thickness: 0.9,
    attenuationColor: '#2090D0',
    attenuationDistance: 3.0,
    specularIntensity: 1.3,
    dispersion: 0.06,
    glowIntensity: 0.35,
    glowColor: '#60C8FF',
  },

  // ── Aura: Royal Amethyst ────────────────────────────────────────────────
  // Deep, saturated purple. Regal presence — the gem of royalty.
  aura: {
    color: '#B060FF',
    emissive: '#1A0830',
    emissiveIntensity: 0.35,
    metalness: 0.0,
    roughness: 0.05,
    clearcoat: 0.48,
    clearcoatRoughness: 0.025,
    opacity: 1.0,
    envMapIntensity: 3.2,
    transmission: 0.92,
    ior: 1.60,
    thickness: 1.1,
    attenuationColor: '#8040C0',
    attenuationDistance: 2.5,
    specularIntensity: 1.4,
    dispersion: 0.10,
    glowIntensity: 0.45,
    glowColor: '#A060FF',
  },

  // ── Lumen: Imperial Citrine ─────────────────────────────────────────────
  // Rich golden-amber. Warm, luxurious, deeply saturated honey gold.
  lumen: {
    color: '#FFD020',
    emissive: '#302000',
    emissiveIntensity: 0.35,
    metalness: 0.01,
    roughness: 0.04,
    clearcoat: 0.52,
    clearcoatRoughness: 0.02,
    opacity: 1.0,
    envMapIntensity: 3.5,
    transmission: 0.93,
    ior: 1.68,
    thickness: 1.3,
    attenuationColor: '#D09818',
    attenuationDistance: 2.5,
    specularIntensity: 1.5,
    dispersion: 0.12,
    glowIntensity: 0.55,
    glowColor: '#FFD040',
  },

  // ── Crest: Vivid Rhodolite ──────────────────────────────────────────────
  // Intense hot pink-magenta. Electric, unmistakable, dramatic.
  crest: {
    color: '#FF40E0',
    emissive: '#300818',
    emissiveIntensity: 0.38,
    metalness: 0.01,
    roughness: 0.035,
    clearcoat: 0.58,
    clearcoatRoughness: 0.015,
    opacity: 1.0,
    envMapIntensity: 3.8,
    transmission: 0.92,
    ior: 1.78,
    thickness: 1.4,
    attenuationColor: '#C020A0',
    attenuationDistance: 2.2,
    specularIntensity: 1.6,
    dispersion: 0.16,
    glowIntensity: 0.65,
    glowColor: '#FF50FF',
  },

  // ── Verity: Neon Paraíba Tourmaline ─────────────────────────────────────
  // Electric teal-cyan. Neon-bright, the most visually striking gem color.
  verity: {
    color: '#00E8FF',
    emissive: '#082830',
    emissiveIntensity: 0.40,
    metalness: 0.01,
    roughness: 0.03,
    clearcoat: 0.65,
    clearcoatRoughness: 0.010,
    opacity: 1.0,
    envMapIntensity: 4.2,
    transmission: 0.95,
    ior: 1.88,
    thickness: 1.6,
    attenuationColor: '#00A0C0',
    attenuationDistance: 2.2,
    specularIntensity: 1.8,
    dispersion: 0.20,
    glowIntensity: 0.75,
    glowColor: '#00F0FF',
  },

  // ── Prime: Imperial Zircon ──────────────────────────────────────────────
  // Deep fiery amber-orange. Commanding warmth, like molten gold.
  prime: {
    color: '#FF8800',
    emissive: '#301808',
    emissiveIntensity: 0.42,
    metalness: 0.02,
    roughness: 0.022,
    clearcoat: 0.72,
    clearcoatRoughness: 0.008,
    opacity: 1.0,
    envMapIntensity: 4.5,
    transmission: 0.93,
    ior: 2.02,
    thickness: 2.0,
    attenuationColor: '#D06800',
    attenuationDistance: 2.5,
    specularIntensity: 2.0,
    dispersion: 0.25,
    glowIntensity: 0.85,
    glowColor: '#FF8800',
  },

  // ── Apex: Fancy Vivid Yellow Diamond ────────────────────────────────────
  // Rich, saturated golden diamond. Maximum brilliance and fire.
  apex: {
    color: '#FFD040',
    emissive: '#302000',
    emissiveIntensity: 0.45,
    metalness: 0.03,
    roughness: 0.012,
    clearcoat: 0.80,
    clearcoatRoughness: 0.005,
    opacity: 1.0,
    envMapIntensity: 5.0,
    transmission: 0.96,
    ior: 2.22,
    thickness: 2.5,
    attenuationColor: '#E0A020',
    attenuationDistance: 3.0,
    specularIntensity: 2.2,
    dispersion: 0.30,
    glowIntensity: 0.95,
    glowColor: '#FFD700',
  },

  // ── One: Flawless D-Color Diamond ───────────────────────────────────────
  // The ultimate: pure, colorless, maximum fire, maximum brilliance.
  // IOR 2.42 = real diamond. Maximum dispersion. Infinite clarity.
  one: {
    color: '#FFFFFF',
    emissive: '#181820',
    emissiveIntensity: 0.40,
    metalness: 0.04,
    roughness: 0.008,
    clearcoat: 0.90,
    clearcoatRoughness: 0.003,
    opacity: 1.0,
    envMapIntensity: 6.0,
    transmission: 0.98,
    ior: 2.42,
    thickness: 3.0,
    attenuationColor: '#FFFFFF',
    attenuationDistance: 100, // effectively infinite — no absorption
    specularIntensity: 2.5,
    dispersion: 0.35,
    glowIntensity: 1.1,
    glowColor: '#FFFFFF',
  },
};

/** Pre-computed safe materials — avoids repeated clamping at render time */
export const SAFE_TIER_MATERIALS: Record<TierKey, GemMaterialConfig> = {} as any;
for (const key of TIER_ORDER) {
  (SAFE_TIER_MATERIALS as any)[key] = safeMaterial(TIER_MATERIALS[key]);
}
