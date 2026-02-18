/**
 * backgroundQuad.ts V2 — Screen-space background with Light/Dark modes.
 *
 * Renders a full-screen quad behind the gem using a clip-space
 * PlaneGeometry + ShaderMaterial. Completely independent of camera/scene
 * scale — works perfectly across every device size, aspect ratio, and shape.
 *
 * V1→V2: Added light/dark background modes with auto-contrast.
 *
 * Features:
 *   - Vertical gradient (top → bottom) with radial vignette
 *   - Film grain dither to prevent banding on dark gradients
 *   - Light mode: soft pearl / warm ivory / champagne studio sweep
 *   - Dark mode: deep charcoal / cinematic dark studio
 *   - Auto-contrast: background adjusts based on tier color luminance
 *     so the gem is ALWAYS completely visible, never washed out
 *   - Smooth lerping: colors transition per-frame via lerpColors()
 *     for premium "re-lit studio" feel on mode switch
 *
 * The quad is rendered at renderOrder -10 with depthTest/depthWrite
 * disabled — it's always behind everything.
 */

import * as THREE from 'three';
import { TIER_MATERIALS } from './materials';
import { TierKey } from '../engine/tierProfiles';
import type { BackgroundMode } from '../store/useGemStore';

// ─── Auto-contrast Logic ─────────────────────────────────────────────────────

/**
 * Compute perceived luminance from a hex color string.
 * Uses the standard sRGB luminance formula.
 */
function perceivedLuminance(hex: string): number {
  const c = new THREE.Color(hex);
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

/**
 * Compute background gradient colors that auto-contrast with the gem.
 *
 * The background is ALWAYS the "opposite" of the gem: if the gem is dark,
 * the background is slightly lighter/warmer to ensure visibility. If the
 * gem is bright, the background goes slightly deeper to avoid washout.
 *
 * Light mode:
 *   - Pearl / warm ivory / champagne studio sweep.
 *   - NOT pure white — always warm, soft, premium.
 *   - Bright gems → slightly darker champagne bg to avoid washout.
 *   - Dark gems → lighter pearl bg to ensure contrast.
 *
 * Dark mode:
 *   - Deep charcoal / cinematic dark with warm undertones.
 *   - NOT harsh black — always has subtle warmth and depth.
 *   - Bright gems → deeper cooler charcoal for contrast.
 *   - Dark gems → slightly warmer/lifted for visibility.
 *
 * Returns [topColor, bottomColor, vignetteStrength].
 */
export function computeBackgroundColors(
  tierKey: TierKey,
  mode: BackgroundMode,
): [THREE.Color, THREE.Color, number] {
  const mat = TIER_MATERIALS[tierKey];
  const L = perceivedLuminance(mat.color);
  const blend = Math.min(1, Math.max(0, L));

  if (mode === 'light') {
    // Light mode: pearl studio sweep
    // Bright gem (high L) → slightly darker/cooler champagne bg
    // Dark gem (low L) → lighter warm pearl bg
    const pearlTop = new THREE.Color('#F0ECE6');    // warm pearl
    const pearlBot = new THREE.Color('#E5DFD7');    // deeper pearl
    const champTop = new THREE.Color('#DDD5CB');    // champagne (for bright gems)
    const champBot = new THREE.Color('#D0C8BC');    // deeper champagne

    const top = pearlTop.clone().lerp(champTop, blend);
    const bot = pearlBot.clone().lerp(champBot, blend);
    return [top, bot, 0.18];
  }

  // Dark mode: cinematic charcoal
  // Bright gem (high L) → deeper cool charcoal
  // Dark gem (low L) → warmer lifted charcoal
  const warmTop = new THREE.Color('#14110F');   // warm lifted (dark gems)
  const warmBot = new THREE.Color('#0C0A09');
  const coolTop = new THREE.Color('#0A0A0C');   // deep cool (bright gems)
  const coolBot = new THREE.Color('#050506');

  const top = warmTop.clone().lerp(coolTop, blend);
  const bot = warmBot.clone().lerp(coolBot, blend);
  return [top, bot, 0.45];
}

// ─── Shader ──────────────────────────────────────────────────────────────────

const bgVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.9999, 1.0);
  }
