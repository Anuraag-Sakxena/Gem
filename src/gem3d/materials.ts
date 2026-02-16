/**
 * Tier-based material presets for 3D gems V4.
 *
 * Tuned for expo-gl + Three.js WITH procedural PMREMGenerator envMap.
 * Key rules:
 *   - When transmission > 0, opacity MUST be 1.0 (transmission handles see-through)
 *   - Transmission capped at 0.8 for mobile WebGL stability
 *   - Metalness allowed up to 0.4 (envMap makes reflections work)
 *   - Low roughness for sharp, clean facet reflections
 *   - Clearcoat for surface shine on top of refraction
 *
 * Each tier progressively increases visual richness.
 */

import { TierKey } from '../engine/tierProfiles';

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
  /** MeshPhysicalMaterial transmission (0 = opaque, 1 = full glass) */
  transmission: number;
  /** Index of refraction (glass ~1.5, diamond ~2.4) */
  ior: number;
  /** Thickness for transmission calculations */
  thickness: number;
  /** Glow sphere intensity behind gem */
  glowIntensity: number;
  /** Glow color (usually matches primary) */
  glowColor: string;
}

/**
 * Ensures material values produce a visible, premium-looking gem.
 * Clamps to safe ranges so the gem NEVER renders invisible.
 *
 * CRITICAL: When transmission > 0, opacity MUST be 1.0.
 * Having both opacity<1 AND transmission>0 causes double-transparency
 * artifacts and WebGL render errors on mobile.
 */
export function safeMaterial(mat: GemMaterialConfig): GemMaterialConfig {
  const hasTransmission = mat.transmission > 0.1;

  return {
    ...mat,
    emissiveIntensity: Math.max(0.15, mat.emissiveIntensity),
    metalness: Math.max(0, Math.min(0.4, mat.metalness)),
    roughness: Math.max(0, Math.min(0.15, mat.roughness)),
    opacity: hasTransmission ? 1.0 : Math.max(0.9, mat.opacity),
    clearcoat: Math.max(0.6, mat.clearcoat),
    glowIntensity: Math.max(0.15, mat.glowIntensity),
    transmission: Math.max(0, Math.min(0.8, mat.transmission)),
    ior: Math.max(1.0, Math.min(2.33, mat.ior)),
    thickness: Math.max(0, Math.min(1.0, mat.thickness)),
  };
}

export const TIER_MATERIALS: Record<TierKey, GemMaterialConfig> = {
  seed: {
    color: '#E0E0E0',
    emissive: '#C8C8C8',
    emissiveIntensity: 0.35,
    metalness: 0.08,
    roughness: 0.08,
    clearcoat: 0.8,
    clearcoatRoughness: 0.04,
    opacity: 0.95,
    envMapIntensity: 1.2,
    transmission: 0.6,
    ior: 1.5,
    thickness: 0.6,
    glowIntensity: 0.3,
    glowColor: '#FFFFFF',
  },
  form: {
    color: '#90C8E8',
    emissive: '#80B8D8',
    emissiveIntensity: 0.42,
    metalness: 0.10,
    roughness: 0.06,
    clearcoat: 0.85,
    clearcoatRoughness: 0.035,
    opacity: 0.93,
    envMapIntensity: 1.4,
    transmission: 0.7,
    ior: 1.6,
    thickness: 0.7,
    glowIntensity: 0.4,
    glowColor: '#A8D8EA',
  },
  aura: {
    color: '#B080D8',
    emissive: '#A070C8',
    emissiveIntensity: 0.50,
    metalness: 0.12,
    roughness: 0.05,
    clearcoat: 0.88,
    clearcoatRoughness: 0.03,
    opacity: 0.90,
    envMapIntensity: 1.6,
    transmission: 0.75,
    ior: 1.7,
    thickness: 0.8,
    glowIntensity: 0.5,
    glowColor: '#B39DDB',
  },
  lumen: {
    color: '#F0D040',
    emissive: '#E8C030',
    emissiveIntensity: 0.56,
    metalness: 0.15,
    roughness: 0.04,
    clearcoat: 0.90,
    clearcoatRoughness: 0.025,
    opacity: 0.88,
    envMapIntensity: 1.8,
    transmission: 0.8,
    ior: 1.8,
    thickness: 0.8,
    glowIntensity: 0.6,
    glowColor: '#FFD54F',
  },
  crest: {
    color: '#E040F0',
    emissive: '#D030E0',
    emissiveIntensity: 0.63,
    metalness: 0.18,
    roughness: 0.035,
    clearcoat: 0.92,
    clearcoatRoughness: 0.02,
    opacity: 0.85,
    envMapIntensity: 2.0,
    transmission: 0.85,
    ior: 1.9,
    thickness: 0.9,
    glowIntensity: 0.7,
    glowColor: '#E040FB',
  },
  verity: {
    color: '#10D0F0',
    emissive: '#08C0E0',
    emissiveIntensity: 0.70,
    metalness: 0.22,
    roughness: 0.03,
    clearcoat: 0.94,
    clearcoatRoughness: 0.018,
    opacity: 0.83,
    envMapIntensity: 2.2,
    transmission: 0.88,
    ior: 2.0,
    thickness: 1.0,
    glowIntensity: 0.75,
    glowColor: '#00E5FF',
  },
  prime: {
    color: '#F07010',
    emissive: '#E06008',
    emissiveIntensity: 0.77,
    metalness: 0.25,
    roughness: 0.025,
    clearcoat: 0.96,
    clearcoatRoughness: 0.015,
    opacity: 0.80,
    envMapIntensity: 2.4,
    transmission: 0.9,
    ior: 2.1,
    thickness: 1.0,
    glowIntensity: 0.85,
    glowColor: '#FF6D00',
  },
  apex: {
    color: '#F0D020',
    emissive: '#E0C010',
    emissiveIntensity: 0.91,
    metalness: 0.30,
    roughness: 0.015,
    clearcoat: 1.0,
    clearcoatRoughness: 0.01,
    opacity: 0.78,
    envMapIntensity: 2.8,
    transmission: 0.92,
    ior: 2.2,
    thickness: 1.1,
    glowIntensity: 0.95,
    glowColor: '#FFD700',
  },
  one: {
    color: '#F8F4F0',
    emissive: '#FFFFFF',
    emissiveIntensity: 1.12,
    metalness: 0.35,
    roughness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    opacity: 0.75,
    envMapIntensity: 3.0,
    transmission: 0.95,
    ior: 2.4,
    thickness: 1.2,
    glowIntensity: 1.2,
    glowColor: '#FFFFFF',
  },
};
