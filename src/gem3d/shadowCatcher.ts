/**
 * shadowCatcher.ts V4 — Contact shadow only.
 *
 * V3→V4: Removed createShadowGround and createFloorReflection.
 * These world-space planes resized inconsistently across devices
 * and gem shapes. Background is now handled by a screen-space quad
 * (backgroundQuad.ts). Only the contact shadow remains.
 *
 * The contact shadow is a small radial gradient blob positioned
 * directly under the gem. It gives the gem physical presence
 * without needing shadow maps or a ground plane.
 */

import * as THREE from 'three';

/** Contact shadow Y position (just below the gem) */
export const SHADOW_Y = -1.3;

/**
 * Create a soft radial-gradient contact shadow under the gem.
 *
 * Uses a procedural DataTexture (pure RGBA pixel data) instead of
 * CanvasTexture. This works on React Native where DOM canvas is unavailable.
 *
 * The shadow is slightly elliptical (wider than tall) via the geometry.
 */
export function createContactShadow(): THREE.Mesh {
  const texture = createRadialGradientTexture(64);

  const geo = new THREE.PlaneGeometry(2.2, 1.4);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  });

  const shadow = new THREE.Mesh(geo, mat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = SHADOW_Y;
  shadow.renderOrder = -1;

  return shadow;
}

// ─── Internal helpers ───────────────────────────────────────────────────────

/**
 * Create a radial gradient DataTexture for the contact shadow.
 * Pure RGBA pixel data — no DOM canvas required.
 *
 * Black center fading to transparent at the edges.
 */
function createRadialGradientTexture(size: number): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) / maxR; // 0..1
      // Smooth falloff: strong center, soft edge
      const alpha = Math.max(0, 1 - dist * dist) * 200; // 0..200
      const idx = (y * size + x) * 4;
      data[idx] = 0;     // R
      data[idx + 1] = 0; // G
      data[idx + 2] = 0; // B
      data[idx + 3] = Math.min(255, Math.round(alpha)); // A
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.needsUpdate = true;
  return texture;
}
