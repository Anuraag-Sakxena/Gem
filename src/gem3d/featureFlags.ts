/**
 * Feature Flags — Centralized kill switches for premium enhancements.
 *
 * Every enhancement is gated behind a flag. If any flag causes issues,
 * set it to `false` to instantly revert to the previous behavior.
 * All flags default to `true` (enhancements ON).
 */

export const GEM_FLAGS = {
  /** FPS-adaptive pixel ratio scaling (1.0 → 1.5 on capable devices) */
  adaptivePixelRatio: true,

  /** Luminance-aware dithering (stronger in darks to prevent banding) */
  perceptualDither: true,

  /** Fill light boost for dark-colored gems (prevents collapse into dark bg) */
  darkGemFillBoost: true,

  /** Exposure reduction for bright gems in light mode (prevents washout) */
  lightGemExposureClamp: true,

  /** Knife-edge strip lights in env map for sharper facet edge highlights */
  edgeHighlights: true,

  /** Smooth camera position lerp on shape change (no snap) */
  smoothCameraLerp: true,

  /** Warmer background palette tones (dark: charcoal, light: warm pearl) */
  refinedPalette: true,

  /** Higher clearcoat on premium tiers for micro-specular facet definition */
  microContrast: true,

  /** Increased thickness + shorter attenuation for deeper color absorption */
  depthIllusion: true,

  /** Gaussian shadow falloff at 128px resolution */
  enhancedShadow: true,

  /** SSAA anti-aliasing (render at 1.25x, downsample — eliminates facet shimmer) */
  ssaaEnabled: true,

  /** Chromatic dispersion (rainbow fire through gem body — real diamond physics) */
  gemDispersion: true,
} as const;
