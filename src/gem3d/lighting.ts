/**
 * Lighting presets for gem scenes V7 — Premium Studio Rig.
 *
 * V6→V7: Boosted fill/ambient for dark-tier readability.
 *
 * Problem with V6: fill was 0.6, ambient was 0.15 with dark color.
 * Dark/warm tiers (Apex, Prime) crushed to near-black under ACES Filmic
 * because there wasn't enough fill light to reveal facets.
 *
 * V7 strategy — "Pinterest jeweler studio":
 *   - Ambient raised to 0.4 with warm-gray color → lifts shadow areas
 *   - Fill raised to 1.0 → properly opens shadow side of gem
 *   - Rim stays strong at 2.0 → premium edge separation
 *   - Second fill ("bounce") added from below → prevents dark underbelly
 *   - Exposure raised to 1.35 → more headroom for ACES to work with
 *   - Key kept at 3.0 (slightly up from 2.8) → stronger primary modeling
 *
 * No glow multipliers. No additive halos. Real lights, real shadows.
 */

export interface StudioLight {
  color: string;
  intensity: number;
  position: [number, number, number];
}

export interface ShadowConfig {
  mapSize: number;      // shadow map resolution (512 = mobile-safe)
  bias: number;         // depth bias (prevents shadow acne)
  normalBias: number;   // normal-based bias (prevents peter-panning)
  radius: number;       // PCFSoft blur radius (higher = softer)
  near: number;         // shadow camera near plane
  far: number;          // shadow camera far plane
  size: number;         // orthographic camera half-size
}

export interface StudioPreset {
  ambient: { color: string; intensity: number };
  key: StudioLight;
  fill: StudioLight;
  rim: StudioLight;
  kicker: StudioLight;
  bounce: StudioLight;  // V7: under-fill to prevent dark underbelly
  shadow: ShadowConfig;
  bgColor: string;
  exposure: number;     // tone mapping exposure
}

/**
 * Primary studio rig — dark stage, gem is the hero.
 *
 * ACES Filmic at 1.35 exposure with key=3.0 produces strong highlights
 * that roll off smoothly. The fill at 1.0 and bounce at 0.6 ensure
 * dark tiers (Apex, Prime) remain readable without washing out
 * light tiers (Seed, One).
 *
 * The 5-light + ambient setup mimics a real jeweler's photography box:
 *   Key = main modeling light (creates form, casts shadow)
 *   Fill = opposite side (opens shadows, adds cool contrast)
 *   Rim = behind (edge separation from background)
 *   Kicker = front-low (specular sparkle on crown facets)
 *   Bounce = below (prevents underbelly blackout)
 */
export const STUDIO_LIGHTS: StudioPreset = {
  ambient: { color: '#2A2530', intensity: 0.4 },  // warm-gray ambient lift
  key: {
    color: '#FFF2E6',   // warm white — jeweler's main light
    intensity: 3.0,
    position: [3, 5, 2.5],
  },
  fill: {
    color: '#D8E0F0',   // cool blue-white — contrast to warm key
    intensity: 1.0,
    position: [-2.5, 1.5, 3],
  },
  rim: {
    color: '#FFE0C0',   // warm — edge separation from dark background
    intensity: 2.0,
    position: [0, 3, -4],
  },
  kicker: {
    color: '#FFFFFF',   // pure white — front-low specular sparkle
    intensity: 1.0,
    position: [1.5, -0.3, 3],
  },
  bounce: {
    color: '#F0E8E0',   // warm neutral — under-fill
    intensity: 0.6,
    position: [0, -2, 1],
  },
  shadow: {
    mapSize: 512,       // mobile-safe resolution
    bias: -0.002,       // tuned for gem facets
    normalBias: 0.02,   // prevents thin-edge artifacts
    radius: 4,          // soft shadow blur
    near: 0.5,
    far: 20,
    size: 3,            // shadow camera frustum half-size
  },
  bgColor: '#0a0a0a',  // near-black studio void
  exposure: 1.35,       // enough headroom for ACES to lift dark tiers
};

/** Minimal lighting for small previews (cheaper, no shadows) */
export const PREVIEW_LIGHTS: StudioPreset = {
  ambient: { color: '#FFF8F0', intensity: 0.5 },
  key: {
    color: '#FFF0E0',
    intensity: 1.8,
    position: [2, 3, 2],
  },
  fill: {
    color: '#E0E8FF',
    intensity: 0.6,
    position: [-2, 1, 1],
  },
  rim: {
    color: '#FFF0D0',
    intensity: 0.8,
    position: [0, 2.5, -2.5],
  },
  kicker: {
    color: '#FFFFFF',
    intensity: 0.3,
    position: [0.5, -0.5, 2],
  },
  bounce: {
    color: '#F0E8E0',
    intensity: 0.3,
    position: [0, -1.5, 1],
  },
  shadow: {
    mapSize: 256,
    bias: -0.003,
    normalBias: 0.02,
    radius: 2,
    near: 0.5,
    far: 15,
    size: 2,
  },
  bgColor: '#0A0A08',
  exposure: 1.2,
};

// ── Backward-compatibility aliases ──

/** @deprecated Use STUDIO_LIGHTS instead */
export const NOIR_LIGHTS = STUDIO_LIGHTS;

/** @deprecated Use StudioPreset instead */
export type LightPreset = StudioPreset;
