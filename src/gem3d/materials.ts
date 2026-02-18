/**
 * Tier-based material presets for 3D gems V9 — Studio PBR (Dark-Tier Fix).
 *
 * V8→V9: Fix dark tier visibility + boost environment reflections.
 *
 * Problem with V8:
 *   - Apex (#F8D840 color + #E0B020 attenuation + distance 2.0) became a dark
 *     blob under ACES Filmic at 1.1 exposure. The golden attenuation absorbed
 *     too much light through the gem body.
 *   - Prime similarly crushed to near-invisible amber.
 *   - envMapIntensity was too low across the board (1.0→3.0) — the env map
 *     is our primary specular source, so it needs to be strong.
 *
 * V9 fixes:
 *   - ALL tiers: envMapIntensity boosted significantly (1.5→4.0)
 *   - Dark tiers (Prime, Apex): brighter colors, longer attenuationDistance
 *     (less absorption), lower roughness for more specular catch
 *   - Apex: color brightened (#FDE466), attenuation lightened (#F0C840),
 *     distance 3.5 (was 2.0) — much more light passes through
 *   - Prime: attenuation lightened (#E08020), distance 2.5 (was 1.5)
 *   - specularIntensity raised on higher tiers for more facet fire
 *   - clearcoat raised slightly for sharper highlights on polished facets
 *
 * Philosophy unchanged: real gemstone physics, each tier = different gem type.
 * Key rules:
 *   - opacity is ALWAYS 1.0 (transmission handles transparency internally)
 *   - attenuationDistance controls how quickly color absorbs through thickness
 *   - lower attenuationDistance = more saturated color through thick parts
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
  // Kept for backward compatibility (tier importance metric)
  glowIntensity: number;
  glowColor: string;
}

/**
 * Ensures material values are within safe ranges for rendering.
 * Clamps extremes so the gem NEVER renders invisible or broken.
 */
export function safeMaterial(mat: GemMaterialConfig): GemMaterialConfig {
  return {
    ...mat,
    emissiveIntensity: Math.max(0.08, mat.emissiveIntensity),
    metalness: Math.max(0, Math.min(0.1, mat.metalness)),
    roughness: Math.max(0, Math.min(0.15, mat.roughness)),
    opacity: 1.0, // always 1.0 — transmission handles transparency
    clearcoat: Math.max(0, Math.min(0.6, mat.clearcoat)),
    transmission: Math.max(0, Math.min(0.99, mat.transmission)),
    ior: Math.max(1.0, Math.min(2.45, mat.ior)),
    thickness: Math.max(0.1, Math.min(3.0, mat.thickness)),
    attenuationDistance: Math.max(0.5, mat.attenuationDistance),
    specularIntensity: Math.max(0.5, Math.min(2.0, mat.specularIntensity)),
    glowIntensity: Math.max(0.1, mat.glowIntensity),
  };
}