`;

const bgFragmentShader = /* glsl */ `
  uniform vec3 uTopColor;
  uniform vec3 uBottomColor;
  uniform float uVignetteStrength;
  varying vec2 vUv;

  // Simple hash-based noise (no texture needed)
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    // Vertical gradient
    vec3 color = mix(uBottomColor, uTopColor, vUv.y);

    // Radial vignette (darker corners, subtly brighter center)
    vec2 center = vUv - 0.5;
    float dist = length(center) * 1.414; // normalize so corners = 1.0
    float vignette = 1.0 - dist * dist * uVignetteStrength;
    color *= vignette;

    // Subtle film grain / dither to prevent banding on dark gradients
    float noise = (hash(gl_FragCoord.xy) - 0.5) * 0.012;
    color += noise;

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ─── Factory ─────────────────────────────────────────────────────────────────

export interface BackgroundQuad {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  /**
   * Set target colors for smooth transition. Call lerpColors() each
   * frame in the animation loop to animate toward these targets.
   */
  setTargetColors: (tierKey: TierKey, mode: BackgroundMode) => void;
  /**
   * Lerp current uniform colors toward target colors at given speed.
   * Returns true if still lerping (colors haven't converged).
   * Call this every frame in the animation loop.
   */
  lerpColors: (speed: number) => boolean;
  dispose: () => void;
}

/**
 * Create a full-screen background quad with smooth lerping support.
 *
 * Add the returned mesh to the scene. It renders behind everything
 * regardless of camera position.
 */
export function createBackgroundQuad(
  initialTier: TierKey,
  initialMode: BackgroundMode = 'dark',
): BackgroundQuad {
  const [topColor, bottomColor, vignette] = computeBackgroundColors(initialTier, initialMode);

  const material = new THREE.ShaderMaterial({
    vertexShader: bgVertexShader,
    fragmentShader: bgFragmentShader,
    uniforms: {
      uTopColor: { value: topColor.clone() },
      uBottomColor: { value: bottomColor.clone() },
      uVignetteStrength: { value: vignette },
    },
    depthTest: false,
    depthWrite: false,
    side: THREE.FrontSide,
  });

  // Clip-space quad: position.xy spans [-1,1] which fills the entire screen
  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false; // always render
  mesh.renderOrder = -10; // behind everything

  // Lerp targets (separate from uniforms so we can animate toward them)
  const targetTop = topColor.clone();
  const targetBot = bottomColor.clone();
  let targetVignette = vignette;

  const setTargetColors = (tierKey: TierKey, mode: BackgroundMode) => {
    const [newTop, newBot, newVig] = computeBackgroundColors(tierKey, mode);
    targetTop.copy(newTop);
    targetBot.copy(newBot);
    targetVignette = newVig;
  };

  const lerpColors = (speed: number): boolean => {
    const uTop = material.uniforms.uTopColor.value as THREE.Color;
    const uBot = material.uniforms.uBottomColor.value as THREE.Color;

    uTop.lerp(targetTop, speed);
    uBot.lerp(targetBot, speed);
    material.uniforms.uVignetteStrength.value +=
      (targetVignette - material.uniforms.uVignetteStrength.value) * speed;

    // Check convergence (manual squared color distance)
    const dr1 = uTop.r - targetTop.r, dg1 = uTop.g - targetTop.g, db1 = uTop.b - targetTop.b;
    const dr2 = uBot.r - targetBot.r, dg2 = uBot.g - targetBot.g, db2 = uBot.b - targetBot.b;
    const dist = dr1*dr1 + dg1*dg1 + db1*db1 + dr2*dr2 + dg2*dg2 + db2*db2;
    return dist > 0.000001;
  };

  const dispose = () => {
    geometry.dispose();
    material.dispose();
  };

  return { mesh, material, setTargetColors, lerpColors, dispose };
}
