/**
 * Per-shape presentation profiles — makes each shape visually distinct.
 *
 * Each shape gets its own camera padding, scale boost, Y offset,
 * and initial orientation so they fill the viewport differently
 * and show their best angle on first load.
 */

import { GemShapeKey } from './geometries';

export interface ShapeProfile {
  /** Camera padding multiplier (higher = more breathing room) */
  cameraPadding: number;
  /** Scale multiplier applied to geometry */
  baseScale: number;
  /** Y offset for camera target */
  yOffset: number;
  /** Initial orientation: [axisX, axisY, axisZ, angleRadians] */
  initialOrientation: [number, number, number, number];
}

const DEG = Math.PI / 180;

export const SHAPE_PROFILES: Record<GemShapeKey, ShapeProfile> = {
  // ── Round shapes — classic orientations ──
  brilliant: {
    cameraPadding: 1.45,
    baseScale: 1.0,
    yOffset: 0.12,
    initialOrientation: [1, 0, 0, 12 * DEG],
  },
  cushion: {
    cameraPadding: 1.48,
    baseScale: 1.0,
    yOffset: 0.12,
    initialOrientation: [1, 0.2, 0, 15 * DEG],
  },
  oval: {
    cameraPadding: 1.40,
    baseScale: 1.05,
    yOffset: 0.10,
    initialOrientation: [1, 0, 0.1, 10 * DEG],
  },

  // ── Angular shapes — show facets ──
  princess: {
    cameraPadding: 1.50,
    baseScale: 1.05,
    yOffset: 0.12,
    initialOrientation: [0.8, 0.3, 0, 18 * DEG],
  },
  emerald: {
    cameraPadding: 1.35,
    baseScale: 1.08,
    yOffset: 0.08,
    initialOrientation: [0.9, 0.2, 0, 14 * DEG],
  },
  hexagon: {
    cameraPadding: 1.42,
    baseScale: 1.02,
    yOffset: 0.10,
    initialOrientation: [0.7, 0.4, 0, 20 * DEG],
  },

  // ── Fancy shapes — dramatic angles ──
  pear: {
    cameraPadding: 1.38,
    baseScale: 1.04,
    yOffset: 0.05,
    initialOrientation: [0.9, 0.1, 0.2, 12 * DEG],
  },
  marquise: {
    cameraPadding: 1.32,
    baseScale: 1.06,
    yOffset: 0.06,
    initialOrientation: [0.85, 0.15, 0, 15 * DEG],
  },
  heart: {
    cameraPadding: 1.42,
    baseScale: 1.0,
    yOffset: 0.08,
    initialOrientation: [1, 0, 0, 8 * DEG],
  },
  trillion: {
    cameraPadding: 1.45,
    baseScale: 1.02,
    yOffset: 0.10,
    initialOrientation: [0.8, 0.3, 0, 22 * DEG],
  },
  kite: {
    cameraPadding: 1.40,
    baseScale: 1.03,
    yOffset: 0.06,
    initialOrientation: [0.9, 0.2, 0, 16 * DEG],
  },
  star: {
    cameraPadding: 1.38,
    baseScale: 1.08,
    yOffset: 0.10,
    initialOrientation: [0.6, 0.5, 0, 25 * DEG],
  },

  // ── Crystal shapes — tall, need more room ──
  prism: {
    cameraPadding: 1.55,
    baseScale: 0.95,
    yOffset: 0.0,
    initialOrientation: [0.7, 0.3, 0.2, 18 * DEG],
  },
  shard: {
    cameraPadding: 1.52,
    baseScale: 1.0,
    yOffset: 0.0,
    initialOrientation: [0.6, 0.4, 0.3, 22 * DEG],
  },
  cube: {
    cameraPadding: 1.48,
    baseScale: 1.05,
    yOffset: 0.08,
    initialOrientation: [0.65, 0.45, 0.2, 28 * DEG],
  },
};

export function getShapeProfile(shape: GemShapeKey): ShapeProfile {
  return SHAPE_PROFILES[shape];
}
