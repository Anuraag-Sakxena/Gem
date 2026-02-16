/**
 * Motion System — single source of truth for all animation parameters.
 * Premium feel: springs for physical movement, cubics for fades/opacity.
 */

import { Easing } from 'react-native-reanimated';

// ── Durations ──────────────────────────────────────────────────

export const duration = {
  instant: 100,
  fast: 150,
  normal: 250,
  moderate: 400,
  slow: 600,
  dramatic: 1000,
  cinematic: 1500,
} as const;

// ── Easings (cubic-bezier equivalents for premium feel) ────────

export const easing = {
  /** Standard ease — smooth deceleration */
  standard: Easing.bezier(0.25, 0.1, 0.25, 1.0),
  /** Emphasized — starts fast, ends very slow (Apple-like) */
  emphasized: Easing.bezier(0.2, 0.0, 0.0, 1.0),
  /** Decelerate — strong slow-down at end */
  decelerate: Easing.bezier(0.0, 0.0, 0.2, 1.0),
  /** Accelerate — slow start, fast end */
  accelerate: Easing.bezier(0.4, 0.0, 1.0, 1.0),
  /** Gentle sine — organic breathing feel */
  gentle: Easing.inOut(Easing.sin),
  /** Linear */
  linear: Easing.linear,
} as const;

// ── Spring Configs ─────────────────────────────────────────────

export const spring = {
  /** Default premium spring — balanced and elegant */
  premium: {
    damping: 18,
    mass: 1,
    stiffness: 120,
    overshootClamping: false,
  },
  /** Quick + crisp — buttons, small elements */
  snappy: {
    damping: 22,
    mass: 0.7,
    stiffness: 250,
  },
  /** Slow + gentle — large element float, gem idle */
  gentle: {
    damping: 14,
    mass: 1.4,
    stiffness: 50,
  },
  /** Light bounce — playful micro-interactions */
  bouncy: {
    damping: 10,
    mass: 0.8,
    stiffness: 180,
  },
  /** Heavy + decisive — modal sheets, overlays */
  heavy: {
    damping: 24,
    mass: 1.2,
    stiffness: 160,
  },
} as const;

// ── Timing Configs ─────────────────────────────────────────────

export const timing = {
  /** Fade in/out — 250ms standard ease */
  fade: {
    duration: duration.normal,
    easing: easing.standard,
  },
  /** Slow fade — 600ms emphasized */
  slowFade: {
    duration: duration.slow,
    easing: easing.emphasized,
  },
  /** Quick interaction — 150ms */
  quick: {
    duration: duration.fast,
    easing: easing.standard,
  },
  /** Cinematic — 1.5s emphasized deceleration */
  cinematic: {
    duration: duration.cinematic,
    easing: easing.emphasized,
  },
  /** Dramatic — 1s decelerate for reveals */
  dramatic: {
    duration: duration.dramatic,
    easing: easing.decelerate,
  },
} as const;

// ── Stagger ────────────────────────────────────────────────────

export const stagger = {
  /** Fast stagger for list items */
  fast: 50,
  /** Normal stagger */
  normal: 80,
  /** Slow stagger for dramatic reveals */
  slow: 120,
} as const;