export const TIER_MATERIALS: Record<TierKey, GemMaterialConfig> = {
  // ── Seed: Frosted Quartz ──────────────────────────────────────────────
  // Simple, muted. Slightly hazy with gentle frosted look.
  // Highest roughness of any tier — the "starter" gem.
  seed: {
    color: '#E8E8E8',
    emissive: '#1a1a1a',
    emissiveIntensity: 0.1,
    metalness: 0.0,
    roughness: 0.12,
    clearcoat: 0.2,
    clearcoatRoughness: 0.06,
    opacity: 1.0,
    envMapIntensity: 1.5,
    transmission: 0.85,
    ior: 1.45,
    thickness: 0.5,
    attenuationColor: '#E8E8F0',
    attenuationDistance: 5.0,
    specularIntensity: 0.8,
    glowIntensity: 0.15,
    glowColor: '#FFFFFF',
  },

  // ── Form: Blue Topaz ──────────────────────────────────────────────────
  // Soft blue ice. Clearer than seed, visible color through body.
  form: {
    color: '#D0E8F8',
    emissive: '#0a1520',
    emissiveIntensity: 0.1,
    metalness: 0.0,
    roughness: 0.08,
    clearcoat: 0.25,
    clearcoatRoughness: 0.04,
    opacity: 1.0,
    envMapIntensity: 1.8,
    transmission: 0.88,
    ior: 1.52,
    thickness: 0.8,
    attenuationColor: '#98C8E8',
    attenuationDistance: 3.5,
    specularIntensity: 0.9,
    glowIntensity: 0.25,
    glowColor: '#A8D8EA',
  },

  // ── Aura: Amethyst ────────────────────────────────────────────────────
  // Rich purple. Medium-high clarity with saturated body color.
  aura: {
    color: '#D8B0F0',
    emissive: '#150820',
    emissiveIntensity: 0.1,
    metalness: 0.0,
    roughness: 0.06,
    clearcoat: 0.3,
    clearcoatRoughness: 0.03,
    opacity: 1.0,
    envMapIntensity: 2.0,
    transmission: 0.90,
    ior: 1.58,
    thickness: 1.0,
    attenuationColor: '#B080D0',
    attenuationDistance: 3.0,
    specularIntensity: 1.0,
    glowIntensity: 0.35,
    glowColor: '#B39DDB',
  },

  // ── Lumen: Citrine ────────────────────────────────────────────────────
  // Warm yellow-gold. Good clarity, moderate absorption.
  lumen: {
    color: '#F8E068',
    emissive: '#201500',
    emissiveIntensity: 0.1,
    metalness: 0.0,
    roughness: 0.05,
    clearcoat: 0.32,
    clearcoatRoughness: 0.025,
    opacity: 1.0,
    envMapIntensity: 2.2,
    transmission: 0.92,
    ior: 1.65,
    thickness: 1.2,
    attenuationColor: '#E0B030',
    attenuationDistance: 2.8,
    specularIntensity: 1.0,
    glowIntensity: 0.45,
    glowColor: '#FFD54F',
  },

  // ── Crest: Rhodolite Garnet ───────────────────────────────────────────
  // Vivid pink-magenta. Strong color saturation, higher IOR.
  crest: {
    color: '#F870D8',
    emissive: '#200818',
    emissiveIntensity: 0.1,
    metalness: 0.01,
    roughness: 0.04,
    clearcoat: 0.35,
    clearcoatRoughness: 0.02,
    opacity: 1.0,
    envMapIntensity: 2.5,
    transmission: 0.90,
    ior: 1.76,
    thickness: 1.2,
    attenuationColor: '#D040B0',
    attenuationDistance: 2.5,
    specularIntensity: 1.1,
    glowIntensity: 0.55,
    glowColor: '#E040FB',
  },

  // ── Verity: Paraíba Tourmaline ────────────────────────────────────────
  // Exceptional teal-cyan. Very high clarity, electric color.
  verity: {
    color: '#50E8F8',
    emissive: '#081820',
    emissiveIntensity: 0.1,
    metalness: 0.01,
    roughness: 0.035,
    clearcoat: 0.38,
    clearcoatRoughness: 0.02,
    opacity: 1.0,
    envMapIntensity: 2.8,
    transmission: 0.94,
    ior: 1.85,
    thickness: 1.2,
    attenuationColor: '#20B0D0',
    attenuationDistance: 3.0,
    specularIntensity: 1.2,
    glowIntensity: 0.65,
    glowColor: '#00E5FF',
  },

  // ── Prime: Imperial Zircon ────────────────────────────────────────────
  // Deep amber. High IOR creates strong internal reflections.
  // V9: Brightened from V8 — color lighter, longer attenuation distance.
  prime: {
    color: '#F8A040',
    emissive: '#201008',
    emissiveIntensity: 0.12,
    metalness: 0.02,
    roughness: 0.025,
    clearcoat: 0.4,
    clearcoatRoughness: 0.015,
    opacity: 1.0,
    envMapIntensity: 3.0,
    transmission: 0.92,
    ior: 2.0,
    thickness: 1.5,
    attenuationColor: '#E08020',
    attenuationDistance: 2.5,
    specularIntensity: 1.3,
    glowIntensity: 0.75,
    glowColor: '#FF6D00',
  },

  // ── Apex: Fancy Yellow Diamond ────────────────────────────────────────
  // Rich golden. Very high IOR, near-perfect clarity.
  // V9: CRITICAL FIX — was crushing to black. Now:
  //   - Color brightened (#FDE466 vs #F8D840) for more luminance
  //   - Attenuation color much lighter (#F0C840 vs #E0B020)
  //   - Attenuation distance 3.5 (was 2.0) — less absorption
  //   - envMapIntensity 3.5 (was 2.5) — more studio reflections
  //   - roughness 0.015 (was 0.02) — catches more specular highlights
  apex: {
    color: '#FDE466',
    emissive: '#201800',
    emissiveIntensity: 0.15,
    metalness: 0.02,
    roughness: 0.015,
    clearcoat: 0.42,
    clearcoatRoughness: 0.01,
    opacity: 1.0,
    envMapIntensity: 3.5,
    transmission: 0.95,
    ior: 2.2,
    thickness: 1.8,
    attenuationColor: '#F0C840',
    attenuationDistance: 3.5,
    specularIntensity: 1.4,
    glowIntensity: 0.85,
    glowColor: '#FFD700',
  },

  // ── One: D-Color Diamond ──────────────────────────────────────────────
  // The ultimate gem. Pure, colorless, maximum fire and brilliance.
  // IOR 2.42 = real diamond. Infinite attenuation = zero absorption.
  one: {
    color: '#FAFAFF',
    emissive: '#101015',
    emissiveIntensity: 0.12,
    metalness: 0.03,
    roughness: 0.01,
    clearcoat: 0.45,
    clearcoatRoughness: 0.008,
    opacity: 1.0,
    envMapIntensity: 4.0,
    transmission: 0.98,
    ior: 2.42,
    thickness: 2.0,
    attenuationColor: '#FFFFFF',
    attenuationDistance: 100, // effectively infinite — no absorption
    specularIntensity: 1.5,
    glowIntensity: 1.0,
    glowColor: '#FFFFFF',
  },
};

/** Pre-computed safe materials — avoids repeated clamping at render time */
export const SAFE_TIER_MATERIALS: Record<TierKey, GemMaterialConfig> = {} as any;
for (const key of TIER_ORDER) {
  (SAFE_TIER_MATERIALS as any)[key] = safeMaterial(TIER_MATERIALS[key]);
}
