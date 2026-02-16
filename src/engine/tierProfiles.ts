/**
 * Tier Visual Profiles — defines every visual parameter per tier.
 * The Gem Engine reads from this to render the gem.
 */

export type TierKey =
  | 'seed'
  | 'form'
  | 'aura'
  | 'lumen'
  | 'crest'
  | 'verity'
  | 'prime'
  | 'apex'
  | 'one';

export interface TierProfile {
  key: TierKey;
  name: string;
  price: string;
  supply: string;
  supplyCount: number | null; // null = unlimited
  // Visual
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  glowIntensity: number; // 0–1
  glowRadius: number;
  particleCount: number;
  particleDrift: number; // speed multiplier
  refractionStrength: number; // 0–1
  cutComplexity: number; // 1–5, how many facets
  auraRings: number; // 0–3
  crownBeams: number; // 0 = none
  shimmerSpeed: number; // animation cycle speed
  uniqueAnimation: string | null; // special named animation for One tier
  description: string;
}

export const TIER_PROFILES: Record<TierKey, TierProfile> = {
  seed: {
    key: 'seed',
    name: 'Seed',
    price: 'Free',
    supply: 'Unlimited',
    supplyCount: null,
    primaryColor: '#C4C4C4',
    secondaryColor: '#E0E0E0',
    glowColor: '#FFFFFF',
    glowIntensity: 0.15,
    glowRadius: 20,
    particleCount: 0,
    particleDrift: 0,
    refractionStrength: 0.1,
    cutComplexity: 1,
    auraRings: 0,
    crownBeams: 0,
    shimmerSpeed: 0.5,
    uniqueAnimation: null,
    description: 'A subtle crystal. The beginning.',
  },
  form: {
    key: 'form',
    name: 'Form',
    price: '$99',
    supply: 'Unlimited',
    supplyCount: null,
    primaryColor: '#A8D8EA',
    secondaryColor: '#C9E8F4',
    glowColor: '#A8D8EA',
    glowIntensity: 0.25,
    glowRadius: 30,
    particleCount: 3,
    particleDrift: 0.3,
    refractionStrength: 0.2,
    cutComplexity: 2,
    auraRings: 0,
    crownBeams: 0,
    shimmerSpeed: 0.6,
    uniqueAnimation: null,
    description: 'Slightly richer reflections with a soft aura.',
  },
  aura: {
    key: 'aura',
    name: 'Aura',
    price: '$199',
    supply: 'Unlimited',
    supplyCount: null,
    primaryColor: '#B39DDB',
    secondaryColor: '#D1C4E9',
    glowColor: '#B39DDB',
    glowIntensity: 0.35,
    glowRadius: 40,
    particleCount: 6,
    particleDrift: 0.4,
    refractionStrength: 0.3,
    cutComplexity: 2,
    auraRings: 1,
    crownBeams: 0,
    shimmerSpeed: 0.7,
    uniqueAnimation: null,
    description: 'More depth with a glowing halo ring.',
  },
  lumen: {
    key: 'lumen',
    name: 'Lumen',
    price: '$299',
    supply: 'Unlimited',
    supplyCount: null,
    primaryColor: '#FFD54F',
    secondaryColor: '#FFE082',
    glowColor: '#FFD54F',
    glowIntensity: 0.45,
    glowRadius: 50,
    particleCount: 10,
    particleDrift: 0.5,
    refractionStrength: 0.4,
    cutComplexity: 3,
    auraRings: 1,
    crownBeams: 0,
    shimmerSpeed: 0.8,
    uniqueAnimation: null,
    description: 'Strong illumination with particle dust.',
  },
  crest: {
    key: 'crest',
    name: 'Crest',
    price: '$999',
    supply: '100 worldwide',
    supplyCount: 100,
    primaryColor: '#E040FB',
    secondaryColor: '#F48FB1',
    glowColor: '#E040FB',
    glowIntensity: 0.55,
    glowRadius: 60,
    particleCount: 15,
    particleDrift: 0.6,
    refractionStrength: 0.55,
    cutComplexity: 3,
    auraRings: 2,
    crownBeams: 0,
    shimmerSpeed: 0.9,
    uniqueAnimation: null,
    description: 'Premium cut lines with deeper glow.',
  },
  verity: {
    key: 'verity',
    name: 'Verity',
    price: '$2,000',
    supply: '50 worldwide',
    supplyCount: 50,
    primaryColor: '#00E5FF',
    secondaryColor: '#80DEEA',
    glowColor: '#00E5FF',
    glowIntensity: 0.65,
    glowRadius: 70,
    particleCount: 20,
    particleDrift: 0.7,
    refractionStrength: 0.65,
    cutComplexity: 4,
    auraRings: 2,
    crownBeams: 0,
    shimmerSpeed: 1.0,
    uniqueAnimation: null,
    description: 'Rare shimmer with animated internal refraction.',
  },
  prime: {
    key: 'prime',
    name: 'Prime',
    price: '$5,000',
    supply: '25 worldwide',
    supplyCount: 25,
    primaryColor: '#FF6D00',
    secondaryColor: '#FFB74D',
    glowColor: '#FF6D00',
    glowIntensity: 0.75,
    glowRadius: 80,
    particleCount: 25,
    particleDrift: 0.8,
    refractionStrength: 0.75,
    cutComplexity: 4,
    auraRings: 3,
    crownBeams: 0,
    shimmerSpeed: 1.1,
    uniqueAnimation: null,
    description: 'Intense but tasteful aura with micro-particles.',
  },
  apex: {
    key: 'apex',
    name: 'Apex',
    price: '$10,000',
    supply: '10 worldwide',
    supplyCount: 10,
    primaryColor: '#FFD700',
    secondaryColor: '#FFF8E1',
    glowColor: '#FFD700',
    glowIntensity: 0.85,
    glowRadius: 100,
    particleCount: 30,
    particleDrift: 0.9,
    refractionStrength: 0.85,
    cutComplexity: 5,
    auraRings: 3,
    crownBeams: 6,
    shimmerSpeed: 1.2,
    uniqueAnimation: null,
    description: 'Dramatic crown-like light beams.',
  },
  one: {
    key: 'one',
    name: 'One',
    price: '$50,000',
    supply: '1 worldwide',
    supplyCount: 1,
    primaryColor: '#FFFFFF',
    secondaryColor: '#F5F5F5',
    glowColor: '#FFFFFF',
    glowIntensity: 1.0,
    glowRadius: 120,
    particleCount: 40,
    particleDrift: 1.0,
    refractionStrength: 1.0,
    cutComplexity: 5,
    auraRings: 3,
    crownBeams: 8,
    shimmerSpeed: 1.5,
    uniqueAnimation: 'prismatic_pulse',
    description: 'The singular gem. Unique signature animation.',
  },
};

export const TIER_ORDER: TierKey[] = [
  'seed', 'form', 'aura', 'lumen', 'crest',
  'verity', 'prime', 'apex', 'one',
];

export const getTierIndex = (key: TierKey): number => TIER_ORDER.indexOf(key);
